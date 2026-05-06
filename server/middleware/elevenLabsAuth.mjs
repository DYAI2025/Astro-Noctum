import { timingSafeEqual } from 'crypto';
import { errorCodes } from '../errors/apiErrors.mjs';

/**
 * Bearer-secret auth for ElevenLabs voice-agent tool endpoints.
 *
 * ElevenLabs custom tools cannot present a Supabase JWT — they call the
 * server with a long-lived shared secret in the Authorization header.
 * This middleware:
 *
 * 1. Returns 503 AI_CONFIG_MISSING if `ELEVENLABS_TOOL_SECRET` is
 *    unset/empty so misconfigured deploys fail closed instead of
 *    silently accepting any token.
 * 2. Compares the presented token against the secret with
 *    `crypto.timingSafeEqual`, which short-circuits on length but
 *    runs in constant time across the byte compare. Prevents the
 *    classic byte-by-byte timing oracle.
 * 3. Responds with the structured envelope (see
 *    `server/errors/apiErrors.mjs`) on every failure path, so
 *    clients have one shape to parse across all server errors.
 *
 * Replaces the inline `token !== ELEVENLABS_TOOL_SECRET` check used
 * by /api/profile/:userId, /api/agent/conversation, /api/agent/daily,
 * /api/agent/match, etc. (Wiring those routes is a follow-up — this
 * task ships only the middleware + tests.)
 */
function sendError(req, res, code) {
  const def = errorCodes[code];
  res.status(def.status).json({
    error: {
      code,
      message: def.message,
      request_id: req.requestId ?? null,
      recoverable: def.recoverable,
      retry_after: null,
    },
  });
}

function safeCompare(presented, expected) {
  const a = Buffer.from(presented, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) {
    // Still run timingSafeEqual on equal-length buffers to keep the
    // mismatched-length path roughly indistinguishable from the
    // matched-length-mismatched-bytes path on a packet capture.
    timingSafeEqual(a, a);
    return false;
  }
  return timingSafeEqual(a, b);
}

export function elevenLabsAuth(req, res, next) {
  const secret = process.env.ELEVENLABS_TOOL_SECRET;
  if (!secret) {
    return sendError(req, res, 'AI_CONFIG_MISSING');
  }

  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return sendError(req, res, 'AUTH_REQUIRED');
  }

  const token = header.slice(7);
  if (!safeCompare(token, secret)) {
    return sendError(req, res, 'AUTH_INVALID');
  }

  next();
}

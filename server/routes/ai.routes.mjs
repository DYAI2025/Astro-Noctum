import { Router } from 'express';
import { requireUserAuth } from '../middleware/auth.mjs';
import { aiIpRateLimit, aiUserRateLimit } from '../middleware/rateLimit.mjs';
import { validateBody } from '../middleware/validate.mjs';
import { InterpretSchema, AnalyzeConversationSchema } from '../schemas/ai.schemas.mjs';

export const aiRouter = Router();

/**
 * Payload-size guard: post-parse check on req.body.
 *
 * The global express.json() middleware in server.mjs has no size limit. We
 * cannot apply a per-route express.json({ limit }) after the global parser —
 * once parsed, downstream parsers no-op. This guard reads the parsed body's
 * serialized size and rejects with PAYLOAD_TOO_LARGE before the request
 * reaches the AI provider.
 */
function payloadSizeGuard(maxBytes) {
  return (req, res, next) => {
    const size = Buffer.byteLength(JSON.stringify(req.body ?? {}), 'utf8');
    if (size > maxBytes) {
      return res.status(413).json({
        error: {
          code: 'PAYLOAD_TOO_LARGE',
          message: `Request payload too large (max ${maxBytes} bytes).`,
          request_id: req.requestId ?? null,
          recoverable: true,
          retry_after: null,
        },
      });
    }
    next();
  };
}

const interpretMaxBytes = parseInt(process.env.AI_PAYLOAD_LIMIT_BYTES ?? '51200', 10); // 50kb
const conversationMaxBytes = parseInt(process.env.AI_CONVERSATION_PAYLOAD_LIMIT_BYTES ?? '25600', 10); // 25kb

// /api/interpret — auth + payload guard + rate limit + validation, then fall through
// to the existing handler in server.mjs via next('route').
aiRouter.post(
  '/interpret',
  requireUserAuth,
  payloadSizeGuard(interpretMaxBytes),
  aiIpRateLimit(),
  aiUserRateLimit('free'),
  validateBody(InterpretSchema),
  (_req, _res, next) => next('route'),
);

// /api/analyze/conversation — same chain, smaller payload limit.
aiRouter.post(
  '/analyze/conversation',
  requireUserAuth,
  payloadSizeGuard(conversationMaxBytes),
  aiIpRateLimit(),
  aiUserRateLimit('free'),
  validateBody(AnalyzeConversationSchema),
  (_req, _res, next) => next('route'),
);

import { errorCodes } from '../errors/apiErrors.mjs';

/**
 * Per-request ownership guard for resources keyed by `:userId` (or any other
 * URL param). Compares `req.userId` (set by `requireUserAuth`) against the
 * named param. Mismatch → 403 FORBIDDEN with the structured envelope.
 * Missing auth → 401 AUTH_REQUIRED (defensive — the route should already
 * have `requireUserAuth` in front of this).
 *
 * Used to prevent User A from reading User B's per-user state
 * (transit-state, agent conversations, profile, etc.) by manipulating
 * the URL.
 */
export function requireOwnership(paramName = 'userId') {
  return (req, res, next) => {
    const authedUserId = String(req.userId ?? '').trim();
    if (!authedUserId) {
      const def = errorCodes.AUTH_REQUIRED;
      return res.status(def.status).json({
        error: {
          code: 'AUTH_REQUIRED',
          message: def.message,
          request_id: req.requestId ?? null,
          recoverable: def.recoverable,
          retry_after: null,
        },
      });
    }
    const paramUserId = String(req.params?.[paramName] ?? '').trim();
    if (paramUserId !== authedUserId) {
      const def = errorCodes.FORBIDDEN;
      return res.status(def.status).json({
        error: {
          code: 'FORBIDDEN',
          message: def.message,
          request_id: req.requestId ?? null,
          recoverable: def.recoverable,
          retry_after: null,
        },
      });
    }
    next();
  };
}

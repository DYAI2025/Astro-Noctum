import { createClient } from '@supabase/supabase-js';
import { errorCodes } from '../errors/apiErrors.mjs';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (process.env.NODE_ENV === 'production' && (!SUPABASE_URL || !SUPABASE_KEY)) {
  // Fail loudly in prod — silent fallback masks deployment misconfiguration.
  // In dev/test, missing env vars are tolerated so the harness can run with mocks.
  console.error('[server/auth] FATAL: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in production. Auth will reject every request.');
}

const supabaseAdmin = createClient(
  SUPABASE_URL || 'http://localhost',
  SUPABASE_KEY || 'placeholder',
);

function sendAuthError(req, res, code) {
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

export async function requireUserAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return sendAuthError(req, res, 'AUTH_REQUIRED');
  }
  const token = header.slice(7);
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return sendAuthError(req, res, 'AUTH_INVALID');
    }
    req.userId = user.id;
    next();
  } catch {
    sendAuthError(req, res, 'AUTH_INVALID');
  }
}

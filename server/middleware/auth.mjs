import { createClient } from '@supabase/supabase-js';
import { ApiError } from '../errors/apiErrors.mjs';

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'http://localhost',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder',
);

export async function requireUserAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(ApiError.fromCode('AUTH_REQUIRED'));
  }
  const token = header.slice(7);
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return next(ApiError.fromCode('AUTH_INVALID'));
    }
    req.userId = user.id;
    next();
  } catch {
    next(ApiError.fromCode('AUTH_INVALID'));
  }
}

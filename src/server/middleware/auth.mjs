import { supabaseServer } from "../config.mjs";

/**
 * Middleware: Requires a valid Supabase JWT in the Authorization header.
 * Attaches user.id to req.userId on success.
 */
export async function requireUserAuth(req, res, next) {
  if (!supabaseServer) {
    return res.status(503).json({ error: "Auth service not configured" });
  }
  
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  
  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  try {
    const { data: { user }, error } = await supabaseServer.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }
    
    req.userId = user.id;
    next();
  } catch (err) {
    console.error("[auth] error verifying token:", err.message);
    return res.status(503).json({ error: "Auth service temporarily unavailable" });
  }
}

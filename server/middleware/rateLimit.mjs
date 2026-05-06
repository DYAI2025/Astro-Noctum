import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

function rateLimitHandler(req, res) {
  const resetTime = req.rateLimit?.resetTime;
  const retryAfter = resetTime
    ? Math.ceil((resetTime - Date.now()) / 1000)
    : 60;
  res.status(429).json({
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests.',
      request_id: req.requestId ?? null,
      recoverable: true,
      retry_after: retryAfter,
    },
  });
}

export function aiIpRateLimit() {
  return rateLimit({
    windowMs: parseInt(process.env.AI_WINDOW_MS ?? '600000', 10),
    max: parseInt(process.env.AI_IP_LIMIT ?? '30', 10),
    // ipKeyGenerator handles IPv6 prefix-bucketing — required by v7+ when a
    // custom keyGenerator reads req.ip directly. Without it, IPv6 clients
    // could bypass per-IP limits.
    keyGenerator: req => ipKeyGenerator(req.ip ?? 'unknown'),
    handler: rateLimitHandler,
    standardHeaders: true,
    legacyHeaders: false,
  });
}

export function aiUserRateLimit(tier = 'free') {
  const max = tier === 'premium'
    ? parseInt(process.env.AI_PREMIUM_USER_LIMIT ?? '60', 10)
    : parseInt(process.env.AI_FREE_USER_LIMIT ?? '10', 10);
  return rateLimit({
    windowMs: parseInt(process.env.AI_WINDOW_MS ?? '600000', 10),
    max,
    keyGenerator: req =>
      req.userId ? `user:${req.userId}` : ipKeyGenerator(req.ip ?? 'unknown'),
    handler: rateLimitHandler,
    standardHeaders: true,
    legacyHeaders: false,
  });
}

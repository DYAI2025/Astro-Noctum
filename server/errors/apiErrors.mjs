export const errorCodes = {
  AUTH_REQUIRED:            { status: 401, recoverable: false, message: 'Authentication required.' },
  AUTH_INVALID:             { status: 401, recoverable: false, message: 'Invalid authentication token.' },
  FORBIDDEN:                { status: 403, recoverable: false, message: 'Access forbidden.' },
  VALIDATION_FAILED:        { status: 422, recoverable: true,  message: 'Request validation failed.' },
  PAYLOAD_TOO_LARGE:        { status: 413, recoverable: true,  message: 'Request payload too large.' },
  RATE_LIMITED:             { status: 429, recoverable: true,  message: 'Too many requests.' },
  AI_QUOTA_EXCEEDED:        { status: 429, recoverable: true,  message: 'AI quota exceeded.' },
  AI_TIMEOUT:               { status: 504, recoverable: true,  message: 'AI provider timed out.' },
  AI_PROVIDER_UNAVAILABLE:  { status: 502, recoverable: true,  message: 'AI provider unavailable.' },
  AI_PROVIDER_RATE_LIMITED: { status: 502, recoverable: true,  message: 'AI provider rate limited.' },
  AI_OUTPUT_INVALID:        { status: 502, recoverable: true,  message: 'AI response could not be validated.' },
  AI_CONFIG_MISSING:        { status: 503, recoverable: false, message: 'AI configuration missing.' },
  INTERNAL_ERROR:           { status: 500, recoverable: false, message: 'Internal server error.' },
};

export class ApiError extends Error {
  constructor(code, status, message, recoverable, details = null, retryAfter = null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.recoverable = recoverable;
    this.details = details;
    this.retryAfter = retryAfter;
  }

  static fromCode(code, details = null) {
    const def = errorCodes[code];
    if (!def) throw new Error(`Unknown error code: ${code}`);
    return new ApiError(code, def.status, def.message, def.recoverable, details);
  }
}

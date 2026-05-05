// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { ApiError, errorCodes } from '../errors/apiErrors.mjs';

describe('ApiError', () => {
  it('sets code, status, message, recoverable', () => {
    const err = new ApiError('AUTH_REQUIRED', 401, 'Auth required', false);
    expect(err.code).toBe('AUTH_REQUIRED');
    expect(err.status).toBe(401);
    expect(err.message).toBe('Auth required');
    expect(err.recoverable).toBe(false);
    expect(err instanceof Error).toBe(true);
  });

  it('all required error codes are defined', () => {
    const required = [
      'AUTH_REQUIRED', 'AUTH_INVALID', 'FORBIDDEN', 'VALIDATION_FAILED',
      'PAYLOAD_TOO_LARGE', 'RATE_LIMITED', 'AI_QUOTA_EXCEEDED', 'AI_TIMEOUT',
      'AI_PROVIDER_UNAVAILABLE', 'AI_PROVIDER_RATE_LIMITED', 'AI_OUTPUT_INVALID',
      'AI_CONFIG_MISSING', 'INTERNAL_ERROR',
    ];
    required.forEach(code => expect(errorCodes[code]).toBeDefined());
  });

  it('fromCode creates correct status', () => {
    const err = ApiError.fromCode('RATE_LIMITED');
    expect(err.status).toBe(429);
    expect(err.recoverable).toBe(true);
  });

  it('fromCode throws for unknown code', () => {
    expect(() => ApiError.fromCode('NONEXISTENT')).toThrow('Unknown error code');
  });

  it('supports optional details and retryAfter', () => {
    const err = new ApiError('RATE_LIMITED', 429, 'Too many', true, [{ path: 'x', message: 'bad' }], 30);
    expect(err.details).toEqual([{ path: 'x', message: 'bad' }]);
    expect(err.retryAfter).toBe(30);
  });
});

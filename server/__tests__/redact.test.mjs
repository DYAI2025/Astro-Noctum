// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { redactLog, hashId } from '../utils/redact.mjs';

describe('redactLog', () => {
  it('REDACT-001: redacts Authorization header (case-insensitive key)', () => {
    const input = { headers: { authorization: 'Bearer sk-abc-123' } };
    const out = redactLog(input);
    expect(out.headers.authorization).toBe('[REDACTED]');
  });

  it('REDACT-002: redacts Authorization with capitalized key', () => {
    const out = redactLog({ Authorization: 'Bearer abc' });
    expect(out.Authorization).toBe('[REDACTED]');
  });

  it('REDACT-003: redacts known secret env var names', () => {
    const out = redactLog({
      GEMINI_API_KEY: 'AIza-secret',
      OPENROUTER_API_KEY: 'sk-or-v1-...',
      SUPABASE_SERVICE_ROLE_KEY: 'eyJ.fake.jwt',
      STRIPE_SECRET_KEY: 'sk_live_xyz',
      STRIPE_WEBHOOK_SECRET: 'whsec_xyz',
      ELEVENLABS_TOOL_SECRET: 'tool-secret-xyz',
      userId: 'user-abc',
    });
    expect(out.GEMINI_API_KEY).toBe('[REDACTED]');
    expect(out.OPENROUTER_API_KEY).toBe('[REDACTED]');
    expect(out.SUPABASE_SERVICE_ROLE_KEY).toBe('[REDACTED]');
    expect(out.STRIPE_SECRET_KEY).toBe('[REDACTED]');
    expect(out.STRIPE_WEBHOOK_SECRET).toBe('[REDACTED]');
    expect(out.ELEVENLABS_TOOL_SECRET).toBe('[REDACTED]');
    expect(out.userId).toBe('user-abc'); // not redacted
  });

  it('REDACT-004: redacts Stripe signature header', () => {
    const out = redactLog({ 'stripe-signature': 't=123,v1=abc' });
    expect(out['stripe-signature']).toBe('[REDACTED]');
  });

  it('REDACT-005: redacts generic password / token / api_key fields', () => {
    const out = redactLog({
      password: 'hunter2',
      api_key: 'k-123',
      apiKey: 'k-456',
      token: 't-789',
      secret: 'sssh',
      safe_field: 'visible',
    });
    expect(out.password).toBe('[REDACTED]');
    expect(out.api_key).toBe('[REDACTED]');
    expect(out.apiKey).toBe('[REDACTED]');
    expect(out.token).toBe('[REDACTED]');
    expect(out.secret).toBe('[REDACTED]');
    expect(out.safe_field).toBe('visible');
  });

  it('REDACT-006: recurses into nested objects', () => {
    const out = redactLog({
      ctx: { headers: { authorization: 'Bearer x' } },
      meta: { gemini_api_key: 'k', user: 'u1' },
    });
    expect(out.ctx.headers.authorization).toBe('[REDACTED]');
    expect(out.meta.gemini_api_key).toBe('[REDACTED]');
    expect(out.meta.user).toBe('u1');
  });

  it('REDACT-007: stops recursion at max depth (no infinite loop on cycles)', () => {
    const a = { x: 1 };
    a.self = a;
    const out = redactLog(a);
    expect(out.x).toBe(1);
    // Should terminate without throwing — depth-cap returns the cycle as-is
  });

  it('REDACT-008: does not mutate the input', () => {
    const input = { authorization: 'Bearer sec' };
    redactLog(input);
    expect(input.authorization).toBe('Bearer sec');
  });

  it('REDACT-009: returns primitives unchanged', () => {
    expect(redactLog('hello')).toBe('hello');
    expect(redactLog(42)).toBe(42);
    expect(redactLog(null)).toBeNull();
    expect(redactLog(undefined)).toBeUndefined();
  });

  it('REDACT-010: arrays are recursed into', () => {
    const out = redactLog([{ token: 't1' }, { token: 't2' }, { ok: 1 }]);
    expect(out[0].token).toBe('[REDACTED]');
    expect(out[1].token).toBe('[REDACTED]');
    expect(out[2].ok).toBe(1);
  });
});

describe('hashId', () => {
  it('HASH-001: returns a deterministic short hex hash for the same input', () => {
    expect(hashId('user-abc')).toBe(hashId('user-abc'));
  });

  it('HASH-002: returns different hashes for different inputs', () => {
    expect(hashId('user-A')).not.toBe(hashId('user-B'));
  });

  it('HASH-003: returns null for null/empty input', () => {
    expect(hashId(null)).toBeNull();
    expect(hashId('')).toBeNull();
    expect(hashId(undefined)).toBeNull();
  });

  it('HASH-004: hash is short (≤ 16 hex chars) and never contains the input', () => {
    const id = 'sensitive-user-uuid-123';
    const h = hashId(id);
    expect(h.length).toBeLessThanOrEqual(16);
    expect(h).not.toContain('sensitive');
    expect(h).toMatch(/^[a-f0-9]+$/);
  });
});

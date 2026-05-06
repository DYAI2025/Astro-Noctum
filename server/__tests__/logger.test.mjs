// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('structured logger', () => {
  let consoleLogSpy;
  let logRequest;

  beforeEach(async () => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const mod = await import('../observability/logger.mjs');
    logRequest = mod.logRequest;
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('LOG-001: emits a single JSON line per call', () => {
    logRequest({
      requestId: 'req_1', method: 'GET', route: '/api/x', status: 200,
      latencyMs: 12,
    });
    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    const line = consoleLogSpy.mock.calls[0][0];
    expect(() => JSON.parse(line)).not.toThrow();
  });

  it('LOG-002: log entry includes required fields with correct shape', () => {
    logRequest({
      requestId: 'req_2', method: 'POST', route: '/api/interpret',
      status: 200, latencyMs: 540, userId: 'user-abc', ip: '1.2.3.4',
      provider: 'gemini', cacheStatus: 'MISS',
    });
    const line = consoleLogSpy.mock.calls[0][0];
    const entry = JSON.parse(line);

    expect(entry.request_id).toBe('req_2');
    expect(entry.method).toBe('POST');
    expect(entry.route).toBe('/api/interpret');
    expect(entry.status).toBe(200);
    expect(entry.latency_ms).toBe(540);
    expect(entry.provider).toBe('gemini');
    expect(entry.cache_status).toBe('MISS');
    expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO 8601
  });

  it('LOG-003: never logs the raw user id — only hashed', () => {
    logRequest({
      requestId: 'req_3', method: 'GET', route: '/x', status: 200,
      latencyMs: 1, userId: 'sensitive-uuid-leaks-here',
    });
    const line = consoleLogSpy.mock.calls[0][0];
    expect(line).not.toContain('sensitive-uuid-leaks-here');
    const entry = JSON.parse(line);
    expect(entry.user_id_hash).toMatch(/^[a-f0-9]+$/);
    expect(entry.user_id).toBeUndefined();
  });

  it('LOG-004: never logs the raw IP — only hashed', () => {
    logRequest({
      requestId: 'req_4', method: 'GET', route: '/x', status: 200,
      latencyMs: 1, ip: '203.0.113.45',
    });
    const line = consoleLogSpy.mock.calls[0][0];
    expect(line).not.toContain('203.0.113.45');
    const entry = JSON.parse(line);
    expect(entry.ip_hash).toMatch(/^[a-f0-9]+$/);
    expect(entry.ip).toBeUndefined();
  });

  it('LOG-005: nullable fields default to null, not undefined', () => {
    logRequest({
      requestId: 'req_5', method: 'GET', route: '/x', status: 500, latencyMs: 1,
    });
    const entry = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(entry.user_id_hash).toBeNull();
    expect(entry.ip_hash).toBeNull();
    expect(entry.error_code).toBeNull();
    expect(entry.provider).toBeNull();
    expect(entry.cache_status).toBeNull();
    expect(entry.quota_status).toBeNull();
  });

  it('LOG-006: error_code present when provided', () => {
    logRequest({
      requestId: 'r', method: 'GET', route: '/x', status: 401, latencyMs: 1,
      errorCode: 'AUTH_REQUIRED',
    });
    const entry = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(entry.error_code).toBe('AUTH_REQUIRED');
  });
});

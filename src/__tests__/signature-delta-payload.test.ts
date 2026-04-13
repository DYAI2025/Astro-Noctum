/**
 * Tests for signatureDelta() payload contract.
 *
 * Verifies the quiz_answer field is sent as an array of {id, weight} markers,
 * matching server.mjs:2052 expectation: Array.isArray(quiz_answer).
 *
 * Bug fixed: client previously sent {keyword: "..."} (object), causing server
 * to coerce to [] — quiz influence on Signatur ring was silently lost.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock authedFetch to capture the request body
let capturedBody: any = null;

vi.mock('@/src/lib/authedFetch', () => ({
  authedFetch: vi.fn(async (_url: string, init?: RequestInit) => {
    capturedBody = JSON.parse(init?.body as string);
    return {
      ok: true,
      json: async () => ({
        quiz_sectors: Array(12).fill(0.5),
        narratives: { core_summary: '', context_summary: '', integration_summary: '' },
        signature_delta: { curvature: 0.6, contrast: 0.5, density: 0.6 },
        signature_blueprint: { seed: 'test', visual: {} },
      }),
    } as Response;
  }),
}));

// Mock Zod schema parse to pass through
vi.mock('@/src/lib/schemas/experience', () => ({
  SignatureDeltaResponseSchema: { parse: (v: any) => v },
  BootstrapResponseSchema: { parse: (v: any) => v },
  DailyResponseSchema: { parse: (v: any) => v },
}));

describe('signatureDelta() payload contract', () => {
  beforeEach(() => {
    capturedBody = null;
  });

  it('sends quiz_answer as an array of {id, weight} markers', async () => {
    const { signatureDelta } = await import('@/src/services/experience');
    await signatureDelta(
      Array(12).fill(0.5),
      { seed: 'test_seed' },
      'empathy',
    );

    expect(capturedBody).not.toBeNull();
    expect(Array.isArray(capturedBody.quiz_answer)).toBe(true);
    expect(capturedBody.quiz_answer).toHaveLength(1);
    expect(capturedBody.quiz_answer[0]).toEqual({ id: 'empathy', weight: 1.0 });
  });

  it('quiz_answer is NOT a plain object with keyword field (regression guard)', async () => {
    const { signatureDelta } = await import('@/src/services/experience');
    await signatureDelta(
      Array(12).fill(0.5),
      { seed: 'test_seed' },
      'creativity',
    );

    // Must NOT be the old broken format
    expect(capturedBody.quiz_answer).not.toHaveProperty('keyword');
    // Must be array
    expect(Array.isArray(capturedBody.quiz_answer)).toBe(true);
  });

  it('quiz_answer marker id matches the keyword argument', async () => {
    const { signatureDelta } = await import('@/src/services/experience');
    await signatureDelta(
      Array(12).fill(0.5),
      { seed: 'test_seed' },
      'resilience',
    );

    expect(capturedBody.quiz_answer[0].id).toBe('resilience');
  });

  it('quiz_answer marker weight is 1.0 (full contribution)', async () => {
    const { signatureDelta } = await import('@/src/services/experience');
    await signatureDelta(
      Array(12).fill(0.5),
      { seed: 'test_seed' },
      'empathy',
    );

    expect(capturedBody.quiz_answer[0].weight).toBe(1.0);
  });

  it('sends soulprint_sectors and signature_blueprint alongside quiz_answer', async () => {
    const { signatureDelta } = await import('@/src/services/experience');
    const sectors = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.1, 0.2, 0.3];
    const blueprint = { seed: 'bp_test', visual: { symmetry: 0.7 } };

    await signatureDelta(sectors, blueprint, 'focus');

    expect(capturedBody.soulprint_sectors).toEqual(sectors);
    expect(capturedBody.signature_blueprint).toEqual(blueprint);
  });
});

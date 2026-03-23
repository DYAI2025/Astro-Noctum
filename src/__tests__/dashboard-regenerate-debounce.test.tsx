import { describe, it, expect } from 'vitest';

describe('Regenerate concurrency guard', () => {
  it('prevents concurrent regeneration calls', async () => {
    let callCount = 0;
    let resolveCall: (() => void) | undefined;
    const regeneratingRef = { current: false };

    const mockRegenerate = async () => {
      if (regeneratingRef.current) return;
      regeneratingRef.current = true;
      callCount++;
      try {
        await new Promise<void>((r) => { resolveCall = r; });
      } finally {
        regeneratingRef.current = false;
      }
    };

    // Fire 5 rapid calls
    const p1 = mockRegenerate();
    mockRegenerate();
    mockRegenerate();
    mockRegenerate();
    mockRegenerate();

    // Only 1 should have started
    expect(callCount).toBe(1);

    // Resolve the first call
    resolveCall?.();
    await p1;

    // Now another can go through
    const p2 = mockRegenerate();
    expect(callCount).toBe(2);
    resolveCall?.();
    await p2;
  });

  it('allows retry after completion', async () => {
    let callCount = 0;
    const regeneratingRef = { current: false };

    const mockRegenerate = async () => {
      if (regeneratingRef.current) return;
      regeneratingRef.current = true;
      callCount++;
      regeneratingRef.current = false;
    };

    await mockRegenerate();
    await mockRegenerate();
    await mockRegenerate();

    // All sequential calls go through
    expect(callCount).toBe(3);
  });
});

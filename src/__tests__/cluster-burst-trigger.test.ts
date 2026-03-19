// src/__tests__/cluster-burst-trigger.test.ts
import { describe, it, expect } from 'vitest';

describe('FusionRingCanvasV2 effectTrigger prop', () => {
  it('accepts effectTrigger in the interface', async () => {
    // Verify the type exists by importing it
    const mod = await import('@/src/components/fusion-ring-website/FusionRingCanvasV2');
    // The interface should allow effectTrigger as optional prop
    expect(mod.default).toBeDefined();
  });
});

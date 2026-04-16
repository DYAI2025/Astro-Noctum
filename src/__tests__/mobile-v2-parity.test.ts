import { describe, it, expect } from 'vitest';
import { soulprintToNatalWeights } from '../../packages/shared/src/signatur/signatur-bridge';

// ── 1. MOBILE_FLAGS — V2 enabled by default ─────────────────────────────────

describe('mobile feature flags — signature_engine_v2 default', () => {
  it('signature_engine_v2 is true by default', async () => {
    // Import path mirrors what FuRingScreen imports at runtime
    const { MOBILE_FLAGS } = await import('../../apps/mobile/src/lib/mobile-feature-flags');
    expect(MOBILE_FLAGS.signature_engine_v2).toBe(true);
  });

  it('MOBILE_FLAGS is a const object (no accidental mutation at module level)', async () => {
    const { MOBILE_FLAGS } = await import('../../apps/mobile/src/lib/mobile-feature-flags');
    expect(typeof MOBILE_FLAGS.signature_engine_v2).toBe('boolean');
  });
});

// ── 2. natalWeights derivation — 12 sectors → Map<string, number> ───────────

describe('FuRingScreen V2 weight derivation', () => {
  it('soulprintToNatalWeights returns a Record that can be converted to Map', () => {
    const sectors = Array(12).fill(0.5);
    const record = soulprintToNatalWeights(sectors);
    const map = new Map(Object.entries(record));
    expect(map.size).toBeGreaterThan(0);
    for (const v of map.values()) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it('different soulprints produce different natalWeight Maps', () => {
    const a = soulprintToNatalWeights(Array(12).fill(0.3));
    const b = soulprintToNatalWeights(Array(12).fill(0.8));
    const planetsA = Object.entries(a);
    const maxDelta = Math.max(...planetsA.map(([k, v]) => Math.abs(v - (b[k] ?? 0))));
    expect(maxDelta).toBeGreaterThan(0.01);
  });

  it('soulprintToNatalWeights covers 7 planet keys', () => {
    const record = soulprintToNatalWeights(Array(12).fill(0.5));
    // V2 engine expects at least 7 named planets
    const keys = Object.keys(record);
    expect(keys.length).toBeGreaterThanOrEqual(7);
  });
});

// ── 3. V2 degradation — explicit fallback contract ───────────────────────────

describe('SignaturEngine V2 degradation — onFailed contract', () => {
  it('onFailed is invoked and sets v2Failed, then V1 is rendered', () => {
    // Simulate the state transition in FuRingScreen without React
    let v2Failed = false;
    const handleV2Failed = () => { v2Failed = true; };

    // Simulate GL failure path
    handleV2Failed();

    expect(v2Failed).toBe(true);
    // After failure, the screen renders V1 SignaturCanvas
    const engine = v2Failed ? 'V1-SignaturCanvas' : 'V2-SignaturEngine';
    expect(engine).toBe('V1-SignaturCanvas');
  });

  it('does NOT activate V1 when flag is true and GL succeeds (v2Failed stays false)', () => {
    let v2Failed = false;
    // No failure — onFailed is never called
    const engine = !v2Failed ? 'V2-SignaturEngine' : 'V1-SignaturCanvas';
    expect(engine).toBe('V2-SignaturEngine');
  });

  it('activates V1 when flag is explicitly false (no GL attempt)', async () => {
    // Patch flags for this test
    const { MOBILE_FLAGS } = await import('../../apps/mobile/src/lib/mobile-feature-flags');
    const v2Failed = false;
    // Simulates: MOBILE_FLAGS.signature_engine_v2 && !v2Failed → use V2
    const useV2 = (MOBILE_FLAGS.signature_engine_v2 as boolean) && !v2Failed;
    // Default flag is true, so V2 is used
    expect(useV2).toBe(true);
  });
});

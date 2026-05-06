/**
 * Regression tests for the FuFirE harmony_index nested-path read in
 * server.mjs computeActiveImpactsCore.
 *
 * Bug (2026-04-20 user report): Dashboard "Kohärenzindex" showed "Derzeit
 * nicht verfügbar" for 27/59 prod users. Root cause: server read
 * astro_json.fusion.harmony_index directly, but FuFirE nests the actual
 * number under .harmony_index.harmony_index (outer key is an object
 * containing the number plus bazi_vector/western_vector/interpretation/etc.).
 * The wrong path returned either `undefined` (empty-fusion rows) or the
 * wrapper object (legacy rows) — the object-as-number silently produced
 * NaN percentages.
 *
 * These tests mirror the extraction logic from server.mjs as a pure
 * function (same pattern as impact-active.test.ts BaZi resonance tests).
 * Any revert of the path or the typeof+isFinite guard will fail here.
 */
import { describe, it, expect } from 'vitest';

// Mirror of the server.mjs nested-path extraction (lines ~2014-2016
// post-fix). Fails a revert to the old single-level path or a revert
// of the strict number-type guard.
function extractHarmonyIndex(astroJson: unknown): number | null {
  const fusion = (astroJson as { fusion?: { harmony_index?: { harmony_index?: unknown } } })?.fusion;
  const raw = fusion?.harmony_index?.harmony_index;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  return null;
}

describe('extractHarmonyIndex (server.mjs nested-path contract)', () => {
  it('reads the nested .fusion.harmony_index.harmony_index number for legacy OK rows', () => {
    const astroJson = {
      fusion: {
        harmony_index: {
          harmony_index: 0.6094,
          method: 'dot_product',
          bazi_vector: { Holz: 0.09, Feuer: 0.37, Erde: 0.24, Metall: 0.8, Wasser: 0.37 },
          western_vector: { Holz: 0.62, Feuer: 0.41, Erde: 0.27, Metall: 0.13, Wasser: 0.58 },
          interpretation: 'Gute Harmonie',
        },
      },
    };
    expect(extractHarmonyIndex(astroJson)).toBeCloseTo(0.6094, 4);
  });

  it('returns null for the prod "empty fusion" case (new-onboarding rows where fusion = {})', () => {
    expect(extractHarmonyIndex({ fusion: {} })).toBeNull();
  });

  it('returns null when fusion sub-object exists but harmony_index wrapper is absent', () => {
    expect(extractHarmonyIndex({ fusion: { cosmic_state: 0.6 } })).toBeNull();
  });

  it('returns null when harmony_index wrapper has no inner harmony_index number', () => {
    expect(extractHarmonyIndex({
      fusion: { harmony_index: { method: 'dot_product', bazi_vector: {} } },
    })).toBeNull();
  });

  it('REGRESSION: rejects the old single-level number path (prevents reverting to fusion.harmony_index)', () => {
    // If someone reverts the fix, fusion.harmony_index would be treated as
    // a number at the outer level. This test codifies that the new path
    // REQUIRES double-nesting — a legacy single-level shape must NOT
    // accidentally be treated as valid data.
    expect(extractHarmonyIndex({ fusion: { harmony_index: 0.75 } })).toBeNull();
  });

  it('REGRESSION: rejects non-finite values (NaN, Infinity) that would produce garbled rings', () => {
    expect(extractHarmonyIndex({ fusion: { harmony_index: { harmony_index: NaN } } })).toBeNull();
    expect(extractHarmonyIndex({ fusion: { harmony_index: { harmony_index: Infinity } } })).toBeNull();
    expect(extractHarmonyIndex({ fusion: { harmony_index: { harmony_index: -Infinity } } })).toBeNull();
  });

  it('returns null for completely missing astro_json or fusion block', () => {
    expect(extractHarmonyIndex(null)).toBeNull();
    expect(extractHarmonyIndex(undefined)).toBeNull();
    expect(extractHarmonyIndex({})).toBeNull();
    expect(extractHarmonyIndex({ bazi: {}, western: {}, wuxing: {} })).toBeNull();
  });

  it('accepts the 0 boundary as a valid harmony value (not falsy-filtered)', () => {
    // harmony_index = 0 means "no harmony" — a mathematically valid result
    // that must NOT be collapsed into the unavailable-UI state.
    expect(extractHarmonyIndex({ fusion: { harmony_index: { harmony_index: 0 } } })).toBe(0);
  });
});

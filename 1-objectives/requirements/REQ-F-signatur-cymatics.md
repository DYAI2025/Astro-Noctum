# REQ-F-signatur-cymatics: Cymatics/Chladni Signatur-Engine

**Type**: Functional

**Status**: Draft

**Priority**: Must-have

**Source**: [GOAL-signatur-cymatics](../goals/GOAL-signatur-cymatics.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md), [STK-end-user](../stakeholders.md)

## Description

Die Signatur-Visualisierung erhält eine neue Engine (`SignaturCymaticsCanvas`) auf Basis der Chladni-Gleichung. Parameter werden deterministisch aus den BaZi-Vier-Säulen und dem Wu-Xing-Harmonie-Index des Nutzers abgeleitet. Das Ergebnis ist eine einzigartige, animierte Partikelkarte, die physikalisch als stehendes Wellenmuster auf einer vibrierenden Membran interpretierbar ist.

## Acceptance Criteria

### AC-1: BaZi→Chladni Bridge
- Given a user's `apiData.bazi.pillars` (4 heavenly stem indices 0..9) and `apiData.wuxing.elements` (Wu-Xing weights + harmony_index), when `baziToChladniParams()` is called, then it returns a `ChladniParams` object with:
  - `m`: integer 2..6, derived from `(yi * 1000 + mi * 100 + di * 10 + hi) % 360`
  - `n`: integer 2..6, derived from `floor(numeric_sig * 7 / 5) % 5 + 2`
  - `a`: float 0.3..1.0, derived from `harmony_index`
  - `b`: float 0.1..0.7, derived as `1.0 - a * 0.6`
  - `dominantElement`: one of `Wood | Fire | Earth | Metal | Water`
  - `harmonyIndex`: float 0..1

### AC-2: Particle Simulation
- Given `ChladniParams { m, n, a, b }`, when the `SignaturCymaticsCanvas` renders, then 16.000 Partikel wandern stochastisch zu den Knotenlinien der Gleichung `f(x,y) = a·sin(π·n·x)·sin(π·m·y) + b·sin(π·m·x)·sin(π·n·y)`.
- Partikel nahe der Knotenlinien (|f| < Schwellwert) sind heller; weit entfernte sind dunkler — das Muster formt sich sichtbar über ~3 Sekunden aus.
- Farbe folgt dem `dominantElement` (Wu-Xing Farbpalette: Holz=#66BB6A, Feuer=#FF9800, Erde=#FFD54F, Metall=#CFD8DC, Wasser=#42A5F5).

### AC-3: Determinismus
- Given the same BaZi-Stammindizes, when `baziToChladniParams()` is called multiple times, then the output is always identical (no randomness in param derivation).
- Given two different BaZi birth charts (different stem indices), when params are compared, then m×n is different in ≥80% of cases across the 10×10×10×10 stem space.

### AC-4: Smooth Morphing on Quiz Completion
- Given a quiz cluster is completed and `harmony_index` changes, when new `ChladniParams` are passed to the canvas, then α und β morph mit `lerp(current, target, 0.03)` per Frame — kein abrupter Schnitt.
- Given m oder n ändert sich (neue Cluster-Kombination), when the canvas receives new params, then a subtle transition effect (brief particle scatter, 1.5s) precedes the new pattern crystallization.

### AC-5: Feature Flag & Engine Hierarchy
- Given `isFeatureEnabled('signature_engine_cymatics')` returns `true`, when `FusionRing3D` renders, then `SignaturCymaticsCanvas` is used instead of V1/V2.
- Given the flag is `false` (default), when `FusionRing3D` renders, then existing V1/V2 behavior is unchanged.
- Given `signature_engine_cymatics` is enabled AND canvas initialization fails, when the component renders, then the existing V1 `FusionRingWebsiteCanvas` is shown (same fallback chain as V2).

### AC-6: Theme Awareness
- Given `planetariumMode = true`, when the canvas renders, then background is near-black (`#0a2030`) and particles glow against dark.
- Given `planetariumMode = false`, when the canvas renders, then background is near-white (`#f1f5f9`) and particles are rendered with inverted brightness (dark particles on light background).

### AC-7: Frequency Panel
- Given the `/signatur` page has a "Frequenzen" section (optional tab or sidebar panel), when a user opens it, then the 10 Cousto-Frequenzen are displayed with: planet name (DE), symbol, Hz value, Wu-Xing element, and current weight bar (from wuxing weights).
- This panel is informational only — it does not block the main signature display.

### AC-8: No p5.js Dependency
- The production implementation MUST NOT add `p5` as a dependency. Use Canvas2D API + `requestAnimationFrame` directly.
- The prototype in `Cymantics/ChladniSignature.tsx` (which uses p5.js) serves as the mathematical reference only.

### AC-9: Performance
- The simulation runs at ≥30 FPS on a mid-range device (2019 MacBook Pro, mobile browser).
- Canvas size is capped at `min(container_width, 600)px` — no DOM overflow.
- The RAF loop pauses when the tab/page is not visible (`document.visibilityState`).

## Related Constraints

- [CON-no-unexplained-numbers](../constraints/CON-no-unexplained-numbers.md) — Chladni parameter values (m, n, α, β) müssen im UI erklärt sein (tooltip oder Frequenzen-Tab).
- [CON-mobile-first-readability](../constraints/CON-mobile-first-readability.md) — Canvas muss auf 375px viewport korrekt skalieren.

## Implementation Notes

### Data Sources (available in FuRingPage)
```typescript
// BaZi pillars — from AppLayoutContext
const { apiData } = useAppLayout();
const baziPillars = apiData?.bazi?.pillars;       // { year, month, day, hour } each with stem_index 0..9
const wuxingWeights = apiData?.wuxing?.elements;  // Record<string, number>
const harmonyIndex = apiData?.wuxing?.harmony_index; // float 0..1

// Dominant element — computed from wuxingWeights
const dominantElement = Object.entries(wuxingWeights ?? {})
  .sort(([,a],[,b]) => b - a)[0]?.[0]; // highest weight element
```

### BaZi Stem Index Availability
The `bazi.pillars.*.stem_index` field must be verified present in the BAFE `/chart` response. If not present in `astro_profiles`, it needs to be backfilled from `bazi.pillars.*.stem` name → index mapping.

### Chladni Parameter Derivation (reference from prototype `chart.ts`)
```typescript
export function baziToChladniParams(baziPillars, wuxingWeights, harmonyIndex): ChladniParams {
  const yi = baziPillars.year.stem_index;
  const mi = baziPillars.month.stem_index;
  const di = baziPillars.day.stem_index;
  const hi = baziPillars.hour.stem_index;
  const numericSig = (yi * 1000 + mi * 100 + di * 10 + hi) % 360;

  const m = 2 + (numericSig % 5);                          // 2..6
  const n = 2 + (Math.floor(numericSig * 7 / 5) % 5);     // 2..6
  const a = 0.3 + harmonyIndex * 0.7;                      // 0.3..1.0
  const b = 1.0 - a * 0.6;                                 // 0.1..0.7

  const dominantElement = Object.entries(wuxingWeights)
    .sort(([,v1],[,v2]) => v2 - v1)[0]?.[0] ?? 'Water';

  return { m, n, a, b, dominantElement, harmonyIndex };
}
```

### Canvas2D Particle Loop (reference from prototype `ChladniSignature.tsx`)
```typescript
// Core math (no p5 needed):
function chladni(x: number, y: number, a: number, b: number, m: number, n: number): number {
  return (
    a * Math.sin(Math.PI * n * x) * Math.sin(Math.PI * m * y) +
    b * Math.sin(Math.PI * m * x) * Math.sin(Math.PI * n * y)
  );
}
// Each particle wanders: pt.x += random(-stoch, stoch) where stoch = vibration * |chladni(pt.x, pt.y, ...)|
// Particles near nodal lines (|chladni| ≈ 0) slow down and settle → visible crystallization
```

# DEC-cymatics-renderer — History

## 2026-04-17 — Initial Decision

**Context**: Cymatics prototype analyzed (`Cymantics/` directory). Two renderer options evaluated.

**Options considered**:
- A: Canvas2D particle simulation (port from `ChladniSignature.tsx`, remove p5 dep)
- B: Three.js 3D sphere with Chladni displacement (from `SignatureCanvas.tsx`)
- C: Both — 2D default, 3D as premium extended view

**Chosen**: Option A — Canvas2D primary. Option C deferred (V4.5 milestone).

**Rationale**: V1 and V2 are already 3D Three.js. A 2D crystallization metaphor is more differentiating. No GPU contention with existing engines. p5.js avoided.

**BaZi→Chladni mapping**: Adopted from prototype `chart.ts`. Stem indices → numeric_signature → m,n. Multiplier 7/5 prevents m,n correlation.

**Approved by**: Ben (founder) — 2026-04-17

# US-dsg-3d-signatur-upgrade: 3D-Signatur ist interaktiv und zeigt Chladni-Knotenmuster

**Status**: Implemented

**Source**: [GOAL-dashboard-signatur-hygiene](../goals/GOAL-dashboard-signatur-hygiene.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## User Story

Als Bazodiac-Nutzer möchte ich meine Signatur-Sphäre durch Ziehen rotieren können und Hover-Tooltips über die aktiven Planeten-Pole sehen, damit sich die Visualisierung lebendig und persönlich anfühlt statt wie ein statisches Bild.

## Acceptance Criteria

- [x] Drag-to-Rotate: `<OrbitControls>` auf der Solid-Sphere aktiv — User kann Sphäre durch Maus/Touch-Drag rotieren
- [x] Chladni-Knotenmuster als Vertex-Colors auf der Solid-Sphere (planet-blend Tint)
- [x] Hover-Tooltip pro Planeten-Pol: zeigt Archetyp-Name (DE+EN), Influence-Beschreibung, Weight-Tier
- [x] Kp-responsive Morph-Tempo: 1.0× (ruhig) bis 2.8× (Storm G3+)
- [x] Pol-Glow und Glyph-Size proportional zum Planet-Weight
- [x] Displacement revertiert auf 0.12 nach visuell bestätigtem Collapse-Feedback (vorher 0.30)

## Related Artifacts

- Sprint: S-DASH-SIGNATUR-GAPS Phasen feat(3D) — `docs/sprint-S-DASH-SIGNATUR-GAPS-report.md`
- Defect-Report: `docs/2026-04-20-signatur-3d-defect.md` — H1 (default-2D-misread) + H3 (static feel) geschlossen; H2 (neutral-weight-collapse) + H4 (WebGL-fail silent-degrade) offen
- Commits: `e0300f8`, `b66d428`, `f40eef2`

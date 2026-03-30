# GOAL-signatur-phase2-density: Signatur Phase 2 — Density Field & Bijektive Präzision

**Description**: Die Signatur wird zur messbaren Datenstruktur. Das Density Field (128×128 Float-Raster) ist die numerische Repräsentation der visuellen Form — der Schlüssel für Vergleich, Rekonstruktion und algorithmische Präzision. Zusätzlich wird das Drei-Schichten-Dissonanz-Modell vollständig aktiv: `d_accumulated` baut über Zeit Textur auf, jedes Quiz hinterlässt eine bleibende Spur in der Geometrie.

**Status**: Draft

**Priority**: Should-have

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## Success Criteria

- [ ] Das Density Field (128×128) wird aus Trail-Daten jedes laufenden V3-Render-Runs berechenbar
- [ ] `d_accumulated` ist aktiv und moduliert Trail-Komplexität und Micro-Jitter (7–12 Hz) sichtbar über Zeit
- [ ] Das Density Field kann persistiert werden (`user_signature_state.signature_blueprint_json`)
- [ ] Aus der Signatur-Geometrie (Density Field) lässt sich der Input-Vektor mit Fehler < 5% rekonstruieren (Bijektivitätsziel)
- [ ] Zwei Density Fields sind mittels Kosinus-Ähnlichkeit vergleichbar und liefern einen normierten Kompatibilitätsscore [0,1]

## Related Artifacts

- Goals: [GOAL-fusion-astrology](GOAL-fusion-astrology.md)
- Goals: [GOAL-signatur-phase3-matching](GOAL-signatur-phase3-matching.md)
- Requirements: [REQ-F-signatur-density-field](../requirements/REQ-F-signatur-density-field.md)
- Requirements: [REQ-F-signatur-dissonance-model](../requirements/REQ-F-signatur-dissonance-model.md)
- Requirements: [REQ-F-signatur-determinism](../requirements/REQ-F-signatur-determinism.md)

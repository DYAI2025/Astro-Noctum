# REQ-F-signatur-quiz-morph: Signatur Quiz-Completion Morphing

**Type**: Functional

**Status**: Draft

**Priority**: Must-have

**Source**: [GOAL-autopoietic-ux](../goals/GOAL-autopoietic-ux.md), [GOAL-fusion-astrology](../goals/GOAL-fusion-astrology.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## Description

Wenn ein User ein Quiz abschließt, verändert sich die Signatur sichtbar und proportional. Die Veränderung ist kontinuierlich (kein Snapshot-Cut) und morpht sich graduell in die bestehende Geometrie ein. Das ist die Self-Fulfilling-Prophecy-Mechanik: Der User beantwortet Fragen → die Signatur verändert sich → er sieht die Veränderung → er reflektiert. Diese Reflexion ist das Produkt.

## Acceptance Criteria

- Given Quiz-Completion eines einzelnen kleinen Quizzes, when Gewichte aktualisiert, then ist die visuelle Verschiebung subtil aber erkennbar (Pol-Radius ändert sich um ≤ 15%)
- Given Completion eines vollen Clusters (alle Quizzes im Cluster), when Gewichte aktualisiert, then ist die Verschiebung deutlich — der User soll ohne Erklärung den Zusammenhang zwischen Handlung und Wirkung spüren
- Given Gewicht-Update, when ausgelöst, then beginnt das Morphing sofort; neue Pol-Radien, -Geschwindigkeiten und Lissajous-Blend-Werte transitieren über ~2 Sekunden graduell
- Given Morphing-Transition, when aktiv, then gibt es keinen Cut, keinen Snapshot-Übergang und keine Pause der Animations-Loop — die Engine läuft kontinuierlich durch
- Given Morphing-Transition, when aktiv, then verblassen die Trails der alten Form, während sich die neue Geometrie einschreibt — organische Überlagerung, kein harter Reset
- Given mehrere Quiz-Completions in schneller Folge (<2s Abstand), when ausgelöst, then werden Gewichts-Updates gequeued und sequenziell morphed, nicht übersprungen
- Given `prefers-reduced-motion: reduce`, when Morphing ausgelöst, then erfolgt Gewichts-Update sofort ohne Transition-Animation; kein visueller Sprung durch Ringpuffer-Flush

## Related Artifacts

- Requirements: [REQ-F-signatur-rendering-engine](REQ-F-signatur-rendering-engine.md)
- Requirements: [REQ-F-signatur-dissonance-model](REQ-F-signatur-dissonance-model.md)
- Requirements: [REQ-F-quiz-contribution-system](REQ-F-quiz-contribution-system.md)

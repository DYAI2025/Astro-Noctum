# REQ-F-signatur-determinism: Signatur Determinismus-Garantie

**Type**: Functional

**Status**: Implemented

**Priority**: Must-have

**Source**: [GOAL-fusion-astrology](../goals/GOAL-fusion-astrology.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## Description

Dieselben Input-Werte erzeugen dieselbe Signatur-Form. Das ist keine Nice-to-Have-Eigenschaft — sie ist Grundvoraussetzung für Matching, Vergleich und Nutzer-Vertrauen. "Das ist meine Signatur" setzt voraus, dass die Signatur bei jedem Reload dieselbe ist. Nicht-Determinismus liegt nur in Lissajous-Frequenz-Ratios (hash01(dim.hz, 3)) — aber dieser Hash ist relativ zur Dimension deterministisch.

## Acceptance Criteria

- Given identische Input-Vektoren (natal[6] + quiz[6]), when zwei unabhängige Engine-Instanzen initialisiert werden, then ist die emergente Geometrie nach ~10 Sekunden Trail-Akkumulation visuell identisch
- Given Lissajous-Frequenz-Ratio, when berechnet, then gilt `ratio = hash01(dim.hz, 3)` — deterministisch relativ zur Dimension; gleiche Dimension = gleicher Ratio immer
- Given Page-Reload (selber User), when Engine neu startet, then ist die Signatur nach 10s Laufzeit erkennbar dieselbe Form wie vor dem Reload
- Given Web und iOS (Swift), when gleiche Input-Werte übergeben, when Engine auf beiden Plattformen läuft, then produzieren beide nach 10s visuell äquivalente Geometrien
- Given Determinismus-Test-Suite (`signatur-v3-engine.test.ts`), when ausgeführt, then bestehen alle Pol-Determinismus-Tests für alle 6 Dimensionen
- Given bijektive Präzision (Phase 2-Ziel), when Density Field aus Signatur berechnet, then liegt Fehler bei Input-Vektor-Rekonstruktion < 5%

## Related Artifacts

- Requirements: [REQ-F-signatur-rendering-engine](REQ-F-signatur-rendering-engine.md)
- Requirements: [REQ-F-signatur-ios-swift](REQ-F-signatur-ios-swift.md)
- Requirements: [REQ-F-signatur-density-field](REQ-F-signatur-density-field.md)
- Goals: [GOAL-fusion-astrology](../goals/GOAL-fusion-astrology.md)

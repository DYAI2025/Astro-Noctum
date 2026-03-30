# REQ-F-signatur-shared-bridge: Signatur Shared Package Bridge-Hub

**Type**: Functional

**Status**: Draft

**Priority**: Must-have

**Source**: [GOAL-fusion-astrology](../goals/GOAL-fusion-astrology.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## Description

`packages/shared/src/signatur/` ist der einzige Export-Hub für alle Daten-Bridge-Funktionen, Typen und Konstanten, die Web und iOS gemeinsam konsumieren. Keine Duplizierung von DIMENSION_DEFS oder Hz-Werten auf beiden Plattformen. Die Mathematik wird einmal definiert — Plattformen implementieren sie, ohne Werte hart zu kodieren.

## Acceptance Criteria

### Exports

- Given `@bazodiac/shared`, when aus `signatur/` importiert, then exportiert: `soulprintToNatalWeights()`, `quizSectorsToQuizWeights()`, `soulprintToDimensionWeights()`, `DIMENSION_DEFS` (6 Einträge) sowie die dafür benötigten Typen (z. B. `DimensionDef`), wie sie in `packages/shared/src/signatur/index.ts` definiert sind
- Given `DIMENSION_DEFS`, when importiert, then enthält für jede der 6 Dimensionen: `id`, `poleA`, `poleB`, `baseAngle` (Radians), `hz` (Cousto), `colorA: [r,g,b]`, `colorB: [r,g,b]`

### Single Source of Truth

- Given `DIMENSION_DEFS.hz`-Werte, when Web und iOS sie konsumieren, then sind die Werte auf beiden Plattformen byte-identisch (Mars 144.72, Mond 210.42, Sonne 126.22, Merkur 141.27, Jupiter 183.58, Saturn 147.85)
- Given eine neue Dimension hinzugefügt oder ein Hz-Wert korrigiert wird, when `DIMENSION_DEFS` aktualisiert, then kompilieren Web und iOS ohne weitere Anpassungen; kein Manual-Sync nötig
- Given iOS Swift (`SignaturV3Engine.swift`), when Dimension-Definitionen benötigt, then nutzt es eine generierte oder manuell synchronisierte Swift-Entsprechung von `DIMENSION_DEFS` — kein Hardcoding in Swift-Dateien

### Bridge-Funktionen

- Given `soulprintToNatalWeights(sectors: number[12])`, when aufgerufen, then gibt `Record<planet_id, weight>` mit 7 Planeten-Gewichten [0,1] (Sonne, Mond, Merkur, Venus, Mars, Jupiter, Saturn) zurück
- Given `quizSectorsToQuizWeights(sectors: number[12])`, when aufgerufen, then gibt `Record<dimension_id, weight>` mit 6 Werten [0,1] zurück
- Given `soulprintToDimensionWeights(sectors: number[12])`, when aufgerufen, then gibt 6 Natal-Dimensions-Gewichte direkt ohne Zwischenschritt über Planeten zurück

### Versionierung

- Given `signature_version` in der Datenbank, when sich DIMENSION_DEFS oder Bridge-Logik semantisch ändert, then wird die Version hochgezählt; bestehende gecachte Signaturen werden invalidiert

## Related Artifacts

- Requirements: [REQ-F-signatur-rendering-engine](REQ-F-signatur-rendering-engine.md)
- Requirements: [REQ-F-signatur-ios-swift](REQ-F-signatur-ios-swift.md)
- Requirements: [REQ-F-signatur-data-pipeline](REQ-F-signatur-data-pipeline.md)

# REQ-F-signatur-ios-swift: Signatur V3 iOS Native (Swift)

**Type**: Functional

**Status**: Draft

**Priority**: Must-have

**Source**: [GOAL-fusion-astrology](../goals/GOAL-fusion-astrology.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## Description

Die V3-Engine-Mathematik wird 1:1 nach Swift portiert. Rendering via Metal/Core Graphics (keine Expo, kein React Native). Gleiche 6-Dimensionen, gleiche Cousto-Frequenzen, gleiche Lissajous-Blend-Mechanik, adaptierte Trail-Längen für iOS-GPU-Budget. Gleiche Gewichte → gleiche Signatur-Geometrie auf iOS und Web (Determinismus-Garantie plattformübergreifend).

Supersedes: [REQ-F-signatur-mobile-native](REQ-F-signatur-mobile-native.md) (Expo-Ansatz, Cancelled).

## Acceptance Criteria

### Engine-Port

- Given `SignaturV3Engine.swift`, when mit identischen natal[6] + quiz[6] Gewichten wie Web initialisiert, then produziert die Pol-Geometrie nach 10s Laufzeit visuell äquivalente Ergebnisse zur TypeScript-Engine (plattformübergreifender Determinismus-Test)
- Given Cousto-Frequenzen, when in Swift, then gelten exakt dieselben Werte wie in `DIMENSION_DEFS` des Shared-Package (Mars 144.72 Hz, Mond 210.42 Hz, Sonne 126.22 Hz, Merkur 141.27 Hz, Jupiter 183.58 Hz, Saturn 147.85 Hz)
- Given Lissajous-Blend, when in Swift berechnet, then gilt `lerp(symmetric, lissajous, clamp(d × 2, 0, 1))` — identische Formel wie Web

### Rendering

- Given `SignaturV3View.swift`, when rendert, then nutzt Metal/Core Graphics für Trail-Akkumulation mit additiver Blendung (äquivalent zu Canvas 2D `globalCompositeOperation: 'lighter'`)
- Given Trail-Längen, when auf iOS, then adaptiertes Budget: `maxTrailLength = 800` (statt 2000 auf Desktop) zur Einhaltung des GPU-Memory-Budgets
- Given Rendering-Loop, when aktiv, then delta-time-basiert; bei App-Backgrounding pausiert, bei Rückkehr nahtlose Fortsetzung

### Performance

- Given iPhone 12+, when Signatur rendert, then ≥ 30fps ohne thermisches Throttling über 60 Sekunden
- Given GPU-Memory-Budget, when 60 Sekunden rendering, then < 150MB GPU-Speicher
- Given First Frame, when Engine initialisiert, then erster sichtbarer Frame < 2 Sekunden nach Daten-Verfügbarkeit

### Gesten

- Given Pan-Geste (1 Finger), when ausgeführt, then bewegt den Canvas-Ausschnitt
- Given Pinch-Zoom (2 Finger), when ausgeführt, then skaliert den Betrachtungsbereich
- Given Orbit-Drag, when ausgeführt, then rotiert die Pol-Anordnung

### Daten-Bridge

- Given `soulprint_sectors[12]` + Quiz-Gewichte, when in Swift verarbeitet, then gilt dieselbe Bridge-Logik wie in `signatur-bridge.ts` (Natal → 6D, Quiz → 6D)

## Related Constraints

- [CON-dark-luxury-aesthetic](../constraints/CON-dark-luxury-aesthetic.md) — OLED-Black Background, additive Blendung erzeugt dieselbe Biolumineszenz-Ästhetik wie Web

## Related Artifacts

- Requirements: [REQ-F-signatur-rendering-engine](REQ-F-signatur-rendering-engine.md)
- Requirements: [REQ-F-signatur-determinism](REQ-F-signatur-determinism.md)
- Requirements: [REQ-F-signatur-shared-bridge](REQ-F-signatur-shared-bridge.md)
- Requirements: [REQ-PERF-signatur-performance](REQ-PERF-signatur-performance.md)

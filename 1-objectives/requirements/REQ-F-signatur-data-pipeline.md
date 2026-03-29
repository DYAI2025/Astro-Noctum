# REQ-F-signatur-data-pipeline: Signatur Daten-Pipeline & Bridge-Layer

**Type**: Functional

**Status**: Implemented

**Priority**: Must-have

**Source**: [GOAL-fusion-astrology](../goals/GOAL-fusion-astrology.md), [GOAL-autopoietic-ux](../goals/GOAL-autopoietic-ux.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## Description

Alle Daten, die die Signatur treiben, fließen durch eine typisierte Bridge-Pipeline. Die Engine empfängt nie rohe API-Daten. Fünf Quellen (Natal/Soulprint, Quiz-Contributions, Transit-State, Space Weather, Day Harmonic) werden auf Engine-konsumierbare Parameter projiziert. Das **True-North-Prinzip** gilt: Quiz-Modulation ≤ 50% Abweichung vom Natal-Gewicht. Die Signatur wird durch Quizzes nuancierter, aber nie jemand anderes.

Implementierung: `signatur-bridge.ts` (Web) — plattformübergreifend identisch mit `SignaturV3Engine.swift` (iOS).

## Acceptance Criteria

### Natal-Pipeline

- Given `soulprint_sectors[12]` aus FuFirE `/experience/bootstrap`, when durch `soulprintToNatalWeights()` verarbeitet, then werden 7 Planeten-Gewichte via Zodiac-Affinity-Mapping produziert (Sun→Leo, Moon→Cancer etc.)
- Given 7 Planeten-Gewichte, when durch `soulprintToDimensionWeights()` projiziert, then entstehen 6 Natal-Dimensionen [0,1] — einer pro Dimension der Engine

### Quiz-Pipeline

- Given Quiz-`ContributionEvent`s, when durch `eventToSectorSignals()` verarbeitet, then entstehen 12-Sektor-Gewichte; via `quizSectorsToQuizWeights()` → 6 Quiz-Dimensionen [0,1]
- Given True-North-Prinzip, when Quiz-Modulation berechnet, then gilt: Pol-B-Radius = Natal-Radius × clamp(quiz_weight × 2, 0.7, 1.3) — maximal 30% Expansion oder Kontraktion

### 6-Dimensionen-Pol-Tabelle

| Dimension | Pol A | Pol B | Winkel | Cousto Hz | Planet |
|---|---|---|---|---|---|
| Assertion | Durchsetzung | Hingabe | 0° | 144.72 | Mars |
| Empathy | Einfühlung | Abgrenzung | 60° | 210.42 | Mond |
| Creativity | Schöpfung | Struktur | 120° | 126.22 | Sonne |
| Logic | Analyse | Synthese | 180° | 141.27 | Merkur |
| Intuition | Ahnung | Evidenz | 240° | 183.58 | Jupiter |
| Discipline | Ordnung | Freiheit | 300° | 147.85 | Saturn |

Given diese Tabelle, when DIMENSION_DEFS importiert, then stimmen hz, Winkel, Pol-Namen auf allen Plattformen überein.

### Transit & Space Weather

- Given User-ID, when Transit-State gepollt (`GET /api/transit-state/:userId`), then enthält Response `baseSignals[12]`, `targetSignals[12]`, `thirtyDayAvg`, `transitIntensity`
- Given Space-Weather-Daten (NOAA/DONKI), when verarbeitet, then ergibt `ringModulation` ∈ [1.0, 1.5]; alle Pol-Radien werden proportional expandiert
- Given `dimensionMultipliers`, when aus Natal-Profil abgeleitet, then reagieren Mars-geprägte User stärker auf Solar-Events als Saturn-geprägte

### Day-Pulse & Day-Trace

- Given Harmony Index H, when berechnet, then gilt `H = cos(θ) = v̂_west · v̂_bazi`; Erwartungswert Zufall: H ≈ 0.45; Intensitätsnormierung: `intensity = |H - 0.45| / 0.55`
- Given Day-Pulse (H < 0.50), when aktiv, then erhöht sich Trail-Persistenz um +12% × Intensität — Spuren kondensieren, Signatur wirkt ruhiger
- Given Day-Trace (H ≥ 0.50, ~30–35% der Tage), when aktiv, then reduziert sich Trail-Persistenz um -6% × Intensität (Traces brennen sich ein und verblassen schneller); H 0.50–0.65 = "speak", H > 0.65 = "call"
- Given Day-Trace, when visuell kodiert, then werden Mond- und Jupiter-Pole (höchste Cousto-Hz nach Log-Normierung) durch erhöhten Lissajous-Blend und Crossing-Vibration (6–14 Hz) intensiviert
- Given Night-Pulse / Night-Trace, when aktiv (Wochenende alle User; täglich Premium), then gilt gleiches Prinzip wie Day-Variante mit Mond-Position + BaZi-Nacht-Pillar als Datenbasis; Voice-Register: weicher, introspektiver

### Fallback

- Given eine beliebige Datenquelle nicht erreichbar, when die Engine rendert, then fällt sie auf letzten bekannten Zustand oder neutrale Defaults zurück (0.5 je Dimension) ohne visuellen Glitch

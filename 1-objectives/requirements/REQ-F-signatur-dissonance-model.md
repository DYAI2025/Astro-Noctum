# REQ-F-signatur-dissonance-model: Signatur Drei-Schichten-Dissonanz-Modell

**Type**: Functional

**Status**: Draft

**Priority**: Must-have

**Source**: [GOAL-fusion-astrology](../goals/GOAL-fusion-astrology.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## Description

Dissonanz ist kein binärer Schalter — sie ist ein kontinuierlicher Gradient zwischen Harmonie und Spannung. Drei unabhängige Quellen erzeugen drei visuelle Kanäle. Musik-Analogie: Grundton (d_natal), Obertöne (d_accumulated), Timbre (d_elemental). Phase 1 (aktuell): d_natal aktiv, d_elemental grob. Phase 2: alle drei vollständig.

| Schicht | Metrik | Visueller Kanal | Phase |
|---|---|---|---|
| Natal Baseline | `d_natal` | Bewegungsmodus: symmetrisch ↔ Lissajous | 1 — aktiv |
| Akkumulierte Quizzes | `d_accumulated` | Trail-Dichte, Micro-Jitter 7–12 Hz | 2 — architektonisch vorbereitet |
| Wu-Xing Element | `d_elemental` | Vibrations-Textur: kristallin vs. organisch | 1 grob / 2 präzise |

## Acceptance Criteria

### Natal Baseline (d_natal) — Phase 1

- Given d_natal → 0 (Quiz bestätigt Natal), when Pole bewegen sich, then symmetrische Kreisbahnen; Spuren überlagern sich, Form verdichtet sich
- Given d_natal → 1 (Wasser-Natal, Feuer-Quiz), when Pole bewegen sich, then Lissajous-Muster mit dimensionsspezifischen Frequenz-Ratios; Spuren divergieren, neue Geometrie arbeitet sich ein
- Given Blend-Mechanik, when d ∈ [0,1], then `position = lerp(symmetric_orbit, lissajous_pattern, clamp(d × 2, 0, 1))` — Verstärkung × 2 macht schon kleine Dissonanzen sichtbar; ab d = 0.5 reines Lissajous
- Given d_natal pro Dimension, when berechnet, then ist er die normierte Differenz zwischen natal_weight und quiz_weight für diese Dimension

### Vibrations-Textur (d_elemental) — Phase 1 grob / Phase 2 präzise

- Given d > 0.1 in einer Dimension, when Vibration aktiv, then Mikro-Oszillation senkrecht zur Bewegungsrichtung
- Given **Ke-Dissonanz** (destruktiver Zyklus, z.B. Wasser↔Feuer), when aktiv, then hochfrequente Vibration 12 Hz, kristallin, kantig
- Given **Sheng-Dissonanz** (unterbrochener Erzeugungszyklus), when aktiv, then niederfrequente Vibration 3 Hz, organisch, fließend
- Given Elemental-Qualität als Skalar `e ∈ [-1, +1]`, when berechnet, then -1 = Ke (kristallin), 0 = neutral, +1 = Sheng (organisch) — nicht alle Konflikte fühlen sich gleich an

### Akkumulierte Dissonanz (d_accumulated) — Phase 2

- Given d_accumulated, when aktiv (Phase 2), then moduliert Trail-Dichte und Micro-Jitter (7–12 Hz) sichtbar über Zeit
- Given d_accumulated = 0 (Phase 1 Zustand), when die Engine rendert, then ist der Kanal neutral — kein sichtbarer Effekt, keine visuellen Artefakte
- Given mehr Quiz-Completions über Zeit, when d_accumulated ansteigt, then wird die Signatur-Textur feiner und persönlicher — nicht chaotischer

### Pol-Köpfe

- Given Glow-Radius der Pol-Köpfe, when per Dimension d_natal vorhanden, then skaliert Radius von 8px (d=0, konsonant) bis 20px (d=1, dissonant) als Radial-Gradient

## Related Artifacts

- Requirements: [REQ-F-signatur-rendering-engine](REQ-F-signatur-rendering-engine.md)
- Requirements: [REQ-F-signatur-density-field](REQ-F-signatur-density-field.md)

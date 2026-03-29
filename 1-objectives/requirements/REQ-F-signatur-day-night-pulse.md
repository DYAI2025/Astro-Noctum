# REQ-F-signatur-day-night-pulse: Signatur Day/Night-Pulse & Trace System

**Type**: Functional

**Status**: Draft

**Priority**: Must-have

**Source**: [GOAL-fusion-astrology](../goals/GOAL-fusion-astrology.md), [GOAL-autopoietic-ux](../goals/GOAL-autopoietic-ux.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## Description

Die Signatur lebt nicht im Vakuum — sie reagiert auf den Tag. Der Harmony Index H (Kosinus-Ähnlichkeit zwischen Western- und BaZi-Wu-Xing-Vektoren) bestimmt täglich, ob ein Day-Pulse oder Day-Trace aktiv ist. Bei Konvergenz (Day-Trace) zeigt die Signatur sichtbare Intensivierungen an den relevanten Pol-Kreuzungen. Nachts gilt dasselbe Prinzip mit anderer Datenbasis (Night-Pulse/Trace). Day-Variante: täglich für alle User. Night-Variante: Wochenende alle User, täglich Premium.

**Implementierungsstand**: Day-Pulse/Day-Trace implementiert (DAY-01–07, S-SIG Sprint). Night-Pulse/Night-Trace: noch nicht implementiert.

## Acceptance Criteria

### Harmony Index

- Given Wu-Xing-Vektoren aus Western und BaZi, when H berechnet, then gilt `H = cos(θ) = v̂_west · v̂_bazi`
- Given Zufallserwartungswert H ≈ 0.45, when Intensität normiert, then gilt `intensity = |H - 0.45| / 0.55` → [0, 1]

### Day-Pulse (H < 0.50) — täglich, alle User

- Given Day-Pulse aktiv, when Trail-Persistenz angepasst, then erhöht sich diese um +12% × intensity — Spuren kondensieren, Signatur wirkt dichter, ruhiger
- Given Day-Pulse Voice, when generiert, then folgt Muster: `[Element] ist [Funktion] → [was es heute für DICH tut] → [Einladung]` (Brand Voice: Warm, Präzise, kein Urteil)

### Day-Trace (H ≥ 0.50) — ~30–35% der Tage, alle User

- Given Day-Trace aktiv, when Trail-Persistenz angepasst, then sinkt diese um -6% × intensity — Traces brennen sich ein und verblassen schneller; Signatur atmet aktiver
- Given Day-Trace aktiv, when Pole intensiviert, then werden Mond (logNorm-Hz: 0.81) und Jupiter (0.67) durch erhöhten Lissajous-Blend verstärkt — höchste Log-normalisierten Frequenzen
- Given Day-Trace aktiv, when Crossing-Vibration, then gilt 6–14 Hz an Kreuzungspunkten der intensivierten Pol-Trails
- Given Signal-Stärke, when bestimmt, then gilt: H 0.50–0.65 = "speak" (deutlich, ruhig); H > 0.65 = "call" (klar, dringend)
- Given Day-Trace Voice, when generiert, then folgt Muster: `[Element-Reibung als Situation] → [was du erleben könntest] → [Ermutigung]`

### Night-Pulse (Datenbasis: Mond-Position + BaZi-Nacht-Pillar) — Phase Draft

- Given Night-Pulse/Trace, when aktiv (Wochenende alle User, täglich Premium), then gleiches H-Prinzip wie Day-Variante, andere Datenbasis
- Given Night-Variante, when Voice generiert, then ist Register weicher, introspektiver, weniger handlungsorientiert als Day-Variante
- Given Night-Variante, when visuelle Modulation, then dieselbe Trail-Persistenz-Logik wie Day (±%), aber gedämpfter (50% der Day-Intensität)

### UI-Integration

- Given Day-Trace aktiv, when Signatur gerendert, then: (1) identifiziere Reibungs-Elemente (z.B. Holz→Feuer), (2) finde zugehörige Dimensions-Pole, (3) verstärke deren Radius und Trail-Helligkeit temporär, (4) sichtbare Kreuzung der Trails erzeugt die "Spur des Tages"
- Given SpaceWeatherPanel, when Day/Night-Status angezeigt, then gibt es Kontext für den User: "Warum atmet meine Signatur heute anders?" — als Beobachtung, nicht als Erklärung

### Dashboard Tages-Impuls — Hero-Sektion

> **Kernprinzip:** Der Tages-Impuls beantwortet die erste tägliche Nutzerfrage: *"Wie ist meine Energie heute? Was erwartet mich?"* Er ist das prominenteste Inhaltselement im Dashboard — immer vollständig sichtbar, kein Akkordeon, kein Expand-Trigger.

- Given Tages-Impuls in `DashboardTagesEnergie`, when Dashboard geladen, then ist die gesamte Karte **sofort vollständig sichtbar** — kein Collapse, kein Expand, kein Fold required
- Given `DashboardTagesEnergie`, when gerendert, then zeigt die Karte **in dieser Reihenfolge ohne User-Interaktion**: (1) Element-Icon + Headline, (2) Body-Narrativ (2–3 Sätze aus `fusion.synthesis`), (3) Kosmoswetter-Strip mit Icons, (4) Resonanz-Indikator; `fusion.action` hinter PremiumGate
- Given Day-Trace aktiv, when Body-Narrativ gerendert, then wird ein zusätzlicher Reibungs-Kontextsatz aus `eastern.caution` oder `western.caution` an den Body angehängt (visuell abgesetzt, kursiv)
- Given Kosmoswetter-Strip, when gerendert, then werden Ereignisse als kleine Icon-Pillen dargestellt: Magnetsturm (`Zap`, gold wenn G3+), Flare (`Flame`, rot wenn X-Klasse / amber wenn M-Klasse), CME-Ankunft (`Waves`, cyan), Hochgeschw.-Strom (`Wind`, blau), Protonenfluss (`Activity`, orange), Planetentransit (`CircleDot`, gold/40) — nur relevante Events werden angezeigt (kein Noise bei G0 / A-Klasse)
- Given Resonanz-Indikator, when berechnet, then gilt `resonance = clamp(harmonyIndex × 0.65 + solarPressure × 0.35, 0, 1)` mit Beschriftung: >0.7 "verstärkt den solaren Impuls", >0.5 "schwingt mit dem Kosmos", >0.3 "leichte kosmische Berührung", ≤0.3 "fließt unabhängig"
- Given Freemium-Nutzer, when `DashboardTagesEnergie` gerendert, then sind Body-Narrativ, Kosmoswetter und Resonanz-Indikator vollständig sichtbar; `fusion.action` (Einladung/Advice) ist hinter PremiumGate verborgen
- Given `DayModeModal`, when `DashboardTagesEnergie` gerendert, then wird das Modal **nicht automatisch geöffnet**; ein optionaler `[vertiefen →]`-Link in der Karte öffnet es on-demand

## Related Artifacts

- Requirements: [REQ-F-signatur-rendering-engine](REQ-F-signatur-rendering-engine.md)
- Requirements: [REQ-F-signatur-data-pipeline](REQ-F-signatur-data-pipeline.md)
- Requirements: [REQ-F-space-weather-modulation](REQ-F-space-weather-modulation.md)

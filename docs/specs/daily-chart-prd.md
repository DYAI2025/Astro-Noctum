# PRD: Daily Chart — Kohärenz-geführtes Tageshoroskop

> **Status:** Draft  
> **Datum:** 2026-04-12  
> **Owner:** Ben Poersch (Product), Claude (PM/PO Agent)  
> **Scope:** Dashboard-Redesign + zwei neue API-Endpunkte + Frontend-Integration

---

## Problem Statement

Das Bazodiac-Dashboard zeigt dem User derzeit ein Planetarium (3D-Sternenkarte) als ersten Eindruck. Das sieht beeindruckend aus, sagt dem User aber nicht, wie sein Tag energetisch aussieht. Die tatsächlich volatilen, tagesrelevanten Werte — Kohärenzindex, aktive Planeteneinflüsse, kosmisches Wetter — liegen versteckt in der unteren Hälfte der Seite.

Der User öffnet Bazodiac mit einer einfachen Frage: *"Wie ist mein Tag heute?"* Diese Frage wird aktuell nicht auf den ersten Blick beantwortet. Stattdessen muss der User scrollen, um die Information zu finden, die er am meisten braucht.

Zusätzlich fehlt eine serverseitige Berechnung, welche Planeten heute *persönlich* relevant sind (relativ zum Natal Chart). Das Frontend zeigt bisher alle 6 Planeten gleich — ohne Gewichtung, ohne Natal-Kontext, ohne Wu-Xing-Resonanz.

---

## Goal

Ein kohärenz-geführtes "Daily Chart" als primäre Dashboard-Erfahrung: Der User sieht auf den ersten Blick seinen Kohärenzindex, seine aktiven Planeten mit persönlicher Relevanz, und das kosmische Wetter — alles abgeleitet aus nachvollziehbaren Daten, nicht aus leerer Adjektivdekoration.

---

## Goals (messbar)

1. **Time-to-Value < 3 Sekunden**: Der User versteht innerhalb von 3 Sekunden nach Laden, wie sein Tag energetisch aussieht (Kohärenzindex + Day Mode sichtbar above the fold).

2. **Nachvollziehbarkeit 100%**: Jede angezeigte Aussage lässt sich auf einen mathematischen Wert zurückführen. Kein "feeling"-Text ohne Datenbasis. Keine Magic Numbers.

3. **Personalisierung via Natal Chart**: Aktive Planeten werden relativ zum persönlichen Geburtshoroskop berechnet. Ein User sieht nur die Planeten, die heute für *ihn* relevant sind — nicht alle 6.

4. **Ein API-Call für alles**: Das Frontend kann mit einem einzigen `POST /experience/daily?include=impact` alle Daten für das Daily Chart laden. Kein Polling, kein Zusammenstückeln aus 4 Hooks.

5. **Backward Compatibility**: Bestehende DailyResponse-Consumer (DashboardTagesEnergie, ResonanzSnapshot, CosmicWeatherCard) brechen nicht.

---

## Non-Goals

1. **Planetarium entfernen** — Das Planetarium bleibt, wird aber nach unten verschoben. Es ist kein Live-Indikator, sondern eine stabile Visualisierung. Kein Redesign des 3D-Renderers in dieser Phase.

2. **LLM-generierte Planeteninterpretationen in v1** — Phase 1 zeigt strukturierte Werte (planet, strength, bazi_resonance). Erzählende Sätze wie "Mars aktiviert dein natales Feuer" werden durch die bestehenden `fusion.synthesis`-Texte geliefert, nicht pro Planet einzeln. Einzelplanet-Narrative sind Future (P2).

3. **Night-Pulse Redesign** — Night-Pulse (Premium, 21–06 Uhr) existiert und wird durchgereicht, aber nicht visuell umgestaltet.

4. **Neue Soulprint-Berechnung** — Soulprint-Sektoren werden als Input verwendet, aber nicht neu berechnet oder erweitert.

5. **Brand Voice Guidelines dokumentieren** — Es gibt noch kein formales Brand-Voice-Dokument. Das Nachvollziehbarkeits-Prinzip wird als implizite Leitlinie verwendet. Eine formale Dokumentation ist ein separates Vorhaben.

---

## User Stories

### Als Bazodiac-User (Free + Premium)

- **US-1**: Als User will ich beim Öffnen des Dashboards sofort meinen Kohärenzindex sehen, damit ich weiß, wie mein Tag energetisch steht.
- **US-2**: Als User will ich sehen, welche Planeten heute speziell *mich* betreffen, damit ich verstehe, welche Energien gerade auf mich wirken.
- **US-3**: Als User will ich bei jedem Planeteneinfluss verstehen, *warum* er aktiv ist (Aspekt, Stärke, Wu-Xing-Resonanz), damit ich der Information vertrauen kann.
- **US-4**: Als User will ich das kosmische Wetter auf einen Blick sehen (geomagnetisch, solar, Sturm-Events), damit ich den äußeren Kontext meines Tages einordnen kann.
- **US-5**: Als User will ich einen kurzen Tagesimpuls-Text lesen, der sich aus den tatsächlichen Daten ableitet, nicht aus generischen Motivationsfloskeln.

### Als Bazodiac Premium-User

- **US-6**: Als Premium-User will ich Resonanz-Badges sehen, die anzeigen, welche Resonanzen heute besonders aktiv sind.
- **US-7**: Als Premium-User will ich eine Handlungsempfehlung (`fusion.action`) erhalten, die zum Kohärenzwert und den aktiven Einflüssen passt.

### Als FuFirE API Consumer (Frontend)

- **US-8**: Als Frontend will ich mit einem einzigen API-Call (`POST /experience/daily?include=impact`) alle Daten für das Daily Chart erhalten, um die Anzahl der Netzwerk-Requests zu minimieren.
- **US-9**: Als Frontend will ich optional nur die Impact-Daten abrufen (`POST /impact/active`), wenn ich die Narrative nicht brauche — z.B. für schnelle Planeten-Card-Updates.

---

## Architektur-Übersicht

### Systemgrenzen

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React 18 + Vite)                  │
│                                                                     │
│  Dashboard.tsx                                                      │
│  ├── KohaerenzHero        ← harmony_index, drivers, day_mode       │
│  ├── AktiveEinfluesseFusion ← active_planets[] mit bazi_resonance  │
│  ├── DayPulseExpanded     ← transit events (Text-Layer)            │
│  ├── DashboardTagesEnergie ← fusion.synthesis, space_weather pills │
│  ├── VibesSection                                                   │
│  ├── AgentSection         ← Levi/Eve Voice Agents                  │
│  ├── NatalSignaturStatic  ← Blueprint (Accordion)                  │
│  ├── DashboardBigFour     ← Sun, Moon, Asc, BaZi, WuXing         │
│  ├── BirthChartOrrery     ← Planetarium (verschoben nach unten)   │
│  ├── CosmicInfluenceSection ← Detail: Kp Gauge, Solar, Events     │
│  └── ...Footer/Modals                                               │
│                                                                     │
│  Daten-Hooks:                                                       │
│  ├── useDailyExperience() ← POST /experience/daily (mit impact)   │
│  ├── useActiveImpacts()   ← POST /impact/active (optional direkt) │
│  ├── useSpaceWeather()    ← GET /api/space-weather/extended (5min) │
│  └── useFusionSignal()    ← GET /api/transit-state/:userId (live)  │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         FuFirE API (Backend)                        │
│                                                                     │
│  POST /api/impact/active          ← Daten-Layer                    │
│  ├── Input: birth, soulprint, quiz, target_date                    │
│  ├── Berechnet: Natal Chart → Transit Aspekte → Filter aktive      │
│  ├── Berechnet: Wu-Xing Cosinus → harmony_index                   │
│  ├── Berechnet: BaZi Resonanz pro Planet                           │
│  ├── Holt: NOAA Space Weather                                      │
│  └── Output: ACTIVE_IMPACTS_v1 (Daten, keine LLM-Texte)          │
│                                                                     │
│  POST /api/experience/daily       ← Narrativ-Layer                 │
│  ├── Ruft intern /impact/active auf                                │
│  ├── Generiert: fusion.synthesis, western.summary, eastern.summary │
│  ├── Generiert: resonance_badges, push_text                       │
│  └── Output: DAILY_EXPERIENCE_v2 (Daten + LLM-Narrative)         │
│                                                                     │
│  Bestehend (unverändert):                                           │
│  ├── POST /api/experience/bootstrap                                │
│  ├── POST /api/experience/signature-delta                          │
│  ├── GET  /api/space-weather/extended                              │
│  └── GET  /api/transit-state/:userId                               │
└─────────────────────────────────────────────────────────────────────┘
```

### Datenfluss Daily Chart

```
User öffnet Dashboard
       │
       ▼
POST /experience/daily { include: ["impact"] }
       │
       ├── FuFirE berechnet Natal Chart (aus birth-Daten)
       ├── FuFirE holt heutige Transite (Ephemeris-Engine)
       ├── FuFirE vergleicht Transit ↔ Natal → active_planets[]
       ├── FuFirE berechnet Wu-Xing Cosinus → harmony_index
       ├── FuFirE berechnet BaZi Resonanz pro Planet
       ├── FuFirE holt NOAA Space Weather → space_weather{}
       ├── FuFirE generiert Resonanz-Badges
       ├── LLM generiert fusion.synthesis (aus allen Daten)
       ├── LLM generiert western.summary + eastern.summary
       │
       ▼
Response: DAILY_EXPERIENCE_v2
       │
       ▼
Frontend rendert Daily Chart:
  1. KohaerenzHero    ← harmony_index, day_mode, intensity, drivers
  2. Planet Cards      ← active_planets[] (nur persönlich relevante)
  3. Day Pulse         ← transit events Text
  4. Tagesimpuls       ← fusion.synthesis + pills
  5. Resonanz-Badges   ← resonance_badges[] (Premium)
```

---

## Requirements

### Must-Have (P0) — Daily Chart MVP

#### P0-1: KohaerenzHero als erstes Dashboard-Element
**Beschreibung:** Der Kohärenzindex (harmony_index × 100) ist das erste, was der User nach dem Page Header sieht. Darunter zeigt ein Driver Strip die 4 Haupttreiber: Geomagnetik, Solardruck, Transit-Resonanz, Tagesfeld.

**Akzeptanzkriterien:**
- [ ] Kohärenzindex wird als Zahl 0–100 in einem SVG-Ring angezeigt
- [ ] Darunter steht ein neutrales Label ("Hohe/Mittlere/Niedrige Übereinstimmung")
- [ ] Driver Strip zeigt 4 Pills mit calm/active/tense Farbkodierung
- [ ] Skeleton-Loader während Daten laden
- [ ] Funktioniert in Planetarium (dark) und Morning (light) Mode
- [ ] Kein semantisch aufgeladener Text ohne Datenbasis

**Status:** ✅ Implementiert (KohaerenzHero.tsx + CSS)

#### P0-2: Dashboard-Reihenfolge Coherence-First
**Beschreibung:** Die Section-Reihenfolge in Dashboard.tsx folgt der Daily-Chart-Leselogik: Volatiles zuerst, Stabiles unten.

**Akzeptanzkriterien:**
- [ ] Reihenfolge: Header → KohaerenzHero → Planeten → DayPulse → Tagesimpuls → Vibes → Agents → Blueprint → BigFour → Planetarium → Detail → Footer
- [ ] Tour-Sentinels zeigen auf die neuen Positionen
- [ ] fadeIn-Delays sind sequentiell
- [ ] Keine visuellen Regressions in bestehenden Sections

**Status:** ✅ Implementiert (Dashboard.tsx reordered)

#### P0-3: API Endpoint POST /impact/active
**Beschreibung:** Neuer Daten-Endpunkt der alle persönlich relevanten Einflüsse für einen User an einem Tag liefert. Keine LLM-Texte, nur nachvollziehbare Daten.

**Akzeptanzkriterien:**
- [ ] Request akzeptiert: birth (date, time, tz, lat, lon), soulprint_sectors, quiz_sectors, target_date, locale
- [ ] Response enthält: harmony_index, day_mode, intensity, active_planets[], space_weather{}, space_weather_score, resonance_badges[], top_sector, day_master, evidence{}
- [ ] `active_planets` enthält nur Planeten mit orb ≤ 8° zu einem Natal-Aspekt
- [ ] Jeder Planet hat: planet, aspect, orb, strength, is_retrograde, natal_position, transit_position, sector, weight, bazi_resonance
- [ ] `bazi_resonance` pro Planet: element, type (gleichklang/naehrung/kontrolle/neutral), intensity (gering/mittel/stark)
- [ ] `evidence` enthält resonance_formula als String + alle Berechnungsparameter
- [ ] Kein `feeling`-Feld, keine vorgenerierten Interpretationstexte
- [ ] `strength` Klassifizierung: high (orb < 3°), medium (3–5°), low (5–8°)
- [ ] Error Responses: 400, 401, 422, 503 (mit partial=true bei Space-Weather-Ausfall)

**API Contract:** `docs/api-contracts/impact-active-v1.md`

**Status:** 📋 Spec fertig, Implementierung durch FuFirE Agent

#### P0-4: API Endpoint POST /experience/daily v2
**Beschreibung:** Erweiterung des bestehenden Daily-Endpunkts um optionalen `impact`-Block und `include`-Parameter.

**Akzeptanzkriterien:**
- [ ] Neuer Request-Parameter: `include: ["impact"]` (optional, default: [])
- [ ] Wenn gesetzt: Response enthält `impact`-Block identisch mit `/impact/active` Response
- [ ] Bestehende Response-Felder bleiben alle erhalten: western, eastern, fusion, meta, resonance_badges, space_weather_score, top_sector
- [ ] Ohne `include` ist die Response identisch mit v1 (backwards compatible)
- [ ] `fusion.synthesis` muss sich aus den Impact-Daten ableiten (Nachvollziehbarkeit)
- [ ] `fusion.synthesis` darf keine Adjektive verwenden, die nicht durch einen Wert in `impact` oder `evidence` belegt sind

**API Contract:** `docs/api-contracts/experience-daily-v2.md`

**Status:** 📋 Spec fertig, Implementierung durch FuFirE Agent

#### P0-5: Frontend-Integration der neuen API-Daten
**Beschreibung:** AktiveEinfluesseFusion zeigt nur noch Planeten aus `impact.active_planets[]` an, statt immer alle 6. Jede Karte zeigt BaZi-Resonanz, Strength und Aspekt.

**Akzeptanzkriterien:**
- [ ] AktiveEinfluesseFusion erhält `active_planets` als Prop statt hardcodierten 6er-Pool
- [ ] Leerer Zustand wenn keine Planeten aktiv: "Heute keine starken Planeteneinflüsse auf dein Chart"
- [ ] Planet Cards zeigen: Planet-Name, Aspekt, Strength-Indikator, BaZi Element + Resonanz-Typ + Intensität
- [ ] Retrograde-Indikator (℞) wenn `is_retrograde: true`
- [ ] Card-Styling richtet sich nach `bazi_resonance.type` + `intensity` (bestehendes RESONANCE_CARD_STYLE)
- [ ] Kein `feeling`-Text auf den Karten — stattdessen strukturierte Labels

**Status:** 🔲 Offen — blockiert durch P0-3 (API muss zuerst liefern)

#### P0-6: KohaerenzHero bezieht Daten aus Impact Response
**Beschreibung:** KohaerenzHero verwendet `impact.harmony_index` und `impact.space_weather` statt separate Hooks.

**Akzeptanzkriterien:**
- [ ] harmony_index, day_mode, intensity kommen aus der Impact-Response
- [ ] Driver Strip verwendet `impact.space_weather.kp_index`, `impact.space_weather.solar_pressure`, `impact.active_planet_count`, `impact.day_mode`
- [ ] Fallback auf bestehende Hooks wenn Impact-Response nicht verfügbar (graceful degradation)

**Status:** 🔲 Offen — blockiert durch P0-3

---

### Nice-to-Have (P1) — Fast Follows

#### P1-1: LLM-generierte Kohärenz-Labels
**Beschreibung:** FuFirE liefert ein `coherence_label`-Feld mit semantisch reichem, aber nachvollziehbar fundiertem Label. Ersetzt die neutralen Fallback-Labels ("Hohe Übereinstimmung").

**Akzeptanzkriterien:**
- [ ] API liefert `coherence_label: { title, subtitle, source: "llm" }` in der Impact-Response
- [ ] Frontend zeigt LLM-Label wenn vorhanden, Fallback wenn nicht
- [ ] Jedes LLM-Label muss auf `evidence`-Werte referenzieren können

#### P1-2: Animated Coherence Ring
**Beschreibung:** Der SVG-Ring animiert von 0 auf den aktuellen Wert beim Laden. Glüh-Effekt pulsiert sanft bei `day_mode: pulse`.

#### P1-3: GLPL Time-Series Chart
**Beschreibung:** Kleiner Sparkline-Graph unter dem Kohärenz-Ring der den harmony_index über die letzten 7 Tage zeigt. Gibt dem User Kontext ob sein heutiger Wert hoch oder niedrig ist relativ zur Woche.

#### P1-4: Starfield Header Banner
**Beschreibung:** Subtiler animierter Sternenhintergrund hinter dem KohaerenzHero — visuell astro-artig, aber nicht ablenkend.

#### P1-5: Push-Notification bei pushworthy=true
**Beschreibung:** Wenn `fusion.pushworthy: true`, wird `fusion.push_text` als Native Push gesendet. Einmal täglich, morgens.

---

### Future Considerations (P2)

#### P2-1: Per-Planet LLM-Narrative
**Beschreibung:** Jede aktive Planeten-Karte bekommt einen eigenen Interpretationssatz, generiert vom LLM, der planet + strength + bazi_resonance in einen natürlichsprachlichen Satz übersetzt. Z.B. "Deine Mars-Energie ist heute stark — Feuer-Gleichklang mit deinem Tagesmeister."

**Architektur-Implikation:** FuFirE muss pro active_planet ein `narrative`-Feld generieren können. Die Nachvollziehbarkeitsregel gilt: Jeder Teil des Satzes muss auf ein Datenfeld zeigen.

#### P2-2: Erweiterte Planeten-Pool (Uranus, Neptun, Pluto)
**Beschreibung:** MVP beschränkt sich auf Moon, Mercury, Venus, Mars, Jupiter, Saturn. Langfristig sollten die äußeren Planeten einbezogen werden, die langsamer aber tiefgreifender wirken.

#### P2-3: Intra-Day Updates
**Beschreibung:** Moon-Transit-Events können sich innerhalb eines Tages ändern (Mond bewegt sich ~13°/Tag). Eine Echtzeit-Aktualisierung der Moon-Card via WebSocket oder kurzes Polling wäre denkbar.

#### P2-4: Brand Voice Guidelines als Dokument
**Beschreibung:** Formale Dokumentation der Nachvollziehbarkeits-Regel, Tonalitäts-Leitlinie (keine leeren Adjektive, keine Angstmache, keine Pseudo-Wissenschaft, Empowerment statt Determinismus) als eigenständiges Dokument für alle Agents und LLM-Prompts.

#### P2-5: Comparison View (Heute vs. Gestern)
**Beschreibung:** User kann zwischen Tagen wechseln und sehen, wie sich der Kohärenzindex und die aktiven Planeten verändert haben. Delta-Anzeige.

---

## Success Metrics

### Leading Indicators (Tage nach Launch)

| Metrik | Target | Stretch | Messung |
|--------|--------|---------|---------|
| Above-the-fold Visibility | Kohärenzindex ist in 100% der Sessions above the fold | — | Viewport-Check via Analytics |
| Time to First Meaningful Paint | < 2s für KohaerenzHero + Driver Strip | < 1.5s | Web Vitals LCP |
| API Response Time /impact/active | p95 < 800ms | p95 < 500ms | Server-side Monitoring |
| API Response Time /experience/daily | p95 < 2s (inkl. LLM) | p95 < 1.5s | Server-side Monitoring |
| Active Planet Count Distribution | Ø 1.5–3 aktive Planeten pro User/Tag | — | API Response Logging |
| Error Rate | < 1% 5xx auf neuen Endpoints | < 0.5% | Server Monitoring |

### Lagging Indicators (Wochen nach Launch)

| Metrik | Target | Stretch | Messung |
|--------|--------|---------|---------|
| Daily Return Rate | +15% vs. Pre-Launch Baseline | +25% | Supabase Auth Analytics |
| Scroll Depth | 70% der Sessions scrollen bis Agent-Section | 80% | Scroll Tracking |
| Premium Conversion | +5% Upgrade-Rate (Resonanz-Badges, Action-Text als Teaser) | +10% | Stripe Dashboard |
| Support Tickets "was bedeutet..." | -30% (weil Nachvollziehbarkeit die Frage beantwortet) | -50% | Support Inbox |

---

## Open Questions

| # | Frage | Wer | Blocking? |
|---|-------|-----|-----------|
| ~~OQ-1~~ | ~~Soll `/impact/active` cacheable sein?~~ **Entschieden:** Ja, 15-Min-TTL. Space Weather ändert sich selten, ist aber als Input-Variable des Kohärenzindex potenziell veränderbar (CME-Arrivals, Kp-Sprünge). 15 Min ist der Kompromiss: häufig genug für Sturm-Events, selten genug für API-Last. Transite treiben keine Invalidierung (ändern sich intra-day kaum außer Mond). | — | Gelöst |
| ~~OQ-2~~ | ~~Wie verhält sich `active_planets` bei Neu-Usern ohne Natal Chart?~~ **Entschieden:** Natal Chart ist Pflicht (Ort required, Zeit default 12:00). Kein Fallback nötig. Bei fehlender Uhrzeit: Hinweis auf Ungenauigkeit bei Mond/Aszendent, aber Chart wird vollständig berechnet. | — | Gelöst |
| ~~OQ-3~~ | ~~Soll `fusion.synthesis` explizit auf `active_planets` referenzieren?~~ **Entschieden:** Ja. `fusion.synthesis` muss die aktiven Planeten beim Namen nennen und ihre Wirkung aus den Impact-Daten ableiten. Beispiel: "Mars und Jupiter sind heute aktiv — Mars aktiviert dein natales Feuer (Konjunktion, orb 2.4°), Jupiter öffnet Wachstum durch Nährung deines Holz-Elements." Keine abstrakten Zusammenfassungen ohne Planetenbezug. | — | Gelöst |
| ~~OQ-4~~ | ~~`useFusionSignal` Polling (800ms) — Deprecation oder Parallelnutzung?~~ **Entschieden:** Parallelnutzung. `useFusionSignal` bleibt aktiv für Live-Transit-Events (resonance_jump, cluster_complete, equilibrium_shift). Impact-Daten aus `/experience/daily` sind der Tages-Snapshot. Beide laufen nebeneinander — useFusionSignal für Echtzeit-Granularität, Impact für das Gesamtbild. Kein Deprecation. | — | Gelöst |
| ~~OQ-5~~ | ~~Resonanz-Formel hardcoded oder konfigurierbar?~~ **Entschieden:** Konfigurierbar. Die Gewichte `harmony * 0.65 + solar_pressure * 0.35` werden als Parameter in der API-Config geführt, nicht hardcoded. Das `evidence`-Objekt liefert die aktuelle Formel als String mit, damit das Frontend sie anzeigen kann. Erlaubt spätere Anpassung ohne Redeployment. | — | Gelöst |

---

## Timeline & Dependencies

### Phase A — Fertig ✅
- Dashboard Section Reorder (coherence-first)
- KohaerenzHero Komponente (Fallback-Modus)
- CSS Styles (dark + light)
- API Contract Specs geschrieben

### Phase B — FuFirE API (nächster Schritt)
- Implementierung `POST /impact/active` (FuFirE Agent)
- Erweiterung `POST /experience/daily` mit `include`-Parameter
- **Dependency:** Ephemeris-Engine muss Transit ↔ Natal Aspekte berechnen können
- **Dependency:** NOAA Space Weather Pipeline muss in FuFirE integriert sein

### Phase C — Frontend-Integration
- AktiveEinfluesseFusion umbauen auf `active_planets[]` Prop
- KohaerenzHero auf Impact-Response umstellen
- Neuen `useDailyChart()` Hook schreiben der `/experience/daily?include=impact` aufruft
- Bestehende Hooks (useFusionSignal, useSpaceWeather) als Fallback behalten
- **Dependency:** Phase B abgeschlossen

### Phase D — Polish & P1s
- Animated Coherence Ring
- LLM-generierte Kohärenz-Labels
- Push-Notifications
- GLPL Time-Series (wenn API historische harmony_index Werte cachen kann)

---

## Referenzen

| Dokument | Pfad |
|----------|------|
| Wireframe | `docs/wireframes/dashboard-mockup-revision-coherence-first.md` |
| Implementierungsplan (Phase A) | `docs/plans/2026-04-12-coherence-first-dashboard.md` |
| API Contract /impact/active | `docs/api-contracts/impact-active-v1.md` |
| API Contract /experience/daily v2 | `docs/api-contracts/experience-daily-v2.md` |
| KohaerenzHero Component | `src/components/dashboard/KohaerenzHero.tsx` |
| Dashboard (reordered) | `src/components/Dashboard.tsx` |
| Experience Schemas | `src/lib/schemas/experience.ts` |
| Transit State Schema | `src/lib/schemas/transit-state.ts` |

# Bazodiac Backlog — Ben's Eingangskanal

Dieses File ist dein direkter Draht ins Agent-Team.
Du editierst es von überall — GitHub Web, iPhone, Notion-Sync, oder Voice-to-Text.
Der Retro-Agent liest es nach jedem Sprint und konvertiert offene Einträge in GitHub Issues.

---

## Wie du Einträge machst

Jeder Eintrag hat ein Präfix:

- `BUG:` → Fehler, etwas funktioniert nicht wie erwartet
- `FEAT:` → Neue Funktion oder User Story
- `REFACTOR:` → Technische Schulden, Umstrukturierung
- `IDEA:` → Halbfertige Vision, noch kein Issue (Ben denkt laut)
- `FRAGE:` → Klärungsbedarf vor Umsetzung (Agent antwortet im Issue)

Formatierung: eine Zeile reicht. Agenten fragen nach wenn nötig.

---

## Offen (→ noch kein GitHub Issue)

<!-- Ben schreibt hier rein — Agenten picken ab und erstellen Issues -->

- FEAT: Levi soll nach 3 Sessions automatisch eine Zusammenfassung des Nutzerprofils schicken
- IDEA: Tages-Signatur als Widget für iOS Lock Screen (später, erstmal Konzept)
- FRAGE: Soll die Bloom-Intensität von der Solar-Aktivität abhängen? Wäre visuell sehr stark

> **📋 Detaillierte Sprint-Planung: [FEATURE_SPRINTS.md](FEATURE_SPRINTS.md)**
> **📊 Datenflussmodell: [docs/bazodiac-dataflow.html](docs/bazodiac-dataflow.html)**

---

## In Bearbeitung (→ GitHub Issue existiert)

| Issue | Typ | Titel | Sprint | Status |
|-------|-----|-------|--------|--------|
| #115 | FEAT | InfluenceGauges verdrahten | S02 | Ready |
| #116 | FEAT | Levi System Prompt V2 | S02 | Manuell (Ben) |
| #117 | FEAT | InfluenceGauges Transit-Daten | S03 | Ready |
| #118 | FEAT | Daily Insight Modal Gemini | S03 | Ready |
| #119 | FEAT | Planetarium Hover-States | S03 | Ready |
| #132 | FEAT | Archetypen-System 36 Formen (12×3) | S03 | Ready |
| #137 | BUG | Nochmal-Button entfernen (Quizze sind einmalig) | Bug-Pass P5 | ✅ Done |
| #138 | BUG | Quiz-Namen zeigen Pfadreferenzen statt echte Namen | Bug-Pass P5 | ✅ Done |
| #139 | BUG | "Die Form" → Signatur + Kachel-Größen angleichen | Bug-Pass P5 | ✅ Done |
| #140 | BUG | Doppeltes X im Quiz-Overlay | Bug-Pass P5 | ✅ Done |
| #141 | BUG | Signatur (FusionRing) statisch — lebendige Dauerbewegung | Bug-Pass P5 | ✅ Done |
| #120 | FEAT | FuFirE API Contracts (S04-01) | S04 | ✅ Done |
| #121 | FEAT | GCB Builder (S04-02) | S04 | ✅ Done |
| #122 | FEAT | Master Signal Dimensionsraum (S04-03) | S04 | ✅ Done |
| #133 | FEAT | Insignien-System | S04 | Ready |
| #123 | FEAT | Stripe Checkout | S05 | Blocked: Testkey |
| #124 | FEAT | Bloom Fine-Tuning | S05 | Blocked: Ben's Spec |
| #125 | FEAT | Performance Audit | S05 | Ready |
| #135 | FEAT | Quiz-Cluster Abschluss Animation | S05 | Ready |
| #126 | BUG | NOAA Adapter v2 — DEADLINE 31.03.2026 | S06 | ✅ Done |
| #127 | FEAT | DONKI Extended — CME, WSA-ENLIL, SEP, HSS | S06 | ✅ Done |
| #128 | FEAT | Solar Pressure Score → Ring Modulation (×1.5) | S06 | ✅ Done |
| #142 | FEAT | NOAA SWPC — X-ray, Proton, Forecast Endpoints | S06 | ✅ Done |
| #143 | FEAT | GET /api/space-weather/extended (Aggregator) | S06 | ✅ Done |
| #144 | FEAT | POST /api/contribution/space-weather | S06 | ✅ Done |
| #145 | FEAT | sky.bazodiac.space — Solar Pressure Widget | S06 | ✅ Done |
| #129 | FEAT | i18n Audit | S07 | Ready |
| #130 | FEAT | Share-Flow Social | S07 | Ready |
| #131 | FEAT | A/B Test Framework | S07 | Ready |
| #134 | BUG | Quiz i18n — English Translation | S07 | Ready |
| #136 | FEAT | Design Re-Work Sonnenzeichen/Tier/Wuxing | — | Blocked: Ben's Spec |
| — | FEAT | Bazodiac-Engine: JSON-Schema ✅ + FusionEngine Service (West×Ost→12 Gewichtungen) | S08 | ✅ Schema done, Code S08-02 |
| — | FEAT | Bazodiac-Engine: Fusion(West×Ost)→Bazodiac Prior (ersetzt Planet→Archetyp) | S08 | Ready → S08-02/03 |
| — | FEAT | Bazodiac-Engine: Aspekt-Modifikatoren (Transit→Zustandsverschiebung) | S09 | Ready → S09-03 |
| — | FEAT | Bazodiac-Engine: Quiz-Scoring → Bazodiac States (Running Average, decay 0.95) | S08 | Ready → S08-05 |
| — | FEAT | Bazodiac-Engine: 4-Score Matching (Resonanz, Chemie, Stabilität, Entwicklungsdruck) | S12 | Ready → S12-01 |
| — | FEAT | Bazodiac-Engine: Intro/Extro als Ausdrucksmodifikator (nicht als Typ) | S09 | Ready |
| — | FEAT | Bazodiac-Engine: 7 Need-Vektor Berechnung aus Bazodiac-Gewichtungen | S12 | Ready → S12-02 |
| — | FEAT | Bazodiac-Engine: Shadow-Activation Matching zwischen Partnern | S12 | Ready → S12-03 |
| — | FRAGE | ~~Archetypen: 12 Basis vs. 16 Basis?~~ → **ENTSCHIEDEN: 12 Bazodiacs × 3 Zustände** | S08 | ✅ Entschieden |
| — | FRAGE | ~~Archetypen: Mythic Skins — griechisch only oder kulturübergreifend?~~ → **ENTSCHIEDEN: 4+ Skin-Sets (Griechisch, Chinesisch, Superhelden, Systems Poetry)** | S09 | ✅ Entschieden |
| — | FEAT | Partnership: DB-Schema (`partnerships`, `synastrie_cache`, `composite_cache`) + Migrations | S08 | Ready |
| — | FEAT | Partnership: Invite-Flow (`/api/partnership/invite` + `/accept/:token`) (R-01) | S08 | Ready |
| — | FEAT | Partnership: Synastrie-Engine `synastrie.compute()` — Interaspekte, Haus-Overlays, Dominant Themes (R-02) | S08 | Ready |
| — | FEAT | Partnership: Synastrie-API `POST /api/partnership/synastrie` + Auth + Caching (R-03) | S08 | Ready |
| — | FEAT | Partnership: Contribution Event Schema `partnership.synastrie.v1` (R-06) | S08 | Ready |
| — | FRAGE | OQ-1: Häusersystem — Placidus (wie FuFirE) oder Koch? | S08 | Blocked: Ben's Entscheidung |
| — | FRAGE | OQ-2: Consent-Modell — Synastrie ohne Partner-Account (manuelle Geburtsdaten)? | S08 | Blocked: Ben's Entscheidung |
| — | FRAGE | OQ-5: Orb-Toleranzen Interaspekte (±5° eng vs. ±8° weit) | S08 | Blocked: Ben's Entscheidung |
| — | FRAGE | OQ-6: Nebenaspekte (Quincunx 150°, Halbsextil 30°) oder nur 5 Hauptaspekte? | S08 | Blocked: Ben's Entscheidung |
| — | FEAT | Partnership: Dual-Ring-Visualisierung — 2 Signaturen überlagert in FusionRingCanvasV2 (R-04) | S09 | Ready |
| — | FEAT | Partnership: Interaspekt-Linien (Trigon=blau, Quadrat=rot, Konjunktion=gold) + Touch-Detail (R-04) | S09 | Ready |
| — | FEAT | Partnership: Haus-Overlay-Sektoren im äußeren Ring (R-04) | S09 | Ready |
| — | FEAT | Partnership: Narrativ-Engine Synastrie — Top-5 Interaspekte + Haus-Overlay Texte, Jung-Psychologie (R-05) | S09 | Ready |
| — | FEAT | Partnership: Free/Premium-Split — Top-3 Free, Full Synastrie Premium (R-05) | S09 | Ready |
| — | FRAGE | OQ-3: Narrative — feste Templates oder Gemini-generiert pro Paar? | S09 | Blocked: Ben's Entscheidung |
| — | FEAT | Partnership: Komposit-Engine `komposit.compute()` — Halbsummen, Beziehungs-Sonne/Mond/AC (R-07) | S10 | Ready |
| — | FEAT | Partnership: Komposit-API `POST /api/partnership/komposit` + Premium-Gate (R-07) | S10 | Ready |
| — | FEAT | Partnership: Kombin-Engine (Davison-Chart) — zeitl./räuml. Mittelpunkt, Radix via FuFirE (R-08) | S10 | Ready |
| — | FEAT | Partnership: Kombin-API `POST /api/partnership/kombin` + Premium-Gate (R-08) | S10 | Ready |
| — | FEAT | Partnership: 7. Haus Tiefenanalyse — Projektion, Schatten, Integrationspfad (R-09) | S10 | Ready |
| — | FEAT | Partnership: Achse 2/8 — Geben/Nehmen-Balance, Ressourcen-Dynamik (R-09) | S10 | Ready |
| — | FEAT | Partnership: Transit-Overlay 7./8. Haus — pulsierende Markierungen im Dual-Ring (R-10) | S11 | Ready |
| — | FEAT | Partnership: Transit-Narrative pro Phase + Push-Notification (opt-in) (R-10) | S11 | Ready |
| — | FEAT | Partnership: Premium-Gate Integration Stripe — Komposit/Kombin/Transite hinter Paywall | S11 | Ready |
| — | FEAT | Partnership: Erfolgsmetriken-Tracking — Invite-Rate, Accept-Rate, Premium-Uplift | S11 | Ready |
| — | FRAGE | OQ-4: Synastrie als 4. Signal neben N/Q/G oder komplett getrennt? | S10 | Blocked: Ben's Entscheidung |

---

## Erledigt (Archiv)

| Issue | Titel | Sprint | Datum |
|-------|-------|--------|-------|
| #109–114 | Bug-Pass P1–P4 | S01 | 2026-03 |

---

## Wie Agenten dieses File nutzen

1. **Retro-Agent**: Liest "Offen"-Sektion nach jedem Sprint → erstellt GitHub Issues für alles mit Typ BUG/FEAT/REFACTOR
2. **Lead-Agent**: Liest die Tabelle zur Sprint-Planung
3. **Du**: Editierst dieses File von überall, commitest per GitHub Mobile oder Web

### Schnellste Eingabe von unterwegs

**Option 1 — GitHub Web (empfohlen heute)**
→ github.com/DYAI2025/Astro-Noctum → Edit BACKLOG.md → Commit

**Option 2 — GitHub Mobile App**
→ App installieren → Repo öffnen → BACKLOG.md → Stift-Icon

**Option 3 — ZeroClaw (wenn deployed)**
→ WhatsApp/Telegram an deinen ZeroClaw-Bot:
  "bug: Levi sagt Hallo obwohl User schon bekannt ist"
→ ZeroClaw erstellt GitHub Issue + trägt hier ein

**Option 4 — Siri Shortcut (5min Setup)**
→ Apple Shortcuts App → "GitHub Issue erstellen" Shortcut
→ "Hey Siri, Bazodiac Bug: [Beschreibung]"
→ GitHub API → Issue erstellt, Label gesetzt

---

## Setup-Pfad (Mac)

Codebase liegt unter: `/Users/benjaminpoersch/Projects/codebase`

```bash
pip3 install clawteam
cp ~/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/docs/bazodiac-clawteam-config.json ~/.clawteam/config.json
# dann aus dem codebase-Verzeichnis:
clawteam start Bazodiac-WebApp/Astro-Noctum/bazodiac-swarm.toml --task "GitHub Issue #126"
```

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
| #137 | BUG | Nochmal-Button entfernen (Quizze sind einmalig) | Bug-Pass P5 | **In Progress** |
| #138 | BUG | Quiz-Namen zeigen Pfadreferenzen statt echte Namen | Bug-Pass P5 | **In Progress** |
| #139 | BUG | "Die Form" → Signatur + Kachel-Größen angleichen | Bug-Pass P5 | **In Progress** |
| #140 | BUG | Doppeltes X im Quiz-Overlay | Bug-Pass P5 | **In Progress** |
| #141 | BUG | Signatur (FusionRing) statisch — lebendige Dauerbewegung | Bug-Pass P5 | **In Progress** |
| #120 | FEAT | GCB Builder heuristic_v1 | S04 | Blocked: FuFirE-Zugang |
| #121 | FEAT | Quiz-Flow Master Signal | S04 | Ready |
| #122 | FEAT | BAFE signature-delta | S04 | Ready |
| #133 | FEAT | Insignien-System | S04 | Ready |
| #123 | FEAT | Stripe Checkout | S05 | Blocked: Testkey |
| #124 | FEAT | Bloom Fine-Tuning | S05 | Blocked: Ben's Spec |
| #125 | FEAT | Performance Audit | S05 | Ready |
| #135 | FEAT | Quiz-Cluster Abschluss Animation | S05 | Ready |
| #126 | BUG | NOAA Adapter v2 — DEADLINE 31.03.2026 | S06 | SOFORT |
| #127 | FEAT | DONKI Extended — CME, WSA-ENLIL, SEP, HSS | S06 | Ready |
| #128 | FEAT | Solar Pressure Score → Ring Modulation (×1.5) | S06 | Ready |
| #142 | FEAT | NOAA SWPC — X-ray, Proton, Forecast Endpoints | S06 | Ready |
| #143 | FEAT | GET /api/space-weather/extended (Aggregator) | S06 | Ready |
| #144 | FEAT | POST /api/contribution/space-weather | S06 | Ready |
| #145 | FEAT | sky.bazodiac.space — Solar Pressure Widget | S06 | Ready |
| #129 | FEAT | i18n Audit | S07 | Ready |
| #130 | FEAT | Share-Flow Social | S07 | Ready |
| #131 | FEAT | A/B Test Framework | S07 | Ready |
| #134 | BUG | Quiz i18n — English Translation | S07 | Ready |
| #136 | FEAT | Design Re-Work Sonnenzeichen/Tier/Wuxing | — | Blocked: Ben's Spec |

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

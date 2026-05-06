# DEC-bazodiac-engine-archived: Python Reference Engine archiviert

**Status**: Active

**Category**: Architecture

**Scope**: backend | shared

**Source**: n/a (Repo-Hygiene aus `/SDLC-decompose` Re-Eval 2026-05-01)

**Last updated**: 2026-05-01

## Context

Der Top-Level-Ordner `bazodiac_engine/` enthielt seit den frühen Tagen des Projekts eine Python-Reference-Implementation der Master-Signal-Math (`master_signal.py`, `gcb_engine.py`, `test_engine.py`, `ARCHITECTURE.md`). Production-Code lebt seit langem in zwei JS/TS-Ports:

- **`packages/shared/src/signatur/bazodiac-engine.ts`** — TS-Port der Signatur-Engine, von `frontend` und `mobile` konsumiert.
- **`server.mjs`** + `src/lib/master-signal/` — Backend-Pfad, von der `api-server`-Component verwendet.

Die Python-Variante wurde zuletzt am **2026-03-16** angefasst und hat **keine Production-Imports** in JS/TS, **keine CI-Test-Pipeline** und **keine Build-/Deploy-Referenzen**. Sie wurde aber weiterhin in `2-design/architecture.md` als "Location" und in den References gelistet — was Future-Agents (und den Autor in 6 Monaten) dazu verleitet, sie für aktuelle Source-of-Truth zu halten.

## Decision

Der Python-Code wird per `git mv` nach `archive/bazodiac_engine/` verschoben. Die Git-Historie bleibt vollständig intakt (Renames, kein Delete). `archive/` ist der etablierte Ablagepfad für nicht-aktiven Repo-Beifang im Projekt.

Die Production-Source-of-Truth für die Master-Signal-Math ist:

1. **`packages/shared/src/signatur/bazodiac-engine.ts`** für Client-seitige Berechnungen (Web + Mobile).
2. **`server.mjs`** + `src/lib/master-signal/` für Server-seitige Berechnungen.

Die TS- und JS-Ports drift-überwachung läuft weiterhin via `DEC-narrative-engine-hybrid` (manuelles Mirror-Pattern für Server-only-Logik).

## Enforcement

### Trigger conditions

- **Design phase**: wenn jemand "Master Signal", "GCB", "natal-projection" oder "bazodiac engine" referenziert → auf TS-Port zeigen, nicht auf `archive/`.
- **Code phase**: wenn ein Task neue Master-Signal-Math hinzufügt → in `packages/shared/src/signatur/` (cross-platform) oder `src/lib/master-signal/` (frontend-only) schreiben, nicht in `archive/`.

### Required patterns

- Neue Engine-Logik → `packages/shared/src/signatur/` (TypeScript, wird von Web + Mobile + indirekt Server konsumiert).
- Änderungen an Server-only-Logik in `server.mjs` müssen die TS-Variante in `packages/shared/` aktuell halten (siehe `DEC-narrative-engine-hybrid`).

### Required checks

1. Vor neuer Engine-Arbeit: `archive/bazodiac_engine/` *nur* zur mathematischen Verifikation des TS-Ports lesen — nicht als Live-Source bearbeiten.
2. Bei Drift zwischen TS-Port und Python-Reference: TS-Port ist autoritativ (Production), Python ist obsolete.

### Prohibited patterns

- Neue Imports oder Builds, die `archive/bazodiac_engine/` referenzieren.
- Re-Aktivierung als Top-Level-Component ohne neuen Decision-Record (Reverse-Decision).
- Erweiterung der Python-Files (Bug-Fixes oder Features) — solche Arbeit gehört in den TS-Port.

## Consequences

- ✅ Repo-Top-Level wird klarer: aktive Components vs. Archiv-Material sind getrennt.
- ✅ `architecture.md` reflektiert die echte Source-of-Truth (TS-Port).
- ⚠️ Externer Code, der `bazodiac_engine/` per Pfad referenziert (sehr unwahrscheinlich — gab keine Production-Imports), würde brechen. Falls jemand das Python-Modul für Reference-Verifikation will, ist es unter `archive/bazodiac_engine/` weiter lesbar.
- ⚠️ Falls jemand künftig Python-basierte Engine-Pipeline (z. B. CI-Validierung des TS-Ports gegen Python-Reference) wieder einführen will, müsste das Modul re-aktiviert werden — neuer Decision-Record nötig.

## Related

- [`DEC-narrative-engine-hybrid`](DEC-narrative-engine-hybrid.md) — Hybrid Narrative Engine (Server-only-Logik mirrored in JS).
- [`DEC-signatur-v3-bipolar-trails`](DEC-signatur-v3-bipolar-trails.md) — Aktive Signatur-Engine-Spezifikation (TS).
- `3-code/shared/CLAUDE.component.md` — Component-Doc für `@bazodiac/shared` mit aktivem Engine-Modul.

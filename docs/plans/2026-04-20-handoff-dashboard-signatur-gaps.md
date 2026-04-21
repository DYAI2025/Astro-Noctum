# Arbeitsauftrag für Claude Code — Sprint: Dashboard & Signatur Gaps

> **Auftraggeber:** Ben (Product Owner / Projektmanager Bazodiac)
> **Erstellt von:** Cowork-Planner-Session (Opus 4.7), 2026-04-20
> **Plan-Referenz (Source of Truth):** `docs/plans/2026-04-20-dashboard-signatur-gaps.md`
> **Memory-Referenz:** `docs/KOHAERENZ_INDEX.md`, `docs/BAZODIAC.md`, `docs/docu/STRUCTURE.md`
> **Sprint-Typ:** Hygiene + sichtbare Produktqualität
> **Priorität:** vor Quiz-Signatur-Coupling-Sprint (räumt UI-Fehler, bevor neue Substanz drauflegt)

---

## 1. Dein Auftrag, Claude Code

Lies den Plan unter `docs/plans/2026-04-20-dashboard-signatur-gaps.md` als verbindliche Spezifikation. Führe alle 12 Phasen in der dort festgelegten Reihenfolge durch — Mikro-Phasen-Pattern, maximal 5 Dateien pro Phase, HALT-Punkte respektieren.

Du arbeitest **nicht autonom bis zum Ende durch**. Zwischen jeder Phase: kurzer Status-Report an Ben (3 Zeilen genügen), dann warten auf "go" oder "reib".

---

## 2. SDS-Pflege (VERBINDLICH bei jeder Phase)

Bevor du die Phase als "done" markierst, pflege die folgenden Dokumente synchron mit dem Code:

1. **`docs/docu/STRUCTURE.md`** — Komponenten-Inventar
   - Entfernte Komponenten: aus der Liste streichen, Zeile mit `~~removed 2026-04-20~~`-Marker
   - Neue Komponenten: ins passende Modul einsortieren, 1-Zeilen-Purpose dokumentieren
2. **`docs/docu/FRONTEND_INTERNALS.md`** — Datenfluss
   - Wenn Phase die Props/Hooks/Contexts ändert: Datenfluss-Diagramm oder -Liste updaten
3. **`docs/docu/API_REFERENCE.md`** — Endpoints
   - Wenn Phase einen Endpoint verwendet (`/api/daily-horoscope`, Space-Weather etc.): Request/Response-Shape verifizieren und dort notieren, falls drift
4. **`docs/KOHAERENZ_INDEX.md`** — falls Phase am Kohärenzindex-Subtitle/Tooltip arbeitet, **nur lesen**, nicht ändern (Source of Truth). Abweichungen zum aktuellen UI in der Phase als Bug mitdokumentieren.

Regel: **Wenn Code und Doku auseinanderlaufen, gewinnt der Plan — nicht die alte Doku.** Doku wird dem neuen Zustand angepasst.

---

## 3. User-Stories ableiten (VERBINDLICH pro Phase)

Nach Abschluss jeder Phase, vor dem Commit:

1. Lege eine User-Story-Datei an unter `docs/user-stories/2026-04-20/US-DSG-<phase-nr>-<slug>.md`
2. Format (Gherkin-nah):

```markdown
# US-DSG-<n>: <Titel>

**Als** <Rolle>
**möchte ich** <Funktion>
**damit** <Nutzen>

## Akzeptanzkriterien (Gherkin)
- Gegeben <Vorbedingung>
- Wenn <Aktion>
- Dann <erwartetes Ergebnis>

## Verifikation (wie wurde das geprüft?)
- typecheck: passed/failed
- lint: passed/failed
- visuell: [Screenshot-Pfad oder "von Ben geprüft am YYYY-MM-DD"]
- API-check: [Endpoint X liefert Feld Y]

## Referenzen
- Plan-Phase: docs/plans/2026-04-20-dashboard-signatur-gaps.md#phase-<n>
- Geänderte Dateien: [Liste]
```

3. Diese Stories sind später Basis für Regression-Checks und Changelog.

---

## 4. Guardrails (codemoss-agent-guardrails, verbindlich)

Vor jedem Edit: Datei **re-lesen**. Nach jedem Edit: **re-lesen und verifizieren**. Bei Dateien > 300 LOC **Schritt 0 Cleanup** zuerst.

Verifikation **vor** der Success-Meldung:
- `npx tsc --noEmit` (oder `pnpm typecheck`, was immer im Projekt konfiguriert ist)
- `npx eslint . --quiet` wenn vorhanden
- betroffene Tests laufen lassen
- lokaler dev-Server zeigt den geänderten Screen fehlerfrei

Erlaubte Abschluss-Sprache: `changed and verified`, `changed, not yet verified`, `partially verified; remaining uncertainty: ...`
Verbotene Sprache ohne Beleg: `done`, `fixed`, `all good`.

Grep ≠ semantische Analyse: bei Rename/Extract-Operationen (z.B. "Planeteneinflüsse"-Liste aus Signatur extrahieren und auf Dashboard wiederverwenden) suche separat nach:
- direkten Imports / Calls
- Type-Level-Referenzen
- String-Literalen mit dem Namen
- Barrel-Re-Exports
- Tests/Mocks

---

## 5. Feature-Awareness (was du im Blick halten musst)

Während du am Dashboard/Signatur arbeitest, darfst du diese **parallelen Baustellen nicht beschädigen**:

- **Quiz-Signatur-Coupling-Sprint** (`docs/plans/2026-04-20-quiz-signatur-coupling.md`) — kommt direkt nach diesem Sprint. Wenn du an der Signatur-Seite (`/signatur`, `SignatureView`, `SignatureCanvas`) arbeitest, füge **keine neuen Wu-Xing-Rendering-Pfade** ein; der Fünf-Elemente-Kranz wird im nächsten Sprint sauber integriert.
- **Kohärenzindex-Formel** — die Formel ist in `docs/KOHAERENZ_INDEX.md` fixiert: `kohaerenz_raw = natal * 1.0 + transit * 0.40 + quiz_effective * 0.20; kohaerenz_index = clamp(kohaerenz_raw * (1 + 0.15 * membrane_gain), 0, 1)`. Subtitle-Text muss diese Semantik respektieren (Delta ggü. Basis, Membrane-Modulation optional erwähnen, KEINE neuen Formelbestandteile erfinden).
- **Tagesimpuls** — nutzt den existierenden Daily-Horoscope-Endpoint. Prüfe vor Implementierung in der Phase, ob der Endpoint personalisierte Inputs (Natal-Zeichen, BaZi-Day-Master) bereits akzeptiert; wenn nein, liste den Gap explizit und lasse Ben entscheiden, ob er erst den Endpoint-Fix priorisiert oder einen generischen Text nimmt.
- **3D-Signatur-Defekt** — in diesem Sprint NUR Zoom 4x-8x oder visueller Fallback. **Kein echtes 3D** jetzt. Echtes 3D ist ein eigener Sprint (Spherical Harmonics Y_lm).
- **Space-Weather-Daten (KP, NASA API)** — prüfe den Datenpfad ehrlich: wenn der Fetch failed, dokumentiere das Fehler-Muster (Network / Auth / Rate-Limit / Fallback) in der Phase, bevor du den UI-Bug "keine Werte" angehst. UI-Fix ohne Daten-Fix ist Band-Aid.

---

## 6. Entscheidungen, die du NICHT alleine triffst

Eskaliere an Ben und stoppe die Phase, wenn:
- Der Plan vorschlägt, eine Komponente zu löschen, die in anderen Routes referenziert wird, die nicht im Plan stehen
- Du während der Arbeit feststellst, dass der Kohärenzindex-Subtitle semantisch anders gemeint war als in `KOHAERENZ_INDEX.md`
- Die Daily-Horoscope-API keine personalisierten Inputs annimmt und ein Backend-Eingriff nötig wäre
- Die Space-Weather-Integration mehr als 2 Stunden Debugging braucht

---

## 7. Phase-Abschluss-Output-Format

```markdown
### Phase <n>: <Titel> — [DONE / HALT]

**Geändert:**
- file1.tsx
- file2.ts

**SDS-Updates:**
- STRUCTURE.md: [was]
- FRONTEND_INTERNALS.md: [was]

**User-Story:**
- docs/user-stories/2026-04-20/US-DSG-<n>-<slug>.md

**Verifikation:**
- typecheck: passed
- lint: passed
- visuell: <Screenshot-Pfad oder "pending-Ben-Review">

**Remaining risks:**
- [spezifisch oder "none identified"]

**Confidence:** high / medium / low

**Nächste Phase:** bereit / HALT mit Frage: <Frage>
```

---

## 8. Kick-Off

Starte mit **Phase 0 (Baseline)** aus `docs/plans/2026-04-20-dashboard-signatur-gaps.md`. Lies den Plan **vollständig** vor dem ersten Edit.

Status-Format nach Phase 0: 3 Zeilen an Ben, dann Phase 1 auf Go warten.

Viel Erfolg. 3 Rs gelten auch für dich — Reibung darfst du machen, wenn der Plan unklar ist.

# Bazodiac — Autonomous Agent Protocol
# Gilt für alle Agenten die auf DYAI2025/Astro-Noctum arbeiten.
# Stand: 21.03.2026

---

## I. PRIME DIRECTIVE

**Kein Code landet auf main ohne Beweis dass er funktioniert.**

Das bedeutet: kein Feature ohne Test, kein Bug-Fix ohne Verifikation, kein PR ohne
grünen lint. Wenn du dir nicht sicher bist ob etwas funktioniert — teste es.
Wenn du es nicht testen kannst — escaliere, merge nicht.

---

## II. BUG-PROTOKOLL

### Wenn du einen Bug findest:

1. **Sofort fixen** — kein Backlog, kein "später". Bugs blockieren alles nachfolgende.
2. **Root Cause identifizieren** bevor du anfängst zu schreiben.
   Falsch: symptom fixen. Richtig: ursache verstehen, dann beheben.
3. **Test schreiben der den Bug reproduziert** — bevor du den Fix schreibst.
   Der Test muss rot sein, dann grün werden. Kein Test = kein Merge.
4. **Fix schreiben** — minimal, gezielt. Kein refactoring im gleichen Commit.
5. **Lint + Tests** — `npm run lint` = 0 Errors. Alle Tests grün.
6. **PR öffnen** mit:
   - Titel: `fix: [was] — [warum]`
   - Body: Root Cause, Fix-Strategie, Test-Beschreibung, betroffene Dateien
   - Issue-Referenz: `Fixes #<nummer>`

### Was du NICHT tust:
- Silent catches einbauen (`.catch(() => {})`) — immer loggen oder rethrow
- `@ts-ignore` ohne inline-Kommentar warum
- Bug-Fix und Feature in einem Commit mischen

---

## III. TESTING-MANDAT

**Jede neue Funktionalität hat einen Test. Ausnahmen existieren nicht.**

### Was getestet werden muss:
- Jede neue Funktion / Hook / Component
- Jedes neues API-Endpoint (smoke test mit Mocked-Response reicht)
- Jede neue Datentransformation
- Jeder Fix für einen bekannten Bug

### Test-Qualität:
- Tests testen **Verhalten**, nicht Implementierung
- Kein Mocken was nicht verstanden ist
- Tests müssen **zuerst rot sein** — dann grün werden (TDD)
- Keine `expect(true).toBe(true)` — Tests müssen echte Assertions haben

### Verboten:
- `it.skip()` ohne Kommentar + GitHub Issue
- Leere `describe()` Blöcke
- Tests die nur prüfen ob etwas importierbar ist (ohne echtes Verhalten zu testen)

### Befehl vor jedem Commit:
```bash
npm run lint    # muss 0 errors zurückgeben
npm test -- --run   # alle Tests grün
```

---

## IV. SPRINT-REVIEW-PROTOKOLL

Nach jedem Sprint (bevor Merge auf main):

### Self-Review Checkliste (Agent führt selbst durch):
- [ ] Alle Acceptance Criteria aus dem GitHub Issue erfüllt?
- [ ] Jede neue Funktion hat einen Test?
- [ ] `npm run lint` = 0 errors?
- [ ] `npm test -- --run` = alle grün?
- [ ] Keine neuen `@ts-ignore` ohne Kommentar?
- [ ] Keine neuen silent catches?
- [ ] PR-Body beschreibt was geändert wurde und warum?
- [ ] Supabase-Schema-Änderungen dokumentiert?
- [ ] Breaking Changes explizit benannt?

### Was in jeden PR-Body muss:
```markdown
## Was wurde gemacht
[1-3 Sätze]

## Warum (Root Cause / User Story)
[Bezug auf Issue]

## Wie getestet
[Welche Tests, was wird verifiziert]

## Betroffene Dateien
[Liste der geänderten Dateien mit Kurzbeschreibung]

## Bekannte Einschränkungen
[Was wurde bewusst nicht gemacht, warum]
```

---

## V. DEFINITION OF DONE

Ein Task ist **done** wenn:

1. ✅ Code geschrieben
2. ✅ Test geschrieben und grün
3. ✅ `npm run lint` = 0 errors
4. ✅ `npm test -- --run` = alle Tests grün
5. ✅ PR geöffnet mit vollständigem Body
6. ✅ GitHub Issue referenziert
7. ✅ Kein TODO im Code ohne GitHub Issue

Ein Task ist **NICHT done** wenn:
- "Es funktioniert bei mir" aber kein Test
- PR offen aber lint schlägt fehl
- Feature implementiert aber Edge Cases nicht abgedeckt

---

## VI. ESCALATION-PROTOKOLL

Ein Agent **stoppt und eskaliert** (Issue mit Label `[BLOCKED]` kommentieren) wenn:

- Eine Entscheidung nötig ist die Produktlogik betrifft
  (z.B. "Soll der User benachrichtigt werden wenn X?")
- Ein externer Service nicht erreichbar ist und kein Fallback definiert ist
- Der Test nicht grün wird nach 3 Versuchen Root Cause zu verstehen
- Eine Schema-Änderung an Supabase nötig ist (braucht Ben's OK)
- Ein Security-relevanter Code-Pfad betroffen ist

**Eskalation-Format:**
```
[BLOCKED] #<issue-nummer>

Problem: [Was ist das konkrete Hindernis]
Versucht: [Was wurde bereits versucht]
Brauche: [Was ich vom Mensch brauche um weiterzumachen]
Alternativen: [Falls es welche gibt]
```

---

## VII. COMMIT-STIL

Format: `<type>(<scope>): <was> — <warum>`

Types:
- `feat` — neue Funktionalität
- `fix` — Bug-Fix
- `test` — Tests hinzugefügt/geändert
- `refactor` — Umstrukturierung ohne Verhaltensänderung
- `chore` — Dependencies, Config, Build
- `docs` — Dokumentation

Beispiele:
```
feat(dashboard): InfluenceGauges mit Transit-Daten verdrahten — Zone 3 zeigt echte Planeten
fix(usePremium): Realtime-Fallback loggen statt still swallown — Observability
test(CosmicEncounter): E2E für 7-Phasen State Machine — Sprint 01 Abnahme
```

Kein Commit ohne Issue-Referenz im Body:
```
Fixes #115
```

---

## VIII. SCOPE-GRENZEN (Darf ein Agent NICHT ohne Rückfrage)

- `supabase-schema.sql` ändern
- `.env` / Secrets anfassen
- Railway / Nixpacks / infra-Dateien ändern
- ElevenLabs Agent-Konfiguration ändern
- Stripe-Webhook-Config ändern
- Dependencies upgraden (major version)
- Feature Flags von `false` auf `true` schalten in Production

---

## IX. KOMMUNIKATIONS-PROTOKOLL

Ein Agent kommuniziert seinen Status über GitHub Issues:

| Status | Label | Aktion |
|--------|-------|--------|
| Arbeit begonnen | `in-progress` | Issue assignen |
| Blockiert | `[BLOCKED]` | Kommentar mit Eskalation-Format |
| PR offen | `review-ready` | PR mit vollständigem Body |
| Done | Issue schließen | `Fixes #X` im Commit |

---

---

## X. SELBST-LERNENDER AGENTEN-LOOP

### Architektur

```
Ben (WhatsApp/GitHub/Sprache)
        │
        ▼
   BACKLOG.md ──► GitHub Issue (bazodiac-agent label)
        │
        ▼
ClawTeam Swarm (bazodiac-swarm.toml)
   Lead → Frontend + Backend + Test
        │
        ▼
   PR → Merge → main
        │
        ▼
   Retro-Agent (post_sprint trigger)
   liest: PRs + Issue-Kommentare + BACKLOG.md
        │
        ▼
   AGENTS-PROTOCOL.md  ← wird hier updated (Kapitel X.3)
   .agent-rules.md     ← komprimierte Regeln updated
   docs/RETRO.md       ← Sprint-Summary für Ben
```

### X.1 Wann der Retro-Agent läuft

Nach jedem Sprint-Abschluss — ausgelöst durch:
```bash
clawteam start bazodiac-swarm.toml --trigger post_sprint --sprint S0X
```

Oder manuell: `ao spawn retro --sprint S0X`

### X.2 Was der Retro-Agent tut

1. `git log --oneline <sprint-start-sha>..HEAD` — alle Commits des Sprints
2. GitHub Issues des Sprints lesen (Comments, Labels, Blockaden)
3. BACKLOG.md "Offen"-Sektion prüfen — neue Einträge von Ben erfassen
4. Drei Fragen beantworten:
   - Was hat der Swarm problemlos gelöst? → Bestätigung in Protokoll
   - Wo war ein Agent geblockt? → Regel oder Prozess verbessern
   - Was war unklar in der Issue-Beschreibung? → Template verbessern

### X.3 Lernkurve — Sprint-Retrospektiven

<!-- Retro-Agent schreibt hier nach jedem Sprint -->

| Sprint | Datum | Lernimpuls | Protokoll-Änderung |
|--------|-------|------------|-------------------|
| S01 | 2026-03 | Alle Bugs waren bereits gefixt in commit bf70c63 | Vor Agent-Start: git log prüfen ob Issue noch offen |
| S02 | – | – | – |

### X.4 Wie Ben Aufgaben eingibt (ohne Cowork zu öffnen)

**Heute sofort nutzbar:**

```
# GitHub Mobile App (iPhone)
→ DYAI2025/Astro-Noctum → BACKLOG.md → bearbeiten → committen
→ oder: Issues Tab → New Issue → Template wählen

# GitHub Web
→ github.com/DYAI2025/Astro-Noctum/issues/new
→ Labels: bazodiac-agent + sprint-0X + BUG/FEAT/REFACTOR
```

**Mit ZeroClaw (nach Deployment — zeroclaw-labs/zeroclaw):**
```
# WhatsApp/Telegram an deinen persönlichen ZeroClaw-Bot:
"bug: [Beschreibung]"        → erstellt GitHub Issue + Label
"feat: [Beschreibung]"       → erstellt GitHub Issue + Label
"frage: [Beschreibung]"      → erstellt GitHub Issue, kein Agent-spawn
"status"                     → zeigt offene Issues + Agent-Status
```

ZeroClaw läuft auf $10-Hardware (Raspberry Pi) oder deinem Mac.
Config: `zeroclaw/deploy/bazodiac-bot.yaml` (noch zu erstellen)

### X.5 Was Agenten NICHT selbst entscheiden (immer Ben fragen)

- Ob ein neues Kapitel ins Protokoll kommt
- Ob eine Sprint-Grenze verschoben wird
- Ob ein Issue aus dem Backlog Priorität bekommt
- Ob eine Architektur-Entscheidung revidiert wird

---

*Bazodiac · Agent Protocol v1.1 · DYAI2025 · 22.03.2026*
*Dieses Dokument wird in jede Agent-Session via .agent-rules.md injiziert.*
*Kapitel X wird nach jedem Sprint durch den Retro-Agent aktualisiert.*

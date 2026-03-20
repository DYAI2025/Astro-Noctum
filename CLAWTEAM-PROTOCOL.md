# ClawTeam Task-Generation Protocol

## Überblick

Agents generieren Tasks automatisch nach Zielvorgaben durch den User. Jeder Task wird sofort im Nuggets-Board angelegt und ist damit trackbar.

## Workflow

```
User gibt Ziel vor
    ↓
ClawTeam Brainstorming (Agents diskutieren)
    ↓
Tasks identifizieren (wahrscheinlichste Aktionen)
    ↓
Jeder Task → SOFORT im Nuggets-Board anlegen
    ↓
Agent arbeitet Task ab
    ↓
Task fertig → Board aktualisiert sich automatisch
    ↓
User sieht Fortschritt im Board
```

## Commands für Agents

### Task im Board anlegen (NACH Brainstorming)

```bash
# 1. Task in sprint-tasks definieren
nuggets remember sprint-tasks "TASK-XXX" "Beschreibung | priority:high|medium|low | estimate:1-5"

# 2. Task zu TODO hinzufügen
nuggets remember board "TODO: TASK-XXX, TASK-YYY"
```

### Task starten (WENN Agent daran arbeitet)

```bash
nuggets remember progress "TASK-XXX" "IN_PROGRESS:$(date -Iseconds)"
```

### Task fertigstellen (NACH Commit)

```bash
# Ohne Review
nuggets remember progress "TASK-XXX" "DONE:$(date -Iseconds):REVIEWER:none"

# Mit Review
nuggets remember progress "TASK-XXX" "DONE:$(date -Iseconds):REVIEWER:benjamin"
```

### Task blockieren (WENN abhängig)

```bash
nuggets remember progress "TASK-XXX" "BLOCKED:$(date -Iseconds):REASON:Waiting for X"
```

## Board-Status anzeigen

```bash
# Board anzeigen
npx tsx ~/Active/Claude-Workspace/nuggets/src/pm/board-cli.ts show

# Nächste Task holen
npx tsx ~/Active/Claude-Workspace/nuggets/src/pm/board-cli.ts next
```

## Ticket-Manager (automatisiert)

Der Ticket-Manager läuft im Hintergrund und verarbeitet alle 30 Sekunden:

1. Liest `progress` Nuggets
2. Bewegt Tasks zu richtigen Board-Spalten
3. Bereinigt alte progress-Einträge

**Status:** Läuft als Hintergrundprozess (PID: 88006, 88008)

---

## Beispiel-Session

### User gibt Ziel vor:

> "Ich möchte die Quiz-UX verbessern: Doppelte Close-Buttons entfernen, Ergebnis-Screens mit Cluster-Hinweis hinzufügen"

### ClawTeam Brainstorming:

```
Agent A: "Wir müssen alle Quiz-Komponenten prüfen - es gibt 13 davon"
Agent B: "CloseButton ist in jeder Quiz-Datei - das ist repetitive Arbeit"
Agent C: "Ergebnis-Screens haben unterschiedliche Strukturen - müssen wir vereinheitlichen"
Agent D: "Ich schlage vor: 1 Task pro Quiz-Component + 1 Task für Testing"
```

### Tasks generieren:

```bash
# Task 1: CloseButton aus RpgIdentityQuiz entfernen
nuggets remember sprint-tasks "TASK-006" "CloseButton aus RpgIdentityQuiz entfernen | priority:high | estimate:1"
nuggets remember board "TODO: TASK-006, TASK-007, TASK-008, TASK-009, TASK-010, TASK-011, TASK-012, TASK-013, TASK-014, TASK-015, TASK-016, TASK-017, TASK-018"

# Task 2: CloseButton aus AuraColorsQuiz entfernen
nuggets remember sprint-tasks "TASK-007" "CloseButton aus AuraColorsQuiz entfernen | priority:high | estimate:1"

# ... usw für alle 13 Quizzes

# Task 14: Cluster-Hinweis zu Ergebnis-Screens hinzufügen
nuggets remember sprint-tasks "TASK-019" "Cluster-Hinweis zu allen Ergebnis-Screens hinzufügen | priority:high | estimate:2"

# Task 15: Testing
nuggets remember sprint-tasks "TASK-020" "Quiz-Fixes testen (TypeScript + manuell) | priority:high | estimate:1"
```

### Agent arbeitet:

```bash
# Task starten
nuggets remember progress "TASK-006" "IN_PROGRESS:2026-03-19T23:00:00"

# ... arbeitet ...

# Task fertig (nach Commit)
nuggets remember progress "TASK-006" "DONE:2026-03-19T23:15:00:REVIEWER:none"
```

### User sieht im Board:

```
┌────────────────────────────────────────────────────────┐
│                 SPRINT BOARD                           │
├────────────────────────────────────────────────────────┤
│ TODO         : TASK-007, TASK-008, TASK-009, ...      │
│ IN_PROGRESS  : ————————————————————————————————————   │
│ REVIEW       : TASK-001                               │
│ DONE         : TASK-006                               │
│ BLOCKED      : ————————————————————————————————————   │
└────────────────────────────────────────────────────────┘
```

---

## Priority Guidelines

| Priority | Wann | Estimate |
|----------|------|----------|
| **high** | Blockiert andere Tasks, Kern-Feature, Bug | 1-3 Tage |
| **medium** | Wichtig aber nicht kritisch, Feature | 1-5 Tage |
| **low** | Nice-to-have, Polish, Dokumentation | 1-3 Tage |

## Estimate Guidelines

| Estimate | Umfang |
|----------|--------|
| 1 | Kleine Änderung, eine Datei, < 1 Stunde |
| 2 | Mehrere Dateien, einfache Logik, 2-4 Stunden |
| 3 | Komplexe Logik, Testing, 4-8 Stunden |
| 4 | Multi-File-Refactor, Integration, 1-2 Tage |
| 5 | Großes Feature, mehrere Tage Arbeit |

---

## Automatische Board-Updates

Der Ticket-Manager aktualisiert das Board automatisch basierend auf progress-Nuggets:

| Progress-Wert | Board-Spalte |
|---------------|--------------|
| `IN_PROGRESS:*` | IN_PROGRESS |
| `DONE:*:REVIEWER:none` | DONE |
| `DONE:*:REVIEWER:user` | REVIEW |
| `BLOCKED:*:REASON:*` | BLOCKED |

---

## Wichtige Regeln

1. **Jeder Task SOFORT nach Brainstorming anlegen** - Nicht "später machen"
2. **Task-ID eindeutig** - TASK-001, TASK-002, ... fortlaufend
3. **Beschreibung klar** - Was + warum (nicht wie)
4. **Priority setzen** - high/medium/low
5. **Estimate setzen** - 1-5 Tage
6. **Nach Commit updaten** - DONE oder REVIEW

---

*Bazodiac · DYAI2025 · ClawTeam Protocol v1 — 20.03.2026*

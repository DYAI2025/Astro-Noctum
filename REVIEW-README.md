# AAA Code-Review System

## Überblick

Alle Agents müssen ein **gegenseitiges Code-Review** durchlaufen bevor sie committen dürfen.

## Review-Kriterien

1. ✅ **TypeScript Check** - `npm run lint` muss bestehen
2. ✅ **Tests prüfen** - `npm test` sollte bestehen
3. ✅ **True North Check** - TRUENORTH.md muss beachtet werden
4. ✅ **Brand Voice Check** - BRANDVOICE.md muss vorhanden sein
5. ✅ **MetaClaw Decision Check** - Entscheidungen dokumentieren

## Workflow

```
Agent erstellt Code
       ↓
Review anfordern
       ↓
Anderer Agent prüft (5 Kriterien)
       ↓
┌──────────────┬──────────────┐
│   BESTANDEN  │  DURCHGEFALLEN│
│      ✅      │      ❌       │
│      ↓       │      ↓       │
│  Commit &    │  Probleme    │
│  Push        │  melden      │
└──────────────┴──────────────┘
```

## Review-Paare

| Agent | Reviewer |
|-------|----------|
| 🟠 Claude | 🔵 Codex |
| 🔵 Codex | 🟣 Qwen |
| 🟣 Qwen | 🟠 Claude |

---

DYAI2025 · AAA Review System v1.0

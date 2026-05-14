# Tagespuls / Tagesdeutung Architecture Package

Stand: 2026-04-30
Status: repo-ready draft

Dieses ZIP konsolidiert die Zwei-Phasen-Architektur fuer das Tageshoroskop:

1. Kosmisches Wetter als aeusserer Zustand auf `sky.bazodiac.space`.
2. Tagespuls als userbezogene Phase 1 ohne Archetyp-Bezug.
3. Tagesdeutung als Phase 2 nach User-Wahl aus dem Rat der sechs.
4. Aphorismen-Kuration in Obsidian/gbrain als Wissens- und Recherche-Layer.
5. Deterministischer Production-Layer in `packages/voice`.

Wichtige Entscheidung: Aphorismen sind Marken-Asset. Darum exportiert der Build nur Eintraege mit `status: approved`; dieses Paket liefert die ersten Eintraege bewusst mit `status: review` oder `draft`, nicht als ungeprueftes Production-Material.

## Struktur

```text
.claude/skills/
  day-pulse-trace/SKILL.md
  aphorism-curator/SKILL.md
docs/
  PROMPT_MODULE_TAGESPULS_TAGESDEUTUNG.md
  day-pulse-trace-pipeline.md
  api-and-database-architecture.md
  gbrain-obsidian-live-ops.md
  decisions-risks.md
  validation-report.md
knowledge/bazodiaac-brain/
  _templates/aphorism.md
  _meta/tone_vocab.md
  aphorisms/review/*.md
  intake/aphorism-intake-register.json
packages/voice/
  data/aphorisms.sample.json
  scripts/validate_aphorisms.py
  scripts/build_aphorisms.py
  scripts/select_daily_aphorism.py
  src/types.ts
  src/tagespuls.ts
packages/api/openapi.yaml
packages/db/schema.sql
```

## Ausfuehrung

```bash
python3 packages/voice/scripts/validate_aphorisms.py knowledge/bazodiaac-brain/aphorisms/review
python3 packages/voice/scripts/build_aphorisms.py knowledge/bazodiaac-brain/aphorisms/review packages/voice/data/aphorisms.json
python3 packages/voice/scripts/select_daily_aphorism.py packages/voice/data/aphorisms.json user-123 2026-04-30 pulse
```

## Grenzen

- Zitat- und Urheberrechtsstatus ist kein Rechtsgutachten.
- Moderne Film-, Game-, Song- und lebende Autor:innen-Zitate liegen im Intake-Register, aber nicht als exportfaehige Aphorismen.
- Viele historische Zuschreibungen sind `disputed`, bis eine konkrete Werkstelle nachgetragen wurde.

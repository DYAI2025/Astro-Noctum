# Validation Report

Datum: 2026-04-30

## Genutzte Regeln

- `day-pulse-trace`: Voice-Regeln fuer Slot 2, Slot 3 und Phase 2.
- `aphorism-curator`: bilinguales Aphorismen-Schema, Attribution-Status, Wortzahlen, Quarantaene fuer Quellen-/Rechterisiken.
- `gpt-project-management`: Artefaktstruktur, Risiken, Entscheidungen, keine Phantom-Skills.
- Skill-Frontmatter-Basischeck: `validate_frontmatter.py` aus den Projektdateien.

## Durchgefuehrte Checks

```bash
python3 -S packages/voice/scripts/validate_aphorisms.py knowledge/bazodiaac-brain/aphorisms/review
# valid: 21 aphorism files passed schema checks

python3 -S packages/voice/scripts/build_aphorisms.py knowledge/bazodiaac-brain/aphorisms/review packages/voice/data/aphorisms.json
# wrote 0 approved aphorisms to packages/voice/data/aphorisms.json

python3 -S /mnt/data/validate_frontmatter.py .claude/skills/day-pulse-trace
# valid: frontmatter ok

python3 -S /mnt/data/validate_frontmatter.py .claude/skills/aphorism-curator
# valid: frontmatter ok
```

## Ergebnis

- 21 Aphorismus-Dateien sind formal schema-konform.
- 0 Aphorismen wurden produktiv exportiert, weil kein Eintrag ungeprueft auf `approved` gesetzt wurde.
- 53 im Chat genannte IDs sind im Intake-Register erfasst.
- Moderne Film/Game/Song-/Copyright-riskante Eintraege wurden nicht als exportfaehige Aphorismen angelegt.
- Mehrere klassische Eintraege stehen auf `draft`, weil Werkstelle oder Original noch nicht belegt ist.

## Bewusste Korrekturen gegenueber den Chat-Drafts

1. `Rat der sechs` ist verbindlich; die fruehere Fuenfer-Formulierung wurde nicht uebernommen.
2. Monolinguales Template wurde durch bilinguales Schema ersetzt.
3. Leere `## Original`-Sektionen werden vermieden.
4. `original_language` wurde bei nicht belegter Originalstelle auf `unknown` gesetzt, statt scheinbar praezise `zh` oder `grc` zu behaupten.
5. Alle Wortzahlen wurden per Whitespace-Regel berechnet, nicht geschaetzt.
6. Keine moderne Quelle wurde als rechtlich frei nutzbar behauptet.

## Nicht geloest

- Keine juristische Rechtepruefung.
- Keine vollstaendige Quellenverifikation aller klassischen Zitate.
- Keine echte DB-Migration gegen Supabase ausgefuehrt.
- Keine Runtime-Integration gegen das reale Astro-Noctum-Repo ausgefuehrt.

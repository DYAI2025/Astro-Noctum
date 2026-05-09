# gbrain / Obsidian im Live-Kundenbetrieb

## Klare Trennung

| Layer | Zweck | Live-Request? |
|---|---|---|
| Obsidian Vault | Schreiben, Kuratieren, Review | nein |
| gbrain | semantische Recherche, Backlinks, Quellenvergleich | nein |
| build:voice | validiert und exportiert approved Eintraege | nein, CI/CD |
| Production JSON/DB | schnelle deterministische Auslieferung | ja |
| API | Tagespuls/Tagesdeutung | ja |

## Warum nicht gbrain live im Request-Pfad?

- Vektor-Suche ist fuer Recherche stark, aber fuer 7-Uhr-Traffic unnoetig langsam.
- Deterministische Auswahl braucht reproduzierbaren Seed, nicht semantische Live-Suche.
- Production muss funktionieren, auch wenn der lokale Vault oder MCP ausfaellt.

## Live-faehige Nutzung

`gbrain` funktioniert live im Kundenbetrieb als **Backoffice- und Redaktionssystem**:

1. Ben legt oder kuratiert Notes in Obsidian.
2. gbrain indexiert Markdown und Quellen.
3. LLM recherchiert gegen den Vault und schlaegt Kandidaten vor.
4. Ben setzt `status: review` oder `approved`.
5. CI fuehrt Validator aus.
6. Nur `approved` geht in JSON/DB.
7. API liefert aus DB/Cache.

## Ordnerstruktur

```text
knowledge/bazodiaac-brain/
  aphorisms/review/          # validierte Kandidaten, noch nicht produktiv
  aphorisms/approved/        # optionaler Arbeitsordner; Build filtert zusaetzlich per status
  aphorisms/retired/         # nicht mehr verwenden
  intake/                    # Quellenregister, Rejected, Copyright-Fragen
  sources/                   # Werks-/Quellennotes
  concepts/                  # Konzepte, Tonalitaet, Motive
  _templates/aphorism.md
  _meta/tone_vocab.md
```

## Recherche-Prompt fuer gbrain

```text
Suche im Bazodiac-Brain nach Aphorismus-Kandidaten fuer mode=trace, tone=scharf,
Thema: Handlung statt Ausweichen. Gib nur Kandidaten mit Quelle, Werk, Sprache,
Zuschreibungsrisiko und 1 Satz Begruendung aus. Erfinde keine Sprueche.
```

## Kuration

Jeder Kandidat durchlaeuft:

1. Quellenpruefung
2. Attribution-Status
3. Bilinguale Formulierung
4. Wortzaehlung
5. Mode/Tone-Konsistenz
6. Review durch Ben

## Deployment

```bash
gbrain sync --repo knowledge/bazodiaac-brain
python3 packages/voice/scripts/validate_aphorisms.py knowledge/bazodiaac-brain/aphorisms/review
python3 packages/voice/scripts/build_aphorisms.py knowledge/bazodiaac-brain/aphorisms/review packages/voice/data/aphorisms.json
```

## Richtiges Source-of-Truth-Modell

- Kuration: Obsidian Markdown
- semantische Suche: gbrain Index
- Production: JSON/DB
- Runtime: API + Cache

Nicht: gbrain als direkte Produktionsdatenbank fuer Enduser-Traffic.

# API Contract: save_conversation_eve / save_conversation_summary

## Zweck

Speichert Zusammenfassung, Topics und optional semantische Memory-Daten.

## Bestehender Minimal-Body

```json
{
  "user_id": "string",
  "summary": "string",
  "topics": ["string"]
}
```

## Empfohlene Erweiterung

```json
{
  "user_id": "string",
  "summary": "string",
  "topics": ["string"],
  "mode": "deep_dive|free|day_pulse|fusion|partner_match|unknown",
  "active_planet": "string",
  "memory_update_json": "{}"
}
```

## memory_update_json

`memory_update_json` ist ein JSON-String, kein Objekt. Beispiel:

```json
"{\"hypothesis_updates\":[],\"signature_events\":[]}"
```

Wenn keine Updates vorliegen:

```json
"{}"
```

## Regeln nach Modus

- `deep_dive`: darf Hypothesenupdates, Abweichungen, Planet-Updates, Signatur-Events speichern.
- `free`: nur vorsichtige Updates.
- `day_pulse`: keine Hypothesenvalidierung.
- `fusion`: keine Hypothesenvalidierung, maximal Reflexionsnotiz.
- `partner_match`: keine Deep-Dive-Hypothesenvalidierung.

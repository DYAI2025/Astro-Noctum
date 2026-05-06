# API Contract: get_user_astro_profile

## Zweck

`get_user_astro_profile` wird zu Beginn jedes Gespraechs aufgerufen. Es liefert die astrologische und memorybezogene Datenbasis fuer Eve und Levi.

## Aktuell erwartete Felder

```json
{
  "user_id": "string",
  "name": "string|null",
  "signs": {
    "sun": "string",
    "moon": "string",
    "ascendant": "string"
  },
  "bazi": {
    "day_master": "string",
    "pillars": {}
  },
  "wu_xing": {
    "dominant_element": "string",
    "vector": {}
  },
  "fusion": {
    "harmony_index": "number|null"
  },
  "past_conversations": []
}
```

## Empfohlene Erweiterung

```json
{
  "deep_dive": {
    "anchors": [],
    "active_hypotheses": [],
    "open_deviation_candidates": [],
    "planet_states": [],
    "recent_signature_events": [],
    "follow_up_hooks": []
  },
  "signature_status": {}
}
```

## Past Conversations

`past_conversations` enthaelt bis zu 5 Zusammenfassungen.

Erwartete Felder:

```json
{
  "summary": "string",
  "topics": ["string"],
  "created_at": "ISO-8601"
}
```

## Agentenregel

- Bei leeren `past_conversations`: Erstgespraech.
- Bei vorhandenen `past_conversations`: Wiedersehen.
- Nach `created_at` absteigend sortieren.
- Neuesten Eintrag fuer Rueckbezug nutzen.

# API Contract: get_daily_horoscope

## Zweck

Tageshoroskop fuer Day Pulse / Day Trace.

## Erwartetes Response-Schema

```json
{
  "date": "YYYY-MM-DD",
  "day_mode": "pulse|trace",
  "harmony_index": 0.0,
  "western": {
    "summary": "string",
    "themes": [],
    "caution": "string|null",
    "opportunity": "string|null"
  },
  "eastern": {
    "summary": "string",
    "themes": [],
    "caution": "string|null",
    "opportunity": "string|null",
    "day_master_relation": "string|null"
  },
  "fusion": {
    "summary": "string",
    "synthesis": "string",
    "action": "string"
  }
}
```

## Moduslogik

- `pulse`: ruhiger Tag, innerer Fokus, Reflexion.
- `trace`: aktiver Tag, Bewegung, Sichtbarkeit.

## Agentenregeln

- Immer integrierte Deutung.
- Keine getrennte West/Ost-Auflistung.
- Maximal 6-8 Saetze.
- Kein Hypothesenupdate.
- Kein Deep-Dive-Memory-Update.
- Signatur-Event nur tagesbezogen.

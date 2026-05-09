# API- und Datenbank-Architektur

## Architekturentscheidung

Live-Betrieb nutzt eine schnelle relationale Datenbank plus Cache. Obsidian/gbrain bleibt Source-of-Curation, aber nicht Runtime-Dependency.

```text
Obsidian Vault -> gbrain Index -> Curator Review -> build:voice -> JSON/DB import -> API -> Client
```

## API-Variante A: REST

Endpoints:

| Methode | Pfad | Zweck |
|---|---|---|
| GET | `/v1/users/{userId}/daily-pulse?date=YYYY-MM-DD` | Phase 1 laden oder erzeugen |
| POST | `/v1/users/{userId}/daily-interpretation` | Phase 2 nach Wahl erzeugen |
| GET | `/v1/users/{userId}/council` | Rat der sechs laden |
| GET | `/v1/cosmic-weather/{date}` | Kosmisches Wetter laden |
| POST | `/v1/internal/voice/aphorisms/import` | approved Aphorismen in DB importieren |

## API-Variante B: RPC intern

Fuer Supabase/Fly.io kann die App mit einer Service-Funktion arbeiten:

```ts
getOrCreateDailyPulse(userId, date, locale)
createDailyInterpretation(userId, dailyPulseId, archetypeKey)
```

## Datenbanktabellen

Siehe `packages/db/schema.sql`.

Kernobjekte:

- `users`
- `user_astro_profiles`
- `cosmic_weather_snapshots`
- `aphorisms`
- `daily_pulses`
- `daily_interpretations`
- `aphorism_usage_events`

## Cache

- Key Phase 1: `daily_pulse:{user_id}:{date}:{locale}`
- Key Phase 2: `daily_interpretation:{daily_pulse_id}:{archetype_key}:{locale}`

## Idempotenz

- Phase 1: Unique `(user_id, date, locale)`.
- Phase 2: Unique `(daily_pulse_id, selected_archetype_key, locale)`.
- Wiederholte Requests liefern dasselbe Ergebnis.

## Datenschutz

- Geburtsdaten bleiben im Profil-Service.
- LLM bekommt nur abgeleitete Figurennamen und strukturierte Day-Daten.
- Keine Roh-Geburtszeit an LLM senden.

## Betriebsmodus

Empfohlen:

1. Precompute morgens fuer aktive User.
2. Lazy generate fuer selten aktive User.
3. Cache fuer 24 Stunden.
4. Aphorismus-Pool deployen via Build-Artefakt, nicht per Live-gbrain-Abfrage.

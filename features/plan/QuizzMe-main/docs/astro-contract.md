# Astro Integration Contract

## Database Schema: `astro_profiles`

| Field | Type | Constraint | Description |
|---|---|---|---|
| `user_id` | UUID | PK, FK `auth.users` | 1:1 relation to Supabase Auth User |
| `username` | TEXT | NOT NULL | Display name / Handle |
| `birth_date` | DATE | NOT NULL | Local date (YYYY-MM-DD) |
| `birth_time` | TIME | NOT NULL | Local time (HH:MM:SS) |
| `iana_time_zone` | TEXT | NOT NULL | e.g. "Europe/Berlin" |
| `fold` | INT | CHECK (0,1) | Optional: 0 (pre-switch), 1 (post-switch) for DST ambiguity |
| `birth_lat` | FLOAT | -90 to +90 | Latitude |
| `birth_lng` | FLOAT | -180 to +180 | Longitude |
| `birth_place_name`| TEXT | NOT NULL | Display string for place |
| `astro_json` | JSONB | DEFAULT '{}' | Full output from Cosmic Engine |
| `astro_validation_status` | TEXT | | "ok", "warn", "error" |

## API: `POST /api/astro/compute`

### Request (Header: Authorization: Bearer <token>)
Body: `{ "force": boolean (optional) }`

### Responses

#### 200 OK
Calculation successful.
```json
{
  "ok": true,
  "skipped": boolean, // true if result was cached
  "astro_validation_status": "ok" | "warn" | "error",
  "anchors": {
    "sun_sign": "Leo",
    "moon_sign": "Aries",
    "asc_sign": "Scorpio"
  }
}
```

#### 409 Conflict (Ambiguous Time)
Occurs during DST fall-back (uhren zurückstellen). User must choose `fold`.
```json
{
  "ok": false,
  "error": "AMBIGUOUS_LOCAL_TIME",
  "code": "AMBIGUOUS_LOCAL_TIME",
  "details": {
    "choices": [
        { "fold": 0, "label": "Early (Summer Time)" },
        { "fold": 1, "label": "Late (Standard Time)" }
    ]
  }
}
```

#### 422 Unprocessable Entity (Invalid Time)
Occurs during DST spring-forward (uhren vorstellen). Time does not exist.
```json
{
  "ok": false,
  "error": "NONEXISTENT_LOCAL_TIME",
  "code": "NONEXISTENT_LOCAL_TIME",
  "details": {
    "suggestion": "03:00" // Time jump destination
  }
}
```

#### 401 Unauthorized
User not logged in.

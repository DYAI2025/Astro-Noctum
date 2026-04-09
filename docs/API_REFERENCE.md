# API Reference — Astro-Noctum (Bazodiac)

The backend is an Express server (`server.mjs`) that acts as a secure gateway — it proxies chart calculations to the external BAFE/FuFirE engine, runs Gemini AI generation server-side, and handles auth, Stripe payments, and ElevenLabs voice agent tooling.

**Base URL (production):** `https://app.bazodiac.space`  
**Dev:** `http://localhost:3000` (Vite dev server) + `http://localhost:3001` (Express API)

---

## Auth model

| Auth type | How | Used by |
|-----------|-----|---------|
| **Supabase JWT** | `Authorization: Bearer <supabase_access_token>` | Most user endpoints |
| **ElevenLabs secret** | `Authorization: Bearer <ELEVENLABS_TOOL_SECRET>` | Voice agent tool endpoints |
| **Stripe signature** | `stripe-signature` header (raw body) | Stripe webhook |
| **Public** | No auth required | Space weather, Jieqi, Aurora |

The `requireUserAuth` middleware validates Supabase JWTs and attaches `req.userId`.

---

## 1. Chart Calculation

### `POST /api/chart`

Full chart calculation — single atomic call to FuFirE `/chart`. Returns BaZi, Western, Wu-Xing, Fusion, and Time-Scale data in one response.

**Auth:** Supabase JWT (forwarded to FuFirE)

**Request body:**
```json
{
  "local_datetime": "1990-01-15T12:00:00",
  "tz": "Europe/Berlin",
  "lat": 52.52,
  "lon": 13.4,
  "ambiguousTime": "earlier",
  "nonexistentTime": "error"
}
```

> `local_datetime` is required — **not** `date`. This was changed in fix API-ONB-CHART-001.

**Response:** Raw FuFirE `ChartResponse` object (see `src/types/bafe.ts`). The client maps it via `mapChartToApiResults()` before use.

**Error codes:** `502` if FuFirE unreachable, `422` from FuFirE if payload invalid.

---

### `POST /api/calculate/{endpoint}` (deprecated)

Individual endpoints for each chart component. All prepend `/calculate/` to the path and proxy to FuFirE. Kept for backward compat — use `/api/chart` instead.

| Endpoint | Purpose |
|----------|---------|
| `POST /api/calculate/bazi` | Chinese Four Pillars |
| `POST /api/calculate/western` | Western natal chart |
| `POST /api/calculate/wuxing` | Wu-Xing Five Elements distribution |
| `POST /api/calculate/fusion` | Fusion signal overlay |
| `POST /api/calculate/tst` | Time-Sensitive Transits |

**Request body (all):**
```json
{
  "date": "1990-01-15T12:00:00",
  "tz": "Europe/Berlin",
  "lat": 52.52,
  "lon": 13.4,
  "ambiguousTime": "earlier",
  "nonexistentTime": "error"
}
```

---

## 2. Transit Signal

### `GET /api/transit-state/:userId`

Returns the current Fusion Ring signal state for the given user — the live data that drives the ring visualization.

**Auth:** Supabase JWT (own user only; 403 on cross-user access)

**Response:**
```json
{
  "sectors": [0.1, 0.5, 0.3, ...],
  "soulprint_sectors": [0.4, 0.6, ...],
  "quiz_sectors": [0.2, 0.7, ...],
  "transit_events": [...],
  "harmony_index": 0.52,
  "day_mode": "trace"
}
```

Server loads `astro_profiles` + `contribution_events` from Supabase, POSTs `soulprint_sectors` + `quiz_sectors` to FuFirE `/transit/state`, and maps the response to client schema. Falls back to profile-derived synthetic state on any error (response includes `X-Transit-Fallback: true` header).

Polled every 800ms by `useFusionSignal()` hook with exponential backoff.

---

## 3. Experience API

High-level orchestration layer built on top of FuFirE.

### `POST /api/experience/bootstrap`

Full onboarding bootstrap. Computes soulprint from birth data and generates narratives.

**Auth:** Supabase JWT

**Request body:**
```json
{
  "birth": {
    "date": "1990-01-15",
    "time": "12:00:00",
    "lat": 52.52,
    "lon": 13.4,
    "tz": "Europe/Berlin"
  }
}
```

**Response:**
```json
{
  "profile": { "sun_sign": "Capricorn", "moon_sign": "Cancer", ... },
  "soulprint_sectors": [0.4, 0.6, 0.3, 0.7, 0.5, 0.2, 0.8, 0.4, 0.6, 0.3, 0.5, 0.7],
  "narratives": { "de": "...", "en": "..." },
  "signature_blueprint": {
    "seed": "...",
    "visual": { "symmetry": 0.6, "curvature": 0.7, "angularity": 0.4, "density": 0.5, "contrast": 0.5, "orbit_count": 5 }
  },
  "meta": { "engine_version": "v1", ... },
  "soulprint_saved": true
}
```

**Error:** `400` if birth data missing/invalid, `502` on FuFirE failure.

---

### `POST /api/experience/signature-delta`

Applies a quiz answer to produce a delta update to the Fusion Ring. Used during onboarding Signatur reveal.

**Auth:** Supabase JWT

**Request body:**
```json
{
  "quiz_answer": [{ "id": "marker.emotion.empathy", "weight": 0.8 }],
  "signature_blueprint": { ... }
}
```

**Response:**
```json
{
  "quiz_sectors": [0.2, 0.7, ...],
  "narratives": { "de": "...", "en": "..." },
  "signature_delta": {
    "curvature": 0.56,
    "contrast": 0.52,
    "density": 0.6
  },
  "signature_blueprint": { ... }
}
```

---

### `POST /api/experience/daily`

Daily horoscope with Day-Pulse/Trace mode, resonance badges, and night harmony index.

**Auth:** Supabase JWT

**Request body:**
```json
{
  "birth": { "date": "1990-01-15", "time": "12:00:00", "lat": 52.52, "lon": 13.4, "tz": "Europe/Berlin" },
  "target_date": "2026-04-09",
  "locale": "de",
  "transit_influences": [
    { "planet": "Mars", "aspectDeg": 90, "fieldStrength": 0.72, "isResonant": false }
  ],
  "birth_sign": "Capricorn"
}
```

**Response:**
```json
{
  "date": "2026-04-09",
  "western": {
    "summary": "...",
    "themes": ["Transformation", "Klarheit"],
    "caution": "...",
    "opportunity": "...",
    "evidence": { "transit_sectors": [1, 5] }
  },
  "eastern": {
    "summary": "...",
    "themes": ["Feuer", "Struktur"],
    "caution": "...",
    "opportunity": "...",
    "evidence": { "day_master": "Jia" }
  },
  "fusion": {
    "summary": "...",
    "synthesis": "Main body text (day-mode voice)",
    "action": "Actionable advice",
    "pushworthy": true,
    "push_text": "Push notification string",
    "harmony_index": 0.52,
    "day_mode": "trace",
    "night_harmony_index": 0.44,
    "night_mode": "pulse"
  },
  "resonance_badges": [
    { "type": "transit", "label": "Mars Quadrat · Schärfend", "sublabel": "72%", "intensity": "mittel", "color": "#E87040" }
  ],
  "meta": { "engine_version": "v1-gemini-daily" }
}
```

**Caching:** L1 in-memory (process lifetime) + L2 Supabase `daily_horoscope_cache` table (keyed on `user_id, local_date, engine_version`). Cache TTL: rest of the day.

**Note:** `night_harmony_index` and `night_mode` are always computed fresh on each response (not cached) using Moon zodiac sign + BaZi hour branch.

---

## 4. Vibes & Weekly Insights

### `POST /api/vibes`

On-demand vibe insight — energy for the next 2–3 hours. Rate-limited by cooldown (premium: 2h, free: 8h).

**Auth:** Supabase JWT

**Request body:** none

**Response:**
```json
{
  "timestamp": "2026-04-09T10:00:00.000Z",
  "horizon": "2-3h",
  "kurzsignal": "Deine Energie fließt heute nach innen.",
  "treiber": [
    { "label": "Feuer", "description": "Dein dominantes Element ist heute aktiv." }
  ],
  "erklaerung": "Die aktuelle Konstellation ...",
  "explain": {
    "signatur_context": "Dominantes Element: Feuer",
    "transit_context": "Kp-Index: 3, Solar-Druck: 0.42"
  },
  "meta": { "engine_version": "v1-gemini-vibes", "cached": false },
  "cooldown": { "active": false, "next_available_at": "...", "remaining_ms": 0 }
}
```

If cooldown is active, the cached result is returned with `cooldown.active: true` and `remaining_ms > 0`.

**Guard:** Gemini output fields are rejected if they contain bare numbers (REQ-F-transparency-rule). Fallback text is substituted.

---

### `POST /api/weekly-insights`

Weekly life-area insights across 7 domains. Cached per ISO week (resets Monday).

**Auth:** Supabase JWT

**Request body:** none

**Response:**
```json
{
  "week": "2026-W15",
  "areas": [
    {
      "key": "liebe",
      "label": { "de": "Liebe", "en": "Love" },
      "statement": "Eine Phase der Tiefe und Verbundenheit.",
      "tendency": "Intensität",
      "explain": "...",
      "isHighlighted": true,
      "rank": 1
    }
  ],
  "meta": { "engine_version": "v1-gemini-weekly", "cached": false }
}
```

Area keys in order: `freundschaften`, `liebe`, `sex_zaertlichkeit`, `beruf`, `alltag`, `karriere`, `gesundheit`. Top-3 by computed score get `isHighlighted: true`.

---

## 5. Contributions (Fusion Ring Input)

### `POST /api/contribute`

Persists quiz sector weights for the authenticated user. Drives the Fusion Ring via the transit-state pipeline.

**Auth:** Supabase JWT (manual token validation — not `requireUserAuth`)

**Request body:**
```json
{
  "source": "quiz:naturkind:element-affinity",
  "sector_weights": [0.1, 0.5, 0.3, 0.7, 0.2, 0.8, 0.4, 0.6, 0.5, 0.3, 0.7, 0.2],
  "confidence": 0.85
}
```

- `source`: non-empty string identifying the quiz module
- `sector_weights`: exactly 12 floats in `[0, 1]`
- `confidence`: float in `[0, 1]`, defaults to `0.7`

**Response:** `201 { "ok": true }`

Upserts on `(user_id, module_id)` — repeated submissions from the same quiz module overwrite the previous entry.

---

### `POST /api/contribution/space-weather`

Converts a real-time solar weather event to 12-sector contribution weights and persists it.

**Auth:** Supabase JWT (manual token validation)

**Request body:**
```json
{
  "event_id": "cme-2026-04-08T12:00:00Z",
  "type": "cme",
  "severity": "G3",
  "signature_weight": 0.35,
  "started_at": "2026-04-08T12:00:00Z",
  "expires_at": "2026-04-10T12:00:00Z"
}
```

- `signature_weight`: float in `[0, 0.5]`; Fire-sign sectors (Aries 0, Leo 4, Sagittarius 8) receive 1.2× boost

**Response:** `201 { "ok": true, "module_id": "space-weather:cme-2026-04-08T12:00:00Z" }`

---

## 6. Space Weather

All space weather endpoints are **public** (no auth required).

### `GET /api/space-weather`

Basic geomagnetic data. Sources: NOAA SWPC (primary) → NASA DONKI (fallback). Cache: 15 minutes.

**Response:**
```json
{
  "kp_index": 3.2,
  "noaa_scale": "G1",
  "timestamp": "2026-04-09T09:00:00Z",
  "estimated": false,
  "source": "NOAA",
  "adapter_version": "v2"
}
```

---

### `GET /api/space-weather/extended`

Full NOAA + NASA DONKI aggregation. Cache: 5 minutes.

**Response:**
```json
{
  "current": { "kp": 3.2, "noaa_scale": "G1", "source": "NOAA" },
  "xray": { "flux": 1.2e-7, "class": "B1" },
  "proton_flux": 0.5,
  "f107": 142.3,
  "kp_forecast": [
    { "timestamp": "2026-04-09T12:00:00Z", "kp": 3.5, "noaaScale": "G1" }
  ],
  "events": [
    {
      "schema": "sp.contribution.v1",
      "type": "cme",
      "severity": "G2",
      "signature_weight": 0.25,
      "started_at": "...",
      "expires_at": "..."
    }
  ],
  "alerts": [...],
  "solar_pressure_score": 0.38,
  "ring_modulation": 1.19,
  "computed_at": "2026-04-09T10:00:00.000Z"
}
```

---

### `GET /api/space-weather/timeline`

X-ray flux curve + Kp bar chart data for the past 24h + next 72h forecast. Used by sky visualization.

**Response:** `{ "xrayCurve": [...], "kpBars": [...], "events": [...], "enlilWindow": null | { "startAt": "...", "endAt": "..." } }`

---

### `GET /api/aurora`

Aurora probability data for Europe (lat 45–72°N, lon -15–40°E). Cache: 30 minutes. Only fetches OVATION data when Kp ≥ 3.

**Response:**
```json
{
  "current_kp": 3.2,
  "europe_forecast": [
    { "lat": 60, "lon": 15, "aurora": 25 }
  ],
  "gfz_kp": null,
  "visibility_threshold_kp": 3,
  "computed_at": "..."
}
```

---

### `GET /api/jieqi/current`

Current Chinese solar term (Jieqi) computed server-side. Cache: 1 hour.

**Response:**
```json
{
  "name": "Qingming",
  "name_de": "Klarheit und Helligkeit",
  "start": "2026-04-05",
  "end": "2026-04-19",
  "element": "Wood",
  "description": "..."
}
```

---

### `GET /api/geometry/verify`

Proxies JPL Horizons API to verify planetary geometry events. Cache: 1 hour per query.

**Query params:** `body1`, `body2`, `date` (all required)

**Response:** `{ "body1": "Mars", "body2": "Jupiter", "date": "2026-04-09", "raw": "...", "verified": true, "source": "JPL Horizons" }`

---

### `GET /api/neo/upcoming`

Near-Earth objects from NASA NeoWs for the next 7 days. Cache: 6 hours. Returns top 5 by proximity.

**Response:**
```json
{
  "objects": [
    {
      "designation": "2024 YR4",
      "name": "(2024 YR4)",
      "closeApproachDate": "2026-04-12 14:32",
      "distanceKm": 1234567,
      "distanceEarthRadii": 193.7,
      "velocityKmS": 14.2,
      "estimatedDiameterM": 42,
      "isPotentiallyHazardous": false
    }
  ],
  "fetchedAt": "2026-04-09T10:00:00.000Z"
}
```

---

## 7. AI & Interpretation

### `POST /api/interpret`

Generates a Gemini AI horoscope interpretation from combined BAFE data. Gemini key stays server-side.

**Auth:** None (public)

**Request body:**
```json
{
  "data": { "bazi": {...}, "western": {...}, "wuxing": {...}, "fusion": {...} },
  "lang": "de"
}
```

**Response:** `{ "interpretation": "..." }` or `{ "text": "..." }` (legacy plain text fallback)

**Limits:** 50KB payload cap, 20s timeout.

---

### `POST /api/analyze/conversation`

Analyzes pasted dialogue using Gemini 2.0 Flash with the LeanDeep psychological marker framework.

**Auth:** None (public)

**Request body:**
```json
{
  "text": "Person A: ...\nPerson B: ...",
  "lang": "de"
}
```

**Response:**
```json
{
  "lines": [{ "speaker": "Person A", "text": "..." }],
  "markersA": [{ "id": "marker.emotion.empathy", "weight": 0.8 }],
  "markersB": [{ "id": "marker.freedom.growth", "weight": 0.8 }],
  "resonance": 0.75,
  "summary": "..."
}
```

Used by the `ConversationAnalysisQuiz` to extract markers from pasted dialogue.

---

## 8. Voice Agent (ElevenLabs)

All voice agent endpoints require `Authorization: Bearer <ELEVENLABS_TOOL_SECRET>`.

### `GET /api/profile/:userId`

Returns a condensed astrological + behavioral profile for the voice agent (Levi / Eve). Called by ElevenLabs custom tool on session start.

**Query params:** `agent_type` — `levi` (default) or `eve`

**Response:**
```json
{
  "user_id": "uuid",
  "display_name": "Maya",
  "birth_date": "1990-01-15",
  "birth_time": "12:00:00",
  "timezone": "Europe/Berlin",
  "sun_sign": "Capricorn",
  "moon_sign": "Cancer",
  "ascendant": "Libra",
  "day_master": "Jia",
  "zodiac_animal": "Ratte",
  "pillars": { "year": "Geng / Zi (Ratte)", "month": "...", "day": "...", "hour": "..." },
  "dominant_element": "Earth",
  "element_balance": { "Wood": 20, "Fire": 15, "Earth": 35, "Metal": 20, "Water": 10 },
  "fusion_theme": "Balance",
  "interpretation": "...",
  "soulprint_sectors": [0.4, 0.6, ...],
  "natal_weights": { "Sun": 0.65, "Moon": 0.48, ... },
  "dominant_planet": "Sun",
  "weakest_planet": "Saturn",
  "emergence_target": "Saturn",
  "signatur_summary": "Deine Signatur betont Erde — Stabilität, Fürsorge und Erdung.",
  "day_mode": { "mode": "trace", "harmony_index": 0.52, "synthesis": "..." },
  "vibes_summary": "Deine Energie fließt heute nach innen.",
  "past_conversations": [
    { "summary": "...", "topics": ["Beziehung", "Arbeit"], "created_at": "..." }
  ]
}
```

> `display_name` is read from `profiles.display_name` (DEC-display-name-db-only — never from FuFirE response).

---

### `POST /api/agent/conversation`

Saves a conversation summary after session ends. Used by ElevenLabs end-of-conversation tool.

**Auth:** ElevenLabs secret

**Request body:**
```json
{
  "user_id": "uuid",
  "summary": "User discussed relationship patterns...",
  "topics": ["Beziehung", "Venus-Transit"],
  "agent_type": "levi"
}
```

**Response:** `{ "status": "saved" }`

---

### `GET /api/agent/daily/:userId`

Returns today's daily horoscope in a condensed format for the voice agent to narrate.

**Auth:** ElevenLabs secret

**Response:** `{ "date": "...", "western": {...}, "eastern": {...}, "fusion": {...}, "user_context": { "sun_sign": "...", ... } }`

---

### `POST /api/agent/match`

Partner compatibility analysis for the Eve agent. Computes partner's chart via FuFirE, then cross-analyzes with user's stored chart.

**Auth:** ElevenLabs secret

**Request body:**
```json
{
  "user_id": "uuid",
  "partner_birth_date": "1992-03-20",
  "partner_birth_time": "14:30",
  "partner_birth_place": "München, Deutschland",
  "partner_time_known": true,
  "agent_type": "eve"
}
```

**Response:**
```json
{
  "western_compatibility": {
    "sun_sun": { "quality": "harmonisch", "description": "..." },
    "moon_moon": { ... },
    "sun_moon_cross": { ... },
    "asc_asc": { ... }
  },
  "eastern_compatibility": {
    "day_master_relation": { "relation": "Naehrend", "description": "..." },
    "year_pillar_match": { "harmony": "Liu-He", "description": "..." },
    "wuxing_overlay": { "shared_strengths": [...], "complementary_gaps": [...], "friction_points": [...] }
  },
  "fusion_match": {
    "harmony_score": 0.74,
    "resonance_anchors": [...],
    "growth_edges": [...],
    "fusion_narrative": "Anker: ... | Kanten: ..."
  }
}
```

---

### `POST /api/agent/summary`

Synthesizes a user profile from the last 3 conversation sessions using Gemini. Returns `null` until 3 sessions exist.

**Auth:** Supabase JWT

**Response:** `{ "summary": "...", "sessions_remaining": 0, "total_sessions": 5, "meta": { "engine": "gemini" } }`

---

## 9. Monetization

### `POST /api/checkout`

Creates a Stripe Checkout session for the Premium subscription.

**Auth:** Supabase JWT

**Request body (all optional):**
```json
{
  "successUrl": "bazodiac://upgrade/success",
  "cancelUrl": "bazodiac://upgrade/cancel",
  "platform": "ios",
  "userEmail": "user@example.com"
}
```

**Headers (optional, for mobile telemetry):** `X-App-Platform`, `X-App-Version`, `X-Device-Id`

**Response:** `{ "url": "https://checkout.stripe.com/...", "resolved": { "successUrl": "...", "cancelUrl": "..." } }`

Return URLs are allowlisted: web (`APP_URL`), iOS scheme (`bazodiac://`), Android scheme. Malformed or disallowed URLs fall back to `APP_URL`.

**Error:** `400` if user already has premium. `503` if Stripe not configured.

---

### `POST /api/customer-portal`

Redirects premium users to the Stripe Customer Portal to manage billing.

**Auth:** Supabase JWT

**Request body (optional):** `{ "returnUrl": "https://..." }`

**Response:** `{ "url": "https://billing.stripe.com/..." }`

**Error:** `403` if user is not premium.

---

### `POST /api/webhook/stripe`

Stripe webhook receiver. Requires raw request body for signature verification.

**Header:** `stripe-signature` (set automatically by Stripe)

**Handled events:**

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Sets `profiles.tier = 'premium'`, stores `stripe_customer_id` and `stripe_subscription_id` |
| `customer.subscription.updated` | Updates `tier` based on status; grace period for `past_due`/`unpaid` |
| `customer.subscription.deleted` | Downgrades to `free` (or keeps premium until `current_period_end` if still in grace) |
| `invoice.payment_succeeded` | Updates `subscription_end` on renewal |

---

## 10. Mobile App Config

### `GET /api/mobile/config`

Bootstrap contract for the mobile app. Returns feature flags, minimum version requirements, and Stripe/voice configuration.

**Auth:** None (public)

**Response:**
```json
{
  "api_version": "2026-03-13",
  "server_time": "2026-04-09T10:00:00.000Z",
  "min_supported_versions": { "ios": "1.0.0", "android": "1.0.0" },
  "feature_flags": {
    "quizzes_enabled": true,
    "wissen_enabled": true,
    "levi_voice_enabled": true,
    "fu_ring_native_enabled": false,
    "transit_polling_enabled": true
  },
  "checkout": {
    "default_success_url": "https://app.bazodiac.space?upgrade=success",
    "default_cancel_url": "https://app.bazodiac.space?upgrade=cancelled",
    "allowed_return_origins": ["https://app.bazodiac.space"],
    "allowed_return_schemes": ["bazodiac"],
    "app_scheme": "bazodiac"
  },
  "voice": {
    "provider": "elevenlabs",
    "mode": "webview",
    "requires_premium": true,
    "agent_id": "...",
    "profile_endpoint_template": "https://app.bazodiac.space/api/profile/:userId"
  }
}
```

---

## 11. Sharing

### `GET /share/:hash`

Public share page — returns the SPA `index.html` so client-side routing handles the hash. For social sharing, `GET /fu-ring` adds OpenGraph meta tags.

---

## 12. Debug (dev-only)

### `GET /api/debug-bafe`

Only available when `NODE_ENV !== 'production'`. Probes BAFE URLs and returns cache stats.

---

## Caching summary

| Endpoint | TTL | Storage |
|----------|-----|---------|
| `/api/experience/daily` | Day boundary | In-memory + Supabase `daily_horoscope_cache` |
| `/api/vibes` | Free: 8h / Premium: 2h | In-memory + Supabase `vibes_cache` |
| `/api/weekly-insights` | ISO week | In-memory + Supabase `weekly_insights_cache` |
| `/api/space-weather` | 15 min | In-memory |
| `/api/space-weather/extended` | 5 min | In-memory |
| `/api/space-weather/timeline` | 5 min | In-memory |
| `/api/aurora` | 30 min | In-memory |
| `/api/geometry/verify` | 1 h | In-memory Map |
| `/api/neo/upcoming` | 6 h | In-memory |
| `/api/jieqi/current` | 1 h | `Cache-Control` header only |
| `/api/calculate/*` | 24 h | In-memory (BAFE proxy cache) |

---

## Error codes

| Status | Meaning |
|--------|---------|
| `400` | Invalid request body or missing required field |
| `401` | Missing or invalid auth token |
| `403` | Cross-user access denied / tier restriction |
| `404` | Resource not found (profile, reading) |
| `422` | FuFirE validation error (e.g. missing `local_datetime`) |
| `500` | Supabase or internal error |
| `502` | Upstream (FuFirE / Gemini / Stripe) unavailable |
| `503` | Service not configured (Stripe, Gemini key missing) |

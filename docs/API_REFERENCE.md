# API Reference — Astro-Noctum (Bazodiac)

The backend is an Express server (`server.mjs`) that acts as a secure gateway for the frontend, handling authentication, external API proxies, and sensitive integrations.

## 1. Astro-Logic Proxy (`/api/calculate/*`)

These endpoints proxy requests to the upstream BAFE (Bazi & Astrology Fusion Engine) API. They include a 24-hour cache and automatic fallback handling.

### `POST /api/calculate/bazi`
Calculates the Chinese Four Pillars of Destiny.
- **Request Body:** `{ "date": "ISO8601", "tz": "IANA", "lat": number, "lon": number }`
- **Response:** Normalised pillars (Year, Month, Day, Hour) with English and Chinese keys.

### `POST /api/calculate/western`
Calculates the Western natal chart.
- **Request Body:** same as above.
- **Response:** Sun sign, Moon sign, Ascendant, and House cusps.

### `POST /api/calculate/wuxing`
Calculates the Five Element distribution.
- **Request Body:** same as above.
- **Response:** Intensity scores for Wood, Fire, Earth, Metal, and Water.

### `POST /api/calculate/fusion`
Calculates the mathematically fused signal overlay.
- **Request Body:** same as above.
- **Response:** 12-sector signal vector.

### `POST /api/calculate/tst`
Time-Sensitive Transit calculations.
- **Request Body:** same as above.
- **Response:** Planetary positions relative to the user's natal chart for the current moment.

---

## 2. User & Content (`/api/*`)

### `POST /api/auth/signup`
Creates a new user in Supabase.
- **Auth:** Anonymous.
- **Purpose:** Server-side signup allows for auto-confirmation of accounts using the service role key.

### `POST /api/interpret`
Generates a personalized horoscope using Gemini AI.
- **Auth:** Authenticated (Supabase JWT).
- **Request Body:** Combined BAFE data strings.
- **Response:** Markdown-formatted interpretation text.

### `POST /api/analyze/conversation`
Analyzes dialogue for psychological markers and speaker separation.
- **Auth:** Authenticated.
- **Purpose:** Uses Gemini 2.0 Flash to detect markers from the LeanDeep framework.

### `GET /api/profile/:userId`
Custom tool for ElevenLabs voice agent.
- **Auth:** `Authorization: Bearer <ELEVENLABS_TOOL_SECRET>`
- **Response:** User's cosmic profile, natal data, and past conversation summaries.

---

## 3. Monetization (`/api/checkout`, `/api/webhook/stripe`)

### `POST /api/checkout`
Creates a Stripe checkout session.
- **Auth:** Authenticated.
- **Response:** `{ "url": "https://checkout.stripe.com/..." }`

### `POST /api/webhook/stripe`
Handles Stripe events.
- **Purpose:** Listens for `checkout.session.completed` to upgrade the user's profile to `premium` status.

---

## 4. Utilities

### `GET /api/space-weather`
Proxies NASA DONKI and NOAA APIs for geomagnetic activity.
- **Response:** Current Kp-index and storm status.

### `GET /api/debug-bafe`
Status check for the BAFE fallback chain.
- **Response:** Cache statistics and recent error counts.

### `POST /api/share`
Generates a unique sharing hash for a user's chart.
- **Response:** `{ "hash": "unique_id" }`

### `GET /share/:hash`
Public endpoint to view a shared chart.
- **Response:** Rendered HTML with OpenGraph tags for social media previews.

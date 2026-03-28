Component-specific instructions for the **api-server**. Extends [../CLAUDE.code.md](../CLAUDE.code.md).

# API Server

**Responsibility**: Express proxy and orchestration layer — BAFE/FuFirE calculation proxy (fallback chain), Gemini AI interpretation, Stripe payments (checkout/webhook/portal), ElevenLabs voice agent endpoints, space weather aggregation (NOAA+DONKI), transit state computation, quiz contribution ingestion, Experience API proxy (bootstrap/delta/daily), Master Signal JS port (bootstrap/delta compute locally).

**Technology**: Express.js (Node 20), single-file `server.mjs`, Supabase service role client, Stripe SDK, Google Generative AI SDK

## Code Location

All API server source code lives in [`../../server.mjs`](../../server.mjs) (single file).
For code conventions, build commands, and dev setup see [`../../CLAUDE.md`](../../CLAUDE.md).

## Interfaces

- **HTTP ← frontend + mobile**: All `/api/*` routes. Three auth mechanisms: Supabase JWT (user endpoints), ElevenLabs Tool Secret (profile endpoint), Stripe Webhook Signature (webhook).
- **HTTP → BAFE/FuFirE**: Astrology calculations, Experience API, transit state. Internal Railway URL with public fallback.
- **HTTP → Supabase**: Server-side admin operations via `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS).
- **HTTP → Gemini**: AI horoscope generation (`gemini-2.5-flash`).
- **HTTP → ElevenLabs**: Agent session creation.
- **HTTP → Stripe**: Checkout sessions, customer portal, webhook validation.
- **HTTP → NOAA/NASA**: Space weather data aggregation (5-min cached).

## Requirements Addressed

| File | Type | Priority | Summary |
|------|------|----------|---------|
| [REQ-F-natal-chart-calculation](../../1-objectives/requirements/REQ-F-natal-chart-calculation.md) | REQ-F | Must | BAFE proxy with fallback chain |
| [REQ-F-space-weather-modulation](../../1-objectives/requirements/REQ-F-space-weather-modulation.md) | REQ-F | Should | NOAA+DONKI aggregation endpoint |
| [REQ-F-quiz-contribution-system](../../1-objectives/requirements/REQ-F-quiz-contribution-system.md) | REQ-F | Must | `/api/contribute` ingestion + transit-state composition |
| [REQ-F-cosmic-encounter-onboarding](../../1-objectives/requirements/REQ-F-cosmic-encounter-onboarding.md) | REQ-F | Must | Experience API proxy (bootstrap, signature-delta, daily) |

## Relevant Decisions

| File | Title | Trigger |
|------|-------|---------|
| [DEC-supabase-backend](../../2-design/decisions/DEC-supabase-backend.md) | Supabase as sole backend data layer | When writing data access or auth code |
| [DEC-swiss-ephemeris](../../2-design/decisions/DEC-swiss-ephemeris.md) | Swiss Ephemeris via BAFE | When adding or modifying BAFE proxy routes |
| [DEC-master-signal-weights](../../2-design/decisions/DEC-master-signal-weights.md) | Master Signal formula locked | When modifying Master Signal JS port in server.mjs |

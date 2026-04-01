# API Design

## Overview

Bazodiac runs as a React 19 SPA served by an Express.js production server (`server.mjs`). The server acts as a proxy and orchestration layer: it forwards astrology calculations to the BAFE/FuFirE backend, manages Supabase auth and persistence, handles Stripe payments, aggregates space weather data, and exposes ElevenLabs tool endpoints. All API routes live under `/api/` and are subject to a shared rate limit of 100 requests per 15 minutes per IP.

---

## Client Routes

Defined in `src/router.tsx`, all lazy-loaded via React Router.

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `DashboardPage` | Main astro dashboard |
| `/signatur` | `FuRingPage` | Signatur (Fusion Ring) visualization |
| `/fu-ring` | `FuRingPage` | Alias for `/signatur` (legacy route preserved) |
| `/signatur/quizzes` | `SignaturQuizzesPage` | Quiz selection for Signatur |
| `/wu-xing` | `WuXingPage` | Wu Xing five-elements detail |
| `/wissen` | `WissenPage` | SEO article index |
| `/wissen/:slug` | `ArtikelPage` | Individual SEO article |
| `/onboarding` | `OnboardingPage` | Birth data form → Signature reveal → Dashboard |
| `/sky` | `SkyPage` | Sky/space weather visualization |
| `/faq` | `FaqPage` | FAQ page |

---

## API Endpoints

### BAFE Calculation Proxy

Proxied to the BAFE backend with internal/public URL fallback chain. Each endpoint has independent fallback to empty data on failure.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/calculate/bazi` | None | BaZi four-pillar calculation |
| POST | `/api/calculate/western` | None | Western natal chart |
| POST | `/api/calculate/fusion` | None | Fusion analysis (BaZi + Western) |
| POST | `/api/calculate/wuxing` | None | Wu Xing element breakdown |
| POST | `/api/calculate/tst` | None | Time-Space-Terrain calculation |
| POST | `/api/chart` | None | Chart image generation |

### Experience API (FuFirE Proxy)

High-level endpoints proxied to FuFirE. Deterministic, template-based (no LLM). 10KB payload limit enforced by the proxy. See `docs/API_EXPERIENCE.md` for full request/response schemas.

| Method | Path | Auth | Timeout | Description |
|--------|------|------|---------|-------------|
| POST | `/api/experience/bootstrap` | None | 15s | Full profile bootstrap from birth data: computes soulprint vector + signature blueprint |
| POST | `/api/experience/signature-delta` | None | 10s | Incremental signature update from a quiz answer (70/30 blend) |
| POST | `/api/experience/daily` | None | 20s | Daily horoscope (Western + BaZi + Fusion synthesis) |

Unavailable FuFirE returns `502 {"error": "experience_unavailable"}`.

### Transit State

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/transit-state/:userId` | None | Loads user's `astro_profiles` + `contribution_events` from Supabase, POSTs to FuFirE `/transit/state`, maps response to client schema. Falls back to synthetic state (header `X-Transit-Fallback`) |

### Contribution

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/contribute` | Supabase JWT | Upserts quiz-derived sector weights to `contribution_events` table |

### Space Weather

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/space-weather/extended` | None | Aggregated NOAA SWPC + NASA DONKI data (5-min server-side cache) |
| POST | `/api/contribution/space-weather` | Supabase JWT | Stores space weather contribution event |

### Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth` | None | Signup with auto-confirm via Supabase service role key |

### Profile

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/profile/:userId` | `ELEVENLABS_TOOL_SECRET` | ElevenLabs tool endpoint returning soulprint sectors + natal weights (V2 data) |

### Agent

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/agent` | Supabase JWT | Creates an ElevenLabs agent session |

### Payments (Stripe)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/checkout` | Supabase JWT | Creates a Stripe Checkout session for premium upgrade |
| POST | `/api/webhook` | Stripe signature | Stripe webhook receiver (fulfills premium status) |
| POST | `/api/customer-portal` | Supabase JWT | Creates a Stripe Customer Portal session |

### Analysis

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/analyze/conversation` | Supabase JWT | Conversation analysis for PartnerMatch quiz |

---

## External APIs

| Service | Base URL | Auth Method | Purpose | Rate Limits |
|---------|----------|-------------|---------|-------------|
| **BAFE / FuFirE** | `BAFE_BASE_URL` (env) | None (internal network) | Astrology calculations, Experience API, transit state | Server-side; internal |
| **Supabase** | `VITE_SUPABASE_URL` (env) | Anon key (client), Service role key (server) | Auth, persistence (profiles, birth data, natal charts, contributions) | Supabase plan limits |
| **Google Gemini** | `generativelanguage.googleapis.com` | `GEMINI_API_KEY` | AI horoscope text generation (`gemini-3-flash-preview`, 15s timeout) | Google API quotas |
| **ElevenLabs** | ElevenLabs API | `ELEVENLABS_API_KEY` | Voice widget, agent sessions | ElevenLabs plan limits |
| **Stripe** | `api.stripe.com` | `STRIPE_SECRET_KEY` | Checkout, webhooks, customer portal | Stripe plan limits |
| **NOAA SWPC** | `services.swpc.noaa.gov` | None (public) | Solar wind, geomagnetic indices, alerts | Public; polled every 5 min |
| **NASA DONKI** | `api.nasa.gov` | `NASA_API_KEY` | Coronal mass ejections, solar flares | 1000 req/hour (default key) |

---

## Authentication

Three authentication mechanisms are in use:

1. **Supabase JWT** -- User-facing endpoints (`/api/contribute`, `/api/checkout`, `/api/customer-portal`, `/api/agent`, `/api/analyze/conversation`). The client obtains a JWT via Supabase SDK and sends it as `Authorization: Bearer <token>`. The server validates with the Supabase service role key.

2. **ElevenLabs Tool Secret** -- The `/api/profile/:userId` endpoint is called by ElevenLabs tools, not by the browser. Authenticated via `ELEVENLABS_TOOL_SECRET` header/query parameter.

3. **Stripe Webhook Signature** -- `/api/webhook` validates the `Stripe-Signature` header against `STRIPE_WEBHOOK_SECRET` using the Stripe SDK's `constructEvent()`.

---

## References

- [DEC-supabase-backend](decisions/DEC-supabase-backend.md) -- Decision to use Supabase as the backend platform
- [DEC-swiss-ephemeris](decisions/DEC-swiss-ephemeris.md) -- Decision to use Swiss Ephemeris for astronomical calculations
- [Experience API Reference](../docs/API_EXPERIENCE.md) -- Full request/response schemas for Experience API endpoints

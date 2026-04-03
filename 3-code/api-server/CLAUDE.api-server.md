Component-specific instructions for the **api-server**. Extends [../CLAUDE.code.md](../CLAUDE.code.md).

# API Server

**Responsibility**: Express proxy and orchestration layer — BAFE/FuFirE calculation proxy (fallback chain), Gemini AI interpretation + Vibes/Weekly insights generation (with two-level cache), Stripe payments (checkout/webhook/portal), multi-agent voice system (Levi + Eve via ElevenLabs), space weather aggregation (NOAA+DONKI, 5-min cache), transit state computation + Night-Pulse H calculation, quiz contribution ingestion, Experience API proxy (bootstrap/delta/daily), Master Signal JS port.

**Technology**: Express.js (Node 20), single-file `server.mjs`, Supabase service role client, Stripe SDK, Google Generative AI SDK

## Code Location

All API server source code lives in [`../../server.mjs`](../../server.mjs) (single file).
For code conventions, build commands, and dev setup see [`../../CLAUDE.md`](../../CLAUDE.md).

## Interfaces

- **HTTP ← frontend + mobile**: All `/api/*` routes. Three auth mechanisms: Supabase JWT (user endpoints), ElevenLabs Tool Secret (profile endpoint), Stripe Webhook Signature (webhook).
- **HTTP → BAFE/FuFirE**: Astrology calculations, Experience API, transit state. Internal Railway URL with public fallback.
- **HTTP → Supabase**: Server-side admin operations via `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS).
- **HTTP → Gemini**: AI generation for horoscopes, Vibes, and Weekly Insights (`gemini-2.5-flash`, 15s timeout).
- **HTTP → ElevenLabs**: Agent session creation.
- **HTTP → Stripe**: Checkout sessions, customer portal, webhook validation.
- **HTTP → NOAA/NASA**: Space weather data aggregation (5-min server-side cache).

## Requirements Addressed

| File | Type | Priority | Summary |
|------|------|----------|---------|
| [REQ-F-natal-chart-calculation](../../1-objectives/requirements/REQ-F-natal-chart-calculation.md) | REQ-F | Must | BAFE proxy with fallback chain |
| [REQ-F-space-weather-modulation](../../1-objectives/requirements/REQ-F-space-weather-modulation.md) | REQ-F | Should | NOAA+DONKI aggregation endpoint with 5-min cache |
| [REQ-F-quiz-contribution-system](../../1-objectives/requirements/REQ-F-quiz-contribution-system.md) | REQ-F | Must | `/api/contribute` ingestion + transit-state composition |
| [REQ-F-cosmic-encounter-onboarding](../../1-objectives/requirements/REQ-F-cosmic-encounter-onboarding.md) | REQ-F | Must | Experience API proxy (bootstrap, signature-delta, daily) |
| [REQ-F-eve-voice-agent](../../1-objectives/requirements/REQ-F-eve-voice-agent.md) | REQ-F | Must | Eve ElevenLabs agent with distinct persona |
| [REQ-F-agent-architecture-refactor](../../1-objectives/requirements/REQ-F-agent-architecture-refactor.md) | REQ-F | Must | Generic multi-agent system (config-driven, not Levi-specific) |
| [REQ-F-agent-conversation-persistence](../../1-objectives/requirements/REQ-F-agent-conversation-persistence.md) | REQ-F | Must | Conversation history per (user_id, agent_type) |
| [REQ-F-signatur-data-pipeline](../../1-objectives/requirements/REQ-F-signatur-data-pipeline.md) | REQ-F | Must | Transit-state computation: soulprint + contributions → FuFirE → client schema |
| [REQ-F-signatur-day-night-pulse](../../1-objectives/requirements/REQ-F-signatur-day-night-pulse.md) | REQ-F | Must | Night-Pulse H calculation: Moon position + BaZi night pillar |
| [REQ-F-vibes-core](../../1-objectives/requirements/REQ-F-vibes-core.md) | REQ-F | Must | `/api/vibes` endpoint: soulprint + transit → Gemini → 3-level JSON (L1+L2 cache) |
| [REQ-F-vibes-output-structure](../../1-objectives/requirements/REQ-F-vibes-output-structure.md) | REQ-F | Must | 3-level Gemini prompt design + output validation (kurzsignal/treiber/erklaerung) |
| [REQ-F-weekly-insights-engine](../../1-objectives/requirements/REQ-F-weekly-insights-engine.md) | REQ-F | Must | `/api/weekly-insights`: 7 life areas, ISO-week cache |
| [REQ-F-weekly-area-prioritization](../../1-objectives/requirements/REQ-F-weekly-area-prioritization.md) | REQ-F | Should | Top-3 life area selection algorithm (transit intensity × soulprint weight) |
| [REQ-F-transparency-rule](../../1-objectives/requirements/REQ-F-transparency-rule.md) | REQ-F | Must | Gemini output guard: reject/rewrite responses with bare numbers |
| [REQ-PERF-vibes-response-time](../../1-objectives/requirements/REQ-PERF-vibes-response-time.md) | REQ-PERF | Must | Vibes <2s p95 (Gemini), <200ms cache hit |

## Relevant Decisions

| File | Title | Trigger |
|------|-------|---------|
| [DEC-supabase-backend](../../2-design/decisions/DEC-supabase-backend.md) | Supabase as sole backend data layer | When writing data access or auth code |
| [DEC-swiss-ephemeris](../../2-design/decisions/DEC-swiss-ephemeris.md) | Swiss Ephemeris via BAFE | When adding or modifying BAFE proxy routes |
| [DEC-master-signal-weights](../../2-design/decisions/DEC-master-signal-weights.md) | Master Signal formula locked | When modifying Master Signal JS port in server.mjs |
| [DEC-multi-agent-voice](../../2-design/decisions/DEC-multi-agent-voice.md) | Levi + Eve as fixed voice personas | When adding agents, changing system prompts, or modifying agent config |
| [DEC-vibes-not-daily](../../2-design/decisions/DEC-vibes-not-daily.md) | Vibes on-demand (2–3h), not fixed daily | When modifying the Vibes endpoint or its trigger semantics |
| [DEC-no-number-without-explanation](../../2-design/decisions/DEC-no-number-without-explanation.md) | No numerical value without explanation | When designing Gemini prompts or API response schemas |
| [DEC-top-3-weekly-focus](../../2-design/decisions/DEC-top-3-weekly-focus.md) | Weekly Insights highlights exactly 3 areas | When modifying the weekly prioritization algorithm |
| [DEC-vibes-gemini-strategy](../../2-design/decisions/DEC-vibes-gemini-strategy.md) | Gemini for Vibes/Weekly with two-level caching | When modifying generation logic, model, prompts, or cache strategy |

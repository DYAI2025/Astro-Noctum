# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Workflow

- Always verify open task status against `git log` before reporting — `3-code/tasks.md` frequently lags behind actual commits by several sessions.
- Single-word responses ("proceed", "ship", "check again", "yes", "update") are complete instructions — act immediately without asking for clarification.

## What This Is

Bazodiac (Astro-Noctum) — a fusion astrology web + mobile app combining Western astrology, Chinese BaZi, and Wu-Xing (Five Elements). Users enter birth data, get chart calculations from the external BAFE API, AI-generated interpretations via Gemini, and can talk to "Levi Bazi" (an ElevenLabs voice agent). The UI is German-language, dark luxury aesthetic (obsidian/gold palette).

---

## Product Owner (PO) Co-Worker Role

When asked to act as Product Owner, adopt the following persona and responsibilities for all subsequent interactions in this session.

### Role

You are Claude, co-working as Product Owner for Bazodiac alongside Ben (the founder and lead developer). Your job is to ensure the team builds the right things in the right order — not to write code or make architectural decisions unilaterally.

### Responsibilities

| Area | What you do |
|------|-------------|
| **Backlog management** | Keep `3-code/tasks.md` clean, prioritized, and unambiguous. Surface stale items, duplicates, and tasks without requirement links. |
| **Requirement clarity** | Write unambiguous acceptance criteria. Use `/SDLC-elicit` when new requirements emerge. Flag vague tasks before they enter a sprint. |
| **Sprint planning** | Help Ben decide what goes into the next sprint based on priority, dependencies, and known blockers. |
| **Stakeholder alignment** | Translate product vision into SDLC artifacts. Ensure every GOAL has measurable success criteria. |
| **Risk surfacing** | Proactively flag blockers, missing decisions, stale assumptions. Do not resolve them silently — surface with options. |
| **Acceptance criteria** | Define what "done" looks like for each task. Think like the user: "what would I see if this worked correctly?" |

### Authority boundaries

**Decide autonomously (record in artifact):**
- Task priority within approved MoSCoW tiers
- Acceptance criteria wording (ask once, then apply)
- Which bug is most urgent
- Whether a backlog item needs more clarity before sprint entry

**Always ask Ben first:**
- Changing MoSCoW priority of a GOAL
- Lifting or adding a constraint
- Any change to the Master Signal weights formula (locked — see `DEC-master-signal-weights.md`)
- Monetization model changes
- Dashboard layout or UX direction decisions
- Partnership feature open questions (OQ-* items in tasks.md)
- Adding new stakeholder groups

### How to engage

- Communicate in whichever language Ben uses (German or English) — but all artifacts must be in English.
- Be direct and concise. No filler sentences.
- When surfacing a risk or blocker, always present: (1) what the problem is, (2) why it matters now, (3) two or three options, (4) your recommendation.
- Use `SDLC-status` to get a quick project health check before any planning session.
- When Ben says "klären wir das" or equivalent, gather context, then present a concrete proposal — do not ask open-ended questions.

### Key product context (current as of 2026-03-24)

- **Live features:** Fusion Ring V2 (spirograph, 28K particles), BaZi + Western + Wu-Xing calculation via BAFE, 22 quizzes, Levi voice agent, space weather modulation, premium paywall (Stripe — partially wired)
- **In-progress:** Dashboard layout redesign, onboarding flow, FuFirE Experience API wiring
- **Blocked:** Stripe checkout endpoint missing; STRIPE_WEBHOOK_SECRET not set; 3 silent-fail bugs (BUG-04/05/06)
- **Partnership features:** 18 tasks blocked on 6 open decisions (house system, synastry consent, orb tolerance, minor aspects, narrative generation, synastry signal type)
- **Monetization:** Stripe is the payment provider; `is_premium` flag in Supabase `profiles` table; `PremiumGate` component wraps gated features

---

## SDLC Scaffold

This repository uses the [ai-scrum-scaffold](../../../Scrum_Master/ai-scrum-scaffold) overlay for structured, AI-first development. All project knowledge — goals, requirements, decisions, tasks — lives alongside the source code.

### Skills

| Skill | Phase | Purpose |
|-------|-------|---------|
| `/SDLC-elicit` | Objectives | Define goals, requirements, assumptions, constraints |
| `/SDLC-design` | Design | Draft/update architecture, data model, API design |
| `/SDLC-decompose` | Design → Code | Identify components, create steering directories |
| `/SDLC-implementation-plan` | Code | Generate phased task backlog in `3-code/tasks.md` |
| `/SDLC-execute-next-task` | Code | Execute the next pending task |
| `/SDLC-fix` | Code | Bug fixes or ad-hoc changes with context gathering |
| `/SDLC-status` | Cross-phase | Project dashboard |

Existing `.claude/commands/` (bug-report, sprint, dev-brief, etc.) remain and complement the SDLC skills.

### Phase Structure

| Phase | Directory | Instructions |
|-------|-----------|-------------|
| Objectives | [`1-objectives/`](1-objectives/) | [`CLAUDE.objectives.md`](1-objectives/CLAUDE.objectives.md) |
| Design | [`2-design/`](2-design/) | [`CLAUDE.design.md`](2-design/CLAUDE.design.md) |
| Code | [`3-code/`](3-code/) | [`CLAUDE.code.md`](3-code/CLAUDE.code.md) |
| Deploy | [`4-deploy/`](4-deploy/) | [`CLAUDE.deploy.md`](4-deploy/CLAUDE.deploy.md) |

When working in a phase, read its `CLAUDE.<phase>.md` — it extends (not overrides) this file.

### Artifacts

All artifact IDs use `PREFIX-kebab-name` (e.g., `GOAL-fusion-astrology`, `REQ-F-natal-chart`, `DEC-supabase-backend`). No numeric sequences.

| Prefix | Artifact | Location |
|--------|----------|----------|
| `GOAL` | Goals | `1-objectives/goals/` |
| `REQ-CLASS` | Requirements | `1-objectives/requirements/` |
| `ASM` | Assumptions | `1-objectives/assumptions/` |
| `CON` | Constraints | `1-objectives/constraints/` |
| `DEC` | Decisions | `2-design/decisions/` |
| `TASK` | Tasks | `3-code/tasks.md` |

### Decisions

Decisions live in `2-design/decisions/`. Two files per decision: `DEC-*.md` (enforcement — read during tasks) and `DEC-*.history.md` (audit trail — read only when evaluating changes). See [`PROCEDURES.md`](2-design/decisions/PROCEDURES.md).

### Graduated Safeguards

| Tier | When | Agent behavior |
|------|------|----------------|
| **Always ask** | Conflict resolution, design gaps, decision deprecation | Stop, present options, wait for approval |
| **Ask first time** | Naming conventions, error handling patterns | Ask once, record decision, apply consistently |
| **Decide and record** | Routine choices within established patterns | Decide autonomously, record in artifact |

### Phase Gates (advisory)

| Transition | Preconditions |
|------------|---------------|
| Objectives → Design | At least one Goal Approved; at least one Requirement Approved |
| Design → Code | Design documents drafted; components identified |

### Tooling Roles

| Tool | Role |
|------|------|
| Scaffold (in-repo) | Source of truth for goals, requirements, decisions, tasks |
| [Miro](https://miro.com/app/board/uXjVGuainfM=/) | Brainstorming only — not a source of truth |
| GitHub Issues | Bug reports and CI failures |

### Cross-Skill Artifact Procedures

Any modification to phase artifacts must follow the authoritative skill for that phase:
- **Objectives** (`1-objectives/`): [`.claude/skills/SDLC-elicit/SKILL.md`](.claude/skills/SDLC-elicit/SKILL.md)
- **Design** (`2-design/`): [`.claude/skills/SDLC-design/SKILL.md`](.claude/skills/SDLC-design/SKILL.md)
- **Tasks** (`3-code/tasks.md`): [`.claude/skills/SDLC-implementation-plan/SKILL.md`](.claude/skills/SDLC-implementation-plan/SKILL.md)

---

## Monorepo Structure

```
├── src/                    # Web app (React 19 SPA)
├── server.mjs              # Express production server
├── apps/mobile/            # iOS app (Expo 53 / React Native 0.79)
├── packages/shared/        # @bazodiac/shared — fusion signal math, quiz schemas/scoring, i18n
├── features/plan/          # Planning artefacts (NOT part of build)
├── bazodiac_engine/        # Python reference implementation (NOT part of build)
└── docs/plans/             # Implementation plans
```

The mobile app depends on `@bazodiac/shared` via `"file:../../packages/shared"` in its package.json. The web app imports shared code directly from `packages/shared/src/` (no build step needed — TypeScript source).

## Commands

### Web App (root)

```bash
npm run dev        # Vite dev server on :3000 with HMR
npm run build      # Production build → dist/
npm run start      # Express production server (serves dist/)
npm run lint       # TypeScript type-check (tsc --noEmit)
npm run clean      # Remove dist/
npm run test       # Run Vitest test suite (once)
npm run test:watch # Vitest in watch mode
npm run test:coverage # Vitest with coverage
npx vitest run src/__tests__/fusion-ring.test.ts  # Run a single test file

# Full local dev (needs both):
# Terminal 1: npm run dev                    (Vite on :3000)
# Terminal 2: PORT=3001 node server.mjs      (Express API on :3001, for /api/auth, /api/profile, /api/agent)
```

### Mobile App (apps/mobile/)

```bash
cd apps/mobile
npx expo run:ios           # Build + run on iOS simulator
npx expo start             # Start Metro bundler (Expo Go)
npx tsc --noEmit           # TypeScript check (mobile-only)
npx expo install <pkg>     # Install SDK-compatible packages
eas build --platform ios   # Production build via EAS
```

### Shared Package (packages/shared/)

```bash
cd packages/shared
npx tsc --noEmit                                    # TypeScript check
npx vitest run src/quizzes/__tests__/scoring.test.ts # Run scoring tests
```

Node 20.19+ required (pinned in `.nvmrc`). Web tests live in `src/__tests__/`, shared tests in `packages/shared/src/**/__tests__/`. Copy `.env.example` to `.env.local` and fill values before starting dev.

## Conventions

- **Commits**: Conventional Commits with ticket IDs — `feat(AN-15): add upgrade banner`, `fix(AN-17): scale down ring`
- **Components**: PascalCase (`BirthForm`), hooks: `use` prefix + camelCase (`useAmbientePlayer`), contexts: suffix `Context`
- **Styling**: Tailwind utility classes; colocated component styles over global overrides
- **Language**: UI text is German; code identifiers and comments in English

## Architecture

**React 19 SPA** — Vite + React Router v6 + Tailwind CSS v4 + TypeScript. The top-level auth/onboarding flow is state-driven in `App.tsx` (`Splash → AuthGate → BirthForm`), then React Router takes over for authenticated pages.

### Routes

Defined in `src/router.tsx`, all lazy-loaded:

| Route | Page |
|-------|------|
| `/` | `DashboardPage` — main astro dashboard |
| `/signatur` | `FuRingPage` — Signatur (Fusion Ring) visualization |
| `/wu-xing` | `WuXingPage` — Wu Xing five-elements detail |
| `/wissen` | `WissenPage` — SEO article index |
| `/wissen/:slug` | `ArtikelPage` — individual SEO article |

### Two Server Contexts

- **Vite dev server** (`npm run dev`): Proxies `/api/calculate/*` to BAFE and `/api/auth`, `/api/profile`, `/api/agent` to a local Express instance (port 3001). Configured in `vite.config.ts`.
- **Express production server** (`server.mjs`): Serves built `dist/`, proxies to BAFE with internal/public URL fallback chain, handles server-side auth (signup with auto-confirm via Supabase service role key), ElevenLabs profile endpoint, and agent session creation.

### Data Flow

1. `BirthForm` collects date/time/coordinates/timezone (location search uses OpenStreetMap/Nominatim — Google Maps was removed)
2. `services/api.ts` → `calculateAll()` fires 5 parallel requests to BAFE (bazi, western, fusion, wuxing, tst) via same-origin proxy. Each endpoint has independent fallback to empty data on failure.
3. `services/gemini.ts` → sends combined results to Gemini for AI interpretation (with German fallback text if API unavailable)
4. `services/supabase.ts` → persists birth_data, astro_profiles (upsert), natal_charts to Supabase (non-blocking, fire-and-forget)
5. `Dashboard` renders results + 3D orrery + ElevenLabs voice widget

### Signatur (Fusion Ring) Data Pipeline

The ring visualization is fed by a multi-stage pipeline:

1. **Transit State fetch**: `useFusionSignal(userId)` polls `GET /api/transit-state/:userId` every 800ms with exponential backoff
2. **Server proxy** (`server.mjs`): Loads user's `astro_profiles` + `contribution_events` from Supabase, POSTs `soulprint_sectors` + `quiz_sectors` to FuFirE `/transit/state`, maps response to client schema. Falls back to profile-derived synthetic state on any error (marked via `X-Transit-Fallback` header)
3. **Canvas rendering (V2)**: `FusionRing3D` passes `signalData.baseSignals` (12 sectors) through `soulprintToNatalWeights()` → 7 planet weights → `FusionRingCanvasV2` which uses Cousto-frequency spirograph geometry with 28K particles, 4-tier detail, kaleidoscope folding. Gated by `signature_engine_v2` feature flag; falls back to V1 `FusionRingWebsiteCanvas` (12→32 sector deformation) when disabled
4. **Quiz contribution**: On quiz completion, `useQuizContribution` converts `ContributionEvent` → sector weights via `eventToSectorSignals()` + `AFFINITY_MAP`, checks cluster completion gate, then fire-and-forget POSTs to `POST /api/contribute` which upserts to `contribution_events` table

```
Quiz → ContributionEvent → eventToSectorSignals() → POST /api/contribute → contribution_events
                                                                                    ↓
useFusionSignal ← GET /api/transit-state ← server loads profile + contributions → POST FuFirE
       ↓
FusionRing3D → baseSignals[12] → soulprintToNatalWeights() → natalWeights{7} → FusionRingCanvasV2
                                                                                (spirograph engine)
       (V1 fallback: baseSignals → soulProfile prop → FusionRingWebsiteCanvas → soulNoise())
```

**Important**: The quiz→ring pipeline is live on `/signatur` (FuRingPage). `ClusterSidebar` triggers quiz selection, `QuizOverlay` renders the quiz, `useQuizContribution` handles completion → cluster gate → `/api/contribute` POST.

### Key Modules

| Path | Purpose |
|------|---------|
| `src/App.tsx` | Root component — holds all app state, orchestrates the Splash → Auth → Form → Dashboard flow |
| `src/contexts/AuthContext.tsx` | Supabase auth provider (signIn/signUp/signOut). Signup is client-side via Supabase SDK. Detects existing users via empty `identities` array and auto-redirects to sign-in |
| `src/services/api.ts` | BAFE API client. Maps BAFE response formats (German keys like `stamm/zweig/tier`) to Dashboard-expected English keys. Zodiac signs mapped from 0-based index to name strings |
| `src/services/gemini.ts` | Gemini Flash integration for horoscope text generation (model: `gemini-3-flash-preview`, 15s timeout) |
| `src/lib/supabase.ts` | Browser-side Supabase client singleton (init from `VITE_SUPABASE_*` env vars) |
| `src/services/supabase.ts` | Supabase persistence layer — `upsertAstroProfile`, `insertBirthData`, `insertNatalChart`, `fetchAstroProfile` |
| `src/components/BirthChartOrrery.tsx` | Three.js 3D solar system visualization with Keplerian orbital mechanics |
| `src/lib/astronomy/` | Orbital calculations (Kepler solver, J2000 epoch), star catalog (150 stars), constellation data, planet orbital elements |
| `src/lib/3d/materials.ts` | Custom GLSL shaders (sun corona, atmospheric Fresnel glow, Saturn rings with Cassini division) |
| `server.mjs` | Production Express server: BAFE proxy with fallback chain, Master Signal JS port (bootstrap/delta compute locally instead of FuFirE proxy), `/api/contribute` endpoint, `/api/space-weather/extended` (5-min cached NOAA+DONKI aggregation), `/api/contribution/space-weather` (POST), Supabase admin auth, ElevenLabs tool endpoints (V2 data: soulprint sectors + natal weights), Stripe checkout + webhook + customer portal |
| `src/lib/fusion-ring/` | Fusion Ring engine — signal computation, BaZi/Western/Wu-Xing layers, transit math, canvas draw utilities |
| `src/contexts/FusionRingContext.tsx` | React context providing Fusion Ring state to the whole app |
| `src/hooks/useFusionRing.ts` | Hook that combines BAFE data + transit data into FusionRing signal |
| `src/hooks/useFusionSignal.ts` | Polls `/api/transit-state/:userId`, parses via Zod `TransitStateSchema`, computes `FusionSignalData` (targetSignals, baseSignals, thirtyDayAvg, transitIntensity) |
| `src/hooks/useQuizContribution.ts` | Quiz `onComplete` handler: converts `ContributionEvent` → sector weights, checks cluster gate, fire-and-forget POSTs to `/api/contribute` |
| `src/services/contribute.ts` | Client-side fire-and-forget service: gets Supabase JWT, POSTs sector weights to `/api/contribute` |
| `src/lib/schemas/transit-state.ts` | Zod schemas for `TransitState`, `TransitEvent`, `FusionSignalData` — shared contract between server and client |
| `src/hooks/usePremium.ts` | Reads `profiles.is_premium` from Supabase; re-fetches on tab focus (for Stripe redirect return) |
| `src/components/PremiumGate.tsx` | Wrapper that locks content behind premium; triggers Stripe checkout via `/api/checkout` |
| `src/data/articles.ts` | SEO article content (6 articles, full German text, TypeScript) |
| `src/components/QuizOverlay.tsx` | Modal overlay that hosts the quiz system. Mounted on FuRingPage with `useQuizContribution` as `onComplete` handler. Controlled by `activeQuiz` state from `ClusterSidebar` |
| `src/lib/lme/types.ts` | Lifecycle Mapping Engine event types — `ContributionEvent`, `Marker`, `TraitScore`, `Tag`. Typed contract between quizzes and the Fusion Ring; quizzes emit `ContributionEvent`s, `useFusionRing` consumes them |
| `src/components/quizzes/` | 22 quiz components (14 regular + 4 Kinky + 4 PartnerMatch); results feed into Fusion Ring via `src/lib/fusion-ring/quiz-to-event.ts` |
| `src/components/quizzes/Kinky/` | Kinky quiz series (multi-part, premium) |
| `src/components/quizzes/PartnerMatch/` | PartnerMatch quiz series including `ConversationAnalysisQuiz` |
| `src/components/ClusterEnergySystem.tsx` | Renders quiz-result "energy clusters" on the Dashboard |
| `src/components/fusion-ring-3d/FusionRing3D.tsx` | Three.js 3D Fusion Ring — used on `/fu-ring` page |
| `src/components/fusion-ring-website/bazodiac-engine.ts` | V2 Signatur engine (891 lines) — Cousto-frequency spirograph math, 7 planet definitions with Hz/color/zodiac, 4-tier particle generation (glow→curve→fractal→subfractal), kaleidoscope folding, emergence/pattern-jump detection. Pure TypeScript, no framework deps |
| `src/components/fusion-ring-website/FusionRingCanvasV2.tsx` | V2 Three.js renderer (1699 lines) — consumes `natalWeights` (7 planets) + `quizWeights` (6 dimensions) props, renders 28K spirograph particles with bloom postprocessing. Has built-in config panel, audio integration, effect system. Replaces V1 when `signature_engine_v2` flag is enabled |
| `src/components/fusion-ring-website/signatur-bridge.ts` | Adapter: `soulprintToNatalWeights()` converts 12-sector soulprint → 7 planet weights via zodiac affinity mapping (Sun→Leo, Moon→Cancer, etc.). `quizSectorsToQuizWeights()` converts 12-sector quiz data → 6 quiz dimensions |
| `src/components/fusion-ring-website/FusionRingWebsiteCanvas.tsx` | V1 canvas-based Fusion Ring (kept as fallback). Accepts `soulProfile` prop (12 sectors) which is interpolated to 32 ring points and fed to `soulNoise()` via module-level `_activeSoulProfile`. Falls back to `DEFAULT_SOUL_PROFILE` when no prop provided |
| `src/hooks/useSpaceWeather.ts` | Polls `/api/space-weather/extended` every 5 min, computes solar pressure score + ring modulation + visual intensity via Zod-validated response. Triggers ring effects during G3+ storms |
| `src/hooks/useAmbientePlayer.ts` | Ambient audio playback control |
| `src/contexts/PlanetariumContext.tsx` | Context for the 3D orrery/planetarium state |
| `src/contexts/LanguageContext.tsx` | i18n context (German UI default) |
| `src/contexts/AppLayoutContext.tsx` | Layout/sidebar state shared across pages |
| `src/types/bafe.ts` | TypeScript types for raw BAFE API responses (characterization-based; see BAFE mapping gotcha) |
| `src/lib/master-signal/` | Master Signal engine — GCB (Grand Cosmic Blueprint) builder, natal/quiz/ring projections, cross-referencing, narrative generation. Combines all astrological layers into a single unified signal |
| `src/lib/master-signal/master-signal-builder.ts` | Orchestrates GCB → dimensional scores → projections pipeline |
| `src/lib/master-signal/gcb-builder.ts` | Builds GCB from raw BAFE data (BaZi pillars + Western planets + Wu-Xing elements) |
| `src/types/interpretation.ts` | Types for Gemini AI interpretation results |

### Experience API & Onboarding Signatur

The Experience API is a high-level layer on FuFirE that orchestrates bootstrap, quiz interaction, and daily horoscope generation. See `docs/API_EXPERIENCE.md` for the full API reference and `docs/ARCHITECTURE_EXPERIENCE.md` for architecture diagrams.

**Onboarding flow:** `App.tsx` now has a three-phase onboarding state (`form` → `signature` → `done`). After the user submits birth data, `bootstrapExperience()` is called in parallel with the legacy BAFE flow. If bootstrap succeeds, the `SignatureReveal` phase shows the Signatur ring driven by the soulprint, a profile summary, and a single quiz question. The quiz answer triggers `signatureDelta()` which animates the ring, then transitions to the Dashboard.

| Path | Purpose |
|------|---------|
| `src/services/experience.ts` | Experience API client — `bootstrapExperience()`, `signatureDelta()`, `fetchDailyExperience()`. All POST to `/api/experience/*` proxy |
| `src/lib/schemas/experience.ts` | Zod schemas for all Experience API responses (`BootstrapResponseSchema`, `SignatureDeltaResponseSchema`, `DailyResponseSchema`) |
| `src/lib/feature-flags.ts` | Feature flag module with localStorage override. Three flags: `signature_onboarding_v1` (onboarding flow), `daily_modal_v1` (daily modal), `signature_engine_v2` (V2 spirograph engine, default true) |
| `src/components/onboarding/SignatureReveal.tsx` | Signatur reveal phase — shows V2 or V1 ring (gated by `signature_engine_v2`), profile summary, quiz question. Calls `signatureDelta()` on answer, passes quiz weights to V2 |
| `src/components/dashboard/DailyHoroscopeModal.tsx` | 3-tab modal (Westlich/BaZi/Fusion) showing the daily horoscope. Rendered on first Dashboard visit |
| `src/hooks/useFirstRunDaily.ts` | Hook that checks `profiles.daily_modal_seen`, then fetches daily horoscope via Experience API. Caches in localStorage by date |
| `supabase-migrations/20260316_experience_tables.sql` | Migration: creates `user_signature_state`, `daily_horoscope_cache` tables; adds `soulprint_sectors` to `astro_profiles` and `daily_modal_seen` to `profiles` |

**Feature flags:** Override in browser console via `localStorage.setItem('ff_signature_onboarding_v1', 'false')`. When off, the app falls through to the legacy BAFE-only flow. The V2 engine can be disabled via `localStorage.setItem('ff_signature_engine_v2', 'false')` — all three ring mount points (SignatureReveal, Dashboard, FuRingPage) instantly fall back to V1.

**Server proxy:** `server.mjs` proxies all three Experience endpoints (`/api/experience/bootstrap`, `/api/experience/signature-delta`, `/api/experience/daily`) to FuFirE. The bootstrap and signature-delta routes are protected with `requireUserAuth`, while the daily route is currently unauthenticated. All three use 10KB payload limits, 10–20s timeouts, and return 502 on FuFirE failure.

### Space Weather Pipeline

Real-time solar weather data feeds into the Fusion Ring as a visual modulation layer. The pipeline fetches from NOAA SWPC (Kp, F10.7, X-ray, proton flux) and NASA DONKI (CME, SEP, HSS events), computes a solar pressure score, and modulates ring particle intensity/color.

```
NOAA SWPC (Kp, F10.7, Xray, Proton) ─┐
                                        ├→ server.mjs /api/space-weather/extended (5-min cache)
NASA DONKI (CME, SEP, HSS, Alerts) ───┘           ↓
                                        useSpaceWeather() polls every 5 min
                                                   ↓
                                        computeSolarPressureScore() → ringModulation (1.0–1.5)
                                                   ↓
                                        FuRingPage → ring particle intensity + korona_eruption effects (G3+)
```

| Path | Purpose |
|------|---------|
| `src/lib/space-weather/types.ts` | Shared types: `KpReading`, `F107Reading`, `XrayFluxReading`, `ProtonFluxReading`, `SpaceWeatherSeverity` (G0–G5, S1–S5, R1–R5), `SpaceWeatherContribution` (schema `sp.contribution.v1` with mandatory `expires_at`) |
| `src/lib/space-weather/noaa-adapter.ts` | Versioned NOAA SWPC JSON fetcher — `createNoaaAdapter()` factory returns composite adapter trying v2 keys first, falling back to v1 via `withFallback(primary, fallback, emptyValue)` pattern |
| `src/lib/space-weather/donki-extended.ts` | NASA DONKI extended: earthbound CME detection (via `enlilList.isEarthTargeted`), SEP events, HSS events, Warning/Watch alerts. Parallel `Promise.allSettled` for all 4 endpoints |
| `src/lib/space-weather/solar-pressure.ts` | `computeSolarPressureScore(kp, xrayFlux, protonFlux)` → 0–1 weighted blend. `computeRingModulation(solarPressure, maxEventWeight)` → 1.0 (calm) to 1.5 (extreme). `kpToVisualIntensity(kp)` → G-scale with `intensityBoost` and `triggerEffect` |
| `src/lib/space-weather/geometry-gating.ts` | `isSignificantGeometryEvent()` — gating function that only emits contribution events when geometry (conjunction/opposition/equinox/solstice) coincides with solar disturbance (Kp >= 5, CME, or Jieqi transition) |
| `src/lib/schemas/space-weather.ts` | Zod schemas: `SpaceWeatherContributionSchema`, `SpaceWeatherExtendedSchema` |

**Rate limiting note**: NASA DEMO_KEY allows 30 req/hour. With 4 DONKI endpoints per call and 5-min server cache, sustained polling stays within limits. Set `NASA_API_KEY` env var for production.

### BAFE Response Mapping (Important Gotcha)

`services/api.ts` transforms BAFE responses before the Dashboard consumes them:
- **BaZi pillars**: BAFE uses German keys (`stamm`/`zweig`/`tier`/`element`) → mapped to English (`stem`/`branch`/`animal`/`element`)
- **Western zodiac**: BAFE returns `zodiac_sign` as 0-based index (0=Aries..11=Pisces) → mapped to English name strings
- **Ascendant**: BAFE returns degrees → converted to sign name via `signFromDegrees()`

If BAFE schema changes, update the mappers in `api.ts` — the Dashboard expects the transformed format.

### External Dependencies

- **BAFE API**: Astrology calculation backend (routes at `/calculate/{bazi,western,fusion,wuxing,tst}` and `/chart`). Default: `https://bafe.vercel.app`. BAFE is not always reachable from dev environments (see Known Issues).
- **Supabase**: Auth + Postgres. Schema in `supabase-schema.sql`. Tables: `profiles`, `birth_data`, `astro_profiles`, `natal_charts`, `contribution_events`, `agent_conversations`. RLS enabled on all tables. Signup trigger auto-creates profile row. `contribution_events` stores quiz sector weights (upserted on `user_id,module_id`) — read by the transit-state proxy to compute `quiz_sectors`.
- **Gemini API**: Text generation via `@google/genai` SDK (model: `gemini-3-flash-preview`). Falls back to hardcoded German text if unavailable.
- **ElevenLabs**: Voice agent widget (Levi Bazi). Tool configs in `elevenlabs-tool.json` and `elevenlabs-tool-save-conversation.json`. The widget calls back to `/api/profile/:userId` on the server (requires `ELEVENLABS_TOOL_SECRET` Bearer auth).

### Environment Variables

Two scopes — `VITE_` prefixed vars are exposed to browser, unprefixed are server-only. See `.env.example` for the full list. Critical:
- Browser: `VITE_GEMINI_API_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_BAFE_BASE_URL`, `VITE_ELEVENLABS_AGENT_ID`
- Server-only: `SUPABASE_SERVICE_ROLE_KEY`, `ELEVENLABS_TOOL_SECRET`, `BAFE_INTERNAL_URL`, `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`

Note: `vite.config.ts` also exposes `GEMINI_API_KEY` (non-VITE prefixed) via `define` for backward compat.

### Styling

Tailwind v4 with `@theme` custom tokens in `src/index.css`: `--color-obsidian: #00050A`, `--color-gold: #D4AF37`, `--color-ash: #1A1C1E`. Fonts: Sora (sans), Cormorant Garamond (serif). Custom CSS classes: `.glass-card`, `.stele-card`, `.skeleton-dust`, `.grain-overlay`.

### Static Assets

Vite serves from `public/` directory (configured as `publicDir: 'public'` in `vite.config.ts`). Static assets should be placed there. The `media/` directory is likely legacy or used for source assets.

### Deployment

Railway via `nixpacks.toml` + `railway.json`. Build: `npm ci && npm run build`. Start: `node server.mjs`. The Express server handles BAFE routing with fallback from Railway internal networking (IPv6, often unreliable) to public URL.

### Path Alias

`@/*` maps to **project root** (not `src/`), configured in both `tsconfig.json` and `vite.config.ts`. So `@/src/services/api` resolves to `./src/services/api`.

### Quiz → Fusion Ring Integration

All 22 quiz components share the same props contract: `{ onComplete: (event: ContributionEvent) => void, onClose: () => void }`. Each quiz calls its dedicated converter from `quiz-to-event.ts` (e.g., `loveLangToEvent()`, `kinkySeriesQuizToEvent()`) which produces a `ContributionEvent` with semantic `Marker`s (format: `marker.{domain}.{keyword}`, weight 0–1).

The `useQuizContribution` hook converts events to 12-sector weights using `eventToSectorSignals()` + `AFFINITY_MAP` (maps marker keywords to 12-element zodiac-sector weight vectors), checks the cluster completion gate (a cluster's contribution is only persisted when ALL quizzes in the cluster are complete), then fire-and-forget POSTs to `/api/contribute`. Series quizzes (Kinky, PartnerMatch) share state via a series-level component that wraps individual quiz steps and load quiz data from colocated JSON files.

Six clusters in `src/lib/fusion-ring/clusters.ts`: naturkind (4 quizzes), mentalist (3), stratege (4), mystiker (4), kinky (4, premium), partner_match (4). The `ConversationAnalysisQuiz` in PartnerMatch is AI-powered — it calls `/api/analyze/conversation` server-side to extract markers from pasted dialogue.

`QuizOverlay` is the master router — maps quiz IDs to lazy-loaded components via `QUIZ_MAP`. Mounted on FuRingPage, controlled by `activeQuiz` state.

### Shared Package (`@bazodiac/shared`)

`packages/shared/` contains code shared between web and mobile:

| Path | Purpose |
|------|---------|
| `src/fusion-ring/signal.ts` | `computeFusionSignal()` — 12-sector weighted blend of western/bazi/wuxing/quiz vectors with opposition smoothing |
| `src/fusion-ring/constants.ts` | Sector definitions, opposition pairs, weight factors |
| `src/quizzes/schema.ts` | Unified `QuizDefinition` type covering all 3 scoring models (multi-dimension, categorical, profile-driven) |
| `src/quizzes/scoring.ts` | `scoreQuiz()` — universal scoring engine that handles any `QuizDefinition` |
| `src/quizzes/definitions/` | All 22 quiz definitions extracted as TypeScript objects (+ ConversationAnalysis) |
| `src/experience/` | `BootstrapResponse` and related types for the Experience API |
| `src/transit/` | Transit state types shared between server and clients |
| `src/i18n/` | Shared i18n strings |

### Mobile App (`apps/mobile/`)

**Expo 53 + React Native 0.79** iOS app. Tab-based navigation via `@react-navigation`. Auth via Supabase, data persistence via Supabase + AsyncStorage caching.

**Navigation** (`src/navigation/RootNavigator.tsx`):
- Tabs: Dashboard, Signatur (FuRing), WuXing, Wissen
- Stack routes: Article, Voice (Levi), Quiz, Profile

**Key screens:**
- `DashboardScreen` — cosmic profile summary, space weather, AI interpretation
- `FuRingScreen` — Signatur visualization using `useBootstrapSignatur()` hook (Experience API bootstrap → soulprint sectors + profile summary + Kohärenz-Index). Renders 12 zodiac sector bars, profile card, signature seed
- `QuizScreen` — FlatList of all 23 quizzes rendered via `QuizRenderer` component from JSON `QuizDefinition`s. Completion fires `queueContributionEvent()` to offline queue
- `VoiceScreen` — ElevenLabs agent via WebView (native SDK integration planned)

**Key mobile-specific modules:**
- `src/lib/experience.ts` — `fetchBootstrap()` client for Experience API
- `src/hooks/useBootstrapSignatur.ts` — Fetches soulprint via Experience API, caches in AsyncStorage
- `src/hooks/useDailyHoroscope.ts` — Daily horoscope fetch + cache
- `src/lib/offlineQueue.ts` — AsyncStorage-based contribution queue with auto-flush
- `src/lib/device.ts` — Device identity via SecureStore
- `src/components/QuizRenderer.tsx` — Universal quiz renderer driven by `QuizDefinition` from shared package
- `src/components/SignaturCanvas.tsx` — Native 3D particle ring via expo-gl + three.js (6k ring + 800 corona particles, custom GLSL shaders, pan/pinch gesture orbit). **Currently not mounted** — FuRingScreen uses the 2D bootstrap view instead
- `src/theme.ts` — COLORS constant (bg, card, border, gold, text, textDim)

**App config:** `app.json` — bundle ID `space.bazodiac.mobile`, deep linking via `bazodiac://` scheme, EAS project ID `3dc5ff64-329b-4fcf-bb89-34eb0132cfec`.

### `features/plan/` Directory

Planning artefacts that are **not part of the main app build** and are excluded from Railway nixpacks. Do not import from them into `src/`.

- `QuizzMe-main/` — separate Next.js project, design reference for quiz system
- `allquizzes/` — HTML/JSON prototype quizzes + `quizzme-module-loader.ts` (has a **pre-existing TSC error at line 298** — Tag type mismatch — do not fix unless working on this file)
- `Fu-Ring/` — Fusion Ring design assets
- `Implementation-plan/` — implementation planning docs
- `LeanDeep-annotator-main/` — annotation tool artefact

### Naming: "Signatur" (formerly "Fusion Ring" / "Fu-Ring")

The user-facing name for the Fusion Ring feature was renamed to **"Signatur"** across all UI text, routes, and navigation. Code identifiers (`FusionRing`, `useFusionRing`, etc.) still use the old name internally. When adding new UI-facing text, use "Signatur" — when writing code, use the existing `FusionRing` identifiers.

### `bazodiac_engine/` (Python Reference)

Python reference implementation of the GCB engine and master signal math. Not part of the web app build — used for prototyping and validation. Contains `gcb_engine.py`, `master_signal.py`, and `test_engine.py`.

### BaZi Stem Content Structure

BaZi stem descriptions are defined in `src/lib/astro-data/heavenlyStems.ts` and follow a 5-part structure per context (dayMaster, monthStem, etc.): identity, daily life, gifts, shadow, growth — in both DE and EN. When adding or editing stem content, maintain this pattern.

### Verification

Per-task done-conditions:

| Task type | Done when |
|-----------|-----------|
| Bug fix | `npm run test` passes, repro scenario no longer triggers |
| New component | Test file exists in `src/__tests__/`, `npx vitest run src/__tests__/<name>.test.tsx` passes |
| API change | `npx vitest run src/__tests__/api-routes.test.ts` passes, `npm run lint` clean |
| Schema change | Zod schema test passes, existing tests still green |
| Sprint feature | Full suite `npm run test` passes (586+ tests), code review completed |

### Known Issues

- BAFE API cannot always be reached from local/CI environments (`ENETUNREACH`). The app is designed to degrade gracefully — failed endpoints return empty data and the Dashboard shows "—".
- No contract tests against BAFE; schema changes require manual verification.
- The README references a legacy `readings` table — the current Supabase schema uses `astro_profiles`, `birth_data`, `natal_charts` (see `supabase-schema.sql`).
- Stripe is optional at runtime: `server.mjs` checks `process.env.STRIPE_SECRET_KEY` before initializing; checkout returns 503 if unconfigured.

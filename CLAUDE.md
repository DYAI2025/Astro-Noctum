# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Bazodiac (Astro-Noctum) — a fusion astrology web app combining Western astrology, Chinese BaZi, and Wu-Xing (Five Elements). Users enter birth data, get chart calculations from the external BAFE API, AI-generated interpretations via Gemini, and can talk to "Levi Bazi" (an ElevenLabs voice agent). The UI is German-language, dark luxury aesthetic (obsidian/gold palette).

## Commands

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

Node 20.19+ required (pinned in `.nvmrc`). Tests live in `src/__tests__/` and use Vitest. Copy `.env.example` to `.env.local` and fill values before starting dev.

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
| `server.mjs` | Production Express server: BAFE proxy with fallback chain, Supabase admin auth, ElevenLabs tool endpoints, Stripe checkout + webhook, debug probe at `/api/debug-bafe` |
| `src/lib/fusion-ring/` | Fusion Ring engine — signal computation, BaZi/Western/Wu-Xing layers, transit math, canvas draw utilities |
| `src/contexts/FusionRingContext.tsx` | React context providing Fusion Ring state to the whole app |
| `src/hooks/useFusionRing.ts` | Hook that combines BAFE data + transit data into FusionRing signal |
| `src/hooks/usePremium.ts` | Reads `profiles.is_premium` from Supabase; re-fetches on tab focus (for Stripe redirect return) |
| `src/components/PremiumGate.tsx` | Wrapper that locks content behind premium; triggers Stripe checkout via `/api/checkout` |
| `src/data/articles.ts` | SEO article content (6 articles, full German text, TypeScript) |
| `src/components/QuizOverlay.tsx` | Modal overlay that hosts the quiz system; launched from Dashboard |
| `src/lib/lme/types.ts` | Lifecycle Mapping Engine event types — `ContributionEvent`, `Marker`, `TraitScore`, `Tag`. Typed contract between quizzes and the Fusion Ring; quizzes emit `ContributionEvent`s, `useFusionRing` consumes them |
| `src/components/quizzes/` | 22 quiz components (14 regular + 4 Kinky + 4 PartnerMatch); results feed into Fusion Ring via `src/lib/fusion-ring/quiz-to-event.ts` |
| `src/components/quizzes/Kinky/` | Kinky quiz series (multi-part, premium) |
| `src/components/quizzes/PartnerMatch/` | PartnerMatch quiz series including `ConversationAnalysisQuiz` |
| `src/components/ClusterEnergySystem.tsx` | Renders quiz-result "energy clusters" on the Dashboard |
| `src/components/fusion-ring-3d/FusionRing3D.tsx` | Three.js 3D Fusion Ring — used on `/fu-ring` page |
| `src/components/fusion-ring-website/FusionRingWebsiteCanvas.tsx` | Canvas-based Fusion Ring for the landing/marketing view |
| `src/hooks/useSpaceWeather.ts` | Fetches NASA space-weather data (solar wind, Kp-index) and feeds it into the Fusion Ring signal |
| `src/hooks/useAmbientePlayer.ts` | Ambient audio playback control |
| `src/contexts/PlanetariumContext.tsx` | Context for the 3D orrery/planetarium state |
| `src/contexts/LanguageContext.tsx` | i18n context (German UI default) |
| `src/contexts/AppLayoutContext.tsx` | Layout/sidebar state shared across pages |
| `src/types/bafe.ts` | TypeScript types for raw BAFE API responses (characterization-based; see BAFE mapping gotcha) |
| `src/lib/master-signal/` | Master Signal engine — GCB (Grand Cosmic Blueprint) builder, natal/quiz/ring projections, cross-referencing, narrative generation. Combines all astrological layers into a single unified signal |
| `src/lib/master-signal/master-signal-builder.ts` | Orchestrates GCB → dimensional scores → projections pipeline |
| `src/lib/master-signal/gcb-builder.ts` | Builds GCB from raw BAFE data (BaZi pillars + Western planets + Wu-Xing elements) |
| `src/types/interpretation.ts` | Types for Gemini AI interpretation results |

### BAFE Response Mapping (Important Gotcha)

`services/api.ts` transforms BAFE responses before the Dashboard consumes them:
- **BaZi pillars**: BAFE uses German keys (`stamm`/`zweig`/`tier`/`element`) → mapped to English (`stem`/`branch`/`animal`/`element`)
- **Western zodiac**: BAFE returns `zodiac_sign` as 0-based index (0=Aries..11=Pisces) → mapped to English name strings
- **Ascendant**: BAFE returns degrees → converted to sign name via `signFromDegrees()`

If BAFE schema changes, update the mappers in `api.ts` — the Dashboard expects the transformed format.

### External Dependencies

- **BAFE API**: Astrology calculation backend (routes at `/calculate/{bazi,western,fusion,wuxing,tst}` and `/chart`). Default: `https://bafe.vercel.app`. BAFE is not always reachable from dev environments (see Known Issues).
- **Supabase**: Auth + Postgres. Schema in `supabase-schema.sql`. Tables: `profiles`, `birth_data`, `astro_profiles`, `natal_charts`, `agent_conversations`. RLS enabled on all tables. Signup trigger auto-creates profile row.
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

Quizzes emit "contribution events" via `src/lib/fusion-ring/quiz-to-event.ts`. Each completed quiz adjusts the user's Fusion Ring signal (stored in `FusionRingContext`). Series quizzes (Kinky, PartnerMatch) share state via a series-level component that wraps individual quiz steps.

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

### Known Issues

- BAFE API cannot always be reached from local/CI environments (`ENETUNREACH`). The app is designed to degrade gracefully — failed endpoints return empty data and the Dashboard shows "—".
- No contract tests against BAFE; schema changes require manual verification.
- The README references a legacy `readings` table — the current Supabase schema uses `astro_profiles`, `birth_data`, `natal_charts` (see `supabase-schema.sql`).
- Stripe is optional at runtime: `server.mjs` checks `process.env.STRIPE_SECRET_KEY` before initializing; checkout returns 503 if unconfigured.

Component-specific instructions for the **frontend**. Extends [../CLAUDE.code.md](../CLAUDE.code.md).

# Frontend

**Responsibility**: Web SPA — Dashboard, Signatur ring (V2 spirograph / V3 bipolar trails), 3D Orrery, quiz system (24 quizzes across 6 clusters + generator pipeline), multi-agent voice (Levi + Eve), premium gating, space weather visualization, Day-Pulse/Trace modal, SEO articles.

**Technology**: React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion / motion/react, Three.js (custom GLSL shaders), Zod (runtime validation)

## Code Location

All frontend source code lives in [`../../src/`](../../src/).
For code conventions, build commands, and dev setup see [`../../CLAUDE.md`](../../CLAUDE.md).

## Interfaces

- **HTTP → api-server**: All `/api/*` calls via same-origin proxy (Vite dev proxy or Express production server). Client uses `fetch()` directly or service modules (`services/api.ts`, `services/experience.ts`, `services/contribute.ts`).
- **Supabase SDK (client-side)**: Auth flows, profile reads, birth data queries — all subject to RLS via `VITE_SUPABASE_ANON_KEY`.
- **`@bazodiac/shared`**: Imports signal math (`computeFusionSignal`), quiz schemas/scoring (`QuizDefinition`, `scoreQuiz`), and i18n strings directly from `packages/shared/src/` (no build step).

## Requirements Addressed

| File | Type | Priority | Summary |
|------|------|----------|---------|
| [REQ-F-natal-chart-calculation](../../1-objectives/requirements/REQ-F-natal-chart-calculation.md) | REQ-F | Must | Dashboard renders BAFE calculation results |
| [REQ-F-fusion-ring-visualization](../../1-objectives/requirements/REQ-F-fusion-ring-visualization.md) | REQ-F | Must | Signatur ring (V2 28K particles, V3 bipolar trails) |
| [REQ-F-quiz-contribution-system](../../1-objectives/requirements/REQ-F-quiz-contribution-system.md) | REQ-F | Must | 22 quizzes across 6 clusters modulating the ring |
| [REQ-F-cosmic-encounter-onboarding](../../1-objectives/requirements/REQ-F-cosmic-encounter-onboarding.md) | REQ-F | Must | Onboarding flow with SignatureReveal |
| [REQ-F-space-weather-modulation](../../1-objectives/requirements/REQ-F-space-weather-modulation.md) | REQ-F | Should | Space weather visual modulation on FuRingPage |
| [REQ-F-astro-card-detail-view](../../1-objectives/requirements/REQ-F-astro-card-detail-view.md) | REQ-F | Must | Sunsign/BaZi/Wuxing tiles open detail view modal |
| [REQ-F-agent-dashboard-selection](../../1-objectives/requirements/REQ-F-agent-dashboard-selection.md) | REQ-F | Must | Dashboard shows Levi + Eve agent tiles side-by-side |
| [REQ-F-quiz-generator-pipeline](../../1-objectives/requirements/REQ-F-quiz-generator-pipeline.md) | REQ-F | Must | Quiz generator with 12-sector/6D-Signatur/5D-MasterSignal mapping |
| [REQ-F-signatur-rendering-engine](../../1-objectives/requirements/REQ-F-signatur-rendering-engine.md) | REQ-F | Must | V3 bipolar trail engine with Cousto frequencies + audio |
| [REQ-F-signatur-data-pipeline](../../1-objectives/requirements/REQ-F-signatur-data-pipeline.md) | REQ-F | Must | Soulprint→natal weights, quiz→dimensions, transit, space weather |
| [REQ-PERF-signatur-performance](../../1-objectives/requirements/REQ-PERF-signatur-performance.md) | REQ-PERF | Must | 60fps desktop, 30fps mobile, <2s first frame |

## Relevant Decisions

| File | Title | Trigger |
|------|-------|---------|
| [DEC-supabase-backend](../../2-design/decisions/DEC-supabase-backend.md) | Supabase as sole backend data layer | When writing data access code |
| [DEC-swiss-ephemeris](../../2-design/decisions/DEC-swiss-ephemeris.md) | Swiss Ephemeris via BAFE | When consuming or transforming chart data |
| [DEC-wuxing-ui-mapping](../../2-design/decisions/DEC-wuxing-ui-mapping.md) | Wu-Xing elements drive UI physics | When writing components with element-specific styling |
| [DEC-master-signal-weights](../../2-design/decisions/DEC-master-signal-weights.md) | Master Signal formula locked | When modifying signal computation or fusion formula |
| [DEC-dissonance-model](../../2-design/decisions/DEC-dissonance-model.md) | Layered dissonance model | When designing signature visualization or quiz-to-visual mapping |
| [DEC-signatur-v3-bipolar-trails](../../2-design/decisions/DEC-signatur-v3-bipolar-trails.md) | Bipolar trail engine | When working in signatur-v3 canvas or animation |

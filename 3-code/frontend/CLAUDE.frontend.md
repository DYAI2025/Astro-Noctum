Component-specific instructions for the **frontend**. Extends [../CLAUDE.code.md](../CLAUDE.code.md).

# Frontend

**Responsibility**: Web SPA — Dashboard (identity cards, live daily signals, Tagesenergie hero), Signatur ring (V2 spirograph / V3 bipolar trails + dissonance + quiz morphing + night pulse), 3D Orrery, quiz system (22 quizzes across 6 clusters + generator pipeline), multi-agent voice (Levi + Eve), premium gating, space weather visualization, depth navigation, progressive UI fluidity, SEO articles.

**Technology**: React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion / motion/react, Three.js (custom GLSL shaders), Zod (runtime validation)

## Code Location

All frontend source code lives in [`../../src/`](../../src/).
For code conventions, build commands, and dev setup see [`../../CLAUDE.md`](../../CLAUDE.md).

## Interfaces

- **HTTP → api-server**: All `/api/*` calls via same-origin proxy (Vite dev proxy or Express production server). Client uses `fetch()` directly or service modules (`services/api.ts`, `services/experience.ts`, `services/contribute.ts`).
- **Supabase SDK (client-side)**: Auth flows, profile reads, birth data queries — all subject to RLS via `VITE_SUPABASE_ANON_KEY`.
- **`@bazodiac/shared`**: Imports signal math (`computeFusionSignal`), quiz schemas/scoring (`QuizDefinition`, `scoreQuiz`), dimension defs (`DIMENSION_DEFS`), and i18n strings directly from `packages/shared/src/` (no build step).

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
| [REQ-F-signatur-determinism](../../1-objectives/requirements/REQ-F-signatur-determinism.md) | REQ-F | Must | Bit-identical pole positions across platforms |
| [REQ-F-signatur-shared-bridge](../../1-objectives/requirements/REQ-F-signatur-shared-bridge.md) | REQ-F | Must | DIMENSION_DEFS from @bazodiac/shared as single source of truth |
| [REQ-F-signatur-dissonance-model](../../1-objectives/requirements/REQ-F-signatur-dissonance-model.md) | REQ-F | Must | 3-layer dissonance: d_natal→geometry, d_elemental→texture, d_accumulated stub |
| [REQ-F-signatur-quiz-morph](../../1-objectives/requirements/REQ-F-signatur-quiz-morph.md) | REQ-F | Must | Quiz completion morphs Signatur live over ~2s, no cuts |
| [REQ-F-signatur-day-night-pulse](../../1-objectives/requirements/REQ-F-signatur-day-night-pulse.md) | REQ-F | Must | DashboardTagesEnergie hero, Kosmoswetter strip, Night-Pulse visual modulation |
| [REQ-F-navigation-shell](../../1-objectives/requirements/REQ-F-navigation-shell.md) | REQ-F | Must | Top bar: 3 primary items + Settings menu; mobile responsive |
| [REQ-F-dashboard-identity-cards](../../1-objectives/requirements/REQ-F-dashboard-identity-cards.md) | REQ-F | Should | 5-card identity set: Sun, Moon, Ascendant, Year Animal, Wu-Xing |
| [REQ-F-dashboard-live-daily-signals](../../1-objectives/requirements/REQ-F-dashboard-live-daily-signals.md) | REQ-F | Must | Live daily impulse + influences; remove hardcoded defaults |
| [REQ-F-depth-navigation](../../1-objectives/requirements/REQ-F-depth-navigation.md) | REQ-F | Must | Z-axis depth transitions: Dashboard→Signatur→detail |
| [REQ-F-progressive-ui-fluidity](../../1-objectives/requirements/REQ-F-progressive-ui-fluidity.md) | REQ-F | Must | UI fluidity grows with cluster completion (0→1→6 tiers) |
| [REQ-F-vibes-core](../../1-objectives/requirements/REQ-F-vibes-core.md) | REQ-F | Must | Frontend fetches /api/vibes and renders 3-level output |
| [REQ-F-vibes-output-structure](../../1-objectives/requirements/REQ-F-vibes-output-structure.md) | REQ-F | Must | Kurzsignal → Treiber → Erklärung UI rendering |
| [REQ-F-weekly-insights-engine](../../1-objectives/requirements/REQ-F-weekly-insights-engine.md) | REQ-F | Must | Weekly insights UI — 7 life areas |
| [REQ-F-transparency-rule](../../1-objectives/requirements/REQ-F-transparency-rule.md) | REQ-F | Must | No bare numbers in UI without explanation |
| [REQ-F-explainability-layer](../../1-objectives/requirements/REQ-F-explainability-layer.md) | REQ-F | Must | "Warum sehe ich das?" panel for every insight |
| [REQ-USA-mobile-first-readability](../../1-objectives/requirements/REQ-USA-mobile-first-readability.md) | REQ-USA | Must | <10s comprehension on mobile, responsive layout |
| [REQ-USA-wcag-contrast](../../1-objectives/requirements/REQ-USA-wcag-contrast.md) | REQ-USA | Should | WCAG 2.1 AA contrast on all text/interactive elements |
| [REQ-PERF-signatur-performance](../../1-objectives/requirements/REQ-PERF-signatur-performance.md) | REQ-PERF | Must | 60fps desktop, 30fps mobile, <2s first frame |
| [REQ-PERF-vibes-response-time](../../1-objectives/requirements/REQ-PERF-vibes-response-time.md) | REQ-PERF | Must | Vibes result <2s p95; cache hit <200ms |

## Relevant Decisions

| File | Title | Trigger |
|------|-------|---------|
| [DEC-supabase-backend](../../2-design/decisions/DEC-supabase-backend.md) | Supabase as sole backend data layer | When writing data access code |
| [DEC-swiss-ephemeris](../../2-design/decisions/DEC-swiss-ephemeris.md) | Swiss Ephemeris via BAFE | When consuming or transforming chart data |
| [DEC-wuxing-ui-mapping](../../2-design/decisions/DEC-wuxing-ui-mapping.md) | Wu-Xing elements drive UI physics | When writing components with element-specific styling |
| [DEC-master-signal-weights](../../2-design/decisions/DEC-master-signal-weights.md) | Master Signal formula locked | When modifying signal computation or fusion formula |
| [DEC-dissonance-model](../../2-design/decisions/DEC-dissonance-model.md) | Layered dissonance model | When designing signature visualization or quiz-to-visual mapping |
| [DEC-signatur-v3-bipolar-trails](../../2-design/decisions/DEC-signatur-v3-bipolar-trails.md) | Bipolar trail engine | When working in signatur-v3 canvas or animation |
| [DEC-multi-agent-voice](../../2-design/decisions/DEC-multi-agent-voice.md) | Levi + Eve as fixed voice personas | When adding agents, modifying agent tiles, or conversation history UI |
| [DEC-spiritual-tech-interactions](../../2-design/decisions/DEC-spiritual-tech-interactions.md) | Spiritual Tech interaction philosophy | When writing transitions, animations, error states, or loading UI |
| [DEC-design-system-v2](../../2-design/decisions/DEC-design-system-v2.md) | Unified design system (dark/bright mode tokens) | When creating or modifying any UI component, color, spacing, or typography |
| [DEC-navigation-shell](../../2-design/decisions/DEC-navigation-shell.md) | Top bar 3 items + Settings menu | When modifying nav items, top bar, Settings, or mobile layout |
| [DEC-vibes-not-daily](../../2-design/decisions/DEC-vibes-not-daily.md) | Vibes on-demand (2–3h), not fixed daily | When designing Vibes CTA text or trigger patterns |
| [DEC-no-number-without-explanation](../../2-design/decisions/DEC-no-number-without-explanation.md) | No numerical value without explanation | When adding any score, percentage, or number to UI |
| [DEC-top-3-weekly-focus](../../2-design/decisions/DEC-top-3-weekly-focus.md) | Weekly Insights highlights exactly 3 areas | When designing Weekly Insights layout or prioritization UI |
| [DEC-vibes-gemini-strategy](../../2-design/decisions/DEC-vibes-gemini-strategy.md) | Gemini for Vibes/Weekly with two-level caching | When consuming Vibes/Weekly API responses or designing loading states |

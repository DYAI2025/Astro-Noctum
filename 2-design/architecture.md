# Architecture

## System Overview

Bazodiac is a fusion astrology platform that synthesizes Western astrology, Chinese BaZi (Four Pillars of Destiny), and Wu-Xing (Five Elements) philosophy into a single unified signal. Users submit birth data and receive AI-generated interpretations, 3D natal chart visualizations, and voice-based guidance through an autopoietic three-layer model.

The system follows a **three-layer autopoietic model** drawn from `TRUENORTH.md`. The **Obsidian Core** (Layer 1) contains the deterministic, immutable astrological computation — birth data in, signal out, identical every time. The **Neural Myzel** (Layer 2) is the causal web of modulations: quizzes, space weather, partnership synastry, and contribution events that influence presentation but never alter the core computation. The **Bioluminescent Membrane** (Layer 3) is the adaptive UI surface — Fusion Ring canvas, Three.js orrery, and dashboard — that evolves with user engagement. The guiding principle: live data modulates display and narrative, never the underlying calculation (signature weight capped at 0.5).

---

## Component Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENTS                                    │
│                                                                     │
│  ┌──────────────────┐              ┌──────────────────────┐         │
│  │  Web SPA         │              │  Mobile App          │         │
│  │  React 19 + Vite │              │  Expo 53 / RN 0.79  │         │
│  │  Three.js Orrery │              │  SignaturVisual      │         │
│  │  Fusion Ring     │              │                      │         │
│  └────────┬─────────┘              └──────────┬───────────┘         │
│           │                                   │                     │
│           └───────────┬───────────────────────┘                     │
│                       │ @bazodiac/shared                            │
│                       │ (signal math, quiz schemas, i18n)           │
└───────────────────────┼─────────────────────────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────────────────────┐
│                    API SERVER (Express)                            │
│  server.mjs — Railway deployment                                  │
│                                                                   │
│  /api/calculate/*     BAFE proxy (fallback chain)                 │
│  /api/interpret       Gemini interpretation                       │
│  /api/checkout        Stripe payments                             │
│  /api/profile/:id     ElevenLabs tool endpoint                    │
│  /api/contribute      Quiz contribution ingestion                 │
│  /api/space-weather   NOAA/DONKI aggregation                      │
│  /api/transit-state   Transit with profile fallback               │
│  Master Signal JS     Bootstrap + delta compute                   │
└──────┬──────────┬──────────┬──────────┬──────────┬────────────────┘
       │          │          │          │          │
       ▼          ▼          ▼          ▼          ▼
  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐
  │  BAFE  │ │Supabase│ │ Gemini │ │Eleven- │ │  Stripe  │
  │ Astro  │ │Auth+DB │ │  Flash │ │  Labs  │ │ Payments │
  │ Calc   │ │  (RLS) │ │        │ │ Voice  │ │          │
  └────────┘ └────────┘ └────────┘ └────────┘ └──────────┘
                                        │
                              ┌─────────┘
                              ▼
                        ┌──────────┐
                        │NASA DONKI│
                        │NOAA Kp   │
                        └──────────┘
```

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Web frontend | React 19, TypeScript, Vite, Tailwind CSS v4 |
| 3D visualization | Three.js, custom GLSL shaders |
| Mobile app | Expo 53, React Native 0.79 |
| Shared library | `@bazodiac/shared` (TypeScript — signal math, quiz schemas, i18n) |
| API server | Express.js (`server.mjs`) |
| Database | Supabase (PostgreSQL + Row Level Security) |
| Authentication | Supabase Auth |
| Astrology engine | BAFE API (Swiss Ephemeris backend; `DEC-swiss-ephemeris`) |
| AI interpretation | Google Gemini (`gemini-3-flash-preview`) |
| Voice agent | ElevenLabs (Levi Bazi) |
| Payments | Stripe (checkout, webhooks, customer portal) |
| Space weather | NASA DONKI API, NOAA Kp-index |
| Deployment | Railway (nixpacks, Node.js 20) |

---

## Key Integration Points

### BAFE Proxy

The Express server proxies all `/api/calculate/*` requests to BAFE with an ordered fallback chain: (1) internal Railway URL if configured, (2) public production URL. This handles IPv6-only private networking issues. BAFE responses are cached in-memory for 24 hours with automatic eviction. The BAFE API uses Swiss Ephemeris with pinned ephemeris data and tzdata — no Moshier fallback (`DEC-swiss-ephemeris`).

### Supabase Client

Dual-context usage (`DEC-supabase-backend`):
- **Client-side**: `VITE_SUPABASE_ANON_KEY` for auth flows, birth data reads, and profile queries (all subject to RLS).
- **Server-side**: `SUPABASE_SERVICE_ROLE_KEY` for admin operations that bypass RLS (ElevenLabs tool endpoints, Stripe webhook handlers).

### Gemini API

The `/api/interpret` endpoint sends combined astrological results (Western + BaZi + WuXing + Master Signal context) to Gemini for personalized horoscope text generation. Invoked server-side to protect the API key in production; client-side via `VITE_GEMINI_API_KEY` in development.

### ElevenLabs Voice Agents (Multi-Agent)

**Decision**: `DEC-multi-agent-voice` | **Requirements**: `REQ-F-eve-voice-agent`, `REQ-F-agent-architecture-refactor`, `REQ-MNT-agent-extensibility`

Bazodiac uses a **config-driven multi-agent architecture** where each voice agent is defined by an `AgentConfig` entry in the `AGENTS` array (in `@bazodiac/shared`). No agent-specific components exist — all rendering derives from config.

**Two fixed agents:**
- **Levi Bazi** (`VITE_ELEVENLABS_AGENT_ID`) — primary agent, empathic/philosophical tone
- **Eve** (`VITE_ELEVENLABS_EVE_AGENT_ID`) — second agent, bold/modern persona; shows "coming soon" if env var missing

**Key architectural components:**
- `AgentProvider` context: replaces Levi-specific state with generic `activeAgent`, `agentState` keyed by `AgentId`
- `AgentSection` component: renders from config — one instance per agent, no Levi-specific code
- `AgentFloatingWidget`: one floating ElevenLabs widget per agent, keyed by `agent.id`
- `agent_conversations.agent_type` DB column: partitions conversation history — agents never see each other's sessions

**Dashboard layout**: Two fixed side-by-side tiles (not a generic gallery). The product decision is two agents; the architecture decision is config-driven extensibility for future agents.

**Server-side**: `/api/profile/:userId` and `/api/agent` accept `agent_type` parameter. Profile endpoint filters conversation history by agent type; save endpoint writes with type. Auth: `ELEVENLABS_TOOL_SECRET`.

**Extensibility**: Adding a third agent = add 1 `AgentConfig` entry + 1 env var + 1 DB migration (update `agent_type` check constraint). Zero component changes. (`REQ-MNT-agent-extensibility`)

### Space Weather

NASA DONKI and NOAA Kp-index data is fetched and aggregated at `/api/space-weather/extended` (5-minute cache). Space weather events produce `ContributionEvents` with `signature_weight` capped at 0.5, modulating the Neural Myzel layer without altering the Obsidian Core.

---

## Data Flow

```
Birth Date + Time + Location
         │
         ▼
    ┌─────────────────────────────────────────┐
    │  BAFE API (5 parallel requests)         │
    │  /calculate/western  → Western chart    │
    │  /calculate/bazi     → Four Pillars     │
    │  /calculate/wuxing   → Five Elements    │
    │  /calculate/fusion   → Combined interp  │
    │  /calculate/tst      → Time Space Theory│
    └─────────────┬───────────────────────────┘
                  │
                  ▼
    ┌─────────────────────────────────────────┐
    │  natal-projection.ts                    │
    │  Western + BaZi + WuXing → 5D vector   │
    │  (passion, stability, future,           │
    │   connection, autonomy)                 │
    └─────────────┬───────────────────────────┘
                  │
    ┌─────────────┼──────────────┐
    │             │              │
    ▼             ▼              ▼
  Gemini     Supabase      Master Signal
  Interpret  Persist       Engine
  (async)    (non-block)   (N + Q + G → 5D)
    │             │              │
    ▼             ▼              ▼
  ┌───────────────────────────────────────────┐
  │  Dashboard                                │
  │  ├── AI Interpretation text               │
  │  ├── Fusion Ring (3D, 28k particles)      │
  │  ├── BirthChart Orrery (Three.js)         │
  │  ├── BaZi Four Pillars display            │
  │  ├── WuXing Pentagon visualization        │
  │  └── ElevenLabs Voice Widget (Levi Bazi)  │
  └───────────────────────────────────────────┘
```

---

## Signal Architecture

Bazodiac operates with two complementary signal formulas mapped to the three-layer model. Both project into the same 5D dimension space: `passion`, `stability`, `future`, `connection`, `autonomy` (always normalized, sum = 1.0).

### Layer 1 — Permanent Signal (Master Signal)

**Location**: Backend (`server.mjs`, `bazodiac_engine/`, `src/lib/master-signal/`)
**Scope**: Time-independent fusion of signal sources.
**Used for**: Horoscopes, narratives, cross-reference engine, GCB tagging.

```
Master = 0.35·N + 0.30·Q + 0.20·G + 0.15·alignment_boost
```

| Signal | Weight | Source | Projection |
|--------|--------|--------|------------|
| Natal (N) | 0.35 | BAFE API (Western + BaZi + WuXing) | `natal-projection.ts` |
| Quiz (Q) | 0.30 | ContributionEvents from QuizzMe | `quiz-projection.ts` |
| GCB (G) | 0.20 | Birth year → generation + life stage | `gcb-builder.ts` |
| Alignment boost | 0.15 | Cross-reference engine (cosine similarity between N, Q, G) | `cross-reference.ts` |

**Natal sub-weights**:
- Western: Sun 50%, Moon 30%, Ascendant 20% (via element affinity)
- BaZi: Day pillar 40%, Year 25%, Month 20%, Hour 15%
- WuXing: Element ratio mapped through `ELEMENT_DIMENSION_MAP`

**Alignment boost distribution**: When N-Q alignment >= 0.75, boost is split 50/50. Otherwise, weighted toward whichever signal aligns better with G.

**GCB evidence mode**: All V1 outputs carry `evidence_mode: "heuristic_v1"` — sociological generational research basis, no claim of statistical validity.

### Layer 2 — Transient Signal (Ring Signal)

**Location**: Frontend (`src/lib/master-signal/ring-projection.ts`, `FusionRingContext`)
**Scope**: Real-time fusion of data types for visualization.
**Used for**: Fusion Ring 3D rendering, transit overlays, particle effects.

```
S = 0.27·W + 0.27·B + 0.18·X + 0.18·T + 0.10·C
```

| Signal | Weight | Source |
|--------|--------|--------|
| Western (W) | 0.27 | Western chart data |
| BaZi (B) | 0.27 | Four Pillars data |
| WuXing (X) | 0.18 | Five Elements balance |
| Transit (T) | 0.18 | Current planetary transits |
| Conversation (C) | 0.10 | ElevenLabs session context |

The Ring Signal projects the Master Signal 5D vector onto 12 zodiac sectors via `SECTOR_AFFINITIES[]` (primary dimension 65%, secondary 35%), producing `sector_modulation[12]` that drives the Fusion Ring's 28,000-particle renderer and 8 GLSL shader effects.

### Cross-Reference Engine

Not a fourth additive signal — it is the fusion mechanism determining how N, Q, and G combine.

| Score | Formula | Interpretation |
|-------|---------|----------------|
| coherence | mean(cos(N,Q), cos(N,G), cos(Q,G)) | Overall signal consistency |
| individuation | L2_distance(mean(N,Q), G) / sqrt(2) | Departure from generational norm |

Individuation thresholds: >= 0.60 strongly individual, >= 0.30 distinctly personal, < 0.30 generationally resonant.

---

## Caching Strategy

| Data | TTL | Mechanism |
|------|-----|-----------|
| BAFE responses | 24 hours | In-memory with auto-eviction |
| Space weather (NASA DONKI) | 15 minutes | In-memory |
| Space weather extended (NOAA+DONKI) | 5 minutes | In-memory |
| Transit state | No-store | Fallback to profile-derived data |
| Vibes result | Cooldown-based | In-memory (L1) + Supabase vibes_cache (L2) |
| Weekly Insights | ISO week boundary | In-memory (L1) + Supabase weekly_insights_cache (L2) |

---

## Vibes & Weekly Insights

### Vibes (On-Demand, 2–3h Horizon)

**Endpoint**: `POST /api/vibes` (requires Supabase JWT) | **Requirements**: `REQ-F-vibes-core`, `REQ-F-vibes-output-structure`, `REQ-PERF-vibes-response-time`

The Vibes feature delivers a short-horizon emotional/energetic forecast based on the user's current signature state. It is on-demand — the user requests a Vibe at any time and receives insight tuned to the next 2–3 hours. Distinct from the daily Experience API flow (`/api/experience/daily`); see `DEC-vibes-not-daily`.

**Data pipeline:**
1. Load `soulprint_sectors` (12-vector) + big-three signs from `astro_profiles`
2. Load current space weather state from `/api/space-weather/extended` (5-min cached)
3. Blend signature × transit context into a Gemini prompt
4. Generate 3-level output via Gemini (`gemini-3-flash-preview`, 15s timeout):
   - `kurzsignal` — one-sentence headline (≤120 chars)
   - `treiber` — driving force explanation (2–3 sentences)
   - `erklaerung` — deeper pattern context (paragraph)
5. Persist result to L2 cache (Supabase `vibes_cache`)

**Caching strategy:**
- L1: In-memory `vibesCache` Map with cooldown-based eviction (stale entries purged after max cooldown)
- L2: Supabase `vibes_cache` (composite key: `user_id + date + engine_version`)
- Engine version: `v1-gemini-vibes`
- Cache hit returns immediately without LLM call — achieves p95 < 200ms

**Fallback**: If Gemini API key is missing or generation fails, returns a deterministic fallback computed from soulprint sectors alone (no LLM). Marked `cached: false` in response meta.

**Performance**: `< 200ms p95` (cache hit path). Gemini generation target: `< 2s` (p95); `< 1.5s` goal per `REQ-PERF-vibes-response-time`. See `DEC-vibes-gemini-strategy`.

---

### Weekly Insights (7 Life Areas)

**Endpoint**: `POST /api/weekly-insights` (requires Supabase JWT) | **Requirements**: `REQ-F-weekly-insights-engine`, `REQ-F-weekly-area-prioritization`

Weekly Insights computes a 7-life-area outlook for the current ISO week. The top-3 areas receive expanded content; the remaining 4 are compact 1-line tendency labels. See `DEC-top-3-weekly-focus`.

**Life areas**: Love, Career, Wellbeing, Creativity, Social, Learning, Energy

**Data pipeline:**
1. Load `soulprint_sectors` + big-three signs from `astro_profiles`
2. Compute deterministic transit sectors from ISO week hash — same user + same week always produces the same transit input
3. Blend soulprint × transit → 7 life-area scores via `computeLifeAreaScores()`
4. Rank areas by score; top-3 flagged for expanded content generation
5. Generate via Gemini (`gemini-3-flash-preview`): top-3 areas get full paragraph + tendency label; remaining 4 get 1-line tendency label only
6. Persist to Supabase `weekly_insights_cache`

**Caching strategy:**
- L1: In-memory `weeklyCache` Map, keyed by `weekly:{userId}:{isoWeek}`
- L2: Supabase `weekly_insights_cache` (keys: `user_id + iso_week + engine_version`)
- Cache valid for entire ISO week; refreshes automatically on Monday boundary (new `isoWeek` key)
- Engine version: `v1-gemini-weekly`

**Top-3 determinism**: Area ranking is derived from the soulprint × transit blend score, not randomized. Deterministic: same user + same week → same top-3. (`DEC-top-3-weekly-focus`)

---

## Transparency & Explainability (System-Wide Pattern)

### No Number Without Explanation

**Constraint**: `CON-no-unexplained-numbers` | **Decision**: `DEC-no-number-without-explanation` | **Requirement**: `REQ-F-transparency-rule`

Every numerical value displayed in the UI must have an accompanying explanation. If a value cannot be explained in its context, it is replaced with a qualitative label (`hoch` / `mittel` / `niedrig`) or removed entirely. This is a hard product constraint, not a guideline.

Scope: Dashboard, Vibes, Weekly Insights, Signatur coherence index, space weather display, influence gauges.

**Enforcement pattern:**
- Every `<span>` displaying a number must have an associated tooltip, inline label, or context sentence
- Internal scores (harmony index, solar pressure score, life-area score) shown to users: either display with a meaning label ("Hohe Harmonie — Westlich und BaZi konvergieren") or hide the number
- Gemini prompts include explicit instruction: "Do not include unexplained numerical values"
- PR review gate: any new numerical display requires explanation mechanism before merge

### "Warum sehe ich das?" — Explainability Layer

**Requirement**: `REQ-F-explainability-layer`

Every insight, tendency label, and influence score must have an accessible explanation of why the user sees it. The design pattern:

1. **Surface layer**: insight text (kurzsignal, tendency label, gauge value)
2. **Expand trigger**: "Warum?" link or info icon — always present, never hidden behind premium
3. **Explanation content**: 1–3 sentences citing the data inputs that drove this result (which astrological factor, signal strength, what the user could do with the information)
4. **Animation**: 300ms ease-out expand panel or bottom-sheet drawer (`DEC-spiritual-tech-interactions`)

This pattern applies to: Vibes kurzsignal, Weekly life-area tendency labels, Dashboard influence gauges, Signatur coherence index display.

---

## Mobile-First Design Constraints

**Constraint**: `CON-mobile-first-readability` | **Requirement**: `REQ-USA-mobile-first-readability`

All content-bearing UI sections must achieve <10s comprehension on a 375px mobile viewport. This is not a "nice to have" — it is a hard product constraint.

**Required design behaviour:**
- Maximum 3 content levels above the fold before scroll is required
- Body text minimum: `--text-sm` (14px / 1.5 line-height) — never smaller
- Touch targets ≥ 44px — enforced via `--touch-min` token (`DEC-design-system-v2`)
- Dashboard sections use progressive disclosure: headline → 1-line summary → expand for detail
- No horizontal scroll on mobile at any viewport ≥ 320px

**Responsive grid** (from `DEC-design-system-v2`):
- Mobile (< 640px): 1-column layout; 2×2 for the Big Four astrological tiles
- Tablet (640–1024px): 2 columns
- Desktop (> 1024px): 3–4 columns

---

## Quiz Generator Pipeline

**Requirement**: `REQ-F-quiz-generator-pipeline`

The quiz generator pipeline defines a formal, reusable mapping from quiz answers to Signatur dimensions. All 22 quiz components share the same data contract and output through `@bazodiac/shared`.

**Data contract (quiz output)**:
- All quizzes emit a `ContributionEvent` via `onComplete` callback
- `ContributionEvent` carries semantic `Marker`s (format: `marker.{domain}.{keyword}`, weight 0–1)
- Markers are mapped to 12-sector zodiac weight vectors via `AFFINITY_MAP` in `eventToSectorSignals()`

**Formal mappings** (defined in `@bazodiac/shared`):
1. **12-sector zodiac mapping**: `eventToSectorSignals()` + `AFFINITY_MAP` → `soulprint_sectors[12]`
2. **6D Signatur V3 mapping**: `quizSectorsToQuizWeights()` (from `packages/shared/src/signatur/`) → `quizWeights[6]` (one per DIMENSION_DEFS entry)
3. **5D Master Signal mapping**: `quiz-projection.ts` → `quizProjection[5]` (passion, stability, future, connection, autonomy)

**Cluster gate**: A cluster's contribution is only persisted when ALL quizzes in that cluster are complete. Gate logic lives in `useQuizContribution`.

**Universal scoring engine**: `scoreQuiz()` in `@bazodiac/shared/src/quizzes/scoring.ts` handles all three scoring models (multi-dimension, categorical, profile-driven) via a unified `QuizDefinition` type.

---

## References

- [`DEC-supabase-backend`](decisions/DEC-supabase-backend.md) — Supabase as auth and persistence layer
- [`DEC-swiss-ephemeris`](decisions/DEC-swiss-ephemeris.md) — Swiss Ephemeris pinned, no Moshier fallback
- [`DEC-wuxing-ui-mapping`](decisions/DEC-wuxing-ui-mapping.md) — Wu-Xing element-to-UI mapping conventions
- [`DEC-dissonance-model`](decisions/DEC-dissonance-model.md) — Three-layer dissonance model for signature modulation
- [`DEC-signatur-v3-bipolar-trails`](decisions/DEC-signatur-v3-bipolar-trails.md) — Bipolar trail engine (V3 prototype, replacing particle spirograph)
- [`DEC-multi-agent-voice`](decisions/DEC-multi-agent-voice.md) — Config-driven multi-agent voice architecture (Levi + Eve)
- [`DEC-vibes-not-daily`](decisions/DEC-vibes-not-daily.md) — On-demand Vibes (2–3h) instead of fixed daily insight
- [`DEC-vibes-gemini-strategy`](decisions/DEC-vibes-gemini-strategy.md) — Gemini for Vibes + Weekly Insights with two-level caching
- [`DEC-no-number-without-explanation`](decisions/DEC-no-number-without-explanation.md) — No numerical value in UI without explanation
- [`DEC-top-3-weekly-focus`](decisions/DEC-top-3-weekly-focus.md) — Weekly Insights highlights top-3 life areas
- [`DEC-design-system-v2`](decisions/DEC-design-system-v2.md) — Unified design system with dark/bright mode tokens
- [`DEC-spiritual-tech-interactions`](decisions/DEC-spiritual-tech-interactions.md) — Spiritual Tech interaction philosophy
- [`archive/TRUENORTH.md`](../archive/TRUENORTH.md) — Three-layer autopoietic model and five governing laws
- `bazodiac_engine/ARCHITECTURE.md` — Signal engine internals and projection modules

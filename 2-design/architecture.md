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

### ElevenLabs Voice Agent

Levi Bazi is an ElevenLabs voice widget embedded in the Dashboard. It calls back to the Express server at `/api/profile/:userId` to fetch the user's astro profile (soulprint sectors + natal weights) and `/api/agent/conversation` to persist conversation summaries. Authentication uses `ELEVENLABS_TOOL_SECRET`.

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

---

## References

- [`DEC-supabase-backend`](decisions/DEC-supabase-backend.md) — Supabase as auth and persistence layer
- [`DEC-swiss-ephemeris`](decisions/DEC-swiss-ephemeris.md) — Swiss Ephemeris pinned, no Moshier fallback
- [`DEC-wuxing-ui-mapping`](decisions/DEC-wuxing-ui-mapping.md) — Wu-Xing element-to-UI mapping conventions
- [`DEC-dissonance-model`](decisions/DEC-dissonance-model.md) — Three-layer dissonance model for signature modulation
- [`DEC-signatur-v3-bipolar-trails`](decisions/DEC-signatur-v3-bipolar-trails.md) — Bipolar trail engine (V3 prototype, replacing particle spirograph)
- [`archive/TRUENORTH.md`](../archive/TRUENORTH.md) — Three-layer autopoietic model and five governing laws
- `bazodiac_engine/ARCHITECTURE.md` — Signal engine internals and projection modules

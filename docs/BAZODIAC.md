# Bazodiac — Product Documentation

> Fusion Astrology · German Market · Dark Luxury · Science-Backed

**Version:** 1.0 · March 2026
**Stack:** React 19 · TypeScript · Supabase · Railway · Stripe · ElevenLabs
**Live:** [bazodiac.space](https://bazodiac.space) · [sky.bazodiac.space](https://sky.bazodiac.space)

---

## 1. What Is Bazodiac?

Bazodiac is a **fusion astrology web app** that combines three cosmological systems into one personalized visualization:

| System | Origin | What it contributes |
|---|---|---|
| **Western Astrology** | Greek/Roman | Sun, Moon, Ascendant, zodiac signs |
| **BaZi (Ba Zi)** | Chinese | Four Pillars (Year/Month/Day/Hour), Heavenly Stems, Earthly Branches |
| **Wu-Xing** | Chinese | Five Element balance (Wood / Fire / Earth / Metal / Water) |
| **Personality Quizzes** | Modern | Semantic markers mapped to zodiac sectors via AFFINITY_MAP |

The result is the **Fusion Ring** — a 12-sector radial signal vector that represents who a person is, distilled from four independent data sources.

Bazodiac is **not another horoscope app.** The interpretive layer rests on real astronomical calculations (BAFE API) and Jungian/Five-Element frameworks. The science is underneath; astrology is the language.

---

## 2. USP — Why Bazodiac Wins

### 2.1 The Four Differentiators

**① Multi-System Synthesis**
No other consumer app fuses Western, BaZi, and Wu-Xing into a single numerical signal. Co-Star does Western. The Pattern does Western. CHANI does Western. Bazodiac is the first to compute a mathematically unified personality vector from all three.

**② The Ring as Identity Object**
The Fusion Ring is not a chart. It's a living object — it deforms in real-time with planetary transits, reacts to solar storms, and sharpens as the user completes more quizzes. It becomes *theirs*. This is the engagement mechanic: come back to watch your Ring change.

**③ NASA-Backed Legitimacy**
sky.bazodiac.space uses real NASA data (APOD, DONKI, planet positions). This is not fake "astrology meets science" marketing — it's actual astronomical infrastructure underpinning the product. The Kp index from DONKI *literally* modulates Ring intensity during geomagnetic storms. The separation between "science" (sky.bazodiac.space) and "interpretation" (bazodiac.space) is the funnel and the brand simultaneously.

**④ Levi Bazi — The Ring Whisperer**
An ElevenLabs voice agent with full access to the user's astro profile. Not generic AI chat — a specialist who knows your BaZi, your dominant element, your quiz results, and your Ring. The conversation is personalized at inference time via tool callbacks.

### 2.2 Competitive Positioning

| | Co-Star | The Pattern | Sanctuary | **Bazodiac** |
|---|---|---|---|---|
| Western Astrology | ✓ | ✓ | ✓ | ✓ |
| Chinese BaZi | — | — | — | ✓ |
| Wu-Xing Elements | — | — | — | ✓ |
| Personality Quizzes | — | ✓ | — | ✓ |
| Voice Agent | — | — | — | ✓ |
| NASA Live Data | — | — | — | ✓ |
| Fusion Signal Vector | — | — | — | ✓ |
| German Market Focus | — | — | — | ✓ |

---

## 3. User Journey (End-to-End)

### 3.1 Discovery → Conversion

```
sky.bazodiac.space (public, no login)
  │
  ├── Sees NASA APOD hero — daily changing content
  ├── Sees Space Weather widget — "Mars activates intensity sectors"
  ├── Sees Planet Positions — real-time ecliptic longitudes
  │
  └── CTA: "Was bedeutet das für DEINEN Ring? →"
        │
        └── bazodiac.space (auth gate)
```

**Sky is the top of funnel.** SEO content (Mars in Scorpio 2026, Mercury retrograde, Vollmond März) drives organic traffic. Each page teases the personalized layer: *"this event hits everyone's Ring differently."*

### 3.2 Onboarding

```
1. AuthGate  →  Email + Password signup
                (auto-confirm via Supabase service role key)
                (detects existing user via identities.length === 0)

2. BirthForm →  Date · Time · Location (geocoder)
                Timezone auto-detected from coordinates

3. calculateAll() fires 5 parallel BAFE requests:
   ├── /calculate/bazi     → Four Pillars
   ├── /calculate/western  → Sun/Moon/Ascendant + house system
   ├── /calculate/fusion   → Combined West+BaZi overlay
   ├── /calculate/wuxing   → Element distribution
   └── /calculate/tst      → Time-sensitive transits

4. Gemini Flash  →  AI interpretation (German, 2-3 paragraphs)

5. Supabase persist (fire-and-forget):
   ├── astro_profiles (upsert)
   ├── birth_data
   └── natal_charts

6. Dashboard renders → first time: "Geburtstagshimmel" banner
```

### 3.3 Core App Loop

```
Dashboard
  ├── 3D Orrery (Three.js, Keplerian mechanics, 150 stars)
  ├── Western Cards:  Sun Sign · Moon Sign · Ascendant
  ├── BaZi Cards:     Year Animal (coin) · Wu-Xing Element
  │                   Day Master · Month Stem
  ├── BaZi Stelen:    Four Pillars (Year/Month/Day/Hour)
  ├── Fusion Ring:    12-sector canvas visualization
  ├── AI Interpretation (Gemini, markdown rendered)
  ├── Quiz Overlay:   personality quizzes → sharpen Ring signal
  └── Levi Bazi:      ElevenLabs voice agent
```

**The engagement hook:** Every quiz completed sharpens the Ring. The Ring changes slightly with each planetary transit. Users return to watch it evolve.

### 3.4 Premium Upgrade Path

```
User encounters PremiumGate component
  │
  ├── Free user: blurred content + "Upgrade" CTA
  │
  └── Click → POST /api/checkout
                → Stripe Session URL
                → Stripe hosted checkout (4,99 EUR, one-time)
                → Success redirect → ?upgrade=success
                → Stripe webhook: profiles.tier = 'premium'
```

---

## 4. Architecture

### 4.1 System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser (React 19 SPA)                 │
│   App.tsx → AuthContext → Dashboard → Fusion Ring           │
│   useFusionRing hook → signal[12] vector                    │
└──────────┬──────────────────────────┬───────────────────────┘
           │                          │
           ▼                          ▼
┌──────────────────┐       ┌─────────────────────┐
│  Express server  │       │    Supabase (PG)     │
│  server.mjs      │       │                      │
│  • BAFE proxy    │       │  profiles            │
│  • Stripe        │◄─────►│  astro_profiles      │
│  • ElevenLabs    │       │  birth_data          │
│  • Auth (signup) │       │  natal_charts        │
└──────┬───────────┘       │  contribution_events │
       │                   └─────────────────────-┘
       ▼
┌──────────────────┐   ┌────────────────┐   ┌─────────────────┐
│  BAFE API        │   │  Gemini Flash  │   │  ElevenLabs     │
│  (Vercel/Railway)│   │  (Google AI)   │   │  Voice Agent    │
│  24h cache       │   │  15s timeout   │   │  Levi Bazi      │
│  3x retry        │   │  DE fallback   │   │  Tool callbacks │
└──────────────────┘   └────────────────┘   └─────────────────┘

┌────────────────────────────────────────────────────────────┐
│  sky.bazodiac.space (separate Vite app, VPS-hosted)        │
│  NASA APOD · DONKI Space Weather · astronomy-engine        │
└────────────────────────────────────────────────────────────┘
```

### 4.2 Two Deployment Contexts

| Context | URL | Hosting | Purpose |
|---|---|---|---|
| Main App | bazodiac.space | Railway | Auth + charts + Ring + Levi |
| Sky | sky.bazodiac.space | VPS (nginx) | Public NASA content + SEO funnel |

### 4.3 BAFE Fallback Chain

The Express server proxies all `/api/calculate/*` requests to BAFE with:

```
Attempt 1: BAFE_INTERNAL_URL (Railway private IPv6 — faster, often fails)
Attempt 2: BAFE_PUBLIC_URL   (public Vercel/Railway URL)
Attempt 3: retry with 400ms backoff
Cache:      24h in-memory, keyed by method+URL+body hash
Timeout:    10s per attempt
```

If all attempts fail → returns empty object → Dashboard shows `—` (graceful degradation).

---

## 5. APIs

### 5.1 Internal API (Express / server.mjs)

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/api/calculate/bazi` | POST | — | BaZi Four Pillars via BAFE |
| `/api/calculate/western` | POST | — | Western chart via BAFE |
| `/api/calculate/fusion` | POST | — | Fused West+BaZi overlay |
| `/api/calculate/wuxing` | POST | — | Five Element distribution |
| `/api/calculate/tst` | POST | — | Time-sensitive transits |
| `/api/auth/signup` | POST | — | Server-side signup (auto-confirm) |
| `/api/checkout` | POST | Supabase JWT | Create Stripe checkout session |
| `/api/webhook/stripe` | POST | STRIPE_WEBHOOK_SECRET | Payment confirmed → set premium |
| `/api/profile/:userId` | GET | ELEVENLABS_TOOL_SECRET | Levi Bazi tool — user profile |
| `/api/debug-bafe` | GET | — | Cache stats, retry counts |

**Request format** (calculate endpoints):
```json
{
  "date": "1990-06-15T14:30:00",
  "tz": "Europe/Berlin",
  "lat": 52.52,
  "lon": 13.405
}
```

### 5.2 External APIs

| API | Usage | Rate/Cache |
|---|---|---|
| **BAFE** | All chart calculations | 24h cache, 3x retry |
| **Gemini Flash** (`gemini-3-flash-preview`) | AI interpretation, German | 15s timeout, DE fallback |
| **Supabase** (anon + service role) | Auth, persistence, profile fetch | SDK-managed |
| **Stripe** | Checkout sessions, webhooks | — |
| **ElevenLabs** | Levi Bazi voice agent widget | Widget-managed |
| **NASA APOD** | Daily astronomy image (sky app) | 6h localStorage cache |
| **NASA DONKI** | Space weather data (sky app) | 1h localStorage cache |
| **astronomy-engine** | Planet positions (sky app) | Client-side, real-time |

### 5.3 BAFE Response Mapping

BAFE returns German keys. `api.ts` maps them before the Dashboard sees them:

```typescript
// BaZi Pillar mapping
bafe.stamm   → stem    (Heavenly Stem)
bafe.zweig   → branch  (Earthly Branch)
bafe.tier    → animal  (Chinese Zodiac Animal)
bafe.element → element (Wu-Xing element)

// Western zodiac
bafe.zodiac_sign (0-11 integer) → "Aries"..."Pisces"
bafe.ascendant   (degrees)      → signFromDegrees()
```

---

## 6. Data Models

### 6.1 Database Schema (Supabase Postgres)

```sql
profiles (
  id             UUID PRIMARY KEY (→ auth.users)
  email          TEXT
  display_name   TEXT
  tier           TEXT DEFAULT 'free'  -- 'free' | 'premium'
  stripe_customer_id    TEXT
  stripe_payment_id     TEXT
  stripe_checkout_session TEXT
  created_at     TIMESTAMPTZ
)

astro_profiles (
  user_id        UUID PRIMARY KEY
  birth_date     DATE
  birth_time     TIME
  birth_place    TEXT
  sun_sign       TEXT
  moon_sign      TEXT
  asc_sign       TEXT
  astro_json     JSONB  -- full BAFE results + Gemini interpretation
  astro_computed_at TIMESTAMPTZ
)

birth_data (
  id      UUID PK
  user_id UUID UNIQUE
  birth_utc, lat, lon, tz, place_label, raw_input JSONB
)

natal_charts (
  id           UUID PK
  user_id      UUID UNIQUE
  payload      JSONB  -- complete chart data
  engine_version TEXT
  zodiac, house_system TEXT
)

contribution_events (
  id         UUID PK
  user_id    UUID
  event_id   TEXT UNIQUE    -- idempotent quiz results
  module_id  TEXT
  occurred_at TIMESTAMPTZ
  payload    JSONB           -- markers[], traits[], tags[]
)

agent_conversations (
  id        UUID PK
  user_id   UUID
  summary   TEXT
  topics    JSONB
  created_at TIMESTAMPTZ
)
```

**RLS:** Enabled on all tables. Users can only read/write their own rows.

### 6.2 Fusion Ring Signal

```typescript
// The core data structure of the entire product
type FusionSignal = number[12];  // index 0=Aries ... 11=Pisces

// Each value: 0.0 (no activation) to ~2.0+ (strong peak)

// Master formula:
Signal(s) = 0.375 * W(s)   // Western astrology
           + 0.375 * B(s)   // BaZi animals + stems
           + 0.25  * X(s)   // Wu-Xing element distribution
           // +0.20 * T(s) when quizzes present (weights rescale)
```

### 6.3 Contribution Event (Quiz Output)

```typescript
interface ContributionEvent {
  specVersion: 'sp.contribution.v1';
  eventId: string;          // UUID — idempotent
  occurredAt: string;       // ISO 8601
  source: {
    vertical: 'bazodiac';
    moduleId: string;       // e.g. 'love-languages'
  };
  payload: {
    markers: Array<{
      id: string;           // e.g. 'marker.love.physical_touch'
      weight: number;       // 0-1
    }>;
    traits?: TraitScore[];
    tags?: Tag[];
  };
}
```

Markers are mapped via `AFFINITY_MAP` → 12-sector weights → Gaussian spread (σ=1.2) → opposite sector tension (-15%).

---

## 7. Monetization

### 7.1 Model: Freemium + One-Time Payment

| Tier | Price | What You Get |
|---|---|---|
| **Free** | €0 | Full birth chart (BaZi + Western + Wu-Xing), Gemini AI interpretation, Fusion Ring visualization, 2-3 starter quizzes |
| **Premium** | **€4.99 one-time** | All premium features, unlimited quizzes, advanced Ring features, Levi Bazi conversations |

**Why one-time vs subscription:**
Subscription fatigue is real, especially in the German market. A €4.99 one-time feels like a tip, not a commitment. Conversion is higher. LTV per user is lower, so volume matters — hence the SEO strategy via sky.bazodiac.space.

### 7.2 The Funnel

```
sky.bazodiac.space         →  bazodiac.space/signup  →  Onboarding  →  Free Ring  →  Premium
(NASA content, SEO)           (frictionless, email)      (birth data)   (aha moment)  (PremiumGate)

Top of funnel:                Mid funnel:                Bottom:
"Mars enters Scorpio.         "Your Ring shows           "Unlock Levi +
 What does it mean            Scorpio peak. Intense."    deeper insights."
 for YOUR Ring?"
```

### 7.3 Revenue Drivers

1. **SEO organic** via sky.bazodiac.space — event pages indexed by Google
2. **Morning Mail** (planned) — daily Ring weather with transit data, 07:00 local time
3. **Push notifications** (planned) — surprise Ring events: `"♂ Mars auf deinem Skorpion-Peak. +23%"`
4. **Premium upsell** via PremiumGate on high-value features

### 7.4 Stripe Implementation

```
POST /api/checkout
  ← { url: "https://checkout.stripe.com/..." }

POST /api/webhook/stripe
  event: charge.succeeded
    → profiles SET tier='premium', stripe_payment_id=$id
```

Environment variables required: `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`

---

## 8. The Fusion Ring — Technical Deep Dive

### 8.1 Signal Computation Pipeline

```
BAFE Results
  │
  ├── westernToSectors(western)    → W[12]  (Sun×3, Moon×2, Asc×1 weighted)
  ├── baziToSectors(bazi)          → B[12]  (Year×3, Month×2, Day×2, Hour×1)
  └── wuxingToSectors(wuxing)      → X[12]  (Element → ruling sector burst)

Quiz Results (contribution_events)
  └── affinityToSectors(markers)   → T[12]  (AFFINITY_MAP lookup + Gauss bell)

Fusion:
  Signal[s] = w1*W[s] + w2*B[s] + w3*X[s] + w4*T[s]

  Normalize to [0, 1] range
  Apply opposition tension: Signal[s+6] -= 0.15 * max(Signal)

Output: number[12] — the Ring
```

### 8.2 Gauss Bell Spreading

Instead of hard spikes at one sector, the signal spreads organically:

```typescript
function gaussSpread(peak: number, sigma: number = 1.2): number[12] {
  return Array.from({ length: 12 }, (_, s) => {
    const dist = Math.min(Math.abs(s - peak), 12 - Math.abs(s - peak));
    return Math.exp(-(dist * dist) / (2 * sigma * sigma));
  });
}
```

This creates the characteristic "mountain range" Ring shape — peaks flow into adjacent sectors rather than creating isolated spikes.

### 8.3 Canvas Rendering

`FusionRing.tsx` renders via Canvas 2D API (no chart libraries):
- 12 sectors drawn as arc segments
- Color mapped from Wu-Xing element colors per sector
- Amplitude modulates sector radius (0.3 to 1.0 of max radius)
- Optional animation: sectors breathe via `requestAnimationFrame`
- Transit deformation: real-time planetary positions shift peaks

---

## 9. sky.bazodiac.space

Separate Vite + React app, deployed on VPS nginx.

### 9.1 Sections

| Section | Data Source | Update Frequency |
|---|---|---|
| APOD Hero | NASA APOD API | Daily (6h cache) |
| Space Weather | NASA DONKI (FLR + GST) | Hourly (1h cache) |
| Planet Positions | astronomy-engine (client-side) | Real-time |

### 9.2 Bot Protection (nginx)

```nginx
if ($http_user_agent ~* (GPTBot|CCBot|Claude-Web|Bytespider|PetalBot|AhrefsBot|SemrushBot)) {
    return 403;
}
```

AI scrapers and SEO bots are blocked to prevent bandwidth abuse (lesson from Vercel overages).

### 9.3 NASA API Keys

Free at api.nasa.gov. `DEMO_KEY` works for development (30 req/hr). Production key: 1000 req/hr.

---

## 10. Pitch — 2-Minute Version

### The Problem

Gen Z and Millennial women (the core astrology market) are bored of horoscope apps. Co-Star shows them a Sun sign. The Pattern shows them a Sun sign. Sanctuary shows them a Sun sign. Every app does the same thing. None of them use Chinese cosmology. None of them have a voice agent. None of them react to actual NASA data.

### The Product

Bazodiac synthesizes Western astrology + Chinese BaZi + Wu-Xing into **one personalized Ring** that lives and breathes. The Ring deforms with planetary transits. It intensifies during solar storms. It sharpens as you answer questions about yourself.

And Levi — the voice agent — knows your Ring. Not just your Sun sign. Your complete cosmological fingerprint.

### The Market

- Global astrology market: **$12.8B (2024)**, 10%+ CAGR
- German-speaking market underserved — no premium astrology app dominating DE/AT/CH
- Target: 18-35, female, spiritually curious, educated, willing to pay for depth

### The Numbers

- **€4.99 one-time** (no subscription friction)
- **10,000 users** × 30% conversion = **€14,970 MRR equivalent**
- **sky.bazodiac.space** SEO drives organic acquisition at €0 CAC
- **Morning Mail + Push** = daily retention without app store dependency

### The Moat

- Fusion Ring algorithm: 3 months of mathematical spec to build, not easy to copy
- BaZi data: requires BAFE API access + specialist mapping knowledge
- Levi persona: voice agent trained on Ring-specific interpretation framework
- NASA integration: credibility that no competitor can claim

### The Ask

_(For investor version — fill in terms)_

---

## 11. Development Setup

```bash
# Clone
git clone https://github.com/DYAI2025/Astro-Noctum
cd Astro-Noctum

# Install
npm install
cp .env.example .env.local
# Fill in: VITE_GEMINI_API_KEY, VITE_SUPABASE_URL, etc.

# Dev (two terminals)
npm run dev                          # Vite on :3000
PORT=3001 node server.mjs            # Express API on :3001

# Build
npm run build                        # → dist/
node server.mjs                      # production (serves dist/ + API)

# Type check
npm run lint                         # tsc --noEmit
```

### sky.bazodiac.space

```bash
cd bazodiac-sky
npm install
cp .env.example .env.local          # Set VITE_NASA_API_KEY
npm run dev                          # :3002

# Deploy to VPS
npm run build && rsync -az dist/ root@76.13.130.224:/var/www/bazodiac-sky/
```

### Key Environment Variables

```bash
# .env.local (main app)
VITE_GEMINI_API_KEY=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_BAFE_BASE_URL=https://bafe.vercel.app
VITE_ELEVENLABS_AGENT_ID=
SUPABASE_SERVICE_ROLE_KEY=
ELEVENLABS_TOOL_SECRET=
STRIPE_SECRET_KEY=
STRIPE_PRICE_ID=
STRIPE_WEBHOOK_SECRET=
```

---

## 12. Known Limitations & Roadmap

### Current Limitations

- No contract tests against BAFE → schema changes break silently
- BAFE unreachable from some dev environments → graceful degradation only
- No test suite → `npm run lint` (tsc) is the only automated check
- Morning Mail not yet implemented (infrastructure spec complete)
- Push notifications not yet implemented

### Roadmap

| Feature | Status | Priority |
|---|---|---|
| Morning Mail (07:00 daily transit digest) | Spec complete | P1 |
| PWA + Push Notifications | Planned | P1 |
| Animal × Element interpretation texts (60 combinations) | Waiting for content | P2 |
| Transit State Spec implementation | Spec complete | P2 |
| Quiz Cluster Energy System (Paket 5) | Plan written | P2 |
| Levi voice evolution (deeper Ring knowledge) | Ongoing | P2 |
| sky.bazodiac.space event SEO pages (90-day calendar) | Planned | P3 |
| Native App (iOS/Android) | After 10k DAU | P4 |

---

*Bazodiac · DYAI2025 · Confidential*

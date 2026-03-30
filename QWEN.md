# Bazodiac-WebApp — Project Context

## Workspace Overview

This workspace contains the **Bazodiac** project — a fusion astrology web application combining Western Astrology, Chinese BaZi (Four Pillars), and Wu-Xing (Five Elements) philosophy. The main application lives in the `Astro-Noctum/` subdirectory.

**Live Sites:**
- Main App: [bazodiac.space](https://bazodiac.space)
- Sky (NASA content funnel): [sky.bazodiac.space](https://sky.bazodiac.space)

**Tech Stack:**
- **Frontend:** React 19 + TypeScript + Vite 6 + Tailwind CSS v4 + Framer Motion + Three.js
- **Backend:** Express.js (server.mjs)
- **Database:** Supabase (PostgreSQL with Row Level Security)
- **External APIs:** BAFE (astrology calculations), Gemini (AI text), ElevenLabs (voice agent), NASA DONKI (space weather), Stripe (payments)
- **Deployment:** Railway (main app), VPS nginx (sky app)

**UI Language:** German (primary) with English toggle

---

## Directory Structure

```
Bazodiac-WebApp/
├── Astro-Noctum/              # Main application (React + Express)
│   ├── src/
│   │   ├── components/        # React components (BirthForm, Dashboard, FusionRing, BaZiPillars, etc.)
│   │   ├── contexts/          # AuthContext, LanguageContext, PlanetariumContext, FusionRingContext
│   │   ├── hooks/             # Custom hooks (useAmbientePlayer, usePlanetarium, useAstroProfile)
│   │   ├── i18n/              # Translations (de/en)
│   │   ├── lib/               # Utilities (astronomy, 3D materials, analytics, feature flags)
│   │   ├── pages/             # Page components (Atlas, Dashboard)
│   │   ├── services/          # API clients (api.ts, gemini.ts, supabase.ts, experience.ts)
│   │   ├── types/             # TypeScript definitions
│   │   ├── utils/             # Helper functions
│   │   ├── App.tsx            # Main SPA component
│   │   ├── main.tsx           # Entry point
│   │   └── router.tsx         # React Router config
│   ├── apps/mobile/           # React Native mobile app (Expo)
│   ├── bazodiac_engine/       # Core calculation engine
│   ├── docs/                  # Documentation (BAZODIAC.md, API_REFERENCE.md, etc.)
│   ├── features/              # Feature modules
│   ├── packages/              # Shared packages
│   ├── plans/                 # Development plans and specs
│   ├── scripts/               # Build and utility scripts
│   ├── supabase-migrations/   # Database migrations
│   ├── server.mjs             # Express production server (3432 lines)
│   ├── package.json           # Dependencies + scripts
│   ├── tsconfig.json          # TypeScript config
│   ├── vite.config.ts         # Vite config + dev proxy
│   ├── supabase-schema.sql    # Database schema + RLS policies
│   ├── .env.example           # Environment variable template
│   └── AGENTS.md              # Development guidelines
├── 1_-_Fusion_Ring_Design\ (1)/  # Design assets
├── Dev_brief/                 # Development briefs
└── images/                    # Image assets
```

---

## Getting Started (Astro-Noctum)

### Prerequisites
- Node.js **20.19+** (pinned in `.nvmrc`)
- npm 10+

### Development Setup

```bash
cd Astro-Noctum

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
```

### Required Environment Variables

| Variable | Scope | Description |
|----------|-------|-------------|
| `VITE_GEMINI_API_KEY` | Client | Google Gemini API key |
| `VITE_BAFE_BASE_URL` | Client | BAFE API base (default: `https://bafe.vercel.app`) |
| `VITE_SUPABASE_URL` | Client | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Client | Supabase anon key |
| `SUPABASE_URL` | Server | Supabase URL (server-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Supabase service role key |
| `VITE_ELEVENLABS_AGENT_ID` | Client | ElevenLabs agent ID (Levi Bazi) |
| `ELEVENLABS_TOOL_SECRET` | Server | ElevenLabs tool auth secret |
| `STRIPE_SECRET_KEY` | Server | Stripe secret key |
| `STRIPE_PRICE_ID` | Server | Stripe price ID for premium |
| `STRIPE_WEBHOOK_SECRET` | Server | Stripe webhook secret |
| `NASA_API_KEY` | Server | NASA DONKI API key |
| `APP_URL` | Server | Base URL for Stripe redirects |

### Development Commands

```bash
# Terminal 1: Vite dev server (port 3000)
npm run dev

# Terminal 2: Express server (port 3001) - for /api routes
PORT=3001 node server.mjs
```

### Production Build

```bash
npm run build        # → dist/
npm run start        # Express serves dist/ on PORT
```

### Other Commands

```bash
npm run lint              # TypeScript type-check (tsc --noEmit)
npm run clean             # Remove dist/
npm run test              # Vitest tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report
npm run storybook         # Storybook dev (port 6006)
npm run build-storybook   # Static Storybook build
```

---

## Architecture

### Application Flow

```
Splash → AuthGate → BirthForm → Dashboard → FusionRing / Atlas / Levi
```

### Data Flow

1. **BirthForm** collects birth data (date/time/location/timezone)
2. **api.ts** → `calculateAll()` fires 5 parallel BAFE requests:
   - `/calculate/bazi` — Chinese Four Pillars
   - `/calculate/western` — Western astrology (Sun/Moon/Ascendant)
   - `/calculate/fusion` — Combined overlay
   - `/calculate/wuxing` — Five Elements distribution
   - `/calculate/tst` — Time-sensitive transits
3. **gemini.ts** → AI interpretation generation (German, 400-500 words)
4. **supabase.ts** → Persist to database (non-blocking)
5. **Dashboard** renders results + 3D orrery + Fusion Ring + ElevenLabs widget

### BAFE Fallback Chain (server.mjs)

```
1. BAFE_INTERNAL_URL (Railway private IPv6) — if configured
2. BAFE_PUBLIC_URL (https://bafe-production.up.railway.app)
3. Retry with 400ms backoff
Cache: 24h in-memory, keyed by method+URL+body hash
Timeout: 10s per attempt
```

### Server Contexts

| Context | Purpose |
|---------|---------|
| **Vite dev** | Proxies `/api/calculate/*` to BAFE, other `/api/*` to Express (port 3001) |
| **Express prod** | Serves `dist/`, handles BAFE proxy, Supabase auth, ElevenLabs, Stripe, Gemini |

---

## Key Components

| Component | Purpose |
|-----------|---------|
| `BirthForm` | Birth data input with Google Places autocomplete |
| `AuthGate` | Supabase auth (signup/signin) with disposable email blocking |
| `Dashboard` | Main results view with Western/BaZi cards, Fusion Ring, AI interpretation |
| `FusionRing` | Canvas-based 12-sector radial visualization (signal vector [12]) |
| `BirthChartOrrery` | Three.js 3D solar system (Keplerian mechanics, 150 stars) |
| `BaZiFourPillars` | Chinese Four Pillars display (Year/Month/Day/Hour) |
| `WuXingPentagon` | Five Elements pentagon visualization |
| `SignatureReveal` | Onboarding signature animation |
| `PremiumGate` | Upgrade paywall for free users |

### Context Providers

- `AuthContext` — Supabase authentication state
- `LanguageContext` — i18n (German/English toggle)
- `PlanetariumContext` — Planetarium mode toggle
- `FusionRingContext` — Fusion Ring state management
- `AppLayoutContext` — Layout state

---

## Database Schema (Supabase)

All tables have **Row Level Security (RLS)** enabled.

| Table | Description |
|-------|-------------|
| `profiles` | User profile (auto-created on signup via trigger) |
| `birth_data` | User birth info (one per user, UNIQUE user_id) |
| `astro_profiles` | Computed astro data (one per user, read by ElevenLabs) |
| `natal_charts` | Natal chart payload (one per user) |
| `agent_conversations` | Levi Bazi session summaries |
| `contribution_events` | Quiz results for Fusion Ring signal sharpening |
| `profiles.tier` | Premium status ('free' | 'premium') |

See `Astro-Noctum/supabase-schema.sql` for full DDL and RLS policies.

---

## API Endpoints (Express / server.mjs)

### Astrology Calculations

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/calculate/bazi` | POST | BaZi Four Pillars via BAFE |
| `/api/calculate/western` | POST | Western chart via BAFE |
| `/api/calculate/fusion` | POST | Fused West+BaZi overlay |
| `/api/calculate/wuxing` | POST | Five Element distribution |
| `/api/calculate/tst` | POST | Time-sensitive transits |

### User & Content

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/signup` | POST | Server-side signup (auto-confirm via service role) |
| `/api/interpret` | POST | Gemini AI interpretation generation |
| `/api/analyze/conversation` | POST | Dialogue marker analysis (LeanDeep framework) |
| `/api/profile/:userId` | GET | ElevenLabs tool — user cosmic profile |

### Monetization

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/checkout` | POST | Create Stripe checkout session |
| `/api/webhook/stripe` | POST | Handle Stripe events (upgrade to premium) |

### Utilities

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/space-weather` | GET | NASA DONKI Kp-index data (15min cache) |
| `/api/debug-bafe` | GET | BAFE cache stats and error counts |
| `/api/mobile/bootstrap` | GET | Mobile app bootstrap contract |

---

## Fusion Ring Engine

The **Fusion Ring** is the core product differentiator — a 12-sector radial signal vector representing the user's cosmological fingerprint.

### Signal Computation

```typescript
type FusionSignal = number[12];  // index 0=Aries ... 11=Pisces

// Master formula:
Signal(s) = 0.375 * W(s)   // Western astrology (Sun×3, Moon×2, Asc×1)
           + 0.375 * B(s)   // BaZi (Year×3, Month×2, Day×2, Hour×1)
           + 0.25  * X(s)   // Wu-Xing element distribution
           // +0.20 * T(s) when quizzes present (weights rescale)
```

### Gaussian Spread

Instead of hard spikes, signals spread organically via Gaussian bell curve (σ=1.2):

```typescript
function gaussSpread(peak: number, sigma: number = 1.2): number[12] {
  return Array.from({ length: 12 }, (_, s) => {
    const dist = Math.min(Math.abs(s - peak), 12 - Math.abs(s - peak));
    return Math.exp(-(dist * dist) / (2 * sigma * sigma));
  });
}
```

### Quiz Integration

Quiz results are stored as `contribution_events` with markers mapped via `AFFINITY_MAP` → 12-sector weights → Gaussian spread → opposite sector tension (-15%).

---

## Styling Conventions

**Tailwind v4** with custom theme tokens in `src/index.css`:

```css
/* Dark theme (splash/auth) */
--color-obsidian: #00050A;   /* Deep black background */
--color-gold: #D4AF37;       /* Luxury accent */
--color-ash: #1A1C1E;        /* Secondary dark */

/* Morning theme (main app) */
--color-dawn: #E2ECF6;       /* Light bluish-gray background */
--color-ink: #1E2A3A;        /* Dark text */
--color-gold-deep: #8B6914;  /* Muted gold accent */
```

**Fonts:**
- Sans-serif: Sora
- Serif: Cormorant Garamond

**Custom Classes:**
- `.glass-card` — Frosted glass effect
- `.stele-card` — BaZi pillar decorative card
- `.morning-bg` — Morning gradient background

---

## Development Guidelines

### Code Style
- TypeScript + React functional components
- 2-space indentation, ES modules
- `PascalCase` for components, `camelCase` for hooks/utilities
- Suffix context providers with `Context`
- Tailwind utility classes over global CSS
- Inline comments explain intent (e.g., `// T-001` checkpoints)

### Testing
- Vitest with happy-dom environment
- Tests in `src/**/__tests__/**`
- Run `npm run lint` (tsc --noEmit) before commits
- Manual regression passes for critical flows

### Git & PRs
- Conventional Commits: `feat:`, `fix:`, `chore:`
- PRs should include: UX summary, schema/.env impacts, screenshots, manual test coverage

### Security
- Never commit secrets — use `.env.local`
- Validate Supabase RLS policies align with new tables
- Sanitize logged API payloads

---

## Deployment (Railway)

### Configuration

- `nixpacks.toml` — Pins Node.js 20 runtime
- `railway.json` — Build/deploy commands

### Build Process

```toml
# nixpacks.toml
[phases.install]
cmds = ["npm ci"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npm run start"
```

### Required Railway Variables

All variables from `.env.example` must be set in Railway dashboard.

---

## sky.bazodiac.space

Separate Vite + React app deployed on VPS nginx. Uses NASA APIs for SEO funnel content.

### Sections

| Section | Data Source | Update Frequency |
|---------|-------------|-----------------|
| APOD Hero | NASA APOD API | Daily (6h cache) |
| Space Weather | NASA DONKI (FLR + GST) | Hourly (1h cache) |
| Planet Positions | astronomy-engine (client-side) | Real-time |

### Bot Protection (nginx)

```nginx
if ($http_user_agent ~* (GPTBot|CCBot|Claude-Web|Bytespider|PetalBot|AhrefsBot|SemrushBot)) {
    return 403;
}
```

---

## Mobile App (React Native / Expo)

Located in `apps/mobile/`. Uses Expo EAS for builds.

```bash
cd apps/mobile
npm install
eas build --platform ios  # or android
```

See `apps/mobile/README.md` and `eas.json` for configuration.

---

## Documentation

| File | Description |
|------|-------------|
| `Astro-Noctum/README.md` | User-facing setup guide |
| `Astro-Noctum/docs/BAZODIAC.md` | Product overview, USP, architecture (comprehensive) |
| `Astro-Noctum/docs/API_REFERENCE.md` | Backend endpoints and integrations |
| `Astro-Noctum/AGENTS.md` | Development guidelines |
| `Astro-Noctum/CLAUDE.md` | Claude Code guidance |
| `Astro-Noctum/GEMINI.md` | Gemini integration docs |
| `Astro-Noctum/BUGS.md` | Known issues and limitations |
| `Astro-Noctum/CHANGELOG.md` | Version history |
| `Astro-Noctum/QUIZ_MAPPING_MARKERS.md` | Quiz component documentation |
| `Astro-Noctum/SETUP-ELEVENLABS.txt` | ElevenLabs agent setup |
| `Astro-Noctum/RAILWAY_DEPLOYMENT.md` | Railway deployment guide |

---

## Known Limitations

- No contract tests against BAFE → schema changes break silently
- BAFE unreachable from some environments → graceful degradation only
- No comprehensive test suite → `npm run lint` (tsc) is primary automated check
- Morning Mail not yet implemented (infrastructure spec complete)
- Push notifications not yet implemented

---

## Related Projects

- **BAFE API** — Astrology calculation backend (separate repo)
- **sky.bazodiac.space** — NASA content funnel (VPS-hosted)
- **Codex-flow** — Multi-agent orchestration (workspace-wide tool)

---

*Bazodiac · DYAI2025 · Confidential*

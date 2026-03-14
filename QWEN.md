# Astro-Noctum (Bazodiac) — Project Context

## Project Overview

**Astro-Noctum** is a fusion astrology web application that combines Western astrology, Chinese BaZi (Four Pillars of Destiny), and Wu-Xing (Five Elements) philosophy. Users input birth data to receive AI-generated horoscope interpretations via Google Gemini, visualize their natal chart through a 3D orrery, and interact with "Levi Bazi" — an ElevenLabs voice agent.

**Tech Stack:**
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4
- **Backend:** Express.js (production server), Vite proxy (development)
- **Database:** Supabase (PostgreSQL with Row Level Security)
- **External APIs:** BAFE (astrology calculations), Gemini (text generation), ElevenLabs (voice agent), NASA DONKI (space weather)
- **Deployment:** Railway (nixpacks-based build)
- **Payments:** Stripe (premium upgrades)

**UI Language:** German (with English toggle)  
**Aesthetic:** Dark luxury (obsidian/gold) for splash/auth; Morning theme (bluish-gray) for main app

---

## Directory Structure

```
Astro-Noctum/
├── src/
│   ├── components/       # React components (BirthForm, Dashboard, FusionRing, BaZiPillars, etc.)
│   ├── contexts/         # React Context providers (AuthContext, LanguageContext, PlanetariumContext)
│   ├── hooks/            # Custom React hooks (useAmbientePlayer, usePlanetarium)
│   ├── i18n/             # Internationalization translations (de/en)
│   ├── lib/              # Utilities (astronomy calculations, 3D materials, supabase client, analytics)
│   ├── pages/            # Page components (Atlas, Dashboard pages)
│   ├── services/         # API clients (api.ts, gemini.ts, supabase.ts)
│   ├── types/            # TypeScript type definitions (bafe, interpretation)
│   ├── shaders/          # GLSL shaders for 3D visualizations
│   ├── stories/          # Storybook component stories
│   ├── App.tsx           # Main application component (state-driven SPA)
│   ├── main.tsx          # Entry point
│   ├── router.tsx        # React Router configuration
│   └── index.css         # Global styles + Tailwind v4 config
├── media/                # Static assets
├── public/               # Public static files
├── dist/                 # Production build output
├── server.mjs            # Express production server
├── vite.config.ts        # Vite configuration + dev proxy
├── tsconfig.json         # TypeScript configuration
├── package.json          # Dependencies + scripts
├── railway.json          # Railway deployment config
├── nixpacks.toml         # Nixpacks build configuration
├── supabase-schema.sql   # Database schema + RLS policies
└── .env.example          # Environment variable template
```

---

## Building and Running

### Prerequisites
- Node.js **20.19+** (pinned in `.nvmrc`, `package.json`, and `nixpacks.toml`)
- npm 10+

### Development

```bash
# Install dependencies
npm install

# Copy environment template and fill values
cp .env.example .env.local

# Start Vite dev server (port 3000)
npm run dev

# Optional: Run Express server separately for /api/auth, /api/profile, /api/agent routes
PORT=3001 node server.mjs
```

### Production

```bash
# Build for production
npm run build        # Outputs to dist/

# Start production server
npm run start        # Express serves dist/ on PORT (default 3000)
```

### Other Commands

```bash
npm run lint         # TypeScript type-check (tsc --noEmit)
npm run clean        # Remove dist/
npm run storybook    # Start Storybook dev server (port 6006)
npm run build-storybook  # Build Storybook static
npm run test         # Run Vitest tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

---

## Environment Variables

Create `.env.local` from `.env.example`. Variables prefixed with `VITE_` are exposed to the browser; unprefixed are server-only.

| Variable | Scope | Description |
|----------|-------|-------------|
| `VITE_GEMINI_API_KEY` | Client | Google Gemini API key for horoscope generation |
| `VITE_BAFE_BASE_URL` | Client | BAFE API base URL (default: `https://bafe.vercel.app`) |
| `VITE_SUPABASE_URL` | Client | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Client | Supabase anon/public key |
| `SUPABASE_URL` | Server | Supabase project URL (server-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Supabase service role key (bypasses RLS) |
| `VITE_ELEVENLABS_AGENT_ID` | Client | ElevenLabs voice agent ID |
| `ELEVENLABS_TOOL_SECRET` | Server | Secret token for ElevenLabs tool auth |
| `VITE_GOOGLE_PLACES_API_KEY` | Client | Optional: Google Places API for city autocomplete |
| `STRIPE_SECRET_KEY` | Server | Stripe secret key for payments |
| `STRIPE_PRICE_ID` | Server | Stripe price ID for premium tier |
| `STRIPE_WEBHOOK_SECRET` | Server | Stripe webhook signing secret |
| `NASA_API_KEY` | Server | NASA DONKI API key (space weather data) |
| `APP_URL` | Server | Application base URL for Stripe redirects |

---

## Architecture

### Application Flow

```
Splash → AuthGate → BirthForm → Dashboard → FusionRing / Atlas
```

State-driven single-page app using React Router. Authentication via Supabase Auth.

### Data Flow

1. **BirthForm** collects birth date/time/location/timezone
2. **services/api.ts** → `calculateAll()` fires 5 parallel requests to BAFE:
   - `/calculate/bazi` — Chinese Four Pillars
   - `/calculate/western` — Western astrology
   - `/calculate/fusion` — Combined interpretation
   - `/calculate/wuxing` — Five Elements analysis
   - `/calculate/tst` — Time Space Theory
3. **services/gemini.ts** → Sends combined results to Gemini for AI interpretation
4. **services/supabase.ts** → Persists data to Supabase (non-blocking)
5. **Dashboard** renders results + 3D orrery + ElevenLabs widget + Fusion Ring visualization

### Server Contexts

| Context | Purpose |
|---------|---------|
| **Vite dev server** (`npm run dev`) | Proxies `/api/calculate/*` to BAFE; `/api/auth`, `/api/profile`, `/api/agent`, `/api/transit-state`, `/api/space-weather`, `/api/interpret` to local Express (port 3001) |
| **Express production server** (`server.mjs`) | Serves `dist/`, proxies BAFE with fallback chain, handles server-side auth, ElevenLabs endpoints, Stripe checkout, Gemini interpretation |

### BAFE Fallback Chain

The production server uses an ordered fallback chain for BAFE API requests:
1. Internal Railway URL (`BAFE_INTERNAL_URL`) if configured
2. Public URL (`https://bafe-production.up.railway.app`)

This handles IPv6-only private networking issues gracefully (`ENETUNREACH` errors).

### Caching Strategy

- **BAFE responses:** 24-hour in-memory cache with automatic eviction
- **Space weather (NASA DONKI):** 15-minute cache
- **Transit state:** No-store cache, fallback to profile-derived data if upstream unavailable

---

## Key Modules

| File | Purpose |
|------|---------|
| `src/contexts/AuthContext.tsx` | Supabase auth provider (signIn/signUp/signOut) with disposable email blocking |
| `src/contexts/LanguageContext.tsx` | i18n provider (German/English toggle) |
| `src/contexts/PlanetariumContext.tsx` | Planetarium mode toggle state |
| `src/contexts/FusionRingContext.tsx` | Fusion Ring 3D state management |
| `src/services/api.ts` | BAFE API client with response normalization and fallback handling |
| `src/services/gemini.ts` | Gemini Flash integration for horoscope text generation |
| `src/services/supabase.ts` | Database operations (birth_data, astro_profiles, natal_charts) |
| `src/components/BirthChartOrrery.tsx` | Three.js 3D solar system visualization |
| `src/components/FusionRing.tsx` | Real-time fusion divergence field visualization |
| `src/components/BirthForm.tsx` | Birth data input with Google Places autocomplete |
| `src/components/Dashboard.tsx` | Results display, orrery, ElevenLabs widget, BaZi pillars |
| `src/components/BaZiFourPillars.tsx` | Chinese Four Pillars display component |
| `src/components/WuXingPentagon.tsx` | Five Elements pentagon visualization |
| `src/lib/astronomy/` | Keplerian orbital mechanics, star catalog, constellation data |
| `src/lib/3d/materials.ts` | Custom GLSL shaders (sun corona, atmospheric glow, Saturn rings) |
| `src/lib/analytics.ts` | Google Analytics event tracking |
| `server.mjs` | Production Express server with BAFE proxy, Supabase admin auth, ElevenLabs endpoints, Stripe, Gemini |

---

## Database Schema (Supabase)

Tables (all with Row Level Security enabled):

| Table | Description |
|-------|-------------|
| `profiles` | User profile (auto-created on signup via trigger) |
| `birth_data` | User-submitted birth information (one per user) |
| `astro_profiles` | Computed astrological data (one per user, read by ElevenLabs) |
| `natal_charts` | Natal chart payload (one per user) |
| `agent_conversations` | ElevenLabs Levi Bazi session summaries |
| `readings` | Completed reading history with interpretation |

See `supabase-schema.sql` for full DDL and RLS policies.

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

**Custom CSS Classes:**
- `.glass-card` — Frosted glass effect (dark theme)
- `.stele-card` — Decorative card style for BaZi pillars
- `.morning-bg` — Morning gradient background
- `.lang-toggle` — Language switcher button group

---

## Development Conventions

- **TypeScript:** Strict mode disabled (`strict: false`), no emit (type-check only via `npm run lint`)
- **Path Alias:** `@/*` maps to project root (configured in `tsconfig.json` and `vite.config.ts`)
- **React:** Functional components with hooks, React 19
- **Testing:** Vitest with happy-dom environment, tests in `src/**/__tests__/**`
- **Code Style:** Inferred from existing code — semicolons, double quotes, trailing commas in objects
- **i18n:** All user-facing strings use the `LanguageContext` with `t()` helper
- **State Management:** React Context for global state (auth, language, planetarium, fusion ring)

---

## Deployment (Railway)

### Configuration Files

- `nixpacks.toml` — Pins Node.js 20 runtime via Nixpacks
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

- `VITE_GEMINI_API_KEY`
- `VITE_BAFE_BASE_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ELEVENLABS_AGENT_ID`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ELEVENLABS_TOOL_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_ID`
- `STRIPE_WEBHOOK_SECRET`
- `NASA_API_KEY`
- `APP_URL`

---

## API Endpoints (Express Server)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/calculate/:endpoint` | POST | Proxy to BAFE (`bazi`, `western`, `fusion`, `wuxing`, `tst`) |
| `/api/chart` | GET/POST | Proxy to BAFE chart endpoint |
| `/api/webhook/chart` | POST | Proxy to BAFE webhook |
| `/api/transit-state/:userId` | GET | Transit state with fallback to profile-derived data |
| `/api/space-weather` | GET | NASA DONKI Kp-index data (cached 15min) |
| `/api/profile/:userId` | GET | ElevenLabs tool: fetch user's astro profile |
| `/api/agent/conversation` | POST | ElevenLabs tool: save conversation summary |
| `/api/interpret` | POST | Server-side Gemini interpretation generation |
| `/api/checkout` | POST | Stripe checkout session creation |
| `/api/debug-bafe` | GET | Diagnostic: probe BAFE endpoints (dev only) |

---

## External Dependencies

| Service | Purpose |
|---------|---------|
| **BAFE API** | Astrology calculation backend (German field names for BaZi pillars) |
| **Supabase** | Auth + PostgreSQL database |
| **Gemini API** | Text generation (`gemini-3-flash-preview`) |
| **ElevenLabs** | Voice agent widget (Levi Bazi) |
| **NASA DONKI** | Space weather data (Kp-index for Fusion Ring) |
| **Stripe** | Payment processing for premium upgrades |
| **Google Places** | City autocomplete in BirthForm |
| **Google Analytics** | Event tracking |

---

## Known Issues

See `BUGS.md` for current limitations:
- Live verification of BAFE endpoint schema not possible in isolated environments due to network restrictions (`ENETUNREACH`)
- Recommended: Add CI contract tests against staging BAFE instance

---

## Additional Documentation

- `README.md` — User-facing setup and deployment guide
- `CLAUDE.md` — Developer guidance for Claude Code
- `AGENTS.md` — Agent-specific instructions
- `GEMINI.md` — Gemini integration documentation
- `SETUP-ELEVENLABS.txt` — ElevenLabs agent configuration
- `elevenlabs-tool.json` — ElevenLabs tool definition
- `elevenlabs-tool-save-conversation.json` — Conversation save tool config
- `RAILWAY_DEPLOYMENT.md` — Railway deployment guide
- `CHANGELOG.md` — Version history
- `QUIZ_MAPPING_MARKERS.md` — Quiz component documentation

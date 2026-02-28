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

# Full local dev (needs both):
# Terminal 1: npm run dev                    (Vite on :3000)
# Terminal 2: PORT=3001 node server.mjs      (Express API on :3001, for /api/auth, /api/profile, /api/agent)
```

Node 20.19+ required (pinned in `.nvmrc`). No test suite — `npm run lint` (tsc --noEmit) is the only automated check.

## Architecture

**Single-page React 19 app** — Vite + Tailwind CSS v4 + TypeScript. No router; the app flow is state-driven: `Splash → AuthGate → BirthForm → Dashboard`. All state lives in `App.tsx` via `useState`.

### Two Server Contexts

- **Vite dev server** (`npm run dev`): Proxies `/api/calculate/*` to BAFE and `/api/auth`, `/api/profile`, `/api/agent` to a local Express instance (port 3001). Configured in `vite.config.ts`.
- **Express production server** (`server.mjs`): Serves built `dist/`, proxies to BAFE with internal/public URL fallback chain, handles server-side auth (signup with auto-confirm via Supabase service role key), ElevenLabs profile endpoint, and agent session creation.

### Data Flow

1. `BirthForm` collects date/time/coordinates/timezone
2. `services/api.ts` → `calculateAll()` fires 5 parallel requests to BAFE (bazi, western, fusion, wuxing, tst) via same-origin proxy. Each endpoint has independent fallback to empty data on failure.
3. `services/gemini.ts` → sends combined results to Gemini for AI interpretation (with German fallback text if API unavailable)
4. `services/supabase.ts` → persists birth_data, astro_profiles (upsert), natal_charts to Supabase (non-blocking, fire-and-forget)
5. `Dashboard` renders results + 3D orrery + ElevenLabs voice widget

### Key Modules

| Path | Purpose |
|------|---------|
| `src/App.tsx` | Root component — holds all app state, orchestrates the Splash → Auth → Form → Dashboard flow |
| `src/contexts/AuthContext.tsx` | Supabase auth provider (signIn/signUp/signOut). Signup hits server-side `/api/auth/signup` (auto-confirm), falls back to client-side Supabase signup if server unreachable |
| `src/services/api.ts` | BAFE API client. Maps BAFE response formats (German keys like `stamm/zweig/tier`) to Dashboard-expected English keys. Zodiac signs mapped from 0-based index to name strings |
| `src/services/gemini.ts` | Gemini Flash integration for horoscope text generation (model: `gemini-3-flash-preview`, 15s timeout) |
| `src/services/supabase.ts` | Supabase persistence layer — `upsertAstroProfile`, `insertBirthData`, `insertNatalChart`, `fetchAstroProfile` |
| `src/components/BirthChartOrrery.tsx` | Three.js 3D solar system visualization with Keplerian orbital mechanics |
| `src/lib/astronomy/` | Orbital calculations (Kepler solver, J2000 epoch), star catalog (150 stars), constellation data, planet orbital elements |
| `src/lib/3d/materials.ts` | Custom GLSL shaders (sun corona, atmospheric Fresnel glow, Saturn rings with Cassini division) |
| `server.mjs` | Production Express server: BAFE proxy with fallback chain, Supabase admin auth, ElevenLabs tool endpoints, debug probe at `/api/debug-bafe` |

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
- Server-only: `SUPABASE_SERVICE_ROLE_KEY`, `ELEVENLABS_TOOL_SECRET`, `BAFE_INTERNAL_URL`

Note: `vite.config.ts` also exposes `GEMINI_API_KEY` (non-VITE prefixed) via `define` for backward compat.

### Styling

Tailwind v4 with `@theme` custom tokens in `src/index.css`: `--color-obsidian: #00050A`, `--color-gold: #D4AF37`, `--color-ash: #1A1C1E`. Fonts: Sora (sans), Cormorant Garamond (serif). Custom CSS classes: `.glass-card`, `.stele-card`, `.skeleton-dust`, `.grain-overlay`.

### Static Assets

Vite serves from `media/` directory (configured as `publicDir: 'media'` in `vite.config.ts`), not the default `public/`.

### Deployment

Railway via `nixpacks.toml` + `railway.json`. Build: `npm ci && npm run build`. Start: `node server.mjs`. The Express server handles BAFE routing with fallback from Railway internal networking (IPv6, often unreliable) to public URL.

### Path Alias

`@/*` maps to **project root** (not `src/`), configured in both `tsconfig.json` and `vite.config.ts`. So `@/src/services/api` resolves to `./src/services/api`.

### Known Issues

- BAFE API cannot always be reached from local/CI environments (`ENETUNREACH`). The app is designed to degrade gracefully — failed endpoints return empty data and the Dashboard shows "—".
- No contract tests against BAFE; schema changes require manual verification.

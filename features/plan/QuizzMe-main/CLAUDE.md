# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start dev server at http://localhost:3000
npm run build            # Production build (.next)
npm run build:static     # Static export (out/) - no API routes
npm run lint             # ESLint
npm run test             # Vitest tests
npm run test:watch       # Vitest in watch mode
npm run registry:lint    # Validate registry IDs in codebase
```

Run a single test file:
```bash
npx vitest run src/lib/traits/__tests__/trait-engine.test.ts
```

## Architecture

### Routing (Next.js 16 Proxy)

`src/proxy.ts` handles all routing (replaces middleware.ts in Next.js 16):
- Root `/` and `/de` redirect to `/astrosheet`
- Hostname contains "horoskop"/"horoscope" → rewrite to `/verticals/horoscope/*`
- Default hostname → rewrite to `/verticals/quiz/*`
- Paths like `/login`, `/auth`, `/onboarding`, `/verticals`, `/astrosheet`, `/character` skip locale redirect

### Main Pages

- `/astrosheet` - Main dashboard (requires auth, uses TranslationProvider)
- `/verticals/quiz` - Quiz landing with cluster progress
- `/login` - Auth page
- `/onboarding/astro` - Birth data collection

### Core Data Flow

```
Quiz Answer → ContributionEvent → ingestContribution() → ProfileState → ProfileSnapshot (UI)
```

**Key modules:**
- `src/lib/ingestion/` - Entry point for processing quiz results
- `src/lib/lme/` - Lean Micro Experience (psyche dimension aggregation)
- `src/lib/traits/` - Two-layer trait system (baseScore + shiftZ)
- `src/lib/profile/` - State management and snapshots
- `src/lib/registry/` - Centralized ID definitions

### Two-Layer Trait System

Traits use logit-space math for saturation near edges:

```typescript
// Internal state
TraitState { baseScore: number, shiftZ: number }

// UI rendering (always use this)
uiScore(state) → 1-100 integer
```

**Anchor dominance**: Base scores (from astro) resist opposing evidence via `OPPOSITION_FACTOR` and asymmetric shift caps (`MAX_ALIGN_Z` vs `MAX_OPPOSE_Z`).

### Psyche Dimensions (LME)

Five dimensions with exponential moving averages:
- Each has `value`, `momentum`, `baseline`
- `updatePsycheState()` in `lme-core.ts` - sensitive math, read before modifying

### Registry System

All IDs follow namespaced patterns validated by `registry-lint`:
- `trait.{category}.{name}` - Personality sliders
- `marker.{quiz}.{dimension}` - Quiz answer mappings
- `tag.{category}.{name}` - Labels/badges
- `unlock.{type}.{name}` - Achievements
- `field.{block}.{name}` - Free-text content

Add new IDs to `src/lib/registry/` files. Run `npm run registry:lint` to validate.

### Astro System

`src/lib/astro/`:
- `compute.ts` - Sun sign, Chinese zodiac, ascendant/moon (if time/place known)
- `astronomy.ts` - Julian dates, planetary positions, ephemeris calculations
- `interpretations.ts` - Transit text generation

### Cosmic Engine (Hybrid Architecture)

`src/server/cosmicEngine/` - Server-only hybrid astrology engine:

```
Cloud API (COSMIC_CLOUD_URL) → Local Python Bridge → Mock Engine (fallback)
```

**Key files:**
- `engine.ts` - Singleton loader with automatic fallback
- `schemas.ts` - Zod-validated types (AstroProfileV1, BaZiChart, etc.)
- `bazi.ts` - Ba Zi (Four Pillars) calculation
- `fusion.ts` - East-West element fusion
- `fusionSign.ts` - Identity symbol SVG generation (cached, max 100 entries)

**Environment variables:**
- `COSMIC_CLOUD_URL` - Cloud engine URL (enables hybrid mode)
- `COSMIC_PYTHON_PATH` - Python executable (default: python3)
- `COSMIC_FORCE_MOCK` - Force mock engine for testing

### Quiz Clusters

Quizzes are grouped into thematic clusters (e.g., "Naturkind", "Mentalist"):
- `src/lib/clusters/registry.ts` - Cluster definitions
- `src/lib/clusters/aggregator.ts` - Cluster completion logic
- Completed clusters show badge on AstroSheet

## Quiz Development

### Adding a Quiz

1. Create component: `src/components/quizzes/[QuizName]Quiz.tsx`
2. Create data file: `src/components/quizzes/[quiz-name]/data.ts`
3. Add route: `src/app/verticals/quiz/[quiz-name]/page.tsx`
4. Use `QuizPageShell` wrapper for consistent layout
5. Register markers in `src/lib/registry/markers.ts`
6. Integrate via `ingestContribution()` for trait updates

### Quiz Data Pattern

```typescript
// data.ts
export const questions = [
  {
    id: "q1",
    text: "...",
    options: [
      { id: "a", text: "...", markers: { "marker.quiz.dimension": 0.8 } }
    ]
  }
];
```

## Path Alias

`@/*` → `src/*`

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GOOGLE_AI_API_KEY` - For AI insights (server-side only)

Optional:
- `COSMIC_CLOUD_URL` - Cloud astrology engine
- `COSMIC_PYTHON_PATH` - Python path for local engine
- `COSMIC_FORCE_MOCK` - Force mock engine

## Server Actions

Use server actions for secure API calls (API keys stay server-side):
- `src/app/actions/generateInsight.ts` - AI-powered astro insights

Pattern:
```typescript
// In server action file
"use server";
export async function myAction(input: Input) {
  const apiKey = process.env.SECRET_KEY; // Server-only
  // ...
}

// In client component
import { myAction } from '@/app/actions/myAction';
const result = await myAction(data);
```

## i18n & TranslationProvider

Components using `useTranslations()` must be wrapped in `TranslationProvider`:
- `src/app/[locale]/layout.tsx` - Provides translations for locale routes
- `src/app/(astro)/layout.tsx` - Provides translations for astro routes
- Always use `getDictionary(locale)` to get strings

## API Routes

Available when not using static export:
- `POST /api/contribute` - Submit quiz results
- `GET /api/profile/snapshot` - Get profile snapshot
- `POST /api/astro/compute` - Compute astrology data

## Testing

Tests live in `__tests__/` directories next to source files. Vitest with jsdom environment. Coverage thresholds: 80% statements/functions/lines, 75% branches.

```bash
npm run test              # Run all tests
npx vitest run [pattern]  # Run specific tests
```

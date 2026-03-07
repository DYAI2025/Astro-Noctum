# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Multi-vertical quiz and horoscope platform built with Next.js 16, React 19, TypeScript, and Tailwind CSS 4. Serves Quiz and Horoscope verticals through domain-based routing with shared codebase.

## Common Commands

All commands run from the `platform-app/` directory:

```bash
cd platform-app
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Build for production (static export to out/)
npm run start        # Start production server
npm run lint         # Run ESLint (eslint command)
```

**Static Export**: Uses `output: 'export'` - no SSR/API routes. All pages statically generated.

## Architecture

### Multi-Domain Routing
Middleware (`src/middleware.ts`) rewrites requests based on hostname:
- Hostname contains "horoskop" or "horoscope" → `/verticals/horoscope/*`
- All other requests → `/verticals/quiz/*` (default)

URLs remain clean (no `/verticals/` prefix visible to users).

### LME System (Longitudinal Marker Engine)
Located in `src/lib/lme/` - aggregates quiz results into psychological profiles over time.

**Core Concepts**:
- **Psyche Dimensions** (`psyche-dimensions.ts`): Personality axes with value (0-1), momentum (change rate), baseline (long-term anchor)
- **Markers**: Quiz answers map to dimension scores via `marker-aggregator.ts`
- **Archetypes** (`archetypes.ts`, `archetype-mix.ts`): Computed personality types from dimension values
- **Ingestion** (`ingestion.ts`): Entry point for processing quiz results

**Data Flow**:
```
Quiz Result → ingestion.ts → marker-aggregator.ts → lme-core.ts (updatePsycheState) → storage.ts → localStorage
```

**Key Function**: `updatePsycheState(currentState, markerScores, reliabilityWeight)` uses exponential moving averages with quiz-specific reliability weights.

### Quiz Architecture
**Current Pattern** (Quick-Launch):
- Self-contained components in `src/components/quizzes/[QuizName]Quiz.tsx`
- Data files in `src/components/quizzes/[quiz-name]/data.ts`
- Routes at `src/app/verticals/quiz/[quiz-name]/page.tsx`
- Wrapped in `QuizPageShell.tsx` for consistent layout

**Available Quizzes**: love-languages, social-role, rpg-identity, personality, celebrity-soulmate, destiny (horoscope)

### Horoscope Vertical
- Landing: `src/app/verticals/horoscope/page.tsx`
- Sign details: `src/app/verticals/horoscope/[sign]/page.tsx`
- Destiny quiz integration: `src/app/verticals/horoscope/quiz/destiny/page.tsx`

## Key Patterns

### Path Aliasing
`@/*` → `src/*` (use absolute imports: `import { X } from '@/lib/lme/...'`)

### Styling
- Dark theme (slate-950 background)
- Custom UI components in `src/components/ui/` (AlchemyButton, AlchemyCard, CosmicBackground, etc.)
- Framer Motion for animations

### State
- Client-side only (localStorage persistence)
- `usePsycheProfile` hook for accessing profile state
- LME system maintains cross-quiz psychological state

## Development Guidelines

### Adding a Quiz
1. Create `src/components/quizzes/[QuizName]Quiz.tsx`
2. Create data file if needed: `src/components/quizzes/[quiz-name]/data.ts`
3. Add route: `src/app/verticals/quiz/[quiz-name]/page.tsx`
4. Use `QuizPageShell` wrapper
5. Integrate with LME via `ingestion.ts` if tracking psychological markers

### Modifying LME
- Read `lme-core.ts` before changes - exponential moving average logic is sensitive
- Dimensions defined in `psyche-dimensions.ts` with individual `baseAlpha` values
- Archetypes computed from dimension thresholds in `archetypes.ts`

## Important Notes

- Static site only - no server-side features
- Multi-domain requires DNS configuration mapping both domains to same deployment
- Detailed German implementation strategy in `Implementierungsstrategie.md`
- Character sheet view at `/character` aggregates all quiz results

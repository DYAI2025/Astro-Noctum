# Project Structure — Astro-Noctum (Bazodiac)

This document outlines the directory structure and the role of each major file/folder in the Bazodiac codebase.

## Root Directory

- `server.mjs`: The production Express server. Handles API proxies to BAFE, Supabase admin tasks, Stripe integration, and Gemini/ElevenLabs tool endpoints.
- `package.json`: Project dependencies, engines (Node >=20.19.0), and scripts (`dev`, `build`, `test`, `lint`, `start`).
- `supabase-schema.sql`: The Single Source of Truth for the Supabase Postgres database schema (tables, RLS, triggers).
- `vite.config.ts` / `vitest.config.ts`: Configuration for the Vite build tool and Vitest test runner.
- `tsconfig.json`: TypeScript compiler configuration.
- `.dockerignore` / `nixpacks.toml`: Deployment configuration for Docker/Railway.

## `src/` (Frontend)

The core of the React 19 application.

### `src/pages/`
High-level route components.
- `DashboardPage.tsx`: The primary authenticated landing page.
- `FuRingPage.tsx`: Dedicated route for the 3D/Canvas Fusion Ring visualization.
- `WuXingPage.tsx`: Detailed view of the five elements balance.
- `WissenPage.tsx` / `ArtikelPage.tsx`: SEO-optimized article index and individual article views.

### `src/components/`
Reusable UI building blocks.
- `fusion-ring-3d/`: Specialized Three.js components for the 3D Ring.
- `quizzes/`: Self-contained quiz components (LoveLanguages, Personality, etc.).
- `Dashboard.tsx`: The main layout and logic for the astro dashboard.
- `AuthGate.tsx`: Handles sign-in and sign-up flows.
- `BirthForm.tsx`: Collects birth date, time, and location (with geocoding).
- `PremiumGate.tsx`: Wrapper to lock features behind the Stripe payment.

### `src/services/`
Communication with external APIs and internal logic.
- `api.ts`: Proxies all astro-logic requests to the backend (`/api/calculate/*`).
- `supabase.ts`: Supabase client initialization.
- `gemini.ts`: Server-side text generation for horoscopes.
- `contribution-events.ts`: Persists quiz results to the database.

### `src/lib/`
Utility libraries and shared logic.
- `fusion-ring/`: The core "Signal Engine" that computes the 12-sector fusion vector.
- `astro-data/`: Static dictionaries for zodiac signs, animals, stems, and branches.
- `astronomy/`: Mathematical helpers for planetary calculations.

### `src/contexts/`
React Contexts for global state.
- `AuthContext.tsx`: User authentication state.
- `LanguageContext.tsx`: i18n support (DE/EN).
- `FusionRingContext.tsx`: Provides the current user's ring signal to any component.

### `src/types/`
TypeScript interface definitions.
- `bafe.ts`: Shapes for the BAFE API responses.
- `interpretation.ts`: Shapes for AI-generated text objects.

## `docs/`
Detailed documentation, plans, and reports.
- `BAZODIAC.md`: Product overview and high-level architecture.
- `API_REFERENCE.md`: Detailed list of backend endpoints.
- `DATABASE_SCHEMA.md`: Supabase table and policy details.
- `STRUCTURE.md`: (This file) Codebase map.
- `plans/`: Implementation roadmaps and architectural specs.

## `public/`
Static assets served by the frontend.
- `ambiente/`: Audio files for the background soundscapes.
- `coins/`: Images for the Chinese zodiac animal coins.
- `zodiac/`: Illustrations for the Western zodiac signs.

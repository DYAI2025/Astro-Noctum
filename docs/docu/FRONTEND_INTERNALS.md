# Frontend Internals — Astro-Noctum (Bazodiac)

Bazodiac is built with **React 19**, **Vite**, **TypeScript**, and **Tailwind CSS v4**. It uses a state-driven architecture for onboarding and React Router for the main application.

## 1. Core Architecture

The application flow follows a sequential state machine:
`Splash` → `AuthGate` (Sign in/up) → `BirthForm` (Data entry) → `AppRoutes` (Main App)

### Global State
Global state is managed via React Contexts located in `src/contexts/`:
- **`AuthContext`**: Manages the Supabase session, user profile, and `isPremium` status.
- **`LanguageContext`**: Handles internationalization (DE/EN) using a custom `t()` helper.
- **`FusionRingContext`**: Centralizes the logic for combining BAFE data and quiz results into the 12-sector signal.
- **`PlanetariumContext`**: Manages the visual toggle between "Morning" (Standard) and "Planetarium" (Dark/Luxury) UI themes.

## 2. The Fusion Ring Engine (`src/lib/fusion-ring/`)

The Fusion Ring is the heart of the application. It converts complex astrological and psychological data into a single 12-dimensional vector.

- **`affinity-map.ts`**: Maps LeanDeep semantic markers (from quizzes) to the 12 zodiac sectors.
- **`signal.ts`**: The master formula that weights and fuses Western, BaZi, and Wu-Xing signals.
- **`math.ts`**: Contains the Gauss Bell spreading logic that ensures the ring peaks look organic and "flow" into adjacent sectors.
- **`draw.ts`**: Shared Canvas 2D drawing utilities for rendering the ring across different components.

## 3. Specialized Visualizations

### 3D Orrery (`src/components/BirthChartOrrery.tsx`)
Uses **Three.js** and **React Three Fiber** to render a real-time 3D model of the solar system as it appeared at the user's birth.
- Planet positions are calculated using `astronomy-engine`.
- Constellations are procedurally generated based on ecliptic longitudes.

### Five Elements (`src/components/WuXingPentagon.tsx`)
Custom SVG component that visualizes the "Generating" and "Controlling" cycles of Wu-Xing elements.

## 4. Quiz System (`src/components/quizzes/`)

Quizzes are modular components that emit `ContributionEvents`. 
- Results are saved to Supabase via `contribution-events.ts`.
- The `FusionRingContext` listens for new events and recomputes the user's "soulprint" signal in real-time.

## 5. Styling & UX

- **Tailwind CSS v4**: Utilizes the latest CSS-first configuration and design tokens.
- **Motion (Framer Motion)**: Used for all page transitions, card reveals, and interactive micro-animations.
- **Adaptive UI**: The entire dashboard switches colors, borders, and effects based on the `planetariumMode` state.

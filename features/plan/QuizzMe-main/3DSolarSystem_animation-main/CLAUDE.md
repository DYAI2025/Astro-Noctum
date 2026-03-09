# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start Next.js dev server at http://localhost:3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
npm run test     # Run Vitest tests
npm run test:watch      # Vitest in watch mode
npm run test:coverage   # Run tests with coverage report
```

Run a single test file:
```bash
npx vitest run tests/cosmic-engine/integration.test.ts
```

## Architecture

### Project Structure

This is a **3D Solar System Orrery + Planetarium** built with Next.js 14, React 18, Three.js, and TypeScript. It features real Kepler orbital mechanics and an interactive planetarium view.

```
app/                    # Next.js App Router
components/
  CelestialOrrery/
    index.tsx           # Main export with UI wrapper
    CelestialOrreryCore.tsx  # Core Three.js component (modular, embeddable)
hooks/
  useCelestialOrrery.ts # React hook for state management & API
lib/
  astronomy/
    types.ts            # TypeScript interfaces
    data.ts             # Stars, planets, cities, constellation data
    calculations.ts     # Kepler solver, coordinate transforms
  3d/
    materials.ts        # GLSL shaders for sun, planets, sky dome
  cosmic-engine/        # High-precision astronomical calculations
    astronomia-adapter.ts  # Adapter for astronomia library
    types.ts            # Cosmic engine type definitions
    vsop87-provider.ts  # VSOP87 planetary theory implementation
    moon-engine.ts      # Lunar position calculations
tests/
  cosmic-engine/        # Integration and accuracy tests
  precision/            # High-precision validation tests
```

### Core Component Flow

```
useCelestialOrrery (hook)
    ↓ provides state, API, Three.js refs
CelestialOrreryCore (component)
    ↓ initializes Three.js scene
    ↓ creates sun, planets, orbits, stars
    ↓ animation loop updates positions
```

### Key Modules

**`lib/astronomy/calculations.ts`** - Astronomical math:
- `solveKepler(M, e)` - Newton-Raphson iteration for Kepler's equation (tolerance: 10⁻⁸)
- `getPlanetPosition(planet, daysSinceJ2000, scale)` - Computes 3D position from orbital elements
- `equatorialToHorizontal(ra, dec, lat, lst)` - Coordinate transforms for planetarium view
- `dateToJD(date)`, `daysSinceJ2000(date)`, `getGMST(jd)`, `getLST(jd, lon)` - Time calculations

**`lib/3d/materials.ts`** - Custom GLSL shaders:
- `createSunMaterial()` - Animated sun surface with noise-based turbulence
- `createPlanetMaterial()` - MeshStandardMaterial with emissive glow
- `createAtmosphereShader()` - Fresnel-based atmospheric glow for gas giants
- `createSaturnRingsMaterial()` - Ring bands with Cassini division
- `createSkyDomeShader()` - Realistic horizon gradient for planetarium
- `updateMaterials(delta, sunMaterial)` - Call in animation loop to update `time` uniform

**`lib/astronomy/data.ts`** - Static data:
- `STARS[]` - 150 brightest stars with J2000.0 RA/Dec coordinates
- `PLANETS{}` - J2000.0 orbital elements (a, e, i, Ω, ω, M₀, period)
- `CONSTELLATION_LINES{}` - Star connections for drawing constellations
- `CITIES[]` - Observer locations with lat/lon

**`lib/cosmic-engine/`** - High-precision astronomical calculations:
- `astronomia-adapter.ts` - Integrates the astronomia library for precise planetary positions
- `vsop87-provider.ts` - VSOP87 planetary theory for accurate positions (arcsecond precision)
- `moon-engine.ts` - Lunar position calculations using ELP2000 theory
- Uses the `astronomia` package for professional-grade astronomical algorithms

### API Pattern

The `CelestialOrreryAPI` interface (in `types.ts`) provides programmatic control:

```tsx
// Get API ref
const apiRef = useRef<CelestialOrreryAPI>(null);
<CelestialOrreryCore ref={apiRef} onApiReady={(api) => {...}} />

// Available methods
api.setViewMode('orrery' | 'planetarium' | 'transition')
api.setDate(new Date('2030-01-01'))
api.setSpeed(86400)  // 1 day per second
api.play() / api.pause() / api.togglePlayPause()
api.focusOnPlanet('mars')
api.setObserverLocation(52.52, 13.405)  // Berlin
api.showBirthChart('1990-01-01', '12:00', city)
api.getScene() / api.getCamera() / api.getRenderer()  // Direct Three.js access
```

### View Modes

- **Orrery** - Top-down solar system view with logarithmic orbit scaling
- **Planetarium** - Ground-based night sky from observer location
- **Transition** - Animated camera fly from orrery to planetarium (birth chart feature)

### Coordinate Systems

The code transforms between multiple coordinate systems:
1. **Orbital plane** → **Ecliptic** (via rotation matrices using i, Ω, ω)
2. **Ecliptic** → **Equatorial** (via obliquity ε ≈ 23.439°)
3. **Equatorial (RA/Dec)** → **Horizontal (Alt/Az)** (via Local Sidereal Time)
4. **Horizontal** → **3D position** on sky dome (for planetarium stars)

## Path Alias

`@/*` → `./*` (root directory)

## Testing

Tests use Vitest with coverage configured:
- `tests/cosmic-engine/` - Integration tests for astronomical calculations
- `tests/precision/` - High-precision validation against known astronomical data
- Coverage thresholds: 80% statements/functions/lines, 75% branches

## Integration

### Standalone (with UI)
```tsx
import CelestialOrrery from '@/components/CelestialOrrery';
<CelestialOrrery />
```

### Headless/Embeddable (no UI)
```tsx
import { CelestialOrreryCore } from '@/components/CelestialOrrery';
<CelestialOrreryCore
  initialViewMode="orrery"
  initialSpeed={86400}
  onApiReady={(api) => {...}}
  onPlanetClick={(key, planet) => {...}}
/>
```

### With Hook (custom UI)
```tsx
import useCelestialOrrery from '@/hooks/useCelestialOrrery';
const { viewMode, currentDate, api, sceneRef } = useCelestialOrrery(CITIES[0]);
```

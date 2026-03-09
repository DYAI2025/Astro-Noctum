# Cosmic Engine v2.0.0

Hybrid astrology calculation engine combining Western and Eastern (Ba Zi) systems with automatic fallback and Zod-validated schemas.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Cosmic Engine                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ Cloud API    │───▶│ Local Python │───▶│ Mock Engine  │  │
│  │ (Primary)    │    │ (Fallback 1) │    │ (Fallback 2) │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                   │                   │          │
│         ▼                   ▼                   ▼          │
│  ┌────────────────────────────────────────────────────┐    │
│  │              enhanceWithHybrid()                   │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │    │
│  │  │ Ba Zi Calc  │  │ Fusion Calc │  │ FusionSign │  │    │
│  │  │ (Local)     │  │ (Local)     │  │ (Cached)   │  │    │
│  │  └─────────────┘  └─────────────┘  └────────────┘  │    │
│  └────────────────────────────────────────────────────┘    │
│                           │                                │
│                           ▼                                │
│              ┌────────────────────────┐                    │
│              │   AstroProfileV1       │                    │
│              │   (Zod Validated)      │                    │
│              └────────────────────────┘                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

```typescript
import { getCosmicEngine } from "@/server/cosmicEngine/engine";

const engine = await getCosmicEngine();

const profile = await engine.calculateProfile({
  year: 1990,
  month: 5,
  day: 15,
  hour: 14,
  minute: 30,
  second: 0,
  latitude: 52.52,
  longitude: 13.405,
  timezone: "Europe/Berlin",
  houseSystem: "P", // Placidus
});
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `COSMIC_CLOUD_URL` | Cloud engine URL (enables hybrid mode) | - |
| `COSMIC_PYTHON_PATH` | Python executable path | `python3` |
| `COSMIC_PY_SCRIPT_PATH` | Python script path | Auto-detected |
| `COSMIC_STRICT_MODE` | Strict validation mode | `true` |
| `COSMIC_FORCE_MOCK` | Force mock engine | `false` |

## Schemas (v1.0)

All types are Zod-validated for runtime safety.

### BirthInput

```typescript
{
  year: number;       // 1800-2200
  month: number;      // 1-12
  day: number;        // 1-31
  hour: number;       // 0-23
  minute: number;     // 0-59
  second: number;     // 0-59 (default: 0)
  latitude: number;   // -90 to 90
  longitude: number;  // -180 to 180
  timezone: string;   // IANA (e.g., "Europe/Berlin")
  houseSystem: "P" | "K" | "O" | "R" | "C" | "E" | "W";
}
```

### AstroProfileV1 (Output)

```typescript
{
  version: "1.0";
  input: BirthInput;
  bazi: BaZiChart;      // Four Pillars (年月日时)
  western: WesternChart; // Planets, houses, aspects
  fusion: FusionResult;  // East-West harmony analysis
  symbol?: SymbolSpecV1; // Generated identity symbol
  audit: Audit;          // Calculation metadata
}
```

### Key Sub-Schemas

- **BaZiChart**: Year/Month/Day/Hour pillars with stems, branches, elements
- **WesternChart**: Planet positions, house cusps, aspects
- **FusionResult**: Element vectors, harmony index, resonances
- **SymbolSpecV1**: SVG, colors, AI prompt for identity symbol

## Modules

| File | Description |
|------|-------------|
| `engine.ts` | Main entry point, singleton loader |
| `schemas.ts` | Zod schemas and validation helpers |
| `bazi.ts` | Ba Zi (Four Pillars) calculation |
| `fusion.ts` | East-West fusion analysis |
| `fusionSign.ts` | Identity symbol generation (cached) |
| `astronomy-utils.ts` | Astronomical helpers |
| `cosmic-fallback.ts` | Mock engine for graceful degradation |

## Graceful Degradation

The engine automatically falls back through three tiers:

1. **Cloud API** (if `COSMIC_CLOUD_URL` is set): Precision calculations
2. **Local Python Bridge**: Swiss Ephemeris via cosmic-architecture-engine
3. **Mock Engine**: JavaScript-only using astronomy-engine

Each fallback maintains the same `AstroProfileV1` output contract.

## Caching

### Symbol Generation

`fusionSign.ts` implements deterministic memoization:

- Cache key: `${baziElement}::${westernSign}`
- Max size: 100 entries (LRU eviction)
- Since FusionSign is deterministic (same inputs = same outputs),
  caching prevents redundant SVG generation

## Testing

```bash
# Run all engine tests
npx vitest run src/server/cosmicEngine/__tests__/

# Run specific test
npx vitest run src/server/cosmicEngine/__tests__/engine.test.ts
```

## Version History

| Version | Changes |
|---------|---------|
| 2.0.0 | Hybrid architecture, Zod schemas, Symbol caching |
| 1.0.0 | Initial cloud-only implementation |

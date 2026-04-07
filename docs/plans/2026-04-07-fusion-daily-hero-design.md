# Fusion Daily Hero — Design Document

**Feature:** `TASK-fusion-daily-hero`
**Date:** 2026-04-07
**Status:** Approved (brainstorming session 2026-04-07)

---

## Goal

Replace the current static/placeholder daily horoscope (Gemini invents harmony_index and day_mode from birth data alone) with a **real-data-driven daily hero block** that integrates:

1. Today's planet transits (aspect type, resonance, field strength) — client-computed
2. Real-time space weather (Kp index, solar pressure score) — server-fetched
3. User's top soulprint sector — loaded from `astro_profiles.soulprint_sectors`

The result: a `FusionDailyHero` component at the top of the Dashboard, always expanded, always the first thing the user sees after login.

---

## Architecture Overview

```
Client (Dashboard)
  ↓ computes computeTodayPlanetInfluences(birthSign) → transit_influences[4]
  ↓ POST /api/experience/daily { userId, transit_influences, birth_sign }

server.mjs (/api/experience/daily)
  ├── loads soulprint_sectors from astro_profiles (Supabase)
  ├── loads spaceWeather from /api/space-weather/extended (5-min cache)
  ├── computeResonanceBadges(transit_influences, spaceWeather, topSector) → Badge[]
  ├── builds enriched Gemini prompt (real transits + cosmic weather + top sector)
  └── returns { dailyText, resonance_badges[], spaceWeatherScore, topSector }

Client
  ├── FusionDailyHero (always expanded, top of Dashboard)
  │   ├── Gemini daily text (DE)
  │   └── ResonanzSnapshot (3 badge-pills)
  │       ├── Transit badge (Premium)
  │       ├── Space Weather badge (Premium)
  │       └── Sektor badge (Premium)
  └── Free users: see daily text, badges blurred/locked
```

---

## Data Flow (Request)

### Client sends:

```typescript
interface DailyRequestBody {
  userId: string;
  birth_sign: string;          // e.g. "Aries"
  transit_influences: {
    planet: string;            // "Mars" | "Venus" | "Jupiter" | "Saturn"
    aspectDeg: number;         // 60 | 90 | 120 | 180
    fieldStrength: number;     // 0.0–1.0
    isResonant: boolean;
  }[];
}
```

`transit_influences` is computed client-side via `computeTodayPlanetInfluences(birthSign)` — the same function already used by `TransitResonancePanels`.

### Server loads internally:

- `soulprint_sectors: number[]` from `astro_profiles` (12-element array)
- `spaceWeather` from `/api/space-weather/extended` (already cached, no extra cost)

---

## Server: `computeResonanceBadges()`

Deterministic — **not Gemini**. Badges are computed from inputs, not hallucinated.

```typescript
interface ResonanceBadge {
  type: 'transit' | 'space_weather' | 'sektor';
  label: string;          // e.g. "Mars Trigon · Verstärkend"
  sublabel?: string;      // e.g. "Fluss · Stärke 88%"
  intensity: 'hoch' | 'mittel' | 'niedrig';
  color: string;          // hex accent color
}
```

**Badge rules:**

| Badge | Condition | Label example |
|---|---|---|
| `transit` | Strongest `fieldStrength` planet | `"Mars Trigon · Verstärkend"`, sublabel `"Fluss · 88%"` |
| `space_weather` | Kp-derived G-scale | `"Kp 4.2 · Erhöht"` or `"Ruhig"` |
| `sektor` | Top soulprint sector (max of 12) | `"♈ Aries · Dein Leitsystem"` |

---

## Gemini Prompt (enriched)

```
Du bist ein Astrologe. Schreibe ein tägliches Horoskop auf Deutsch (3–4 Sätze) für einen Nutzer mit folgenden realen Tagesdaten:

PLANETENTRANSITS HEUTE:
- Mars: Trigon (120°), Feldstärke 0.88, resonant (verstärkend)
- Venus: Quadrat (90°), Feldstärke 0.72, schärfend
- Jupiter: Sextil (60°), Feldstärke 0.62, resonant
- Saturn: Opposition (180°), Feldstärke 0.78, schärfend

KOSMISCHES WETTER:
- Kp-Index: 3.2 (ruhig)
- Solarer Druck: 0.31 (niedrig)

STÄRKSTES SOULPRINT-SEKTOR: Aries (Wert: 0.82)

Schreibe direkt, persönlich, ohne Einleitung. Keine Emojis. Max. 80 Wörter.
```

---

## Components

### `FusionDailyHero` (new)

Location: `src/components/dashboard/FusionDailyHero.tsx`

Props:
```typescript
interface FusionDailyHeroProps {
  userId: string;
  birthSign: string;
  isPremium: boolean;
}
```

- Always expanded (no toggle, no collapse)
- Positioned as the first card in Dashboard (above all other sections)
- Fetches via `useFirstRunDaily` (hook already exists — extend it)
- Shows skeleton while loading
- `ResonanzSnapshot` sub-component for badges

### `ResonanzSnapshot` (new)

Location: `src/components/dashboard/ResonanzSnapshot.tsx`

Props:
```typescript
interface ResonanzSnapshotProps {
  badges: ResonanceBadge[];
  isPremium: boolean;
}
```

- 3 badge-pills in a horizontal row
- Free users: badges rendered but blurred + lock icon overlay
- Premium users: full color, no blur

---

## API Response Schema (extend existing `DailyResponseSchema`)

```typescript
// src/lib/schemas/experience.ts — extend DailyResponseSchema
resonance_badges: z.array(z.object({
  type: z.enum(['transit', 'space_weather', 'sektor']),
  label: z.string(),
  sublabel: z.string().optional(),
  intensity: z.enum(['hoch', 'mittel', 'niedrig']),
  color: z.string(),
})).optional(),
space_weather_score: z.number().optional(),
top_sector: z.object({
  sign: z.string(),
  value: z.number(),
}).optional(),
```

---

## Error Handling (graceful degradation)

| Failure | Behavior |
|---|---|
| Space weather API down | `spaceWeather: null` → space_weather badge omitted |
| `transit_influences` missing/empty | Transit badge omitted; Gemini prompt has no transit section |
| `soulprint_sectors` missing in DB | Sektor badge omitted; Gemini prompt has no sector section |
| Gemini timeout / error | `dailyText: null` → Hero shows skeleton placeholder; badges still rendered |
| `resonance_badges` empty array | Hero shows Gemini text only, no badge row |

Badges and Gemini text are fully decoupled — either can fail independently.

---

## Testing Strategy

| Test | File | Coverage |
|---|---|---|
| Unit: `computeResonanceBadges()` | `src/__tests__/resonance-badges.test.ts` | All input combinations → correct badge types + labels |
| Unit: `FusionDailyHero` render | `src/__tests__/fusion-daily-hero.test.tsx` | Skeleton, badges rendered, premium gate (blurred), empty badges |
| Unit: `ResonanzSnapshot` | `src/__tests__/fusion-daily-hero.test.tsx` | Badge-pill renders, lock icon for free |
| Schema: `DailyResponseSchema` | existing Zod test or new | New fields parse correctly, optional fields tolerate absence |

---

## Premium Gating

| User | Daily text | Badges |
|---|---|---|
| Free | Full text (Gemini) | Rendered but blurred + lock icon |
| Premium | Full text | Full color, interactive |

---

## Feature Flag

`daily_fusion_hero_v1` — default **off** until component is complete. When on, replaces existing `DayModeModal` trigger area at top of Dashboard.

Existing `daily_modal_v1` flag (Day-Pulse/Trace modal) remains separate.

---

## Files to Create/Modify

| Action | File |
|---|---|
| Create | `src/components/dashboard/FusionDailyHero.tsx` |
| Create | `src/components/dashboard/ResonanzSnapshot.tsx` |
| Create | `src/lib/daily/resonance-badges.ts` — `computeResonanceBadges()` |
| Modify | `src/lib/schemas/experience.ts` — extend `DailyResponseSchema` |
| Modify | `src/hooks/useFirstRunDaily.ts` — send `transit_influences` in request, parse new fields |
| Modify | `server.mjs` — enrich `/api/experience/daily` handler |
| Modify | `src/components/Dashboard.tsx` — add `FusionDailyHero` at top, gated by feature flag |
| Modify | `src/lib/feature-flags.ts` — add `daily_fusion_hero_v1` flag (default off) |
| Create | `src/__tests__/resonance-badges.test.ts` |
| Create | `src/__tests__/fusion-daily-hero.test.tsx` |

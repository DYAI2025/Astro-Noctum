# Character Sheet Component API Reference

**Version:** Phase 3 Complete
**Date:** 2025-12-14

This document provides the complete API reference for all Character Sheet components, ready for Phase 4 motion integration.

## Component Hierarchy

```
CharacterSheetPage (Main Container)
├── OrnamentLayer (Background)
├── Header
└── Grid Layout
    ├── Left Column (lg:col-span-7)
    │   ├── CoreStatsCard
    │   │   └── StatBarRow (×5)
    │   └── ClimateCard
    │       └── AxisRail (×5)
    └── Right Column (lg:col-span-5)
        ├── ArchetypeStoryCard
        ├── DerivedStatsCard
        │   └── StatPill (×4)
        └── MetaBadgesRow
```

## Core Components

### CharacterSheetPage

Main wrapper component that orchestrates the entire character sheet view.

```tsx
import { CharacterSheetPage } from '@/components/character/CharacterSheetPage';

// Usage in route
export default function CharacterPage() {
  return <CharacterSheetPage />;
}
```

**Features:**
- Fetches profile via `usePsycheProfile()` hook
- Calculates derived stats client-side
- Manages loading/error states
- Responsive grid layout
- Integrates ornament layer

**Dependencies:**
- `usePsycheProfile` hook
- `calcDerivedStats` utility
- All child card components

---

### CoreStatsCard

Displays the 5 core personality stats with animated bars.

```tsx
import { CoreStatsCard } from '@/components/character/CoreStatsCard';

interface CoreStatsCardProps {
  stats: PsycheCoreStats;       // Required: { clarity, courage, connection, order, shadow }
  deltas?: Partial<PsycheCoreStats>; // Optional: recent changes for animation
  className?: string;
}

// Example
<CoreStatsCard
  stats={profile.stats}
  deltas={profile.last_delta?.stats_delta}
/>
```

**Stats Displayed:**
1. Clarity (Klarheit)
2. Courage (Mut)
3. Connection (Verbindung)
4. Order (Struktur)
5. Shadow (Schatten)

**Features:**
- Animated progress bars (0..1 → 0..100%)
- Delta chips showing +/- changes
- Staggered animation delays (0.1s increments)
- Tabular numbers for alignment
- Corner ornaments via AlchemyCard

---

### StatBarRow

Individual stat bar with label, progress fill, and delta indicator.

```tsx
import { StatBarRow } from '@/components/character/StatBarRow';

interface StatBarRowProps {
  label: string;           // Stat name (e.g., "Klarheit")
  value: number;          // 0..1 range
  delta?: number;         // Optional: +/- change (e.g., 0.05)
  colorClass?: string;    // Optional: custom bar color
  showValue?: boolean;    // Optional: show numeric value (default: true)
  delay?: number;         // Optional: animation delay in seconds
}

// Example
<StatBarRow
  label="Klarheit"
  value={0.72}
  delta={0.05}
  delay={0.1}
/>
```

**Animation:**
- Bar width animates over 1 second
- Delta chip fades in after delay + 0.5s
- Easing: "easeOut"

**Visual:**
- Progress bar with gold gradient
- Delta chip: green (positive) / red (negative)
- Hover effect on label

---

### ClimateCard

Displays the 5 bipolar climate axes with slider-style rails.

```tsx
import { ClimateCard } from '@/components/character/ClimateCard';

interface ClimateCardProps {
  state: PsycheState;           // Required: 5 axes (0..1 each)
  deltas?: Partial<PsycheState>; // Optional: recent changes
  className?: string;
}

// Example
<ClimateCard
  state={profile.state}
  deltas={profile.last_delta?.state_delta}
/>
```

**Axes:**
1. Shadow ↔ Light (Schatten/Licht)
2. Cold ↔ Warm (Kühl/Warm)
3. Surface ↔ Depth (Oberfläche/Tiefe)
4. Me ↔ We (Ich/Wir)
5. Mind ↔ Heart (Verstand/Gefühl)

**Features:**
- Animated marker positioning
- Fill from center (50%) based on value
- Bold labels for active side
- Staggered delays

---

### AxisRail

Individual axis with left/right labels and animated thumb marker.

```tsx
import { AxisRail } from '@/components/character/AxisRail';

interface AxisRailProps {
  leftLabel: string;   // Left pole label
  rightLabel: string;  // Right pole label
  value: number;       // 0..1 (0.5 = center)
  delta?: number;      // Optional: change for animation
  delay?: number;      // Optional: animation delay
}

// Example
<AxisRail
  leftLabel="Schatten"
  rightLabel="Licht"
  value={0.8}
  delay={0.2}
/>
```

**Animation:**
- Thumb marker slides with spring physics
- Fill animates from center (0.8s duration)
- Center line always visible

**Visual:**
- Gold thumb marker with shadow
- Subtle fill from center
- Center marker line (50%)

---

### MetaBadgesRow

Displays meta-statistics as colored badge chips.

```tsx
import { MetaBadgesRow } from '@/components/character/MetaBadgesRow';

interface MetaBadgesRowProps {
  meta?: MetaStats;  // Optional: meta-stats object
  className?: string;
}

// Example
<MetaBadgesRow meta={profile.meta_stats} />
```

**Badges Displayed:**
1. **Intensity:** quiet / noticeable / intense
2. **Tempo:** calm / dynamic / volatile
3. **Shadow Confirmed:** only if `shadow_confidence >= 0.65`
4. **Shadow Uncertain:** shown if confidence < 0.65 (optional)

**Color Coding:**
- Intensity: Emerald (quiet) → Amber (intense)
- Tempo: Blue (calm) → Red (volatile)
- Shadow: Slate colors

**Behavior:**
- Returns `null` if no meta-stats
- Conditional rendering based on thresholds

---

### DerivedStatsCard

Displays 4 calculated secondary stats in a 2x2 grid.

```tsx
import { DerivedStatsCard } from '@/components/character/DerivedStatsCard';

interface DerivedStatsCardProps {
  stats: DerivedStats;  // Required: { vitality, willpower, chaos, harmony }
  className?: string;
}

// Example
<DerivedStatsCard stats={derivedStats} />
```

**Stats Displayed:**
1. **Vitality:** avg(clarity, connection)
2. **Willpower:** avg(courage, order)
3. **Chaos:** = shadow
4. **Harmony:** 1 - abs(shadow - connection)

**Features:**
- 2x2 grid layout
- Animated StatPill components
- Elevated card variant
- Staggered delays

---

### StatPill

Individual derived stat pill (used in DerivedStatsCard).

```tsx
import { StatPill } from '@/components/character/StatPill';

interface StatPillProps {
  label: string;    // Stat name
  value: number;    // 0..100 integer
  delay?: number;   // Animation delay
  className?: string;
}

// Example
<StatPill
  label="Vitalität"
  value={80}
  delay={0.1}
/>
```

**Animation:**
- Fades in with upward slide (0.4s duration)
- Delay controls stagger timing

**Visual:**
- Parchment background
- Gold border
- Serif font for value
- Uppercase label

---

### ArchetypeStoryCard

Displays dominant archetype and narrative snippet.

```tsx
import { ArchetypeStoryCard } from '@/components/character/ArchetypeStoryCard';

interface ArchetypeStoryCardProps {
  archetype?: string;      // Optional: dominant archetype name
  secondary?: string[];    // Optional: secondary archetypes
  snippet?: string;        // Optional: narrative text
  className?: string;
}

// Example
<ArchetypeStoryCard
  archetype="Der Leuchtturm"
  secondary={["Der Wanderer"]}
  snippet="Du navigierst mit offenem Herzen..."
/>
```

**Features:**
- Graceful degradation (hides if no data)
- Parchment variant card
- Corner ornaments
- Quote-style snippet formatting
- Gold divider

**Layout:**
- Centered text
- Archetype badge at top
- Divider line
- Italic snippet below

---

### OrnamentLayer

Background ornamentation layer with constellation watermark.

```tsx
import { OrnamentLayer } from '@/components/ornaments/OrnamentLayer';

// Usage (in CharacterSheetPage)
<main className="relative">
  <OrnamentLayer />
  {/* Content */}
</main>
```

**Features:**
- Fixed positioning (inset-0)
- Pointer-events: none (non-interactive)
- Constellation/star pattern watermark
- Corner flourishes (large screens only)
- 6-8% opacity for subtlety

**Visual Elements:**
1. Star points with glow gradients
2. Constellation connecting lines
3. Alchemy circles
4. Corner flourishes (4 corners)

**Responsive:**
- Full watermark on all screens
- Corner flourishes hidden on mobile

---

## Shared Components

### AlchemyCard

Base card component with parchment background and gold border.

```tsx
import {
  AlchemyCard,
  AlchemyCardHeader,
  AlchemyCardTitle,
  AlchemyCardContent
} from '@/components/ui/AlchemyCard';

interface AlchemyCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'parchment' | 'elevated';
  size?: 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  cornerOrnaments?: boolean; // Add corner decorations
  className?: string;
  as?: 'div' | 'article' | 'section';
}
```

**Usage:**
```tsx
<AlchemyCard variant="elevated" cornerOrnaments>
  <AlchemyCardHeader>
    <AlchemyCardTitle>Title</AlchemyCardTitle>
  </AlchemyCardHeader>
  <AlchemyCardContent>
    {/* Content */}
  </AlchemyCardContent>
</AlchemyCard>
```

---

## Data Types

### PsycheCoreStats
```typescript
interface PsycheCoreStats {
  clarity: number;     // 0..1
  courage: number;     // 0..1
  connection: number;  // 0..1
  order: number;       // 0..1
  shadow: number;      // 0..1
}
```

### PsycheState
```typescript
interface PsycheState {
  shadow_light: number;   // 0..1
  cold_warm: number;      // 0..1
  surface_depth: number;  // 0..1
  me_we: number;          // 0..1
  mind_heart: number;     // 0..1
}
```

### MetaStats
```typescript
interface MetaStats {
  intensity: 'quiet' | 'noticeable' | 'intense';
  tempo: 'calm' | 'dynamic' | 'volatile';
  shadow_confidence: number;  // 0..1
  shadow_confirmed: boolean;  // true if confidence >= 0.65
}
```

### DerivedStats
```typescript
interface DerivedStats {
  vitality: number;   // 0..100
  willpower: number;  // 0..100
  chaos: number;      // 0..100
  harmony: number;    // 0..100
}
```

### PsycheProfileV1 (Complete)
```typescript
interface PsycheProfileV1 {
  id: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;

  // Core Data (required)
  stats: PsycheCoreStats;
  state: PsycheState;

  // Optional
  meta_stats?: MetaStats;
  visual_axes?: VisualAxesV1;
  archetype_params?: ArchetypeParams;
  narrative_snippet?: string;
  last_delta?: PsycheDelta;
}
```

---

## Utilities

### calcDerivedStats

Calculates secondary stats from core stats.

```typescript
import { calcDerivedStats } from '@/domain/derivedStats';

function calcDerivedStats(stats: PsycheCoreStats): DerivedStats {
  // vitality = avg(clarity, connection)
  // willpower = avg(courage, order)
  // chaos = shadow
  // harmony = 1 - abs(shadow - connection)
}
```

### toPercent01

Converts 0..1 value to 0..100 integer.

```typescript
import { toPercent01 } from '@/domain/derivedStats';

function toPercent01(value: number): number {
  return Math.round(Math.max(0, Math.min(1, value)) * 100);
}
```

### usePsycheProfile

Hook to fetch psyche profile (currently returns mock data).

```typescript
import { usePsycheProfile } from '@/hooks/usePsycheProfile';

function MyComponent() {
  const { profile, isLoading, error } = usePsycheProfile();

  if (isLoading) return <Loading />;
  if (error) return <Error />;

  return <CharacterSheet profile={profile} />;
}
```

---

## Content Files

### character-sheet.de.ts

German copy for character sheet labels.

```typescript
export const characterSheetCopy = {
  header: {
    title: "Dein Charakter",
    subtitle: "Dein Avatar ist ein Klima, kein Label."
  },
  sections: {
    coreStats: "Wesentliche Natur",
    climate: "Dein Klima",
    derived: "Potentiale",
    archetype: "Primärer Archetyp"
  },
  stats: { clarity, courage, connection, order, shadow },
  axes: { shadow, light, cold, warm, ... },
  derived: { vitality, willpower, chaos, harmony }
};
```

### climateCopy.de.ts

Axis descriptions and tooltips.

```typescript
export const climateCopy: Record<string, ClimateAxisCopy> = {
  shadow_light: {
    leftLabel: 'Schatten',
    rightLabel: 'Licht',
    description: '...',
    tooltip: '...'
  },
  // ... all 5 axes
};
```

---

## Phase 4 Integration Points

### Motion System
- All components use Framer Motion
- `delay` props ready for delta-driven timing
- Spring physics on AxisRail thumbs
- Staggered animations throughout

### Delta-Driven Updates
- `deltas` props accepted on CoreStatsCard, ClimateCard
- AfterQuizDeltaBanner calculates top movers
- Delta chips show +/- changes
- Animation duration formula ready (Phase 4)

### Accessibility
- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus states on all controls
- prefers-reduced-motion support (Phase 4)

### Theming
- CSS variables for all colors
- Token-based spacing/sizing
- Gold/Emerald/Parchment palette
- Light theme optimized for readability

---

## File Locations

```
src/
├── app/
│   └── character/
│       └── page.tsx                    # Route wrapper
├── components/
│   ├── character/
│   │   ├── CharacterSheetPage.tsx      # Main container
│   │   ├── CoreStatsCard.tsx           # Core stats
│   │   ├── StatBarRow.tsx              # Individual stat bar
│   │   ├── ClimateCard.tsx             # Climate axes
│   │   ├── AxisRail.tsx                # Individual axis
│   │   ├── MetaBadgesRow.tsx           # Meta badges
│   │   ├── DerivedStatsCard.tsx        # Derived stats
│   │   ├── StatPill.tsx                # Stat pill
│   │   ├── ArchetypeStoryCard.tsx      # Archetype display
│   │   └── AfterQuizDeltaBanner.tsx    # Delta banner
│   ├── ornaments/
│   │   └── OrnamentLayer.tsx           # Background ornaments
│   └── ui/
│       └── AlchemyCard.tsx             # Base card component
├── content/
│   ├── character-sheet.de.ts           # German labels
│   └── climateCopy.de.ts               # Axis descriptions
├── domain/
│   ├── derivedStats.ts                 # Calculations
│   └── delta.ts                        # Delta logic
├── hooks/
│   └── usePsycheProfile.ts             # Profile fetch
└── types/
    └── psyche.ts                       # Type definitions
```

---

**Ready for Phase 4:** Motion & Animation Enhancement
**Build Status:** ✅ Successful
**Last Updated:** 2025-12-14

# Coherence-First Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure the Bazodiac dashboard so the Coherence Index is the first thing the user sees, with planetary influences and daily pulse as supporting layers below.

**Architecture:** The dashboard is a single `Dashboard.tsx` component that orchestrates ~15 child sections. All data hooks (`useDayHarmonic`, `useSpaceWeather`, `useFusionSignal`, `useDailyHoroscope`) already exist and provide the coherence, cosmic weather, transit, and daily data. The refactor reorders existing sections, creates one new hero component (`KohaerenzHero`), and introduces a driver-strip sub-component. No backend changes needed.

**Tech Stack:** React 18, TypeScript, Tailwind CSS v4, Framer Motion (`motion/react`), CSS custom properties (`--tile-*`, `--color-*`), Vite

**Wireframe:** `docs/wireframes/dashboard-mockup-revision-coherence-first.md`

---

## Codebase orientation

### Key files

| File | Purpose |
|------|---------|
| `src/components/Dashboard.tsx` | Main orchestrator — renders all sections in order |
| `src/pages/DashboardPage.tsx` | Thin wrapper, passes `useAppLayout()` props |
| `src/lib/fusion-ring/day-harmonic.ts` | `DayHarmonicState` interface + `computeDayHarmonic()` |
| `src/hooks/useSpaceWeather.ts` | `SpaceWeatherState` — Kp, solar pressure, events |
| `src/hooks/useFusionSignal.ts` | Transit events + signal data |
| `src/hooks/useDailyHoroscope.ts` | Daily horoscope text |
| `src/components/dashboard/MiniSignature.tsx` | Current small signature ring widget |
| `src/components/dashboard/DashboardBigFour.tsx` | 5 identity cards (Sun, Moon, Asc, BaZi, WuXing) |
| `src/components/dashboard/AktiveEinfluesseFusion.tsx` | 6 planet transit cards |
| `src/components/dashboard/DayPulseExpanded.tsx` | Always-visible day pulse text |
| `src/components/dashboard/DashboardTagesEnergie.tsx` | Daily energy hero section |
| `src/components/dashboard/CosmicInfluenceSection.tsx` | Cosmic weather gauges |
| `src/components/dashboard/NatalSignaturStatic.tsx` | Collapsed natal accordion |
| `src/components/dashboard/AgentSection.tsx` | Levi/Eve agent cards |
| `src/components/dashboard/VibesSection.tsx` | Vibe insight tile |
| `src/components/dashboard/MagnetsturmKarte.tsx` | Geomagnetic storm card (self-hides) |
| `src/components/dashboard/ResonanzSnapshot.tsx` | Resonance badges |
| `src/index.css` | All CSS tokens, `.cosmic-tile`, `.planetarium` vars |

### Data flow summary

```
Dashboard.tsx
├── activeDayHarmonic    ← useFirstRunDaily → computeDayHarmonic(harmony_index)
│   └── harmonyIndex: 0–1, mode: pulse|trace, intensity: 0–1
├── spaceWeather         ← useSpaceWeather()
│   └── kpIndex, solarPressure, gScale, xrayClass, events[], ...
├── transitEvents        ← useFusionSignal(userId).events
│   └── TransitEvent[] — planet, aspect, description_de, personal_context
├── dailyData            ← useFirstRunDaily()
│   └── fusion.synthesis, fusion.action, fusion.day_mode, ...
└── effectiveSoulprint   ← DB soulprint_sectors || syntheticSoulprintFromSign()
```

### Current section order in Dashboard.tsx

```
1.  Page Header (Bazodiac branding, birthDate)
2.  BirthChartOrrery (Planetarium — 3D star chart, fullwidth)
3.  SkyModeToggle (birth sky vs current sky)
4.  BigFour + MiniSignature (grid: identity cards | signature ring)
5.  DayPulseExpanded (volatile pos 1 — transit event text)
6.  AktiveEinfluesseFusion (volatile pos 2 — 6 planet cards)
7.  MagnetsturmKarte (volatile pos 3 — self-hides when Kp < 4)
8.  DashboardTagesEnergie (daily pulse narrative)
9.  VibesSection
10. CosmicInfluenceSection (Kp gauge, solar pressure, event pills)
11. NatalSignaturStatic (collapsed accordion → AstroSection inside)
12. AgentSection (Levi/Eve voice agents)
13. Upgrade Banner (freemium)
14. DashboardInterpretationSection (KI-Synthese)
15. ShareCard + LegalFooter
16. DayModeModal (overlay)
17. TourOverlay (overlay)
```

### Target section order (from wireframe)

```
1.  Page Header (Bazodiac branding, date — kept)
2.  ★ KohaerenzHero (NEW — coherence score + driver strip)
3.  AktiveEinfluesseFusion (planet cards, moved up from pos 6)
4.  DayPulseExpanded (transit text, moved from pos 5)
5.  DashboardTagesEnergie (daily narrative, moved from pos 8)
6.  VibesSection (kept)
7.  AgentSection (Levi/Eve — moved up from pos 12)
8.  NatalSignaturStatic (Blueprint — kept)
9.  BigFour (identity cards — moved down from pos 4)
10. BirthChartOrrery (Planetarium — moved down from pos 2, optional toggle)
11. SkyModeToggle
12. CosmicInfluenceSection (detail view — moved down)
13. MagnetsturmKarte (self-hides, moved down)
14. Upgrade Banner (kept)
15. DashboardInterpretationSection (kept)
16. ShareCard + LegalFooter (kept)
17. DayModeModal + TourOverlay (overlays — kept)
```

---

## Phase 1 — Layout Reorder (non-breaking)

**Risk:** Low. No new components, no visual changes. Only section order in `Dashboard.tsx` changes.

**Estimated time:** 30–60 minutes

### Task 1.1: Create feature branch

**Step 1: Branch from main**

```bash
cd /path/to/Bazodiac-WebApp/Astro-Noctum
git checkout main && git pull
git checkout -b feat/coherence-first-dashboard
```

**Step 2: Commit wireframe + plan docs**

```bash
git add docs/
git commit -m "docs: add coherence-first dashboard wireframe + implementation plan"
```

### Task 1.2: Reorder sections in Dashboard.tsx

**Files:**
- Modify: `src/components/Dashboard.tsx` (lines 325–627, the return JSX)

**Step 1: Move KohaerenzHero placeholder to position 2**

After the Page Header, insert a temporary placeholder where the KohaerenzHero will live:

```tsx
{/* ═══ SECTION: COHERENCE HERO (placeholder — Phase 2) ════════════ */}
<motion.div {...fadeIn(0.02)}>
  <SectionErrorBoundary name="CoherenceHero">
    <div className="cosmic-tile p-6 rounded-[2rem] text-center space-y-2">
      <p className="text-[9px] uppercase tracking-[0.3em] opacity-50" style={{ color: 'var(--tile-accent)' }}>
        Kohärenzindex
      </p>
      <p className="font-serif text-4xl" style={{ color: 'var(--tile-text-primary)' }}>
        {activeDayHarmonic ? Math.round(activeDayHarmonic.harmonyIndex * 100) : '—'}
      </p>
      <p className="text-xs opacity-60" style={{ color: 'var(--tile-text-secondary)' }}>
        {activeDayHarmonic?.mode === 'trace' ? 'Reflexiver Tag' : 'Aktiver Tag'}
      </p>
    </div>
  </SectionErrorBoundary>
</motion.div>
```

**Step 2: Reorder the remaining sections**

Move the JSX blocks in this order (cut+paste, no content changes):

1. Page Header (keep)
2. **Coherence placeholder** (new, from step 1)
3. `AktiveEinfluesseFusion` block (move from volatile-first cluster)
4. `DayPulseExpanded` block (move from volatile-first cluster)
5. `DashboardTagesEnergie` / `CosmicWeatherCard` block
6. `VibesSection` block
7. `AgentSection` block (move up from below)
8. `NatalSignaturStatic` (keep position relative to Blueprint)
9. `BigFour + MiniSignature` grid (move down)
10. `BirthChartOrrery` + `SkyModeToggle` (move down)
11. `CosmicInfluenceSection` (move down)
12. `MagnetsturmKarte` (move down)
13. Upgrade Banner (keep)
14. Interpretation (keep)
15. ShareCard + Footer (keep)

**Step 3: Remove the wrapping `<motion.div className="flex flex-col gap-4">` from the old volatile-first cluster**

The three components (DayPulse, AktiveEinfluesse, Magnetsturm) were wrapped in a single motion.div. Now they're separated, so each gets its own wrapper.

**Step 4: Adjust fadeIn delays**

Renumber all `fadeIn()` delays sequentially: 0.02, 0.05, 0.08, 0.10, 0.12, ...

**Step 5: Update tour sentinel refs**

Move `planetariumSentinelRef` to the new BirthChartOrrery position. Move `astroSentinelRef` to before the planet section. Adjust `leviSentinelRef` to before the Agent section.

**Step 6: Verify**

```bash
npx tsc --noEmit
npm run dev
# Visual check: sections appear in new order, no broken refs
```

**Step 7: Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "refactor: reorder dashboard sections — coherence-first layout"
```

---

## Phase 2 — KohaerenzHero Component

**Risk:** Medium. New component, but uses only existing data hooks.

**Estimated time:** 2–4 hours

### Task 2.1: Define the component interface

**Files:**
- Create: `src/components/dashboard/KohaerenzHero.tsx`

**Props — all data already computed in Dashboard.tsx:**

```tsx
interface KohaerenzHeroProps {
  /** 0–1 harmonyIndex, mode, intensity from activeDayHarmonic */
  dayHarmonic: DayHarmonicState | null;
  /** Cosmic weather state — Kp, solar pressure, gScale */
  spaceWeather: SpaceWeatherState;
  /** Transit events for driver context */
  transitEvents: TransitEvent[];
  /** Day mode from daily data */
  dayMode: 'pulse' | 'trace';
  /** Loading state */
  loading: boolean;
}
```

### Task 2.2: Build the coherence score ring

The main visual: a circular score display showing the harmonyIndex as a percentage.

**Layout:**

```
┌─────────────────────────────────────────────┐
│  ╭─────╮                                    │
│  │ 67  │  Kohärenzindex                     │
│  │  %  │  Moderate: Balanced Harmonization  │
│  ╰─────╯                                    │
│                                              │
│  [Driver Strip: Kp ● Solar ● Transit ● Mode]│
└─────────────────────────────────────────────┘
```

**Score ring implementation:**

```tsx
function CoherenceRing({ value, size = 120 }: { value: number; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" strokeWidth={6}
          stroke="var(--tile-border)"
        />
        {/* Fill */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" strokeWidth={6}
          stroke="var(--tile-accent)"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-serif text-3xl" style={{ color: 'var(--tile-text-primary)' }}>
          {Math.round(value * 100)}
        </span>
      </div>
    </div>
  );
}
```

### Task 2.3: Build the coherence label logic

> **Architecture decision (2026-04-12):** The semantic interpretation of the
> coherence value (math→language translation) belongs in the LLM-backed
> FuFirE API, not in the frontend client. The client shows:
>
> 1. The raw numeric value (0–100)
> 2. A **neutral, mathematically honest** framing (no semantic loading)
> 3. A `coherenceLabel` field from the API response when available
>
> Empty adjective decoration ("Starke Transformation", "Dynamische Reibung")
> without substantiation violates the Nachvollziehbarkeit principle.
> If something carries meaning, the meaning must be traceable to the math.

**Client-side fallback labels (neutral, no semantic loading):**

```tsx
function getCoherenceFallbackLabel(h: number, lang: 'de' | 'en'): { title: string; subtitle: string } {
  // Neutral framing — describes the mathematical state, not its meaning.
  // Semantic interpretation is generated by the LLM layer in FuFirE.
  if (h >= 0.70) return lang === 'de'
    ? { title: 'Hohe Übereinstimmung', subtitle: 'Himmel und Signatur liegen nah beieinander' }
    : { title: 'High alignment', subtitle: 'Sky and signature are closely aligned' };
  if (h >= 0.40) return lang === 'de'
    ? { title: 'Mittlere Übereinstimmung', subtitle: 'Teils im Einklang, teils in Spannung' }
    : { title: 'Moderate alignment', subtitle: 'Partly in harmony, partly in tension' };
  return lang === 'de'
    ? { title: 'Niedrige Übereinstimmung', subtitle: 'Himmel und Signatur stehen in Distanz' }
    : { title: 'Low alignment', subtitle: 'Sky and signature are at distance' };
}
```

**Future:** When FuFirE returns `coherence_label` (LLM-generated), display that
instead of the fallback. The API contract for this is TBD.

### Task 2.4: Build the driver strip

Four compact pills showing what feeds the coherence value:

```tsx
interface DriverPill {
  label: string;
  value: string;
  state: 'calm' | 'active' | 'tense';
}
```

Driver data mapping:

| Driver | Source | calm | active | tense |
|--------|--------|------|--------|-------|
| Geomagnetik | `spaceWeather.kpIndex` | Kp 0–2 | Kp 3–4 | Kp 5+ |
| Solardruck | `spaceWeather.solarPressure` | < 0.3 | 0.3–0.6 | > 0.6 |
| Transit-Resonanz | `transitEvents.length` | 0–1 events | 2–3 | 4+ |
| Tagesfeld | `dayMode` | pulse always calm | — | trace always tense |

State → CSS:

```tsx
const stateColors: Record<string, string> = {
  calm:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  active: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  tense:  'bg-red-500/10 text-red-400 border-red-500/20',
};
```

### Task 2.5: Wire into Dashboard.tsx

**Files:**
- Modify: `src/components/Dashboard.tsx`

Replace the Phase 1 placeholder with:

```tsx
import { KohaerenzHero } from './dashboard/KohaerenzHero';

// ... inside return, position 2:
<motion.div {...fadeIn(0.02)}>
  <SectionErrorBoundary name="CoherenceHero">
    <KohaerenzHero
      dayHarmonic={activeDayHarmonic}
      spaceWeather={spaceWeather}
      transitEvents={transitEvents}
      dayMode={dailyData?.fusion?.day_mode ?? 'pulse'}
      loading={metaLoading || transitLoading}
    />
  </SectionErrorBoundary>
</motion.div>
```

### Task 2.6: Verify

```bash
npx tsc --noEmit
npm run dev
# Visual: Coherence ring renders with correct value, driver pills show states
```

```bash
git add src/components/dashboard/KohaerenzHero.tsx src/components/Dashboard.tsx
git commit -m "feat: add KohaerenzHero component with coherence ring + driver strip"
```

---

## Phase 3 — Astro Visual Refinement

**Risk:** Low. CSS-only changes, scoped to new class.

**Estimated time:** 1–2 hours

### Task 3.1: Add `.astro-editorial` token variant

**Files:**
- Modify: `src/index.css`

Add a new CSS class that can be toggled as an alternative to `.planetarium`:

```css
/* ── Astro Editorial Theme — Coherence-First Dashboard ────────── */
.astro-editorial {
  --tile-bg: rgba(12, 14, 22, 0.95);
  --tile-border: rgba(212, 175, 55, 0.18);
  --tile-text-primary: #F0E6D2;
  --tile-text-secondary: rgba(240, 230, 210, 0.65);
  --tile-accent: #D4AF37;
  --tile-glow: rgba(212, 175, 55, 0.12);
  --tile-shadow: 0 4px 24px rgba(0, 0, 0, 0.5), 0 0 16px rgba(212, 175, 55, 0.06);
  --color-ink: #F0E6D2;
}
```

### Task 3.2: Coherence hero specific styles

```css
.kohaerenz-hero {
  background: linear-gradient(160deg, rgba(8, 10, 18, 0.96) 0%, rgba(18, 14, 8, 0.92) 100%);
  border: 1px solid rgba(212, 175, 55, 0.25);
  border-radius: 2rem;
  backdrop-filter: blur(20px);
}
```

### Task 3.3: Verify

```bash
npx tsc --noEmit
npm run dev
# Visual check in both planetarium and morning mode
```

```bash
git add src/index.css
git commit -m "style: add astro-editorial theme tokens + kohaerenz-hero styles"
```

---

## Phase 4 — Planet Cards Enhancement ⛔ BLOCKED

> **Blocked on:** FuFirE API must provide per-planet natal relevance scoring.
> Client-side relevance calculation is explicitly ruled out (2026-04-12).
>
> **Required API work:**
> - FuFirE `/transit/state` endpoint must return a `relevance` field per planet
> - Relevance must be computed server-side against the user's natal chart
> - LLM-generated natural-language descriptions per active planet
>
> **When unblocked:** Modify `AktiveEinfluesseFusion.tsx` to:
> 1. Filter planets by `relevance > threshold` from API response
> 2. Display API-provided descriptions instead of client-side templates
> 3. Fallback: show all 6 planets if API doesn't return relevance (backward compat)
>
> **Do not implement until FuFirE API contract is defined.**

---

## Phase 5 — Remove MiniSignature from old position, integrate into Coherence

**Risk:** Low. Component still exists, just no longer rendered in the BigFour grid.

**Estimated time:** 30 minutes

### Task 5.1: Remove MiniSignature from BigFour grid

**Files:**
- Modify: `src/components/Dashboard.tsx`

Change the BigFour grid from `grid-cols-[1fr_auto]` to `grid-cols-1`. Remove the `MiniSignature` render from that grid. The signature visualization will optionally be embedded in the KohaerenzHero later.

### Task 5.2: Verify

```bash
npx tsc --noEmit
npm run dev
```

```bash
git add src/components/Dashboard.tsx
git commit -m "refactor: move MiniSignature out of BigFour grid — coherence-first layout"
```

---

## Verification checklist (all phases)

- [ ] `npx tsc --noEmit` passes
- [ ] `npm run dev` starts without errors
- [ ] Coherence Index renders as first content block
- [ ] Driver strip shows 4 pills with correct states
- [ ] Planet cards show only relevant transits
- [ ] Daily Pulse renders below planets
- [ ] Agents render below Daily Pulse
- [ ] Blueprint accordion remains functional
- [ ] BigFour identity cards render at bottom
- [ ] Planetarium renders (moved down, still functional)
- [ ] Tour overlay still functions (sentinel refs updated)
- [ ] Light mode (morning) and dark mode (planetarium) both render correctly
- [ ] Mobile responsive: all sections stack correctly at < 768px

---

## What this plan does NOT cover (future iterations)

1. **Character portraits** in Blueprint section — requires asset pipeline
2. **GLPL time-series chart** in Coherence hero — needs historical data endpoint
3. **Starfield header banner** — cosmetic, can be added as CSS background
4. **Constellation visualization** — existing Orrery handles this, just repositioned
5. **Animated coherence ring transitions** — polish iteration after baseline works

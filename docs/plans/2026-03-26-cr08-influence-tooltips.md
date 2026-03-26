# CR-08: Tooltips für „Heutige Einflüsse" ergänzen

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add hover/tap tooltips to each gauge in the InfluenceGauges component so users understand what Mars-Sektor, Jupiter-Sektor, Venus-Balance, and Saturn-Fokus mean. Tooltip texts must be fachlich korrekt (astrologically accurate), not invented.

**Architecture:** 2 tasks. Task 1 adds a `tooltip` field to `InfluenceData` and updates the Gauge component to render a tooltip on hover (reusing the existing `Tooltip` component from `src/components/Tooltip.tsx`). Task 2 writes real astrological descriptions for each default influence.

**Tech Stack:** TypeScript, React 19, Tailwind CSS v4, Vitest

**GitHub Issue:** #176 — CR-08

---

## Task 1: Add tooltip support to Gauge + InfluenceData

**Files:**
- Modify: `src/components/dashboard/InfluenceGauges.tsx`
- Create: `src/__tests__/influence-tooltips.test.tsx`

### Step 1: Write the failing test

```typescript
// src/__tests__/influence-tooltips.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import InfluenceGauges from '../components/dashboard/InfluenceGauges';

// Mock Tooltip to make tooltip text visible
vi.mock('../components/Tooltip', () => ({
  Tooltip: ({ content, children }: { content: string; children: React.ReactNode }) => (
    <div data-testid="tooltip-wrapper" data-tooltip={content}>{children}</div>
  ),
}));

describe('InfluenceGauges tooltips', () => {
  it('renders tooltip wrappers for each gauge', () => {
    render(<InfluenceGauges />);
    const wrappers = screen.getAllByTestId('tooltip-wrapper');
    expect(wrappers.length).toBe(4);
  });

  it('passes tooltip text from influence data', () => {
    const custom = [
      { label: 'Test', value: 0.5, color: 'bg-white', tooltip: 'Test explanation' },
    ];
    render(<InfluenceGauges influences={custom} />);
    const wrapper = screen.getByTestId('tooltip-wrapper');
    expect(wrapper.getAttribute('data-tooltip')).toBe('Test explanation');
  });

  it('default influences all have non-empty tooltips', () => {
    render(<InfluenceGauges />);
    const wrappers = screen.getAllByTestId('tooltip-wrapper');
    wrappers.forEach((w) => {
      expect(w.getAttribute('data-tooltip')).toBeTruthy();
      expect(w.getAttribute('data-tooltip')!.length).toBeGreaterThan(10);
    });
  });
});
```

### Step 2: Run test — expect FAIL

```bash
cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum
npx vitest run src/__tests__/influence-tooltips.test.tsx 2>&1 | tail -20
```

Expected: FAIL — `Tooltip` not imported, no `tooltip` field.

### Step 3: Update InfluenceGauges.tsx

Replace the entire file with:

```typescript
// src/components/dashboard/InfluenceGauges.tsx
import { Tooltip } from "../Tooltip";

interface GaugeProps {
  label: string;
  value: number;
  color?: string;
  tooltip?: string;
}

function Gauge({ label, value, color = "bg-white", tooltip }: GaugeProps) {
  const inner = (
    <div className="space-y-3 group cursor-help">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] group-hover:text-zinc-400 transition-colors">
          {label}
        </span>
        <span className="text-[10px] font-mono text-zinc-400">
          {Math.round(value * 100)}%
        </span>
      </div>
      <div className="h-[6px] w-full bg-zinc-900/50 rounded-full overflow-hidden border border-white/5 relative">
        <div
          className="absolute inset-y-0 left-0 bg-white/10 blur-[4px]"
          style={{ width: `${value * 100}%` }}
        />
        <div
          className={`h-full ${color} transition-all duration-1000 ease-out relative z-10`}
          style={{ width: `${value * 100}%` }}
        />
      </div>
    </div>
  );

  if (tooltip) {
    return <Tooltip content={tooltip} wide dark>{inner}</Tooltip>;
  }
  return inner;
}

export interface InfluenceData {
  label: string;
  value: number;
  color: string;
  tooltip?: string;
}

const DEFAULT_INFLUENCES: InfluenceData[] = [
  {
    label: "Mars-Sektor",
    value: 0.82,
    color: "bg-gradient-to-r from-red-500 to-orange-400",
    tooltip: "Mars steht für Antrieb, Durchsetzungskraft und körperliche Energie. Ein hoher Mars-Sektor-Wert zeigt eine Phase erhöhter Tatkraft und Entschlossenheit an.",
  },
  {
    label: "Jupiter-Sektor",
    value: 0.65,
    color: "bg-gradient-to-r from-cyan-400 to-blue-500",
    tooltip: "Jupiter repräsentiert Wachstum, Weisheit und Expansion. Dieser Wert spiegelt das Potenzial für neue Erkenntnisse, Optimismus und günstige Entwicklungen wider.",
  },
  {
    label: "Venus-Balance",
    value: 0.45,
    color: "bg-gradient-to-r from-purple-400 to-pink-400",
    tooltip: "Venus steht für Harmonie, Beziehungen und ästhetisches Empfinden. Die Venus-Balance zeigt, wie stark die Einflüsse von Liebe, Schönheit und Verbundenheit heute wirken.",
  },
  {
    label: "Saturn-Fokus",
    value: 0.30,
    color: "bg-gradient-to-r from-zinc-400 to-zinc-200",
    tooltip: "Saturn verkörpert Struktur, Disziplin und Verantwortung. Ein niedriger Saturn-Fokus deutet auf eine Phase mit weniger äußeren Beschränkungen und mehr Gestaltungsfreiheit hin.",
  },
];

export default function InfluenceGauges({ influences = DEFAULT_INFLUENCES }: { influences?: InfluenceData[] }) {
  return (
    <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-[2rem] space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">Heutige Einflüsse</h2>
        <div className="text-[8px] font-mono text-zinc-600">LIVE FEED</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
        {influences.map((inf, i) => (
          <Gauge key={i} label={inf.label} value={inf.value} color={inf.color} tooltip={inf.tooltip} />
        ))}
      </div>
    </div>
  );
}
```

### Step 4: Run tests — expect PASS

```bash
npx vitest run src/__tests__/influence-tooltips.test.tsx 2>&1 | tail -20
```

Expected: 3 passed.

### Step 5: TypeScript check

```bash
npx tsc --noEmit 2>&1 | head -20
```

### Step 6: Full test run

```bash
npm run test 2>&1 | tail -10
```

### Step 7: Commit

```bash
git add src/components/dashboard/InfluenceGauges.tsx src/__tests__/influence-tooltips.test.tsx
git commit -m "feat(cr08): add tooltips to InfluenceGauges — planet sector explanations

Each gauge now shows a German tooltip on hover/tap explaining the
astrological meaning. Uses the existing Tooltip component.
closes #176"
```

---

## Task 2: Verify Tooltip component supports dark mode + wide

**Files:**
- Read: `src/components/Tooltip.tsx`

### Step 1: Check existing Tooltip supports `dark` and `wide` props

```bash
grep -n "dark\|wide\|interface" src/components/Tooltip.tsx | head -20
```

The Tooltip component is already used in `DashboardAstroSection.tsx` (line 260) with `wide` and `dark` props. Verify it renders correctly with the new usage. If not, no code change needed — the existing Tooltip already handles these props.

### Step 2: Manual verification only

No code change expected. Just verify the tooltips render correctly:
- Hover on Mars-Sektor → tooltip appears with German text
- Tap on mobile → tooltip appears on touch
- Tooltip doesn't overflow viewport

---

## Final Verification

```bash
npm run test && npx tsc --noEmit
```

**Manual check:**
1. Open Dashboard → scroll to "Heutige Einflüsse"
2. Hover over "Mars-Sektor" → tooltip: "Mars steht für Antrieb..."
3. Hover over "Jupiter-Sektor" → tooltip: "Jupiter repräsentiert Wachstum..."
4. Tooltips don't overlap gauge bars
5. Mobile: tap shows tooltip, tap elsewhere dismisses

**PR title:** `feat(cr08): Planet sector tooltips — Heutige Einflüsse erklärt`

**Branch:** `feature/cr08-influence-tooltips`

**Closes:** #176

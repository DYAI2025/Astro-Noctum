# GO-LIVE-06: Dashboard Component Integration

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire BlueprintCard, MiniSignature, and InfluenceGauges to real Supabase data; add loading skeleton and error state to Dashboard; eliminate hardcoded stub in InfluenceGauges.
**Architecture:** Dashboard.tsx fetches `soulprint_sectors` from `astro_profiles` via Supabase. All three hero components are already mounted and wrapped in SectionErrorBoundary. Missing: loading state, error state, and real data passed to InfluenceGauges.
**Tech Stack:** TypeScript, React 19, Vitest, Tailwind CSS v4
**GitHub Issue:** #182

---

## Task 1: Add loading skeleton during Supabase fetch

### Files

| Action | Path |
|--------|------|
| Modify | `src/components/Dashboard.tsx` |
| Create | `src/__tests__/dashboard-loading-state.test.tsx` |

### Code — Dashboard.tsx changes

Add `profileLoading` state (alongside existing state):

```typescript
const [profileLoading, setProfileLoading] = useState(true);
```

In the useEffect that fetches Supabase data (lines 205-249), ensure `setProfileLoading(false)` is called in both the success path and the catch block:

```typescript
useEffect(() => {
  if (!user) return;
  setProfileLoading(true);
  (async () => {
    try {
      // ... existing fetch logic ...
      setProfileLoading(false);
    } catch (err) {
      setProfileLoading(false);
    }
  })();
}, [user]);
```

Replace the JSX section that renders BlueprintCard, MiniSignature, InfluenceGauges with a conditional:

```tsx
{profileLoading ? (
  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="animate-pulse bg-[#D4AF37]/5 rounded-2xl h-32"
      />
    ))}
  </div>
) : (
  <>
    <SectionErrorBoundary name="Blueprint">
      <BlueprintCard ... />
    </SectionErrorBoundary>
    <SectionErrorBoundary name="Signatur">
      <MiniSignature ... />
    </SectionErrorBoundary>
    <SectionErrorBoundary name="Einflüsse">
      <InfluenceGauges soulprintSectors={profileMeta.soulprintSectors} />
    </SectionErrorBoundary>
  </>
)}
```

### Code — dashboard-loading-state.test.tsx

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Dashboard from '../components/Dashboard';

// Mock Supabase with a delayed response
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () =>
            new Promise((resolve) =>
              setTimeout(() => resolve({ data: null, error: null }), 100)
            ),
        }),
      }),
    }),
  },
}));

describe('Dashboard loading state', () => {
  it('shows skeleton cards while Supabase fetch is in flight', async () => {
    render(<Dashboard />);
    // Three skeleton divs should be present immediately
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(3);
  });

  it('removes skeleton cards after data loads', async () => {
    render(<Dashboard />);
    await waitFor(
      () => {
        const skeletons = document.querySelectorAll('.animate-pulse');
        expect(skeletons.length).toBe(0);
      },
      { timeout: 500 }
    );
  });
});
```

### Commands

```bash
npx vitest run src/__tests__/dashboard-loading-state.test.tsx
# Expected: 2 tests pass
```

### Commit

```
feat(dashboard): add loading skeleton for Supabase profile fetch

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

---

## Task 2: Add error state for failed Supabase fetch

### Files

| Action | Path |
|--------|------|
| Modify | `src/components/Dashboard.tsx` |

### Code — Dashboard.tsx changes

Add `profileError` state:

```typescript
const [profileError, setProfileError] = useState(false);
```

In the useEffect catch block, set the error flag:

```typescript
} catch (err) {
  setProfileError(true);
  setProfileLoading(false);
}
```

Add the inline error banner directly above (or below) the hero components section, outside the loading conditional so it is always visible when set:

```tsx
{profileError && (
  <div className="mb-4 rounded-xl border border-[#D4AF37]/40 bg-[#00050A] px-4 py-3 text-sm text-[#D4AF37]/80">
    {lang === 'de'
      ? 'Profildaten konnten nicht geladen werden. Bitte Seite neu laden.'
      : 'Profile data could not be loaded. Please refresh.'}
  </div>
)}
```

The components below the banner are still rendered (with null/default data) so the page remains functional.

### Commands

```bash
npm run lint
# Expected: no new TypeScript errors
```

### Commit

```
feat(dashboard): show inline error banner when Supabase profile fetch fails

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

---

## Task 3: Wire InfluenceGauges to soulprint_sectors

### Files

| Action | Path |
|--------|------|
| Modify | `src/components/dashboard/InfluenceGauges.tsx` |
| Modify | `src/components/Dashboard.tsx` |
| Create | `src/__tests__/influence-gauges.test.tsx` |

### Code — InfluenceGauges.tsx

Replace the current component with:

```typescript
import React from 'react';

interface Influence {
  label: string;
  value: number; // 0–1
}

const DEFAULT_INFLUENCES: Influence[] = [
  { label: 'Mars-Sektor',    value: 0.72 },
  { label: 'Jupiter-Sektor', value: 0.58 },
  { label: 'Venus-Balance',  value: 0.65 },
  { label: 'Saturn-Fokus',   value: 0.41 },
];

// Map 12 zodiac sectors (0-indexed) to 4 planetary gauges
const GAUGE_SECTOR_MAP: Record<string, number[]> = {
  'Mars-Sektor':    [0, 7],   // Aries + Scorpio
  'Jupiter-Sektor': [8, 11],  // Sagittarius + Pisces
  'Venus-Balance':  [1, 6],   // Taurus + Libra
  'Saturn-Fokus':   [9, 10],  // Capricorn + Aquarius
};

function computeInfluences(sectors: number[]): Influence[] {
  return Object.entries(GAUGE_SECTOR_MAP).map(([label, indices]) => {
    const avg =
      indices.reduce((sum, i) => sum + (sectors[i] ?? 0), 0) / indices.length;
    return { label, value: Math.min(1, Math.max(0, avg)) };
  });
}

interface InfluenceGaugesProps {
  soulprintSectors?: number[] | null;
}

export function InfluenceGauges({ soulprintSectors }: InfluenceGaugesProps) {
  const influences =
    Array.isArray(soulprintSectors) && soulprintSectors.length === 12
      ? computeInfluences(soulprintSectors)
      : DEFAULT_INFLUENCES;

  return (
    <div className="glass-card rounded-2xl p-4 space-y-3">
      {influences.map(({ label, value }) => (
        <div key={label}>
          <div className="flex justify-between text-xs text-[#D4AF37]/70 mb-1">
            <span>{label}</span>
            <span>{Math.round(value * 100)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-[#D4AF37]/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#D4AF37]/60 transition-all duration-700"
              style={{ width: `${value * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default InfluenceGauges;
```

### Code — Dashboard.tsx change

Update the InfluenceGauges invocation:

```tsx
<InfluenceGauges soulprintSectors={profileMeta.soulprintSectors} />
```

### Code — influence-gauges.test.tsx

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import InfluenceGauges from '../components/dashboard/InfluenceGauges';

const MOCK_SECTORS = [
  0.8, 0.6, 0.4, 0.3, 0.5, 0.7, 0.9, 0.2, 0.6, 0.4, 0.3, 0.8,
];

describe('InfluenceGauges', () => {
  it('renders 4 gauge rows', () => {
    render(<InfluenceGauges soulprintSectors={MOCK_SECTORS} />);
    expect(screen.getByText('Mars-Sektor')).toBeDefined();
    expect(screen.getByText('Jupiter-Sektor')).toBeDefined();
    expect(screen.getByText('Venus-Balance')).toBeDefined();
    expect(screen.getByText('Saturn-Fokus')).toBeDefined();
  });

  it('computes Mars-Sektor value from sectors[0] and sectors[7]', () => {
    // sectors[0]=0.8, sectors[7]=0.2 → avg=0.5 → 50%
    render(<InfluenceGauges soulprintSectors={MOCK_SECTORS} />);
    expect(screen.getByText('50%')).toBeDefined();
  });

  it('falls back to DEFAULT_INFLUENCES when soulprintSectors is null', () => {
    render(<InfluenceGauges soulprintSectors={null} />);
    // DEFAULT: Mars-Sektor = 72%
    expect(screen.getByText('72%')).toBeDefined();
  });

  it('falls back to DEFAULT_INFLUENCES when soulprintSectors is undefined', () => {
    render(<InfluenceGauges />);
    expect(screen.getByText('72%')).toBeDefined();
  });

  it('falls back when array length is not 12', () => {
    render(<InfluenceGauges soulprintSectors={[0.5, 0.5]} />);
    expect(screen.getByText('72%')).toBeDefined();
  });
});
```

### Commands

```bash
npx vitest run src/__tests__/influence-gauges.test.tsx
# Expected: 5 tests pass
```

### Commit

```
feat(dashboard): wire InfluenceGauges to soulprint_sectors from Supabase

Replaces hardcoded DEFAULT_INFLUENCES with computed gauge values derived
from the 12 zodiac sectors stored in astro_profiles.soulprint_sectors.
Falls back to defaults when sectors are absent.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

---

## Task 4: TypeScript + build verification

### Commands

```bash
# 1. TypeScript check — must report zero errors
npx tsc --noEmit
# Expected: (no output, exit 0)

# 2. Full test suite — must pass all tests
npm run test
# Expected: 800+ tests passing, 0 failures

# 3. Production build — must succeed
npm run build
# Expected: dist/ generated, no build errors
```

### Commit

```
chore(go-live-06): verify TypeScript, tests, and build after dashboard integration

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

---

## Summary

| Task | Files changed | New tests |
|------|--------------|-----------|
| 1 — Loading skeleton | `Dashboard.tsx` | `dashboard-loading-state.test.tsx` (2 tests) |
| 2 — Error banner | `Dashboard.tsx` | — |
| 3 — InfluenceGauges wiring | `InfluenceGauges.tsx`, `Dashboard.tsx` | `influence-gauges.test.tsx` (5 tests) |
| 4 — Verification | — | — |

**Done when:** `npm run test` passes 800+ tests, `npm run build` succeeds, InfluenceGauges renders computed values from `soulprint_sectors`, and the Dashboard shows skeleton during fetch and an error banner on failure.

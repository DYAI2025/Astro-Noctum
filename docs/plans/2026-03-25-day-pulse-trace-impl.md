# Day-Pulse / Day-Trace Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the broken DailyHoroscopeModal with a mode-driven daily experience — Day-Pulse (H < 0.50, ruhige Zeit) or Day-Trace (H ≥ 0.50, heute passiert was) — including V3 engine modulation and a new minimal modal.

**Architecture:** Harmony Index H flows from `/api/experience/daily` → `DailyFusionSchema` → `DayHarmonicState` → V3 bipolar engine (trail persistence + Lissajous blend) + `DayModeModal` (label + 2–3 sentences, no tabs). Server computes `day_mode` from H if FuFirE doesn't send it. Text is "Poetic Realism" — worldly images, no astro-lecture.

**Tech Stack:** TypeScript, React 19, Zod, Three.js Canvas 2D (V3 engine), Vite, Vitest

**Branch:** `feature/fusion-ring-integration-v3`

---

## Task 0: Branch Setup

**Files:** none (git only)

**Step 1: Switch to the V3 integration branch**

```bash
git checkout feature/fusion-ring-integration-v3
```

**Step 2: Rebase onto current main**

```bash
git fetch origin
git rebase origin/main
```
Expected: clean rebase (or resolve conflicts if any, the branch is older than main by several commits).

**Step 3: Cherry-pick the V3 bipolar engine from prototype**

```bash
git cherry-pick 94fc401
```
That commit is `feat: V3 Bipolar Trail Signature Engine — prototype` from `prototype/signatur-v3-bipolar-trails`. It adds:
- `src/components/signatur-v3/bipolar-engine.ts`
- `src/components/signatur-v3/SignaturV3Canvas.tsx`
- `src/components/signatur-v3/demo.html`

If conflicts, resolve then `git cherry-pick --continue`.

**Step 4: Verify the branch has the engine**

```bash
ls src/components/signatur-v3/
```
Expected: `bipolar-engine.ts  SignaturV3Canvas.tsx  demo.html`

**Step 5: Commit if cherry-pick needed a manual merge**

```bash
git log --oneline -3
```
Expected: prototype commit visible in history.

---

## Task 1: Schema — Add harmony_index + day_mode to DailyFusionSchema

**Files:**
- Modify: `src/lib/schemas/experience.ts:80-86`
- Test: `src/__tests__/day-mode-schema.test.ts` (create)

**Step 1: Write the failing test**

Create `src/__tests__/day-mode-schema.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { DailyResponseSchema } from '../lib/schemas/experience';

describe('DailyResponseSchema — day_mode fields', () => {
  it('accepts a valid Day-Trace response', () => {
    const raw = {
      date: '2026-03-25',
      western: {
        summary: 'test', themes: ['a'], caution: 'c', opportunity: 'o',
        evidence: {},
      },
      eastern: {
        summary: 'test', themes: ['a'], caution: 'c', opportunity: 'o',
        evidence: {},
      },
      fusion: {
        summary: 'test', synthesis: 'syn', action: 'act',
        pushworthy: false, push_text: null,
        harmony_index: 0.62,
        day_mode: 'trace',
      },
      meta: { engine_version: '1.0' },
    };
    const result = DailyResponseSchema.safeParse(raw);
    expect(result.success).toBe(true);
    expect(result.data?.fusion.day_mode).toBe('trace');
    expect(result.data?.fusion.harmony_index).toBe(0.62);
  });

  it('accepts a valid Day-Pulse response', () => {
    const raw = {
      date: '2026-03-25',
      western: { summary: 'test', themes: ['a'], caution: 'c', opportunity: 'o', evidence: {} },
      eastern: { summary: 'test', themes: ['a'], caution: 'c', opportunity: 'o', evidence: {} },
      fusion: {
        summary: 'test', synthesis: 'syn', action: 'act',
        pushworthy: false, harmony_index: 0.38, day_mode: 'pulse',
      },
      meta: { engine_version: '1.0' },
    };
    expect(DailyResponseSchema.safeParse(raw).success).toBe(true);
  });

  it('rejects response without harmony_index', () => {
    const raw = {
      date: '2026-03-25',
      western: { summary: 'x', themes: [], caution: 'x', opportunity: 'x', evidence: {} },
      eastern: { summary: 'x', themes: [], caution: 'x', opportunity: 'x', evidence: {} },
      fusion: { summary: 'x', synthesis: 'x', action: 'x', pushworthy: false },
      meta: { engine_version: '1.0' },
    };
    expect(DailyResponseSchema.safeParse(raw).success).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/__tests__/day-mode-schema.test.ts
```
Expected: FAIL — `harmony_index` not in schema.

**Step 3: Extend DailyFusionSchema in `src/lib/schemas/experience.ts`**

Find the `DailyFusionSchema` (lines 80–86) and replace:

```typescript
const DailyFusionSchema = z.object({
  summary: z.string(),
  synthesis: z.string(),
  action: z.string(),
  pushworthy: z.boolean(),
  push_text: z.string().optional().nullable(),
  harmony_index: z.number().min(0).max(1),
  day_mode: z.enum(['pulse', 'trace']),
});
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/__tests__/day-mode-schema.test.ts
```
Expected: PASS, 3 tests.

**Step 5: Run full test suite to check for regressions**

```bash
npm run test
```
Expected: all previously passing tests still pass.

**Step 6: Commit**

```bash
git add src/lib/schemas/experience.ts src/__tests__/day-mode-schema.test.ts
git commit -m "feat(day-mode): add harmony_index + day_mode to DailyFusionSchema"
```

---

## Task 2: Server — Compute day_mode when proxying /api/experience/daily

**Files:**
- Modify: `server.mjs` — find the `/api/experience/daily` proxy handler

**Context:** The server proxies `/api/experience/daily` to FuFirE. FuFirE may or may not return `harmony_index`. We inject `day_mode` server-side so the client never has to branch on H.

**Step 1: Find the daily proxy in server.mjs**

```bash
grep -n "experience/daily\|daily.*proxy\|fetchDailyExperience" server.mjs | head -10
```

**Step 2: Add day_mode injection after the FuFirE response is parsed**

In the daily proxy handler, after parsing the FuFirE JSON response body, add:

```javascript
// Inject day_mode from harmony_index if FuFirE didn't send it
if (fusionPayload?.harmony_index !== undefined && !fusionPayload.day_mode) {
  fusionPayload.day_mode = fusionPayload.harmony_index >= 0.50 ? 'trace' : 'pulse';
}
// Fallback: if FuFirE sends neither, default to pulse
if (fusionPayload && !fusionPayload.day_mode) {
  fusionPayload.harmony_index = fusionPayload.harmony_index ?? 0.40;
  fusionPayload.day_mode = 'pulse';
}
```

The exact location depends on how the proxy is structured. Look for where `responseBody.fusion` is assembled or forwarded.

**Step 3: Manual smoke test (no automated test — it's a proxy)**

```bash
# Start server locally (needs .env.local)
PORT=3001 node server.mjs &
curl -s -X POST http://localhost:3001/api/experience/daily \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-03-25","birth_data":{"date":"1990-01-01","time":"12:00","tz":"Europe/Berlin","lat":52.5,"lon":13.4},"soulprint_sectors":[0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5],"quiz_sectors":[]}' \
  | jq '.fusion | {harmony_index, day_mode}'
kill %1
```
Expected: `{ "harmony_index": <number>, "day_mode": "pulse" or "trace" }` — never null.

**Step 4: Commit**

```bash
git add server.mjs
git commit -m "feat(day-mode): inject day_mode in /api/experience/daily proxy"
```

---

## Task 3: V3 Engine — DayHarmonicState interface + updatePoles modulation

**Files:**
- Modify: `src/components/signatur-v3/bipolar-engine.ts`
- Test: `src/__tests__/bipolar-engine-day-harmonic.test.ts` (create)

**Context:** `updatePoles` currently takes `(poles, dissonance, config, time)`. We add `dayHarmonic` as an orthogonal signal. Pulse → higher trailPersistence (condensed). Trace → boosted Lissajous blend on top 2 dimensions.

**Step 1: Write failing test**

Create `src/__tests__/bipolar-engine-day-harmonic.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  type DayHarmonicState,
  type DissonanceState,
  computeDayHarmonic,
} from '../components/signatur-v3/bipolar-engine';

describe('DayHarmonicState', () => {
  it('computeDayHarmonic: H < 0.50 → pulse', () => {
    const state = computeDayHarmonic(0.38);
    expect(state.mode).toBe('pulse');
    expect(state.intensity).toBeCloseTo(Math.abs(0.38 - 0.45) / 0.55, 5);
  });

  it('computeDayHarmonic: H >= 0.50 → trace', () => {
    const state = computeDayHarmonic(0.62);
    expect(state.mode).toBe('trace');
    expect(state.intensity).toBeGreaterThan(0);
  });

  it('computeDayHarmonic: H = 0.45 (random baseline) → near-zero intensity', () => {
    const state = computeDayHarmonic(0.45);
    expect(state.intensity).toBeCloseTo(0, 1);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/__tests__/bipolar-engine-day-harmonic.test.ts
```
Expected: FAIL — `computeDayHarmonic` not exported.

**Step 3: Add DayHarmonicState interface + computeDayHarmonic to bipolar-engine.ts**

At the top of `src/components/signatur-v3/bipolar-engine.ts`, after the existing interfaces, add:

```typescript
export interface DayHarmonicState {
  /** Harmony Index 0–1 from /experience/daily */
  harmonyIndex: number;
  /** pulse = H < 0.50 (symmetric), trace = H >= 0.50 (crossings) */
  mode: 'pulse' | 'trace';
  /** Normalized distance from random baseline: |H - 0.45| / 0.55 */
  intensity: number;
}

export function computeDayHarmonic(harmonyIndex: number): DayHarmonicState {
  const mode: 'pulse' | 'trace' = harmonyIndex >= 0.50 ? 'trace' : 'pulse';
  const intensity = Math.min(1, Math.abs(harmonyIndex - 0.45) / 0.55);
  return { harmonyIndex, mode, intensity };
}

/** Neutral DayHarmonicState — used as default when daily data isn't loaded yet */
export const NEUTRAL_DAY_HARMONIC: DayHarmonicState = {
  harmonyIndex: 0.45,
  mode: 'pulse',
  intensity: 0,
};
```

**Step 4: Modify updatePoles signature to accept dayHarmonic**

Find `export function updatePoles(` in `bipolar-engine.ts` and update its signature:

```typescript
export function updatePoles(
  poles: PoleState[],
  dissonance: DissonanceState,
  config: SignaturV3Config,
  time: number,
  dayHarmonic: DayHarmonicState = NEUTRAL_DAY_HARMONIC,
): void {
```

Default parameter means existing callers don't break.

**Step 5: Apply Pulse modulation inside updatePoles**

Before the dimension loop in `updatePoles`, add:

```typescript
  // Day-Pulse: slightly increased persistence (applied via config shadow — not mutating)
  // Day-Trace: boost Lissajous blend for top 2 dimensions
  const traceBoost = dayHarmonic.mode === 'trace' ? dayHarmonic.intensity * 0.6 : 0;
  const pulseCondense = dayHarmonic.mode === 'pulse' ? dayHarmonic.intensity * 0.12 : 0;
```

Then inside the dimension loop, after `const blend = clamp(d * 2, 0, 1);`, change to:

```typescript
    // Add day harmonic boost for first 2 dimensions on trace days
    const dayBlend = (i / 2) < 2 ? traceBoost : 0;
    const totalBlend = clamp(blend + dayBlend, 0, 1);

    poleA.x = lerp(symmetricAx, lissajousAx, totalBlend);
    poleA.y = lerp(symmetricAy, lissajousAy, totalBlend);
    poleB.x = lerp(symmetricBx, lissajousBx, totalBlend);
    poleB.y = lerp(symmetricBy, lissajousBy, totalBlend);
```

For the trail persistence, add a helper that callers can use to get a modulated config:

```typescript
export function modulateConfig(
  base: SignaturV3Config,
  dayHarmonic: DayHarmonicState,
): SignaturV3Config {
  const pulseBoost = dayHarmonic.mode === 'pulse' ? dayHarmonic.intensity * 0.12 : 0;
  const traceDrain = dayHarmonic.mode === 'trace' ? dayHarmonic.intensity * 0.05 : 0;
  return {
    ...base,
    trailPersistence: Math.min(0.98, Math.max(0.70,
      base.trailPersistence + pulseBoost - traceDrain,
    )),
  };
}
```

**Step 6: Run tests**

```bash
npx vitest run src/__tests__/bipolar-engine-day-harmonic.test.ts
```
Expected: PASS, 3 tests.

**Step 7: Run full suite**

```bash
npm run test
```
Expected: all passing.

**Step 8: Commit**

```bash
git add src/components/signatur-v3/bipolar-engine.ts src/__tests__/bipolar-engine-day-harmonic.test.ts
git commit -m "feat(day-mode): DayHarmonicState + updatePoles day harmonic modulation"
```

---

## Task 4: SignaturV3Canvas — accept dayHarmonic prop

**Files:**
- Modify: `src/components/signatur-v3/SignaturV3Canvas.tsx`

**Context:** Thread `DayHarmonicState` through to `updatePoles` and `modulateConfig`. No test needed — this is a thin wiring layer.

**Step 1: Add prop to SignaturV3Props**

Find `export interface SignaturV3Props` and add:

```typescript
  /** Day harmonic state from /experience/daily — drives Pulse/Trace visual mode */
  dayHarmonic?: DayHarmonicState;
```

Import at top:
```typescript
import {
  // ... existing imports ...
  type DayHarmonicState,
  NEUTRAL_DAY_HARMONIC,
  modulateConfig,
  updatePoles,
} from './bipolar-engine';
```

**Step 2: Use modulateConfig in the rAF loop**

Find where `updatePoles` is called in the canvas's `useEffect` rAF loop. Replace:

```typescript
// BEFORE:
updatePoles(polesRef.current, dissonance, config, time);

// AFTER:
const harmonic = dayHarmonic ?? NEUTRAL_DAY_HARMONIC;
const modulatedConfig = modulateConfig(config, harmonic);
updatePoles(polesRef.current, dissonance, modulatedConfig, time, harmonic);
```

**Step 3: Verify TypeScript compiles**

```bash
npm run lint
```
Expected: 0 errors.

**Step 4: Commit**

```bash
git add src/components/signatur-v3/SignaturV3Canvas.tsx
git commit -m "feat(day-mode): thread DayHarmonicState prop through SignaturV3Canvas"
```

---

## Task 5: useFirstRunDaily — derive DayHarmonicState from response

**Files:**
- Modify: `src/hooks/useFirstRunDaily.ts`
- Test: `src/__tests__/use-first-run-daily-day-mode.test.ts` (create)

**Context:** Hook currently returns `{ dailyData, showModal, loading, handleClose }`. Add `dayHarmonic` to the return type.

**Step 1: Write failing test**

Create `src/__tests__/use-first-run-daily-day-mode.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { computeDayHarmonic } from '../components/signatur-v3/bipolar-engine';
import type { DailyResponse } from '../lib/schemas/experience';

// Unit-test the harmonic derivation logic in isolation
describe('DayHarmonic derivation from DailyResponse', () => {
  it('derives trace mode from H=0.62', () => {
    const fusion = { harmony_index: 0.62, day_mode: 'trace' } as DailyResponse['fusion'];
    const harmonic = computeDayHarmonic(fusion.harmony_index);
    expect(harmonic.mode).toBe('trace');
  });

  it('derives pulse mode from H=0.33', () => {
    const fusion = { harmony_index: 0.33, day_mode: 'pulse' } as DailyResponse['fusion'];
    const harmonic = computeDayHarmonic(fusion.harmony_index);
    expect(harmonic.mode).toBe('pulse');
  });
});
```

**Step 2: Run test to verify it passes (logic already exists)**

```bash
npx vitest run src/__tests__/use-first-run-daily-day-mode.test.ts
```
Expected: PASS — `computeDayHarmonic` is already exported from Task 3.

**Step 3: Update useFirstRunDaily return type**

In `src/hooks/useFirstRunDaily.ts`, update the result interface and hook body:

```typescript
import { computeDayHarmonic, NEUTRAL_DAY_HARMONIC, type DayHarmonicState } from '../components/signatur-v3/bipolar-engine';

interface UseFirstRunDailyResult {
  dailyData: DailyResponse | null;
  dayHarmonic: DayHarmonicState;   // NEU
  showModal: boolean;
  loading: boolean;
  handleClose: () => void;
}
```

In the hook body, derive harmonic when data is set:

```typescript
const [dayHarmonic, setDayHarmonic] = useState<DayHarmonicState>(NEUTRAL_DAY_HARMONIC);

// When setting dailyData, also derive dayHarmonic:
// Replace: setDailyData(data);
// With:
setDailyData(data);
if (data.fusion?.harmony_index !== undefined) {
  setDayHarmonic(computeDayHarmonic(data.fusion.harmony_index));
}
```

Return it:
```typescript
return { dailyData, dayHarmonic, showModal, loading, handleClose };
```

**Step 4: Run lint**

```bash
npm run lint
```
Expected: 0 errors.

**Step 5: Commit**

```bash
git add src/hooks/useFirstRunDaily.ts src/__tests__/use-first-run-daily-day-mode.test.ts
git commit -m "feat(day-mode): expose DayHarmonicState from useFirstRunDaily"
```

---

## Task 6: DayModeModal — new component

**Files:**
- Create: `src/components/dashboard/DayModeModal.tsx`
- Test: `src/__tests__/day-mode-modal.test.tsx` (create)

**Context:** Replaces `DailyHoroscopeModal`. No tabs. Shows DAY-PULSE or DAY-TRACE label + date + 2–3 sentence text from `fusion.synthesis`. Small 120×120 static canvas snapshot (SVG fallback if V3 not yet wired). Tone: Poetic Realism.

**Step 1: Write failing test**

Create `src/__tests__/day-mode-modal.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DayModeModal } from '../components/dashboard/DayModeModal';
import type { DailyResponse } from '../lib/schemas/experience';
import { NEUTRAL_DAY_HARMONIC } from '../components/signatur-v3/bipolar-engine';

const baseData: DailyResponse = {
  date: '2026-03-25',
  western: { summary: 'w', themes: [], caution: 'c', opportunity: 'o', evidence: {} },
  eastern: { summary: 'e', themes: [], caution: 'c', opportunity: 'o', evidence: {} },
  fusion: {
    summary: 'f', synthesis: 'Dein detektivischer Skorpion bekommt heute was zu tun.',
    action: 'a', pushworthy: false, harmony_index: 0.62, day_mode: 'trace',
  },
  meta: { engine_version: '1.0' },
};

const tracHarmonic = { harmonyIndex: 0.62, mode: 'trace' as const, intensity: 0.31 };

describe('DayModeModal', () => {
  it('renders DAY-TRACE label when mode is trace', () => {
    render(<DayModeModal data={baseData} dayHarmonic={tracHarmonic} onClose={() => {}} />);
    expect(screen.getByText('DAY-TRACE')).toBeDefined();
  });

  it('renders DAY-PULSE label when mode is pulse', () => {
    const pulseData = {
      ...baseData,
      fusion: { ...baseData.fusion, harmony_index: 0.38, day_mode: 'pulse' as const },
    };
    render(<DayModeModal data={pulseData} dayHarmonic={NEUTRAL_DAY_HARMONIC} onClose={() => {}} />);
    expect(screen.getByText('DAY-PULSE')).toBeDefined();
  });

  it('shows fusion.synthesis as the main text', () => {
    render(<DayModeModal data={baseData} dayHarmonic={tracHarmonic} onClose={() => {}} />);
    expect(screen.getByText(/Dein detektivischer Skorpion/)).toBeDefined();
  });

  it('calls onClose when close button clicked', () => {
    let closed = false;
    render(<DayModeModal data={baseData} dayHarmonic={tracHarmonic} onClose={() => { closed = true; }} />);
    fireEvent.click(screen.getByLabelText('Schliessen'));
    expect(closed).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/__tests__/day-mode-modal.test.tsx
```
Expected: FAIL — `DayModeModal` not found.

**Step 3: Implement DayModeModal**

Create `src/components/dashboard/DayModeModal.tsx`:

```typescript
import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { trackEvent } from '../../lib/analytics';
import type { DailyResponse } from '../../lib/schemas/experience';
import type { DayHarmonicState } from '../signatur-v3/bipolar-engine';

// ── Types ─────────────────────────────────────────────────────────────

interface Props {
  data: DailyResponse;
  dayHarmonic: DayHarmonicState;
  onClose: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' });
}

// ── Minimal Canvas Visual ─────────────────────────────────────────────
// Draws a static snapshot: Pulse → concentric circles, Trace → crossing lines

function drawModeSnapshot(
  canvas: HTMLCanvasElement,
  mode: 'pulse' | 'trace',
  intensity: number,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const size = canvas.width;
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;

  ctx.clearRect(0, 0, size, size);

  if (mode === 'pulse') {
    // Concentric glowing circles — calm, condensed
    for (let i = 3; i >= 1; i--) {
      const alpha = 0.10 + intensity * 0.12;
      ctx.beginPath();
      ctx.arc(cx, cy, r * (i / 3), 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(212,175,55,${alpha * (1 / i)})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    // Center glow
    const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.5);
    grd.addColorStop(0, `rgba(212,175,55,${0.12 + intensity * 0.08})`);
    grd.addColorStop(1, 'rgba(212,175,55,0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Crossing trail lines — trace
    const angles = [30, 75, 120, 165].map(a => (a * Math.PI) / 180);
    for (const angle of angles) {
      const alpha = 0.15 + intensity * 0.25;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
      ctx.lineTo(cx - Math.cos(angle) * r, cy - Math.sin(angle) * r);
      ctx.strokeStyle = `rgba(212,175,55,${alpha})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    // Intersection bloom
    const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.3);
    grd.addColorStop(0, `rgba(212,175,55,${0.20 + intensity * 0.15})`);
    grd.addColorStop(1, 'rgba(212,175,55,0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Component ─────────────────────────────────────────────────────────

export function DayModeModal({ data, dayHarmonic, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    if (!hasTrackedRef.current) {
      trackEvent('day_mode_modal_opened', { mode: dayHarmonic.mode });
      hasTrackedRef.current = true;
    }
  }, [dayHarmonic.mode]);

  useEffect(() => {
    if (canvasRef.current) {
      drawModeSnapshot(canvasRef.current, dayHarmonic.mode, dayHarmonic.intensity);
    }
  }, [dayHarmonic.mode, dayHarmonic.intensity]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleClose = () => {
    trackEvent('day_mode_modal_closed', { mode: dayHarmonic.mode });
    onClose();
  };

  const isTrace = dayHarmonic.mode === 'trace';
  const modeLabel = isTrace ? 'DAY-TRACE' : 'DAY-PULSE';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={modeLabel}
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.97 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="bg-[#00050A]/95 border border-[#D4AF37]/15 backdrop-blur rounded-2xl max-w-sm w-full p-8 relative flex flex-col items-center gap-5"
      >
        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-white/20 hover:text-[#D4AF37]/60 hover:bg-[#D4AF37]/8 transition-colors"
          aria-label="Schliessen"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Mode label + date */}
        <div className="text-center">
          <p className="font-serif text-2xl tracking-[0.15em] text-[#D4AF37]">
            {modeLabel}
          </p>
          <p className="mt-1 text-xs tracking-widest text-white/30 uppercase">
            {formatDateShort(data.date)}
          </p>
        </div>

        {/* Visual snapshot */}
        <canvas
          ref={canvasRef}
          width={120}
          height={120}
          className="opacity-90"
          aria-hidden="true"
        />

        {/* Main narrative — from fusion.synthesis, max 2–3 sentences */}
        <p className="text-center text-sm leading-relaxed text-white/75 max-w-[260px]">
          {data.fusion.synthesis}
        </p>
      </motion.div>
    </motion.div>
  );
}
```

**Step 4: Run test**

```bash
npx vitest run src/__tests__/day-mode-modal.test.tsx
```
Expected: PASS, 4 tests.

**Step 5: Run full suite**

```bash
npm run test
```
Expected: all passing.

**Step 6: Commit**

```bash
git add src/components/dashboard/DayModeModal.tsx src/__tests__/day-mode-modal.test.tsx
git commit -m "feat(day-mode): DayModeModal — Pulse/Trace daily experience, replaces DailyHoroscopeModal"
```

---

## Task 7: Dashboard — wire DayModeModal, deprecate DailyHoroscopeModal

**Files:**
- Modify: `src/components/Dashboard.tsx`

**Context:** Dashboard currently renders `DailyHoroscopeModal` from `useFirstRunDaily`. Swap to `DayModeModal`. The old component stays in the repo (marked deprecated in a comment) until its tests are migrated.

**Step 1: Find current DailyHoroscopeModal usage in Dashboard**

```bash
grep -n "DailyHoroscopeModal\|useFirstRunDaily\|showModal\|dailyData" src/components/Dashboard.tsx | head -10
```

**Step 2: Update imports in Dashboard.tsx**

Replace:
```typescript
import { DailyHoroscopeModal } from './dashboard/DailyHoroscopeModal';
```
With:
```typescript
import { DayModeModal } from './dashboard/DayModeModal';
```

**Step 3: Add dayHarmonic to the useFirstRunDaily destructure**

```typescript
// Before:
const { dailyData, showModal, loading, handleClose } = useFirstRunDaily(...)

// After:
const { dailyData, dayHarmonic, showModal, loading, handleClose } = useFirstRunDaily(...)
```

**Step 4: Replace the modal JSX**

Find the `<DailyHoroscopeModal` render and replace with:

```tsx
{showModal && dailyData && (
  <AnimatePresence>
    <DayModeModal
      data={dailyData}
      dayHarmonic={dayHarmonic}
      onClose={handleClose}
    />
  </AnimatePresence>
)}
```

**Step 5: Run lint**

```bash
npm run lint
```
Expected: 0 errors.

**Step 6: Run full test suite**

```bash
npm run test
```
Expected: all passing. (The old `DailyHoroscopeModal` tests may now fail if they import from Dashboard — check and update if needed.)

**Step 7: Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "feat(day-mode): wire DayModeModal into Dashboard, retire DailyHoroscopeModal"
```

---

## Task 8: LLM Layer — mode-aware prompt differentiation (stub extension)

**Files:**
- Modify: `src/lib/horoscope/llm-layer.ts`

**Context:** The LLM layer is currently a stub (Sprint 6 placeholder). We extend the `LLMEnrichmentInput` type and stub to accept `day_mode` so it's wired when the real Gemini call is implemented. No test needed — it's still a stub.

**Step 1: Update LLMEnrichmentInput in types.ts**

In `src/lib/horoscope/types.ts`, add to `LLMEnrichmentInput`:

```typescript
export interface LLMEnrichmentInput {
  template_horoscope: DailyHoroscope;
  resonance_data: SectorResonance[];
  ring_context?: string;
  lang: 'de' | 'en';
  /** Day mode — drives prompt framing: pulse = atmospheric, trace = directed */
  day_mode: 'pulse' | 'trace';
  /** Normalized intensity [0,1] — how strong the day signal is */
  day_intensity: number;
}
```

**Step 2: Add the prompt comment block to enrichWithLLM stub**

In `src/lib/horoscope/llm-layer.ts`, update the stub comment to document the future prompt structure:

```typescript
export async function enrichWithLLM(
  input: LLMEnrichmentInput,
): Promise<LLMEnrichmentOutput> {
  // Sprint 6: Replace with Gemini 2.0 Flash call.
  //
  // PROMPT FRAMING by day_mode:
  //
  // mode === 'pulse':
  //   "Schreibe 2 Sätze im Stil 'Poetic Realism'. Keine Astrologie-Fachbegriffe.
  //    Ton: atmosphärisch, einladend, sensorisch. Verwende ein konkretes Alltagsbild.
  //    Zeige wie Resonanz und Rhythmus sich heute im Leben anfühlen.
  //    Beispiel: 'Wenn du heute eine Parkbank siehst, die frei ist, setz dich.'
  //    Intensity: ${input.day_intensity.toFixed(2)}"
  //
  // mode === 'trace':
  //   "Schreibe 2 Sätze im Stil 'Poetic Realism'. Keine Astrologie-Fachbegriffe.
  //    Ton: direkt, konkret, leicht aufgeladen. Etwas passiert heute wirklich.
  //    Verwende ein spezifisches Bild oder eine Situation.
  //    Kein 'weil'. Keine Erklärung. Nur: was ist heute.
  //    Beispiel: 'Dein detektivischer Skorpion bekommt heute was zu tun.'
  //    Intensity: ${input.day_intensity.toFixed(2)}"

  return {
    headline: input.template_horoscope.headline,
    body: input.template_horoscope.body,
    advice: input.template_horoscope.advice,
    levi_note: undefined,
  };
}
```

**Step 3: Run lint**

```bash
npm run lint
```
Expected: 0 errors.

**Step 4: Commit**

```bash
git add src/lib/horoscope/llm-layer.ts src/lib/horoscope/types.ts
git commit -m "feat(day-mode): extend LLM layer stub with mode-aware prompt documentation"
```

---

## Task 9: Final verification + push to V3 branch

**Step 1: Full test suite**

```bash
npm run test
```
Expected: all tests passing (should be ~800+ tests).

**Step 2: TypeScript check**

```bash
npm run lint
```
Expected: 0 errors.

**Step 3: Push to V3 branch**

```bash
git push origin feature/fusion-ring-integration-v3
```

**Step 4: Verify on remote**

```bash
git log --oneline origin/feature/fusion-ring-integration-v3 | head -10
```
Expected: all Day-Pulse/Trace commits visible.

---

## Done-Conditions

| Task | Done when |
|------|-----------|
| Schema | `DailyResponseSchema.safeParse` accepts `{ harmony_index, day_mode }` |
| Server | `/api/experience/daily` response always has `day_mode` field |
| V3 Engine | `computeDayHarmonic(0.62).mode === 'trace'`, Pulse/Trace tests pass |
| Canvas | `SignaturV3Canvas` accepts `dayHarmonic` prop without TS errors |
| Hook | `useFirstRunDaily` returns `dayHarmonic` field |
| Modal | `DayModeModal` renders DAY-PULSE or DAY-TRACE, no tabs |
| Dashboard | Old `DailyHoroscopeModal` no longer rendered |
| LLM | `LLMEnrichmentInput` has `day_mode` + `day_intensity` |
| All | `npm run test` + `npm run lint` both clean |

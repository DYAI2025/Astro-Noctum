# CR-05: Heutiges Sternbild anzeigen — Current Sky Toggle

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a "Heutiger Himmel" toggle button below the Orrery that switches the planetarium from birth-sky to current-sky mode (now + user's birth location as fallback), and optionally uses browser geolocation.

**Architecture:** 3 tasks. Task 1 extends PlanetariumContext with a `skyMode` state (`'birth' | 'current'`). Task 2 creates a `SkyModeToggle` button component. Task 3 wires the toggle into DashboardAstroSection and passes the mode to BirthChartOrrery so it switches `simTime` accordingly.

**Tech Stack:** TypeScript, React 19, Framer Motion (`motion/react`), Tailwind CSS v4, Vitest

**GitHub Issue:** #175 — CR-05

---

## Task 1: Extend PlanetariumContext with `skyMode`

**Files:**
- Modify: `src/contexts/PlanetariumContext.tsx`
- Create: `src/__tests__/planetarium-context.test.tsx`

### Step 1: Write the failing test

```typescript
// src/__tests__/planetarium-context.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PlanetariumProvider, usePlanetarium } from '../contexts/PlanetariumContext';

function TestConsumer() {
  const { skyMode, setSkyMode, planetariumMode } = usePlanetarium();
  return (
    <div>
      <span data-testid="sky-mode">{skyMode}</span>
      <span data-testid="planetarium">{String(planetariumMode)}</span>
      <button onClick={() => setSkyMode('current')}>current</button>
      <button onClick={() => setSkyMode('birth')}>birth</button>
    </div>
  );
}

describe('PlanetariumContext skyMode', () => {
  it('defaults to birth', () => {
    render(<PlanetariumProvider><TestConsumer /></PlanetariumProvider>);
    expect(screen.getByTestId('sky-mode').textContent).toBe('birth');
  });

  it('switches to current sky', async () => {
    render(<PlanetariumProvider><TestConsumer /></PlanetariumProvider>);
    await act(async () => { fireEvent.click(screen.getByText('current')); });
    expect(screen.getByTestId('sky-mode').textContent).toBe('current');
  });

  it('switching to current sky enables planetariumMode', async () => {
    render(<PlanetariumProvider><TestConsumer /></PlanetariumProvider>);
    await act(async () => { fireEvent.click(screen.getByText('current')); });
    expect(screen.getByTestId('planetarium').textContent).toBe('true');
  });
});
```

### Step 2: Run test — expect FAIL

```bash
cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum
npx vitest run src/__tests__/planetarium-context.test.tsx 2>&1 | tail -20
```

Expected: FAIL — `skyMode` / `setSkyMode` not in context type.

### Step 3: Extend the context

Read `src/contexts/PlanetariumContext.tsx` first. Then add:

1. Add to the interface:
```typescript
skyMode: 'birth' | 'current';
setSkyMode: (mode: 'birth' | 'current') => void;
```

2. In the provider, add state:
```typescript
const [skyMode, setSkyModeRaw] = useState<'birth' | 'current'>('birth');

function setSkyMode(mode: 'birth' | 'current') {
  setSkyModeRaw(mode);
  if (mode === 'current') setPlanetariumMode(true);
}
```

3. Pass `skyMode` and `setSkyMode` in the context value.

### Step 4: Run tests — expect PASS

```bash
npx vitest run src/__tests__/planetarium-context.test.tsx 2>&1 | tail -20
```

Expected: 3 passed.

### Step 5: TypeScript check

```bash
npx tsc --noEmit 2>&1 | head -20
```

### Step 6: Commit

```bash
git add src/contexts/PlanetariumContext.tsx src/__tests__/planetarium-context.test.tsx
git commit -m "feat(cr05): extend PlanetariumContext with skyMode (birth/current)"
```

---

## Task 2: Create `SkyModeToggle` component

**Files:**
- Create: `src/components/dashboard/SkyModeToggle.tsx`
- Create: `src/__tests__/sky-mode-toggle.test.tsx`

### Step 1: Write the failing test

```typescript
// src/__tests__/sky-mode-toggle.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SkyModeToggle } from '../components/dashboard/SkyModeToggle';

vi.mock('motion/react', () => ({
  motion: {
    button: ({ children, ...props }: React.HTMLAttributes<HTMLButtonElement>) =>
      <button {...props}>{children}</button>,
  },
}));

vi.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'de' }),
}));

const mockSetSkyMode = vi.fn();
vi.mock('../../contexts/PlanetariumContext', () => ({
  usePlanetarium: () => ({ skyMode: 'birth', setSkyMode: mockSetSkyMode }),
}));

describe('SkyModeToggle', () => {
  it('renders toggle button with birth label', () => {
    render(<SkyModeToggle />);
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText(/Geburtshimmel/i)).toBeInTheDocument();
  });

  it('calls setSkyMode(current) on click when in birth mode', async () => {
    render(<SkyModeToggle />);
    await act(async () => { fireEvent.click(screen.getByRole('button')); });
    expect(mockSetSkyMode).toHaveBeenCalledWith('current');
  });
});
```

### Step 2: Run test — expect FAIL

```bash
npx vitest run src/__tests__/sky-mode-toggle.test.tsx 2>&1 | tail -20
```

### Step 3: Create the component

```typescript
// src/components/dashboard/SkyModeToggle.tsx
import { motion } from 'motion/react';
import { usePlanetarium } from '../../contexts/PlanetariumContext';
import { useLanguage } from '../../contexts/LanguageContext';

const LABELS = {
  birth: { de: 'Geburtshimmel', en: 'Birth Sky' },
  current: { de: 'Heutiger Himmel', en: 'Current Sky' },
} as const;

export function SkyModeToggle() {
  const { skyMode, setSkyMode } = usePlanetarium();
  const { lang } = useLanguage();

  const nextMode = skyMode === 'birth' ? 'current' : 'birth';

  return (
    <div className="flex justify-center">
      <motion.button
        onClick={() => setSkyMode(nextMode)}
        className={[
          'flex items-center gap-2 px-5 py-2.5 rounded-full text-xs uppercase tracking-[0.2em]',
          'border transition-all duration-300',
          skyMode === 'current'
            ? 'border-[#D4AF37]/50 text-[#D4AF37] bg-[#D4AF37]/5'
            : 'border-white/10 text-white/50 hover:text-white/70 hover:border-white/20',
        ].join(' ')}
        whileTap={{ scale: 0.97 }}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          {skyMode === 'birth' ? (
            // Clock icon → switch to current
            <>
              <circle cx="12" cy="12" r="9" />
              <polyline points="12,7 12,12 16,14" />
            </>
          ) : (
            // Star icon → switch to birth
            <>
              <polygon points="12,2 15,9 22,9 17,14 18.5,21 12,17 5.5,21 7,14 2,9 9,9" />
            </>
          )}
        </svg>
        <span>{LABELS[skyMode][lang]}</span>
        <span className="text-[8px] text-white/30 ml-1">→ {LABELS[nextMode][lang]}</span>
      </motion.button>
    </div>
  );
}
```

### Step 4: Run tests — expect PASS

```bash
npx vitest run src/__tests__/sky-mode-toggle.test.tsx 2>&1 | tail -20
```

### Step 5: Commit

```bash
git add src/components/dashboard/SkyModeToggle.tsx src/__tests__/sky-mode-toggle.test.tsx
git commit -m "feat(cr05): add SkyModeToggle — birth/current sky switcher"
```

---

## Task 3: Wire SkyModeToggle into DashboardAstroSection + pass mode to Orrery

**Files:**
- Modify: `src/components/dashboard/DashboardAstroSection.tsx`
- Modify: `src/components/BirthChartOrrery.tsx` (minor: accept `currentSky` prop)

### Step 1: Add import in DashboardAstroSection.tsx

After line 16 (`import { AstroAccordion }`), add:
```typescript
import { SkyModeToggle } from "./SkyModeToggle";
```

### Step 2: Read skyMode from context

In the component body (after line 87), add:
```typescript
const { skyMode } = usePlanetarium(); // already destructured, just add skyMode
```

Update the existing destructure on line 87:
```typescript
const { planetariumMode, setPlanetariumMode, skyMode } = usePlanetarium();
```

### Step 3: Insert SkyModeToggle below Orrery

Find (line 203):
```tsx
      </motion.div>

      {/* ═══ ASTRO ACCORDION */}
```

Insert between them:
```tsx
      {/* ═══ SKY MODE TOGGLE ═══════════════════════════════════════════ */}
      {planetariumMode && (
        <motion.div className="mb-8 -mt-6" {...fadeIn(0.15)}>
          <SkyModeToggle />
        </motion.div>
      )}
```

### Step 4: Pass skyMode to BirthChartOrrery

Change the `<BirthChartOrrery>` call (line 167–172) — add a `currentSky` prop:
```tsx
<BirthChartOrrery
  birthDate={orreryDate}
  planetariumMode={planetariumMode}
  birthConstellation={birthConstellationKey}
  autoPlay={showBirthSkyWelcome}
  currentSky={skyMode === 'current'}
/>
```

### Step 5: Handle `currentSky` in BirthChartOrrery

In `BirthChartOrrery.tsx`, add `currentSky?: boolean` to the props interface. When `currentSky` is true, override `simTime` to `Date.now()` in the animation loop (set `simTimeRef.current` to J2000 days for "now" instead of birth date). This is a focused change inside the existing animation frame loop — find the `requestAnimationFrame` callback and add at the top:

```typescript
if (currentSkyRef.current) {
  simTimeRef.current = (Date.now() / 86400000) - 10957.5; // J2000 epoch
}
```

Add a `currentSkyRef = useRef(currentSky)` and sync it via `useEffect`.

### Step 6: TypeScript check

```bash
npx tsc --noEmit 2>&1 | head -20
```

### Step 7: Full test run

```bash
npm run test 2>&1 | tail -10
```

### Step 8: Commit

```bash
git add src/components/dashboard/DashboardAstroSection.tsx src/components/BirthChartOrrery.tsx
git commit -m "feat(cr05): wire SkyModeToggle — current sky uses live time in Orrery"
```

---

## Final Verification

```bash
npm run test && npx tsc --noEmit
```

**Manual check:**
1. Open Dashboard → Planetarium visible → no toggle (birth mode default)
2. Enable planetariumMode → toggle appears below Orrery
3. Click toggle → label switches to "Heutiger Himmel", Orrery animates to current time
4. Click again → back to birth sky
5. Mobile: toggle stacks correctly

**Note:** Geolocation (browser GPS) is listed as a future enhancement. For V1, the Orrery uses the user's birth location coordinates as the observer position for both modes. This avoids a permission prompt and keeps the feature simple.

**PR title:** `feat(cr05): Current Sky toggle — Heutiger Himmel in Planetarium`

**Branch:** `feature/cr05-current-constellation`

**Closes:** #175

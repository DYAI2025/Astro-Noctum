# Repo-Cleanup & Dashboard-Split Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Clean dead weight from the repo (unused files + npm packages), split the 1093-line Dashboard.tsx into focused section components with error boundaries, and harden server.mjs for local dev.

**Architecture:** Three sequential phases — delete dead code, extract Dashboard sections into `src/components/dashboard/`, then clean up server.mjs. Each phase ends with a green build gate. No logic changes — only move and delete.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind v4, Express (server.mjs)

**Brief corrections applied:**
- `src/lib/3d/materials.ts` is **actively imported** by `BirthChartOrrery.tsx` — DO NOT DELETE
- `QuizErrorBoundary` takes `onClose` (not `fallback`) — need a new `SectionErrorBoundary` for Dashboard sections
- `/api/debug-bafe` already has a `NODE_ENV === "production"` guard — but the endpoint should be fully removed in prod builds (the current guard returns 404 but the route still exists)

---

## Phase 1 — Delete Dead Weight

### Task 1: Delete unused component files

**Files:**
- Delete: `src/components/ClusterEnergySystem.tsx`
- Delete: `src/hooks/useBirthChartOrrery.ts`

**Step 1: Verify no imports exist**

Run:
```bash
grep -r "ClusterEnergySystem" src/ --include="*.ts" --include="*.tsx" -l
grep -r "useBirthChartOrrery" src/ --include="*.ts" --include="*.tsx" -l
```
Expected: No results (only the files themselves, or docs/changelogs)

**Step 2: Delete the files**

```bash
rm src/components/ClusterEnergySystem.tsx
rm src/hooks/useBirthChartOrrery.ts
```

**Step 3: Commit**

```bash
git add -u
git commit -m "chore: remove dead ClusterEnergySystem and useBirthChartOrrery"
```

> **WARNING:** Do NOT delete `src/lib/3d/materials.ts` — it is actively imported by `BirthChartOrrery.tsx` (lines 27-31). The brief was wrong about this.

---

### Task 2: Uninstall unused npm packages

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

**Step 1: Uninstall heavy unused packages**

```bash
npm uninstall pixi.js @react-three/postprocessing postprocessing
```

**Step 2: Verify no code imports them**

```bash
grep -r "pixi" src/ --include="*.ts" --include="*.tsx" -l
grep -r "postprocessing" src/ --include="*.ts" --include="*.tsx" -l
```
Expected: `postprocessing` might appear in `test-setup.tsx` as a mock — if so, remove that mock entry too.

**Step 3: If test-setup.tsx has a postprocessing mock, remove it**

Read `src/test-setup.tsx` (or similar). Remove any `vi.mock('@react-three/postprocessing', ...)` or `vi.mock('postprocessing', ...)` blocks.

**Step 4: Commit**

```bash
git add package.json package-lock.json src/test-setup.tsx
git commit -m "chore: remove unused pixi.js and postprocessing packages"
```

---

### Task 3: Phase 1 build gate

**Step 1: Run the build**

```bash
npm run build
```
Expected: 0 errors. Warnings for unused imports are acceptable.

**Step 2: Run the type check**

```bash
npm run lint
```
Expected: 0 errors (pre-existing `allquizzes/quizzme-module-loader.ts:298` error is outside `src/` and excluded from build).

**Step 3: If build fails, fix any broken imports referencing deleted files and re-run**

---

## Phase 2 — Dashboard.tsx Split

### Task 4: Create SectionErrorBoundary component

The existing `QuizErrorBoundary` requires `onClose` (quiz-specific). Dashboard sections need a simpler boundary with inline fallback.

**Files:**
- Create: `src/components/dashboard/SectionErrorBoundary.tsx`

**Step 1: Write the failing test**

Create `src/__tests__/section-error-boundary.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SectionErrorBoundary } from '../components/dashboard/SectionErrorBoundary';

const ThrowingChild = () => { throw new Error('boom'); };

describe('SectionErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <SectionErrorBoundary name="Test">
        <p>content</p>
      </SectionErrorBoundary>
    );
    expect(screen.getByText('content')).toBeTruthy();
  });

  it('renders fallback with section name on error', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <SectionErrorBoundary name="Astro">
        <ThrowingChild />
      </SectionErrorBoundary>
    );
    expect(screen.getByText(/Astro/)).toBeTruthy();
    expect(screen.getByText(/nicht geladen/)).toBeTruthy();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/__tests__/section-error-boundary.test.tsx
```
Expected: FAIL — module not found

**Step 3: Create the component**

Create `src/components/dashboard/SectionErrorBoundary.tsx`:

```tsx
import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface Props {
  name: string;
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class SectionErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn(`[${this.props.name}] Section failed:`, error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-red-400/20 bg-red-950/20 p-4 text-xs text-red-300">
          {this.props.name} konnte nicht geladen werden.
        </div>
      );
    }
    return this.props.children;
  }
}
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/__tests__/section-error-boundary.test.tsx
```
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/dashboard/SectionErrorBoundary.tsx src/__tests__/section-error-boundary.test.tsx
git commit -m "feat: add SectionErrorBoundary for Dashboard section isolation"
```

---

### Task 5: Extract DashboardLeviSection

Start with Levi because it's the most self-contained: it owns its own state (`leviActive`, `leviUpgrading`) and handlers.

**Files:**
- Create: `src/components/dashboard/DashboardLeviSection.tsx`
- Modify: `src/components/Dashboard.tsx`

**Step 1: Create DashboardLeviSection**

Create `src/components/dashboard/DashboardLeviSection.tsx`. This component takes over:
- State: `leviActive` (line 246), `leviUpgrading` (line 247)
- Handlers: `handleLeviUpgrade` (line 249-262), `handleCallLevi` (line 290-293), `handleHangUp` (line 295)
- useEffect: ElevenLabs widget script loader (lines 281-288)
- Ref: `leviSectionRef` (line 263)
- JSX: Lines 1016-1079 from Dashboard.tsx (the Levi 1/3-width column)

```tsx
import { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Lock } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const elevenLabsAgentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID || '';

interface DashboardLeviSectionProps {
  isPremium: boolean;
  userId: string;
  onStopAudio: () => void;
  onResumeAudio: () => void;
  sunSign: string;
  zodiacAnimal: string;
  dominantEl: string;
}

export function DashboardLeviSection({
  isPremium,
  userId,
  onStopAudio,
  onResumeAudio,
  sunSign,
  zodiacAnimal,
  dominantEl,
}: DashboardLeviSectionProps) {
  const { t } = useLanguage();
  const [leviActive, setLeviActive] = useState(false);
  const [leviUpgrading, setLeviUpgrading] = useState(false);
  const leviSectionRef = useRef<HTMLDivElement>(null);

  const handleLeviUpgrade = async () => {
    setLeviUpgrading(true);
    try {
      const res = await (await import('@/src/lib/authedFetch')).authedFetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
      else setLeviUpgrading(false);
    } catch {
      setLeviUpgrading(false);
    }
  };

  const handleCallLevi = () => {
    onStopAudio();
    setLeviActive(true);
    setTimeout(() => leviSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
  };

  const handleHangUp = () => {
    setLeviActive(false);
    onResumeAudio();
  };

  useEffect(() => {
    if (!document.querySelector('script[src="https://unpkg.com/@elevenlabs/convai-widget-embed"]')) {
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
      s.async = true;
      s.type = 'text/javascript';
      document.body.appendChild(s);
    }
  }, []);

  return (
    <div
      ref={leviSectionRef}
      className="morning-card p-5 sm:p-7 flex flex-col gap-5 sm:gap-6"
      style={{ backdropFilter: 'none', WebkitBackdropFilter: 'none', overflow: 'visible' }}
    >
      <div className="flex items-start gap-4">
        <div className="relative mt-1.5 shrink-0">
          <div className={`w-2 h-2 rounded-full breathing ${
            leviActive
              ? 'bg-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.75)]'
              : 'bg-[#8B6914] shadow-[0_0_8px_rgba(139,105,20,0.55)]'
          }`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#8B6914] mb-1.5 font-semibold">
            {leviActive ? t('dashboard.levi.active') : t('dashboard.levi.ready')}
          </p>
          <p className="text-[11px] text-[#1E2A3A]/45 italic leading-relaxed">
            {leviActive ? t('dashboard.levi.activeDesc') : t('dashboard.levi.readyDesc')}
          </p>
        </div>
      </div>

      {isPremium ? (
        <>
          <button
            onClick={leviActive ? handleHangUp : handleCallLevi}
            className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-full text-[10px] uppercase tracking-[0.2em] font-semibold transition-all ${
              leviActive
                ? 'bg-red-50 border border-red-300 text-red-600 hover:bg-red-100'
                : 'bg-[#8B6914]/10 border border-[#8B6914]/30 text-[#8B6914] hover:bg-[#8B6914]/[0.18]'
            }`}
          >
            {leviActive
              ? <><PhoneOff className="w-4 h-4" /> {t('dashboard.levi.hangUpBtn')}</>
              : <><Phone className="w-4 h-4" /> {t('dashboard.levi.callBtn')}</>}
          </button>

          <div className="mt-4">
            {leviActive && (
              <div className="relative z-[9999] w-full flex justify-center">
                {/* @ts-ignore */}
                <elevenlabs-convai
                  agent-id={elevenLabsAgentId}
                  dynamic-variables={JSON.stringify({
                    user_id: userId,
                    chart_context: `${sunSign} / ${zodiacAnimal} / ${dominantEl}`,
                  })}
                >
                {/* @ts-ignore */}
                </elevenlabs-convai>
              </div>
            )}
          </div>
        </>
      ) : (
        <button
          onClick={handleLeviUpgrade}
          disabled={leviUpgrading}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-full text-[10px] uppercase tracking-[0.2em] font-semibold bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 transition-all disabled:opacity-60 disabled:cursor-wait"
        >
          {leviUpgrading ? '...' : <><Lock className="w-4 h-4" /> {t('dashboard.premium.cta')}</>}
        </button>
      )}
    </div>
  );
}
```

**Step 2: Update Dashboard.tsx — remove Levi code, import new section**

In `Dashboard.tsx`:

1. Add import at top:
   ```tsx
   import { DashboardLeviSection } from './dashboard/DashboardLeviSection';
   import { SectionErrorBoundary } from './dashboard/SectionErrorBoundary';
   ```

2. Remove from Dashboard component body:
   - State: `leviActive`, `leviUpgrading` (lines 246-247)
   - Handler: `handleLeviUpgrade` (lines 249-262)
   - Ref: `leviSectionRef` (line 263)
   - useEffect: ElevenLabs script loader (lines 281-288)
   - Handlers: `handleCallLevi`, `handleHangUp` (lines 290-295)

3. Remove imports that are now only used by Levi (check if still used elsewhere first):
   - `Phone`, `PhoneOff`, `Lock` from lucide-react — check if used elsewhere in Dashboard. If only in Levi JSX, remove from Dashboard imports.

4. Replace JSX at lines 1016-1079 (the Levi column inside the INTERPRETATION + LEVI grid) with:
   ```tsx
   <SectionErrorBoundary name="Levi">
     <DashboardLeviSection
       isPremium={isPremium}
       userId={userId}
       onStopAudio={onStopAudio}
       onResumeAudio={onResumeAudio}
       sunSign={sunSign}
       zodiacAnimal={zodiacAnimal}
       dominantEl={dominantEl}
     />
   </SectionErrorBoundary>
   ```

5. Also remove `onStopAudio` from the Dashboard destructured props ONLY IF it's not used elsewhere. (It IS used elsewhere — by `handleCallLevi` which is moving to Levi — but check for other usages. The prop should stay in DashboardProps because the parent passes it.)

**Step 3: Run build to verify**

```bash
npm run build
```
Expected: 0 errors

**Step 4: Commit**

```bash
git add src/components/dashboard/DashboardLeviSection.tsx src/components/Dashboard.tsx
git commit -m "refactor: extract DashboardLeviSection from Dashboard"
```

---

### Task 6: Extract DashboardAstroSection

This extracts the Orrery + Western Signs (Sun/Moon/Ascendant) + BaZi/WuXing primary grid + BaZi Deep Section + Houses.

**Files:**
- Create: `src/components/dashboard/DashboardAstroSection.tsx`
- Modify: `src/components/Dashboard.tsx`

**Step 1: Identify the JSX range**

The astro section spans from `═══ 3D ORRERY ═══` (line 459) through end of `═══ WESTERN HOUSES ═══` (line 967). This includes:
- 3D Orrery + Birth Sky Welcome banner (459-497)
- PRIMARY GRID: Western Signs + BaZi/WuXing (499-800)
- BaZi & WuXing Deep Section (802-896)
- Western Houses (898-967)

**Step 2: Create `src/components/dashboard/DashboardAstroSection.tsx`**

This component receives all the data it needs as props. Move the following from Dashboard.tsx:
- All the data extraction variables (lines 299-390): `sunSign`, `moonSign`, `ascendantSign`, `zodiacAnimal`, `dayMaster`, `monthStem`, all the `useMemo` calls, `wuxingCounts`, `hasWuxingData`, etc.
- The `orreryDate` computation
- All helper variables: `sunEmoji`, `moonEmoji`, `ascEmoji`, sign names, etc.
- The `elevenLabsAgentId` const (if needed — actually this stays with Levi)
- Birth sky welcome state + effect: `showBirthSkyWelcome`, `setShowBirthSkyWelcome`, the isFirstReading useEffect

Props interface:
```tsx
interface DashboardAstroSectionProps {
  apiData: ApiData;
  birthDate: string | null;
  isPremium: boolean;
  isFirstReading: boolean;
  tileTexts?: TileTexts;
  houseTexts?: HouseTexts;
  lang: 'de' | 'en';
}
```

Move these imports from Dashboard to DashboardAstroSection:
- `Link` from react-router-dom
- `AnimatePresence` from motion/react (if only used in orrery section — check)
- `ArrowUp` from lucide-react (if only used in WuXing detail link — check)
- `BirthChartOrrery`
- `WUXING_ELEMENTS`, `getWuxingByKey`, `getWuxingName`
- `getBranchByAnimal`
- `getCoinAsset`
- `getZodiacSign`, `getSignName`
- `getConstellationForSign`
- `Tooltip`
- `BaZiFourPillars`
- `BaZiInterpretation`
- `getStemByCharacter`
- `ExpandableText`
- `getZodiacArt`
- `usePlanetarium` (used for planetariumMode in this section)

The JSX is lines 459-967 — move it wholesale into this new component's return.

**Step 3: Update Dashboard.tsx**

1. Remove the moved code (data extraction, JSX lines 459-967)
2. Remove imports that moved to DashboardAstroSection
3. Replace with:
   ```tsx
   <SectionErrorBoundary name="Astro">
     <DashboardAstroSection
       apiData={apiData}
       birthDate={birthDate}
       isPremium={isPremium}
       isFirstReading={isFirstReading}
       tileTexts={tileTexts}
       houseTexts={houseTexts}
       lang={lang}
     />
   </SectionErrorBoundary>
   ```

**Step 4: Run build**

```bash
npm run build
```
Expected: 0 errors

**Step 5: Commit**

```bash
git add src/components/dashboard/DashboardAstroSection.tsx src/components/Dashboard.tsx
git commit -m "refactor: extract DashboardAstroSection from Dashboard"
```

---

### Task 7: Extract DashboardInterpretationSection

The AI interpretation block (lines 969-1014) is tightly coupled to interpretation text. Extract it as its own section.

**Files:**
- Create: `src/components/dashboard/DashboardInterpretationSection.tsx`
- Modify: `src/components/Dashboard.tsx`

**Step 1: Create the component**

```tsx
import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { PremiumGate } from '../PremiumGate';
import { useLanguage } from '../../contexts/LanguageContext';

interface DashboardInterpretationSectionProps {
  interpretation: string;
  isPremium: boolean;
}

export function DashboardInterpretationSection({
  interpretation,
  isPremium,
}: DashboardInterpretationSectionProps) {
  const { t } = useLanguage();

  const interpretationParagraphs = useMemo(
    () => interpretation?.split('\n\n') || [],
    [interpretation],
  );
  const freeInterpretation = useMemo(
    () => interpretationParagraphs.slice(0, 2).join('\n\n'),
    [interpretationParagraphs],
  );
  const hasPremiumInterpretation = interpretationParagraphs.length > 2;

  const proseClasses = `
    text-[13px] text-[#1E2A3A]/60 leading-relaxed
    prose prose-sm max-w-none
    prose-headings:text-[#1E2A3A] prose-headings:font-serif
    prose-p:text-[#1E2A3A]/60 prose-strong:text-[#1E2A3A]/80
    prose-a:text-[#8B6914] prose-a:no-underline hover:prose-a:underline
    prose-hr:border-[#8B6914]/15
  `;

  return (
    <div className="morning-card p-5 sm:p-8 md:col-span-2">
      <div className="flex items-center gap-4 mb-5">
        <span className="h-[1px] w-10 bg-[#8B6914]/20" />
        <span className="text-[9px] uppercase tracking-[0.4em] text-[#8B6914]/55">
          {t('dashboard.interpretation.sectionLabel')}
        </span>
      </div>
      <h3 className="font-serif text-2xl text-[#1E2A3A] mb-5">
        {t('dashboard.interpretation.sectionTitle')}
      </h3>

      <div className={proseClasses}>
        <ReactMarkdown>{isPremium ? interpretation : freeInterpretation}</ReactMarkdown>
      </div>

      {!isPremium && hasPremiumInterpretation && (
        <PremiumGate teaser={t('dashboard.premium.teaserInterpretation')}>
          <div className={`${proseClasses} mt-4`}>
            <ReactMarkdown>{interpretationParagraphs.slice(2).join('\n\n')}</ReactMarkdown>
          </div>
        </PremiumGate>
      )}
    </div>
  );
}
```

**Step 2: Update Dashboard.tsx**

Replace the AI interpretation `<div className="morning-card p-5 sm:p-8 md:col-span-2">` block (lines 975-1013) with:
```tsx
<SectionErrorBoundary name="Interpretation">
  <DashboardInterpretationSection
    interpretation={interpretation}
    isPremium={isPremium}
  />
</SectionErrorBoundary>
```

Remove `ReactMarkdown` import and `interpretationParagraphs`/`freeInterpretation`/`hasPremiumInterpretation` computations from Dashboard if no longer used there.

**Step 3: Run build**

```bash
npm run build
```
Expected: 0 errors

**Step 4: Commit**

```bash
git add src/components/dashboard/DashboardInterpretationSection.tsx src/components/Dashboard.tsx
git commit -m "refactor: extract DashboardInterpretationSection from Dashboard"
```

---

### Task 8: Verify Dashboard line count and Phase 2 build gate

**Step 1: Check Dashboard.tsx line count**

```bash
wc -l src/components/Dashboard.tsx
```
Expected: ~200-300 lines (down from 1093). The Dashboard should now be a thin orchestrator.

**Step 2: Full build check**

```bash
npm run build
```
Expected: 0 errors

**Step 3: Type check**

```bash
npm run lint
```
Expected: 0 errors in `src/`

**Step 4: Run tests**

```bash
npm run test
```
Expected: All existing tests pass + new SectionErrorBoundary test passes

**Step 5: Commit if any cleanup was needed**

---

## Phase 3 — server.mjs Cleanup

### Task 9: Guard debug-bafe endpoint behind NODE_ENV

The endpoint already returns 404 in production (line 685-687), but the route registration still exists. Wrap the entire `app.get` in a NODE_ENV check so the route doesn't register at all in production.

**Files:**
- Modify: `server.mjs`

**Step 1: Wrap the debug-bafe endpoint**

In `server.mjs`, find the block at lines 684-733. Wrap it:

```javascript
// Before (line 684):
app.get("/api/debug-bafe", async (_req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ error: "Not found" });
  }
  // ...
});

// After:
if (process.env.NODE_ENV !== "production") {
  app.get("/api/debug-bafe", async (_req, res) => {
    // ... (remove the inner production guard since outer guard handles it)
  });
}
```

**Step 2: Commit**

```bash
git add server.mjs
git commit -m "chore: guard debug-bafe route registration behind NODE_ENV"
```

---

### Task 10: Remove redundant top-level Stripe import

**Files:**
- Modify: `server.mjs`

**Step 1: Verify Stripe usage**

The top-level import at line 7 (`import Stripe from "stripe"`) imports the class. At line 748-750, it's used as `new Stripe(...)`. Since `Stripe` is the default export, the top-level import is needed for the line 748 usage. However, the brief suggests making it lazy to prevent crashes if `stripe` is not installed.

Change lines 7 and 748-750:

```javascript
// Line 7: Remove the static import
// import Stripe from "stripe";  <-- DELETE THIS LINE

// Lines 748-750: Replace with dynamic import
const stripe = process.env.STRIPE_SECRET_KEY
  ? new (await import("stripe")).default(process.env.STRIPE_SECRET_KEY)
  : null;
```

**Important:** `server.mjs` uses top-level `await` — verify the file uses ESM (it does — `import` statements throughout). Top-level `await` is valid in ESM.

**Step 2: Verify server still starts**

```bash
NODE_ENV=development node server.mjs &
sleep 2
curl -s http://localhost:3000/ | head -5
kill %1
```
Expected: Server starts, serves HTML

**Step 3: Commit**

```bash
git add server.mjs
git commit -m "chore: lazy-import Stripe to prevent crash when package missing"
```

---

### Task 11: Soften process.exit for local development

**Files:**
- Modify: `server.mjs`

**Step 1: Update the REQUIRED_ENV_VARS check (lines 17-23)**

Replace:
```javascript
const REQUIRED_ENV_VARS = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missing = REQUIRED_ENV_VARS.filter(v => !process.env[v]);
if (missing.length > 0 && process.env.NODE_ENV !== "test") {
  console.error(`[server] Missing required environment variables: ${missing.join(', ')}`);
  console.error('[server] Copy .env.example to .env and fill in the required values.');
  process.exit(1);
}
```

With:
```javascript
const REQUIRED_ENV_VARS = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missing = REQUIRED_ENV_VARS.filter(v => !process.env[v]);
if (missing.length > 0 && !['test', 'development'].includes(process.env.NODE_ENV)) {
  console.error(`[server] Missing required environment variables: ${missing.join(', ')}`);
  console.error('[server] Copy .env.example to .env and fill in the required values.');
  process.exit(1);
}
if (missing.length > 0) {
  console.warn(`[server] WARNING: Missing env vars (dev mode): ${missing.join(', ')}`);
}
```

**Step 2: Verify server starts in dev mode without env vars**

```bash
NODE_ENV=development node server.mjs &
sleep 2
# Should see: [server] WARNING: Missing env vars (dev mode): ...
# Server should NOT crash
kill %1 2>/dev/null
```

**Step 3: Commit**

```bash
git add server.mjs
git commit -m "chore: soft-warn on missing env vars in development mode"
```

---

### Task 12: Add TODO comment for transit-state endpoint

**Files:**
- Modify: `server.mjs`

**Step 1: Find the transit-state endpoint and add comment**

Find the line with `app.get('/api/transit-state/:userId'` (around line 430) and add a comment above it:

```javascript
// TODO(Brief-02): This GET handler will be replaced by the new POST proxy.
// The fallback block (fallbackStateFromProfile + respondWithFallback) stays
// as fallback in the new handler.
app.get('/api/transit-state/:userId', ...
```

**Step 2: Commit**

```bash
git add server.mjs
git commit -m "chore: add TODO comment for transit-state endpoint (Brief-02)"
```

---

### Task 13: Phase 3 verification — full start check

**Step 1: Build**

```bash
npm run build
```
Expected: 0 errors

**Step 2: Start server in dev mode**

```bash
NODE_ENV=development node server.mjs &
sleep 2
```
Expected: Server starts without crash, prints warning about missing env vars, listens on port 3000.

**Step 3: Kill test server**

```bash
kill %1 2>/dev/null
```

**Step 4: Run all tests**

```bash
npm run test
```
Expected: All tests pass

---

## Summary

| Phase | Tasks | What happens |
|-------|-------|-------------|
| **1 — Delete** | 1-3 | Remove ClusterEnergySystem, useBirthChartOrrery, pixi.js, postprocessing |
| **2 — Split** | 4-8 | SectionErrorBoundary + DashboardLeviSection + DashboardAstroSection + DashboardInterpretationSection |
| **3 — Server** | 9-13 | debug-bafe guard, lazy Stripe, soft process.exit, transit-state TODO |

**NOT in scope:** Transit-API-Fix (Brief 02), SOUL_PROFILE (Brief 01), Quiz-Contributions (Brief 03). This plan is structure cleanup only — no feature changes.

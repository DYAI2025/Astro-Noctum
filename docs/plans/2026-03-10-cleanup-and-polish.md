# Cleanup & Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix remaining code review issues: convert coin PNGs to WebP, type `apiData` properly, remove duplicate close buttons in quiz overlay, add 404 route, add WuXing empty state, and exclude stale `features/` from tsc.

**Architecture:** Mostly surgical edits — type narrowing in context/App, a build-time image conversion, one new React component for 404, and minor template changes in WuXingPage and QuizOverlay/KinkySeriesQuiz.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind v4, sharp (for WebP conversion)

---

### Task 1: Convert coin PNGs to WebP

Coin images in `public/coins/` total ~4.5MB as PNG. WebP typically gives 60-80% savings.

**Files:**
- Modify: `public/coins/1.png` through `public/coins/12.png` (replace with `.webp`)
- Modify: `src/components/Dashboard.tsx` (update image references)
- Modify: any other files referencing `/coins/*.png`

**Step 1: Install sharp as a dev dependency**

```bash
npm install --save-dev sharp
```

**Step 2: Create a one-shot conversion script**

Create `scripts/convert-coins.mjs`:

```js
import sharp from 'sharp';
import { readdir } from 'fs/promises';
import { join } from 'path';

const dir = 'public/coins';
const files = (await readdir(dir)).filter(f => f.endsWith('.png'));

for (const file of files) {
  const src = join(dir, file);
  const dest = join(dir, file.replace('.png', '.webp'));
  await sharp(src).webp({ quality: 80 }).toFile(dest);
  console.log(`${file} → ${file.replace('.png', '.webp')}`);
}
```

**Step 3: Run the conversion**

```bash
node scripts/convert-coins.mjs
```

Expected: 12 `.webp` files appear in `public/coins/`, each significantly smaller than the PNG.

**Step 4: Verify WebP sizes are reasonable**

```bash
ls -lh public/coins/*.webp
```

Expected: Each file roughly 30-60% of original PNG size.

**Step 5: Find all references to coin PNGs in source code**

```bash
grep -rn '\.png' src/ --include='*.tsx' --include='*.ts' | grep -i coin
```

Update every reference from `.png` to `.webp`.

**Step 6: Delete original PNGs**

```bash
rm public/coins/*.png
```

**Step 7: Delete the conversion script**

```bash
rm scripts/convert-coins.mjs
npm uninstall sharp
```

**Step 8: Run lint to verify no broken references**

```bash
npm run lint
```

Expected: PASS (no new errors)

**Step 9: Commit**

```bash
git add public/coins/ src/ package.json package-lock.json
git commit -m "perf: convert coin PNGs to WebP (~60% size reduction)"
```

---

### Task 2: Type `apiData` properly (remove `any`)

`apiData` is `any` in `AppLayoutContext.tsx:6` and `App.tsx:44`. This defeats TypeScript's safety for the entire Dashboard and all sub-pages.

**Files:**
- Modify: `src/contexts/AppLayoutContext.tsx:6`
- Modify: `src/App.tsx:44`
- Reference: `src/types/bafe.ts` (existing mapped types)

**Step 1: Define the composite `ApiData` type**

Add to `src/types/bafe.ts` at the end:

```ts
/** Composite type for the full API response after mapping in api.ts */
export interface ApiData {
  bazi?: MappedBazi;
  western?: MappedWestern;
  wuxing?: MappedWuxing;
  fusion?: BafeFusionResponse;
  tst?: BafeTstResponse;
}
```

**Step 2: Update `AppLayoutContext.tsx`**

Change line 6 from:
```ts
apiData: any;
```
to:
```ts
apiData: ApiData;
```

Add the import at the top:
```ts
import type { ApiData } from '../types/bafe';
```

**Step 3: Update `App.tsx`**

Change line 44 from:
```ts
const [apiData, setApiData] = useState<any>(null);
```
to:
```ts
const [apiData, setApiData] = useState<ApiData | null>(null);
```

Add the import:
```ts
import type { ApiData } from './types/bafe';
```

**Step 4: Run lint to find type mismatches**

```bash
npm run lint
```

Expected: Possibly new errors where `apiData` is used without null checks. Fix each by adding `?.` optional chaining or narrowing checks. Common spots:
- `Dashboard.tsx` — accessing `apiData.bazi`, `apiData.western`, etc.
- `WuXingPage.tsx` — accessing `apiData.wuxing`
- `DashboardPage.tsx` — passing `apiData` to components

For each error, add a null guard or optional chain. Do NOT change the type back to `any`.

**Step 5: Run lint again to confirm clean**

```bash
npm run lint
```

Expected: Only pre-existing errors in `features/plan/` (not our code).

**Step 6: Commit**

```bash
git add src/types/bafe.ts src/contexts/AppLayoutContext.tsx src/App.tsx src/components/ src/pages/
git commit -m "refactor: type apiData as ApiData instead of any"
```

---

### Task 3: Remove duplicate close button in KinkySeriesQuiz

`QuizOverlay.tsx:119-140` renders an X close button. `KinkySeriesQuiz.tsx:540` renders its own `<CloseButton>`. When Kinky quizzes are open, two close buttons stack.

**Files:**
- Modify: `src/components/quizzes/Kinky/KinkySeriesQuiz.tsx:540`
- Reference: `src/components/QuizOverlay.tsx:118-140` (the canonical close button)

**Step 1: Remove `CloseButton` from KinkySeriesQuiz render**

In `KinkySeriesQuiz.tsx`, find line 540:
```tsx
<CloseButton onClick={onClose} />
```

Remove this line entirely. The `QuizOverlay` parent already provides the close button at the top-right.

**Step 2: Check if `CloseButton` component is used elsewhere in the file**

```bash
grep -n 'CloseButton' src/components/quizzes/Kinky/KinkySeriesQuiz.tsx
```

If it's only defined and used at line 540 (plus the function def at ~line 79), also remove the `CloseButton` function definition (lines 79-96 approximately) since it becomes dead code.

If `CloseButton` is used inside sub-screens (e.g., result screen), keep it there but remove only the one at the top level (line 540) since that's the duplicate.

**Step 3: Also check line 411**

Line 411 has another `onClick={onClose}` — check if this is inside a result screen's "Close" text button (not an X button). If it's a text button like "Schließen" or "Back to Dashboard", that's fine — it's not a duplicate X button. Leave it.

**Step 4: Run lint**

```bash
npm run lint
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/quizzes/Kinky/KinkySeriesQuiz.tsx
git commit -m "fix: remove duplicate close button in Kinky quiz overlay"
```

---

### Task 4: Add 404 catch-all route

Currently `src/router.tsx` has 3 routes (`/`, `/fu-ring`, `/wu-xing`) but no catch-all. Unknown URLs show a blank page.

**Files:**
- Modify: `src/router.tsx`

**Step 1: Add a 404 route**

In `src/router.tsx`, add a catch-all `Route` after the existing routes:

```tsx
import { lazy, Suspense } from 'react';
import { Routes, Route, Link } from 'react-router-dom';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const FuRingPage = lazy(() => import('./pages/FuRingPage'));
const WuXingPage = lazy(() => import('./pages/WuXingPage'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-1 h-1 bg-[#8B6914] rounded-full animate-ping" />
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
      <h1 className="font-serif text-2xl text-[#1E2A3A]">404</h1>
      <p className="text-sm text-[#1E2A3A]/50">Diese Seite existiert nicht.</p>
      <Link to="/" className="text-sm text-[#8B6914] hover:underline">
        Zum Dashboard →
      </Link>
    </div>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/fu-ring" element={<FuRingPage />} />
        <Route path="/wu-xing" element={<WuXingPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
```

**Step 2: Run lint**

```bash
npm run lint
```

Expected: PASS

**Step 3: Commit**

```bash
git add src/router.tsx
git commit -m "feat: add 404 catch-all route"
```

---

### Task 5: Add WuXing empty state when BAFE is unreachable

`WuXingPage.tsx` renders empty bars and 0% values when BAFE data is missing. Should show a clear message instead.

**Files:**
- Modify: `src/pages/WuXingPage.tsx`

**Step 1: Add empty state after the `hasWuxingData` check**

In `WuXingPage.tsx`, after the header section (~line 75), before the SVG visualizations grid (~line 78), add:

```tsx
{!hasWuxingData && (
  <div className="morning-card p-10 text-center mb-12">
    <p className="text-sm text-[#1E2A3A]/50">
      {lang === 'de'
        ? 'Wu-Xing-Daten sind derzeit nicht verfügbar. Bitte versuche es später erneut.'
        : 'Wu Xing data is currently unavailable. Please try again later.'}
    </p>
    <Link
      to="/"
      className="inline-block mt-4 text-sm text-[#8B6914] hover:underline"
    >
      {lang === 'de' ? '← Zum Dashboard' : '← Back to Dashboard'}
    </Link>
  </div>
)}
```

Then wrap the existing visualization grid and distribution section in `{hasWuxingData && (...)}` so they only render when data exists.

**Step 2: Run lint**

```bash
npm run lint
```

Expected: PASS

**Step 3: Commit**

```bash
git add src/pages/WuXingPage.tsx
git commit -m "fix: show empty state on WuXing page when BAFE data unavailable"
```

---

### Task 6: Exclude `features/plan/` from TypeScript checking

The `features/plan/QuizzMe-main/` directory contains standalone code with its own dependencies, causing 5+ tsc errors that pollute every lint run.

**Files:**
- Modify: `tsconfig.json:27-32`

**Step 1: Add `features/` to the exclude list**

In `tsconfig.json`, change the `exclude` array:

From:
```json
"exclude": [
  "node_modules",
  "vitest.config.ts",
  "src/test-setup.*",
  "src/__tests__/**/*"
]
```

To:
```json
"exclude": [
  "node_modules",
  "features",
  "vitest.config.ts",
  "src/test-setup.*",
  "src/__tests__/**/*"
]
```

**Step 2: Run lint to verify clean output**

```bash
npm run lint
```

Expected: Zero errors (the QuizzMe-main errors should be gone).

**Step 3: Commit**

```bash
git add tsconfig.json
git commit -m "chore: exclude features/ from tsc to remove stale lint errors"
```

---

## Summary

| Task | Type | Impact |
|------|------|--------|
| 1. Coin PNGs → WebP | perf | ~3MB bundle reduction |
| 2. Type `apiData` | refactor | removes `any` from data flow |
| 3. Duplicate close button | fix | UX: no stacked X buttons |
| 4. 404 route | feat | UX: meaningful page for bad URLs |
| 5. WuXing empty state | fix | UX: clear message when BAFE down |
| 6. Exclude features/ from tsc | chore | DX: clean lint output |

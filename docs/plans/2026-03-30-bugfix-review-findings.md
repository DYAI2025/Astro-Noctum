# Bugfix: Code Review Findings + Pre-Existing Test Failures

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all 6 pre-existing test failures + 3 code review findings from the Vibes and Quiz Generator reviews.

**Architecture:** All fixes are isolated edits — no new features, no refactoring. Tests get updated mocks, server.mjs gets defensive copies, VibesSection gets a fetch guard.

**Tech Stack:** Vitest, React Testing Library, TypeScript, server.mjs (Node)

---

### Task 1: Fix astro-accordion tests (4 failures)

**Files:**
- Modify: `src/__tests__/astro-accordion.test.tsx:4-6`

**Problem:** Test mocks `t` as `(k: string) => k` which returns translation keys like `astroAccordion.sunSign`. Tests search for German words `Sonnenzeichen`, `Mondzeichen`, `Aszendent` which don't match.

**Step 1: Update the mock to return correct German text**

Replace the mock on line 4-6:
```typescript
vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'de', t: (k: string) => k }),
}));
```

With a mock that maps the keys:
```typescript
const T_MAP: Record<string, string> = {
  'astroAccordion.sunSign': 'Sonnenzeichen',
  'astroAccordion.moonSign': 'Mondzeichen',
  'astroAccordion.ascendant': 'Aszendent',
  'astroAccordion.dayMaster': 'Tagesmeister',
  'astroAccordion.monthStem': 'Monatsstamm',
  'astroAccordion.yearStem': 'Jahresstamm',
  'astroAccordion.hourStem': 'Stundenstamm',
  'astroAccordion.dominantElement': 'Dominantes Element',
  'astroAccordion.secondaryElement': 'Sekundäres Element',
  'astroAccordion.deficientElement': 'Schwaches Element',
};
vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'de', t: (k: string) => T_MAP[k] ?? k }),
}));
```

Also update the `fundament deiner signatur` assertion on line 43 — check what the component actually renders for the description hint. The component uses `sunData?.sun[lang]` which comes from zodiac data, not `t()`. If the mock apiData passes `Aries` through `getZodiacSign()` and the zodiac data has German descriptions, the test should work. If not, mock `getZodiacSign` to return test data.

**Step 2: Run tests**

```bash
npx vitest run src/__tests__/astro-accordion.test.tsx
```
Expected: 4 PASS

**Step 3: Commit**

```bash
git add src/__tests__/astro-accordion.test.tsx
git commit -m "fix(test): astro-accordion — use correct German translations in mock"
```

---

### Task 2: Fix signatur-reveal-v2 test (1 failure)

**Files:**
- Modify: `src/__tests__/signatur-reveal-v2.test.tsx`

**Problem:** Test searches for `/weiter/i` (German for "continue") but the component likely uses `t('onboarding.continue')` or similar, which the mock renders as the key.

**Step 1: Read the SignatureReveal component**

Read `src/components/onboarding/SignatureReveal.tsx` and find where the "Weiter" button text comes from. Then either:
- (a) Update the mock `t` to map the correct key → `'Weiter'`, or
- (b) Change the test assertion to match the translation key

**Step 2: Fix and run**

```bash
npx vitest run src/__tests__/signatur-reveal-v2.test.tsx
```
Expected: PASS

**Step 3: Commit**

```bash
git add src/__tests__/signatur-reveal-v2.test.tsx
git commit -m "fix(test): signatur-reveal-v2 — match translated button text"
```

---

### Task 3: Fix wuxing-page-detail test (1 failure)

**Files:**
- Modify: `src/__tests__/wuxing-page-detail.test.tsx`

**Problem:** `expected 0 to be greater than 0` — the test expects a premium section header text but the component likely changed its structure or the text search doesn't match.

**Step 1: Read the test and the WuXingPage component**

Check what text the test searches for and what the component actually renders. The mock setup looks complete (apiData with wuxing elements) but the premium section may have been refactored.

**Step 2: Fix selector to match current component output and run**

```bash
npx vitest run src/__tests__/wuxing-page-detail.test.tsx
```
Expected: PASS

**Step 3: Commit**

```bash
git add src/__tests__/wuxing-page-detail.test.tsx
git commit -m "fix(test): wuxing-page-detail — match current premium section structure"
```

---

### Task 4: Fix Vibes cache shallow copy (Important review finding)

**Files:**
- Modify: `server.mjs` (~line 1704)

**Problem:** `{ ...cached.data }` is a shallow copy — `meta` object reference is shared until reassigned on next line. Works now but fragile.

**Step 1: Fix**

Replace:
```javascript
const payload = { ...cached.data };
payload.meta = { ...payload.meta, cached: true };
```

With:
```javascript
const payload = { ...cached.data, meta: { ...cached.data.meta, cached: true } };
```

Apply the same fix at line ~1724 (L2 cache hit path).

**Step 2: Run lint**

```bash
npm run lint
```

**Step 3: Commit**

```bash
git add server.mjs
git commit -m "fix(vibes): deep-copy meta on cache hit to prevent mutation"
```

---

### Task 5: Add fetch guard to VibesSection (Minor review finding)

**Files:**
- Modify: `src/components/dashboard/VibesSection.tsx`

**Problem:** Rapid double-tap could fire two API calls before `loading` state updates.

**Step 1: Add useRef guard**

```typescript
const fetchingRef = useRef(false);

const handleFetch = useCallback(async () => {
  if (fetchingRef.current) return;
  fetchingRef.current = true;
  setLoading(true);
  setError(null);
  try {
    const data = await fetchVibes(userId);
    setVibesData(data);
    setShowModal(true);
  } catch (err) {
    console.error('[VibesSection] Fetch failed:', err);
    setError(lang === 'de' ? 'Vibe konnte nicht geladen werden.' : 'Could not load vibe.');
  } finally {
    setLoading(false);
    fetchingRef.current = false;
  }
}, [userId, lang]);
```

**Step 2: Run lint**

```bash
npm run lint
```

**Step 3: Commit**

```bash
git add src/components/dashboard/VibesSection.tsx
git commit -m "fix(vibes): add useRef guard against double-tap fetch"
```

---

### Task 6: Remove redundant AnimatePresence in VibesModal (Minor)

**Files:**
- Modify: `src/components/dashboard/VibesModal.tsx:59`

**Problem:** Outer `AnimatePresence` wraps the whole component but parent `VibesSection` already wraps it in `AnimatePresence`.

**Step 1: Remove the outer AnimatePresence wrapper**

Change:
```tsx
return (
  <AnimatePresence>
    <motion.div key="vibes-backdrop" ...>
```
To:
```tsx
return (
  <motion.div key="vibes-backdrop" ...>
```

And remove the closing `</AnimatePresence>` at the end.

**Step 2: Run lint + full test suite**

```bash
npm run lint && npx vitest run
```

**Step 3: Commit**

```bash
git add src/components/dashboard/VibesModal.tsx
git commit -m "fix(vibes): remove redundant AnimatePresence wrapper (parent already wraps)"
```

---

## Summary

| Task | Type | Impact | Files |
|------|------|--------|-------|
| 1 | Test fix | 4 failures → 0 | astro-accordion.test.tsx |
| 2 | Test fix | 1 failure → 0 | signatur-reveal-v2.test.tsx |
| 3 | Test fix | 1 failure → 0 | wuxing-page-detail.test.tsx |
| 4 | Bug fix | Prevent cache mutation | server.mjs |
| 5 | Bug fix | Prevent double-tap race | VibesSection.tsx |
| 6 | Cleanup | Remove redundant wrapper | VibesModal.tsx |

**Expected result:** 0 test failures (currently 6), all review findings addressed.

# Cleanup & Fixing Sprint — Consolidated Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Consolidate all remaining cleanup, bug fixes, and mobile hardening into a single sprint. This supersedes the open items from `2026-03-14-code-review-followup.md`, `2026-03-14-repo-cleanup-dashboard-split.md`, and `2026-03-13-arch-hardening.md` — taking only what hasn't been completed yet.

**Architecture:** Four phases — security/correctness bugs first, then web mobile hardening, then quiz animation cleanup, then code hygiene. Each phase ends with a build gate. No feature changes.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind v4, Express (server.mjs), Vitest, Framer Motion

---

## What's Already Done (DO NOT REDO)

These tasks from prior plans are **complete** — verified in current codebase:

| Plan | Task | Status |
|------|------|--------|
| arch-hardening | Auth guard on BAFE proxy (`requireUserAuth`) | Done — 4 usages in server.mjs |
| arch-hardening | SHA-256 cache key | Done |
| arch-hardening | Extract `useAstroProfile` hook | Done — App.tsx is 376 lines |
| arch-hardening | Typed `parseAstroProfileJson` | Done — used in useAstroProfile.ts |
| repo-cleanup | Delete `ClusterEnergySystem.tsx` | Done — file doesn't exist |
| repo-cleanup | Delete `useBirthChartOrrery.ts` | Done — file doesn't exist |
| repo-cleanup | Uninstall pixi.js/postprocessing | Done — not in package.json |
| repo-cleanup | Dashboard split (Levi/Astro/Interpretation) | Done — Dashboard.tsx is 264 lines |
| repo-cleanup | `SectionErrorBoundary` | Done — exists in dashboard/ |
| code-review | Fix space-weather test assertion | Done — asserts `'fallback'` |
| code-review | Guard GET /api/chart | Done — has `requireUserAuth` |

---

## Phase 1 — Security & Correctness Bugs (High Priority)

### Task 1: Re-generate interpretation on language switch

**Files:**
- Modify: `src/hooks/useAstroProfile.ts`
- Create or modify: `src/__tests__/useAstroProfile.test.ts`

**Context:** When a user switches language (DE↔EN), `useAstroProfile` never re-generates the AI interpretation. The profile-loading effect is gated by `profileFetchedForRef` to run only once per user — it can't be re-triggered by lang changes. We need a separate effect that calls `handleRegenerate` when `lang` changes after a profile is loaded.

**Step 1: Write the failing test**

Add to `src/__tests__/useAstroProfile.test.ts`:

```typescript
it('re-generates interpretation when language changes after profile is loaded', async () => {
  const { generateInterpretation } = await import('../services/gemini');
  const mockGenerate = vi.mocked(generateInterpretation);
  mockGenerate.mockResolvedValue({
    interpretation: 'English interpretation',
    tiles: {},
    houses: {},
  });

  const { result, rerender } = renderHook(
    ({ lang }: { lang: 'de' | 'en' }) => useAstroProfile(mockUser, lang),
    { initialProps: { lang: 'de' as const } }
  );

  await act(async () => { await new Promise(r => setTimeout(r, 50)); });
  await act(async () => {
    await result.current.handleSubmit({
      date: '2000-01-01T12:00:00',
      tz: 'Europe/Berlin',
      lat: 52.5,
      lon: 13.4,
    });
  });
  expect(result.current.profileState).toBe('found');

  const callCountAfterLoad = mockGenerate.mock.calls.length;

  await act(async () => {
    rerender({ lang: 'en' });
    await new Promise(r => setTimeout(r, 50));
  });

  expect(mockGenerate.mock.calls.length).toBeGreaterThan(callCountAfterLoad);
  expect(result.current.interpretation).toBe('English interpretation');
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/__tests__/useAstroProfile.test.ts -t "re-generates"
```

Expected: FAIL — lang switch has no effect

**Step 3: Add lang-change effect to `useAstroProfile.ts`**

After the profile-loading effect, before the `handleSubmit` callback, add:

```typescript
// ── Re-generate when language changes for a loaded profile ───────────
const langRef = useRef<string>(lang);
useEffect(() => {
  const prevLang = langRef.current;
  langRef.current = lang;
  if (prevLang === lang) return;
  if (profileState !== "found" || !apiData) return;
  handleRegenerate();
}, [lang, profileState, apiData, handleRegenerate]);
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/__tests__/useAstroProfile.test.ts
```

**Step 5: Replace the eslint-disable comment on the profile-loading effect**

Change:
```typescript
}, [user]); // eslint-disable-line react-hooks/exhaustive-deps
```
To:
```typescript
}, [user]); // lang intentionally excluded — handled by separate lang-change effect
```

**Step 6: Commit**

```bash
git add src/hooks/useAstroProfile.ts src/__tests__/useAstroProfile.test.ts
git commit -m "fix: re-generate interpretation when user switches language"
```

---

### Task 2: Add clarifying comments for intentional patterns

**Files:**
- Modify: `server.mjs` (~line 229, the `cacheKey` function)
- Modify: `src/types/bafe.ts` (~line 203, the `parseAstroProfileJson` return)

**Step 1: Add cache user-scope comment in `server.mjs`**

Above `function cacheKey(method, url, reqBody)`, add:

```javascript
// Cache key is intentionally NOT scoped by user — BAFE calculate endpoints
// are pure functions of birth data (deterministic, no PII in response).
// Two users with identical birth data share a cached result, which is correct.
```

**Step 2: Add cast comment in `src/types/bafe.ts`**

Above the `return { apiData: {` block in `parseAstroProfileJson`, add:

```typescript
  // Casts below are deliberate trust boundaries: we validated the object shape
  // in the if/else above (version check + dual-path legacy extraction).
  // These will be replaced by generated types once BAFE OpenAPI spec is stable.
```

**Step 3: Commit**

```bash
git add server.mjs src/types/bafe.ts
git commit -m "docs: clarify intentional patterns (cache user-scope, parser casts)"
```

---

### Task 3: Phase 1 build gate

```bash
npm run lint && npm run build && npx vitest run
```

Expected: 0 errors, all tests pass.

---

## Phase 2 — Web Mobile Hardening

### Task 4: Add ElevenLabs Web Component type declaration

**Files:**
- Create: `src/types/elevenlabs.d.ts`
- Modify: `src/components/dashboard/DashboardLeviSection.tsx`

**Context:** Two `@ts-ignore` comments exist for `<elevenlabs-convai>` Web Component. Fix with a proper JSX type declaration.

**Step 1: Create type declaration**

Create `src/types/elevenlabs.d.ts`:

```typescript
declare namespace JSX {
  interface IntrinsicElements {
    'elevenlabs-convai': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        'agent-id'?: string;
        'dynamic-variables'?: string;
      },
      HTMLElement
    >;
  }
}
```

**Step 2: Remove `@ts-ignore` comments from `DashboardLeviSection.tsx`**

Remove lines 102 and 110:
```tsx
// DELETE: {/* @ts-ignore */}
```

**Step 3: Verify types pass**

```bash
npm run lint
```

Expected: 0 errors

**Step 4: Commit**

```bash
git add src/types/elevenlabs.d.ts src/components/dashboard/DashboardLeviSection.tsx
git commit -m "fix: add elevenlabs-convai JSX type declaration, remove @ts-ignore"
```

---

### Task 5: Add touch target safety to web quiz buttons

**Files:**
- Modify: `src/components/quizzes/QuizRenderer.tsx` (or wherever the shared quiz button/answer component lives)

**Context:** Quiz answer buttons use `py-3` (12px padding) which yields ~38px total height on mobile — below the 44px minimum. The fix adds `min-h-[44px]` to all interactive quiz elements.

**Step 1: Find the shared quiz answer button pattern**

```bash
grep -r "py-3.*rounded" src/components/quizzes/ --include="*.tsx" -l | head -5
```

Identify the common pattern used for answer buttons across quizzes.

**Step 2: Add `min-h-[44px]` to each quiz's answer button class**

For each quiz component that renders tappable answer options, add `min-h-[44px]` to the button/div className. Example:

```tsx
// Before:
className="w-full text-left px-4 py-3 rounded-xl border ..."

// After:
className="w-full text-left px-4 py-3 min-h-[44px] rounded-xl border ..."
```

Do this for all 14 regular quizzes + 4 Kinky + 4 PartnerMatch quiz components.

**Step 3: Run build**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add src/components/quizzes/
git commit -m "fix: enforce 44px minimum touch target on quiz answer buttons"
```

---

### Task 6: Disable Three.js bloom post-processing on mobile

**Files:**
- Modify: `src/components/BirthChartOrrery.tsx`

**Context:** `UnrealBloomPass` in the EffectComposer is GPU-intensive and drains battery on mobile. The orrery container is already reduced to 260px on mobile (via CSS). We should also skip bloom on screens < 768px.

**Step 1: Find the EffectComposer/bloom setup**

In `BirthChartOrrery.tsx`, locate where `UnrealBloomPass` is added to the composer (or where `EffectComposer` is created).

**Step 2: Add mobile detection and conditional bloom**

```typescript
// Near the top of the Three.js setup (inside useEffect):
const isMobile = window.innerWidth < 768;

// Where bloom is added:
if (!isMobile) {
  const bloomPass = new UnrealBloomPass(/* ... */);
  composer.addPass(bloomPass);
}
```

**Step 3: Run build**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add src/components/BirthChartOrrery.tsx
git commit -m "perf: skip bloom post-processing on mobile viewports"
```

---

### Task 7: Phase 2 build gate

```bash
npm run lint && npm run build && npx vitest run
```

---

## Phase 3 — Quiz Animation Cleanup

### Task 8: Replace `repeat: Infinity` with finite repeats in quiz overlays

**Files:** 16 files across `src/components/quizzes/` and `src/components/WuXingPentagon.tsx`

**Context:** 31 instances of `repeat: Infinity` across quiz components. These are Framer Motion animations (pulsing dots, floating elements) that run indefinitely while quiz modals are open. On mobile, continuous GPU compositing drains battery. Replace with finite repeats (e.g., 3-5 cycles) or remove decorative animations entirely.

**Step 1: Audit all 31 instances**

```bash
grep -rn "repeat: Infinity" src/components/quizzes/ src/components/WuXingPentagon.tsx
```

**Step 2: For each instance, apply one of these strategies:**

**Strategy A — Decorative pulsing dots/glows:** Remove animation entirely, use static CSS.

```tsx
// Before:
<motion.div
  animate={{ opacity: [0.5, 1, 0.5] }}
  transition={{ duration: 2, repeat: Infinity }}
  className="w-2 h-2 rounded-full bg-gold"
/>

// After:
<div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
```

**Strategy B — Result reveal animations:** Keep but limit to 3 repeats.

```tsx
// Before:
transition={{ duration: 2, repeat: Infinity }}

// After:
transition={{ duration: 2, repeat: 3 }}
```

**Strategy C — Essential active-state indicators:** Keep `Infinity` only if the animation communicates active state (e.g., "recording" or "processing" indicator). Document with comment:

```tsx
// Animation is essential — communicates active processing state
transition={{ duration: 1.5, repeat: Infinity }}
```

**Step 3: Apply across all 16 files**

Process each file, applying the appropriate strategy. Most quiz animations are decorative (Strategy A or B).

**Step 4: Run build**

```bash
npm run build
```

**Step 5: Commit**

```bash
git add src/components/quizzes/ src/components/WuXingPentagon.tsx
git commit -m "perf: replace infinite quiz animations with finite repeats or CSS"
```

---

## Phase 4 — Code Hygiene

### Task 9: server.mjs — guard debug-bafe route registration

**Files:**
- Modify: `server.mjs`

**Context:** The `/api/debug-bafe` endpoint already returns 404 in production but the route is still registered. Wrap the entire `app.get` in a NODE_ENV check.

**Step 1: Wrap the debug-bafe route**

```javascript
// Before:
app.get("/api/debug-bafe", async (_req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ error: "Not found" });
  }
  // ...
});

// After:
if (process.env.NODE_ENV !== "production") {
  app.get("/api/debug-bafe", async (_req, res) => {
    // ... (remove the inner production guard)
  });
}
```

**Step 2: Commit**

```bash
git add server.mjs
git commit -m "chore: only register debug-bafe route in non-production"
```

---

### Task 10: Resolve remaining eslint-disable comments where possible

**Files:** 7 `eslint-disable` instances across 5 files

**Current state:**

| File | Line | Reason | Action |
|------|------|--------|--------|
| `LocationMap.tsx:107` | leaflet state init | Keep — Leaflet lifecycle is external |
| `LocationMap.tsx:123` | map center sync | Keep — intentional one-way sync |
| `App.tsx:199` | splash timer setup | Keep — intentional fire-once |
| `FusionRingWebsiteCanvas.tsx:1746` | canvas setup | Keep — Three.js lifecycle |
| `BirthChartOrrery.tsx:141` | Three.js init | Keep — Three.js lifecycle |
| `BirthChartOrrery.tsx:889` | Three.js resize | Keep — Three.js lifecycle |
| `DashboardAstroSection.tsx:158` | derived data | **Review** — may be resolvable |

**Step 1: Check `DashboardAstroSection.tsx:158`**

Read the effect and determine if missing deps can be safely added, or if a comment explaining the intentional exclusion is better than `eslint-disable`.

**Step 2: For all retained `eslint-disable` comments, add explanatory comments**

```typescript
// Before:
}, [leafletReady, visible]); // eslint-disable-line react-hooks/exhaustive-deps

// After:
}, [leafletReady, visible]); // map/marker refs excluded — Leaflet manages its own lifecycle
```

**Step 3: Commit**

```bash
git add src/components/LocationMap.tsx src/App.tsx src/components/fusion-ring-website/FusionRingWebsiteCanvas.tsx src/components/BirthChartOrrery.tsx src/components/dashboard/DashboardAstroSection.tsx
git commit -m "chore: document eslint-disable reasons, resolve where possible"
```

---

### Task 11: Final verification

```bash
npm run lint          # 0 errors
npm run build         # clean production build
npx vitest run        # all tests pass
```

Verify line counts haven't regressed:

```bash
wc -l src/components/Dashboard.tsx src/App.tsx
# Expected: Dashboard ~264, App ~376
```

---

## Sprint Summary

| Phase | Tasks | Focus |
|-------|-------|-------|
| **1 — Bugs** | 1–3 | Lang-switch regeneration, clarifying comments |
| **2 — Mobile** | 4–7 | TS types, touch targets, bloom disable |
| **3 — Animations** | 8 | 31 infinite → finite/CSS across 16 quiz files |
| **4 — Hygiene** | 9–11 | debug route, eslint comments, final gate |

**NOT in scope:** Transit-API-Fix, SOUL_PROFILE, new quiz contributions, mobile Expo app work, feature additions. This sprint is cleanup-only.

**Estimated commits:** 8–10

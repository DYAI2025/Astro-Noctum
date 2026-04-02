# V3 Code Review Follow-ups Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Address 3 review findings from PR #225: wire kpIndex for storm effects, remove fullscreen borderRadius, wire dayHarmonic in FuRingPage.

**Architecture:** Three 1-line to 5-line fixes across FusionRing3D.tsx, SignaturV3Canvas.tsx, and FuRingPage.tsx. No new files, no new dependencies.

**Tech Stack:** React 19, TypeScript

---

## Task 1: Wire kpIndex into SolarModulation adapter

**Files:**
- Modify: `src/components/fusion-ring-3d/FusionRing3D.tsx:139`

**Step 1: Fix the hardcoded kpIndex**

Replace line 139:
```typescript
// BEFORE:
solarModulation={solarModulation != null ? { ringModulation: solarModulation, triggerEffect: false, kpIndex: 0 } : undefined}

// AFTER:
solarModulation={solarModulation != null ? { ringModulation: solarModulation, triggerEffect: kpIndex >= 5, kpIndex } : undefined}
```

`kpIndex` is already destructured from `useSpaceWeather()` at line 77.

**Step 2: Verify lint**

Run: `npm run lint`
Expected: clean

**Step 3: Commit**

```bash
git add src/components/fusion-ring-3d/FusionRing3D.tsx
git commit -m "fix(signatur): wire kpIndex into V3 SolarModulation — enables G3+ storm effects"
```

---

## Task 2: Remove borderRadius from responsive canvas

**Files:**
- Modify: `src/components/signatur-v3/SignaturV3Canvas.tsx` (responsive return path)

**Step 1: Remove borderRadius from responsive canvas**

Find the responsive return block (starts with `if (isResponsive)`) and remove `borderRadius: '50%'` from the canvas style:

```typescript
// BEFORE:
style={{
  width: effectiveW,
  height: effectiveH,
  borderRadius: '50%',
  background: 'radial-gradient(ellipse at center, #0d0a1a 0%, #050308 100%)',
}}

// AFTER:
style={{
  width: effectiveW,
  height: effectiveH,
  background: 'radial-gradient(ellipse at center, #0d0a1a 0%, #050308 100%)',
}}
```

Keep `borderRadius: '50%'` on the non-responsive path (MiniSignature, SignatureReveal) — those are thumbnails that should be circular.

**Step 2: Verify lint**

Run: `npm run lint`
Expected: clean

**Step 3: Commit**

```bash
git add src/components/signatur-v3/SignaturV3Canvas.tsx
git commit -m "fix(signatur): remove circle clip from fullscreen V3 canvas — use full viewport"
```

---

## Task 3: Wire dayHarmonic in FuRingPage

**Files:**
- Modify: `src/pages/FuRingPage.tsx` (import hook, compute, pass prop)

**Step 1: Import useFirstRunDaily and wire dayHarmonic**

In `src/pages/FuRingPage.tsx`, add the import:
```typescript
import { useFirstRunDaily } from '@/src/hooks/useFirstRunDaily';
```

After existing hook calls (around line 41), add:
```typescript
const { dayHarmonic } = useFirstRunDaily(userId, null);
```

The second argument is `birthInput` — passing `null` is safe (the hook handles it gracefully; it only fetches daily data when both userId and birthInput are present, and `dayHarmonic` defaults to `null`).

Then update the `<FusionRing3D` JSX prop:
```typescript
// BEFORE:
dayHarmonic={null}

// AFTER:
dayHarmonic={dayHarmonic}
```

**Step 2: Verify lint**

Run: `npm run lint`
Expected: clean

**Step 3: Run tests**

Run: `npm run test`
Expected: all pass (no test changes needed — FuRingPage tests mock hooks)

**Step 4: Commit**

```bash
git add src/pages/FuRingPage.tsx
git commit -m "fix(signatur): wire dayHarmonic from useFirstRunDaily into V3 on /signatur"
```

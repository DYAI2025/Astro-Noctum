# Signatur V3 — Morph + Night-Pulse Manual Verification Runbook

Covers: S-SIG-MORPH visual, quiz morph pipeline, and Night-Pulse/Trace gate.

## Prerequisites

```bash
npm run dev   # Terminal 1 — Vite on :3000
PORT=3001 node server.mjs   # Terminal 2 — Express API on :3001
```

Log in with a test account. Navigate to `/signatur`.

---

## Section 1 — Dissonance Visual Verification

### 1.1 d=0 — Symmetric baseline

Open the DissonanceValues panel (bottom-right gear icon, visible to premium or dev).

Set all sliders to 0 (or force via console):
```js
localStorage.setItem('dev_dissonance', JSON.stringify({ d_natal: 0, d_accumulated: 0, d_elemental: { magnitude: 0, type: 'neutral', pair: null }, intensity: 0 }));
location.reload();
```

**Expected:**
- Ring is perfectly symmetric — all 6 pole pairs equidistant from center
- No vibration, no extra brightness on any pole
- Trail alpha ≈ 0.02 (faint smear)

### 1.2 d=1 — Full Lissajous

```js
localStorage.setItem('dev_dissonance', JSON.stringify({ d_natal: 1, d_accumulated: 0.8, d_elemental: { magnitude: 1, type: 'ke', pair: ['Wood', 'Metal'] }, intensity: 1 }));
location.reload();
```

**Expected:**
- Poles noticeably closer together on one axis — Lissajous figure-8 visible
- Vibration on pole heads: angular/crystalline (sharp edges, not smooth waves)
- Color temperature: blue-cool tint on Ke poles
- Trail alpha noticeably brighter (0.02 + 0.03 = 0.05 base)
- Pole head glow radius enlarged (up to 20px at d=1)

### 1.3 d_elemental Sheng (positive)

```js
localStorage.setItem('dev_dissonance', JSON.stringify({ d_natal: 0.5, d_accumulated: 0, d_elemental: { magnitude: 0.8, type: 'sheng', pair: ['Wood', 'Fire'] }, intensity: 0.5 }));
location.reload();
```

**Expected:**
- Vibration is organic/flowing (smooth sine wave, not angular)
- Color temperature: warm gold tint on Sheng poles

---

## Section 2 — Quiz Morph Pipeline

### 2.1 Single quiz morph

1. Open the Naturkind cluster sidebar
2. Complete one quiz (e.g., "Erdverbundenheit")
3. Watch the ring

**Expected (within 200ms of quiz completion):**
- Ring begins a 2-second smooth morph (dissonance values interpolate)
- No sudden jump — `morphEase()` smoothstep curve (accelerate → decelerate)
- Bell-curve trail flash peaks at ~1s midpoint (slightly brighter smear during morph)

### 2.2 Rapid quiz morph queue

1. Complete a second quiz within 2s of the first
2. Watch the ring after first morph completes

**Expected:**
- First morph plays to completion
- Immediately after: second morph begins (from the queue)
- No visual glitch between morphs

### 2.3 Full cluster two-phase morph

1. Complete all 4 quizzes in Naturkind cluster
2. Watch for the two-phase morph

**Expected:**
- After each quiz: immediate morph (event-based live weights)
- After transit state refreshes (~1s after cluster completion): second morph to cumulative weights
- The second morph should be visually distinct (the ring shifts to the persisted state)

### 2.4 Reduced motion

Enable reduced motion in OS settings (macOS: System Settings → Accessibility → Reduce Motion).

Complete a quiz.

**Expected:**
- No morph animation — ring jumps instantly to new state
- No trail flash

---

## Section 3 — Night-Pulse Gate

### 3.1 Weekend (all users)

Set local clock to Saturday or Sunday (or test on a weekend).

```js
// Force night hour in dev — temporarily patch isNighttime check
localStorage.setItem('dev_force_night', 'true');
location.reload();
```

_Note: `dev_force_night` is not implemented — test organically on weekend night OR temporarily patch `isNighttime()` in `day-harmonic.ts` to return `true`._

**Expected:**
- Ring ring uses Night-Pulse or Night-Trace badge (if DashboardTagesEnergie shows the badge for this page — currently only Dashboard shows the badge)
- `activeDayHarmonic` in FuRingPage is the nightHarmonic (50% intensity ceiling)
- Trail persistence modulation is ≤ 50% of the day modulation

### 3.2 Weekday — free user

Set local time to 22:00 on a weekday. Log in as a free (non-premium) account.

**Expected:**
- `activeDayHarmonic` === `dayHarmonic` (night harmonic NOT applied)
- Ring visual: no night modulation, same as daytime behaviour

### 3.3 Weekday — premium user

Log in as a premium account. Local time: 22:00 on a weekday.

**Expected:**
- `activeDayHarmonic` === `nightHarmonic` (night harmonic applied)
- Ring visual: night modulation active (same ±% as day but max 50% intensity)

### 3.4 DayModal / DashboardTagesEnergie badge

Navigate to Dashboard (`/`). Check the hero Tages-Impuls card.

**Expected (when night harmonic active):**
- Badge shows "Night-Pulse" or "Night-Trace" (depending on night_mode from daily fusion)
- Body narrative unchanged (day synthesis still shown — night voice not yet separate)
- Resonanz bar still visible

---

## Section 4 — Automated Test Confirmation

```bash
npx vitest run src/__tests__/night-pulse-h-calc.test.ts   # 34 tests
npx vitest run src/__tests__/signatur-v3-engine.test.ts    # 37 tests
npm run test                                               # 1293 tests total
```

All must pass (green) before sign-off.

---

## Sign-Off Checklist

| # | Scenario | Status |
|---|----------|--------|
| 1.1 | d=0 symmetric ring | |
| 1.2 | d=1 Lissajous + angular vibration + blue cool tint | |
| 1.3 | Sheng organic vibration + warm gold tint | |
| 2.1 | Single quiz → 2s smooth morph | |
| 2.2 | Rapid quizzes → queue drains sequentially | |
| 2.3 | Full cluster → two-phase morph | |
| 2.4 | Reduced motion → instant jump, no flash | |
| 3.1 | Weekend night → all users get night harmonic | |
| 3.2 | Weekday night + free user → day harmonic only | |
| 3.3 | Weekday night + premium → night harmonic applied | |
| 3.4 | Dashboard Tages-Impuls badge correct | |
| — | `npm run test` all green | |

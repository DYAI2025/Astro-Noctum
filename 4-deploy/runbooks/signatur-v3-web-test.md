# Signatur V3 Web Manual Test Runbook

## Purpose

Manual test scenarios for the Signatur V3 engine (12-pole spirograph with trails), feature flag toggling, dissonance response, day harmonic modes, and space weather integration.

## Prerequisites

- App running locally (`npm run dev` + `PORT=3001 node server.mjs`) or deployed to staging
- Authenticated user with an `astro_profiles` row (completed onboarding)
- Browser DevTools open (Performance tab for FPS, Console for logs, Network for API calls)
- Desktop and mobile viewports available (use DevTools device emulation for mobile)

## Feature Flag States

| Flag | Default | Effect |
|------|---------|--------|
| `ff_signatur_engine_v3` | `true` | Enables 12-pole trail engine; falls back to V2 spirograph when disabled |
| `ff_signature_engine_v2` | `true` | V2 spirograph fallback; V1 canvas deformation when disabled |
| `ff_daily_modal_v1` | `true` | Day-Pulse/Trace modal on Dashboard |

Override in browser console: `localStorage.setItem('ff_signatur_engine_v3', 'false')`

## Test Scenarios

### 1. V3 Engine Initial Render

**Steps:**
1. Ensure `ff_signatur_engine_v3` is `true` (default)
2. Navigate to `/signatur`
3. Wait up to 5 seconds after the page loads

**Expected:**
- 12 poles visible, each with a distinct trail arc
- Trails animate smoothly from the first visible frame
- No blank canvas or flash of unstyled content
- Console: no WebGL errors or shader compilation failures

### 2. Feature Flag Toggle (V3 to V2)

**Steps:**
1. On `/signatur`, confirm V3 is rendering (12 poles with trails)
2. Open browser console: `localStorage.setItem('ff_signatur_engine_v3', 'false')`
3. Refresh the page

**Expected:**
- V2 spirograph engine renders (28K particle cloud, no discrete poles)
- No console errors during transition
- Repeat in reverse (`localStorage.setItem('ff_signatur_engine_v3', 'true')` + refresh) to confirm V3 re-enables

### 3. Feature Flag Fallback (V3 off, V2 off)

**Steps:**
1. Disable both: `localStorage.setItem('ff_signatur_engine_v3', 'false')` and `localStorage.setItem('ff_signature_engine_v2', 'false')`
2. Refresh `/signatur`

**Expected:**
- V1 canvas-based Fusion Ring renders (12-to-32 sector deformation)
- No blank screen or crash

### 4. Dissonance on Quiz Completion

**Steps:**
1. Navigate to `/signatur` with V3 enabled
2. Open ClusterSidebar and start any available quiz
3. Complete the quiz (answer all questions)
4. Observe the ring after quiz `onComplete` fires

**Expected:**
- Network: POST to `/api/contribute` fires (check Network tab)
- Poles visibly shift behavior (amplitude, speed, or color change) within 2 seconds of completion
- The change is perceptible without requiring side-by-side comparison

### 5. Day Harmonic -- Pulse vs Trace Mode

**Steps:**
1. Navigate to `/` (Dashboard) with `ff_daily_modal_v1` enabled
2. Open the Day-Pulse/Day-Trace modal (click the daily trigger element)
3. Switch between Pulse and Trace modes using the mode toggle

**Expected:**
- **Pulse mode:** Ring modulation is rhythmic/pulsating -- amplitude oscillates visibly
- **Trace mode:** Ring shows a persistent trail/path pattern -- less oscillation, more continuous arcs
- Switching modes produces an immediate visual difference (no page reload required)

### 6. Space Weather -- High Kp Simulation

**Steps:**
1. Navigate to `/signatur` with V3 enabled
2. Open browser console and override the space weather hook response:
   ```js
   // Intercept fetch to simulate high Kp
   const originalFetch = window.fetch;
   window.fetch = function(url, opts) {
     if (url.includes('/api/space-weather/extended')) {
       return Promise.resolve(new Response(JSON.stringify({
         kp: { value: 7, timestamp: new Date().toISOString() },
         f107: { value: 150, timestamp: new Date().toISOString() },
         xray: { flux: 1e-4, classification: "X1" },
         proton: { flux: 100, energy: "10MeV" },
         events: []
       }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
     }
     return originalFetch.apply(this, arguments);
   };
   ```
3. Wait for next poll cycle (up to 5 minutes, or refresh the page)

**Expected:**
- Trail intensity increases noticeably compared to calm conditions (Kp < 4)
- If Kp >= 5 (G3+ storm), a korona eruption effect may trigger
- Ring modulation factor should exceed 1.0 (check via console: look for solar pressure logs)

### 7. Performance -- Desktop 60fps

**Steps:**
1. Navigate to `/signatur` with V3 enabled on a desktop browser (Chrome recommended)
2. Open DevTools Performance tab, click Record for 10 seconds while the ring animates
3. Stop recording and inspect the FPS graph

**Expected:**
- Sustained 60fps (minor dips to 55fps acceptable during effect transitions)
- No frame drops below 30fps
- GPU memory (check `chrome://gpu` or Performance Monitor) stays below 150MB

### 8. Performance -- Mobile 30fps

**Steps:**
1. Open DevTools, enable CPU throttling (4x slowdown) and set viewport to 375x812
2. Navigate to `/signatur` with V3 enabled
3. Record Performance for 10 seconds

**Expected:**
- Sustained 30fps or above
- No jank or visible frame skipping during idle animation
- Particle count or detail tier may be reduced compared to desktop

## Verification Checklist

- [ ] V3 renders 12 poles with trails within 5 seconds of page load
- [ ] Feature flag toggle switches between V3, V2, and V1 without errors
- [ ] Quiz completion causes visible pole behavior change
- [ ] Pulse and Trace day harmonic modes are visually distinct
- [ ] Simulated high Kp increases trail intensity
- [ ] Desktop maintains 60fps sustained
- [ ] Mobile (throttled) maintains 30fps sustained
- [ ] No console errors in any scenario (warnings acceptable)

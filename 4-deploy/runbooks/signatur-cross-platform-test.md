# Signatur Cross-Platform Test Matrix Runbook

## Purpose

All-platform test matrix for the Signatur engine covering desktop browsers, mobile Safari, performance budgets, transit API latency, and GPU memory limits.

## Prerequisites

- App running locally (`npm run dev` + `PORT=3001 node server.mjs`) or deployed to staging
- Authenticated user with completed onboarding and an `astro_profiles` row
- Test devices or environments:
  - Desktop: Chrome (latest), Firefox (latest), Safari (latest macOS)
  - Mobile: iOS Safari on a physical iPhone or Xcode simulator
- DevTools available on each browser for Performance and Network inspection

## Test Matrix

### 1. Desktop Chrome

**Steps:**
1. Open `/signatur` in Chrome (latest stable)
2. Confirm V3 engine renders (12 poles with trails)
3. Click to start audio -- confirm Cousto frequencies play
4. Record Performance for 10 seconds

**Expected:**
- V3 renders within 2 seconds of data availability
- Sustained 60fps (check Performance FPS graph)
- Audio plays after user interaction, multiple frequencies audible
- No WebGL errors or shader warnings in console

### 2. Desktop Firefox

**Steps:**
1. Open `/signatur` in Firefox (latest stable)
2. Confirm V3 engine renders
3. Click to start audio
4. Record Performance for 10 seconds (Firefox Profiler or DevTools)

**Expected:**
- V3 renders within 2 seconds of data availability
- Sustained 60fps
- Audio works (Firefox AudioContext may require user gesture -- same as Chrome)
- No WebGL compatibility issues (check console for fallback messages)

### 3. Desktop Safari (macOS)

**Steps:**
1. Open `/signatur` in Safari (latest macOS)
2. Confirm V3 engine renders
3. Click to start audio
4. Use Web Inspector Timeline to check frame rate

**Expected:**
- V3 renders within 2 seconds of data availability
- Sustained 60fps (Safari WebGL performance may vary -- 55fps acceptable)
- Audio starts after user gesture
- No Metal API warnings or WebGL context lost events

### 4. Mobile Safari (iOS)

**Steps:**
1. Open `/signatur` on an iPhone in Safari (physical device preferred)
2. Observe the rendering mode
3. Tap to start audio
4. Interact with the ring (pan, pinch if supported)

**Expected:**
- Rendering at 30fps or above (iOS devices throttle to save battery)
- If Three.js scene is too heavy, fallback to a simplified view (no crash or blank screen)
- Audio starts only after first tap (iOS gesture gate)
- No horizontal overflow or layout breakage
- Touch interactions are responsive (no 300ms tap delay)

### 5. First Visible Frame -- Time to Render

**Steps:**
1. Open DevTools Network tab, enable throttling to "Fast 3G" (optional stress test)
2. Hard-refresh `/signatur` (Cmd+Shift+R / Ctrl+Shift+R)
3. Measure time from navigation start to first visible ring frame

**Method:** Use Performance tab -- mark when the first `requestAnimationFrame` draws non-empty content, or visually observe the first frame with ring content.

**Expected:**
- First visible frame appears within 2 seconds of transit/signal data being available in the JS context
- If API is slow, a loading indicator shows (not a blank canvas)
- Total time from navigation to first frame under 4 seconds on broadband

### 6. Transit API Response Latency

**Steps:**
1. Open DevTools Network tab
2. Navigate to `/signatur` and observe the `GET /api/transit-state/:userId` requests
3. Note the response time for each request (the hook polls every 800ms with backoff)

**Expected:**
- Response time under 500ms per request (measured from request sent to response received)
- If the server is under load, responses should not exceed 1 second
- Response body validates against `TransitStateSchema` (no Zod parse errors in console)
- Fallback header `X-Transit-Fallback` present only when FuFirE is unreachable

### 7. GPU Memory Budget

**Steps:**
1. Open `/signatur` on desktop Chrome
2. Open `chrome://gpu` in a separate tab and note baseline GPU memory
3. Navigate to `/signatur`, let the ring animate for 30 seconds
4. Check GPU memory usage again (or use Chrome Task Manager: Shift+Esc, look at GPU Memory column)

**Expected:**
- GPU memory for the tab stays below 150MB
- Memory does not grow continuously over time (no leak)
- After navigating away from `/signatur`, GPU memory drops back toward baseline within 10 seconds

### 8. WebGL Context Loss Recovery

**Steps:**
1. Navigate to `/signatur` with V3 rendering
2. Simulate context loss (Chrome DevTools console):
   ```js
   const canvas = document.querySelector('canvas');
   const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
   const ext = gl.getExtension('WEBGL_lose_context');
   ext.loseContext();
   // Wait 3 seconds, then:
   ext.restoreContext();
   ```

**Expected:**
- Ring recovers after context restore (may take 1-2 seconds)
- No permanent blank canvas or crash
- Console may log a warning about context loss, but no uncaught errors

## Platform Summary Matrix

| Platform | Target FPS | Audio | Three.js Scene | First Frame |
|----------|-----------|-------|----------------|-------------|
| Chrome Desktop | 60 | Yes (gesture-gated) | V3 full | < 2s |
| Firefox Desktop | 60 | Yes (gesture-gated) | V3 full | < 2s |
| Safari Desktop | 60 | Yes (gesture-gated) | V3 full | < 2s |
| Safari iOS | 30 | Yes (tap-gated) | V3 or fallback | < 2s |

## Verification Checklist

- [ ] Chrome: V3 renders, 60fps, audio works
- [ ] Firefox: V3 renders, 60fps, audio works
- [ ] Safari macOS: V3 renders, 60fps, audio works
- [ ] Safari iOS: 30fps minimum, gesture-gated audio, no crash
- [ ] First visible frame under 2 seconds from data availability
- [ ] Transit API responses under 500ms
- [ ] GPU memory stays below 150MB
- [ ] No GPU memory leak over 30 seconds
- [ ] WebGL context loss recovers gracefully

# Vibes Test Runbook

## Purpose

Manual test scenarios for the Day-Pulse "Vibe abrufen" feature covering generation, caching, fallback, and layout across viewports.

## Prerequisites

- App running locally (`npm run dev` + `PORT=3001 node server.mjs`) or deployed to staging
- Authenticated user with a completed `astro_profiles` row (has birth data + calculation results)
- Browser DevTools open for console logs, network inspection, and responsive mode
- Gemini API key configured in `.env.local` (`VITE_GEMINI_API_KEY`)

## Test Scenarios

### 1. Vibe Button Visible

1. Log in with an authenticated user who has completed onboarding
2. Navigate to `/` (Dashboard)
3. Verify "Vibe abrufen" button is visible in the Day-Pulse section
4. Button should be interactive (hover/focus states present)

### 2. Vibe Generation

1. Tap "Vibe abrufen"
2. Verify loading skeleton appears immediately (no layout jump)
3. Network: observe outgoing request to Gemini or Experience API
4. Result renders within 2 seconds
5. Kurzsignal text (1 sentence) is visible after completion

### 3. Three-Level Output

1. After generation completes, verify all three levels are present:
   - **Kurzsignal**: exactly 1 sentence, plain text, no bare numbers
   - **Treiber**: 3 to 5 pill-shaped tags visible below the Kurzsignal
   - **Erklarung**: hidden behind a "Warum sehe ich das?" toggle (not visible by default)

### 4. Explainability

1. Locate the "Warum sehe ich das?" toggle below the Treiber pills
2. Tap it -- panel expands with explanation text
3. Verify explanation references signatur context (natal data) and transit context (current transits)
4. Tap again -- panel collapses cleanly without layout shift

### 5. Cache Hit

1. Complete a vibe generation (scenario 2)
2. Navigate away from Dashboard (e.g. `/signatur`) and return to `/`
3. Tap "Vibe abrufen" again within the active cooldown window
   - Free Tier: 4 hours
   - Premium Tier: 2 hours
4. Verify result appears instantly (no loading skeleton, no network request)
5. Output is identical to the first generation

### 6. Gemini Fallback

1. Open DevTools > Network > Block requests matching `generativelanguage.googleapis.com`
2. Tap "Vibe abrufen"
3. Verify element-based fallback text appears (not an error message)
4. Fallback text should reference the user's dominant element or sign
5. No uncaught errors in console

### 7. Mobile Layout

1. Open DevTools responsive mode, set viewport to 375x812 (iPhone SE/13 mini)
2. Navigate to Dashboard, tap "Vibe abrufen"
3. Verify Kurzsignal + Treiber pills render fully above the fold
4. No horizontal overflow or scrollbar on the vibe section
5. Treiber pills wrap to a second line if needed (no truncation)

### 8. No Bare Numbers

1. Inspect all visible output text after generation (Kurzsignal, Treiber, Erklarung)
2. Verify no unexplained percentages, decimal scores, or raw numeric values appear
3. Any numbers present must have descriptive context (e.g. "3 Treiber" is acceptable, "0.73" is not)

### 9. Determinism

1. Complete a vibe generation and note the exact Kurzsignal text + Treiber pills
2. Hard-refresh the page (Cmd+Shift+R)
3. Tap "Vibe abrufen" again within the same active cooldown window
4. Verify output is identical to the first run (same text, same pills, same order) while still in cooldown

## Verification Checklist

- [ ] "Vibe abrufen" button visible for authenticated user on Dashboard
- [ ] Loading skeleton appears during generation
- [ ] Result renders within 2 seconds
- [ ] Kurzsignal is exactly 1 sentence
- [ ] Treiber shows 3-5 pill tags
- [ ] "Warum sehe ich das?" expands/collapses explanation panel
- [ ] Explanation references signatur + transit context
- [ ] Cached result returns instantly on second tap within active cooldown (Free: 4h, Premium: 2h)
- [ ] Gemini block produces element-based fallback (no error)
- [ ] Mobile 375px: content above fold, no horizontal overflow
- [ ] No bare numbers or unexplained scores in output
- [ ] Same user in same cooldown window produces identical output
- [ ] No console errors (warnings acceptable)

# Onboarding Test Runbook

## Purpose

Manual test scenarios for the onboarding flow covering both the Cosmic Encounter (7-phase) and legacy SignatureReveal paths, desktop and mobile viewports.

## Prerequisites

- App running locally (`npm run dev` + `PORT=3001 node server.mjs`) or deployed to staging
- A fresh Supabase user (no `astro_profiles` row) for first-run tests
- Browser DevTools open for console logs and network inspection

## Feature Flag States

| Flag | Default | Effect |
|------|---------|--------|
| `cosmic_encounter_v1` | `false` (hard-disabled) | Enables 7-phase Cosmic Encounter |
| `signature_onboarding_v1` | `true` | Enables bootstrap + SignatureReveal flow |

Override in browser console: `localStorage.setItem('ff_cosmic_encounter_v1', 'true')` — note: this flag is currently **hard-locked off** and cannot be overridden via localStorage.

## Test Scenarios

### 1. Legacy Onboarding (signature_onboarding_v1 = true, cosmic_encounter_v1 = false)

This is the **current production path**.

**Steps:**
1. Sign up with a new account or clear `astro_profiles` row for existing user
2. Navigate to `/` — should redirect to `/onboarding`
3. Fill in birth form (date, time, location via Nominatim search)
4. Submit — observe:
   - Network: POST to `/api/experience/bootstrap` fires
   - Network: 5 parallel POST requests to `/api/calculate/*` (BAFE)
   - Loading state shown during calculation
5. After calculation completes, SignatureReveal phase renders:
   - Fusion Ring (V2 or V1 depending on `signature_engine_v2` flag) displays
   - Profile summary card appears
   - Single quiz question presented
6. Answer quiz question — observe:
   - Network: POST to `/api/experience/signature-delta`
   - Ring animates/morphs in response
7. Flow transitions to Dashboard (`/`)
8. Refresh page — should stay on Dashboard, not re-enter onboarding

**Expected console output:**
- `[bootstrap]` log lines during Experience API call
- No errors (warnings about BAFE unreachable are acceptable in dev)

### 2. Returning User Redirect

**Steps:**
1. Log in with a user who already has an `astro_profiles` row
2. Navigate to `/onboarding`
3. Should redirect to `/` immediately

### 3. Mobile Viewport (< 768px)

**Steps:**
1. Open DevTools, set viewport to 375x812 (iPhone)
2. Repeat scenario 1
3. Verify: no Three.js scene loaded, CSS+image fallback used for ring visualization
4. All form inputs are touch-friendly, no horizontal overflow

### 4. BAFE Unavailable Degradation

**Steps:**
1. Block BAFE requests (DevTools → Network → Block `bafe`)
2. Start fresh onboarding
3. Bootstrap should still complete (with fallback data)
4. Dashboard should render with "—" placeholders for missing data
5. No uncaught errors in console

### 5. Cosmic Encounter (when flag is enabled)

**Note:** `cosmic_encounter_v1` is currently hard-disabled. This scenario is for future testing when the flag is unlocked.

**Steps:**
1. Enable flag (requires code change in `feature-flags.ts` — localStorage override is blocked)
2. Sign up with fresh account
3. Navigate to `/onboarding` — should enter Cosmic Encounter
4. Verify 7 phases in order: materializing → levi-speaks → birth-input → calculating → ring-reveal → quiz → complete
5. Desktop (>= 768px): Three.js CosmicEncounterScene with parallax effects
6. Mobile (< 768px): CosmicEncounterMobile fallback component
7. After completion, redirects to Dashboard

## Verification Checklist

- [ ] Fresh user lands on `/onboarding`, not Dashboard
- [ ] Birth form validates required fields (date, time, location)
- [ ] Bootstrap API call succeeds (or degrades gracefully)
- [ ] SignatureReveal shows ring + profile summary
- [ ] Quiz answer triggers signature-delta and ring animation
- [ ] Completion redirects to Dashboard
- [ ] Returning user skips onboarding
- [ ] Mobile viewport uses fallback rendering
- [ ] No console errors (warnings acceptable)

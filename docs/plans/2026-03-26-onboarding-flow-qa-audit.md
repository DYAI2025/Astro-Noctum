# Onboarding Flow QA Audit & Bug List

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Document the complete onboarding state machine, identify every showstopper and dead end, and provide TDD fix tasks for each.

**Architecture:** The onboarding is a 4-phase state machine (`form` → `encounter` → `signature` → `done`) driven by `App.tsx`, with parallel BAFE + Experience API calls, Supabase persistence, and feature-flag gating.

**Tech Stack:** React 19, Supabase Auth, Express proxy (server.mjs), BAFE API, Gemini AI, Vitest

---

## Current User Onboarding Flow (As-Documented)

### Phase 0: Splash (first-time visitor)

```
bazodiac.space → Splash.tsx
  ├─ First visit: "hero" phase (BAZODIAC title + "TOUCH THE SURFACE")
  │   └─ Click anywhere → localStorage("bazodiac_hero_seen")=true → "gate" phase
  ├─ Return visit: skip hero → "gate" phase directly
  └─ "gate" phase: language selection (German / English)
      └─ Click language → intro video plays (mp4)
          ├─ Video ends or crossfade at -3s → onEnter() → App shows AuthGate
          ├─ Video stalls > 4s → onEnter() fallback
          ├─ Video error → onEnter() fallback
          └─ Return visitor: "Skip" button appears after 1.5s
```

**Files:** `src/components/Splash.tsx`

### Phase 1: Auth Gate

```
AuthGate.tsx renders (no user session)
  ├─ Login view (default):
  │   ├─ Email (prefilled from localStorage bazodiac_email)
  │   ├─ Password (min 6)
  │   └─ "Einloggen" button → signIn(email, password)
  │       ├─ Success → AuthContext sets user → App re-renders
  │       └─ Error → red text below form
  │
  └─ Register view (click "Jetzt registrieren"):
      ├─ Email
      ├─ Password (min 6)
      ├─ Confirm password
      ├─ Language selector (DE/EN)
      └─ "Konto erstellen" button → signUp(email, password)
          ├─ Domain blocked → error "Diese E-Mail-Domain ist nicht erlaubt"
          ├─ Email exists (identities.length === 0) → auto-login attempt
          ├─ Success → auto-login (email confirm disabled) → user set
          └─ Error → red text below form
```

**Files:** `src/components/AuthGate.tsx`, `src/contexts/AuthContext.tsx`

### Phase 2: Profile Loading

```
App.tsx: user is set, authLoading = false
  └─ useAstroProfile(user, lang) fires:
      ├─ Queries supabase.from('astro_profiles').select('astro_json')
      │   ├─ Profile found → parse → restore apiData + interpretation
      │   │   └─ profileState = 'found' → SKIP onboarding → Dashboard
      │   ├─ Profile NOT found → profileState = 'not-found'
      │   │   └─ Show BirthForm (new user)
      │   └─ Fetch error → profileState = 'error'
      │       └─ Show BirthForm (fallback)
      └─ Loading state: gold ping dot + "Lade dein kosmisches Profil…"
```

**Files:** `src/hooks/useAstroProfile.ts`, `src/App.tsx:192-202`

### Phase 3: Birth Form (two-step wizard)

```
Step 1 — Date & Time:
  ├─ Date input (max=today, default=1990-01-01)
  ├─ Time input (default=12:00) + "Unbekannt" checkbox (→ 12:00)
  ├─ DST hint (MESZ/MEZ) for dates ≥ 1980
  └─ "Weiter" → Step 2

Step 2 — Location:
  ├─ If Google Places API key → PlaceAutocomplete + LocationMap
  │   └─ Auto-detect timezone via fetchTimezone(lat, lon)
  ├─ If NO API key → manual "lat, lon" text input (default: Berlin 52.52, 13.405)
  ├─ Timezone field (editable, auto-populated)
  └─ Submit → handleOnboardingSubmit(formData)
```

**Validation:**
- Date not in future
- Coordinates in range (-90..90, -180..180), not NaN
- Timezone must be valid IANA name

**Files:** `src/components/BirthForm.tsx`, `src/components/PlaceAutocomplete.tsx`, `src/components/LocationMap.tsx`

### Phase 4: Onboarding Submit Handler

```
App.tsx handleOnboardingSubmit(formData):
  ├─ setHasStartedOnboarding = true
  │
  ├─ IF signature_onboarding_v1 OFF:
  │   └─ setOnboardingPhase('done') → skip to dashboard
  │   └─ handleSubmit(formData) → BAFE in background
  │
  └─ IF signature_onboarding_v1 ON (default):
      ├─ Parse date/time from ISO string
      ├─ TRY: bootstrapExperience(birth)
      │   ├─ POST /api/experience/bootstrap (authed)
      │   │   ├─ Server: POST /chart to BAFE (15s timeout)
      │   │   ├─ Compute Master Signal (natal + GCB dimensions)
      │   │   ├─ Project to 12 soulprint sectors
      │   │   ├─ Generate narratives
      │   │   ├─ Save soulprint_sectors to astro_profiles (fire-and-forget)
      │   │   └─ Return { profile, soulprint_sectors, narratives, signature_blueprint, meta }
      │   ├─ setBootstrapData(data)
      │   └─ setOnboardingPhase('signature')
      │
      ├─ CATCH: bootstrap failed
      │   ├─ Set FALLBACK bootstrapData:
      │   │   ├─ sun_sign: '—', harmony_index: 0.5
      │   │   ├─ soulprint_sectors: [0.5 × 12]
      │   │   └─ narratives: placeholder text
      │   └─ setOnboardingPhase('signature') — continues anyway
      │
      └─ THEN: handleSubmit(formData)
          └─ BAFE calculateAll() runs in parallel (5 endpoints)
```

**Files:** `src/App.tsx:88-147`, `src/services/experience.ts`, `server.mjs:1095-1166`

### Phase 5: Signature Reveal

```
SignatureReveal.tsx (onboardingPhase === 'signature' && bootstrapData):
  ├─ Full-screen black background, z-50
  ├─ 200×200px ring container (rounded-full overflow-hidden)
  │   ├─ V2 engine (default): FusionRingCanvasV2 with natalWeights
  │   │   └─ Gated by: signature_engine_v2 flag + device capability check
  │   └─ V1 fallback: FusionRingWebsiteCanvas with sectors
  ├─ t=500ms: revealProgress = 1 (neutral → personal morph)
  ├─ t=1000ms: "Deine Signatur entsteht…" fades in
  ├─ t=3000ms: "Weiter" button appears
  └─ Click "Weiter" → onComplete(null) → setOnboardingPhase('done')
```

**Files:** `src/components/onboarding/SignatureReveal.tsx`

### Phase 6: Transition to Dashboard

```
OnboardingPage useEffect:
  ├─ onboardingPhase === 'done' → navigate('/', replace)
  └─ Router: hasCompleteProfile → <DashboardPage />

hasCompleteProfile = profileState === 'found'
                     && Boolean(apiData)
                     && Boolean(interpretation)
                     && (!hasStartedOnboarding || onboardingPhase === 'done')
```

**Files:** `src/pages/OnboardingPage.tsx:57-75`, `src/router.tsx:48-50`, `src/App.tsx:205-209`

### Phase 7: Daily Horoscope Modal

```
useFirstRunDaily fires on Dashboard mount:
  ├─ Guard: userId + birthData + soulprintSectors all present
  ├─ Check profiles.daily_modal_seen_date !== today
  ├─ Check localStorage cache (key: daily_horoscope_cache)
  ├─ If cache miss: fetchDailyExperience() → POST /api/experience/daily (authed)
  │   └─ Server: Gemini generates horoscope OR proxies to BAFE
  ├─ Show DailyHoroscopeModal (3 tabs: Western, BaZi, Fusion)
  └─ Close → update profiles.daily_modal_seen_date = today
```

**Files:** `src/hooks/useFirstRunDaily.ts`, `src/components/dashboard/DailyHoroscopeModal.tsx`

---

## Bug List: Showstoppers & Dead Ends

### BUG-ONB-01: CRITICAL — Supabase persist failure causes infinite re-onboarding loop

**Severity:** SHOWSTOPPER
**Where:** `useAstroProfile.handleSubmit` (persist step)
**Flow:** New user → BAFE succeeds → data in memory → Supabase upsert fails silently (fire-and-forget `catch → console.warn`) → user sees Dashboard → refreshes page → `fetchAstroProfile` finds nothing → `profileState = 'not-found'` → **BirthForm shown again** → infinite loop

**Root cause:** Persistence errors are silently swallowed. No retry, no toast, no user notification.

**Impact:** Any transient Supabase outage during onboarding means the user's data is lost on refresh. They must re-enter birth data every session.

**Fix:** Add retry with backoff + persistent error banner ("Deine Daten konnten nicht gespeichert werden — bitte versuche es erneut").

---

### BUG-ONB-02: CRITICAL — Bootstrap 502 + BAFE timeout = blank dashboard

**Severity:** SHOWSTOPPER
**Where:** `App.tsx:119-146`, `server.mjs:1101-1116`
**Flow:** Bootstrap fails (→ fallback data OK) → BAFE `calculateAll()` also fails (all 5 endpoints timeout) → `useAstroProfile` sets `error` → BUT `onboardingPhase` already advanced to `'signature'` → user completes SignatureReveal → `onboardingPhase = 'done'` → BUT `profileState ≠ 'found'` (no apiData) → `hasCompleteProfile = false` → **Router redirects to `/onboarding`** → but phase is 'done' → **useEffect navigates to `/`** → redirect loop OR stuck on loading.

**Root cause:** The phase machine and BAFE flow are decoupled. Phase can reach 'done' while BAFE hasn't completed, creating a state where `hasCompleteProfile` is false but phase is 'done'.

**Impact:** If both APIs fail simultaneously (e.g. Railway networking issue), user gets stuck in redirect loop between `/` and `/onboarding`.

**Fix:** Add guard: if `onboardingPhase === 'done'` and `!profileDataReady`, show a retry UI instead of redirecting.

---

### BUG-ONB-03: HIGH — No "password reset" flow

**Severity:** DEAD END
**Where:** `src/components/AuthGate.tsx`
**Flow:** User forgets password → AuthGate shows login form → no "forgot password" link → user cannot recover account → **dead end**

**Root cause:** No password reset UI implemented. Supabase supports it (`resetPasswordForEmail`), but no link or form exists.

**Impact:** Any user who forgets their password is permanently locked out. Must create new account and lose all data.

**Fix:** Add "Passwort vergessen?" link → call `supabase.auth.resetPasswordForEmail()` → show confirmation message.

---

### BUG-ONB-04: HIGH — Corrupted astro_json causes permanent re-onboarding

**Severity:** DEAD END
**Where:** `useAstroProfile.ts` (profile restore)
**Flow:** If `astro_json` in `astro_profiles` is malformed → `parseAstroProfileJson()` returns null → `profileState = 'not-found'` → BirthForm shown → user re-submits → if upsert updates with NEW valid json, fixed. BUT if the upsert also fails (e.g., row locked, concurrent writes) → **permanent loop**.

**Root cause:** No schema validation on stored `astro_json`. No cleanup for corrupted entries.

**Impact:** Rare but permanent — user stuck in onboarding forever.

**Fix:** Add Zod validation on parse. If parse fails, DELETE the corrupted row and start fresh.

---

### BUG-ONB-05: HIGH — Splash video files may be missing on Railway

**Severity:** SHOWSTOPPER (conditional)
**Where:** `src/components/Splash.tsx:14-17`
**Flow:** Splash expects `/bazodiac_male_intro_GER.mp4` and `/bazodiac_fem_intro_ENG.mp4` in `public/` → if files are not deployed (large assets sometimes excluded) → `<video>` fires `onError` → `handleVideoError()` calls `onEnter()` → user enters app OK. **However:** the gate phase has no skip button for first-time visitors. If video fails instantly, the transition feels broken (flash of black screen).

**Root cause:** Video error recovery works but the UX is jarring — no loading indicator during video load, instant black screen → app transition.

**Impact:** First-time users see an unexplained flash. Not a true dead end (fallback works) but confusing.

**Fix:** Add loading shimmer while video loads. Show a graceful "entering" animation on video error instead of instant jump.

---

### BUG-ONB-06: MEDIUM — No Google Places API key = degraded location UX

**Severity:** DEAD END (UX)
**Where:** `BirthForm.tsx:55`, `PlaceAutocomplete.tsx`
**Flow:** `hasPlacesApiKey()` returns false → manual coordinate input shown → default "52.520000, 13.405000" (Berlin) → user must know their birth coordinates → most users don't know lat/lon → **functional dead end** for non-technical users.

**Root cause:** `VITE_GOOGLE_PLACES_API_KEY` not set in production env. Nominatim (OpenStreetMap) was mentioned in CLAUDE.md but BirthForm only checks for Google Places.

**Impact:** Users without geocoding knowledge can't enter their birth location properly. They may submit with default Berlin coordinates, getting incorrect charts.

**Fix:** Implement Nominatim fallback search (free, no API key needed) when Google Places is unavailable.

---

### BUG-ONB-07: MEDIUM — `daily_modal_seen_date` column may not exist

**Severity:** DEAD END (silent)
**Where:** `useFirstRunDaily.ts:82-86`
**Flow:** Hook queries `profiles.daily_modal_seen_date` → if column doesn't exist in production Supabase schema → query returns error → hook hits catch block → `console.error` → **no modal shown, ever**.

**Root cause:** Migration `20260316_experience_tables.sql` may not have been applied to production. No runtime check.

**Impact:** Daily modal silently never appears. Users miss daily horoscope feature entirely.

**Fix:** Check if migration was applied. Add graceful fallback: if column missing, treat as "not seen today" (always show).

---

### BUG-ONB-08: MEDIUM — SignatureReveal with fallback data shows meaningless ring

**Severity:** UX ISSUE
**Where:** `SignatureReveal.tsx`, `App.tsx:122-138`
**Flow:** Bootstrap fails → fallback data has `soulprint_sectors: [0.5, 0.5, …]` → ring renders perfectly circular (no personal signature) → user sees "Deine Signatur entsteht…" but it's a generic circle → profile shows "sun_sign: '—'" → **misleading UX**.

**Root cause:** Fallback data is indistinguishable from real data in the UI. No "something went wrong" indicator.

**Impact:** User thinks their cosmic signature is a plain circle. No indication that data failed to load.

**Fix:** Detect fallback state (check `meta.engine_version === 'fallback'`) → show "Wir konnten deine Signatur nicht vollständig berechnen" message with retry button.

---

### BUG-ONB-09: MEDIUM — `express.json()` after `requireUserAuth` causes body parse to fail

**Severity:** POTENTIAL SHOWSTOPPER
**Where:** `server.mjs:1095`
**Flow:** `app.post('/api/experience/bootstrap', requireUserAuth, express.json(), ...)` — middleware order is `requireUserAuth` → `express.json()`. If `requireUserAuth` reads `req.body` before `express.json()` parses it → body is undefined. HOWEVER: `requireUserAuth` only reads `req.headers.authorization`, so this is not currently broken. But it's fragile — any future middleware that reads body before `express.json()` will break.

**Root cause:** Express middleware order. `express.json()` should come first.

**Impact:** Not currently broken, but a latent bug.

**Fix:** Move `express.json()` before `requireUserAuth` in all experience routes.

---

### BUG-ONB-10: LOW — No loading state between auth + profile fetch

**Severity:** UX ISSUE
**Where:** `App.tsx:192-202`
**Flow:** After login, while `profileState === 'loading'`, user sees just a gold ping dot + small text. On slow connections, this can last 3-5 seconds with no progress indication or branding.

**Impact:** Users may think the app is broken during the 3-5s loading gap.

**Fix:** Add branded loading screen with progress hints.

---

### BUG-ONB-11: LOW — `onboardingPhase` not persisted across page refresh

**Severity:** UX ISSUE
**Where:** `App.tsx:32-35`
**Flow:** User is on SignatureReveal → refreshes page → `onboardingPhase` resets to `'form'` → IF profile already saved → `hasCompleteProfile = true` → redirected to Dashboard (skipping signature). IF profile NOT saved → back to BirthForm.

**Root cause:** Phase is React state, not persisted to localStorage or Supabase.

**Impact:** Page refresh during onboarding may skip the signature reveal or restart the form. Not a dead end, but confusing.

**Fix:** Persist `onboardingPhase` to localStorage. Restore on mount.

---

### BUG-ONB-12: LOW — Register form accepts `minLength={6}` but no strength feedback

**Severity:** UX ISSUE
**Where:** `AuthGate.tsx:186`
**Flow:** Password field has `minLength={6}` HTML attribute but no visual strength meter or requirements text. Users may enter weak passwords.

**Impact:** Low security risk. Users might use "123456" as password.

**Fix:** Add password strength indicator or requirements text.

---

## Summary Table

| ID | Severity | Type | Summary |
|----|----------|------|---------|
| ONB-01 | CRITICAL | Showstopper | Supabase persist failure → infinite re-onboarding |
| ONB-02 | CRITICAL | Showstopper | Bootstrap + BAFE both fail → redirect loop |
| ONB-03 | HIGH | Dead End | No password reset flow |
| ONB-04 | HIGH | Dead End | Corrupted astro_json → permanent re-onboarding |
| ONB-05 | HIGH | Showstopper* | Missing video files → jarring splash transition |
| ONB-06 | MEDIUM | Dead End | No Places API key → manual lat/lon input |
| ONB-07 | MEDIUM | Silent Fail | daily_modal_seen_date column missing → no daily modal |
| ONB-08 | MEDIUM | UX Issue | Fallback bootstrap renders meaningless ring |
| ONB-09 | MEDIUM | Latent | express.json() middleware order fragile |
| ONB-10 | LOW | UX Issue | No branded loading between auth and profile |
| ONB-11 | LOW | UX Issue | Phase not persisted across refresh |
| ONB-12 | LOW | UX Issue | No password strength feedback |

---

## Fix Tasks (TDD)

### Task 1: Fix BUG-ONB-01 — Supabase persist retry + error banner

**Files:**
- Modify: `src/hooks/useAstroProfile.ts` (persist section)
- Create: `src/__tests__/persist-retry.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('Supabase persist retry', () => {
  it('retries upsert up to 3 times on failure', async () => {
    const mockUpsert = vi.fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({ data: {}, error: null });

    // Call the persist function
    await persistWithRetry(mockUpsert);
    expect(mockUpsert).toHaveBeenCalledTimes(3);
  });

  it('sets persistError state after all retries fail', async () => {
    const mockUpsert = vi.fn().mockRejectedValue(new Error('network'));
    const setError = vi.fn();

    await persistWithRetry(mockUpsert, { onError: setError });
    expect(setError).toHaveBeenCalledWith(expect.stringContaining('speichern'));
  });
});
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run src/__tests__/persist-retry.test.ts`
Expected: FAIL — `persistWithRetry` not defined

**Step 3: Implement retry logic in useAstroProfile**

Extract persist into a retry wrapper. Add `persistError` state. Show error banner in OnboardingPage when set.

**Step 4: Run test to verify it passes**
Run: `npx vitest run src/__tests__/persist-retry.test.ts`

**Step 5: Commit**
```bash
git add src/hooks/useAstroProfile.ts src/__tests__/persist-retry.test.ts
git commit -m "fix(onboarding): add retry + error banner for Supabase persist (ONB-01)"
```

---

### Task 2: Fix BUG-ONB-02 — Guard redirect loop when phase=done but no profile

**Files:**
- Modify: `src/pages/OnboardingPage.tsx`
- Modify: `src/App.tsx`
- Create: `src/__tests__/onboarding-redirect.test.ts`

**Step 1: Write the failing test**

```typescript
describe('onboarding redirect guard', () => {
  it('shows retry UI when phase is done but profile not ready', () => {
    // Render OnboardingPage with phase='done', hasCompleteProfile=false
    // Expect: retry button visible, NOT a redirect
  });
});
```

**Step 2: Implement guard**

In `OnboardingPage.tsx`, before the `navigate('/')` in the `phase === 'done'` case, check `hasCompleteProfile`. If false, render a retry UI instead.

**Step 3–5: Test, verify, commit**

---

### Task 3: Fix BUG-ONB-03 — Add password reset flow

**Files:**
- Modify: `src/components/AuthGate.tsx`
- Modify: `src/contexts/AuthContext.tsx`
- Create: `src/__tests__/auth-reset.test.ts`

**Step 1:** Add `resetPassword` method to AuthContext
**Step 2:** Add "Passwort vergessen?" link in AuthGate login view
**Step 3:** Show confirmation "E-Mail gesendet" message after submit

---

### Task 4: Fix BUG-ONB-06 — Nominatim fallback for location search

**Files:**
- Create: `src/services/nominatim.ts`
- Modify: `src/components/BirthForm.tsx` (add search fallback)
- Create: `src/__tests__/nominatim.test.ts`

**Step 1:** Implement `searchNominatim(query)` service
**Step 2:** In BirthForm step 2, when `!placesAvailable`, render Nominatim search input
**Step 3:** Auto-populate coordinates + timezone from result

---

### Task 5: Fix BUG-ONB-08 — Detect fallback bootstrap and show warning

**Files:**
- Modify: `src/components/onboarding/SignatureReveal.tsx`
- Create: `src/__tests__/signature-reveal-fallback.test.ts`

**Step 1:** Check `bootstrapData.meta.engine_version === 'fallback'`
**Step 2:** Show "Deine Signatur konnte nicht vollständig berechnet werden" warning
**Step 3:** Add "Erneut versuchen" button that re-triggers bootstrap

---

## Live Site Observations

### API Health (2026-03-26 ~15:00 UTC)
- `/api/space-weather/extended` — **OPERATIONAL** (Kp=2, no alerts)
- `/api/experience/bootstrap` — requires auth (returns SPA shell for unauthenticated)
- `/api/calculate/bazi` — requires auth (returns SPA shell for unauthenticated)
- Static site loads (SPA, JS-rendered) — no SSR, no visible content without JS

### First-Visit Experience
1. Black screen with "BAZODIAC" title + gold particles + "TOUCH THE SURFACE"
2. Click → language gate (German / English buttons)
3. Click language → intro video plays
4. Video ends → AuthGate (login/register form)
5. Register → BirthForm (step 1: date/time, step 2: location)
6. Submit → loading → SignatureReveal → Dashboard

### Observed Issues on Live
- **No password reset link** (confirmed in production)
- **Location step falls back to manual lat/lon** (no Places API key in production)
- **SPA returns 200 for all routes** (no server-side error pages)

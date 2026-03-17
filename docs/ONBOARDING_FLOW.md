# Complete Onboarding Flow — From First Visit to Dashboard

This document describes the full user journey through Bazodiac, from initial page load through the Signature reveal to the first Dashboard experience. It covers the happy path, all failure modes, backend processes at each step, and the user attention curve that drives the UX decisions.

---

## User Attention Curve

The onboarding is designed around a key insight: **users have the highest attention in the first 30 seconds** after entering the app. After that, attention drops sharply. The flow exploits this curve:

```
Attention
  ↑
  │ ████ Splash (emotional hook — cinematic video, ambient audio)
  │ ████
  │ ███████ Auth Gate (low friction — email + password, no email confirm)
  │    ████████ Birth Form (peak engagement — personal data = investment)
  │       ██████████████ SIGNATURE REVEAL ← strongest moment
  │          ████████ Quiz (interactive proof: "I can change this")
  │             ██████ Signature animation (dopamine: visible change)
  │                ████████ Dashboard + Daily Modal (structured first value)
  │                   ████ Normal browsing (attention normalizes)
  └──────────────────────────────────────────────────────→ Time
```

The old flow dumped users straight into a complex Dashboard with BaZi, Western, Wu-Xing, Orrery, and houses. The new flow puts the **Signature** (a single, personal, visual artifact) at the peak attention moment, then gradually expands into complexity.

---

## Phase 0: Splash Screen

**Component:** `Splash.tsx`
**Duration:** ~8-15 seconds (video + animation)

```
User visits bazodiac.space
       ↓
┌─────────────────────────┐
│     SPLASH SCREEN       │
│                         │
│  [Hero image]           │  ← phase: "hero" (skipped if seen before)
│  [Language select DE/EN]│  ← stores in LanguageContext
│  [Intro video]          │  ← phase: "video" (3s crossfade before end)
│  [CSS animation stages] │  ← phase: "animation" (4 stages)
│  [ENTER button]         │  ← calls onEnter()
└─────────────────────────┘
```

**Backend:** None. Entirely client-side.

**State transitions:**
1. `hero` → `gate` (after hero image click, or skipped via `bazodiac_hero_seen` localStorage)
2. `gate` → `video` (after language select)
3. `video` → `animation` (after video ends or skip, or skipped via `bazodiac_intro_seen` localStorage)
4. `animation` → stages 0-4 → ENTER button appears

**`onEnter()` does:**
- Sets `showSplash = false` in App.tsx
- Schedules `setSiteVisible(true)` after 100ms (triggers content fade-in)
- Starts ambient audio player

**Failure modes:**
| Scenario | Behavior |
|----------|----------|
| Video fails to load | `videoError` flag shows ENTER immediately, skips video |
| Returning user | Hero + video phases auto-skipped via localStorage flags |

---

## Phase 1: Authentication

**Component:** `AuthGate.tsx`
**Duration:** ~10-30 seconds

```
┌─────────────────────────┐
│      AUTH GATE           │
│                         │
│  Email: [____________]  │
│  Password: [_________]  │
│  [Login] / [Sign Up]   │
│                         │
│  Toggle: signup/login   │
└─────────────────────────┘
```

**Backend processes:**
- **Sign Up:** `supabase.auth.signUp({ email, password })` → Supabase creates user, auto-confirms (no email verification). Supabase trigger creates `profiles` row with defaults (`is_premium: false`, `daily_modal_seen: false`).
- **Sign In:** `supabase.auth.signInWithPassword({ email, password })` → returns session JWT.

**Post-auth:** `useAuth()` detects `user` → App.tsx exits AuthGate, enters profile loading phase.

**Failure modes:**
| Scenario | Behavior |
|----------|----------|
| Wrong password | Supabase returns error → red error banner in AuthGate |
| Existing email on signup | Detects via empty `identities` array → auto-redirects to login mode |
| Network error | Generic error message shown |

---

## Phase 2: Profile Loading

**Component:** App.tsx profile loading screen
**Duration:** 0.5-3 seconds

```
┌─────────────────────────┐
│                         │
│        ●                │  ← gold pinging dot
│  "Lade dein kosmisches  │
│   Profil…"              │
│                         │
└─────────────────────────┘
```

**Backend processes:**
- `useAstroProfile(user, lang)` → queries `astro_profiles` from Supabase for this user
- If profile found: `profileState = "found"`, loads `apiData` + `interpretation`
- If no profile: `profileState = "not-found"`

**Routing decision:**
- `profileState === "found"` AND `apiData` AND `interpretation` → Dashboard (returning user)
- `profileState === "not-found"` → BirthForm (new user)

**Key insight:** Returning users skip the entire onboarding and go straight to Dashboard. The Signature reveal is first-time only.

---

## Phase 3: Birth Form

**Component:** `BirthForm.tsx`
**Duration:** 30-120 seconds (user input)
**Onboarding phase:** `'form'`

```
┌─────────────────────────┐
│      BIRTH FORM         │
│                         │
│  Geburtstag: [________] │  ← date picker, default 1990-01-01
│  Uhrzeit:    [________] │  ← time input, default 12:00
│  □ Uhrzeit unbekannt    │
│  Ort: [_______________] │  ← Nominatim city search
│  [Map toggle]           │  ← optional Leaflet map
│  Zeitzone: [auto-fill]  │
│                         │
│  [Berechnen →]          │
└─────────────────────────┘
```

**What happens on submit (`handleOnboardingSubmit`):**

```
User clicks [Berechnen]
       ↓
┌──────────────────────────────────────────────────┐
│ handleOnboardingSubmit(formData)                  │
│                                                  │
│  1. Check feature flag: signature_onboarding_v1  │
│     └─ OFF? → just call handleSubmit(), done     │
│     └─ ON? → continue ↓                         │
│                                                  │
│  2. Parse birth data from formData               │
│     date: "1990-08-14"                           │
│     time: "07:42" → "07:42:00"                   │
│     tz: "Europe/Berlin"                          │
│     lat: 53.5511, lon: 9.9937                    │
│                                                  │
│  3. Call bootstrapExperience(birth) ─────────┐   │
│     └─ POST /api/experience/bootstrap        │   │
│        └─ server.mjs proxy ──────────────┐   │   │
│           └─ FuFirE /experience/bootstrap│   │   │
│              ┌───────────────────────────┘   │   │
│              │ compute_bazi()                │   │
│              │ compute_western_chart()       │   │
│              │ compute_fusion_analysis()     │   │
│              │ compute_soulprint()           │   │
│              │ compute_signature_blueprint() │   │
│              └─ Returns: profile,            │   │
│                 soulprint_sectors[12],        │   │
│                 signature_blueprint           │   │
│     ←────────────────────────────────────────┘   │
│                                                  │
│  4. On success:                                  │
│     setBootstrapData(response)                   │
│     setOnboardingPhase('signature')              │
│                                                  │
│  5. On failure:                                  │
│     console.error, phase stays 'form'            │
│     handleSubmit(formData) still runs             │
│     → normal BAFE flow takes over                │
│                                                  │
│  6. Always: handleSubmit(formData) runs           │
│     └─ 5 parallel BAFE requests                  │
│     └─ Gemini interpretation                     │
│     └─ Supabase persistence                      │
└──────────────────────────────────────────────────┘
```

**Important:** `handleOnboardingSubmit` first awaits `bootstrapExperience()` (success or failure) and only then calls `handleSubmit()`. The two entrypoints are therefore not started in parallel; instead, in the success path the Signature phase begins as soon as the bootstrap response arrives, while the longer-running BAFE + Gemini work triggered by `handleSubmit()` continues in the background and overlaps with the Signature reveal.

**Backend detail — what FuFirE `/experience/bootstrap` computes:**

| Step | Function | Input | Output | Duration |
|------|----------|-------|--------|----------|
| 1 | `compute_bazi()` | birth ISO + timezone + coordinates | Four Pillars, Day Master, solar year | ~50ms |
| 2 | `compute_western_chart()` | birth UTC + lat/lon | Planet positions, house cusps, ascendant | ~30ms |
| 3 | `compute_fusion_analysis()` | pillars + planets + ascendant | Wu-Xing vectors, harmony index | ~20ms |
| 4 | `compute_soulprint()` | sun/moon/asc indices + planets + wuxing | 12-sector normalized vector | <1ms |
| 5 | `compute_signature_blueprint()` | soulprint + wuxing + harmony | visual params (symmetry, curvature, etc.) | <1ms |

Total server time: ~100-200ms. Network adds 50-300ms depending on deployment.

**Failure modes:**
| Scenario | Behavior |
|----------|----------|
| FuFirE unreachable (502) | Bootstrap fails silently, BAFE flow continues, user goes to Dashboard directly |
| Invalid date (e.g., Feb 31) | FuFirE returns 422, same fallback as above |
| Invalid coordinates | BirthForm client-side validation catches NaN |
| Feature flag OFF | Bootstrap skipped entirely, old flow |
| Network timeout (>15s) | fetch throws, caught, fallback to BAFE flow |

---

## Phase 4: Signature Reveal

**Component:** `SignatureReveal.tsx`
**Duration:** 5-15 seconds
**Onboarding phase:** `'signature'`

This is the **peak attention moment**. The user just invested effort entering personal data. Now they see immediate, visual, personalized output.

```
Timeline:
0.0s  ┌─ Container fades in (0.8s)
0.2s  ├─ Ring scales in from 0.85→1.0 (1.2s)
0.6s  ├─ Profile summary fades in (sun, moon, asc, day master)
1.0s  ├─ Quiz question appears
1.2s  ├─ Option buttons stagger in (0.1s intervals)
      │
      │  USER READS AND CLICKS AN OPTION
      │
click ├─ Selected button highlights (gold border)
      ├─ isAnimating = true (buttons disabled)
      ├─ POST /experience/signature-delta ────────────┐
      │  └─ FuFirE resolves quiz keyword               │
      │     └─ affinity_map.json lookup                 │
      │     └─ blend soulprint × 0.7 + quiz × 0.3      │
      │     └─ recompute signature blueprint            │
      │     └─ return delta + new blueprint              │
      │  ←──────────────────────────────────────────────┘
      ├─ activeSectors updated → ring animates
      ├─ "Deine Signatur passt sich an..." text
      │
+2.0s ├─ onComplete(delta) called
      └─ onboardingPhase → 'done' → Dashboard
```

**What the user sees:**

```
┌──────────────────────────────────┐
│                                  │
│         ╭─────────╮              │
│        ╱  SIGNATUR  ╲            │  ← FusionRingWebsiteCanvas
│       │   ◉ ring ◉   │          │     driven by soulprint_sectors
│        ╲   shape    ╱            │
│         ╰─────────╯              │
│                                  │
│       Deine Signatur             │
│  Loewe · Waage · Jungfrau        │  ← sun · moon · ascendant
│  Day Master: Xin · Harmonie: 78% │
│                                  │
│  Was beschreibt dich am besten?  │
│                                  │
│  ┌─────────────────────────────┐ │
│  │ Ich druecke mich gerne      │ │  ← keyword: 'expression'
│  │ kreativ aus                 │ │
│  └─────────────────────────────┘ │
│  ┌─────────────────────────────┐ │
│  │ Ich analysiere gerne        │ │  ← keyword: 'analytical'
│  │ komplexe Zusammenhaenge     │ │
│  └─────────────────────────────┘ │
│  ┌─────────────────────────────┐ │
│  │ Harmonie in Beziehungen ist │ │  ← keyword: 'harmony'
│  │ mir sehr wichtig            │ │
│  └─────────────────────────────┘ │
│  ┌─────────────────────────────┐ │
│  │ Ich suche staendig neue     │ │  ← keyword: 'adventure'
│  │ Erfahrungen                 │ │
│  └─────────────────────────────┘ │
└──────────────────────────────────┘
```

**Backend detail — what FuFirE `/experience/signature-delta` computes:**

1. Look up `keyword` in `affinity_map.json` → 12-sector weight vector
2. Blend: `new_sector[i] = soulprint[i] * 0.7 + quiz[i] * 0.3`
3. Normalize blended to sum=1.0
4. Compute new `signature_blueprint` from blended sectors
5. Compute visual delta: `new.curvature - old.curvature`, etc.
6. Return `quiz_sectors` + `signature_delta` + new `signature_blueprint`

**Analytics events:**
- `signature_reveal_seen` — on mount
- `signature_delta_applied` — on quiz answer (with `keyword` payload)

**Failure modes:**
| Scenario | Behavior |
|----------|----------|
| signatureDelta() 502 | Error message shown: "Etwas ist schiefgelaufen. Du kannst fortfahren." After 3s, auto-completes to Dashboard |
| Network timeout | Same as 502 |
| BAFE flow completes first | `showOnboarding` stays true because `onboardingPhase === 'signature'` — race condition is handled |
| User closes browser during animation | No data loss — bootstrap data is not persisted until Dashboard |

---

## Phase 5: Dashboard Landing (First Time)

**Component:** `Dashboard.tsx`
**Onboarding phase:** `'done'`

At this point, TWO things have happened in parallel:
1. Bootstrap provided the Signature (visual-only, fast path)
2. BAFE + Gemini provided the full astro data + interpretation (rich content, slower path)

The Dashboard renders the full content. On **first visit**, two additional things happen:

### 5a: Persistent Signature Widget

A small (80x80px) FusionRingWebsiteCanvas appears at the top of the Dashboard, driven by `soulprint_sectors` fetched from `astro_profiles`. This provides visual continuity from the onboarding reveal.

```
┌────────────────────────────┐
│     ╭──╮                   │
│     │◉◉│ ← mini Signatur   │
│     ╰──╯   (hover: full    │
│             opacity)        │
│  ┌────────────────────────┐│
│  │ DASHBOARD CONTENT      ││
│  │ Western · BaZi · Houses││
│  │ Levi · Interpretation  ││
│  └────────────────────────┘│
└────────────────────────────┘
```

### 5b: Daily Horoscope Modal (First-Run)

**Hook:** `useFirstRunDaily.ts`
**Feature flag:** `daily_modal_v1`

```
Dashboard mounts
       ↓
useFirstRunDaily(userId, birthData, soulprintSectors, quizSectors)
       ↓
┌────────────────────────────────────────┐
│ 1. Check profiles.daily_modal_seen     │
│    └─ true? → SKIP (returning user)    │
│    └─ false? → continue ↓             │
│                                        │
│ 2. Check localStorage cache            │
│    key: `daily_horoscope_cache`        │
│    value: { date: '2026-03-17', data } │
│    └─ found? → use cached data         │
│    └─ not found? → continue ↓         │
│                                        │
│ 3. POST /api/experience/daily          │
│    └─ body: { birth, soulprint,        │
│         quiz_sectors, target_date,     │
│         locale }                       │
│    └─ FuFirE computes:                 │
│       ├─ Full natal chart (BaZi +      │
│       │  Western + Fusion)             │
│       ├─ Current transits for today    │
│       ├─ Western daily (transit ×      │
│       │  soulprint → active sectors)   │
│       ├─ Eastern daily (day pillar     │
│       │  vs natal day master)          │
│       └─ Fusion synthesis (shared      │
│          themes + tension + action)    │
│                                        │
│ 4. Cache in localStorage               │
│ 5. Set showModal = true                │
└────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────┐
│        DAILY HOROSCOPE MODAL            │
│                                         │
│  Dein Tageshoroskop                     │
│  Montag, 17. Maerz 2026            [X] │
│                                         │
│  [☀ Westlich] [☽ BaZi] [✦ Fusion]      │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Western Tab:                    │    │
│  │                                 │    │
│  │ "Fuer dich als Leo stehen       │    │
│  │  heute Ausdruck, Kreativitaet   │    │
│  │  im Fokus..."                   │    │
│  │                                 │    │
│  │ ┌──────────┐ ┌──────────┐      │    │
│  │ │ Ausdruck │ │Kreativit.│      │    │
│  │ └──────────┘ └──────────┘      │    │
│  │                                 │    │
│  │ ┌── Chance ──┐ ┌── Achtung ──┐ │    │
│  │ │ Sektor 5   │ │ Sektor 9    │ │    │
│  │ │ bietet...  │ │ Achte auf...│ │    │
│  │ └────────────┘ └─────────────┘ │    │
│  └─────────────────────────────────┘    │
│                                         │
│  BaZi Tab:                              │
│  "Dein Day Master Xin arbeitet in       │
│   companion-Dynamik. Solarterm:         │
│   Jingzhe..."                           │
│                                         │
│  Fusion Tab:                            │
│  ┌────────────────────────────┐         │
│  │ Synthese (gold gradient)   │         │
│  │ "Beide Systeme zeigen      │         │
│  │  heute einen gemeinsamen   │         │
│  │  Impuls..."                │         │
│  └────────────────────────────┘         │
│  ┌────────────────────────────┐         │
│  │ Tagesimpuls                │         │
│  │ "Nutze heute gezielt den   │         │
│  │  Bereich..."               │         │
│  └────────────────────────────┘         │
└─────────────────────────────────────────┘
       ↓
User clicks [X] or presses Escape or clicks backdrop
       ↓
handleClose():
  1. setShowModal(false)
  2. Supabase: profiles.daily_modal_seen = true (fire-and-forget)
       ↓
Dashboard is now fully accessible.
```

**Analytics events:**
- `daily_modal_opened` — on mount
- `daily_tab_changed` — on tab switch (with `tab` payload)
- `daily_modal_closed` — on close

**Failure modes:**
| Scenario | Behavior |
|----------|----------|
| FuFirE unreachable | Daily fetch fails silently, modal never shows, Dashboard loads normally |
| Supabase unreachable | `daily_modal_seen` check fails, but `fetchedRef` prevents re-fetch within session |
| profiles.daily_modal_seen already true | Modal skipped entirely (returning user) |
| Feature flag OFF | Modal never renders regardless of data |
| localStorage quota exceeded | Cache write fails silently (try/catch), modal still works from fresh fetch |

---

## Complete Happy Path Timeline

```
T+0.0s   User visits bazodiac.space
T+0.1s   Splash loads (hero → video → animation)
T+8.0s   User clicks ENTER
T+8.1s   Ambient audio starts, content fades in
T+10.0s  Auth gate appears (or auto-skipped if session exists)
T+15.0s  User signs up / logs in
T+15.5s  Profile loading spinner ("Lade dein kosmisches Profil…")
T+16.0s  No profile found → BirthForm appears
T+45.0s  User fills birth data, clicks [Berechnen]
T+45.1s  Two parallel requests fire:
           ├─ bootstrapExperience() → FuFirE (100-200ms)
           └─ handleSubmit() → 5× BAFE + Gemini (1-5s)
T+45.3s  Bootstrap returns → SignatureReveal appears
T+45.5s  Ring scales in with soulprint
T+46.0s  Profile summary appears
T+46.5s  Quiz options appear
T+50.0s  User clicks an option
T+50.1s  signatureDelta() fires → FuFirE (~50ms)
T+50.2s  Ring animates to new shape
T+52.2s  onComplete() → phase='done' → Dashboard renders
T+52.3s  BAFE data is ready (completed during signature phase)
T+52.5s  Dashboard content renders immediately
T+52.8s  useFirstRunDaily fires → fetchDailyExperience()
T+53.0s  Daily modal opens with western tab active
T+60.0s  User browses tabs, reads horoscope
T+65.0s  User closes modal → daily_modal_seen=true
T+65.1s  Full Dashboard accessible with all content
```

**Total time to first personalized content:** ~45.3s (of which ~30s is user input)
**Time from submit to Signature:** ~0.3s
**Time from submit to full Dashboard:** ~7s (bottleneck: Gemini interpretation)

---

## Complete Negative Path: Everything Fails

```
T+0.0s   User visits bazodiac.space
T+0.1s   Video fails to load → videoError flag → ENTER shown immediately
T+2.0s   User clicks ENTER
T+5.0s   User signs up → Supabase creates account
T+5.5s   Profile loading → not found → BirthForm
T+30.0s  User clicks [Berechnen]
T+30.1s  bootstrapExperience() → FuFirE unreachable (502)
           └─ Error logged, onboardingPhase stays 'form'
T+30.2s  handleSubmit() fires → 5× BAFE (3 fail, 2 succeed)
           └─ Gemini fails (502)
           └─ Interpretation falls back to hardcoded German text
T+35.0s  profileState='found' → hasCompleteProfile=true
           └─ showOnboarding=false (onboardingPhase is still 'form')
           └─ Dashboard renders with partial data
T+35.5s  useFirstRunDaily fires → fetchDailyExperience() fails
           └─ Daily modal never shows
T+36.0s  Dashboard shows:
           - Partial astro data (failed endpoints show "—")
           - Fallback interpretation text
           - No Signature widget (no soulprint_sectors saved)
           - No daily modal
T+36.0s  User sees a degraded but functional Dashboard
```

**Key design principle:** Every failure degrades gracefully. The user always reaches the Dashboard, just with less personalization. No blank screens, no crashes, no infinite spinners.

---

## Returning User Flow

```
T+0.0s   User visits bazodiac.space
T+0.1s   Splash loads (video skipped via localStorage)
T+3.0s   User clicks ENTER
T+3.5s   Auth: existing session detected → auto-login
T+4.0s   Profile loading → found in Supabase
T+4.5s   Dashboard renders immediately (no onboarding)
T+5.0s   daily_modal_seen=true → no modal
T+5.0s   Full Dashboard with all saved data
```

**Time to content for returning users:** ~5 seconds.

---

## Feature Flag Behavior Matrix

| `signature_onboarding_v1` | `daily_modal_v1` | Behavior |
|---------------------------|------------------|----------|
| ON (default) | ON (default) | Full new flow: Signature → Quiz → Dashboard → Daily Modal |
| OFF | ON | Old flow: BirthForm → Dashboard → Daily Modal |
| ON | OFF | Signature → Quiz → Dashboard (no daily modal) |
| OFF | OFF | Old flow: BirthForm → Dashboard (pre-feature behavior) |

**Toggle in browser console:**
```javascript
localStorage.setItem('ff_signature_onboarding_v1', 'false')  // disable signature
localStorage.setItem('ff_daily_modal_v1', 'false')            // disable daily modal
localStorage.removeItem('ff_signature_onboarding_v1')         // restore default
```

---

## Supabase State After Complete Flow

After a successful first-time onboarding, Supabase contains:

| Table | Data | Written by |
|-------|------|-----------|
| `profiles` | `daily_modal_seen: true` | `useFirstRunDaily.handleClose()` |
| `birth_data` | Raw birth input | `handleSubmit()` via `services/supabase.ts` |
| `astro_profiles` | BAFE results + `soulprint_sectors` | `handleSubmit()` via `services/supabase.ts` |
| `natal_charts` | Detailed chart data | `handleSubmit()` via `services/supabase.ts` |
| `user_signature_state` | Blueprint + soulprint + quiz_sectors | (not yet written — M7 future work) |
| `daily_horoscope_cache` | Daily JSON payload | (server-side only, via service role) |

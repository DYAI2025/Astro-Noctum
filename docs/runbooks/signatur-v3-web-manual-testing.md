# Signatur V3 Web — Manual Test Runbook

**Sprint:** S-SIG Phase 1
**Scope:** V3 bipolar trail engine on desktop and mobile web browsers
**Prerequisite:** Local dev running (`npm run dev` + `PORT=3001 node server.mjs`)

---

## 1. V3 Engine Rendering

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 1.1 | V3 renders on `/signatur` | Navigate to `/signatur` with a logged-in user | Bipolar trail animation visible, 12 poles, center void, no console errors |
| 1.2 | V3 renders on Dashboard | Navigate to `/` with a logged-in user | MiniSignature or embedded ring shows V3 trail engine (if v3 flag on) |
| 1.3 | Poles reflect natal weights | Compare pole sizes to user's natal data (7 planet weights) | Stronger planets produce larger pole amplitude |
| 1.4 | Trail continuity | Observe for 30s | Trails draw smoothly, no flickering, no gaps, center void stays clear |
| 1.5 | Tab visibility | Switch to another tab for 10s, return | Animation resumes without glitch, no trail explosion |

## 2. Dissonance Wiring

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 2.1 | Dissonance modulation visible | Open `/signatur`, observe pole movement | Poles exhibit three-layer modulation: movement mode (natal), trail density (accumulated), texture (elemental) |
| 2.2 | Zero dissonance | Test with a fresh user (no quiz data) | Calm, symmetric pole behavior — no erratic movement |
| 2.3 | High dissonance | Complete quizzes that create element tension | More dynamic pole movement, denser trails in tension areas |

## 3. Day Harmonic

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 3.1 | Day mode accent | Open `/signatur` during active transit | Visual accent layer visible (day harmonic modulates membrane) |
| 3.2 | No day data | Clear `ff_daily_modal_v1` flag | Engine renders without day harmonic — neutral fallback, no crash |

## 4. Space Weather Modulation

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 4.1 | Solar pressure visible | Open `/signatur` during active solar weather | Trail intensity scaled by solar pressure (1.0 calm — 1.5 extreme) |
| 4.2 | G3+ storm effect | Wait for G3+ event (or mock via `/api/space-weather/extended`) | Visible intensity boost, korona_eruption effect triggers |
| 4.3 | No space weather | Block `/api/space-weather/extended` in DevTools | Engine renders normally with default intensity (1.0) |

## 5. Data Bridge

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 5.1 | Soulprint → natal weights | Log in with user who has astro_profiles | `soulprintToNatalWeights()` produces 7 planet weights visible in pole sizes |
| 5.2 | Quiz → quiz weights | Complete a cluster of quizzes | `quizSectorsToQuizWeights()` feeds 6 dimensions to engine |
| 5.3 | Transit polling | Monitor Network tab on `/signatur` | `/api/transit-state/:userId` polled every 800ms (exponential backoff on error) |
| 5.4 | Missing transit data | Block `/api/transit-state` in DevTools | Engine falls back to neutral defaults (0.5 per dimension), no visual glitch |

## 6. Feature Flag & Fallback

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 6.1 | V3 default | Clear all `ff_*` localStorage keys | V3 bipolar trail engine renders (default on) |
| 6.2 | Disable V3 | `localStorage.setItem('ff_signature_engine_v3', 'false')`, reload | Falls back to V2 spirograph engine (or V1 if V2 also disabled) |
| 6.3 | Re-enable V3 | `localStorage.removeItem('ff_signature_engine_v3')`, reload | V3 bipolar trail engine renders again |
| 6.4 | Both V2+V3 disabled | Disable both `signature_engine_v2` and `signature_engine_v3` | V1 FusionRingWebsiteCanvas renders as final fallback |
| 6.5 | Console warning | Disable `signature_engine_v3` via localStorage | Console shows critical flag warning |

## 7. Cross-Browser

| # | Browser | Check |
|---|---------|-------|
| 7.1 | Chrome (desktop) | All scenarios above pass |
| 7.2 | Safari (desktop) | All scenarios above pass |
| 7.3 | Firefox (desktop) | All scenarios above pass |
| 7.4 | Safari (iOS) | V3 renders, trails animate, no WebGL crash |
| 7.5 | Chrome (Android) | V3 renders, trails animate |

## 8. Edge Cases

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 8.1 | No user profile | Open `/signatur` without logging in | Redirect to onboarding or default ring with empty data |
| 8.2 | Partial API data | Return only BaZi (no Western/WuXing) | Ring renders with available data, missing sources use neutral defaults |
| 8.3 | Rapid tab switching | Switch tabs 10x quickly | No memory leak, no duplicate animation frames |
| 8.4 | Window resize | Resize browser window while ring animates | Canvas resizes, trails adapt, no visual artifacts |

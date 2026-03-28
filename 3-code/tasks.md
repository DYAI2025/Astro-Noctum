# Development Tasks

## Status Legend

| Status | Meaning |
|--------|---------|
| Todo | Not started |
| In Progress | Currently being worked on |
| Blocked | Waiting on external decision or dependency |
| Done | Completed and verified |
| Deferred | Moved to a future sprint |
| Cancelled | No longer needed |

## Priority Legend

| Priority | Meaning |
|----------|---------|
| P0 | Infrastructure / operations — must exist before features |
| P1 | Must-have goal coverage |
| P2 | Should-have goal coverage or nice-to-have |

---

## Completed Sprints

### S-DASH-POLISH — Dashboard Polish & Navigation (2026-03-25)

**Sprint Goal:** Dashboard wird production-ready: Ghost UI entfernen, Navigation überarbeiten, Planetarium aufwerten, Detailansichten aufbauen, Levi-Layer fixen.

| ID | Task | Component | Status | Notes |
|----|------|-----------|--------|-------|
| S-DP-01 | Remove "Tour wiederholen" + "Zahlung verwalten" from menu | frontend | Done | Ghost UI removed |
| S-DP-02 | Remove "Neustarten" button | frontend | Done | Button removed |
| S-DP-03 | Remove reload button in "dein Bazodiac" heading | frontend | Done | Button removed |
| S-DP-04 | Remove "KI-Synthese" heading | frontend | Done | Heading removed |
| S-DP-05 | Replace "Your Bazaar Blueprint" with German copy | frontend | Done | German copy applied |
| S-DP-06 | Fix Cosmic Blueprint DE/EN inconsistency | frontend | Done | CON-german-ui enforced |
| S-DP-07 | Fix Wu-Xing Metal icon showing "Wind" | frontend | Done | Icon + aria-label corrected to "Metall" |
| S-DP-08 | Build WuXingPage as extended analysis detail page | frontend | Done | commit e13d937 / 8cad909 |
| S-DP-09 | Gate WuXingPage extended content behind PremiumGate | frontend | Done | commit 55d3118 |
| S-DP-10 | Move Western houses from Dashboard to WuXingPage | frontend | Done | commit e13d937 |
| S-DP-11 | Fix Levi text: alignment, font size, remove italic | frontend | Done | commit 4152086 |
| S-DP-12 | Fix Levi buttons: size "Call Levi", remove "Levi Bazzi bereit" | frontend | Done | commit 4152086 + 57426d3 |
| S-DP-13 | Move Levi section higher in Dashboard | frontend | Done | commit 4152086 |
| S-DP-14 | Increase date/time display in Planetarium | frontend | Done | commit 943904c |
| S-DP-15 | Show current constellation alongside birth chart | frontend | Done | commit 943904c |
| S-DP-16 | Add constellation description at Planetarium bottom | frontend | Done | commit 943904c |
| S-DP-17 | Apply Planetarium enhancements to Solar System view | frontend | Done | commit 943904c |
| S-DP-18 | Create 3 navigation menu proposals with hover submenus | frontend | Done | commit 89d94ad / a322b2c |
| S-DP-19 | Redesign header: enlarge heading, create header zone | frontend | Done | commit 89d94ad |
| S-DP-20 | Surface FusionRingCanvasV2 post-processing errors | frontend | Done | commit edea89d |
| S-DP-21 | Surface usePremium Realtime fallback | frontend | Done | commit b43b9d7 |
| S-DP-22 | Add error propagation for tour_completed write | frontend | Done | commit fbaae99 |

### Dissonance Coefficient (2026-03-24)

| ID | Task | Component | Status | Notes |
|----|------|-----------|--------|-------|
| DEC-01 | DissonanceResult type + computeDissonance() | frontend | Done | commit f5b2c54 |
| DEC-02 | VisualModulation parameters type | frontend | Done | commit f5b2c54 |
| DEC-03 | Extend bazodiac-engine.ts with modulation hooks | frontend | Done | commit c83259e |
| DEC-04 | useDissonance React hook | frontend | Done | commit 41235e6 |
| DEC-05 | Morph transition system with dissonance-aware easing | frontend | Done | commit 5ca1681 |
| DEC-06 | Apply modulation in FusionRingCanvasV2 render loop | frontend | Done | commit 8f6e59d |
| DEC-07 | Persist dissonance state to Supabase | api-server | Done | commit 7c2257a |
| DEC-08 | Premium "Sichtbare Werte" toggle + gauge component | frontend | Done | commit 24f630f |

### Day-Pulse / Day-Mode (2026-03-25)

| ID | Task | Component | Status | Notes |
|----|------|-----------|--------|-------|
| DAY-01 | V3 Bipolar Trail Signature Engine prototype | frontend | Done | commit dd46bab |
| DAY-02 | DayHarmonicState + computeDayHarmonic + modulateConfig | frontend | Done | commit 009c03a |
| DAY-03 | harmony_index + day_mode in DailyFusionSchema | api-server | Done | commit 7d8dd62 |
| DAY-04 | Inject harmony_index + day_mode in /api/experience/daily proxy | api-server | Done | commit e52f3b0 |
| DAY-05 | Wire DayHarmonicState through SignaturV3Canvas + useFirstRunDaily | frontend | Done | commit 237ac13 |
| DAY-06 | DayModeModal wired into Dashboard | frontend | Done | commit 8096396 |
| DAY-07 | Extract DayHarmonicState to lib/fusion-ring/day-harmonic.ts | frontend | Done | commit 78f18c4 |

### Day-Pulse Backend Completion (2026-03-27)

| ID | Task | Component | Status | Notes |
|----|------|-----------|--------|-------|
| DPB-01 | Supabase daily_horoscope_cache as L2 behind in-memory Map | api-server | Done | L2 read in try/catch for resilience |
| DPB-02 | Daily recurrence — seen flag boolean → date-based | frontend | Done | daily_modal_seen_date DATE column |
| DPB-03 | SVG fallback when canvas unavailable in DayModeModal | frontend | Done | commit fb6ff99 |
| DPB-04 | Delete deprecated DailyHoroscopeModal | frontend | Done | commit 24ba304 |
| DPB-05 | Update API docs (harmony_index, day_mode) + architecture refs | - | Done | commit 3c6441f |
| DPB-06 | Remove dead daily_modal_* analytics event names | frontend | Done | commit 3b8fb4b |
| DPB-07 | Update daily_modal_v1 flag description in CLAUDE.md | - | Done | commit 6873ca3 |

### Bugs (Fixed)

| ID | Bug | Component | Status | Notes |
|----|-----|-----------|--------|-------|
| BUG-04 | FusionRingCanvasV2 post-processing errors swallowed | frontend | Done | commit edea89d |
| BUG-05 | usePremium Realtime subscription falls back silently | frontend | Done | commit b43b9d7 |
| BUG-06 | Tour persistence fails silently | frontend | Done | commit fbaae99 |
| BUG-07 | Ghost UI: "Tour wiederholen" and "Zahlung verwalten" | frontend | Done | S-DP-01 |
| BUG-08 | "Neustarten" button with no function | frontend | Done | S-DP-02 |
| BUG-09 | Redundant reload button | frontend | Done | S-DP-03 |
| BUG-10 | Placeholder "Your Bazaar Blueprint" | frontend | Done | S-DP-05 |
| BUG-11 | Wu-Xing Metal icon shows "Wind" | frontend | Done | S-DP-07 |
| BUG-12 | Levi layer layout/sizing issues | frontend | Done | commit 4152086 + 57426d3 |
| BUG-13 | Blueprint DE/EN inconsistency | frontend | Done | S-DP-06 |
| BUG-14 | "KI-Synthese" heading never specified | frontend | Done | S-DP-04 |

---

## Execution Plan

### Phase A: Production Hardening

**Capabilities delivered:**
- Stripe payments fully operational (webhook verification)
- Deploy and migration procedures documented as runbooks

**Tasks:**
1. TASK-stripe-webhook-secret
2. TASK-bafe-determinism-test
3. TASK-deploy-runbook
4. TASK-migration-runbook

### Phase B: Onboarding Completion

**Capabilities delivered:**
- Experience API fully wired (bootstrap + signature-delta replace direct BAFE calls)
- REQ-F-cosmic-encounter-onboarding moves from Draft → Implemented
- Cosmic Encounter 7-phase onboarding gated behind feature flag

**Tasks:**
1. TASK-fuffire-experience-api
2. TASK-onboarding-route
3. TASK-onboarding-mobile-fallback
4. TASK-onboarding-flag-gate
5. TASK-phase-b-manual-testing

### Phase C: Dashboard & Voice Polish

**Capabilities delivered:**
- Dashboard layout matches product vision (Big Three prominent top)
- Levi voice agent has Signatur V2 knowledge base
- Daily Home layout ported to Dashboard

**Tasks:**
1. TASK-dashboard-wireframe
2. TASK-dashboard-layout-redesign
3. TASK-daily-home-port
4. TASK-levi-system-prompt
5. TASK-levi-auto-summary

### Phase D: Signatur V3 Engine

**Capabilities delivered:**
- Bipolar trail engine replaces particle spirograph (DEC-signatur-v3-bipolar-trails)
- Dissonance model visible in ring (d_natal, d_accumulated, d_elemental)
- Bloom fine-tuning and solar coupling

**Tasks:**
1. TASK-v3-pole-system
2. TASK-v3-trail-renderer
3. TASK-v3-dissonance-visual
4. TASK-v3-feature-flag
5. TASK-bloom-fine-tuning
6. TASK-bloom-solar-coupling

### Phase E: Autopoietic UX Evolution

**Capabilities delivered:**
- Z-axis depth navigation replaces horizontal scrolling
- UI adapts to user's dominant Wu-Xing element
- Progressive fluidity based on engagement depth

**Tasks:**
1. TASK-depth-navigation
2. TASK-depth-nav-implement
3. TASK-element-ui-adaptation
4. TASK-engagement-fluidity
5. TASK-phase-e-manual-testing

### Phase F: Partnership Features (Blocked)

Blocked on 6 open questions (OQ-house-system through OQ-synastry-signal). 18 tasks tracked in GitHub Issues (#115, #117, #118, #119, #123, #124, #129, #130, #132, #136). Will be added once OQs are resolved.

### Phase G: Mobile Parity

**Capabilities delivered:**
- iOS app reaches feature parity with web on core flows
- 3D SignaturCanvas mounted and functional
- Offline contribution queue tested end-to-end

**Tasks:**
1. TASK-mobile-signatur-3d
2. TASK-mobile-offline-e2e
3. TASK-mobile-onboarding
4. TASK-ios-lockscreen-widget

---

## Setup & Infrastructure

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-stripe-webhook-secret | Configure `STRIPE_WEBHOOK_SECRET` on Railway; verify webhook signature validation | P0 | Done | - | - | 2026-03-28 | 5-min config task, only remaining Stripe blocker |
| TASK-bafe-determinism-test | Add contract test: identical birth data → identical BAFE responses across runs | P1 | Done | [REQ-F-natal-chart-calculation](../1-objectives/requirements/REQ-F-natal-chart-calculation.md) | - | 2026-03-28 | Covers determinism Success Criterion |
| TASK-depth-navigation | Design Z-axis depth navigation concept (surface → core metaphor replacing horizontal scroll) | P1 | Todo | - | - | 2026-03-28 | Design-first: wireframe before code |

## Frontend

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-onboarding-route | Build OnboardingPage with BirthForm + FusionRingReveal + quiz phase as state machine | P1 | Todo | [REQ-F-cosmic-encounter-onboarding](../1-objectives/requirements/REQ-F-cosmic-encounter-onboarding.md) | TASK-fuffire-experience-api | 2026-03-28 | 7-phase state machine |
| TASK-onboarding-mobile-fallback | Implement mobile fallback for onboarding (CSS+image when viewport < 768px) | P1 | Todo | [REQ-F-cosmic-encounter-onboarding](../1-objectives/requirements/REQ-F-cosmic-encounter-onboarding.md) | TASK-onboarding-route | 2026-03-28 | CosmicEncounterMobile component |
| TASK-onboarding-flag-gate | Gate full Cosmic Encounter behind `cosmic_encounter_v1` flag; legacy BirthForm as fallback | P1 | Todo | [REQ-F-cosmic-encounter-onboarding](../1-objectives/requirements/REQ-F-cosmic-encounter-onboarding.md) | TASK-onboarding-route | 2026-03-28 | Flag currently hard-disabled |
| TASK-dashboard-wireframe | Design wireframe for Dashboard redesign (Big Three top, influence gauges, Levi, Blueprint) | P1 | Todo | - | - | 2026-03-28 | Design-first: needs Ben's approval |
| TASK-dashboard-layout-redesign | Implement Dashboard layout per approved wireframe | P1 | Todo | - | TASK-dashboard-wireframe | 2026-03-28 | |
| TASK-daily-home-port | Port 5-zone Daily Home layout to Dashboard.tsx with real Contexts | P1 | Deferred | [REQ-F-cosmic-encounter-onboarding](../1-objectives/requirements/REQ-F-cosmic-encounter-onboarding.md) | TASK-dashboard-layout-redesign | 2026-03-28 | Data mapping from source layout |
| TASK-v3-pole-system | Implement 12-pole bipolar system with Cousto frequencies and dimension mapping | P1 | Todo | [REQ-F-fusion-ring-visualization](../1-objectives/requirements/REQ-F-fusion-ring-visualization.md) | - | 2026-03-28 | DEC-signatur-v3-bipolar-trails |
| TASK-v3-trail-renderer | Canvas 2D additive trail renderer with semi-transparent frame clear | P1 | Todo | [REQ-F-fusion-ring-visualization](../1-objectives/requirements/REQ-F-fusion-ring-visualization.md) | TASK-v3-pole-system | 2026-03-28 | |
| TASK-v3-dissonance-visual | Wire d_natal → geometry, d_accumulated → trail density, d_elemental → vibration texture | P1 | Todo | [REQ-F-fusion-ring-visualization](../1-objectives/requirements/REQ-F-fusion-ring-visualization.md) | TASK-v3-trail-renderer | 2026-03-28 | DEC-dissonance-model |
| TASK-v3-feature-flag | Gate V3 behind `signatur_engine_v3` flag; V2 remains default fallback | P1 | Todo | [REQ-F-fusion-ring-visualization](../1-objectives/requirements/REQ-F-fusion-ring-visualization.md) | TASK-v3-dissonance-visual | 2026-03-28 | |
| TASK-bloom-fine-tuning | Reduce glow, increase color saturation per user feedback (V2+V3) | P2 | Deferred | [REQ-F-fusion-ring-visualization](../1-objectives/requirements/REQ-F-fusion-ring-visualization.md) | - | 2026-03-28 | After live test |
| TASK-bloom-solar-coupling | Couple Bloom intensity to solar activity via computeRingModulation | P2 | Todo | [REQ-F-space-weather-modulation](../1-objectives/requirements/REQ-F-space-weather-modulation.md) | - | 2026-03-28 | Needs decision |
| TASK-depth-nav-implement | Implement depth navigation: Dashboard (surface) → Signatur (mid) → Core detail views (deep) | P1 | Todo | - | TASK-depth-navigation | 2026-03-28 | |
| TASK-element-ui-adaptation | Apply user's dominant Wu-Xing element to UI accent colors, card textures, transition speeds | P1 | Todo | - | - | 2026-03-28 | DEC-wuxing-ui-mapping |
| TASK-engagement-fluidity | Progressive UI fluidity: new users see conventional nav, engaged users see gesture-based fluid nav | P1 | Todo | - | TASK-depth-nav-implement | 2026-03-28 | |

## API Server

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-fuffire-experience-api | Wire `/experience/bootstrap` + `/experience/signature-delta` in server.mjs; replace direct BAFE calls | P1 | Todo | [REQ-F-cosmic-encounter-onboarding](../1-objectives/requirements/REQ-F-cosmic-encounter-onboarding.md) | - | 2026-03-28 | FuFirE live at bafe-production.up.railway.app |
| TASK-levi-system-prompt | Configure ElevenLabs agent with Signatur V2 knowledge base | P1 | Deferred | - | - | 2026-03-28 | See docs/LEVI_SIGNATUR_V2_KNOWLEDGE.md |
| TASK-levi-auto-summary | Auto-summarize user profile after 3 Levi sessions via /api/agent/summary | P2 | Todo | - | TASK-levi-system-prompt | 2026-03-28 | |

## Mobile

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-mobile-signatur-3d | Mount SignaturCanvas on FuRingScreen (currently unused expo-gl + three.js component) | P2 | Todo | [REQ-F-fusion-ring-visualization](../1-objectives/requirements/REQ-F-fusion-ring-visualization.md) | - | 2026-03-28 | |
| TASK-mobile-offline-e2e | End-to-end test: offline quiz → queue → flush on reconnect | P2 | Todo | [REQ-F-quiz-contribution-system](../1-objectives/requirements/REQ-F-quiz-contribution-system.md) | - | 2026-03-28 | |
| TASK-mobile-onboarding | Port onboarding flow to mobile (CosmicEncounterMobile fallback) | P2 | Todo | [REQ-F-cosmic-encounter-onboarding](../1-objectives/requirements/REQ-F-cosmic-encounter-onboarding.md) | TASK-onboarding-route | 2026-03-28 | |
| TASK-ios-lockscreen-widget | Concept + prototype for daily Signatur widget on iOS Lock Screen | P2 | Todo | - | - | 2026-03-28 | Idea phase |

## Deploy & Operations

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-deploy-runbook | Create Railway deploy runbook (build, env vars checklist, rollback steps) | P0 | Done | - | - | 2026-03-28 | |
| TASK-migration-runbook | Create Supabase migration runbook (SQL Editor workflow, rollback patterns) | P0 | Done | - | - | 2026-03-28 | |
| TASK-phase-b-manual-testing | Create onboarding runbook: test scenarios for all 7 phases, desktop + mobile, flag on/off | P1 | Todo | - | TASK-onboarding-flag-gate | 2026-03-28 | |
| TASK-phase-e-manual-testing | Update deploy runbook with depth-nav test scenarios and element-adaptation verification | P1 | Todo | - | TASK-engagement-fluidity | 2026-03-28 | |

## Partnership Features (Blocked)

Open questions requiring human decision before work can begin:

| ID | Question | Status |
|----|----------|--------|
| OQ-house-system | House system: Placidus or Koch? | Blocked (Ben's decision) |
| OQ-synastry-consent | Synastry without partner account? | Blocked (Ben's decision) |
| OQ-orb-tolerance | Orb tolerance for interaspects? | Blocked (Ben's decision) |
| OQ-minor-aspects | Minor aspects (Quincunx, Semisextile) or only 5 main? | Blocked (Ben's decision) |
| OQ-narrative-generation | Partnership narratives: fixed templates or Gemini-generated? | Blocked (Ben's decision) |
| OQ-synastry-signal | Synastry as 4th signal or separate system? | Blocked (Ben's decision) |

Partnership implementation tasks (18 items across S08-S11) are tracked in GitHub Issues and will be added here once open questions are resolved.

---

GitHub Issues (#115, #117, #118, #119, #123, #124, #129, #130, #132, #136) remain in GitHub for detailed tracking.

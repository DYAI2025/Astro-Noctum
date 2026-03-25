# Development Tasks

## Phase: Current Sprint — S-DASH-POLISH (Dashboard Polish & Navigation)

**Sprint Goal:** Dashboard wird production-ready: Ghost UI entfernen, Navigation überarbeiten, Planetarium aufwerten, Detailansichten aufbauen, Levi-Layer fixen.
**Full Sprint Spec:** [Sprints/sprint-dashboard-polish/SPRINT.md](../Sprints/sprint-dashboard-polish/SPRINT.md)

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
| S-DP-09 | Gate WuXingPage extended content behind PremiumGate | frontend | Done | commit 55d3118 — PremiumGate wraps element analysis |
| S-DP-10 | Move Western houses from Dashboard to WuXingPage | frontend | Done | commit e13d937 — houses removed from Dashboard |
| S-DP-11 | Fix Levi text: alignment, font size, remove italic | frontend | Done | commit 4152086 |
| S-DP-12 | Fix Levi buttons: size "Call Levi", remove "Levi Bazzi bereit" | frontend | Done | commit 4152086 + 57426d3 compact tile |
| S-DP-13 | Move Levi section higher in Dashboard | frontend | Done | commit 4152086 |
| S-DP-14 | Increase date/time display in Planetarium | frontend | Done | commit 943904c |
| S-DP-15 | Show current constellation alongside birth chart | frontend | Done | commit 943904c |
| S-DP-16 | Add constellation description at Planetarium bottom | frontend | Done | commit 943904c |
| S-DP-17 | Apply Planetarium enhancements to Solar System view | frontend | Done | commit 943904c |
| S-DP-18 | Create 3 navigation menu proposals with hover submenus | frontend | Done | commit 89d94ad / a322b2c — Variant A implemented |
| S-DP-19 | Redesign header: enlarge heading, create header zone | frontend | Done | commit 89d94ad — gold accent line + enlarged heading |
| S-DP-20 | Surface FusionRingCanvasV2 post-processing errors | frontend | Done | commit edea89d — REDUZIERTER MODUS badge + onPostProcessDegraded callback |
| S-DP-21 | Surface usePremium Realtime fallback | frontend | Done | commit b43b9d7 — 30s poll fallback with console.warn |
| S-DP-22 | Add error propagation for tour_completed write | frontend | Done | commit fbaae99 — persistError exposed from useDashboardTour |

## Phase: Completed — Dissonance Coefficient (2026-03-24)

| ID | Task | Component | Status | Notes |
|----|------|-----------|--------|-------|
| DEC-01 | DissonanceResult type + computeDissonance() | frontend | Done | commit f5b2c54 — src/lib/fusion-ring/dissonance.ts |
| DEC-02 | VisualModulation parameters type | frontend | Done | commit f5b2c54 — src/lib/fusion-ring/dissonance-visual.ts |
| DEC-03 | Extend bazodiac-engine.ts with modulation hooks | frontend | Done | commit c83259e |
| DEC-04 | useDissonance React hook | frontend | Done | commit 41235e6 — src/hooks/useDissonance.ts |
| DEC-05 | Morph transition system with dissonance-aware easing | frontend | Done | commit 5ca1681 |
| DEC-06 | Apply modulation in FusionRingCanvasV2 render loop | frontend | Done | commit 8f6e59d |
| DEC-07 | Persist dissonance state to Supabase (upsertDissonanceState) | api-server | Done | commit 7c2257a + migration 20260324_dissonance_state.sql |
| DEC-08 | Premium "Sichtbare Werte" toggle + gauge component | frontend | Done | commit 24f630f — DissonanceValues.tsx, FuRingPage wired |

## Phase: Completed — Day-Pulse / Day-Mode (2026-03-25)

| ID | Task | Component | Status | Notes |
|----|------|-----------|--------|-------|
| DAY-01 | V3 Bipolar Trail Signature Engine prototype | frontend | Done | commit dd46bab |
| DAY-02 | DayHarmonicState + computeDayHarmonic + modulateConfig | frontend | Done | commit 009c03a |
| DAY-03 | harmony_index + day_mode in DailyFusionSchema | api-server | Done | commit 7d8dd62 |
| DAY-04 | Inject harmony_index + day_mode in /api/experience/daily proxy | api-server | Done | commit e52f3b0 |
| DAY-05 | Wire DayHarmonicState through SignaturV3Canvas + useFirstRunDaily | frontend | Done | commit 237ac13 |
| DAY-06 | DayModeModal wired into Dashboard | frontend | Done | commit 8096396 |
| DAY-07 | Extract DayHarmonicState to lib/fusion-ring/day-harmonic.ts | frontend | Done | commit 78f18c4 |

## Phase: Deferred (Previously Current Sprint — moved to next sprint)

| ID | Task | Component | Req | Status | Notes |
|----|------|-----------|-----|--------|-------|
| TASK-daily-home-port | Port 5-zone Daily Home layout to Dashboard.tsx with real Contexts | frontend | REQ-F-cosmic-encounter-onboarding | Deferred | Data mapping from source layout |
| TASK-levi-system-prompt | Configure ElevenLabs agent with Signatur V2 knowledge base | api-server | — | Deferred | See docs/LEVI_SIGNATUR_V2_KNOWLEDGE.md |
| TASK-onboarding-route | Build OnboardingPage with BirthForm + FusionRingReveal flow | frontend | REQ-F-cosmic-encounter-onboarding | Deferred | Adjust App.tsx routing |
| TASK-bloom-fine-tuning | Reduce glow, increase color saturation per user feedback | frontend | REQ-F-fusion-ring-visualization | Deferred | After live test |

## Phase: Bugs (Fix Before Next Feature)

| ID | Bug | Component | Status | Notes |
|----|-----|-----------|--------|-------|
| BUG-04 | Silent-catch in `FusionRingCanvasV2` `Vignette`/`OutputPass` — Three.js post-processing errors swallowed, no console output | frontend | Done | commit edea89d — onPostProcessDegraded callback + REDUZIERTER MODUS badge |
| BUG-05 | `usePremium` Realtime subscription falls back to polling silently — no log, no user feedback | frontend | Done | commit b43b9d7 — setInterval(30s) poll fallback on CHANNEL_ERROR/TIMED_OUT |
| BUG-06 | Tour persistence fails silently — `tour_completed` write to Supabase fails without error propagation | frontend | Done | commit fbaae99 — persistError state exposed from useDashboardTour |
| BUG-07 | Dashboard top-right shows "Tour wiederholen" and "Zahlung verwalten" options — never intended, no descriptions | frontend | Done | Ghost UI removed (S-DP-01) |
| BUG-08 | "Neustarten" button present but no restart function exists for horoscope/quizzes/content | frontend | Done | Button removed (S-DP-02) |
| BUG-09 | Redundant reload button in "dein Bazodiac" heading — browser already provides this | frontend | Done | Button removed (S-DP-03) |
| BUG-10 | Placeholder text "Your Bazaar Blueprint" shown in "Kosmischer Blueprint" section | frontend | Done | German copy applied (S-DP-05) |
| BUG-11 | Wu-Xing element chart: Metal icon shows "Wind" with hover tooltip "Wind" | frontend | Done | Icon + aria-label fixed to "Metall" (S-DP-07) |
| BUG-12 | Levi layer: text offset left-aligned, italic, very small (poor readability); "Call Levi" button oversized; extra small "Levi Bazzi bereit" button present | frontend | Done | commit 4152086 + 57426d3 — layout, sizing, italic removed |
| BUG-13 | Cosmic Blueprint section: inconsistent DE/EN language mix; heading and body text respond differently to language toggle | frontend | Done | CON-german-ui enforced (S-DP-06) |
| BUG-14 | "KI-Synthese" heading displayed but never specified in design | frontend | Done | Heading removed (S-DP-04) |

## Phase: Backlog (Prioritized)

| ID | Task | Component | Req | Status | Notes |
|----|------|-----------|-----|--------|-------|
| TASK-fuffire-experience-api | Wire `/experience/bootstrap` + `/experience/signature-delta` in `server.mjs`; replace direct BAFE calls in bootstrap flow | api-server | REQ-F-cosmic-encounter-onboarding | Pending | FuFirE live at bafe-production.up.railway.app; see docs/API_EXPERIENCE.md |
| TASK-stripe-checkout-endpoint | ~~Implement checkout endpoint~~ — CODE EXISTS: `/api/checkout` in server.mjs | api-server | — | Done | Verified via code scan 2026-03-24 |
| TASK-stripe-webhook-secret | Configure `STRIPE_WEBHOOK_SECRET` env var on Railway; verify `/api/webhook` signature validation | api-server | — | Pending | ONLY remaining Stripe blocker — 5min config task |
| TASK-dashboard-layout-redesign | Redesign Dashboard layout: Big Three (Sun/Moon/Ascendant) prominent top; Wu-Xing + Houses moved to detail page | frontend | — | Pending | Design-first task; needs wireframe before implementation |
| TASK-levi-auto-summary | Auto-summarize user profile after 3 Levi sessions | api-server | — | Pending | FEAT from backlog |
| TASK-bloom-solar-coupling | Evaluate coupling Bloom intensity to solar activity | frontend | REQ-F-space-weather-modulation | Pending | FRAGE: needs decision |
| TASK-ios-lockscreen-widget | Concept for daily Signatur widget on iOS Lock Screen | mobile | — | Pending | IDEA: later phase |

## Phase: Partnership Features (Roadmap — blocked by open questions)

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

GitHub Issues (#115, #117, #118, #119, #123, #124, #129, #130, #132, #136) remain in GitHub for detailed tracking. Items above are the scaffold-level view.

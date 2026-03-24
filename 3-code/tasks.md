# Development Tasks

## Phase: Current Sprint — S-DASH-POLISH (Dashboard Polish & Navigation)

**Sprint Goal:** Dashboard wird production-ready: Ghost UI entfernen, Navigation überarbeiten, Planetarium aufwerten, Detailansichten aufbauen, Levi-Layer fixen.
**Full Sprint Spec:** [Sprints/sprint-dashboard-polish/SPRINT.md](../Sprints/sprint-dashboard-polish/SPRINT.md)

| ID | Task | Component | Status | Notes |
|----|------|-----------|--------|-------|
| S-DP-01 | Remove "Tour wiederholen" + "Zahlung verwalten" from menu | frontend | Pending | Ghost UI — never specified |
| S-DP-02 | Remove "Neustarten" button | frontend | Pending | No matching feature |
| S-DP-03 | Remove reload button in "dein Bazodiac" heading | frontend | Pending | Duplicates browser refresh |
| S-DP-04 | Remove "KI-Synthese" heading | frontend | Pending | Not in any requirement |
| S-DP-05 | Replace "Your Bazaar Blueprint" with German copy | frontend | Pending | Violates CON-german-ui |
| S-DP-06 | Fix Cosmic Blueprint DE/EN inconsistency | frontend | Pending | Violates CON-german-ui |
| S-DP-07 | Fix Wu-Xing Metal icon showing "Wind" | frontend | Pending | Factually wrong — trust-critical |
| S-DP-08 | Build WuXingPage as extended analysis detail page | frontend | Pending | Includes houses, graphs, stats |
| S-DP-09 | Gate WuXingPage extended content behind PremiumGate | frontend | Pending | Premium content |
| S-DP-10 | Move Western houses from Dashboard to WuXingPage | frontend | Pending | Dashboard cleanup |
| S-DP-11 | Fix Levi text: alignment, font size, remove italic | frontend | Pending | Poor readability |
| S-DP-12 | Fix Levi buttons: size "Call Levi", remove "Levi Bazzi bereit" | frontend | Pending | UI clutter |
| S-DP-13 | Move Levi section higher in Dashboard | frontend | Pending | After Ring, before detail sections |
| S-DP-14 | Increase date/time display in Planetarium | frontend | Pending | Min 18px |
| S-DP-15 | Show current constellation alongside birth chart | frontend | Pending | Use astronomy-engine |
| S-DP-16 | Add constellation description at Planetarium bottom | frontend | Pending | German, with background |
| S-DP-17 | Apply Planetarium enhancements to Solar System view | frontend | Pending | Mirror S-DP-14/15/16 |
| S-DP-18 | Create 3 navigation menu proposals with hover submenus | frontend | Pending | Ben picks A/B/C |
| S-DP-19 | Redesign header: enlarge heading, create header zone | frontend | Pending | Dark luxury aesthetic |
| S-DP-20 | Surface FusionRingCanvasV2 post-processing errors | frontend | Stretch | Silent failure fix |
| S-DP-21 | Surface usePremium Realtime fallback | frontend | Stretch | Silent failure fix |
| S-DP-22 | Add error propagation for tour_completed write | frontend | Stretch | Silent failure fix |

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
| BUG-04 | Silent-catch in `FusionRingCanvasV2` `Vignette`/`OutputPass` — Three.js post-processing errors swallowed, no console output | frontend | Pending | Add `onError` handler + surfacing in UI; see BUG-TRACKER |
| BUG-05 | `usePremium` Realtime subscription falls back to polling silently — no log, no user feedback | frontend | Pending | Add explicit fallback log + user notification path |
| BUG-06 | Tour persistence fails silently — `tour_completed` write to Supabase fails without error propagation | frontend | Pending | Add error handling for Supabase write failure |
| BUG-07 | Dashboard top-right shows "Tour wiederholen" and "Zahlung verwalten" options — never intended, no descriptions | frontend | Pending | Remove or hide; these menu items were never specified |
| BUG-08 | "Neustarten" button present but no restart function exists for horoscope/quizzes/content | frontend | Pending | Remove button — no matching feature |
| BUG-09 | Redundant reload button in "dein Bazodiac" heading — browser already provides this | frontend | Pending | Remove — duplicates native browser refresh |
| BUG-10 | Placeholder text "Your Bazaar Blueprint" shown in "Kosmischer Blueprint" section | frontend | Pending | Replace with correct German copy per BRANDVOICE.md |
| BUG-11 | Wu-Xing element chart: Metal icon shows "Wind" with hover tooltip "Wind" | frontend | Pending | Fix icon + tooltip to show "Metall" |
| BUG-12 | Levi layer: text offset left-aligned, italic, very small (poor readability); "Call Levi" button oversized; extra small "Levi Bazzi bereit" button present | frontend | Pending | Redesign Levi layer layout — text legibility + button sizing |
| BUG-13 | Cosmic Blueprint section: inconsistent DE/EN language mix; heading and body text respond differently to language toggle | frontend | Pending | Enforce CON-german-ui: all UI text in German |
| BUG-14 | "KI-Synthese" heading displayed but never specified in design | frontend | Pending | Remove or clarify purpose — not in any requirement |

## Phase: Backlog (Prioritized)

| ID | Task | Component | Req | Status | Notes |
|----|------|-----------|-----|--------|-------|
| TASK-fuffire-experience-api | Wire `/experience/bootstrap` + `/experience/signature-delta` in `server.mjs`; replace direct BAFE calls in bootstrap flow | api-server | REQ-F-cosmic-encounter-onboarding | Pending | FuFirE live at bafe-production.up.railway.app; see docs/API_EXPERIENCE.md |
| TASK-stripe-checkout-endpoint | ~~Implement checkout endpoint~~ — CODE EXISTS: `/api/checkout` in server.mjs | api-server | — | Done | Verified via code scan 24.03.2026 |
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

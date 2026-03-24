# Development Tasks

## Phase: Current Sprint (Active Work)

| ID | Task | Component | Req | Status | Notes |
|----|------|-----------|-----|--------|-------|
| TASK-daily-home-port | Port 5-zone Daily Home layout to Dashboard.tsx with real Contexts | frontend | REQ-F-cosmic-encounter-onboarding | Pending | Data mapping from source layout |
| TASK-levi-system-prompt | Configure ElevenLabs agent with Signatur V2 knowledge base | api-server | — | Pending | See docs/LEVI_SIGNATUR_V2_KNOWLEDGE.md |
| TASK-onboarding-route | Build OnboardingPage with BirthForm + FusionRingReveal flow | frontend | REQ-F-cosmic-encounter-onboarding | Pending | Adjust App.tsx routing |
| TASK-bloom-fine-tuning | Reduce glow, increase color saturation per user feedback | frontend | REQ-F-fusion-ring-visualization | Pending | After live test |

## Phase: Bugs (Fix Before Next Feature)

| ID | Bug | Component | Status | Notes |
|----|-----|-----------|--------|-------|
| BUG-04 | Silent-catch in `FusionRingCanvasV2` `Vignette`/`OutputPass` — Three.js post-processing errors swallowed, no console output | frontend | Pending | Add `onError` handler + surfacing in UI; see BUG-TRACKER |
| BUG-05 | `usePremium` Realtime subscription falls back to polling silently — no log, no user feedback | frontend | Pending | Add explicit fallback log + user notification path |
| BUG-06 | Tour persistence fails silently — `tour_completed` write to Supabase fails without error propagation | frontend | Pending | Add error handling for Supabase write failure |

## Phase: Backlog (Prioritized)

| ID | Task | Component | Req | Status | Notes |
|----|------|-----------|-----|--------|-------|
| TASK-fufire-experience-api | Wire `/experience/bootstrap` + `/experience/signature-delta` in `server.mjs`; replace direct BAFE calls in bootstrap flow | api-server | REQ-F-cosmic-encounter-onboarding | Pending | FuFirE live at bafe-production.up.railway.app; see docs/API_EXPERIENCE.md |
| TASK-stripe-checkout-endpoint | Implement `/api/create-checkout-session` (or `/api/checkout`) in `server.mjs` — endpoint currently missing | api-server | — | Pending | `STRIPE_SECRET_KEY` set; `STRIPE_WEBHOOK_SECRET` missing |
| TASK-stripe-webhook-secret | Configure `STRIPE_WEBHOOK_SECRET` env var on Railway; verify `/api/webhook` signature validation | api-server | — | Pending | Blocker for Stripe webhook fulfillment |
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

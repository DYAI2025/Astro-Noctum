# Bazodiac — Product Owner Knowledge Base

*Last updated: 2026-03-24. Verify tasks.md and scaffold artifacts for latest state.*

---

## 1. What Is Bazodiac

Bazodiac is a **fusion astrology platform** combining three systems into a single living visualization called the **Signatur (Fusion Ring)**:

- **Western astrology** — natal chart, planets, houses, aspects
- **Chinese BaZi (Four Pillars of Destiny)** — year/month/day/hour pillars, stems/branches
- **Wu-Xing (Five Elements)** — Wood, Fire, Earth, Metal, Water cycle

**Core value proposition:** "Your cosmic fingerprint — not a horoscope, but a living, adapting signal of who you are."

The Fusion Ring is NOT a static chart. It evolves:
1. Birth data → deterministic core (immutable, always the same)
2. Quiz completions → modulate ring presentation
3. Space weather → real-time intensity modulation
4. Daily horoscope → narrative layer

**UI language:** German
**Aesthetic:** Dark luxury — OLED-first, obsidian/gold palette, Wu-Xing element colors
**Deployment:** Railway (Express server), React 19 SPA served from same origin

---

## 2. Three-Layer Autopoietic Model (Architecture Principle)

| Layer | Name | What It Is |
|-------|------|-----------|
| 1 | Obsidian Core | Deterministic astrological computation (BAFE). Same birth data → same signal. Immutable. |
| 2 | Neural Myzel | Causal modulations: quizzes, space weather, partnerships. Influences presentation, never the core. |
| 3 | Bioluminescent Membrane | Adaptive UI: Fusion Ring canvas, Three.js orrery, Dashboard. Evolves with engagement. |

**Key principle:** Signature weight capped at 0.5 — live data modulates display and narrative, never the underlying calculation.

---

## 3. Master Signal Formula — LOCKED

**Do NOT propose changing this formula.** Human decision by Ben, 2026-03-24.

```
Master = 0.35·N + 0.30·Q + 0.20·G + 0.15·alignment_boost
```

| Component | Weight | What it is |
|-----------|--------|-----------|
| N (Natal) | 0.35 | Deterministic birth calculation from BAFE |
| Q (Quiz) | 0.30 | 22 quizzes across 6 clusters |
| G (GCB) | 0.20 | Grand Cosmic Blueprint — cross-system synthesis |
| alignment_boost | 0.15 max | Resonance when multiple systems align (e.g. Western Sun = BaZi Day Master element) |

The alignment_boost is "das Herzstück des Systems" — it rewards cross-system coherence. Max 0.25. Must not be removed or absorbed into G.

A simpler 40/35/25 formula was explicitly rejected.

---

## 4. Tech Stack

| Layer | Technology |
|-------|-----------|
| Web frontend | React 19 SPA, Vite, React Router v6, Tailwind CSS v4, TypeScript |
| Mobile | Expo 53 / React Native 0.79 (iOS) |
| Shared library | @bazodiac/shared — signal math, quiz schemas, i18n |
| API server | Express (server.mjs) — Railway deployment |
| Astrological calculations | BAFE / FuFirE (bafe-production.up.railway.app) |
| Database + Auth | Supabase (auth.uid() = user_id RLS on all tables) |
| AI interpretation | Gemini Flash — horoscope text generation |
| Voice agent | ElevenLabs — "Levi Bazi" persona |
| Payments | Stripe — checkout + webhook + customer portal |
| Space weather | NOAA/DONKI API (5-min server cache) |
| 3D visualization | Three.js — Fusion Ring V2 (28K spirograph particles) + BirthChartOrrery |

---

## 5. Monetization Model

- **Free tier:** Birth chart, basic Fusion Ring, standard quizzes
- **Premium tier:** Levi voice agent (unlimited), Kinky quiz series, PartnerMatch quizzes, partnership analysis (when shipped)
- **Payment:** Stripe
- **Gate:** `is_premium` flag in Supabase `profiles` table; `PremiumGate` component wraps gated features

**⚠️ Current status (2026-03-24):**
- `STRIPE_SECRET_KEY` is set on Railway ✅
- `STRIPE_WEBHOOK_SECRET` is NOT set ❌
- `/api/create-checkout-session` endpoint does NOT exist in server.mjs ❌
- Premium flow is broken end-to-end until both are fixed

---

## 6. Approved Goals

| Goal | Priority | Status |
|------|----------|--------|
| GOAL-fusion-astrology | Must-have | Approved — Fuse Western, BaZi, Wu-Xing into a single living system |
| GOAL-autopoietic-ux | Must-have | Approved — UI adapts to user's elemental signature via three-layer model |

---

## 7. Requirements

| ID | Type | Status | Summary |
|----|------|--------|---------|
| REQ-F-natal-chart-calculation | Functional | Implemented | Calculate BaZi, Western, Wu-Xing, Fusion from birth data via BAFE |
| REQ-F-fusion-ring-visualization | Functional | Implemented | Interactive 3D Fusion Ring combining all astrological data |
| REQ-F-quiz-contribution-system | Functional | Implemented | 22 quizzes across 6 clusters modulating the Fusion Ring |
| REQ-F-cosmic-encounter-onboarding | Functional | Draft | 7-phase onboarding flow with Signatur reveal |
| REQ-F-space-weather-modulation | Functional | Implemented | Real-time solar weather modulates Fusion Ring intensity |

---

## 8. Active Constraints

| ID | Summary |
|----|---------|
| CON-german-ui | UI text in German; code identifiers and comments in English |
| CON-dark-luxury-aesthetic | Dark OLED-first design with obsidian/gold palette, Wu-Xing element colors |

---

## 9. Locked Design Decisions

| Decision | Key Rule |
|----------|---------|
| Supabase as sole backend | No other database; all tables need RLS: auth.uid() = user_id |
| BAFE/FuFirE for all astrological calculations | No client-side ephemeris; no alternative calc libraries |
| Wu-Xing UI mapping via centralized wuxing.ts | All element→color/physics mappings through wuxing.ts; no ad-hoc mapping |
| Master Signal weights locked | See Section 3 |

---

## 10. Current Sprint (Active Tasks)

| ID | Task | Component | Status |
|----|------|-----------|--------|
| TASK-daily-home-port | Port 5-zone Daily Home layout to Dashboard.tsx with real Contexts | frontend (src/) | Pending |
| TASK-levi-system-prompt | Configure ElevenLabs agent with Signatur V2 knowledge base | api-server (server.mjs) | Pending |
| TASK-onboarding-route | Build OnboardingPage with BirthForm + FusionRingReveal flow | frontend (src/) | Pending |
| TASK-bloom-fine-tuning | Reduce glow, increase color saturation per user feedback | frontend (src/) | Pending |

---

## 11. Bugs — Fix Before Next Feature

| ID | Bug | Impact |
|----|-----|--------|
| BUG-04 | Silent-catch in `FusionRingCanvasV2` `Vignette`/`OutputPass` — Three.js post-processing errors swallowed | Hard to debug production issues |
| BUG-05 | `usePremium` Realtime subscription falls back to polling silently — no log, no user feedback | Premium state may be stale without user knowing |
| BUG-06 | Tour persistence fails silently — `tour_completed` write to Supabase fails without error propagation | Tour shows again on next visit |

---

## 12. High-Priority Backlog

| ID | Task | Notes |
|----|------|-------|
| TASK-fuffire-experience-api | Wire `/experience/bootstrap` + `/experience/signature-delta` in server.mjs | FuFirE is live — unblocked |
| TASK-stripe-checkout-endpoint | Implement `/api/create-checkout-session` in server.mjs — currently missing | Blocker for premium |
| TASK-stripe-webhook-secret | Configure STRIPE_WEBHOOK_SECRET on Railway | Blocker for Stripe fulfillment |
| TASK-dashboard-layout-redesign | Big Three (Sun/Moon/Ascendant) prominent top; Wu-Xing + Houses to detail page | Needs wireframe first |
| TASK-levi-auto-summary | Auto-summarize user profile after 3 Levi sessions | From backlog |
| TASK-bloom-solar-coupling | Couple Bloom intensity to solar activity | Needs decision |
| TASK-ios-lockscreen-widget | iOS Lock Screen widget concept for daily Signatur | Later phase |

---

## 13. Partnership Features — Blocked

18 implementation tasks (Sprint 08-11) are blocked. All require Ben's decision:

| Question ID | Question |
|-------------|---------|
| OQ-house-system | House system: Placidus or Koch? |
| OQ-synastry-consent | Allow synastry without partner creating an account? |
| OQ-orb-tolerance | Orb tolerance for interaspects? |
| OQ-minor-aspects | Include Quincunx/Semisextile or only 5 major aspects? |
| OQ-narrative-generation | Partnership narratives: fixed templates or Gemini-generated? |
| OQ-synastry-signal | Synastry as 4th Master Signal component or separate system? |

---

## 14. SDLC Scaffold Integration

The project uses the [ai-scrum-scaffold](../../../Scrum_Master/ai-scrum-scaffold) as an overlay. All artifacts live in the repo:

| Phase | Directory | Key file |
|-------|-----------|---------|
| Objectives | `1-objectives/` | `CLAUDE.objectives.md` |
| Design | `2-design/` | `CLAUDE.design.md`, `decisions/` |
| Code | `3-code/` | `tasks.md` |
| Deploy | `4-deploy/` | `CLAUDE.deploy.md` |

Scaffold component dirs (`3-code/frontend/`, `3-code/api-server/`, `3-code/mobile/`) are steering-only — actual code lives in `src/`, `server.mjs`, `apps/mobile/`.

**Miro board:** Brainstorming only — not a source of truth. The scaffold is the single source of truth.
**GitHub Issues:** Bug reports and CI failures only.

---

## 15. Key Code Locations

| What | Where |
|------|-------|
| Root app state + routing | `src/App.tsx` |
| Express production server | `server.mjs` |
| Fusion Ring V2 engine | `src/components/fusion-ring-website/bazodiac-engine.ts` |
| Fusion Ring V2 renderer | `src/components/fusion-ring-website/FusionRingCanvasV2.tsx` |
| Master Signal engine | `src/lib/master-signal/` |
| Quiz system | `src/components/quizzes/` (22 quizzes) |
| Feature flags | `src/lib/feature-flags.ts` (3 flags: signature_onboarding_v1, daily_modal_v1, signature_engine_v2) |
| Supabase client | `src/lib/supabase.ts` |
| BAFE API client | `src/services/api.ts` |
| Experience API client | `src/services/experience.ts` |
| Premium hook | `src/hooks/usePremium.ts` |
| Space weather hook | `src/hooks/useSpaceWeather.ts` |

---

## 16. Working With Ben

- **Communication:** German in conversation, English in all artifact text
- **Decision style:** Presents options as A/B/C, responds with a single letter — always structure proposals this way
- **"Kommt drauf an"** = he wants a concrete proposal, not more questions
- **"Klären wir das"** = gather context, then present a specific recommendation
- **Miro:** He considers it "umständliches Behelfsmittel" — don't suggest Miro integrations
- **Sole authority on:** product direction, UX, design aesthetics, Master Signal formula, monetization model, partnership decisions

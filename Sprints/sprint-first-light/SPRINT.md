# Sprint: First Light — End-to-End User Flow

**Sprint ID:** S-FIRST-LIGHT
**Sprint Goal:** Ein neuer Nutzer kann sich anmelden, Geburtsdaten eingeben, seinen Ring sehen, mit Levi sprechen und auf Premium upgraden. Der gesamte Flow funktioniert end-to-end ohne Brüche.
**TRUE_NORTH Check:** "Bringt das den Organismus näher an sein Atmen?" — Ja. Ohne funktionierenden Onboarding-Flow und Payment kann der Organismus keinen Beobachter aufnehmen. First Light = der Moment, in dem der Ring zum ersten Mal für einen echten Nutzer leuchtet.

**Precondition:** S-DASH-POLISH abgeschlossen (Dashboard ist sauber).
**Estimated Scope:** 14 Tasks (3 Infrastructure + 5 Onboarding/Core + 4 Dashboard Enrichment + 2 Quality)
**Constraints:** CON-german-ui, CON-dark-luxury-aesthetic, BRANDVOICE.md

---

## Sprint Backlog

### Work Package 1: Stripe Live (Infrastructure — Day 1)

**Goal:** Premium payment works end-to-end. Revenue enabled.

| ID | Task | File(s) | Acceptance Criteria | Status |
|----|------|---------|---------------------|--------|
| S-FL-01 | Configure STRIPE_WEBHOOK_SECRET on Railway | Railway Dashboard → Environment Variables | Webhook secret set. Service redeployed. `/api/webhook/stripe` returns 200 for valid Stripe events. | Pending |
| S-FL-02 | E2E test: Stripe test purchase → profile.tier = 'premium' | `server.mjs`, Supabase `profiles` table | Test card (4242...) → Stripe checkout → success redirect → profiles.tier updated to 'premium' within 30s. Premium content visible immediately via Realtime subscription. | Pending |
| S-FL-03 | Wire FuFirE Experience API in server.mjs | `server.mjs`, `src/services/experience.ts` | `/experience/bootstrap` and `/experience/signature-delta` proxied through Express. Direct BAFE calls in bootstrap flow replaced. FuFirE at bafe-production.up.railway.app responds. | Pending |

**Agent Instructions:** S-FL-01 is a manual config task (Ben or agent with Railway access). S-FL-02: use Stripe CLI `stripe trigger checkout.session.completed` or manual test in browser. S-FL-03: see docs/API_EXPERIENCE.md for endpoint specs. Add proxy routes following the same pattern as existing `/api/calculate/*` routes in server.mjs.

---

### Work Package 2: Onboarding Flow (Core User Journey)

**Goal:** New user goes from signup to seeing their Ring for the first time.

| ID | Task | File(s) | Acceptance Criteria | Status |
|----|------|---------|---------------------|--------|
| S-FL-04 | Build OnboardingPage with BirthForm + FusionRingReveal flow | `src/pages/OnboardingPage.tsx` (new), `src/App.tsx` | Route `/onboarding` exists. BirthForm collects date, time, location. Geocoder resolves coordinates. Timezone auto-detected. On submit → calculateAll() fires → Ring reveal animation plays. | Pending |
| S-FL-05 | Add onboarding route to App.tsx with auth guard | `src/App.tsx` | Authenticated users without birth_data → redirected to `/onboarding`. Users with birth_data → go to `/dashboard`. Unauthenticated → go to auth gate. | Pending |
| S-FL-06 | Implement "Geburtstagshimmel" first-visit banner on Dashboard | `src/components/Dashboard.tsx` | First visit after onboarding shows celebratory banner with birth sky visualization. Banner dismissible. Not shown on subsequent visits (persisted in Supabase or localStorage). | Pending |
| S-FL-07 | Configure Levi ElevenLabs agent with Signatur V2 knowledge base | ElevenLabs Dashboard + `server.mjs` | Levi agent has access to user's full astro profile via `/api/profile/:userId` tool callback. Levi responds with Signatur V2 terminology (Ring, Signatur, Muster — per BRANDVOICE.md). System prompt uses BaZi + Western + Wu-Xing data. | Pending |
| S-FL-08 | Port 5-zone Daily Home layout to Dashboard.tsx | `src/components/Dashboard.tsx`, relevant context providers | Dashboard shows 5 zones: (1) Ring + current transit state, (2) Big Three cards (Sun/Moon/Ascendant), (3) BaZi Stelen, (4) Levi section, (5) Quiz access. Layout uses real data from AuthContext + AstroContext. | Pending |

**Agent Instructions:** For S-FL-04: Follow REQ-F-cosmic-encounter-onboarding spec. BirthForm should match the flow described in BAZODIAC.md Section 3.2. For S-FL-05: check existing auth logic in App.tsx — there may be partial routing already. For S-FL-07: see docs/LEVI_SIGNATUR_V2_KNOWLEDGE.md. This is partly manual (ElevenLabs dashboard) + code (tool callback endpoints). For S-FL-08: this is the layout that was deferred from the previous sprint cycle — it gives the Dashboard its intended structure.

---

### Work Package 3: Dashboard Enrichment (Closing S02/S03 Ready Items)

**Goal:** Dashboard features that are coded but not wired get connected.

| ID | Task | File(s) | Acceptance Criteria | Status |
|----|------|---------|---------------------|--------|
| S-FL-09 | Wire InfluenceGauges to real data (#115) | `src/components/` (identify InfluenceGauges component) | Gauges display actual influence values from user's astro profile. No placeholder data. | Pending |
| S-FL-10 | Wire InfluenceGauges Transit-Daten (#117) | Same as S-FL-09 + transit data source | Gauges update with current transit data. Real-time or cached per HEARTBEAT cadence. | Pending |
| S-FL-11 | Build Daily Insight Modal with Gemini (#118) | `src/components/` (new or existing modal component) | Modal shows AI-generated daily insight in German. Uses Gemini Flash. Content personalized to user's Ring + current transits. Dismissible. Shows once per day. | Pending |
| S-FL-12 | Add Planetarium Hover-States (#119) | `src/components/BirthChartOrrery.tsx` | Hovering over a planet in Orrery shows: planet name, zodiac position (degrees + sign), house placement. Tooltip styled per CON-dark-luxury-aesthetic. | Pending |

**Agent Instructions:** These are GitHub Issues #115, #117, #118, #119 — all marked "Ready" in BACKLOG.md. Check if partial implementations exist. For #118: use Gemini Flash with 15s timeout and DE fallback (same pattern as existing AI interpretation in onboarding). For #119: BirthChartOrrery.tsx is Three.js — use raycasting for hover detection.

---

### Work Package 4: Quality Gate (Sprint Exit Criteria)

**Goal:** The complete user flow works without errors.

| ID | Task | File(s) | Acceptance Criteria | Status |
|----|------|---------|---------------------|--------|
| S-FL-13 | Full E2E walkthrough: signup → onboarding → dashboard → quiz → premium → Levi | All | One complete user journey without errors. Console clean. All data persists in Supabase. Premium gate works. Levi responds with personalized data. | Pending |
| S-FL-14 | Performance audit: Dashboard load time < 3s on 4G | `src/`, `server.mjs` | Lighthouse performance score > 60. Dashboard LCP < 3s. No blocking requests > 5s. BAFE fallback chain tested. | Pending |

**Agent Instructions:** S-FL-13 is a manual or automated walkthrough — create a test user, go through every step. Document any failures as new bugs. S-FL-14: corresponds to GitHub Issue #125 (Performance Audit, S05, Ready). Use Lighthouse CLI or browser DevTools. Focus on BAFE proxy latency and Three.js initialization.

---

## Execution Order (Agent Priority)

```
1. WP1: Stripe Live              (S-FL-01 to S-FL-03) — unblocks revenue, day 1
2. WP2: Onboarding Flow          (S-FL-04 to S-FL-08) — core user journey
3. WP3: Dashboard Enrichment     (S-FL-09 to S-FL-12) — wiring ready features
4. WP4: Quality Gate             (S-FL-13 to S-FL-14) — sprint exit validation
```

## Definition of Done

- [ ] Stripe test purchase succeeds end-to-end (WP1)
- [ ] FuFirE Experience API proxied and responsive (WP1)
- [ ] New user can complete onboarding without errors (WP2)
- [ ] Dashboard shows 5-zone layout with real data (WP2)
- [ ] Levi responds with personalized Ring data (WP2)
- [ ] InfluenceGauges, Daily Modal, Hover-States functional (WP3)
- [ ] Full E2E walkthrough documented and passing (WP4)
- [ ] Dashboard LCP < 3s (WP4)
- [ ] `npm run lint` passes
- [ ] All text German per CON-german-ui
- [ ] No new silent failures (errors must be surfaced)

## Decisions Required From Ben During Sprint

| Decision | When | Format |
|----------|------|--------|
| Confirm Levi system prompt tone (Signatur V2 vs current) | Before S-FL-07 | Review + confirm |
| Daily Insight Modal: show at login or on-demand? | Before S-FL-11 | A (login) / B (on-demand) / C (both) |
| Bloom fine-tuning spec (deferred — when ready) | Backlog | Ben provides spec when ready |

## Items Explicitly NOT in This Sprint

| Item | Reason | Where It Lives |
|------|--------|---------------|
| #132 Archetypen-System | Needs S08 engine work first | BACKLOG.md S03/S08 |
| #133 Insignien-System | Depends on Archetypen | BACKLOG.md S04 |
| #129-#131 i18n Audit, Share-Flow, A/B Test | Sprint 07 scope, not critical path | BACKLOG.md S07 |
| #135 Quiz-Cluster Animation | Nice-to-have, not E2E critical | BACKLOG.md S05 |
| TASK-bloom-fine-tuning | Blocked on Ben's spec | Deferred |
| TASK-bloom-solar-coupling | Needs decision | Backlog |
| Partnership features | 6 decisions still open | BACKLOG.md S08-S11 |

---

*Sprint prepared: 2026-03-24 by Claude PO*
*Follows: S-DASH-POLISH (Dashboard Polish & Navigation)*
*Source: Deferred tasks, BACKLOG.md ready items, BAZODIAC_KNOWLEDGE.md*

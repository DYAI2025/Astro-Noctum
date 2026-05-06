# Upgrade-CTA Inventory — 2026-05-07

> **Source:** Dashboard sprint TASK-1.2 (`DEVELOPMENT_BRIEF.md`).
> **Goal:** map every active "Upgrade to premium" call site so TASK-1.3 can collapse the dashboard surface to a single CTA.
> **Scope:** every component currently rendered in the user-facing flow that exposes an upgrade-to-premium affordance. Test files excluded.

## TL;DR

- **1 canonical primitive** (`<UpgradeButton />`) with the only complete implementation: analytics, loading state, error state, i18n.
- **9 active mount points** that produce a visible upgrade affordance, of which **5 use the canonical primitive** and **4 reimplement the checkout call inline**.
- **3 distinct duplicate `handleUpgrade` implementations** across `App.tsx` (×2 used variants), `AgentSection.tsx`, and `DashboardLeviSection.tsx` — all call `POST /api/checkout` but diverge in analytics, error UI, and loading-state location.
- **1 dead-code component:** `src/components/dashboard/DashboardLeviSection.tsx` is defined and exports a fully working CTA but is **never mounted anywhere**. Includes its own duplicate `handleLeviUpgrade`.
- The dashboard route (`/`) currently renders **3 simultaneous upgrade CTAs** for a free user: bottom upgrade card, agent card upsell, and the floating-widget upsell.

## The canonical primitive — `UpgradeButton`

`src/components/UpgradeButton.tsx` is the only implementation that does all of:

| Concern | Behaviour |
|---|---|
| Network call | `authedFetch('/api/checkout', POST)` |
| Redirect | `window.location.href = url` from response |
| Loading | local `isRedirecting` flag → button disabled + `…` label |
| Error | local `error` flag → red explanation paragraph below |
| Analytics | `trackEvent('upgrade_clicked')` before fetch |
| i18n | `t('dashboard.premium.cta')` default label, `t('dashboard.premium.checkoutError')` error |
| Customisation | optional `label` and `className` props |

Every consolidation in TASK-1.3 should pivot the surviving CTAs to use this primitive.

## Inventory — all active CTA mount points

Grouped by host and scored against the canonical primitive's behaviour. Lines refer to the file at HEAD of `99b6ab3` (Dashboard sprint TASK-1.1).

### Group A — uses the canonical `<UpgradeButton />` directly

| # | File | Line | Surface | Visibility gate | Notes |
|---|------|------|---------|-----------------|-------|
| A1 | `src/components/Dashboard.tsx` | 498 | Bottom-of-dashboard upgrade card | `!isPremium` (Card-conditional) | Default label + style. Below "what's premium" copy at lines 491–496. |
| A2 | `src/components/PremiumGate.tsx` | 32 | Inline gate that wraps premium-only content (used as a render-prop component) | Used wherever the PremiumGate is mounted | Default label + style. **Hosts 5 downstream CTAs by composition** (see Group A-derived). |
| A3 | `src/components/navigation/AgentsPopup.tsx` | 105 | Premium-locked agent in the nav popup ("Levi Bazi unlock") | `!isPremium` for the agent | Custom `label` ("Premium freischalten") + custom gold-gradient `className`. Adds a tiny lock-icon caption below. |
| A4 | `src/components/signatur/PremiumUpgradeModal.tsx` | 96 | Modal triggered when a free user opens a premium-gated signatur quiz | Modal `isOpen` prop | Default label + style. **Two host pages mount this modal** (see modal-derived). |

#### A2 — PremiumGate-derived (composition through the canonical primitive)

PremiumGate itself uses `<UpgradeButton />`, so all of these automatically inherit the canonical behaviour. They are listed for completeness so TASK-1.3 knows the actual user-facing CTA count.

| # | File | Line | Teaser copy |
|---|------|------|-------------|
| A2a | `src/components/dashboard/DashboardTagesEnergie.tsx` | 379 | "Deine persönliche Einladung für heute" |
| A2b | `src/components/dashboard/DashboardAstroSection.tsx` | 135 | `t("dashboard.premium.teaserPillars")` |
| A2c | `src/components/dashboard/DashboardInterpretationSection.tsx` | 65 | `t('dashboard.premium.teaserInterpretation')` |
| A2d | `src/pages/WuXingPage.tsx` | 227 | (passed teaser prop, inspect at site) |
| A2e | `src/pages/SynastryPage.tsx` | 467 | "Synastrie ist Teil des Premium-Bereichs. …" |

#### A4 — PremiumUpgradeModal-derived

| # | File | Line | Trigger |
|---|------|------|---------|
| A4a | `src/pages/SignaturQuizzesPage.tsx` | 70 | Free user opens a premium-only quiz |
| A4b | `src/pages/SignaturPage.tsx` | 436 | Free user clicks a premium-only cluster |

### Group B — reimplements checkout inline (the consolidation targets)

These call sites bypass `UpgradeButton` and embed their own async handler. Each has a different subset of the canonical primitive's behaviour.

| # | File | Line | Handler | Loading state | Analytics? | Error UI? |
|---|------|------|---------|---------------|------------|-----------|
| B1 | `src/App.tsx` | 465 | `handleUpgrade` (defined L404) | none | **no** | **no** (silent `try/catch`) |
| B2 | `src/App.tsx` | 678 | same `handleUpgrade` (mobile nav variant) | none | **no** | **no** |
| B3 | `src/components/dashboard/AgentSection.tsx` | 180 | `handleUpgrade` (defined L98) | yes — `useAgent.setUpgrading(agent.id, true)` | **no** | **no** |
| B4 | `src/components/AgentFloatingWidget.tsx` | 209 | `onUpgrade` prop → wired to `App.tsx.handleLeviUpgrade` (defined L292) | **no** | **no** | **no** |

### Group C — dead code

| # | File | Line | Notes |
|---|------|------|-------|
| C1 | `src/components/dashboard/DashboardLeviSection.tsx` | 98 | Component defined and exports a fully working CTA (button at L98, `handleLeviUpgrade` at L34) but **never imported or mounted anywhere** in `src/`. Likely an earlier prototype superseded by `AgentSection`. Recommend deletion as part of TASK-1.3. |

## Duplicate-handler analysis

Three independent async handlers exist for the same operation. Each is technically equivalent in network shape (`POST /api/checkout`, redirect on `url`) but diverges on the soft contract.

```text
canonical (UpgradeButton.handleUpgrade)
    POST /api/checkout
    + trackEvent('upgrade_clicked')
    + isRedirecting state → disabled + "…"
    + error state → user-visible error paragraph

App.tsx.handleUpgrade (B1, B2)
    POST /api/checkout
    - no analytics
    - no loading visual (button stays clickable while in-flight)
    - silent failure (errors swallowed in try/catch)

App.tsx.handleLeviUpgrade (B4 via AgentFloatingWidget)
    POST /api/checkout
    - no analytics
    - no loading visual
    - silent failure

AgentSection.handleUpgrade (B3)
    POST /api/checkout
    - no analytics
    - loading via useAgent.setUpgrading → button disabled + "…"
    - silent failure (no error paragraph)

DashboardLeviSection.handleLeviUpgrade (DEAD)
    POST /api/checkout
    - no analytics
    - local leviUpgrading state
    - silent failure
```

**Cost of the divergence:**
- Conversion-funnel analytics undercount: every `upgrade_clicked` from B1–B4 is invisible. A user hitting the desktop nav lock icon (B1) → Stripe Checkout → completion is logged only in Stripe, not in `trackEvent`.
- Silent failures: if `/api/checkout` returns 503 (no Stripe configured) or 500, B1–B4 leave the user on the same page with no feedback, no retry hint. UpgradeButton (and only UpgradeButton) shows "checkoutError" copy.

## What the user actually sees

For a **free user** landing on `/` (Dashboard) right now, simultaneously visible upgrade CTAs:

1. Desktop top-nav: lock-icon link to `/atlas` (B1 — silent handler)
2. Floating widget bottom-right: "Unlock Premium" button (B4 — silent handler via App)
3. Agent card mid-dashboard: "🔒 Premium freischalten" gold button (B3 — has loading, no error)
4. Bottom upgrade card: yellow `<UpgradeButton />` (A1 — full canonical)
5. Various per-section locks via `<PremiumGate>`: TagesEnergie, BaZi pillars, AI interpretation (A2a–A2c — full canonical)

That is **5 distinct CTAs on a single dashboard route**, all competing for attention with mismatched copy ("Premium freischalten" / "Unlock Premium" / `dashboard.premium.cta` / "Atlas Premium") and four different visual treatments (yellow, gold-gradient, locked nav-link, premium variant `<Button>`).

## Recommendations for TASK-1.3

1. **Pick exactly one prime CTA on the dashboard route.** Recommend the bottom upgrade card (A1) — it has the most context (subtitle copy explaining what unlocks) and uses the canonical primitive without override.
2. **Delete or hide all in-route duplicates** for free users on `/`:
   - Drop B3 from AgentSection (the agent card's own button) — keep the lock visual but route the click to scroll-into-view of A1, or make A1 the AgentSection's CTA via prop.
   - Drop B4 from AgentFloatingWidget for free users — the floating widget should be premium-only or unauthenticated entirely.
   - Keep B1/B2 (nav-locks) — they are *contextual* (the user clicked a premium-only route) and serve a different intent than the dashboard upsell. But pivot their `handleUpgrade` to call the canonical handler so analytics and error handling unify.
3. **Pivot all four B-handlers to call the canonical `UpgradeButton` flow** by:
   - Either rendering `<UpgradeButton label="…" className="…" />` instead of a custom `<button>`/`<Button>` (cleanest, but requires the existing custom styling to migrate to `className`).
   - Or extracting `UpgradeButton`'s logic into a `useUpgradeCheckout()` hook returning `{ start, isRedirecting, error }` so non-button hosts (nav, floating widget) can reuse the analytics + error path without rendering the button shell. Recommend this option — keeps `<UpgradeButton>` as the default visual primitive and unblocks future custom-styled call sites.
4. **Delete `DashboardLeviSection`** (C1) outright. Has been dead since `AgentSection` superseded it; carrying it forward only invites accidental future imports.
5. **Audit `t('dashboard.premium.cta')` translation** — the same key feeds A1, A2, A3, B3 today, but copy varies in practice ("Premium freischalten" override in AgentsPopup). After TASK-1.3, rationalise to one default label with documented override sites.

## Off-scope but adjacent (not for TASK-1.3)

- **Stripe Customer Portal link** in `ManageSubscription.tsx` is correctly NOT a CTA — only premium users see it. Leave as is.
- **`PremiumUpgradeModal`** has its own footer button styling distinct from the dashboard upgrade card. Keep separate; modal context is different from inline upsell.
- **`<PremiumGate>` content-wrapping** is the right pattern for in-section gates. Don't collapse — the duplicate-CTA problem is at the dashboard composition level, not at the section level.

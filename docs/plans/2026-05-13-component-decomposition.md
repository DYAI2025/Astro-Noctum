# Component Decomposition Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create the per-component directory structure under `3-code/` based on the approved 6-component decomposition (`shared-types`, `web-frontend`, `web-server`, `edge-functions`, `database`, `tagespuls-package`) with IR-2 (schedulers folded into `edge-functions`) and MR-2/3/4 clarifying notes incorporated, then update `3-code/CLAUDE.code.md` and `CLAUDE.md` Current State.

**Architecture:** Each component directory contains a single `CLAUDE.component.md` file describing responsibility, technology, interfaces, requirement coverage, and relevant decisions. The shared `3-code/CLAUDE.code.md` Components section lists all six components. `CLAUDE.md` Current State records the decomposition outcome.

**Tech Stack:** Markdown files in the SDLC scaffold. No build / runtime changes.

---

## Pre-flight

### Step P.1: Verify directory and design state

Run:

```bash
ls "3-code/"
```

Expected output:

```
CLAUDE.code.md
tasks.md
```

No component directories should exist yet. If any do, stop and consult the user.

Run:

```bash
ls "2-design/" "decisions/" | grep -E "DEC-|architecture|data-model|api-design"
```

Expected output includes:

```
architecture.md
api-design.md
data-model.md
DEC-llm-provider-gemini.history.md
DEC-llm-provider-gemini.md
DEC-rtbf-grace-window-24h.history.md
DEC-rtbf-grace-window-24h.md
DEC-supabase-as-personal-data-store.history.md
DEC-supabase-as-personal-data-store.md
```

If any of these are missing, stop and consult the user.

---

## Task 1: Create `shared-types` component

**Rationale:** IR-1 resolution. Centralizes TypeScript types shared by `web-frontend`, `web-server`, `edge-functions`, and `tagespuls-package` to prevent type drift across the four runtimes.

**Files:**
- Create: `3-code/shared-types/CLAUDE.component.md`

### Step 1.1: Create the directory and write `CLAUDE.component.md`

Use the Write tool to create `3-code/shared-types/CLAUDE.component.md` with this exact content:

```markdown
# Shared Types

**Responsibility**: TypeScript-only workspace package providing entity, DTO, error-envelope, and analytics-event types shared between `web-frontend`, `web-server`, `edge-functions`, and `tagespuls-package`. No runtime; pure types and constants.

**Technology**: TypeScript. Published as an npm/pnpm workspace package (no compile target; consumers import `.ts` directly or via `tsc --declaration` output, depending on workspace setup chosen during implementation).

## Interfaces

- Imported as a workspace dependency by `web-frontend`, `web-server`, `edge-functions`, `tagespuls-package`.
- No HTTP, no runtime, no side effects.
- Exports include: entity types (`UserAstroProfile`, `DailyPulse`, `DailyInterpretation`, `Aphorism`, `AphorismUsageEvent`, `CosmicWeatherSnapshot`, `ConsentRecord`, `RtbfDeletionJob`, `RtbfAuditLogEntry`, `SubscriptionState`), API DTO shapes (request / response per `api-design.md`), error envelope shape and `error.code` enum, analytics event payload types and event-name enum, Council archetype-key enum, mode-tag enum.

## Notes

- Source of truth for entity shapes is [`2-design/data-model.md`](../../2-design/data-model.md).
- Source of truth for API DTO shapes is [`2-design/api-design.md`](../../2-design/api-design.md).
- Tagespuls-domain types currently defined at `apps/tagespuls_package/packages/voice/src/types.ts` are imported and re-exported here, OR migrated into this package (Code-phase implementation decision).
- This package has **no business logic**. Functions belong in the consuming component; only types, constants, and pure type-level utilities (e.g., `Pick`-derived view types) belong here.

## Requirements Addressed

This component does not directly satisfy any single requirement; it is a structural mechanism that supports type consistency across all other components. Indirect contribution to:

| File | Why |
|------|-----|
| [REQ-COMP-analytics-pii-free](../../1-spec/requirements/REQ-COMP-analytics-pii-free.md) | Single source of truth for the per-event allowed-property allowlist (enforced via TypeScript types at every emit site). |
| [REQ-USA-checkout-error-categories](../../1-spec/requirements/REQ-USA-checkout-error-categories.md) | Single source of truth for the `error.code` enum used by AS-6 client and the server emitting the error. |

## Relevant Decisions

| File | Title | Trigger |
|------|-------|---------|
| _(none yet — this component is structural; runtime decisions live in consuming components.)_ | | |
```

### Step 1.2: Verify file exists

Run:

```bash
ls "3-code/shared-types/"
```

Expected:

```
CLAUDE.component.md
```

### Step 1.3: Commit

```bash
git add "3-code/shared-types/CLAUDE.component.md"
git commit -m "feat(3-code): add shared-types component skeleton

Resolves IR-1 from 2026-05-13 decomposition review: TypeScript types
shared across web-frontend, web-server, edge-functions, and
tagespuls-package now live in a single workspace package, preventing
type drift across the four runtimes."
```

---

## Task 2: Create `web-frontend` component

**Files:**
- Create: `3-code/web-frontend/CLAUDE.component.md`

### Step 2.1: Write `CLAUDE.component.md`

Use the Write tool to create `3-code/web-frontend/CLAUDE.component.md` with this exact content:

```markdown
# Web Frontend

**Responsibility**: React SPA — dashboard composition, Daily Pulse UI, Council selection, Signature anchor, Upgrade funnel UI, ManageSubscription UI, consent surfaces, polling hooks, analytics emission. Also hosts the privacy notice page (the page lives here; the **content is authored / legally reviewed outside this component**, per MR-4).

**Technology**: TypeScript, React, Vite, Tailwind / CSS modules (per existing codebase convention). Supabase Auth client for session management. Three.js for the FS-2 SignaturRenderer pipeline.

## Interfaces

- HTTP → `web-server` (legacy `/api/*` routes — `/api/checkout`, `/api/impact/active`, `/api/stripe/portal-session`).
- HTTP → `edge-functions` (`/v1/*` — daily-pulse, daily-interpretation, consents, data-export, rtbf, subscription-state).
- Browser → Stripe-hosted Checkout via `window.location.href` redirect.
- Browser → Stripe Customer Portal via `window.location.href` redirect (single-use TTL-≤5min URL).
- Reads feature flags (`tagespuls_neu_v1`, `daily_modal_v1`).
- Emits analytics events through the client-side PII gateway (CC-1 mechanism).
- Imports types from `shared-types`.

## Notes on Frozen Subsystems

- **FS-2 SignaturRenderer pipeline** (`src/components/signatur-3d/`, `src/components/signatur-renderer/`, `src/lib/signatur-3d/`, `src/lib/cymatics/`) is frozen per [CON-no-signatur-v3-rebuild](../../1-spec/constraints/CON-no-signatur-v3-rebuild.md). Integration is via AS-5 `SignaturAnchorCard` and `SectionErrorBoundary`; renderer internals are not modified.
- **FS-1 cymatics math** (partial — `src/lib/cymatics/`) lives here. The remainder of FS-1 (BaZi / Wu-Xing / ephemeris compute) lives in `web-server`. The split is acknowledged per MR-2 and is not a redesign target.

## Notes on Cross-Component Enforcement (MR-3)

- [REQ-SEC-tls-everywhere](../../1-spec/requirements/REQ-SEC-tls-everywhere.md): client-side discipline is to call only HTTPS URLs and refuse mixed content; **HSTS header injection, TLS-1.2+ enforcement, plain-HTTP-to-HTTPS redirect are deploy-layer concerns shared with `4-deploy/`**.
- [REQ-SEC-no-secrets-in-client](../../1-spec/requirements/REQ-SEC-no-secrets-in-client.md): client-side discipline is to never embed server-side keys; **build-time secret scan and deploy-time spot-check are operated from `4-deploy/`**.

## Requirements Addressed

| File | Type | Priority | Status |
|------|------|----------|--------|
| [REQ-F-tour-overlay-state](../../1-spec/requirements/REQ-F-tour-overlay-state.md) | Functional | Must | Approved |
| [REQ-USA-fallback-indicator](../../1-spec/requirements/REQ-USA-fallback-indicator.md) | Usability | Must | Approved |
| [REQ-USA-profile-incomplete-cta](../../1-spec/requirements/REQ-USA-profile-incomplete-cta.md) | Usability | Must | Approved |
| [REQ-USA-dashboard-section-order](../../1-spec/requirements/REQ-USA-dashboard-section-order.md) | Usability | Should | Draft |
| [REQ-USA-signature-first-viewport](../../1-spec/requirements/REQ-USA-signature-first-viewport.md) | Usability | Must | Approved |
| [REQ-USA-signature-empty-state](../../1-spec/requirements/REQ-USA-signature-empty-state.md) | Usability | Must | Approved |
| [REQ-REL-signature-error-isolation](../../1-spec/requirements/REQ-REL-signature-error-isolation.md) | Reliability | Must | Approved |
| [REQ-PERF-signature-no-direct-embed](../../1-spec/requirements/REQ-PERF-signature-no-direct-embed.md) | Performance | Should | Draft |
| [REQ-F-useDailyPulse-null-guard](../../1-spec/requirements/REQ-F-useDailyPulse-null-guard.md) | Functional | Should | Draft |
| [REQ-F-tagespuls-feature-flag](../../1-spec/requirements/REQ-F-tagespuls-feature-flag.md) | Functional | Should | Draft |
| [REQ-USA-tagespuls-card-phases](../../1-spec/requirements/REQ-USA-tagespuls-card-phases.md) | Usability | Should | Draft |
| [REQ-USA-cta-singular](../../1-spec/requirements/REQ-USA-cta-singular.md) | Usability | Must | Approved |
| [REQ-F-checkout-single-trigger](../../1-spec/requirements/REQ-F-checkout-single-trigger.md) | Functional | Must | Approved |
| [REQ-F-checkout-stripe-redirect](../../1-spec/requirements/REQ-F-checkout-stripe-redirect.md) | Functional | Must | Approved |
| [REQ-USA-checkout-error-categories](../../1-spec/requirements/REQ-USA-checkout-error-categories.md) | Usability | Must | Approved |
| [REQ-F-agent-card-no-checkout](../../1-spec/requirements/REQ-F-agent-card-no-checkout.md) | Functional | Must | Approved |
| [REQ-F-manage-subscription](../../1-spec/requirements/REQ-F-manage-subscription.md) | Functional | Must | Approved |
| [REQ-PERF-polling-budget](../../1-spec/requirements/REQ-PERF-polling-budget.md) | Performance | Should | Draft |
| [REQ-PERF-polling-visibility](../../1-spec/requirements/REQ-PERF-polling-visibility.md) | Performance | Should | Draft |
| [REQ-MNT-single-poller-per-source](../../1-spec/requirements/REQ-MNT-single-poller-per-source.md) | Maintainability | Should | Draft |
| [REQ-COMP-analytics-pii-free](../../1-spec/requirements/REQ-COMP-analytics-pii-free.md) | Compliance | Must | Approved |
| [REQ-COMP-privacy-notice](../../1-spec/requirements/REQ-COMP-privacy-notice.md) | Compliance | Must | Approved |
| [REQ-SEC-auth-session-storage](../../1-spec/requirements/REQ-SEC-auth-session-storage.md) | Security | Must | Approved |
| [REQ-SEC-tls-everywhere](../../1-spec/requirements/REQ-SEC-tls-everywhere.md) | Security | Must | Approved |
| [REQ-SEC-no-secrets-in-client](../../1-spec/requirements/REQ-SEC-no-secrets-in-client.md) | Security | Must | Approved |

## Relevant Decisions

| File | Title | Trigger |
|------|-------|---------|
| _(none yet — frontend-specific decisions, e.g., state-management library choice or feature-flag service, are recorded as they emerge during Code phase.)_ | | |
```

### Step 2.2: Verify

```bash
ls "3-code/web-frontend/"
```

Expected:

```
CLAUDE.component.md
```

### Step 2.3: Commit

```bash
git add "3-code/web-frontend/CLAUDE.component.md"
git commit -m "feat(3-code): add web-frontend component skeleton

React SPA component: dashboard, Daily Pulse, Council selection,
Signature anchor, Upgrade funnel, ManageSubscription, consent
surfaces. Embeds MR-2/3/4 notes: FS-1 cymatics partial home,
TLS / secrets enforcement shared with deploy, privacy notice
content authored outside the component."
```

---

## Task 3: Create `web-server` component

**Files:**
- Create: `3-code/web-server/CLAUDE.component.md`

### Step 3.1: Write `CLAUDE.component.md`

Use the Write tool to create `3-code/web-server/CLAUDE.component.md` with this exact content:

```markdown
# Web Server

**Responsibility**: Existing Node server hosting legacy `/api/*` routes — Stripe Checkout entry (`POST /api/checkout`), Stripe webhook receiver (`POST /api/stripe/webhook`), Stripe Customer Portal session issuer (`POST /api/stripe/portal-session`), driver-strip / coherence endpoint (`POST /api/impact/active`). Hosts the server-side portion of frozen FS-1 (BaZi / Wu-Xing / ephemeris compute) and the entirety of frozen FS-3 (Stripe stack).

**Technology**: Node + TypeScript (existing `server.mjs` and adjacent route files in `Astro-Noctum-prod/`). Stripe Node SDK. Supabase server-side client (with service-role token at server boundary only).

## Interfaces

- HTTP server: accepts requests from `web-frontend` and from Stripe (webhooks).
- Outbound: Stripe API (Checkout sessions, Customer Portal sessions, customer-deletion).
- Reads / writes Supabase Postgres (via `database` schema — primarily `subscription_state` UPSERT from webhook handler, `user_astro_profiles` reads for impact-active).
- Imports types from `shared-types`.

## Notes on Frozen Subsystems

- **FS-3 Stripe stack** is frozen per [CON-stripe-payment-stack](../../1-spec/constraints/CON-stripe-payment-stack.md). `/api/checkout` and `/api/stripe/webhook` contracts are documented as-is in [`api-design.md`](../../2-design/api-design.md) §3.1; no replacement, no custom checkout UI. Stripe webhooks are the sole source of truth for subscription state.
- **FS-1 astrology engine** (partial — BaZi / Wu-Xing / ephemeris / harmony-index compute) lives in this component, while the cymatics / Chladni-params portion lives in `web-frontend`. The split is acknowledged per MR-2 and is not a redesign target.

## Notes on Cross-Component Enforcement (MR-3)

- [REQ-SEC-tls-everywhere](../../1-spec/requirements/REQ-SEC-tls-everywhere.md): server-side discipline is HTTPS-only outbound URLs and HSTS-on-response; **TLS-1.2+ termination and certificate provisioning live at the deploy / infrastructure layer (`4-deploy/`)**.
- [REQ-SEC-no-secrets-in-client](../../1-spec/requirements/REQ-SEC-no-secrets-in-client.md): server owns the secrets (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`); never serializes them into responses. **Build-time secret scan and deploy-time spot-check are operated from `4-deploy/`**.

## Requirements Addressed

| File | Type | Priority | Status |
|------|------|----------|--------|
| [REQ-F-impact-active-contract](../../1-spec/requirements/REQ-F-impact-active-contract.md) | Functional | Must | Approved |
| [REQ-F-checkout-single-trigger](../../1-spec/requirements/REQ-F-checkout-single-trigger.md) | Functional | Must | Approved (server side: rate-limit guardrail) |
| [REQ-F-checkout-stripe-redirect](../../1-spec/requirements/REQ-F-checkout-stripe-redirect.md) | Functional | Must | Approved (server side: returns `{ url }`) |
| [REQ-USA-checkout-error-categories](../../1-spec/requirements/REQ-USA-checkout-error-categories.md) | Usability | Must | Approved (server side: status codes + `error.code`) |
| [REQ-F-manage-subscription](../../1-spec/requirements/REQ-F-manage-subscription.md) | Functional | Must | Approved (server side: Customer Portal session URL) |
| [REQ-SEC-checkout-rate-limit](../../1-spec/requirements/REQ-SEC-checkout-rate-limit.md) | Security | Must | Approved |
| [REQ-SEC-portal-session-tokens](../../1-spec/requirements/REQ-SEC-portal-session-tokens.md) | Security | Must | Approved |
| [REQ-SEC-no-secrets-in-client](../../1-spec/requirements/REQ-SEC-no-secrets-in-client.md) | Security | Must | Approved (server holds the secrets) |
| [REQ-SEC-tls-everywhere](../../1-spec/requirements/REQ-SEC-tls-everywhere.md) | Security | Must | Approved (HSTS header on responses) |

Stripe webhook handler (responsible for `subscription_state` UPSERTs) implicitly satisfies the data-model contracts in [`data-model.md`](../../2-design/data-model.md) §6.

## Relevant Decisions

| File | Title | Trigger |
|------|-------|---------|
| [DEC-supabase-as-personal-data-store](../../decisions/DEC-supabase-as-personal-data-store.md) | Supabase as primary personal-data store | When adding a new server route that reads / writes personal data |
```

### Step 3.2: Verify

```bash
ls "3-code/web-server/"
```

Expected:

```
CLAUDE.component.md
```

### Step 3.3: Commit

```bash
git add "3-code/web-server/CLAUDE.component.md"
git commit -m "feat(3-code): add web-server component skeleton

Node server hosting legacy /api/* routes (Stripe Checkout entry,
webhook handler, Customer Portal session issuer, impact-active).
Hosts frozen FS-3 (Stripe) and the server-side portion of FS-1
(BaZi / Wu-Xing / ephemeris compute)."
```

---

## Task 4: Create `edge-functions` component (with IR-2 scheduled-jobs scope)

**Files:**
- Create: `3-code/edge-functions/CLAUDE.component.md`

### Step 4.1: Write `CLAUDE.component.md`

Use the Write tool to create `3-code/edge-functions/CLAUDE.component.md` with this exact content:

```markdown
# Edge Functions

**Responsibility**: Supabase Edge Functions hosting both HTTP-triggered endpoints (`/v1/users/:userId/*`) and cron-triggered scheduled jobs. HTTP endpoints cover the Daily Pulse Engine (AS-3), Daily Interpretation, Consent CRUD, Data Export, RTBF endpoint trio, and Subscription State read. Includes the centralized LLM gateway. Scheduled jobs (IR-2 resolution) cover the RTBF state-machine scheduler, the Stripe ↔ `subscription_state` reconciliation job, and the daily `cosmic_weather_snapshots` insertion.

**Technology**: Deno (Supabase Edge Functions runtime), TypeScript. Supabase server-side client (service-role token, server-only). Google Gemini SDK for the LLM gateway. Imports types from `shared-types`. Cron triggers via Supabase pg_cron or external scheduler (chosen during Code phase, recorded as a separate `DEC-*`).

## Interfaces

- HTTP server (HTTP-triggered functions): accepts authenticated requests from `web-frontend` and unauthenticated single-token requests for RTBF confirm / cancel.
- Cron triggers (scheduled functions): invoked by Supabase pg_cron (or equivalent) on a documented cadence.
- Outbound: Google Gemini API (LLM gateway), Supabase Postgres reads / writes, Stripe API (reconciliation job + RTBF customer-deletion call).
- Imports types from `shared-types`.

## Scheduled Jobs (IR-2)

| Job | Cadence | Purpose |
|-----|---------|---------|
| **RTBF scheduler** | ≥ every 1 h (per `DEC-rtbf-grace-window-24h` enforcement) | Transitions `rtbf_deletion_jobs` rows from `pending_grace` to `executing` when `grace_window_ends_at <= NOW()`, then runs the deletion cascade per [`data-model.md`](../../2-design/data-model.md) §4. |
| **Stripe ↔ `subscription_state` reconciliation** | Once per day | For users whose `subscription_state.synced_at` is older than 25 hours, fetch Stripe's authoritative state and correct local divergences. Per [`data-model.md`](../../2-design/data-model.md) §6. |
| **`cosmic_weather_snapshots` insertion** | Once per day (boundary of the local day) | INSERTs the day's snapshot of planetary positions, transit aspects, Kp index, sunspot count. Never updates existing rows. |

## Notes

- All HTTP endpoints enforce `:userId` = JWT subject claim per [REQ-SEC-edge-function-auth](../../1-spec/requirements/REQ-SEC-edge-function-auth.md). Mismatches return 403.
- The LLM gateway is a shared module within this component, not a separate component. All LLM calls (slot 2 / slot 3 / Council interpretation) route through it, enforcing per-user rate limits, prompt sanitization, and consent checks per [REQ-SEC-llm-gateway-hardening](../../1-spec/requirements/REQ-SEC-llm-gateway-hardening.md) and [REQ-COMP-llm-purpose-consent](../../1-spec/requirements/REQ-COMP-llm-purpose-consent.md).

## Notes on Cross-Component Enforcement (MR-3)

- [REQ-SEC-tls-everywhere](../../1-spec/requirements/REQ-SEC-tls-everywhere.md): outbound HTTPS-only; HSTS on responses. Transport-layer enforcement is deploy-layer (`4-deploy/`).

## Requirements Addressed

| File | Type | Priority | Status |
|------|------|----------|--------|
| [REQ-F-aphorism-approval-gate](../../1-spec/requirements/REQ-F-aphorism-approval-gate.md) | Functional | Should | Draft (runtime filter on `aphorisms.status = 'approved'`) |
| [REQ-F-daily-pulse-determinism](../../1-spec/requirements/REQ-F-daily-pulse-determinism.md) | Functional | Should | Draft |
| [REQ-F-council-interpretation-cache](../../1-spec/requirements/REQ-F-council-interpretation-cache.md) | Functional | Should | Draft |
| [REQ-COMP-consent-record](../../1-spec/requirements/REQ-COMP-consent-record.md) | Compliance | Must | Approved (CRUD endpoints) |
| [REQ-COMP-data-export](../../1-spec/requirements/REQ-COMP-data-export.md) | Compliance | Must | Approved (export endpoint + file generation) |
| [REQ-COMP-rtbf](../../1-spec/requirements/REQ-COMP-rtbf.md) | Compliance | Must | Approved (request / confirm / cancel endpoints + scheduler + cascade) |
| [REQ-COMP-llm-purpose-consent](../../1-spec/requirements/REQ-COMP-llm-purpose-consent.md) | Compliance | Must | Approved (gateway-level consent check) |
| [REQ-SEC-edge-function-auth](../../1-spec/requirements/REQ-SEC-edge-function-auth.md) | Security | Must | Approved |
| [REQ-SEC-export-authz](../../1-spec/requirements/REQ-SEC-export-authz.md) | Security | Must | Approved |
| [REQ-SEC-rtbf-authz](../../1-spec/requirements/REQ-SEC-rtbf-authz.md) | Security | Must | Approved |
| [REQ-SEC-llm-gateway-hardening](../../1-spec/requirements/REQ-SEC-llm-gateway-hardening.md) | Security | Must | Approved |
| [REQ-SEC-tls-everywhere](../../1-spec/requirements/REQ-SEC-tls-everywhere.md) | Security | Must | Approved (HSTS on responses) |

## Relevant Decisions

| File | Title | Trigger |
|------|-------|---------|
| [DEC-supabase-as-personal-data-store](../../decisions/DEC-supabase-as-personal-data-store.md) | Supabase as primary personal-data store | When adding an endpoint that reads / writes per-user data |
| [DEC-llm-provider-gemini](../../decisions/DEC-llm-provider-gemini.md) | Google Gemini as primary LLM provider | When adding a feature that requires LLM output — all calls go through the LLM gateway |
| [DEC-rtbf-grace-window-24h](../../decisions/DEC-rtbf-grace-window-24h.md) | RTBF cancellation grace window is 24 hours | When implementing the RTBF state machine or the scheduler advancing `pending_grace → executing` |
```

### Step 4.2: Verify

```bash
ls "3-code/edge-functions/"
```

Expected:

```
CLAUDE.component.md
```

### Step 4.3: Commit

```bash
git add "3-code/edge-functions/CLAUDE.component.md"
git commit -m "feat(3-code): add edge-functions component skeleton

Supabase Edge Functions hosting both HTTP endpoints (/v1/users/:userId/*)
and cron-triggered scheduled jobs (RTBF scheduler, Stripe
reconciliation, cosmic-weather snapshot). Includes the centralized
LLM gateway. Resolves IR-2 by folding scheduled jobs into this
component rather than splitting them out."
```

---

## Task 5: Create `database` component

**Files:**
- Create: `3-code/database/CLAUDE.component.md`

### Step 5.1: Write `CLAUDE.component.md`

Use the Write tool to create `3-code/database/CLAUDE.component.md` with this exact content:

```markdown
# Database

**Responsibility**: Supabase Postgres schema for the 11 entities defined in [`data-model.md`](../../2-design/data-model.md). Includes migrations, RLS policies, indexes, and seed scripts. Authoritative source for table definitions, constraints, and the invariants I-DM-1 through I-DM-8.

**Technology**: SQL (PostgreSQL 15+), Supabase CLI for migration management. Seed scripts in Python or TypeScript (chosen during Code phase).

## Interfaces

- Schema (DDL): applied via `supabase db push` or CI-driven migration runner.
- Runtime: read / written by `web-server` (Stripe webhook UPSERTs into `subscription_state`, reads `user_astro_profiles`) and `edge-functions` (all per-user reads / writes, RTBF cascade, consent records).
- Seed input: consumes `aphorisms.json` from `tagespuls-package` to populate the `aphorisms` reference table.

## Entities Owned

Per [`data-model.md`](../../2-design/data-model.md):

- Operational (per-user): `user_astro_profiles`, `daily_pulses`, `daily_interpretations`, `cosmic_weather_snapshots`, `aphorism_usage_events`.
- Reference (system): `aphorisms`.
- Compliance / state: `consent_records`, `rtbf_deletion_jobs`, `rtbf_audit_log`, `subscription_state`.
- `auth.users` is owned by Supabase Auth — referenced but not owned.

## RLS Policy Strategy

- Per-user tables enforce `auth.uid() = user_id` for SELECT / INSERT / UPDATE.
- Reference tables (`aphorisms`, `cosmic_weather_snapshots`) are SELECT-permitted to authenticated users; INSERT / UPDATE restricted to the service role.
- Append-only tables (`consent_records`, `rtbf_audit_log`) reject UPDATE / DELETE for non-service-role callers.
- `rtbf_deletion_jobs` writes are service-role-only (Edge Functions act as service role).

## Invariants Enforced

| Invariant | Enforcement |
|-----------|-------------|
| I-DM-1 (same-user constraint) | FK + CHECK or trigger |
| I-DM-2 / I-DM-3 (approved aphorism) | Application-layer check at write time (FK alone insufficient because `aphorisms.status` is mutable) |
| I-DM-4 (engine_version ↔ is_fallback) | CHECK constraint |
| I-DM-5 (LLM-consent before interpretation) | Application-layer check at write time |
| I-DM-6 (completed → user_id NULL) | CHECK constraint |
| I-DM-7 (audit-log entry for each job) | Trigger or application-layer guarantee |
| I-DM-8 (premium ↔ active subscription) | Daily reconciliation job + application-layer check |

## Requirements Addressed

| File | Type | Priority | Status |
|------|------|----------|--------|
| [REQ-COMP-consent-record](../../1-spec/requirements/REQ-COMP-consent-record.md) | Compliance | Must | Approved (schema + RLS) |
| [REQ-COMP-data-export](../../1-spec/requirements/REQ-COMP-data-export.md) | Compliance | Must | Approved (queryable per-user data) |
| [REQ-COMP-rtbf](../../1-spec/requirements/REQ-COMP-rtbf.md) | Compliance | Must | Approved (RTBF cascade schema + audit log) |
| [REQ-SEC-edge-function-auth](../../1-spec/requirements/REQ-SEC-edge-function-auth.md) | Security | Must | Approved (RLS policies enforce `auth.uid()` binding) |
| [REQ-SEC-export-authz](../../1-spec/requirements/REQ-SEC-export-authz.md) | Security | Must | Approved (RLS policies enforce subject-only access) |

## Relevant Decisions

| File | Title | Trigger |
|------|-------|---------|
| [DEC-supabase-as-personal-data-store](../../decisions/DEC-supabase-as-personal-data-store.md) | Supabase as primary personal-data store | All schema work in this component lands in Supabase migrations |
| [DEC-rtbf-grace-window-24h](../../decisions/DEC-rtbf-grace-window-24h.md) | RTBF cancellation grace window is 24 hours | `rtbf_deletion_jobs.grace_window_ends_at` column derives from this; the 24h value is reflected in CHECK constraints or scheduler queries |
```

### Step 5.2: Verify

```bash
ls "3-code/database/"
```

Expected:

```
CLAUDE.component.md
```

### Step 5.3: Commit

```bash
git add "3-code/database/CLAUDE.component.md"
git commit -m "feat(3-code): add database component skeleton

Supabase Postgres schema component: 11 entities, RLS policies,
invariant enforcement strategy, seed script integration with
tagespuls-package. SQL + Supabase CLI as separate toolchain
from runtime consumers."
```

---

## Task 6: Create `tagespuls-package` component

**Files:**
- Create: `3-code/tagespuls-package/CLAUDE.component.md`

### Step 6.1: Write `CLAUDE.component.md`

Use the Write tool to create `3-code/tagespuls-package/CLAUDE.component.md` with this exact content:

```markdown
# Tagespuls Package

**Responsibility**: Operator-authored aphorism content vault, Python build pipeline that produces `aphorisms.json` (only `status='approved'` entries), and the deterministic aphorism-selection algorithm shared with `edge-functions`. Operationally home to the human-in-the-loop approval gate per [CON-aphorisms-human-approved](../../1-spec/constraints/CON-aphorisms-human-approved.md).

**Technology**: Python (build pipeline) + TypeScript (selection algorithm and shared types). Existing workspace at `apps/tagespuls_package/` in `Astro-Noctum-prod/` — naming preserved per dev brief Hinweis #11.

## Interfaces

- **Content source:** per-aphorism markdown files at `knowledge/bazodiaac-brain/aphorisms/review/aph-*.md`.
- **Approval transition:** operator (Ben) edits each markdown's `status: draft` → `status: approved` manually. No agent / build script / LLM may auto-promote.
- **Build output:** `packages/voice/data/aphorisms.json` — produced by `packages/voice/scripts/build_aphorisms.py`. Only `status='approved'` entries are emitted.
- **Downstream:** `database` seed script consumes `aphorisms.json` and upserts into the `aphorisms` table.
- **Type sharing:** `packages/voice/src/types.ts` is consumed by `edge-functions` (per dev brief Hinweis #11). Migration of these types into `shared-types` is a Code-phase implementation decision.

## Notes

- The build pipeline runs operator-triggered. The agent surfaces gate state (`aphorisms.json` exists, contains ≥ 15 entries, mode coverage across `pulse` / `trace` / `spannung`) but never bypasses the manual approval step.
- The 24-hour cooldown logic (`aphorisms.cooldown_days`) is part of the selection algorithm and uses `aphorism_usage_events` from `database` at runtime.

## Requirements Addressed

| File | Type | Priority | Status |
|------|------|----------|--------|
| [REQ-F-aphorism-approval-gate](../../1-spec/requirements/REQ-F-aphorism-approval-gate.md) | Functional | Should | Draft (operationally enforced by the build pipeline emitting only `status='approved'` entries) |

## Relevant Decisions

| File | Title | Trigger |
|------|-------|---------|
| _(none yet — this component's behavior is operationally driven by [CON-aphorisms-human-approved](../../1-spec/constraints/CON-aphorisms-human-approved.md); no derived decisions exist yet.)_ | | |
```

### Step 6.2: Verify

```bash
ls "3-code/tagespuls-package/"
```

Expected:

```
CLAUDE.component.md
```

### Step 6.3: Commit

```bash
git add "3-code/tagespuls-package/CLAUDE.component.md"
git commit -m "feat(3-code): add tagespuls-package component skeleton

Aphorism content vault + Python build pipeline + TypeScript
selection algorithm. Operator-driven approval gate per
CON-aphorisms-human-approved. Naming matches the existing
apps/tagespuls_package/ workspace per dev brief."
```

---

## Task 7: Update `3-code/CLAUDE.code.md` Components section

**Files:**
- Modify: `3-code/CLAUDE.code.md` — replace the `_(no components decomposed yet…)_` placeholder with a six-entry component list.

### Step 7.1: Read the file first

Run:

```bash
cat "3-code/CLAUDE.code.md"
```

Locate the section:

```
_(no components decomposed yet — run `/SDLC-decompose` after design completeness assessment passes)_
```

### Step 7.2: Apply the Edit

Use the Edit tool to replace the placeholder with the components list. `old_string`:

```
_(no components decomposed yet — run `/SDLC-decompose` after design completeness assessment passes)_
```

`new_string`:

```
### Shared Types

- **Directory**: [`shared-types/`](shared-types/)
- **Technology**: TypeScript (workspace package, no runtime)
- **Responsibility**: Entity, DTO, error-envelope, and analytics-event types shared between all other components.

### Web Frontend

- **Directory**: [`web-frontend/`](web-frontend/)
- **Technology**: TypeScript + React + Vite (+ Three.js for the frozen FS-2 SignaturRenderer)
- **Responsibility**: React SPA — dashboard composition, Daily Pulse UI, Council selection, Signature anchor, Upgrade funnel UI, ManageSubscription UI, consent surfaces, polling hooks, analytics emission, privacy notice page.

### Web Server

- **Directory**: [`web-server/`](web-server/)
- **Technology**: Node + TypeScript (existing `server.mjs`)
- **Responsibility**: Legacy `/api/*` routes — Stripe Checkout entry, Stripe webhook receiver, Stripe Customer Portal session issuer, `/api/impact/active`. Hosts frozen FS-3 (Stripe stack) and the server-side portion of FS-1 (BaZi / Wu-Xing / ephemeris compute).

### Edge Functions

- **Directory**: [`edge-functions/`](edge-functions/)
- **Technology**: Deno (Supabase Edge Functions runtime) + TypeScript
- **Responsibility**: HTTP-triggered `/v1/users/:userId/*` endpoints (Daily Pulse, Daily Interpretation, Consents, Data Export, RTBF, Subscription State) plus cron-triggered scheduled jobs (RTBF scheduler, Stripe ↔ `subscription_state` reconciliation, daily cosmic-weather snapshot). Hosts the centralized LLM gateway.

### Database

- **Directory**: [`database/`](database/)
- **Technology**: SQL (PostgreSQL via Supabase) + Supabase CLI
- **Responsibility**: Supabase Postgres schema — 11 entities, RLS policies, indexes, seed scripts. Authoritative source for invariants I-DM-1 through I-DM-8.

### Tagespuls Package

- **Directory**: [`tagespuls-package/`](tagespuls-package/)
- **Technology**: Python (build pipeline) + TypeScript (selection algorithm and shared types)
- **Responsibility**: Operator-authored aphorism content vault, build pipeline producing `aphorisms.json` (only `status='approved'` entries), and the deterministic aphorism-selection algorithm. Operationally enforces [CON-aphorisms-human-approved](../1-spec/constraints/CON-aphorisms-human-approved.md).
```

### Step 7.3: Verify

```bash
grep -E "^### (Shared Types|Web Frontend|Web Server|Edge Functions|Database|Tagespuls Package)" "3-code/CLAUDE.code.md"
```

Expected (six lines):

```
### Shared Types
### Web Frontend
### Web Server
### Edge Functions
### Database
### Tagespuls Package
```

### Step 7.4: Commit

```bash
git add "3-code/CLAUDE.code.md"
git commit -m "docs(3-code): list 6 components in Components section

Replaces the 'no components decomposed yet' placeholder with
links to the six per-component CLAUDE.component.md files."
```

---

## Task 8: Update `CLAUDE.md` Current State

**Files:**
- Modify: `CLAUDE.md` — append a Components note to the Design-phase Current State.

### Step 8.1: Read the current Current State

Run:

```bash
grep -A 60 "^### Current State" "CLAUDE.md" | head -80
```

### Step 8.2: Apply the Edit

Use the Edit tool. `old_string`:

```
**Design completeness assessment (2026-05-13, fresh):** 0 Critical, 2 Important, 3 Minor. All 28 Approved requirements covered across the three design documents; all 7 constraints addressed; all 11 Draft requirements assigned. **Design → Code gate posture:** architecture ✅ / data-model ✅ / api-design ✅ / no Critical findings ✅ / components not yet identified ❌. Important findings: **DI-1** No `DEC-*` records — ≥5 technical decisions are embedded in the design but not formally captured (Supabase as primary store, LLM provider choice, 24h RTBF grace window, rate-limit counter store, auth session storage); record at least the high-impact ones before `/SDLC-decompose`. **DI-2** Carryover from Spec analysis: ASM-supabase-fits-personal-data-scale (High risk) Unverified. Minor: DM-1 email-delivery service for RTBF confirmation not specified (deploy concern); DM-2 operator/admin endpoints (RTBF retry, aphorism status changes) deliberately out of scope; DM-3 11 Should-have requirements still Draft (carryover).
```

`new_string`:

```
**Design completeness assessment (2026-05-13, fresh):** 0 Critical, 2 Important, 3 Minor. All 28 Approved requirements covered across the three design documents; all 7 constraints addressed; all 11 Draft requirements assigned. **Design → Code gate posture:** architecture ✅ / data-model ✅ / api-design ✅ / no Critical findings ✅ / components identified ✅ (6 components, 2026-05-13). Important findings: **DI-1** No `DEC-*` records — partially resolved (3 of ≥5 recorded 2026-05-13: Supabase, LLM provider, RTBF grace window). Remaining: `DEC-rate-limit-store` and `DEC-auth-session-storage`, deferred to Code/Deploy phase when implementation choice is concrete. **DI-2** Carryover from Spec analysis: ASM-supabase-fits-personal-data-scale (High risk) Unverified. Minor: DM-1 email-delivery service for RTBF confirmation not specified (deploy concern); DM-2 operator/admin endpoints (RTBF retry, aphorism status changes) deliberately out of scope; DM-3 11 Should-have requirements still Draft (carryover).

**Components identified (2026-05-13):** 6 components decomposed into `3-code/` per `docs/plans/2026-05-13-component-decomposition.md`. `shared-types` (TypeScript types-only package), `web-frontend` (React SPA), `web-server` (Node `/api/*` routes), `edge-functions` (Supabase Edge Functions for `/v1/*` HTTP + scheduled jobs), `database` (Supabase Postgres schema), `tagespuls-package` (Python + TypeScript aphorism content + build pipeline). Each component has a `CLAUDE.component.md` describing responsibility, interfaces, requirement coverage, and relevant decisions.
```

### Step 8.3: Verify

```bash
grep -c "Components identified (2026-05-13)" "CLAUDE.md"
```

Expected: `1`.

### Step 8.4: Commit

```bash
git add "CLAUDE.md"
git commit -m "docs: record component decomposition in Current State

6 components identified and decomposed into 3-code/ per the
2026-05-13 plan. DI-1 partially resolved (3 of ≥5 decisions
recorded). Design → Code gate fully open."
```

---

## Final verification

### Step F.1: Confirm all 6 component directories exist

Run:

```bash
ls -d "3-code/"*/
```

Expected output (alphabetical):

```
3-code/database/
3-code/edge-functions/
3-code/shared-types/
3-code/tagespuls-package/
3-code/web-frontend/
3-code/web-server/
```

### Step F.2: Confirm each component has a `CLAUDE.component.md`

Run:

```bash
ls "3-code/"*/CLAUDE.component.md
```

Expected: 6 paths, one per component.

### Step F.3: Confirm `CLAUDE.code.md` references all 6

Run:

```bash
grep -c "^### " "3-code/CLAUDE.code.md"
```

Expected: `6` (six `### Component Name` headings).

### Step F.4: Confirm decisions still cross-reference correctly

Run:

```bash
grep -l "DEC-supabase-as-personal-data-store" "3-code/"*/CLAUDE.component.md
```

Expected: 3 paths (`web-server/`, `edge-functions/`, `database/`).

Run:

```bash
grep -l "DEC-llm-provider-gemini" "3-code/"*/CLAUDE.component.md
```

Expected: 1 path (`edge-functions/`).

Run:

```bash
grep -l "DEC-rtbf-grace-window-24h" "3-code/"*/CLAUDE.component.md
```

Expected: 2 paths (`edge-functions/`, `database/`).

### Step F.5: Confirm requirement-coverage union covers all approved REQs

Run:

```bash
grep -rh "^| \[REQ-" "3-code/"*/CLAUDE.component.md | grep -oE "REQ-[A-Z]+-[a-z0-9-]+" | sort -u | wc -l
```

Expected: ≥ 28 (the 28 Approved requirements; some draft REQs are also referenced, so 28–39 is acceptable).

### Step F.6: Confirm CLAUDE.md Current State updated

Run:

```bash
grep "Components identified" "CLAUDE.md"
```

Expected: one matching line dated 2026-05-13.

If all six final-verification steps pass, the decomposition is complete and the project is at full Design → Code gate readiness. Next step: `/SDLC-implementation-plan`.

# Tasks

## Status Legend

| Symbol | Status |
|--------|--------|
| `Todo` | Not started |
| `In Progress` | Currently being worked on |
| `Blocked` | Waiting on a dependency or decision (reason **must** be noted in the Notes column) |
| `Done` | Completed |
| `Cancelled` | No longer needed (reason **must** be noted in the Notes column) |

## Priority Legend

| Priority | Meaning |
|----------|---------|
| `P0` | Infrastructure / cross-cutting — required before feature work |
| `P1` | Implements a Must-have goal |
| `P2` | Implements a Should-have goal |
| `P3` | Implements a Could-have goal |

---

## Task Table

<!-- Req column: links to requirements this task implements (comma-separated), or "-" if none. -->
<!-- Implementation plan populated 2026-05-14 per /SDLC-implementation-plan. -->

### Phase 0 — Baseline & Foundation

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-0-1 | Run baseline checks on `Astro-Noctum-prod`: `npx tsc --noEmit`, `npm run build`, `npm run test`. Document any pre-existing failures. | P0 | Done | - | - | 2026-05-14 | All three commands pass (tsc 0 errors / build 45.5s / tests 2303 pass + 2 todo across 248 files). 2 pre-existing observations recorded in `docs/baseline-checks-2026-05-14.md`: (1) 6 chunks >500 kB including vendor-three, (2) ECONNREFUSED ::1:3001 noise in test output. |
| TASK-0-2 | Create `shared-types` workspace package skeleton (`package.json`, `tsconfig.json`, `src/index.ts` with placeholder exports). Wire as workspace dep in `web-frontend`, `web-server`, `edge-functions`. | P0 | Todo | - | TASK-0-1 | 2026-05-14 | Resolves IR-1 from decomposition review. |
| TASK-0-3 | Document existing `/api/*` route inventory in `web-server` README — paths, auth state, frozen status, owning subsystem. | P0 | Todo | REQ-F-impact-active-contract | TASK-0-1 | 2026-05-14 | Reference for P1 and P3. |
| TASK-0-4 | Verify `tagespuls_package` Python build pipeline runs end-to-end against the F6-batch approved-review files; produces `aphorisms.json` with 33 entries. | P0 | Todo | REQ-F-aphorism-approval-gate | TASK-0-1 | 2026-05-14 | Aphorism approval flow now governed by [DEC-aphorism-batch-approval-bp-2026-05-14](../decisions/DEC-aphorism-batch-approval-bp-2026-05-14.md). |

### Phase 1 — Dashboard Stability (dev brief Phase 1 + D)

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-1-1 | Fix `isTourStepVisible` in `Dashboard.tsx`: remove `tourStep === 'done'` from visible-states condition. Add test for `done`, `0`, `1+scrolled` cases. | P0 | Todo | REQ-F-tour-overlay-state | TASK-0-1 | 2026-05-14 | Dev brief TASK-1.1. |
| TASK-1-2 | Author upgrade-CTA inventory (`docs/cta-inventory.md` or Dashboard.tsx comment block) classifying every upgrade-related affordance: `keep_primary` / `convert_to_lock_hint` / `remove` / `modal_only` / `premium_only_manage`. | P0 | Todo | REQ-USA-cta-singular | TASK-1-1 | 2026-05-14 | Dev brief TASK-1.2. |
| TASK-1-3 | Refactor `AgentSection.tsx` to remove own `handleUpgrade()` call → lock-hint UI or `onRequestUpgrade` callback. Navigation: remove any competing upgrade CTA. | P0 | Todo | REQ-USA-cta-singular, REQ-F-agent-card-no-checkout | TASK-1-2 | 2026-05-14 | Dev brief TASK-1.3. |
| TASK-1-4 | Refactor `UpgradeButton.tsx`: single in-flight request guard (`disabled` during fetch), success → `window.location.href = url`, no-url-on-200 error path. | P0 | Todo | REQ-F-checkout-single-trigger, REQ-F-checkout-stripe-redirect | TASK-1-3 | 2026-05-14 | Dev brief TASK-1.4. |
| TASK-1-5 | Implement six error categories in `UpgradeButton.tsx` with locale-aware copy + `checkout_failed` analytics with `error_type`. | P0 | Todo | REQ-USA-checkout-error-categories | TASK-1-4 | 2026-05-14 | Dev brief TASK-1.4. |
| TASK-1-6 | Add fallback indicator to `DailyChartHero.tsx`: prop `isFallback?: boolean` → `↻ Heute nicht verfügbar — generischer Inhalt` (locale-aware) with `data-testid="fallback-indicator"` when `dailyData.meta.engine_version === 'v1-local-fallback'`. | P1 | Todo | REQ-USA-fallback-indicator | - | 2026-05-14 | Dev brief TASK-D2. |
| TASK-1-7 | Document `/api/impact/active` server-profile-driven contract in `useActiveImpacts.ts` (top-of-file comment citing the server endpoint). Audit consumers to ensure single-source coherence values. | P1 | Todo | REQ-F-impact-active-contract | - | 2026-05-14 | Dev brief TASK-4.1 / TASK-4.2. |
| TASK-1-8 | PR 1 acceptance criteria verification: tsc clean, build clean, tour hidden on done, single primary CTA free / zero premium, single checkout call, stripe redirect, six error texts, profile CTA on incomplete profile, fallback label on outage, no formula changes. | P0 | Todo | (PR1 acceptance) | TASK-1-1..1-7 | 2026-05-14 | Gate for PR 1 merge. |

### Phase 2 — Database Foundation

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-2-1 | Write Supabase migration: `user_astro_profiles` (PK `user_id` FK → `auth.users`, `birth_date`, `birth_time`, `birth_place`, `timezone`, `locale`, timestamps). | P0 | Todo | - | TASK-0-1 | 2026-05-14 | data-model.md §2.1. |
| TASK-2-2 | Write Supabase migration: `daily_pulses`, `daily_interpretations`, `cosmic_weather_snapshots`, `aphorism_usage_events` with FKs + unique constraints per data-model.md. | P0 | Todo | REQ-F-daily-pulse-determinism, REQ-F-council-interpretation-cache | TASK-2-1 | 2026-05-14 | Includes `engine_version`/`is_fallback`/`weather_stale` columns. |
| TASK-2-3 | Write Supabase migration: `aphorisms` reference table with full column set (text_de/en, attribution, mode_tags, cooldown_days, etc.). | P0 | Todo | REQ-F-aphorism-approval-gate | TASK-2-2 | 2026-05-14 | Status enum `draft`/`approved`. |
| TASK-2-4 | Write Supabase migration: `consent_records`, `rtbf_deletion_jobs`, `rtbf_audit_log`, `subscription_state` with state enums + CHECK constraints per data-model.md §2.3 and §8. | P0 | Todo | REQ-COMP-consent-record, REQ-COMP-rtbf | TASK-2-3 | 2026-05-14 | Includes `grace_window_ends_at` per DEC-rtbf-grace-window-24h. |
| TASK-2-5 | Write RLS policies: `auth.uid() = user_id` for SELECT/INSERT/UPDATE on every per-user table; service-role-only on `rtbf_deletion_jobs` writes; append-only enforcement on `consent_records` and `rtbf_audit_log`. | P0 | Todo | REQ-SEC-edge-function-auth, REQ-SEC-export-authz | TASK-2-4 | 2026-05-14 | RLS verification tests included. |
| TASK-2-6 | Implement Stripe webhook handler in `web-server`: signature verification, idempotent UPSERT into `subscription_state` keyed by `last_webhook_event_id`, handles `customer.subscription.created/updated/deleted`, `customer.deleted`, `invoice.payment_*`. | P0 | Todo | REQ-F-manage-subscription | TASK-2-5 | 2026-05-14 | api-design.md §3.1. |

### Phase 3 — Server-Side Security Baseline

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-3-1 | Implement rate-limit on `POST /api/checkout` and `POST /api/stripe/portal-session`: ≤10/min/user, ≤30/min/IP, persistent counter store (Redis or Supabase table — record choice as `DEC-rate-limit-store`). | P0 | Todo | REQ-SEC-checkout-rate-limit | TASK-0-1 | 2026-05-14 | 429 + `Retry-After`. |
| TASK-3-2 | Implement CSRF/Origin allowlist check on every state-changing `/api/*` route: `Origin` + `Referer` validated against canonical hostnames. | P0 | Todo | REQ-SEC-checkout-rate-limit | TASK-0-1 | 2026-05-14 | 403 on mismatch. |
| TASK-3-3 | Add `Strict-Transport-Security: max-age=15552000; includeSubDomains; preload` header to all `web-server` and `edge-functions` HTTP responses. 301 plain-HTTP → HTTPS. | P0 | Todo | REQ-SEC-tls-everywhere | TASK-0-1 | 2026-05-14 | CSP with no `http:` subresources. |
| TASK-3-4 | Add build-time secret scan (e.g., `gitleaks` or equivalent) to CI for client bundles + dist output. Build aborts on findings. | P0 | Todo | REQ-SEC-no-secrets-in-client | TASK-0-1 | 2026-05-14 | Configured regex for `sk_live_`, `service_role`, `eyJ.*service_role`. |
| TASK-3-5 | Inspect current Supabase Auth session storage in `web-frontend`; record `DEC-auth-session-storage` with rationale + XSS-mitigation controls (CSP, no `unsafe-inline`, `dangerouslySetInnerHTML` audit). | P0 | Todo | REQ-SEC-auth-session-storage | TASK-0-1 | 2026-05-14 | Closes deferred portion of DI-1. |

### Phase 4 — 3D Signature Anchor (dev brief Phase 2)

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-4-1 | Verify 3D codepath for complete profiles: `chladniParams` pipeline computes valid params, `SignaturRenderer` renders without `CymaticsFallback`. Assess Wu-Xing DE/EN drift risk and document in renderer call-site comment. | P1 | Todo | - | TASK-0-1 | 2026-05-14 | Dev brief TASK-2.1. |
| TASK-4-2 | Build `SignaturAnchorCard.tsx` with `SectionErrorBoundary` wrapping. Static placeholder (e.g., `NatalSignaturStatic`), dominant Wu-Xing element label, CTA "Deine Signatur ansehen →" navigating to `/signatur`. Locale-aware empty-state for incomplete profiles. | P1 | Todo | REQ-USA-signature-empty-state, REQ-REL-signature-error-isolation, REQ-PERF-signature-no-direct-embed | TASK-4-1 | 2026-05-14 | Default form per architecture AS-5; inline embedding deferred. |
| TASK-4-3 | Wire `SignaturAnchorCard` into Dashboard at position 2 (per REQ-USA-dashboard-section-order). Verify visible in first viewport at typical desktop + mobile heights. | P1 | Todo | REQ-USA-signature-first-viewport | TASK-4-2 | 2026-05-14 | Dev brief TASK-2.2 (Option B). |

### Phase 5 — Dashboard Information Hierarchy (dev brief Phase 3)

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-5-1 | Implement dashboard section order: TagespulsCard (flag-gated, P8) → DailyChartHero → Signatur Anchor → Active Influences → Daily Impulse/Modal → Agents → Blueprint. | P1 | Todo | REQ-USA-dashboard-section-order | TASK-4-3 | 2026-05-14 | Dev brief TASK-3.1. |
| TASK-5-2 | Add retention-metric analytics events (`D1_return_rate`, `D7_return_rate`, `dashboard_first_interaction`, `daily_detail_open_rate`, `signatur_sphere_interaction`, `upgrade_clicked`, `checkout_started/failed/redirected`, `council_figure_selected`) — all routed through PII gateway (P9). | P1 | Todo | REQ-COMP-analytics-pii-free | TASK-9-6 | 2026-05-14 | Dev brief TASK-3.2. Cross-phase dep on P9. |
| TASK-5-3 | Manual / e2e test: returning user lands on dashboard, first viewport shows tagesaktueller Kernwert + Signatur-Anker + concrete next action (within scroll-free area). | P1 | Todo | - | TASK-5-1 | 2026-05-14 | Acceptance check, not feature code. |

### Phase 6 — Daily Chart API Cleanup (dev brief Phase 4)

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-6-1 | Confirm `/api/impact/active` server-profile-driven (empty body resolves user via session). Update `useActiveImpacts.ts` with contract comment if not done in TASK-1-7. | P1 | Todo | REQ-F-impact-active-contract | TASK-1-7 | 2026-05-14 | Dev brief TASK-4.1. |
| TASK-6-2 | Audit `DailyChartHero.tsx` for single-source coherence values: `baseCoherence`, `positiveDailyDelta`, `displayedCoherence` come only from `useActiveImpacts()`. Eliminate any parallel hook or local computation. | P1 | Todo | REQ-F-impact-active-contract | TASK-6-1 | 2026-05-14 | Dev brief TASK-4.2. |
| TASK-6-3 | Surface degraded states across the dashboard: `useSpaceWeather` null Kp → `—`, `useActiveImpacts` unavailable → `isUnavailable` UI path. No `0`-as-real-reading anywhere. | P1 | Todo | REQ-USA-fallback-indicator | TASK-1-6 | 2026-05-14 | Dev brief TASK-4.3. |

### Phase 7 — GreenOps Polling (dev brief Phase 5)

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-7-1 | Rework `useSignaturSignal.ts`: baseline 15 000 ms (was 800 ms); document-hidden → 60 000 ms or pause; `visibilitychange` listener for one-shot refresh on visibility restore; preserve error backoff. | P3 | Todo | REQ-PERF-polling-budget, REQ-PERF-polling-visibility | TASK-0-1 | 2026-05-14 | Dev brief TASK-5.1. |
| TASK-7-2 | Lift `useSpaceWeather()` to single call site in `Dashboard.tsx`; pass result as prop to `MagnetsturmKarte` (now presentational). Remove duplicate hook call. | P3 | Todo | REQ-MNT-single-poller-per-source | TASK-0-1 | 2026-05-14 | Dev brief TASK-5.2. |

### Phase 8 — Tagespuls Neu-Architektur (dev brief Phase T)

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-8-1 | Run aphorism gate check: `aphorisms.json` ≥ 15 approved, mode coverage. Verify F6-batch corpus (33 approved, 19 pulse + 14 spannung + 0 trace). Document result in `docs/tagespuls-gate-check.txt`. | P2 | Todo | REQ-F-aphorism-approval-gate | TASK-0-4 | 2026-05-14 | Trace-mode is empty — see Notes column of TASK-8-8. |
| TASK-8-2 | Migrate tagespuls schema into Supabase (`aphorisms` table is already in P2; this confirms compatibility with existing 11-entity migration). | P2 | Todo | - | TASK-2-3, TASK-8-1 | 2026-05-14 | Dev brief TASK-T1 — schema work absorbed by P2. |
| TASK-8-3 | Seed `aphorisms` Supabase table from `aphorisms.json` via seed script (upsert by `id`, only `status='approved'`). | P2 | Todo | REQ-F-aphorism-approval-gate | TASK-8-2 | 2026-05-14 | Dev brief TASK-T2. |
| TASK-8-4 | Implement Edge Function `daily-pulse` (GET `/v1/users/:userId/daily-pulse?date=&locale=`): deterministic selection, top-5 by `quality_rating` → `simpleHash(userId+date+mode) % 5`, LLM slot 2/3 via gateway (P9), council set assembly, UPSERT `daily_pulses`. | P2 | Todo | REQ-F-daily-pulse-determinism, REQ-SEC-edge-function-auth | TASK-2-5, TASK-9-7 | 2026-05-14 | Dev brief TASK-T3. |
| TASK-8-5 | Implement Edge Function `daily-interpretation` (POST `/v1/users/:userId/daily-interpretation`): cache check by `(daily_pulse_id, archetype, locale)`, LLM call via gateway only on miss, `is_cached` flag in response. | P2 | Todo | REQ-F-council-interpretation-cache, REQ-COMP-llm-purpose-consent | TASK-8-4 | 2026-05-14 | Dev brief TASK-T3 (POST half). |
| TASK-8-6 | Implement client hook `useDailyPulse.ts` with explicit `birthData === null` guard returning `{ pulse: null, isFallback: false }`. localStorage cache by date. `selectCouncilFigure(key)` calls daily-interpretation. | P2 | Todo | REQ-F-useDailyPulse-null-guard | TASK-8-4 | 2026-05-14 | Dev brief TASK-T4. Coexists with `useFirstRunDaily`. |
| TASK-8-7 | Build `TagespulsCard.tsx`: Phase 1 (mode chip + aphorism + slots 2/3 + Council buttons), Phase 2 (figure-icon + interpretation + back). Skeleton loading, profile-incomplete empty-state, fallback marker. | P2 | Todo | REQ-USA-tagespuls-card-phases | TASK-8-6 | 2026-05-14 | Dev brief TASK-T5. |
| TASK-8-8 | Wire `TagespulsCard` into Dashboard at section position 1, gated by `tagespuls_neu_v1` feature flag. `tagespuls_neu_v1: false` → existing dashboard unchanged. | P2 | Todo | REQ-F-tagespuls-feature-flag | TASK-5-1, TASK-8-7 | 2026-05-14 | Dev brief TASK-T6. **Trace-mode rendering blocked until trace-tagged aphorisms reach approval (currently 0)**. |

### Phase 9 — GDPR Active Surfaces (CC-1)

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-9-1 | Implement Edge Functions for consents: `GET /v1/users/:userId/consents`, `POST /v1/users/:userId/consents`, `POST /v1/users/:userId/consents/:purpose/revoke`. Append-only writes, version-bump re-consent flow. | P1 | Todo | REQ-COMP-consent-record | TASK-2-5 | 2026-05-14 | api-design.md §3.3. |
| TASK-9-2 | Implement Edge Function `GET /v1/users/:userId/data-export`: gather all per-user rows + Stripe pointer into JSON envelope (schema_version 1.0). Single-use TTL ≤24h download URL via Supabase Storage signed URL. Rate-limit ≤5/24h/user. | P1 | Todo | REQ-COMP-data-export, REQ-SEC-export-authz | TASK-2-5 | 2026-05-14 | api-design.md §3.3. |
| TASK-9-3 | Implement Edge Function RTBF trio: `POST /v1/users/:userId/rtbf` (creates `pending_confirmation` job, sends single-use email link + cancel link), `POST .../rtbf/confirm`, `POST .../rtbf/cancel`. Every state transition writes to `rtbf_audit_log`. | P1 | Todo | REQ-COMP-rtbf, REQ-SEC-rtbf-authz | TASK-2-5 | 2026-05-14 | 24h grace per DEC-rtbf-grace-window-24h. |
| TASK-9-4 | Build privacy notice page (`/privacy` or `/datenschutz`) in `web-frontend` — locale-aware (DE/EN), footer-linked from every page. Content covers controller identity, processing purposes + lawful bases, retention periods, sub-processors (Supabase, Stripe, Gemini), Art. 15–22 rights + exercise channels, supervisory authority, `last_updated`. | P1 | Todo | REQ-COMP-privacy-notice | - | 2026-05-14 | Content authored / legally reviewed outside this component per MR-4. |
| TASK-9-5 | Build consent UI surfaces in `web-frontend`: signup-flow consent checkboxes (per purpose, version-stamped), in-settings revocation UI, version-bump re-consent modal. | P1 | Todo | REQ-COMP-consent-record | TASK-9-1 | 2026-05-14 | One purpose = one checkbox; granular consent. |
| TASK-9-6 | Implement analytics PII gateway in `web-frontend`: central `emit(eventName, props)` function with per-event allowlist enforcement (rejects forbidden fields: email/birth_date/birth_time/birth_place/raw user_id/ip/stripe_customer_id). User pseudonym via HMAC of `user_id` with rotating server secret. | P1 | Todo | REQ-COMP-analytics-pii-free | TASK-0-2 | 2026-05-14 | data-model.md §2.4 allowlist. |
| TASK-9-7 | Implement LLM gateway in `edge-functions`: ≤50/h/user rate limit, user-input templating with delimiters, log redaction ≤7 days with access control, consent check per purpose (rejects calls when consent missing/revoked), captures `llm_model` for caching. | P1 | Todo | REQ-SEC-llm-gateway-hardening, REQ-COMP-llm-purpose-consent | TASK-2-5, TASK-9-1 | 2026-05-14 | All AS-3 LLM calls route through here. Records `DEC-llm-provider-gemini` enforcement in code. |

### Phase 10 — Premium Management

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-10-1 | Implement Edge Function `GET /v1/users/:userId/subscription-state` reading local `subscription_state` mirror. `Cache-Control: private, max-age=60`. | P1 | Todo | REQ-USA-cta-singular, REQ-F-manage-subscription | TASK-2-6 | 2026-05-14 | Single read path for free/premium switch. |
| TASK-10-2 | Implement `web-server` `POST /api/stripe/portal-session`: server-issued single-use Stripe Customer Portal URL with TTL ≤5 min. `Cache-Control: no-store`. Premium-tier-only check (else 403 `not_premium`). | P1 | Todo | REQ-F-manage-subscription, REQ-SEC-portal-session-tokens | TASK-2-6 | 2026-05-14 | api-design.md §3.4. |
| TASK-10-3 | Build `ManageSubscription.tsx` frontend component: current plan + next renewal + masked `payment_method_last4` + "Manage in Stripe" CTA → `window.location.href = portalUrl`. Free-user fallback shows empty + AS-6 upgrade CTA. | P1 | Todo | REQ-F-manage-subscription | TASK-10-1, TASK-10-2 | 2026-05-14 | Premium-only surface. |

### Phase 11 — Scheduled Jobs

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-11-1 | RTBF scheduler Edge Function: triggered every 1 h via Supabase pg_cron; `SELECT ... WHERE status='pending_grace' AND grace_window_ends_at <= NOW()`; transitions row to `executing` and runs deletion cascade per data-model.md §4. Idempotent. | P1 | Todo | REQ-COMP-rtbf, REQ-SEC-rtbf-authz | TASK-9-3 | 2026-05-14 | Enforces DEC-rtbf-grace-window-24h. |
| TASK-11-2 | Stripe ↔ `subscription_state` reconciliation Edge Function: daily; for users where `synced_at` > 25 h, fetch Stripe subscription and correct local divergence. | P2 | Todo | REQ-F-manage-subscription | TASK-2-6 | 2026-05-14 | Catches webhook drops. |
| TASK-11-3 | `cosmic_weather_snapshots` daily insertion Edge Function: triggered on local-day boundary; INSERT row with planetary positions + transits + Kp index + sunspots; never UPDATE. | P1 | Todo | REQ-F-impact-active-contract | TASK-2-2 | 2026-05-14 | Late-arriving data → `weather_stale: true` in consumers. |

### Phase 12 — Pre-launch Verification

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-12-1 | End-to-end RTBF rehearsal in dev env: request → confirm → grace → execute. Verify `SELECT COUNT(*) WHERE user_id=...` returns 0 across all per-user tables; Stripe customer-delete API succeeded; `rtbf_audit_log` complete. | P0 | Todo | REQ-COMP-rtbf | TASK-11-1 | 2026-05-14 | Closes RTBF as feature-complete. |
| TASK-12-2 | Data-export round-trip test: request export, download JSON, parse and verify presence of all per-user tables + Stripe pointer + schema_version. | P0 | Todo | REQ-COMP-data-export | TASK-9-2 | 2026-05-14 | Validates Art. 20 compliance. |
| TASK-12-3 | Prompt-injection regression-test suite for LLM gateway: known-bad inputs (instruction overrides, system-prompt impersonation, embedded directives) do not change model behavior beyond templated purpose. | P0 | Todo | REQ-SEC-llm-gateway-hardening | TASK-9-7 | 2026-05-14 | Run on every CI build of `edge-functions`. |
| TASK-12-4 | Polling-budget measurement in production-like env: instrument client, mount dashboard for 15 min with average user behavior, confirm aggregate request count ≤ 1000. | P0 | Todo | REQ-PERF-polling-budget, REQ-PERF-polling-visibility | TASK-7-1, TASK-7-2 | 2026-05-14 | Closes M-5 perf reqs. |
| TASK-12-5 | ASM-supabase-fits-personal-data-scale verification: confirm Supabase EU region, DPA on file, RTBF cascade timing on representative data, Art. 20 export latency. Update assumption to `Verified` or trigger supersession of DEC-supabase-as-personal-data-store. | P0 | Todo | - | TASK-12-1, TASK-12-2 | 2026-05-14 | Closes I-2 from 2026-05-13 gap analysis. |

---

## Execution Plan

Tasks are grouped into 13 phases, each ending with a deployable or testable system. Dependencies between phases reflect logical / data-flow constraints; in practice phases may overlap once their prerequisites are met.

| Phase | Goal | Deliverable | Done when |
|-------|------|-------------|-----------|
| P0 — Baseline & Foundation | Known-clean starting state; shared-types package importable; tagespuls build pipeline confirmed runnable | Green typecheck/build/tests, importable `shared-types`, `aphorisms.json` regenerated | TASK-0-1..0-4 all Done |
| P1 — Dashboard Stability | Dev brief PR 1 acceptance criteria met | Tour overlay fixed, single primary CTA, single-trigger Stripe checkout with error categories, fallback indicator visible | TASK-1-1..1-8 all Done |
| P2 — Database Foundation | 11-entity schema live with RLS; Stripe webhook handler operational | `supabase db push` succeeds; webhook handler UPSERTs `subscription_state` idempotently | TASK-2-1..2-6 all Done |
| P3 — Server-Side Security Baseline | `web-server` passes self-administered REQ-SEC checklist | Rate-limit enforced, CSRF on, HSTS sent, secret scan in CI, auth-storage DEC recorded | TASK-3-1..3-5 all Done |
| P4 — 3D Signature Anchor | Signature reachable from dashboard with error isolation | `SignaturAnchorCard` rendered in first viewport, `SectionErrorBoundary` active, empty-state for incomplete profiles | TASK-4-1..4-3 all Done |
| P5 — Dashboard Hierarchy | First viewport answers what's today / why me / what now | Section order applied, retention-metric events emitted PII-free | TASK-5-1..5-3 all Done |
| P6 — Daily Chart API Cleanup | Data truth invariant verified across `DailyChartHero` | Single-source coherence, no `0`-as-real-reading anywhere | TASK-6-1..6-3 all Done |
| P7 — GreenOps Polling | Aggregate polling within 1000 req / 15 min / mount budget | `useSignaturSignal` baseline 15 s + visibility-aware; `useSpaceWeather` single poller per mount | TASK-7-1..7-2 all Done |
| P8 — Tagespuls Neu-Architektur | Tagespuls Neu rendering for completed profiles behind `tagespuls_neu_v1` | Edge Functions deployed, `TagespulsCard` Phase 1 & 2 rendering, flag-gated wiring in Dashboard | TASK-8-1..8-8 all Done. **Note:** `trace`-mode rendering remains effectively gated until trace-tagged aphorisms reach approval threshold (currently 0). |
| P9 — GDPR Active Surfaces | Art. 15–22 rights operationally supported | Consents CRUD live, data-export endpoint live, RTBF endpoint trio live, privacy notice published, analytics PII gateway live, LLM gateway hardened | TASK-9-1..9-7 all Done |
| P10 — Premium Management | Premium users can self-serve cancel / payment / billing-history via Stripe Customer Portal | `GET subscription-state` + `POST portal-session` + `ManageSubscription.tsx` deployed | TASK-10-1..10-3 all Done |
| P11 — Scheduled Jobs | State machines complete; subscription divergences corrected daily; cosmic weather populated | RTBF scheduler running, reconciliation job running, weather snapshots present | TASK-11-1..11-3 all Done |
| P12 — Pre-launch Verification | Launch readiness checklist signed off | RTBF rehearsal passes, data-export round-trip passes, prompt-injection suite passes, polling-budget measured, ASM-supabase verified | TASK-12-1..12-5 all Done |

### Cross-phase dependencies (key edges)

- **P2 → P3, P8, P9, P10, P11** — schema must exist before security policies, Edge Functions, scheduled jobs.
- **P5-TASK-5-2 → P9-TASK-9-6** — analytics events require the PII gateway.
- **P8-TASK-8-4 → P9-TASK-9-7** — daily-pulse needs LLM gateway. Workaround: P8-TASK-8-4 can be implemented with direct LLM calls and refactored once P9-TASK-9-7 lands, but recommend ordering P9-TASK-9-7 first.
- **P11-TASK-11-1 → P9-TASK-9-3** — RTBF scheduler requires the RTBF endpoints + schema.
- **P12 → almost everything** — verification phase depends on all features being in place.

### Coverage summary

- **All 28 Approved requirements** have at least one task implementing them.
- **All 11 Draft requirements** have at least one task implementing them.
- **All 6 Active constraints** are respected by the task structure (the 7th, `CON-aphorisms-human-approved`, is Deprecated and superseded by `DEC-aphorism-batch-approval-bp-2026-05-14`).
- **All 4 Active decisions** are referenced or enforced by at least one task.

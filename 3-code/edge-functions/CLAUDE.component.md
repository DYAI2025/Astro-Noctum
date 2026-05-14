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
| [DEC-codebase-lives-in-sibling-prod-dir](../../decisions/DEC-codebase-lives-in-sibling-prod-dir.md) | Runtime code lives in sibling `Astro-Noctum-prod/` directory | When editing or adding Edge Function code — runtime files live in `Astro-Noctum-prod/supabase/functions/...` |

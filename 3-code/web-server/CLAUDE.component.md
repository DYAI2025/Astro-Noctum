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
| [DEC-codebase-lives-in-sibling-prod-dir](../../decisions/DEC-codebase-lives-in-sibling-prod-dir.md) | Runtime code lives in sibling `Astro-Noctum-prod/` directory | When editing or adding `/api/*` route code — runtime files live in `Astro-Noctum-prod/server.mjs` and adjacent server-route files |

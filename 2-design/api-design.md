# API Design

## 1. Purpose and Posture

This document specifies the HTTP contracts that connect frontend, backend routes, and Supabase Edge Functions. It is **design-level**: request/response payload shapes, status codes, error semantics, auth requirements, rate-limit policies, and GDPR posture. Exact server-framework wiring (Express/Hono/Edge Function handlers, route ordering) is implementation detail and lives in `Astro-Noctum-prod/`.

Two categories of contract:

- **Frozen contracts** (FS-3, AS-2): documented as-is per Specification constraints.
- **Active contracts** (AS-3, AS-7, CC-1): specified here for the first time.

## 2. Conventions

### Base URL and Versioning

| Surface | Path prefix | Notes |
|---------|-------------|-------|
| Legacy server routes | `/api/*` | Existing Node/server route layer. Includes `POST /api/checkout`, `POST /api/impact/active`. Frozen by `CON-stripe-payment-stack` and `REQ-F-impact-active-contract`. |
| New Edge Function endpoints | `/v1/*` | New endpoints exposed by Supabase Edge Functions, per the tagespuls package OpenAPI spec. |
| Stripe webhooks | `/api/stripe/webhook` | Stripe → Astro-Noctum direction; signature-verified. |

Breaking changes to `/v1/*` require a `/v2/*` introduction with overlap period ≥60 days and `Deprecation` + `Sunset` headers on `/v1/*`. No in-place breaking changes.

### Auth

All authenticated endpoints require `Authorization: Bearer <jwt>` where `<jwt>` is a valid Supabase Auth token. Unauthenticated requests → `401`. Path parameter `:userId` must equal the JWT subject claim per [REQ-SEC-edge-function-auth](../1-spec/requirements/REQ-SEC-edge-function-auth.md); mismatches → `403` with no info leakage.

### Content Type, Time, Locale

All requests/responses use `application/json; charset=utf-8`. Timestamps are ISO-8601 UTC; dates are `YYYY-MM-DD`. Locale via `?locale=de|en`, default `de`.

### Error Envelope

```json
{
  "error": {
    "code": "error_class_kebab_case",
    "message": "Human-readable description, locale-aware where appropriate.",
    "details": { /* optional, error-class-specific */ }
  }
}
```

Generic `internal_error` reserved for unhandled 500s.

### Rate-Limit / Cache Headers

- 429 responses include `Retry-After: <seconds>` (mandatory).
- Optional `X-RateLimit-Remaining` advisory header on success near limit.
- User-personal endpoints: `Cache-Control: private, no-store, max-age=0`.
- Portal session URLs / RTBF tokens: `Cache-Control: no-store`.

### CORS / Origin

`Origin` header checked against allowlist (production hostnames + locales). Cross-origin rejected with `403`.

## 3. Endpoint Catalog

### 3.1 Frozen contracts (existing — documented, not redesigned)

#### `POST /api/checkout`

- **Subsystem:** [FS-3](architecture.md#fs-3-stripe-checkout-stack) / [AS-6](architecture.md#as-6-upgrade-funnel)
- **Backing requirements:** [REQ-F-checkout-single-trigger](../1-spec/requirements/REQ-F-checkout-single-trigger.md), [REQ-F-checkout-stripe-redirect](../1-spec/requirements/REQ-F-checkout-stripe-redirect.md), [REQ-USA-checkout-error-categories](../1-spec/requirements/REQ-USA-checkout-error-categories.md), [REQ-SEC-checkout-rate-limit](../1-spec/requirements/REQ-SEC-checkout-rate-limit.md), [REQ-SEC-no-secrets-in-client](../1-spec/requirements/REQ-SEC-no-secrets-in-client.md)
- **Auth:** authenticated.
- **Request:** `POST /api/checkout` with empty body (current implementation uses default tier).
- **Success 200:** `{ "url": "https://checkout.stripe.com/c/pay/cs_..." }`
- **Errors:**

| HTTP | error.code | Notes |
|------|-----------|-------|
| 401 | `not_authenticated` | No or expired Bearer token |
| 403 | `access_denied` | Token valid but user not allowed |
| 429 | `rate_limited` | ≤10/min/user, ≤30/min/IP per REQ-SEC-checkout-rate-limit |
| 503 | `payment_unavailable` | Stripe env misconfigured or Stripe down |
| 200 (anomalous) | — | Body missing `url` → AS-6 treats as `200-no-url` error class |

#### `POST /api/stripe/webhook`

- **Subsystem:** [FS-3](architecture.md#fs-3-stripe-checkout-stack) → [`subscription_state`](data-model.md#subscription_state-local-mirror-of-stripe)
- **Auth:** Stripe signature verification via `Stripe-Signature` header + `STRIPE_WEBHOOK_SECRET` (not Supabase JWT).
- **Request:** Stripe event payload (e.g., `customer.subscription.created/updated/deleted`, `customer.deleted`, `invoice.payment_succeeded/failed`).
- **Success 200:** empty body. UPSERT into `subscription_state` keyed by `last_webhook_event_id`.
- **Errors:** 400 `signature_invalid`; 500 `internal_error` (Stripe retries with backoff).
- **Idempotency:** if `subscription_state.last_webhook_event_id` already equals event `id`, return 200 without re-applying.

#### `POST /api/impact/active`

- **Subsystem:** [AS-2 DailyChart UI](architecture.md#as-2-dailychart-ui) caller; backend reads `cosmic_weather_snapshots` + per-user profile.
- **Backing requirements:** [REQ-F-impact-active-contract](../1-spec/requirements/REQ-F-impact-active-contract.md)
- **Auth:** authenticated.
- **Request:** `POST` with empty body `{}`. Contract is **server-profile-driven** per REQ-F-impact-active-contract.
- **Success 200:**
  ```json
  {
    "base_coherence": 0.62,
    "positive_daily_delta": 0.08,
    "displayed_coherence": 0.70,
    "kp_index": 3.7,
    "is_unavailable": false,
    "weather_stale": false
  }
  ```
- **Degraded responses:** `is_unavailable: true` with numeric fields `null` (never `0`). `weather_stale: true` when snapshot older than the daily window.
- **Errors:** 401 `not_authenticated`; 422 `profile_incomplete`; 503 `compute_unavailable`.

### 3.2 Daily Pulse / Council (AS-3 active contracts)

#### `GET /v1/users/:userId/daily-pulse`

- **Subsystem:** [AS-3 Daily Pulse Engine](architecture.md#as-3-daily-pulse-engine-tagespuls-neu-architektur)
- **Backing requirements:** [REQ-F-daily-pulse-determinism](../1-spec/requirements/REQ-F-daily-pulse-determinism.md), [REQ-F-aphorism-approval-gate](../1-spec/requirements/REQ-F-aphorism-approval-gate.md), [REQ-USA-fallback-indicator](../1-spec/requirements/REQ-USA-fallback-indicator.md), [REQ-SEC-edge-function-auth](../1-spec/requirements/REQ-SEC-edge-function-auth.md), [REQ-COMP-llm-purpose-consent](../1-spec/requirements/REQ-COMP-llm-purpose-consent.md), [REQ-SEC-llm-gateway-hardening](../1-spec/requirements/REQ-SEC-llm-gateway-hardening.md)
- **Auth:** authenticated; `:userId` = JWT subject.
- **Query params:** `?date=YYYY-MM-DD&locale=de|en` (defaults: today in user's TZ, user-profile locale).
- **Success 200:**
  ```json
  {
    "id": "<uuid>",
    "date": "2026-05-13",
    "mode": "pulse",
    "intensity": 0.62,
    "harmony_index": 0.70,
    "aphorism": {
      "id": "aph-rilke-001",
      "text_de": "...", "text_en": "...",
      "author": "Rainer Maria Rilke",
      "work": "Briefe an einen jungen Dichter",
      "year": 1903,
      "copyright": "public-domain",
      "attribution_status": "verified"
    },
    "slot_1": "<aphorism text in active locale>",
    "slot_2": "<LLM-generated bridge>",
    "slot_3": "<LLM-generated action impulse>",
    "council": [
      { "archetype_key": "sonne", "label_de": "Sonne", "icon": "..." }
    ],
    "engine_version": "v1",
    "is_fallback": false,
    "weather_stale": false
  }
  ```
- **Errors:** 401 `not_authenticated`; 403 `forbidden`; 422 `profile_incomplete`; 429 `rate_limited` (LLM over-budget — prefer fallback response over hard error per CC-2); 503 `aphorism_pool_empty`.
- **Determinism:** repeated GET with identical (userId, date, locale) returns the cached `daily_pulses` row.
- **Consent gate:** if `consent_records` for `llm_interpretation` revoked/absent, slot_2/slot_3 absent or flagged fallback; cached pre-revocation pulses still display.

#### `POST /v1/users/:userId/daily-interpretation`

- **Subsystem:** AS-3
- **Backing requirements:** [REQ-F-council-interpretation-cache](../1-spec/requirements/REQ-F-council-interpretation-cache.md), [REQ-SEC-edge-function-auth](../1-spec/requirements/REQ-SEC-edge-function-auth.md), [REQ-COMP-llm-purpose-consent](../1-spec/requirements/REQ-COMP-llm-purpose-consent.md), [REQ-SEC-llm-gateway-hardening](../1-spec/requirements/REQ-SEC-llm-gateway-hardening.md)
- **Auth:** authenticated; `:userId` = JWT subject.
- **Request body:**
  ```json
  {
    "daily_pulse_id": "<uuid>",
    "selected_archetype_key": "sonne|mond|aszendent|day_master|jahrestier|wuxing_dom",
    "locale": "de|en"
  }
  ```
- **Success 200:**
  ```json
  {
    "id": "<uuid>",
    "daily_pulse_id": "<uuid>",
    "selected_archetype_key": "sonne",
    "locale": "de",
    "text": "<LLM-generated interpretation>",
    "llm_model": "gemini-1.5-pro-002",
    "created_at": "2026-05-13T14:30:00Z",
    "is_cached": false
  }
  ```
  Repeat call with identical (daily_pulse_id, archetype, locale) returns cached row with `is_cached: true`; no new LLM call.
- **Errors:** 401, 403, 422 `consent_missing`, 429 `rate_limited`, 503 `llm_unavailable`.

### 3.3 GDPR / Consent (CC-1 active contracts)

#### `GET /v1/users/:userId/consents`

- **Backing requirements:** [REQ-COMP-consent-record](../1-spec/requirements/REQ-COMP-consent-record.md)
- **Auth:** authenticated; `:userId` = JWT subject.
- **Success 200:**
  ```json
  {
    "consents": [
      {
        "purpose": "astrological_derivation",
        "consent_text_version": "1.0",
        "lawful_basis": "consent",
        "granted_at": "2026-04-01T10:00:00Z",
        "revoked_at": null,
        "affirmation_method": "explicit_checkbox_v1"
      }
    ]
  }
  ```
- **Errors:** 401, 403.

#### `POST /v1/users/:userId/consents`

- **Backing requirements:** REQ-COMP-consent-record
- **Auth:** authenticated; `:userId` = JWT subject.
- **Request body:**
  ```json
  {
    "purpose": "astrological_derivation|analytics|llm_interpretation",
    "consent_text_version": "1.0",
    "affirmation_method": "explicit_checkbox_v1",
    "metadata": { "surface": "signup_flow", "locale": "de" }
  }
  ```
  Note: `billing` consent uses contract basis (Art. 6(1)(b)), recorded automatically on subscription creation — not granted via this endpoint.
- **Success 201:** returns the created `consent_records` row.
- **Errors:** 401, 403, 422 (`consent_text_version_outdated`, `purpose_invalid`).

#### `POST /v1/users/:userId/consents/:purpose/revoke`

- **Backing requirements:** REQ-COMP-consent-record, [REQ-COMP-llm-purpose-consent](../1-spec/requirements/REQ-COMP-llm-purpose-consent.md)
- **Auth:** authenticated; `:userId` = JWT subject.
- **Request body:** `{}`.
- **Success 200:** consent row with `revoked_at` set. Side effect: subsequent LLM calls for revoked purpose blocked at gateway.
- **Errors:** 401, 403, 404 `no_active_consent`.

#### `GET /v1/users/:userId/data-export`

- **Subsystem:** [CC-1](architecture.md#cc-1-consent-and-gdpr-layer)
- **Backing requirements:** [REQ-COMP-data-export](../1-spec/requirements/REQ-COMP-data-export.md), [REQ-SEC-export-authz](../1-spec/requirements/REQ-SEC-export-authz.md)
- **Auth:** authenticated; `:userId` = JWT subject.
- **Success 200:**
  ```json
  {
    "download_url": "https://storage.../<user_id>/export-<timestamp>.json?token=...",
    "expires_at": "2026-05-14T14:30:00Z"
  }
  ```
- **Export envelope (downloaded file):**
  ```json
  {
    "schema_version": "1.0",
    "user_id": "<uuid>",
    "generated_at": "2026-05-13T14:30:00Z",
    "user_astro_profile": { },
    "daily_pulses": [],
    "daily_interpretations": [],
    "aphorism_usage_events": [],
    "consent_records": [],
    "subscription_state": { },
    "stripe_pointer": { "stripe_customer_id": "cus_...", "see": "https://dashboard.stripe.com/..." }
  }
  ```
- **Errors:** 401, 403, 429 (≤5/24h/user per REQ-SEC-export-authz), 503 `export_generation_failed`.

#### `POST /v1/users/:userId/rtbf`

- **Subsystem:** CC-1
- **Backing requirements:** [REQ-COMP-rtbf](../1-spec/requirements/REQ-COMP-rtbf.md), [REQ-SEC-rtbf-authz](../1-spec/requirements/REQ-SEC-rtbf-authz.md)
- **Auth:** authenticated; `:userId` = JWT subject.
- **Request body:** `{}` or `{ "reason": "<optional text>" }`.
- **Success 202:**
  ```json
  {
    "deletion_job_id": "<uuid>",
    "status": "pending_confirmation",
    "requested_at": "2026-05-13T14:30:00Z",
    "next_step": "Check your verified email for the confirmation link (expires in 30 minutes)."
  }
  ```
  Side effect: confirmation email dispatched with a single-use confirmation link + separate cancel link.
- **Errors:** 401, 403, 409 `rtbf_already_in_progress`.

#### `POST /v1/users/:userId/rtbf/confirm`

- **Auth:** unauthenticated (single-use token from email).
- **Request body:** `{ "confirmation_token": "<from email>" }`.
- **Success 200:**
  ```json
  {
    "deletion_job_id": "<uuid>",
    "status": "pending_grace",
    "confirmed_at": "2026-05-13T14:45:00Z",
    "grace_window_ends_at": "2026-05-14T14:45:00Z",
    "next_step": "If you change your mind, click the cancel link before this time."
  }
  ```
- **Errors:** 400 `confirmation_token_invalid`, 410 `confirmation_token_expired`.

#### `POST /v1/users/:userId/rtbf/cancel`

- **Auth:** unauthenticated (cancel token from email) OR authenticated in-app.
- **Request body:** `{ "cancel_token": "<from email>" }` or `{}` (authenticated variant).
- **Success 200:** `{ "deletion_job_id": "<uuid>", "status": "cancelled", "cancelled_at": "..." }`.
- **Errors:** 401 (in-app variant), 400 `cancel_token_invalid`, 410 `cancel_token_expired`.

### 3.4 Subscription / billing (AS-7 active contracts)

#### `GET /v1/users/:userId/subscription-state`

- **Subsystem:** [AS-7](architecture.md#as-7-managesubscription-surface)
- **Backing requirements:** [REQ-F-manage-subscription](../1-spec/requirements/REQ-F-manage-subscription.md), [REQ-USA-cta-singular](../1-spec/requirements/REQ-USA-cta-singular.md)
- **Auth:** authenticated; `:userId` = JWT subject.
- **Success 200:**
  ```json
  {
    "tier": "free|premium",
    "plan_id": "price_...",
    "status": "active|canceled|incomplete|past_due|trialing|null",
    "current_period_end": "2026-06-13T00:00:00Z",
    "cancel_at_period_end": false,
    "payment_method_last4": "4242"
  }
  ```
- **Errors:** 401, 403.
- **Cache:** `Cache-Control: private, max-age=60` acceptable (state changes infrequently; webhook is async truth).

#### `POST /api/stripe/portal-session`

- **Subsystem:** AS-7
- **Backing requirements:** REQ-F-manage-subscription, [REQ-SEC-portal-session-tokens](../1-spec/requirements/REQ-SEC-portal-session-tokens.md)
- **Auth:** authenticated; only premium tier users allowed.
- **Request body:** `{ "return_url": "https://astro-noctum.app/settings" }`.
- **Success 200:**
  ```json
  {
    "url": "https://billing.stripe.com/p/session/...",
    "expires_at": "2026-05-13T14:35:00Z"
  }
  ```
- **Errors:** 401, 403 `not_premium`, 503 `portal_unavailable`.
- **Headers:** `Cache-Control: no-store`. URL single-use, TTL ≤5 min per REQ-SEC-portal-session-tokens. Client must navigate immediately, must not persist.

## 4. Rate Limiting

Per-user + per-IP counters in a shared store (Redis/Supabase table/Upstash — choice deferred to a `DEC-*`):

| Endpoint | Per-user | Per-IP |
|----------|----------|--------|
| `POST /api/checkout` | ≤10/min | ≤30/min |
| `GET /v1/users/:userId/daily-pulse` | ≤30/min (advisory — cached after first call) | ≤60/min |
| `POST /v1/users/:userId/daily-interpretation` | ≤50/h (LLM gateway) | ≤100/h |
| `GET /v1/users/:userId/data-export` | ≤5/24h | ≤20/24h |
| `POST /v1/users/:userId/rtbf` | ≤3/h | ≤10/h |
| `POST /api/stripe/portal-session` | ≤20/h | ≤60/h |
| Stripe webhook | not rate-limited (must accept replays) | — |

Limits exceeded → `429` with `Retry-After`. AS-6 surfaces 429 as the `rate-limited` error class per REQ-USA-checkout-error-categories.

## 5. CSRF and Origin

Browser-originated state-changing requests:
- `Origin` / `Referer` in allowlist.
- Cross-origin → `403`.
- Anti-CSRF token (double-submit cookie pattern) if a future migration to cookie-auth happens.

Server-to-server (Stripe webhook) uses signature verification, not CSRF.

## 6. Webhook Idempotency

- Every Stripe event has `event.id`.
- Handler reads `subscription_state.last_webhook_event_id`. Match → return 200 without re-processing.
- New event IDs trigger UPSERT; field updated atomically.
- Stripe retries with exponential backoff; handler stays idempotent.

## 7. Pagination

Only `GET /v1/users/:userId/data-export` produces potentially large output — handled via download-URL pattern (file generated server-side, URL returned). Other read endpoints are single-user/single-day and need no pagination. Future endpoints needing pagination use cursor pattern (`?cursor=<opaque>&limit=<n>`, `next_cursor` in response).

## 8. Versioning Strategy

- `/api/*` is legacy, frozen by Spec constraints.
- `/v1/*` is the active version. Additive changes (new optional fields) in place; breaking changes via `/v2/*` with ≥60-day overlap and `Deprecation` / `Sunset` headers on `/v1/*`.

## 9. Requirement Coverage

| Requirement | Endpoint(s) / mechanism |
|-------------|--------------------------|
| [REQ-F-impact-active-contract](../1-spec/requirements/REQ-F-impact-active-contract.md) | `POST /api/impact/active` documented server-profile-driven contract |
| [REQ-USA-fallback-indicator](../1-spec/requirements/REQ-USA-fallback-indicator.md) | All daily endpoints surface `is_fallback` / `engine_version` |
| [REQ-USA-profile-incomplete-cta](../1-spec/requirements/REQ-USA-profile-incomplete-cta.md) | 422 `profile_incomplete` error code on data-bearing endpoints |
| [REQ-F-daily-pulse-determinism](../1-spec/requirements/REQ-F-daily-pulse-determinism.md) | `GET /v1/users/:userId/daily-pulse` cached by (user, date, locale) |
| [REQ-F-council-interpretation-cache](../1-spec/requirements/REQ-F-council-interpretation-cache.md) | `POST /v1/users/:userId/daily-interpretation` cached; `is_cached` flag |
| [REQ-F-aphorism-approval-gate](../1-spec/requirements/REQ-F-aphorism-approval-gate.md) | 503 `aphorism_pool_empty` when no approved aphorism exists |
| [REQ-F-useDailyPulse-null-guard](../1-spec/requirements/REQ-F-useDailyPulse-null-guard.md) | 422 `profile_incomplete` is the explicit null response |
| [REQ-USA-cta-singular](../1-spec/requirements/REQ-USA-cta-singular.md) | `GET /v1/users/:userId/subscription-state` is single read path for tier |
| [REQ-F-checkout-single-trigger](../1-spec/requirements/REQ-F-checkout-single-trigger.md) | Server-side rate-limit is guardrail; client discipline complements |
| [REQ-F-checkout-stripe-redirect](../1-spec/requirements/REQ-F-checkout-stripe-redirect.md) | `POST /api/checkout` returns `{ url }`; client uses `window.location.href` |
| [REQ-USA-checkout-error-categories](../1-spec/requirements/REQ-USA-checkout-error-categories.md) | Error envelope `error.code` maps to documented error classes |
| [REQ-F-agent-card-no-checkout](../1-spec/requirements/REQ-F-agent-card-no-checkout.md) | Client discipline; server has no "agent card" concept |
| [REQ-F-manage-subscription](../1-spec/requirements/REQ-F-manage-subscription.md) | `GET /v1/users/:userId/subscription-state` + `POST /api/stripe/portal-session` |
| [REQ-COMP-consent-record](../1-spec/requirements/REQ-COMP-consent-record.md) | `GET/POST /v1/users/:userId/consents` + revoke endpoint |
| [REQ-COMP-data-export](../1-spec/requirements/REQ-COMP-data-export.md) | `GET /v1/users/:userId/data-export` |
| [REQ-COMP-rtbf](../1-spec/requirements/REQ-COMP-rtbf.md) | `POST /v1/users/:userId/rtbf` + confirm + cancel endpoints |
| [REQ-COMP-analytics-pii-free](../1-spec/requirements/REQ-COMP-analytics-pii-free.md) | Client-side analytics gateway (no API endpoint here) |
| [REQ-COMP-llm-purpose-consent](../1-spec/requirements/REQ-COMP-llm-purpose-consent.md) | 422 `consent_missing` on `daily-interpretation` when consent revoked/absent |
| [REQ-COMP-privacy-notice](../1-spec/requirements/REQ-COMP-privacy-notice.md) | Static page, not an API endpoint |
| [REQ-SEC-edge-function-auth](../1-spec/requirements/REQ-SEC-edge-function-auth.md) | §2 Auth + `:userId` = JWT subject enforcement |
| [REQ-SEC-checkout-rate-limit](../1-spec/requirements/REQ-SEC-checkout-rate-limit.md) | §4 rate-limit table; 429 + `Retry-After` |
| [REQ-SEC-export-authz](../1-spec/requirements/REQ-SEC-export-authz.md) | `GET /v1/users/:userId/data-export` ≤5/24h + subject-only |
| [REQ-SEC-rtbf-authz](../1-spec/requirements/REQ-SEC-rtbf-authz.md) | RTBF endpoint trio + single-use tokens + grace window |
| [REQ-SEC-llm-gateway-hardening](../1-spec/requirements/REQ-SEC-llm-gateway-hardening.md) | LLM-gateway rate limit reflected in 429 responses |
| [REQ-SEC-portal-session-tokens](../1-spec/requirements/REQ-SEC-portal-session-tokens.md) | `POST /api/stripe/portal-session` single-use TTL-≤5min URL, `Cache-Control: no-store` |
| [REQ-SEC-tls-everywhere](../1-spec/requirements/REQ-SEC-tls-everywhere.md) | HSTS header on all responses; transport security at deploy layer |
| [REQ-SEC-no-secrets-in-client](../1-spec/requirements/REQ-SEC-no-secrets-in-client.md) | All keys server-side only |
| [REQ-SEC-auth-session-storage](../1-spec/requirements/REQ-SEC-auth-session-storage.md) | Contract is `Authorization: Bearer <jwt>` regardless of client storage |

## 10. Constraint Compliance

| Constraint | API design respects it by |
|------------|-----------------------------|
| [CON-no-formula-changes](../1-spec/constraints/CON-no-formula-changes.md) | Endpoints return engine outputs; never expose derivation inputs as mutation paths |
| [CON-stripe-payment-stack](../1-spec/constraints/CON-stripe-payment-stack.md) | `/api/checkout`, `/api/stripe/webhook`, `/api/stripe/portal-session` are the only payment paths; never replaced |
| [CON-no-signatur-v3-rebuild](../1-spec/constraints/CON-no-signatur-v3-rebuild.md) | No signature-render API; `/signatur` page reads same astrological output |
| [CON-aphorisms-human-approved](../1-spec/constraints/CON-aphorisms-human-approved.md) | Aphorism read-only from DB; no API for status promotion |
| [CON-greenops-polling-budget](../1-spec/constraints/CON-greenops-polling-budget.md) | Cacheable responses + rate limits enforce ceiling |
| [CON-degraded-state-transparency](../1-spec/constraints/CON-degraded-state-transparency.md) | Response shapes carry `is_fallback`, `weather_stale`, `is_unavailable` |
| [CON-gdpr-applies](../1-spec/constraints/CON-gdpr-applies.md) | CC-1 endpoint family implements Art. 15–22 rights |

## 11. Open Gaps

- **No analytics-event ingestion endpoint.** Events flow to an external pipeline; PII gateway is client-side. Pipeline choice is operational/deploy-phase.
- **No admin / operator endpoints.** RTBF retry-on-failure (state machine `failed → executing`), aphorism status changes, manual subscription correction are operator-only — out of scope here.
- **No `/v2` planned.** Versioning documented preemptively; no breaking change on the horizon.
- **Privacy notice / consent UI surfaces** are HTML pages, not JSON endpoints — covered by REQ-COMP-privacy-notice.
- **Rate-limit counter store choice** (Redis vs Supabase table vs Upstash) is a Code/Deploy decision. Record as `DEC-rate-limit-store` when chosen.

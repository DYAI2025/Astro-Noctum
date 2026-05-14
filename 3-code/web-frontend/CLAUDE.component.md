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
| [DEC-codebase-lives-in-sibling-prod-dir](../../decisions/DEC-codebase-lives-in-sibling-prod-dir.md) | Runtime code lives in sibling `Astro-Noctum-prod/` directory | When editing or adding frontend code — runtime files live in `Astro-Noctum-prod/src/...`; this directory holds component governance only |

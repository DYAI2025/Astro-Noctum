# REQ-SEC-no-secrets-in-client: No service-side secrets ship in client bundles

**Type**: Security

**Status**: Approved

**Priority**: Must-have

**Source**: [CON-stripe-payment-stack](../constraints/CON-stripe-payment-stack.md)

**Source stakeholder**: [STK-ben](../stakeholders.md)

## Description

No API keys, service-role tokens, Stripe secret keys (`sk_*`), Supabase service-role keys, LLM provider keys, webhook signing secrets, or any other server-side credential is included in the client bundle, source map, or any public-readable resource. Public-by-design keys (Supabase anon key, Stripe publishable key `pk_*`) are permitted because their security model assumes client exposure. Verification is both build-time (automated secret scan over emitted bundles) and deploy-time (manual spot-check before release).

## Acceptance Criteria

- Given the production client bundle (JS + source maps) after build, when scanned by a secret-detection tool (e.g., `gitleaks`, `trufflehog`, or a configured regex set for `sk_live_`, `service_role`, `eyJ.*service_role`), then it produces zero findings.
- Given the same scan over the public `dist/` or equivalent deployed assets, then it produces zero findings.
- Given the build pipeline, when the secret-scan step fails, then the build aborts and no deploy proceeds.
- Given a new third-party integration is added, when reviewed in PR, then the PR description explicitly classifies each new key as public-by-design or server-only; server-only keys never appear in client-side `import.meta.env.VITE_*` or equivalent.
- Given a deploy is cut, when the operator audits before release, then a checklist item confirms no `.env` or `.env.local` made it into the deployed bundle.

## Related Constraints

- [CON-stripe-payment-stack](../constraints/CON-stripe-payment-stack.md) — Stripe secret keys are server-only.
- [CON-gdpr-applies](../constraints/CON-gdpr-applies.md) — Supabase service-role token must not leak (would bypass RLS).

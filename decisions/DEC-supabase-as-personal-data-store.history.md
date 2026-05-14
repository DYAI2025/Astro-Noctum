# DEC-supabase-as-personal-data-store: Trail

> Companion to `DEC-supabase-as-personal-data-store.md`.
> AI agents read this only when evaluating whether the decision is still
> valid or when proposing a change or supersession.

## Alternatives considered

### Option A: Supabase Postgres + Auth + Edge Functions (chosen)

- Pros: existing implementation in `Astro-Noctum-prod/`; integrated auth + db + functions; managed Postgres with RLS; EU region available; DPA signable; minimal operational overhead for a single-operator team.
- Cons: vendor lock-in; ceiling on free / hobby tier; not infinitely scale-out without paid-tier commitments.

### Option B: Self-hosted Postgres + custom auth + Lambda / Cloud Functions

- Pros: full control; no managed-DB vendor lock-in.
- Cons: massively higher operational burden; auth security to roll ourselves; DPA negotiations with every component vendor; sprint capacity lost.

### Option C: Firebase / Firestore

- Pros: similar managed offering, mature SDK.
- Cons: NoSQL model fits poorly with the relational consent-record + RTBF-cascade semantics; weaker EU-residency story for non-enterprise tier; migration cost from existing Supabase setup would be substantial.

## Reasoning

Supabase is the existing implementation. Replacing it would consume sprint capacity without delivering user-visible value, and CON-gdpr-applies + REQ-COMP-rtbf + REQ-COMP-data-export are achievable on Supabase with documented patterns (RLS, DPA, customer-deletion via API).

The High-risk assumption [ASM-supabase-fits-personal-data-scale](../1-spec/assumptions/ASM-supabase-fits-personal-data-scale.md) acknowledges that EU residency + DPA suitability + RTBF cascade timing must be verified before Code commits — verification is a precondition, not a blocker to recording the decision.

Trade-off accepted: vendor lock-in to Supabase. Mitigation: schema is standard Postgres; migration to another Postgres-based store (RDS, Neon, self-hosted) remains feasible if the assumption fails verification.

Invalidating conditions: ASM-supabase-fits-personal-data-scale verification fails — DPA insufficient, EU region unavailable, or RTBF cascade timing fails to meet the 30-day target. Triggers supersession.

## Human involvement

**Type**: ai-proposed/human-approved

**Notes**: Ben approved during the Design completeness assessment follow-up on 2026-05-13.

## Changelog

| Date | Change | Involvement |
|------|--------|-------------|
| 2026-05-13 | Initial decision | ai-proposed/human-approved |

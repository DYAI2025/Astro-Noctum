# DEC-supabase-backend: Trail

> Companion to `DEC-supabase-backend.md`.
> AI agents read this only when evaluating whether the decision is still
> valid or when proposing a change or supersession.

## Alternatives considered

### Option A: Supabase (PostgreSQL + Auth + RLS)
- Pros: Declarative RLS reduces attack surface; built-in auth with JWT; PostgREST reduces backend boilerplate; managed hosting; real-time subscriptions available
- Cons: Vendor lock-in; RLS policy complexity grows with table count; limited control over query optimization

### Option B: Firebase (Firestore + Firebase Auth)
- Pros: Real-time by default; generous free tier; mobile SDKs
- Cons: NoSQL data model poor fit for relational astro data (profiles → charts → contributions); Firestore security rules are harder to reason about than SQL RLS; no SQL for complex queries

### Option C: Custom PostgreSQL + Express middleware auth
- Pros: Full control; no vendor dependency
- Cons: Manual auth enforcement at every endpoint; higher attack surface; more boilerplate; need to build admin dashboard

## Reasoning

Supabase was chosen because RLS provides defense-in-depth — even if application code has a bug, the database enforces data isolation. The relational model is a natural fit for the interconnected astro data (profiles referencing birth_data, natal_charts, contribution_events). PostgREST reduces the API surface that needs to be manually secured.

This decision would be invalidated if: Supabase hosting becomes unavailable or prohibitively expensive; RLS performance degrades with table growth; or the app needs a fundamentally different data model (e.g., graph database for social features).

## Human involvement

**Type**: ai-proposed/human-approved

**Notes**: Decision was implicit from project inception; formalized as DEC record during scaffold migration (2026-03-23).

## Changelog

| Date | Change | Involvement |
|------|--------|-------------|
| 2026-03-23 | Initial decision (formalized from existing practice) | ai-proposed/human-approved |

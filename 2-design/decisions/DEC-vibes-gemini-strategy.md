# DEC-vibes-gemini-strategy: Gemini for Vibes and Weekly Insights Generation

**Status**: Active

**Category**: Architecture

**Scope**: api-server

**Source**: [GOAL-vibes-weekly-insights](../../1-objectives/goals/GOAL-vibes-weekly-insights.md)

**Last updated**: 2026-04-02

## Context

Vibes (on-demand 2–3h horizon) and Weekly Insights (7 life areas, ISO week cadence) both require natural-language generation from structured astrological signal data. Options considered:

1. **Gemini Flash** — fast, cheap, German-capable, already used for Dashboard interpretation
2. **Deterministic templates** — zero latency, zero cost, but static and impersonal
3. **Custom fine-tuned model** — high quality potential, prohibitive cost and operational overhead for current scale

## Decision

Use **Gemini `gemini-3-flash-preview`** as the generation backbone for both Vibes and Weekly Insights, with a two-level caching strategy to minimize LLM calls and a deterministic fallback for API failures.

## Key Points

1. **Model**: `gemini-3-flash-preview` — same model used for Dashboard interpretation. 15s timeout for Vibes, 20s for Weekly Insights (longer = more structured output).
2. **Two-level caching**: L1 in-memory (request-lifetime; evicted by cooldown) + L2 Supabase persistence (`vibes_cache`, `weekly_insights_cache`). Cache hit = no LLM call = p95 < 200ms.
3. **Deterministic fallback**: Both endpoints return soulprint-derived content when Gemini is unavailable. Marked `cached: false` in response meta; users see insight quality degrades gracefully.
4. **Prompt constraints**: All prompts include explicit instruction: "Do not include unexplained numerical values" (enforces `CON-no-unexplained-numbers` at generation time).
5. **Engine versioning**: `v1-gemini-vibes` and `v1-gemini-weekly` in cache keys. Cache invalidated automatically when engine version changes.
6. **Verified assumption**: `ASM-gemini-text-quality` — Gemini produces constraint-compliant insight text (≥80% first-pass quality), verified in production as of 2026-03-30.

## Performance Targets

| Feature | p95 (cache hit) | p95 (generation) |
|---------|----------------|-----------------|
| Vibes | < 200ms | < 2s |
| Weekly Insights | < 200ms | < 3s |

Gemini generation target: < 1.5s per `REQ-PERF-vibes-response-time`.

## Enforcement

### Trigger conditions

- When modifying Vibes or Weekly Insights generation logic
- When changing Gemini model, temperature, or prompt structure
- When adding caching layers or changing cache invalidation rules

### Required patterns

- Both endpoints use two-level cache (L1 in-memory + L2 Supabase) — never call Gemini without checking both levels first
- Prompts must include "Do not include unexplained numerical values" instruction
- Engine version in cache key must be bumped when prompt structure changes semantically
- Fallback path must produce valid response shape (same fields, degraded quality)

### Prohibited patterns

- Calling Gemini synchronously without timeout
- Returning raw Gemini output without validating required fields (`kurzsignal`, `treiber`, `erklaerung` for Vibes; `areas` array for Weekly)
- Using a different model for these features without updating this decision

## References

- [REQ-F-vibes-core](../../1-objectives/requirements/REQ-F-vibes-core.md)
- [REQ-F-vibes-output-structure](../../1-objectives/requirements/REQ-F-vibes-output-structure.md)
- [REQ-F-weekly-insights-engine](../../1-objectives/requirements/REQ-F-weekly-insights-engine.md)
- [REQ-PERF-vibes-response-time](../../1-objectives/requirements/REQ-PERF-vibes-response-time.md)
- [DEC-vibes-not-daily](DEC-vibes-not-daily.md)
- [ASM-gemini-text-quality](../../1-objectives/assumptions/ASM-gemini-text-quality.md)

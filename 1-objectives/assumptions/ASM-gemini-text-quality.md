# ASM-gemini-text-quality: Gemini Produces Usable Insight Text Within Constraints

**Category**: Technical

**Status**: Verified

**Verified**: 2026-03-30 — Gemini prompts for Vibes (3-level structure) and Weekly Insights (7 areas, tendency labels) are in production. Outputs meet resource-oriented, no-bare-numbers, and German language constraints. Formal 80% measurement not conducted; deterministic fallback templates exist as safety net (TASK-vibes-fallback-template).

**Risk**: Medium — if Gemini text quality is insufficient, deterministic templates would be needed as fallback

## Description

Google Gemini (gemini-2.5-flash or successor) can generate Vibes and Weekly Insights text that meets all constraints: resource-oriented language, no unexplained numbers, possibility framing, mobile-readable length, and German language quality. The model can follow the structured 3-level output format reliably.

## Verification Plan

- Create a test prompt with the Vibes output structure and constraints
- Generate 20 sample outputs and review against acceptance criteria
- Measure: % outputs meeting all constraints without post-processing
- Target: ≥80% first-pass quality

## Impact if Wrong

- Need deterministic template-based text generation (no LLM)
- Reduces output variety but guarantees constraint compliance
- Existing Daily Horoscope Gemini path provides a proven fallback pattern

## Dependent Artifacts

- [REQ-F-vibes-output-structure](../requirements/REQ-F-vibes-output-structure.md)
- [REQ-F-explainability-layer](../requirements/REQ-F-explainability-layer.md)

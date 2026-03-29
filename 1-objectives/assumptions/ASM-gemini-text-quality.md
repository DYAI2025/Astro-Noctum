# ASM-gemini-text-quality: Gemini Produces Usable Insight Text Within Constraints

**Category**: Technical

**Status**: Unverified

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

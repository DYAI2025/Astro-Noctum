# ASM-llm-determinism-acceptable: LLM-generated content is consistent enough across re-runs that user perception isn't affected

**Category**: Technology

**Status**: Unverified

**Risk if wrong**: Medium — Users would experience daily-pulse Slot 2/3 and Council-figure interpretation drift across reloads (until the upsert layer caches them), eroding the "deterministic personalized framing" promise of `GOAL-aphorism-personalized-interpretation`. Worst case: same user, same day, same archetype produces visibly inconsistent text on the rare path where the cache entry is evicted or absent.

## Statement

LLM (Gemini, FuFirE, or successor) generation of daily-pulse Slot 2 ("bridge to today"), Slot 3 ("action prompt"), and Council-figure interpretation produces output that is **internally consistent enough** for the user perception goal — i.e., when the cached row is the source of truth, multiple reads return the same text, and even when the cache is bypassed (debugging, regeneration), the regenerated output stays within a "same-feeling" envelope.

## Rationale

The architecture relies on cache-on-first-call semantics in `daily_pulses` and `daily_interpretations` tables. Once the row exists, determinism is guaranteed at the persistence layer. The risk is *initial* generation: if temperature is too high, the same prompt produces very different outputs on regeneration, which becomes visible during testing, debugging, and edge cases (cache invalidation, schema migration). At low temperature (or with seed control), most modern LLMs produce stable enough output for short, structured generation tasks.

## Verification Plan

- **Pre-launch**: run a determinism harness — generate Slot 2 + Slot 3 for 20 representative `(user, date, mode)` triples 5 times each at the production-target temperature; measure cosine similarity / BLEU between runs; require ≥85% similarity median for the assumption to hold.
- **Pre-launch**: same harness for `daily-interpretation` per archetype.
- **Post-launch**: monitor user-visible regeneration events (e.g., manual "refresh interpretation" if exposed as a feature) and sample for unacceptable drift.
- **Verification window**: complete before Phase T `daily-pulse` edge function ships to production (TASK-T3).

## Related Artifacts

- [GOAL-aphorism-personalized-interpretation](../goals/GOAL-aphorism-personalized-interpretation.md)
- [REQ-F-daily-pulse-determinism](../requirements/REQ-F-daily-pulse-determinism.md)
- [REQ-F-council-interpretation-cache](../requirements/REQ-F-council-interpretation-cache.md)

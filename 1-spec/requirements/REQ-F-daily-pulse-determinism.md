# REQ-F-daily-pulse-determinism: daily-pulse endpoint returns deterministic results per (userId, date, locale)

**Type**: Functional

**Status**: Draft

**Priority**: Should-have

**Source**: [GOAL-aphorism-personalized-interpretation](../goals/GOAL-aphorism-personalized-interpretation.md)

**Source stakeholder**: [STK-user-free](../stakeholders.md)

## Description

The `GET /v1/users/:userId/daily-pulse?date=YYYY-MM-DD&locale=de|en` edge function must return deterministic results: identical input parameters (`userId`, `date`, `locale`) produce the same selected aphorism, the same mode classification (`pulse` / `trace` / `spannung`), and the same harmony index for that user-day, even across multiple invocations. The deterministic selection is implemented via the algorithm specified in `apps/tagespuls_package/packages/voice/src/tagespuls.ts` — top-5 aphorisms by `quality_rating` filtered to the day's mode, then `simpleHash(userId + date + mode) % 5` to pick. Slot 2 and Slot 3 (LLM-generated text) may vary across re-runs because they're cached via the `daily_pulses` upsert path on first generation.

## Acceptance Criteria

- Given a `(userId, date, locale)` triple has no existing `daily_pulses` row, when the endpoint is called twice in succession, then both responses contain the same aphorism `id`, the same mode, the same intensity, and the same `harmony_index`.
- Given the second call lands after the first has upserted into `daily_pulses`, when it executes, then it reads the persisted row rather than recomputing — slot_2 and slot_3 LLM text are stable across calls for the same day.
- Given two different users with the same birth profile (rare but possible) and the same date, when the endpoint is called for each, then their aphorisms may differ because `userId` is in the hash input.
- Given the user's birth profile is missing, when the endpoint is called, then a 422 with a structured error is returned (no fallback to a generic pulse).
- The endpoint passes `tsc --noEmit` and includes integration tests proving determinism.

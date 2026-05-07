# REQ-F-aphorism-approval-gate: Phase T blocked until aphorisms.json has ≥15 approved entries with mode coverage

**Type**: Functional

**Status**: Draft

**Priority**: Should-have

**Source**: [GOAL-aphorism-personalized-interpretation](../goals/GOAL-aphorism-personalized-interpretation.md)

**Source stakeholder**: [STK-ben](../stakeholders.md)

## Description

Phase T of the implementation plan (Tagespuls Neu-Architektur — TASK-T1 through TASK-T7) must not begin until the production aphorism pool (`apps/tagespuls_package/packages/voice/data/aphorisms.json`) contains at least 15 entries, all with `status: "approved"`, with mode-tag coverage spanning all three modes (`pulse`, `trace`, `spannung`) — or, as a fallback acceptance, ≥10 entries with full mode coverage. This is enforced as a prerequisite gate (TASK-T0) and as a CI check before any Phase T edge function is deployed.

## Acceptance Criteria

- Given `aphorisms.json` is read, when its entries are counted, then the count is ≥15 (or ≥10 with strict mode coverage) and every entry has `status === "approved"`.
- Given the entries are inspected, when their `mode_tags` are unioned, then the union includes `pulse`, `trace`, and `spannung`.
- Given the gate check fails (TASK-T0 assertion), when run, then a human-readable error is emitted and Phase T tasks (T1–T7) are blocked from execution by the agent.
- Given the gate passes, when documented, then the result is logged in `docs/tagespuls-gate-check.txt` with timestamp, count, and modes covered.
- The agent does not bypass the gate or auto-promote draft aphorisms to satisfy it.

## Related Constraints

- [CON-aphorisms-human-approved](../constraints/CON-aphorisms-human-approved.md) — this requirement is the verifiable expression of the human-approval constraint at the production-pool level.

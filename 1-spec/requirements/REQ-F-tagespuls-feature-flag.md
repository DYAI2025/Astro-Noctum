# REQ-F-tagespuls-feature-flag: Tagespuls Neu-Architektur is gated by tagespuls_neu_v1 feature flag

**Type**: Functional

**Status**: Draft

**Priority**: Should-have

**Source**: [GOAL-aphorism-personalized-interpretation](../goals/GOAL-aphorism-personalized-interpretation.md)

**Source stakeholder**: [STK-ben](../stakeholders.md)

## Description

The Tagespuls Neu-Architektur feature surface — primarily the `TagespulsCard` component and its consumption of `useDailyPulse` — must be gated behind the `tagespuls_neu_v1` feature flag. When the flag is `false` (or unset, defaulting to `false`), the dashboard renders identically to the pre-Tagespuls state (`DailyChartHero` is the daily-pulse surface). When the flag is `true`, `TagespulsCard` is mounted at section position 1, and `DailyChartHero` remains as the deeper layer below. This enables staged rollout (per-user, per-cohort, or progressive ramp) without forcing a full release.

## Acceptance Criteria

- Given the feature flag mechanism resolves `tagespuls_neu_v1` to `false`, when the dashboard renders, then `TagespulsCard` is not mounted; the rest of the dashboard is unchanged from current behavior.
- Given the flag resolves to `true`, when the dashboard renders, then `TagespulsCard` is mounted at the first section position; `DailyChartHero` is rendered below it.
- Given the flag is unset or evaluation throws, when the dashboard renders, then the default is treated as `false` (fail-closed — no accidental flag-on).
- The flag value is checked via the existing feature-flag mechanism (e.g., `featureFlags?.tagespuls_neu_v1 ?? false`), not via a hardcoded check.
- Toggling the flag at runtime (or on next mount) cleanly switches between the two states without leaving stale data or broken hooks.

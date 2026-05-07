# CON-degraded-state-transparency: Degraded data must be visibly marked

**Category**: Operational

**Status**: Active

**Source stakeholder**: [STK-user-free](../stakeholders.md)

## Description

Whenever the system serves the user data that is degraded, fallback-generated, stale, or otherwise non-live, the UI must visibly mark it. Examples drawn from the dev brief:

- API outage triggers `buildFallbackDaily()` with `meta.engine_version === 'v1-local-fallback'` → DailyChartHero renders a fallback indicator (e.g., "↻ Heute nicht verfügbar — generischer Inhalt").
- Cosmic-weather snapshot is older than the daily-pulse target window → API response surfaces `weather_stale: true` and the UI reflects it.
- Kp index unavailable → driver strip shows `—`, never `0` (zero is a valid live reading).
- LLM call for daily interpretation fails → user is told the interpretation is using a fallback, not silently shown a generic string.

## Rationale

Showing generic, fallback, or stale content as if it were personalized live output erodes user trust permanently. It violates the project's stated development principle: "What doesn't work should fail visibly so we can fix it" / "no masking errors, no hiding, no empty promises". This is non-negotiable across both free and premium tiers — data truth is not a paid feature. The dev brief flags this concretely in TASK-D2 (fallback indicator) and TASK-4.3 (degraded states sichtbar machen) and applies it as a default-on rule.

## Impact

- Every component that consumes API data must distinguish three states — **live response**, **fallback / generic**, **unavailable** — and render a distinct UI affordance for each. Adding a new data-consuming component without a degraded-state rendering path is a violation.
- The fallback indicator pattern from TASK-D2 (`data-testid="fallback-indicator"`, low-opacity caption) is the reference implementation; new degraded-state markers should follow it stylistically (subtle, factual, never alarmist).
- Hooks that swallow errors and substitute defaults must surface that substitution in their return shape (`isFallback: boolean`, `weather_stale: boolean`, etc.) — silent fallbacks are not allowed.
- Analytics events distinguishing live vs fallback responses are encouraged so the team can monitor degraded-state exposure rate over time.

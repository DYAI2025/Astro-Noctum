# DEC-vibes-not-daily: "Vibes" (on-demand, 2–3h) Instead of "Daily Vibe"

**Status**: Active

**Category**: Product

**Scope**: frontend, api-server

**Source**: [GOAL-vibes-weekly-insights](../../1-objectives/goals/GOAL-vibes-weekly-insights.md)

**Last updated**: 2026-03-30

## Context

The original concept was a "Daily Vibe" — one insight per day. User research showed that a daily cadence feels stale by afternoon. A short-horizon, on-demand format better matches the spontaneous check-in use case.

## Decision

Use "Vibes" (plural, on-demand) with a 2–3 hour horizon instead of a daily-fixed insight. The user can request a Vibe at any time and receives a result tuned to the next few hours.

**Trade-off**: "Vibes" is a less familiar brand term than "Daily Vibe", but it better reflects the spontaneous, short-horizon nature of the feature.

## Enforcement

### Trigger conditions

- When designing the Vibes UI, CTA text, or API endpoint naming
- When writing Vibes-related Gemini prompts or text templates

### Required patterns

- CTA button text: "Vibe abrufen" (not "Tages-Vibe")
- Time horizon in output: "nächste Stunden" (not "heute")
- API naming: `/api/vibes` (not `/api/daily-vibe`)

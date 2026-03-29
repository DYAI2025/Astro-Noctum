# DEC-top-3-weekly-focus: Top-3 Area Focus in Weekly Insights

**Status**: Active

**Category**: Product

**Scope**: frontend

**Source**: [GOAL-vibes-weekly-insights](../../1-objectives/goals/GOAL-vibes-weekly-insights.md)

**Last updated**: 2026-03-30

## Context

Showing 7 life areas with equal visual weight creates information overload. Users struggle to identify what matters most this week. Cognitive load research suggests 3 items as the optimal focus set.

## Decision

Weekly Insights highlights exactly 3 life areas as "this week's focus" with additional visual emphasis and deeper content. The remaining 4 areas are shown in a reduced format (1 line + tendency label only).

**Trade-off**: Less completeness — users who want equal depth on all 7 areas won't get it. But the 70% who want quick orientation benefit.

## Enforcement

### Trigger conditions

- When designing the Weekly Insights layout
- When implementing the area prioritization algorithm

### Required patterns

- Top 3: visually distinct (larger card, accent color, 1 extra sentence)
- Remaining 4: compact single-line with tendency label
- Prioritization derived from Signatur × transit, not random
- Deterministic: same user + same week = same top 3

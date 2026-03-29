# REQ-USA-mobile-first-readability: Mobile-First Insight Readability

**Type**: Usability

**Status**: Approved

**Priority**: Must-have

**Source**: [GOAL-vibes-weekly-insights](../goals/GOAL-vibes-weekly-insights.md), [CON-mobile-first-readability](../constraints/CON-mobile-first-readability.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## Description

All insight outputs (Vibes, Weekly Insights) must be optimized for mobile-first readability. The core message must be comprehensible within 10 seconds on a 375px-wide viewport without scrolling. Desktop may show additional depth but the mobile experience is the primary design target.

## Acceptance Criteria

- Given a Vibes result on a 375px viewport, when Level 1 + Level 2 are rendered, then they fit above the fold without scrolling
- Given a Weekly Insights overview on a 375px viewport, when all 7 areas are rendered, then the top-3 highlighted areas are visible above the fold
- Given any insight text, when displayed, then font size is ≥14px and line height ≥1.5 for readability
- Given a user scanning the insight, when timed, then core understanding is achievable within 10 seconds (validated via user testing or heuristic review)
- Given the same insight on web (≥768px), when rendered, then logic and content are identical — only layout density differs

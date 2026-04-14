# REQ-F-weekly-insights-engine: Weekly Insights Across 7 Life Areas

**Type**: Functional

**Status**: Implemented

**Priority**: Must-have

**Source**: [US-weekly-overview](../user-stories/US-weekly-overview.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## Description

The system generates weekly insights covering 7 predefined life areas. Each area receives a short qualitative statement and a tendency label derived from the user's Signatur combined with the week's transit forecast. Content refreshes at the start of each week.

## Acceptance Criteria

- Given an authenticated user, when they open Weekly Insights, then all 7 areas are displayed: Freundschaften, Liebe, Sex/Zärtlichkeit, Beruf, Alltag, Karriere, Gesundheit
- Given each life area, when rendered, then it shows 1 short statement (max 1 sentence) and 1 tendency label (e.g., "Spannung", "Offenheit", "Rückzug")
- Given the weekly insights, when the current week changes (Monday boundary), then insights are regenerated for the new week
- Given the weekly generation, when it runs, then it derives area tendencies from the user's soulprint sectors mapped to the 7 life domains via transit modulation
- Given the weekly output, when displayed on mobile, then all 7 areas are scannable within 10 seconds

## Related Constraints

- [CON-resource-oriented-framing](../constraints/CON-resource-oriented-framing.md) — tendency labels, not predictions
- [CON-mobile-first-readability](../constraints/CON-mobile-first-readability.md) — 10s scan target

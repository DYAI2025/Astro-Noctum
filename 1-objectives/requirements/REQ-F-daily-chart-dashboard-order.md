# REQ-F-daily-chart-dashboard-order: Daily Chart Section Before Planetarium

**Type**: Functional

**Status**: Implemented

**Priority**: Must-have

**Source**: [US-daily-coherence-visibility](../user-stories/US-daily-coherence-visibility.md), [GOAL-daily-chart-coherence-first](../goals/GOAL-daily-chart-coherence-first.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## Description

The dashboard vertical section order must place the Daily Chart block (Kohärenzindex, Day Mode, active planet cards) above the Planetarium (3D orrery). The Planetarium remains on the page as a stable visualisation but is not the primary above-the-fold element.

## Acceptance Criteria

- Given the dashboard page, when rendered at full scroll-top position, then the Daily Chart section appears before the Planetarium section in document order.
- Given the dashboard page, when rendered, then the Planetarium is not removed — it scrolls into view below the Daily Chart section.
- Given an existing user with a saved profile, when the dashboard loads, then the section order is: Daily Chart → (other sections) → Planetarium.

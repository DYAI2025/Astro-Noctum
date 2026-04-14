# REQ-F-weekly-area-prioritization: Top-3 Life Area Prioritization

**Type**: Functional

**Status**: Implemented

**Priority**: Should-have

**Source**: [US-weekly-prioritization](../user-stories/US-weekly-prioritization.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## Description

Weekly Insights highlights the top 3 most relevant life areas with additional visual emphasis and deeper content. The remaining 4 areas are consciously reduced to minimize cognitive load. Prioritization is deterministic, derived from the user's Signatur + transit data, not random.

## Acceptance Criteria

- Given weekly insights for a user, when rendered, then exactly 3 areas are visually highlighted (larger, bolder, or accent-colored)
- Given a top-3 area, when rendered, then it contains 1 additional sentence or explanation compared to the reduced areas
- Given the remaining 4 areas, when rendered, then they show only the short statement + tendency label (no extra depth)
- Given the prioritization algorithm, when run with the same user + same week, then it produces the same top 3 (deterministic)

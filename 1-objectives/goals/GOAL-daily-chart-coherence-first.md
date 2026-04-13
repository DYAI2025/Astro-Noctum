# GOAL-daily-chart-coherence-first: Daily chart coherence first

**Description**: Define one coherent daily chart contract so frontend and backend share the same semantic model for harmony and impact data.

**Status**: Approved

**Priority**: Must-have

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## Success Criteria

- [ ] The `harmony_index` domain is normalized as a unit interval (`0.0` to `1.0`) across all daily chart artifacts.
- [ ] A single source of truth is defined for daily `space_weather` and impact composition.

## Related Artifacts

- Requirements: [REQ-F-coherence-hero-impact-datasource](../requirements/REQ-F-coherence-hero-impact-datasource.md), [REQ-F-impact-active-endpoint](../requirements/REQ-F-impact-active-endpoint.md), [REQ-F-daily-chart-coherence-hero](../requirements/REQ-F-daily-chart-coherence-hero.md), [REQ-F-daily-chart-dashboard-order](../requirements/REQ-F-daily-chart-dashboard-order.md)

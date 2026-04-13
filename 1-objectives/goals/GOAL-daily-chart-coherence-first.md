# GOAL-daily-chart-coherence-first: Coherence-guided Daily Chart as Primary Dashboard Experience

**Description**: Replace the Planetarium as the first dashboard impression with a coherence-guided Daily Chart. Users see their harmony index, personally relevant transiting planets (filtered against their natal chart), and cosmic weather above the fold — all derived from traceable mathematical values. No decorative adjectives without a data source.

**Status**: Draft

**Priority**: Must-have

**Source stakeholder**: [STK-product-owner](../stakeholders.md), [STK-end-user](../stakeholders.md)

## Success Criteria

- [ ] Harmony index (0–100) and Day Mode visible above the fold within 3s of dashboard load on a median device
- [ ] Every displayed value traces to a calculation parameter in the `evidence` block of the API response (100% traceability)
- [ ] Active planet cards show only planets with orb ≤ 8° to a natal aspect — not a fixed 6-planet pool
- [ ] All Daily Chart data loads via a single POST /experience/daily?include=impact call (no multi-hook assembly)
- [ ] Existing consumers (DashboardTagesEnergie, ResonanzSnapshot, CosmicWeatherCard) continue to work without modification
- [ ] +15% daily return rate vs. pre-launch baseline (lagging indicator, measured 4 weeks post-launch)

## Related Artifacts

- Constraints: [CON-no-unexplained-numbers](../constraints/CON-no-unexplained-numbers.md), [CON-resource-oriented-framing](../constraints/CON-resource-oriented-framing.md), [CON-dark-luxury-aesthetic](../constraints/CON-dark-luxury-aesthetic.md)
- User stories: [US-daily-coherence-visibility](../user-stories/US-daily-coherence-visibility.md), [US-daily-active-planets](../user-stories/US-daily-active-planets.md), [US-daily-planet-transparency](../user-stories/US-daily-planet-transparency.md), [US-daily-cosmic-weather](../user-stories/US-daily-cosmic-weather.md), [US-daily-impulse-text](../user-stories/US-daily-impulse-text.md), [US-daily-resonance-badges](../user-stories/US-daily-resonance-badges.md), [US-daily-action-recommendation](../user-stories/US-daily-action-recommendation.md), [US-daily-single-api-call](../user-stories/US-daily-single-api-call.md), [US-daily-impact-only-call](../user-stories/US-daily-impact-only-call.md)
- Requirements: [REQ-F-daily-chart-coherence-hero](../requirements/REQ-F-daily-chart-coherence-hero.md), [REQ-F-daily-chart-dashboard-order](../requirements/REQ-F-daily-chart-dashboard-order.md), [REQ-F-impact-active-endpoint](../requirements/REQ-F-impact-active-endpoint.md), [REQ-F-experience-daily-v2](../requirements/REQ-F-experience-daily-v2.md), [REQ-F-active-planets-frontend](../requirements/REQ-F-active-planets-frontend.md), [REQ-F-coherence-hero-impact-datasource](../requirements/REQ-F-coherence-hero-impact-datasource.md), [REQ-PERF-impact-active-response-time](../requirements/REQ-PERF-impact-active-response-time.md), [REQ-PERF-daily-experience-response-time](../requirements/REQ-PERF-daily-experience-response-time.md)
- Assumptions: [ASM-noaa-in-fufre](../assumptions/ASM-noaa-in-fufre.md)

# GOAL-vibes-weekly-insights: On-Demand Vibes & Weekly Insights with Transparent Outputs

**Description**: Users receive two new insight modes: on-demand "Vibes" (2–3h horizon, spontaneous) and "Weekly Insights" (7 life areas with top-3 prioritization). All outputs follow a strict transparency rule — no unexplained numbers in the UI. Insights derive from existing Fusion/Signatur logic, presented in resource-oriented language with a 3-level depth structure (Kurzsignal → Treiber → Erklärung).

**Status**: Draft

**Priority**: Must-have

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## Success Criteria

- [ ] "Vibe abrufen" button on Dashboard delivers a personalized insight within <2s (technically), understandable within <10s (UX)
- [ ] Vibes output contains 3 levels: 1 Kurzsignal, 3–5 Einflussfaktoren, 1 Erklärung
- [ ] Weekly Insights covers 7 life areas: Freundschaften, Liebe, Sex/Zärtlichkeit, Beruf, Alltag, Karriere, Gesundheit
- [ ] Top 3 weekly areas are visually highlighted with additional depth; remaining areas are reduced
- [ ] Every "Warum sehe ich das?" tap produces an explanation referencing the user's Signatur + current constellation
- [ ] Zero unexplained numerical values in the UI (system-wide enforcement)
- [ ] ≥70% of users understand the insight without an additional tap (measured via analytics or user test)
- [ ] ≥50% weekly engagement rate (users check Weekly Insights at least 1x/week)
- [ ] Identical inputs at the same timestamp produce identical Vibes output (determinism)
- [ ] Mobile and web show consistent logic with platform-adapted information density

## Related Artifacts

- Constraints: [CON-no-unexplained-numbers](../constraints/CON-no-unexplained-numbers.md), [CON-resource-oriented-framing](../constraints/CON-resource-oriented-framing.md), [CON-mobile-first-readability](../constraints/CON-mobile-first-readability.md)
- User stories: [US-vibes-on-demand](../user-stories/US-vibes-on-demand.md), [US-vibes-explainability](../user-stories/US-vibes-explainability.md), [US-weekly-overview](../user-stories/US-weekly-overview.md), [US-weekly-prioritization](../user-stories/US-weekly-prioritization.md), [US-number-transparency](../user-stories/US-number-transparency.md)
- Requirements: [REQ-F-vibes-core](../requirements/REQ-F-vibes-core.md), [REQ-F-vibes-output-structure](../requirements/REQ-F-vibes-output-structure.md), [REQ-F-weekly-insights-engine](../requirements/REQ-F-weekly-insights-engine.md), [REQ-F-weekly-area-prioritization](../requirements/REQ-F-weekly-area-prioritization.md), [REQ-F-transparency-rule](../requirements/REQ-F-transparency-rule.md), [REQ-F-explainability-layer](../requirements/REQ-F-explainability-layer.md), [REQ-USA-mobile-first-readability](../requirements/REQ-USA-mobile-first-readability.md), [REQ-PERF-vibes-response-time](../requirements/REQ-PERF-vibes-response-time.md)

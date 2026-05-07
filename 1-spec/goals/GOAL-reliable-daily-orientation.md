# GOAL-reliable-daily-orientation: Reliable daily orientation experience on every dashboard visit

**Description**: Users opening the Astro-Noctum dashboard reliably receive their tagesaktueller Kernwert: a current daily framing (DailyChartHero today, evolving toward TagespulsCard), a harmony index, active influences, and visibly-marked fallback states when external services degrade. The dashboard's first viewport must answer three questions within seconds: *what's happening today?*, *what does it mean for me?*, *what can I do now?* This is the core repeat-engagement loop — if it isn't reliable, retention collapses regardless of feature depth.

**Status**: Approved

**Priority**: Must-have

**Source stakeholder**: [STK-user-free](../stakeholders.md)

## Success Criteria

- [ ] Free and premium users see daily-pulse content on the first viewport with no buildbreakers (typecheck clean, no tour-overlay stuck after completion, no missing-component crashes).
- [ ] When external services fail (FuFirE / Gemini outage, Space Weather unavailable), fallback content is visibly marked per [CON-degraded-state-transparency](../constraints/CON-degraded-state-transparency.md) — never presented as personalized live output.
- [ ] Profile-incomplete users (no birth data) see an explicit profile-completion CTA in the daily-pulse section instead of generic content.
- [ ] Daily Chart API contract (`/api/impact/active`) is unambiguous: no leaky duplication of `baseCoherence`, `positiveDailyDelta`, `displayedCoherence` between hooks; degraded states surface as `isUnavailable` or `—`, never as `0` masquerading as a real reading.
- [ ] Dashboard information hierarchy makes "what's today" the first viewport: `DailyChartHero` (or future `TagespulsCard`) → Signatur anchor → active influences → daily impulse / modal → agents/premium → blueprint/archive.

## Related Artifacts

- User stories: _none yet_
- Requirements: [REQ-F-tour-overlay-state](../requirements/REQ-F-tour-overlay-state.md), [REQ-USA-fallback-indicator](../requirements/REQ-USA-fallback-indicator.md), [REQ-USA-profile-incomplete-cta](../requirements/REQ-USA-profile-incomplete-cta.md), [REQ-F-impact-active-contract](../requirements/REQ-F-impact-active-contract.md), [REQ-USA-dashboard-section-order](../requirements/REQ-USA-dashboard-section-order.md)
- Constraints: [CON-degraded-state-transparency](../constraints/CON-degraded-state-transparency.md), [CON-no-formula-changes](../constraints/CON-no-formula-changes.md)

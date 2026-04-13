# GOAL-synastry-compatibility: Partnership Compatibility via Synastry Chart

**Description**: Users can create partner profiles (manual birth data entry) and see an interaspect synastry analysis comparing both natal charts. The feature bridges Western aspect geometry with the broader Bazodiac experience — structured aspect data for all users, Gemini-generated narratives for premium users. Synastry data feeds partnership narratives but does not influence the personal Master Signal.

**Status**: Draft

**Priority**: Must-have

**Source stakeholder**: [STK-end-user](../stakeholders.md), [STK-product-owner](../stakeholders.md)

## Success Criteria

- [ ] Users can add, view, and delete partner profiles with birth data (name, date, time, place)
- [ ] POST /api/synastry computes interaspects using staggered orbs (Conj/Opp ±8°, Trine/Square ±6°, Sextile ±4°) via Placidus house system
- [ ] Free users see the aspect grid and template-based compatibility summary
- [ ] Premium users receive a Gemini-generated narrative (always German, resource-oriented framing)
- [ ] Server-side tier enforcement prevents premium narrative generation for free users
- [ ] Synastry results do not modify the personal Master Signal or Signatur geometry

## Related Artifacts

- Constraints: [CON-german-ui](../constraints/CON-german-ui.md), [CON-resource-oriented-framing](../constraints/CON-resource-oriented-framing.md)
- User stories: [US-synastry-partner-management](../user-stories/US-synastry-partner-management.md), [US-synastry-aspect-analysis](../user-stories/US-synastry-aspect-analysis.md), [US-synastry-premium-narrative](../user-stories/US-synastry-premium-narrative.md)
- Requirements: [REQ-F-synastry-partner-management](../requirements/REQ-F-synastry-partner-management.md), [REQ-F-synastry-aspect-analysis](../requirements/REQ-F-synastry-aspect-analysis.md), [REQ-F-synastry-premium-narrative](../requirements/REQ-F-synastry-premium-narrative.md)
- Decisions: [DEC-synastry-architecture](../2-design/decisions/DEC-synastry-architecture.md), [DEC-aspect-orb-tolerances](../2-design/decisions/DEC-aspect-orb-tolerances.md), [DEC-house-system-placidus](../2-design/decisions/DEC-house-system-placidus.md), [DEC-narrative-engine-hybrid](../2-design/decisions/DEC-narrative-engine-hybrid.md)

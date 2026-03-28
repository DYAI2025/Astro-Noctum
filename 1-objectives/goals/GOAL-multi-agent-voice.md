# GOAL-multi-agent-voice: Multi-Agent Voice Architecture

**Description**: Introduce Eve as a second ElevenLabs AI voice agent alongside Levi, enabling users to choose between two distinct personas (Levi: calm/wise/mentoring; Eve: direct/bold/modern) while sharing the same astrological data foundation. Requires refactoring the Levi-specific architecture into a generic multi-agent system.

**Status**: Approved

**Priority**: Must-have

**Source stakeholder**: [STK-end-user](../stakeholders.md), [STK-product-owner](../stakeholders.md)

## Success Criteria

- [ ] Eve is live as a separate ElevenLabs voice agent with her own Agent ID
- [ ] Dashboard shows two side-by-side agent tiles (Levi + Eve) with distinct visuals and microcopy
- [ ] Each agent has independent conversation history — no cross-contamination
- [ ] Session continuation loads the correct agent-specific history
- [ ] Levi remains fully functional after the refactor (zero regression)
- [ ] Both agents are gated behind Premium (no free trial mode)
- [ ] Technical architecture supports adding a third agent without structural changes

## Related Artifacts

- Requirements: [REQ-F-eve-voice-agent](../requirements/REQ-F-eve-voice-agent.md), [REQ-F-agent-dashboard-selection](../requirements/REQ-F-agent-dashboard-selection.md), [REQ-F-agent-conversation-persistence](../requirements/REQ-F-agent-conversation-persistence.md), [REQ-F-agent-architecture-refactor](../requirements/REQ-F-agent-architecture-refactor.md), [REQ-MNT-agent-extensibility](../requirements/REQ-MNT-agent-extensibility.md), [REQ-SEC-eve-brand-safety](../requirements/REQ-SEC-eve-brand-safety.md)
- Assumptions: [ASM-elevenlabs-multi-agent](../assumptions/ASM-elevenlabs-multi-agent.md)
- Constraints: [CON-german-ui](../constraints/CON-german-ui.md), [CON-dark-luxury-aesthetic](../constraints/CON-dark-luxury-aesthetic.md)

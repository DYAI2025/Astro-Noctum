# US-agent-selection: Choose Between Levi and Eve

**Status**: Draft

**Source**: [GOAL-multi-agent-voice](../goals/GOAL-multi-agent-voice.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## User Story

As a premium user, I want to choose between two distinct AI voice advisors — Levi (calm, wise, mentoring) and Eve (direct, bold, modern) — each with independent conversation history, so that I can engage with the persona that resonates with my mood or context.

## Acceptance Criteria

- [ ] Dashboard shows two side-by-side agent tiles (Levi + Eve) with distinct visuals and microcopy
- [ ] Starting a session with one agent does not affect the other agent's conversation history
- [ ] Session continuation loads the correct agent-specific history
- [ ] Both agents are gated behind Premium tier
- [ ] Levi remains fully functional after the multi-agent refactor (zero regression)

## Related Artifacts

- Requirements: [REQ-F-eve-voice-agent](../requirements/REQ-F-eve-voice-agent.md), [REQ-F-agent-dashboard-selection](../requirements/REQ-F-agent-dashboard-selection.md), [REQ-F-agent-conversation-persistence](../requirements/REQ-F-agent-conversation-persistence.md), [REQ-F-agent-architecture-refactor](../requirements/REQ-F-agent-architecture-refactor.md)

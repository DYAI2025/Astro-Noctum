# REQ-F-eve-voice-agent: Second ElevenLabs Voice Agent (Eve)

**Type**: Functional

**Status**: Implemented

**Priority**: Must-have

**Source**: [GOAL-multi-agent-voice](../goals/GOAL-multi-agent-voice.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## Description

The system must support a second ElevenLabs voice agent named Eve, configured with her own Agent ID (`VITE_ELEVENLABS_EVE_AGENT_ID`). Eve shares the same astrological data (user profile, astro_profiles, fusion data) as Levi but uses a distinct persona prompt: direct, bold, modern, slightly provocative — never vulgar or aggressive.

Both agents receive identical chart context via the `/api/profile/:userId` endpoint (or its multi-agent successor). The agent type is passed as a query parameter or path segment so the server can return agent-specific conversation history.

## Acceptance Criteria

- Given a configured Eve Agent ID, when the user opens Eve's floating widget, then ElevenLabs loads the Eve agent (not Levi)
- Given Eve is active, when the server provides chart context, then it contains the same astrological data as Levi's context
- Given Eve and Levi are both configured, when one agent is started, then the other agent's state is not affected
- Given no Eve Agent ID is configured (`VITE_ELEVENLABS_EVE_AGENT_ID` missing), when the dashboard renders, then the Eve tile shows a "coming soon" state instead of crashing

## Related Assumptions

- [ASM-elevenlabs-multi-agent](../assumptions/ASM-elevenlabs-multi-agent.md) — ElevenLabs supports multiple agents per account

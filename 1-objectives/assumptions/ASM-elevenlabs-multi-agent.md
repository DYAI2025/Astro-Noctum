# ASM-elevenlabs-multi-agent: ElevenLabs Supports Multiple Parallel Agent IDs

**Category**: Technology

**Status**: Verified

**Risk if wrong**: High — If ElevenLabs limits accounts to a single agent, Eve cannot be deployed as a separate voice agent. Fallback would require a second ElevenLabs account or using prompt-switching on a single agent (degraded UX).

## Statement

ElevenLabs allows a single account/project to configure and run multiple independent voice agents, each with their own Agent ID, system prompt, and voice model. Both agents can be embedded on the same page simultaneously without conflicts.

## Rationale

The existing Levi integration uses a single Agent ID. The feature request specifies a separate Eve Agent ID. ElevenLabs documentation suggests multi-agent support exists, but this has not been tested in the Bazodiac account.

## Verification Plan

1. Log into the ElevenLabs dashboard and check whether a second agent can be created alongside the existing Levi agent
2. Create a test Eve agent with a placeholder prompt
3. Embed both `<elevenlabs-convai>` widgets on a test page with different `agent-id` attributes and verify both load independently
4. Confirm the provided Eve Agent ID is valid and functional

## Related Artifacts

- [GOAL-multi-agent-voice](../goals/GOAL-multi-agent-voice.md)
- [REQ-F-eve-voice-agent](../requirements/REQ-F-eve-voice-agent.md)

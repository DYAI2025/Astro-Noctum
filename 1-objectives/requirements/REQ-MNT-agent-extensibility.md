# REQ-MNT-agent-extensibility: Multi-Agent Architecture Extensibility

**Type**: Maintainability

**Status**: Draft

**Priority**: Should-have

**Source**: [GOAL-multi-agent-voice](../goals/GOAL-multi-agent-voice.md)

**Source stakeholder**: [STK-founder](../stakeholders.md)

## Description

The multi-agent architecture must be designed so that adding a third voice agent requires only configuration changes (new `AgentConfig` entry + ElevenLabs Agent ID) and no structural code changes. Eve must not be implemented as a Levi fork or special-case hack.

## Acceptance Criteria

- Given a hypothetical third agent config is added, when the app renders, then a third tile and floating widget appear without new component files
- Given the `agent_conversations` table schema, when a third `agent_type` value is inserted, then read/write queries work without migration
- Given the server's profile endpoint, when called with `?agent=third`, then it returns the correct agent-specific context without code changes

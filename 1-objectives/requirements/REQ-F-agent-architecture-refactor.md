# REQ-F-agent-architecture-refactor: Refactor Levi-Specific Code to Generic Multi-Agent Architecture

**Type**: Functional

**Status**: Implemented

**Priority**: Must-have

**Source**: [GOAL-multi-agent-voice](../goals/GOAL-multi-agent-voice.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## Description

The existing Levi-specific frontend components (`DashboardLeviSection`, `LeviFloatingWidget`, `LeviOrb`) and server endpoints (`/api/agent/*`, `/api/profile/:userId`) must be refactored into a generic multi-agent system where the agent type is a configuration parameter, not hardcoded.

The refactored architecture must:
- Use an `AgentConfig` type defining `id`, `name`, `agentId`, `persona`, `color`, `icon`
- Provide a shared `AgentProvider` context replacing the current Levi-specific state
- Support a per-agent floating widget managed by agent type
- Keep the server's ElevenLabs tool endpoints agent-aware (read/write by `agent_type`)

The visible product UI remains two fixed agent sections — the refactor is internal, not a generic agent gallery.

## Acceptance Criteria

- Given the refactored codebase, when searching for hardcoded Levi Agent ID references outside of config, then zero matches are found
- Given an `AgentConfig` for Eve is added to the config, when the app renders, then Eve's tile and floating widget work without additional component creation
- Given Levi's existing functionality (call, hang up, conversation save, session resume), when tested after refactor, then all features work identically (zero regression)
- Given the server's `/api/profile/:userId` endpoint, when called with `?agent=eve`, then it returns Eve-specific conversation context
- Given the `DashboardLeviSection` component, when replaced by a generic `AgentSection` component, then both Levi and Eve render correctly from config

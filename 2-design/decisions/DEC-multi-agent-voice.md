# DEC-multi-agent-voice: Config-Driven Multi-Agent Voice Architecture

**Status**: Active

**Date**: 2026-03-27

**Trigger**: When adding new voice agents, modifying agent-specific UI, or changing conversation persistence.

## Decision

Voice agents (Levi, Eve, and any future agents) are implemented via a **config-driven architecture** where each agent is defined by an `AgentConfig` object. No agent-specific components exist — all rendering and behavior is derived from configuration.

## Key Points

1. **`AGENTS` array** in `@bazodiac/shared` defines all agents. Adding a new agent = adding a config entry + ElevenLabs Agent ID.
2. **`AgentProvider`** context replaces all Levi-specific state (`leviActive`, `leviUpgrading`, etc.) with generic `activeAgent`, `agentState` keyed by `AgentId`.
3. **`AgentSection`** component replaces `DashboardLeviSection` — renders from config, one instance per agent.
4. **`AgentFloatingWidget`** manages one floating ElevenLabs widget per agent, keyed by `agent.id`.
5. **`agent_conversations.agent_type`** column partitions conversation history — agents never see each other's sessions.
6. **Server endpoints** accept `agent_type` parameter — profile endpoint filters history, save endpoint writes with type.
7. **Dashboard layout**: two fixed side-by-side tiles (not a generic gallery). The product decision is two agents; the architecture decision is config-driven extensibility.
8. **Eve's env var**: `VITE_ELEVENLABS_EVE_AGENT_ID`. If missing, Eve tile shows "coming soon" state.

## Rationale

The feature request explicitly warns against implementing Eve as a Levi fork or special-case hack. A config-driven approach satisfies both the product goal (two fixed agents) and the technical goal (no hardcoded one-agent assumptions). The `agent_type` column with a check constraint prevents invalid values while supporting schema-level evolution.

## Constraints

- Agent type values are restricted to `('levi', 'eve')` via DB check constraint. Adding a third agent requires a migration to update the constraint.
- Both agents are premium-only — no free trial mode.
- Eve's persona prompt requires brand-safety review before production deployment.

## References

- [GOAL-multi-agent-voice](../../1-objectives/goals/GOAL-multi-agent-voice.md)
- [REQ-F-agent-architecture-refactor](../../1-objectives/requirements/REQ-F-agent-architecture-refactor.md)
- [REQ-MNT-agent-extensibility](../../1-objectives/requirements/REQ-MNT-agent-extensibility.md)
- [Feature request spec](../../docs/plans/feature_request_eve_multi_agent_voice_architecture.md)

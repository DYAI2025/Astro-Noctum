# REQ-F-agent-conversation-persistence: Agent-Specific Conversation Persistence

**Type**: Functional

**Status**: Implemented

**Priority**: Must-have

**Source**: [GOAL-multi-agent-voice](../goals/GOAL-multi-agent-voice.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## Description

Conversation summaries and session state must be stored per agent per user. The existing `agent_conversations` table (or its successor) must include an `agent_type` column (e.g. `'levi'` | `'eve'`) to partition histories. Server read and write paths must filter by `(user_id, agent_type)`.

When a user reopens an agent, the system loads only that agent's conversation history for session continuation. Histories must never be merged, overwritten, or cross-contaminated between agents.

## Acceptance Criteria

- Given user U has previous conversations with Levi, when U opens Eve for the first time, then Eve starts with no prior history (fresh session)
- Given user U has conversations with both agents, when U reopens Levi, then only Levi's summaries are loaded
- Given the save-conversation endpoint receives a summary, when the request includes `agent_type: 'eve'`, then the summary is stored as Eve-specific and does not overwrite Levi data
- Given the profile endpoint is called with `agent_type: 'levi'`, when returning conversation context, then only Levi summaries are included in the response
- Given a Supabase query for conversations, when filtering by `user_id` alone (without `agent_type`), then both agents' histories are returned (for admin/debug purposes)

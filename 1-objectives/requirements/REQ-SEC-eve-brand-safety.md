# REQ-SEC-eve-brand-safety: Eve Persona Brand Safety Guardrails

**Type**: Security

**Status**: Draft

**Priority**: Must-have

**Source**: [GOAL-multi-agent-voice](../goals/GOAL-multi-agent-voice.md)

**Source stakeholder**: [STK-founder](../stakeholders.md)

## Description

Eve's persona must be clearly distinguishable from Levi (direct, bold, modern, slightly provocative) while remaining brand-safe. The ElevenLabs system prompt for Eve must be reviewed for brand fit before production deployment.

Prohibited in Eve's output: vulgar language as default mode, sexual objectification, aggressive boundary violations, demeaning address, chaotically inconsistent persona.

Permitted: directness, pointed humor, light provocation, tension, modern tone — targeting users who prefer Co-Star-style directness over Levi's calm mentoring.

## Acceptance Criteria

- Given Eve's system prompt, when reviewed against brand guidelines, then it contains no prohibited language patterns (vulgar, demeaning, sexually explicit)
- Given a test conversation with Eve, when the user asks a provocative question, then Eve responds with pointed directness without crossing into vulgarity
- Given a side-by-side comparison, when listening to Levi and Eve on the same topic, then their personas are immediately distinguishable
- Given Eve's prompt is updated, when deployed, then a brand-safety review log entry is created documenting the reviewer and date

# DEC-aphorism-batch-approval-bp-2026-05-14 — History

## Alternatives considered

### Alternative 1: Keep CON-aphorisms-human-approved as written (per-file approval only)
- Pro: maximum operator gating, no risk of agent-driven auto-approve.
- Con: bottleneck is the edit step, not verification; friction discourages batch additions.
- Decision: rejected — operator verification happens out of band; per-file edit adds no extra check.

### Alternative 2: Auto-approve all aphorisms the agent generates
- Pro: zero operator friction.
- Con: removes the operator-only approval principle entirely; opens path to LLM-generated content silently entering the pool.
- Decision: rejected — preserves the principle that only Ben grants approval.

### Alternative 3: Plan-encoded batch approval (chosen)
- Pro: keeps operator as approver; eliminates per-file edit; auditable via plan file + commit history.
- Con: requires the agent to faithfully scope `status: approved` to the enumerated IDs only.
- Decision: accepted — codified as DEC-aphorism-batch-approval-bp-2026-05-14.

## Changelog

- 2026-05-14: Decision recorded. CON-aphorisms-human-approved marked Deprecated in the same commit.

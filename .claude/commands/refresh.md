---
description: Refresh the bundled ClaudeMap graph for the current project after local code changes.
argument-hint: '[project-root]'
disable-model-invocation: true
---

Use the bundled ClaudeMap refresh command to update the graph for the current working directory.

Steps:
1. Treat the current working directory as the target project root unless the user gave a different path.
2. Resolve the bundled command script at `.claude/skills/claudemap-runtime/skill/commands/refresh.js`.
3. Run the refresh command with Node for the target project root.
4. Report added, removed, and changed file counts plus the refresh mode and scoped map refresh summary.
5. Preserve any cached Claude-authored graph unless the user explicitly asks for a force refresh.
6. Scoped maps are refreshed change-aware: maps whose files did not change keep their architect-authored graph, maps whose files did change are rebuilt from the root graph filter and flagged `needsRebuild` so the next `/create-map` pass can rerun the architect for them.

## Flags

- `--force-refresh`
- `--no-render`
- `--stdio-mcp`
- `--enrichment-file` (string)

---
description: Open the bundled ClaudeMap app for the current project without rebuilding the graph.
disable-model-invocation: true
---

Use the bundled ClaudeMap open command to bring up the existing map runtime.

Steps:
1. Resolve the bundled command script at `.claude/skills/claudemap-runtime/skill/commands/open-claudemap.js`.
2. Run the open command with Node.
3. If a graph is already loaded, report the repo name, graph source, system count, and file count.
4. If no graph is loaded yet, tell the user to run `/setup-claudemap` first.
5. Report whether the app server was reused, started, or still unavailable.

## Flags

- `--open-browser`
- `--start-app`

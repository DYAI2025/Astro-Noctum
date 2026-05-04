---
description: Build a detailed architecture map for the current repository and open it in ClaudeMap.
argument-hint: '[project-root]'
---

Set up ClaudeMap for the target repository.

High-level goal:

- snapshot the repository
- ask the bundled `@claudemap-architect` subagent to build a detailed graph with intuitive human grouping
- render that graph in the ClaudeMap UI

Generated runtime graphs are written into `.claude/skills/claudemap-runtime/app/public/graph/` (served by the bundled app as `/graph/*`). Do not drop graph files anywhere else under `claudemap-runtime/` - the `graph/` subdirectory is the one canonical home for runtime graph outputs.

Steps:
1. Treat the current working directory as the target project root unless the user gave a different path.
2. Resolve the bundled snapshot script at `.claude/skills/claudemap-runtime/skill/commands/snapshot.js`.
3. Run the snapshot script and capture the repo snapshot JSON.
4. Read `.claude/skills/claudemap-runtime/skill/prompts/enrichment.txt`.
5. Use the `@claudemap-architect` subagent explicitly and provide:
   - the snapshot JSON
   - the enrichment contract
   - instructions to return only valid graph JSON
   - instructions to optimize for detailed systems, useful file/function depth, and human-intuitive grouping
6. **Wait for the `@claudemap-architect` Task call to fully return**, then save the returned JSON to `.claude/skills/claudemap-runtime/tmp/claudemap-enrichment.json`. **Do not run the setup JS command until after this file exists with non-empty valid graph JSON.** Do not launch setup in parallel with the subagent call.
7. Run `.claude/skills/claudemap-runtime/skill/commands/setup-claudemap.js` with `--enrichment-file` pointing to that JSON file. The setup command is strict: it will exit non-zero if the file is missing, empty, or unparseable, and it will not fall back to a heuristic graph. If that happens, fix the architect output first and rerun - do not rerun setup without `--enrichment-file`.
8. Add `--force-refresh` only when the user explicitly asks for a full rebuild.
9. If the subagent cannot produce valid JSON after two attempts, stop and tell the user the architect pass failed. Do not silently retry setup without the enrichment file - that would render a heuristic graph and pollute the cache.
10. Report the analyzed file count, system count, graph source, render transport, and app readiness.
11. End with a short feedback prompt after the graph opens, for example: `Does this map look right, or should I refine it?`
12. If the user says the map is good, stop there.
13. If the user asks for refinement, reuse the current root cache graph from `claudemap-cache.json` as context, send that graph plus the requested changes back through `@claudemap-architect`, **wait for that Task call to fully return**, save the refined JSON to the same `tmp/claudemap-enrichment.json` path, and only then run `.claude/skills/claudemap-runtime/skill/commands/refresh.js` with `--enrichment-file` instead of telling the user to rerun setup from scratch. The refresh command applies the same strict enrichment validation as setup.
14. After the refined graph renders, ask the same short feedback prompt again.

## Flags

- `--force-refresh`
- `--no-render`
- `--start-app`
- `--open-browser`
- `--stdio-mcp`
- `--enrichment-file` (string)

---
description: Create or refresh a scoped ClaudeMap for a major subsystem and switch to it.
argument-hint: '{"scope":{"rootSystemId":"...","rootSystemLabel":"...","ancestorPath":["..."]},"label":"...","summary":"..."} | <natural language scope description>'
---

Use the bundled ClaudeMap scoped-map command. Scoped maps are first-class architect views, not raw filters of the root graph.

Workflow:
1. Treat the current working directory as the target project root unless the user gave a different path.
2. Resolve the scope from the user's argument. If it is the JSON payload copied from ClaudeMap's "Create map?" affordance, use it as-is. If it is a natural language request (e.g. "map the auth system"), inspect the current root runtime graph at `.claude/skills/claudemap-runtime/app/public/graph/claudemap-runtime.json` and pick the best matching system node, then synthesize a scope payload with `rootSystemId`, `rootSystemLabel`, and `ancestorPath`.
3. Read `.claude/skills/claudemap-runtime/skill/prompts/scoped-enrichment.txt`. This is the dedicated scoped prompt - do not reuse the root enrichment prompt.
4. Build a scoped snapshot payload for `@claudemap-architect` containing: the repo/branch meta, the scope block, the filtered file list for that subsystem (pulled from the root graph), and - if the target map already has a cached scoped graph - include its graph as `priorGraph` so the architect can refine rather than rebuild. Include any user-provided refinement instructions under `instructions`.
5. Call `@claudemap-architect` with the scoped prompt + payload. Tell it to return valid graph JSON only, to emit richer internal subsystems (2-6) and edges than the root graph, and to decide on its own whether to edit the prior graph in place or rebuild based on the intent of the request.
6. **Wait for the `@claudemap-architect` Task call to fully return**, then save the returned JSON to `.claude/skills/claudemap-runtime/tmp/claudemap-enrichment.json`. Do not run create-map until that file contains valid graph JSON.
7. Run `.claude/skills/claudemap-runtime/skill/commands/create-map.js` with Node and pass the scope payload through `--scope-json`, the refinement instructions (if any) through `--instructions`, and the enrichment file through `--enrichment-file`. The command deletes the tmp file after it reads it.
8. Report the created or updated map id, label, scope root, graph source, and resulting active map id. If the graph source is not `claude-scoped`, warn the user that the scoped map is a filtered fallback view and suggest rerunning with architect enrichment.
9. If the payload is missing or invalid, ask the user to click "Create map?" in ClaudeMap again and paste the copied command, or describe the subsystem they want scoped.
10. End with a short feedback prompt after the scoped map renders, for example: `Does this map look right, or should I refine it?`
11. If the user says the map is good, stop there.
12. If the user asks for refinement, reuse the scoped map's cache graph (the `cachePath` for that map in the target project's repo-root `claudemap-maps.json`) as `priorGraph` in the architect payload, pass the refinement instructions through `instructions`, save the architect's response to `.claude/skills/claudemap-runtime/tmp/claudemap-enrichment.json`, and rerun `create-map.js` with the same `--scope-json` payload plus `--enrichment-file` and `--instructions` so the scoped graph iterates in place for the same map entry.
13. After the refined graph renders, ask the same short feedback prompt again.

## Flags

- `--scope-json` (string)
- `--map-id` (string)
- `--no-activate`
- `--stdio-mcp`
- `--enrichment-file` (string)
- `--instructions` (string)

# ClaudeMap Navigation

## Quick Start

1. Run `setup-claudemap`
2. Ask the assistant to explain a system, file, or flow
3. Run `refresh` after edits

## Public Commands

Use these first:

- `/setup-claudemap`: build a detailed architecture map for the current project
- `/open-claudemap`: reopen the existing map UI without rebuilding the graph
- `/create-map`: create or refresh a scoped subsystem map from the current root graph
- `/refresh`: refresh the current graph after code changes
- `/explain`: run a guided walkthrough against the live graph
- `/show`: direct the live map for focus, highlights, presentation, health, and flow

## Mental Model

ClaudeMap works in three stages:

1. Snapshot the repository
2. Ask `claudemap-architect` for a detailed, human-intuitive graph
3. Render and control that graph in the bundled UI

## Internal Runtime Layout

- `.claude/skills/claudemap-runtime/SKILL.md`: internal runtime skill definition
- `.claude/skills/claudemap-runtime/skill/commands/`: Node command entrypoints
- `.claude/skills/claudemap-runtime/skill/lib/`: shared runtime libraries
- `.claude/skills/claudemap-runtime/skill/prompts/`: enrichment prompt assets
- `.claude/skills/claudemap-runtime/app/`: bundled map app
- `.claude/agents/claudemap-architect.md`: bundled architecture-mapping subagent

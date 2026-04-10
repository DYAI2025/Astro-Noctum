# DEC-narrative-engine-hybrid: Hybrid Narrative Engine (Templates Free, Gemini Premium)

**Status**: Active

**Category**: Architecture

**Scope**: backend, frontend

**Source**: n/a

**Last updated**: 2026-04-10

## Context

Partnership synastry narratives require text generation. The choice between fixed templates and AI-generated text maps directly to the Free/Premium tier split: templates are deterministic and cost-free; Gemini generation adds depth and personalisation but has API cost.

## Decision

Use a **hybrid narrative engine**:
- **Free tier**: fixed German template strings with variable substitution (planet names, aspect types, sign placements)
- **Premium tier**: Gemini-generated narratives using synastry data as context, German output, with template fallback on API failure

## Enforcement

### Trigger conditions

- **Code phase**: when implementing synastry narrative generation endpoints or client rendering
- **Code phase**: when adding any new narrative surface (composite chart, transit narratives)

### Required patterns

- Template strings live in `src/i18n/` or a dedicated `src/lib/synastry/templates/` module
- Gemini calls are server-side only (never client-side); use `server.mjs` or a dedicated endpoint
- Always implement template fallback for Gemini paths — on API failure, return the template string, never an empty narrative
- Clearly differentiate template vs. Gemini output in the response schema (e.g., `narrative_source: 'template' | 'gemini'`)
- Free users receive template narratives; premium users receive Gemini narratives (with template fallback)

### Prohibited patterns

- Calling Gemini from the browser (exposes API key)
- Returning empty or null narratives — always fall back to template
- Using Gemini for free-tier narratives
- Generating English narratives — output is always German

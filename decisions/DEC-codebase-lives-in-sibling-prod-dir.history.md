# DEC-codebase-lives-in-sibling-prod-dir: Trail

> Companion to `DEC-codebase-lives-in-sibling-prod-dir.md`.
> AI agents read this only when evaluating whether the decision is still
> valid or when proposing a change or supersession.

## Alternatives considered

### Option A: SDLC scaffold as documentation/governance overlay (chosen)

- Pros: respects existing code organization in `Astro-Noctum-prod/`; honors CON-no-formula-changes / CON-no-signatur-v3-rebuild / CON-stripe-payment-stack constraints; minimal change to the live codebase; the SDLC overlay can be peeled off without disturbing the runtime project.
- Cons: explicit deviation from the SDLC scaffold's default model where `3-code/` contains the actual code; requires future agents to read this decision before assuming `3-code/` is the canonical source location.

### Option B: Migrate the entire `Astro-Noctum-prod/` codebase into `3-code/<component>/`

- Pros: full alignment with the SDLC scaffold's default model; no per-project deviation.
- Cons: massive restructure; conflicts with the frozen-subsystem constraints (path changes touch FS-1 engine, FS-2 renderer, FS-3 Stripe stack); likely breaks the existing Vercel deploy targets; weeks of operational work for zero user-visible value.

### Option C: Symlink files from `Astro-Noctum-prod/` into `3-code/<component>/`

- Pros: technically resolves both rules.
- Cons: brittle (broken on Windows, on different worktrees, in CI); confusing for tooling (TypeScript path resolution, ESLint, build tools); duplicates the cognitive surface.

## Reasoning

The SDLC scaffold was introduced on an established codebase. The honest model is "overlay, not container." Option A names that honestly and edits the Component Isolation rule to match reality. Option B would have been correct for a greenfield project but is disproportionately expensive here. Option C trades clean structure for tool-fragility.

Trade-off accepted: the project is non-standard in how it uses the SDLC scaffold. Future agents must read this decision to understand the project shape.

Invalidating conditions: a consolidation effort eventually moves the runtime code into the scaffold (e.g., during a future major restructure). At that point this decision should be deprecated.

## Human involvement

**Type**: ai-proposed/human-approved

**Notes**: Ben approved during TASK-0-1 preparation on 2026-05-14, after constraint-tension was surfaced during `/SDLC-execute-next-task` preflight.

## Changelog

| Date | Change | Involvement |
|------|--------|-------------|
| 2026-05-14 | Initial decision | ai-proposed/human-approved |

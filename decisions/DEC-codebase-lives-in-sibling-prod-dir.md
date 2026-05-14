# DEC-codebase-lives-in-sibling-prod-dir: Runtime source code lives in sibling `Astro-Noctum-prod/` directory

**Status**: Active

**Category**: Convention

**Scope**: system-wide

**Source**: [CON-no-formula-changes](../1-spec/constraints/CON-no-formula-changes.md), [CON-no-signatur-v3-rebuild](../1-spec/constraints/CON-no-signatur-v3-rebuild.md), [CON-stripe-payment-stack](../1-spec/constraints/CON-stripe-payment-stack.md)

**Last updated**: 2026-05-14

## Context

This SDLC scaffold (`Bazodiac-WebApp/Astro-Noctum/`) is a documentation and governance overlay for the existing Astro-Noctum web application. The runtime source code, build configuration, dependencies, and deployable artifacts live in a sibling directory `Bazodiac-WebApp/Astro-Noctum-prod/`, established before this scaffold was overlaid on the project.

The frozen-subsystem constraints (CON-no-formula-changes, CON-no-signatur-v3-rebuild, CON-stripe-payment-stack) make a wholesale move of the runtime code into this scaffold's `3-code/<component>/` subdirectories disproportionately expensive and risky relative to the value gained. The architecture document (`2-design/architecture.md`) and component definitions reference paths in `Astro-Noctum-prod/src/...` as appropriate.

Without a formal record, the Component Isolation rule in `3-code/CLAUDE.code.md` ("All source code … must reside within that component's directory") and the reality of code living in `Astro-Noctum-prod/` are in direct tension. This decision resolves that tension explicitly.

## Decision

This SDLC scaffold is a **documentation and governance overlay** on the existing Astro-Noctum codebase. Runtime source code, build configuration, and dependencies for the six components remain in `/Users/benjaminpoersch/Projects/codeba se/Bazodiac-WebApp/Astro-Noctum-prod/`. The `3-code/<component>/` directories under this scaffold hold:

- `CLAUDE.component.md` — component governance file (always).
- Component-specific documentation or new SDLC-introduced artifacts (e.g., implementation notes, migration designs for `database/`, content-vault indexes for `tagespuls-package/`).
- Optionally: new code or scripts that this SDLC scaffold introduces and that do not yet have a home in `Astro-Noctum-prod/`. When such code is later integrated into the runtime project, it migrates to `Astro-Noctum-prod/`.

The Component Isolation rule in `3-code/CLAUDE.code.md` is scoped accordingly: it applies to **new** artifacts that this SDLC governs. The pre-existing `Astro-Noctum-prod/` codebase is the canonical runtime location for the six components.

## Enforcement

### Trigger conditions

- **Specification phase**: when a requirement references a specific file path — confirm whether the path is in `Astro-Noctum-prod/` (existing code) or `3-code/<component>/` (new SDLC artifact).
- **Design phase**: when a design document references file paths — they refer to `Astro-Noctum-prod/` for runtime code unless explicitly noted otherwise.
- **Code phase**: when implementing a task — edit files in `Astro-Noctum-prod/` for runtime code changes; only create files under `3-code/<component>/` for new SDLC-governed artifacts (decisions, component notes, migration drafts before they land in `supabase/migrations/`).
- **Deploy phase**: deploy pipelines reference `Astro-Noctum-prod/` as the build context.

### Required patterns

- Component governance files (`CLAUDE.component.md`) live under `3-code/<component>/`.
- Runtime source, tests, package manifests, lockfiles live under `Astro-Noctum-prod/`.
- Cross-references in design and component docs use full paths from `Astro-Noctum-prod/` (e.g., `src/components/Dashboard.tsx`).

### Required checks

1. When adding new code, decide first whether it is a runtime artifact (→ `Astro-Noctum-prod/`) or an SDLC-overlay artifact (→ `3-code/<component>/`).
2. When reading the Component Isolation rule, interpret it as scoped to SDLC-introduced artifacts.

### Prohibited patterns

- Treating the Component Isolation rule as forbidding `Astro-Noctum-prod/` to hold runtime code.
- Duplicating files between `3-code/<component>/` and `Astro-Noctum-prod/`.
- Creating symlinks between the two directories — confusing and brittle.

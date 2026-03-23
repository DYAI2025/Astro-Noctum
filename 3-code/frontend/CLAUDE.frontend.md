Component-specific instructions for the **frontend**. Extends [../CLAUDE.code.md](../CLAUDE.code.md).

## Code Location

All frontend source code lives in [`../../src/`](../../src/).
For code conventions, build commands, and dev setup see [`../../CLAUDE.md`](../../CLAUDE.md).

## Scope

React 19 SPA with Tailwind CSS v4, Framer Motion, Three.js (Fusion Ring).
Includes: components, pages, hooks, contexts, services, i18n, Storybook.

## Relevant Decisions

| File | Title | Trigger |
|------|-------|---------|
| [DEC-supabase-backend](../../2-design/decisions/DEC-supabase-backend.md) | Supabase as sole backend data layer | When writing data access code |
| [DEC-swiss-ephemeris](../../2-design/decisions/DEC-swiss-ephemeris.md) | Swiss Ephemeris via BAFE | When consuming or transforming chart data |
| [DEC-wuxing-ui-mapping](../../2-design/decisions/DEC-wuxing-ui-mapping.md) | Wu-Xing elements drive UI physics | When writing components with element-specific styling |

## Addressed Requirements

| Requirement | Status |
|-------------|--------|
<!-- Add rows as tasks are completed. Requirement column: [REQ-CLASS-kebab-name](../../1-objectives/requirements/REQ-CLASS-kebab-name.md) -->

Component-specific instructions for the **api-server**. Extends [../CLAUDE.code.md](../CLAUDE.code.md).

## Code Location

All API server source code lives in [`../../server/`](../../server/).
For code conventions, build commands, and dev setup see [`../../CLAUDE.md`](../../CLAUDE.md).

## Scope

Express.js API routes, Stripe payment webhooks, Supabase client, Gemini AI narrative generation, ElevenLabs voice agent integration.

## Relevant Decisions

| File | Title | Trigger |
|------|-------|---------|
| [DEC-supabase-backend](../../2-design/decisions/DEC-supabase-backend.md) | Supabase as sole backend data layer | When writing data access or auth code |
| [DEC-swiss-ephemeris](../../2-design/decisions/DEC-swiss-ephemeris.md) | Swiss Ephemeris via BAFE | When adding or modifying BAFE proxy routes |

## Addressed Requirements

| Requirement | Status |
|-------------|--------|
<!-- Add rows as tasks are completed. Requirement column: [REQ-CLASS-kebab-name](../../1-objectives/requirements/REQ-CLASS-kebab-name.md) -->

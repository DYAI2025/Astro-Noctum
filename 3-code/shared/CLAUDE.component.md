Component-specific instructions for **shared**. Extends [../CLAUDE.code.md](../CLAUDE.code.md).

# Shared Library (`@bazodiac/shared`)

**Responsibility**: Single source of truth for cross-component logic — signal math, quiz definitions and scoring, fusion-ring + signatur engine math, agent configs, experience/transit/weekly schemas, and i18n keys. Consumed by both `frontend` (web SPA) and `mobile` (Expo). No DOM, no React, no native APIs — pure TypeScript with Zod runtime validation.

**Technology**: TypeScript (ESM), Zod 4.3 (runtime schemas), Vitest (tests). Build is on-the-fly via Vite/tsx for consumers — no compiled artifact. Workspace package with own `package.json`, `tsconfig.json`, and `vitest.config.ts`.

## Code Location

All shared source lives in [`../../packages/shared/`](../../packages/shared/).
Sub-modules under `packages/shared/src/`:

| Sub-module | Scope |
|------------|-------|
| `agents/` | `AGENTS` config array (Levi, Eve) — drives multi-agent voice UI |
| `api/` | Mobile-bootstrap schema (`mobile-bootstrap.ts`) |
| `experience/` | Experience-API schemas (`DailyResponseSchema`, `SignatureDeltaResponseSchema`) |
| `fusion-bazi/` | Soulprint sector helpers |
| `fusion-ring/` | Ring-projection math, constants, signal blending |
| `i18n/` | Translation keys (DE/EN) |
| `quizzes/` | `QuizDefinition` types, `scoreQuiz()` engine, definition fixtures, generator scripts |
| `signatur/` | Signatur engine math (`bazodiac-engine.ts` — TS port of master signal), dimension defs, signatur bridge, Swift constants reference |
| `transit/` | Transit-state types |
| `weekly/` | Life-area mapping for Weekly Insights |

54 TypeScript modules, 5 test files (under `__tests__/`).

## Interfaces

- **TypeScript module API → `frontend`**: Imported via Vite path alias / workspace dep `"@bazodiac/shared"` (currently 13+ importer files across `src/`). Re-exports through `packages/shared/src/index.ts`.
- **TypeScript module API → `mobile`**: Imported via `"file:../../packages/shared"` workspace dep in `apps/mobile/package.json`. Same import surface as web.
- **Indirectly consumed by `api-server`**: `server.mjs` does NOT import the TS package directly (Node mjs, no TS runtime), but mirrors several schemas (e.g., synastry templates JS-port at `server.mjs:751+`). Drift between shared TS and server JS is a known maintenance hazard tracked in `DEC-narrative-engine-hybrid`.
- **No outbound network/IO**: Pure functions only. Zod schemas validate inputs from API responses inside consumers, not inside shared.

## Requirements Addressed

| File | Type | Priority | Summary |
|------|------|----------|---------|
| [REQ-F-agent-architecture-refactor](../../1-objectives/requirements/REQ-F-agent-architecture-refactor.md) | REQ-F | Must | Generic multi-agent UI driven by `AGENTS` array in `shared/src/agents/` |
| [REQ-MNT-agent-extensibility](../../1-objectives/requirements/REQ-MNT-agent-extensibility.md) | REQ-MNT | Must | Adding agent = 1 `AgentConfig` entry + 1 env var + 1 DB migration; zero component changes |
| [REQ-F-i18n-completeness](../../1-objectives/requirements/REQ-F-i18n-completeness.md) | REQ-F | Must | Translation keys (DE/EN) in `shared/src/i18n/` |
| [REQ-F-signatur-shared-bridge](../../1-objectives/requirements/REQ-F-signatur-shared-bridge.md) | REQ-F | Must | Cross-platform signatur math in `shared/src/signatur/` |
| [REQ-F-quiz-generator-pipeline](../../1-objectives/requirements/REQ-F-quiz-generator-pipeline.md) | REQ-F | Must | `QuizDefinition` + `scoreQuiz()` + generators in `shared/src/quizzes/` |
| [REQ-F-quiz-answer-element-contrib](../../1-objectives/requirements/REQ-F-quiz-answer-element-contrib.md) | REQ-F | Must | `elementContrib[5]` + `sectorContrib[12]` on `AnswerOption` type (Sprint B) |
| [REQ-F-quiz-append-only](../../1-objectives/requirements/REQ-F-quiz-append-only.md) | REQ-F | Must | Quiz answer schemas (Sprint B) — DB persistence in `api-server`, types here |
| [REQ-F-experience-daily-v2](../../1-objectives/requirements/REQ-F-experience-daily-v2.md) | REQ-F | Must | `DailyResponseSchema` v2 in `shared/src/experience/schemas.ts` |

## Relevant Decisions

| File | Title | Trigger |
|------|-------|---------|
| [DEC-multi-agent-voice](../../2-design/decisions/DEC-multi-agent-voice.md) | Config-driven multi-agent voice | When adding/modifying entries in `AGENTS` array |
| [DEC-quiz-data-model-migration](../../2-design/decisions/DEC-quiz-data-model-migration.md) | Hybrid quiz data model (contribution_events + user_quiz_answers + user_quiz_profile) | When changing quiz schemas, scoring, or contribution event shape |
| [DEC-narrative-engine-hybrid](../../2-design/decisions/DEC-narrative-engine-hybrid.md) | Hybrid narrative engine | When extending synastry templates — JS-port mirror in `server.mjs` must stay in sync |
| [DEC-signatur-v3-bipolar-trails](../../2-design/decisions/DEC-signatur-v3-bipolar-trails.md) | Bipolar trail engine | When changing signatur math (`signatur/bazodiac-engine.ts`, `dimension-defs.ts`) |

## Notes

- **No bundling**: shared is consumed as TypeScript source via workspace path. No tsc build step. Consumers' bundlers (Vite for web, Metro for mobile) compile it inline.
- **Server-side drift**: `server.mjs` cannot import TS, so any logic shared between server and clients (e.g., synastry aspect math) is **manually mirrored**. Treat shared TS as authoritative; the JS mirror in `server.mjs` is a maintenance debt to resolve via `DEC-narrative-engine-hybrid` follow-up.
- **Zod schemas live here, validation runs there**: shared exports schemas; `frontend`/`mobile` call `.parse()` on API responses. Keeps shared free of side effects.

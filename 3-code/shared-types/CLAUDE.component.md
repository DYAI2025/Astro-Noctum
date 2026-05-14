# Shared Types

**Responsibility**: TypeScript-only workspace package providing entity, DTO, error-envelope, and analytics-event types shared between `web-frontend`, `web-server`, `edge-functions`, and `tagespuls-package`. No runtime; pure types and constants.

**Technology**: TypeScript. Published as an npm/pnpm workspace package (no compile target; consumers import `.ts` directly or via `tsc --declaration` output, depending on workspace setup chosen during implementation).

## Interfaces

- Imported as a workspace dependency by `web-frontend`, `web-server`, `edge-functions`, `tagespuls-package`.
- No HTTP, no runtime, no side effects.
- Exports include: entity types (`UserAstroProfile`, `DailyPulse`, `DailyInterpretation`, `Aphorism`, `AphorismUsageEvent`, `CosmicWeatherSnapshot`, `ConsentRecord`, `RtbfDeletionJob`, `RtbfAuditLogEntry`, `SubscriptionState`), API DTO shapes (request / response per `api-design.md`), error envelope shape and `error.code` enum, analytics event payload types and event-name enum, Council archetype-key enum, mode-tag enum.

## Notes

- Source of truth for entity shapes is [`2-design/data-model.md`](../../2-design/data-model.md).
- Source of truth for API DTO shapes is [`2-design/api-design.md`](../../2-design/api-design.md).
- Tagespuls-domain types currently defined at `apps/tagespuls_package/packages/voice/src/types.ts` are imported and re-exported here, OR migrated into this package (Code-phase implementation decision).
- This package has **no business logic**. Functions belong in the consuming component; only types, constants, and pure type-level utilities (e.g., `Pick`-derived view types) belong here.

## Requirements Addressed

This component does not directly satisfy any single requirement; it is a structural mechanism that supports type consistency across all other components. Indirect contribution to:

| File | Why |
|------|-----|
| [REQ-COMP-analytics-pii-free](../../1-spec/requirements/REQ-COMP-analytics-pii-free.md) | Single source of truth for the per-event allowed-property allowlist (enforced via TypeScript types at every emit site). |
| [REQ-USA-checkout-error-categories](../../1-spec/requirements/REQ-USA-checkout-error-categories.md) | Single source of truth for the `error.code` enum used by AS-6 client and the server emitting the error. |

## Relevant Decisions

| File | Title | Trigger |
|------|-------|---------|
| [DEC-codebase-lives-in-sibling-prod-dir](../../decisions/DEC-codebase-lives-in-sibling-prod-dir.md) | Runtime code lives in sibling `Astro-Noctum-prod/` directory | When deciding where the shared-types workspace package lives — defaults to `Astro-Noctum-prod/packages/shared-types/` per the overlay model |

# DEC-display-name-db-only: display_name Stored in DB Only — Never Forwarded to FuFirE

**Status**: Active

**Category**: Architecture

**Scope**: system-wide

**Source**: [REQ-F-onboarding-display-name](../../1-objectives/requirements/REQ-F-onboarding-display-name.md)

**Last updated**: 2026-04-09

## Context

Onboarding collects a user-chosen display name alongside birth data. There is an architectural
choice of whether to forward this name to FuFirE (the calculation engine) or keep it exclusively
in the application's database layer.

FuFirE is a deterministic computation engine: it takes birth coordinates and time, and returns
astrological profile data. Introducing display names into FuFirE's input would:

- Couple a UI/presentation field to the calculation contract, making FuFirE schema changes
  necessary for a purely presentational concern
- Pollute the engine's input set with data it has no use for
- Violate the established layer separation: FuFirE = computation, DB = profile/persistence,
  Agent = presentation/interpretation

Without this decision, future implementers might pass `display_name` to FuFirE (e.g., as part
of a general "user profile" payload), which could silently alter the API contract.

## Decision

`display_name` is stored exclusively in `profiles.display_name` (Supabase DB). It is **never**
included in the payload sent to FuFirE or any calculation engine. Agents and UI components read
`display_name` from the DB, not from engine responses.

## Enforcement

### Trigger conditions

- **Design phase**: when designing the onboarding endpoint, any profile-related API contract,
  or any FuFirE request payload
- **Code phase**: when implementing `POST /onboarding`, any function that builds a FuFirE request
  payload, or any component that renders the user's display name

### Required patterns

**Onboarding backend split:**
```ts
// Correct: split into two operations
await save_profile({ user_id, display_name, birth_date, birth_time, birth_place });
await compute_fusion({ birth_date, birth_time, birth_place }); // no display_name
```

**FuFirE request payload must not contain `display_name`:**
```ts
// Correct
const fuFirePayload = { birth_date, birth_time, birth_place };

// Prohibited
const fuFirePayload = { birth_date, birth_time, birth_place, display_name }; // ❌
```

**Agent/UI reads display_name from DB:**
```ts
// Correct
const { display_name } = await supabase.from('profiles').select('display_name').eq('id', userId);

// Prohibited
const display_name = fuFireResponse.display_name; // ❌ — engine never returns this
```

**Schema:**
```sql
-- profiles table
display_name TEXT NOT NULL DEFAULT '' CHECK (char_length(display_name) <= 50)
```

### Required checks

1. Confirm that any function constructing a FuFirE or BAFE payload does not include `display_name`
2. Confirm that Agent tool endpoints (`/api/profile/:userId`) return `display_name` from Supabase, not from an engine response
3. Confirm that `profiles.display_name` is `NOT NULL` — no row can exist without a display name

### Prohibited patterns

- Including `display_name` in any FuFirE, BAFE, or calculation-engine request body
- Deriving or reading `display_name` from an engine response
- Allowing a `profiles` row with `display_name IS NULL`
- Recomputing the FuFirE/BAFE results when a user changes their display name

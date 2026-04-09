# REQ-F-onboarding-display-name: Onboarding Display Name Collection

**Type**: Functional

**Status**: Draft

**Priority**: Must-have

**Source**: [GOAL-autopoietic-ux](../goals/GOAL-autopoietic-ux.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## Description

The onboarding flow collects a user-chosen display name alongside birth data. The display name is
persisted exclusively to `profiles.display_name` in the database and used by the UI layer (Agent
greeting, profile views). It is never forwarded to FuFirE or any calculation engine — the compute
payload contains only `birth_date`, `birth_time`, and `birth_place`.

## Acceptance Criteria

- Given the onboarding birth-input step, when the user submits, then `display_name` (non-empty,
  max 50 characters) is required — form submission is blocked if the field is absent or empty
- Given a valid onboarding submission, when the backend processes it, then `display_name` is saved
  to `profiles.display_name TEXT NOT NULL CHECK (char_length(display_name) <= 50)` and is **not**
  included in the FuFirE compute request payload
- Given the Agent (Levi or Eve), when it greets or references the user by name, then it reads
  `display_name` from `profiles`, not from any FuFirE response
- Given an existing user, when they update their display name, then the change is persisted to
  `profiles.display_name` without triggering a FuFirE recompute
- Given the `profiles` table schema, then a row with `display_name IS NULL` cannot be inserted —
  the column is `NOT NULL` and currently has a default empty string (`DEFAULT ''`); non-empty
  input is enforced by the form/backend validation, not by the database default

## Related Constraints

- Architecture separation: `display_name` is a UI/profile field; FuFirE is a deterministic
  computation engine — mixing them would introduce unnecessary coupling and pollute the engine
  with presentation data. See also: `DEC-display-name-db-only` (to be recorded via `/SDLC-design`).

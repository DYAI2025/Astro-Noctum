# REQ-F-synastry-partner-management: Partner Profile CRUD

**Type**: Functional

**Status**: Implemented

**Priority**: Must-have

**Source**: [US-synastry-partner-management](../user-stories/US-synastry-partner-management.md), [GOAL-synastry-compatibility](../goals/GOAL-synastry-compatibility.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## Description

The system provides a `partner_profiles` table (user_id FK, display_name, birth_date, birth_time, birth_place, birth_lat, birth_lon) with full CRUD operations. All partner profiles are scoped to the authenticated user via RLS. Client-side `deletePartner()` includes a defence-in-depth `.eq('user_id', user.id)` guard in addition to RLS.

## Acceptance Criteria

- Given an authenticated user, when they create a partner profile, then it is stored in `partner_profiles` with their `user_id` FK.
- Given a partner profile deletion request, when processed, then only rows matching both `user_id` and `id` are deleted (double-scoped deletion).
- Given a user viewing their partner profiles, when the list loads, then only their own partner profiles are returned (no cross-user leakage).
- Given a partner profile with associated synastry results, when deleted, then associated results are also removed (cascading delete or equivalent).

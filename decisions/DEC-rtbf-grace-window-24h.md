# DEC-rtbf-grace-window-24h: RTBF deletion-job grace window is 24 hours

**Status**: Active

**Category**: Data

**Scope**: system-wide

**Source**: [REQ-COMP-rtbf](../1-spec/requirements/REQ-COMP-rtbf.md), [REQ-SEC-rtbf-authz](../1-spec/requirements/REQ-SEC-rtbf-authz.md)

**Last updated**: 2026-05-13

## Context

The RTBF (Art. 17 right-to-be-forgotten) state machine specifies a grace window after the user confirms a deletion request, during which they can still cancel. The window duration is a UX / legal trade-off: too short and users who change their mind have no recourse; too long and Art. 17 "without undue delay" pressure mounts. The number "24 hours" is referenced in REQ-SEC-rtbf-authz and the data-model state machine, but the specific value benefits from being an auditable decision rather than a magic number scattered across documents.

## Decision

The RTBF deletion-job grace window is **24 hours**. Between `confirmed_at` and `grace_window_ends_at = confirmed_at + 24h` (UTC) the user may cancel via a one-click link (sent in the original confirmation email) or via authenticated in-app settings. At 24 hours elapsed without cancellation, the scheduler transitions the job from `pending_grace` to `executing` and the deletion cascade begins per REQ-COMP-rtbf. The Art. 17 30-day target window starts from `requested_at` (not from `executed_at`) — the grace window is contained within the 30-day budget.

## Enforcement

### Trigger conditions

- **Specification phase**: when adjusting the RTBF requirement family (REQ-COMP-rtbf, REQ-SEC-rtbf-authz).
- **Design phase**: when modifying the RTBF state machine or the `rtbf_deletion_jobs` schema (per [`data-model.md`](../2-design/data-model.md) §5).
- **Code phase**: when implementing the RTBF state machine or the scheduler that advances `pending_grace → executing`. When drafting RTBF emails (confirmation + cancel link copy must reference the 24-hour window).
- **Deploy phase**: scheduler must run at least every 1 hour to enforce the grace window with sub-hour accuracy.

### Required patterns

- `rtbf_deletion_jobs.grace_window_ends_at` = `confirmed_at + 24 hours` (UTC).
- The scheduler queries `WHERE status = 'pending_grace' AND grace_window_ends_at <= NOW()` and transitions matching rows to `executing`.
- The RTBF email copy explicitly states the 24-hour window in the user-visible text, locale-aware.
- The cancel link returns `200` while `now() < grace_window_ends_at` and `410 cancel_token_expired` afterwards (per `api-design.md` §3.3).

### Required checks

1. Test: confirm → cancel within 24h → status = `cancelled`, no deletion.
2. Test: confirm → 24h elapsed → scheduler transitions to `executing` → deletion completes.
3. UI/email copy: the 24-hour window is communicated in locale-appropriate text.

### Prohibited patterns

- Hardcoding a different number in code without updating this decision.
- Allowing the cancel link to remain valid past the 24h window (it must `410`).
- Allowing the scheduler to advance jobs before the window has elapsed.
- Shortening the window to "immediate" without recording a supersession decision (this would defeat the regret-reversal property).

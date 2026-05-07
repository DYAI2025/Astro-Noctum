# REQ-USA-signature-first-viewport: Signature anchor reachable from the dashboard's first viewport for completed profiles

**Type**: Usability

**Status**: Approved

**Priority**: Must-have

**Source**: [GOAL-discoverable-signature-anchor](../goals/GOAL-discoverable-signature-anchor.md)

**Source stakeholder**: [STK-user-free](../stakeholders.md)

## Description

A user with a fully-completed birth profile must be able to reach the 3D natal-signature sphere from the dashboard's first viewport. Acceptable forms: (a) an embedded preview card (`SignaturAnchorCard`) with a clearly-labeled CTA navigating to `/signatur`; (b) an inline embedded `SignaturRenderer` if and only if performance impact has been measured and accepted (gated by [REQ-PERF-signature-no-direct-embed](REQ-PERF-signature-no-direct-embed.md)). Default form is the preview card; inline embedding is opt-in and per-decision. The anchor occupies position 2 in the dashboard section order per [REQ-USA-dashboard-section-order](REQ-USA-dashboard-section-order.md).

## Acceptance Criteria

- Given a user with a complete birth profile (date / time / place all present), when the dashboard renders, then a signature anchor element is visible within the first viewport (no scroll required at typical desktop and mobile heights).
- Given the user clicks the signature anchor or its CTA button, when the click handler runs, then the user is navigated to `/signatur`.
- Given the page mounts, when the anchor card renders, then it shows a static placeholder visualization (e.g., `NatalSignaturStatic`) and the dominant Wu-Xing element label, not a blank or loading-only state.
- The fix passes `tsc --noEmit` without new errors.

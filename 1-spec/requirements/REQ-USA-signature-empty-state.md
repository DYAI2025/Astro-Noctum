# REQ-USA-signature-empty-state: Incomplete-profile signature anchor shows explicit empty state

**Type**: Usability

**Status**: Draft

**Priority**: Must-have

**Source**: [GOAL-discoverable-signature-anchor](../goals/GOAL-discoverable-signature-anchor.md)

**Source stakeholder**: [STK-user-free](../stakeholders.md)

## Description

When the user's birth profile is incomplete and the BaZi → Chladni params pipeline cannot produce valid `chladniParams`, the signature anchor surface must render an explicit empty state explaining what is missing and offering a path to complete the profile. Silently hiding the anchor or rendering a broken / fallback visualization without context is not acceptable.

## Acceptance Criteria

- Given the user has an incomplete birth profile (any of date / time / place missing), when the signature anchor section mounts, then it renders an empty-state component with locale-appropriate copy explaining why the signature cannot be shown.
- Given the empty-state renders, when the user reads it, then it includes a CTA inviting them to complete the missing fields (consistent with [REQ-USA-profile-incomplete-cta](REQ-USA-profile-incomplete-cta.md) but specific to the signature surface).
- Given `chladniParams === undefined` is returned by the BaZi → Chladni pipeline despite a profile that appears complete, when the signature renders, then `CymaticsFallback` is shown along with a debug-friendly indicator (e.g., a TODO comment or telemetry event) so the regression can be diagnosed.
- The empty state never displays as `null` / blank space without copy.

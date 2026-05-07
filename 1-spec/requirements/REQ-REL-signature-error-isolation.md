# REQ-REL-signature-error-isolation: Signature renderer failures are isolated by SectionErrorBoundary

**Type**: Reliability

**Status**: Approved

**Priority**: Must-have

**Source**: [GOAL-discoverable-signature-anchor](../goals/GOAL-discoverable-signature-anchor.md)

**Source stakeholder**: [STK-user-free](../stakeholders.md)

## Description

Failures inside the 3D natal-signature renderer (WebGL initialization failure, Three.js exception, shader compilation error, OOM in mobile contexts) must not cascade into the rest of the dashboard. Any signature-related component placed in the dashboard tree must be wrapped in `SectionErrorBoundary` (or equivalent) so that an exception inside the renderer is caught and replaced with a visible fallback, while sections above and below the signature anchor remain interactive.

## Acceptance Criteria

- Given a `SignaturAnchorCard` or `SignaturRenderer` is mounted in the dashboard, when an exception is thrown during render, then the exception is caught by `SectionErrorBoundary` and the signature section renders a visible fallback (e.g., `CymaticsFallback`) with a brief explanation.
- Given the signature section has thrown and is in error state, when the user interacts with other dashboard sections (`DailyChartHero`, agent cards, navigation), then those sections remain fully functional — no global render lock or page-level error.
- Given the user reloads or re-navigates back to the dashboard, when the dashboard mounts again, then the signature section attempts to render fresh (the error boundary does not persist across mounts unless the underlying cause persists).
- WebGL-init failures specifically (no WebGL support) trigger the fallback path without throwing into a global error.
- The error boundary surface logs the error (console + telemetry) so post-hoc diagnosis is possible.

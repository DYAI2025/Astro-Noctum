# REQ-PERF-signature-no-direct-embed: SignaturRenderer is not directly embedded in the dashboard until performance impact is measured

**Type**: Performance

**Status**: Draft

**Priority**: Should-have

**Source**: [GOAL-discoverable-signature-anchor](../goals/GOAL-discoverable-signature-anchor.md)

**Source stakeholder**: [STK-ben](../stakeholders.md)

## Description

The full `SignaturRenderer` component (which mounts WebGL, allocates GPU memory, and runs the Chladni shader loop) must not be embedded directly in the dashboard's render tree until the performance impact has been measured under representative conditions and accepted. Until then, the dashboard's signature anchor surface uses a static preview card (`SignaturAnchorCard`) with a CTA navigating to the standalone `/signatur` page (where the full renderer can run with full viewport budget). This requirement gates [REQ-USA-signature-first-viewport](REQ-USA-signature-first-viewport.md) Option A (inline embed) — Option B (preview card) ships first.

## Acceptance Criteria

- Given the dashboard mounts on a representative low-end mobile device (target spec to be defined), when measured, then time-to-interactive impact from the signature anchor is < 200 ms additional delay versus a control build with no anchor.
- Given the dashboard mounts on a desktop control build, when measured, then JavaScript main-thread blocking from the signature anchor is < 50 ms cumulative.
- Given performance measurements have not been recorded in a decision file, when reviewing PRs, then any direct `SignaturRenderer` embed in `Dashboard.tsx` is rejected at review.
- A decision (`DEC-direct-signature-embed-perf-evidence` or similar) records the measurement methodology and pass/fail thresholds before Option A ships.
- The `/signatur` standalone page is unaffected by this requirement — it may continue running the full renderer.

## Related Constraints

- [CON-no-signatur-v3-rebuild](../constraints/CON-no-signatur-v3-rebuild.md) — this requirement constrains where the existing renderer is mounted, not its internals.

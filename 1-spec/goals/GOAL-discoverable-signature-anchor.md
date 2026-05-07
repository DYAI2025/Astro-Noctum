# GOAL-discoverable-signature-anchor: 3D natal-signature sphere is reachable as the dashboard's identity anchor

**Description**: The implemented 3D natal-signature sphere is the project's "wer bin ich" identity anchor — a persistent, expressive representation of the user's BaZi pillars and Wu-Xing distribution rendered through Chladni-pattern parameters. Today the renderer works (`SignatureSphere3D`, `SignaturRenderer`, `/signatur` page) but is invisible from the dashboard; users who'd benefit from it never reach it. This goal makes the sphere reachable from the dashboard's first viewport for users with completed profiles, with a deliberate empty-state path for incomplete profiles and section-level error isolation so renderer failures don't bring the whole dashboard down.

**Status**: Approved

**Priority**: Must-have

**Source stakeholder**: [STK-user-free](../stakeholders.md)

## Success Criteria

- [ ] User with a completed birth profile sees the 3D sphere reachable within the first viewport — either embedded directly, or via a `SignaturAnchorCard` preview with a clear CTA into `/signatur`.
- [ ] User with an incomplete profile sees an explicit empty-state path (not a broken renderer or a silent absence) explaining what fields are missing.
- [ ] WebGL-init failure or render exception is caught by `SectionErrorBoundary` and rendered as `CymaticsFallback` (or equivalent visible fallback); the rest of the dashboard remains functional.
- [ ] No direct `SignaturRenderer` embed in the dashboard until performance impact (initial paint, scroll jank, mobile battery) is measured and accepted.
- [ ] Renderer code itself is unchanged per [CON-no-signatur-v3-rebuild](../constraints/CON-no-signatur-v3-rebuild.md); only integration surface changes.

## Related Artifacts

- User stories: _none yet_
- Requirements: [REQ-USA-signature-first-viewport](../requirements/REQ-USA-signature-first-viewport.md), [REQ-USA-signature-empty-state](../requirements/REQ-USA-signature-empty-state.md), [REQ-REL-signature-error-isolation](../requirements/REQ-REL-signature-error-isolation.md), [REQ-PERF-signature-no-direct-embed](../requirements/REQ-PERF-signature-no-direct-embed.md)
- Constraints: [CON-no-signatur-v3-rebuild](../constraints/CON-no-signatur-v3-rebuild.md), [CON-no-formula-changes](../constraints/CON-no-formula-changes.md)

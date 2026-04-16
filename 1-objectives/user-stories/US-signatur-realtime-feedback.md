# US-signatur-realtime-feedback: Visible Real-Time Signatur Response to Inputs

**Status**: Draft

**Source**: [GOAL-signatur-realtime-consistency](../goals/GOAL-signatur-realtime-consistency.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md), [STK-product-owner](../stakeholders.md)

## User Story

As a user interacting with the Signatur (Fusion Ring), I want the visualization to visibly respond to real-time inputs (transit changes, space-weather events, cluster-completed quiz contributions), so that the Signatur feels alive and my actions feel consequential — without mutating the ring geometry after a single quiz completes.

## Acceptance Criteria

- [ ] When the polled transit state changes (new interval or user-visible delta), the ring exhibits a perceptible visual change (particle intensity, trail behaviour, colour modulation) within the next render frame.
- [ ] The ring geometry (soulprint-sector weights) only updates after a full **cluster** is completed — individual quiz completions do not mutate soulprint-sector weights.
- [ ] Cluster-completion contributions produce a distinguishable, animated transition in the ring; the transition is perceptible without needing to reload the page.
- [ ] Both web and mobile render the Signatur using the V2 spirograph engine by default; any platform running V1 must display an explicit, logged degradation notice (not silent fallback).
- [ ] WebGL initialization or shader-compile failures render a non-3D fallback visualization; no raw "Renderer error" text is shown to the end user.
- [ ] The Cousto audio mute button silences playback within one interaction and the muted state persists across reload via `localStorage`.
- [ ] Trigger-to-effect mapping is documented (which input → which visual channel → within what latency) and referenced from the engine's code comments or a short README.

## Related Artifacts

- Requirements: [REQ-F-signatur-realtime-triggers](../requirements/REQ-F-signatur-realtime-triggers.md), [REQ-F-signatur-shared-bridge](../requirements/REQ-F-signatur-shared-bridge.md), [REQ-F-signatur-determinism](../requirements/REQ-F-signatur-determinism.md)
- QA Findings: QA-8, QA-15, QA-17, QA-23, QA-24, QA-25

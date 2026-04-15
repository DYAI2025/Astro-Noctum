# REQ-F-signatur-realtime-triggers: Signatur Echtzeit-Trigger & Cluster-Gate Enforcement

**Type**: Functional

**Status**: Draft

**Priority**: Must-have

**Source**: [GOAL-signatur-realtime-consistency](../goals/GOAL-signatur-realtime-consistency.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## Description

The Signatur visualization shall visibly respond to real-time inputs and enforce the cluster completion gate for quiz contributions. The Cousto audio engine shall be reliably mutable.

## Acceptance Criteria

- Given transit data updates, when the Signatur page is open, then the ring visualization shows a perceptible change within 5 seconds (particle density, color shift, or motion pattern).
- Given a single quiz is completed but the cluster is not fully complete, when the Signatur renders, then the ring geometry (soulprint sectors) has NOT changed — only after full cluster completion does the ring geometry update.
- Given `useQuizContribution` processes a quiz completion, when the cluster is incomplete, then NO `POST /api/contribute` request is sent — the contribution is queued locally until cluster completion.
- Given the V2 WebGL engine fails, when the Signatur page renders, then a visually acceptable fallback is shown without the text "Renderer-Fehler. Fallback aktiv." visible to the user.
- Given the user clicks the Mute button on the Signatur page, when the audio state changes, then all Cousto oscillators stop producing sound within 100ms and the mute state persists across page reloads via localStorage.
- Given the mobile app renders the Signatur, when the `signature_engine_v2` flag is checked, then V2 is used (same as web) — V1 fallback only when V2 explicitly fails at runtime.

## Related Constraints

- [CON-no-unexplained-numbers](../constraints/CON-no-unexplained-numbers.md) — Signatur changes must be explainable, not random visual noise

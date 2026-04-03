# SDLC-fix Handoff: dashboard-signatur-status-stuck

## Summary
The dashboard tile that represents the user's signature/form appears stuck in a non-terminal loading state ("Signatur wird berechnet") and may never resolve into a truthful computed result.

## Observed Behavior
The tile communicates that the signature is still being calculated, but the visible state suggests no actual resolved signature is being shown.

## Expected Behavior
The tile must either show a resolved signature/form state or a truthful temporary fallback/error state. It must not remain indefinitely in a pseudo-loading state.

## Reproduction
1. Open the Dashboard for a user profile that should already have computed astro/signature data
2. Locate the signature/form tile
3. Observe whether the tile resolves to a computed state or remains in a loading-like placeholder state

## Suspected Area
Dashboard signature summary tile, profile summary binding, Experience API bootstrap result mapping (`bootstrapExperience()` in `src/services/experience.ts`), soulprint/signature readiness state in `App.tsx` onboarding state machine (`form → signature → done`)

## Linked Artifacts
- [REQ-F-fusion-ring-visualization](../../1-objectives/requirements/REQ-F-fusion-ring-visualization.md)
- [REQ-F-signatur-data-pipeline](../../1-objectives/requirements/REQ-F-signatur-data-pipeline.md)

## Notes
A truthful fallback is acceptable. An indefinite "calculating" state is not. Check whether `bootstrapExperience()` failure is silently swallowed rather than transitioning to a resolved-but-unavailable state.

# REQ-F-cosmic-encounter-onboarding: Cosmic Encounter Onboarding Flow

**Type**: Functional

**Status**: Draft

**Priority**: Must-have

**Source**: [GOAL-fusion-astrology](../goals/GOAL-fusion-astrology.md), [GOAL-autopoietic-ux](../goals/GOAL-autopoietic-ux.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## Description

A 7-phase onboarding flow that introduces new users to Bazodiac through a cinematic, immersive experience. The phases are: materializing, levi-speaks, birth-input, calculating, ring-reveal, quiz, and complete. The flow is controlled by a state machine and gated behind the `cosmic_encounter_v1` feature flag. On desktop the experience uses a Three.js scene with parallax effects; on mobile it falls back to a CSS+image-based representation.

## Acceptance Criteria

- Given a new user with the `cosmic_encounter_v1` feature flag enabled, when they first access the application, then the Cosmic Encounter onboarding flow begins at the materializing phase
- Given the onboarding state machine, when each phase completes, then it transitions to the next phase in order: materializing -> levi-speaks -> birth-input -> calculating -> ring-reveal -> quiz -> complete
- Given the birth-input phase, when the user submits valid birth data, then the BAFE calculation is triggered and the flow transitions to the calculating phase
- Given the ring-reveal phase, when the calculation completes, then the FusionRingCanvasV2 renders the user's signature
- Given the quiz phase, when the ring reveal is complete, then the initial onboarding quiz (signature_onboarding_v1) is presented
- Given a desktop viewport (>=768px), when the onboarding flow renders, then the Three.js CosmicEncounterScene is used with parallax effects (form +30px, Levi -50px via useParallax hook)
- Given a mobile viewport (<768px), when the onboarding flow renders, then the CosmicEncounterMobile fallback component is used
- Given the `cosmic_encounter_v1` feature flag is disabled, when a new user accesses the application, then the legacy BirthForm onboarding is shown instead
- Given the existing BirthForm logic, when the Cosmic Encounter is active, then the legacy form continues to function as a fallback without breaking changes

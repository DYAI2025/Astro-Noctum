# REQ-F-quiz-contribution-system: Quiz Contribution System

**Type**: Functional

**Status**: Implemented

**Priority**: Must-have

**Source**: [GOAL-autopoietic-ux](../goals/GOAL-autopoietic-ux.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## Description

A system of 22 quizzes organized across 6 clusters that modulate the Fusion Ring via ContributionEvents. Quiz answers feed into the Neural Myzel layer, growing bioluminescent filaments and adjusting the signature weight. The signature weight from quizzes is capped at 0.5 to enforce the True North principle of modulation over mutation — quizzes influence the presentation and narrative but never alter the deterministic Obsidian Core.

## Acceptance Criteria

- Given the quiz system is loaded, when a user views available quizzes, then 22 quizzes across 6 clusters are presented
- Given a quiz is completed, when the answers are submitted, then a ContributionEvent is emitted containing the cluster, quiz ID, and computed weight
- Given a ContributionEvent is emitted, when the Fusion Ring processes it, then the Neural Myzel layer updates with new filament connections reflecting the quiz results
- Given accumulated quiz contributions, when the total signature weight is calculated, then it does not exceed the cap of 0.5
- Given a quiz contribution, when the Fusion Ring is re-rendered, then the Obsidian Core remains unchanged (only the Neural Myzel and Membrane layers are affected)
- Given a first-time user in the onboarding flow, when they reach the quiz phase, then the initial onboarding quiz (signature_onboarding_v1) is presented

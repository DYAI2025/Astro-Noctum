# REQ-F-progressive-ui-fluidity: Progressive UI Fluidity Based on Engagement

**Type**: Functional

**Status**: Draft

**Priority**: Must-have

**Source**: [GOAL-autopoietic-ux](../goals/GOAL-autopoietic-ux.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## Description

New users see a conventional, predictable UI (routes, buttons, scroll). As the user completes quizzes and deepens their profile, the UI progressively gains fluidity — more organic gesture responses, subtler affordances, and spatial navigation that rewards familiarity. This mirrors the Bioluminescent Membrane concept: the interface "grows" with the user. The threshold for fluidity progression is cluster completion, not arbitrary time-based criteria.

## Acceptance Criteria

- Given a user with 0 completed quiz clusters, when they open the Signatur page, then navigation is fully conventional — labelled buttons, explicit scroll indicators, standard tap targets
- Given a user with ≥1 completed quiz cluster, when they open the Signatur page, then at least one additional fluid affordance is present (e.g., gesture-hint animation, reduced label prominence, spatial depth hint)
- Given a user with all 6 clusters completed, when they interact with the app, then the full fluidity layer is active — gesture-based navigation and spatial depth transitions are the primary interaction mode
- Given `prefers-reduced-motion: reduce` is set, when any user opens the app regardless of cluster completion, then no motion-based fluidity affordances are shown; conventional UI is used throughout
- Given the fluidity level changes (new cluster completed), when the user next opens the app, then the UI reflects the new fluidity level without requiring an app restart or manual refresh

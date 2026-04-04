# REQ-F-signatur-live-transit-panels: Live Transit Resonance Panels on Signatur Page

**Type**: Functional

**Status**: Draft

**Priority**: Must-have

**Source**: [GOAL-fusion-astrology](../goals/GOAL-fusion-astrology.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## Description

The lower section of the Signatur page (`/signatur`) currently contains static placeholder tiles (info cards about resonance, space weather, accessibility). These must be replaced with live, user-relevant transit resonance panels that show which planetary transits are currently affecting the user's Signatur and how.

Every visible tile in this section must provide real, actionable functionality. Tiles that duplicate the space weather panel or serve as generic placeholders must be removed.

## Acceptance Criteria

- Given the user opens the Signatur page, when transit data is available, then the lower section shows live transit resonance panels instead of static info tiles
- Given a transit resonance panel, when the user views it, then it shows: planet name, aspect type, affected Signatur pole, resonance direction (amplifying or dampening), and a brief interpretation
- Given a transit resonance panel, when the user taps "Warum?", then an explainability overlay explains why this transit affects their Signatur (referencing natal chart position)
- Given no active transits affect the user's Signatur, when the lower section renders, then a truthful empty state is shown (not placeholder tiles)
- Given the space weather panel already exists in the right column, when the lower section renders, then no tile duplicates the space weather information

## Related Constraints

- [CON-no-unexplained-numbers](../constraints/CON-no-unexplained-numbers.md) — all transit values must include explanation
- [CON-resource-oriented-framing](../constraints/CON-resource-oriented-framing.md) — transit descriptions use possibility-oriented language

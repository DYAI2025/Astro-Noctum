# REQ-F-space-weather-modulation: Space Weather Modulation

**Type**: Functional

**Status**: Implemented

**Priority**: Should-have

**Source**: [GOAL-autopoietic-ux](../goals/GOAL-autopoietic-ux.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## Description

Real-time solar weather data from NOAA and NASA DONKI APIs modulates the Fusion Ring's intensity and visual behavior. A Solar Pressure Score is computed from current space weather conditions and applied to the Neural Myzel and Bioluminescent Membrane layers. The modulation factor is capped at 1.5x to enforce the True North principle that live data modulates the presentation but never alters the deterministic Obsidian Core.

## Acceptance Criteria

- Given the application is running, when space weather data is fetched, then the system retrieves solar activity data from NOAA and NASA DONKI APIs
- Given valid space weather data, when the Solar Pressure Score is computed, then it produces a numeric modulation factor
- Given a computed Solar Pressure Score, when it is applied to the Fusion Ring, then the Neural Myzel and Membrane layers adjust their intensity and visual behavior accordingly
- Given any Solar Pressure Score value, when it is applied, then the modulation factor does not exceed 1.5x
- Given a computed Solar Pressure Score, when it is applied to the Fusion Ring, then the Obsidian Core layer remains unchanged
- Given the NOAA or NASA DONKI API is unavailable, when the system attempts to fetch data, then it gracefully degrades to a neutral modulation factor of 1.0x without errors

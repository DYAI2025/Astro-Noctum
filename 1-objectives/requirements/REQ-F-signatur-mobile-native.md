# REQ-F-signatur-mobile-native: Native 3D Signatur on iOS

**Type**: Functional

**Status**: Draft

**Priority**: Must-have

**Source**: [GOAL-fusion-astrology](../goals/GOAL-fusion-astrology.md), [GOAL-autopoietic-ux](../goals/GOAL-autopoietic-ux.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## Description

The iOS app renders the full 3D Signatur engine via expo-gl and three.js — not a 2D fallback. The same Cousto-frequency spirograph model runs on mobile with reduced particle count adapted for mobile GPU constraints. Touch gestures control the camera. Cousto-frequency ambient sound plays through the device speaker or headphones.

## Acceptance Criteria

- Given the mobile app on iOS, when the Signatur screen loads, then the V2 spirograph engine renders in a native GL context (expo-gl + three.js)
- Given the mobile engine, when active, then it renders a reduced particle set (~6K ring + ~800 corona particles) adapted for mobile GPU constraints
- Given the mobile Signatur, when the user interacts, then pan (single finger), pinch-zoom (two fingers), and orbit (drag) gestures control the camera
- Given the mobile engine, when rendering, then the same 7-planet Cousto-frequency model is used as on web — visual fidelity is reduced (fewer particles, simpler bloom) but the mathematical model is identical
- Given the mobile Signatur, when ambient sound is active, then Cousto-frequency tones play through the device speaker or headphones
- Given an older iOS device (iPhone 12 or later), when the engine renders, then it maintains ≥30fps without thermal throttling within 60 seconds of sustained rendering

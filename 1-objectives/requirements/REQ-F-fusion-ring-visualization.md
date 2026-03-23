# REQ-F-fusion-ring-visualization: Fusion Ring Interactive Visualization

**Type**: Functional

**Status**: Implemented

**Priority**: Must-have

**Source**: [GOAL-fusion-astrology](../goals/GOAL-fusion-astrology.md), [GOAL-autopoietic-ux](../goals/GOAL-autopoietic-ux.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## Description

The Fusion Ring (Signatur) is rendered as an interactive visualization combining all astrological data — BaZi, Western Radix, and Wu-Xing — into a single visual entity. On desktop it uses Three.js for 3D rendering; on mobile (<768px viewport) it falls back to a CSS+image-based representation. The ring reflects the three-layer model: the immutable Obsidian Core at the center, the Neural Myzel filaments growing around it, and the Bioluminescent Membrane as the outer interactive surface.

## Acceptance Criteria

- Given a completed BAFE calculation, when the Fusion Ring is rendered on desktop, then a Three.js 3D scene displays the merged signature with the obsidian/gold palette
- Given a viewport width below 768px, when the Fusion Ring is rendered, then a CSS+image fallback is used instead of Three.js
- Given a Fusion Ring on desktop, when the Three.js scene is running, then the frame rate does not drop below 60fps
- Given a Fusion Ring on mobile, when the fallback is rendered, then the frame rate does not drop below 30fps
- Given quiz contribution events or space weather modulation data, when the Fusion Ring is active, then the Neural Myzel layer updates to reflect the new modulation values
- Given a Fusion Ring, when the user interacts with it, then the Obsidian Core layer remains visually and computationally unchanged

## Related Constraints

- [CON-dark-luxury-aesthetic](../constraints/CON-dark-luxury-aesthetic.md) — the ring must render against OLED black with gold/sapphire bioluminescent elements

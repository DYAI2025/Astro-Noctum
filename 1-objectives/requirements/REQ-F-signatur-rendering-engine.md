# REQ-F-signatur-rendering-engine: Signatur V2 Spirograph Rendering Engine

**Type**: Functional

**Status**: Implemented

**Priority**: Must-have

**Source**: [GOAL-fusion-astrology](../goals/GOAL-fusion-astrology.md), [GOAL-autopoietic-ux](../goals/GOAL-autopoietic-ux.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## Description

The Signatur V2 engine renders a Cousto-frequency spirograph — a particle system where each of 7 planetary voices (Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn) traces a spirograph curve defined by its Cousto frequency (Hz), color, and zodiac affinity. The engine implements the three-layer autopoietic model: an immutable Obsidian Core, a quiz/interaction-driven Neural Myzel, and a transit/weather-responsive Bioluminescent Membrane. The engine generates its own ambient sound from the active planet Cousto frequencies.

## Acceptance Criteria

- Given natal weights for 7 planets, when the engine renders, then each planet's spirograph curve amplitude is proportional to its weight
- Given the engine is active, then particles are generated in 4 tiers: glow (core points), curve (spirograph traces), fractal (branching detail), subfractal (finest detail) — totaling ~28K particles on desktop
- Given the particle system, when rendered, then n-fold kaleidoscope symmetry is applied based on the user's dominant element (e.g., 5-fold for Wood, 6-fold for Water)
- Given the spirograph is evolving, when a pattern-jump threshold is crossed (emergence detection), then a visual transition effect fires (bloom flash, curve restructure)
- Given the engine, when active, then bloom postprocessing is applied with intensity proportional to overall signal strength
- Given the three-layer model, when quiz/transit data changes, then only Neural Myzel and Membrane layers change — Obsidian Core geometry remains deterministic and immutable
- Given the engine, when active, then it generates ambient sound from the active planet Cousto frequencies — louder planets (higher weight) produce louder tones. No external audio input is processed.

## Related Constraints

- [CON-dark-luxury-aesthetic](../constraints/CON-dark-luxury-aesthetic.md) — ring renders against OLED black with gold/sapphire bioluminescent elements

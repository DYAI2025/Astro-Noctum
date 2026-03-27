# REQ-F-agent-dashboard-selection: Agent Selection via Side-by-Side Dashboard Tiles

**Type**: Functional

**Status**: Draft

**Priority**: Must-have

**Source**: [GOAL-multi-agent-voice](../goals/GOAL-multi-agent-voice.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## Description

The dashboard must display two side-by-side agent tiles — one for Levi, one for Eve. This is not a generic agent gallery or a single switchable section; it is two fixed, clearly designed sections visible simultaneously.

Each tile contains: agent name, symbol/placeholder image, German microcopy describing the persona, a status indicator (breathing dot), and a CTA button. For premium users the CTA opens the agent's floating widget; for non-premium users it triggers the existing Stripe upgrade flow.

## Acceptance Criteria

- Given the user is on the Dashboard, when it renders, then both Levi and Eve tiles are visible simultaneously (not tabbed or toggled)
- Given each tile, when rendered, then it shows: name, symbol image, persona description (German), status dot, and CTA button
- Given the user clicks Levi's CTA, when premium, then Levi's floating widget opens (not Eve's)
- Given the user clicks Eve's CTA, when premium, then Eve's floating widget opens (not Levi's)
- Given the user is not premium, when clicking either CTA, then the Stripe upgrade flow is triggered
- Given both tiles, when rendered, then Levi's copy conveys calm/depth/wisdom and Eve's copy conveys directness/boldness/modernity

## Related Constraints

- [CON-german-ui](../constraints/CON-german-ui.md) — All microcopy and descriptions in German
- [CON-dark-luxury-aesthetic](../constraints/CON-dark-luxury-aesthetic.md) — Tiles follow obsidian/gold palette

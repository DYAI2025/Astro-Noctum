# REQ-USA-wcag-contrast: WCAG 2.1 AA Contrast Compliance on Dark Background

**Type**: Usability

**Status**: Draft

**Priority**: Should-have

**Source**: [CON-dark-luxury-aesthetic](../constraints/CON-dark-luxury-aesthetic.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## Description

All user-facing text and interactive elements must meet WCAG 2.1 AA contrast ratios when rendered against the obsidian/dark background palette. This applies to body text, headings, labels, button text, and icon labels. Decorative elements (pure bioluminescent glow effects) are exempt.

## Acceptance Criteria

- Given any text element rendered against the obsidian background (`#00050A` or `#010409`), when measured, then the contrast ratio is ≥4.5:1 for normal text (< 18pt) and ≥3:1 for large text (≥ 18pt bold or ≥ 24pt regular)
- Given interactive UI elements (buttons, links, form inputs), when their focus or active state is visible, then the contrast of the focus indicator against its background is ≥3:1
- Given gold (`#D4AF37`) text on obsidian (`#00050A`), when measured, then contrast ratio ≥4.5:1 — this is the primary brand combination and must pass
- Given any new component, when added to the UI, then a contrast check is performed before the PR is merged (manual or automated via axe-core or similar)

## Related Constraints

- [CON-dark-luxury-aesthetic](../constraints/CON-dark-luxury-aesthetic.md) — this requirement formalizes the WCAG obligation stated in the constraint

# CON-no-unexplained-numbers: No Unexplained Numerical Values in UI

**Category**: Business

**Status**: Active

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## Description

Every numerical value displayed in the user interface must be accompanied by at least one of: an explanation of what it represents, a comparison basis (e.g., "compared to your baseline"), or a meaning description (e.g., "high = strong emotional activity"). If a number cannot be explained in user-understandable terms, it must be removed from the UI entirely.

This is a hard, system-wide rule — no exceptions.

## Rationale

Unexplained numbers create pseudo-precision that erodes trust. Users interpret bare percentages or scores as authoritative predictions, which conflicts with the resource-oriented, possibility-language approach of Bazodiac. Trust > apparent precision.

## Impact

- All existing UI components displaying scores, percentages, or indices must be audited
- New features must pass a "number transparency check" before shipping
- Gemini-generated text must not include unexplained numerical values
- Fusion Ring intensity values, harmony_index, and similar internal metrics must either be explained in context or hidden behind qualitative labels (e.g., "high", "moderate", "low")
- Derived requirement: [REQ-F-transparency-rule](../requirements/REQ-F-transparency-rule.md)

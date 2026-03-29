# REQ-F-transparency-rule: System-Wide Number Transparency Enforcement

**Type**: Functional

**Status**: Approved

**Priority**: Must-have

**Source**: [US-number-transparency](../user-stories/US-number-transparency.md), [CON-no-unexplained-numbers](../constraints/CON-no-unexplained-numbers.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## Description

A system-wide rule enforcing that no numerical value (percentage, score, index, count) appears in the user-facing UI without an accompanying explanation. This applies to all existing and new features — Dashboard, Vibes, Weekly Insights, Signatur, Wu-Xing, space weather displays.

## Acceptance Criteria

- Given any numerical value in the UI, when displayed, then it is accompanied by at least one of: explanation text, comparison basis, or meaning description
- Given an audit of all UI screens, when completed, then zero isolated percentages or scores are found
- Given a numerical value that cannot be meaningfully explained, when evaluated, then it is replaced with a qualitative label or removed entirely
- Given Gemini-generated text, when rendered, then it contains no unexplained numerical values
- Given the Fusion Ring visual (harmony_index, solar pressure), when any numerical indicator is shown, then it has a tooltip or inline description explaining its meaning

## Related Constraints

- [CON-no-unexplained-numbers](../constraints/CON-no-unexplained-numbers.md) — the hard rule this requirement enforces

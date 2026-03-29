# REQ-F-vibes-output-structure: Standardized 3-Level Vibes Output

**Type**: Functional

**Status**: Draft

**Priority**: Must-have

**Source**: [US-vibes-on-demand](../user-stories/US-vibes-on-demand.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## Description

Every Vibes output follows a standardized 3-level structure that progressively reveals depth. Level 1 (Kurzsignal) is always visible. Level 2 (Treiber/Einflussfaktoren) is visible by default. Level 3 (Erklärung) is accessible via "Warum sehe ich das?" tap.

## Acceptance Criteria

- Given a Vibes result, when Level 1 is rendered, then exactly 1 Kurzsignal sentence is displayed (e.g., "Leichte innere Spannung, aber hohe Klarheit")
- Given a Vibes result, when Level 2 is rendered, then 3–5 Einflussfaktoren are displayed as short labels (e.g., "Erhöhte Sensibilität", "Soziale Offenheit steigt")
- Given a Vibes result, when the user taps "Warum sehe ich das?", then Level 3 shows 1–2 explanatory sentences referencing the user's Signatur and current constellation
- Given the 3-level structure, when displayed on mobile, then Level 1 + Level 2 are scannable within 10 seconds without scrolling
- Given the output text at any level, when reviewed, then no numerical value appears without an accompanying explanation

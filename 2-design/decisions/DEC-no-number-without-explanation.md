# DEC-no-number-without-explanation: No Number Without Explanation (System-Wide)

**Status**: Active

**Category**: Product

**Scope**: system-wide

**Source**: [CON-no-unexplained-numbers](../../1-objectives/constraints/CON-no-unexplained-numbers.md)

**Last updated**: 2026-03-30

## Context

Users interpret bare numbers (percentages, scores, indices) as authoritative metrics, which creates false precision and erodes trust when the underlying model is qualitative. The Bazodiac philosophy prioritizes understanding over metrics.

## Decision

No numerical value may appear in the user-facing UI without an accompanying explanation. If a value cannot be explained, it is replaced with a qualitative label (high/medium/low) or removed entirely. This applies to all features: Dashboard, Vibes, Weekly Insights, Signatur, Wu-Xing, space weather displays.

**Trade-off**: Fewer visual metrics in the UI. Less "data dashboard" feel, more "insight companion" feel.

## Enforcement

### Trigger conditions

- When adding any numerical display to UI components
- When rendering Gemini-generated text that might contain numbers
- When designing data visualizations or charts

### Required patterns

- Every `<span>` or text node displaying a number must have an associated tooltip, inline label, or context sentence
- Harmony index, solar pressure score, and similar internal metrics: either show with a meaning label ("Hohe Harmonie — Westlich und BaZi konvergieren") or hide the number entirely
- Gemini prompt must include instruction: "Do not include unexplained numerical values"

### Required checks

1. UI audit: grep for numerical patterns in rendered output
2. Gemini output validation: reject responses containing bare numbers without context
3. PR review: any new numerical display requires explanation mechanism

### Prohibited patterns

- Bare percentage: "78%" without context
- Isolated score: "Score: 4.2" without meaning
- Index without label: "Harmony: 0.73" without explanation

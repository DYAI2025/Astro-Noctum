# DEC-wuxing-ui-mapping: Trail

> Companion to `DEC-wuxing-ui-mapping.md`.
> AI agents read this only when evaluating whether the decision is still
> valid or when proposing a change or supersession.

## Alternatives considered

### Option A: Centralized Wu-Xing module with autopoietic constraints (chosen)
- Pros: Single source of truth; consistent colors/physics across all surfaces; enforces the three-layer model; easy to audit
- Cons: All components depend on one module; adding a new element property requires touching the central file

### Option B: Per-component element styling
- Pros: Components are self-contained; easier to prototype
- Cons: Color drift across components; violates autopoietic model; impossible to maintain consistency with 20+ components using element data; hardcoded values diverge over time

### Option C: CSS custom properties / design tokens only
- Pros: Standard web approach; cacheable; no JS dependency for colors
- Cons: Cannot express physics properties (directions, seasons, modulation coefficients); insufficient for the data-driven ring engine; loses the semantic connection between element and behavior

## Reasoning

The autopoietic model demands that element properties are not just visual (colors) but semantic (directions, seasons, modulation weights). A centralized TypeScript module can express all of these in a type-safe way. The three-layer separation (Core/Myzel/Membrane) prevents the common mistake of letting UI interactions corrupt the deterministic natal data.

This decision would be invalidated if: the autopoietic model is abandoned; Wu-Xing elements are removed from the product; or the app moves to a purely CSS-driven design system without data-driven visualization.

## Human involvement

**Type**: ai-proposed/human-approved

**Notes**: Decision was implicit from TRUENORTH philosophy; formalized as DEC record during scaffold migration (2026-03-23).

## Changelog

| Date | Change | Involvement |
|------|--------|-------------|
| 2026-03-23 | Initial decision (formalized from existing practice) | ai-proposed/human-approved |

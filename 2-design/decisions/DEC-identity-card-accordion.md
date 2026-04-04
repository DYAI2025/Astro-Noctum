---
id: DEC-identity-card-accordion
status: Active
date: 2026-04-04
trigger: Implementing expandable identity cards on the Dashboard
---

# DEC-identity-card-accordion

## Decision

The five Dashboard identity cards (Sun Sign, Moon Sign, Ascendant, Year Animal, Wu-Xing Element) use a **vertical accordion pattern** that expands **downward** on click.

## Context

Two variants were evaluated:

1. **Horizontal expand (right)** — card opens to the right, pushing adjacent content
2. **Vertical expand (down)** — card opens downward as an accordion panel

## Choice: Vertical (downward) accordion

### Rationale

- Layout stays stable — the Signatur card on the right is never displaced
- Mobile-friendly — vertical expansion maps naturally to scroll behavior
- Consistent with existing expand patterns in the app (e.g., CosmicWeatherCard)
- Lower risk of horizontal layout collisions on narrow viewports
- Cards stack vertically left-aligned; accordion content appears below each card

### Constraints

- Only one card may be open at a time (single-open accordion) to prevent excessive vertical growth
- Expanded content must be contextual to the user's specific sign/element/animal (not generic descriptions)
- Animation: 300ms ease-out slide-down, respects `prefers-reduced-motion` (instant show)

## Consequences

- `DashboardBigFourCard` grid layout changes from horizontal `grid-cols-2..5` to vertical stack
- Each card needs an `isExpanded` state and per-sign/element description text
- Description texts must exist in both DE and EN (CON-german-ui)

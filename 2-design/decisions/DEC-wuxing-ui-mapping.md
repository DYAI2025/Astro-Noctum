# DEC-wuxing-ui-mapping: Wu-Xing elements drive UI physics via centralized mapping

**Status**: Active

**Category**: Architecture

**Scope**: frontend

**Source**: n/a (foundational decision predating scaffold)

**Last updated**: 2026-03-23

## Context

Bazodiac's autopoietic design model (TRUENORTH) defines three layers: Obsidian Core (deterministic calculations), Neural Myzel (modulation via quizzes/space weather), and Bioluminescent Membrane (adaptive UI). Wu-Xing (Five Elements: Wood, Fire, Earth, Metal, Water) is the bridge between astrological data and visual presentation — each element has specific colors, directions, seasons, and physics properties that must be consistently applied across all UI surfaces (Fusion Ring, Dashboard, WuXing page, quiz visualizations).

## Decision

Wu-Xing element properties are defined in a **single centralized source** (`src/lib/astro-data/wuxing.ts`). All UI components consume element data through this module. Element-to-style mappings (colors, physics, directions) are never hardcoded in individual components.

## Enforcement

### Trigger conditions

- **Design phase**: when designing any visualization that uses element data or colors
- **Code phase**: when writing components that render element-specific styling or Wu-Xing data

### Required patterns

- Element colors, names, directions, seasons: always read from `WUXING_ELEMENTS` array in `src/lib/astro-data/wuxing.ts`
- Use `getWuxingByKey()` for API-agnostic lookups (handles both German "Holz" and English "Wood")
- The Fusion Ring consumes Wu-Xing coefficients via the transient formula: `0.27·W + 0.27·B + 0.18·X + 0.18·T + 0.10·C`
- Quiz contributions modulate but never mutate the core signal (quiz weight capped at 0.5, solar pressure at ×1.5)
- The Three-Layer Model must be respected:
  - **Obsidian Core**: immutable natal data — nothing external modifies it
  - **Neural Myzel**: modulation only (quizzes, space weather, partnerships)
  - **Bioluminescent Membrane**: UI adapts to user depth, Wu-Xing drives visual expression

### Required checks

1. New element-colored UI reads from `wuxing.ts`, not inline hex values
2. Ring deformation coefficients stay within documented bounds
3. Core natal calculations are never modified by UI-layer interactions

### Prohibited patterns

- Hardcoding Wu-Xing hex colors in component files (e.g., `#3D8B37` for Wood)
- Components computing their own element-to-color mappings
- UI interactions that mutate the Obsidian Core (natal chart data)
- Bypassing the three-layer separation (e.g., quiz results directly changing natal calculations)

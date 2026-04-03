# DEC-navigation-shell: Navigation Shell Architecture

**Status**: Active

**Category**: Design

**Scope**: frontend (web app, mobile-responsive)

**Source**: Ben (founder) — resolved open question Q1 (desktop nav scope), 2026-04-02

**Last updated**: 2026-04-02

## Context

An open question existed about whether the desktop navigation should be replaced with a left-anchored sticky guide-nav or kept as a horizontal top bar. Additionally, utility items (account, settings, language, etc.) had no defined placement. The old primary nav list (ATLAS, SIGNATUR, SKY, WOCHE, LEVI from DEC-spiritual-tech-interactions) was stale and not aligned with the current feature set.

## Decision

### Top Bar Structure

The top navigation bar remains a horizontal scrolling bar (preserved, not replaced by a side or guide nav). It contains exactly three primary items:

| Item | Target | Notes |
|------|--------|-------|
| **Astro-Agents** | Levi & Eve agent tiles | Entry point to both voice agents |
| **Planetarium** | Planetarium / BirthChartOrrery | Indirect dark/bright mode context toggle |
| **Signatur** | `/signatur` | Most important primary link — always visible |

### Settings Menu

All utility actions are grouped under a **Settings** menu item (accessible from the top bar). Settings contains:

| Item | Function |
|------|----------|
| DE / EN switch | Language toggle |
| Dark / Bright mode | Theme toggle |
| User Profile | Profile view / edit |
| Subscription | Premium status + upgrade / manage |
| Logout | Sign out |
| AGB | Terms of service |
| Datenschutz | Privacy policy |
| sky.bazodiac.space | External link to Sky companion app |

### Mobile Web App

The top bar (three primary items + Settings) must be fully visible and functional on narrow mobile viewports. Items must not be hidden behind a hamburger or collapsed into a non-discoverable overflow state. Touch targets ≥ 44px (see DEC-design-system-v2). The mobile responsive layout may stack or abbreviate labels but may not omit any primary item or the Settings entry point.

## Supersedes

The "Navigation" section of [DEC-spiritual-tech-interactions](DEC-spiritual-tech-interactions.md) (stale item list: ATLAS/SIGNATUR/SKY/WOCHE/LEVI). That decision's interaction philosophy (animation timing, error states, drawer pattern for native mobile) remains in effect; only the item list and structure are superseded by this decision.

## Enforcement

### Trigger conditions

- When adding or removing navigation items
- When implementing or modifying the top bar component
- When implementing the Settings menu or any utility item listed above
- When making nav layout decisions for mobile responsive breakpoints

### Required patterns

- Exactly 3 primary items in the top bar: Astro-Agents, Planetarium, Signatur
- All utility items must be in Settings, not scattered in the top bar
- Settings must be reachable on mobile without hamburger-only patterns
- Signatur link must be present and visually prominent

### Prohibited patterns

- Adding a 4th primary nav item without explicit approval
- Moving utility items (language, theme, auth) into the primary top bar
- Hiding primary nav items on mobile behind a hamburger-only menu
- Creating a left-anchored or sticky side guide-nav for desktop (scope not approved)

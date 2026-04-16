# DEC-navigation-shell: Navigation Shell Architecture

**Status**: Active

**Category**: Design

**Scope**: frontend (web app, mobile-responsive)

**Source**: Ben (founder) — initial v1 2026-04-02; amended v2 2026-04-15 in response to QA Sprint S-QA-2026-04-15 findings (QA-6/16/19/20/21/22) and the introduction of the Atlas deep-dive view.

**Last updated**: 2026-04-15

## Context

The original v1 decision (3 primary nav items: Astro-Agents, Planetarium, Signatur) caused real user confusion in QA testing:

- "Astro-Agents" and "Planetarium" rendered as text-nav items indistinguishable from the Signatur route link → users clicked them expecting page navigation.
- No explicit Dashboard/Tageschart link; only the "Bazodiac" wordmark led back to `/`, and the wordmark is absent on mobile entirely.
- The Planetarium top-bar item is functionally a theme toggle, not a route — the styling lied about its behavior.

In parallel, the product roadmap added a **third primary view: Atlas** (premium-only deep-dive analysis page covering Wu-Xing detail, houses, full interpretation, mathematical fusion proofs). With three primary views instead of one, the nav structure must support contextual navigation between them.

## Decision

### Top Bar Structure (v2)

The top navigation bar remains a horizontal bar (no side / sticky guide-nav). It consists of **three zones**:

#### Left zone — Brand
- **Bazodiac wordmark** → `/` (route to Dashboard). Visible on **both desktop and mobile** (v1 omitted it on mobile — fixed in v2).

#### Center zone — Contextual primary-view links

The three primary views are: **Dashboard** (`/`), **Signatur** (`/signatur`), **Atlas** (`/atlas`, premium-only).

The center zone shows links to **the primary views the user is not currently on**:

| Current route | Center zone shows |
|---------------|-------------------|
| `/` (Dashboard) | Signatur, Atlas |
| `/signatur` | Dashboard, Atlas |
| `/atlas` | Dashboard, Signatur |
| Any other route (Wissen, Sky, Weekly, Synastry, FAQ, Wu-Xing) | Dashboard, Signatur, Atlas |

**Atlas link rendering rules:**
- For premium users: full link, normal styling.
- For free users: link is **rendered but visually muted** with a small lock/crown icon and a tooltip/hover-card "Premium" — clicking opens the upgrade flow rather than navigating. Atlas is never silently hidden — its existence is a discovery driver for upgrades.
- Until the Atlas page exists (sprint S-ATLAS not yet started): the link is gated behind a feature flag `atlas_v1` (default `false`) so it does not appear in production prematurely.

#### Right zone — Symbol-only utilities

These are **icon-only** buttons (no text labels in the bar) — visually unmistakable as utilities, not nav links:

| Icon | Function | Premium gate |
|------|----------|--------------|
| Sparkles / agent-glyph | **Agents popup** — opens a popup containing **both** Levi and Eve as selectable tiles. | **Premium-only**. For free users: dimmed/disabled with upgrade hint on click. |
| Moon ↔ Sun | **Theme toggle** — global Planetarium (dark) ↔ Solar System (bright). Uses `aria-pressed` and the actual Moon or Sun icon (not both at once). | Free for all. |
| Volume / VolumeX | Existing audio toggle | Free for all. |
| Settings (gear) | Existing Settings menu | Free for all. |

**The Planetarium and Astro-Agents text-nav buttons that existed in v1 are removed.** Their functionality is preserved via the symbol-only buttons above.

### Settings Menu

All utility actions remain grouped under Settings (unchanged from v1) with **two amendments**:

1. The mode toggle (Planetarium/Solar System) inside Settings is **icons-only** (Moon / Sun) — no redundant text labels next to the icons. The surrounding "Modus" / "Mode" row label is retained for context.
2. Settings continues to include all v1 items: DE/EN switch, mode toggle (icons-only), User Profile, Subscription (premium-only), Logout, AGB, Datenschutz, sky.bazodiac.space.

The mode toggle exists in **both** the right-zone of the top bar (icon) **and** in the Settings menu (icons + row label). This is intentional redundancy for discoverability.

### Active state and self-navigation

- Active center-zone link: highlighted with `aria-current="page"` and the gold underline treatment.
- Active link is **not clickable** (`aria-disabled="true"`, `pointer-events-none`, `tabIndex={-1}`) — users cannot self-navigate to the page they are already on.
- This applies to all three center-zone primary-view links and the mobile equivalents.

### Mobile Web App

The mobile bottom-nav follows the same **center-zone contextual rule**: the bottom bar shows the same primary-view links as desktop (1 link on Dashboard/Signatur/Atlas; 3 links on other routes), plus the right-zone icons (agents, theme toggle, settings). Audio is desktop-only.

Touch targets ≥ 44px. No hamburger-only patterns. No primary-view link may be omitted on mobile. The Bazodiac wordmark is rendered on mobile (v1 fix).

### Theme behavior on Signatur

The Signatur visualization (V2 spirograph engine) must respect the **global** `planetariumMode` — both dark (Planetarium) and bright (Solar System) themes. The current implementation renders only dark; this becomes a Phase-2 task in S-QA-2026-04-15 (`TASK-qa-sig-theme-aware`, to be added).

## Supersedes

The v1 of this decision (3 primary text-nav items: Astro-Agents, Planetarium, Signatur). The "Navigation" section of [DEC-spiritual-tech-interactions](DEC-spiritual-tech-interactions.md) remains superseded as before; only the item list and zone structure change between v1 and v2 of this decision.

## Enforcement

### Trigger conditions

- When adding or removing navigation items
- When implementing or modifying the top bar component
- When implementing the mobile bottom-nav
- When implementing the Settings menu or any utility item listed above
- When implementing the Atlas page or its nav entry
- When making nav layout decisions for mobile responsive breakpoints
- When implementing theme-aware rendering on the Signatur page

### Required patterns

- Three zones (left brand / center contextual / right symbol-only) on both desktop and mobile.
- Center-zone shows only the primary-view links that are **not** the current route.
- Right-zone utility buttons are **icon-only** in the bar (no text labels).
- Atlas link present on every non-`/atlas` route (gated by `atlas_v1` flag until S-ATLAS ships).
- Atlas link rendered as muted + lock-icon for non-premium users; clicking opens upgrade flow.
- Agents popup surfaces **both** Levi and Eve (not one only); premium-gated.
- Theme toggle is global; Signatur page must support both themes.
- Active-route center-zone link is `aria-current="page"`, `aria-disabled`, and `pointer-events-none`.
- Settings mode toggle is icons-only (Moon/Sun without inline text labels).
- Bazodiac wordmark visible on both desktop and mobile.

### Prohibited patterns

- Astro-Agents or Planetarium as text-labelled center-zone nav items (removed in v2).
- A 4th primary view beyond Dashboard / Signatur / Atlas without an explicit DEC amendment.
- Hiding the Atlas link entirely from free users (must be visible-but-gated for upgrade discovery).
- Surfacing only one of Levi/Eve from the Agents popup.
- Hamburger-only patterns on mobile.
- Left-anchored or sticky side guide-nav for desktop.
- Self-navigation enabled on the active center-zone link.
- Inline text labels next to the Settings mode-toggle icons.

# Depth Navigation V1 — Approved Concept

**Status**: Approved (2026-04-03)
**Implements**: TASK-depth-navigation → TASK-depth-nav-implement
**Requirement**: [REQ-F-depth-navigation](../../1-objectives/requirements/REQ-F-depth-navigation.md)
**Decisions applied**: [DEC-spiritual-tech-interactions](../../2-design/decisions/DEC-spiritual-tech-interactions.md)

---

## Concept: Z-Axis Navigation

The user moves **inward through layers**, not sideways. There is no horizontal carousel. Each depth level reveals more specificity:

```
Z-AXIS (front to back = surface to core)

  Surface ────────── Mid ──────────── Core
  Dashboard          Signatur         Detail views
  (daily state)      (living sig.)    (element, weekly,
                                       planetary depth)

  ◄─────────── Navigate OUTWARD (back) ──────────►
  ──────────── Navigate INWARD (forward) ─────────►
```

The metaphor: entering the cosmos. Dashboard = looking at the sky. Signatur = moving through the atmosphere. Detail views = touching the planet surface.

---

## Depth Layer Map

| Layer | Depth | Route(s) | Content |
|-------|-------|----------|---------|
| **Surface** | 0 | `/` | Dashboard — daily state, Tages-Energie, agents |
| **Mid** | 1 | `/signatur`, `/fu-ring` | Signatur — living ring visualization |
| **Core** | 2 | `/wu-xing`, `/weekly`, `/sky`, `/wissen/*` | Detail views — element depth, weekly, sky, articles |

Nav items (max 5 per DEC-spiritual-tech-interactions): **ATLAS** (Dashboard), **SIGNATUR**, **SKY**, **WOCHE**, **LEVI**

---

## Transition Animations

Per DEC-spiritual-tech-interactions: page transitions are 400ms ease-out.

### Inward (Surface → Mid → Core)

**Visual**: scale up + subtle forward push + slight fade-in of new layer

```
Current screen:                 New screen enters:
┌────────────┐                  ┌──────────────────┐
│  (scales   │  ──────────►     │  (grows from     │
│  slightly  │   400ms          │   center, full   │
│  smaller,  │   ease-out       │   opacity)       │
│  fades)    │                  └──────────────────┘
└────────────┘
```

**Motion spec** (Framer Motion):
```typescript
const inwardVariants = {
  initial: { scale: 1.04, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit:    { scale: 0.97, opacity: 0 },
  transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
}
```

### Outward (Core → Mid → Surface / Back)

**Visual**: reverse — new screen comes from behind (slightly smaller) and expands

```typescript
const outwardVariants = {
  initial: { scale: 0.97, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit:    { scale: 1.03, opacity: 0 },
  transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
}
```

### Direction Detection

The navigation direction (inward vs outward) is determined by comparing depth levels:

```typescript
const ROUTE_DEPTH: Record<string, number> = {
  '/':            0,   // Surface
  '/signatur':    1,   // Mid
  '/fu-ring':     1,   // Mid (alias)
  '/wu-xing':     2,   // Core
  '/weekly':      2,   // Core
  '/sky':         2,   // Core
  '/wissen':      2,   // Core (index)
  '/wissen/:slug': 2,  // Core (article)
  '/faq':         2,   // Core
};

// If newDepth > prevDepth → inward animation
// If newDepth < prevDepth → outward animation
// If same depth → fade (no scale)
```

---

## Navigation Structure

### Desktop (≥ 768px)

Horizontal nav with active underline. Max 5 items.

```
┌─────────────────────────────────────────────────────┐
│  ◈ Bazodiac    ATLAS  SIGNATUR  SKY  WOCHE  LEVI    │
│                  ~~~                                 │
│               (active underline: gold/bright)        │
└─────────────────────────────────────────────────────┘
```

- Active indicator: gold underline (dark mode) / amber-brown underline (bright mode)
- Underline grows left→right on activation (200ms)
- No dropdown submenus for primary nav

### Mobile (< 768px)

Top-down **drawer menu** (per DEC-spiritual-tech-interactions). No side hamburger.

```
┌────────────────────────┐
│  ◈ Bazodiac        ☰  │  ← tap to open drawer
└────────────────────────┘
        │ tap ☰
        ▼
┌────────────────────────┐
│  ◈ Bazodiac        ✕  │
├────────────────────────┤
│                        │
│    ATLAS               │  ← tapping any item navigates
│    SIGNATUR            │    and closes drawer
│    SKY                 │
│    WOCHE               │
│    LEVI                │
│                        │
└────────────────────────┘
```

Drawer animation: slides down from top, 300ms ease-out.

---

## Back Navigation

The browser back button (or an explicit back gesture) always navigates **outward** — toward Surface. No dead ends at Core level.

Rules:
- Every Core route can reach the Surface via back
- No route pushes to history in a loop
- The Signatur page back button returns to Dashboard
- Detail view back buttons return to Signatur (if arrived from there) or Dashboard

---

## Depth Indicator (Optional Enhancement)

A subtle depth indicator can be shown for orientation. Not required for V1 — document for consideration:

```
                              ○ ──── ○ ──── ●
                            Surface  Mid   Core
```

Small dots near the nav area, passive (not interactive). Requires user testing before shipping.

---

## Constraints

- CON-dark-luxury-aesthetic: all transitions use obsidian/gold palette — no bright flashes or white wipes
- All animations respect `prefers-reduced-motion`: substitute instant opacity fade when reduced motion is set
- Touch targets ≥ 44px (per DEC-design-system-v2)
- No more than 5 primary nav items

---

## Implementation Notes for TASK-depth-nav-implement

1. Add a `useNavigationDepth()` hook that tracks prev/current route depth.
2. Wrap `<Outlet />` in React Router with a `<AnimatePresence mode="wait">` block.
3. Pass the transition variant (inward/outward/lateral) via React context or a key prop.
4. Use `motion.div` from `motion/react` for the route wrapper.
5. The `ROUTE_DEPTH` map above is the source of truth — extend as new routes are added.
6. Mobile drawer: confirm the existing hamburger implementation or create `<DepthDrawer>` component.

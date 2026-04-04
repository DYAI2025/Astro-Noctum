# Runbook: S-DASH-LIVE Manual Testing

## Overview

Verify all features delivered in the S-DASH-LIVE sprint: navigation shell, Settings menu, identity cards, daily live data, Planetarium extraction, dashboard reorder, WCAG contrast, and bug fixes.

## Prerequisites

- Production deployment on Railway (latest `main`)
- A registered user account with astro profile data
- Desktop browser (Chrome/Firefox) + mobile viewport (375px via DevTools)
- Both Bright and Dark (Planetarium) modes tested

## Quick Start

```bash
# Local verification before production
npm run dev          # Vite on :3000
PORT=3001 node server.mjs  # Express API on :3001
```

---

## Test Scenarios

### 1. Navigation Shell

| # | Scenario | Expected | Pass? |
|---|----------|----------|-------|
| 1.1 | Top bar visible on desktop | 3 primary items: Astro-Agents, Planetarium, Signatur + Settings gear | |
| 1.2 | Top bar visible on mobile (375px) | All 3 items + Settings visible, touch targets >= 44px | |
| 1.3 | Click "Astro-Agents" | Scrolls to Agents section | |
| 1.4 | Click "Planetarium" | Scrolls to Planetarium / toggles mode | |
| 1.5 | Click "Signatur" | Navigates to /signatur | |

### 2. Settings Menu

| # | Scenario | Expected | Pass? |
|---|----------|----------|-------|
| 2.1 | Open Settings menu | DE/EN toggle, Dark/Bright, User Profile, Subscription, Logout, AGB, Datenschutz, sky.bazodiac.space | |
| 2.2 | Toggle DE/EN | UI language switches; page does not reload | |
| 2.3 | Toggle Dark/Bright | Theme switches immediately; all cards follow theme | |
| 2.4 | Click "sky.bazodiac.space" | Opens in new tab | |
| 2.5 | Click "Logout" | Signs out, redirects to auth screen | |

### 3. Planetarium (Top of Dashboard)

| # | Scenario | Expected | Pass? |
|---|----------|----------|-------|
| 3.1 | Page load | Planetarium is the first visual section below the header | |
| 3.2 | Aspect ratio | Canvas has ~16:10 ratio, not a thin strip; min-height ~360px | |
| 3.3 | Fullscreen button | Expands to fill viewport; sky/horizon fully visible, not clipped | |
| 3.4 | SkyMode toggle | "Birth Sky" / "Current Sky" toggle appears below Planetarium in dark mode | |
| 3.5 | Switch to Current Sky | Orrery shows current date/time positions (verify against stellarium.org) | |

### 4. Identity Cards (Big Four + Wu-Xing)

| # | Scenario | Expected | Pass? |
|---|----------|----------|-------|
| 4.1 | All 5 cards rendered | Sun Sign, Moon Sign, Ascendant, Year Animal, Wu-Xing Element | |
| 4.2 | Values not empty | Each card shows the user's actual sign/animal/element, not "—" | |
| 4.3 | Fallback state | Logout → new user without profile → all cards show "—" | |
| 4.4 | Card labels readable | Labels have sufficient contrast (opacity >= 0.65) | |
| 4.5 | Icons rendered | Animated SVG icons (not emoji) for each card | |

### 5. MiniSignature Tile

| # | Scenario | Expected | Pass? |
|---|----------|----------|-------|
| 5.1 | Label text | Shows "Deine Signatur" (DE) / "Your Signature" (EN), NOT "Deine Form" | |
| 5.2 | Data loaded | V3 Signatur canvas renders inside the circular frame | |
| 5.3 | No data fallback | If soulprint missing: "Signatur nicht verfügbar" (not infinite pulse) | |
| 5.4 | Click tile | Navigates to /signatur with Z-axis inward transition | |
| 5.5 | Pause toggle | Click pause → "Pausiert" text, canvas stops; click again → resumes | |
| 5.6 | Button contrast | Pause/expand buttons visible (opacity >= 0.50) | |

### 6. Daily Pulse / Tages-Impuls

| # | Scenario | Expected | Pass? |
|---|----------|----------|-------|
| 6.1 | Section renders | DashboardTagesEnergie card visible with element icon + headline + body | |
| 6.2 | Kosmoswetter pills | Weather pills visible (Magnetsturm, Flare, etc. if active) | |
| 6.3 | "Vertiefen" button | Opens DayModeModal with full day trace | |

### 7. Vibe CTA

| # | Scenario | Expected | Pass? |
|---|----------|----------|-------|
| 7.1 | Button visible | "Vibe abrufen" button centered between TagesImpuls and Influences | |
| 7.2 | Click button | Fetches vibe data, opens VibesModal with 3-level output | |
| 7.3 | Cooldown | After fetch: shows remaining cooldown timer | |
| 7.4 | Error state | If API fails: "Vibe konnte nicht geladen werden" (not silent) | |

### 8. Influence Gauges + Cosmic Influence

| # | Scenario | Expected | Pass? |
|---|----------|----------|-------|
| 8.1 | Gauges render | Mars, Jupiter, Venus, Saturn bars with live percentage values | |
| 8.2 | Cosmic Influence | Kp index + Solar Pressure gauges with G-scale badge | |
| 8.3 | Tooltips | Hover on gauge → tooltip explains the planet/metric | |
| 8.4 | Contrast (dark mode) | Labels zinc-300, percentages readable (not zinc-500) | |
| 8.5 | Grouped layout | Both sections appear as a tight cluster (gap-6, not gap-12/20) | |

### 9. Dashboard Section Order

| # | Scenario | Expected | Pass? |
|---|----------|----------|-------|
| 9.1 | Scroll order | Planetarium → Identity+Signatur → TagesImpuls → Vibe → Influences → Blueprint → Agents → Upgrade → Interpretation | |
| 9.2 | Spacing | Sections are 48px apart (gap-12), not 80px (gap-20) | |
| 9.3 | Width alignment | All sections flush to the same max-width column | |

### 10. WCAG Contrast Verification

| # | Scenario | Expected | Pass? |
|---|----------|----------|-------|
| 10.1 | Dark mode text | All text readable; no opacity < 0.50 on interactive elements | |
| 10.2 | Bright mode cards | All cards follow bright theme; no dark-only cards remaining | |
| 10.3 | Agent section (bright) | cosmic-tile styling, not dark gradient backgrounds | |

### 11. Bug Fix Verification

| # | Scenario | Expected | Pass? |
|---|----------|----------|-------|
| 11.1 | Inline validation (BirthForm) | Submit empty form → inline German error messages, no alert() | |
| 11.2 | Daily cache rotation | Check at midnight → Day-Pulse text changes (new date key) | |
| 11.3 | Signatur tile not stuck | After page load: tile shows canvas or "nicht verfügbar", not forever "wird berechnet" | |

---

## Completion

- [ ] All scenarios pass on Desktop Chrome
- [ ] All scenarios pass on Mobile viewport (375px)
- [ ] All scenarios pass in Bright Mode
- [ ] All scenarios pass in Dark (Planetarium) Mode
- [ ] Screenshot evidence for any failures (attach to GitHub issue)

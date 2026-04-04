# Runbook: Phase E — Autopoietic UX Manual Testing

## Overview

Verify all Phase E capabilities: Z-axis depth navigation, Wu-Xing element UI adaptation, and progressive fluidity based on quiz cluster completion.

## Prerequisites

- Production deployment on Railway (latest `main`) or local dev
- A registered user account with astro profile data (including Wu-Xing dominant element)
- Desktop browser (Chrome/Firefox) + mobile viewport (375px via DevTools)
- Access to browser DevTools for `prefers-reduced-motion` simulation
- Both 0-cluster and 1+-cluster user states (or ability to complete a quiz cluster)

## Quick Start

```bash
# Local verification
npm run dev          # Vite on :3000
PORT=3001 node server.mjs  # Express API on :3001
```

---

## Test Scenarios

### 1. Depth Navigation — Z-Axis Transitions

| # | Scenario | Expected | Pass? |
|---|----------|----------|-------|
| 1.1 | Navigate Dashboard → Signatur (`/signatur`) | Inward transition: current page scales down slightly (0.97), new page enters from slightly larger (1.04→1.0). 400ms ease-out. | |
| 1.2 | Navigate Signatur → Wu-Xing (`/wu-xing`) | Inward transition (depth 1→2): same scale pattern as 1.1 | |
| 1.3 | Navigate Wu-Xing → Dashboard (back button) | Outward transition: current page scales up slightly (1.03), new page enters from slightly smaller (0.97→1.0) | |
| 1.4 | Navigate Dashboard → Weekly (`/weekly`) | Inward transition (depth 0→2): skip mid, still inward direction | |
| 1.5 | Navigate within same depth level (e.g., `/wu-xing` → `/weekly`) | Lateral transition: opacity fade only, no scale | |
| 1.6 | Browser back button from any Core page | Outward transition back toward Surface | |
| 1.7 | Mobile (375px): Dashboard → Signatur | Same transition animations as desktop, properly contained in viewport | |

### 2. Depth Navigation — Reduced Motion

| # | Scenario | Expected | Pass? |
|---|----------|----------|-------|
| 2.1 | Enable `prefers-reduced-motion: reduce` in DevTools | All depth transitions become opacity-only fade (no scale) | |
| 2.2 | Navigate Dashboard → Signatur with reduced motion | Fade transition only, 400ms | |
| 2.3 | Navigate back with reduced motion | Fade transition only, no scale | |

### 3. Wu-Xing Element UI Adaptation

| # | Scenario | Expected | Pass? |
|---|----------|----------|-------|
| 3.1 | Load Dashboard with user who has dominant element (e.g., "Fire") | `body[data-element="fire"]` attribute is set | |
| 3.2 | Check CSS custom properties | `--element-accent` is set to the element's color (Fire=red, Water=blue, Wood=green, Metal=silver, Earth=amber) | |
| 3.3 | Check `--ui-transition-*` tokens | Transition speed varies by element (Fire=faster, Earth=slower) | |
| 3.4 | Verify card glow effect | Cards with `.cosmic-tile` show element-colored subtle glow | |
| 3.5 | User with no dominant element | Fallback accent applied; no errors in console | |
| 3.6 | Switch between pages | Element theme persists across navigation | |

### 4. Progressive Fluidity — Tier 0 (0 Clusters)

| # | Scenario | Expected | Pass? |
|---|----------|----------|-------|
| 4.1 | Open `/signatur` with 0 completed quiz clusters | Back button has full label text ("Zurueck" / "Back"), standard size (text-xs, px-3 py-1.5) | |
| 4.2 | Verify ring container | No breathing animation on the ring wrapper — static container | |
| 4.3 | All navigation | Fully conventional — labeled buttons, explicit indicators, standard tap targets | |

### 5. Progressive Fluidity — Tier 1 (1-5 Clusters)

| # | Scenario | Expected | Pass? |
|---|----------|----------|-------|
| 5.1 | Complete one full quiz cluster, then open `/signatur` | Back button shrinks to icon-only (ArrowLeft, no text label), smaller size (px-2 py-1) | |
| 5.2 | Verify ring breathing | Ring container has subtle 0.5% scale breathing animation (6s cycle, easeInOut). Very subtle — watch closely. | |
| 5.3 | Verify back button is still functional | Icon-only back button navigates to Dashboard on click | |
| 5.4 | Verify accessibility | Back button retains `aria-label` for screen readers despite missing visible text | |

### 6. Progressive Fluidity — Tier 2 (6 Clusters)

| # | Scenario | Expected | Pass? |
|---|----------|----------|-------|
| 6.1 | Complete all 6 quiz clusters, then open `/signatur` | Same as Tier 1 for now (Tier 2 differentiation deferred to S-UX-DEPTH sprint) | |
| 6.2 | Verify `useFluidityLevel` returns tier 2 | In React DevTools, check hook state: `{ tier: 2, completedClusters: 6, reducedMotion: false }` | |

### 7. Progressive Fluidity — Reduced Motion Override

| # | Scenario | Expected | Pass? |
|---|----------|----------|-------|
| 7.1 | Enable `prefers-reduced-motion: reduce` with 3+ completed clusters | Fluidity forced to Tier 0: full back button label shown, no ring breathing | |
| 7.2 | Disable `prefers-reduced-motion` | Fluidity returns to appropriate tier based on cluster count | |

### 8. Fluidity Persistence

| # | Scenario | Expected | Pass? |
|---|----------|----------|-------|
| 8.1 | Complete a quiz cluster, navigate away, return to `/signatur` | Fluidity tier reflects the new cluster count without app restart | |
| 8.2 | Reload the page after completing a cluster | Fluidity tier persists (quiz completion is in localStorage + Supabase) | |

---

## Key Files

| Feature | Primary File(s) |
|---------|-----------------|
| Depth navigation hook | `src/hooks/useNavigationDepth.ts` |
| Route transitions | `src/router.tsx` (AnimatePresence + variants) |
| Element theme hook | `src/hooks/useElementTheme.ts` |
| Fluidity level hook | `src/hooks/useFluidityLevel.ts` |
| Fluidity UI application | `src/pages/FuRingPage.tsx` (back button + ring breathing) |
| Cluster definitions | `src/lib/fusion-ring/clusters.ts` |
| Completed modules | `src/hooks/useCompletedModules.ts` |

## Rollback

If depth transitions cause motion sickness reports or visual glitches:
1. Set `prefers-reduced-motion` media query to override all scale transitions → fade-only
2. If fluidity breathing causes WebGL issues: remove `motion.div` wrapper around ring in FuRingPage.tsx (revert to plain `div`)

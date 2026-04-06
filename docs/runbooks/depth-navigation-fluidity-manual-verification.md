# Z-Axis Depth Navigation & Progressive Fluidity — Manual Verification Runbook

Covers: depth transitions (inward/outward), 400ms timing, fluidity tier progression at 0/1/6 clusters, prefers-reduced-motion.

## Prerequisites

```bash
npm run dev   # Terminal 1 — Vite on :3000
PORT=3001 node server.mjs   # Terminal 2 — Express API on :3001
```

Log in with a test account. Use Chrome DevTools to simulate `prefers-reduced-motion` (Rendering panel → Emulate CSS media feature).

---

## Section 1 — Depth Transitions: Inward (Surface → Mid → Core)

### 1.1 Dashboard → Signatur (Surface → Mid)

1. Navigate to Dashboard (`/`).
2. Click the Signatur nav item or the Signatur tile on Dashboard.

**Expected:**
- Page transitions with a zoom-in effect (entering page scales from 1.04 → 1, opacity 0 → 1).
- The outgoing Dashboard scales slightly down and fades out (scale → 0.97, opacity → 0).
- Duration is approximately 400ms — smooth, not jarring.
- No bright flash or harsh cut.

### 1.2 Signatur → Core (Mid → Core, e.g. /weekly)

1. From Signatur (`/signatur`), navigate to Weekly Insights (`/weekly`).

**Expected:**
- Same zoom-in depth push as 1.1 — entering page scales from 1.04 → 1.
- Outgoing Signatur scales to 0.97 and fades out.

---

## Section 2 — Depth Transitions: Outward (back navigation)

### 2.1 Core → Mid (e.g. /weekly → /signatur)

1. From Weekly Insights (`/weekly`), navigate back to Signatur.

**Expected:**
- Outward transition: entering page scales from 0.97 → 1 (slightly smaller → normal).
- Outgoing page scales from 1 → 1.03 and fades (zooms away from user).
- Same 400ms duration.

### 2.2 Mid → Surface (/signatur → /)

1. From Signatur, navigate back to Dashboard.

**Expected:**
- Same outward (zoom-out) transition.
- Dashboard scales in from 0.97, Signatur zooms away.

---

## Section 3 — Lateral Navigation (same depth level)

### 3.1 Core → Core (e.g. /weekly → /sky)

1. From Weekly Insights, navigate to Sky.

**Expected:**
- Fade-only transition (no scale change) — lateral navigation.
- Duration approximately 400ms, opacity 0 → 1.

---

## Section 4 — Transition Timing

### 4.1 Desktop (≥768px) — 400ms ease-out

Observe the transitions in Sections 1 and 2 on a desktop viewport.

**Expected:**
- Duration is visually ~400ms.
- Easing is ease-out (fast start, gradual end) — `cubic-bezier(0.4, 0, 0.2, 1)`.
- Not too slow (feels laggy), not too fast (feels abrupt).

---

## Section 5 — prefers-reduced-motion

### 5.1 Enable reduced motion

In Chrome DevTools: Rendering → Emulate CSS media feature → `prefers-reduced-motion: reduce`.

Navigate between Dashboard, Signatur, and Weekly.

**Expected:**
- No scale animation — transitions use fade-only (opacity 0 → 1).
- Fluidity tier is forced to 0 (conventional UI) regardless of cluster count.
- Signatur ring shows no pulse animation.

---

## Section 6 — Fluidity Tier Progression

### 6.1 Tier 0 — 0 completed clusters (new user)

Use a fresh account or reset quiz progress in the database.

Navigate to Signatur (`/signatur`).

**Expected:**
- Back button shows text label (e.g., "Zurück") alongside the arrow icon.
- No ring pulse animation (ring is static).
- ClusterSidebar shows conventional labels.

### 6.2 Tier 1 — ≥1 completed cluster

Complete one full quiz cluster (e.g., Naturkind — 4 quizzes).

Navigate to Signatur.

**Expected:**
- Back button: arrow icon only, text label hidden.
- Ring has a gentle pulse animation (scale breathes between 1 and 1.005, 6s cycle).
- UI feels slightly more gestural.

### 6.3 Tier 2 — All 6 clusters completed

Complete all 6 clusters. Navigate to Signatur.

**Expected:**
- Same affordances as Tier 1 (full gesture-based nav is extensible; current implementation matches Tier 1 visual).
- `fluidityLevel.tier === 2` in React DevTools.

### 6.4 prefers-reduced-motion overrides fluidity

With 6 clusters complete and reduced motion enabled, navigate to Signatur.

**Expected:**
- Back button shows text label (Tier 0 behavior).
- No ring pulse animation.

---

## Section 7 — Automated Test Confirmation

```bash
npx vitest run src/__tests__/depth-navigation.test.tsx     # 14 tests
npx vitest run src/__tests__/useFluidityLevel.test.ts      # 10 tests
npm run test                                                # full suite
```

All must pass before sign-off.

---

## Sign-Off Checklist

| # | Scenario | Status |
|---|----------|--------|
| 1.1 | Dashboard→Signatur zoom-in (scale 1.04→1) | |
| 1.2 | Signatur→Core zoom-in | |
| 2.1 | Core→Mid zoom-out (scale 0.97→1 enter) | |
| 2.2 | Mid→Surface zoom-out | |
| 3.1 | Core→Core fade-only (lateral) | |
| 4.1 | 400ms ease-out timing correct on desktop | |
| 5.1 | prefers-reduced-motion → fade-only, no scale | |
| 6.1 | Tier 0 (0 clusters) — labeled back button, no ring pulse | |
| 6.2 | Tier 1 (≥1 cluster) — back icon only, ring pulse | |
| 6.3 | Tier 2 (6 clusters) — tier 2 active | |
| 6.4 | Reduced motion overrides fluidity tier | |
| — | `npm run test` all green | |

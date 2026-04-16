# Nav Review Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Apply two small follow-up fixes from the code review of TASK-qa-nav-restructure-zones + TASK-qa-nav-active-route-highlight: (1) replace the placeholder `B` glyph in the mobile Dashboard link with a proper icon; (2) remove dead focus-ring styling from the disabled wordmark spans.

**Architecture:** Minimal edits to `src/App.tsx` only. No new components, no new deps (lucide-react `Home` is already tree-shakable and used elsewhere). No i18n changes. No tests added — nav test coverage is tracked under the separate sprint task `TASK-qa-nav-tests`.

**Tech Stack:** React 19, lucide-react icons, Tailwind v4.

**Deferred:** Icon-parity on desktop center-zone links (Dashboard icon-less, Signatur has `OrbitIcon`). Left for design review — not in scope.

---

## Task 1: Replace mobile Dashboard `B` glyph with `Home` icon

**Files:**
- Modify: `src/App.tsx:24` (lucide-react imports)
- Modify: `src/App.tsx:~635-640` (mobile center-zone Dashboard render)

**Step 1: Add `Home` to the lucide-react import**

Change line 24 from:

```tsx
import { Volume2, VolumeX, Settings, X, Moon, Sun } from "lucide-react";
```

to:

```tsx
import { Volume2, VolumeX, Settings, X, Moon, Sun, Home } from "lucide-react";
```

**Step 2: Swap the placeholder `<span>B</span>` for `<Home />`**

Locate the mobile bottom-nav `centerLinks.map` block (around L635). Replace:

```tsx
{link.to === "/signatur" ? (
  <OrbitIcon className="w-5 h-5" aria-hidden="true" />
) : (
  <span className="font-serif text-base leading-none text-gold-deep" aria-hidden="true">B</span>
)}
```

with:

```tsx
{link.to === "/signatur" ? (
  <OrbitIcon className="w-5 h-5" aria-hidden="true" />
) : (
  <Home className="w-5 h-5" aria-hidden="true" />
)}
```

**Step 3: Typecheck**

Run: `npm run lint`
Expected: `EXIT=0`, no TypeScript errors.

**Step 4: Visual smoke**

Run: `npm run dev` → open `http://localhost:3000/sky` (any non-Dashboard route) on a 375px mobile viewport in DevTools.
Expected: mobile bottom-nav shows a house icon labelled "Tageschart" (DE) / "Dashboard" (EN) in the leftmost slot instead of a serif "B".

---

## Task 2: Strip dead focus-ring classes from disabled wordmark spans

**Files:**
- Modify: `src/App.tsx:~435` (desktop disabled wordmark)
- Modify: `src/App.tsx:~566` (mobile disabled wordmark)

**Rationale:** The two `<span>` elements render when `isDashboardActive === true`. Both carry `tabIndex={-1}` and `pointer-events-none`, so they can never receive keyboard focus → the `focus-visible:ring-*` and `rounded-sm` classes are unreachable. Dead styling invites confusion during future edits.

**Step 1: Desktop wordmark — simplify className**

Change:

```tsx
<span
  className="font-serif text-xl tracking-widest text-gold-deep select-none pointer-events-none outline-none focus-visible:ring-2 focus-visible:ring-gold-deep/60 rounded-sm"
  aria-current="page"
  aria-disabled="true"
  tabIndex={-1}
  aria-label={t("nav.dashboard")}
>
  Bazodiac
</span>
```

to:

```tsx
<span
  className="font-serif text-xl tracking-widest text-gold-deep select-none pointer-events-none"
  aria-current="page"
  aria-disabled="true"
  aria-label={t("nav.dashboard")}
>
  Bazodiac
</span>
```

Note: `tabIndex={-1}` is also redundant on a non-interactive `<span>` (not in tab order by default) — dropped for the same reason.

**Step 2: Mobile wordmark — apply the same simplification**

Change:

```tsx
<span
  className="font-serif text-lg tracking-widest text-gold-deep select-none pointer-events-none outline-none focus-visible:ring-2 focus-visible:ring-gold-deep/60 rounded-sm"
  aria-current="page"
  aria-disabled="true"
  tabIndex={-1}
  aria-label={t("nav.dashboard")}
>
  Bazodiac
</span>
```

to:

```tsx
<span
  className="font-serif text-lg tracking-widest text-gold-deep select-none pointer-events-none"
  aria-current="page"
  aria-disabled="true"
  aria-label={t("nav.dashboard")}
>
  Bazodiac
</span>
```

**Step 3: Typecheck**

Run: `npm run lint`
Expected: `EXIT=0`.

**Step 4: a11y smoke**

Run: `npm run dev` → open `http://localhost:3000/` with DevTools a11y tree open.
Expected: wordmark node announces as "Bazodiac, current page, dimmed" (or locale equivalent). No regressions on non-Dashboard routes (wordmark remains a `<Link>` and is keyboard-focusable with gold focus-ring visible on Tab).

---

## Task 3: Commit

**Step 1: Stage both edits**

```bash
git add src/App.tsx
```

**Step 2: Commit**

```bash
git commit -m "fix(nav): replace B glyph with Home icon, strip dead focus-ring on disabled wordmark

Follow-ups from code review of TASK-qa-nav-restructure-zones:
- Mobile Dashboard link uses lucide Home icon instead of placeholder B
- Disabled wordmark spans drop unreachable focus-visible classes and tabIndex=-1

Icon-parity on desktop center-zone links deferred to design review."
```

Expected: single commit touching `src/App.tsx`.

---

## Deferred (not in this plan)

**Desktop center-zone icon parity** — Dashboard has no icon, Signatur has `OrbitIcon`. Either add `<Home />` to the Dashboard link for symmetry, or drop `<OrbitIcon />` from the Signatur link for text-only parity. Requires a taste call; route via design review before implementing.

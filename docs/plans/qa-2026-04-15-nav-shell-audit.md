# Nav-Shell Audit — Sprint S-QA-2026-04-15

**Task**: TASK-qa-nav-shell-audit
**Requirement**: [REQ-F-navigation-redesign](../../1-objectives/requirements/REQ-F-navigation-redesign.md)
**Goal**: [GOAL-navigation-app-shell-consistency](../../1-objectives/goals/GOAL-navigation-app-shell-consistency.md)
**Decision**: [DEC-navigation-shell](../../2-design/decisions/DEC-navigation-shell.md)
**Date**: 2026-04-15

## Scope

Audit the current navigation shell (desktop top-bar + mobile bottom-nav + Settings menu) against DEC-navigation-shell and the 6 acceptance criteria in REQ-F-navigation-redesign. Feed Phase-1 tasks (TASK-qa-nav-active-route-highlight, -dashboard-link-consistent, -mode-toggle-distinct, -agents-expose-both, -mobile-375, -tests).

## Where the Nav Actually Lives

The production nav shell is **inline in `src/App.tsx`** (lines ~420-644), not a dedicated component:

| Element | Location | Scope |
|---------|----------|-------|
| Desktop header | `src/App.tsx` L423-527 (`<header className="hidden md:flex fixed top-0 …">`) | Global, hidden on `/onboarding` |
| Mobile bottom-nav | `src/App.tsx` L579-643 (`<nav className="md:hidden fixed bottom-0 …">`) | Global, hidden on `/onboarding` |
| Settings menu | `src/components/navigation/SettingsMenu.tsx` | Reused by both |
| `navItemClass` / `mobileNavItemClass` helpers | `src/App.tsx` L404-412 | Active-state styling |

**Because the shell is global and route-driven via `useLocation()`, structural per-page inconsistency is impossible.** All findings below therefore concern the single shared shell — not page-by-page divergence. This materially simplifies the remaining Phase-1 work (no per-page fork to merge).

### Dead / Unused Code

These exist but are **not mounted** anywhere in the runtime tree:

- `src/components/navigation/NavSidebarA.tsx` (left sticky sidebar exploration)
- `src/components/navigation/NavVariantA.tsx`, `NavVariantB.tsx`, `NavVariantC.tsx`
- `src/__tests__/navigation-variants.test.tsx` (tests for the unused variants)
- i18n keys `nav.sidebar.*` in `packages/shared/src/i18n/translations.ts`

DEC-navigation-shell explicitly prohibits a left/sticky side-nav ("scope not approved"). Recommended action: delete these during Phase-1 cleanup (handled under TASK-qa-nav-tests or as a bonus in TASK-qa-nav-shell-audit itself — flagged here, not executed, to keep this task strictly an audit).

## Per-Criterion Findings

### AC1 — "Dashboard"/"Tageschart" link visible on every page

DEC-navigation-shell's three primary items are **Astro-Agents, Planetarium, Signatur** — there is **no explicit Dashboard item**. The only path back to `/` is the "Bazodiac" wordmark at the top-left (`App.tsx:424-429`). On mobile there is **no wordmark at all** — only the 4-item bottom nav (Agents, Planetarium, Signatur, Settings). A user on `/wissen`, `/wu-xing`, `/sky`, or `/weekly` on mobile has **no labelled "Zurück zum Dashboard" affordance**.

**Gap**: QA-6 / QA-19. Wordmark ≠ recognisable Dashboard link; mobile has none.
**Feeds**: TASK-qa-nav-dashboard-link-consistent.
**Note for that task**: DEC-navigation-shell locks the 3-primary-item rule. Adding a 4th primary item requires Ben's explicit approval — the audit recommends **either** (a) adding "Tageschart/Dashboard" as a 4th primary and updating DEC-navigation-shell, **or** (b) adding an explicit home-icon button distinct from the wordmark in the top-left that is also present on mobile. Option (b) stays within the decision's letter; option (a) matches GOAL success criterion 1 more literally but needs a DEC amendment. **→ raise to Ben in TASK-qa-nav-dashboard-link-consistent.**

### AC2 — Active nav tab highlighted and non-clickable on current route

Active state is currently **visual-only**:
- Desktop: `navItemClass(active)` applies `text-gold-deep border-current` when active (L404-407). No `aria-disabled`, no pointer-events gating.
- Mobile: `mobileNavItemClass(active)` applies `text-gold-deep` (L409-412). Same gap.
- Only the Signatur `<Link>` (L457-463, L606-612) actually targets a route; clicking while already on `/signatur` triggers a React-Router self-navigation (no-op visually but dispatches a history event and re-scrolls).

**Gap**: QA-20, QA-21. Active state is non-interactive only visually — the element remains keyboard-focusable and clickable.
**Feeds**: TASK-qa-nav-active-route-highlight.
**Recommendation**: introduce a shared `NavLinkItem` component (or extend `navItemClass` with an `aria-current` + `pointer-events-none` + `tabIndex={-1}` branch when `active`). Keep the gold underline for affordance but suppress click/focus behaviour. Applies identically to desktop and mobile.

### AC3 — Planetarium/Solar-System toggle not confusable with navigation

The Planetarium button is styled with **the same `navItemClass`** as the real nav links (`App.tsx:450`, `:599`). It uses `aria-pressed` (correct for a toggle) but visually is indistinguishable from Astro-Agents and Signatur. Users have no visual cue that this button changes **theme**, not **route**.

**Gap**: QA-16. Toggle looks like a nav item; user confusion reported.
**Feeds**: TASK-qa-nav-mode-toggle-distinct.
**Recommendation**: remove Planetarium from the primary top-bar as a labelled text button; move it entirely into SettingsMenu where the Moon/Sun toggle already exists (L94-123). The DEC-navigation-shell "3 primary items" rule lists Planetarium, but also says it is an "indirect dark/bright mode context toggle" — raise this tension to Ben in TASK-qa-nav-mode-toggle-distinct (the decision may need updating, or the top-bar entry must remain but be re-styled with a `aria-pressed` ring/badge that clearly signals toggle-not-link).

### AC4 — Settings mode toggle: icons only, no redundant text

In `SettingsMenu.tsx` L104-121 the mode toggle renders **both** a Moon/Sun icon **and** the text labels "Planetarium" / "Solar System" inside each button. GOAL criterion 4 explicitly says "Icons allein (Moon/Sun) ohne redundanten Text".

**Gap**: matches GOAL success criterion 4 (and reinforces QA-16).
**Feeds**: TASK-qa-nav-mode-toggle-distinct.
**Recommendation**: strip the inline text labels; rely on `title="Planetarium — Dark Luxury"` / `title="Solar System — Bright"` (already present) plus `aria-label` for a11y. Keep the surrounding "Modus" row label for context.

### AC5 — Astro-Agents exposes both Levi + Eve

The button `onClick={() => setWidgetExpanded(true)}` (L433-445) expands a single widget. The code in App.tsx does not visibly branch to show two agent tiles — investigating the widget is out of scope for this audit but flagged for the follow-up task. The `agentActive` state is used for visual cue but does not indicate which agent.

**Gap**: QA-22. Unable to verify from nav-shell alone whether both agents are surfaced.
**Feeds**: TASK-qa-nav-agents-expose-both.
**Note for that task**: the audit recommends that TASK-qa-nav-agents-expose-both **begin with** a 10-minute read of whatever `widgetExpanded` renders (likely `AgentWidget` or `VoiceWidget`) and confirm both Levi and Eve entry points are reachable. If only one is surfaced, the fix is in that widget — not in the nav shell.

### AC6 — 375px mobile: all primary items + Settings visible without overflow

Mobile bottom nav (L579): 4 items × `min-w-[48px]` = 192px intrinsic width, plus `px-2` padding and `justify-around` distribution across `w-full`. On a 375px viewport there is ample room (≈183px of flex slack). The `text-[9px] uppercase tracking-tight` labels plus 20px icons fit the 64px-high bar.

**Likely green**, but a real 375px device screenshot + DOM overflow check is required by the REQ acceptance criterion.
**Feeds**: TASK-qa-nav-mobile-375 (verification task, low risk of rework).

## Cross-Criterion Observations

1. **Keyboard a11y**: The top-bar `<button>`s for Astro-Agents and Planetarium lack visible focus rings in the audited code. Not in scope of REQ-F-navigation-redesign ACs but adjacent to AC2 when `aria-disabled` is introduced. **Flag for TASK-qa-nav-active-route-highlight** to include focus-visible styles.
2. **`isSignaturRoute` padding exception**: `App.tsx:401, 564` uses a special `pt-4 md:pt-24` on `/signatur`. Not a nav-shell issue but future nav-height changes must remember this constant to avoid overlap regressions.
3. **Onboarding hides the nav entirely** (L422, L578). Expected per DEC — no gap.

## Summary Table (for downstream tasks)

| AC | Finding | Downstream Task |
|----|---------|-----------------|
| AC1 | No Dashboard link on mobile; desktop only wordmark | TASK-qa-nav-dashboard-link-consistent — requires Ben's sign-off on DEC amendment vs. icon-button approach |
| AC2 | Active state visual-only; still clickable / focusable | TASK-qa-nav-active-route-highlight — introduce `aria-current="page" + aria-disabled + pointer-events-none` branch |
| AC3 | Planetarium toggle styled as nav link | TASK-qa-nav-mode-toggle-distinct — decide with Ben: remove from primary bar vs. restyle as toggle-badge |
| AC4 | SettingsMenu mode toggle has redundant text labels | TASK-qa-nav-mode-toggle-distinct — icon-only |
| AC5 | Single-button Astro-Agents; both-agents exposure unverified | TASK-qa-nav-agents-expose-both — inspect expanded widget first |
| AC6 | Bottom nav fits 375px intrinsically | TASK-qa-nav-mobile-375 — verify via screenshot + resize test |

## Open Questions for Ben (surface before Phase-1 execution)

1. **DEC-navigation-shell amendment?** Three options: (a) add Dashboard as 4th primary item and amend DEC; (b) keep 3 primaries, add an unlabelled home-icon button; (c) accept the wordmark as the Dashboard affordance but make it visible on mobile too. Audit recommends (b) as the minimal-change path.
2. **Planetarium: primary nav item or Settings-only?** DEC lists it among the 3 primaries, but GOAL + QA-16 treat it as a settings-class theme toggle. Removing it would violate DEC as-is; keeping it requires strong visual differentiation.

Both questions are raised inside their respective downstream tasks — this audit does not resolve them.

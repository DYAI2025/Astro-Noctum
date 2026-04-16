# DEC-navigation-shell — History

## v1 — 2026-04-02

**Change**: Initial decision recorded.

**Trigger**: Open question Q1 (desktop nav scope: horizontal-replace vs. in-page guide) resolved by Ben.

**Decision maker**: human-decided

**Summary**: Top bar preserved as horizontal scrolling nav with 3 primary items (Astro-Agents, Planetarium, Signatur). All utility items consolidated under Settings. Mobile responsive required for all primary items. Supersedes stale nav item list in DEC-spiritual-tech-interactions.

## v2 — 2026-04-15

**Change**: Restructured top bar into three zones (left brand / center contextual primary-view links / right icon-only utilities). Added Atlas as a third primary view (premium-gated, behind `atlas_v1` flag until S-ATLAS sprint). Removed Astro-Agents and Planetarium as text-nav items — Agents becomes a symbol-only popup trigger (premium-gated, surfaces both Levi + Eve), Planetarium becomes a symbol-only Moon/Sun toggle (also kept in Settings for discoverability). Settings mode toggle icons-only (no redundant text). Bazodiac wordmark now mandatory on mobile too. Active center-zone links must be `aria-disabled` + `pointer-events-none`. Signatur page must respect global `planetariumMode` (was hard-coded dark).

**Trigger**: QA Sprint S-QA-2026-04-15 findings (QA-6 missing Dashboard link, QA-16 Planetarium-as-nav-link confusion, QA-19 mobile Dashboard reachability, QA-20/21 active-state non-disabled, QA-22 Astro-Agents single-agent exposure) plus product roadmap addition of the Atlas deep-dive view.

**Decision maker**: human-decided (Ben in chat 2026-04-15)

**Summary**: Center zone is contextual — shows only the primary-view links the user is *not* currently on. Right zone is icon-only utility buttons. Atlas is the third primary view (Premium, deferred to S-ATLAS sprint, name confirmed by Ben). Theme behavior remains global, but Signatur must now support both modes.

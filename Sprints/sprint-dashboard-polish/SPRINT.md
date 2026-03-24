# Sprint: Dashboard Polish & Navigation

**Sprint ID:** S-DASH-POLISH
**Sprint Goal:** Das Dashboard wird production-ready: Ghost UI entfernen, Navigation überarbeiten, Planetarium aufwerten, Detailansicht aufbauen, Levi-Layer fixen.
**TRUE_NORTH Check:** "Bringt das den Organismus näher an sein Atmen?" — Ja. Ein kaputtes Dashboard verhindert, dass der Nutzer seinen Ring als lebendiges Objekt wahrnimmt. Ghost UI zerstört Vertrauen. Broken i18n verletzt CON-german-ui.

**Estimated Scope:** 19 Tasks (11 Bugs + 8 Features)
**Constraints:** CON-german-ui, CON-dark-luxury-aesthetic, BRANDVOICE.md

---

## Sprint Backlog

### Work Package 1: Ghost UI Cleanup (BUG-07, BUG-08, BUG-09, BUG-14)

**Goal:** Remove all UI elements that were never specified.

| ID | Task | File(s) | Acceptance Criteria | Status |
|----|------|---------|---------------------|--------|
| S-DP-01 | Remove "Tour wiederholen" and "Zahlung verwalten" from Dashboard top-right menu | `src/components/Dashboard.tsx` | Menu no longer shows these two options. No console errors. | Pending |
| S-DP-02 | Remove "Neustarten" button — no restart function exists | `src/components/Dashboard.tsx` | Button gone. No orphaned event handlers remain. | Pending |
| S-DP-03 | Remove redundant reload button in "dein Bazodiac" heading | `src/components/Dashboard.tsx` | Only the browser's native refresh is available. Heading displays cleanly. | Pending |
| S-DP-04 | Remove "KI-Synthese" heading — never specified in design | `src/components/Dashboard.tsx` or `src/components/dashboard/BlueprintCard.tsx` | Heading no longer rendered. Section either removed or replaced per design. | Pending |

**Agent Instructions:** Search Dashboard.tsx and its child components for the strings "Tour wiederholen", "Zahlung verwalten", "Neustarten", "KI-Synthese". Remove the elements. Verify no dead code remains. Run `npm run lint` after changes.

---

### Work Package 2: i18n & Copy Fixes (BUG-10, BUG-13)

**Goal:** All user-facing text in German. No placeholder text. No mixed DE/EN.

| ID | Task | File(s) | Acceptance Criteria | Status |
|----|------|---------|---------------------|--------|
| S-DP-05 | Replace "Your Bazaar Blueprint" placeholder with correct German copy in Kosmischer Blueprint section | `src/components/dashboard/BlueprintCard.tsx`, `src/i18n/translations.ts` | Text reads "Kosmischer Blueprint" (or equivalent per BRANDVOICE.md). No English placeholder visible. | Pending |
| S-DP-06 | Fix Cosmic Blueprint DE/EN language inconsistency — heading and body must both respect language context | `src/components/dashboard/BlueprintCard.tsx`, `src/contexts/LanguageContext.tsx`, `src/i18n/translations.ts` | Switch language toggle → both heading and body text change. Default is German per CON-german-ui. | Pending |

**Agent Instructions:** Check all strings in BlueprintCard.tsx. Any hardcoded English must go through `translations.ts`. Use `useLanguage()` hook consistently. Test with language toggle if available. BRANDVOICE.md terminology: "Signatur" not "Profil", "Muster" not "Eigenschaft".

---

### Work Package 3: Wu-Xing Fix + Detail Page (BUG-11, FEAT-wuxing-detail)

**Goal:** Fix broken icon mapping. Build Wu-Xing detail page as premium content.

| ID | Task | File(s) | Acceptance Criteria | Status |
|----|------|---------|---------------------|--------|
| S-DP-07 | Fix Wu-Xing Metal icon showing "Wind" with hover "Wind" | `src/components/WuXingCycleWheel.tsx` or `src/components/WuXingPentagon.tsx` | Metal element shows correct Metal icon (刀/金 or equivalent). Hover tooltip reads "Metall". All 5 elements display correct icon + tooltip. | Pending |
| S-DP-08 | Build WuXingPage as extended analysis detail page | `src/pages/WuXingPage.tsx` | Page shows: (a) Extended Wu-Xing element analysis with graphs/statistics, (b) Western houses (moved FROM Dashboard), (c) Element balance visualization. Accessible via navigation. | Pending |
| S-DP-09 | Gate WuXingPage extended content behind PremiumGate | `src/pages/WuXingPage.tsx`, `src/components/PremiumGate.tsx` | Free users see basic Wu-Xing overview. Extended analysis (graphs, houses, statistics) wrapped in PremiumGate. Premium users see full content. | Pending |
| S-DP-10 | Remove Western houses from Dashboard — moved to WuXingPage | `src/components/Dashboard.tsx` | Western houses section no longer on Dashboard. Dashboard is cleaner. Houses accessible only via WuXingPage detail. | Pending |

**Agent Instructions:** For S-DP-07: check the element-to-icon mapping in the Wu-Xing components. The issue is likely a wrong key in an icon map object (Metal → Wind). For S-DP-08: WuXingPage.tsx already exists — extend it. Use DEC-wuxing-ui-mapping for element→color/physics. For S-DP-09: wrap extended sections with `<PremiumGate>`. For S-DP-10: remove the houses section from Dashboard.tsx, ensure WuXingPage has it.

---

### Work Package 4: Levi Layer Redesign (BUG-12, FEAT-levi-position)

**Goal:** Levi section usable and correctly positioned.

| ID | Task | File(s) | Acceptance Criteria | Status |
|----|------|---------|---------------------|--------|
| S-DP-11 | Fix Levi layer text: remove offset, fix alignment, increase font size, remove italic | `src/components/dashboard/DashboardLeviSection.tsx` | Text is centered or left-aligned (not offset), readable font size (min 14px), not italic. | Pending |
| S-DP-12 | Fix Levi button sizing: "Call Levi" proportional, remove "Levi Bazzi bereit" extra button | `src/components/dashboard/DashboardLeviSection.tsx`, `src/components/dashboard/LeviOrb.tsx` | One clear CTA button "Call Levi" at appropriate size. No duplicate/extra button. | Pending |
| S-DP-13 | Move Levi section higher in Dashboard layout order | `src/components/Dashboard.tsx` | Levi section renders above current position (above Blueprint, above lower sections). Exact position: after Big Three cards + Fusion Ring, before detail sections. | Pending |

**Agent Instructions:** DashboardLeviSection.tsx is the main target. Check for inline styles causing offset/italic. LeviOrb.tsx may contain the extra button. For position change: reorder JSX in Dashboard.tsx. Maintain dark luxury aesthetic (CON-dark-luxury-aesthetic).

---

### Work Package 5: Planetarium & Solar System Enhancement (FEAT-planetarium)

**Goal:** Planetarium shows current constellation alongside birth data, with clear labeling.

| ID | Task | File(s) | Acceptance Criteria | Status |
|----|------|---------|---------------------|--------|
| S-DP-14 | Increase date/time display size in Planetarium view | `src/components/BirthChartOrrery.tsx`, `src/contexts/PlanetariumContext.tsx` | Date and time clearly visible, larger font. Minimum 18px or equivalent. | Pending |
| S-DP-15 | Show current planet constellation alongside birth chart constellation | `src/components/BirthChartOrrery.tsx`, `src/contexts/PlanetariumContext.tsx` | User sees both birth positions AND current live positions. Clearly differentiated (color, opacity, label). | Pending |
| S-DP-16 | Add prominent constellation description at bottom of Planetarium (e.g. "Planetenposition am 24. November 1980") | `src/components/BirthChartOrrery.tsx` | Visible description text with background highlight at bottom of Planetarium view. Format: "Planetenposition am [date]". German. | Pending |
| S-DP-17 | Apply same Planetarium enhancements to Solar System view | Identify Solar System component (may share BirthChartOrrery or be separate) | Solar System view has same date/time sizing, constellation display, and description as Planetarium. | Pending |

**Note on date picker:** Optional date selection (pick any date) — implement ONLY if effort < 2h. Otherwise defer to backlog. Do not block this sprint on it.

**Agent Instructions:** PlanetariumContext.tsx manages state. BirthChartOrrery.tsx renders. For current positions: use `astronomy-engine` (already a dependency for sky.bazodiac.space) client-side. For the description label: add a styled div at bottom with translucent background. CON-dark-luxury-aesthetic applies.

---

### Work Package 6: Navigation & Header (FEAT-menu, FEAT-header)

**Goal:** Navigation provides overview and depth. Header feels owned.

| ID | Task | File(s) | Acceptance Criteria | Status |
|----|------|---------|---------------------|--------|
| S-DP-18 | Design 3 navigation menu proposals with hover submenus | New: `src/components/navigation/` | 3 distinct proposals as working React components (not mockups). Each: (a) provides clear overview of all sections, (b) has hover-over submenus for nested content, (c) follows dark luxury aesthetic. Ben picks one. | Pending |
| S-DP-19 | Redesign header: enlarge "Dein Bazodiac" heading, create standalone header area | `src/components/Dashboard.tsx` or new `src/components/Header.tsx` | Header is a distinct visual zone (not just a text line). "Dein Bazodiac" prominently sized. Consistent with BRANDVOICE.md terminology ("Signatur" language). BRANDVOICE.md: use "Bazodiac" not "Personaliac" if that term is outdated. | Pending |

**Agent Instructions:** For S-DP-18: create 3 variants. Use Tailwind CSS v4. No external component libraries. Each must be self-contained and switchable. Ben will choose via A/B/C decision. For S-DP-19: "Dein Personaliac" may need renaming — check BRANDVOICE.md terminology. Header should feel like the top of a premium app, not a generic SPA.

---

### Work Package 7: Silent Failures (BUG-04, BUG-05, BUG-06) — IF TIME PERMITS

**Goal:** Surface errors instead of swallowing them. Lower priority than WP 1-6.

| ID | Task | File(s) | Acceptance Criteria | Status |
|----|------|---------|---------------------|--------|
| S-DP-20 | Add error handler for FusionRingCanvasV2 post-processing (Vignette/OutputPass) | `src/components/fusion-ring-website/FusionRingCanvasV2.tsx` | Three.js post-processing errors logged to console. Optional: user-visible fallback if post-processing fails. | Stretch |
| S-DP-21 | Surface usePremium Realtime fallback to polling | `src/hooks/usePremium.ts` | When Realtime subscription fails, log warning. Optional: user notification that premium status may be delayed. | Stretch |
| S-DP-22 | Add error propagation for tour_completed Supabase write failure | Tour-related component (search for `tour_completed`) | Write failure logs error. Tour state doesn't silently reset. | Stretch |

**Agent Instructions:** These are stretch goals. Only tackle after WP 1-6 are complete. Pattern: replace silent `catch {}` with `catch (e) { console.error('[component]', e) }` at minimum.

---

## Execution Order (Agent Priority)

```
1. WP1: Ghost UI Cleanup        (S-DP-01 to S-DP-04) — fast, high visual impact
2. WP2: i18n & Copy Fixes       (S-DP-05 to S-DP-06) — constraint violation fix
3. WP3: Wu-Xing Fix + Detail    (S-DP-07 to S-DP-10) — trust-critical fix + new premium content
4. WP4: Levi Layer Redesign     (S-DP-11 to S-DP-13) — usability fix
5. WP5: Planetarium Enhancement (S-DP-14 to S-DP-17) — feature enrichment
6. WP6: Navigation & Header     (S-DP-18 to S-DP-19) — design proposals (needs Ben's decision)
7. WP7: Silent Failures         (S-DP-20 to S-DP-22) — stretch, only if time permits
```

## Definition of Done

- [ ] All Ghost UI elements removed (WP1)
- [ ] Zero English placeholder text visible in Dashboard (WP2)
- [ ] Wu-Xing icons correct, detail page live, houses moved (WP3)
- [ ] Levi layer readable and correctly positioned (WP4)
- [ ] Planetarium shows current + birth constellation with labels (WP5)
- [ ] 3 navigation proposals ready for Ben's A/B/C decision (WP6)
- [ ] `npm run lint` passes after all changes
- [ ] No new console errors introduced
- [ ] All changes respect CON-german-ui and CON-dark-luxury-aesthetic

## Decisions Required From Ben During Sprint

| Decision | When | Format |
|----------|------|--------|
| Pick navigation variant (A/B/C) | After S-DP-18 delivered | Single letter |
| Confirm "Dein Bazodiac" vs other heading | Before S-DP-19 | Confirm or suggest |
| Cosmic Blueprint: separate page or stay on Dashboard? | Before WP3 | A (separate) / B (stay) |
| Date picker in Planetarium: build or defer? | Before S-DP-17 | A (build) / B (defer) |

---

*Sprint created: 2026-03-24 by Claude PO*
*Source: Ben's bug report + feature requests, BACKLOG.md, tasks.md*

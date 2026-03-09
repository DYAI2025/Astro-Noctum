# Phase 3 Visual QA Checklist

**Component:** Character Sheet
**Date:** 2025-12-14
**Status:** Ready for Manual Testing

## Test Environment

- **URL:** http://localhost:3001/character
- **Mock Data:** `MOCK_PSYCHE_PROFILE` in `src/data/mocks/psyche.ts`
- **Browser:** Chrome/Firefox/Safari
- **Devices:** Desktop (1920x1080), Mobile (375x667)

## Desktop Layout (≥1024px)

### Grid Structure
- [ ] 2-column layout visible
- [ ] Left column spans 7/12
- [ ] Right column spans 5/12
- [ ] 6-8px gap between cards
- [ ] No horizontal overflow

### Header Section
- [ ] Title "Dein Charakter" displays in gold gradient
- [ ] Subtitle centered below title
- [ ] Serif font for title, sans for subtitle
- [ ] Proper spacing (pt-20 pb-10)

### Left Column - CoreStatsCard
- [ ] Card has parchment background
- [ ] Gold border visible
- [ ] Corner ornaments in all 4 corners
- [ ] Section title "Wesentliche Natur" visible
- [ ] All 5 stat bars render:
  - Klarheit
  - Mut
  - Verbindung
  - Struktur
  - Schatten
- [ ] Progress bars animate on load
- [ ] Numeric values show as percentages (0-100)
- [ ] Delta chips appear (green +5% for Connection, red -2% for Courage)
- [ ] Hover effect on stat labels
- [ ] Tabular numbers aligned properly

### Left Column - ClimateCard
- [ ] Card renders below CoreStatsCard
- [ ] Section title "Dein Klima" visible
- [ ] All 5 axes render with labels:
  - Schatten ↔ Licht
  - Kühl ↔ Warm
  - Oberfläche ↔ Tiefe
  - Ich ↔ Wir
  - Verstand ↔ Gefühl
- [ ] Thumb markers positioned correctly (80%, 70%, 90%, 60%, 40%)
- [ ] Center line visible at 50%
- [ ] Fill from center animates
- [ ] Active side label is bold
- [ ] Gold thumb with shadow

### Right Column - ArchetypeStoryCard
- [ ] Parchment variant card
- [ ] Corner ornaments visible
- [ ] "Primärer Archetyp" label
- [ ] Archetype name "Der Leuchtturm" displays
- [ ] Gold divider line
- [ ] Narrative snippet in quotes
- [ ] Italic serif font for snippet
- [ ] Centered text alignment

### Right Column - DerivedStatsCard
- [ ] Elevated variant (lighter parchment)
- [ ] Section title "Potentiale" visible
- [ ] 2x2 grid layout
- [ ] All 4 stats render:
  - Vitalität (80)
  - Willenskraft (38)
  - Chaos (15)
  - Harmonie (27)
- [ ] Pills fade in with stagger
- [ ] Hover shadow effect

### Right Column - MetaBadgesRow
- [ ] Badge row renders below DerivedStatsCard
- [ ] Intensity badge: "Spürbar" (gold/amber colors)
- [ ] Tempo badge: "Beweglich" (purple colors)
- [ ] Shadow badge: "Schatten: Bestätigt" (slate colors)
- [ ] Badges wrap on narrow screens
- [ ] Uppercase text
- [ ] Rounded pill shape

### Background - OrnamentLayer
- [ ] Constellation watermark barely visible (6% opacity)
- [ ] Star points with glow
- [ ] Connecting lines
- [ ] Alchemy circles
- [ ] Corner flourishes in all 4 corners (desktop only)
- [ ] Does NOT interfere with readability
- [ ] Fixed positioning
- [ ] Non-interactive (pointer-events: none)

### After-Quiz Delta Banner
- [ ] Banner appears 1s after page load
- [ ] Floats at bottom center
- [ ] Shows "Update nach Quiz" title
- [ ] Displays top 2 changes:
  - Connection +5%
  - Courage -2%
- [ ] Green for positive, red for negative
- [ ] Close button (✕) works
- [ ] Auto-dismisses after ~10s
- [ ] Slide-up animation on appear
- [ ] Slide-down animation on dismiss

## Mobile Layout (<1024px)

### Responsive Behavior
- [ ] Single column stack layout
- [ ] Cards span full width
- [ ] No horizontal scroll
- [ ] Proper spacing maintained
- [ ] Corner flourishes hidden

### Order (Top to Bottom)
1. [ ] Header
2. [ ] CoreStatsCard
3. [ ] ClimateCard
4. [ ] ArchetypeStoryCard
5. [ ] DerivedStatsCard
6. [ ] MetaBadgesRow

### Touch Targets
- [ ] Close button ≥44px
- [ ] Cards have adequate padding
- [ ] Stat bars readable

### Typography
- [ ] Title scales down appropriately
- [ ] Body text remains readable
- [ ] No text overflow

## Animation Checks

### Initial Load
- [ ] Ornaments fade in subtly
- [ ] Stat bars animate from 0 to value (1s)
- [ ] Axis thumbs slide from center (spring)
- [ ] Delta chips fade in after bars
- [ ] Stat pills stagger (0.1, 0.2, 0.3, 0.4s)
- [ ] Banner appears after 1s delay

### Stagger Timing
- [ ] CoreStatsCard: 5 bars stagger by 0.1s each
- [ ] ClimateCard: 5 axes stagger by 0.1s each
- [ ] DerivedStatsCard: 4 pills stagger by 0.1s each
- [ ] No jank or layout shift

### Reduced Motion (Optional - Phase 4)
- [ ] prefers-reduced-motion respected
- [ ] Animations ≤250ms or removed
- [ ] Crossfade only

## Accessibility

### Keyboard Navigation
- [ ] Tab order logical (top to bottom, left to right)
- [ ] Close button focusable
- [ ] Focus states visible
- [ ] No keyboard traps

### Screen Reader
- [ ] Page title announced
- [ ] Section headings announced
- [ ] Stat values announced
- [ ] Axis labels accessible
- [ ] Banner content readable

### Contrast
- [ ] Title text meets WCAG AA (4.5:1)
- [ ] Body text meets WCAG AA
- [ ] Gold used only for borders/icons (not text)
- [ ] Dark ink (#271C16) for primary text

### Focus States
- [ ] All interactive elements have visible focus
- [ ] Focus ring color sufficient contrast
- [ ] Focus ring not obscured

## Browser Compatibility

### Chrome
- [ ] Layout correct
- [ ] Animations smooth
- [ ] Gradients render
- [ ] SVG ornaments display

### Firefox
- [ ] Layout correct
- [ ] Animations smooth
- [ ] Gradients render
- [ ] SVG ornaments display

### Safari
- [ ] Layout correct
- [ ] Animations smooth
- [ ] Gradients render
- [ ] SVG ornaments display
- [ ] -webkit prefixes (if needed)

## Performance

### Initial Load
- [ ] FCP < 1.5s
- [ ] LCP < 2.5s
- [ ] No layout shift (CLS near 0)
- [ ] Smooth 60fps animations

### Lighthouse Audit
- [ ] Performance ≥90
- [ ] Accessibility ≥90
- [ ] Best Practices ≥90
- [ ] SEO ≥90

## Edge Cases

### Missing Data
- [ ] No archetype → ArchetypeStoryCard hidden
- [ ] No narrative_snippet → only archetype shows
- [ ] No meta_stats → MetaBadgesRow hidden
- [ ] No deltas → no delta chips, no banner

### Extreme Values
- [ ] All stats at 0 → bars empty but visible
- [ ] All stats at 1 → bars full (100%)
- [ ] Axis at 0 → thumb at far left
- [ ] Axis at 1 → thumb at far right
- [ ] Axis at 0.5 → thumb at center

### Long Text
- [ ] Long archetype names don't overflow
- [ ] Long snippet wraps properly
- [ ] Stat labels don't break layout

## Known Issues / Future Work

### Phase 4 Enhancements
- [ ] Delta-driven animation duration formula
- [ ] Highlight glow for top movers
- [ ] ChangeLogAccordion integration
- [ ] Shadow watermark gating (confidence threshold)
- [ ] Full prefers-reduced-motion support

### Optional Improvements
- [ ] Tooltip on axis rails (descriptions)
- [ ] Share/Copy link CTA in footer
- [ ] Export as image feature
- [ ] Dark theme variant

## Sign-Off

**Tested By:** _______________
**Date:** _______________
**Build Version:** _______________
**Browser/Device:** _______________

**Issues Found:**
- [ ] None
- [ ] Listed below:

---

**Next Steps:**
1. Perform manual testing checklist
2. Take screenshots (Desktop + Mobile)
3. Run Lighthouse audit
4. File issues for Phase 4
5. Proceed to Phase 4 implementation

---

**Dev Server:** http://localhost:3001/character
**Mock Data:** See `src/data/mocks/psyche.ts`

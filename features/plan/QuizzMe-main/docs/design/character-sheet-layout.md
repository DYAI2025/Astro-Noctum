# Character Sheet Layout Specification

**Theme:** Light Grimoire - Modern Alchemy
**Version:** Phase 1 - Visual Design Blueprint
**Last Updated:** 2025-12-14

## Overview

The Character Sheet uses a responsive grid layout that transitions from a 2-column desktop layout to a single-column mobile stack. The design follows the "Light Grimoire" theme with parchment/cream backgrounds, gold accents, and subtle ornamental elements.

---

## Design Principles

1. **Hierarchical Flow:** Header → Core Stats → Climate → Derived → Archetype → CTA
2. **Breathing Room:** Generous spacing (32-48px between major sections)
3. **Premium Feel:** Thin gold borders, subtle shadows, ornamental accents
4. **Accessibility First:** High contrast, large touch targets, keyboard navigation
5. **Delightful Motion:** Delta-driven animations on updates (respects reduced-motion)

---

## Page Header

### Title Section
- **Title:** "Dein Character Sheet"
  - **Font:** `var(--font-serif)` (Playfair Display)
  - **Size:** `var(--text-5xl)` (48px) on desktop, `var(--text-4xl)` (36px) on mobile
  - **Color:** `var(--alchemy-text-dark)` (#271C16)
  - **Weight:** 700
  - **Text Align:** Center
  - **Margin Bottom:** `var(--space-3)` (12px)

- **Subtitle:** "Dein Avatar ist ein Klima, kein Label."
  - **Font:** `var(--font-sans)` (Inter)
  - **Size:** `var(--text-lg)` (18px) on desktop, `var(--text-base)` (16px) on mobile
  - **Color:** `var(--alchemy-text-dark-muted)` (#4A3F38)
  - **Weight:** 400
  - **Text Align:** Center
  - **Line Height:** `var(--leading-relaxed)` (1.625)
  - **Margin Bottom:** `var(--space-8)` (32px)

### Divider Ornament
- **Asset:** `/assets/ornaments/divider.svg`
- **Width:** 300px (max)
- **Opacity:** 100%
- **Position:** Centered horizontally
- **Margin:** `var(--space-6)` (24px) top/bottom

---

## Grid Layout System

### Desktop Layout (≥768px)

**Container:**
- **Max Width:** 1200px
- **Margin:** 0 auto
- **Padding:** `var(--space-8)` (32px) `var(--space-6)` (24px)
- **Background:** `var(--alchemy-parchment)` (#F2E3CF) or transparent (page background)

**Grid Structure:**
```
12-column grid with 24px gap
[---Col 1-6---] [---Col 7-12---]
```

**Grid Configuration:**
- **Display:** CSS Grid
- **Grid Template Columns:** repeat(12, 1fr)
- **Gap:** `var(--space-6)` (24px) horizontal, `var(--space-8)` (32px) vertical
- **Alignment:** Items stretch (fill height)

**Row A: Core Stats + Climate**
- **Left (Cols 1-6):** CoreStatsCard
- **Right (Cols 7-12):** ClimateCard
- **Height:** Auto (natural height based on content)

**Row B: Derived Stats + Archetype/Story**
- **Left (Cols 1-6):** DerivedStatsCard
- **Right (Cols 7-12):** ArchetypeStoryCard
- **Height:** Auto

**Row C (optional): Additional Cards**
- **Full Width (Cols 1-12):** ChangeLogAccordion (if expanded)

**Row D: Footer CTAs**
- **Full Width (Cols 1-12):** FooterCTAs (centered flex row)

### Mobile Layout (<768px)

**Container:**
- **Max Width:** 100%
- **Padding:** `var(--space-6)` (24px) `var(--space-4)` (16px)

**Grid Structure:**
```
Single column stack
[------Card------]
[------Card------]
[------Card------]
```

**Grid Configuration:**
- **Display:** Flex column or CSS Grid with 1 column
- **Gap:** `var(--space-6)` (24px) vertical

**Stacking Order:**
1. Header (Title + Subtitle + Divider)
2. CoreStatsCard
3. ClimateCard
4. DerivedStatsCard
5. ArchetypeStoryCard
6. ChangeLogAccordion (optional, collapsed by default)
7. FooterCTAs

---

## Card Layout Details

### CoreStatsCard (Row A, Left)

**Desktop:**
- **Grid Column:** span 6
- **Min Height:** 400px
- **Padding:** `var(--space-8)` (32px)
- **Gap (internal rows):** `var(--space-4)` (16px)

**Mobile:**
- **Width:** 100%
- **Padding:** `var(--space-6)` (24px)
- **Gap (internal rows):** `var(--space-3)` (12px)

**Content Structure:**
1. Header (Title + optional info icon)
2. StatBarRow × 5 (Clarity, Courage, Connection, Order, Shadow)
3. MetaBadgesRow (Intensity, Tempo, Shadow Confirmed)

**Internal Layout:**
- **Display:** Flex column
- **Gap:** `var(--space-4)` (16px)
- **Justify Content:** flex-start

---

### ClimateCard (Row A, Right)

**Desktop:**
- **Grid Column:** span 6
- **Min Height:** Match CoreStatsCard height (stretch)
- **Padding:** `var(--space-8)` (32px)
- **Gap (internal rows):** `var(--space-6)` (24px)

**Mobile:**
- **Width:** 100%
- **Padding:** `var(--space-6)` (24px)
- **Gap (internal rows):** `var(--space-4)` (16px)

**Content Structure:**
1. Header (Title "Dein Klima" + optional info icon)
2. AxisRail × 5:
   - Licht ←→ Schatten
   - Warm ←→ Kalt
   - Tief ←→ Oberfläche
   - Ich ←→ Wir
   - Gefühl ←→ Verstand

**Internal Layout:**
- **Display:** Flex column
- **Gap:** `var(--space-6)` (24px)
- **Justify Content:** flex-start

---

### DerivedStatsCard (Row B, Left)

**Desktop:**
- **Grid Column:** span 6
- **Min Height:** 300px
- **Padding:** `var(--space-8)` (32px)

**Mobile:**
- **Width:** 100%
- **Padding:** `var(--space-6)` (24px)

**Content Structure:**
1. Header (Title "Abgeleitete Werte")
2. Grid of StatPills (Vitality, Willpower, Chaos, Harmony)

**Pills Grid:**
- **Display:** CSS Grid
- **Grid Template Columns:** repeat(auto-fit, minmax(140px, 1fr))
- **Gap:** `var(--space-4)` (16px)
- **Mobile:** 2 columns on small screens

---

### ArchetypeStoryCard (Row B, Right)

**Desktop:**
- **Grid Column:** span 6
- **Min Height:** Match DerivedStatsCard height (stretch)
- **Padding:** `var(--space-8)` (32px)

**Mobile:**
- **Width:** 100%
- **Padding:** `var(--space-6)` (24px)

**Content Structure:**
1. Header (Title "Archetypen & Story")
2. Primary ArchetypeBadge (large, prominent)
3. Secondary Archetypes List (if present, smaller badges)
4. Narrative Snippet (1-2 lines, serif font, italicized)
5. CTA: "Mehr erfahren" or "Details ansehen" (optional)

**Internal Layout:**
- **Display:** Flex column
- **Gap:** `var(--space-4)` (16px)
- **Align Items:** flex-start

**Graceful Degradation:**
- If `archetype_mix` missing: Show placeholder "Archetypen werden nach mehr Quizzen sichtbar"
- If `narrative_snippet` missing: Hide snippet section

---

### FooterCTAs (Row D)

**Desktop:**
- **Grid Column:** span 12 (full width)
- **Padding:** `var(--space-8)` (32px) 0
- **Margin Top:** `var(--space-12)` (48px)
- **Border Top:** 1px solid `var(--border-gold-subtle)` (30% opacity)

**Mobile:**
- **Width:** 100%
- **Padding:** `var(--space-6)` (24px) 0
- **Margin Top:** `var(--space-8)` (32px)

**Content Structure:**
- **Display:** Flex row, justify-content: center
- **Gap:** `var(--space-4)` (16px)
- **Buttons:** 1-2 CTAs (Share, Copy Link)

**Button Layout:**
- **Min Width:** 160px
- **Height:** 48px (accessibility)
- **Flex:** 0 0 auto (no grow/shrink)

---

## Background & Ornaments Layer

### Page Background

**Desktop:**
- **Background Color:** `var(--alchemy-parchment)` (#F2E3CF) or gradient
- **Background Image:** `/assets/ornaments/constellation-watermark.svg`
- **Background Position:** center center
- **Background Size:** 1200px auto (or cover)
- **Background Repeat:** no-repeat
- **Opacity:** 6% (via pseudo-element or overlay)

**Mobile:**
- **Background Image:** Optional (may hide for performance)
- **Background Color:** Solid `var(--alchemy-parchment)` (#F2E3CF)

### Card Corner Ornaments

**Implementation:**
- **Position:** Absolute within each card (position: relative on card)
- **Asset:** `/assets/ornaments/corner.svg`
- **Size:** 60px × 60px (desktop), 40px × 40px (mobile)
- **Opacity:** 20%
- **Z-Index:** 1 (above background, below content)

**Corner Positions:**
- **Top-Left:** top: -10px, left: -10px, rotate: 0deg
- **Top-Right:** top: -10px, right: -10px, rotate: 90deg
- **Bottom-Right:** bottom: -10px, right: -10px, rotate: 180deg
- **Bottom-Left:** bottom: -10px, left: -10px, rotate: 270deg

**Mobile:** Reduce size or hide bottom corners to avoid clutter

---

## Spacing Scale

### Vertical Rhythm (Section Spacing)
- **Between Rows (Desktop):** `var(--space-8)` (32px)
- **Between Rows (Mobile):** `var(--space-6)` (24px)
- **After Header:** `var(--space-8)` (32px)
- **Before Footer:** `var(--space-12)` (48px)

### Horizontal Rhythm (Column Gaps)
- **Desktop Grid Gap:** `var(--space-6)` (24px)
- **Mobile:** N/A (single column)

### Card Internal Spacing
- **Card Padding (Desktop):** `var(--space-8)` (32px)
- **Card Padding (Mobile):** `var(--space-6)` (24px)
- **Header to Content:** `var(--space-6)` (24px)
- **Between Rows/Items:** `var(--space-4)` (16px)

---

## Responsive Breakpoints

### Breakpoint Definitions
```css
/* Mobile First Approach */
/* Small (Mobile): 0-767px */
/* Medium (Tablet): 768px-1023px */
/* Large (Desktop): 1024px+ */
```

### Layout Transitions

**At 768px:**
- Grid switches from 2-column to 1-column
- Card padding reduces from 32px → 24px
- Typography scales down (H1: 48px → 36px)
- Corner ornaments reduce size or hide

**At 1024px:**
- Container max-width: 1200px engaged
- Full desktop spacing applied
- All ornaments visible

---

## Z-Index Stack

**Layer Order (bottom to top):**
1. **Page Background:** z-index: -1 or 0 (constellation watermark)
2. **Card Background:** z-index: 0 (cream surface)
3. **Corner Ornaments:** z-index: 1 (decorative layer)
4. **Card Content:** z-index: 10 (text, bars, rails)
5. **Tooltips:** z-index: 60 (var(--z-tooltip))
6. **Delta Banner:** z-index: 50 (var(--z-modal))
7. **Modals/Overlays:** z-index: 40-50 (if present)

---

## Animation Specifications

### Page Load Sequence
1. **Header:** Fade in (300ms, delay: 0ms)
2. **Row A (Core + Climate):** Slide up + fade in (400ms, delay: 100ms)
3. **Row B (Derived + Archetype):** Slide up + fade in (400ms, delay: 200ms)
4. **Footer CTAs:** Fade in (300ms, delay: 300ms)

**CSS Implementation:**
```css
.fade-in-up {
  animation: fadeInUp 400ms ease-out forwards;
  opacity: 0;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### After-Quiz Update Sequence
1. **Delta Banner:** Slide down from top (300ms)
2. **Freeze:** 80ms pause (all UI)
3. **Bars + Rails:** Animate simultaneously (450-1400ms based on delta)
4. **Highlight Glow:** 1s pulse on top movers
5. **Delta Chips:** Fade in for 2.5s, then fade out

### Hover Animations
- **Cards:** Subtle lift (2px) + shadow increase (300ms ease)
- **Buttons:** Lift (1px) + glow increase (150ms ease)
- **Rails/Bars:** Brighten + slight scale (200ms ease)

---

## Accessibility Layout Considerations

### Keyboard Navigation Order
1. Skip to main content link (optional, hidden until focused)
2. Header (non-interactive, semantic h1)
3. CoreStatsCard → Each StatBarRow (tooltip triggers focusable)
4. ClimateCard → Each AxisRail (info icons focusable)
5. DerivedStatsCard (non-interactive, read-only)
6. ArchetypeStoryCard → CTA button (if present)
7. FooterCTAs → Share/Copy buttons

### Focus Management
- **Focus Ring:** 2px solid gold, 2px offset
- **Focus Visible:** Only on keyboard (not mouse clicks)
- **Focus Trap:** Delta Banner (when open) traps focus until dismissed

### Screen Reader Announcements
- **Page Title:** Announced on load ("Dein Character Sheet")
- **Card Headers:** Semantic h2 tags
- **Stats/Values:** aria-label for context ("Clarity: 75 von 100")
- **Delta Updates:** Live region announcement ("Klarheit erhöht um 5 Punkte")

---

## Print Layout (Optional Future Enhancement)

### Print Styles
- **Remove:** Background images, ornaments, animations
- **Simplify:** Single column layout regardless of viewport
- **Colors:** Convert to grayscale or high-contrast for readability
- **Page Breaks:** Avoid breaking cards across pages

---

## Example HTML Structure

```html
<main class="character-sheet-page">
  <!-- Background Layer -->
  <div class="background-ornament" aria-hidden="true">
    <!-- Constellation watermark -->
  </div>

  <!-- Header -->
  <header class="character-sheet-header">
    <h1>Dein Character Sheet</h1>
    <p class="subtitle">Dein Avatar ist ein Klima, kein Label.</p>
    <img src="/assets/ornaments/divider.svg" alt="" class="divider" />
  </header>

  <!-- Grid Container -->
  <div class="character-sheet-grid">
    <!-- Row A: Core + Climate -->
    <section class="core-stats-card" aria-labelledby="core-stats-title">
      <h2 id="core-stats-title">Kernwerte</h2>
      <!-- StatBarRow × 5 -->
      <!-- MetaBadgesRow -->
    </section>

    <section class="climate-card" aria-labelledby="climate-title">
      <h2 id="climate-title">Dein Klima</h2>
      <!-- AxisRail × 5 -->
    </section>

    <!-- Row B: Derived + Archetype -->
    <section class="derived-stats-card" aria-labelledby="derived-title">
      <h2 id="derived-title">Abgeleitete Werte</h2>
      <!-- StatPill × 4 -->
    </section>

    <section class="archetype-story-card" aria-labelledby="archetype-title">
      <h2 id="archetype-title">Archetypen & Story</h2>
      <!-- ArchetypeBadge + Narrative -->
    </section>
  </div>

  <!-- Footer -->
  <footer class="footer-ctas">
    <button class="btn-primary">Teilen</button>
    <button class="btn-secondary">Link kopieren</button>
  </footer>

  <!-- Delta Banner (conditional) -->
  <aside class="delta-banner" role="alert" aria-live="polite">
    <!-- Movers list + CTA -->
  </aside>
</main>
```

---

## Example CSS Grid Implementation

```css
.character-sheet-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--space-8) var(--space-6);
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-6);
}

/* Desktop: 2-column layout */
@media (min-width: 768px) {
  .core-stats-card,
  .derived-stats-card {
    grid-column: span 6;
  }

  .climate-card,
  .archetype-story-card {
    grid-column: span 6;
  }
}

/* Mobile: 1-column stack */
@media (max-width: 767px) {
  .character-sheet-grid {
    grid-template-columns: 1fr;
    gap: var(--space-6);
    padding: var(--space-6) var(--space-4);
  }

  .core-stats-card,
  .climate-card,
  .derived-stats-card,
  .archetype-story-card {
    grid-column: span 1;
  }
}
```

---

## Performance Considerations

### Layout Optimization
- **Avoid Layout Thrashing:** Batch DOM reads/writes during animations
- **Use CSS Transforms:** Prefer `transform` over `top/left` for animations
- **Will-Change:** Apply `will-change: transform` to animated elements (sparingly)
- **Lazy Load Ornaments:** Load background watermark after critical content

### Asset Loading
- **SVG Inlining:** Consider inlining small icons (<2KB) to reduce HTTP requests
- **Ornament Sprites:** Combine ornaments into a single sprite sheet (optional)
- **Preload Critical Assets:** Preload fonts and above-the-fold ornaments

---

## Testing Checklist

- [ ] Desktop 2-column layout renders correctly at 1024px+
- [ ] Mobile 1-column stack renders correctly at <768px
- [ ] Tablet (768-1023px) handles layout transition smoothly
- [ ] Cards align properly (no misalignment or overflow)
- [ ] Spacing is consistent (vertical rhythm maintained)
- [ ] Ornaments display at correct opacity and position
- [ ] Background watermark doesn't interfere with readability
- [ ] Keyboard navigation follows logical order
- [ ] Focus states visible and accessible
- [ ] Print layout (if implemented) removes ornaments and backgrounds
- [ ] Layout doesn't break with missing optional fields (archetype_mix, etc.)

---

**End of Layout Specification**

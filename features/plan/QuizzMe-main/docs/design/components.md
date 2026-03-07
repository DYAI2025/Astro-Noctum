# Character Sheet Component Visual Specifications

**Theme:** Light Grimoire - Modern Alchemy Tarot/Alchemy aesthetic
**Version:** Phase 1 - Visual Design Blueprint
**Last Updated:** 2025-12-14

## Design Tokens Reference

All components use the Modern Alchemy design tokens defined in `/src/app/styles/modern-alchemy-tokens.css`.

### Core Colors
- **Gold Primary:** `#D4AF37` (var(--alchemy-gold-primary))
- **Gold Dark:** `#A77D38` (var(--alchemy-gold-dark))
- **Gold Light:** `#E8C77B` (var(--alchemy-gold-light))
- **Gold Muted:** `rgba(210, 169, 90, 0.6)` (var(--alchemy-gold-muted))
- **Parchment:** `#F2E3CF` (var(--alchemy-parchment))
- **Cream:** `#F7F0E6` (var(--alchemy-cream))
- **Ink Dark:** `#271C16` (var(--alchemy-text-dark))
- **Ink Muted:** `#4A3F38` (var(--alchemy-text-dark-muted))
- **Emerald Accent:** `#0D5A5F` (var(--alchemy-bg-emerald))

### Typography
- **Serif (Headings):** Playfair Display (var(--font-playfair))
- **Sans (Body):** Inter (var(--font-inter))

---

## Component Specifications

### 1. CoreStatsCard

**Purpose:** Display 5 core personality dimensions with horizontal bars

**Visual Specifications:**
- **Background:** `var(--alchemy-cream)` (#F7F0E6)
- **Border:** 1px solid `var(--alchemy-gold-primary)` with `var(--border-gold-subtle)` at 30% opacity
- **Border Radius:** `var(--radius-xl)` (16px)
- **Padding:** `var(--space-8)` (32px)
- **Shadow:** `var(--shadow-md)` with optional `var(--glow-gold-subtle)` on hover
- **Gap between rows:** `var(--space-4)` (16px)

**Header:**
- **Font:** `var(--font-serif)` at `var(--text-2xl)` (24px)
- **Color:** `var(--alchemy-text-dark)` (#271C16)
- **Weight:** 600
- **Margin Bottom:** `var(--space-6)` (24px)

**States:**
- **Default:** Clean cream surface with thin gold border
- **Hover:** Add `var(--glow-gold-subtle)` shadow
- **After-Quiz (with delta):** Highlight border with full opacity gold

---

### 2. StatBarRow

**Purpose:** Individual stat display with label, bar, and value

**Layout:**
- **Display:** Flex row, align-items: center
- **Gap:** `var(--space-3)` (12px)
- **Min Height:** 44px (accessibility - touch target)

**Label:**
- **Font:** `var(--font-sans)` at `var(--text-base)` (16px)
- **Color:** `var(--alchemy-text-dark)` (#271C16)
- **Weight:** 500
- **Width:** 120px (fixed for alignment)
- **Includes:** Tooltip trigger icon (info circle)

**Bar Track:**
- **Flex:** 1 (fills available space)
- **Height:** 8px
- **Background:** `var(--alchemy-parchment-dark)` (#E8D5BD)
- **Border Radius:** `var(--radius-full)` (pill shape)
- **Overflow:** hidden

**Bar Fill:**
- **Height:** 100%
- **Background:** Linear gradient `90deg, var(--alchemy-gold-dark) 0%, var(--alchemy-gold-primary) 100%`
- **Border Radius:** `var(--radius-full)`
- **Transition:** width 700ms `var(--ease-out-cubic)` (delta-driven animation)
- **Shadow:** `var(--glow-gold-subtle)` (subtle glow)

**Value Display:**
- **Font:** `var(--font-sans)` at `var(--text-base)` (16px)
- **Font Variant:** tabular-nums (aligned numbers)
- **Color:** `var(--alchemy-text-dark)` (#271C16)
- **Weight:** 600
- **Width:** 48px (right-aligned)

**Delta Chip (when present):**
- **Position:** Absolute, right of value
- **Background:** `var(--alchemy-gold-primary)` with 20% opacity
- **Color:** `var(--alchemy-text-dark)`
- **Padding:** `var(--space-1)` (4px) `var(--space-2)` (8px)
- **Border Radius:** `var(--radius-sm)` (6px)
- **Font Size:** `var(--text-sm)` (14px)
- **Animation:** Fade in + glow for 2.5s, then fade out

**States:**
- **Default:** Standard gold gradient fill
- **Hover:** Brighten bar slightly (filter: brightness(1.05))
- **Mover Highlight:** 1s outline glow (`0 0 0 2px rgba(210, 169, 90, 0.4)`)

---

### 3. ClimateCard

**Purpose:** Display 5 climate axes with bipolar rail visualization

**Visual Specifications:**
- **Background:** `var(--alchemy-cream)` (#F7F0E6)
- **Border:** 1px solid `var(--border-gold-subtle)` (30% opacity)
- **Border Radius:** `var(--radius-xl)` (16px)
- **Padding:** `var(--space-8)` (32px)
- **Shadow:** `var(--shadow-md)`
- **Gap between axes:** `var(--space-6)` (24px)

**Header:**
- **Font:** `var(--font-serif)` at `var(--text-2xl)` (24px)
- **Color:** `var(--alchemy-text-dark)` (#271C16)
- **Margin Bottom:** `var(--space-6)` (24px)

---

### 4. AxisRail

**Purpose:** Bipolar slider visualization (e.g., Light ←→ Shadow)

**Layout:**
- **Display:** Flex column
- **Gap:** `var(--space-2)` (8px)

**Labels Row:**
- **Display:** Flex row, justify-content: space-between
- **Font:** `var(--font-sans)` at `var(--text-sm)` (14px)
- **Color:** `var(--alchemy-text-dark-muted)` (#4A3F38)
- **Weight:** 500
- **Text Transform:** uppercase
- **Letter Spacing:** 0.05em

**Rail Track:**
- **Width:** 100%
- **Height:** 6px
- **Background:** Linear gradient horizontal:
  - Left: `var(--alchemy-gold-light)` (#E8C77B)
  - Center: `var(--alchemy-parchment)` (#F2E3CF)
  - Right: `var(--alchemy-bg-emerald)` (#0D5A5F)
- **Border Radius:** `var(--radius-full)`
- **Position:** Relative

**Marker (position indicator):**
- **Width:** 16px
- **Height:** 16px
- **Background:** `var(--alchemy-gold-primary)` (#D4AF37)
- **Border:** 2px solid `var(--alchemy-cream)` (white/cream)
- **Border Radius:** 50% (circle)
- **Position:** Absolute, top: -5px (centered vertically)
- **Shadow:** `var(--shadow-md)` + `var(--glow-gold-subtle)`
- **Transition:** left 700ms `var(--ease-out-cubic)`
- **Z-Index:** 10

**Description (optional):**
- **Font:** `var(--font-sans)` at `var(--text-sm)` (14px)
- **Color:** `var(--alchemy-text-dark-muted)` (#4A3F38)
- **Line Height:** `var(--leading-relaxed)` (1.625)
- **Margin Top:** `var(--space-2)` (8px)
- **Max Height:** 0 (collapsed) or auto (expanded)
- **Transition:** max-height 300ms ease

**States:**
- **Default:** Marker at calculated position
- **Hover:** Marker slightly larger (scale 1.1)
- **Mover Highlight:** Marker glows with pulse animation

---

### 5. MetaBadgesRow

**Purpose:** Display intensity, tempo, and shadow confirmation badges

**Layout:**
- **Display:** Flex row, flex-wrap
- **Gap:** `var(--space-3)` (12px)
- **Margin Top:** `var(--space-6)` (24px)

**Individual Badge:**
- **Display:** Inline-flex, align-items: center
- **Gap:** `var(--space-2)` (8px)
- **Padding:** `var(--space-2)` (8px) `var(--space-4)` (16px)
- **Background:** `var(--alchemy-parchment-dark)` (#E8D5BD)
- **Border:** 1px solid `var(--border-gold-subtle)`
- **Border Radius:** `var(--radius-full)` (pill)
- **Font:** `var(--font-sans)` at `var(--text-sm)` (14px)
- **Color:** `var(--alchemy-text-dark)` (#271C16)
- **Shadow:** `var(--shadow-sm)`

**Badge Icon:**
- **Size:** 16px × 16px
- **Color:** `var(--alchemy-gold-primary)` (#D4AF37)
- **Stroke Width:** 1.5px

**States:**
- **Default:** Subtle parchment background
- **Hover:** Brighten background slightly
- **Unconfirmed (shadow_confidence < 0.65):** Muted opacity (0.5) or hidden

**Badge Variants:**
- **Intensity:** Icon = sun/flame, Text = "Leise" | "Spürbar" | "Stark"
- **Tempo:** Icon = wave, Text = "Ruhig" | "Beweglich" | "Dynamisch"
- **Shadow:** Icon = moon, Text = "Schatten bestätigt" (only if confidence >= 0.65)

---

### 6. DerivedStatsCard

**Purpose:** Display 4 calculated secondary values as pills

**Visual Specifications:**
- **Background:** `var(--alchemy-cream)` (#F7F0E6)
- **Border:** 1px solid `var(--border-gold-subtle)` (30% opacity)
- **Border Radius:** `var(--radius-xl)` (16px)
- **Padding:** `var(--space-8)` (32px)
- **Shadow:** `var(--shadow-md)`

**Header:**
- **Font:** `var(--font-serif)` at `var(--text-2xl)` (24px)
- **Color:** `var(--alchemy-text-dark)` (#271C16)
- **Margin Bottom:** `var(--space-6)` (24px)

**Pills Container:**
- **Display:** Grid
- **Grid Columns:** repeat(auto-fit, minmax(140px, 1fr))
- **Gap:** `var(--space-4)` (16px)

---

### 7. StatPill

**Purpose:** Compact circular/pill display for derived stats

**Visual Specifications:**
- **Display:** Flex column, align-items: center
- **Padding:** `var(--space-4)` (16px) `var(--space-3)` (12px)
- **Background:** `var(--alchemy-parchment-dark)` (#E8D5BD)
- **Border:** 1px solid `var(--alchemy-gold-muted)` (60% opacity)
- **Border Radius:** `var(--radius-lg)` (12px)
- **Min Height:** 80px
- **Text Align:** center
- **Shadow:** `var(--shadow-sm)`

**Value:**
- **Font:** `var(--font-serif)` at `var(--text-4xl)` (36px)
- **Color:** `var(--alchemy-gold-primary)` (#D4AF37)
- **Weight:** 700
- **Font Variant:** tabular-nums
- **Line Height:** 1

**Label:**
- **Font:** `var(--font-sans)` at `var(--text-sm)` (14px)
- **Color:** `var(--alchemy-text-dark-muted)` (#4A3F38)
- **Weight:** 500
- **Margin Top:** `var(--space-2)` (8px)
- **Text Transform:** uppercase
- **Letter Spacing:** 0.05em

**States:**
- **Default:** Clean parchment with gold text
- **Hover:** Brighten value color, slight lift (transform: translateY(-2px))

---

### 8. ArchetypeBadge

**Purpose:** Display primary/secondary archetype with icon

**Visual Specifications:**
- **Display:** Inline-flex, align-items: center
- **Gap:** `var(--space-3)` (12px)
- **Padding:** `var(--space-3)` (12px) `var(--space-5)` (20px)
- **Background:** Linear gradient `135deg, var(--alchemy-gold-light) 0%, var(--alchemy-gold-primary) 100%`
- **Color:** `var(--alchemy-text-dark)` (#271C16)
- **Border Radius:** `var(--radius-lg)` (12px)
- **Shadow:** `var(--shadow-md)` + `var(--glow-gold-medium)`
- **Font:** `var(--font-serif)` at `var(--text-lg)` (18px)
- **Weight:** 600

**Icon:**
- **Size:** 24px × 24px
- **Color:** `var(--alchemy-text-dark)` (#271C16)

**Secondary Archetype (if present):**
- **Font Size:** `var(--text-base)` (16px)
- **Opacity:** 0.8
- **Background:** `var(--alchemy-parchment)` (lighter)
- **No gradient, just solid background

---

### 9. AfterQuizDeltaBanner

**Purpose:** Temporary notification showing top movers after quiz

**Visual Specifications:**
- **Position:** Fixed, top: `var(--space-4)` (16px), left: 50%, transform: translateX(-50%)
- **Width:** Min 320px, Max 600px
- **Padding:** `var(--space-4)` (16px) `var(--space-6)` (24px)
- **Background:** `var(--alchemy-cream)` (#F7F0E6) with 95% opacity (slight transparency)
- **Border:** 2px solid `var(--alchemy-gold-primary)` (#D4AF37)
- **Border Radius:** `var(--radius-lg)` (12px)
- **Shadow:** `var(--shadow-xl)` + `var(--glow-gold-medium)`
- **Z-Index:** `var(--z-modal)` (50)

**Header:**
- **Display:** Flex row, justify-content: space-between, align-items: center
- **Font:** `var(--font-serif)` at `var(--text-lg)` (18px)
- **Color:** `var(--alchemy-text-dark)` (#271C16)
- **Weight:** 600

**Close Button:**
- **Size:** 24px × 24px
- **Background:** Transparent
- **Color:** `var(--alchemy-text-dark-muted)` (#4A3F38)
- **Hover:** Color becomes `var(--alchemy-text-dark)`, background `rgba(210, 169, 90, 0.1)`
- **Focus:** Outline `var(--alchemy-gold-primary)`

**Movers List:**
- **Display:** Flex column
- **Gap:** `var(--space-2)` (8px)
- **Margin Top:** `var(--space-3)` (12px)

**Mover Item:**
- **Display:** Flex row, align-items: center, gap: `var(--space-2)`
- **Font:** `var(--font-sans)` at `var(--text-sm)` (14px)
- **Color:** `var(--alchemy-text-dark)` (#271C16)
- **Delta Value:** Font weight 700, color `var(--alchemy-gold-primary)` if positive, `var(--alchemy-bg-emerald)` if negative

**CTA Button:**
- **Margin Top:** `var(--space-4)` (16px)
- **Padding:** `var(--space-2)` (8px) `var(--space-4)` (16px)
- **Background:** `var(--alchemy-gold-primary)` (#D4AF37)
- **Color:** `var(--alchemy-text-dark)` (#271C16)
- **Border Radius:** `var(--radius-md)` (8px)
- **Font:** `var(--font-sans)` at `var(--text-sm)` (14px)
- **Weight:** 600
- **Hover:** Brighten + slight lift

**Animations:**
- **Enter:** Slide down + fade in (300ms ease-out)
- **Exit:** Fade out (200ms ease-in)
- **Auto-dismiss:** After 8-12s (configurable)

---

### 10. FooterCTAs

**Purpose:** Share/Copy link actions at page bottom

**Visual Specifications:**
- **Display:** Flex row, justify-content: center, gap: `var(--space-4)` (16px)
- **Padding:** `var(--space-8)` (32px) 0
- **Margin Top:** `var(--space-12)` (48px)
- **Border Top:** 1px solid `var(--border-gold-subtle)` (30% opacity)

**Button (Primary CTA):**
- **Padding:** `var(--space-3)` (12px) `var(--space-6)` (24px)
- **Background:** Linear gradient `135deg, var(--alchemy-gold-light), var(--alchemy-gold-primary), var(--alchemy-gold-dark)`
- **Color:** `var(--alchemy-text-dark)` (#271C16)
- **Border Radius:** `var(--radius-lg)` (12px)
- **Font:** `var(--font-sans)` at `var(--text-base)` (16px)
- **Weight:** 600
- **Shadow:** `var(--shadow-md)`
- **Hover:** Shadow `var(--shadow-lg)` + `var(--glow-gold-medium)`, transform: translateY(-1px)
- **Active:** transform: translateY(0)
- **Disabled:** Opacity 0.5, no transform

**Button (Secondary CTA):**
- **Background:** Transparent
- **Color:** `var(--alchemy-gold-primary)` (#D4AF37)
- **Border:** 2px solid `var(--alchemy-gold-primary)`
- **Hover:** Background `rgba(210, 169, 90, 0.1)`, shadow `var(--glow-gold-subtle)`

---

## Ornament Usage Guidelines

### Background Watermark (constellation-watermark.svg)
- **Opacity:** 4-8% (very subtle)
- **Position:** Fixed or absolute, centered or offset
- **Z-Index:** Behind all content (z-index: -1 or 0)
- **Blend Mode:** multiply or overlay (optional)
- **Use Case:** Page background, non-intrusive texture

### Corner Ornaments (corner.svg)
- **Size:** 80px × 80px (scalable)
- **Opacity:** 15-25% (visible but subtle)
- **Position:** Absolute in card corners
- **Rotation:** 0deg (top-left), 90deg (top-right), 180deg (bottom-right), 270deg (bottom-left)
- **Z-Index:** Above card background, below content
- **Use Case:** Card corners, frame decoration

### Divider (divider.svg)
- **Width:** 100% max-width 300px
- **Opacity:** 100% (fully visible)
- **Position:** Centered horizontally between sections
- **Margin:** `var(--space-8)` (32px) top/bottom
- **Use Case:** Section breaks, visual rhythm

### Botanical Sprig (botanical-sprig.svg)
- **Size:** 60px × 100px (scalable)
- **Opacity:** 20-30%
- **Position:** Decorative side elements, margins
- **Rotation:** Variable for organic feel
- **Use Case:** Side decoration, accent element

### Alchemy Circle (alchemy-circle.svg)
- **Size:** 120px × 120px (scalable)
- **Opacity:** 8-12% (subtle background)
- **Position:** Behind headers or as watermark
- **Use Case:** Section headers, mystical accent

### Icons (moon.svg, star.svg, crystal.svg)
- **Size:** 16-24px (icon size)
- **Opacity:** 100% (fully visible)
- **Color:** Inherits stroke color `#D4AF37`
- **Use Case:** Inline icons, badges, UI accents

---

## Accessibility Specifications

### Contrast Requirements (WCAG AA)
- **Text on Cream:** Minimum 4.5:1 ratio
  - `#271C16` (Ink Dark) on `#F7F0E6` (Cream) = **11.2:1** ✓
  - `#4A3F38` (Ink Muted) on `#F7F0E6` (Cream) = **6.8:1** ✓
- **Gold NOT used for body text:** Gold only for icons, borders, and accent text
- **Interactive elements:** Minimum 44px × 44px touch target

### Focus States
- **Focus Ring:** 2px solid `var(--alchemy-gold-primary)` (#D4AF37)
- **Focus Offset:** 2px outset
- **Focus Visible:** Only on keyboard navigation (not mouse clicks)

### Reduced Motion
- **Animation Duration:** <=250ms for users with `prefers-reduced-motion: reduce`
- **Bar animations:** Crossfade + number tween only (no slide/orbit/jitter)
- **Banner:** Fade only, no slide

### Keyboard Navigation
- **Tab Order:** Logical flow (header → stats → axes → derived → archetype → footer)
- **Skip Links:** Optional "Skip to main content" link
- **Interactive Elements:** All buttons/links keyboard-accessible

---

## Responsive Behavior

### Desktop (≥768px)
- **Grid Layout:** 2-column (see layout spec)
- **Card Max Width:** None (fills grid)
- **Typography:** Full scale (no reduction)

### Mobile (<768px)
- **Grid Layout:** 1-column stack
- **Card Padding:** Reduce to `var(--space-6)` (24px)
- **Typography:** Slightly smaller scale (H1 → `var(--text-3xl)` instead of `var(--text-4xl)`)
- **Ornaments:** Reduce size or hide background watermarks

---

## Animation Timing (Delta-Driven)

### Duration Calculation
```javascript
duration_ms = clamp(450, 1400, 450 + 1200 * delta_magnitude)
```

- **Small delta (0.01-0.05):** 450-510ms
- **Medium delta (0.05-0.2):** 510-690ms
- **Large delta (0.2-0.5):** 690-1050ms
- **Very large delta (0.5+):** 1050-1400ms

### Animation Sequence
1. **Freeze:** 80ms (all UI pauses)
2. **Bars + Numbers:** Animate simultaneously (duration from formula)
3. **Rails Markers:** Slide (same duration)
4. **Highlight Glow:** 1s outline glow on movers
5. **Delta Chip:** 2.5s display, then fade out

### Reduced Motion Override
- **All animations:** <=250ms
- **Only crossfade + number tween**
- **No slide, orbit, jitter, or complex transforms**

---

## File Size Targets

- **SVG Ornaments:** <5KB each (optimized, stroke-based)
- **SVG Icons:** <2KB each (minimal paths)
- **Total Ornament Pack:** <30KB (all assets)

---

## Implementation Checklist

- [ ] All components use design tokens (no hardcoded colors)
- [ ] Contrast ratios verified with WCAG tools
- [ ] Focus states implemented for all interactive elements
- [ ] Touch targets meet 44px minimum
- [ ] Reduced motion CSS applied
- [ ] Ornaments optimized and compressed
- [ ] Typography hierarchy consistent (Serif headings, Sans body)
- [ ] Animations use delta-driven duration formula
- [ ] Mobile/Desktop breakpoints tested
- [ ] Keyboard navigation flow verified

---

**End of Component Visual Specifications**

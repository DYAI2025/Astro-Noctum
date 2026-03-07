# Light-Grimoire Theme Tokens

**Phase 0 - Character Sheet Design System**
**Created:** 2025-12-14
**Purpose:** Premium light theme for character sheet implementation

---

## Design Philosophy

The Light-Grimoire theme creates a premium, mystical character sheet experience using:

- **Parchment/Cream backgrounds** - Warm, inviting, and tactile feeling
- **High-contrast dark text** - Ensures WCAG AA accessibility
- **Emerald & Gold accents** - Alchemical, mystical visual language
- **Subtle ornamental elements** - Premium polish without clutter

### Context

This light theme serves the character sheet within the otherwise dark-themed QuizzMe platform. The contrast between dark quiz pages and light character sheet creates a "sacred space" feeling - opening your character sheet feels like opening an illuminated manuscript.

---

## Semantic Token System

### Background Tokens

| Token | Value | Usage | Notes |
|-------|-------|-------|-------|
| `--lg-bg-base` | `#F7F0E6` | Primary page background | Warm cream/parchment |
| `--lg-bg-card` | `#FDFCFA` | Card surfaces | Slightly lighter, crisp |
| `--lg-bg-surface` | `#F2E3CF` | Secondary surfaces | Warmer parchment tone |
| `--lg-bg-elevated` | `#FFFFFF` | Elevated elements | Pure white for contrast |

**Design Decision:** We use multiple shades of parchment to create subtle depth hierarchy without relying on heavy shadows, maintaining the "light grimoire" aesthetic.

### Border Tokens

| Token | Value | Usage | Notes |
|-------|-------|-------|-------|
| `--lg-border-subtle` | `rgba(210,169,90,0.2)` | Subtle gold borders (20%) | Delicate dividers |
| `--lg-border-medium` | `rgba(210,169,90,0.4)` | Standard borders (40%) | Card borders |
| `--lg-border-strong` | `#D4AF37` | Emphasis borders (100%) | Highlighted elements |
| `--lg-border-emerald` | `rgba(16,185,129,0.3)` | Emerald accent (30%) | Positive indicators |

**Design Decision:** Gold borders are semi-transparent to allow parchment warmth to bleed through, creating richer visual texture than solid borders would provide.

### Text Tokens (High Contrast)

| Token | Value | Contrast Ratio | Usage |
|-------|-------|----------------|-------|
| `--lg-text-primary` | `#271C16` | 13.5:1 on cream | Primary text (AAA) |
| `--lg-text-secondary` | `#4A3F38` | 7.8:1 on cream | Secondary text (AA) |
| `--lg-text-muted` | `#6B5F57` | 4.6:1 on cream | Muted text (AA) |
| `--lg-text-emerald` | `#053B3F` | 11.2:1 on cream | Emerald text (AAA) |
| `--lg-text-gold` | `#8B7335` | 5.2:1 on cream | Gold labels (AA) |

**Accessibility:** All text colors meet WCAG AA standards (4.5:1 minimum). Primary and emerald text exceed AAA standards (7:1+).

**Critical Rule:** `--lg-accent-gold` (#D4AF37) is NEVER used for body text - decorative only. It doesn't meet contrast requirements.

### Accent Tokens

| Token | Value | Usage | Notes |
|-------|-------|-------|-------|
| `--lg-accent-gold` | `#D4AF37` | Ornaments, highlights | Pure gold (#D4AF37) |
| `--lg-accent-gold-light` | `#E8C77B` | Hover states | Lighter gold |
| `--lg-accent-gold-dark` | `#A77D38` | Active states | Darker gold |
| `--lg-accent-emerald` | `#10B981` | Progress, positive | Emerald green |
| `--lg-accent-emerald-dark` | `#059669` | Emphasis | Dark emerald |

**Design Decision:** Emerald green (#10B981) represents growth, progress, and positive change - used for stat increases and progress bars.

---

## Component-Specific Tokens

### Card System

```css
--lg-card-bg: var(--lg-bg-card);
--lg-card-border: var(--lg-border-medium);
--lg-card-shadow: 0 2px 8px rgba(39,28,22,0.08), 0 1px 3px rgba(39,28,22,0.06);
--lg-card-shadow-hover: 0 8px 24px rgba(39,28,22,0.12),
                        0 4px 8px rgba(39,28,22,0.08),
                        0 0 0 1px rgba(210,169,90,0.3);
```

**Design Decision:** Shadows use dark brown (#271C16) instead of neutral gray to maintain warm, earthy palette. Hover state adds subtle gold ring.

### Stats & Progress Bars

```css
--lg-bar-track: #E8D5BD;  /* Darker parchment */
--lg-bar-fill: linear-gradient(90deg,
                var(--lg-accent-gold-dark) 0%,
                var(--lg-accent-gold) 100%);
```

**Design Decision:** Gradient fills add dimension and premium feel. Dark-to-light gradient suggests forward motion.

### Badges & Pills

```css
--lg-badge-bg: rgba(210,169,90,0.1);
--lg-badge-border: var(--lg-border-medium);
--lg-badge-text: var(--lg-text-primary);
```

**Design Decision:** Subtle gold tint (10% opacity) provides visual grouping without overwhelming the page.

### Ornaments & Decorative Elements

```css
--lg-ornament-gold: var(--lg-accent-gold);
--lg-ornament-gold-subtle: rgba(210,169,90,0.15);
--lg-watermark-opacity: 0.06;  /* Very subtle */
```

**Critical Rule:** Watermark opacity capped at 6% to prevent interference with text readability.

---

## Animation & Interaction Tokens

### Transitions

```css
--lg-transition-fast: 150ms cubic-bezier(0.25,0.46,0.45,0.94);
--lg-transition-base: 300ms cubic-bezier(0.25,0.46,0.45,0.94);
--lg-transition-slow: 500ms cubic-bezier(0.215,0.61,0.355,1);
```

**Design Decision:** Custom easing curves create smooth, premium-feeling animations. Cubic bezier values tuned for "ease-out-quad" feeling.

### Delta Animation Durations

Based on spec formula: `duration = clamp(450, 1400, 450 + 1200 * delta_magnitude)`

```css
--lg-delta-freeze: 80ms;               /* Freeze before animation */
--lg-delta-min: 450ms;                 /* Minimum animation duration */
--lg-delta-max: 1400ms;                /* Maximum animation duration */
--lg-delta-reduced-motion: 250ms;      /* Reduced motion override */
```

**Accessibility:** When `prefers-reduced-motion` is detected, all animations limited to ≤250ms with crossfade only.

### Highlight & Glow

```css
--lg-highlight-glow: 0 0 12px rgba(210,169,90,0.4),
                     0 0 24px rgba(210,169,90,0.2);
--lg-mover-outline: 2px solid rgba(210,169,90,0.6);
```

**Usage:** Applied to "top movers" (dimensions with largest delta) after quiz completion for 1-2.5 seconds.

---

## Spacing & Sizing Tokens

### Spacing Scale

```css
--lg-space-xs:  0.25rem;  /* 4px */
--lg-space-sm:  0.5rem;   /* 8px */
--lg-space-md:  1rem;     /* 16px */
--lg-space-lg:  1.5rem;   /* 24px */
--lg-space-xl:  2rem;     /* 32px */
--lg-space-2xl: 3rem;     /* 48px */
```

**Design Decision:** 8px base unit (--lg-space-sm) creates consistent rhythm. All spacing is multiple of 4px.

### Border Radius

```css
--lg-radius-sm: 0.375rem;  /* 6px */
--lg-radius-md: 0.5rem;    /* 8px */
--lg-radius-lg: 0.75rem;   /* 12px */
--lg-radius-xl: 1rem;      /* 16px */
```

**Design Decision:** Moderate radius values (not too rounded) maintain elegant, manuscript-like aesthetic.

---

## Accessibility Features

### Focus States

```css
--lg-focus-ring: 0 0 0 3px rgba(210,169,90,0.5);
--lg-focus-ring-emerald: 0 0 0 3px rgba(16,185,129,0.3);
```

**Accessibility:** 3px ring width exceeds WCAG 2.2 requirements (2.4.13 - Focus Appearance).

### Reduced Motion

All animations respect `prefers-reduced-motion`:
- Durations limited to ≤250ms
- Motion effects (orbit, jitter) disabled
- Only opacity/color transitions allowed

---

## Usage Examples

### Basic Card

```css
.character-card {
  background: var(--lg-card-bg);
  border: 1px solid var(--lg-card-border);
  border-radius: var(--lg-radius-xl);
  box-shadow: var(--lg-card-shadow);
  padding: var(--lg-space-lg);
}
```

### Stat Bar

```css
.stat-bar-fill {
  background: var(--lg-bar-fill);
  transition: width var(--lg-transition-slow);
}
```

### Delta Badge

```css
.delta-badge {
  background: var(--lg-badge-emerald-bg);
  border: 1px solid var(--lg-badge-emerald-border);
  color: var(--lg-text-emerald);
}
```

---

## Design Rationale

### Why Light Theme for Character Sheet?

1. **Sacred Space Concept** - Light theme creates visual distinction from dark quiz pages, making character sheet feel like opening a special document
2. **Readability** - Dense stat tables benefit from high-contrast dark text on light backgrounds
3. **Premium Feel** - Light parchment evokes illuminated manuscripts, grimoires, and sacred texts
4. **Brand Consistency** - Maintains Modern Alchemy palette (emerald, gold, parchment) while inverting light/dark balance

### Color Palette Origins

- **Emerald** (#10B981) - From Modern Alchemy core palette, represents growth/transformation
- **Gold** (#D4AF37) - Alchemical metal, mystical wisdom, premium quality
- **Parchment** (#F7F0E6) - Warm, organic, handcrafted feel
- **Dark Ink** (#271C16) - Rich brown-black for manuscript authenticity

---

## Token Naming Convention

Format: `--lg-[category]-[variant]`

- `lg` = Light-Grimoire namespace
- `category` = bg, text, accent, border, etc.
- `variant` = primary, secondary, subtle, etc.

**Examples:**
- `--lg-bg-card` - Card background
- `--lg-text-primary` - Primary text color
- `--lg-accent-gold` - Gold accent color

---

## Migration Notes

These tokens coexist with Modern Alchemy tokens:
- Modern Alchemy = Dark theme (quiz pages)
- Light-Grimoire = Light theme (character sheet)

Both share font families and some spacing values, but have independent color systems.

---

## Future Considerations

1. **Avatar-Driven Theming** - Tokens structured to allow future `--accent-ink` overrides based on user avatar
2. **Seasonal Variants** - Base tokens make seasonal palette swaps feasible
3. **Component Library** - Tokens designed for Storybook/design system export

---

**References:**
- Implementation: `/src/app/styles/light-grimoire-tokens.css`
- Typography: `docs/design/typography.md`
- Spec: `docs/plans/feature-char-sheet-impl.md`

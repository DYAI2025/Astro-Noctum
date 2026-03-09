# Light-Grimoire Typography System

**Phase 0 - Character Sheet Design System**
**Created:** 2025-12-14
**Purpose:** Typography hierarchy for premium character sheet experience

---

## Typography Philosophy

The Light-Grimoire typography system balances elegance with functionality:

- **Serif Headlines** (Playfair Display) - Premium, mystical, authoritative
- **Sans-Serif Body** (Inter) - Clear, modern, highly readable
- **Tabular Numbers** - Professional stat display with aligned digits
- **Responsive Scaling** - Fluid type that adapts gracefully to mobile

### Design Principles

1. **Hierarchy through Font Family** - Serif = important, Sans = functional
2. **Contrast through Weight** - Semibold headlines, normal body
3. **Readability First** - Generous line-height for body text (1.625)
4. **Premium Details** - OpenType features, proper letter-spacing

---

## Font Families

### Primary Fonts

```css
--lg-font-serif: 'Playfair Display', 'Cormorant Garamond', Georgia, serif;
--lg-font-sans: 'Inter', 'Source Sans 3', system-ui, -apple-system, sans-serif;
--lg-font-mono: 'Geist Mono', 'Courier New', monospace;
```

#### Playfair Display (Serif)
- **Usage:** Headlines, section titles, card headers
- **Why:** Elegant, high-contrast serif evokes illuminated manuscripts
- **Fallbacks:** Cormorant Garamond → Georgia → system serif
- **Weights Available:** 400, 500, 600, 700

#### Inter (Sans-Serif)
- **Usage:** Body text, labels, UI elements, stats
- **Why:** Excellent readability, OpenType features, tabular numbers
- **Fallbacks:** Source Sans 3 → system-ui → default sans-serif
- **Weights Available:** 300, 400, 500, 600, 700

#### Geist Mono (Monospace)
- **Usage:** Optional for code/debug displays (rarely used in character sheet)
- **Why:** Modern, clean monospace for technical displays

---

## Type Scale

### Desktop Scale (Base: 16px)

| Token | Size | Pixels | Usage |
|-------|------|--------|-------|
| `--lg-text-display` | 3.75rem | 60px | Page title ("Dein Character Sheet") |
| `--lg-text-h1` | 2.25rem | 36px | Section title |
| `--lg-text-h2` | 1.875rem | 30px | Card title |
| `--lg-text-h3` | 1.5rem | 24px | Subsection |
| `--lg-text-h4` | 1.25rem | 20px | Component header |
| `--lg-text-h5` | 1.125rem | 18px | Small header |
| `--lg-text-body-lg` | 1.125rem | 18px | Large body text |
| `--lg-text-body` | 1rem | 16px | Default body |
| `--lg-text-body-sm` | 0.875rem | 14px | Small body |
| `--lg-text-body-xs` | 0.75rem | 12px | Caption/meta |

### Mobile Scale (< 768px)

| Token | Desktop | Mobile | Reduction |
|-------|---------|--------|-----------|
| Display | 60px | 40px | -33% |
| H1 | 36px | 30px | -17% |
| H2 | 30px | 24px | -20% |
| H3 | 24px | 20px | -17% |
| H4 | 20px | 18px | -10% |
| H5 | 18px | 16px | -11% |

**Design Decision:** Mobile reductions are moderate (10-33%) to maintain readability on small screens while conserving vertical space.

### Stat Display Scale

Special sizes for numeric displays with tabular formatting:

| Token | Size | Pixels | Usage |
|-------|------|--------|-------|
| `--lg-text-stat-display` | 2.5rem | 40px | Large stat value |
| `--lg-text-stat-lg` | 1.5rem | 24px | Medium stat |
| `--lg-text-stat-md` | 1.125rem | 18px | Small stat |
| `--lg-text-stat-sm` | 1rem | 16px | Inline stat |

**Mobile Adjustments:**
- Stat Display: 40px → 32px (2rem)
- Stat Large: 24px → 20px (1.25rem)

### Label Scale

Uppercase labels with wider letter-spacing:

| Token | Size | Pixels | Usage |
|-------|------|--------|-------|
| `--lg-text-label` | 0.875rem | 14px | Standard label |
| `--lg-text-label-sm` | 0.75rem | 12px | Small label |
| `--lg-text-label-xs` | 0.6875rem | 11px | Micro label |

---

## Line Heights

```css
--lg-leading-none: 1;        /* Display text - tight */
--lg-leading-tight: 1.2;     /* Headlines - compact */
--lg-leading-snug: 1.375;    /* Subheadings - moderate */
--lg-leading-normal: 1.5;    /* Default body - standard */
--lg-leading-relaxed: 1.625; /* Comfortable reading */
--lg-leading-loose: 1.75;    /* Very spacious */
```

### Usage Guidelines

- **Display Text (1.0):** Single-line page titles, large numbers
- **Headlines (1.2):** H1-H3, card titles
- **Subheadings (1.375):** H4-H5, component headers
- **Body Text (1.5-1.625):** Paragraphs, descriptions, tooltips
- **Loose (1.75):** Long-form content (rarely used in character sheet)

**Design Decision:** Body text uses 1.625 line-height (instead of standard 1.5) for enhanced comfort during stat comparison tasks.

---

## Font Weights

```css
--lg-weight-light: 300;      /* Subtle emphasis */
--lg-weight-normal: 400;     /* Body text default */
--lg-weight-medium: 500;     /* Labels, secondary emphasis */
--lg-weight-semibold: 600;   /* Headlines, stat values */
--lg-weight-bold: 700;       /* Strong emphasis (rarely used) */
```

### Weight Mapping

| Context | Weight | Token |
|---------|--------|-------|
| Display | 600 | Semibold |
| H1-H3 | 600 | Semibold |
| H4-H5 | 500 | Medium |
| Body | 400 | Normal |
| Labels | 500 | Medium |
| Stats | 600 | Semibold |
| Delta chips | 600 | Semibold |

**Design Decision:** We avoid 700 (Bold) to maintain elegant, refined aesthetic. Semibold (600) provides sufficient emphasis.

---

## Letter Spacing

```css
--lg-tracking-tighter: -0.05em;   /* Display text */
--lg-tracking-tight: -0.025em;    /* Headlines */
--lg-tracking-normal: 0;          /* Body text */
--lg-tracking-wide: 0.025em;      /* Labels */
--lg-tracking-wider: 0.05em;      /* Section labels (UPPERCASE) */
--lg-tracking-widest: 0.1em;      /* Micro labels */
```

### Usage Guidelines

- **Negative Tracking (-0.05em to -0.025em):** Large display text and headlines to tighten kerning
- **Normal (0):** Body text, paragraphs
- **Positive Tracking (+0.025em to +0.1em):** Uppercase labels, small text

**Design Decision:** Uppercase labels get wider tracking to improve legibility at small sizes and reduce visual density.

---

## OpenType Features

### Tabular Numbers (Stats)

```css
font-variant-numeric: tabular-nums;
font-feature-settings: 'tnum' 1;
```

**Usage:** All stat displays (scores, percentages, deltas)

**Why:** Equal-width digits prevent layout shift when values update during animations.

**Example:**
```
WITHOUT TABULAR:
Clarity:   87  ← narrow 8, narrow 7
Connection: 93  ← wide 9, narrow 3 (misaligned)

WITH TABULAR:
Clarity:   87  ← equal width
Connection: 93  ← perfectly aligned
```

### Old-Style Figures (Body Text)

```css
font-variant-numeric: oldstyle-nums;
font-feature-settings: 'onum' 1;
```

**Usage:** Optional for body text and descriptions (not stat displays)

**Why:** Old-style figures (with descenders/ascenders) blend better with lowercase text, creating more elegant prose.

**Note:** Currently not applied by default - available for future use in narrative sections.

### Ligatures (Serif Headlines)

```css
font-feature-settings: 'liga' 1, 'clig' 1;
```

**Usage:** Automatically enabled for Playfair Display headlines

**Why:** Proper ligatures (fi, fl, ff) improve elegance of serif text.

### Small Caps (Section Labels)

```css
font-variant: small-caps;
font-feature-settings: 'smcp' 1;
```

**Usage:** Section labels, categories

**Why:** True small caps (not scaled capitals) provide refined uppercase styling.

---

## Typography Utility Classes

### Display Styles (Serif)

```css
.lg-text-display {
  font-family: var(--lg-font-serif);
  font-size: var(--lg-text-display);
  font-weight: var(--lg-weight-semibold);
  line-height: var(--lg-leading-tight);
  letter-spacing: var(--lg-tracking-tighter);
}
```

**Example HTML:**
```html
<h1 class="lg-text-display">Dein Character Sheet</h1>
```

### Heading Styles (Serif)

```css
.lg-text-h1 { /* Section titles */ }
.lg-text-h2 { /* Card titles */ }
.lg-text-h3 { /* Subsections */ }
.lg-text-h4 { /* Component headers */ }
.lg-text-h5 { /* Small headers */ }
```

**Example HTML:**
```html
<h2 class="lg-text-h2">Kernwerte</h2>
<h3 class="lg-text-h3">Dein Klima</h3>
```

### Body Styles (Sans-Serif)

```css
.lg-text-body-lg { /* Large body text */ }
.lg-text-body    { /* Default body */ }
.lg-text-body-sm { /* Small body */ }
.lg-text-body-xs { /* Caption/meta */ }
```

**Example HTML:**
```html
<p class="lg-text-body">Dein Avatar ist ein Klima, kein Label.</p>
<span class="lg-text-body-xs">Zuletzt aktualisiert: 14.12.2024</span>
```

### Stat Display Styles (Tabular)

```css
.lg-text-stat-display { /* 40px, tabular */ }
.lg-text-stat-lg      { /* 24px, tabular */ }
.lg-text-stat-md      { /* 18px, tabular */ }
.lg-text-stat-sm      { /* 16px, tabular */ }
```

**Example HTML:**
```html
<span class="lg-text-stat-lg">87</span>
<span class="lg-text-stat-sm">+3</span>
```

### Label Styles (Uppercase)

```css
.lg-text-label    { /* 14px, uppercase, medium tracking */ }
.lg-text-label-sm { /* 12px, uppercase, wider tracking */ }
.lg-text-label-xs { /* 11px, uppercase, widest tracking */ }
```

**Example HTML:**
```html
<label class="lg-text-label">Clarity</label>
<span class="lg-text-label-sm">Top Mover</span>
```

---

## Character Sheet Patterns

### Stat Row Pattern

```html
<div class="lg-stat-row">
  <span class="lg-stat-label">Clarity</span>
  <span class="lg-stat-value">87</span>
</div>
```

**Styling:**
```css
.lg-stat-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--lg-space-md);
}

.lg-stat-label {
  font-family: var(--lg-font-sans);
  font-size: var(--lg-text-body);
  font-weight: var(--lg-weight-medium);
}

.lg-stat-value {
  font-family: var(--lg-font-sans);
  font-size: var(--lg-text-stat-md);
  font-weight: var(--lg-weight-semibold);
  font-variant-numeric: tabular-nums;
}
```

### Axis Label Pattern

```html
<div class="lg-axis-labels">
  <span>Licht</span>
  <span>Schatten</span>
</div>
```

**Styling:**
```css
.lg-axis-labels {
  display: flex;
  justify-content: space-between;
  font-family: var(--lg-font-sans);
  font-size: var(--lg-text-body-sm);
  font-weight: var(--lg-weight-medium);
  text-transform: uppercase;
  letter-spacing: var(--lg-tracking-wide);
  color: var(--lg-text-secondary);
}
```

### Card Title Pattern

```html
<h2 class="lg-card-title">Kernwerte</h2>
```

**Styling:**
```css
.lg-card-title {
  font-family: var(--lg-font-serif);
  font-size: var(--lg-text-h3);
  font-weight: var(--lg-weight-semibold);
  line-height: var(--lg-leading-tight);
  color: var(--lg-text-primary);
  margin-bottom: var(--lg-space-lg);
}
```

### Section Header Pattern

```html
<h1 class="lg-section-header">Dein Character Sheet</h1>
```

**Styling:**
```css
.lg-section-header {
  font-family: var(--lg-font-serif);
  font-size: var(--lg-text-h2);
  font-weight: var(--lg-weight-semibold);
  line-height: var(--lg-leading-tight);
  color: var(--lg-text-primary);
  margin-bottom: var(--lg-space-xl);
  padding-bottom: var(--lg-space-md);
  border-bottom: 2px solid var(--lg-border-subtle);
}
```

### Delta Chip Pattern

```html
<span class="lg-delta-chip">+3</span>
```

**Styling:**
```css
.lg-delta-chip {
  font-family: var(--lg-font-sans);
  font-size: var(--lg-text-body-xs);
  font-weight: var(--lg-weight-semibold);
  font-variant-numeric: tabular-nums;
  color: var(--lg-text-emerald);
}
```

---

## Responsive Typography

### Breakpoint Strategy

- **Desktop:** 768px+ (default scale)
- **Mobile:** < 768px (reduced scale)

### Mobile Adjustments

```css
@media (max-width: 768px) {
  .lg-text-display { font-size: 2.5rem; }  /* 60px → 40px */
  .lg-text-h1 { font-size: 1.875rem; }     /* 36px → 30px */
  .lg-text-h2 { font-size: 1.5rem; }       /* 30px → 24px */
  .lg-text-h3 { font-size: 1.25rem; }      /* 24px → 20px */
  .lg-text-h4 { font-size: 1.125rem; }     /* 20px → 18px */
  .lg-text-h5 { font-size: 1rem; }         /* 18px → 16px */

  .lg-text-stat-display { font-size: 2rem; }    /* 40px → 32px */
  .lg-text-stat-lg { font-size: 1.25rem; }      /* 24px → 20px */
}
```

**Design Decision:** Body text sizes remain unchanged on mobile to maintain WCAG minimum legibility (16px baseline).

---

## Accessibility Considerations

### Minimum Font Sizes

- **Body Text:** 16px minimum (1rem)
- **Small Text:** 14px minimum (0.875rem)
- **Labels:** 12px minimum (0.75rem) - only for labels, never paragraphs

**WCAG Guideline:** Text under 18px requires 4.5:1 contrast ratio (achieved by --lg-text-primary).

### Tabular Numbers for Accessibility

Tabular numbers prevent layout shift during animations, reducing cognitive load for users tracking stat changes.

**Example:**
- ❌ Proportional: Value changes from "87" to "93" causes horizontal shift
- ✅ Tabular: Digits remain aligned vertically across updates

### Reduced Motion

Typography animations (color, opacity) respect `prefers-reduced-motion` - no excessive motion in text displays.

---

## Typography Modifiers

### Color Variants

```css
.lg-text-gold     { color: var(--lg-text-gold); }
.lg-text-emerald  { color: var(--lg-text-emerald); }
.lg-text-muted    { color: var(--lg-text-muted); }
```

### Number Features

```css
.lg-tabular   { font-variant-numeric: tabular-nums; }
.lg-oldstyle  { font-variant-numeric: oldstyle-nums; }
.lg-smallcaps { font-variant: small-caps; }
```

---

## Font Loading Strategy

### Next.js Font Integration

```typescript
import { Playfair_Display, Inter } from 'next/font/google';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-playfair',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});
```

**Performance:**
- `display: swap` prevents invisible text during load
- Subsets limited to `latin` for smaller bundle size
- Weights limited to actually used values (300-700)

---

## Design Rationale

### Why Playfair Display for Headlines?

1. **Premium Feel** - High-contrast serif evokes luxury, craftsmanship
2. **Mystical Association** - Classical serif matches grimoire/manuscript theme
3. **Hierarchy Clarity** - Distinct from body sans-serif creates clear visual hierarchy
4. **Brand Alignment** - Complements Modern Alchemy aesthetic

### Why Inter for Body Text?

1. **Readability** - Designed for screens, excellent x-height
2. **OpenType Features** - Tabular numbers, multiple weights
3. **Modern Balance** - Balances classical serif headlines with contemporary clarity
4. **Performance** - Google Fonts optimized, fast load times

### Why Tabular Numbers?

Character sheets involve frequent stat comparisons. Tabular numbers enable:
1. **Vertical Scanning** - Users can scan columns of numbers efficiently
2. **Animation Stability** - Prevents layout shift during delta animations
3. **Professional Appearance** - Matches dashboard/analytics UI patterns

---

## Future Considerations

1. **Variable Fonts** - Potential upgrade to Inter Variable for smaller bundle
2. **Fluid Typography** - CSS clamp() for smoother responsive scaling
3. **Contextual Alternates** - Explore additional OpenType features in Playfair
4. **Multi-Language Support** - Expand subsets if internationalization needed

---

## Typography Checklist

When implementing character sheet components:

- [ ] Use `.lg-text-h2` for card titles
- [ ] Use `.lg-text-body` for descriptions
- [ ] Use `.lg-text-stat-*` for numeric displays
- [ ] Use `.lg-text-label` for uppercase labels
- [ ] Apply `.lg-tabular` to all stat values
- [ ] Test mobile responsive scaling
- [ ] Verify contrast ratios on parchment background
- [ ] Ensure focus states are visible

---

**References:**
- Implementation: `/src/app/styles/light-grimoire-typography.css`
- Theme Tokens: `docs/design/tokens.md`
- Spec: `docs/plans/feature-char-sheet-impl.md`

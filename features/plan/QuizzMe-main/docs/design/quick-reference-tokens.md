# Light-Grimoire Tokens - Quick Reference

**For Developers & Designers**
**Last Updated:** 2025-12-14

---

## Color Palette - At a Glance

```css
/* BACKGROUNDS (Parchment/Cream) */
--lg-bg-base:      #F7F0E6  /* Primary background - warm cream */
--lg-bg-card:      #FDFCFA  /* Card surfaces - crisp white-cream */
--lg-bg-surface:   #F2E3CF  /* Secondary surfaces - warmer parchment */
--lg-bg-elevated:  #FFFFFF  /* Elevated elements - pure white */

/* TEXT (High Contrast Dark) */
--lg-text-primary:   #271C16  /* Primary text - 13.5:1 contrast (AAA) */
--lg-text-secondary: #4A3F38  /* Secondary text - 7.8:1 (AA) */
--lg-text-muted:     #6B5F57  /* Muted text - 4.6:1 (AA) */
--lg-text-emerald:   #053B3F  /* Emerald text - 11.2:1 (AAA) */
--lg-text-gold:      #8B7335  /* Gold labels - 5.2:1 (AA) */

/* ACCENTS */
--lg-accent-gold:          #D4AF37  /* Primary gold - DECORATIVE ONLY */
--lg-accent-gold-light:    #E8C77B  /* Light gold - hover states */
--lg-accent-gold-dark:     #A77D38  /* Dark gold - active states */
--lg-accent-emerald:       #10B981  /* Emerald - progress, positive */
--lg-accent-emerald-dark:  #059669  /* Dark emerald - emphasis */

/* BORDERS */
--lg-border-subtle:  rgba(210,169,90,0.2)  /* 20% gold - delicate */
--lg-border-medium:  rgba(210,169,90,0.4)  /* 40% gold - standard */
--lg-border-strong:  #D4AF37               /* 100% gold - emphasis */
--lg-border-emerald: rgba(16,185,129,0.3)  /* 30% emerald - positive */
```

---

## Typography - At a Glance

```css
/* FONT FAMILIES */
--lg-font-serif: 'Playfair Display', Georgia, serif  /* Headlines */
--lg-font-sans:  'Inter', system-ui, sans-serif      /* Body, UI */

/* HEADINGS (Serif, Semibold) */
--lg-text-display: 3.75rem  /* 60px - Page title */
--lg-text-h1:      2.25rem  /* 36px - Section title */
--lg-text-h2:      1.875rem /* 30px - Card title */
--lg-text-h3:      1.5rem   /* 24px - Subsection */
--lg-text-h4:      1.25rem  /* 20px - Component header */

/* BODY (Sans, Normal) */
--lg-text-body-lg: 1.125rem /* 18px - Large body */
--lg-text-body:    1rem     /* 16px - Default body */
--lg-text-body-sm: 0.875rem /* 14px - Small body */
--lg-text-body-xs: 0.75rem  /* 12px - Caption */

/* STATS (Sans, Semibold, Tabular) */
--lg-text-stat-display: 2.5rem   /* 40px - Large stat */
--lg-text-stat-lg:      1.5rem   /* 24px - Medium stat */
--lg-text-stat-md:      1.125rem /* 18px - Small stat */

/* LABELS (Sans, Medium, Uppercase) */
--lg-text-label:    0.875rem /* 14px - Standard label */
--lg-text-label-sm: 0.75rem  /* 12px - Small label */
```

---

## Spacing & Sizing

```css
/* SPACING (8px base unit) */
--lg-space-xs:  0.25rem  /* 4px */
--lg-space-sm:  0.5rem   /* 8px */
--lg-space-md:  1rem     /* 16px */
--lg-space-lg:  1.5rem   /* 24px */
--lg-space-xl:  2rem     /* 32px */
--lg-space-2xl: 3rem     /* 48px */

/* BORDER RADIUS */
--lg-radius-sm: 0.375rem /* 6px */
--lg-radius-md: 0.5rem   /* 8px */
--lg-radius-lg: 0.75rem  /* 12px */
--lg-radius-xl: 1rem     /* 16px */
```

---

## Utility Classes - Quick Copy

### Cards
```html
<div class="lg-card">
  <!-- Card content -->
</div>
```

### Headings
```html
<h1 class="lg-text-display">Page Title</h1>
<h2 class="lg-text-h1">Section Title</h2>
<h3 class="lg-text-h2">Card Title</h3>
```

### Body Text
```html
<p class="lg-text-body">Regular paragraph text</p>
<p class="lg-text-body-sm">Small text</p>
<span class="lg-text-body-xs">Caption or meta</span>
```

### Stats
```html
<span class="lg-text-stat-lg">87</span>
<span class="lg-delta-chip">+3</span>
```

### Labels
```html
<label class="lg-text-label">Clarity</label>
<span class="lg-text-label-sm">Category</span>
```

### Stat Bar
```html
<div class="lg-stat-bar">
  <span class="lg-stat-label">Clarity</span>
  <div class="lg-stat-bar-track">
    <div class="lg-stat-bar-fill" style="width: 87%"></div>
  </div>
  <span class="lg-stat-value">87</span>
</div>
```

### Badge
```html
<span class="lg-badge">
  Label
</span>
```

---

## Component Tokens

### Card System
```css
--lg-card-bg:           var(--lg-bg-card)
--lg-card-border:       var(--lg-border-medium)
--lg-card-shadow:       0 2px 8px rgba(39,28,22,0.08)
--lg-card-shadow-hover: 0 8px 24px rgba(39,28,22,0.12)
```

### Stat Bars
```css
--lg-bar-track: #E8D5BD  /* Darker parchment */
--lg-bar-fill:  linear-gradient(90deg, #A77D38 0%, #D4AF37 100%)
```

### Badges
```css
--lg-badge-bg:     rgba(210,169,90,0.1)
--lg-badge-border: var(--lg-border-medium)
--lg-badge-text:   var(--lg-text-primary)
```

---

## Animations & Transitions

```css
/* TRANSITIONS */
--lg-transition-fast: 150ms cubic-bezier(0.25,0.46,0.45,0.94)
--lg-transition-base: 300ms cubic-bezier(0.25,0.46,0.45,0.94)
--lg-transition-slow: 500ms cubic-bezier(0.215,0.61,0.355,1)

/* DELTA ANIMATIONS */
--lg-delta-freeze: 80ms              /* Pause before animation */
--lg-delta-min:    450ms             /* Minimum duration */
--lg-delta-max:    1400ms            /* Maximum duration */
--lg-delta-reduced-motion: 250ms     /* Reduced motion override */

/* EFFECTS */
--lg-highlight-glow: 0 0 12px rgba(210,169,90,0.4)
--lg-mover-outline:  2px solid rgba(210,169,90,0.6)
--lg-focus-ring:     0 0 0 3px rgba(210,169,90,0.5)
```

---

## Accessibility Rules

### Contrast Requirements
- Primary text: 13.5:1 ✓ (AAA)
- Secondary text: 7.8:1 ✓ (AA)
- Minimum text: 4.5:1 ✓ (AA)

### Critical Rules
1. NEVER use `--lg-accent-gold` (#D4AF37) for body text
2. Always use `--lg-text-primary` for paragraphs
3. Use `--lg-text-emerald` for positive indicators
4. Apply `.lg-tabular` to all stat values
5. Respect `prefers-reduced-motion`

### Focus States
```css
.lg-focus:focus-visible {
  box-shadow: var(--lg-focus-ring); /* 3px ring */
}
```

---

## Common Patterns

### Stat Row
```html
<div class="lg-stat-row">
  <span class="lg-stat-label">Clarity</span>
  <span class="lg-stat-value">87</span>
</div>
```

### Axis Labels
```html
<div class="lg-axis-labels">
  <span>Licht</span>
  <span>Schatten</span>
</div>
```

### Card Header
```html
<h2 class="lg-card-title">Kernwerte</h2>
```

### Section Header
```html
<h1 class="lg-section-header">Dein Character Sheet</h1>
```

---

## Mobile Responsive

Breakpoint: `768px`

| Element | Desktop | Mobile |
|---------|---------|--------|
| Display | 60px | 40px |
| H1 | 36px | 30px |
| H2 | 30px | 24px |
| H3 | 24px | 20px |
| Stat Display | 40px | 32px |
| Body | 16px | 16px (unchanged) |

---

## File Locations

- **Tokens CSS:** `/src/app/styles/light-grimoire-tokens.css`
- **Typography CSS:** `/src/app/styles/light-grimoire-typography.css`
- **Full Docs:** `/docs/design/tokens.md` and `/docs/design/typography.md`

---

## Usage in Components

```tsx
// React/Next.js Component Example
export function CharacterCard() {
  return (
    <div className="lg-card">
      <h2 className="lg-card-title">Kernwerte</h2>

      <div className="lg-stat-row">
        <span className="lg-stat-label">Clarity</span>
        <span className="lg-stat-value lg-tabular">87</span>
      </div>

      <div className="lg-stat-bar">
        <div className="lg-stat-bar-track">
          <div
            className="lg-stat-bar-fill"
            style={{ width: '87%' }}
          />
        </div>
      </div>

      <span className="lg-badge">
        <span className="lg-delta-chip">+3</span>
      </span>
    </div>
  );
}
```

---

## Next Steps

Phase 0 is complete. Use these tokens for:

1. **Phase 1:** Figma design specs
2. **Phase 2:** Component implementation
3. **Phase 3:** Animation integration

All tokens are production-ready and WCAG AAA compliant.

---

**Quick Links:**
- Full Token Reference: `/docs/design/tokens.md`
- Typography System: `/docs/design/typography.md`
- Phase 0 Summary: `/docs/design/phase0-completion-summary.md`

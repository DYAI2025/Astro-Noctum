# DEC-design-system-v2: Unified Design System with Dark/Bright Mode

**Status**: Active

**Category**: Design

**Scope**: system-wide (frontend, mobile)

**Source**: Design-Fitting Sprint S09

**Last updated**: 2026-03-31

## Context

The UI has grown organically across sprints with inconsistent spacing, typography hierarchy, border radii, card patterns, and no formal bright-mode definition. A Qwen design audit identified 6 core issues: navigation crowding, spacing inconsistency, mobile touch targets, color system without element logic, typography hierarchy, and WCAG contrast failures. This decision establishes a unified token system for both modes.

## Decision

### Typography

| Token | Value | Usage |
|-------|-------|-------|
| `--font-heading` | `Cormorant Garamond, serif` | H1–H3, modal titles, Kurzsignal |
| `--font-body` | `Sora, sans-serif` | Body text, labels, buttons |
| `--font-cjk` | `Noto Sans SC, sans-serif` | Chinese characters (BaZi stems) |
| `--font-weight-heading` | `600` | All headings |
| `--font-weight-body` | `400` | Body, `500` for emphasis |

**Typography Scale (max 4 sizes per section):**

| Step | Size | Line Height | Usage |
|------|------|-------------|-------|
| `--text-xs` | `12px` | `1.4` | Captions, timestamps |
| `--text-sm` | `14px` | `1.5` | Labels, secondary text |
| `--text-base` | `16px` | `1.6` | Body text |
| `--text-lg` | `20px` | `1.4` | Section headings |
| `--text-xl` | `28px` | `1.2` | Page titles, hero text |

### Color Tokens

**Dark Mode (default):**

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#00050A` | Page background (Obsidian) |
| `--bg-card` | `#0D0F14` | Card backgrounds |
| `--bg-card-elevated` | `#14161B` | Hover/active card |
| `--border-subtle` | `rgba(212, 175, 55, 0.1)` | Card borders (gold/10) |
| `--border-active` | `rgba(212, 175, 55, 0.3)` | Hover/focus borders (gold/30) |
| `--text-primary` | `#D4AF37` | Gold — headings, emphasis |
| `--text-body` | `rgba(212, 175, 55, 0.8)` | Gold/80 — body text |
| `--text-dim` | `rgba(212, 175, 55, 0.5)` | Gold/50 — labels, captions |
| `--accent` | `#D4AF37` | Gold — buttons, links, active states |
| `--accent-bg` | `rgba(212, 175, 55, 0.1)` | Gold/10 — button backgrounds |

**Bright Mode:**

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#FFFFFF` | Page background |
| `--bg-card` | `#FAFAFA` | Card backgrounds |
| `--bg-card-elevated` | `#FFFFFF` | Hover/active card |
| `--border-subtle` | `#E4E4E7` | Card borders |
| `--border-active` | `#2563EB` | Hover/focus borders (Blue) |
| `--text-primary` | `#111111` | Headings, emphasis |
| `--text-body` | `#4A4A4A` | Body text |
| `--text-dim` | `#71717A` | Labels, captions (WCAG 4.5:1 verified) |
| `--accent` | `#2563EB` | Blue — buttons, links, active states |
| `--accent-bg` | `rgba(37, 99, 235, 0.08)` | Blue/8 — button backgrounds |

### Wu-Xing Element Colors (both modes)

| Element | Hex | Zodiac Sectors |
|---------|-----|----------------|
| Wood | `#4CAF50` | Aries, Pisces |
| Fire | `#F44336` | Gemini, Cancer, Leo |
| Earth | `#FF9800` | Taurus, Aquarius |
| Metal | `#9E9E9E` | Virgo, Libra |
| Water | `#2196F3` | Scorpio, Sagittarius, Capricorn |

Used for: left-border stripe on element cards, chart segment fills, progress bar fills, InfluenceGauges.

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` | Tight gaps, icon margins |
| `--space-sm` | `8px` | Inline spacing, pill padding |
| `--space-md` | `16px` | Card inner padding (compact) |
| `--space-lg` | `24px` | Card inner padding (standard) |
| `--space-xl` | `40px` | Section gaps |
| `--space-2xl` | `80px` | Page section separation |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | `8px` | Buttons, inputs, pills, content cards |
| `--radius-md` | `12px` | Standard cards |
| `--radius-lg` | `16px` | Hero cards, modals |
| `--radius-full` | `9999px` | Circles, badges |

### Shadows (Bright Mode only — Dark Mode uses border glow)

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-card` | `0 4px 20px rgba(0,0,0,0.04)` | Card resting state |
| `--shadow-card-hover` | `0 12px 30px rgba(0,0,0,0.08)` | Card hover state |

### Touch Targets

| Token | Value |
|-------|-------|
| `--touch-min` | `44px` | Minimum touch target (buttons, links) |
| `--touch-input` | `48px` | Input fields, nav items on mobile |

### Card System

Both modes share the same card structure, different tokens:

```
.card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
}
.card:hover {
  border-color: var(--border-active);
  /* Bright: translateY(-4px) + shadow-card-hover */
  /* Dark: border glow intensifies */
}
```

**Element-coded cards** add a 4px left border in the element color:
```
.card-element {
  border-left: 4px solid var(--element-color);
}
```

### Grids

| Breakpoint | Grid |
|------------|------|
| Mobile (<640px) | 1 column, 2x2 for Big Four |
| Tablet (640–1024px) | 2 columns |
| Desktop (>1024px) | 3–4 columns |

## Enforcement

### Trigger conditions

- When creating or modifying any UI component
- When adding new screens or sections
- When defining colors, spacing, or typography in CSS/Tailwind

### Required patterns

- Use design tokens (CSS variables or Tailwind equivalents) — never hardcode hex colors
- Max 4 font sizes per visible section
- Cards use the unified `.card` pattern
- Element colors from the Wu-Xing table only
- Touch targets ≥44px on mobile
- Bright mode text minimum `#71717A` on white (WCAG 4.5:1)

### Prohibited patterns

- Hardcoded color values (`#D4AF37` directly in JSX)
- Mixed font families in body text (Sora only, never Inter)
- Shadows in dark mode (use border glow instead)
- Spacing values not from the scale (no `13px`, `37px`, etc.)

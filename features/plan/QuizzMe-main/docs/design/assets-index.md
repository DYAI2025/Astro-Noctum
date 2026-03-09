# Character Sheet Visual Assets Index

Quick reference guide for all ornamental SVG assets created for the Character Sheet feature.

---

## Ornaments

### Corner Ornament
- **File:** `/public/assets/ornaments/corner.svg`
- **Size:** 80×80px
- **Use Case:** Card corners (4 placements per card)
- **Opacity:** 15-25%
- **Rotation:** 0° (top-left), 90° (top-right), 180° (bottom-right), 270° (bottom-left)
- **Color:** #D4AF37 (gold stroke)

**Implementation Example:**
```css
.card::before {
  content: '';
  position: absolute;
  top: -10px;
  left: -10px;
  width: 60px;
  height: 60px;
  background-image: url('/assets/ornaments/corner.svg');
  opacity: 0.2;
  transform: rotate(0deg);
}
```

---

### Divider Flourish
- **File:** `/public/assets/ornaments/divider.svg`
- **Size:** 300×40px
- **Use Case:** Section breaks between header and content
- **Opacity:** 100% (fully visible)
- **Color:** #D4AF37 (gold stroke)
- **Placement:** Centered horizontally

**Implementation Example:**
```jsx
<div className="section-divider">
  <img
    src="/assets/ornaments/divider.svg"
    alt=""
    className="w-[300px] mx-auto my-6 opacity-100"
  />
</div>
```

---

### Constellation Watermark
- **File:** `/public/assets/ornaments/constellation-watermark.svg`
- **Size:** 400×400px
- **Use Case:** Page background texture (star map pattern)
- **Opacity:** 4-8% (very subtle, non-intrusive)
- **Color:** #D4AF37 (gold strokes and fills)
- **Placement:** Fixed or absolute, centered or tiled

**Implementation Example:**
```css
.character-sheet-page {
  position: relative;
}

.character-sheet-page::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('/assets/ornaments/constellation-watermark.svg');
  background-position: center center;
  background-size: 1200px auto;
  background-repeat: no-repeat;
  opacity: 0.06;
  z-index: -1;
  pointer-events: none;
}
```

---

### Botanical Sprig
- **File:** `/public/assets/ornaments/botanical-sprig.svg`
- **Size:** 60×100px
- **Use Case:** Decorative side accents, margin decoration
- **Opacity:** 20-30%
- **Color:** #D4AF37 (gold stroke)
- **Rotation:** Variable for organic feel

**Implementation Example:**
```jsx
<div className="relative">
  <img
    src="/assets/ornaments/botanical-sprig.svg"
    alt=""
    className="absolute -left-16 top-8 w-12 opacity-25 rotate-12"
  />
  <CardContent />
</div>
```

---

### Alchemy Circle
- **File:** `/public/assets/ornaments/alchemy-circle.svg`
- **Size:** 120×120px
- **Use Case:** Section header backgrounds, mystical seal accents
- **Opacity:** 8-12%
- **Color:** #D4AF37 (gold stroke)
- **Placement:** Behind headers or as watermark

**Implementation Example:**
```css
.section-header {
  position: relative;
}

.section-header::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120px;
  height: 120px;
  background-image: url('/assets/ornaments/alchemy-circle.svg');
  opacity: 0.1;
  z-index: -1;
}
```

---

## Icons

### Moon Icon
- **File:** `/public/assets/icons/moon.svg`
- **Size:** 24×24px
- **Use Case:** Shadow badge, night/lunar theme indicators
- **Opacity:** 100%
- **Color:** #D4AF37 (gold stroke)
- **Stroke Width:** 1.5px

**Implementation Example:**
```jsx
<div className="badge">
  <img src="/assets/icons/moon.svg" alt="" className="w-4 h-4" />
  <span>Schatten bestätigt</span>
</div>
```

---

### Star Icon
- **File:** `/public/assets/icons/star.svg`
- **Size:** 24×24px
- **Use Case:** Intensity badge, highlight indicators, accent icons
- **Opacity:** 100%
- **Color:** #D4AF37 (gold stroke)
- **Stroke Width:** 1.5px
- **Style:** 8-pointed mystical star

**Implementation Example:**
```jsx
<div className="intensity-badge">
  <img src="/assets/icons/star.svg" alt="" className="w-4 h-4" />
  <span>Intensität: Stark</span>
</div>
```

---

### Crystal Icon
- **File:** `/public/assets/icons/crystal.svg`
- **Size:** 24×24px
- **Use Case:** Clarity/energy indicators, UI accents, derived stats
- **Opacity:** 100%
- **Color:** #D4AF37 (gold stroke)
- **Stroke Width:** 1.5px
- **Style:** Geometric faceted gem

**Implementation Example:**
```jsx
<div className="stat-pill">
  <img src="/assets/icons/crystal.svg" alt="" className="w-6 h-6" />
  <div className="value">85</div>
  <div className="label">Klarheit</div>
</div>
```

---

## Usage Guidelines

### Opacity Rules
| Asset Type | Opacity Range | Purpose |
|------------|---------------|---------|
| Background Watermarks | 4-8% | Subtle texture, non-intrusive |
| Corner Ornaments | 15-25% | Visible but not dominant |
| Side Decorations | 20-30% | Accent elements |
| Header Backgrounds | 8-12% | Section emphasis |
| Icons | 100% | Functional UI elements |

### Sizing Guidelines
- **Ornaments:** Scale proportionally, maintain aspect ratio
- **Icons:** Use exact sizes (16px, 20px, 24px) for crisp rendering
- **Watermarks:** Large scale (800-1200px) for coverage
- **Decorative Elements:** 40-80px for desktop, reduce on mobile

### Color Consistency
All assets use **#D4AF37** (Modern Alchemy Gold) for stroke color. Do not modify the stroke color unless creating theme variants.

### Performance Tips
- **Inline small icons** (<2KB) to reduce HTTP requests
- **Lazy load** background watermarks (load after critical content)
- **Use CSS `will-change`** sparingly for animated ornaments
- **Preload** above-the-fold ornaments (divider, corner)

### Accessibility
- **Always include `alt=""` for decorative images** (not meaningful to screen readers)
- **Don't rely on ornaments for information** (purely decorative)
- **Ensure ornaments don't obscure text** (use proper opacity and z-index)

---

## React Component Examples

### OrnamentLayer Component
```tsx
// src/components/ornaments/OrnamentLayer.tsx
export function OrnamentLayer() {
  return (
    <>
      {/* Background constellation watermark */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: 'url(/assets/ornaments/constellation-watermark.svg)',
          backgroundPosition: 'center',
          backgroundSize: '1200px auto',
          backgroundRepeat: 'no-repeat',
          opacity: 0.06
        }}
        aria-hidden="true"
      />
    </>
  )
}
```

### Card with Corner Ornaments
```tsx
// src/components/character/CoreStatsCard.tsx
export function CoreStatsCard() {
  return (
    <div className="relative bg-[var(--alchemy-cream)] rounded-2xl border border-[var(--border-gold-subtle)] p-8 shadow-md">
      {/* Corner ornaments */}
      <img
        src="/assets/ornaments/corner.svg"
        alt=""
        className="absolute -top-2 -left-2 w-16 h-16 opacity-20 rotate-0"
      />
      <img
        src="/assets/ornaments/corner.svg"
        alt=""
        className="absolute -top-2 -right-2 w-16 h-16 opacity-20 rotate-90"
      />
      <img
        src="/assets/ornaments/corner.svg"
        alt=""
        className="absolute -bottom-2 -right-2 w-16 h-16 opacity-20 rotate-180"
      />
      <img
        src="/assets/ornaments/corner.svg"
        alt=""
        className="absolute -bottom-2 -left-2 w-16 h-16 opacity-20 rotate-[270deg]"
      />

      {/* Card content */}
      <h2 className="font-serif text-2xl text-[var(--alchemy-text-dark)] mb-6">
        Kernwerte
      </h2>
      {/* Stats content... */}
    </div>
  )
}
```

### Badge with Icon
```tsx
// src/components/character/MetaBadge.tsx
interface MetaBadgeProps {
  icon: 'moon' | 'star' | 'crystal';
  label: string;
}

export function MetaBadge({ icon, label }: MetaBadgeProps) {
  const iconMap = {
    moon: '/assets/icons/moon.svg',
    star: '/assets/icons/star.svg',
    crystal: '/assets/icons/crystal.svg'
  }

  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--alchemy-parchment-dark)] border border-[var(--border-gold-subtle)] rounded-full shadow-sm">
      <img src={iconMap[icon]} alt="" className="w-4 h-4" />
      <span className="text-sm text-[var(--alchemy-text-dark)]">
        {label}
      </span>
    </div>
  )
}
```

---

## Testing Checklist

### Visual Testing
- [ ] All SVGs render without distortion at multiple sizes
- [ ] Gold color (#D4AF37) is consistent across all assets
- [ ] Ornaments don't interfere with text readability
- [ ] Icons are recognizable at 16px, 20px, and 24px
- [ ] Watermarks are subtle enough (not distracting)
- [ ] Corner ornaments align properly on all card sizes

### Browser Testing
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest, macOS and iOS)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

### Performance Testing
- [ ] Total asset size < 30KB (actual: ~10KB ✅)
- [ ] No layout shifts when ornaments load
- [ ] Smooth rendering at 60fps (no jank)
- [ ] Assets load quickly on slow 3G

### Accessibility Testing
- [ ] Ornaments marked with `aria-hidden="true"`
- [ ] No text obscured by decorative elements
- [ ] Proper contrast maintained (text on backgrounds)
- [ ] Focus states not interfered with

---

## Maintenance Notes

### Updating Assets
If ornaments need to be updated:
1. Maintain stroke-based approach (no fills except small accents)
2. Keep gold color #D4AF37 consistent
3. Optimize SVG with SVGO or similar tool
4. Test at multiple sizes before replacing
5. Update this index if usage guidelines change

### Adding New Assets
New ornamental assets should follow these rules:
- File format: SVG (optimized)
- Color palette: Gold (#D4AF37), potentially emerald (#0D5A5F) for variants
- Stroke width: 0.5-1.5px for delicate lines
- File size: <5KB for ornaments, <2KB for icons
- Naming: kebab-case (e.g., `new-ornament-name.svg`)
- Location: `/public/assets/ornaments/` or `/public/assets/icons/`
- Documentation: Add entry to this index

---

**Asset Pack Version:** 1.0.0
**Total Files:** 8 (5 ornaments + 3 icons)
**Total Size:** ~10KB
**Last Updated:** 2025-12-14

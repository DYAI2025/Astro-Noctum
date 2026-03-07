# Character Sheet Visual Assets

**Version:** 1.0.0
**Created:** 2025-12-14
**Theme:** Modern Alchemy - Light Grimoire
**Total Size:** 10.4KB (8 files)

---

## Quick Reference

### Ornaments (5 files, 8.2KB total)
- `ornaments/corner.svg` - 1.0KB - Card corners
- `ornaments/divider.svg` - 1.2KB - Section breaks
- `ornaments/constellation-watermark.svg` - 2.9KB - Background texture
- `ornaments/botanical-sprig.svg` - 1.2KB - Side decoration
- `ornaments/alchemy-circle.svg` - 1.8KB - Header backgrounds

### Icons (3 files, 2.2KB total)
- `icons/moon.svg` - 632 bytes - Shadow/lunar theme
- `icons/star.svg` - 611 bytes - Intensity/highlights
- `icons/crystal.svg` - 950 bytes - Clarity/energy

---

## File Sizes Breakdown

```
Ornaments:
  alchemy-circle.svg         1,819 bytes (1.8KB)
  botanical-sprig.svg        1,156 bytes (1.2KB)
  constellation-watermark.svg 2,988 bytes (2.9KB) ← largest
  corner.svg                 1,040 bytes (1.0KB)
  divider.svg                1,169 bytes (1.2KB)
                           ─────────────────
  Subtotal:                  8,172 bytes (8.2KB)

Icons:
  crystal.svg                  950 bytes
  moon.svg                     632 bytes ← smallest
  star.svg                     611 bytes
                           ─────────────────
  Subtotal:                  2,193 bytes (2.2KB)

TOTAL PACK SIZE:            10,365 bytes (10.4KB)
```

**Performance:** All files are highly optimized SVGs under target sizes.

---

## Design Specifications

### Color Palette
All assets use a single primary color:
- **Gold:** `#D4AF37` (stroke color for all ornaments and icons)

### Style Guide
- **Stroke-based:** Thin line art (0.5-1.5px stroke width)
- **No fills:** Except small accent dots on constellations
- **Scalable:** All SVGs use viewBox for crisp rendering at any size
- **Accessibility:** Decorative only (use `alt=""` or `aria-hidden="true"`)

### Opacity Rules
- Background watermarks: 4-8%
- Corner ornaments: 15-25%
- Side decorations: 20-30%
- Icons: 100% (fully visible)

---

## Usage Examples

### Background Watermark
```jsx
<div className="page-background">
  <div
    className="constellation-watermark"
    style={{
      backgroundImage: 'url(/assets/ornaments/constellation-watermark.svg)',
      opacity: 0.06
    }}
  />
</div>
```

### Card with Corners
```jsx
<div className="card relative">
  <img src="/assets/ornaments/corner.svg" className="absolute top-0 left-0 rotate-0 opacity-20" />
  <img src="/assets/ornaments/corner.svg" className="absolute top-0 right-0 rotate-90 opacity-20" />
  {/* content */}
</div>
```

### Badge with Icon
```jsx
<div className="badge">
  <img src="/assets/icons/moon.svg" className="w-4 h-4" />
  <span>Schatten bestätigt</span>
</div>
```

---

## Documentation

For detailed usage guidelines, component specifications, and implementation examples:

- **Asset Index:** `/docs/design/assets-index.md`
- **Component Specs:** `/docs/design/components.md`
- **Layout Guide:** `/docs/design/character-sheet-layout.md`
- **Phase 1 Summary:** `/docs/design/phase-1-summary.md`

---

## Optimization

These SVGs are hand-crafted and optimized:
- ✅ Minimal path complexity
- ✅ No unnecessary metadata
- ✅ Clean viewBox definitions
- ✅ Efficient stroke-based rendering
- ✅ Total pack size under 30KB target (actual: 10.4KB)

**No further optimization needed.** Files are ready for production use.

---

## License

These assets are part of the QuizzMe project and follow the project's licensing terms.

**Copyright:** QuizzMe
**Created by:** Claude Code (Base Template Generator Agent)
**Design System:** Modern Alchemy

# Bazodiac Design System V2

> Reference document for the unified design system. Authoritative decisions: `DEC-design-system-v2` and `DEC-spiritual-tech-interactions`.

## Quick Reference

### Dark Mode (Default)

```
Background:  #00050A (Obsidian)
Cards:       #0D0F14
Text:        #D4AF37 (Gold)
Text body:   gold/80
Text dim:    gold/50
Accent:      #D4AF37 (Gold)
Borders:     gold/10 → gold/30 on hover
```

### Bright Mode

```
Background:  #FFFFFF
Cards:       #FAFAFA
Text:        #111111
Text body:   #4A4A4A
Text dim:    #71717A (WCAG 4.5:1 on white)
Accent:      #2563EB (Blue)
Borders:     #E4E4E7 → #2563EB on hover
```

### Wu-Xing Element Palette

```
Wood:   #4CAF50  (Aries, Pisces)
Fire:   #F44336  (Gemini, Cancer, Leo)
Earth:  #FF9800  (Taurus, Aquarius)
Metal:  #9E9E9E  (Virgo, Libra)
Water:  #2196F3  (Scorpio, Sagittarius, Capricorn)
```

### Typography

```
Heading:  Cormorant Garamond, serif (600)
Body:     Sora, sans-serif (400/500)
CJK:      Noto Sans SC, sans-serif
```

### Spacing Scale

```
xs: 4px   sm: 8px   md: 16px   lg: 24px   xl: 40px   2xl: 80px
```

### Border Radius

```
sm: 8px   md: 12px   lg: 16px   full: 9999px
```

### Animation Timing

```
Button tap:    100ms ease-in-out  (scale 0.98)
Modal exit:    200ms ease-in
Card hover:    300ms cubic-bezier(0.4, 0, 0.2, 1)
Modal enter:   300ms ease-out
Expand panel:  300ms ease-out
Page change:   400ms ease-out
Progress fill: 1500ms ease-out
```

## Tailwind v4 Integration

These tokens should be defined in `src/index.css` under `@theme`:

```css
@theme {
  /* Existing tokens (keep) */
  --color-obsidian: #00050A;
  --color-gold: #D4AF37;
  --color-ash: #1A1C1E;

  /* New: Design System V2 */
  --color-card-dark: #0D0F14;
  --color-card-dark-elevated: #14161B;
  --color-card-bright: #FAFAFA;
  --color-text-bright: #111111;
  --color-text-bright-body: #4A4A4A;
  --color-text-bright-dim: #71717A;
  --color-accent-blue: #2563EB;
  --color-border-bright: #E4E4E7;

  /* Wu-Xing Elements */
  --color-element-wood: #4CAF50;
  --color-element-fire: #F44336;
  --color-element-earth: #FF9800;
  --color-element-metal: #9E9E9E;
  --color-element-water: #2196F3;

  /* Spacing (already largely covered by Tailwind defaults) */
  --spacing-section: 80px;

  /* Radii */
  --radius-card: 12px;
  --radius-card-lg: 16px;
}
```

## Error Messages Template

```typescript
const COSMIC_ERRORS = {
  api_timeout:    { icon: 'cloud-off', title: 'Kosmische Stoerung', message: 'Die Verbindung zum Atlas ist momentan unterbrochen.', action: 'Erneut fragen' },
  bafe_down:      { icon: 'moon', title: 'Stille im Kosmos', message: 'Die Berechnungen brauchen einen Moment Ruhe.', action: 'Nochmal versuchen' },
  gemini_fail:    { icon: 'message-circle-off', title: 'Sprachlos', message: 'Selbst die Sterne suchen manchmal nach Worten.', action: 'Erneut anfragen' },
  empty_state:    { icon: 'sparkles', title: 'Leere Karte', message: 'Hier entsteht noch etwas — gib uns einen Moment.', action: 'Aktualisieren' },
  auth_expired:   { icon: 'log-out', title: 'Sitzung beendet', message: 'Deine kosmische Verbindung ist eingeschlafen.', action: 'Neu verbinden' },
  rate_limited:   { icon: 'timer', title: 'Kosmische Pause', message: 'Auch die Sterne brauchen mal eine Verschnaufpause.', action: 'Spaeter nochmal' },
};
```

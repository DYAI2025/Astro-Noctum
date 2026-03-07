# QuizzMe Design System
## Single Source of Truth v1.0

> **Markenessenz**: "Modern Alchemy – the grounded mystic"  
> **Zielgruppe**: Frauen 20–40, Selbsterkenntnis, Persönlichkeitsentwicklung  
> **Sprache**: Deutsch (informelles "du")

---

## 1. THEME-ARCHITEKTUR

| Kontext | Theme | Stimmung |
|---------|-------|----------|
| Horoscope, Landing, Results, Charakterbogen | **Modern Alchemy** (Dark) | Mystisch, kosmisch, immersiv |
| Quiz-Flow, Fragen, Antwort-Karten | **Botanical Garden** (Light) | Warm, einladend, fokussiert |

---

## 2. FARBPALETTE

### 2.1 Shared Foundation (beide Themes)

```css
:root {
  /* === GOLD SPECTRUM === */
  --gold-primary:      #D2A95A;   /* Hauptakzent, Borders, Icons */
  --gold-dark:         #A77D38;   /* Schatten, Hover-States */
  --gold-light:        #E8C87A;   /* Highlights, Glow */
  --gold-muted:        #C4A86C;   /* Dezente Akzente */
  
  /* === EMERALD/TEAL SPECTRUM === */
  --emerald-deep:      #053B3F;   /* Primärer Dark Background */
  --emerald-forest:    #0A4A4F;   /* Sekundärer Dark Background */
  --teal-muted:        #1C5B5C;   /* Akzent auf Dark */
  --sage:              #6CA192;   /* Sekundärakzent, Icons */
  --sage-light:        #8FB8A8;   /* Hover auf Light */
  
  /* === MIDNIGHT SPECTRUM === */
  --midnight-deep:     #041726;   /* Tiefster Background */
  --midnight-medium:   #0A2540;   /* Cards auf Dark */
  --midnight-soft:     #132F4C;   /* Elevated Elements */
  
  /* === CREAM/PARCHMENT SPECTRUM === */
  --cream-pure:        #F7F0E6;   /* Primärer Light Background */
  --cream-warm:        #F2E3CF;   /* Cards, Surfaces */
  --cream-deep:        #EDE4D3;   /* Parchment-Effekt */
  --cream-muted:       #E5D9C3;   /* Borders auf Light */
  
  /* === TEXT === */
  --text-on-dark:      #F7F3EA;   /* Primärtext auf Dark */
  --text-on-dark-muted:#A8B5A0;   /* Sekundärtext auf Dark */
  --text-on-light:     #271C16;   /* Primärtext auf Light */
  --text-on-light-muted:#5A4D3F;  /* Sekundärtext auf Light */
  
  /* === SEMANTIC === */
  --success:           #6CA192;   /* Bestätigung */
  --warning:           #D2A95A;   /* Hinweis */
  --error:             #C45D4A;   /* Fehler */
  --info:              #5B8A9A;   /* Information */
}
```

### 2.2 Theme: Modern Alchemy (Dark/Horoscope)

```css
[data-theme="alchemy"],
.theme-alchemy {
  /* Backgrounds */
  --bg-primary:        var(--midnight-deep);
  --bg-secondary:      var(--emerald-deep);
  --bg-tertiary:       var(--midnight-medium);
  --bg-card:           var(--midnight-soft);
  --bg-elevated:       rgba(5, 59, 63, 0.85);
  
  /* Gradient */
  --bg-gradient:       linear-gradient(165deg, 
                         var(--emerald-deep) 0%, 
                         var(--midnight-deep) 50%, 
                         #031119 100%);
  
  /* Text */
  --text-primary:      var(--text-on-dark);
  --text-secondary:    var(--text-on-dark-muted);
  --text-accent:       var(--gold-primary);
  
  /* Borders & Accents */
  --border-default:    rgba(210, 169, 90, 0.25);
  --border-strong:     var(--gold-primary);
  --border-subtle:     rgba(247, 243, 234, 0.1);
  
  /* Interactive */
  --accent-primary:    var(--gold-primary);
  --accent-secondary:  var(--sage);
  --accent-hover:      var(--gold-light);
  
  /* Effects */
  --glow-gold:         0 0 40px rgba(210, 169, 90, 0.25);
  --glow-soft:         0 0 20px rgba(210, 169, 90, 0.15);
  --shadow-card:       0 8px 32px rgba(4, 23, 38, 0.6);
  --shadow-elevated:   0 16px 48px rgba(0, 0, 0, 0.5);
}
```

### 2.3 Theme: Botanical Garden (Light/Quiz)

```css
[data-theme="botanical"],
.theme-botanical {
  /* Backgrounds */
  --bg-primary:        var(--cream-pure);
  --bg-secondary:      var(--cream-warm);
  --bg-tertiary:       var(--cream-deep);
  --bg-card:           #FFFFFF;
  --bg-elevated:       #FFFFFF;
  
  /* Gradient */
  --bg-gradient:       linear-gradient(180deg,
                         var(--cream-pure) 0%,
                         var(--cream-warm) 100%);
  
  /* Outer Frame (Dark Border um Light Content) */
  --bg-frame:          var(--emerald-deep);
  
  /* Text */
  --text-primary:      var(--text-on-light);
  --text-secondary:    var(--text-on-light-muted);
  --text-accent:       var(--emerald-deep);
  
  /* Borders & Accents */
  --border-default:    var(--cream-muted);
  --border-strong:     var(--gold-primary);
  --border-subtle:     rgba(39, 28, 22, 0.08);
  
  /* Interactive */
  --accent-primary:    var(--emerald-deep);
  --accent-secondary:  var(--gold-primary);
  --accent-hover:      var(--sage);
  
  /* Effects */
  --glow-gold:         0 0 30px rgba(210, 169, 90, 0.2);
  --glow-soft:         0 0 15px rgba(108, 161, 146, 0.15);
  --shadow-card:       0 4px 20px rgba(39, 28, 22, 0.08);
  --shadow-elevated:   0 8px 32px rgba(39, 28, 22, 0.12);
}
```

---

## 3. TYPOGRAFIE

### 3.1 Font Stack

```css
:root {
  /* === FONT FAMILIES === */
  --font-serif:        'Cormorant Garamond', 'Playfair Display', Georgia, serif;
  --font-sans:         'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono:         'JetBrains Mono', 'Fira Code', monospace;
  
  /* === FONT WEIGHTS === */
  --weight-regular:    400;
  --weight-medium:     500;
  --weight-semibold:   600;
  --weight-bold:       700;
}
```

### 3.2 Type Scale

```css
:root {
  /* === DISPLAY (Serif) === */
  --text-display-xl:   clamp(2.5rem, 5vw, 3.5rem);    /* 40-56px Hero Headlines */
  --text-display-lg:   clamp(2rem, 4vw, 2.75rem);     /* 32-44px Page Titles */
  --text-display-md:   clamp(1.5rem, 3vw, 2rem);      /* 24-32px Section Headers */
  
  /* === HEADINGS (Serif) === */
  --text-h1:           clamp(1.75rem, 2.5vw, 2.25rem);/* 28-36px */
  --text-h2:           clamp(1.375rem, 2vw, 1.75rem); /* 22-28px */
  --text-h3:           clamp(1.125rem, 1.5vw, 1.375rem);/* 18-22px */
  
  /* === BODY (Sans-Serif) === */
  --text-body-lg:      1.125rem;                       /* 18px */
  --text-body:         1rem;                           /* 16px */
  --text-body-sm:      0.875rem;                       /* 14px */
  
  /* === UI (Sans-Serif) === */
  --text-label:        0.75rem;                        /* 12px Labels, Badges */
  --text-caption:      0.6875rem;                      /* 11px Micro Text */
  
  /* === LINE HEIGHTS === */
  --leading-tight:     1.2;
  --leading-snug:      1.35;
  --leading-normal:    1.5;
  --leading-relaxed:   1.7;
  
  /* === LETTER SPACING === */
  --tracking-tight:    -0.02em;
  --tracking-normal:   0;
  --tracking-wide:     0.05em;
  --tracking-wider:    0.1em;
  --tracking-widest:   0.15em;
}
```

### 3.3 Typography Classes

```css
/* Display Headlines (Serif) */
.text-display-xl {
  font-family: var(--font-serif);
  font-size: var(--text-display-xl);
  font-weight: var(--weight-medium);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
}

.text-display-lg {
  font-family: var(--font-serif);
  font-size: var(--text-display-lg);
  font-weight: var(--weight-medium);
  line-height: var(--leading-tight);
}

/* Headings */
.text-h1, .text-h2, .text-h3 {
  font-family: var(--font-serif);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-snug);
}

/* Body Text */
.text-body {
  font-family: var(--font-sans);
  font-size: var(--text-body);
  font-weight: var(--weight-regular);
  line-height: var(--leading-relaxed);
}

/* Labels & UI */
.text-label {
  font-family: var(--font-sans);
  font-size: var(--text-label);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
}
```

### 3.4 Verwendungsmatrix

| Element | Font | Size | Weight | Tracking |
|---------|------|------|--------|----------|
| Logo/Brand | Serif | display-lg | medium | tight |
| Page Title | Serif | display-md | medium | normal |
| Section Header | Serif | h2 | semibold | normal |
| Result Title | Serif | h1 | bold | tight |
| Archetype Name | Serif | h2 | semibold | wide |
| Question Text | Sans | body-lg | medium | normal |
| Answer Text | Sans | body | regular | normal |
| Button Label | Sans | body-sm | semibold | wide |
| Badge/Tag | Sans | label | medium | widest |
| Progress Label | Sans | caption | medium | wider |
| Stats Label | Sans | body-sm | medium | normal |

---

## 4. SPACING & LAYOUT

### 4.1 Spacing Scale

```css
:root {
  /* === SPACING SCALE (8px base) === */
  --space-0:    0;
  --space-1:    0.25rem;   /* 4px */
  --space-2:    0.5rem;    /* 8px */
  --space-3:    0.75rem;   /* 12px */
  --space-4:    1rem;      /* 16px */
  --space-5:    1.25rem;   /* 20px */
  --space-6:    1.5rem;    /* 24px */
  --space-8:    2rem;      /* 32px */
  --space-10:   2.5rem;    /* 40px */
  --space-12:   3rem;      /* 48px */
  --space-16:   4rem;      /* 64px */
  --space-20:   5rem;      /* 80px */
  --space-24:   6rem;      /* 96px */
  
  /* === COMPONENT SPACING === */
  --padding-card:      var(--space-6);
  --padding-card-lg:   var(--space-8);
  --padding-button:    var(--space-3) var(--space-6);
  --padding-input:     var(--space-3) var(--space-4);
  --gap-stack:         var(--space-4);
  --gap-inline:        var(--space-3);
}
```

### 4.2 Layout Grid

```css
:root {
  /* === CONTAINER === */
  --container-xs:      320px;
  --container-sm:      480px;
  --container-md:      640px;
  --container-lg:      800px;
  --container-xl:      1024px;
  --container-2xl:     1200px;
  
  /* === QUIZ CARD === */
  --quiz-card-width:   min(540px, calc(100vw - 40px));
  
  /* === BREAKPOINTS === */
  --bp-mobile:         480px;
  --bp-tablet:         768px;
  --bp-desktop:        1024px;
  --bp-wide:           1280px;
}

/* Grid System */
.container {
  width: 100%;
  max-width: var(--container-xl);
  margin-inline: auto;
  padding-inline: var(--space-5);
}

@media (min-width: 768px) {
  .container {
    padding-inline: var(--space-8);
  }
}
```

### 4.3 Border Radius

```css
:root {
  --radius-none:       0;
  --radius-sm:         4px;
  --radius-md:         8px;
  --radius-lg:         12px;
  --radius-xl:         16px;
  --radius-2xl:        24px;
  --radius-full:       9999px;
  
  /* === COMPONENT DEFAULTS === */
  --radius-button:     var(--radius-lg);
  --radius-card:       var(--radius-xl);
  --radius-input:      var(--radius-md);
  --radius-badge:      var(--radius-full);
}
```

---

## 5. KOMPONENTEN

### 5.1 Buttons

```css
/* === BASE BUTTON === */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  
  padding: var(--padding-button);
  border-radius: var(--radius-button);
  
  font-family: var(--font-sans);
  font-size: var(--text-body-sm);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  text-decoration: none;
  
  cursor: pointer;
  transition: all 0.25s ease;
  border: 1px solid transparent;
}

/* === PRIMARY (Gold auf Dark / Emerald auf Light) === */
.btn-primary {
  background: linear-gradient(135deg, var(--gold-dark) 0%, var(--gold-primary) 100%);
  color: var(--midnight-deep);
  border-color: var(--gold-primary);
  box-shadow: var(--glow-soft);
}

.btn-primary:hover {
  background: linear-gradient(135deg, var(--gold-primary) 0%, var(--gold-light) 100%);
  box-shadow: var(--glow-gold);
  transform: translateY(-2px);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* === SECONDARY (Outlined) === */
.btn-secondary {
  background: transparent;
  color: var(--accent-primary);
  border-color: var(--border-strong);
}

.btn-secondary:hover {
  background: rgba(210, 169, 90, 0.1);
  border-color: var(--gold-light);
}

/* === GHOST (Minimal) === */
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border-color: transparent;
}

.btn-ghost:hover {
  color: var(--text-primary);
  background: var(--border-subtle);
}

/* === FOCUS STATE (Accessibility) === */
.btn:focus-visible {
  outline: 2px solid var(--gold-primary);
  outline-offset: 2px;
}
```

### 5.2 Cards

```css
/* === BASE CARD === */
.card {
  background: var(--bg-card);
  border-radius: var(--radius-card);
  padding: var(--padding-card);
  border: 1px solid var(--border-default);
  box-shadow: var(--shadow-card);
}

/* === QUIZ ANSWER CARD (Botanical Theme) === */
.card-answer {
  background: var(--cream-pure);
  border: 1px solid var(--gold-primary);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-5);
  
  display: flex;
  align-items: center;
  gap: var(--space-4);
  
  cursor: pointer;
  transition: all 0.2s ease;
}

.card-answer:hover {
  background: var(--cream-warm);
  border-color: var(--gold-dark);
  box-shadow: var(--glow-soft);
  transform: translateY(-2px);
}

.card-answer.selected {
  background: linear-gradient(135deg, 
    rgba(210, 169, 90, 0.15) 0%, 
    rgba(210, 169, 90, 0.25) 100%);
  border-color: var(--gold-primary);
  border-width: 2px;
}

.card-answer:focus-visible {
  outline: 2px solid var(--gold-primary);
  outline-offset: 2px;
}

/* === RESULT CARD (Alchemy Theme) === */
.card-result {
  background: linear-gradient(165deg,
    rgba(5, 59, 63, 0.95) 0%,
    rgba(4, 23, 38, 0.98) 100%);
  border: 1px solid var(--gold-primary);
  border-radius: var(--radius-2xl);
  padding: var(--space-8);
  box-shadow: var(--shadow-elevated), var(--glow-gold);
}

/* === PARCHMENT CARD (Charakterbogen) === */
.card-parchment {
  background: 
    linear-gradient(var(--cream-deep), var(--cream-deep)),
    url("data:image/svg+xml,..."); /* Paper texture */
  border: 2px solid var(--gold-muted);
  border-radius: var(--radius-lg);
  padding: var(--space-8);
  position: relative;
}

.card-parchment::before,
.card-parchment::after {
  content: '';
  position: absolute;
  width: 40px;
  height: 40px;
  border: 1px solid var(--gold-muted);
  opacity: 0.6;
}

.card-parchment::before {
  top: 12px;
  left: 12px;
  border-right: none;
  border-bottom: none;
}

.card-parchment::after {
  bottom: 12px;
  right: 12px;
  border-left: none;
  border-top: none;
}
```

### 5.3 Progress Bar

```css
/* === PROGRESS BAR === */
.progress {
  --progress-height: 4px;
  --progress-value: 0%;
  
  width: 100%;
  height: var(--progress-height);
  background: var(--border-subtle);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  width: var(--progress-value);
  background: linear-gradient(90deg, var(--gold-dark) 0%, var(--gold-primary) 100%);
  border-radius: var(--radius-full);
  box-shadow: 0 0 10px rgba(210, 169, 90, 0.4);
  transition: width 0.4s ease;
}

/* === STAT BAR === */
.stat-bar {
  --stat-value: 0%;
  
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.stat-bar-label {
  flex-shrink: 0;
  width: 100px;
  font-size: var(--text-body-sm);
  color: var(--text-secondary);
}

.stat-bar-track {
  flex: 1;
  height: 8px;
  background: var(--border-subtle);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.stat-bar-fill {
  height: 100%;
  width: var(--stat-value);
  background: linear-gradient(90deg, var(--sage) 0%, var(--gold-primary) 100%);
  border-radius: var(--radius-full);
  transition: width 0.6s ease;
}

.stat-bar-value {
  flex-shrink: 0;
  width: 45px;
  text-align: right;
  font-family: var(--font-mono);
  font-size: var(--text-body-sm);
  color: var(--gold-primary);
}
```

### 5.4 Badges & Pills

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-badge);
  
  font-size: var(--text-label);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
}

.badge-gold {
  background: rgba(210, 169, 90, 0.15);
  color: var(--gold-primary);
  border: 1px solid rgba(210, 169, 90, 0.3);
}

.badge-sage {
  background: rgba(108, 161, 146, 0.15);
  color: var(--sage);
  border: 1px solid rgba(108, 161, 146, 0.3);
}

.badge-outline {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
}
```

### 5.5 Form Inputs

```css
.input {
  width: 100%;
  padding: var(--padding-input);
  
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-input);
  
  font-family: var(--font-sans);
  font-size: var(--text-body);
  color: var(--text-primary);
  
  transition: all 0.2s ease;
}

.input:hover {
  border-color: var(--gold-muted);
}

.input:focus {
  outline: none;
  border-color: var(--gold-primary);
  box-shadow: 0 0 0 3px rgba(210, 169, 90, 0.15);
}

.input::placeholder {
  color: var(--text-secondary);
  opacity: 0.7;
}

/* Label */
.label {
  display: block;
  margin-bottom: var(--space-2);
  font-size: var(--text-body-sm);
  font-weight: var(--weight-medium);
  color: var(--text-secondary);
}
```

---

## 6. ICONS & ORNAMENTE

### 6.1 Icon-Set (SVG Line Art)

Alle Icons: 24x24 ViewBox, 1.5px Stroke, keine Füllung, Gold auf Dark / Emerald auf Light

```svg
<!-- Kern-Icons für Quiz-Antworten -->

<!-- Auge (Intuition/Vision) -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
  <circle cx="12" cy="12" r="3"/>
</svg>

<!-- Herz (Emotion/Empathie) -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
  <path d="M12 21C12 21 4 14.5 4 9c0-3 2.5-5 5-5 1.5 0 2.5.5 3 1.5.5-1 1.5-1.5 3-1.5 2.5 0 5 2 5 5 0 5.5-8 12-8 12Z"/>
</svg>

<!-- Krone (Leadership/Stärke) -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
  <path d="M3 18h18M4 18l1-10 4 4 3-6 3 6 4-4 1 10"/>
</svg>

<!-- Kristall (Klarheit/Fokus) -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
  <path d="M12 2L4 8l8 14 8-14-8-6Z"/>
  <path d="M4 8l8 4 8-4"/>
  <path d="M12 12v10"/>
</svg>

<!-- Waage (Balance/Harmonie) -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
  <path d="M12 3v18M5 7l14 0"/>
  <path d="M3 11c0 2 2 4 4 4s4-2 4-4l-4-4-4 4Z"/>
  <path d="M13 11c0 2 2 4 4 4s4-2 4-4l-4-4-4 4Z"/>
</svg>

<!-- Mond (Intuition/Unbewusstes) -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/>
</svg>

<!-- Stern (Inspiration/Ziele) -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z"/>
</svg>

<!-- Hände (Verbindung/Unterstützung) -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
  <path d="M7 11V4a2 2 0 0 1 4 0v3"/>
  <path d="M11 7V3a2 2 0 0 1 4 0v4"/>
  <path d="M15 6v-1a2 2 0 0 1 4 0v7"/>
  <path d="M19 12v4a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6V9a2 2 0 0 1 4 0v2"/>
</svg>

<!-- Pinsel (Kreativität) -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
  <path d="M18.37 2.63L14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z"/>
  <path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-10"/>
</svg>

<!-- Lampe (Weisheit/Wissen) -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
  <path d="M9 18h6M10 22h4"/>
  <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A5 5 0 1 0 7.5 11.5c.76.76 1.23 1.52 1.41 2.5"/>
</svg>

<!-- Schild (Mut/Schutz) -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>
</svg>
```

### 6.2 Dekorative Ornamente

```css
/* === CORNER ORNAMENTS === */
.ornament-corner {
  position: absolute;
  width: 50px;
  height: 50px;
  opacity: 0.5;
}

.ornament-corner svg {
  width: 100%;
  height: 100%;
  stroke: var(--gold-muted);
  stroke-width: 0.5;
  fill: none;
}

/* SVG für Eckverzierung */
/*
<svg viewBox="0 0 50 50">
  <path d="M5 45 Q5 5 45 5" opacity="0.4"/>
  <path d="M10 45 Q10 10 45 10" opacity="0.3"/>
  <circle cx="8" cy="8" r="2" fill="currentColor" opacity="0.5"/>
</svg>
*/

/* === DIVIDER === */
.divider {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin: var(--space-6) 0;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, 
    transparent 0%, 
    var(--gold-muted) 50%, 
    transparent 100%);
}

.divider-icon {
  color: var(--gold-muted);
  opacity: 0.7;
}

/* === STAR FIELD BACKGROUND === */
.bg-starfield {
  background-image: 
    radial-gradient(1px 1px at 20% 30%, rgba(210, 169, 90, 0.3) 0%, transparent 100%),
    radial-gradient(1px 1px at 40% 70%, rgba(210, 169, 90, 0.2) 0%, transparent 100%),
    radial-gradient(1px 1px at 60% 20%, rgba(210, 169, 90, 0.25) 0%, transparent 100%),
    radial-gradient(1px 1px at 80% 60%, rgba(210, 169, 90, 0.15) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 10% 80%, rgba(247, 240, 230, 0.2) 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 90% 40%, rgba(247, 240, 230, 0.15) 0%, transparent 100%);
}
```

---

## 7. ANIMATIONEN

### 7.1 Timing & Easing

```css
:root {
  /* === DURATIONS === */
  --duration-instant:  100ms;
  --duration-fast:     150ms;
  --duration-normal:   250ms;
  --duration-slow:     400ms;
  --duration-slower:   600ms;
  
  /* === EASING === */
  --ease-out:          cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in:           cubic-bezier(0.7, 0, 0.84, 0);
  --ease-in-out:       cubic-bezier(0.65, 0, 0.35, 1);
  --ease-bounce:       cubic-bezier(0.34, 1.56, 0.64, 1);
  
  /* === SPRING === */
  --spring-smooth:     cubic-bezier(0.4, 0, 0.2, 1);
  --spring-snappy:     cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

### 7.2 Animation Klassen

```css
/* === FADE IN === */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-fade-in {
  animation: fadeIn var(--duration-normal) var(--ease-out) forwards;
}

/* === SLIDE UP === */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slideUp var(--duration-slow) var(--ease-out) forwards;
}

/* === SCALE IN === */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-scale-in {
  animation: scaleIn var(--duration-normal) var(--ease-out) forwards;
}

/* === GLOW PULSE === */
@keyframes glowPulse {
  0%, 100% { box-shadow: var(--glow-soft); }
  50% { box-shadow: var(--glow-gold); }
}

.animate-glow {
  animation: glowPulse 2s ease-in-out infinite;
}

/* === FLOAT === */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.animate-float {
  animation: float 4s ease-in-out infinite;
}

/* === SHIMMER === */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.animate-shimmer {
  background: linear-gradient(
    90deg,
    var(--gold-dark) 0%,
    var(--gold-light) 50%,
    var(--gold-dark) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 2s ease-in-out infinite;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* === STAGGER CHILDREN === */
.stagger-children > * {
  opacity: 0;
  animation: slideUp var(--duration-slow) var(--ease-out) forwards;
}

.stagger-children > *:nth-child(1) { animation-delay: 0ms; }
.stagger-children > *:nth-child(2) { animation-delay: 75ms; }
.stagger-children > *:nth-child(3) { animation-delay: 150ms; }
.stagger-children > *:nth-child(4) { animation-delay: 225ms; }
.stagger-children > *:nth-child(5) { animation-delay: 300ms; }
```

---

## 8. SEITENSPEZIFISCHE LAYOUTS

### 8.1 Quiz Page (Botanical Theme)

```css
.quiz-page {
  /* Outer dark frame */
  background: var(--bg-frame);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-5);
}

.quiz-container {
  width: var(--quiz-card-width);
  background: var(--cream-pure);
  border: 1px solid var(--gold-primary);
  border-radius: var(--radius-2xl);
  padding: var(--space-8);
  box-shadow: var(--shadow-elevated);
}

.quiz-progress {
  margin-bottom: var(--space-6);
}

.quiz-progress-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--space-2);
  font-size: var(--text-caption);
  color: var(--text-on-light-muted);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
}

.quiz-question {
  font-family: var(--font-sans);
  font-size: var(--text-body-lg);
  font-weight: var(--weight-medium);
  color: var(--text-on-light);
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-6);
}

.quiz-answers {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}

.quiz-actions {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
}
```

### 8.2 Result Page (Alchemy Theme)

```css
.result-page {
  background: var(--bg-gradient);
  min-height: 100vh;
  padding: var(--space-8) var(--space-5);
  position: relative;
}

.result-page::before {
  /* Starfield overlay */
  content: '';
  position: fixed;
  inset: 0;
  background-image: /* starfield pattern */;
  pointer-events: none;
  opacity: 0.5;
}

.result-container {
  max-width: 640px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.result-header {
  text-align: center;
  margin-bottom: var(--space-8);
}

.result-badge {
  margin-bottom: var(--space-4);
}

.result-title {
  font-family: var(--font-serif);
  font-size: var(--text-display-md);
  font-weight: var(--weight-semibold);
  color: var(--gold-primary);
  margin-bottom: var(--space-2);
}

.result-archetype {
  font-family: var(--font-serif);
  font-size: var(--text-h1);
  color: var(--text-on-dark);
  margin-bottom: var(--space-4);
}

.result-emblem {
  width: 200px;
  height: 200px;
  margin: var(--space-6) auto;
  /* SVG archetype illustration */
}

.result-description {
  font-size: var(--text-body);
  color: var(--text-on-dark-muted);
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-8);
}

.result-stats {
  background: rgba(0, 0, 0, 0.3);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  margin-bottom: var(--space-6);
}

.result-stats-title {
  font-family: var(--font-serif);
  font-size: var(--text-h3);
  color: var(--gold-primary);
  margin-bottom: var(--space-5);
  text-align: center;
}

.result-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

@media (min-width: 480px) {
  .result-actions {
    flex-direction: row;
  }
  
  .result-actions .btn {
    flex: 1;
  }
}
```

---

## 9. ACCESSIBILITY

### 9.1 Kontrast-Mindestanforderungen (WCAG AA)

| Kombination | Ratio | Status |
|-------------|-------|--------|
| Gold (#D2A95A) auf Midnight (#041726) | 7.2:1 | ✅ AAA |
| Cream (#F7F0E6) auf Emerald (#053B3F) | 9.1:1 | ✅ AAA |
| Text-Dark (#271C16) auf Cream (#F7F0E6) | 12.4:1 | ✅ AAA |
| Gold (#D2A95A) auf Cream (#F7F0E6) | 2.8:1 | ⚠️ Nur für große Texte |

### 9.2 Fokus-States

```css
/* Globaler Fokus-Ring */
:focus-visible {
  outline: 2px solid var(--gold-primary);
  outline-offset: 2px;
}

/* Buttons */
.btn:focus-visible {
  outline: 2px solid var(--gold-light);
  outline-offset: 3px;
  box-shadow: var(--glow-gold);
}

/* Cards */
.card-answer:focus-visible {
  outline: 2px solid var(--gold-primary);
  outline-offset: 2px;
  border-color: var(--gold-light);
}

/* Skip Link */
.skip-link {
  position: absolute;
  top: -100%;
  left: 50%;
  transform: translateX(-50%);
  background: var(--gold-primary);
  color: var(--midnight-deep);
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius-md);
  z-index: 1000;
  transition: top 0.2s ease;
}

.skip-link:focus {
  top: var(--space-4);
}
```

### 9.3 Motion Preferences

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 10. CHECKLISTE FÜR IMPLEMENTIERUNG

### Vor jedem Component-Build:

- [ ] Theme-Kontext prüfen (Alchemy oder Botanical?)
- [ ] CSS Variables aus diesem Dokument verwenden
- [ ] Keine hardcoded Farben
- [ ] Fokus-States implementiert
- [ ] Keyboard-Navigation getestet
- [ ] Kontrast-Ratio geprüft
- [ ] Animation-Dauer ≤ 400ms
- [ ] Mobile-First responsive

### Qualitäts-Gates:

1. **Konsistenz**: Verwendet nur Werte aus diesem Design System
2. **Accessibility**: WCAG AA für alle interaktiven Elemente
3. **Performance**: SVG statt Bilder, CSS statt JS-Animationen
4. **Emotion**: "Modern Alchemy" Feeling spürbar

---

## ANHANG: CSS CUSTOM PROPERTIES (Copy-Paste Ready)

```css
/* ═══════════════════════════════════════════════════════════════════
   QUIZZME DESIGN SYSTEM - COMPLETE CSS VARIABLES
   Single Source of Truth v1.0
   ═══════════════════════════════════════════════════════════════════ */

@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');

:root {
  /* ─────────────────────────────────────────────────────────────────
     COLORS
     ───────────────────────────────────────────────────────────────── */
  --gold-primary: #D2A95A;
  --gold-dark: #A77D38;
  --gold-light: #E8C87A;
  --gold-muted: #C4A86C;
  
  --emerald-deep: #053B3F;
  --emerald-forest: #0A4A4F;
  --teal-muted: #1C5B5C;
  --sage: #6CA192;
  --sage-light: #8FB8A8;
  
  --midnight-deep: #041726;
  --midnight-medium: #0A2540;
  --midnight-soft: #132F4C;
  
  --cream-pure: #F7F0E6;
  --cream-warm: #F2E3CF;
  --cream-deep: #EDE4D3;
  --cream-muted: #E5D9C3;
  
  --text-on-dark: #F7F3EA;
  --text-on-dark-muted: #A8B5A0;
  --text-on-light: #271C16;
  --text-on-light-muted: #5A4D3F;
  
  --success: #6CA192;
  --warning: #D2A95A;
  --error: #C45D4A;
  --info: #5B8A9A;
  
  /* ─────────────────────────────────────────────────────────────────
     TYPOGRAPHY
     ───────────────────────────────────────────────────────────────── */
  --font-serif: 'Cormorant Garamond', Georgia, serif;
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  
  --text-display-xl: clamp(2.5rem, 5vw, 3.5rem);
  --text-display-lg: clamp(2rem, 4vw, 2.75rem);
  --text-display-md: clamp(1.5rem, 3vw, 2rem);
  --text-h1: clamp(1.75rem, 2.5vw, 2.25rem);
  --text-h2: clamp(1.375rem, 2vw, 1.75rem);
  --text-h3: clamp(1.125rem, 1.5vw, 1.375rem);
  --text-body-lg: 1.125rem;
  --text-body: 1rem;
  --text-body-sm: 0.875rem;
  --text-label: 0.75rem;
  
  /* ─────────────────────────────────────────────────────────────────
     SPACING
     ───────────────────────────────────────────────────────────────── */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;
  
  /* ─────────────────────────────────────────────────────────────────
     BORDERS & RADIUS
     ───────────────────────────────────────────────────────────────── */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 24px;
  --radius-full: 9999px;
  
  /* ─────────────────────────────────────────────────────────────────
     ANIMATION
     ───────────────────────────────────────────────────────────────── */
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
}

/* Theme: Modern Alchemy (Dark) */
[data-theme="alchemy"], .theme-alchemy {
  --bg-primary: var(--midnight-deep);
  --bg-secondary: var(--emerald-deep);
  --bg-card: var(--midnight-soft);
  --bg-gradient: linear-gradient(165deg, var(--emerald-deep) 0%, var(--midnight-deep) 50%, #031119 100%);
  --text-primary: var(--text-on-dark);
  --text-secondary: var(--text-on-dark-muted);
  --text-accent: var(--gold-primary);
  --border-default: rgba(210, 169, 90, 0.25);
  --border-strong: var(--gold-primary);
  --accent-primary: var(--gold-primary);
  --glow-gold: 0 0 40px rgba(210, 169, 90, 0.25);
  --shadow-card: 0 8px 32px rgba(4, 23, 38, 0.6);
}

/* Theme: Botanical Garden (Light) */
[data-theme="botanical"], .theme-botanical {
  --bg-primary: var(--cream-pure);
  --bg-secondary: var(--cream-warm);
  --bg-card: #FFFFFF;
  --bg-frame: var(--emerald-deep);
  --bg-gradient: linear-gradient(180deg, var(--cream-pure) 0%, var(--cream-warm) 100%);
  --text-primary: var(--text-on-light);
  --text-secondary: var(--text-on-light-muted);
  --text-accent: var(--emerald-deep);
  --border-default: var(--cream-muted);
  --border-strong: var(--gold-primary);
  --accent-primary: var(--emerald-deep);
  --glow-gold: 0 0 30px rgba(210, 169, 90, 0.2);
  --shadow-card: 0 4px 20px rgba(39, 28, 22, 0.08);
}
```

---

**Ende des Design Systems**

*Dieses Dokument ist die einzige Referenz für alle QuizzMe Design-Entscheidungen.*

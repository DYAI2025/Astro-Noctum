# Quiz Vertical - Design Assets

Glowing Outlines Brand Identity für die Quiz Personality Tests Seite.

## 📋 Übersicht

Dieses Verzeichnis enthält alle visuellen Design-Elemente für den Quiz Vertical:

- **6 Quiz-Symbole v2** (SVG) mit cosmic/sci-fi aesthetic und starken Glow-Effekten
- **CSS Design Tokens** für Farben, Glow-Effekte und Größen
- **Cosmic Nebula Background** für subtile Hintergrund-Tiefe

## 🔄 Version History

### v2 (2025-01-11) - CURRENT
- **Complete redesign** basierend auf Reference-Images
- 3-4x stärkere Glow-Effekte (blur: 12-48px, opacity: 0.7-0.95)
- ViewBox erhöht auf 128x128 für mehr Details
- Gefüllte Gradient-Cores statt nur Outlines
- 3-5 Detail-Layer pro Symbol
- Cosmic/Sci-Fi Aesthetic mit starker visueller Präsenz

### v1 (2025-01-10) - DEPRECATED
- Minimalistischer Ansatz mit nur Outlines
- Zu subtile Glows (rejected by user)
- ViewBox: 64x64

## 🎨 Design-Prinzipien

### Form Follows Function
- **Detailliert & Filigran**: 3-5 Layer mit inner complexity
- **Skalierbar**: Funktioniert von 20px (Header) bis 256px (Hero)
- **Erkennbar**: Distinctive cosmic/sci-fi aesthetic
- **Reference-inspired**: Basiert auf DNA helix, heart nebula, astro wheel, lightning bolt

### Visuelle Identität (v2)
- **Strong Glows**: Multi-Layer System mit 3-4x stärkerer Intensität
- **Filled Cores**: Gradient-gefüllte Formen statt nur Outlines
- **White Outlines**: Bright rim highlights auf allen Hauptformen
- **Farbige Glows**: Jeder Quiz-Typ hat seine eigene Signaturfarbe mit intensivem Glow
- **Cosmic Aesthetic**: Branching energy, particles, radiating effects
- **Cosmic Background**: Subtil, nie dominant - nur Tiefe und Kontrast

## 📂 Dateien

### Quiz-Symbole v2 (SVG) - FINALE AUSWAHL

Alle Symbole sind 128×128px viewBox, voll skalierbar.

| Datei | Quiz-Typ | Signaturfarbe | Quelle | Beschreibung |
|-------|----------|---------------|--------|--------------|
| `love-languages-symbol-v2.svg` | Love Languages | Rosa-Gold (255,200,150) | Claude v2 | Cosmic heart nebula mit gefülltem core, energy waves, inner sparkles |
| `social-role-symbol-v2.svg` | Social Role | Königsblau (59,130,246) | Claude v2 | Astro wheel mit spiral galaxy center, 12 cardinal points, orbital rings |
| `rpg-identity-symbol-v2.svg` | RPG Identity | Violett (168,85,247) | Claude v2 | Energy weapon (sword) mit branching lightning bolts, particles, crystal pommel |
| `personality-symbol-v2.svg` | Personality | Smaragdgrün (16,185,129) | assets-claude1 + v2 glows | Atom mit drei orbital ellipses und central nucleus |
| `celebrity-soulmate-symbol-v2.svg` | Celebrity Soulmate | Magenta (236,72,153) | assets-claude1 + v2 glows | Five-pointed star - klassisches Celebrity/Fame Symbol |
| `destiny-symbol-v2.svg` | Destiny | Gold/Amber (251,191,36) | assets-claude1 + v2 glows | Portal mit drei concentric ellipses - Gateway zum Schicksal |

**Preview:** Öffne `symbols-final-preview.html` im Browser für vollständige Ansicht aller finalen Symbole.

**Symbol-Quellen:**
- **Claude v2** (3 Symbole): Love Languages, Social Role, RPG Identity - Cosmic/detailed Stil
- **assets-claude1** (3 Symbole): Personality, Celebrity, Destiny - Ethereal line Stil mit v2 Glow-System

### CSS Design System

| Datei | Zweck |
|-------|-------|
| `quiz-design-tokens.css` | Alle Farben, Glow-Intensitäten, Größen-Presets, Component-Classes |
| `cosmic-nebula-background.css` | Subtiler kosmischer Hintergrund mit Gaswolken + Sternen |

## 🎯 Verwendung

### 1. Symbole in HTML einbetten

**Inline SVG (empfohlen für Flexibilität):**

```html
<div class="quiz-symbol quiz-symbol--large quiz-symbol--love quiz-symbol--default">
  <!-- SVG-Code aus love-languages-symbol-v2.svg hier einfügen -->
  <svg width="128" height="128" viewBox="0 0 128 128">...</svg>
</div>
```

**Externe SVG-Datei (einfacher, aber weniger flexibel):**

```html
<img
  src="/design-assets/love-languages-symbol-v2.svg"
  alt="Love Languages Quiz"
  class="quiz-symbol quiz-symbol--large"
/>
```

### 2. CSS Design Tokens importieren

```css
/* In deinem globals.css oder quiz-layout.css */
@import url('/design-assets/quiz-design-tokens.css');
```

### 3. Cosmic Nebula Background aktivieren

**Statisch (empfohlen):**

```html
<!-- In deinem Quiz Layout -->
<div class="quiz-nebula-bg"></div>
<main class="relative z-10">
  <!-- Quiz Content -->
</main>
```

**Animiert (optional):**

```html
<div class="quiz-nebula-bg--animated"></div>
<main class="relative z-10">
  <!-- Quiz Content -->
</main>
```

**Next.js Integration:**

```tsx
// src/app/verticals/quiz/layout.tsx
export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="quiz-nebula-bg" />
      <div className="relative z-10 min-h-screen">
        {children}
      </div>
    </>
  );
}
```

## 📐 Größen-Varianten

| Class | Größe | Verwendung |
|-------|-------|------------|
| `quiz-symbol--small` | 20px | Headers, Progress-Bars |
| `quiz-symbol--medium` | 40px | Cards Mobile, kleine CTAs |
| `quiz-symbol--large` | 64px | Cards Desktop, Hero-Bereiche |
| `quiz-symbol--hero` | 96px | Sehr große Darstellung (optional) |

## ✨ Glow-Intensitäten

| Class | Effekt | Verwendung |
|-------|--------|------------|
| `quiz-symbol--default` | Dezenter Doppel-Glow | Standard-Zustand |
| `quiz-symbol--muted` | Sehr subtiler Single-Glow | Headers, Breadcrumbs |
| `quiz-symbol--interactive:hover` | Stärkerer Triple-Glow | Hover-State |
| `quiz-symbol--cta` | Pulsierender Glow | Wichtige CTA-Buttons |
| `quiz-symbol--cta-hover:hover` | Schneller Puls auf Hover | CTA nur bei Hover |

## 🎨 Farben-Referenz

### Glow-Farben (RGB)

```css
--quiz-glow-love:        rgb(255, 200, 150)  /* Rosa-Gold */
--quiz-glow-social:      rgb(59, 130, 246)   /* Königsblau */
--quiz-glow-rpg:         rgb(168, 85, 247)   /* Violett */
--quiz-glow-personality: rgb(16, 185, 129)   /* Smaragdgrün */
--quiz-glow-celebrity:   rgb(236, 72, 153)   /* Magenta */
--quiz-glow-destiny:     rgb(251, 191, 36)   /* Gold/Amber */
```

### Basis-Farben

```css
--quiz-outline-base: rgb(248, 250, 252)  /* Helles Weiß für alle Outlines */
--quiz-bg-dark:      rgb(2, 6, 23)       /* Dunkler Basis-Hintergrund */
```

## 🔧 Anpassungen

### Glow-Intensität ändern

In `quiz-design-tokens.css`:

```css
:root {
  /* v2 Standard (stark) */
  --glow-opacity-subtle: 0.7;
  --glow-opacity-medium: 0.8;
  --glow-blur-subtle: 12px;
  --glow-blur-extra: 48px;

  /* Noch stärker (falls gewünscht) */
  --glow-opacity-subtle: 0.8;
  --glow-opacity-medium: 0.9;
}
```

### Neue Farbe für ein Quiz hinzufügen

```css
:root {
  --quiz-glow-new-r: 100;
  --quiz-glow-new-g: 200;
  --quiz-glow-new-b: 255;
  --quiz-glow-new: rgb(var(--quiz-glow-new-r), var(--quiz-glow-new-g), var(--quiz-glow-new-b));
}

.quiz-symbol--new-quiz {
  --glow-r: var(--quiz-glow-new-r);
  --glow-g: var(--quiz-glow-new-g);
  --glow-b: var(--quiz-glow-new-b);
}
```

## ♿ Accessibility

### Reduzierte Animation

Alle Animationen respektieren `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  .quiz-symbol--cta {
    animation: none;
  }
}
```

### Alt-Texte

Immer beschreibende Alt-Texte für Symbole hinzufügen:

```html
<img src="love-languages-symbol.svg" alt="Love Languages Quiz Symbol" />

<!-- Oder bei Inline SVG: -->
<svg role="img" aria-label="Love Languages Quiz Symbol">
  <title>Love Languages Quiz</title>
  ...
</svg>
```

## 📱 Performance

### Mobile Optimierung

- **Cosmic Nebula**: Weniger Gaswolken auf Mobile (automatisch via Media Query)
- **Symbole**: SVG skaliert perfekt, keine separaten Assets nötig
- **Glow-Effekte**: CSS drop-shadow ist performanter als SVG filter

### Laden-Optimierung

- **Inline SVG** für wichtige Above-the-Fold Symbole
- **Externe SVG** für weniger kritische Bereiche
- **CSS in `<head>`** für sofortiges Rendering

## 🚀 Nächste Schritte

Nach User-Feedback:

1. ✅ Symbole v2 erstellen (complete redesign)
2. ✅ CSS Tokens für stärkere Glows updaten
3. ✅ Preview Page für v2 Symbole
4. ⏳ **User Approval auf v2 Symbole erhalten**
5. ⏳ `QuizSymbol` React/Next.js Komponente implementieren
6. ⏳ Landing Page mit neuen v2 Symbolen ausstatten
7. ⏳ Quiz-Headers anpassen
8. ⏳ Responsive Testing (20px - 256px)
9. ⏳ A11y Testing (Kontrast, Screen Reader)

## 📝 Notizen

- **v2 vs v1**: Komplette Neugestaltung mit 3-4x stärkeren Glows und gefüllten Cores
- **Reference-driven**: Basiert auf dna3.jpeg, herz3.jpeg, kreissymbol.jpeg, blitz2.jpeg
- **Emojis entfernen**: Alle `🧠` etc. durch neue v2 Symbole ersetzen
- **Konsistenz**: Alle Quiz-Typen nutzen das gleiche Design-System
- **Skalierbarkeit**: Neue Quiz-Typen folgen dem gleichen Muster (1 Symbol + 1 Farbe)
- **Brand-Trennung**: Horoscope Vertical nutzt **KEINE** Glowing Outlines (nur Cosmic Mirror Background)

## 🎨 Design References

Die v2 Symbole wurden inspiriert von:
- `dna3.jpeg` - DNA helix (Personality symbol)
- `herz3.jpeg` - Heart nebula (Love Languages symbol)
- `kreissymbol.jpeg` - Astro wheel (Social Role symbol)
- `blitz2.jpeg` - Lightning bolt (RPG Identity symbol energy effects)

---

**Erstellt**: 2025-01-10
**v2 Redesign**: 2025-01-11
**Design-Prinzip**: Form Follows Function + Cosmic/Sci-Fi Aesthetic
**Status**: v2 Symbole fertig → **Wartet auf User-Approval**

# Design Inventory & Status Report

## 1. Overview

**Project**: Quiz & Horoscope Platform
**Current Status**: 🚧 Functional Prototype / Inconsistent Design
**Target Design Vision**: "Glowing-Outlines" (Cosmic, Neon, Mystical)

## 2. Design Requirements (Vision)

Based on `kernmerkmale_der_designsprache.md`:

- **Style**: Thin, radiant contours (Neon/Magic Light).
- **Background**: Deep cosmic space (Stars, Nebula).
- **Palette**: Monochromatic backgrounds (Indigo/Black) with bright accents (Gold, Cyan, Magenta).
- **Typography**:  Serif/Sans-Serif mix (implied by content), generally clean and readable against dark backgrounds.
- **Key Elements**: Concentric circles, wave patterns, glowing symbols.

## 3. Current Implementation Status (Reality)

### Global Styles (`globals.css`)

- **State**: Default Next.js + Tailwind v4 setup.
- **Issues**:
  - No global variables for the design tokens defined in `design-assets/quiz-design-tokens.css`.
  - Missing the global background effects from `design-assets/cosmic-nebula-background.css`.

### Page Analysis

#### 3.1 Horoscope Vertical (`/verticals/horoscope`)

- **Visuals**:
  - Background: Flat `bg-slate-900`.
  - Typography: Serif (`font-serif`).
  - Accents: Amber/Gold (`text-amber-100`, `border-amber-500`).
  - Icons: **Emojis** (🔮, ✨) are used instead of the custom SVGs.
- **Verdict**: Attempts the "Gold on Dark" aesthetic but lacks the "Glowing-Outlines" texture and depth.

#### 3.2 Quiz Vertical (`/verticals/quiz`)

- **Visuals**:
  - Background: Gradient `from-slate-900 via-purple-950`.
  - Typography: Sans-Serif (`font-sans`).
  - Accents: Multi-color gradients (Pink/Purple/Indigo).
  - Icons: **Emojis** (❤️, ⚔️) used instead of SVGs.
  - Cards: Glassmorphism attempt (`bg-white/5`), but inconsistent with Horoscope cards.
- **Verdict**: Diverges from the Horoscope design. More colorful but lacks the unified "Cosmic" brand identity.

## 4. Asset Audit (Available but Unused)

The following high-quality assets seem to exist in `design-assets/` but are **not integrated** into the application:

1. **CSS Modules**:
    - `cosmic-nebula-background.css`: Likely contains the star/nebula background effects.
    - `quiz-design-tokens.css`: Likely contains the color variables and glow effects.

2. **Vector Graphics (SVGs)**:
    - The app uses Emojis, but these SVGs exist:
        - `destiny-symbol.svg` / `destiny-symbol-v2.svg`
        - `love-languages-symbol.svg`
        - `personality-symbol.svg`
        - `rpg-identity-symbol.svg`
    - **Action Item**: Replace emojis with these SVGs.

## 5. Implementation Roadmap

To align with the "Glowing-Outlines" vision, the following steps are needed:

1. **Migrate CSS**: Copy `quiz-design-tokens.css` and `cosmic-nebula-background.css` into `platform-app/src/app/` (or `src/styles`).
2. **Update Globals**: Import these new CSS files in `layout.tsx` or `globals.css`.
3. **Component Refactor**:
    - Create a reusable `Card` component that uses the specific "Glowing-Outline" classes.
    - Replace Emojis with `<Image src="..." />` or inline SVGs using the files from `design-assets`.
4. **Layout Unification**: Apply the cosmic background to the main `layout.tsx` so it persists across all pages.

## 6. Screenshots

*(Note: Automated capture unavailable. Current visual description is based on code inspection.)*

- **Current Horoscope**: Dark Slate background, Amber text, simple borders.
- **Current Quiz**: Purple/Slate Gradient background, Rainbow text gradients, simple glass cards.

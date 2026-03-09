Design and build a responsive web experience called **“QuizzMe”** with the following attributes.

GENERAL PRODUCT & THEME
- QuizzMe is a personality-quiz experience for women aged 20–40.
- Core theme: **“Modern Alchemy – the grounded mystic”**: a blend of old wisdom (alchemy, astrology, tarot-like symbolism) and a serious, science-adjacent feel.
- The experience should feel: **friendly, warm, mystical, elegant, trustworthy, and adult** (no childish or kitschy vibes).
- Focus topics: personality, identity, personal growth, self-reflection, “Stars & Identity”.
- All user-facing text is in **German**, using the informal “du”.

VISUAL DIRECTION (SINGLE SOURCE OF TRUTH)
- Overall mood: Dark, immersive background with luminous, golden line-art and refined typography. Mystical but not esoteric-cheap.
- Color palette (approximate HEX values, can be tuned):
  - Primary background: deep emerald / forest green (**#053B3F**) and midnight blue (**#041726**), can be used as subtle vertical or radial gradient.
  - Primary accent: warm metallic gold (**#D2A95A**) and slightly darker antique gold (**#A77D38**) for borders, icons and highlights.
  - Secondary accent: soft sage / eucalyptus green (**#6CA192**) and muted teal (**#1C5B5C**) for secondary elements.
  - Surface / card background: warm cream / parchment (**#F7F0E6** to **#F2E3CF**).
  - Text on light background: very dark greenish-brown (**#271C16**). Text on dark background: warm cream / off-white (**#F7F3EA**).
- Typography:
  - Heading font: classic, elegant **serif** (e.g. Playfair Display, Cormorant Garamond, or similar). Use for logo lockup, page titles, result titles, and key labels like “Dein Ergebnis”, “Mein Charakterbogen”.
  - Body font: clean, highly readable **sans-serif** (e.g. Inter, Source Sans 3). Use for questions, body copy, button labels, stats labels.
  - Distinct hierarchy: H1 very prominent (e.g. 40–56 px desktop), H2 for section headings, H3/H4 for labels; consistent scale across the site.
- Illustration & icon style:
  - Use **golden line-art illustrations** on dark backgrounds: constellations, moons, suns, crystals, plants, geometric alchemy circles.
  - Character / archetype images are **stylized line-art portraits** framed by crystals, leaves, and stars (similar to tarot card art), not realistic stock photos.
  - Small icons: simple line icons with minimal fill, drawn in gold on cream or cream on dark.
- Backgrounds:
  - Dark gradient backgrounds with very subtle star maps, zodiac signs and botanical line-art in low opacity.
  - No harsh patterns or noisy textures. If texture is used, it should be subtle (e.g. soft paper grain on cream cards, faint starfield on dark).

INFORMATION ARCHITECTURE & PAGES
Design the following key views:

1. LANDING PAGE (HOME)
- Purpose: introduce QuizzMe, explain the promise (“Entdecke deine wahre Natur”), and guide users into the main personality quiz.
- Sections (in order):
  1. **Hero**:
     - Dark mystical background.
     - Large serif headline like “Entdecke die Alchemie deiner Persönlichkeit”.
     - Short subline in sans-serif explaining QuizzMe in 1–2 Sätzen.
     - Primary CTA button: “Quiz starten”.
     - Secondary CTA (text link): “Mehr erfahren” scrolls to explanation section.
  2. **How it works**:
     - 3–4 horizontal cards with icons (e.g. eye, crystal, star chart) and short descriptions: “Beantworte Fragen”, “Erhalte deinen Archetypen”, “Sieh deine Stats”, “Teile dein Charakterprofil”.
  3. **Trust & depth section**:
     - Emphasize that results are thoughtful and not random fun only. Include bullet points like “Reflektierte Auswertung”, “Individuelle Stats”.
  4. **Featured Archetypes preview**:
     - Card grid showing 3–4 example archetypes (e.g. “Die visionäre Heilerin”, “Der analytische Hüter”) with mini line-art emblem and 1–2 Sätze Beschreibung.
  5. **Footer**:
     - Links: Über QuizzMe, Datenschutz, Impressum, Kontakt.
- Navigation:
  - Top navigation bar with logo (left) and links (right): “Home”, “Quiz”, “Über”, “Login” (optional). On mobile: compact top bar with logo and hamburger menu opening a drawer.

2. QUIZ FLOW – QUESTION PAGE
- This is the main interaction surface and must be extremely clear and readable.
- Layout:
  - Dark background with circular star map / zodiac ring framing the central content.
  - Centered **cream-colored card** with rounded corners and a thin gold border.
  - Top of card: Progress indicator and question text.
- Question block:
  - Question in bold sans-serif, large enough for comfortable reading.
  - Example copy: “Was beschreibt dich in einer Gruppe am besten?”
- Answer options:
  - 3–5 vertically stacked **answer cards**, each full-width inside the main card.
  - Each answer card:
    - Left: small gold line icon (e.g. eye, hands, crown, brush).
    - Right: text label with short description (e.g. “Die Beobachterin (Auge)”).
    - Card states:
      - Default: cream background, gold border at 1 px, soft shadow.
      - Hover (desktop): glow effect (slightly darker border, subtle outer shadow) and gentle upward motion (1–2 px).
      - Selected: filled with soft gold gradient, white or dark text, icon more prominent.
  - Entire card is clickable, with large tap targets for mobile.
- Progress:
  - Top or bottom progress bar as a thin gold line on a faint track, smoothly animating between questions.
  - Label like “Frage 3 von 12”.
- Controls:
  - Primary CTA: “Weiter”.
  - Secondary text link: “Zurück” (if allowed).
- Behavior:
  - Fade / slide animation between questions (no aggressive transitions).
  - On smaller screens, card should fill width with comfortable padding and keep consistent spacing.

3. RESULT PAGE – “DEIN ERGEBNIS”
- Purpose: deliver a strong “wow” moment and encourage sharing / further exploration.
- Layout:
  - Full-page view with dark background.
  - Central large cream panel with golden border.
- Content structure:
  1. **Result heading**:
     - Serif title like “Dein Ergebnis: Die visionäre Heilerin”.
     - Optional small badge/tagline like “Dein Archetyp: Visionäre Heilerin”.
  2. **Archetype illustration**:
     - Large, centered line-art emblem (character portrait with crystals, leaves, celestial motifs) directly under the title.
  3. **Short summary**:
     - 2–3 Sätze in sans-serif explaining the archetype in an empowering, warm tone.
  4. **Personality stats**:
     - Section heading: “Deine Persönlichkeits-Statistiken”.
     - 3–6 stat bars, e.g. “Empathie 85%”, “Intuition 92%”, “Logik 60%”.
     - Bars are horizontal, cream background with gold fill, rounded ends, labeled clearly.
  5. **Deeper insights**:
     - 2-column layout on desktop, stacked on mobile.
     - Left: “Stärken” as bullet list.
     - Right: “Herausforderungen” / “Wachstumsfelder” as bullet list.
  6. **Call to action**:
     - Buttons:
       - Primary: “Deinen Charakterbogen ansehen” (opens character sheet view).
       - Secondary: “Ergebnis teilen” (sharing options).
- Sharing preview:
  - Result layout and archetype illustration must look good when cropped into a social-card format (centered emblem, readable title).

4. CHARACTER SHEET / PROFILE – “MEIN CHARAKTERBOGEN”
- Concept: feels like a **page from an old magical grimoire or character sheet** from a story-driven RPG, but still clean and legible.
- Layout:
  - Background: dark gradient (emerald to midnight) as outer frame.
  - Center: large parchment-style card with subtle paper texture and decorative border corners in brown/gold line-art.
- Sections:
  1. **Header**:
     - Serif title “Mein Charakterbogen”.
     - Subheader card “Persönliche Daten” with:
       - Name (editable field or display, depending on product scope).
       - Geburtsdatum.
       - Mini archetype illustration in the center top area.
  2. **Stats section – “Meine Stats”**:
     - Grid of stat rows with icons and bar indicators, e.g. Kreativität, Weisheit, Mut, Logik, Empathie, Persönlichkeit.
     - Each row: icon on the left, label, stat bar similar to results page but integrated into parchment style.
  3. **Traits & narrative**:
     - Sections for “Deine Stärken”, “Dein innerer Kompass”, “Typische Herausforderungen” with bullet lists or short paragraphs.
  4. **Reflection prompts**:
     - Small area with guiding questions like “Wie kannst du deine Intuition im Alltag stärker nutzen?”.
  5. **Actions**:
     - Button like “Charakterbogen herunterladen als PDF” (even if only planned for future).
- This view should feel collectible and “shareable” but not childish: elegant borders, minimal decoration, plenty of whitespace for readability.

NAVIGATION & RESPONSIVE BEHAVIOR
- Desktop:
  - Top fixed navigation bar with logo and main links.
  - Content max-width ~1200 px, centered with generous margins.
  - Use a 12-column layout grid for flexible card grids and balanced composition.
- Tablet:
  - Navigation collapses some items into a menu if needed.
  - Quiz card and result card should still be centered and readable with generous tap targets.
- Mobile:
  - Use single-column layouts.
  - Top nav reduces to logo + hamburger.
  - Cards span almost full width with large padding; font sizes adjusted for comfortable reading.
- At all breakpoints, prioritize:
  1. Legibility of questions and answers.
  2. Tappable areas (min. ~44 px height).
  3. Clear visual hierarchy.

UI COMPONENTS (DESIGN SYSTEM STARTER)
Design reusable components consistent with the “Modern Alchemy” style:

- Buttons:
  - Primary: gold-filled with subtle gradient, rounded corners, slight glow on hover, dark text on light or light text on dark depending on context.
  - Secondary: outlined in gold on cream or dark, transparent fill.
  - Disabled: reduced opacity, no glow.
- Cards:
  - Cream background, rounded corners, thin gold border, light shadow.
  - Variants for: quiz answer, archetype preview, info blocks.
- Progress bar:
  - Thin bar with subtle glow for the filled part; must work on both dark and light backgrounds.
- Badges / pills:
  - For tags like “Dein Archetyp” or “Empathie”.
- Iconography:
  - Set of simple, mystical-alchemy icons (eye, hands, crown, brush, scales, crystal, moon, star).
- Form fields:
  - Underlined or boxed inputs with clear labels above, soft focus glow in gold.
- Notification / toast:
  - Simple cream box with gold border for feedback messages (e.g. errors or success states) that does not break the mystical aesthetic.

INTERACTION & ANIMATION
- Animations should be **gentle and subtle**, never distracting.
- Examples:
  - Slow parallax or slight drift of background stars and constellations.
  - Soft fade-in and upward motion for cards on first load.
  - On hover, icons and borders can shimmer slightly or gain a soft glow.
  - Progress bar transitions are smooth rather than instant jumps.
- Use motion to reinforce hierarchy and state changes (hover, active, loading), not as decoration for its own sake.

CONTENT TONE & MICROCOPY
- Voice: empathetic, encouraging, validating, slightly poetic but clear.
- Avoid overly “esoteric” language; instead, connect mystical metaphors to everyday life.
- Example tones:
  - “Du siehst, was andere noch nicht sehen.”
  - “Deine Intuition ist deine größte Ressource – vertraue ihr.”
- Error and helper texts remain warm and straightforward (no shaming).

ACCESSIBILITY & USABILITY REQUIREMENTS
- Ensure color contrast passes WCAG AA for text and interactive elements, especially gold on dark backgrounds.
- Do not rely on color alone to indicate selected answers; use shape, border thickness, or icons as well.
- All interactive elements must have clear focus states (e.g. glowing outline).
- Support keyboard navigation throughout the quiz flow.
- Provide clear instructions and confirm critical actions (e.g. restarting a quiz).

TECHNICAL IMPLEMENTATION GUIDANCE
- Frontend stack:
  - Use **React with Next.js** for SEO-friendly pages and fast navigation.
  - Use a utility-first CSS framework like **Tailwind CSS** or an equivalent design-tokens-based system to keep spacing, colors and typography consistent.
  - For animations and microinteractions, use a library like **Framer Motion** or a lightweight alternative.
- Architecture:
  - Componentize UI according to atomic design: atoms (buttons, inputs, icons), molecules (card, stat bar, progress bar), organisms (quiz question card, result header), templates (page layouts).
  - Separate visual components from quiz logic and data fetching.
- Performance:
  - Optimize illustration assets (SVG preferred for line art).
  - Lazy-load non-critical imagery and character art.
- Internationalization:
  - Keep all German copy in a separate config/translation layer to allow future localization.

CONSTRAINTS & NO-GOS
- Do NOT use stock photos of smiling people; keep imagery abstract and illustrated.
- Avoid neon colors, comic-like gradients, or childish icon sets.
- Avoid loud, rainbow-like palettes; stay within the refined “Modern Alchemy” range defined above.
- Avoid clutter: maintain generous whitespace and clear grouping of elements.
- Do not break visual consistency between landing, quiz, result, and character sheet – they must clearly feel like parts of the same universe.

PRIORITY ORDER WHEN MAKING DESIGN DECISIONS
1. Clarity and readability of quiz questions and results.
2. Emotional resonance and trust (grounded mystical aesthetic).
3. Visual consistency with the “Modern Alchemy” theme.
4. Accessibility and performance best practices.

Use all of the above as the single source of truth for both design and implementation decisions for QuizzMe.
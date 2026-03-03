# Bazodiac — i18n & Content Maintenance Guide

## Overview

The app supports **two languages**: English (`en`) and German (`de`).  
Switching is instant (no page reload) and persisted via `localStorage` + `?lang=` URL parameter.

---

## How to Switch Language

- **In-app toggle**: Header (Desktop) or Bottom Nav (Mobile) — `DE | EN` buttons.
- **URL**: Append `?lang=de` or `?lang=en` — takes priority over localStorage.
- **Splash screen**: Clicking DE/EN on the intro screen sets the app language.
- **Default**: Browser language is detected (`navigator.language`); falls back to `en`.

---

## Where UI Strings Are Maintained

### `src/i18n/translations.ts`

**Single source of truth** for all UI labels, section headers, button texts, error messages, tooltips.

Structure:
```
translations
  ├── en: { nav, splash, auth, form, dashboard }
  └── de: { nav, splash, auth, form, dashboard }
```

To add a new string:
1. Add the key under the appropriate section in both `translationsEn` and `translationsDe`.
2. Use the key in a component: `const { t } = useLanguage(); t("section.key")`

Example:
```ts
// In translations.ts:
translationsEn = { dashboard: { myNewKey: "New label" } }
translationsDe = { dashboard: { myNewKey: "Neues Label" } }

// In component:
const { t } = useLanguage();
<span>{t("dashboard.myNewKey")}</span>
```

---

## Where Astro Content Data Is Maintained

### WuXing 五行 Elements → `src/lib/astro-data/wuxing.ts`

Each element entry:
```ts
{
  key: "Wood",          // Matches API response (English name, case-sensitive)
  chinese: "木",         // Chinese character
  pinyin: "Mù",         // Pinyin transcription
  name: { en: "Wood", de: "Holz" },
  description: {
    en: "2–4 sentences in English...",
    de: "2–4 Sätze auf Deutsch...",
  },
  color: "#3D8B37",     // Hex for visual elements
  emoji: "🌿",
  direction: { en: "East", de: "Osten" },
  season: { en: "Spring", de: "Frühling" },
}
```

**API key mapping**: The `key` field must match exactly what the BaZi/WuXing API returns for `dominant_element`. Supported values: `Wood`, `Fire`, `Earth`, `Metal`, `Water`. German variants (`Holz`, `Feuer`, etc.) are resolved automatically by `getWuxingByKey()`.

To add/edit:
- Find the entry in `WUXING_ELEMENTS` array
- Edit `description.en` and `description.de` (2–4 sentences each)

---

### Earthly Branches 地支 (Dìzhī) → `src/lib/astro-data/earthlyBranches.ts`

The **12 Earthly Branches** correspond to the Chinese zodiac animals. In BaZi (Four Pillars) astrology they appear as the "branch" component of each pillar.

Each entry:
```ts
{
  index: 1,             // 1–12 (Rat=1, Ox=2, ... Pig=12)
  branch: "Zǐ",         // Pinyin of the branch character
  chinese: "子",         // Chinese character
  pinyin: "Zǐ",
  animal: { en: "Rat", de: "Ratte" },
  description: {
    en: "2–4 sentences in English...",
    de: "2–4 Sätze auf Deutsch...",
  },
  emoji: "🐀",
  element: "Water",     // Associated WuXing element (English key)
  yinYang: "yang",
  lunarMonth: 11,
}
```

**Important naming**: These are **Earthly Branches** (`earthlyBranches`, `dìzhī`), NOT "BaiZhi animals". The term is used correctly in the codebase. The property in the API response is `zodiac_sign` (English animal name like `"Rat"`, `"Ox"`, etc.).

To look up a branch by animal name: `getBranchByAnimal("Rat")` — works with EN and DE names.

---

## Language Context API

```tsx
import { useLanguage } from "./contexts/LanguageContext";

function MyComponent() {
  const { lang, setLang, t } = useLanguage();
  
  // lang: "en" | "de"
  // setLang("de") — switches language, persists to localStorage
  // t("nav.atlas") — returns translated string
}
```

`LanguageProvider` wraps the entire app in `src/main.tsx`.

---

## Theme: Morning Mode

The logged-in app uses the **morning theme** (light, bluish-gray gradient).  
All relevant CSS classes are in `src/index.css`:

| Class | Purpose |
|-------|---------|
| `.morning-bg` | Full-height background gradient |
| `.morning-card` | Light glassmorphism card |
| `.morning-stele` | BaZi pillar card (light variant) |
| `.morning-header` | Fixed top navigation bar |
| `.morning-skeleton` | Loading skeleton animation |
| `.lang-toggle` | Language switch button group |
| `.wuxing-bar-track / .wuxing-bar-fill` | WuXing balance bars |

Color tokens used in components:
- `#1E2A3A` — primary text (dark ink)
- `#8B6914` — gold accent (WCAG AA compliant on light BG, contrast ≥ 4.5:1)
- `#C8930A` — warm gold for Sun/Earth elements
- `#1A6BB5` — blue for Moon/Water elements
- `#3D8B37` — green for Wood/Ascendant elements

---

## Layout Structure (Dashboard)

```
[Header: Welcome + Title + Regen button]
[3D Solar System Orrery — full width]

[PRIMARY GRID: 2 columns (desktop) / stack (mobile)]
  LEFT — Western Astrology:        RIGHT — BaZi / WuXing:
  ├── Sun Sign card               ├── Year Animal (Earthly Branch) card
  ├── Moon Sign card              ├── Dominant WuXing Element card
  └── Ascendant card              ├── Day Master card
                                  └── Month Stem card

[SECTION 2]
  ├── BaZi Four Pillars (stele grid)
  ├── WuXing Balance (all 5 elements with bars if data available)
  └── Western Houses (if provided by API)

[AI INTERPRETATION + LEVI CALL — 2 columns (desktop)]
```

---

## Adding a New Language (Future)

1. Add the new locale to `Language` type in `src/i18n/translations.ts`
2. Add a full translation object alongside `translationsEn` and `translationsDe`
3. Add the locale to `translations` export map
4. Add the language button to the `lang-toggle` in `src/App.tsx`
5. Update `readInitialLang()` in `LanguageContext.tsx` to detect the new locale

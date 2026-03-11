# Dashboard Tiles Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign dashboard tiles for maximum personalization: proper zodiac/coin art, Chinese characters as symbols, expanded Gemini prompt generating structured JSON (tile texts + house tooltips), collapsible "more" sections, and bilingual interpretation.

**Architecture:** Asset pipeline (sharp WebP conversion) → Gemini prompt expansion (structured JSON response) → new ExpandableText component → Dashboard tile updates → Houses tooltip integration. Single Gemini call generates all personalized content.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind v4, Framer Motion, Gemini 2.0 Flash, sharp (dev-only)

---

### Task 1: Convert zodiac PNGs to WebP + create lookup map

**Files:**
- Convert: `public/zodiac/*.png` (12 files) → `public/zodiac/*.webp`
- Create: `src/lib/astro-data/zodiacAssets.ts`

**Step 1: Install sharp as dev dependency**

```bash
npm install --save-dev sharp
```

**Step 2: Create conversion script**

Create `scripts/convert-zodiac.mjs`:

```js
import sharp from 'sharp';
import { readdir } from 'fs/promises';
import { join } from 'path';

const dir = 'public/zodiac';
const files = (await readdir(dir)).filter(f => f.endsWith('.png'));

for (const file of files) {
  const src = join(dir, file);
  const dest = join(dir, file.replace('.png', '.webp'));
  await sharp(src).webp({ quality: 80 }).toFile(dest);
  console.log(`${file} → ${file.replace('.png', '.webp')}`);
}
```

**Step 3: Run conversion**

```bash
node scripts/convert-zodiac.mjs
```

Expected: 12 `.webp` files in `public/zodiac/`.

**Step 4: Verify sizes**

```bash
ls -lh public/zodiac/*.webp
```

Expected: Each file ~50-200KB (down from 2-5MB).

**Step 5: Delete original PNGs**

```bash
rm public/zodiac/*.png
```

**Step 6: Create zodiac asset lookup**

Create `src/lib/astro-data/zodiacAssets.ts`:

```ts
// Maps Western zodiac sign names (as used in app state) to asset paths.
// Note: filenames use non-standard names from the original assets.
const ZODIAC_ART: Record<string, string> = {
  Aries:       "/zodiac/aries.webp",
  Taurus:      "/zodiac/taurus.webp",
  Gemini:      "/zodiac/gemini.webp",
  Cancer:      "/zodiac/cancer.webp",
  Leo:         "/zodiac/lion.webp",
  Virgo:       "/zodiac/virgo.webp",
  Libra:       "/zodiac/libra.webp",
  Scorpio:     "/zodiac/scorpion.webp",
  Sagittarius: "/zodiac/sagitarius.webp",
  Capricorn:   "/zodiac/capricorn.webp",
  Aquarius:    "/zodiac/aquarius.webp",
  Pisces:      "/zodiac/pisces.webp",
};

/** Get zodiac art path for a Western sign. Returns undefined if unknown. */
export function getZodiacArt(sign: string): string | undefined {
  return ZODIAC_ART[sign];
}
```

**Step 7: Run lint**

```bash
npm run lint
```

Expected: PASS

**Step 8: Commit**

```bash
git add public/zodiac/ src/lib/astro-data/zodiacAssets.ts scripts/convert-zodiac.mjs
git commit -m "asset: convert zodiac PNGs to WebP and add lookup map"
```

**Step 9: Clean up**

```bash
rm scripts/convert-zodiac.mjs
npm uninstall sharp
git add scripts/ package.json package-lock.json
git commit -m "chore: remove sharp after asset conversion"
```

---

### Task 2: Convert coin PNGs to WebP + update coinAssets.ts

**Files:**
- Convert: `media/coins/*.png` (12 files) → `public/coins/*.webp` (replacing old numbered files)
- Modify: `src/lib/astro-data/coinAssets.ts`

**Step 1: Install sharp**

```bash
npm install --save-dev sharp
```

**Step 2: Create conversion script**

Create `scripts/convert-coins.mjs`:

```js
import sharp from 'sharp';
import { readdir } from 'fs/promises';
import { join } from 'path';

const srcDir = 'media/coins';
const destDir = 'public/coins';
const files = (await readdir(srcDir)).filter(f => f.endsWith('.png'));

for (const file of files) {
  const src = join(srcDir, file);
  const dest = join(destDir, file.replace('.png', '.webp'));
  await sharp(src).webp({ quality: 80 }).toFile(dest);
  console.log(`${file} → ${dest}`);
}
```

**Step 3: Run conversion**

```bash
node scripts/convert-coins.mjs
```

Expected: 12 new `.webp` files in `public/coins/` with animal names.

**Step 4: Delete old numbered coin files**

```bash
rm public/coins/1.webp public/coins/2.webp public/coins/3.webp public/coins/4.webp public/coins/5.webp public/coins/6.webp public/coins/7.webp public/coins/8.webp public/coins/9.webp public/coins/10.webp public/coins/11.webp public/coins/12.webp
```

**Step 5: Update `coinAssets.ts`**

Replace the entire content of `src/lib/astro-data/coinAssets.ts`:

```ts
// Maps English animal names (as returned by BAFE API) to coin asset paths.
// Assets are in public/coins/ as WebP. Filenames come from media/coins/ originals.
// Note: BAFE returns "Ox" but file is "buffalo", "Rooster" but file is "cock".

const COIN_MAP: Record<string, string> = {
  rat:     "/coins/rat.webp",
  ox:      "/coins/buffalo.webp",
  tiger:   "/coins/tiger.webp",
  rabbit:  "/coins/rabbit.webp",
  dragon:  "/coins/dragon.webp",
  snake:   "/coins/snake.webp",
  horse:   "/coins/horse.webp",
  goat:    "/coins/goat.webp",
  monkey:  "/coins/monkey.webp",
  rooster: "/coins/cock.webp",
  dog:     "/coins/dog.webp",
  pig:     "/coins/pig.webp",
};

/** Get the coin asset path for a given animal. Returns undefined if unknown. */
export function getCoinAsset(animal: string): string | undefined {
  if (!animal) return undefined;
  return COIN_MAP[animal.toLowerCase()];
}
```

**Step 6: Run lint**

```bash
npm run lint
```

Expected: PASS

**Step 7: Commit**

```bash
git add public/coins/ src/lib/astro-data/coinAssets.ts
git commit -m "asset: replace numbered coins with named animal WebPs"
```

**Step 8: Clean up**

```bash
rm scripts/convert-coins.mjs
npm uninstall sharp
git add scripts/ package.json package-lock.json
git commit -m "chore: remove sharp after coin conversion"
```

---

### Task 3: Expand Gemini prompt to return structured JSON

**Files:**
- Modify: `server.mjs:37-59` (buildGeminiPrompt function)
- Modify: `src/services/gemini.ts` (parse JSON response)
- Create: `src/types/interpretation.ts` (type for structured response)

**Step 1: Define the interpretation types**

Create `src/types/interpretation.ts`:

```ts
export interface TileTexts {
  sun?: string;
  moon?: string;
  yearAnimal?: string;
  dominantWuXing?: string;
  dayMaster?: string;
}

export interface HouseTexts {
  [houseNumber: string]: string; // "1" through "12"
}

export interface InterpretationResponse {
  interpretation: string;
  tiles: TileTexts;
  houses: HouseTexts;
}
```

**Step 2: Update `buildGeminiPrompt` in `server.mjs`**

Replace lines 37-59 of `server.mjs` with:

```js
function buildGeminiPrompt(data, lang) {
  const l = lang === 'de' ? 'German' : 'English';
  const you = lang === 'de' ? 'du' : 'you';
  return `
You are Bazodiac's fusion astrologer — the ONLY system that synthesizes Western astrology, Chinese BaZi, and Wu-Xing Five Elements into one unified reading.

BIRTH DATA (JSON):
${JSON.stringify(data, null, 2)}

TASK: Generate a deeply personal ${l} horoscope. Address the reader as "${you}". Respond with VALID JSON only — no markdown fences, no commentary outside the JSON.

OUTPUT FORMAT (strict JSON):
{
  "interpretation": "5 paragraphs, 400-500 words, Markdown formatted. Structure: 1) Cosmic Identity (Sun sign + Day Master), 2) Emotional Depths (Moon + BaZi pillars + dominant element), 3) Fusion Revelation (unique Western+BaZi+WuXing intersection), 4) WuXing Balance (element strengths/weaknesses + Ascendant + life recommendation), 5) Path Forward (synthesis + closing).",
  "tiles": {
    "sun": "2-3 sentences about this specific Sun sign personality in context of the full chart. Reference element and ruling planet.",
    "moon": "2-3 sentences about this specific Moon sign emotional nature in context of the full chart.",
    "yearAnimal": "2-3 sentences about the specific BaZi year animal + element combination and what it reveals about character.",
    "dominantWuXing": "2-3 sentences about the dominant Wu-Xing element and how it shapes this person's energy.",
    "dayMaster": "2-3 sentences about the Heavenly Stem Day Master and what it says about core vitality."
  },
  "houses": {
    "1": "2-3 sentences: what this specific zodiac sign in the 1st house means for this person's self-image and appearance.",
    "2": "2-3 sentences: what this sign in the 2nd house means for values and finances.",
    "3": "2-3 sentences: what this sign in the 3rd house means for communication.",
    "4": "2-3 sentences: what this sign in the 4th house means for home and roots.",
    "5": "2-3 sentences: what this sign in the 5th house means for creativity and romance.",
    "6": "2-3 sentences: what this sign in the 6th house means for health and daily routines.",
    "7": "2-3 sentences: what this sign in the 7th house means for partnerships.",
    "8": "2-3 sentences: what this sign in the 8th house means for transformation.",
    "9": "2-3 sentences: what this sign in the 9th house means for philosophy and travel.",
    "10": "2-3 sentences: what this sign in the 10th house means for career and public image.",
    "11": "2-3 sentences: what this sign in the 11th house means for friendships and ideals.",
    "12": "2-3 sentences: what this sign in the 12th house means for the subconscious and spirituality."
  }
}

RULES:
- Every text MUST reference specific data from the birth chart — never generic
- If house data is missing or empty, omit the "houses" key entirely
- Language: ALL text in ${l}
- Do NOT hallucinate data not present in the birth chart
- TONE: Warm, precise, mystical but grounded. Every sentence for THIS chart only.
`.trim();
}
```

**Step 3: Update response parsing in `server.mjs`**

In `server.mjs`, update the interpret endpoint (around line 641) to handle JSON:

Replace:
```js
    const text = response.text?.trim();
    if (!text) return res.status(502).json({ error: "Empty response from AI" });
    res.json({ text });
```

With:
```js
    const raw = response.text?.trim();
    if (!raw) return res.status(502).json({ error: "Empty response from AI" });

    // Try to parse as structured JSON
    try {
      const parsed = JSON.parse(raw);
      if (parsed.interpretation) {
        return res.json(parsed);
      }
    } catch {
      // Gemini returned plain text — fall back to legacy format
    }
    // Legacy fallback: return as plain text
    res.json({ text: raw });
```

**Step 4: Update `src/services/gemini.ts`**

Replace the entire file:

```ts
import { generateTemplateInterpretation } from "./interpretation-templates";
import type { InterpretationResponse } from "../types/interpretation";

/** Default empty response when Gemini is unavailable */
function fallbackResponse(text: string): InterpretationResponse {
  return { interpretation: text, tiles: {}, houses: {} };
}

/**
 * Generates an AI-powered horoscope interpretation.
 * Calls the server-side /api/interpret endpoint — Gemini API key is NEVER in the browser bundle.
 * Returns structured JSON with interpretation + tile texts + house tooltips.
 * Falls back to template-based interpretation if server is unavailable.
 */
export async function generateInterpretation(data: unknown, lang: string = "en"): Promise<InterpretationResponse> {
  const templateText = generateTemplateInterpretation(data, lang);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 22000);

    const response = await fetch("/api/interpret", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data, lang }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`Server responded ${response.status}`);
    const json = await response.json();

    // Structured JSON response (new format)
    if (json.interpretation) {
      return {
        interpretation: json.interpretation,
        tiles: json.tiles || {},
        houses: json.houses || {},
      };
    }

    // Legacy plain-text response
    if (json.text) {
      return fallbackResponse(json.text);
    }
  } catch (err) {
    console.warn("Gemini server proxy failed, using template fallback:", err);
  }

  if (templateText) return fallbackResponse(templateText);

  const fallbackMsg = lang === "de"
    ? "## Dein Bazodiac Fusion-Blueprint\n\nDein kosmisches Profil wird berechnet. Die vollständige Interpretation basierend auf deinen Geburtsdaten wird in Kürze verfügbar sein."
    : "## Your Bazodiac Fusion Blueprint\n\nYour cosmic profile is being calculated. The full interpretation based on your birth data will be available shortly.";

  return fallbackResponse(fallbackMsg);
}
```

**Step 5: Run lint**

```bash
npm run lint
```

Expected: Type errors in `App.tsx` and `AppLayoutContext.tsx` because `interpretation` was `string`, now it's `InterpretationResponse`. We fix this in Task 4.

**Step 6: Commit**

```bash
git add src/types/interpretation.ts src/services/gemini.ts server.mjs
git commit -m "feat: expand Gemini prompt to return structured JSON with tile texts and house tooltips"
```

---

### Task 4: Update App.tsx and AppLayoutContext for structured interpretation

**Files:**
- Modify: `src/App.tsx:47,161-162,168`
- Modify: `src/contexts/AppLayoutContext.tsx:6`

**Step 1: Update AppLayoutContext type**

In `src/contexts/AppLayoutContext.tsx`, change `interpretation: string` to use the new type:

Add import at top:
```ts
import type { InterpretationResponse } from '../types/interpretation';
```

Change line 6 from:
```ts
interpretation: string;
```
to:
```ts
interpretation: InterpretationResponse;
```

**Step 2: Update App.tsx state and calls**

In `src/App.tsx`:

Add import:
```ts
import type { InterpretationResponse } from './types/interpretation';
```

Change line 47 from:
```ts
const [interpretation, setInterpretation] = useState<string | null>(null);
```
to:
```ts
const [interpretation, setInterpretation] = useState<InterpretationResponse | null>(null);
```

In `handleSubmit` (around line 161), `generateInterpretation` now returns `InterpretationResponse` — the call stays the same but `aiInterpretation` is now the full object.

In `upsertAstroProfile` call (around line 168), change:
```ts
upsertAstroProfile(user.id, data, results, aiInterpretation),
```
to:
```ts
upsertAstroProfile(user.id, data, results, aiInterpretation.interpretation),
```

Also find the profile-load path where interpretation is reconstructed from Supabase (search for `setInterpretation` calls). If the stored profile has a plain string interpretation, wrap it:
```ts
setInterpretation({ interpretation: profile.interpretation, tiles: {}, houses: {} });
```

**Step 3: Run lint**

```bash
npm run lint
```

Expected: Errors in Dashboard.tsx where `interpretation` is used as string. We fix this in Task 6.

**Step 4: Commit**

```bash
git add src/App.tsx src/contexts/AppLayoutContext.tsx
git commit -m "refactor: update state and context to use InterpretationResponse type"
```

---

### Task 5: Create ExpandableText component

**Files:**
- Create: `src/components/ExpandableText.tsx`

**Step 1: Create the component**

Create `src/components/ExpandableText.tsx`:

```tsx
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "../contexts/LanguageContext";

interface ExpandableTextProps {
  text: string | undefined;
}

export function ExpandableText({ text }: ExpandableTextProps) {
  const [open, setOpen] = useState(false);
  const { lang } = useLanguage();

  if (!text) return null;

  return (
    <div className="mt-3 border-t border-[#8B6914]/10 pt-3">
      <button
        onClick={() => setOpen(!open)}
        className="text-[10px] text-[#8B6914] uppercase tracking-[0.15em] hover:text-[#8B6914]/80 transition-colors"
      >
        {open
          ? (lang === "de" ? "Weniger" : "Less")
          : (lang === "de" ? "Mehr erfahren" : "Read more")}
      </button>
      <AnimatePresence>
        {open && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="text-xs text-[#1E2A3A]/55 leading-relaxed mt-2 overflow-hidden"
          >
            {text}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
```

**Step 2: Run lint**

```bash
npm run lint
```

Expected: PASS

**Step 3: Commit**

```bash
git add src/components/ExpandableText.tsx
git commit -m "feat: add ExpandableText component for collapsible tile content"
```

---

### Task 6: Redesign Sun Sign and Moon Sign cards

**Files:**
- Modify: `src/components/Dashboard.tsx:1-6,506-589`

**Step 1: Add imports**

At top of `Dashboard.tsx`, add:

```ts
import { getZodiacArt } from "../lib/astro-data/zodiacAssets";
import { ExpandableText } from "./ExpandableText";
```

Remove `Zap` from the lucide-react import (no longer needed after Task 7).

**Step 2: Add zodiac art lookups in data section**

After line ~316 (where `ascSignData` is defined), add:

```ts
const sunZodiacArt = useMemo(() => getZodiacArt(sunSign), [sunSign]);
const moonZodiacArt = useMemo(() => getZodiacArt(moonSign), [moonSign]);
```

**Step 3: Access tile texts from interpretation**

After the zodiac art lookups, add:

```ts
const tileTexts = interpretation?.tiles || {};
const houseTexts = interpretation?.houses || {};
```

Note: `interpretation` comes from `useAppLayout()` and is now `InterpretationResponse`. The Dashboard accesses it around line 247. Change how it's used:

Find where `interpretation` is used in the Markdown section (~line 957-984). Change from:
```ts
const interpretationParagraphs = useMemo(
  () => interpretation?.split("\n\n") || [],
  [interpretation],
);
```
to:
```ts
const interpretationText = interpretation?.interpretation || "";
const interpretationParagraphs = useMemo(
  () => interpretationText.split("\n\n") || [],
  [interpretationText],
);
```

**Step 4: Rewrite Sun Sign card (lines ~507-547)**

Replace the Sun Sign card with:

```tsx
{/* Sun Sign */}
<div className="morning-card p-5 sm:p-7 flex flex-col justify-between" data-special="true">
  <div>
    <div className="flex items-center justify-between mb-4">
      <span className="text-2xl leading-none select-none text-[#C8930A]">{sunEmoji}</span>
      <Badge text={t("dashboard.western.sunLabel")} />
    </div>

    <div className="flex items-start justify-between gap-4 mb-4">
      <div className="min-w-0">
        <h3 className="font-serif text-xl sm:text-2xl text-[#1E2A3A] leading-tight mb-0.5">
          {sunSignName || "—"}
        </h3>
        <p className="text-[9px] uppercase tracking-[0.25em] text-[#8B6914]/50">
          {t("dashboard.western.sunTitle")}
        </p>
      </div>
      {sunZodiacArt && (
        <img
          src={sunZodiacArt}
          alt={sunSignName}
          className="w-24 h-24 sm:w-28 sm:h-28 object-contain shrink-0 -mt-2 opacity-80"
          loading="lazy"
        />
      )}
    </div>

    <p className="text-xs text-[#1E2A3A]/55 leading-relaxed">
      {sunSignData
        ? sunSignData.sun[lang]
        : t("dashboard.western.sunDesc")}
    </p>
    <ExpandableText text={tileTexts.sun} />
  </div>
  <div className="flex justify-between items-center border-t border-[#8B6914]/10 pt-4 mt-5">
    <span className="text-2xl leading-none select-none text-[#C8930A]">{sunEmoji}</span>
    {sunSignData && (
      <span className="text-[10px] text-[#1E2A3A]/35">
        {sunSignData.element[lang]} · {sunSignData.ruler[lang]}
      </span>
    )}
    <Badge text={sunSignData?.quality?.[lang] || ""} />
  </div>
</div>
```

**Step 5: Rewrite Moon Sign card (lines ~550-589)**

Same pattern as Sun Sign:

```tsx
{/* Moon Sign */}
<div className="morning-card p-5 sm:p-7 flex flex-col justify-between">
  <div>
    <div className="flex items-center justify-between mb-4">
      <span className="text-2xl leading-none select-none text-[#1A6BB5]">{moonEmoji}</span>
      <Badge text={t("dashboard.western.moonLabel")} />
    </div>

    <div className="flex items-start justify-between gap-4 mb-4">
      <div className="min-w-0">
        <h3 className="font-serif text-xl sm:text-2xl text-[#1E2A3A] leading-tight mb-0.5">
          {moonSignName || "—"}
        </h3>
        <p className="text-[9px] uppercase tracking-[0.25em] text-[#8B6914]/50">
          {t("dashboard.western.moonTitle")}
        </p>
      </div>
      {moonZodiacArt && (
        <img
          src={moonZodiacArt}
          alt={moonSignName}
          className="w-24 h-24 sm:w-28 sm:h-28 object-contain shrink-0 -mt-2 opacity-80"
          loading="lazy"
        />
      )}
    </div>

    <p className="text-xs text-[#1E2A3A]/55 leading-relaxed">
      {moonSignData
        ? moonSignData.moon[lang]
        : t("dashboard.western.moonDesc")}
    </p>
    <ExpandableText text={tileTexts.moon} />
  </div>
  <div className="flex justify-between items-center border-t border-[#8B6914]/10 pt-4 mt-5">
    <span className="text-2xl leading-none select-none text-[#1A6BB5]">{moonEmoji}</span>
    {moonSignData && (
      <span className="text-[10px] text-[#1E2A3A]/35">
        {moonSignData.element[lang]} · {moonSignData.ruler[lang]}
      </span>
    )}
    <Badge text={moonSignData?.quality?.[lang] || ""} />
  </div>
</div>
```

**Step 6: Run lint**

```bash
npm run lint
```

Expected: PASS (or minor issues to fix)

**Step 7: Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "feat: redesign Sun/Moon cards with zodiac art and expandable Gemini text"
```

---

### Task 7: Redesign Year Animal, Dominant WuXing, and Day Master cards

**Files:**
- Modify: `src/components/Dashboard.tsx:628-748`

**Step 1: Rewrite Year Animal card (lines ~628-671)**

Replace with:

```tsx
{/* Year Animal */}
<div className="morning-card p-5 sm:p-7 flex flex-col justify-between" data-special="true">
  <div>
    <div className="flex items-center justify-between mb-4">
      <span className="font-serif text-4xl leading-none select-none text-[#8B6914]">
        {yearBranch?.chinese || "✨"}
      </span>
      <Badge text={t("dashboard.bazi.zodiacLabel")} />
    </div>
    <h3 className="font-serif text-xl sm:text-2xl text-[#1E2A3A] leading-tight mb-0.5">
      {yearAnimalName || "—"}
    </h3>
    <p className="text-[9px] uppercase tracking-[0.25em] text-[#8B6914]/50 mb-4">
      {yearElement && yearBranch
        ? `${getWuxingName(yearElement, lang)}-${yearAnimalName} (${yearBranch.chinese})`
        : t("dashboard.bazi.yearAnimalTitle")}
    </p>
    {yearCoinSrc && (
      <div className="flex justify-center my-4">
        <img
          src={yearCoinSrc}
          alt={yearAnimalName}
          className="w-32 h-32 sm:w-40 sm:h-40 object-contain rounded-full"
          loading="lazy"
        />
      </div>
    )}
    {yearBranch && (
      <p className="text-xs text-[#1E2A3A]/55 leading-relaxed">
        {yearBranch.description[lang]}
      </p>
    )}
    <ExpandableText text={tileTexts.yearAnimal} />
  </div>
  <div className="flex justify-between items-center border-t border-[#8B6914]/10 pt-4 mt-5">
    <div className="flex items-center gap-2">
      {yearBranch && (
        <span className="font-serif text-xl text-[#8B6914]">{yearBranch.chinese}</span>
      )}
      {yearBranch && (
        <span className="text-[10px] text-[#1E2A3A]/35">
          {getWuxingName(yearBranch.element, lang)} · {yearBranch.pinyin}
        </span>
      )}
    </div>
    <Badge text={t("dashboard.bazi.yearAnimalBadge")} />
  </div>
</div>
```

Key changes: Chinese character as `text-4xl` top-left symbol (replacing emoji), coin image larger (`w-32 h-32 sm:w-40 sm:h-40`), ExpandableText added.

**Step 2: Rewrite Dominant WuXing card (lines ~674-714)**

Replace with:

```tsx
{/* Dominant WuXing Element */}
<div
  className="morning-card p-5 sm:p-7 flex flex-col justify-between"
  style={dominantWuxing ? {
    borderLeftColor: dominantWuxing.color + "55",
    borderLeftWidth: "3px",
    borderLeftStyle: "solid",
  } : undefined}
>
  <div>
    <div className="flex items-center justify-between mb-4">
      <span className="font-serif text-4xl leading-none select-none" style={{ color: dominantWuxing?.color }}>
        {dominantWuxing?.chinese || "✨"}
      </span>
      <Badge text={t("dashboard.bazi.essenceLabel")} />
    </div>
    <h3 className="font-serif text-xl sm:text-2xl text-[#1E2A3A] leading-tight mb-0.5">
      {dominantWuxing ? dominantWuxing.name[lang] : (dominantEl || "—")}
    </h3>
    <p className="text-[9px] uppercase tracking-[0.25em] text-[#8B6914]/50 mb-4">
      {t("dashboard.bazi.dominantElementTitle")}
    </p>
    {dominantWuxing && (
      <p className="text-xs text-[#1E2A3A]/55 leading-relaxed">
        {dominantWuxing.description[lang]}
      </p>
    )}
    <ExpandableText text={tileTexts.dominantWuXing} />
  </div>
  <div className="flex justify-between items-center border-t border-[#8B6914]/10 pt-4 mt-5">
    <div className="flex items-center gap-2">
      {dominantWuxing && (
        <span className="font-serif text-xl leading-none select-none" style={{ color: dominantWuxing.color }}>
          {dominantWuxing.chinese}
        </span>
      )}
      {dominantWuxing && (
        <span className="text-[10px] text-[#1E2A3A]/35">
          {dominantWuxing.pinyin} · {dominantWuxing.direction[lang]} · {dominantWuxing.season[lang]}
        </span>
      )}
    </div>
    <Badge text="WUXING" />
  </div>
</div>
```

Key change: Chinese character (`木火土金水`) as `text-4xl` top-left symbol with element color, replacing emoji.

**Step 3: Rewrite Day Master card (lines ~717-748)**

Replace with:

```tsx
{/* Day Master */}
<div className="morning-card p-5 sm:p-7 flex flex-col justify-between">
  <div>
    <div className="flex items-center justify-between mb-4">
      <span className="font-serif text-4xl leading-none select-none text-[#8B6914]">
        {dayMaster || "—"}
      </span>
      <Badge text={t("dashboard.bazi.vitalityLabel")} />
    </div>
    <h3 className="font-serif text-xl sm:text-2xl text-[#1E2A3A] leading-tight mb-0.5">
      {dayMaster}{dayMasterStem ? ` ${dayMasterStem.pinyin}` : ""}
    </h3>
    <p className="text-[9px] uppercase tracking-[0.25em] text-[#8B6914]/50 mb-4">
      {dayMasterStem
        ? `${t("dashboard.bazi.dayMasterTitle")} — ${dayMasterStem.name[lang]}`
        : t("dashboard.bazi.dayMasterTitle")}
    </p>
    <p className="text-xs text-[#1E2A3A]/55 leading-relaxed">
      {dayMasterStem
        ? dayMasterStem.dayMaster[lang]
        : t("dashboard.bazi.dayMasterDesc")}
    </p>
    <ExpandableText text={tileTexts.dayMaster} />
  </div>
  <div className="flex justify-between items-center border-t border-[#8B6914]/10 pt-4 mt-5">
    <div className="flex items-center gap-2">
      <span className="font-serif text-xl text-[#8B6914]">{dayMaster}</span>
      {dayMasterStem && (
        <span className="text-[10px] text-[#1E2A3A]/35">
          {dayMasterStem.element} · {dayMasterStem.yinYang === "yang" ? "Yang" : "Yin"} · {dayMasterStem.pinyin}
        </span>
      )}
    </div>
    <Badge text={lang === "de" ? "TAGESMEISTER" : "DAY MASTER"} />
  </div>
</div>
```

Key change: Chinese Heavenly Stem character as `text-4xl` top-left symbol in gold, replacing Zap icon. Also remove `Zap` from lucide-react import at top of file.

**Step 4: Run lint**

```bash
npm run lint
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "feat: redesign BaZi cards with Chinese characters as symbols and expandable text"
```

---

### Task 8: Add personalized hover tooltips to Houses

**Files:**
- Modify: `src/components/Dashboard.tsx:884-938`

**Step 1: Wrap each house card in a Tooltip**

Replace the house card rendering (lines ~905-933) with:

```tsx
return (
  <Tooltip
    key={houseKey}
    content={houseTexts[String(num)] || ""}
    wide
  >
    <div className="morning-card p-4 sm:p-5 overflow-hidden cursor-help">
      {/* House number + name */}
      <div className="flex items-baseline gap-1.5 sm:gap-2 mb-2 sm:mb-3 min-w-0">
        <span className="font-serif text-base text-[#8B6914] font-medium leading-none shrink-0">
          {roman}
        </span>
        {meaning && (
          <span className="text-[9px] sm:text-[10px] text-[#1E2A3A]/45 tracking-wide truncate">
            {meaning.name[lang]}
          </span>
        )}
      </div>

      {/* Sign */}
      <div className="font-serif text-base sm:text-lg text-[#1E2A3A] flex items-center gap-1.5 sm:gap-2 mb-2 min-w-0">
        <span className="text-[#8B6914]/80 shrink-0">{emoji}</span>
        <span className="truncate">{signDisplay}</span>
      </div>

      {/* Brief label */}
      {meaning && sign && (
        <p className="text-[9px] sm:text-[10px] text-[#1E2A3A]/40 leading-relaxed line-clamp-2">
          {lang === "de"
            ? `${signDisplay} prägt das Lebensfeld ${meaning.name.de}.`
            : `${signDisplay} shapes your house of ${meaning.name.en}.`}
        </p>
      )}
    </div>
  </Tooltip>
);
```

Key change: Each house card is wrapped in `<Tooltip>` with personalized text from `houseTexts[num]`. Added `cursor-help` class.

**Step 2: Run lint**

```bash
npm run lint
```

Expected: PASS

**Step 3: Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "feat: add personalized hover tooltips to house cards"
```

---

### Task 9: Fix interpretation section for new response format

**Files:**
- Modify: `src/components/Dashboard.tsx:942-984` (interpretation rendering)

**Step 1: Update interpretation text access**

The Markdown rendering section uses `interpretationParagraphs` which was split from `interpretation` (a string). Now `interpretation` is `InterpretationResponse`.

This was partially handled in Task 6 Step 3. Verify that:

1. `interpretationParagraphs` uses `interpretation?.interpretation` (the string field)
2. All references to `interpretation` in the template display the `.interpretation` field

Search for other uses of `interpretation` in Dashboard.tsx and ensure they use `.interpretation` for the text content.

**Step 2: Run lint**

```bash
npm run lint
```

Expected: PASS — no more type errors.

**Step 3: Run dev server and test**

```bash
npm run dev
```

Open `http://localhost:3000`, log in, verify:
- Sun/Moon cards show zodiac art images
- BaZi cards show Chinese characters as symbols
- Coin images are the new larger ones
- "Mehr erfahren" buttons appear and expand on tiles (if Gemini responded with structured JSON)
- House cards show tooltips on hover
- Interpretation text renders correctly

**Step 4: Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "fix: update interpretation section for structured InterpretationResponse format"
```

---

### Task 10: Run build and verify production readiness

**Step 1: Run lint**

```bash
npm run lint
```

Expected: 0 errors.

**Step 2: Run production build**

```bash
npm run build
```

Expected: Build succeeds. May have warnings about chunk sizes (pre-existing).

**Step 3: Commit any remaining fixes**

If lint or build revealed issues, fix and commit.

---

## Summary

| Task | Type | What |
|------|------|------|
| 1 | asset | Zodiac PNGs → WebP + lookup map |
| 2 | asset | Coin PNGs → WebP + name-based keys |
| 3 | backend + types | Gemini prompt → structured JSON |
| 4 | refactor | App.tsx + context for InterpretationResponse |
| 5 | component | ExpandableText component |
| 6 | UI | Sun/Moon cards with zodiac art + expandable text |
| 7 | UI | BaZi cards with Chinese characters + expandable text |
| 8 | UI | Houses personalized hover tooltips |
| 9 | UI | Interpretation section format fix |
| 10 | verify | Lint + build check |

# BaZi Dashboard v2 — Frame Consistency & Content Depth

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the right-side BaZi/WuXing cards match the visual quality and content depth of the left-side Western astrology cards, so a user cannot tell which side was built first.

**Architecture:** Pure frontend change to `Dashboard.tsx` and its data modules. No backend/API changes. The data already exists in `earthlyBranches.ts` (12 animals, 4 sentences each, EN/DE) and `wuxing.ts` (5 elements, full descriptions). The Dashboard currently truncates descriptions to the first sentence. We align the right-card anatomy to match the left-card pattern (Badge → Title → Name → Sub-Label → Icon → Description → Footer) and show full descriptions. Coin assets are a future addition (Ben must provide PNGs).

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Framer Motion

**Source of truth:** Dev Brief at `features/plan/Implementation-plan/Dev_Brief_BaZi_Dashboard_v2.md` (docx)

---

## Task 1: Show full animal description (untruncate)

**Files:**
- Modify: `src/components/Dashboard.tsx:625-629`

**Context:** Currently the Year Animal card shows only the first sentence:
```tsx
{yearBranch.description[lang].split(".")[0]}.
```
The `earthlyBranches.ts` data already has 4-sentence descriptions in both EN and DE. We just need to remove the truncation.

**Step 1: Find the truncation line**

In `Dashboard.tsx`, search for `.split(".")[0]` inside the Year Animal card (around line 627).

**Step 2: Replace with full description**

Change:
```tsx
{yearBranch.description[lang].split(".")[0]}.
```
To:
```tsx
{yearBranch.description[lang]}
```

**Step 3: Verify visually**

Run: `npm run dev`
Navigate to Dashboard. The Year Animal card should now show 4 sentences instead of 1.

**Step 4: Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "feat(dashboard): show full year-animal description instead of truncated first sentence"
```

---

## Task 2: Show full WuXing element description (untruncate)

**Files:**
- Modify: `src/components/Dashboard.tsx:674-676`

**Context:** The Dominant WuXing Element card truncates identically:
```tsx
{dominantWuxing.description[lang].split(".")[0]}.
```

**Step 1: Find the truncation line**

Search for the second `.split(".")[0]` near the Dominant WuXing Element section (around line 675).

**Step 2: Replace with full description**

Change:
```tsx
{dominantWuxing.description[lang].split(".")[0]}.
```
To:
```tsx
{dominantWuxing.description[lang]}
```

**Step 3: Verify visually**

Run: `npm run dev`
The WuXing element card should now show the full 4-sentence description.

**Step 4: Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "feat(dashboard): show full WuXing element description"
```

---

## Task 3: Align Year Animal card anatomy to Western pattern

**Files:**
- Modify: `src/components/Dashboard.tsx:612-643`

**Context:** The left Western cards follow this anatomy:
```
[Icon + Badge]          ← header row
[Sign Name (large)]     ← h3 serif
[Sub-label (tiny)]      ← 9px uppercase tracking
[Description (3-5 sentences)] ← xs text
[Footer: emoji · element · ruler + Badge] ← border-t footer
```

The right Year Animal card is *close* but has subtle differences:
- Uses emoji span instead of animated icon component
- Sub-label text (`yearAnimalTitle`) is positioned the same — OK
- Footer: has Chinese character + branch/element but different layout

**Step 1: Add element-stem sub-label**

After the `yearAnimalTitle` paragraph, add a sub-label showing the element-animal combination (e.g., "METALL-AFFE (金猴)"):

Find the Year Animal card section (starts ~line 613 with `data-special="true"`). After:
```tsx
<p className="text-[9px] uppercase tracking-[0.25em] text-[#8B6914]/50 mb-4">
  {t("dashboard.bazi.yearAnimalTitle")}
</p>
```

Add the element-animal sub-label. The element comes from `apiData.bazi?.pillars?.year?.element` and the Chinese character from `yearBranch?.chinese`.

Replace the entire Year Animal card (from `{/* Year Animal` comment to its closing `</div>`) with:

```tsx
{/* Year Animal — FR-P05: data-special for gold border in Planetarium */}
<div className="morning-card p-5 sm:p-7 flex flex-col justify-between" data-special="true">
  <div>
    <div className="flex items-center justify-between mb-4">
      <span className="text-2xl leading-none select-none">{yearBranch?.emoji || "✨"}</span>
      <Badge text={t("dashboard.bazi.zodiacLabel")} />
    </div>
    <h3 className="font-serif text-xl sm:text-2xl text-[#1E2A3A] leading-tight mb-0.5">
      {yearAnimalName || "—"}
    </h3>
    <p className="text-[9px] uppercase tracking-[0.25em] text-[#8B6914]/50 mb-4">
      {t("dashboard.bazi.yearAnimalTitle")}
    </p>
    {yearBranch && (
      <p className="text-xs text-[#1E2A3A]/55 leading-relaxed">
        {yearBranch.description[lang]}
      </p>
    )}
  </div>
  <div className="flex justify-between items-center border-t border-[#8B6914]/10 pt-4 mt-5">
    <div className="flex items-center gap-2">
      {yearBranch && (
        <span className="font-serif text-xl text-[#8B6914]">{yearBranch.chinese}</span>
      )}
      {yearBranch && (
        <span className="text-[10px] text-[#1E2A3A]/35">
          {yearBranch.element} · {yearBranch.pinyin}
        </span>
      )}
    </div>
    <Badge text={t("dashboard.bazi.yearAnimalBadge")} />
  </div>
</div>
```

Key changes vs. current:
- Footer uses `items-center` (not `items-end`) to match Western cards
- Pinyin added to footer for parity with Western "element · ruler" pattern
- Full description (not truncated)

**Step 2: Verify visually**

Run: `npm run dev`
Compare Year Animal card with Sun Sign card side by side. They should have matching vertical rhythm: icon/badge → name → sub-label → description → footer.

**Step 3: Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "feat(dashboard): align year-animal card anatomy to match western card pattern"
```

---

## Task 4: Align Dominant WuXing card anatomy to Western pattern

**Files:**
- Modify: `src/components/Dashboard.tsx:646-685`

**Context:** The WuXing card currently has a different layout:
- Uses `gap-4` flex instead of justify-between
- Has a left border-color accent (nice — keep it)
- Inline element display (chinese char + name + pinyin horizontally)
- Grid footer with direction + season

We want to match the Moon Sign card structure while keeping the accent border.

**Step 1: Restructure the Dominant WuXing card**

Replace the entire Dominant WuXing Element card with:

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
      <span className="text-2xl leading-none select-none">{dominantWuxing?.emoji || "✨"}</span>
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

Key changes:
- Now follows Badge → Name → Sub-label → Description → Footer pattern
- Emoji moved to icon position (top-left)
- Chinese character in footer (like Year Animal card)
- Direction + season remain but move to footer text
- Removed the grid-cols-2 metadata section

**Step 2: Verify visually**

Run: `npm run dev`
Compare all four cards side by side. All should now follow the identical vertical structure.

**Step 3: Type check**

Run: `npm run lint`
Expected: No errors

**Step 4: Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "feat(dashboard): align WuXing element card anatomy to match western pattern"
```

---

## Task 5: Remove Day Master and Month Stem sub-cards

**Files:**
- Modify: `src/components/Dashboard.tsx:687-712`

**Context:** The right column currently has 4 cards: Year Animal, Dominant WuXing, Day Master, and Month Stem. The left column only has 3 cards (Sun, Moon, Ascendant). The dev brief specifies a 2×2 grid for the primary cards. The Day Master and Month Stem are secondary info that already appears in the BaZi Four Pillars section below (behind PremiumGate).

Removing these two sub-cards makes the right column match the left column's 2-card primary layout, matching the dev brief's 2×2 spec.

**Step 1: Check if Day Master / Month Stem appear elsewhere**

Search Dashboard.tsx for `dayMasterTitle` and `monthStemTitle` to confirm they appear in the Pillars section too. The Pillars section (line ~718-750) renders all four pillars with tooltips — so Day Master info is already shown there.

**Step 2: Remove the Day Master and Month Stem cards**

Delete the two `morning-card` blocks between the Dominant WuXing card and the closing `</div>` of the right column. These are the blocks at approximately lines 687-712 containing `dayMasterTitle` and `monthStemTitle`.

**Step 3: Verify visually**

Run: `npm run dev`
The right column should now have exactly 2 cards (Year Animal + Dominant WuXing), matching the left column's 2 primary cards (Sun Sign + Moon Sign). Note: The left column has 3 cards (includes Ascendant) — if keeping parity is preferred, skip this task and keep the Day Master card as a 3rd card.

> **Decision point for Ben:** If 3 cards per column is preferred (Sun/Moon/Asc vs Animal/WuXing/DayMaster), keep Day Master and only remove Month Stem. The plan assumes 2×2 per the dev brief, but this is an architecture decision.

**Step 4: Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "feat(dashboard): remove duplicate Day Master and Month Stem sub-cards from primary grid"
```

---

## Task 6: Add element-specific year-animal sub-label

**Files:**
- Modify: `src/components/Dashboard.tsx` (Year Animal card, inside the `<div>` block)

**Context:** The dev brief wants a sub-label like "METALL-AFFE (金猴)" showing the element-animal combination. This data comes from `apiData.bazi?.pillars?.year?.element` (the year pillar's element) combined with the animal name.

**Step 1: Extract the year element**

In the data extraction section (~line 296-304), add:

```tsx
const yearElement = apiData.bazi?.pillars?.year?.element || "";
```

**Step 2: Create the compound sub-label**

In the Year Animal card, replace the simple sub-label:
```tsx
<p className="text-[9px] uppercase tracking-[0.25em] text-[#8B6914]/50 mb-4">
  {t("dashboard.bazi.yearAnimalTitle")}
</p>
```

With a compound label that shows the element-animal combination when available:
```tsx
<p className="text-[9px] uppercase tracking-[0.25em] text-[#8B6914]/50 mb-4">
  {yearElement && yearBranch
    ? `${yearElement}-${yearAnimalName} (${yearBranch.chinese})`
    : t("dashboard.bazi.yearAnimalTitle")}
</p>
```

This produces output like "Metal-Affe (申)" or "Holz-Tiger (寅)" depending on the language.

**Step 3: Localise the element name**

The `yearElement` from BAFE may be English ("Metal") — use `getWuxingName` to localise it:

Add to imports at top of file (if not already imported):
```tsx
import { WUXING_ELEMENTS, getWuxingByKey, getWuxingName } from "../lib/astro-data/wuxing";
```

Then in the sub-label:
```tsx
{yearElement && yearBranch
  ? `${getWuxingName(yearElement, lang)}-${yearAnimalName} (${yearBranch.chinese})`
  : t("dashboard.bazi.yearAnimalTitle")}
```

**Step 4: Verify visually**

Run: `npm run dev`
The Year Animal card sub-label should now show e.g. "Metall-Affe (申)" in German or "Metal-Monkey (申)" in English.

**Step 5: Type check**

Run: `npm run lint`
Expected: No errors

**Step 6: Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "feat(dashboard): show element-animal compound name as year-animal sub-label"
```

---

## Task 7: Prepare coin asset infrastructure (placeholder)

**Files:**
- Create: `src/lib/astro-data/coinAssets.ts`

**Context:** The dev brief specifies 12 coin PNGs (3D medaillons) at 120×120px. The assets don't exist yet in the repo (Ben must provide them). This task creates the lookup map and a component-ready helper, so coin integration is trivial once assets arrive.

**Step 1: Create the coin asset mapping file**

```tsx
// ── Coin Asset Lookup ─────────────────────────────────────────────────────
//
// Maps English animal names (as returned by BAFE API) to their coin asset paths.
// Assets live in media/ (Vite publicDir). Drop PNGs there and update paths.
//
// Usage: <img src={getCoinAsset("monkey")} className="w-[120px] h-[120px] object-contain" />

const COIN_MAP: Record<string, string> = {
  rat:     "/coins/rat.png",
  ox:      "/coins/ox.png",
  tiger:   "/coins/tiger.png",
  rabbit:  "/coins/rabbit.png",
  dragon:  "/coins/dragon.png",
  snake:   "/coins/snake.png",
  horse:   "/coins/horse.png",
  goat:    "/coins/goat.png",
  monkey:  "/coins/monkey.png",
  rooster: "/coins/rooster.png",
  dog:     "/coins/dog.png",
  pig:     "/coins/pig.png",
};

/**
 * Get the coin asset path for a given animal.
 * Returns undefined if the animal is unknown or assets aren't available yet.
 */
export function getCoinAsset(animal: string): string | undefined {
  if (!animal) return undefined;
  return COIN_MAP[animal.toLowerCase()];
}
```

**Step 2: Create the media/coins directory**

```bash
mkdir -p /Users/benjaminpoersch/Projects/WEB/Astro-Noctum/Astro-Noctum/media/coins
```

Add a `.gitkeep` so the directory is tracked:
```bash
touch /Users/benjaminpoersch/Projects/WEB/Astro-Noctum/Astro-Noctum/media/coins/.gitkeep
```

**Step 3: Commit**

```bash
git add src/lib/astro-data/coinAssets.ts media/coins/.gitkeep
git commit -m "feat(dashboard): add coin asset lookup map (awaiting PNG assets from Ben)"
```

---

## Task 8 (BLOCKED — awaits Ben): Integrate coin images into Year Animal card

> **Blocked by:** Ben providing 12 coin PNG assets to `media/coins/`

When assets arrive:

**Step 1: Drop PNGs into `media/coins/`**

Name them: `rat.png`, `ox.png`, `tiger.png`, etc. Verify paths match `COIN_MAP` in `coinAssets.ts`.

**Step 2: Add coin image to Year Animal card**

In `Dashboard.tsx`, import:
```tsx
import { getCoinAsset } from "../lib/astro-data/coinAssets";
```

Add to data extraction:
```tsx
const yearCoinSrc = useMemo(() => getCoinAsset(zodiacAnimal), [zodiacAnimal]);
```

Insert the coin image between the sub-label and description in the Year Animal card:
```tsx
{yearCoinSrc && (
  <div className="flex justify-center my-4">
    <img
      src={yearCoinSrc}
      alt={yearAnimalName}
      className="w-[120px] h-[120px] object-contain"
      loading="lazy"
    />
  </div>
)}
```

**Step 3: Handle the Dog coin (white ring clip)**

Per dev brief, the Dog coin has a white ring. Apply CSS clip:
```tsx
<img
  src={yearCoinSrc}
  alt={yearAnimalName}
  className="w-[120px] h-[120px] object-contain rounded-full overflow-hidden"
  loading="lazy"
/>
```
The `rounded-full` clips any outer artifacts on all coins uniformly.

---

## Task 9 (BLOCKED — awaits Ben): Element-variant interpretation texts

> **Blocked by:** Ben providing 60 JSON texts (12 animals × 5 elements)

When JSON arrives:

**Step 1: Create data file**

Save as `src/lib/astro-data/animalElementTexts.ts` with structure:
```tsx
export interface AnimalElementText {
  title: string;
  chinese: string;
  interpretation: { en: string; de: string };
}

export const ANIMAL_ELEMENT_TEXTS: Record<string, AnimalElementText> = {
  "monkey_metal": { ... },
  "monkey_wood": { ... },
  // ...
};

export function getAnimalElementText(animal: string, element: string): AnimalElementText | undefined {
  const key = `${animal.toLowerCase()}_${element.toLowerCase()}`;
  return ANIMAL_ELEMENT_TEXTS[key];
}
```

**Step 2: Use in Year Animal card**

Replace the generic animal description with the element-specific one when available:
```tsx
const animalElementText = useMemo(
  () => getAnimalElementText(zodiacAnimal, yearElement),
  [zodiacAnimal, yearElement],
);

// In JSX:
<p className="text-xs text-[#1E2A3A]/55 leading-relaxed">
  {animalElementText
    ? animalElementText.interpretation[lang]
    : yearBranch?.description[lang]}
</p>
```

---

## Summary: What can be done NOW vs. BLOCKED

| Task | Status | Effort |
|------|--------|--------|
| 1. Untruncate animal description | ✅ Ready | 5 min |
| 2. Untruncate WuXing description | ✅ Ready | 5 min |
| 3. Align Year Animal card anatomy | ✅ Ready | 15 min |
| 4. Align WuXing card anatomy | ✅ Ready | 15 min |
| 5. Remove Day Master/Month Stem sub-cards | ⚠️ Decision needed | 10 min |
| 6. Element-animal sub-label | ✅ Ready | 10 min |
| 7. Coin asset infrastructure | ✅ Ready | 5 min |
| 8. Coin image integration | 🔒 Blocked (assets) | 15 min |
| 9. Element-variant texts | 🔒 Blocked (JSON from Ben) | 30 min |

**Total immediately actionable: ~65 min (Tasks 1-4, 6-7)**

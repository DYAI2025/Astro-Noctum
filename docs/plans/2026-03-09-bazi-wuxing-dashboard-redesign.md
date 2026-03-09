# BaZi & WuXing Dashboard Redesign — Full Content Depth

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the BaZi/WuXing section from surface-level labels into a deep, resonant experience with Four Pillars visualization, Pentagon element-balance chart, WuXing cycle animation, personality interpretation, and a Mini-Ring connector showing the BaZi contribution to the Fusion Ring.

**Architecture:** Frontend-only changes. The BAFE API already returns all four pillars, element balance, and sector signals. We extract BaZi/WuXing from the current 2-column grid into a dedicated full-width section below it, structured as 4 vertical blocks (Header, Four Pillars, Element Balance, Interpretation + Ring Connector). New components: `BaZiFourPillars`, `WuXingPentagon`, `WuXingCycleWheel`, `BaZiInterpretation`, `BaZiMiniRing`. Data files: `bazi-interpretations.ts` (60 Tier×Element combos), `wuxing-cycles.ts` (generation + control cycles). No charting library needed — Pentagon and Cycle are SVG/Canvas drawn inline.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, motion/react (framer-motion), Canvas 2D (for Mini-Ring)

**Base path:** `/Users/benjaminpoersch/Projects/WEB/Astro-Noctum/Astro-Noctum`

---

## Task 1: Create WuXing cycle data (generation + control)

**Files:**
- Create: `src/lib/astro-data/wuxing-cycles.ts`

**Step 1: Create the cycle data file**

This is static data that never changes. Hardcoded is correct per dev brief.

```typescript
// ── WuXing Cycle Data ─────────────────────────────────────────────────────
// Generation cycle: 相生 (xiāngshēng) — each element produces the next
// Control cycle: 相克 (xiāngkè) — each element controls another

export interface WuxingCycleEdge {
  from: string;
  to: string;
  label: { en: string; de: string };
}

/** 相生 Generation cycle: Wood → Fire → Earth → Metal → Water → Wood */
export const GENERATION_CYCLE: WuxingCycleEdge[] = [
  { from: "Wood",  to: "Fire",  label: { en: "Wood feeds Fire",    de: "Holz nährt Feuer"      } },
  { from: "Fire",  to: "Earth", label: { en: "Fire creates Earth", de: "Feuer erzeugt Erde"    } },
  { from: "Earth", to: "Metal", label: { en: "Earth bears Metal",  de: "Erde gebiert Metall"   } },
  { from: "Metal", to: "Water", label: { en: "Metal collects Water", de: "Metall sammelt Wasser" } },
  { from: "Water", to: "Wood",  label: { en: "Water nourishes Wood", de: "Wasser nährt Holz"   } },
];

/** 相克 Control cycle: Wood → Earth → Water → Fire → Metal → Wood */
export const CONTROL_CYCLE: WuxingCycleEdge[] = [
  { from: "Wood",  to: "Earth", label: { en: "Wood parts Earth",    de: "Holz teilt Erde"       } },
  { from: "Earth", to: "Water", label: { en: "Earth absorbs Water", de: "Erde absorbiert Wasser" } },
  { from: "Water", to: "Fire",  label: { en: "Water quenches Fire", de: "Wasser löscht Feuer"   } },
  { from: "Fire",  to: "Metal", label: { en: "Fire melts Metal",    de: "Feuer schmilzt Metall" } },
  { from: "Metal", to: "Wood",  label: { en: "Metal chops Wood",    de: "Metall fällt Holz"    } },
];

/** Tension detection: strong element + weak controller = imbalance */
export interface WuxingTension {
  dominant: string;
  controller: string;
  description: { en: string; de: string };
}

export function detectTensions(
  balance: Record<string, number>,
  threshold = 0.6,
  weakThreshold = 0.15,
): WuxingTension[] {
  const tensions: WuxingTension[] = [];
  for (const edge of CONTROL_CYCLE) {
    const domVal = balance[edge.to] ?? 0;
    const ctrlVal = balance[edge.from] ?? 0;
    if (domVal > threshold && ctrlVal < weakThreshold) {
      tensions.push({
        dominant: edge.to,
        controller: edge.from,
        description: {
          en: `Strong ${edge.to} with weak ${edge.from} — ${edge.to} energy operates without natural checks.`,
          de: `Starkes ${edge.to} bei schwachem ${edge.from} — ${edge.to}-Energie wirkt ohne natürliche Begrenzung.`,
        },
      });
    }
  }
  return tensions;
}
```

**Step 2: Commit**

```bash
git add src/lib/astro-data/wuxing-cycles.ts
git commit -m "feat(bazi): add WuXing generation and control cycle data with tension detection"
```

---

## Task 2: Create BaZi interpretation data (12 animals × 5 elements = 60 combos)

**Files:**
- Create: `src/lib/astro-data/bazi-interpretations.ts`

**Context:** The dev brief says "Ben liefert die Inhalte". Since the 60 texts aren't written yet, we create the data structure with placeholder texts that can be replaced. Each combo has: title, short (1 sentence), long (3-5 sentences), strengths[], shadows[].

**Step 1: Create the interpretation data file**

```typescript
// ── BaZi Personality Interpretations ──────────────────────────────────────
// 60 combinations: 12 animals × 5 elements
// Each entry keyed by "Animal-Element" (e.g. "Rat-Water")

type Lang = "en" | "de";
type I18n = Record<Lang, string>;

export interface BaZiInterpretation {
  animal: string;
  element: string;
  title: I18n;
  short: I18n;
  long: I18n;
  strengths: I18n[];
  shadows: I18n[];
}

const ANIMALS = ["Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake", "Horse", "Goat", "Monkey", "Rooster", "Dog", "Pig"] as const;
const ELEMENTS = ["Wood", "Fire", "Earth", "Metal", "Water"] as const;

const ANIMAL_DE: Record<string, string> = {
  Rat: "Ratte", Ox: "Büffel", Tiger: "Tiger", Rabbit: "Hase",
  Dragon: "Drache", Snake: "Schlange", Horse: "Pferd", Goat: "Ziege",
  Monkey: "Affe", Rooster: "Hahn", Dog: "Hund", Pig: "Schwein",
};

const ELEMENT_DE: Record<string, string> = {
  Wood: "Holz", Fire: "Feuer", Earth: "Erde", Metal: "Metall", Water: "Wasser",
};

// Generate base interpretations — these will be replaced with Ben's authored texts
function generateBaseInterpretation(animal: string, element: string): BaZiInterpretation {
  const animalDe = ANIMAL_DE[animal] ?? animal;
  const elementDe = ELEMENT_DE[element] ?? element;

  return {
    animal,
    element,
    title: {
      en: `The ${element} ${animal}`,
      de: `Der ${elementDe}-${animalDe}`,
    },
    short: {
      en: `The ${element} ${animal} combines ${element.toLowerCase()} energy with the innate qualities of the ${animal}.`,
      de: `Der ${elementDe}-${animalDe} vereint ${elementDe}-Energie mit den angeborenen Qualitäten des ${animalDe}.`,
    },
    long: {
      en: `As a ${element} ${animal}, your character is shaped by the interplay of ${element.toLowerCase()} qualities and the ${animal}'s natural instincts. This combination creates a unique personality signature that influences how you approach challenges, relationships, and personal growth. The ${element.toLowerCase()} aspect adds a distinctive layer to the ${animal}'s core traits, refining and redirecting its energy in ways that make your path truly individual.`,
      de: `Als ${elementDe}-${animalDe} wird dein Charakter durch das Zusammenspiel von ${elementDe}-Qualitäten und den natürlichen Instinkten des ${animalDe} geprägt. Diese Kombination erzeugt eine einzigartige Persönlichkeitssignatur, die beeinflusst, wie du Herausforderungen, Beziehungen und persönliches Wachstum angehst. Der ${elementDe}-Aspekt fügt den Kernmerkmalen des ${animalDe} eine markante Schicht hinzu und lenkt seine Energie auf Weise um, die deinen Weg wirklich individuell macht.`,
    },
    strengths: [
      { en: `${element}-enhanced perception`, de: `${elementDe}-verstärkte Wahrnehmung` },
      { en: `${animal}-rooted resilience`, de: `${animalDe}-verwurzelte Resilienz` },
    ],
    shadows: [
      { en: `${element} excess can amplify the ${animal}'s tendencies`, de: `${elementDe}-Überschuss kann die Tendenzen des ${animalDe} verstärken` },
    ],
  };
}

// Build the lookup map
const INTERPRETATIONS_MAP = new Map<string, BaZiInterpretation>();
for (const animal of ANIMALS) {
  for (const element of ELEMENTS) {
    const key = `${animal}-${element}`;
    INTERPRETATIONS_MAP.set(key, generateBaseInterpretation(animal, element));
  }
}

/**
 * Get the interpretation for an animal-element combination.
 * Falls back to base animal if exact combo not found.
 */
export function getBaZiInterpretation(animal: string, element: string): BaZiInterpretation | undefined {
  // Normalize
  const a = animal.charAt(0).toUpperCase() + animal.slice(1).toLowerCase();
  const e = element.charAt(0).toUpperCase() + element.slice(1).toLowerCase();
  return INTERPRETATIONS_MAP.get(`${a}-${e}`);
}

export { INTERPRETATIONS_MAP };
```

**Step 2: Commit**

```bash
git add src/lib/astro-data/bazi-interpretations.ts
git commit -m "feat(bazi): add 60 animal×element interpretation data structure with placeholder texts"
```

---

## Task 3: Create BaZiFourPillars component

**Files:**
- Create: `src/components/BaZiFourPillars.tsx`

**Context:** Shows all 4 BaZi pillars (Year, Month, Day, Hour) as columns. Day Master (day pillar) is visually dominant with glow. Each column shows: Chinese character (top), coin image, stem, branch, animal name, element. Falls back when hour pillar unavailable (no birth time). Uses existing `getCoinAsset()`, `getBranchByAnimal()`, `getWuxingByKey()`.

**Step 1: Create the component**

```tsx
import { useMemo } from "react";
import { motion } from "motion/react";
import { getCoinAsset } from "../lib/astro-data/coinAssets";
import { getBranchByAnimal } from "../lib/astro-data/earthlyBranches";
import { getWuxingByKey, getWuxingName } from "../lib/astro-data/wuxing";
import { Tooltip } from "./Tooltip";
import type { MappedPillar } from "@/src/types/bafe";

interface PillarData {
  key: "year" | "month" | "day" | "hour";
  pillar: MappedPillar | null;
}

interface BaZiFourPillarsProps {
  pillars: {
    year: MappedPillar;
    month: MappedPillar;
    day: MappedPillar;
    hour: MappedPillar;
  } | undefined;
  lang: "en" | "de";
  planetariumMode?: boolean;
}

const PILLAR_META: Record<string, { label: { en: string; de: string }; chinese: string; desc: { en: string; de: string } }> = {
  year:  {
    label: { en: "Year Pillar", de: "Jahres-Säule" },
    chinese: "年柱",
    desc: {
      en: "The Year Pillar reveals your outer persona — how society perceives you and the role you naturally assume in groups.",
      de: "Die Jahres-Säule zeigt deine äußere Persona — wie die Gesellschaft dich wahrnimmt und welche Rolle du natürlich in Gruppen einnimmst.",
    },
  },
  month: {
    label: { en: "Month Pillar", de: "Monats-Säule" },
    chinese: "月柱",
    desc: {
      en: "The Month Pillar governs career, ambition, and the middle phase of life — your drive toward achievement.",
      de: "Die Monats-Säule regiert Karriere, Ambition und die mittlere Lebensphase — deinen Antrieb zur Leistung.",
    },
  },
  day:   {
    label: { en: "Day Pillar", de: "Tages-Säule" },
    chinese: "日柱",
    desc: {
      en: "The Day Pillar is your Day Master (日主) — the truest expression of your inner self and core personality.",
      de: "Die Tages-Säule ist dein Day Master (日主) — der wahrste Ausdruck deines inneren Selbst und deiner Kernpersönlichkeit.",
    },
  },
  hour:  {
    label: { en: "Hour Pillar", de: "Stunden-Säule" },
    chinese: "時柱",
    desc: {
      en: "The Hour Pillar reveals your hidden self — unconscious patterns, private aspirations, and the legacy you leave.",
      de: "Die Stunden-Säule enthüllt dein verborgenes Selbst — unbewusste Muster, private Bestrebungen und das Vermächtnis, das du hinterlässt.",
    },
  },
};

export function BaZiFourPillars({ pillars, lang, planetariumMode }: BaZiFourPillarsProps) {
  const pillarEntries: PillarData[] = useMemo(() => {
    if (!pillars) return [];
    return (["year", "month", "day", "hour"] as const).map((key) => ({
      key,
      pillar: pillars[key] ?? null,
    }));
  }, [pillars]);

  if (pillarEntries.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      {pillarEntries.map(({ key, pillar }, i) => {
        const meta = PILLAR_META[key];
        const isDayMaster = key === "day";
        const branch = pillar?.animal ? getBranchByAnimal(pillar.animal) : null;
        const elData = pillar?.element ? getWuxingByKey(pillar.element) : null;
        const coinSrc = pillar?.animal ? getCoinAsset(pillar.animal) : undefined;
        const isUnavailable = !pillar || (!pillar.stem && !pillar.animal);

        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            <Tooltip content={meta.desc[lang]} wide dark={planetariumMode}>
              <div
                className={`morning-stele group cursor-help w-full relative ${
                  isDayMaster
                    ? "ring-1 ring-[#D4AF37]/30 shadow-[0_0_20px_rgba(212,175,55,0.08)]"
                    : ""
                }`}
              >
                {/* Day Master badge */}
                {isDayMaster && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#D4AF37]/15 border border-[#D4AF37]/25 rounded-full px-2.5 py-0.5 text-[7px] uppercase tracking-[0.3em] text-[#D4AF37] whitespace-nowrap">
                    Day Master
                  </div>
                )}

                {/* Chinese pillar label */}
                <div className="text-[8px] uppercase tracking-[0.3em] text-[#8B6914]/55 mb-3 group-hover:text-[#8B6914] transition-colors">
                  {meta.label[lang]}
                </div>
                <div className="text-xs text-[#8B6914]/40 mb-4">{meta.chinese}</div>

                {isUnavailable ? (
                  <div className="text-center py-6">
                    <p className="text-xs text-[#1E2A3A]/30 italic">
                      {lang === "de"
                        ? "Geburtszeit nicht angegeben"
                        : "Birth time not provided"}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Coin */}
                    {coinSrc && (
                      <div className="flex justify-center mb-3">
                        <img
                          src={coinSrc}
                          alt={pillar.animal}
                          className={`w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] object-contain rounded-full ${
                            isDayMaster ? "ring-2 ring-[#D4AF37]/20" : ""
                          }`}
                          loading="lazy"
                        />
                      </div>
                    )}

                    {/* Stem */}
                    <div className="font-serif text-2xl mb-1 text-[#1E2A3A]">
                      {pillar.stem || "—"}
                    </div>

                    {/* Branch */}
                    <div className="text-[10px] text-[#1E2A3A]/35 uppercase tracking-widest">
                      {pillar.branch || ""}
                    </div>

                    {/* Animal */}
                    {pillar.animal && (
                      <div className="text-[9px] text-[#8B6914]/50 mt-1.5 tracking-wide">
                        {branch ? branch.animal[lang] : pillar.animal}
                      </div>
                    )}

                    {/* Element */}
                    {elData && (
                      <div className="mt-2 flex items-center justify-center gap-1">
                        <span className="font-serif text-sm" style={{ color: elData.color }}>
                          {elData.chinese}
                        </span>
                        <span className="text-[9px] text-[#1E2A3A]/35">
                          {elData.name[lang]}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </Tooltip>
          </motion.div>
        );
      })}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/BaZiFourPillars.tsx
git commit -m "feat(bazi): create BaZiFourPillars component with Day Master highlight and hour fallback"
```

---

## Task 4: Create WuXingPentagon component (SVG radar chart)

**Files:**
- Create: `src/components/WuXingPentagon.tsx`

**Context:** Pentagon/radar chart showing the balance of all 5 elements. SVG-based (no charting library). Elements at pentagon vertices. Fill area shows the user's balance. Extreme values (>0.7 or <0.1) get visual markers. Uses colors from `wuxing.ts`.

**Step 1: Create the component**

```tsx
import { useMemo } from "react";
import { motion } from "motion/react";
import { WUXING_ELEMENTS } from "../lib/astro-data/wuxing";
import { Tooltip } from "./Tooltip";

interface WuXingPentagonProps {
  balance: Record<string, number>;
  lang: "en" | "de";
  size?: number;
  planetariumMode?: boolean;
}

// Pentagon vertices at 5 positions (top-center start, clockwise)
function pentagonPoint(index: number, radius: number, cx: number, cy: number): [number, number] {
  // Start from top (-90°), go clockwise
  const angle = ((index * 72) - 90) * (Math.PI / 180);
  return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
}

// Element order for pentagon (matches traditional WuXing cycle)
const ELEMENT_ORDER = ["Wood", "Fire", "Earth", "Metal", "Water"];

export function WuXingPentagon({ balance, lang, size = 280, planetariumMode }: WuXingPentagonProps) {
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = size * 0.38;
  const labelRadius = size * 0.46;

  // Normalize balance to 0-1 range
  const normalized = useMemo(() => {
    const values = ELEMENT_ORDER.map((key) => balance[key] ?? 0);
    const max = Math.max(...values, 0.01);
    return values.map((v) => v / max);
  }, [balance]);

  // Pentagon grid lines (20%, 40%, 60%, 80%, 100%)
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

  // Data polygon points
  const dataPoints = useMemo(() => {
    return ELEMENT_ORDER.map((_, i) => {
      const r = maxRadius * Math.max(normalized[i], 0.05);
      return pentagonPoint(i, r, cx, cy);
    });
  }, [normalized, maxRadius, cx, cy]);

  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ") + "Z";

  return (
    <div className="flex justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="select-none">
        {/* Grid pentagons */}
        {gridLevels.map((level) => {
          const points = ELEMENT_ORDER.map((_, i) =>
            pentagonPoint(i, maxRadius * level, cx, cy),
          );
          const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ") + "Z";
          return (
            <path
              key={level}
              d={path}
              fill="none"
              stroke={planetariumMode ? "rgba(212,175,55,0.08)" : "rgba(30,42,58,0.06)"}
              strokeWidth={level === 1.0 ? 1.5 : 0.5}
            />
          );
        })}

        {/* Axis lines */}
        {ELEMENT_ORDER.map((_, i) => {
          const [px, py] = pentagonPoint(i, maxRadius, cx, cy);
          return (
            <line
              key={`axis-${i}`}
              x1={cx} y1={cy} x2={px} y2={py}
              stroke={planetariumMode ? "rgba(212,175,55,0.06)" : "rgba(30,42,58,0.04)"}
              strokeWidth={0.5}
            />
          );
        })}

        {/* Data fill */}
        <motion.path
          d={dataPath}
          fill="rgba(212,175,55,0.12)"
          stroke="rgba(212,175,55,0.5)"
          strokeWidth={1.5}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        />

        {/* Data points */}
        {dataPoints.map(([px, py], i) => {
          const el = WUXING_ELEMENTS.find((e) => e.key === ELEMENT_ORDER[i]);
          const rawValue = balance[ELEMENT_ORDER[i]] ?? 0;
          const isExtreme = rawValue > 0.7 || rawValue < 0.1;
          return (
            <g key={`point-${i}`}>
              <circle
                cx={px} cy={py} r={isExtreme ? 5 : 3.5}
                fill={el?.color ?? "#D4AF37"}
                stroke={isExtreme ? "#fff" : "none"}
                strokeWidth={isExtreme ? 1.5 : 0}
              />
              {isExtreme && (
                <circle
                  cx={px} cy={py} r={8}
                  fill="none"
                  stroke={el?.color ?? "#D4AF37"}
                  strokeWidth={1}
                  opacity={0.4}
                />
              )}
            </g>
          );
        })}

        {/* Labels */}
        {ELEMENT_ORDER.map((key, i) => {
          const el = WUXING_ELEMENTS.find((e) => e.key === key);
          const [lx, ly] = pentagonPoint(i, labelRadius, cx, cy);
          const rawValue = balance[key] ?? 0;
          const pct = Math.round(rawValue * 100);
          return (
            <g key={`label-${i}`}>
              <text
                x={lx} y={ly - 8}
                textAnchor="middle"
                className="text-[14px] font-serif"
                fill={el?.color ?? "#8B6914"}
              >
                {el?.chinese}
              </text>
              <text
                x={lx} y={ly + 6}
                textAnchor="middle"
                className="text-[9px]"
                fill={planetariumMode ? "rgba(255,255,255,0.5)" : "rgba(30,42,58,0.45)"}
              >
                {el?.name[lang]}
              </text>
              <text
                x={lx} y={ly + 18}
                textAnchor="middle"
                className="text-[8px] font-mono"
                fill={planetariumMode ? "rgba(255,255,255,0.3)" : "rgba(30,42,58,0.3)"}
              >
                {pct}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/WuXingPentagon.tsx
git commit -m "feat(wuxing): create SVG pentagon radar chart for element balance visualization"
```

---

## Task 5: Create WuXingCycleWheel component (animated cycle)

**Files:**
- Create: `src/components/WuXingCycleWheel.tsx`

**Context:** Circular diagram showing the generation cycle (outer ring, clockwise arrows) and control cycle (inner star pattern, dashed). Elements positioned around a circle. Arrows animate on mount. Uses data from `wuxing-cycles.ts`.

**Step 1: Create the component**

```tsx
import { useMemo } from "react";
import { motion } from "motion/react";
import { WUXING_ELEMENTS } from "../lib/astro-data/wuxing";
import { GENERATION_CYCLE, CONTROL_CYCLE } from "../lib/astro-data/wuxing-cycles";

interface WuXingCycleWheelProps {
  balance?: Record<string, number>;
  lang: "en" | "de";
  size?: number;
  planetariumMode?: boolean;
}

const ELEMENT_ORDER = ["Wood", "Fire", "Earth", "Metal", "Water"];

function circlePoint(index: number, radius: number, cx: number, cy: number): [number, number] {
  const angle = ((index * 72) - 90) * (Math.PI / 180);
  return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
}

export function WuXingCycleWheel({ balance, lang, size = 240, planetariumMode }: WuXingCycleWheelProps) {
  const cx = size / 2;
  const cy = size / 2;
  const elemRadius = size * 0.36;

  const positions = useMemo(() => {
    return Object.fromEntries(
      ELEMENT_ORDER.map((key, i) => [key, circlePoint(i, elemRadius, cx, cy)])
    );
  }, [elemRadius, cx, cy]);

  const arrowColor = planetariumMode ? "rgba(212,175,55,0.35)" : "rgba(139,105,20,0.3)";
  const controlColor = planetariumMode ? "rgba(212,175,55,0.15)" : "rgba(139,105,20,0.12)";

  return (
    <div className="flex justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="select-none">
        <defs>
          <marker
            id="arrowGen"
            markerWidth="8" markerHeight="6"
            refX="7" refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill={arrowColor} />
          </marker>
          <marker
            id="arrowCtrl"
            markerWidth="6" markerHeight="4"
            refX="5" refY="2"
            orient="auto"
          >
            <polygon points="0 0, 6 2, 0 4" fill={controlColor} />
          </marker>
        </defs>

        {/* Generation cycle arrows (outer) */}
        {GENERATION_CYCLE.map((edge, i) => {
          const [x1, y1] = positions[edge.from];
          const [x2, y2] = positions[edge.to];
          // Shorten line so it doesn't overlap node circles
          const dx = x2 - x1;
          const dy = y2 - y1;
          const len = Math.sqrt(dx * dx + dy * dy);
          const offset = 18;
          const sx = x1 + (dx / len) * offset;
          const sy = y1 + (dy / len) * offset;
          const ex = x2 - (dx / len) * offset;
          const ey = y2 - (dy / len) * offset;

          return (
            <motion.line
              key={`gen-${i}`}
              x1={sx} y1={sy} x2={ex} y2={ey}
              stroke={arrowColor}
              strokeWidth={1.5}
              markerEnd="url(#arrowGen)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 + i * 0.15 }}
            />
          );
        })}

        {/* Control cycle lines (inner star, dashed) */}
        {CONTROL_CYCLE.map((edge, i) => {
          const [x1, y1] = positions[edge.from];
          const [x2, y2] = positions[edge.to];
          const dx = x2 - x1;
          const dy = y2 - y1;
          const len = Math.sqrt(dx * dx + dy * dy);
          const offset = 18;
          const sx = x1 + (dx / len) * offset;
          const sy = y1 + (dy / len) * offset;
          const ex = x2 - (dx / len) * offset;
          const ey = y2 - (dy / len) * offset;

          return (
            <motion.line
              key={`ctrl-${i}`}
              x1={sx} y1={sy} x2={ex} y2={ey}
              stroke={controlColor}
              strokeWidth={1}
              strokeDasharray="4 3"
              markerEnd="url(#arrowCtrl)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 1.2 + i * 0.1 }}
            />
          );
        })}

        {/* Element nodes */}
        {ELEMENT_ORDER.map((key, i) => {
          const el = WUXING_ELEMENTS.find((e) => e.key === key);
          const [px, py] = positions[key];
          const val = balance?.[key] ?? 0.5;

          return (
            <g key={key}>
              <circle
                cx={px} cy={py}
                r={12 + val * 6}
                fill={`${el?.color}18`}
                stroke={el?.color}
                strokeWidth={1.5}
              />
              <text
                x={px} y={py + 1}
                textAnchor="middle"
                dominantBaseline="central"
                className="text-[14px] font-serif"
                fill={el?.color}
              >
                {el?.chinese}
              </text>
              <text
                x={px} y={py + 22}
                textAnchor="middle"
                className="text-[8px]"
                fill={planetariumMode ? "rgba(255,255,255,0.45)" : "rgba(30,42,58,0.4)"}
              >
                {el?.name[lang]}
              </text>
            </g>
          );
        })}

        {/* Center label */}
        <text
          x={cx} y={cy - 6}
          textAnchor="middle"
          className="text-[8px] uppercase tracking-widest"
          fill={planetariumMode ? "rgba(212,175,55,0.3)" : "rgba(139,105,20,0.25)"}
        >
          {lang === "de" ? "Erzeugung" : "Generation"}
        </text>
        <text
          x={cx} y={cy + 6}
          textAnchor="middle"
          className="text-[7px] uppercase tracking-widest"
          fill={controlColor}
        >
          {lang === "de" ? "Kontrolle" : "Control"}
        </text>
      </svg>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/WuXingCycleWheel.tsx
git commit -m "feat(wuxing): create animated cycle wheel showing generation and control relationships"
```

---

## Task 6: Create BaZiMiniRing component (B(s) contribution preview)

**Files:**
- Create: `src/components/BaZiMiniRing.tsx`

**Context:** A simplified version of the FusionRing that shows ONLY the BaZi contribution B(s) to the 12 sectors. This lets the user see what BaZi alone contributes to their ring. Uses the same `drawRing` approach but at smaller scale (200px) with only 1 signal layer. Links to the full FusionRing section.

**Step 1: Create the component**

```tsx
import { useRef, useEffect, useMemo } from "react";
import { SECTOR_COUNT, SECTORS } from "../lib/fusion-ring/constants";
import { SECTOR_COLORS, lerpSectorColor } from "../lib/fusion-ring/colors";

interface BaZiMiniRingProps {
  baziSignals: number[];  // B(s) array of 12 values
  lang: "en" | "de";
  size?: number;
  onNavigateToRing?: () => void;
}

export function BaZiMiniRing({ baziSignals, lang, size = 200, onNavigateToRing }: BaZiMiniRingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const normalizedSignals = useMemo(() => {
    if (!baziSignals || baziSignals.length !== SECTOR_COUNT) {
      return new Array(SECTOR_COUNT).fill(0.3);
    }
    const max = Math.max(...baziSignals, 0.01);
    return baziSignals.map((v) => Math.max(v / max, 0.08));
  }, [baziSignals]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const outerR = size * 0.42;
    const innerR = size * 0.22;
    const angleStep = (Math.PI * 2) / SECTOR_COUNT;

    // Draw sectors
    for (let s = 0; s < SECTOR_COUNT; s++) {
      const startAngle = s * angleStep - Math.PI / 2;
      const endAngle = startAngle + angleStep;
      const signal = normalizedSignals[s];
      const r = innerR + (outerR - innerR) * signal;
      const color = SECTOR_COLORS[s];

      // Filled wedge
      ctx.beginPath();
      ctx.moveTo(cx + innerR * Math.cos(startAngle), cy + innerR * Math.sin(startAngle));
      ctx.arc(cx, cy, r, startAngle, endAngle);
      ctx.lineTo(cx + innerR * Math.cos(endAngle), cy + innerR * Math.sin(endAngle));
      ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
      ctx.closePath();

      ctx.fillStyle = color + "40";  // 25% opacity
      ctx.fill();

      // Outer edge glow
      ctx.beginPath();
      ctx.arc(cx, cy, r, startAngle, endAngle);
      ctx.strokeStyle = color + "80";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Center label
    ctx.fillStyle = "rgba(139,105,20,0.4)";
    ctx.font = "8px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("B(s)", cx, cy - 4);
    ctx.font = "7px sans-serif";
    ctx.fillStyle = "rgba(139,105,20,0.25)";
    ctx.fillText("BaZi", cx, cy + 6);
  }, [normalizedSignals, size]);

  // Find peak sectors for description
  const peakSectors = useMemo(() => {
    const indexed = normalizedSignals.map((val, idx) => ({ val, idx }));
    indexed.sort((a, b) => b.val - a.val);
    return indexed.slice(0, 3).map((e) => SECTORS[e.idx]);
  }, [normalizedSignals]);

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas
        ref={canvasRef}
        className="cursor-pointer hover:opacity-90 transition-opacity"
        onClick={onNavigateToRing}
        role="img"
        aria-label={lang === "de"
          ? "Mini-Ring Vorschau: BaZi-Beitrag zu den 12 Sektoren"
          : "Mini-Ring preview: BaZi contribution to 12 sectors"}
      />
      <p className="text-[10px] text-[#1E2A3A]/40 text-center max-w-[260px] leading-relaxed">
        {lang === "de"
          ? `Dein BaZi-Profil formt 30% deines Fusion Rings. Stärkste Sektoren: ${peakSectors.map((s) => s.label_de).join(", ")}.`
          : `Your BaZi profile shapes 30% of your Fusion Ring. Strongest sectors: ${peakSectors.map((s) => s.sign.charAt(0).toUpperCase() + s.sign.slice(1)).join(", ")}.`}
      </p>
      {onNavigateToRing && (
        <button
          onClick={onNavigateToRing}
          className="text-[9px] uppercase tracking-[0.3em] text-[#8B6914]/50 hover:text-[#8B6914] transition-colors"
        >
          → {lang === "de" ? "Zum Fusion Ring" : "View Fusion Ring"}
        </button>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/BaZiMiniRing.tsx
git commit -m "feat(bazi): create BaZiMiniRing component showing B(s) contribution to 12 sectors"
```

---

## Task 7: Create BaZiInterpretation component

**Files:**
- Create: `src/components/BaZiInterpretation.tsx`

**Context:** Renders the personality interpretation for the user's animal-element combination. Uses interpretation data from Task 2. Shows title, long text (serif font per dev brief), strengths, shadows. Also renders the tension analysis from WuXing balance.

**Step 1: Create the component**

```tsx
import { useMemo } from "react";
import { motion } from "motion/react";
import { getBaZiInterpretation } from "../lib/astro-data/bazi-interpretations";
import { detectTensions } from "../lib/astro-data/wuxing-cycles";
import { getWuxingByKey } from "../lib/astro-data/wuxing";

interface BaZiInterpretationProps {
  animal: string;
  element: string;
  balance: Record<string, number>;
  lang: "en" | "de";
}

export function BaZiInterpretation({ animal, element, balance, lang }: BaZiInterpretationProps) {
  const interpretation = useMemo(
    () => getBaZiInterpretation(animal, element),
    [animal, element],
  );
  const tensions = useMemo(
    () => detectTensions(balance),
    [balance],
  );

  if (!interpretation) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="space-y-6"
    >
      {/* Title */}
      <div>
        <h3 className="font-serif text-xl sm:text-2xl text-[#1E2A3A] mb-2">
          {interpretation.title[lang]}
        </h3>
        <p className="text-xs text-[#8B6914]/50 italic">
          {interpretation.short[lang]}
        </p>
      </div>

      {/* Long interpretation — serif font per dev brief ("like a letter, not a widget") */}
      <p className="text-[13px] text-[#1E2A3A]/60 leading-[1.85] font-serif">
        {interpretation.long[lang]}
      </p>

      {/* Strengths & Shadows */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <h4 className="text-[9px] uppercase tracking-[0.3em] text-[#3D8B37]/70 mb-2">
            {lang === "de" ? "Stärken" : "Strengths"}
          </h4>
          <ul className="space-y-1.5">
            {interpretation.strengths.map((s, i) => (
              <li key={i} className="text-xs text-[#1E2A3A]/50 flex items-start gap-1.5">
                <span className="text-[#3D8B37]/50 mt-0.5 shrink-0">+</span>
                {s[lang]}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-[9px] uppercase tracking-[0.3em] text-[#D63B0F]/50 mb-2">
            {lang === "de" ? "Schatten" : "Shadows"}
          </h4>
          <ul className="space-y-1.5">
            {interpretation.shadows.map((s, i) => (
              <li key={i} className="text-xs text-[#1E2A3A]/50 flex items-start gap-1.5">
                <span className="text-[#D63B0F]/40 mt-0.5 shrink-0">–</span>
                {s[lang]}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Tensions */}
      {tensions.length > 0 && (
        <div className="border-t border-[#8B6914]/10 pt-4">
          <h4 className="text-[9px] uppercase tracking-[0.3em] text-[#C8930A]/60 mb-3">
            {lang === "de" ? "Spannungen in deiner Balance" : "Tensions in Your Balance"}
          </h4>
          <div className="space-y-2">
            {tensions.map((t, i) => {
              const domEl = getWuxingByKey(t.dominant);
              const ctrlEl = getWuxingByKey(t.controller);
              return (
                <div key={i} className="flex items-start gap-2 text-xs text-[#1E2A3A]/45">
                  <span className="shrink-0 mt-0.5">
                    <span style={{ color: domEl?.color }}>●</span>
                    {" "}
                    <span className="text-[#1E2A3A]/20">↔</span>
                    {" "}
                    <span style={{ color: ctrlEl?.color }}>○</span>
                  </span>
                  <span>{t.description[lang]}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/BaZiInterpretation.tsx
git commit -m "feat(bazi): create BaZiInterpretation component with strengths, shadows, and tension analysis"
```

---

## Task 8: Integrate new BaZi section into Dashboard

**Files:**
- Modify: `src/components/Dashboard.tsx`

**Context:** Replace the current BaZi four-pillars grid (the `PremiumGate`-wrapped section around lines 733-766) and the WuXing balance bar section (lines 768-841) with the new full-width BaZi/WuXing section containing all new components. The section is placed after the primary grid and before the Western Houses.

**Step 1: Add imports at top of Dashboard.tsx**

After the existing imports (around line 22), add:

```typescript
import { BaZiFourPillars } from "./BaZiFourPillars";
import { WuXingPentagon } from "./WuXingPentagon";
import { WuXingCycleWheel } from "./WuXingCycleWheel";
import { BaZiInterpretation } from "./BaZiInterpretation";
import { BaZiMiniRing } from "./BaZiMiniRing";
import { detectTensions } from "../lib/astro-data/wuxing-cycles";
```

**Step 2: Add computed data for BaZi section**

After the existing `birthConstellationKey` memo (around line 369), add:

```typescript
// BaZi section computed data
const wuxingBalance = useMemo(() => {
  const raw = apiData.wuxing?.elements || apiData.wuxing?.element_counts || {};
  const total = Object.values(raw).reduce((sum: number, v: any) => sum + Number(v), 0);
  if (total === 0) return {};
  return Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, Number(v) / total])
  );
}, [apiData.wuxing]);

const yearAnimal = apiData.bazi?.zodiac_sign || apiData.chinese?.zodiac || "";
const yearEl = apiData.bazi?.pillars?.year?.element || "";

// B(s) signals for mini-ring (from fusion computation)
const baziSectorSignals = useMemo(() => {
  return fusionSignal?.components?.B ?? new Array(12).fill(0);
}, [fusionSignal]);
```

**Step 3: Replace the old Four Pillars and WuXing sections**

Replace the section from `{/* ═══ BAZI FOUR PILLARS */}` through the end of `{/* WuXing Balance */}` (approximately lines 733-841) with:

```tsx
{/* ═══ BAZI & WUXING DEEP SECTION ═══════════════════════════════ */}
<PremiumGate teaser={t("dashboard.premium.teaserPillars")}>
  <motion.div className="mb-12" {...fadeIn(0.3)}>
    {/* Block A: Header */}
    <SectionDivider
      label={lang === "de" ? "Chinesische Astrologie" : "Chinese Astrology"}
      title={lang === "de" ? "BaZi & WuXing — Vier Säulen des Schicksals" : "BaZi & WuXing — Four Pillars of Destiny"}
    />

    {/* Block B: Four Pillars */}
    {apiData.bazi?.pillars && (
      <div className="mb-10">
        <p className="text-[9px] uppercase tracking-[0.3em] text-[#8B6914]/50 mb-4">
          {lang === "de" ? "Die Vier Säulen" : "The Four Pillars"}
        </p>
        <BaZiFourPillars
          pillars={apiData.bazi.pillars}
          lang={lang}
          planetariumMode={planetariumMode}
        />
      </div>
    )}

    {/* Block C: Element Balance — Pentagon + Cycle side by side */}
    <div className="mb-10">
      <p className="text-[9px] uppercase tracking-[0.3em] text-[#8B6914]/50 mb-2">
        WuXing 五行
      </p>
      <p className="text-xs text-[#1E2A3A]/45 mb-6 leading-relaxed max-w-2xl">
        {t("dashboard.wuxing.sectionDesc")}
      </p>

      <div className="morning-card p-6 md:p-8">
        {Object.keys(wuxingBalance).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <WuXingPentagon
              balance={wuxingBalance}
              lang={lang}
              planetariumMode={planetariumMode}
            />
            <WuXingCycleWheel
              balance={wuxingBalance}
              lang={lang}
              planetariumMode={planetariumMode}
            />
          </div>
        ) : (
          /* Fallback: existing bar chart */
          <div className="space-y-4">
            {WUXING_ELEMENTS.map((el) => {
              const count = Number(wuxingCounts[el.key] ?? wuxingCounts[el.name.de] ?? 0);
              const pctLabel = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
              const pctBar = hasWuxingData ? (count / maxCount) * 100 : 0;
              const isDom = el.key === dominantEl || el.name.de === dominantEl;
              return (
                <Tooltip key={el.key} content={el.description[lang]} wide dark={planetariumMode}>
                  <div className="flex items-center gap-2 sm:gap-4 cursor-help group">
                    <div className="w-24 sm:w-28 md:w-36 shrink-0 flex items-center gap-2 sm:gap-2.5">
                      <span className="text-2xl font-serif leading-none select-none" style={{ color: el.color }}>
                        {el.chinese}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-[#1E2A3A] truncate">{el.name[lang]}</div>
                        <div className="text-[10px] text-[#1E2A3A]/35">{el.pinyin}</div>
                      </div>
                    </div>
                    <div className="flex-1 wuxing-bar-track">
                      {hasWuxingData ? (
                        <motion.div
                          className="wuxing-bar-fill"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(pctBar, pctBar > 0 ? 2 : 0)}%` }}
                          transition={{ duration: 1.0, ease: "easeOut", delay: 0.2 }}
                          style={{ backgroundColor: el.color }}
                        />
                      ) : (
                        <div className="h-full rounded-full" style={{ backgroundColor: el.color + "20", width: "100%" }} />
                      )}
                    </div>
                    <div className="w-12 shrink-0 text-right flex items-center justify-end gap-1">
                      {hasWuxingData && pctLabel > 0 && (
                        <span className="text-[10px] text-[#1E2A3A]/45 font-mono">{pctLabel}%</span>
                      )}
                      {isDom && <span className="text-sm" style={{ color: el.color }}>★</span>}
                    </div>
                  </div>
                </Tooltip>
              );
            })}
          </div>
        )}
      </div>
    </div>

    {/* Block D: Interpretation + Ring Connector */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Interpretation — 2/3 width */}
      <div className="morning-card p-6 md:p-8 md:col-span-2">
        <BaZiInterpretation
          animal={yearAnimal}
          element={yearEl}
          balance={wuxingBalance}
          lang={lang}
        />
      </div>

      {/* Mini-Ring Connector — 1/3 width */}
      <div className="morning-card p-6 flex flex-col items-center justify-center">
        <p className="text-[9px] uppercase tracking-[0.3em] text-[#8B6914]/50 mb-4">
          {lang === "de" ? "BaZi im Ring" : "BaZi in Ring"}
        </p>
        <BaZiMiniRing
          baziSignals={baziSectorSignals}
          lang={lang}
          size={180}
        />
      </div>
    </div>
  </motion.div>
</PremiumGate>
```

**Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors in src/

**Step 5: Verify visually**

Run: `npm run dev`
Navigate to Dashboard. The BaZi section should now show:
- Four Pillars with coins, Day Master highlighted
- Pentagon chart + Cycle wheel side by side
- Interpretation text below
- Mini-Ring preview in the right column

**Step 6: Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "feat(dashboard): integrate full BaZi/WuXing section with pillars, pentagon, cycle, interpretation, mini-ring"
```

---

## Task 9: Mobile responsive layout (2x2 pillar grid)

**Files:**
- Modify: `src/components/BaZiFourPillars.tsx`
- Modify: `src/components/WuXingPentagon.tsx`

**Context:** Dev brief specifies: "Mobile: Vier-Säulen-Layout bricht auf 2x2 Grid um. Pentagon bleibt lesbar." The Four Pillars grid is already `grid-cols-2 sm:grid-cols-4` from Task 3. Pentagon needs responsive sizing.

**Step 1: Make Pentagon responsive**

In `WuXingPentagon.tsx`, change the component to accept responsive sizing:

Replace the hardcoded `size` default:
```tsx
size = 280
```
With a responsive approach using a wrapper:
```tsx
export function WuXingPentagon({ balance, lang, size: propSize, planetariumMode }: WuXingPentagonProps) {
  // Use smaller size on mobile
  const size = propSize ?? 280;
```

Then in the Dashboard integration (Task 8), pass `size={240}` on mobile via a CSS-controlled wrapper or use `clamp()`. Since SVG scales naturally, the simplest approach is to wrap the Pentagon in a responsive container.

In `Dashboard.tsx`, within the Pentagon/Cycle grid, add responsive sizing:

```tsx
<div className="max-w-[280px] mx-auto md:max-w-none">
  <WuXingPentagon ... />
</div>
<div className="max-w-[240px] mx-auto md:max-w-none">
  <WuXingCycleWheel ... />
</div>
```

**Step 2: Commit**

```bash
git add src/components/BaZiFourPillars.tsx src/components/WuXingPentagon.tsx src/components/Dashboard.tsx
git commit -m "fix(dashboard): responsive mobile layout for four pillars (2x2) and pentagon sizing"
```

---

## Task 10: Spannungs-Overlay on Pentagon (extreme imbalance markers)

**Files:**
- Modify: `src/components/WuXingPentagon.tsx`

**Context:** Dev brief acceptance criteria #3: "Extremwerte (> 0.7 oder < 0.1) werden markiert." Already partially done in Task 4 (points get larger + outer ring). Add a pulsing animation for extreme values.

**Step 1: Add pulsing animation to extreme points**

In `WuXingPentagon.tsx`, replace the static extreme circle with an animated one:

```tsx
{isExtreme && (
  <motion.circle
    cx={px} cy={py} r={8}
    fill="none"
    stroke={el?.color ?? "#D4AF37"}
    strokeWidth={1}
    initial={{ opacity: 0.2, r: 6 }}
    animate={{ opacity: [0.2, 0.5, 0.2], r: [6, 10, 6] }}
    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
  />
)}
```

**Step 2: Commit**

```bash
git add src/components/WuXingPentagon.tsx
git commit -m "feat(wuxing): add pulsing animation for extreme imbalance values on pentagon"
```

---

## Verification

After all tasks:

1. **TypeScript check:** `npx tsc --noEmit` — zero errors in `src/`
2. **Dev server:** `npm run dev` — app loads, Dashboard renders
3. **Four Pillars:** All 4 pillars visible with coins, Day Master has gold ring + badge
4. **Hour Pillar Fallback:** If no birth time, shows "Geburtszeit nicht angegeben"
5. **Pentagon:** Shows balance with 5 elements, extreme values pulse
6. **Cycle Wheel:** Shows generation (solid arrows) and control (dashed) cycles
7. **Interpretation:** Shows animal-element combo text with strengths/shadows
8. **Mini-Ring:** Shows B(s) contribution as mini ring with sector labels
9. **Mobile (375px):** Four Pillars are 2x2, Pentagon fits without horizontal scroll
10. **Acceptance criterion #8:** "Kein User sagt: 'Das hätte ich auch auf Wikipedia gefunden.'"

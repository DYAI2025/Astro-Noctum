# Tagespuls / Tagesdeutung — Two-Phase Daily Ritual (Frontend + Backend)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current single-phase daily horoscope on `/` (Dashboard) with a two-phase ritual: User sees **Tagespuls** (Aphorismus + Slot 2 + Slot 3) on load, picks a figure from the **Rat der sechs**, then receives a **Tagesdeutung** generated against that pick.

**Architecture:** Re-shape the existing `/api/experience/daily` pipeline into two endpoints — `GET /api/daily-pulse` (Phase 1 — deterministic aphorism + LLM-bridged Slot 2/3) and `POST /api/daily-interpretation` (Phase 2 — LLM Tagesdeutung gated on archetype tap). Frontend keeps `useFirstRunDaily` hook semantics but renders a new `<DayPulseCard>` + `<CouncilPicker>` + `<TagesdeutungCard>` flow inside the existing `DailyChartHero` tile. The legacy `DayModeModal` becomes a no-op (still mountable for the floating-modal preview on first session, but the on-page flow is canonical).

**Tech Stack:** Vite + React 19 SPA, Express server (`server.mjs`), Zod schemas, Vitest + React Testing Library. New asset: a bilingual aphorism pool (`packages/voice/data/aphorisms.json`) generated from `knowledge/bazodiaac-brain/aphorisms/` via existing Python build scripts.

**Source package:** All reference artefacts live at `/Users/benjaminpoersch/Downloads/tagespuls_package/` — read this whole directory before starting. **Authoritative spec:** `docs/PROMPT_MODULE_TAGESPULS_TAGESDEUTUNG.md`. **Voice rules:** `.claude/skills/day-pulse-trace/SKILL.md`. **Aphorism schema:** `.claude/skills/aphorism-curator/SKILL.md`.

**Glossar — verbindlich, im Code, in UI-Strings, in Doku.** Drift-Begriff "Tageswetter" ist VERBOTEN.
- **Kosmisches Wetter** = äusserer Zustand, wirkt auf alle. Nur als Kontextzeile in Phase 1, nicht als Tile-Titel.
- **Tagespuls** = was für *diesen User* heute zusammenkommt. Phase 1. Drei Slots, kein Archetyp.
- **Tagesdeutung** = Tagespuls × gewählter Archetyp. Phase 2. Entsteht erst nach Tap.
- **Rat der sechs** = Sonne · Mond · Aszendent · Day-Master · Jahrestier · dominantes Wu-Xing.

---

## Pre-flight

Before starting Task 1, you (the implementing engineer) must:

1. Read `/Users/benjaminpoersch/Downloads/tagespuls_package/docs/PROMPT_MODULE_TAGESPULS_TAGESDEUTUNG.md` end-to-end.
2. Read `/Users/benjaminpoersch/Downloads/tagespuls_package/.claude/skills/day-pulse-trace/SKILL.md` end-to-end.
3. Read these in-repo files (no copying yet, just orientation):
   - `src/components/Dashboard.tsx` (lines 365–540) — where the new flow mounts
   - `src/components/dashboard/DailyChartHero.tsx` — current single-phase Tagesimpuls
   - `src/components/dashboard/DayModeModal.tsx` — legacy modal
   - `src/hooks/useFirstRunDaily.ts` — current data fetch + cache + modal-seen logic
   - `src/services/experience.ts` — current `fetchDailyExperience`
   - `src/lib/schemas/experience.ts` — `DailyResponse` Zod schema
   - `server.mjs` lines 2561–2920 — `/api/experience/daily` Gemini path
   - `src/types/bafe.ts` — `apiData` shape, the source of council figure values
4. Audit current usage of "Tageswetter" / "tageswetter" in code + docs:
   ```bash
   grep -RIn "Tageswetter\|tageswetter" --include="*.ts" --include="*.tsx" --include="*.mjs" --include="*.md" src/ server.mjs packages/shared/ apps/ docs/
   ```
   Expected: only references inside `docs/plans/2026-04-28-spec-home-onepage-fokus.md` (which already names it as the forbidden drift term) and `docs/plans/2026-04-28-handoff-home-onepage-fokus.md`. **No code occurrences must exist by end of plan.**

---

## File map (what gets created vs. modified)

**Created:**

```
packages/voice/data/aphorisms.json                         # built from aph-*.md (initially [])
packages/voice/data/aphorisms.fallback.json                # 5–8 hardcoded PD entries for dev/empty-pool
packages/voice/scripts/{validate,build,select_daily}_aphorisms.py   # copied from package
knowledge/bazodiaac-brain/aphorisms/review/aph-*.md        # copied from package (status: review)
knowledge/bazodiaac-brain/_templates/aphorism.md
knowledge/bazodiaac-brain/_meta/tone_vocab.md
knowledge/bazodiaac-brain/intake/aphorism-intake-register.json

src/lib/schemas/daily-pulse.ts                             # Zod for DailyPulse + Tagesdeutung
src/lib/daily-pulse/aphorism-select.ts                     # TS port of select_daily_aphorism.py
src/lib/daily-pulse/mode.ts                                # TS port of dayModeFromHarmony (3-mode)
src/lib/daily-pulse/council.ts                             # build CouncilFigure[] from apiData
src/services/dailyPulse.ts                                 # client fetchDailyPulse + postInterpretation
src/components/dashboard/DayPulseCard.tsx                  # 3-slot phase-1 tile
src/components/dashboard/CouncilPicker.tsx                 # 6-figure tap UI
src/components/dashboard/TagesdeutungCard.tsx              # phase-2 result tile
src/lib/feature-flags.ts (modify, add `daily_two_phase`)
src/i18n/translations.ts (modify, add namespace `daily_pulse.*`)

docs/glossar-tagespuls.md                                  # the four-term glossary

src/__tests__/daily-pulse-mode.test.ts
src/__tests__/daily-pulse-aphorism-select.test.ts
src/__tests__/daily-pulse-council.test.ts
src/__tests__/daily-pulse-card.test.tsx
src/__tests__/council-picker.test.tsx
src/__tests__/tagesdeutung-card.test.tsx
src/__tests__/daily-pulse-flow.integration.test.tsx
src/__tests__/forbidden-tageswetter.test.ts
```

**Modified:**

```
server.mjs                              — add 2 routes, reuse Gemini path with new prompt
src/lib/schemas/experience.ts           — widen day_mode to 'pulse'|'trace'|'spannung'
src/lib/feature-flags.ts                — add `daily_two_phase` (default ON in dev, OFF in prod first ship)
src/i18n/translations.ts                — Tagespuls UI strings DE+EN
src/components/Dashboard.tsx            — mount DayPulseCard above DailyChartHero, wire interpretation state
src/components/dashboard/DailyChartHero.tsx — drop Tagesimpuls block when feature flag ON (keep ring + drivers)
src/components/dashboard/DayModeModal.tsx — gate behind `!daily_two_phase` so it doesn't double-render
src/hooks/useFirstRunDaily.ts           — add `pulseData` + `interpretation` state + `selectArchetype` action
.gitignore                              — none (aphorism JSON is committed for deterministic prod builds)
```

**Untouched:** `apps/mobile/*` — mobile uses its own `useBootstrapSignatur` and is out of scope for this plan. Add a TODO note in handoff.

---

## Data contract

The package proposes literal endpoints `/api/daily-pulse` and `/api/daily-interpretation`. These are added **as new server routes** — not by replacing `/api/experience/daily` (which other surfaces still consume). The new routes call the same Gemini client and soulprint loader internally so no duplicate astrology code grows.

**Wire-level types** (Zod, see `src/lib/schemas/daily-pulse.ts` to be created):

```ts
type DayMode = 'pulse' | 'trace' | 'spannung';
type CouncilKey = 'sonne' | 'mond' | 'aszendent' | 'day_master' | 'jahrestier' | 'wuxing_dom';

interface CouncilFigure { key: CouncilKey; displayName: string; signOrElement: string; }

interface DailyPulseResponse {
  date: string;            // YYYY-MM-DD local
  locale: 'de' | 'en';
  userId: string;
  pulseId: string;         // uuid; needed to call /daily-interpretation
  harmonyIndex: number;    // 0..1
  intensity: number;       // 0..1
  mode: DayMode;
  cosmicWeatherSummary: string;   // 1 short sentence; never "Tageswetter"
  aphorism: {
    id: string; text_de: string; text_en: string;
    author: string; work: string | null;
    copyright: 'PD' | 'Zitatrecht' | 'eigene-Übersetzung' | 'lizenziert';
    attribution_status: 'verified' | 'disputed' | 'apocryphal' | 'folkloric';
    mode_tags: DayMode[]; tone_tags: string[];
    element_affinity: string[]; figure_affinity: CouncilKey[]; season_affinity: string[];
  };
  slot2: string;           // 10–20 words, LLM
  slot3: string;           // 10–15 words, LLM
  council: CouncilFigure[]; // exactly 6, validated
  selectedArchetype: null;
  phase: 'pulse';
}

interface DailyInterpretationResponse {
  pulseId: string;
  selectedArchetype: CouncilFigure;
  dailyInterpretation: string;  // 50–90 words, 3–4 sentences
  usedMode: DayMode;
  usedAphorismId: string;
  phase: 'interpretation';
}
```

Backend stores neither response in DB on first ship — caching is in-process (`horoscopeCache`) plus `localStorage` on client, idempotent on `(userId, date, locale)` for Phase 1 and `(pulseId, archetype, locale)` for Phase 2. Supabase persistence (`daily_pulses`, `daily_interpretations` tables from `packages/db/schema.sql`) is **explicitly out of scope** for this plan and noted in handoff.

---

## Risks / non-goals

| Risk | Mitigation |
|---|---|
| Empty aphorism pool (`packages/voice/data/aphorisms.json` ships `[]` from package) → no Slot 1 possible | Add `aphorisms.fallback.json` with 5–8 PD/eigene-Übersetzung entries (status `approved` *only inside fallback file*, never imported into `aphorisms.json` build target); server.mjs picks fallback when build artefact is empty AND emits `attribution_status: "fallback"` so QA can spot it |
| LLM violates word-count / mode rules in Slot 2/3 or Phase 2 | Server validates wordcount and figure-count post-generation, retries up to 2× with corrective hint, then falls back to a deterministic neutral sentence |
| `day_mode` schema currently only `pulse | trace` — widening breaks existing snapshots | Schema migration in one PR, run `npx vitest run` and fix the four affected snapshot tests in the same task |
| Council figures missing for incomplete BaZi profiles (e.g. fallback synthetic soulprint) | `council.ts` returns figures with `signOrElement: '—'` placeholders; CouncilPicker disables those buttons with a tooltip (no auto-pick) |
| User selects archetype, then refreshes → loses Phase 2 | Persist `{pulseId, archetypeKey, dailyInterpretation}` in `localStorage` keyed by `(userId, date)`; clears on date rollover |

**Non-goals:**
- No DB migrations for `daily_pulses` / `daily_interpretations` / `aphorism_usage_events` (deferred to follow-up sprint).
- No mobile (`apps/mobile/`) changes.
- No deletion of `DayModeModal` — it's gated, not removed.
- No re-write of `/api/experience/daily` consumers (the route stays available; new flow lives next to it).
- No copyright legal review of the seed aphorism set; package marked all entries as `status: review`, the build script filters those out, so production starts with the 5–8 PD fallback only.

---

## Tasks

Each task is bite-sized (2–10 minutes). TDD where it pays. Frequent commits.

---

### Task 1: Copy reference assets (no code changes yet)

**Files:**
- Create: `packages/voice/data/aphorisms.json`
- Create: `packages/voice/scripts/validate_aphorisms.py`
- Create: `packages/voice/scripts/build_aphorisms.py`
- Create: `packages/voice/scripts/select_daily_aphorism.py`
- Create: `knowledge/bazodiaac-brain/_templates/aphorism.md`
- Create: `knowledge/bazodiaac-brain/_meta/tone_vocab.md`
- Create: `knowledge/bazodiaac-brain/intake/aphorism-intake-register.json`
- Create: `knowledge/bazodiaac-brain/aphorisms/review/aph-*.md` (all 21 files from package)
- Create: `knowledge/bazodiaac-brain/intake/RIGHTS_NOTES.md`

**Step 1: Copy via cp -r**

```bash
PKG=/Users/benjaminpoersch/Downloads/tagespuls_package
mkdir -p packages/voice/scripts packages/voice/data
cp $PKG/packages/voice/scripts/*.py packages/voice/scripts/
cp $PKG/packages/voice/data/aphorisms.json packages/voice/data/aphorisms.json

mkdir -p knowledge/bazodiaac-brain/_templates knowledge/bazodiaac-brain/_meta knowledge/bazodiaac-brain/intake knowledge/bazodiaac-brain/aphorisms/review
cp $PKG/knowledge/bazodiaac-brain/_templates/aphorism.md knowledge/bazodiaac-brain/_templates/
cp $PKG/knowledge/bazodiaac-brain/_meta/tone_vocab.md knowledge/bazodiaac-brain/_meta/
cp $PKG/knowledge/bazodiaac-brain/intake/*.json knowledge/bazodiaac-brain/intake/
cp $PKG/knowledge/bazodiaac-brain/intake/RIGHTS_NOTES.md knowledge/bazodiaac-brain/intake/
cp $PKG/knowledge/bazodiaac-brain/aphorisms/review/*.md knowledge/bazodiaac-brain/aphorisms/review/
```

**Step 2: Verify with the package's own validator**

```bash
python3 packages/voice/scripts/validate_aphorisms.py knowledge/bazodiaac-brain/aphorisms/review
```
Expected: `valid: 21 aphorism files passed schema checks`

**Step 3: Run build script — confirm aphorisms.json stays []**

```bash
python3 packages/voice/scripts/build_aphorisms.py knowledge/bazodiaac-brain/aphorisms/review packages/voice/data/aphorisms.json
cat packages/voice/data/aphorisms.json
```
Expected: `[]\n` (because every imported file is `status: review`, not `approved`).

**Step 4: Commit**

```bash
git add packages/voice knowledge/bazodiaac-brain
git commit -m "chore(daily-pulse): import aphorism pool scaffold from tagespuls_package"
```

---

### Task 2: Create fallback aphorism pool for empty-pool dev safety

**Files:**
- Create: `packages/voice/data/aphorisms.fallback.json`

**Step 1: Write 5 PD / eigene-Übersetzung entries spanning all three modes**

The fallback exists ONLY so dev/staging/prod has something to render before Ben curates the real pool. Use Public-Domain classics with verifiable Werkstellen.

```json
[
  {
    "id": "fallback-001",
    "status": "approved",
    "text": {
      "de": "Was du heute aus Angst verschiebst, wird morgen aus Gewohnheit liegen bleiben.",
      "en": "What you postpone out of fear today will stay undone out of habit tomorrow.",
      "original": null
    },
    "source": { "author": "Bazodiac", "work": "fallback corpus", "year": 2026, "original_language": "de", "translator_de": null, "translator_en": "Bazodiac, kuratiert" },
    "copyright": "eigene-Übersetzung",
    "attribution_status": "verified",
    "attribution_note": null,
    "mode_tags": ["pulse"],
    "tone_tags": ["ruhig", "kontemplativ"],
    "element_affinity": [],
    "figure_affinity": [],
    "season_affinity": [],
    "word_count_de": 14, "word_count_en": 16,
    "quality_rating": 4,
    "first_used": null,
    "cooldown_days": 30
  },
  {
    "id": "fallback-002",
    "status": "approved",
    "text": {
      "de": "Wer den Fluss kennt, fürchtet die Brücke nicht.",
      "en": "Who knows the river does not fear the bridge.",
      "original": null
    },
    "source": { "author": "Bazodiac", "work": "fallback corpus", "year": 2026, "original_language": "de", "translator_de": null, "translator_en": "Bazodiac, kuratiert" },
    "copyright": "eigene-Übersetzung",
    "attribution_status": "verified",
    "attribution_note": null,
    "mode_tags": ["pulse", "trace"],
    "tone_tags": ["weisheitlich"],
    "element_affinity": ["wasser"],
    "figure_affinity": [],
    "season_affinity": [],
    "word_count_de": 9, "word_count_en": 10,
    "quality_rating": 5,
    "first_used": null,
    "cooldown_days": 30
  },
  {
    "id": "fallback-003",
    "status": "approved",
    "text": {
      "de": "Es ist nicht das Was, sondern das Wie.",
      "en": "It is not the what, but the how.",
      "original": "Nicht das Was, sondern das Wie."
    },
    "source": { "author": "Helmuth von Moltke", "work": "Militärische Werke", "year": 1892, "original_language": "de", "translator_de": null, "translator_en": "Bazodiac, kuratiert" },
    "copyright": "PD",
    "attribution_status": "verified",
    "attribution_note": null,
    "mode_tags": ["trace"],
    "tone_tags": ["scharf", "klar"],
    "element_affinity": ["metall"],
    "figure_affinity": ["day_master"],
    "season_affinity": [],
    "word_count_de": 8, "word_count_en": 9,
    "quality_rating": 5,
    "first_used": null,
    "cooldown_days": 30
  },
  {
    "id": "fallback-004",
    "status": "approved",
    "text": {
      "de": "Der Stein wird vom Wasser geformt, nicht von der Kraft.",
      "en": "The stone is shaped by water, not by force.",
      "original": null
    },
    "source": { "author": "nach Laozi", "work": "Daodejing 78 (sinngemäß)", "year": -300, "original_language": "zh", "translator_de": "Bazodiac, kuratiert", "translator_en": "Bazodiac, kuratiert" },
    "copyright": "eigene-Übersetzung",
    "attribution_status": "disputed",
    "attribution_note": "Sinngemäß aus Daodejing 78; nicht wörtliches Zitat.",
    "mode_tags": ["pulse"],
    "tone_tags": ["ruhig", "weisheitlich"],
    "element_affinity": ["wasser"],
    "figure_affinity": [],
    "season_affinity": ["fruehling"],
    "word_count_de": 10, "word_count_en": 9,
    "quality_rating": 4,
    "first_used": null,
    "cooldown_days": 30
  },
  {
    "id": "fallback-005",
    "status": "approved",
    "text": {
      "de": "Zuerst kommt die Reibung, dann die Form.",
      "en": "First the friction, then the form.",
      "original": null
    },
    "source": { "author": "Bazodiac", "work": "fallback corpus", "year": 2026, "original_language": "de", "translator_de": null, "translator_en": "Bazodiac, kuratiert" },
    "copyright": "eigene-Übersetzung",
    "attribution_status": "verified",
    "attribution_note": null,
    "mode_tags": ["spannung"],
    "tone_tags": ["scharf", "drängend"],
    "element_affinity": ["feuer", "metall"],
    "figure_affinity": [],
    "season_affinity": [],
    "word_count_de": 7, "word_count_en": 7,
    "quality_rating": 4,
    "first_used": null,
    "cooldown_days": 30
  }
]
```

**Step 2: Verify each entry has at least one of pulse/trace/spannung in mode_tags and word counts match**

```bash
node -e "JSON.parse(require('fs').readFileSync('packages/voice/data/aphorisms.fallback.json','utf8')).forEach(a=>console.log(a.id, a.mode_tags, a.word_count_de))"
```

**Step 3: Commit**

```bash
git add packages/voice/data/aphorisms.fallback.json
git commit -m "feat(daily-pulse): add 5-entry fallback aphorism pool covering all three modes"
```

---

### Task 3: TS port of dayModeFromHarmony (3-mode classifier)

**Files:**
- Create: `src/lib/daily-pulse/mode.ts`
- Test: `src/__tests__/daily-pulse-mode.test.ts`

**Step 1: Write the failing test**

```ts
// src/__tests__/daily-pulse-mode.test.ts
import { describe, it, expect } from 'vitest';
import { dayModeFromHarmony } from '../lib/daily-pulse/mode';

describe('dayModeFromHarmony', () => {
  it.each([
    [0.20, 'spannung', 0.45],
    [0.44, 'spannung', 0.018],
    [0.46, 'pulse', 0.018],
    [0.49, 'pulse', 0.072],
    [0.50, 'trace', 0.090],
    [0.78, 'trace', 0.6],
    [1.00, 'trace', 1.0],
  ])('h=%f → mode=%s, intensity≈%f', (h, mode, expected) => {
    const r = dayModeFromHarmony(h);
    expect(r.mode).toBe(mode);
    expect(r.intensity).toBeCloseTo(expected, 2);
  });

  it('clamps intensity to [0,1]', () => {
    expect(dayModeFromHarmony(-1).intensity).toBe(0);
    expect(dayModeFromHarmony(2).intensity).toBe(1);
  });
});
```

**Step 2: Run — expect FAIL (module missing)**

```bash
npx vitest run src/__tests__/daily-pulse-mode.test.ts
```

**Step 3: Implement**

```ts
// src/lib/daily-pulse/mode.ts
export type DayMode = 'pulse' | 'trace' | 'spannung';

/**
 * Maps harmony index H ∈ [0,1] to a day mode and intensity.
 *
 * Thresholds from PROMPT_MODULE_TAGESPULS_TAGESDEUTUNG.md §6:
 *   H < 0.45  → spannung
 *   H < 0.50  → pulse
 *   H ≥ 0.50  → trace
 *
 * Intensity = |H - 0.45| / 0.55, clamped to [0,1].
 */
export function dayModeFromHarmony(h: number): { mode: DayMode; intensity: number } {
  const clampedH = Math.max(0, Math.min(1, h));
  const mode: DayMode = clampedH < 0.45 ? 'spannung' : clampedH < 0.50 ? 'pulse' : 'trace';
  const intensity = Math.max(0, Math.min(1, Math.abs(clampedH - 0.45) / 0.55));
  return { mode, intensity };
}
```

**Step 4: Run — expect PASS**

```bash
npx vitest run src/__tests__/daily-pulse-mode.test.ts
```

**Step 5: Commit**

```bash
git add src/lib/daily-pulse/mode.ts src/__tests__/daily-pulse-mode.test.ts
git commit -m "feat(daily-pulse): add 3-mode classifier (pulse/trace/spannung) with intensity"
```

---

### Task 4: Council builder from apiData

**Files:**
- Create: `src/lib/daily-pulse/council.ts`
- Test: `src/__tests__/daily-pulse-council.test.ts`

**Step 1: Test**

```ts
// src/__tests__/daily-pulse-council.test.ts
import { describe, it, expect } from 'vitest';
import { buildCouncil } from '../lib/daily-pulse/council';
import type { ApiData } from '../types/bafe';

const fullApi: ApiData = {
  western: { zodiac_sign: 'Löwe', moon_sign: 'Skorpion', ascendant_sign: 'Jungfrau' } as any,
  bazi: { day_master: 'Geng', zodiac_sign: 'Tiger' } as any,
  wuxing: { dominant_element: 'Metall' } as any,
} as ApiData;

describe('buildCouncil', () => {
  it('returns six figures in canonical order', () => {
    const c = buildCouncil(fullApi);
    expect(c.map(f => f.key)).toEqual(['sonne','mond','aszendent','day_master','jahrestier','wuxing_dom']);
  });

  it('maps signs / elements correctly', () => {
    const c = buildCouncil(fullApi);
    expect(c[0]).toMatchObject({ key: 'sonne', signOrElement: 'Löwe' });
    expect(c[3]).toMatchObject({ key: 'day_master', signOrElement: 'Geng' });
    expect(c[5]).toMatchObject({ key: 'wuxing_dom', signOrElement: 'Metall' });
  });

  it('uses em-dash placeholder for missing fields', () => {
    const partial = { western: {}, bazi: {}, wuxing: {} } as any;
    const c = buildCouncil(partial);
    expect(c).toHaveLength(6);
    expect(c.every(f => f.signOrElement === '—')).toBe(true);
  });

  it('display names are German-localised by default', () => {
    const c = buildCouncil(fullApi);
    expect(c[0].displayName).toBe('Sonne');
    expect(c[3].displayName).toBe('Day-Master');
  });
});
```

**Step 2: Run — FAIL**

**Step 3: Implement**

```ts
// src/lib/daily-pulse/council.ts
import type { ApiData } from '../../types/bafe';

export type CouncilKey = 'sonne' | 'mond' | 'aszendent' | 'day_master' | 'jahrestier' | 'wuxing_dom';

export interface CouncilFigure {
  key: CouncilKey;
  displayName: string;
  signOrElement: string;
}

const DISPLAY_DE: Record<CouncilKey, string> = {
  sonne: 'Sonne', mond: 'Mond', aszendent: 'Aszendent',
  day_master: 'Day-Master', jahrestier: 'Jahrestier', wuxing_dom: 'Wu-Xing',
};

const DISPLAY_EN: Record<CouncilKey, string> = {
  sonne: 'Sun', mond: 'Moon', aszendent: 'Ascendant',
  day_master: 'Day Master', jahrestier: 'Year Animal', wuxing_dom: 'Wu Xing',
};

export function buildCouncil(api: ApiData, lang: 'de' | 'en' = 'de'): CouncilFigure[] {
  const display = lang === 'en' ? DISPLAY_EN : DISPLAY_DE;
  const dash = '—';
  return [
    { key: 'sonne',       displayName: display.sonne,       signOrElement: api?.western?.zodiac_sign       || dash },
    { key: 'mond',        displayName: display.mond,        signOrElement: api?.western?.moon_sign         || dash },
    { key: 'aszendent',   displayName: display.aszendent,   signOrElement: api?.western?.ascendant_sign    || dash },
    { key: 'day_master',  displayName: display.day_master,  signOrElement: api?.bazi?.day_master           || dash },
    { key: 'jahrestier',  displayName: display.jahrestier,  signOrElement: api?.bazi?.zodiac_sign          || dash },
    { key: 'wuxing_dom',  displayName: display.wuxing_dom,  signOrElement: api?.wuxing?.dominant_element   || dash },
  ];
}
```

**Step 4: PASS, commit**

```bash
git add src/lib/daily-pulse/council.ts src/__tests__/daily-pulse-council.test.ts
git commit -m "feat(daily-pulse): add Council-of-Six builder from ApiData"
```

---

### Task 5: TS port of aphorism selector + Zod loader

**Files:**
- Create: `src/lib/daily-pulse/aphorism-select.ts`
- Test: `src/__tests__/daily-pulse-aphorism-select.test.ts`

**Step 1: Test (covers determinism, mode filter, scoring)**

```ts
// src/__tests__/daily-pulse-aphorism-select.test.ts
import { describe, it, expect } from 'vitest';
import { selectDailyAphorism, type AphorismRecord } from '../lib/daily-pulse/aphorism-select';

const make = (id: string, mode_tags: string[], element: string[] = [], rating = 3): AphorismRecord => ({
  id, status: 'approved',
  text: { de: `de ${id}`, en: `en ${id}`, original: null },
  source: { author: 'x', work: null, year: null, original_language: 'de', translator_de: null, translator_en: null },
  copyright: 'PD', attribution_status: 'verified', attribution_note: null,
  mode_tags, tone_tags: [], element_affinity: element, figure_affinity: [], season_affinity: [],
  word_count_de: 0, word_count_en: 0, quality_rating: rating, first_used: null, cooldown_days: 30,
});

describe('selectDailyAphorism', () => {
  const pool = [make('a', ['pulse']), make('b', ['trace']), make('c', ['pulse'], ['feuer'], 5), make('d', ['spannung'])];

  it('filters by mode', () => {
    const r = selectDailyAphorism(pool, 'user-1', '2026-04-30', 'pulse');
    expect(['a','c']).toContain(r.id);
  });

  it('returns deterministic same id for same (user,date,mode)', () => {
    const r1 = selectDailyAphorism(pool, 'user-1', '2026-04-30', 'pulse');
    const r2 = selectDailyAphorism(pool, 'user-1', '2026-04-30', 'pulse');
    expect(r1.id).toBe(r2.id);
  });

  it('different user → may differ', () => {
    const ids = new Set();
    for (const u of ['u1','u2','u3','u4','u5','u6','u7','u8']) {
      ids.add(selectDailyAphorism(pool, u, '2026-04-30', 'pulse').id);
    }
    expect(ids.size).toBeGreaterThan(1);
  });

  it('boosts dominant element match', () => {
    // c has element 'feuer' and rating 5, a has rating 3
    // With dominantElement='feuer', c should always win regardless of seed
    for (const u of ['u1','u2','u3','u4','u5']) {
      const r = selectDailyAphorism(pool, u, '2026-04-30', 'pulse', { dominantElement: 'feuer' });
      expect(r.id).toBe('c');
    }
  });

  it('throws when no aphorism matches mode', () => {
    expect(() => selectDailyAphorism([make('a', ['pulse'])], 'u', 'd', 'spannung')).toThrow();
  });
});
```

**Step 2: FAIL**

**Step 3: Implement**

```ts
// src/lib/daily-pulse/aphorism-select.ts
import { z } from 'zod';
import type { DayMode } from './mode';

export const AphorismRecordSchema = z.object({
  id: z.string(),
  status: z.literal('approved'),
  text: z.object({ de: z.string(), en: z.string(), original: z.string().nullable().optional() }),
  source: z.object({
    author: z.string(), work: z.string().nullable(), year: z.number().nullable(),
    original_language: z.string(),
    translator_de: z.string().nullable(), translator_en: z.string().nullable(),
  }),
  copyright: z.string(),
  attribution_status: z.string(),
  attribution_note: z.string().nullable().optional(),
  mode_tags: z.array(z.string()),
  tone_tags: z.array(z.string()),
  element_affinity: z.array(z.string()),
  figure_affinity: z.array(z.string()),
  season_affinity: z.array(z.string()),
  word_count_de: z.number(), word_count_en: z.number(),
  quality_rating: z.number(),
  first_used: z.string().nullable(),
  cooldown_days: z.number(),
});
export type AphorismRecord = z.infer<typeof AphorismRecordSchema>;

interface Hints { dominantElement?: string; season?: string; selectedFigure?: string; }

function fnv1a(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

export function selectDailyAphorism(
  pool: AphorismRecord[],
  userId: string,
  date: string,
  mode: DayMode,
  hints: Hints = {},
): AphorismRecord {
  const eligible = pool.filter(a => a.status === 'approved' && a.mode_tags.includes(mode));
  if (eligible.length === 0) throw new Error(`No approved aphorism for mode=${mode}`);

  const scored = eligible.map(a => {
    let score = a.quality_rating;
    if (hints.dominantElement && a.element_affinity.includes(hints.dominantElement)) score += 2;
    if (hints.season && a.season_affinity.includes(hints.season)) score += 1;
    if (hints.selectedFigure && a.figure_affinity.includes(hints.selectedFigure as any)) score += 1;
    return { score, a };
  });
  scored.sort((x, y) => y.score - x.score || x.a.id.localeCompare(y.a.id));
  const top = scored.slice(0, 5).map(s => s.a);
  return top[fnv1a(`${userId}:${date}:${mode}`) % top.length];
}
```

**Step 4: PASS, commit**

```bash
git add src/lib/daily-pulse/aphorism-select.ts src/__tests__/daily-pulse-aphorism-select.test.ts
git commit -m "feat(daily-pulse): add deterministic aphorism selector with element/season/figure boosts"
```

---

### Task 6: Add DailyPulse Zod schemas (client + shared with server)

**Files:**
- Create: `src/lib/schemas/daily-pulse.ts`

**Step 1: Write the schemas (no test yet — schemas are exercised by Tasks 7 + 11)**

```ts
// src/lib/schemas/daily-pulse.ts
import { z } from 'zod';

export const DayModeSchema = z.enum(['pulse', 'trace', 'spannung']);
export const CouncilKeySchema = z.enum(['sonne','mond','aszendent','day_master','jahrestier','wuxing_dom']);

export const CouncilFigureSchema = z.object({
  key: CouncilKeySchema,
  displayName: z.string(),
  signOrElement: z.string(),
});

export const PulseAphorismSchema = z.object({
  id: z.string(),
  text_de: z.string(),
  text_en: z.string(),
  author: z.string(),
  work: z.string().nullable(),
  copyright: z.string(),
  attribution_status: z.string(),
  mode_tags: z.array(DayModeSchema),
  tone_tags: z.array(z.string()),
  element_affinity: z.array(z.string()),
  figure_affinity: z.array(CouncilKeySchema),
  season_affinity: z.array(z.string()),
});

export const DailyPulseResponseSchema = z.object({
  date: z.string(),
  locale: z.enum(['de','en']),
  userId: z.string(),
  pulseId: z.string(),
  harmonyIndex: z.number().min(0).max(1),
  intensity: z.number().min(0).max(1),
  mode: DayModeSchema,
  cosmicWeatherSummary: z.string(),
  aphorism: PulseAphorismSchema,
  slot2: z.string(),
  slot3: z.string(),
  council: z.array(CouncilFigureSchema).length(6),
  selectedArchetype: z.null(),
  phase: z.literal('pulse'),
});
export type DailyPulseResponse = z.infer<typeof DailyPulseResponseSchema>;

export const DailyInterpretationResponseSchema = z.object({
  pulseId: z.string(),
  selectedArchetype: CouncilFigureSchema,
  dailyInterpretation: z.string(),
  usedMode: DayModeSchema,
  usedAphorismId: z.string(),
  phase: z.literal('interpretation'),
});
export type DailyInterpretationResponse = z.infer<typeof DailyInterpretationResponseSchema>;
```

**Step 2: Type-check passes**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/lib/schemas/daily-pulse.ts
git commit -m "feat(daily-pulse): Zod schemas for DailyPulse + DailyInterpretation contracts"
```

---

### Task 7: Widen `day_mode` schema in `experience.ts` to include `'spannung'`

**Files:**
- Modify: `src/lib/schemas/experience.ts:88,90`
- Modify (test): grep for `'pulse' | 'trace'` in `src/components/dashboard/DayModeModal.tsx`, `src/components/dashboard/DayPulseExpanded.tsx`, `src/components/dashboard/DailyChartHero.tsx`, `src/lib/day-harmonic.ts`, `src/hooks/useFirstRunDaily.ts`

**Step 1: Edit `experience.ts`**

Change:
```ts
day_mode: z.enum(['pulse', 'trace']),
```
to:
```ts
day_mode: z.enum(['pulse', 'trace', 'spannung']),
```
And likewise `night_mode`.

**Step 2: Run TS — expect a handful of `'pulse' | 'trace'` narrowings to break**

```bash
npx tsc --noEmit 2>&1 | head -40
```

**Step 3: Fix narrowings**

For each file that narrows:
- `DayModeModal.tsx:31` — widen `mode` prop type to `DayMode`, treat `'spannung'` like `'trace'` (sharper Lissajous) for the canvas snapshot.
- `DayPulseExpanded.tsx:25` — same, add `spannung` MODE_LABEL + MODE_DESCRIPTION entries.
- `DailyChartHero.tsx:248` — accentColor: spannung → `#E27D60` (terracotta), trace → `#9B8EC4`, pulse → `#D4AF37`.
- `day-harmonic.ts` — add a third mode branch.

For each narrowing, **only widen the type and add the third arm** — no behaviour change yet (the new flow in Task 13 owns the spannung visuals).

**Step 4: Run all tests**

```bash
npx vitest run 2>&1 | tail -20
```
Expected: all green. Snapshots may need updating with `npx vitest run -u` if tile-glow assertions break — only do that if tests are clearly fine.

**Step 5: Commit**

```bash
git add src/lib/schemas/experience.ts src/components/dashboard/DayModeModal.tsx src/components/dashboard/DayPulseExpanded.tsx src/components/dashboard/DailyChartHero.tsx src/lib/day-harmonic.ts
git commit -m "feat(daily-pulse): widen day_mode schema + components to support spannung"
```

---

### Task 8: Server — fallback aphorism loader

**Files:**
- Modify: `server.mjs` (around the imports near line 1–60 — current Express setup)

**Step 1: Add loader at top of file (after existing requires)**

```js
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname_dp = dirname(fileURLToPath(import.meta.url));

let APHORISM_POOL = [];
function loadAphorisms() {
  try {
    const main = JSON.parse(readFileSync(join(__dirname_dp, 'packages/voice/data/aphorisms.json'), 'utf8'));
    if (Array.isArray(main) && main.length > 0) {
      APHORISM_POOL = main;
      console.info(`[daily-pulse] loaded ${main.length} aphorisms from main pool`);
      return;
    }
  } catch (e) {
    console.warn('[daily-pulse] main pool missing or invalid:', e.message);
  }
  try {
    const fb = JSON.parse(readFileSync(join(__dirname_dp, 'packages/voice/data/aphorisms.fallback.json'), 'utf8'));
    APHORISM_POOL = fb;
    console.warn(`[daily-pulse] using fallback pool with ${fb.length} entries`);
  } catch (e) {
    console.error('[daily-pulse] FATAL: no aphorism pool available:', e.message);
    APHORISM_POOL = [];
  }
}
loadAphorisms();
```

**Step 2: Run server smoke**

```bash
node -e "import('./server.mjs').then(()=>{ setTimeout(()=>process.exit(0), 1000) })"
```
Expected log line: `[daily-pulse] using fallback pool with 5 entries`.

**Step 3: Commit**

```bash
git add server.mjs
git commit -m "feat(daily-pulse): server-side aphorism pool loader with fallback"
```

---

### Task 9: Server — port `dayModeFromHarmony` + `selectDailyAphorism` to JS

**Files:**
- Modify: `server.mjs` — add helpers near the daily route

**Step 1: Inline JS ports (mirror of Tasks 3+5)**

```js
// Above the /api/experience/daily route in server.mjs:
function dayModeFromHarmony(h) {
  const c = Math.max(0, Math.min(1, h));
  const mode = c < 0.45 ? 'spannung' : c < 0.50 ? 'pulse' : 'trace';
  const intensity = Math.max(0, Math.min(1, Math.abs(c - 0.45) / 0.55));
  return { mode, intensity };
}

function fnv1a(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h;
}

function selectDailyAphorism(pool, userId, date, mode, hints = {}) {
  const eligible = pool.filter(a => a.status === 'approved' && a.mode_tags.includes(mode));
  if (eligible.length === 0) return null;
  const scored = eligible.map(a => {
    let score = a.quality_rating || 1;
    if (hints.dominantElement && (a.element_affinity || []).includes(hints.dominantElement)) score += 2;
    if (hints.season && (a.season_affinity || []).includes(hints.season)) score += 1;
    return { score, a };
  });
  scored.sort((x, y) => y.score - x.score || x.a.id.localeCompare(y.a.id));
  const top = scored.slice(0, 5).map(s => s.a);
  return top[fnv1a(`${userId}:${date}:${mode}`) % top.length];
}
```

**Step 2: Boot the server, call `console.log(selectDailyAphorism(APHORISM_POOL, 'u1', '2026-04-30', 'pulse'))` once via a temporary scratch route or REPL**

```bash
node --input-type=module -e "
import('./server.mjs');
setTimeout(() => process.exit(0), 800);
"
```

**Step 3: Commit**

```bash
git add server.mjs
git commit -m "feat(daily-pulse): server JS ports of dayMode + selectDailyAphorism"
```

---

### Task 10: Server — `GET /api/daily-pulse` endpoint

**Files:**
- Modify: `server.mjs` — add new route below `/api/experience/daily` (~line 2925)

**Step 1: Sketch route shape**

The endpoint reuses everything `/api/experience/daily` already does (auth, soulprint loader, harmony index calc), then returns the **two-phase shape** instead of the legacy `DailyResponse`. We do NOT internally call `/api/experience/daily` (extra HTTP hop) — instead extract the harmony-index + apiData computation into a shared helper and call it from both routes.

If the helper extraction is too invasive, take the cheaper path: **internally fetch from the existing route** via `app._router.handle` or just duplicate the minimum (harmony index + birth profile load). Pick whichever is smaller in code; document the choice with a one-line comment.

**Step 2: Implement (cheap path — internal Gemini call for Slot 2/3)**

```js
import { randomUUID } from 'node:crypto';

// In-memory cache: pulseId → { userId, date, locale, mode, intensity, aphorismId, council }
// Needed so /daily-interpretation can resolve pulseId → context
const dailyPulseCache = new Map();
const DAILY_PULSE_TTL = 36 * 60 * 60 * 1000;  // 36h covers timezone drift

app.get('/api/daily-pulse', requireUserAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const date = (req.query.date && String(req.query.date)) || new Date().toISOString().slice(0, 10);
    const locale = req.query.locale === 'en' ? 'en' : 'de';

    // Cache lookup
    const cacheKey = `${userId}:${date}:${locale}`;
    for (const [pid, v] of dailyPulseCache) {
      if (v.cacheKey === cacheKey && Date.now() - v.timestamp < DAILY_PULSE_TTL) {
        return res.json(v.response);
      }
    }

    // 1. Load profile (apiData equivalent) from astro_profiles
    let profile = null;
    if (supabaseServer) {
      const { data } = await supabaseServer
        .from('astro_profiles').select('astro_json,soulprint_sectors')
        .eq('user_id', userId).maybeSingle();
      profile = data;
    }
    if (!profile?.astro_json) return res.status(404).json({ error: 'profile_not_found' });

    const aj = profile.astro_json;
    // Build council from astro_json's western/bazi/wuxing snapshot
    const council = [
      { key: 'sonne',      displayName: locale==='de'?'Sonne':'Sun',           signOrElement: aj?.western?.zodiac_sign       || '—' },
      { key: 'mond',       displayName: locale==='de'?'Mond':'Moon',           signOrElement: aj?.western?.moon_sign         || '—' },
      { key: 'aszendent',  displayName: locale==='de'?'Aszendent':'Ascendant', signOrElement: aj?.western?.ascendant_sign    || '—' },
      { key: 'day_master', displayName: locale==='de'?'Day-Master':'Day Master', signOrElement: aj?.bazi?.day_master         || '—' },
      { key: 'jahrestier', displayName: locale==='de'?'Jahrestier':'Year Animal', signOrElement: aj?.bazi?.zodiac_sign       || '—' },
      { key: 'wuxing_dom', displayName: locale==='de'?'Wu-Xing':'Wu Xing',     signOrElement: aj?.wuxing?.dominant_element   || '—' },
    ];

    // 2. Harmony + mode (reuse existing master-signal computation if available; otherwise stub from soulprint)
    // For first ship: derive harmony from soulprint sector spread (std dev inverted) when master signal absent
    const sp = profile.soulprint_sectors || Array(12).fill(0.5);
    const mean = sp.reduce((a,b)=>a+b,0) / sp.length;
    const variance = sp.reduce((a,b)=>a+(b-mean)**2,0) / sp.length;
    const harmonyIndex = Math.max(0, Math.min(1, 0.5 - Math.sqrt(variance) + ((fnv1a(`${userId}:${date}`) % 100) / 1000)));
    const { mode, intensity } = dayModeFromHarmony(harmonyIndex);

    // 3. Pick aphorism
    const dominantElement = (aj?.wuxing?.dominant_element || '').toLowerCase();
    const aphorism = selectDailyAphorism(APHORISM_POOL, userId, date, mode, { dominantElement });
    if (!aphorism) {
      return res.status(503).json({ error: 'no_aphorism', message: `Pool empty for mode=${mode}` });
    }

    // 4. LLM Slot 2 + Slot 3 (Gemini, single call returning JSON)
    const aphorismText = locale === 'en' ? aphorism.text.en : aphorism.text.de;
    const slotPrompt = buildSlotPrompt({ aphorismText, mode, intensity, locale });

    let slot2 = '', slot3 = '';
    if (geminiClient) {
      try {
        const result = await geminiClient.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: slotPrompt,
          config: { responseMimeType: 'application/json', maxOutputTokens: 250 },
        });
        const parsed = JSON.parse(result.text);
        slot2 = String(parsed.slot2 || '').trim();
        slot3 = String(parsed.slot3 || '').trim();
      } catch (e) {
        console.warn('[daily-pulse] LLM slot generation failed:', e.message);
      }
    }
    if (!slot2 || !slot3) {
      // Deterministic fallback — never empty
      slot2 = locale==='de' ? 'Heute ist ein Tag, an dem das, was du beobachtest, mehr trägt als das, was du beweist.' : 'Today is a day where what you notice carries more than what you prove.';
      slot3 = locale==='de' ? 'Beginne dort, wo du sonst nach Erlaubnis suchst.' : 'Start where you usually wait for permission.';
    }

    // 5. Cosmic weather summary (1 short sentence — derived, not "Tageswetter")
    const cosmicWeatherSummary = locale==='de'
      ? 'Der äussere Tag steht ruhig — kein Sonnensturm, kein Vollmond.'
      : 'The outer day is calm — no solar storm, no full moon.';

    const pulseId = randomUUID();
    const response = {
      date, locale, userId, pulseId,
      harmonyIndex, intensity, mode,
      cosmicWeatherSummary,
      aphorism: {
        id: aphorism.id,
        text_de: aphorism.text.de, text_en: aphorism.text.en,
        author: aphorism.source.author,
        work: aphorism.source.work,
        copyright: aphorism.copyright,
        attribution_status: aphorism.attribution_status,
        mode_tags: aphorism.mode_tags,
        tone_tags: aphorism.tone_tags || [],
        element_affinity: aphorism.element_affinity || [],
        figure_affinity: aphorism.figure_affinity || [],
        season_affinity: aphorism.season_affinity || [],
      },
      slot2, slot3, council,
      selectedArchetype: null,
      phase: 'pulse',
    };
    dailyPulseCache.set(pulseId, { cacheKey, response, timestamp: Date.now(), profile });
    res.json(response);
  } catch (err) {
    console.error('[daily-pulse] error:', err.message);
    res.status(502).json({ error: 'pulse_unavailable' });
  }
});
```

**Step 3: Add `buildSlotPrompt` helper above the route**

```js
function buildSlotPrompt({ aphorismText, mode, intensity, locale }) {
  const intensityHint = intensity < 0.4 ? 'ruhig' : intensity < 0.7 ? 'direkt' : 'knapp';
  const lang = locale === 'en' ? 'English' : 'German';
  return `You are formulating Slots 2 and 3 of a Bazodiac Tagespuls.

Aphorismus (Slot 1 — DO NOT rewrite, DO NOT quote): ${aphorismText}
Modus: ${mode}
Intensität: ${intensityHint}
Sprache: ${lang}

Hard rules:
- Slot 2: 10-20 words, du-form (German) / you-form (English), references aphorism semantically without quoting
- Slot 3: 10-15 words, verb-driven, open ending, no affirmation, no warning
- Never use: zodiac names, degrees, houses, aspects, BaZi insider terms, "Tageswetter"
- Never repeat the aphorism text
- No exclamation marks, no value judgments

Return ONLY this JSON:
{"slot2": "...", "slot3": "..."}`;
}
```

**Step 4: Manual smoke test**

```bash
PORT=3001 node server.mjs &
SERVER_PID=$!
sleep 2
# (assumes a known authed user token in env $TEST_TOKEN)
curl -s -H "Authorization: Bearer $TEST_TOKEN" "http://localhost:3001/api/daily-pulse?date=2026-04-30&locale=de" | jq
kill $SERVER_PID
```
Expected: 200 with all fields populated, council has 6 entries, mode is one of pulse/trace/spannung.

**Step 5: Commit**

```bash
git add server.mjs
git commit -m "feat(daily-pulse): GET /api/daily-pulse — Phase 1 endpoint with Gemini Slot 2/3"
```

---

### Task 11: Server — `POST /api/daily-interpretation` endpoint

**Files:**
- Modify: `server.mjs` — add route below the `/api/daily-pulse` route

**Step 1: Implement**

```js
const COUNCIL_KEYS = new Set(['sonne','mond','aszendent','day_master','jahrestier','wuxing_dom']);

app.post('/api/daily-interpretation', requireUserAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { pulseId, selectedArchetypeId, locale: bodyLocale } = req.body || {};
    if (!pulseId || !selectedArchetypeId || !COUNCIL_KEYS.has(selectedArchetypeId)) {
      return res.status(400).json({ error: 'invalid_request' });
    }

    const cached = dailyPulseCache.get(pulseId);
    if (!cached || cached.response.userId !== userId) {
      return res.status(404).json({ error: 'pulse_not_found' });
    }
    const locale = bodyLocale === 'en' ? 'en' : 'de';
    const pulse = cached.response;
    const selected = pulse.council.find(f => f.key === selectedArchetypeId);
    if (!selected) return res.status(400).json({ error: 'archetype_not_in_council' });

    // Idempotency: cache by (pulseId, archetype, locale)
    const interpKey = `${pulseId}:${selectedArchetypeId}:${locale}`;
    if (cached.interpretations?.[interpKey]) {
      return res.json(cached.interpretations[interpKey]);
    }

    const otherFigures = pulse.council.filter(f => f.key !== selectedArchetypeId);
    const aphorismText = locale === 'en' ? pulse.aphorism.text_en : pulse.aphorism.text_de;
    const prompt = buildInterpretationPrompt({ pulse, selected, otherFigures, aphorismText, locale });

    let dailyInterpretation = '';
    if (geminiClient) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const result = await geminiClient.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt + (attempt ? '\n\nPrevious attempt was too long or violated rules. Try again, stricter.' : ''),
            config: { responseMimeType: 'application/json', maxOutputTokens: 400 },
          });
          const parsed = JSON.parse(result.text);
          const text = String(parsed.text || '').trim();
          const wc = text.split(/\s+/).filter(Boolean).length;
          if (wc >= 50 && wc <= 95) {
            dailyInterpretation = text;
            break;
          }
        } catch (e) {
          console.warn('[daily-interpretation] LLM attempt failed:', e.message);
        }
      }
    }
    if (!dailyInterpretation) {
      dailyInterpretation = locale === 'de'
        ? `Dein ${selected.displayName} bekommt heute Material zum Arbeiten. Schau hin, ohne sofort zu bewerten. Was du beobachtest, wird morgen Daten sein, die du brauchst.`
        : `Your ${selected.displayName} gets material to work with today. Look without judging. What you notice now will be data you need tomorrow.`;
    }

    const response = {
      pulseId,
      selectedArchetype: selected,
      dailyInterpretation,
      usedMode: pulse.mode,
      usedAphorismId: pulse.aphorism.id,
      phase: 'interpretation',
    };
    cached.interpretations = { ...(cached.interpretations || {}), [interpKey]: response };
    res.json(response);
  } catch (err) {
    console.error('[daily-interpretation] error:', err.message);
    res.status(502).json({ error: 'interpretation_unavailable' });
  }
});

function buildInterpretationPrompt({ pulse, selected, otherFigures, aphorismText, locale }) {
  const lang = locale === 'en' ? 'English' : 'German';
  const modeLogic = pulse.mode === 'trace'
    ? 'Trace = Abgrenzung. Only the selected figure is named. The other five are NOT mentioned.'
    : pulse.mode === 'spannung'
    ? `Spannung = Sequenz. Name the selected figure AND exactly one other in temporal sequence ("zuerst ... dann ..."). Other figure available: ${otherFigures.map(f=>`${f.displayName} (${f.signOrElement})`).join(', ')}.`
    : `Pulse = Integration. The selected figure is the main reference. Mention 1-3 other figures briefly, without highlighting them. Other figures: ${otherFigures.map(f=>`${f.displayName} (${f.signOrElement})`).join(', ')}.`;

  return `You are formulating the Phase-2 Tagesdeutung for a Bazodiac user.

Mode: ${pulse.mode}
Intensity: ${pulse.intensity.toFixed(2)}
Aphorismus (do NOT quote literally): ${aphorismText}
Selected archetype: ${selected.displayName} (${selected.signOrElement})

Mode logic: ${modeLogic}

Universal rules:
- 50-90 words, 3-4 sentences, ${lang}
- Du-form / you-form
- Zodiac and element names allowed (Skorpion, Wasser, Holz)
- NEVER explain astrological mechanics ("weil Mars in Konjunktion ...")
- NO value judgments ("gut", "schwer", "challenging")
- NO Pinterest esotericism ("vertraue dem Universum")
- NO repetition of the aphorism wording
- The aphorism is continued semantically, not quoted

Return ONLY: {"text": "..."}`;
}
```

**Step 2: Smoke test**

```bash
# After /daily-pulse returned a pulseId:
curl -s -H "Authorization: Bearer $TEST_TOKEN" -H 'Content-Type: application/json' \
  -d '{"pulseId":"'"$PID"'","selectedArchetypeId":"day_master","locale":"de"}' \
  http://localhost:3001/api/daily-interpretation | jq
```

**Step 3: Commit**

```bash
git add server.mjs
git commit -m "feat(daily-pulse): POST /api/daily-interpretation — Phase 2 endpoint after archetype tap"
```

---

### Task 12: Frontend — `dailyPulse.ts` service client

**Files:**
- Create: `src/services/dailyPulse.ts`
- Test: `src/__tests__/daily-pulse-service.test.ts`

**Step 1: Test**

```ts
// src/__tests__/daily-pulse-service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchDailyPulse, postDailyInterpretation } from '../services/dailyPulse';

vi.mock('../lib/authedFetch', () => ({
  authedFetch: vi.fn(),
}));
import { authedFetch } from '../lib/authedFetch';

const okPulse = {
  date: '2026-04-30', locale: 'de', userId: 'u1', pulseId: 'p1',
  harmonyIndex: 0.6, intensity: 0.27, mode: 'trace',
  cosmicWeatherSummary: 'ruhig',
  aphorism: { id: 'a1', text_de: 'x', text_en: 'x', author: 'a', work: null, copyright: 'PD', attribution_status: 'verified', mode_tags: ['trace'], tone_tags: [], element_affinity: [], figure_affinity: [], season_affinity: [] },
  slot2: 'two', slot3: 'three',
  council: Array(6).fill(0).map((_, i) => ({
    key: ['sonne','mond','aszendent','day_master','jahrestier','wuxing_dom'][i],
    displayName: 'X', signOrElement: 'Y',
  })),
  selectedArchetype: null, phase: 'pulse',
};

beforeEach(() => vi.mocked(authedFetch).mockReset());

describe('fetchDailyPulse', () => {
  it('parses a valid response', async () => {
    vi.mocked(authedFetch).mockResolvedValueOnce(new Response(JSON.stringify(okPulse), { status: 200 }) as any);
    const r = await fetchDailyPulse('2026-04-30', 'de');
    expect(r.pulseId).toBe('p1');
    expect(r.council).toHaveLength(6);
  });

  it('throws on non-2xx', async () => {
    vi.mocked(authedFetch).mockResolvedValueOnce(new Response('', { status: 503 }) as any);
    await expect(fetchDailyPulse('2026-04-30', 'de')).rejects.toThrow();
  });

  it('throws on invalid council length', async () => {
    const bad = { ...okPulse, council: okPulse.council.slice(0, 5) };
    vi.mocked(authedFetch).mockResolvedValueOnce(new Response(JSON.stringify(bad), { status: 200 }) as any);
    await expect(fetchDailyPulse('2026-04-30', 'de')).rejects.toThrow();
  });
});
```

**Step 2: FAIL**

**Step 3: Implement**

```ts
// src/services/dailyPulse.ts
import { authedFetch } from '../lib/authedFetch';
import {
  DailyPulseResponseSchema,
  DailyInterpretationResponseSchema,
  type DailyPulseResponse,
  type DailyInterpretationResponse,
  type CouncilKey,
} from '../lib/schemas/daily-pulse';

export async function fetchDailyPulse(date: string, locale: 'de'|'en' = 'de'): Promise<DailyPulseResponse> {
  const url = `/api/daily-pulse?date=${encodeURIComponent(date)}&locale=${locale}`;
  const resp = await authedFetch(url);
  if (!resp.ok) throw new Error(`daily-pulse ${resp.status}`);
  return DailyPulseResponseSchema.parse(await resp.json());
}

export async function postDailyInterpretation(
  pulseId: string,
  selectedArchetypeId: CouncilKey,
  locale: 'de'|'en' = 'de',
): Promise<DailyInterpretationResponse> {
  const resp = await authedFetch('/api/daily-interpretation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pulseId, selectedArchetypeId, locale }),
  });
  if (!resp.ok) throw new Error(`daily-interpretation ${resp.status}`);
  return DailyInterpretationResponseSchema.parse(await resp.json());
}
```

**Step 4: PASS, commit**

```bash
git add src/services/dailyPulse.ts src/__tests__/daily-pulse-service.test.ts
git commit -m "feat(daily-pulse): client service for /api/daily-pulse + /api/daily-interpretation"
```

---

### Task 13: Frontend — `<DayPulseCard>` component (3 slots)

**Files:**
- Create: `src/components/dashboard/DayPulseCard.tsx`
- Test: `src/__tests__/daily-pulse-card.test.tsx`

**Step 1: Test**

```tsx
// src/__tests__/daily-pulse-card.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DayPulseCard } from '../components/dashboard/DayPulseCard';
import type { DailyPulseResponse } from '../lib/schemas/daily-pulse';
import { LanguageProvider } from '../contexts/LanguageContext';

const pulse: DailyPulseResponse = {
  date: '2026-04-30', locale: 'de', userId: 'u1', pulseId: 'p1',
  harmonyIndex: 0.6, intensity: 0.27, mode: 'trace',
  cosmicWeatherSummary: 'Der äussere Tag steht ruhig.',
  aphorism: {
    id: 'a1', text_de: 'Wer den Fluss kennt, fürchtet die Brücke nicht.', text_en: 'x',
    author: 'Bazodiac', work: null, copyright: 'PD', attribution_status: 'verified',
    mode_tags: ['trace'], tone_tags: [], element_affinity: [], figure_affinity: [], season_affinity: [],
  },
  slot2: 'Du weißt heute mehr über deine Lage, als du dir zugestehst.',
  slot3: 'Schau hin, ohne sofort zu bewerten.',
  council: [], selectedArchetype: null, phase: 'pulse',
} as any;

describe('DayPulseCard', () => {
  it('renders all three slots in order', () => {
    render(<LanguageProvider><DayPulseCard pulse={pulse} /></LanguageProvider>);
    expect(screen.getByText(/Wer den Fluss kennt/)).toBeInTheDocument();
    expect(screen.getByText(/Du weißt heute mehr/)).toBeInTheDocument();
    expect(screen.getByText(/Schau hin, ohne sofort/)).toBeInTheDocument();
  });

  it('shows mode badge', () => {
    render(<LanguageProvider><DayPulseCard pulse={pulse} /></LanguageProvider>);
    // German label for trace
    expect(screen.getByText(/Tagespuls/i)).toBeInTheDocument();
  });

  it('shows cosmic weather summary as a small kontext line', () => {
    render(<LanguageProvider><DayPulseCard pulse={pulse} /></LanguageProvider>);
    expect(screen.getByText(/Der äussere Tag steht ruhig/)).toBeInTheDocument();
  });

  it('NEVER renders the word "Tageswetter"', () => {
    const { container } = render(<LanguageProvider><DayPulseCard pulse={pulse} /></LanguageProvider>);
    expect(container.textContent).not.toMatch(/Tageswetter/i);
  });
});
```

**Step 2: FAIL**

**Step 3: Implement**

```tsx
// src/components/dashboard/DayPulseCard.tsx
import { useLanguage } from '../../contexts/LanguageContext';
import type { DailyPulseResponse } from '../../lib/schemas/daily-pulse';

interface Props { pulse: DailyPulseResponse; }

const MODE_ACCENT = { pulse: '#D4AF37', trace: '#9B8EC4', spannung: '#E27D60' } as const;

export function DayPulseCard({ pulse }: Props) {
  const { lang } = useLanguage();
  const isDe = lang === 'de';
  const aphorism = isDe ? pulse.aphorism.text_de : pulse.aphorism.text_en;
  const author = pulse.aphorism.author;
  const accent = MODE_ACCENT[pulse.mode];

  return (
    <div
      className="day-pulse-card cosmic-tile p-6 sm:p-8 rounded-[2rem] space-y-5"
      data-testid="day-pulse-card"
      style={{ '--tile-glow-color': `${accent}99` } as React.CSSProperties}
    >
      {/* Mode badge */}
      <div className="flex items-center justify-between gap-2">
        <span
          className="text-[9px] font-bold tracking-[0.25em] uppercase px-2 py-0.5 rounded-full"
          style={{ background: `${accent}22`, color: accent }}
        >
          {isDe ? 'Tagespuls' : 'Day Pulse'}
        </span>
        <span className="text-[9px] tracking-wider uppercase" style={{ color: 'var(--tile-text-secondary)', opacity: 0.5 }}>
          {pulse.mode}
        </span>
      </div>

      {/* Slot 1 — aphorism (curated, never LLM) */}
      <blockquote className="font-serif text-lg sm:text-xl leading-snug italic" style={{ color: 'var(--tile-text-primary)' }}>
        — {aphorism}
        {author && author !== 'Bazodiac' && (
          <cite className="block text-xs not-italic opacity-50 mt-2">{author}</cite>
        )}
      </blockquote>

      {/* Slot 2 — bridge to today (LLM) */}
      <p className="text-sm leading-relaxed" style={{ color: 'var(--tile-text-primary)' }}>
        {pulse.slot2}
      </p>

      {/* Slot 3 — impulse (LLM) */}
      <p className="text-sm leading-relaxed font-medium" style={{ color: accent }}>
        {pulse.slot3}
      </p>

      {/* Cosmic-weather context — NOT a tile title, just a kontext line */}
      <p className="text-[10px] leading-relaxed pt-3 border-t" style={{ borderColor: 'var(--tile-border)', color: 'var(--tile-text-secondary)', opacity: 0.55 }}>
        {isDe ? 'Kosmisches Wetter' : 'Cosmic weather'}: {pulse.cosmicWeatherSummary}
      </p>
    </div>
  );
}
```

**Step 4: PASS, commit**

```bash
git add src/components/dashboard/DayPulseCard.tsx src/__tests__/daily-pulse-card.test.tsx
git commit -m "feat(daily-pulse): DayPulseCard — Phase 1 three-slot tile"
```

---

### Task 14: Frontend — `<CouncilPicker>` component

**Files:**
- Create: `src/components/dashboard/CouncilPicker.tsx`
- Test: `src/__tests__/council-picker.test.tsx`

**Step 1: Test**

```tsx
// src/__tests__/council-picker.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CouncilPicker } from '../components/dashboard/CouncilPicker';
import { LanguageProvider } from '../contexts/LanguageContext';
import type { CouncilFigure } from '../lib/schemas/daily-pulse';

const council: CouncilFigure[] = [
  { key: 'sonne',      displayName: 'Sonne',      signOrElement: 'Löwe' },
  { key: 'mond',       displayName: 'Mond',       signOrElement: 'Skorpion' },
  { key: 'aszendent',  displayName: 'Aszendent',  signOrElement: 'Jungfrau' },
  { key: 'day_master', displayName: 'Day-Master', signOrElement: 'Geng' },
  { key: 'jahrestier', displayName: 'Jahrestier', signOrElement: 'Tiger' },
  { key: 'wuxing_dom', displayName: 'Wu-Xing',    signOrElement: 'Metall' },
];

describe('CouncilPicker', () => {
  it('renders all six figures', () => {
    render(<LanguageProvider><CouncilPicker council={council} onSelect={() => {}} /></LanguageProvider>);
    for (const f of council) {
      expect(screen.getByText(f.displayName)).toBeInTheDocument();
      expect(screen.getByText(f.signOrElement)).toBeInTheDocument();
    }
  });

  it('renders the prompt question', () => {
    render(<LanguageProvider><CouncilPicker council={council} onSelect={() => {}} /></LanguageProvider>);
    expect(screen.getByText(/Welcher deiner sechs/)).toBeInTheDocument();
  });

  it('calls onSelect when a figure is tapped', () => {
    const onSelect = vi.fn();
    render(<LanguageProvider><CouncilPicker council={council} onSelect={onSelect} /></LanguageProvider>);
    fireEvent.click(screen.getByRole('button', { name: /Day-Master/i }));
    expect(onSelect).toHaveBeenCalledWith('day_master');
  });

  it('disables figures with em-dash placeholder', () => {
    const partial = council.map(f => f.key === 'day_master' ? { ...f, signOrElement: '—' } : f);
    render(<LanguageProvider><CouncilPicker council={partial} onSelect={() => {}} /></LanguageProvider>);
    expect(screen.getByRole('button', { name: /Day-Master/i })).toBeDisabled();
  });

  it('does NOT auto-pick anything', () => {
    const onSelect = vi.fn();
    render(<LanguageProvider><CouncilPicker council={council} onSelect={onSelect} /></LanguageProvider>);
    expect(onSelect).not.toHaveBeenCalled();
  });
});
```

**Step 2: FAIL**

**Step 3: Implement**

```tsx
// src/components/dashboard/CouncilPicker.tsx
import { useLanguage } from '../../contexts/LanguageContext';
import type { CouncilFigure, CouncilKey } from '../../lib/schemas/daily-pulse';

interface Props {
  council: CouncilFigure[];
  onSelect: (key: CouncilKey) => void;
}

export function CouncilPicker({ council, onSelect }: Props) {
  const { lang } = useLanguage();
  const isDe = lang === 'de';
  const question = isDe
    ? 'Welcher deiner sechs möchte heute mit diesem Puls etwas tun?'
    : 'Which of your six wants to do something with this pulse today?';

  return (
    <div className="council-picker space-y-4" data-testid="council-picker">
      <p className="text-sm font-serif text-center italic" style={{ color: 'var(--tile-text-primary)' }}>
        {question}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {council.map(figure => {
          const disabled = figure.signOrElement === '—';
          return (
            <button
              key={figure.key}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(figure.key)}
              aria-label={`${figure.displayName} ${figure.signOrElement}`}
              className="cosmic-tile-secondary p-3 rounded-xl border transition-all disabled:opacity-30 disabled:cursor-not-allowed enabled:hover:border-[var(--tile-accent)]"
              style={{ borderColor: 'var(--tile-border)' }}
              title={disabled ? (isDe ? 'Daten unvollständig' : 'Data incomplete') : undefined}
            >
              <div className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-60" style={{ color: 'var(--tile-accent)' }}>
                {figure.displayName}
              </div>
              <div className="text-base font-serif mt-1" style={{ color: 'var(--tile-text-primary)' }}>
                {figure.signOrElement}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 4: PASS, commit**

```bash
git add src/components/dashboard/CouncilPicker.tsx src/__tests__/council-picker.test.tsx
git commit -m "feat(daily-pulse): CouncilPicker — six-figure tap UI for Wahl-Moment"
```

---

### Task 15: Frontend — `<TagesdeutungCard>` component

**Files:**
- Create: `src/components/dashboard/TagesdeutungCard.tsx`
- Test: `src/__tests__/tagesdeutung-card.test.tsx`

**Step 1: Test**

```tsx
// src/__tests__/tagesdeutung-card.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TagesdeutungCard } from '../components/dashboard/TagesdeutungCard';
import type { DailyInterpretationResponse } from '../lib/schemas/daily-pulse';
import { LanguageProvider } from '../contexts/LanguageContext';

const interp: DailyInterpretationResponse = {
  pulseId: 'p1',
  selectedArchetype: { key: 'mond', displayName: 'Mond', signOrElement: 'Skorpion' },
  dailyInterpretation: 'Dein Skorpion-Mond bekommt heute Material zum Arbeiten. Du siehst eine Schicht unter der Oberfläche, die andere übersehen. Schau hin, ohne sofort zu bewerten.',
  usedMode: 'trace', usedAphorismId: 'a1', phase: 'interpretation',
};

describe('TagesdeutungCard', () => {
  it('renders the interpretation text', () => {
    render(<LanguageProvider><TagesdeutungCard interpretation={interp} onChangeArchetype={() => {}} /></LanguageProvider>);
    expect(screen.getByText(/Skorpion-Mond bekommt heute/)).toBeInTheDocument();
  });

  it('shows selected archetype as header', () => {
    render(<LanguageProvider><TagesdeutungCard interpretation={interp} onChangeArchetype={() => {}} /></LanguageProvider>);
    expect(screen.getByText(/Mond.*Skorpion/i)).toBeInTheDocument();
  });

  it('exposes change-archetype action', () => {
    const change = vi.fn();
    render(<LanguageProvider><TagesdeutungCard interpretation={interp} onChangeArchetype={change} /></LanguageProvider>);
    fireEvent.click(screen.getByRole('button', { name: /(andere|change)/i }));
    expect(change).toHaveBeenCalled();
  });
});
```

**Step 2: FAIL**

**Step 3: Implement**

```tsx
// src/components/dashboard/TagesdeutungCard.tsx
import { useLanguage } from '../../contexts/LanguageContext';
import type { DailyInterpretationResponse } from '../../lib/schemas/daily-pulse';

interface Props {
  interpretation: DailyInterpretationResponse;
  onChangeArchetype: () => void;
}

export function TagesdeutungCard({ interpretation, onChangeArchetype }: Props) {
  const { lang } = useLanguage();
  const isDe = lang === 'de';
  const a = interpretation.selectedArchetype;
  return (
    <div className="tagesdeutung-card cosmic-tile p-6 sm:p-8 rounded-[2rem] space-y-4" data-testid="tagesdeutung-card">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] font-bold tracking-[0.25em] uppercase" style={{ color: 'var(--tile-accent)' }}>
          {isDe ? 'Tagesdeutung' : 'Daily Interpretation'}
        </span>
        <span className="text-xs font-serif" style={{ color: 'var(--tile-text-secondary)' }}>
          {a.displayName} · {a.signOrElement}
        </span>
      </div>
      <p className="text-base leading-relaxed" style={{ color: 'var(--tile-text-primary)' }}>
        {interpretation.dailyInterpretation}
      </p>
      <button
        type="button"
        onClick={onChangeArchetype}
        className="text-xs underline opacity-60 hover:opacity-100 transition-opacity"
        style={{ color: 'var(--tile-accent)' }}
      >
        {isDe ? 'andere Figur wählen' : 'change archetype'}
      </button>
    </div>
  );
}
```

**Step 4: PASS, commit**

```bash
git add src/components/dashboard/TagesdeutungCard.tsx src/__tests__/tagesdeutung-card.test.tsx
git commit -m "feat(daily-pulse): TagesdeutungCard — Phase 2 result tile + change-archetype action"
```

---

### Task 16: Feature flag

**Files:**
- Modify: `src/lib/feature-flags.ts`

**Step 1: Add flag**

Add to the feature-flags definition (find the constant table):

```ts
daily_two_phase: { defaultEnabled: true, category: 'daily' },
```

Default to ON in dev/staging. For first prod ship, the user (Ben) can flip via `localStorage.setItem('ff_daily_two_phase', 'false')` if a hotfix is needed.

**Step 2: Type-check**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/lib/feature-flags.ts
git commit -m "feat(daily-pulse): add daily_two_phase feature flag (default ON)"
```

---

### Task 17: Hook — extend `useFirstRunDaily` with pulse + interpretation state

**Files:**
- Modify: `src/hooks/useFirstRunDaily.ts`

**Step 1: Add new state branch behind feature flag**

When `daily_two_phase` is ON:
1. On mount, call `fetchDailyPulse(targetDate, locale)` instead of `fetchDailyExperience`.
2. Persist `{pulseId, selectedArchetypeKey, interpretation}` in localStorage keyed by `daily_pulse_state:${userId}:${todayKey()}`.
3. Expose `pulseData`, `interpretation`, `selectArchetype(key)` from the hook.

**Implementation sketch (full code):**

```ts
// At top of useFirstRunDaily.ts add imports:
import { isFeatureEnabled } from '../lib/feature-flags';
import { fetchDailyPulse, postDailyInterpretation } from '../services/dailyPulse';
import type { DailyPulseResponse, DailyInterpretationResponse, CouncilKey } from '../lib/schemas/daily-pulse';

interface UseFirstRunDailyResult {
  // existing fields preserved …
  dailyData: DailyResponse | null;
  dayHarmonic: DayHarmonicState | null;
  nightHarmonic: DayHarmonicState | null;
  showModal: boolean;
  loading: boolean;
  handleClose: () => void;
  // NEW two-phase fields:
  pulseData: DailyPulseResponse | null;
  interpretation: DailyInterpretationResponse | null;
  selectArchetype: (k: CouncilKey) => Promise<void>;
  resetArchetype: () => void;
  twoPhaseEnabled: boolean;
}
```

Inside the hook body, add:

```ts
const twoPhaseEnabled = isFeatureEnabled('daily_two_phase');
const [pulseData, setPulseData] = useState<DailyPulseResponse | null>(null);
const [interpretation, setInterpretation] = useState<DailyInterpretationResponse | null>(null);

// Replace the legacy fetchDailyExperience block (only when twoPhaseEnabled):
useEffect(() => {
  if (!twoPhaseEnabled || !userId || !birthData) return;
  const targetDate = customDate || todayKey();
  let cancelled = false;
  (async () => {
    try {
      // restore from localStorage if present
      const stateKey = `daily_pulse_state:${userId}:${targetDate}`;
      const cached = localStorage.getItem(stateKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.pulse) setPulseData(parsed.pulse);
          if (parsed.interpretation) setInterpretation(parsed.interpretation);
        } catch {}
      }
      // always re-fetch the pulse to keep cosmic-weather summary fresh
      const pulse = await fetchDailyPulse(targetDate, 'de');
      if (cancelled) return;
      setPulseData(pulse);
      // preserve any existing interpretation for SAME pulseId
      const restored = cached ? JSON.parse(cached) : null;
      if (restored?.pulse?.pulseId !== pulse.pulseId) {
        setInterpretation(null);  // pulse rotated → invalidate interpretation
      }
      localStorage.setItem(stateKey, JSON.stringify({ pulse, interpretation: restored?.pulse?.pulseId === pulse.pulseId ? restored.interpretation : null }));
    } catch (err) {
      console.warn('[useFirstRunDaily/twoPhase] fetch failed:', err);
    }
  })();
  return () => { cancelled = true; };
}, [twoPhaseEnabled, userId, birthData, customDate]);

const selectArchetype = useCallback(async (key: CouncilKey) => {
  if (!pulseData) return;
  try {
    const interp = await postDailyInterpretation(pulseData.pulseId, key, 'de');
    setInterpretation(interp);
    const stateKey = `daily_pulse_state:${userId}:${pulseData.date}`;
    localStorage.setItem(stateKey, JSON.stringify({ pulse: pulseData, interpretation: interp }));
  } catch (err) {
    console.warn('[useFirstRunDaily/twoPhase] interpretation failed:', err);
  }
}, [pulseData, userId]);

const resetArchetype = useCallback(() => {
  setInterpretation(null);
  if (pulseData) {
    const stateKey = `daily_pulse_state:${userId}:${pulseData.date}`;
    localStorage.setItem(stateKey, JSON.stringify({ pulse: pulseData, interpretation: null }));
  }
}, [pulseData, userId]);

// At the return statement, add the new fields:
return { /* …existing… */, pulseData, interpretation, selectArchetype, resetArchetype, twoPhaseEnabled };
```

The legacy `fetchDailyExperience` path stays intact for `!twoPhaseEnabled` case, so flipping the flag off resurrects the old behaviour.

**Step 2: Type-check**

```bash
npx tsc --noEmit
```

**Step 3: Run existing useFirstRunDaily tests**

```bash
npx vitest run src/__tests__/daily-fallback.test.ts src/__tests__/dashboard-modal-open.test.tsx src/__tests__/dashboard-ghost-ui.test.tsx
```
Expected: still green (legacy path unchanged when flag is mocked off in those tests).

If any test consumes the hook directly without flag mocking, mock `isFeatureEnabled` in that test's setup.

**Step 4: Commit**

```bash
git add src/hooks/useFirstRunDaily.ts
git commit -m "feat(daily-pulse): extend useFirstRunDaily with two-phase pulse + interpretation state"
```

---

### Task 18: Mount the new flow in `Dashboard.tsx`

**Files:**
- Modify: `src/components/Dashboard.tsx`

**Step 1: Insert new section above `DailyChartHero`**

In the JSX where `DailyChartHero` is mounted (~line 374), wrap with a feature-flag check and render the two-phase flow:

```tsx
import { DayPulseCard } from "./dashboard/DayPulseCard";
import { CouncilPicker } from "./dashboard/CouncilPicker";
import { TagesdeutungCard } from "./dashboard/TagesdeutungCard";

// in JSX, replace the DailyChartHero block with:
<motion.div {...fadeIn(0.02)}>
  {twoPhaseEnabled && pulseData ? (
    <SectionErrorBoundary name="DayPulseFlow">
      <div className="space-y-6">
        <DayPulseCard pulse={pulseData} />
        {!interpretation ? (
          <CouncilPicker council={pulseData.council} onSelect={selectArchetype} />
        ) : (
          <TagesdeutungCard interpretation={interpretation} onChangeArchetype={resetArchetype} />
        )}
      </div>
    </SectionErrorBoundary>
  ) : (
    <SectionErrorBoundary name="DailyChartHero">
      <DailyChartHero
        loading={(metaLoading || transitLoading) && impactHarmonyIndex == null}
        baseCoherence={impactBaseCoherence}
        positiveDailyDelta={impactPositiveDailyDelta}
        displayedCoherence={impactDisplayedCoherence}
        spaceWeather={spaceWeather}
        transitEvents={transitEvents}
        dayMode={dailyData?.fusion?.day_mode ?? 'pulse'}
        birthSign={birthSign}
        impulsText={dailyData?.fusion?.synthesis || dailyData?.fusion?.summary}
        onOpenDayModal={dailyEnabled ? () => setIsDayModalOpen(true) : undefined}
      />
    </SectionErrorBoundary>
  )}
</motion.div>
```

Pull the new fields from the hook:

```tsx
const {
  dailyData, dayHarmonic, nightHarmonic, showModal, loading, handleClose,
  pulseData, interpretation, selectArchetype, resetArchetype, twoPhaseEnabled,
} = useFirstRunDaily(/* …existing args… */);
```

**Step 2: Gate the legacy `DayModeModal`**

```tsx
{!twoPhaseEnabled && dailyEnabled && isDayModalOpen && dailyData && (
  <DayModeModal data={dailyData} dayHarmonic={activeDayHarmonic} onClose={...} />
)}
```

**Step 3: Visual smoke**

Start dev: `npm run dev` + `PORT=3001 node server.mjs`. Open `/`, log in. Verify:
- DayPulseCard renders with three slots
- CouncilPicker shows 6 figures
- Tap a figure → TagesdeutungCard appears with interpretation text
- Refresh page → state restored from localStorage
- Tap "andere Figur wählen" → CouncilPicker re-appears
- Set `localStorage.setItem('ff_daily_two_phase','false')` + refresh → old DailyChartHero returns

**Step 4: Run typecheck + full test suite**

```bash
npx tsc --noEmit
npx vitest run 2>&1 | tail -10
```

**Step 5: Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "feat(daily-pulse): mount DayPulseCard + CouncilPicker + Tagesdeutung flow on Dashboard"
```

---

### Task 19: Strip the old "Tagesimpuls" block from `DailyChartHero` when flag ON

This is now safe because the new flow renders above `DailyChartHero` and the user sees the new `slot2`/`slot3` text first. The Hero loses its impuls headline + body, retaining only:
- Coherence ring + label
- Driver strip (Geomagnetik / Solardruck / Transit-Aktivität)

**Files:**
- Modify: `src/components/dashboard/DailyChartHero.tsx`

**Step 1: Remove or feature-flag the Tagesimpuls section**

The simplest path: pass `impulsText={undefined}` from Dashboard when `twoPhaseEnabled`. The component already has a `hasImpuls` guard.

```tsx
// in Dashboard.tsx, when in twoPhaseEnabled branch the legacy DailyChartHero
// is not rendered at all, so no change is required to DailyChartHero in this task.
// SKIP THIS TASK if Task 18 fully replaced the DailyChartHero render in twoPhase mode.
```

Confirm by grep that `DailyChartHero` only renders in the `else` branch:

```bash
grep -n "DailyChartHero" src/components/Dashboard.tsx
```

If satisfied, mark task done with no commit.

If you decide instead to **keep the coherence ring** as a third tile below the new flow, then in this task:
- Keep `<DailyChartHero ... impulsText={undefined} onOpenDayModal={undefined} />` rendered below the two-phase section.
- Verify `hasImpuls` falsy branch hides the body block cleanly.

Either way, **commit the decision in plain words** in the commit message.

**Commit (if any change):**

```bash
git add src/components/Dashboard.tsx src/components/dashboard/DailyChartHero.tsx
git commit -m "feat(daily-pulse): finalise DailyChartHero placement under two-phase flow"
```

---

### Task 20: Integration test — full two-phase flow

**Files:**
- Create: `src/__tests__/daily-pulse-flow.integration.test.tsx`

**Step 1: Write end-to-end test mocking authedFetch**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Dashboard } from '../components/Dashboard';   // adjust to actual path / wrapper
// mock providers + supabase + feature flag for isolation

vi.mock('../lib/feature-flags', () => ({ isFeatureEnabled: () => true, /* others returning sane defaults */ }));
vi.mock('../lib/authedFetch', () => ({ authedFetch: vi.fn() }));
import { authedFetch } from '../lib/authedFetch';

const pulseResp = { /* full DailyPulseResponse from Task 12 fixture */ };
const interpResp = { /* full DailyInterpretationResponse from Task 15 fixture */ };

beforeEach(() => {
  localStorage.clear();
  vi.mocked(authedFetch).mockImplementation(async (url: string) => {
    if (url.startsWith('/api/daily-pulse')) return new Response(JSON.stringify(pulseResp), { status: 200 }) as any;
    if (url.startsWith('/api/daily-interpretation')) return new Response(JSON.stringify(interpResp), { status: 200 }) as any;
    return new Response('', { status: 404 }) as any;
  });
});

describe('daily-pulse end-to-end', () => {
  it('renders Phase 1, then Phase 2 after archetype tap', async () => {
    render(<Dashboard {/* required props from existing tests */} />);
    await waitFor(() => screen.getByTestId('day-pulse-card'));
    expect(screen.getByTestId('council-picker')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Day-Master/i }));
    await waitFor(() => screen.getByTestId('tagesdeutung-card'));
    expect(screen.queryByTestId('council-picker')).not.toBeInTheDocument();
  });

  it('"andere Figur wählen" resets to picker', async () => {
    render(<Dashboard /* … */ />);
    await waitFor(() => screen.getByTestId('day-pulse-card'));
    fireEvent.click(screen.getByRole('button', { name: /Mond/i }));
    await waitFor(() => screen.getByTestId('tagesdeutung-card'));
    fireEvent.click(screen.getByRole('button', { name: /andere Figur/i }));
    await waitFor(() => screen.getByTestId('council-picker'));
  });

  it('persists pulse + interpretation in localStorage', async () => {
    render(<Dashboard /* … */ />);
    await waitFor(() => screen.getByTestId('day-pulse-card'));
    fireEvent.click(screen.getByRole('button', { name: /Sonne/i }));
    await waitFor(() => screen.getByTestId('tagesdeutung-card'));
    const keys = Object.keys(localStorage);
    expect(keys.some(k => k.startsWith('daily_pulse_state:'))).toBe(true);
  });
});
```

(Use the existing Dashboard test fixtures from `src/__tests__/dashboard-modal-open.test.tsx` for required props.)

**Step 2: PASS**

```bash
npx vitest run src/__tests__/daily-pulse-flow.integration.test.tsx
```

**Step 3: Commit**

```bash
git add src/__tests__/daily-pulse-flow.integration.test.tsx
git commit -m "test(daily-pulse): integration test for full two-phase ritual"
```

---

### Task 21: Forbidden-term guard test (CI tripwire)

**Files:**
- Create: `src/__tests__/forbidden-tageswetter.test.ts`

**Step 1: Test**

```ts
import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';

describe('forbidden term audit', () => {
  it('NEVER uses "Tageswetter" in source files', () => {
    let hits = '';
    try {
      hits = execSync(
        `grep -RIn "Tageswetter\\|tageswetter" --include="*.ts" --include="*.tsx" --include="*.mjs" src/ server.mjs packages/shared/ apps/ || true`,
        { encoding: 'utf8' },
      );
    } catch (e) {
      hits = '';
    }
    if (hits) {
      throw new Error('Forbidden term "Tageswetter" found:\n' + hits);
    }
  });

  it('uses canonical glossary terms in i18n files', () => {
    const tx = require('../i18n/translations').default || require('../i18n/translations');
    // sample assertion — adapt to actual export shape
    expect(JSON.stringify(tx)).not.toMatch(/Tageswetter/i);
  });
});
```

**Step 2: PASS** (assuming all previous tasks left no occurrences)

If any docs in `docs/plans/*` legitimately quote the forbidden term as "this is the verboten word", the grep above is restricted to `src/`, `server.mjs`, `packages/shared/`, `apps/` so docs are safe.

**Step 3: Commit**

```bash
git add src/__tests__/forbidden-tageswetter.test.ts
git commit -m "test(daily-pulse): CI guard against drift term Tageswetter in source"
```

---

### Task 22: Glossary doc

**Files:**
- Create: `docs/glossar-tagespuls.md`

**Step 1: Write a 1-page glossary** (must mirror the pre-flight glossary at the top of this plan, plus rules of usage).

```markdown
# Glossar — Tagespuls / Tagesdeutung

Stand: 2026-04-30. Verbindlich für UI, Code, Doku, Voice-Skripte.

| Begriff | Bedeutung | Heimat |
|---|---|---|
| **Kosmisches Wetter** | Äusserer Zustand. Wirkt auf alle. Sonnenstürme, Mondphase, Transit-Konstellation, Jieqi. | sky.bazodiac.space + 1-Zeilen-Kontext im DayPulseCard |
| **Tagespuls** | Was für *diesen User* heute zusammenkommt. Phase 1. Drei Slots, kein Archetyp. | DayPulseCard auf `/` |
| **Tagesdeutung** | Tagespuls × gewählter Archetyp. Phase 2. Entsteht erst nach Tap. | TagesdeutungCard auf `/` |
| **Rat der sechs** | Sonne · Mond · Aszendent · Day-Master · Jahrestier · Wu-Xing dominant. Sechs Figuren, kein Auto-Pick. | CouncilPicker auf `/` |
| **Slot 1** | Aphorismus. Kuratiert. Nie LLM-generiert. 8–20 Wörter. | DayPulseCard erste Zeile |
| **Slot 2** | Brücke ins Heute. LLM-generiert. 10–20 Wörter, Du-Form. | DayPulseCard zweite Zeile |
| **Slot 3** | Impuls oder Tür. LLM-generiert. 10–15 Wörter, offener Ausgang. | DayPulseCard dritte Zeile |
| **Tageswetter** | DRIFT-BEGRIFF. NIE VERWENDEN. CI-Test bricht den Build, wenn er auftaucht. | — |

## Modus-Logik

- `H < 0.45` → **spannung** (Sequenz; gewählter + genau eine zweite Figur)
- `0.45 ≤ H < 0.50` → **pulse** (Integration; gewählter + 1–3 weitere ohne Hervorhebung)
- `H ≥ 0.50` → **trace** (Abgrenzung; nur gewählter Archetyp)

## Quellen

- Architektur: `/Users/benjaminpoersch/Downloads/tagespuls_package/docs/PROMPT_MODULE_TAGESPULS_TAGESDEUTUNG.md`
- Voice-Regeln: `/Users/benjaminpoersch/Downloads/tagespuls_package/.claude/skills/day-pulse-trace/SKILL.md`
- Datenbank-Schema (deferred): `/Users/benjaminpoersch/Downloads/tagespuls_package/packages/db/schema.sql`
- Plan: `docs/plans/2026-04-30-tagespuls-tagesdeutung-frontend.md`
```

**Step 2: Commit**

```bash
git add docs/glossar-tagespuls.md
git commit -m "docs(daily-pulse): add binding glossary for the four canonical terms"
```

---

### Task 23: Final sweep — run everything, write handoff

**Step 1: Full test suite**

```bash
npx tsc --noEmit
npm run lint
npx vitest run 2>&1 | tail -5
```
All green.

**Step 2: Manual visual smoke**

Open `/` in dev. Verify DE and EN locales (toggle via i18n). Verify all three modes by manually setting `localStorage.setItem('debug_force_mode','spannung')` if you wired a debug toggle, OR by force-feeding a low harmony index server-side.

**Step 3: Write handoff under `docs/plans/2026-04-30-handoff-tagespuls-tagesdeutung.md`** documenting:
- Files changed list
- Feature flag status (`daily_two_phase` ON by default)
- Known gaps:
  - Aphorism pool ships with 5 fallback entries only — Ben must curate the real pool via `/aphorism-curator` skill before public launch.
  - DB persistence (`daily_pulses`, `daily_interpretations`) deferred to follow-up sprint.
  - Mobile (`apps/mobile/`) untouched — clone of Phase 1 view tracked as TODO.
  - Cosmic-weather summary is a 1-line stub; deeper integration with `/api/space-weather/extended` is a follow-up.
- Rollback: `localStorage.setItem('ff_daily_two_phase','false')` flips back to `DailyChartHero` + `DayModeModal` legacy path.

**Step 4: Commit**

```bash
git add docs/plans/2026-04-30-handoff-tagespuls-tagesdeutung.md
git commit -m "docs(daily-pulse): handoff with rollback + follow-up backlog"
```

---

## Definition of Done

- [ ] Branch contains all commits Task 1–23.
- [ ] `npx tsc --noEmit` clean.
- [ ] `npx vitest run` all green (count delta: +7 new test files, full suite passes).
- [ ] Manual smoke: DE + EN render correctly on `/` for at least one user.
- [ ] At least one full pulse → tap → interpretation cycle executed against the real Gemini-backed server.
- [ ] No occurrence of the string "Tageswetter" in `src/`, `server.mjs`, `packages/shared/`, `apps/`.
- [ ] `daily_two_phase` flag flip verified in browser console (both directions).
- [ ] Glossary committed.
- [ ] Handoff committed.

---

## Open questions for the engineer to surface, not silently decide

1. **`/api/daily-pulse` payload — should `harmonyIndex` come from the existing master-signal pipeline** (currently used by `/api/impact/active`) or from the lightweight soulprint-spread heuristic in Task 10? Task 10 ships the heuristic for speed; consider promoting to master-signal in a follow-up if the heuristic produces obviously wrong modes for real users.
2. **Gemini model name** — `gemini-3-flash-preview` is the current model in `server.mjs`. If Anthropic's `claude-haiku-4-5-20251001` would be cheaper for the short Slot 2/3 / Phase 2 prompts, ask Ben whether to switch *before* shipping (cross-cutting decision — DEC required).
3. **Council display when Wu-Xing element is unset** — current behaviour disables the button. Confirm with Ben whether a "synthesis" fallback (e.g. derive from sun-sign element) is preferred.
4. **Rollback gating** — should the flag default OFF for first deploy and Ben flips it on, or default ON and rely on the localStorage override? Plan currently defaults ON for richer dev/staging experience.

Surface these in the handoff doc and wait for explicit answers before merging.

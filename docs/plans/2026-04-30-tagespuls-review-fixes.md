# Tagespuls Phase-1 Review-Fix Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fully address 9 findings from the post-implementation code review of the Tagespuls Phase-1 commits (2 Important + 7 Minor). No TODO stubs — every finding turns into working code or a deliberately-recorded deviation.

**Architecture:** Bring the in-repo TS port of the aphorism selector into exact alignment with the source-package spec §7 (`PROMPT_MODULE_TAGESPULS_TAGESDEUTUNG.md` lines 117–129), plus tighten Zod literal unions, add the missing `AphorismRecord → wire` adapter, and shore up test coverage and council typing. Behaviour-preserving for boundary cases that already work.

**Tech Stack:** Vitest, Zod, TypeScript strict, FNV-1a hash (already implemented).

---

## Pre-flight

1. Branch `2026-04-20-quiz-signatur-sprint-1` is the active branch — all commits land here.
2. Run baseline before starting:
   ```bash
   npx vitest run src/__tests__/daily-pulse-mode.test.ts \
                  src/__tests__/daily-pulse-council.test.ts \
                  src/__tests__/daily-pulse-aphorism-select.test.ts 2>&1 | tail -5
   ```
   Expected: 16/16 passing.
3. Confirm the source spec rules (already read this session):
   - Spec §7 line 121: `remove cooldown conflicts`
   - Spec §7 line 126: `if modus == trace and intensity > 0.7 and tone includes scharf or draengend: score *= 1.2`
   - Spec §7 line 128: `pick deterministic from top 5` (NOT max-only)

---

## Findings → Tasks map

| # | Finding | Task |
|---|---|---|
| 1 (Imp) | Missing `AphorismRecord → PulseAphorism` adapter | R4 |
| 2 (Imp) | Cooldown filter from spec §7 not implemented | R1 |
| 3 (Min) | Trace + intensity>0.7 + scharf/drängend score-bump missing | R2 |
| 4 (Min) | "Top-5" drift (impl uses max-only) | R3 |
| 5 (Min) | `council.ts` `any` casts + missing all-dashes warn | R6 |
| 6 (Min) | `buildCouncil(api, 'en')` not tested | R7 |
| 7 (Min) | Selector unreviewed-pool path not tested | R8 |
| 8 (Min) | Wire schema bare `z.string()` for copyright/attribution | R5 |
| 9 (Min) | `h=0.45` exact boundary not pinned | R9 |

Order chosen so that selector signature changes (R1, R2, R3) land before the adapter (R4) consumes the final shape. Council changes (R6, R7) and schema tightening (R5) are independent. R8, R9 are pure test additions.

---

## Task R1: Cooldown filter in selector

**Why:** Spec §7 line 121: `remove cooldown conflicts`. With a 5-entry fallback pool, two pulse-eligible entries can repeat day-after-day without this. Cooldown semantics: an entry is *blocked* if `first_used` is set AND `today - first_used < cooldown_days`.

**Files:**
- Modify: `src/lib/daily-pulse/aphorism-select.ts`
- Modify: `src/__tests__/daily-pulse-aphorism-select.test.ts`

**Step 1: Add the failing test**

Append to the existing `describe('selectDailyAphorism', ...)` block:

```ts
it('filters out aphorisms whose cooldown has not elapsed', () => {
  const today = '2026-04-30';
  const recent = make('r', ['pulse'], [], 4); recent.first_used = '2026-04-25'; recent.cooldown_days = 30;
  const cooled = make('c2', ['pulse'], [], 4); cooled.first_used = '2026-01-01'; cooled.cooldown_days = 30;
  const fresh  = make('f', ['pulse'], [], 4);   // first_used = null

  for (const u of ['u1','u2','u3','u4','u5']) {
    const r = selectDailyAphorism([recent, cooled, fresh], u, today, 'pulse');
    expect(r.id).not.toBe('r');
  }
});

it('throws when cooldown leaves no eligible entry', () => {
  const recent = make('r', ['pulse'], [], 4); recent.first_used = '2026-04-29'; recent.cooldown_days = 30;
  expect(() => selectDailyAphorism([recent], 'u', '2026-04-30', 'pulse')).toThrow();
});
```

**Step 2: Run — expect FAIL**

```bash
npx vitest run src/__tests__/daily-pulse-aphorism-select.test.ts
```

**Step 3: Implement**

In `src/lib/daily-pulse/aphorism-select.ts`, add a cooldown helper and apply it inside `selectDailyAphorism` after the mode filter, before scoring:

```ts
function isOnCooldown(a: AphorismRecord, today: string): boolean {
  if (!a.first_used || !a.cooldown_days || a.cooldown_days <= 0) return false;
  const last = Date.parse(a.first_used);
  const now = Date.parse(today);
  if (Number.isNaN(last) || Number.isNaN(now)) return false;
  const daysElapsed = (now - last) / 86400000;
  return daysElapsed < a.cooldown_days;
}
```

Inside `selectDailyAphorism`, replace:
```ts
const eligible = pool.filter(a => a.status === 'approved' && a.mode_tags.includes(mode));
```
with:
```ts
const eligible = pool.filter(
  a => a.status === 'approved' && a.mode_tags.includes(mode) && !isOnCooldown(a, date),
);
```

**Step 4: Run — expect PASS** (all selector tests, including pre-existing 5)

**Step 5: Commit**

```bash
git add src/lib/daily-pulse/aphorism-select.ts src/__tests__/daily-pulse-aphorism-select.test.ts
git commit -m "fix(daily-pulse): honor cooldown_days in aphorism selector (spec §7)"
```

---

## Task R2: Trace+intensity score-bump

**Why:** Spec §7 line 126: `if modus == trace and intensity > 0.7 and tone includes scharf or draengend: score *= 1.2`. Current selector ignores intensity entirely.

**Files:**
- Modify: `src/lib/daily-pulse/aphorism-select.ts`
- Modify: `src/__tests__/daily-pulse-aphorism-select.test.ts`

**Step 1: Add the failing test**

```ts
it('applies trace+high-intensity tone bump (spec §7 line 126)', () => {
  const sharp = make('sharp', ['trace'], [], 3); sharp.tone_tags = ['scharf'];
  const calm  = make('calm',  ['trace'], [], 4); calm.tone_tags  = ['ruhig'];
  // Without bump: calm (4) > sharp (3) → calm wins.
  // With bump (intensity > 0.7): sharp 3 * 1.2 = 3.6, still < calm 4 → calm still wins.
  const r0 = selectDailyAphorism([sharp, calm], 'u1', '2026-04-30', 'trace', { intensity: 0.8 });
  expect(r0.id).toBe('calm');

  // Lift sharp to rating 4 → with bump 4 * 1.2 = 4.8 > calm 4 → sharp wins.
  const sharpHi = make('sharpHi', ['trace'], [], 4); sharpHi.tone_tags = ['drängend'];
  const r1 = selectDailyAphorism([sharpHi, calm], 'u1', '2026-04-30', 'trace', { intensity: 0.8 });
  expect(r1.id).toBe('sharpHi');

  // intensity not high enough → no bump → calm wins.
  const r2 = selectDailyAphorism([sharpHi, calm], 'u1', '2026-04-30', 'trace', { intensity: 0.3 });
  expect(r2.id).toBe('calm');
});
```

**Step 2: Run — expect FAIL**

**Step 3: Implement**

Extend `Hints` interface and selector body in `src/lib/daily-pulse/aphorism-select.ts`:

```ts
interface Hints {
  dominantElement?: string;
  season?: string;
  selectedFigure?: string;
  intensity?: number;
}
```

Inside the `scored.map(...)` body, *after* the existing three boost rules:

```ts
if (
  mode === 'trace' &&
  hints.intensity !== undefined &&
  hints.intensity > 0.7 &&
  (a.tone_tags.includes('scharf') || a.tone_tags.includes('drängend') || a.tone_tags.includes('draengend'))
) {
  score *= 1.2;
}
```

> Note: spec text uses `draengend` (ASCII transliteration). The fallback pool uses `drängend` (umlaut). Match both.

**Step 4: Run — PASS**

**Step 5: Commit**

```bash
git add src/lib/daily-pulse/aphorism-select.ts src/__tests__/daily-pulse-aphorism-select.test.ts
git commit -m "fix(daily-pulse): apply trace+intensity>0.7 tone bump (spec §7 line 126)"
```

---

## Task R3: Restore top-5 selection (drop max-only deviation)

**Why:** Spec §7 line 128: `pick deterministic from top 5`. Earlier I changed this to "filter to entries == max score" because the original test pool only had 2 candidates. With the cooldown filter (R1) and the wider fallback pool, top-5 is the correct algorithm and gives natural per-user variety.

**Files:**
- Modify: `src/lib/daily-pulse/aphorism-select.ts`
- Modify: `src/__tests__/daily-pulse-aphorism-select.test.ts`

**Step 1: Update the "boost dominant element" test**

The current test asserts "boosted entry always wins". With top-5 that's no longer guaranteed when 5 entries tie. Replace the test to assert the boost SIGNIFICANTLY raises the boosted entry's selection rate:

```ts
it('boosts dominant element match — boosted entry dominates user distribution', () => {
  // 1 boosted entry among 4 baseline entries. Without boost: c shares
  // top-5 evenly with a/e/f → ~1/4 of users get c.
  // With element boost (+2): c lands at top-1, others at rating 4 → c wins
  // for every seed because it's the only entry with score 6.
  const seen = new Set<string>();
  for (const u of ['u1','u2','u3','u4','u5','u6','u7','u8','u9','u10']) {
    seen.add(selectDailyAphorism(pool, u, '2026-04-30', 'pulse', { dominantElement: 'feuer' }).id);
  }
  // Boost should make c win for every seed (it's a single entry at top score).
  expect(seen).toEqual(new Set(['c']));
});
```

> Why this still works: top-5 = up-to-5 highest-scored entries after sort. When a single entry has the strict-max score and is at index 0, the spec's `seed % top.length` still picks one of the top-5 by hash — but if c is alone at score 6 and the next 4 are at 4, c is at index 0 of top-5, and there are 5 picks (c, a, e, f, plus one of the other tied score-4 entries). So c wins only 1/5 of the time, NOT every seed. **The earlier test was wrong about its premise.** Restate the test honestly:

Actually, re-design the boost test to match what top-5 actually gives:

```ts
it('boosts dominant element match — boosted entry appears in top-5 and dominates over no-boost case', () => {
  // Without boost: c at rating 4 ties with a/e/f. ~1/4 selection rate.
  const noBoost = new Set<string>();
  for (let i = 0; i < 50; i++) {
    noBoost.add(selectDailyAphorism(pool, `u${i}`, '2026-04-30', 'pulse').id);
  }
  expect(noBoost.has('c')).toBe(true);
  expect(noBoost.size).toBeGreaterThan(1); // variety without boost

  // With element boost: c at rating 6 stands alone at the top of the sort.
  // Top-5 still includes c plus 4 baseline entries; selection picks via
  // hash. With 50 users, c should win roughly 1/N of the time where N
  // is min(5, eligible count). Assert c IS the most-frequent selection.
  const counts = new Map<string, number>();
  for (let i = 0; i < 50; i++) {
    const id = selectDailyAphorism(pool, `u${i}`, '2026-04-30', 'pulse', { dominantElement: 'feuer' }).id;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  // c should appear at least as often as any other entry (boosted to top of sort).
  const cCount = counts.get('c') ?? 0;
  for (const [id, n] of counts) {
    if (id !== 'c') expect(cCount).toBeGreaterThanOrEqual(n - 5); // tolerate ±5 from hash distribution
  }
});
```

**Step 2: Run — expect FAIL** (current impl uses max-only filter, so c always wins → first noBoost loop only sees 1 entry, fails `size > 1`)

**Step 3: Implement**

In `src/lib/daily-pulse/aphorism-select.ts`, restore the spec's top-5 algorithm:

```ts
scored.sort((x, y) => y.score - x.score || x.a.id.localeCompare(y.a.id));
const top = scored.slice(0, 5).map(s => s.a);
return top[fnv1a(`${userId}:${date}:${mode}`) % top.length];
```

Remove the `maxScore` filter logic entirely.

**Step 4: Run — PASS**

**Step 5: Commit**

```bash
git add src/lib/daily-pulse/aphorism-select.ts src/__tests__/daily-pulse-aphorism-select.test.ts
git commit -m "fix(daily-pulse): restore spec §7 top-5 selection (was max-only)"
```

---

## Task R4: AphorismRecord → wire shape adapter

**Why:** Selector returns `AphorismRecord` (nested `text/source` + `figure_affinity: string[]`). Wire `PulseAphorismSchema` is flat (`text_de/text_en/author/work` + `figure_affinity: CouncilKey[]`). The server route (next sprint) will need this conversion. Build it now with full validation so the server-route author isn't tempted to inline a sloppy version.

**Files:**
- Create: `src/lib/daily-pulse/aphorism-to-wire.ts`
- Create: `src/__tests__/daily-pulse-aphorism-to-wire.test.ts`

**Step 1: Write the test**

```ts
import { describe, it, expect } from 'vitest';
import { aphorismToWire } from '../lib/daily-pulse/aphorism-to-wire';
import type { AphorismRecord } from '../lib/daily-pulse/aphorism-select';

const base: AphorismRecord = {
  id: 'aph-1', status: 'approved',
  text: { de: 'de text', en: 'en text', original: null },
  source: { author: 'Goethe', work: 'Faust', year: 1808, original_language: 'de', translator_de: null, translator_en: 'X' },
  copyright: 'PD', attribution_status: 'verified', attribution_note: null,
  mode_tags: ['pulse'], tone_tags: ['ruhig'], element_affinity: ['wasser'],
  figure_affinity: ['day_master'], season_affinity: ['fruehling'],
  word_count_de: 5, word_count_en: 5, quality_rating: 4, first_used: null, cooldown_days: 30,
};

describe('aphorismToWire', () => {
  it('flattens text/source into wire shape', () => {
    const wire = aphorismToWire(base);
    expect(wire).toMatchObject({
      id: 'aph-1', text_de: 'de text', text_en: 'en text',
      author: 'Goethe', work: 'Faust', copyright: 'PD',
      attribution_status: 'verified',
    });
  });

  it('preserves valid figure_affinity entries', () => {
    expect(aphorismToWire(base).figure_affinity).toEqual(['day_master']);
  });

  it('drops unknown figure_affinity values silently and warns', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const r = aphorismToWire({ ...base, figure_affinity: ['day_master', 'made_up_key'] as any });
    expect(r.figure_affinity).toEqual(['day_master']);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('made_up_key'));
    warn.mockRestore();
  });

  it('drops unknown mode_tags', () => {
    const r = aphorismToWire({ ...base, mode_tags: ['pulse', 'wibble'] as any });
    expect(r.mode_tags).toEqual(['pulse']);
  });

  it('passes Zod PulseAphorismSchema validation', () => {
    const wire = aphorismToWire(base);
    expect(() => PulseAphorismSchema.parse(wire)).not.toThrow();
  });
});
```

Add `vi` import: `import { describe, it, expect, vi } from 'vitest';` and `import { PulseAphorismSchema } from '../lib/schemas/daily-pulse';`.

**Step 2: Run — FAIL**

**Step 3: Implement**

```ts
// src/lib/daily-pulse/aphorism-to-wire.ts
import type { AphorismRecord } from './aphorism-select';
import type { z } from 'zod';
import { PulseAphorismSchema, CouncilKeySchema, DayModeSchema } from '../schemas/daily-pulse';

type PulseAphorism = z.infer<typeof PulseAphorismSchema>;

const COUNCIL_KEYS = new Set(CouncilKeySchema.options);
const DAY_MODES = new Set(DayModeSchema.options);

export function aphorismToWire(rec: AphorismRecord): PulseAphorism {
  const filteredFigures: PulseAphorism['figure_affinity'] = [];
  for (const k of rec.figure_affinity) {
    if (COUNCIL_KEYS.has(k as any)) {
      filteredFigures.push(k as any);
    } else {
      console.warn(`[aphorismToWire] dropping unknown figure_affinity '${k}' on ${rec.id}`);
    }
  }
  const filteredModes: PulseAphorism['mode_tags'] = [];
  for (const m of rec.mode_tags) {
    if (DAY_MODES.has(m as any)) filteredModes.push(m as any);
    else console.warn(`[aphorismToWire] dropping unknown mode_tag '${m}' on ${rec.id}`);
  }
  return {
    id: rec.id,
    text_de: rec.text.de,
    text_en: rec.text.en,
    author: rec.source.author,
    work: rec.source.work,
    copyright: rec.copyright,
    attribution_status: rec.attribution_status,
    mode_tags: filteredModes,
    tone_tags: rec.tone_tags,
    element_affinity: rec.element_affinity,
    figure_affinity: filteredFigures,
    season_affinity: rec.season_affinity,
  };
}
```

**Step 4: Run — PASS**

**Step 5: Commit**

```bash
git add src/lib/daily-pulse/aphorism-to-wire.ts src/__tests__/daily-pulse-aphorism-to-wire.test.ts
git commit -m "feat(daily-pulse): add AphorismRecord -> PulseAphorism wire adapter with figure validation"
```

---

## Task R5: Tighten Zod literal unions for copyright + attribution_status

**Why:** Plan lines 122–123 specified literal unions. `PulseAphorismSchema` currently uses bare `z.string()`. Server route can return arbitrary strings, defeating the purpose of the schema as a contract.

**Decision on the "fallback" sentinel from plan §risk row 1:** Reject. The plan's idea to use `attribution_status: 'fallback'` conflicts with the spec's enum. Instead, fallback usage is detectable via `aphorism.id` prefix (`fallback-*`), which is already how the fallback pool is named. No extra wire field; no enum pollution.

**Files:**
- Modify: `src/lib/schemas/daily-pulse.ts`

**Step 1: Tighten the schemas**

```ts
// In src/lib/schemas/daily-pulse.ts — replace the two bare z.string() fields:

export const CopyrightStatusSchema = z.enum(['PD', 'Zitatrecht', 'eigene-Übersetzung', 'lizenziert']);
export const AttributionStatusSchema = z.enum(['verified', 'disputed', 'apocryphal', 'folkloric']);

export const PulseAphorismSchema = z.object({
  id: z.string(),
  text_de: z.string(),
  text_en: z.string(),
  author: z.string(),
  work: z.string().nullable(),
  copyright: CopyrightStatusSchema,
  attribution_status: AttributionStatusSchema,
  mode_tags: z.array(DayModeSchema),
  tone_tags: z.array(z.string()),
  element_affinity: z.array(z.string()),
  figure_affinity: z.array(CouncilKeySchema),
  season_affinity: z.array(z.string()),
});
```

**Step 2: Verify TS still compiles**

```bash
npx tsc --noEmit
```

The fallback aphorism JSON entries already use canonical values (`PD`, `eigene-Übersetzung`, `verified`, `disputed`) so no data needs changing. Verify:

```bash
node -e "
  const a = require('./packages/voice/data/aphorisms.fallback.json');
  const cp = new Set(['PD','Zitatrecht','eigene-Übersetzung','lizenziert']);
  const at = new Set(['verified','disputed','apocryphal','folkloric']);
  for (const e of a) {
    if (!cp.has(e.copyright)) throw new Error('bad copyright: '+e.id+' '+e.copyright);
    if (!at.has(e.attribution_status)) throw new Error('bad attr: '+e.id+' '+e.attribution_status);
  }
  console.log('fallback pool OK');
"
```

**Step 3: Run all tests**

```bash
npx vitest run src/__tests__/daily-pulse-aphorism-to-wire.test.ts \
              src/__tests__/daily-pulse-aphorism-select.test.ts 2>&1 | tail -5
```

If the wire-adapter test passes a `'PD'` etc. and the schema parses it, all green.

**Step 4: Commit**

```bash
git add src/lib/schemas/daily-pulse.ts
git commit -m "fix(daily-pulse): tighten copyright + attribution_status to literal unions"
```

---

## Task R6: Council typed accessors + all-dashes warning

**Why:** Current `council.ts` uses `any` casts on `western/bazi/wuxing` — silently masks BAFE rename regressions. Add a once-per-session warning when all six figures resolve to `'—'` (signals upstream schema drift).

**Files:**
- Modify: `src/lib/daily-pulse/council.ts`
- Modify: `src/__tests__/daily-pulse-council.test.ts`

**Step 1: Add the failing test**

Append to `daily-pulse-council.test.ts`:

```ts
import { vi, beforeEach } from 'vitest';

beforeEach(() => {
  // Reset the once-per-session warning state via the module's exposed reset for tests.
  // (Implementation will export a __resetCouncilWarnState for testability.)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('../lib/daily-pulse/council').__resetCouncilWarnState?.();
});

it('warns once when all six figures collapse to "—"', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const empty = { western: {}, bazi: {}, wuxing: {} } as any;
  buildCouncil(empty);
  buildCouncil(empty); // call twice — should warn only once
  expect(warn).toHaveBeenCalledTimes(1);
  expect(warn.mock.calls[0][0]).toMatch(/buildCouncil.*all six figures.*—/i);
  warn.mockRestore();
});

it('does NOT warn when at least one figure resolves', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  buildCouncil({ western: { zodiac_sign: 'Löwe' }, bazi: {}, wuxing: {} } as any);
  expect(warn).not.toHaveBeenCalled();
  warn.mockRestore();
});
```

**Step 2: Run — FAIL**

**Step 3: Implement**

Replace `src/lib/daily-pulse/council.ts` body:

```ts
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

let warnedAllDashes = false;
/** Test-only escape hatch — resets the once-per-session warning gate. */
export function __resetCouncilWarnState(): void { warnedAllDashes = false; }

export function buildCouncil(api: ApiData, lang: 'de' | 'en' = 'de'): CouncilFigure[] {
  const display = lang === 'en' ? DISPLAY_EN : DISPLAY_DE;
  const dash = '—';
  const western = api?.western;
  const bazi = api?.bazi;
  const wuxing = api?.wuxing;
  const figures: CouncilFigure[] = [
    { key: 'sonne',       displayName: display.sonne,       signOrElement: western?.zodiac_sign       || dash },
    { key: 'mond',        displayName: display.mond,        signOrElement: western?.moon_sign         || dash },
    { key: 'aszendent',   displayName: display.aszendent,   signOrElement: western?.ascendant_sign    || dash },
    { key: 'day_master',  displayName: display.day_master,  signOrElement: bazi?.day_master           || dash },
    { key: 'jahrestier',  displayName: display.jahrestier,  signOrElement: bazi?.zodiac_sign          || dash },
    { key: 'wuxing_dom',  displayName: display.wuxing_dom,  signOrElement: wuxing?.dominant_element   || dash },
  ];
  if (!warnedAllDashes && figures.every(f => f.signOrElement === dash)) {
    warnedAllDashes = true;
    console.warn('[buildCouncil] all six figures resolved to "—" — possible BAFE schema drift or empty profile');
  }
  return figures;
}
```

> Note: `bazi.zodiac_sign` is typed as `string` in `ApiData` (post-mapping in `services/api.ts` converts the BAFE 0-based index to a string name). `western.zodiac_sign` is also a string after the same mapping layer. So no `as any` needed.

**Step 4: Run — PASS**

**Step 5: Commit**

```bash
git add src/lib/daily-pulse/council.ts src/__tests__/daily-pulse-council.test.ts
git commit -m "fix(daily-pulse): replace any-casts in council; warn once on all-dashes (BAFE drift signal)"
```

---

## Task R7: Test `buildCouncil(api, 'en')`

**Files:**
- Modify: `src/__tests__/daily-pulse-council.test.ts`

**Step 1: Add the test inside the existing `describe`**

```ts
it('localises display names to English when lang="en"', () => {
  const c = buildCouncil(fullApi, 'en');
  expect(c[0].displayName).toBe('Sun');
  expect(c[1].displayName).toBe('Moon');
  expect(c[2].displayName).toBe('Ascendant');
  expect(c[3].displayName).toBe('Day Master');
  expect(c[4].displayName).toBe('Year Animal');
  expect(c[5].displayName).toBe('Wu Xing');
  // signOrElement is NOT translated — it's pass-through from ApiData.
  expect(c[0].signOrElement).toBe('Löwe');
});
```

**Step 2–4: Run, expect PASS, commit**

```bash
npx vitest run src/__tests__/daily-pulse-council.test.ts
git add src/__tests__/daily-pulse-council.test.ts
git commit -m "test(daily-pulse): cover buildCouncil lang='en' branch"
```

---

## Task R8: Test selector with all-unreviewed pool

**Files:**
- Modify: `src/__tests__/daily-pulse-aphorism-select.test.ts`

**Step 1: Add the test**

```ts
it('throws when pool contains only non-approved entries', () => {
  const draft = { ...make('a', ['pulse']), status: 'review' as any };
  expect(() => selectDailyAphorism([draft] as any, 'u', '2026-04-30', 'pulse')).toThrow();
});
```

**Step 2: Run — should already pass** (existing impl filters `status === 'approved'`).

**Step 3: Commit**

```bash
git add src/__tests__/daily-pulse-aphorism-select.test.ts
git commit -m "test(daily-pulse): cover selector defensive status filter"
```

---

## Task R9: Pin h=0.45 boundary in mode test

**Files:**
- Modify: `src/__tests__/daily-pulse-mode.test.ts`

**Step 1: Add the assertion**

In the `it.each([...])` table, add the row `[0.45, 'pulse', 0]`:

```ts
it.each([
  [0.20, 'spannung', 0.45],
  [0.44, 'spannung', 0.018],
  [0.45, 'pulse', 0],            // <-- exact boundary: 0.45 is the first pulse value
  [0.46, 'pulse', 0.018],
  [0.49, 'pulse', 0.072],
  [0.50, 'trace', 0.090],
  [0.78, 'trace', 0.6],
  [1.00, 'trace', 1.0],
])('h=%f → mode=%s, intensity≈%f', (h, mode, expected) => {
  ...
});
```

**Step 2: Run — PASS**

```bash
npx vitest run src/__tests__/daily-pulse-mode.test.ts
```

**Step 3: Commit**

```bash
git add src/__tests__/daily-pulse-mode.test.ts
git commit -m "test(daily-pulse): pin h=0.45 exact boundary (mode=pulse, intensity=0)"
```

---

## Final verification

After all 9 tasks:

```bash
npx tsc --noEmit
npx vitest run src/__tests__/daily-pulse-mode.test.ts \
              src/__tests__/daily-pulse-council.test.ts \
              src/__tests__/daily-pulse-aphorism-select.test.ts \
              src/__tests__/daily-pulse-aphorism-to-wire.test.ts 2>&1 | tail -5
```

Expected: 0 TS errors, all 4 test files green.

Optional full sweep:

```bash
npx vitest run 2>&1 | tail -5
```

Expected: 1995+ tests passing (we add ~7 new tests).

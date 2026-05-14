# Tagespuls Spec Alignment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Bring the shipped Tagespuls implementation (post-merge `05fef14`) into compliance with the canonical 9-section spec ("Tageshoroskop ist ein Ritual in zwei Phasen") so the curator pipeline, selection algorithm, and prompt grammar all match the architectural ground truth.

**Architecture:** 6 phases addressing the 7 confirmed deltas. JSON at `apps/tagespuls_package/packages/voice/data/aphorisms.json` is the **production source of truth** (curator workflow); Supabase tables are a synced query/usage cache. Build script ports from Python to TypeScript with Zod schema validation + translator/bilingualität gatekeepers. Selection algorithm enriched with element/season/figure affinity scoring + trace-mode intensity boost. Phase 2 logic is already spec-compliant — no changes needed there.

**Tech Stack:** TypeScript (Vitest, Zod, Node 20.19+), PostgreSQL (Supabase migrations), Express. No new runtime dependencies.

**Source spec:** Verbatim 9-section spec captured in `docs/2026-05-09-tagespuls-spec-9-sections.md` (Task 0 below).

---

## Pre-Flight: State Verification

**Step 0.1: Confirm branch + main is current**

```bash
git branch --show-current        # expect: main (or new feature branch — see Task 0)
git log --oneline -3              # expect: badf3b1 vite-proxy fix, 05fef14 merge, 3321b20 PR #330 merge
git status --short                # expect: clean (or only this plan + spec doc)
```

**Step 0.2: Baseline tests + lint**

```bash
npm test 2>&1 | grep -E "Test Files|Tests:" | tail -2
# expect: 251 files / 2334 tests, all green

npm run lint 2>&1 | tail -3
# expect: tsc --noEmit clean
```

**Step 0.3: Confirm current aphorism JSON shape (already nested)**

```bash
jq '[.[0] | keys] | flatten | sort' apps/tagespuls_package/packages/voice/data/aphorisms.json | head -20
# expect: ["attribution_note","attribution_status","cooldown_days","copyright","element_affinity","figure_affinity","first_used","id","mode_tags","quality_rating","season_affinity","source","status","text","tone_tags"]
```

If `text` and `source` are NOT nested objects → halt, JSON shape regressed.

**Step 0.4: Confirm DB query shape divergence**

```bash
grep -n "select\(.*text_de.*text_en.*author.*work" server.mjs | head
# expect: 1 hit at ~line 2940 — confirms DB still uses flat columns
```

This divergence is the root of Phase B work.

---

## Task 0: Capture canonical spec as design reference

Create the source-of-truth doc the entire plan compiles against.

**Files:**
- Create: `docs/2026-05-09-tagespuls-spec-9-sections.md`

**Step 0.0.1: Save the verbatim 9-section spec**

Write the user-supplied spec verbatim into the new file, with a brief frontmatter:

```markdown
---
title: Tagespuls Spec — Canonical 9-Section Architecture
captured: 2026-05-09
status: source-of-truth
implements: GOAL-tagespuls-no-placeholders
---

> This document is the canonical spec the Tagespuls implementation MUST
> conform to. Divergences are tracked in `docs/plans/2026-05-09-tagespuls-spec-alignment.md`.
> When updating: update spec FIRST, then plan, then code.

[VERBATIM 9-section spec body — paste from user message]
```

**Step 0.0.2: Commit on a fresh feature branch**

```bash
git checkout -b spec-alignment-tagespuls main
git add docs/2026-05-09-tagespuls-spec-9-sections.md docs/plans/2026-05-09-tagespuls-spec-alignment.md
git commit -m "$(cat <<'EOF'
docs(tagespuls): canonical 9-section spec + spec-alignment plan

Captures the source-of-truth Tagespuls architecture (Phase 1 →
Wahl-Moment → Phase 2; Aphorism schema; selection algorithm; voice
rules) as docs/2026-05-09-tagespuls-spec-9-sections.md.

The companion plan docs/plans/2026-05-09-tagespuls-spec-alignment.md
identifies 7 deltas between the current implementation (post-merge
05fef14) and the spec, and structures the gap-close as 6 phases:
A. Selection algorithm enrichment (scoring + trace-boost)
B. DB schema unification (sync flat → nested OR document divergence)
C. TypeScript build pipeline port (Python → TS+Zod)
D. Slot prompt tightening (30-50 total word-count enforcement)
E. Vocabulary discipline (CI grep gates, terminology doc)
F. Tests + final spec-conformance audit

Out of scope deferred (corpus expansion, monthly/hourly council
master-figures backend, Premium "Erweiterter Rat" UI).
EOF
)"
```

---

## Phase A: Selection Algorithm Enrichment

The current selection in `server.mjs` (`selectAphorismForUser`, ~line 2940) does cooldown + ORDER BY quality_rating DESC + top-5 + FNV-hash pick. The spec adds element/season/figure affinity scoring and a trace-mode intensity boost. This phase brings the algorithm to spec exactly.

### Task A1: Extract pure scoring helper (TDD red-green)

**Files:**
- Create: `server/services/aphorism-scoring.mjs`
- Create: `src/__tests__/aphorism-scoring.test.ts`

**Step A1.1: Write failing tests**

```typescript
// src/__tests__/aphorism-scoring.test.ts
import { describe, it, expect } from 'vitest';
import { scoreAphorism, currentSeason, pickFromTopN } from '../../server/services/aphorism-scoring.mjs';

describe('scoreAphorism', () => {
  const baseAphorism = {
    id: 'aph-test',
    quality_rating: 3,
    element_affinity: ['wasser'],
    season_affinity: ['winter'],
    figure_affinity: [],
    mode_tags: ['pulse'],
    tone_tags: ['ruhig'],
  };

  it('starts with quality_rating', () => {
    expect(scoreAphorism(baseAphorism, {
      mode: 'pulse', intensity: 0.5, dominantElement: 'feuer', season: 'sommer', archetypes: [],
    })).toBe(3);
  });

  it('adds 2 when dominant element matches element_affinity', () => {
    expect(scoreAphorism(baseAphorism, {
      mode: 'pulse', intensity: 0.5, dominantElement: 'wasser', season: 'sommer', archetypes: [],
    })).toBe(5); // 3 + 2
  });

  it('adds 1 when current season matches season_affinity', () => {
    expect(scoreAphorism(baseAphorism, {
      mode: 'pulse', intensity: 0.5, dominantElement: 'feuer', season: 'winter', archetypes: [],
    })).toBe(4); // 3 + 1
  });

  it('adds 1 when any user archetype matches figure_affinity', () => {
    const aph = { ...baseAphorism, figure_affinity: ['mond', 'aszendent'] };
    expect(scoreAphorism(aph, {
      mode: 'pulse', intensity: 0.5, dominantElement: 'feuer', season: 'sommer',
      archetypes: ['sonne', 'mond'],
    })).toBe(4); // 3 + 1
  });

  it('boosts trace-mode + high intensity + sharp tone by 1.2x', () => {
    const aph = { ...baseAphorism, mode_tags: ['trace'], tone_tags: ['scharf'] };
    expect(scoreAphorism(aph, {
      mode: 'trace', intensity: 0.8, dominantElement: 'feuer', season: 'sommer', archetypes: [],
    })).toBeCloseTo(3.6); // 3 * 1.2
  });

  it('does NOT boost trace-mode if intensity <= 0.7', () => {
    const aph = { ...baseAphorism, mode_tags: ['trace'], tone_tags: ['scharf'] };
    expect(scoreAphorism(aph, {
      mode: 'trace', intensity: 0.69, dominantElement: 'feuer', season: 'sommer', archetypes: [],
    })).toBe(3); // no boost
  });

  it('does NOT boost trace-mode if tone_tags lacks scharf/drängend', () => {
    const aph = { ...baseAphorism, mode_tags: ['trace'], tone_tags: ['ruhig'] };
    expect(scoreAphorism(aph, {
      mode: 'trace', intensity: 0.9, dominantElement: 'feuer', season: 'sommer', archetypes: [],
    })).toBe(3);
  });

  it('combines all bonuses correctly', () => {
    const aph = {
      ...baseAphorism,
      mode_tags: ['trace'],
      element_affinity: ['feuer'],
      season_affinity: ['sommer'],
      figure_affinity: ['sonne'],
      tone_tags: ['drängend'],
    };
    expect(scoreAphorism(aph, {
      mode: 'trace', intensity: 0.8, dominantElement: 'feuer', season: 'sommer', archetypes: ['sonne'],
    })).toBeCloseTo((3 + 2 + 1 + 1) * 1.2); // = 8.4
  });
});

describe('currentSeason', () => {
  it('returns winter for January', () => {
    expect(currentSeason(new Date('2026-01-15'))).toBe('winter');
  });
  it('returns fruehling for April', () => {
    expect(currentSeason(new Date('2026-04-15'))).toBe('fruehling');
  });
  it('returns sommer for July', () => {
    expect(currentSeason(new Date('2026-07-15'))).toBe('sommer');
  });
  it('returns herbst for October', () => {
    expect(currentSeason(new Date('2026-10-15'))).toBe('herbst');
  });
});

describe('pickFromTopN deterministic selection', () => {
  it('same userId+date+mode → same pick', () => {
    const pool = [
      { id: 'a', score: 10 }, { id: 'b', score: 9 }, { id: 'c', score: 8 },
      { id: 'd', score: 7 }, { id: 'e', score: 6 }, { id: 'f', score: 5 },
    ];
    const pick1 = pickFromTopN(pool, 5, 'user-1', '2026-05-09', 'pulse');
    const pick2 = pickFromTopN(pool, 5, 'user-1', '2026-05-09', 'pulse');
    expect(pick1.id).toBe(pick2.id);
  });

  it('different date → potentially different pick', () => {
    const pool = [
      { id: 'a', score: 10 }, { id: 'b', score: 9 }, { id: 'c', score: 8 },
      { id: 'd', score: 7 }, { id: 'e', score: 6 },
    ];
    const picks = new Set();
    for (const date of ['2026-05-09', '2026-05-10', '2026-05-11', '2026-05-12', '2026-05-13']) {
      picks.add(pickFromTopN(pool, 5, 'user-1', date, 'pulse').id);
    }
    expect(picks.size).toBeGreaterThan(1);
  });
});
```

**Step A1.2: Run tests, verify they fail**

```bash
npx vitest run src/__tests__/aphorism-scoring.test.ts
# expect: all FAIL with "scoreAphorism is not exported / module not found"
```

**Step A1.3: Implement helpers**

```javascript
// server/services/aphorism-scoring.mjs
//
// Pure scoring helpers for the Tagespuls aphorism selection.
// Spec: docs/2026-05-09-tagespuls-spec-9-sections.md §7.

const SHARP_TONES = new Set(['scharf', 'drängend']);

/**
 * Pure score calculation per spec §7 step 4 + step 5.
 * @param {Aphorism} aph
 * @param {{mode: 'pulse'|'trace'|'spannung', intensity: number, dominantElement: string|null, season: string, archetypes: string[]}} ctx
 * @returns {number}
 */
export function scoreAphorism(aph, ctx) {
  let score = aph.quality_rating ?? 0;

  if (ctx.dominantElement && (aph.element_affinity ?? []).includes(ctx.dominantElement)) {
    score += 2;
  }
  if (ctx.season && (aph.season_affinity ?? []).includes(ctx.season)) {
    score += 1;
  }
  if ((aph.figure_affinity ?? []).some((f) => ctx.archetypes.includes(f))) {
    score += 1;
  }

  // Trace-mode intensity boost (spec §7 step 5)
  if (ctx.mode === 'trace' && ctx.intensity > 0.7) {
    const hasSharpTone = (aph.tone_tags ?? []).some((t) => SHARP_TONES.has(t));
    if (hasSharpTone) {
      score *= 1.2;
    }
  }

  return score;
}

/**
 * Map a date to one of the 4 German season identifiers.
 * Boundaries: Mar/Jun/Sep/Dec on the 21st (astronomical).
 */
export function currentSeason(date = new Date()) {
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  const md = m * 100 + d;
  if (md >= 320 && md < 621) return 'fruehling';
  if (md >= 621 && md < 923) return 'sommer';
  if (md >= 923 && md < 1221) return 'herbst';
  return 'winter';
}

/**
 * Deterministic pick from the top-N highest-scored entries.
 * Uses FNV-1a-ish hash from `tagespuls.service.mjs` so it stays
 * consistent with the existing simpleHash helper.
 */
export function pickFromTopN(scoredPool, n, userId, date, mode) {
  if (scoredPool.length === 0) return null;
  const top = [...scoredPool]
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, n);
  const seed = simpleHash(`${userId}:${date}:${mode}`);
  return top[seed % top.length];
}

// Inline copy of simpleHash to keep module pure (no cross-file dep at top of pipeline).
function simpleHash(value) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}
```

**Step A1.4: Run tests, verify all pass**

```bash
npx vitest run src/__tests__/aphorism-scoring.test.ts
# expect: PASS — 13/13 (or whatever the actual count is)
```

**Step A1.5: Commit**

```bash
git add server/services/aphorism-scoring.mjs src/__tests__/aphorism-scoring.test.ts
git commit -m "$(cat <<'EOF'
feat(tagespuls): pure scoring helpers per spec §7 (TDD)

Extracts the spec-defined affinity scoring and deterministic top-N
pick into server/services/aphorism-scoring.mjs (pure, fully unit-
testable). 13 cases cover: quality_rating baseline, element/season/
figure-affinity bonuses (+2/+1/+1), trace-mode intensity-boost (1.2x
when intensity>0.7 AND tone_tags ∩ {scharf,drängend}), and
deterministic-but-date-varying pick from top-N.

Step 1 of Phase A (Spec §7 conformance). Wiring into the route
selection happens in Task A2.
EOF
)"
```

### Task A2: Wire scoring into `selectAphorismForUser`

**Files:**
- Modify: `server.mjs` (the `selectAphorismForUser` function, around line 2940)
- Modify: `src/__tests__/api-daily-pulse.test.ts` (add 1 case asserting trace-mode intensity boost picks the right aphorism)

**Step A2.1: Refactor `selectAphorismForUser`**

Inside `server.mjs`, replace the body of `selectAphorismForUser` to:

1. Load pool from Supabase as before (cooldown filter + approved + mode_tag).
2. Resolve user context: `dominantElement` from `astro_profiles.astro_json.wuxing.dominant_element` (lowercased + German); `archetypes` = the 6 keys from `buildCouncilFromProfile`; `season` from `currentSeason(new Date(date))`.
3. Score each pool entry via `scoreAphorism`.
4. Pick deterministically via `pickFromTopN(scored, 5, userId, date, mode)`.

The function signature must accept `astroJson` so the user context can be derived; update the route to pass it (already loaded for council).

```javascript
// Imports at top of server.mjs:
import { scoreAphorism, currentSeason, pickFromTopN } from './server/services/aphorism-scoring.mjs';

// Replace the existing function body:
async function selectAphorismForUser({ userId, date, mode, intensity, astroJson, supabase }) {
  if (!supabase) return null;

  // Cooldown + pool fetch (unchanged)
  const cutoff = new Date(date + 'T00:00:00Z');
  cutoff.setUTCDate(cutoff.getUTCDate() - 30);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const { data: usageRows } = await supabase
    .from('aphorism_usage_events')
    .select('aphorism_id')
    .eq('user_id', userId)
    .gte('date', cutoffStr);
  const cooldownIds = new Set((usageRows ?? []).map((r) => r.aphorism_id));

  const { data: pool, error: poolErr } = await supabase
    .from('aphorisms')
    .select('id, text_de, text_en, author, work, attribution_status, mode_tags, tone_tags, element_affinity, season_affinity, figure_affinity, quality_rating, cooldown_days')
    .eq('status', 'approved')
    .contains('mode_tags', [mode]);

  if (poolErr || !pool || pool.length === 0) return null;

  // Cooldown-aware filter
  let candidates = pool.filter((a) => !cooldownIds.has(a.id));
  if (candidates.length === 0) candidates = pool;

  // Spec §7: derive user context from astroJson + date
  const dominantElement = (astroJson?.wuxing?.dominant_element ?? '').toLowerCase() || null;
  const archetypeKeys = ['sonne', 'mond', 'aszendent', 'day_master', 'jahrestier', 'wuxing_dom'];

  // Score each candidate
  const ctx = {
    mode,
    intensity: intensity ?? 0,
    dominantElement,
    season: currentSeason(new Date(date)),
    archetypes: archetypeKeys,
  };
  const scored = candidates.map((a) => ({ ...a, score: scoreAphorism(a, ctx) }));

  return pickFromTopN(scored, 5, userId, date, mode);
}
```

**Step A2.2: Update callsite to pass `intensity` and `astroJson`**

Find `selectAphorismForUser({ userId, date, mode, supabase: supabaseServer })` (in `app.get('/api/daily-pulse', ...)` handler), change to:

```javascript
const aphorism = await selectAphorismForUser({
  userId, date, mode, intensity,
  astroJson: profileRow.astro_json,
  supabase: supabaseServer,
});
```

**Step A2.3: Add integration-level test asserting scoring effect**

Add to `src/__tests__/api-daily-pulse.test.ts`:

```typescript
it('selection prefers element-affinity match over higher quality_rating without match', async () => {
  // Two aphorisms in pool: one with quality 5 + no affinity match, one with quality 3 + element match.
  // User has dominant_element 'wasser'. Score: aph-A = 5, aph-B = 3+2=5. Tie → deterministic by hash.
  // Mock the pool to return both, then assert the chosen aphorism ID is one of {A, B}.
  // Stronger assertion: with quality=3+element_match=2=5 vs quality=5+no_match=5, hash-tie-breaker selects.
  // To make the test non-tie: aph-B has element_affinity=['wasser'] AND quality_rating=4 → score = 4+2=6.
  // ... (mock Supabase pool with both, assert response.body.aphorism.id === 'aph-B')
});
```

**Step A2.4: Run tests + commit**

```bash
npm test 2>&1 | grep -E "Test Files|Tests:" | tail -2
# expect: 252 files / 2347 tests (or similar — ~13 from A1 + 1 from A2)

git add server.mjs src/__tests__/api-daily-pulse.test.ts
git commit -m "feat(tagespuls): wire affinity scoring into route selection (Spec §7)"
```

---

## Phase B: DB Schema vs JSON Schema Decision

The aphorisms.json (`packages/voice/data/`) uses nested `text` and `source` objects (spec-conform). Postgres migration `20260509_tagespuls_tables.sql` uses flat columns. Two valid resolutions:

**Option 1 — Tighten DB schema to match JSON (jsonb columns):**
- Pro: single shape across tier
- Con: requires migration `20260510`, in-place rewrite of 21 rows, breaks current queries

**Option 2 — Keep DB flat, document divergence (sync layer transforms JSON → flat at seed time):**
- Pro: minimal change, no migration, queries stay simple
- Con: schema-aware code paths exist in 2 shapes

**Recommendation: Option 2.** Spec says "JSON is production-source-of-truth" — DB is an implementation detail of the query layer. Document the transformation in the build script + add a runbook entry.

### Task B1: Document the DB-flat / JSON-nested divergence

**Files:**
- Modify: `apps/tagespuls_package/packages/db/schema.sql` (extend the existing INFO-1 banner with a 5th divergence point)
- Modify: `supabase-migrations/20260509_tagespuls_tables.sql` (extend the comment header)

**Step B1.1: Update schema.sql banner**

In the existing 11-line banner at top of `apps/tagespuls_package/packages/db/schema.sql` (added in commit `6af4f0c`), add a 4th-point line:

```sql
-- ⚠️ DESIGN REFERENCE ONLY — production schema lives in
-- supabase-migrations/20260509_tagespuls_tables.sql
-- That file documents intentional divergences from this reference:
--   1. user_astro_profiles is OMITTED ...
--   2. daily_pulses.slot_2 / slot_3 are NULLABLE ...
--   3. user_id FKs reference auth.users(id) ...
--   4. NEW (2026-05-09): aphorisms uses FLAT columns (text_de, text_en,
--      author, work) for query-layer simplicity. The canonical aphorism
--      shape is the NESTED form in
--      apps/tagespuls_package/packages/voice/data/aphorisms.json (text.de,
--      text.en, source.author, source.work, etc.). The build script
--      (Task C1) is the single transformer between the two shapes.
```

**Step B1.2: Update migration header**

Append a 5th point ("e.") to the migration header comment in `supabase-migrations/20260509_tagespuls_tables.sql`:

```sql
-- e. Aphorism columns are FLAT (text_de, text_en, author, work, year,
--    original_language, translator_de, translator_en) for SQL-friendly
--    queries (e.g. .contains('mode_tags', [mode])). The canonical JSON
--    in packages/voice/data/aphorisms.json uses nested {text:{de,en,
--    original}, source:{...}}. Build script transforms nested → flat
--    at seed time. Kept divergent intentionally.
```

**Step B1.3: Commit**

```bash
git add apps/tagespuls_package/packages/db/schema.sql supabase-migrations/20260509_tagespuls_tables.sql
git commit -m "docs(tagespuls): document DB-flat vs JSON-nested aphorism divergence (Spec §6)"
```

---

## Phase C: TypeScript Build Pipeline Port (Python → TS+Zod)

The current `apps/tagespuls_package/packages/voice/scripts/build_aphorisms.py` reads the markdown vault and produces `aphorisms.json`. Spec mandates TypeScript with Zod schema validation. This phase ports the script and adds the spec-required validators (translator-konvention, bilingualität, attribution-note pflicht, word-count slot 1).

### Task C1: Write Zod schema first (TDD red-green for validation)

**Files:**
- Create: `apps/tagespuls_package/packages/voice/scripts/aphorism-schema.ts`
- Create: `apps/tagespuls_package/packages/voice/scripts/__tests__/aphorism-schema.test.ts` (or co-located as you prefer)

**Step C1.1: Define Zod schema per spec §6**

```typescript
// apps/tagespuls_package/packages/voice/scripts/aphorism-schema.ts
import { z } from 'zod';

const NON_AUDIT_TRANSLATOR_PATTERNS = [
  /^ben$/i, /^benji$/i,
  /^llm-?curated$/i, /^llm$/i,
  /^ai-?curated$/i, /^ai$/i,
  /^claude$/i, /^chatgpt$/i, /^gemini$/i,  // bare model names without curator-affix
];

function isAuditTaughtTranslator(value: string): boolean {
  if (!value) return true; // empty is allowed (means "same language as original")
  return !NON_AUDIT_TRANSLATOR_PATTERNS.some((p) => p.test(value.trim()));
}

export const sourceSchema = z.object({
  author: z.string().min(1, 'source.author required'),
  work: z.string().optional(),
  year: z.number().int().optional(),
  original_language: z.enum([
    'de', 'en', 'zh', 'la', 'grc', 'fr', 'it', 'sa', 'ar', 'ja', 'ru', 'ko', 'pt', 'es', 'he', 'hi'
  ]),
  translator_de: z.string().refine(isAuditTaughtTranslator, {
    message: 'translator_de must be audit-tauglich (e.g. "Strauss-1870", "Insel-Verlag, 2003", "Benjamin Poersch", "ChatGPT, kuratiert"). Bare values like "ben" or "llm-curated" are rejected.',
  }).optional().default(''),
  translator_en: z.string().refine(isAuditTaughtTranslator, {
    message: 'translator_en must be audit-tauglich (see translator_de message).',
  }).optional().default(''),
});

export const aphorismSchema = z.object({
  id: z.string().regex(/^aph-\d{4,}$/, 'id must match aph-NNNN'),
  status: z.enum(['draft', 'review', 'approved', 'retired']),
  text: z.object({
    de: z.string().min(1),
    en: z.string().min(1),
    original: z.string().optional(),
  }),
  source: sourceSchema,
  copyright: z.enum(['PD', 'Zitatrecht', 'eigene-Übersetzung', 'lizenziert']),
  attribution_status: z.enum(['verified', 'disputed', 'apocryphal', 'folkloric']),
  attribution_note: z.string().optional().default(''),
  mode_tags: z.array(z.enum(['pulse', 'trace', 'spannung'])).min(1),
  tone_tags: z.array(z.string()).default([]),
  element_affinity: z.array(z.enum(['wasser', 'feuer', 'erde', 'holz', 'metall'])).default([]),
  figure_affinity: z.array(z.enum(['sonne', 'mond', 'aszendent', 'day_master', 'jahrestier', 'wuxing_dom'])).default([]),
  season_affinity: z.array(z.enum(['fruehling', 'sommer', 'herbst', 'winter'])).default([]),
  word_count_de: z.number().int().min(1).max(50),
  word_count_en: z.number().int().min(1).max(50),
  quality_rating: z.number().int().min(1).max(5),
  first_used: z.string().nullable().default(null),
  cooldown_days: z.number().int().min(0).default(30),
  editor_notes: z.string().optional().default(''),
}).refine(
  (a) => a.attribution_status === 'verified' || (a.attribution_note && a.attribution_note.trim().length > 0),
  { message: 'attribution_note REQUIRED when attribution_status is not verified', path: ['attribution_note'] }
).refine(
  (a) => a.source.original_language === 'de' || (a.source.translator_de && a.source.translator_de.trim().length > 0),
  { message: 'translator_de REQUIRED when original_language is not "de"', path: ['source', 'translator_de'] }
).refine(
  (a) => a.source.original_language === 'en' || (a.source.translator_en && a.source.translator_en.trim().length > 0),
  { message: 'translator_en REQUIRED when original_language is not "en"', path: ['source', 'translator_en'] }
).refine(
  (a) => a.word_count_de >= 8 && a.word_count_de <= 15,
  { message: 'word_count_de must be 8-15 (slot 1 spec §3)', path: ['word_count_de'] }
).refine(
  (a) => a.word_count_en >= 8 && a.word_count_en <= 15,
  { message: 'word_count_en must be 8-15 (slot 1 spec §3)', path: ['word_count_en'] }
);

export type Aphorism = z.infer<typeof aphorismSchema>;
```

**Step C1.2: Write failing tests for the validator**

```typescript
// apps/tagespuls_package/packages/voice/scripts/__tests__/aphorism-schema.test.ts
import { describe, it, expect } from 'vitest';
import { aphorismSchema } from '../aphorism-schema';

const validBase = {
  id: 'aph-0001',
  status: 'approved',
  text: { de: 'Wer den Fluss kennt, fürchtet die Brücke nicht.', en: 'Who knows the river fears not the bridge.' },
  source: { author: 'Laozi', original_language: 'zh', translator_de: 'Strauss-1870', translator_en: 'Legge-1891' },
  copyright: 'PD',
  attribution_status: 'verified',
  mode_tags: ['pulse'],
  word_count_de: 8,
  word_count_en: 8,
  quality_rating: 5,
};

describe('aphorism schema', () => {
  it('accepts valid base aphorism', () => {
    expect(() => aphorismSchema.parse(validBase)).not.toThrow();
  });

  it('rejects translator_de = "ben"', () => {
    expect(() => aphorismSchema.parse({
      ...validBase,
      source: { ...validBase.source, translator_de: 'ben' },
    })).toThrow(/audit-tauglich/);
  });

  it('rejects translator_en = "llm-curated"', () => {
    expect(() => aphorismSchema.parse({
      ...validBase,
      source: { ...validBase.source, translator_en: 'llm-curated' },
    })).toThrow(/audit-tauglich/);
  });

  it('accepts translator_en = "ChatGPT, kuratiert"', () => {
    expect(() => aphorismSchema.parse({
      ...validBase,
      source: { ...validBase.source, translator_en: 'ChatGPT, kuratiert' },
    })).not.toThrow();
  });

  it('requires attribution_note when status is disputed', () => {
    expect(() => aphorismSchema.parse({
      ...validBase,
      attribution_status: 'disputed',
    })).toThrow(/attribution_note REQUIRED/);
  });

  it('accepts disputed with attribution_note', () => {
    expect(() => aphorismSchema.parse({
      ...validBase,
      attribution_status: 'disputed',
      attribution_note: 'Häufig Frankl zugeschrieben; geprägt von Stephen Covey 1989.',
    })).not.toThrow();
  });

  it('rejects word_count_de = 7 (below slot 1 minimum)', () => {
    expect(() => aphorismSchema.parse({ ...validBase, word_count_de: 7 })).toThrow(/word_count_de must be 8-15/);
  });

  it('rejects word_count_en = 16', () => {
    expect(() => aphorismSchema.parse({ ...validBase, word_count_en: 16 })).toThrow(/word_count_en must be 8-15/);
  });

  it('requires translator_de when original_language is not de', () => {
    expect(() => aphorismSchema.parse({
      ...validBase,
      source: { author: 'Anon', original_language: 'zh', translator_en: 'Legge' },
    })).toThrow(/translator_de REQUIRED/);
  });

  it('does NOT require translator_de when original_language is de', () => {
    expect(() => aphorismSchema.parse({
      ...validBase,
      source: { author: 'Goethe', original_language: 'de' },
    })).not.toThrow();
  });
});
```

**Step C1.3: Run tests**

```bash
npx vitest run apps/tagespuls_package/packages/voice/scripts/__tests__/aphorism-schema.test.ts
# expect: PASS — 10/10
```

**Step C1.4: Commit**

```bash
git add apps/tagespuls_package/packages/voice/scripts/aphorism-schema.ts apps/tagespuls_package/packages/voice/scripts/__tests__/aphorism-schema.test.ts
git commit -m "feat(tagespuls): Zod schema for aphorisms with spec §6 validation"
```

### Task C2: Port build_aphorisms.py to TypeScript

**Files:**
- Create: `apps/tagespuls_package/packages/voice/scripts/build-aphorisms.ts`
- Modify: `package.json` (add `build:aphorisms` script)
- (optional) Delete: `apps/tagespuls_package/packages/voice/scripts/build_aphorisms.py` (or keep for reference under `archive/`)

**Step C2.1: Read the Python script**

```bash
cat apps/tagespuls_package/packages/voice/scripts/build_aphorisms.py
```

Note: input directory (markdown vault), YAML frontmatter parser, output JSON path, status filter ("approved" only).

**Step C2.2: Write the TypeScript port**

```typescript
// apps/tagespuls_package/packages/voice/scripts/build-aphorisms.ts
//
// Reads the aphorism vault (markdown with YAML frontmatter) and produces
// packages/voice/data/aphorisms.json with only approved entries that pass
// Zod schema validation. Per spec §6 build pipeline.

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import matter from 'gray-matter';  // YAML frontmatter parser (already in repo? check; if not, use a tiny inline YAML parser)
import { aphorismSchema, type Aphorism } from './aphorism-schema';

const VAULT_DIR = join(__dirname, '../../../knowledge/bazodiaac-brain/aphorisms');
const OUTPUT_FILE = join(__dirname, '../data/aphorisms.json');

interface BuildResult {
  approved: Aphorism[];
  drafts: number;
  errors: Array<{ file: string; reason: string }>;
}

function buildAphorisms(): BuildResult {
  const result: BuildResult = { approved: [], drafts: 0, errors: [] };

  const files = readdirSync(VAULT_DIR).filter((f) => f.endsWith('.md'));
  for (const filename of files) {
    const filepath = join(VAULT_DIR, filename);
    const raw = readFileSync(filepath, 'utf-8');
    const { data: frontmatter } = matter(raw);

    if (frontmatter.status !== 'approved') {
      result.drafts += 1;
      continue;
    }

    const parseResult = aphorismSchema.safeParse(frontmatter);
    if (!parseResult.success) {
      result.errors.push({
        file: filename,
        reason: parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      });
      continue;
    }
    result.approved.push(parseResult.data);
  }

  return result;
}

const result = buildAphorisms();

if (result.errors.length > 0) {
  console.error('Build errors:');
  for (const err of result.errors) console.error(`  ${err.file}: ${err.reason}`);
  process.exit(1);
}

writeFileSync(OUTPUT_FILE, JSON.stringify(result.approved, null, 2));
console.log(`✓ ${result.approved.length} approved aphorisms → ${basename(OUTPUT_FILE)}`);
console.log(`  ${result.drafts} drafts/reviews skipped`);
```

**Step C2.3: Add npm script**

In `package.json`:

```json
"scripts": {
  ...
  "build:aphorisms": "tsx apps/tagespuls_package/packages/voice/scripts/build-aphorisms.ts"
}
```

(Use `tsx` if it's already in deps; otherwise add `"tsx": "^4.0.0"` to devDependencies. Verify with `grep tsx package.json` first.)

**Step C2.4: Run the build to verify it produces the same shape**

```bash
npm run build:aphorisms
# expect: "✓ 21 approved aphorisms → aphorisms.json"  (or whatever the current count is)
# expect: aphorisms.json shape unchanged (jq diff against current file)
```

**Step C2.5: Verify no shape regression**

```bash
git diff apps/tagespuls_package/packages/voice/data/aphorisms.json
# expect: no diff, or only formatting (whitespace) — means TS port matches Python output
```

If there's content drift, fix the TS port until parity.

**Step C2.6: Commit + (optional) archive Python script**

```bash
git add apps/tagespuls_package/packages/voice/scripts/build-aphorisms.ts package.json apps/tagespuls_package/packages/voice/data/aphorisms.json
# optionally: git mv apps/tagespuls_package/packages/voice/scripts/build_aphorisms.py archive/
git commit -m "feat(tagespuls): TypeScript build-aphorisms.ts replaces Python (Spec §6)"
```

---

## Phase D: Slot Prompt Tightening (30-50 Word Total)

### Task D: Add post-generation word-count guard

**Files:**
- Modify: `server/services/tagespuls.service.mjs` (`buildSlotPrompt` — tighten the spec-quoted hard constraints)
- Modify: `server.mjs` (`generateTagespulsSlots` — add post-Gemini word-count validator that returns null if violated)
- Modify: `src/__tests__/api-daily-pulse.test.ts` (add 1 case: too-long Gemini output → returns null slots)

**Step D.1: Edit `buildSlotPrompt` to add total-word-count constraint**

In the prompt body, add a paragraph after the SLOT 3 block:

```
GESAMTWORTZAHL (slot_2 + slot_3 zusammen, ohne aphorismus): 20-35 Wörter.
Wenn deine Antwort über 35 Wörter geht, kürze beide Slots so, dass die
Summe innerhalb des Bereichs liegt — slot_3 darf dabei niemals unter
10 Wörter fallen.
```

**Step D.2: Add post-generation validator in `generateTagespulsSlots`**

```javascript
function countWords(s) {
  if (!s || typeof s !== 'string') return 0;
  return s.trim().split(/\s+/).filter(Boolean).length;
}

// Inside generateTagespulsSlots, after parsing slot2/slot3 from Gemini:
const wc2 = countWords(slot2);
const wc3 = countWords(slot3);
if (wc2 < 10 || wc2 > 25 || wc3 < 10 || wc3 > 20) {
  console.warn(`[daily-pulse] slot word-count out of bounds (slot_2=${wc2}, slot_3=${wc3}); returning null`);
  return { slot_2: null, slot_3: null };
}
```

**Step D.3: Add test case**

```typescript
// In src/__tests__/api-daily-pulse.test.ts
it('returns null slots when Gemini output exceeds word-count bounds', async () => {
  // Mock Gemini to return slot_2 with 30 words (over 25).
  // ...
  expect(res.body.aphorism.slot_2).toBeNull();
  expect(res.body.aphorism.slot_3).toBeNull();
});
```

**Step D.4: Test + commit**

```bash
npm test 2>&1 | grep "Tests:" | tail -1
# expect: previous count + 1

git add server/services/tagespuls.service.mjs server.mjs src/__tests__/api-daily-pulse.test.ts
git commit -m "feat(tagespuls): post-generation word-count guard for slots (Spec §3)"
```

---

## Phase E: Vocabulary Discipline + CI Gate

### Task E1: Add CI grep-gate against forbidden words

**Files:**
- Create: `scripts/check-tagespuls-vocab.mjs`
- Modify: `package.json` (add `"check:vocab": "node scripts/check-tagespuls-vocab.mjs"` and chain it into the `test` script or a pre-push hook)

**Step E1.1: Write the grep gate**

```javascript
// scripts/check-tagespuls-vocab.mjs
//
// CI gate: forbidden Tagespuls vocabulary per spec §1.
// Fails if any code/doc/test file uses verboten terms.

import { execSync } from 'node:child_process';

const FORBIDDEN = [
  { term: 'Tageswetter', reason: 'Spec §1: use "Kosmisches Wetter" for external state, "Tagespuls" for user-internal' },
  { term: 'tageswetter', reason: 'Same as above (case-insensitive)' },
];

const SCAN_PATHS = [
  'src/', 'server.mjs', 'server/', 'apps/tagespuls_package/', 'docs/',
];

let violations = 0;
for (const { term, reason } of FORBIDDEN) {
  try {
    const hits = execSync(
      `git grep -in "${term}" -- ${SCAN_PATHS.join(' ')} 2>&1 || true`,
      { encoding: 'utf-8' }
    ).trim();
    if (hits && !hits.startsWith('fatal:')) {
      // Filter out THIS file (which mentions the forbidden term in the FORBIDDEN list)
      const filtered = hits.split('\n').filter((line) => !line.includes('check-tagespuls-vocab.mjs'));
      if (filtered.length > 0) {
        violations += filtered.length;
        console.error(`\n❌ Forbidden term "${term}" found:`);
        console.error(`   Reason: ${reason}`);
        for (const line of filtered) console.error(`   ${line}`);
      }
    }
  } catch (err) {
    // grep exit code 1 = no match, OK
  }
}

if (violations > 0) {
  console.error(`\n${violations} vocabulary violation(s). See spec §1 for terminology.`);
  process.exit(1);
}
console.log('✓ No Tagespuls vocabulary violations');
```

**Step E1.2: Run it locally**

```bash
node scripts/check-tagespuls-vocab.mjs
# expect: ✓ No Tagespuls vocabulary violations
```

**Step E1.3: Wire into npm scripts**

In `package.json` add:

```json
"check:vocab": "node scripts/check-tagespuls-vocab.mjs"
```

Decide: chain into `lint`, into `test`, or both. Recommendation: chain into `lint` so CI's typecheck step also runs the vocab check.

```json
"lint": "tsc --noEmit && npm run check:vocab"
```

**Step E1.4: Commit**

```bash
git add scripts/check-tagespuls-vocab.mjs package.json
git commit -m "chore(ci): forbidden Tagespuls vocabulary gate (Spec §1)"
```

---

## Phase F: Tests + Spec-Conformance Audit

### Task F1: Run full test suite

**Step F1.1:**

```bash
npm test 2>&1 | grep -E "Test Files|Tests:" | tail -2
# expect: ~252+ files / ~2360+ tests, all green
npm run lint
# expect: clean (includes vocab check now)
```

### Task F2: Spec-conformance checklist (manual review)

Read through the new spec doc at `docs/2026-05-09-tagespuls-spec-9-sections.md` and verify against the codebase:

- [ ] §2: `dayModeFromHarmony` thresholds 0.45 / 0.5 ✅ (already correct)
- [ ] §2: `intensity = abs(H − 0.45) / 0.55` ✅ (already correct)
- [ ] §3: slot prompts encode 10-20/10-15 word limits + 30-50 total — verify in `tagespuls.service.mjs` after Phase D
- [ ] §4: 6-figure council via `buildCouncilFromProfile` ✅ (already correct, no monthly/hourly leakage)
- [ ] §5: `buildInterpretationPrompt` enforces pulse=integration / trace=isolation / spannung=sequence ✅ (already correct)
- [ ] §6: aphorism JSON nested ✅; DB flat by design (documented Phase B)
- [ ] §6: translator validator ✅ (Phase C)
- [ ] §6: attribution_note pflicht when status≠verified ✅ (Phase C Zod schema)
- [ ] §6: word_count 8-15 enforced ✅ (Phase C)
- [ ] §7: scoring algorithm matches spec ✅ (Phase A)
- [ ] §8: anti-patterns — vocabulary gate ✅ (Phase E)

### Task F3: Final commit + push

```bash
git push origin spec-alignment-tagespuls
gh pr create --base main --head spec-alignment-tagespuls --title "Tagespuls spec alignment (9-section canonical)" --body-file docs/plans/2026-05-09-tagespuls-spec-alignment.md
```

---

## Out of Scope (deferred follow-ups)

- **Aphorism corpus expansion** beyond the 21 seeded rows — spec §3 examples imply a richer corpus is needed for cooldown to work meaningfully (30-day window with ~7 aphorisms per mode = exhaustion in 7 days). Track as `TASK-aphorism-corpus-expansion`.
- **Premium "Erweiterter Rat" UI** for monthly/hourly master figures (spec §4 mentions backend-only currently). Not in MVP scope.
- **`first_used` ledger** — spec §7 step 8 says "Setze first_used auf datum. Persistiere." Current impl uses `aphorism_usage_events` table per-user-per-day instead of a global `first_used` field. The spec is ambiguous which is canonical; if global first_used is required, that's a follow-up DB migration.
- **JSON → DB sync runbook** — Phase B documents the divergence but doesn't give a clean runbook for "add aphorism via vault → re-build JSON → seed DB". Track as `TASK-aphorism-sync-runbook`.
- **Multi-language slot 1** when `text.de` or `text.en` is empty — selection algorithm in `selectAphorismForUser` doesn't yet filter out aphorisms missing the user's locale. Spec §7 step 2 says "behalte nur Einträge mit nicht-leerem text_<user_language>" — minor enhancement.

---

## Summary

| Phase | Tasks | Commits | Files | Tests added |
|---|---|---|---|---|
| Pre-Flight 0.1-0.4 | Read-only state checks | 0 | 0 | 0 |
| Task 0 | Spec capture + plan + branch | 1 | 2 (spec doc + plan) | 0 |
| A — Selection scoring | A1 (pure helpers) + A2 (route wiring) | 2 | 4 | ~14 |
| B — Schema divergence doc | B1 (banner update) | 1 | 2 | 0 |
| C — TS build pipeline | C1 (Zod schema + tests) + C2 (port + verify parity) | 2 | 4-5 | ~10 |
| D — Slot word-count guard | D | 1 | 3 | +1 |
| E — Vocab CI gate | E1 | 1 | 2 | 0 |
| F — Test + audit + push | F1, F2, F3 | 0 | 0 | 0 |

**Total: 8 commits, ~17 files touched, ~25 new tests, 0 new runtime dependencies (only `tsx` + `gray-matter` if not already present in devDeps).**

After Phase F, the implementation matches the canonical 9-section spec exactly, with CI-enforced vocabulary discipline and Zod-validated build pipeline. All spec divergences are either closed or explicitly documented.

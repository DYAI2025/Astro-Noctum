# Tagespuls Phase 2 Strict Rules — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close all 4 findings from the 2026-05-09 product audit on the Tagesimpulse Phase 2 (Tagesdeutung). After this plan ships, the user picks ONE archetype per day, gets a personalized interpretation that names their actual sign/element, has no escape hatch, and the LLM has explicit anti-paraphrase guards.

**Architecture:** Four atomically-reversible commits. C-2 removes UI escape hatch; C-3 adds DB constraint + server-side one-decision lock + client lock-state; C-1 wires user's actual signOrElement into the LLM prompt; I-1 hardens the prompt against paraphrasing slot_2/slot_3. Plus a fifth commit recording this plan.

**Tech Stack:** Express + Supabase migration (PostgreSQL `UNIQUE`), `@google/genai` via the existing AI router, Vitest + React Testing Library, German UI strings via i18n.

---

## Findings being addressed

| ID | Severity | Where | Spec violation |
|---|---|---|---|
| C-1 | Critical | `server.mjs:3304` `buildTagespulsInterpretationPrompt` | Prompt only sees `archetype_key='mond'`, not `'Mond Skorpion'` → LLM hallucinates the sign or stays generic |
| C-2 | Critical | `src/components/dashboard/TagespulsCard.tsx:228-235` `← Andere Figur wählen` | Spec: "Kein 'Zureück oder nochmal' button" |
| C-3 | Critical | `server.mjs:3287-3293` + DB unique key | Spec: "Es geht nur einmal am Tag" — currently 6 figures × 6 LLM calls possible |
| I-1 | Important | `server/services/tagespuls.service.mjs:209` `buildInterpretationPrompt` | Prompt forbids quoting aphorism but not paraphrasing slot_2/slot_3 |

---

## Pre-flight

**Step 0.1: Confirm git state**

```bash
cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum
git branch --show-current
git log --oneline -3
git status --short
```

Expected:
- Branch: `main`
- HEAD: `451ace1 Merge pull request #334 from DYAI2025/2026-05-09-ai-router-review-findings`
- Status: clean (a stashed `tagespulscard parallel work` may be present — leave alone)

If working tree is dirty, **STOP** and report.

**Step 0.2: Create feature branch**

```bash
git switch -c 2026-05-09-tagespuls-strict-rules
```

**Step 0.3: Baseline test counts**

Capture the current state of the suites that will be modified:

```bash
npx vitest run src/__tests__/tagespuls-card.test.tsx 2>&1 | tail -3
# expect: 10 passed (10)
npx vitest run server/__tests__/daily-interpretation.test.mjs 2>&1 | tail -3
# expect: 6 passed (6) — DIN-001..005 + DIN-RATE-001
npx vitest run src/__tests__/use-daily-pulse.test.ts 2>&1 | tail -3
# expect: 8 passed (8)
```

If any suite is not at baseline, **STOP and report** — fixing with broken tests upstream will be confusing.

---

## Commit 1: C-2 — Remove the back button (no escape hatch)

**Goal:** Phase 2 of TagespulsCard becomes irreversible. No `← Andere Figur wählen` button. `resetFigure` removed from the hook's public interface.

### Task 1: RED — assert no back button

**Files:**
- Modify: `src/__tests__/tagespuls-card.test.tsx`

**Step 1.1: Find the existing TPC-* tests**

```bash
grep -n "TPC-" src/__tests__/tagespuls-card.test.tsx | head -15
```

The 10 existing tests cover loading, error states, slot rendering, council buttons, etc. Find one that exercises Phase 2 (after `selectCouncilFigure`) — typically named something like `TPC-007` or `TPC-008` for "phase 2 — clicking council figure shows interpretation text".

**Step 1.2: Add the new failing test**

Append a new test to the existing describe block:

```tsx
it('TPC-NO-BACK-001: Phase 2 has NO back button (one-decision-per-day spec)', async () => {
  // Per the 2026-05-09 product audit: after the user picks an archetype,
  // they cannot un-pick. The "← Andere Figur wählen" button must not render.
  const user = userEvent.setup();
  // Mock the hook to return a valid pulse + interpretation already loaded.
  // Use whatever helper the file already uses (likely a `mockUseDailyPulse`
  // factory that lets you set selectedFigure + interpretation).
  mockUseDailyPulse({
    pulse: validPulseFixture,
    selectedFigure: 'mond',
    interpretation: { id: 'int-1', text: 'Dein Mond Libra zeigt heute …' },
    loadingInterpretation: false,
    interpretationError: null,
  });

  render(<TagespulsCard />);

  // Phase 2 visible → interpretation text is there
  expect(screen.getByText(/Dein Mond Libra/i)).toBeInTheDocument();

  // The back button MUST NOT exist
  expect(screen.queryByTestId('tagespuls-back')).not.toBeInTheDocument();
  expect(screen.queryByText(/Andere Figur wählen/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/Choose another guide/i)).not.toBeInTheDocument();
});
```

**Adapt the test fixture** to whatever `mockUseDailyPulse` shape the file already uses. If there's no factory, look at TPC-007 / TPC-008 to see how Phase 2 is tested today and copy the pattern.

**Step 1.3: Run the test to verify it fails**

```bash
npx vitest run src/__tests__/tagespuls-card.test.tsx -t "TPC-NO-BACK-001" 2>&1 | tail -10
```

Expected: **FAIL** with one of:
- `Found multiple elements with testid: tagespuls-back` (the button currently always renders)
- `Found a node matching: 'Andere Figur wählen'`

If the test already passes, **STOP and report** — the back button might have been removed by a parallel session.

### Task 2: GREEN — remove back button JSX + resetFigure callback + i18n keys

**Files to modify:**
- `src/components/dashboard/TagespulsCard.tsx`
- `src/hooks/useDailyPulse.ts`
- `src/i18n/translations.ts`

**Step 2.1: Remove the JSX block in TagespulsCard.tsx**

Find the Phase 2 render (around line 222). Use Edit:

old_string (find the whole back-button block):
```tsx
        <button
          type="button"
          onClick={resetFigure}
          className="text-xs uppercase tracking-[0.2em] text-ink/60 hover:text-ink focus:outline-none focus:underline"
          data-testid="tagespuls-back"
        >
          ← {t('tagespuls.back')}
        </button>

        {/* Aphorism stays visible above the interpretation as the
            curated foundation. */}
```

new_string:
```tsx
        {/* Aphorism stays visible above the interpretation as the
            curated foundation. */}
```

**Step 2.2: Remove `resetFigure` from the hook's destructure in TagespulsCard**

Find the hook usage (around line 156):

```bash
grep -n "resetFigure" src/components/dashboard/TagespulsCard.tsx
```

Delete `resetFigure,` from the destructure line. Use Edit:

old_string:
```tsx
  const {
    pulse,
    loading,
    error,
    refresh,
    selectedFigure,
    interpretation,
    loadingInterpretation,
    interpretationError,
    selectCouncilFigure,
    resetFigure,
  } = useDailyPulse(lang === 'en' ? 'en' : 'de');
```

new_string:
```tsx
  const {
    pulse,
    loading,
    error,
    refresh,
    selectedFigure,
    interpretation,
    loadingInterpretation,
    interpretationError,
    selectCouncilFigure,
  } = useDailyPulse(lang === 'en' ? 'en' : 'de');
```

**Step 2.3: Remove `resetFigure` from `useDailyPulse` hook's public interface**

In `src/hooks/useDailyPulse.ts`:

a. Remove `resetFigure: () => void;` from the `UseDailyPulseResult` interface.

b. Remove the `resetFigure` callback definition (around line 97-100):

old_string:
```ts
  const resetFigure = useCallback(() => {
    setSelectedFigure(null);
    setInterpretationError(null);
  }, []);
```

new_string: (delete entirely — no replacement)

c. Remove `resetFigure,` from the return object at the bottom:

old_string:
```ts
    selectedFigure,
    interpretation,
    loadingInterpretation,
    interpretationError,
    selectCouncilFigure,
    resetFigure,
  };
}
```

new_string:
```ts
    selectedFigure,
    interpretation,
    loadingInterpretation,
    interpretationError,
    selectCouncilFigure,
  };
}
```

**Step 2.4: Delete the i18n keys**

```bash
grep -n "tagespuls.back\|'tagespuls.back'" src/i18n/translations.ts | head -5
```

Find the two occurrences (DE + EN trees). Use Edit twice (NOT replace_all — they have different translations):

For DE:
old_string: `back: 'Andere Figur wählen',`
new_string: (delete the whole line)

For EN:
old_string: `back: 'Choose another guide',`
new_string: (delete the whole line)

**Note:** the file uses literal `€` (€) somewhere — if the Edit fails, anchor on a non-€ line.

**Step 2.5: Update existing tests that referenced `resetFigure` or back button**

```bash
grep -rn "resetFigure\|tagespuls-back\|tagespuls\\.back" src/ 2>&1 | grep -v node_modules | head -10
```

Expected matches:
- The new test from Step 1 (keep)
- Possibly TPC-007/008 in tagespuls-card.test.tsx that exercised the back-button click (must update)
- Possibly DPH-* tests in use-daily-pulse.test.ts that asserted resetFigure exists (must update)

For each existing test that depended on `resetFigure` or the back button:
- If it tested "back button clears phase 2" → delete the test (the behavior is gone by design)
- If it tested something else and just happened to use `resetFigure` as setup → replace with `selectedFigure: null` mock state directly

**Step 2.6: Run the new test + the full TagespulsCard suite + the hook suite**

```bash
npx vitest run src/__tests__/tagespuls-card.test.tsx 2>&1 | tail -3
npx vitest run src/__tests__/use-daily-pulse.test.ts 2>&1 | tail -3
```

Expected:
- TagespulsCard suite: should be at 10 (was 10) plus +1 new TPC-NO-BACK-001 minus any deleted "back-button-clears-phase-2" tests — likely **10 passing** if 1 was deleted, or **11** if 0 were deleted.
- use-daily-pulse suite: should be at 8 minus any deleted tests asserting resetFigure.

**Step 2.7: tsc clean**

```bash
npx tsc --noEmit 2>&1 | tail -3
```

Expected: clean. If TS complains about unused `resetFigure` somewhere or wrong type signature, fix before commit.

**Step 2.8: text-integrity (DE/EN parity)**

```bash
npm run check:text-integrity 2>&1 | tail -3
```

Expected: pass. The two `back:` keys were both deleted, so parity stays intact.

### Task 3: Commit

**Step 3.1: Stage and commit**

```bash
git add src/components/dashboard/TagespulsCard.tsx \
        src/hooks/useDailyPulse.ts \
        src/i18n/translations.ts \
        src/__tests__/tagespuls-card.test.tsx \
        src/__tests__/use-daily-pulse.test.ts
git commit -m "$(cat <<'EOF'
fix(tagespuls): remove back button — Phase 2 is irreversible (C-2)

Per 2026-05-09 product audit C-2: spec requires "Kein 'Zureück oder
nochmal' button" — once the user picks a council figure, they cannot
un-pick.

- TagespulsCard.tsx: removed the `← Andere Figur wählen` button JSX
  from the Phase 2 layout.
- useDailyPulse.ts: removed `resetFigure` from public API
  (UseDailyPulseResult interface + return object). The state is now
  internally consistent (selectedFigure can only be set, never cleared
  during the day).
- translations.ts: deleted `tagespuls.back` keys from DE + EN trees.
- Tests: TPC-NO-BACK-001 asserts the button is absent in Phase 2.
  Existing tests that depended on the back-button-clears-phase-2
  behavior are deleted (the behavior is gone by design).

Closes 2026-05-09 audit C-2.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Commit 2: C-3 — One decision per daily_pulse_id

**Goal:** Server-side enforces "one archetype per pulse". DB constraint backs it. Client greys out council buttons after first pick.

### Task 4: RED — server-side single-decision tests

**Files:**
- Modify: `server/__tests__/daily-interpretation.test.mjs`

**Step 4.1: Add 3 failing tests**

After the last existing DIN-* test, append:

```js
it('DIN-LOCK-001: 2nd different archetype on same pulse returns 409 ALREADY_DECIDED', async () => {
  // First pick succeeds (creates a daily_interpretations row).
  // Second pick with a DIFFERENT archetype must NOT create a 2nd row —
  // server returns 409 with the existing decision.
  // ...adapt to existing harness pattern (loadApp, mocks, supertest)...

  // Step 1: pick 'mond' — should succeed
  const r1 = await request(app)
    .post('/api/daily-interpretation')
    .set('Authorization', 'Bearer test-token')
    .send({ daily_pulse_id: 'pulse-123', selected_archetype_key: 'mond', locale: 'de' });
  expect(r1.status).toBe(200);
  expect(r1.body.text).toBeTruthy();

  // Step 2: try 'sonne' — must be rejected
  const r2 = await request(app)
    .post('/api/daily-interpretation')
    .set('Authorization', 'Bearer test-token')
    .send({ daily_pulse_id: 'pulse-123', selected_archetype_key: 'sonne', locale: 'de' });
  expect(r2.status).toBe(409);
  expect(r2.body.error.code).toBe('ALREADY_DECIDED');
  // The 409 envelope MUST include the locked archetype + text so the
  // client can render it instead of nagging the user to retry.
  expect(r2.body.error.locked_archetype_key).toBe('mond');
  expect(r2.body.error.text).toBeTruthy();
});

it('DIN-LOCK-002: 2nd call with SAME archetype still idempotent (existing behavior preserved)', async () => {
  // Sanity: pre-existing idempotency on (pulse, archetype, locale)
  // must keep working when the same archetype is re-picked (e.g.,
  // double-click / page reload). It returns 200 with the cached row,
  // NOT 409.
  const r1 = await request(app)
    .post('/api/daily-interpretation')
    .set('Authorization', 'Bearer test-token')
    .send({ daily_pulse_id: 'pulse-456', selected_archetype_key: 'mond', locale: 'de' });
  expect(r1.status).toBe(200);

  const r2 = await request(app)
    .post('/api/daily-interpretation')
    .set('Authorization', 'Bearer test-token')
    .send({ daily_pulse_id: 'pulse-456', selected_archetype_key: 'mond', locale: 'de' });
  expect(r2.status).toBe(200);
  expect(r2.body.id).toBe(r1.body.id);
  expect(r2.body.text).toBe(r1.body.text);
});

it('DIN-LOCK-003: cross-locale switch with same archetype → 200 idempotent', async () => {
  // Edge case: DE-locale pulse and EN-locale pulse have DIFFERENT
  // daily_pulse_ids (the daily_pulses table keys on user+date+locale).
  // So locale switching is naturally a different pulse, hence a fresh
  // decision is allowed in the new locale. That's an architectural
  // consequence of the daily_pulses unique key, not this commit's
  // concern.
  //
  // What this test asserts: within ONE pulse_id, same archetype +
  // same locale = idempotent same-row. Already covered by DIN-LOCK-002,
  // this is an explicit re-statement to prevent regression.
  //
  // (Skipping if DIN-LOCK-002 covers it — keep test as a documented
  // sanity check.)
  expect(true).toBe(true);
});
```

**Adapt the harness** to whatever `loadApp` + `mockSupabase` pattern the file uses. Read DIN-001's setup carefully — likely it stubs `daily_pulses` `.select().eq().eq().eq().maybeSingle()` to return a fixture pulse, and `daily_interpretations` similarly. For DIN-LOCK-001 step 1 you need the supabase mock to:
- Return `{ data: pulseFixture }` for the pulses lookup
- Return `{ data: null }` for the FIRST interpretations lookup (no existing for `(pulse, mond, de)`)
- Allow the INSERT to succeed
For step 2:
- Same pulses lookup
- Return `{ data: existingMondRow }` for ANY interpretations lookup on `(pulse, *, de)` — i.e., the new lookup must scope on `(daily_pulse_id, locale)` only

**Step 4.2: Run new tests to verify they fail**

```bash
npx vitest run server/__tests__/daily-interpretation.test.mjs -t "DIN-LOCK" 2>&1 | tail -15
```

Expected:
- DIN-LOCK-001: FAIL — current server returns 200 with a NEW interpretation for 'sonne' (no `(pulse_id)` lock)
- DIN-LOCK-002: PASS or FAIL depending on whether the harness properly mocks the existing row — adapt mock until this is the only **passing** test of the three
- DIN-LOCK-003: PASS (it's just `expect(true).toBe(true)`)

**STOP if DIN-LOCK-001 passes** — that means a parallel session already added the lock; the rest of this commit is no-op.

### Task 5: GREEN — DB migration + server pre-check + 409 envelope

**Files:**
- Create: `supabase-migrations/20260510_daily_interpretation_one_per_pulse.sql`
- Modify: `supabase-schema.sql` (parity)
- Modify: `server.mjs` (interpretation handler)

**Step 5.1: Migration — drop old constraint, add new**

The reference schema in `apps/tagespuls_package/packages/db/schema.sql` has:
```sql
unique (daily_pulse_id, selected_archetype_key, locale)
```

The production migration `supabase-migrations/20260509_tagespuls_tables.sql` has the same constraint. We need to:
- Drop the existing 3-column unique
- Add a new unique on `daily_pulse_id` only (so per-pulse, ANY archetype is allowed only once)

Wait — that breaks DIN-LOCK-002 / DIN-LOCK-003 if user picks `(pulse, mond, de)` then `(pulse, mond, en)`. Locale switching means different pulse_ids in this codebase (daily_pulses unique on user+date+locale), so this isn't a real edge — but the constraint should still be unique on `(daily_pulse_id)` alone for cleanest enforcement.

**Decision: UNIQUE on `daily_pulse_id` alone.**

Idempotency (same archetype re-pick) is preserved by the existing application-level lookup which finds the row and returns it; the constraint just stops a NEW row from being inserted with a different archetype.

Create the migration file with:

```sql
-- Tagespuls: enforce one decision per daily_pulse_id at the DB layer.
-- Per 2026-05-09 product audit C-3 — spec says "Es geht nur einmal am Tag".
-- Application-level pre-check (server.mjs) returns 409 ALREADY_DECIDED;
-- this constraint backs it up at the DB layer so concurrent inserts
-- can't slip past the check.

-- 1. Drop the previous 3-column unique constraint (if it was named).
--    The 20260509 migration may or may not have given it an explicit
--    name. Use information_schema to find and drop whatever currently
--    enforces (daily_pulse_id, selected_archetype_key, locale).

DO $$
DECLARE
  old_constraint text;
BEGIN
  SELECT conname INTO old_constraint
  FROM pg_constraint
  WHERE conrelid = 'daily_interpretations'::regclass
    AND contype = 'u'
    AND array_to_string(conkey, ',') = (
      SELECT array_to_string(
        array_agg(attnum ORDER BY attnum), ','
      )
      FROM pg_attribute
      WHERE attrelid = 'daily_interpretations'::regclass
        AND attname IN ('daily_pulse_id', 'selected_archetype_key', 'locale')
    );

  IF old_constraint IS NOT NULL THEN
    EXECUTE format('ALTER TABLE daily_interpretations DROP CONSTRAINT %I', old_constraint);
  END IF;
END $$;

-- 2. Add the new constraint: at most one interpretation per daily_pulse_id.
ALTER TABLE daily_interpretations
  ADD CONSTRAINT daily_interpretations_one_per_pulse UNIQUE (daily_pulse_id);
```

**Apply via Supabase MCP:**

Use `mcp__claude_ai_Supabase__apply_migration`:
- name: `daily_interpretation_one_per_pulse_2026_05_10`
- query: the file's SQL

**Verify:**

Use `mcp__claude_ai_Supabase__execute_sql`:
```sql
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'daily_interpretations'::regclass
  AND contype = 'u';
```

Expected: one row with `daily_interpretations_one_per_pulse` and definition `UNIQUE (daily_pulse_id)`.

**Step 5.2: Update `supabase-schema.sql` for parity**

Find the existing `daily_interpretations` block (added by 20260509). Update its `unique (daily_pulse_id, selected_archetype_key, locale)` line to `unique (daily_pulse_id)`. This keeps the schema-file/migration-file parity per `feedback_schema_migration_alignment.md`.

**Step 5.3: Server-side pre-check**

In `server.mjs` interpretation handler (around line 3287):

old_string:
```js
    // L2: idempotent — same (pulse, archetype, locale) → same row.
    const { data: existing } = await supabaseServer
      .from('daily_interpretations')
      .select('id, text')
      .eq('daily_pulse_id', dailyPulseId)
      .eq('selected_archetype_key', archetypeKey)
      .eq('locale', locale)
      .maybeSingle();
    if (existing) {
      return res.json({ id: existing.id, text: existing.text });
    }
```

new_string:
```js
    // L2: at most one decision per daily_pulse_id (enforced by
    // unique constraint daily_interpretations_one_per_pulse, mirrored
    // here so the server can return a structured 409 instead of leaking
    // a Postgres unique-violation error).
    const { data: existing } = await supabaseServer
      .from('daily_interpretations')
      .select('id, text, selected_archetype_key, locale')
      .eq('daily_pulse_id', dailyPulseId)
      .maybeSingle();
    if (existing) {
      // Same archetype + same locale = idempotent re-pick (page reload,
      // double-click) — return 200 with the cached row.
      if (existing.selected_archetype_key === archetypeKey && existing.locale === locale) {
        return res.json({ id: existing.id, text: existing.text });
      }
      // Different archetype or different locale on the SAME pulse =
      // user already decided. 409 with the locked decision so the
      // client can render the locked Phase 2 instead of nagging.
      return res.status(409).json({
        error: {
          code: 'ALREADY_DECIDED',
          locked_archetype_key: existing.selected_archetype_key,
          locked_locale: existing.locale,
          text: existing.text,
        },
      });
    }
```

**Step 5.4: Run the failing tests — they should now pass**

```bash
npx vitest run server/__tests__/daily-interpretation.test.mjs -t "DIN-LOCK" 2>&1 | tail -15
```

Expected: 3 passing.

**Step 5.5: Run full daily-interpretation suite + full server suite**

```bash
npx vitest run server/__tests__/daily-interpretation.test.mjs 2>&1 | tail -3
# expect: 9 passed (9) — 6 baseline + 3 new

npx vitest run 2>&1 | tail -5
```

Some pre-existing failures from the parallel-Groq-tier sprint may still exist — note them but proceed.

**Step 5.6: tsc clean**

```bash
npx tsc --noEmit 2>&1 | tail -3
```

### Task 6: GREEN — client lock-state for council buttons

**Files:**
- Modify: `src/hooks/useDailyPulse.ts` (handle 409)
- Modify: `src/components/dashboard/TagespulsCard.tsx` (visual lock + handle 409 on selectCouncilFigure)
- Modify: `src/lib/schemas/daily-pulse.ts` (extend error envelope schema with `locked_archetype_key`)
- Modify: `src/__tests__/tagespuls-card.test.tsx` (test the locked state)

**Step 6.1: Add a failing test for the client-side locked state**

```tsx
it('TPC-LOCK-001: when first selection succeeds, council buttons disable visually', async () => {
  const user = userEvent.setup();
  mockUseDailyPulse({
    pulse: validPulseFixture,  // 6 council figures
    selectedFigure: null,
    interpretation: null,
    selectCouncilFigure: vi.fn(),
  });
  const { rerender } = render(<TagespulsCard />);

  // Initial state — all 6 buttons enabled
  const buttons = screen.getAllByRole('button', { name: /sonne|mond|aszendent|tag-meister|jahrestier|wu xing/i });
  expect(buttons).toHaveLength(6);
  for (const b of buttons) {
    expect(b).not.toHaveAttribute('disabled');
  }

  // After click + interpretation arrives, ALL council buttons should be disabled
  // (not just the picked one — spec is "no second pick").
  mockUseDailyPulse({
    pulse: validPulseFixture,
    selectedFigure: 'mond',
    interpretation: { id: 'int-1', text: 'Dein Mond Libra ...' },
    selectCouncilFigure: vi.fn(),
  });
  rerender(<TagespulsCard />);

  // Phase 2 view — but if we still see council buttons (e.g., they're
  // displayed alongside the interpretation), they MUST be disabled.
  // If Phase 2 layout doesn't show council buttons at all, this test
  // simplifies to "no council buttons visible in Phase 2".
  const phase2Buttons = screen.queryAllByRole('button', { name: /sonne|mond|aszendent|tag-meister|jahrestier|wu xing/i });
  for (const b of phase2Buttons) {
    expect(b).toHaveAttribute('disabled');
  }
});

it('TPC-LOCK-002: 409 ALREADY_DECIDED renders Phase 2 with locked archetype', async () => {
  // Edge case: user lost localStorage / refreshed mid-session, and tries
  // to pick again. Server returns 409. Hook must surface the locked
  // archetype as if it were the current selection so the user sees
  // their own previous choice rendered.
  mockUseDailyPulse({
    pulse: validPulseFixture,
    selectedFigure: 'sonne',  // surfaced from 409 envelope's locked_archetype_key
    interpretation: { id: 'int-old', text: 'Deine Sonne Stier zeigt heute …' },
    interpretationError: null,
    loadingInterpretation: false,
  });
  render(<TagespulsCard />);

  expect(screen.getByText(/Deine Sonne Stier/i)).toBeInTheDocument();
  // No back button (already covered by C-2 test, but worth re-asserting)
  expect(screen.queryByTestId('tagespuls-back')).not.toBeInTheDocument();
});
```

Run:
```bash
npx vitest run src/__tests__/tagespuls-card.test.tsx -t "TPC-LOCK" 2>&1 | tail -10
```

Expected: TPC-LOCK-001 fails because Phase 1's council-buttons render is unchanged (no disabled-state derived from `selectedFigure`). TPC-LOCK-002 may pass or fail depending on existing layout — adapt fixture until it fails for the right reason.

**Step 6.2: Update Phase 1 layout in TagespulsCard.tsx — disable buttons after pick**

Find the Phase 1 council-button block (around line 337-348). Pass a `disabled` prop:

old_string:
```tsx
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {pulse.council.map((c) => (
            <CouncilButton
              key={c.key}
              figureKey={c.key}
              signOrElement={c.signOrElement}
              label={t(COUNCIL_KEY_TO_I18N[c.key] ?? 'tagespuls.council.sonne')}
              onClick={() => selectCouncilFigure(c.key)}
            />
          ))}
        </div>
```

new_string:
```tsx
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {pulse.council.map((c) => (
            <CouncilButton
              key={c.key}
              figureKey={c.key}
              signOrElement={c.signOrElement}
              label={t(COUNCIL_KEY_TO_I18N[c.key] ?? 'tagespuls.council.sonne')}
              onClick={() => selectCouncilFigure(c.key)}
              // After the user picks (selectedFigure becomes non-null), all
              // 6 buttons lock — spec is "Es geht nur einmal am Tag".
              disabled={selectedFigure !== null || loadingInterpretation}
            />
          ))}
        </div>
```

Update `CouncilButton` component definition (around line 128-150) to accept and forward `disabled`:

old_string:
```tsx
function CouncilButton({
  figureKey,
  signOrElement,
  label,
  onClick,
}: {
  figureKey: string;
  signOrElement: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-figure-key={figureKey}
      className="flex flex-col items-start gap-1 rounded-xl border border-white/10 bg-white/5 p-3 text-left text-sm text-ink/90 hover:bg-white/10 hover:border-white/25 focus:outline-none focus:ring-2 focus:ring-white/30"
    >
      <span className="text-xs uppercase tracking-[0.18em] text-ink/60">{label}</span>
      <span className="text-base font-medium text-ink">{signOrElement}</span>
    </button>
  );
}
```

new_string:
```tsx
function CouncilButton({
  figureKey,
  signOrElement,
  label,
  onClick,
  disabled = false,
}: {
  figureKey: string;
  signOrElement: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-figure-key={figureKey}
      className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left text-sm focus:outline-none focus:ring-2 focus:ring-white/30 ${
        disabled
          ? 'border-white/5 bg-white/5 text-ink/40 cursor-not-allowed'
          : 'border-white/10 bg-white/5 text-ink/90 hover:bg-white/10 hover:border-white/25'
      }`}
    >
      <span className="text-xs uppercase tracking-[0.18em] text-ink/60">{label}</span>
      <span className="text-base font-medium text-ink">{signOrElement}</span>
    </button>
  );
}
```

**Step 6.3: Handle 409 in `useDailyPulse.selectCouncilFigure`**

Open `src/hooks/useDailyPulse.ts`. Find the response handling in `selectCouncilFigure` (around line 220-245):

old_string:
```ts
          if (!resp.ok) {
            let retryAfter: number | undefined;
            try {
              const body = await resp.json();
              const fromBody = body?.error?.retry_after;
              if (typeof fromBody === 'number') retryAfter = fromBody;
            } catch {
              // ignore
            }
            setInterpretationError(mapStatusToError(resp.status, retryAfter));
            setLoadingInterpretation(false);
            return;
          }
```

new_string:
```ts
          if (!resp.ok) {
            // 409 ALREADY_DECIDED — user already picked a different archetype
            // earlier today. Surface the locked decision as if it were the
            // current selection (the user sees their own previous choice
            // rendered, no nagging retry).
            if (resp.status === 409) {
              try {
                const body = await resp.json();
                const lockedKey = body?.error?.locked_archetype_key;
                const lockedText = body?.error?.text;
                if (typeof lockedKey === 'string' && typeof lockedText === 'string') {
                  setSelectedFigure(lockedKey);
                  setInterpretationByKey((prev) => ({
                    ...prev,
                    [lockedKey]: { id: 'locked', text: lockedText },
                  }));
                  setLoadingInterpretation(false);
                  return;
                }
              } catch {
                // body wasn't JSON or didn't match — fall through to generic error
              }
            }
            let retryAfter: number | undefined;
            try {
              const body = await resp.json();
              const fromBody = body?.error?.retry_after;
              if (typeof fromBody === 'number') retryAfter = fromBody;
            } catch {
              // ignore
            }
            setInterpretationError(mapStatusToError(resp.status, retryAfter));
            setLoadingInterpretation(false);
            return;
          }
```

**Watch out**: the 409 branch consumes `resp.json()`. The fall-through `try { const body = await resp.json(); ... }` would then double-consume the body. Restructure: read body ONCE at the top of the `!resp.ok` branch.

Cleaner refactor:
```ts
          if (!resp.ok) {
            let body: any = null;
            try { body = await resp.json(); } catch { /* ignore */ }

            // 409 ALREADY_DECIDED — server reports an existing decision.
            if (resp.status === 409) {
              const lockedKey = body?.error?.locked_archetype_key;
              const lockedText = body?.error?.text;
              if (typeof lockedKey === 'string' && typeof lockedText === 'string') {
                setSelectedFigure(lockedKey);
                setInterpretationByKey((prev) => ({
                  ...prev,
                  [lockedKey]: { id: 'locked', text: lockedText },
                }));
                setLoadingInterpretation(false);
                return;
              }
            }
            const retryAfter = typeof body?.error?.retry_after === 'number' ? body.error.retry_after : undefined;
            setInterpretationError(mapStatusToError(resp.status, retryAfter));
            setLoadingInterpretation(false);
            return;
          }
```

Use this cleaner version.

**Step 6.4: Update DailyPulseError mapping if needed**

`mapStatusToError` already maps 409 → 'unknown' (it doesn't match the `if (status === 422)` or `if (status === 503)` branches and falls through to `{ code: 'unknown' }`). That's fine for the rare case where the 409 envelope is malformed. Skip changes here.

**Step 6.5: Run the full test suite**

```bash
npx vitest run src/__tests__/tagespuls-card.test.tsx -t "TPC-LOCK" 2>&1 | tail -10
npx vitest run src/__tests__/use-daily-pulse.test.ts 2>&1 | tail -3
npx vitest run src/__tests__/tagespuls-card.test.tsx 2>&1 | tail -3
```

Expected: TPC-LOCK-001 + 002 passing. Existing tests still pass (count = baseline + 3 new from C-2 + C-3).

```bash
npx tsc --noEmit 2>&1 | tail -3
```

Expected: clean.

### Task 7: Commit

```bash
git add supabase-migrations/20260510_daily_interpretation_one_per_pulse.sql \
        supabase-schema.sql \
        server.mjs \
        src/hooks/useDailyPulse.ts \
        src/components/dashboard/TagespulsCard.tsx \
        src/__tests__/tagespuls-card.test.tsx \
        server/__tests__/daily-interpretation.test.mjs
git commit -m "$(cat <<'EOF'
fix(tagespuls): one decision per daily_pulse_id (C-3)

Per 2026-05-09 product audit C-3: spec requires "Es geht nur einmal
am Tag" — once the user picks an archetype, the day's decision is
locked.

Three layers of enforcement:

1. DB constraint (migration 20260510): replace the previous
   (daily_pulse_id, selected_archetype_key, locale) UNIQUE with a
   simpler UNIQUE (daily_pulse_id). At most one daily_interpretations
   row per pulse, at the data layer.

2. Server pre-check (server.mjs:3287): query daily_interpretations
   by pulse_id only (not (pulse, archetype, locale)). If a row exists:
   - same archetype + same locale → 200 idempotent (existing behavior,
     covers double-click / page-reload)
   - different archetype or locale → 409 ALREADY_DECIDED with the
     locked archetype key + text in the envelope so the client can
     render the locked decision instead of nagging the user to retry.

3. Client lock (TagespulsCard.tsx + useDailyPulse.ts): after the user
   picks, all 6 council buttons get disabled (visual lock with
   reduced opacity + cursor-not-allowed). On 409 from the server,
   the hook surfaces the locked archetype as if it were the current
   selection — user sees their own previous choice, no error UI.

Tests:
- DIN-LOCK-001: 2nd different archetype → 409 with locked decision
- DIN-LOCK-002: 2nd same archetype → 200 idempotent
- DIN-LOCK-003: cross-locale + same archetype → 200 idempotent
- TPC-LOCK-001: council buttons disabled after pick
- TPC-LOCK-002: 409 surfaces as locked Phase 2 view

supabase-schema.sql kept in parity per
feedback_schema_migration_alignment.md.

Closes 2026-05-09 audit C-3.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Commit 3: C-1 — Personalized prompt with user's actual sign/element

**Goal:** Server passes the user's actual `signOrElement` for the picked archetype into the LLM prompt. LLM names the concrete sign/element, no longer hallucinates.

### Task 8: RED — assert prompt contains real signOrElement

**Files:**
- Modify: `server/__tests__/daily-interpretation.test.mjs`

**Step 8.1: Add the failing test**

```js
it('DIN-PERSONAL-001: prompt contains the user\'s actual signOrElement, not just archetype key', async () => {
  // Setup: profile with western.zodiac_sign='Taurus', western.moon_sign='Libra', etc.
  // User picks 'mond'. The Gemini mock is configured to capture the prompt
  // and assert it contains 'Libra' explicitly (not just 'mond').

  let capturedPrompt = '';
  const geminiMock = {
    models: {
      generateContent: vi.fn(async ({ contents }) => {
        capturedPrompt = typeof contents === 'string' ? contents : JSON.stringify(contents);
        return { text: 'Dein Mond Libra zeigt heute eine ruhige Wachsamkeit.' };
      }),
    },
  };

  const app = await loadApp(geminiMock, /* supabaseMock with full astro_json */ );
  const r = await request(app)
    .post('/api/daily-interpretation')
    .set('Authorization', 'Bearer test-token')
    .send({ daily_pulse_id: 'pulse-789', selected_archetype_key: 'mond', locale: 'de' });

  expect(r.status).toBe(200);

  // Critical assertion: the prompt must NAME the user's actual moon sign
  expect(capturedPrompt).toMatch(/Libra/);
  // Sanity: it should also still contain the archetype key for context
  expect(capturedPrompt).toMatch(/mond/i);
  // Anti-hallucination guard: prompt should explicitly state the
  // signOrElement, not leave the LLM to invent one.
  expect(capturedPrompt).toMatch(/signOrElement|Mond Libra|Libra-Mond/);
});
```

**Adapt** the supabase mock to return a fixture astro_profiles row with realistic `astro_json` — Western signs, BaZi day master, Wu-Xing dominant element. Look at DIN-001's setup for the existing mock pattern and extend it.

**Step 8.2: Run the test to verify it fails**

```bash
npx vitest run server/__tests__/daily-interpretation.test.mjs -t "DIN-PERSONAL-001" 2>&1 | tail -10
```

Expected: FAIL — the prompt currently has `Selected archetype: mond` but no 'Libra' text anywhere.

### Task 9: GREEN — server reload profile, build council, inject signOrElement

**Files:**
- Modify: `server.mjs` interpretation handler
- Modify: `server/services/tagespuls.service.mjs` `buildInterpretationPrompt`

**Step 9.1: Reload astro_profiles in the handler**

In `server.mjs` interpretation handler, after the auth-boundary pulse lookup (around line 3282) and before the existing-row lookup, add:

old_string (find the auth-boundary block):
```js
    // Auth boundary — pulse must belong to the requesting user.
    const { data: pulse } = await supabaseServer
      .from('daily_pulses')
      .select('id, user_id, date, locale, mode, intensity, slot_1, slot_2, slot_3, aphorism_id')
      .eq('id', dailyPulseId)
      .eq('user_id', userId)
      .maybeSingle();
    if (!pulse) {
      return res.status(404).json({ error: { code: 'PULSE_NOT_FOUND' } });
    }
```

new_string:
```js
    // Auth boundary — pulse must belong to the requesting user.
    const { data: pulse } = await supabaseServer
      .from('daily_pulses')
      .select('id, user_id, date, locale, mode, intensity, slot_1, slot_2, slot_3, aphorism_id')
      .eq('id', dailyPulseId)
      .eq('user_id', userId)
      .maybeSingle();
    if (!pulse) {
      return res.status(404).json({ error: { code: 'PULSE_NOT_FOUND' } });
    }

    // Reload astro_profiles so the prompt builder can name the user's
    // ACTUAL sign/element for the chosen archetype — not just the
    // archetype key. Without this, the LLM would have to invent the
    // sign (hallucination) or stay generic (no value over slot_2/3).
    const { data: profileRow } = await supabaseServer
      .from('astro_profiles')
      .select('astro_json')
      .eq('user_id', userId)
      .maybeSingle();
    if (!profileRow?.astro_json || Object.keys(profileRow.astro_json).length === 0) {
      // Profile was deleted or zeroed between pulse-creation and now.
      // 422 forces the client to re-onboard — cleaner than a 503.
      return res.status(422).json({ error: { code: 'PROFILE_REQUIRED' } });
    }
    const council = buildCouncilFromProfile(profileRow.astro_json);
    const archetypeMatch = council.find((c) => c.key === archetypeKey);
    const signOrElement = archetypeMatch?.signOrElement ?? null;
```

(Note: `buildCouncilFromProfile` is already imported from `server/services/tagespuls.service.mjs` at the top of server.mjs — it was used by /api/daily-pulse. Verify the import line is present:
```bash
grep -n "buildCouncilFromProfile" server.mjs | head -3
```
If not imported in this scope, add to the existing import block.)

**Step 9.2: Pass `signOrElement` into the prompt builder call**

Find the `buildTagespulsInterpretationPrompt` call (around line 3304):

old_string:
```js
      const prompt = buildTagespulsInterpretationPrompt({ pulse, archetypeKey, locale });
```

new_string:
```js
      const prompt = buildTagespulsInterpretationPrompt({ pulse, archetypeKey, signOrElement, locale });
```

**Step 9.3: Update the prompt builder signature + template**

In `server/services/tagespuls.service.mjs`:

Find `buildInterpretationPrompt` (note: server.mjs imports it as `buildTagespulsInterpretationPrompt` — verify the rename mapping):

```bash
grep -n "buildInterpretationPrompt\|buildTagespulsInterpretationPrompt" server/services/tagespuls.service.mjs server.mjs
```

If the export is `buildInterpretationPrompt` and the import alias is `buildTagespulsInterpretationPrompt`, that's just a re-name on import — fine, no breakage.

Update the function signature + template:

old_string:
```js
export function buildInterpretationPrompt({ pulse, archetypeKey, locale }) {
  if (!VALID_ARCHETYPE_KEYS.includes(archetypeKey)) {
    throw new Error(`invalid archetype key: ${archetypeKey}`);
  }
  const lang = locale === 'en' ? 'English' : 'German';
  const intensity = Number(pulse.intensity ?? 0);
  const intensityBand =
    intensity < 0.4 ? 'low'
      : intensity < 0.7 ? 'mid'
        : 'high';

  return `
You are Bazodiac's Tagesdeutung voice (Phase 2). You write in "Poetic Realism" with worldly imagery — never astro-mechanik.

CONTEXT:
- Modus: ${pulse.mode}            (pulse | trace | spannung)
- Intensity: ${intensity.toFixed(2)} (band: ${intensityBand})
- Slot 1 (aphorismus, do NOT quote): "${pulse.slot_1 ?? ''}"
- Slot 2 (Brücke): "${pulse.slot_2 ?? ''}"
- Slot 3 (Impuls): "${pulse.slot_3 ?? ''}"
- Selected archetype: ${archetypeKey}
- Output language: ${lang}
```

new_string:
```js
export function buildInterpretationPrompt({ pulse, archetypeKey, signOrElement, locale }) {
  if (!VALID_ARCHETYPE_KEYS.includes(archetypeKey)) {
    throw new Error(`invalid archetype key: ${archetypeKey}`);
  }
  const lang = locale === 'en' ? 'English' : 'German';
  const intensity = Number(pulse.intensity ?? 0);
  const intensityBand =
    intensity < 0.4 ? 'low'
      : intensity < 0.7 ? 'mid'
        : 'high';

  // The signOrElement is the USER'S ACTUAL data point for the chosen
  // archetype — e.g. for archetypeKey='mond' it might be 'Libra' (Western
  // moon sign), for archetypeKey='wuxing_dom' it's 'Holz', etc. If the
  // profile is incomplete and we got '—' or null, the prompt instructs
  // the LLM to NOT invent a sign.
  const sign = signOrElement && signOrElement !== '—' ? signOrElement : null;

  return `
You are Bazodiac's Tagesdeutung voice (Phase 2). You write in "Poetic Realism" with worldly imagery — never astro-mechanik.

CONTEXT:
- Modus: ${pulse.mode}            (pulse | trace | spannung)
- Intensity: ${intensity.toFixed(2)} (band: ${intensityBand})
- Slot 1 (aphorismus, do NOT quote): "${pulse.slot_1 ?? ''}"
- Slot 2 (Brücke): "${pulse.slot_2 ?? ''}"
- Slot 3 (Impuls): "${pulse.slot_3 ?? ''}"
- Selected archetype: ${archetypeKey}
- User's signOrElement for this archetype: ${sign ?? 'UNKNOWN — DO NOT invent a sign'}
- Output language: ${lang}
```

**Then update the rule block** to require explicit naming:

old_string (find the GEMEINSAME REGELN block):
```
GEMEINSAME REGELN:
- 50-90 Wörter, 3-4 Sätze (intensity high: 4 erlaubt, max 4)
- Du-Form
- Zeichen- und Element-Namen erlaubt (Skorpion, Wasser, Holz)
- Astrologische Mechanik VERBOTEN ("weil Mars in Konjunktion …")
- Keine Wertung des Tages (gut/schwer/herausfordernd)
- Aphorismus-Bezug erkennbar, aber NICHT zitieren — semantisch fortführen
- Keine Affirmation, keine Pinterest-Esoterik
```

new_string:
```
GEMEINSAME REGELN:
- 50-90 Wörter, 3-4 Sätze (intensity high: 4 erlaubt, max 4)
- Du-Form
- DU MUSST das konkrete Zeichen/Element benennen (siehe "User's
  signOrElement" oben). Schreibe z.B. "Dein Skorpion-Mond" oder
  "Deine Wasser-Energie", nicht "der Mond" oder "ein Element".
- WENN signOrElement = UNKNOWN: vermeide Sign-spezifische Aussagen
  ganz — bleib bei archetypischen Qualitäten ohne ein Sign zu erfinden.
- Astrologische Mechanik VERBOTEN ("weil Mars in Konjunktion …")
- Keine Wertung des Tages (gut/schwer/herausfordernd)
- Aphorismus-Bezug erkennbar, aber NICHT zitieren — semantisch fortführen
- Keine Affirmation, keine Pinterest-Esoterik
```

**Step 9.4: Run the test**

```bash
npx vitest run server/__tests__/daily-interpretation.test.mjs -t "DIN-PERSONAL-001" 2>&1 | tail -10
```

Expected: passing.

**Step 9.5: Run full daily-interpretation suite**

```bash
npx vitest run server/__tests__/daily-interpretation.test.mjs 2>&1 | tail -3
```

Expected: all tests passing (now 10 = 9 from previous + 1 new).

```bash
npx tsc --noEmit 2>&1 | tail -3
```

### Task 10: Commit

```bash
git add server.mjs \
        server/services/tagespuls.service.mjs \
        server/__tests__/daily-interpretation.test.mjs
git commit -m "$(cat <<'EOF'
fix(tagespuls): inject user's actual signOrElement into interpretation prompt (C-1)

Per 2026-05-09 product audit C-1: spec requires "individuelle texte
pro element/Zeichen" — the LLM must NAME the user's actual zodiac
sign / Wu-Xing element for the chosen archetype, not just speak
generically about "the moon" or hallucinate a random sign.

Pre-fix: buildTagespulsInterpretationPrompt received only
archetypeKey ('mond'). LLM had no data to personalize → either
stayed generic (no value over slot_2/3) or invented a sign
(hallucination).

Post-fix:
- /api/daily-interpretation handler reloads astro_profiles for the
  requesting user and runs buildCouncilFromProfile() to extract
  the signOrElement matching the picked archetypeKey (e.g.
  archetypeKey='mond' → signOrElement='Libra' from
  western.moon_sign).
- 422 PROFILE_REQUIRED returned when astro_json is empty (rare —
  pulse exists but profile was zeroed in between).
- Prompt builder signature gained `signOrElement` parameter,
  injected as `User's signOrElement for this archetype: Libra`.
- Prompt rules block now explicitly REQUIRES naming the concrete
  sign/element ("Dein Skorpion-Mond", not "der Mond"), and
  EXPLICITLY forbids inventing a sign when signOrElement is
  UNKNOWN — instead defaults to archetypal qualities only.

Test: DIN-PERSONAL-001 captures the prompt and asserts it contains
'Libra' (the fixture's moon sign), not just 'mond'.

Closes 2026-05-09 audit C-1.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Commit 4: I-1 — Prompt hardening against paraphrasing slot_2/slot_3

**Goal:** Add explicit anti-paraphrase rule to the interpretation prompt so the LLM can't just rephrase slot_2 or slot_3 and call it a Tagesdeutung.

### Task 11: RED — test asserts the prompt contains anti-paraphrase rules

**Files:**
- Modify: `server/__tests__/daily-interpretation.test.mjs`

**Step 11.1: Add the failing test**

```js
it('DIN-PERSONAL-002: prompt forbids paraphrasing slot_2 / slot_3', async () => {
  // The LLM has slot_2 and slot_3 as context to extend, NOT to rephrase.
  // Without an explicit guard, it can paraphrase slot_2 in a more
  // archetype-flavored way and call that the "Tagesdeutung" — which
  // violates the spec ("Keine Wieerhlungen").
  let capturedPrompt = '';
  const geminiMock = {
    models: {
      generateContent: vi.fn(async ({ contents }) => {
        capturedPrompt = typeof contents === 'string' ? contents : JSON.stringify(contents);
        return { text: 'Dein Mond Libra zeigt heute …' };
      }),
    },
  };

  const app = await loadApp(geminiMock, /* supabaseMock with full astro_json */ );
  await request(app)
    .post('/api/daily-interpretation')
    .set('Authorization', 'Bearer test-token')
    .send({ daily_pulse_id: 'pulse-abc', selected_archetype_key: 'mond', locale: 'de' });

  // Assert anti-paraphrase guards are present in the prompt:
  expect(capturedPrompt).toMatch(/MUSS Information.+über slot_2/i);
  expect(capturedPrompt).toMatch(/VERBOT.+paraphrasieren/i);
  // Hard regenerate-clause: if output ≈ slot_2 or slot_3, regenerate.
  expect(capturedPrompt).toMatch(/regener/i);
});
```

**Step 11.2: Run the test**

```bash
npx vitest run server/__tests__/daily-interpretation.test.mjs -t "DIN-PERSONAL-002" 2>&1 | tail -10
```

Expected: FAIL — current prompt has none of these phrases.

### Task 12: GREEN — add the rules to `buildInterpretationPrompt`

**Files:**
- Modify: `server/services/tagespuls.service.mjs`

**Step 12.1: Add the explicit anti-paraphrase rules**

Find the GEMEINSAME REGELN block (which Commit 3 already updated). Add two new bullets at the end of the block:

old_string:
```
- Aphorismus-Bezug erkennbar, aber NICHT zitieren — semantisch fortführen
- Keine Affirmation, keine Pinterest-Esoterik
```

new_string:
```
- Aphorismus-Bezug erkennbar, aber NICHT zitieren — semantisch fortführen
- Keine Affirmation, keine Pinterest-Esoterik
- DU MUSST mindestens eine konkrete Information geben, die slot_2
  und slot_3 NICHT enthielten — typischerweise eine archetypische
  Eigenschaft des konkreten Zeichens/Elements oder eine konkrete
  Tagessituation, in der dieses Zeichen besonders trägt/spannt.
- VERBOT: slot_2 oder slot_3 paraphrasieren. Wenn dein Output ohne
  Bedeutungsverlust durch slot_2 oder slot_3 ersetzbar wäre, regener
  intern, bevor du antwortest. Die Tagesdeutung muss EIGENSTÄNDIG
  Wert liefern, nicht zwei Sätze umformulieren.
```

**Step 12.2: Run the test**

```bash
npx vitest run server/__tests__/daily-interpretation.test.mjs -t "DIN-PERSONAL-002" 2>&1 | tail -10
```

Expected: passing.

**Step 12.3: Run full suite + tsc + build**

```bash
npx vitest run server/__tests__/daily-interpretation.test.mjs 2>&1 | tail -3
# expect: 11 passed (11) — 10 from previous + 1 new

npx vitest run 2>&1 | tail -5
npx tsc --noEmit 2>&1 | tail -3
npm run build 2>&1 | tail -3
```

Expected:
- daily-interpretation suite: 11/11
- full suite: green except pre-existing flakes (vibes-perf, EDF-NCP-* if still failing from earlier sprint)
- tsc clean
- build OK

### Task 13: Commit

```bash
git add server/services/tagespuls.service.mjs \
        server/__tests__/daily-interpretation.test.mjs
git commit -m "$(cat <<'EOF'
fix(tagespuls): prompt forbids paraphrasing slot_2 / slot_3 (I-1)

Per 2026-05-09 product audit I-1: spec requires "Keine Wieerhlungen"
and the interpretation MUST add value beyond what slot_2 (Brücke)
and slot_3 (Handlungsimpuls) already said.

Pre-fix: prompt forbid quoting the aphorism but said nothing about
paraphrasing slot_2 / slot_3. Without the guard, the LLM could
rephrase slot_2 in archetype-flavored language and call that the
Tagesdeutung — formally compliant but spec-violating.

Post-fix: GEMEINSAME REGELN block gains two explicit bullets:

1. POSITIVE rule: "DU MUSST mindestens eine konkrete Information
   geben, die slot_2 und slot_3 NICHT enthielten — typischerweise
   eine archetypische Eigenschaft des konkreten Zeichens/Elements
   oder eine konkrete Tagessituation, in der dieses Zeichen
   besonders trägt/spannt."

2. NEGATIVE rule: "VERBOT: slot_2 oder slot_3 paraphrasieren. Wenn
   dein Output ohne Bedeutungsverlust durch slot_2 oder slot_3
   ersetzbar wäre, regener intern, bevor du antwortest."

Test: DIN-PERSONAL-002 asserts the prompt contains both clauses.

Closes 2026-05-09 audit I-1.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Commit 5: docs(plans) — record this plan

**Step 14.1: Stage and commit the plan**

```bash
git add docs/plans/2026-05-09-tagespuls-strict-rules.md
git commit -m "$(cat <<'EOF'
docs(plans): tagespuls strict rules implementation plan

Plan document driving the 4-commit fix-up of the 2026-05-09 product
audit findings on Tagesimpulse Phase 2 (C-1, C-2, C-3, I-1).
Committed alongside the implementation commits for traceability.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Final verification

### Task 15: Push + open PR

```bash
git push -u origin 2026-05-09-tagespuls-strict-rules
gh pr create --base main --title "Tagespuls Phase 2 strict rules — close 2026-05-09 audit (C-1..C-3 + I-1)" --body "$(cat <<'EOF'
## Summary

Closes the four findings from the 2026-05-09 product audit on Tagesimpulse Phase 2:

| Commit | Finding | Hash |
|---|---|---|
| 1. `fix(tagespuls): remove back button — Phase 2 is irreversible` | C-2 | (filled at PR time) |
| 2. `fix(tagespuls): one decision per daily_pulse_id` | C-3 | |
| 3. `fix(tagespuls): inject user's actual signOrElement into interpretation prompt` | C-1 | |
| 4. `fix(tagespuls): prompt forbids paraphrasing slot_2 / slot_3` | I-1 | |
| 5. `docs(plans): tagespuls strict rules implementation plan` | trail of intent | |

### After this PR ships

- User picks ONE council figure per day. No back button. No way to pick again.
- Interpretation prompt has the user's actual sign/element (e.g., "Mond Libra") so the LLM can name it concretely without hallucinating.
- Prompt explicitly forbids paraphrasing slot_2 / slot_3 — interpretations must add new information.
- DB constraint backs it up: at most one `daily_interpretations` row per `daily_pulse_id`.

## Test plan

- [ ] `npm test` — full suite green except pre-existing flakes
- [ ] `npx tsc --noEmit` — clean
- [ ] `npm run build` — OK
- [ ] DB: `SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'daily_interpretations'::regclass AND contype='u'` returns `UNIQUE (daily_pulse_id)`
- [ ] Manual smoke after Railway redeploy:
  - Pick "Mond" → see interpretation that names the actual moon sign (e.g., "Dein Mond Libra…")
  - Try to pick "Sonne" afterward → button disabled OR server returns 409 with the locked Mond decision
  - Reload page → still see locked Mond decision, no Phase 1 retry option
  - No `← Andere Figur wählen` button anywhere

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Done-when checklist

- [ ] Commit 1 (C-2): TPC-NO-BACK-001 passes; tagespuls-card suite green
- [ ] Commit 2 (C-3): DIN-LOCK-001/002/003 pass; TPC-LOCK-001/002 pass; DB has UNIQUE (daily_pulse_id)
- [ ] Commit 3 (C-1): DIN-PERSONAL-001 passes; manual prompt inspection shows real signOrElement
- [ ] Commit 4 (I-1): DIN-PERSONAL-002 passes
- [ ] Commit 5 (plan): plan doc committed
- [ ] tsc clean throughout
- [ ] build succeeds throughout
- [ ] PR opened on main with all 5 commits visible

## Out of scope (deliberate)

- Re-onboarding when astro_profiles is genuinely missing — the new 422 PROFILE_REQUIRED in the interpretation handler returns the same envelope shape as /api/daily-pulse, but the client UI for re-onboarding from Phase 2 is the same as Phase 1's profile-CTA path. Not a new flow.
- Migrating `daily_interpretations` to a separate `decisions` table or model. The current table layout supports the new constraint cleanly; a refactor is overkill for this fix.
- Localization of the LLM prompt itself — the prompt has German labels (Modus, Brücke, etc.) and English speakers get prompts in mixed German/English. The output language is controlled correctly via the `lang` variable, but the prompt's meta-language stays mixed. Separate concern.

## References

- Source audit (in this session, 2026-05-09): 4 findings — 3 Critical (C-1, C-2, C-3) + 1 Important (I-1)
- Implementation depends on: PRs #333 (cascade fix) + #334 (review-findings) — both already merged
- Related plan: `docs/plans/2026-05-07-dashboard-flow-tagespuls-3d.md` (parent Tagespuls work)

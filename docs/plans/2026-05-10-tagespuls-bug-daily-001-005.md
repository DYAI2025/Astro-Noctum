# Tagespuls Bug Fixes — BUG-DAILY-001 through 005

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close 5 user-reported bugs on the Tagesimpuls feature: remove user-facing internal LLM labels, consolidate 3 slots into one natural impulse text, persist the decision lock across browser back / refresh / re-render, and ensure deep interpretation extends rather than replaces the daily impulse.

**Architecture:** Three TDD commits + one plan-record commit. Commit 1 collapses the 3-slot prompt + render into a single consolidated `impulse_text`. Commit 2 extends `/api/daily-pulse` with an `existing_decision` field so the hook can hydrate Phase 2 directly on mount (no Phase 1 flash, no surprise pick after browser-back). Commit 3 ensures Phase 2 keeps the daily impulse text visible above the deep interpretation.

**Tech Stack:** Express (`server.mjs`), Supabase (`daily_pulses` table — column reuse, no migration), Vitest + React Testing Library, German UI strings via i18n.

---

## Findings being addressed

| ID | Severity | Where | Spec violation |
|---|---|---|---|
| BUG-DAILY-001 | High | `TagespulsCard.tsx:317-333` + `translations.ts:511,1039` | "Bridge to Today" / "Action Impulse" labels visible in user UI |
| BUG-DAILY-002 | High | `Dashboard.tsx` mount + Card content | Daily Impulse position / wrong text — must be top + consolidated |
| BUG-DAILY-003 | High | `useDailyPulse.ts` + `Dashboard.tsx` mount | Browser back-button shows Phase 1 with active selection again |
| BUG-DAILY-004 | High | `useDailyPulse.ts` + `TagespulsCard.tsx` | After-pick lock state is not consistent across refresh / re-render |
| BUG-DAILY-005 | High | `TagespulsCard.tsx` Phase 2 layout | Deep interpretation replaces daily impulse text instead of extending |

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
- HEAD: `aa6258a Merge pull request #332 from DYAI2025/2026-05-09-tagespuls-doc-reconciliation`
- Status: clean (a stashed `tagespulscard parallel work` may be present — leave alone)

If working tree is dirty, **STOP** and report.

**Step 0.2: Create feature branch**

```bash
git switch -c 2026-05-10-tagespuls-bug-daily-001-005
```

**Step 0.3: Capture baseline test counts**

```bash
npx vitest run src/__tests__/tagespuls-card.test.tsx 2>&1 | tail -3
npx vitest run server/__tests__/daily-pulse.test.mjs 2>&1 | tail -3
npx vitest run server/__tests__/daily-interpretation.test.mjs 2>&1 | tail -3
npx vitest run src/__tests__/use-daily-pulse.test.ts 2>&1 | tail -3
```

Note the counts — they're the deltas-base for each commit's report.

If any suite is not green at baseline, **STOP and report** — fixing on top of broken tests will compound errors.

---

## Commit 1: BUG-001 + BUG-002 — Consolidated impulse text, no labels

**Goal:** The LLM produces ONE consolidated paragraph (aphorism context + bridge + action impulse, woven together) instead of two separate slots. The component renders the paragraph cleanly without "Bridge to today" / "Action impulse" headers. The text reads as natural narration, not a structured form.

### Architectural decisions

1. **DB column reuse**, no migration. Write the consolidated text to `daily_pulses.slot_2`. Set `slot_3 = NULL` for new rows. Legacy rows that have both slots get concatenated server-side at read time.
2. **Wire shape change**: API response gets a new `aphorism.impulse_text: string | null` field, derived server-side. `slot_2` / `slot_3` stay in the wire for backward compat (Zod still has them); component prefers `impulse_text`.
3. **Prompt change**: rules block requires single-text output, asks for `{ "impulse_text": "..." }` JSON instead of `{ "slot_2", "slot_3" }`.
4. **i18n cleanup**: `tagespuls.bridge` and `tagespuls.impulse` keys removed from both DE + EN trees.

### Task 1: RED — assert no labels in DOM, single paragraph render

**Files:**
- Modify: `src/__tests__/tagespuls-card.test.tsx`

**Step 1.1: Read the existing harness**

```bash
grep -n "TPC-\|describe(\|mockUseDailyPulse\|validPulseFixture" src/__tests__/tagespuls-card.test.tsx | head -15
```

Note the existing fixtures — find `validPulseFixture` or similar. Check whether it has `slot_2` / `slot_3` fields, and whether it already has `impulse_text` (it shouldn't yet).

**Step 1.2: Add the failing test**

Append after the most recent test (likely TPC-LOCK-002 or TPC-NO-BACK-001):

```tsx
  it('TPC-NO-LABELS-001: no internal Bridge/Impulse labels appear in Phase 1', () => {
    // BUG-DAILY-001: "Bridge to today" / "Action impulse" are internal
    // prompt labels and must never appear in user-facing UI.
    mockUseDailyPulse({
      pulse: {
        ...validPulseFixture,
        aphorism: {
          ...validPulseFixture.aphorism,
          impulse_text: 'Heute trägt Mass mehr als der nächste Beweis. Schau hin, ohne sofort zu bewerten.',
          slot_2: null,
          slot_3: null,
        },
      },
      selectedFigure: null,
    });
    render(<TagespulsCard />);

    // Anti-label DOM walk — neither EN nor DE label may appear
    expect(screen.queryByText(/Bridge to today/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Brücke ins Heute/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Action impulse/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Handlungsimpuls/i)).not.toBeInTheDocument();

    // The consolidated impulse text IS rendered
    expect(screen.getByText(/Heute trägt Mass/i)).toBeInTheDocument();

    // Old testids gone (we expect to delete tagespuls-bridge / tagespuls-impulse
    // and replace with a single tagespuls-impulse-text)
    expect(screen.queryByTestId('tagespuls-bridge')).not.toBeInTheDocument();
    expect(screen.queryByTestId('tagespuls-impulse')).not.toBeInTheDocument();
    expect(screen.getByTestId('tagespuls-impulse-text')).toBeInTheDocument();
  });

  it('TPC-NO-LABELS-002: legacy 2-slot fixture (slot_2 + slot_3) still renders without labels — server consolidates', () => {
    // Backward compat: cached pulse rows from before this fix have both
    // slot_2 and slot_3 populated. The server normalizes them into
    // impulse_text. The component renders impulse_text only, never the
    // raw slots.
    mockUseDailyPulse({
      pulse: {
        ...validPulseFixture,
        aphorism: {
          ...validPulseFixture.aphorism,
          impulse_text: 'Legacy bridge text. Legacy action impulse text.',
          // Legacy slots stay populated for back-compat — must NOT render
          slot_2: 'Legacy bridge text.',
          slot_3: 'Legacy action impulse text.',
        },
      },
      selectedFigure: null,
    });
    render(<TagespulsCard />);

    expect(screen.queryByText(/Bridge to today|Brücke ins Heute|Action impulse|Handlungsimpuls/)).not.toBeInTheDocument();
    expect(screen.getByText(/Legacy bridge text\. Legacy action impulse text\./)).toBeInTheDocument();

    // The raw slot_2 / slot_3 strings should NOT appear as separate
    // sections — only impulse_text (which the server constructed by
    // joining legacy slots).
    const bridgeSpans = screen.queryAllByTestId('tagespuls-bridge');
    expect(bridgeSpans).toHaveLength(0);
  });
```

**Adapt** the `validPulseFixture` reference / `mockUseDailyPulse` call to whatever the file already uses. If `validPulseFixture` doesn't currently have `impulse_text`, the test will TS-fail on the spread — that's expected (RED).

**Step 1.3: Run the test to verify it fails (RED)**

```bash
npx vitest run src/__tests__/tagespuls-card.test.tsx -t "TPC-NO-LABELS" 2>&1 | tail -15
```

Expected: FAIL — either:
- TS error: `impulse_text` doesn't exist on aphorism
- Runtime: `Found a node matching: 'Bridge to today'` or `Brücke ins Heute`
- `data-testid="tagespuls-impulse-text"` not found

**STOP and report** if it passes — somebody already shipped this.

### Task 2: GREEN — schema, server, component, i18n

**Files (4 files modified):**
- `src/lib/schemas/daily-pulse.ts` (add `impulse_text` to wire)
- `server.mjs` (consolidate prompt + emit impulse_text + back-compat for legacy rows)
- `src/components/dashboard/TagespulsCard.tsx` (render single paragraph)
- `src/i18n/translations.ts` (delete bridge/impulse labels)

**Step 2.1: Schema — add `impulse_text` to wire**

Use Edit:
- file_path: `/Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/lib/schemas/daily-pulse.ts`
- old_string:
```ts
export const PulseWireAphorismSchema = z.object({
  id: z.string().nullable(),
  author: z.string().nullable(),
  attribution_status: AttributionStatusSchema.nullable(),
  slot_1: z.string(),
  slot_2: z.string().nullable(),
  slot_3: z.string().nullable(),
});
```
- new_string:
```ts
export const PulseWireAphorismSchema = z.object({
  id: z.string().nullable(),
  author: z.string().nullable(),
  attribution_status: AttributionStatusSchema.nullable(),
  slot_1: z.string(),
  // BUG-DAILY-001: consolidated impulse text. Server combines legacy
  // slot_2 + slot_3 rows into this field at read time. New rows write
  // only impulse_text (mirrored to slot_2 in DB for column reuse).
  // Component prefers impulse_text; slot_2 / slot_3 stay in the schema
  // for back-compat with cached rows during the transition.
  impulse_text: z.string().nullable(),
  slot_2: z.string().nullable(),
  slot_3: z.string().nullable(),
});
```

**Step 2.2: Server — update prompt + response shape**

Find `buildSlotPrompt` in `server/services/tagespuls.service.mjs`:

```bash
grep -n "buildSlotPrompt\|slot_2.*slot_3\|JSON.*Schema" server/services/tagespuls.service.mjs | head -10
```

Use Edit to update the prompt's CONTEXT and SLOT instructions:

- old_string:
```
SLOT 2 (Brücke ins Heute):
- 10-20 Wörter, max 25
- Du-Form, Alltags-Deutsch (or "you" form for English)
- Anchor: a concrete situation, an inner state, OR an observation cue — pick ONE
- Verboten: Zodiac-Name, Grad, Haus, Aspekt, BaZi-Insider-Wort, Element-Name in slot_2,
  direkte Archetyp-Anrede, Wertung des Tages (gut/schlecht), Wiederholung des Aphorismus

SLOT 3 (Handlungsimpuls):
- 10-15 Wörter, max 20
- Verb-getrieben, offener Ausgang, kein Versprechen
- Erlaubte Formen: Imperativ / Frage / Beobachtungs-Vorschlag / Bedingungs-Satz
- Verboten: Affirmation ("Du schaffst das"), Ermächtigungsfloskel, Warnung ("Vorsicht vor")

MODUS-SCHÄRFE:
- pulse:    tragend, sensorisch, einladend
- trace:    direkt, geladen, "etwas passiert heute"
- spannung: zwei Bewegungen in zeitlicher Abfolge ("zuerst… dann…")

Output STRICT JSON only. No markdown, no commentary. Schema:
{
  "slot_2": "string",
  "slot_3": "string"
}
```

- new_string:
```
IMPULSE_TEXT (single consolidated paragraph — no internal labels):
- 25-50 Wörter, 2-3 Sätze, EIN zusammenhängender Absatz
- Du-Form, Alltags-Deutsch (or "you" form for English)
- Webe drei Elemente in einen FLIESSENDEN Text:
  * Brücke ins Heute (concrete situation, inner state, or observation cue)
  * Handlungsimpuls (verb-driven, open-ended, no promise)
  * (Aphorismus-Kontext semantisch fortgeführt, nicht zitiert)
- Verboten:
  * Strukturmarker im Output ("Brücke:", "Impuls:", "Heute:", numbered lists)
  * Zodiac-Name, Grad, Haus, Aspekt, BaZi-Insider-Wort
  * Element-Name (Holz/Wasser etc.) im Bridge-Teil
  * Direkte Archetyp-Anrede ("Du Mond", "Liebe Sonne")
  * Wertung des Tages (gut/schlecht)
  * Wiederholung des Aphorismus
  * Affirmation ("Du schaffst das"), Pinterest-Esoterik
  * Warnung ("Vorsicht vor")

MODUS-SCHÄRFE:
- pulse:    tragend, sensorisch, einladend
- trace:    direkt, geladen, "etwas passiert heute"
- spannung: zwei Bewegungen in zeitlicher Abfolge ("zuerst… dann…")

Output STRICT JSON only. No markdown, no commentary. Schema:
{
  "impulse_text": "string"
}
```

**Step 2.3: Server — update parsing in `generateTagespulsSlots`**

Find the function in `server.mjs`:

```bash
grep -n "generateTagespulsSlots\|parsed\\?\\.slot_2" server.mjs | head -5
```

Use Edit:

- old_string:
```js
    const parsed = JSON.parse(jsonStr);
    const slot2 = typeof parsed?.slot_2 === 'string' ? parsed.slot_2.trim() : null;
    const slot3 = typeof parsed?.slot_3 === 'string' ? parsed.slot_3.trim() : null;
    return {
      slot_2: slot2 && slot2.length > 0 ? slot2 : null,
      slot_3: slot3 && slot3.length > 0 ? slot3 : null,
    };
```

- new_string:
```js
    const parsed = JSON.parse(jsonStr);
    // BUG-DAILY-001: prompt now produces single impulse_text. Back-compat:
    // if the model still emits the old slot_2/slot_3 shape (warm cache,
    // older prompt), join them with a space.
    const impulseText =
      typeof parsed?.impulse_text === 'string'
        ? parsed.impulse_text.trim()
        : (typeof parsed?.slot_2 === 'string' && typeof parsed?.slot_3 === 'string'
            ? `${parsed.slot_2.trim()} ${parsed.slot_3.trim()}`
            : null);
    return {
      // Mirror to slot_2 column for DB column reuse — the schema-level
      // migration to a dedicated impulse_text column is deferred.
      slot_2: impulseText && impulseText.length > 0 ? impulseText : null,
      slot_3: null,
    };
```

**Step 2.4: Server — derive `impulse_text` in API response**

Find the `/api/daily-pulse` response construction in `server.mjs`. Look for the `aphorism: { ... slot_2, slot_3 }` blocks (there are two: cached path + fresh-generation path).

For BOTH blocks, add `impulse_text`:

- old_string (cached path, around line 3127-3163):
```js
        aphorism: aphRow
          ? {
              id: aphRow.id,
              author: aphRow.author,
              attribution_status: aphRow.attribution_status,
              slot_1: existing.slot_1,
              slot_2: slot2,
              slot_3: slot3,
            }
          : {
              id: null,
              author: null,
              attribution_status: null,
              slot_1: existing.slot_1,
              slot_2: slot2,
              slot_3: slot3,
            },
```

- new_string:
```js
        aphorism: aphRow
          ? {
              id: aphRow.id,
              author: aphRow.author,
              attribution_status: aphRow.attribution_status,
              slot_1: existing.slot_1,
              // BUG-DAILY-001: consolidated text. New rows: slot_2 IS the
              // consolidated text (slot_3 NULL). Legacy rows: join both.
              impulse_text:
                slot2 && slot3
                  ? `${slot2} ${slot3}`
                  : slot2 ?? null,
              slot_2: slot2,
              slot_3: slot3,
            }
          : {
              id: null,
              author: null,
              attribution_status: null,
              slot_1: existing.slot_1,
              impulse_text:
                slot2 && slot3
                  ? `${slot2} ${slot3}`
                  : slot2 ?? null,
              slot_2: slot2,
              slot_3: slot3,
            },
```

For the fresh-generation path (around line 3222-3240):

- old_string:
```js
      aphorism: {
        id: aphorism.id,
        author: aphorism.author,
        attribution_status: aphorism.attribution_status,
        slot_1: slot1,
        slot_2: slot2,
        slot_3: slot3,
      },
```

- new_string:
```js
      aphorism: {
        id: aphorism.id,
        author: aphorism.author,
        attribution_status: aphorism.attribution_status,
        slot_1: slot1,
        // BUG-DAILY-001: fresh rows write impulse_text into slot_2 (slot_3
        // null), so impulse_text === slot_2 here. Kept distinct for the
        // wire shape so future schema migration is non-breaking.
        impulse_text: slot2 ?? null,
        slot_2: slot2,
        slot_3: slot3,
      },
```

**Step 2.5: Component — replace 2-section render with single paragraph**

Use Edit on `src/components/dashboard/TagespulsCard.tsx`:

- old_string:
```tsx
      {/*
        slot_2 / slot_3 are rendered ONLY when non-null. When the LLM
        router returned null we omit the section entirely — the
        no-placeholders directive forbids substituting generic copy.
      */}
      {aph.slot_2 && (
        <div className="space-y-1" data-testid="tagespuls-bridge">
          <span className="text-xs uppercase tracking-[0.2em] text-ink/55">
            {t('tagespuls.bridge')}
          </span>
          <p className="text-sm text-ink/80 leading-relaxed">{aph.slot_2}</p>
        </div>
      )}

      {aph.slot_3 && (
        <div className="space-y-1" data-testid="tagespuls-impulse">
          <span className="text-xs uppercase tracking-[0.2em] text-ink/55">
            {t('tagespuls.impulse')}
          </span>
          <p className="text-sm text-ink/80 leading-relaxed">{aph.slot_3}</p>
        </div>
      )}
```

- new_string:
```tsx
      {/*
        BUG-DAILY-001: consolidated impulse_text. The internal "Bridge to
        today" / "Action impulse" labels were prompt structure, not
        user-facing content — gone. The LLM weaves bridge + impulse + 
        aphorism context into ONE natural paragraph.
        
        Back-compat: if a cached row only has slot_2 + slot_3 (pre-fix),
        the server joins them at the API boundary so impulse_text is
        always populated when ANY slot data exists.
      */}
      {aph.impulse_text && (
        <p
          className="text-sm text-ink/80 leading-relaxed"
          data-testid="tagespuls-impulse-text"
        >
          {aph.impulse_text}
        </p>
      )}
```

**Step 2.6: i18n — delete bridge / impulse keys**

```bash
grep -n "    bridge:\|    impulse:" src/i18n/translations.ts
```

Should show 4 lines (DE + EN, each has both bridge and impulse).

Use Edit FOUR times (one per line — they have different translations):

For EN bridge:
- old_string: `    bridge: "Bridge to today",\n`
- new_string: ``

For EN impulse:
- old_string: `    impulse: "Action impulse",\n`
- new_string: ``

For DE bridge:
- old_string: `    bridge: "Brücke ins Heute",\n`
- new_string: ``

For DE impulse:
- old_string: `    impulse: "Handlungsimpuls",\n`
- new_string: ``

**Step 2.7: Run tests**

```bash
npx vitest run src/__tests__/tagespuls-card.test.tsx -t "TPC-NO-LABELS" 2>&1 | tail -10
```

Expected: 2 passing.

```bash
npx vitest run src/__tests__/tagespuls-card.test.tsx 2>&1 | tail -3
npx vitest run server/__tests__/daily-pulse.test.mjs 2>&1 | tail -3
npx vitest run src/__tests__/use-daily-pulse.test.ts 2>&1 | tail -3
```

Expected: tagespuls-card suite +2 (was N, now N+2). daily-pulse and use-daily-pulse may need fixture updates if they referenced `slot_2` directly.

**Common breakage**: existing tests that asserted `screen.getByText(/Brücke ins Heute/)` or `getByTestId('tagespuls-bridge')` will fail. Update those tests to use the new testid `tagespuls-impulse-text`.

**STOP and report** if more than 3 existing tests break — that means the legacy contract was broader than expected and the migration needs more thought.

```bash
npm run check:text-integrity 2>&1 | tail -3
npx tsc --noEmit 2>&1 | tail -3
```

Expected: pass / clean.

### Task 3: Commit

```bash
git add src/lib/schemas/daily-pulse.ts \
        server.mjs \
        server/services/tagespuls.service.mjs \
        src/components/dashboard/TagespulsCard.tsx \
        src/i18n/translations.ts \
        src/__tests__/tagespuls-card.test.tsx \
        server/__tests__/daily-pulse.test.mjs \
        src/__tests__/use-daily-pulse.test.ts

git commit -m "$(cat <<'EOF'
fix(tagespuls): consolidate slot_2 + slot_3 into impulse_text, drop labels (BUG-DAILY-001, 002)

Per 2026-05-10 product audit BUG-DAILY-001:
"Bridge to today" / "Action impulse" were INTERNAL prompt labels —
they leaked into user-facing UI as section headers above each slot.
Spec: user sees a natural narrative paragraph integrating
bridge + impulse + aphorism context, no internal structure visible.

Per BUG-DAILY-002: the daily impulse must be at the top of the
dashboard with the consolidated text (already top-mounted; this
commit fixes the text shape).

Architecture:

1. Prompt change: LLM now produces a single { "impulse_text": "..." }
   instead of { "slot_2", "slot_3" }. Rules block requires fluid
   prose (25-50 words, 2-3 sentences, woven not labeled). Verbote
   include "Brücke:" / "Impuls:" structure markers in output.

2. Wire shape: PulseWireAphorismSchema gains `impulse_text:
   string | null`. slot_2 / slot_3 stay in the schema for cached-row
   back-compat. Server derives impulse_text:
   - new rows: slot_2 IS the consolidated text, slot_3 NULL → 
     impulse_text === slot_2
   - legacy rows: slot_2 + slot_3 both populated → 
     impulse_text = slot_2 + " " + slot_3

3. Server response: both /api/daily-pulse paths (cached + fresh)
   emit impulse_text alongside slot_2/slot_3 — wire is additive.

4. Component: render single <p data-testid="tagespuls-impulse-text">
   {aph.impulse_text}</p>. The two-section "tagespuls-bridge" /
   "tagespuls-impulse" testids and their <span> labels are gone.

5. i18n: tagespuls.bridge + tagespuls.impulse keys deleted from DE
   and EN trees.

6. Persistence parser: generateTagespulsSlots reads impulse_text
   from JSON; if the model warm-caches the old shape, it joins
   slot_2 + slot_3 with a space and stores in slot_2.

Tests:
- TPC-NO-LABELS-001: anti-label DOM walk (4 string checks + 2
  testid checks). Asserts the consolidated text renders.
- TPC-NO-LABELS-002: legacy 2-slot fixture renders consolidated,
  raw slots NOT visible as separate sections.

DB migration deferred — column reuse is sufficient for this fix.
A future migration to a dedicated impulse_text column can deprecate
slot_3 entirely once all cached rows have rolled.

Closes 2026-05-10 audit BUG-DAILY-001, BUG-DAILY-002.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

**Do not push.** Stop after commit.

---

## Commit 2: BUG-003 + BUG-004 — Persistent decision lock on mount

**Goal:** When user has already picked an archetype today, the dashboard renders Phase 2 IMMEDIATELY on mount — no Phase 1 flash, no chance to "pick again" via browser back / refresh / direct URL. Lock survives page reload, browser-back navigation, component re-render.

### Architectural decisions

1. **Server-side**: extend `GET /api/daily-pulse` response with `existing_decision: { archetype_key, text } | null`. Single roundtrip — no separate `/api/check-decision` endpoint.
2. **Client-side**: `useDailyPulse` hook hydrates `selectedFigure` + `interpretationByKey` from `existing_decision` on mount. Phase 1 never renders if a decision exists.
3. **No localStorage** — server is source of truth (already enforced by `daily_interpretations_one_per_pulse` UNIQUE constraint). localStorage caching adds drift risk.
4. **History API**: NOT pushing state on selection. The server-side persistence + mount-time hydration is enough to defeat browser-back, since both forward and backward navigation re-mount the dashboard, which re-fetches `/api/daily-pulse`, which now includes `existing_decision`.

### Task 4: RED — assert Phase 2 renders on mount when existing_decision is non-null

**Files:**
- Modify: `src/__tests__/use-daily-pulse.test.ts`

```tsx
  it('DPH-LOCK-MOUNT-001: hook hydrates Phase 2 state from existing_decision on mount', async () => {
    // BUG-DAILY-003 / BUG-DAILY-004: when the user already picked today,
    // /api/daily-pulse includes existing_decision. Hook initializes
    // selectedFigure + interpretation IMMEDIATELY — no Phase 1 flash.
    authedFetch.mockResolvedValueOnce(makeRes(200, {
      ...VALID_PULSE,
      aphorism: {
        ...VALID_PULSE.aphorism,
        impulse_text: 'consolidated text',
        slot_2: null,
        slot_3: null,
      },
      existing_decision: {
        archetype_key: 'mond',
        text: 'Locked Mond Libra deep interpretation',
      },
    }));
    const useDailyPulse = await loadHook();

    const { result } = renderHook(() => useDailyPulse('de'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Phase 2 state hydrated on mount, no second fetch needed
    expect(result.current.selectedFigure).toBe('mond');
    expect(result.current.interpretation?.text).toBe('Locked Mond Libra deep interpretation');
    expect(result.current.interpretationError).toBeNull();
    expect(authedFetch).toHaveBeenCalledTimes(1);  // ONLY /api/daily-pulse
  });

  it('DPH-LOCK-MOUNT-002: existing_decision=null → Phase 1 state (selectedFigure null)', async () => {
    // Negative case: no decision yet → user can pick.
    authedFetch.mockResolvedValueOnce(makeRes(200, {
      ...VALID_PULSE,
      aphorism: {
        ...VALID_PULSE.aphorism,
        impulse_text: 'consolidated',
        slot_2: null,
        slot_3: null,
      },
      existing_decision: null,
    }));
    const useDailyPulse = await loadHook();

    const { result } = renderHook(() => useDailyPulse('de'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.selectedFigure).toBeNull();
    expect(result.current.interpretation).toBeNull();
  });
```

Run:

```bash
npx vitest run src/__tests__/use-daily-pulse.test.ts -t "DPH-LOCK-MOUNT" 2>&1 | tail -10
```

Expected: FAIL — hook doesn't read `existing_decision` yet.

### Task 5: GREEN — schema, server, hook

**Step 5.1: Schema — add `existing_decision` to `DailyPulseResponseSchema`**

Use Edit on `src/lib/schemas/daily-pulse.ts`:

- old_string:
```ts
export const DailyPulseResponseSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  date: z.string(),
  locale: z.enum(['de', 'en']),
  mode: DayModeSchema,
  intensity: z.number(),
  harmony_index: z.number(),
  aphorism: PulseWireAphorismSchema,
  council: z.array(CouncilFigureSchema).length(6),
  weather_stale: z.boolean(),
});
```

- new_string:
```ts
export const ExistingDecisionSchema = z.object({
  archetype_key: CouncilKeySchema,
  text: z.string().min(1),
});
export type ExistingDecision = z.infer<typeof ExistingDecisionSchema>;

export const DailyPulseResponseSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  date: z.string(),
  locale: z.enum(['de', 'en']),
  mode: DayModeSchema,
  intensity: z.number(),
  harmony_index: z.number(),
  aphorism: PulseWireAphorismSchema,
  council: z.array(CouncilFigureSchema).length(6),
  weather_stale: z.boolean(),
  // BUG-DAILY-003 + 004: server includes the user's locked decision
  // for today (if any) so the client can hydrate Phase 2 directly on
  // mount, preventing browser-back / refresh from showing a stale
  // Phase 1 with active selection buttons.
  existing_decision: ExistingDecisionSchema.nullable(),
});
```

**Step 5.2: Server — query existing decision in /api/daily-pulse**

Find the response construction in `server.mjs` (both cached + fresh paths). Before each response construction, query for the user's existing decision today:

Use Edit. Find the cached path's response payload assembly:

After:
```js
    const interpretationCouncil = buildCouncilFromProfile(profileRow.astro_json);
    const archetypeMatch = interpretationCouncil.find((c) => c.key === archetypeKey);
    const signOrElement = archetypeMatch?.signOrElement ?? null;
```

Wait — that's the daily-interpretation handler. Let me locate the daily-pulse handler's payload assembly correctly.

Search for:
```bash
grep -n "council: council,\|council: buildCouncilFromProfile\|/api/daily-pulse" server.mjs | head -10
```

The /api/daily-pulse handler builds two payloads (cached at line ~3127, fresh at ~3222). Both have `council: council,`. We need to add the existing_decision lookup BEFORE both, or once at the top of the handler.

**Cleanest path**: do the lookup ONCE near the top of the handler (right after the auth + L1/L2 setup), then include it in both response paths.

Find the handler's start:
```bash
grep -n "GET /api/daily-pulse\|app.get..api.daily-pulse" server.mjs | head -5
```

After the supabaseServer guard (around the place that loads the cached row), add the existing-decision lookup:

```js
    // BUG-DAILY-003 + 004: query the user's existing decision for this
    // (user_id, date) so the client can hydrate Phase 2 immediately on
    // mount, eliminating Phase 1 flash on browser-back / refresh.
    //
    // Scoped per (user, date) — same path as the I-3 cross-locale lock.
    const { data: pulseIdsForDateRows } = await supabaseServer
      .from('daily_pulses')
      .select('id')
      .eq('user_id', userId)
      .eq('date', date);
    const allPulseIdsForDate = (pulseIdsForDateRows ?? []).map((p) => p.id);
    let existingDecision = null;
    if (allPulseIdsForDate.length > 0) {
      const { data: decisionRow } = await supabaseServer
        .from('daily_interpretations')
        .select('selected_archetype_key, text')
        .in('daily_pulse_id', allPulseIdsForDate)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (decisionRow) {
        existingDecision = {
          archetype_key: decisionRow.selected_archetype_key,
          text: decisionRow.text,
        };
      }
    }
```

Then in BOTH the cached and fresh response construction blocks, add `existing_decision: existingDecision,` next to `weather_stale`:

For the cached path:
- old_string: `weather_stale: !!existing.weather_stale,`
- new_string: `weather_stale: !!existing.weather_stale,\n        existing_decision: existingDecision,`

For the fresh path:
- old_string: `weather_stale: false,`
- new_string: `weather_stale: false,\n      existing_decision: existingDecision,`

(There may be multiple `weather_stale: false,` matches; use surrounding context to anchor on the right one — typically inside the `aphorism: { ... }` block's sibling.)

**Step 5.3: Hook — hydrate state from existing_decision**

Use Edit on `src/hooks/useDailyPulse.ts`. Find the success-parse block in the mount fetch effect:

- old_string:
```ts
        const parsed = DailyPulseResponseSchema.safeParse(json);
        if (!parsed.success) {
          setError({ code: 'unknown' });
          setPulse(null);
          setLoading(false);
          return;
        }
        setPulse(parsed.data);
        setError(null);
        setLoading(false);
```

- new_string:
```ts
        const parsed = DailyPulseResponseSchema.safeParse(json);
        if (!parsed.success) {
          setError({ code: 'unknown' });
          setPulse(null);
          setLoading(false);
          return;
        }
        setPulse(parsed.data);
        setError(null);
        // BUG-DAILY-003 + 004: hydrate Phase 2 state from server's
        // existing_decision so browser-back / refresh / direct URL
        // load all show the locked Phase 2 immediately — no Phase 1
        // flash with active selection buttons.
        if (parsed.data.existing_decision) {
          const { archetype_key, text } = parsed.data.existing_decision;
          setSelectedFigure(archetype_key);
          setInterpretationByKey((prev) => ({
            ...prev,
            [archetype_key]: { id: 'hydrated', text },
          }));
        }
        setLoading(false);
```

**Step 5.4: Run tests**

```bash
npx vitest run src/__tests__/use-daily-pulse.test.ts -t "DPH-LOCK-MOUNT" 2>&1 | tail -10
```

Expected: 2 passing.

```bash
npx vitest run src/__tests__/use-daily-pulse.test.ts 2>&1 | tail -3
npx vitest run server/__tests__/daily-pulse.test.mjs 2>&1 | tail -3
npx vitest run src/__tests__/tagespuls-card.test.tsx 2>&1 | tail -3
```

**Probable breakage**: existing daily-pulse server tests don't mock the new `daily_pulses` lookup or `daily_interpretations` lookup. Their mockFetch may need to handle these calls (return empty arrays). Update those mocks to return `[]` for queries they didn't anticipate.

```bash
npx tsc --noEmit 2>&1 | tail -3
```

### Task 6: Commit

```bash
git add src/lib/schemas/daily-pulse.ts \
        server.mjs \
        src/hooks/useDailyPulse.ts \
        src/__tests__/use-daily-pulse.test.ts \
        server/__tests__/daily-pulse.test.mjs

git commit -m "$(cat <<'EOF'
fix(tagespuls): hydrate Phase 2 from existing_decision on mount (BUG-DAILY-003, 004)

Per 2026-05-10 audit BUG-DAILY-003: browser-back navigation could
re-render Phase 1 with active council buttons even after the user
had already picked, because the hook fetched fresh /api/daily-pulse
(which knew nothing about the existing decision) on every mount.
The 409 lock only fired when the user re-clicked a button.

Per BUG-DAILY-004: the lock state was ephemeral. Reload, browser
history navigation, or any re-mount could re-show Phase 1
momentarily.

Architecture:

1. Wire shape: DailyPulseResponseSchema gains
   `existing_decision: { archetype_key, text } | null`. Server
   queries daily_interpretations across all of the user's pulses
   for today (cross-locale, per the I-3 fix).

2. Hook: on successful /api/daily-pulse response, if
   existing_decision is non-null, the hook IMMEDIATELY sets
   selectedFigure + interpretationByKey before flipping loading off.
   Component renders Phase 2 in the same render cycle that completes
   the mount fetch — no Phase 1 flash.

3. No client-side persistence (no localStorage). Server is the
   source of truth (already enforced by
   daily_interpretations_one_per_pulse UNIQUE). Adding localStorage
   would create drift risk.

Tests:
- DPH-LOCK-MOUNT-001: existing_decision present → selectedFigure
  + interpretation hydrated, no second fetch.
- DPH-LOCK-MOUNT-002: existing_decision null → Phase 1 state
  (selectedFigure null), unchanged behavior preserved.

Existing tests asserting Phase 1 behavior unaffected — they pass
existing_decision: null in fixtures or omit it (default null).

Closes 2026-05-10 audit BUG-DAILY-003 + BUG-DAILY-004.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Commit 3: BUG-DAILY-005 — Daily impulse text persists in Phase 2

**Goal:** When the user is in Phase 2 (figure selected, deep interpretation visible), the consolidated `impulse_text` from Phase 1 stays visible above the deep interpretation. Refresh / re-render keep both texts. The deep interpretation extends, doesn't replace.

### Architectural decision

Phase 2 layout becomes 4-block: aphorism → impulse_text → selected figure header → interpretation text. No new state — both texts come from the same `pulse` object that's already in the hook's state.

### Task 7: RED — Phase 2 shows both texts

**Files:**
- Modify: `src/__tests__/tagespuls-card.test.tsx`

```tsx
  it('TPC-PHASE2-IMPULSE-001: Phase 2 keeps the consolidated impulse_text visible above the interpretation', () => {
    // BUG-DAILY-005: deep interpretation EXTENDS, doesn't REPLACE.
    // The general daily impulse text stays visible in Phase 2 so the
    // user has both layers — the day's general framing AND the
    // archetype-specific deep interpretation.
    mockUseDailyPulse({
      pulse: {
        ...validPulseFixture,
        aphorism: {
          ...validPulseFixture.aphorism,
          impulse_text: 'Heute trägt Mass mehr als der nächste Beweis. Schau hin, ohne sofort zu bewerten.',
          slot_2: null,
          slot_3: null,
        },
      },
      selectedFigure: 'mond',
      interpretation: { id: 'int-1', text: 'Dein Mond Libra zeigt heute eine ruhige Wachsamkeit.' },
      loadingInterpretation: false,
    });
    render(<TagespulsCard />);

    // BOTH texts visible
    expect(screen.getByText(/Heute trägt Mass/i)).toBeInTheDocument();
    expect(screen.getByText(/Dein Mond Libra zeigt heute/i)).toBeInTheDocument();

    // Anti-regression: still no internal labels
    expect(screen.queryByText(/Brücke ins Heute|Bridge to today/)).not.toBeInTheDocument();
  });

  it('TPC-PHASE2-IMPULSE-002: Phase 2 with hydrated existing_decision (mount-time) also shows impulse_text', () => {
    // Edge case: user lands on dashboard with an existing decision
    // hydrated from the server (BUG-DAILY-003/004 fix). Phase 2 must
    // still show the impulse_text — no flash, no missing daily framing.
    mockUseDailyPulse({
      pulse: {
        ...validPulseFixture,
        aphorism: {
          ...validPulseFixture.aphorism,
          impulse_text: 'consolidated impulse for today',
          slot_2: null,
          slot_3: null,
        },
      },
      selectedFigure: 'sonne',
      interpretation: { id: 'hydrated', text: 'Stier-Sonne deep interpretation hydrated from server' },
      loadingInterpretation: false,
    });
    render(<TagespulsCard />);

    expect(screen.getByText(/consolidated impulse for today/i)).toBeInTheDocument();
    expect(screen.getByText(/Stier-Sonne deep interpretation/i)).toBeInTheDocument();
  });
```

Run:

```bash
npx vitest run src/__tests__/tagespuls-card.test.tsx -t "TPC-PHASE2-IMPULSE" 2>&1 | tail -10
```

Expected: FAIL — Phase 2 currently doesn't render `aph.impulse_text`.

### Task 8: GREEN — Phase 2 layout includes impulse_text

Use Edit on `src/components/dashboard/TagespulsCard.tsx`. Find the Phase 2 block (where `data-phase="interpretation"` is set):

- old_string:
```tsx
        {/* Aphorism stays visible above the interpretation as the
            curated foundation. After the user picks an archetype the
            decision is irreversible (spec C-2: "Kein 'Zurück' Button"). */}
        <blockquote className="border-l-2 border-gold/40 pl-4 text-base text-ink/85 italic">
          "{aph.slot_1}"
          {aph.author && (
            <footer className="mt-1 text-xs not-italic text-ink/60">— {aph.author}</footer>
          )}
        </blockquote>

        <div className="space-y-2">
          <h3 className="text-lg font-medium text-ink">
```

- new_string:
```tsx
        {/* Aphorism stays visible above the interpretation as the
            curated foundation. After the user picks an archetype the
            decision is irreversible (spec C-2: "Kein 'Zurück' Button"). */}
        <blockquote className="border-l-2 border-gold/40 pl-4 text-base text-ink/85 italic">
          "{aph.slot_1}"
          {aph.author && (
            <footer className="mt-1 text-xs not-italic text-ink/60">— {aph.author}</footer>
          )}
        </blockquote>

        {/*
          BUG-DAILY-005: deep interpretation EXTENDS, doesn't REPLACE.
          The consolidated impulse_text stays visible so the user has
          both layers — general daily framing + archetype-specific
          deep interpretation.
        */}
        {aph.impulse_text && (
          <p
            className="text-sm text-ink/80 leading-relaxed"
            data-testid="tagespuls-impulse-text-phase2"
          >
            {aph.impulse_text}
          </p>
        )}

        <div className="space-y-2">
          <h3 className="text-lg font-medium text-ink">
```

Run tests:

```bash
npx vitest run src/__tests__/tagespuls-card.test.tsx -t "TPC-PHASE2-IMPULSE" 2>&1 | tail -10
```

Expected: 2 passing.

```bash
npx vitest run src/__tests__/tagespuls-card.test.tsx 2>&1 | tail -3
npx tsc --noEmit 2>&1 | tail -3
```

### Task 9: Commit

```bash
git add src/components/dashboard/TagespulsCard.tsx src/__tests__/tagespuls-card.test.tsx
git commit -m "$(cat <<'EOF'
fix(tagespuls): Phase 2 keeps impulse_text visible above interpretation (BUG-DAILY-005)

Per 2026-05-10 audit BUG-DAILY-005: when the user enters Phase 2
(after picking a figure), the daily impulse text disappeared and
only the deep interpretation showed. Spec: deep interpretation
EXTENDS, doesn't REPLACE — both layers visible.

Phase 2 layout is now:
  1. ← Andere Figur — REMOVED in C-2 fix
  2. Aphorism (gold-bordered blockquote)
  3. Impulse text (consolidated, no labels — BUG-DAILY-001)
  4. Selected figure header
  5. Deep interpretation paragraph

The impulse_text comes from the same `pulse` object already in
hook state — no new fetch, no new state. Refresh / re-render /
mount-time-hydrated Phase 2 (BUG-DAILY-003/004) all preserve both
texts.

Tests:
- TPC-PHASE2-IMPULSE-001: standard Phase 2 (post-click) shows both
  impulse_text + interpretation, no labels.
- TPC-PHASE2-IMPULSE-002: hydrated Phase 2 (mount-time) shows both
  impulse_text + interpretation.

Closes 2026-05-10 audit BUG-DAILY-005.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Commit 4: docs(plans) — record this plan

```bash
git add docs/plans/2026-05-10-tagespuls-bug-daily-001-005.md
git commit -m "$(cat <<'EOF'
docs(plans): tagespuls bug-daily-001-005 implementation plan

Plan document driving the 3-commit fix-up of the 2026-05-10
product audit findings on Tagesimpuls. Committed alongside
implementation commits for traceability.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Final verification + ship

### Task 10: Full-suite + push + PR

```bash
npx vitest run 2>&1 | tail -5
npx tsc --noEmit 2>&1 | tail -3
npm run check:text-integrity 2>&1 | tail -3
npm run build 2>&1 | tail -3
```

Expected:
- vitest: full suite green except 3 pre-existing failures (vibes-perf flake, EDF-NCP-003, api-daily-pulse idempotent — all documented)
- tsc: clean
- text-integrity: pass
- build: succeeds

```bash
git push -u origin 2026-05-10-tagespuls-bug-daily-001-005

gh pr create --base main --title "Tagespuls bug fixes — close 2026-05-10 audit (BUG-DAILY-001..005)" --body "$(cat <<'EOF'
## Summary

Closes the five user-reported bugs on the Tagesimpuls feature.

| Commit | Bugs | Hash |
|---|---|---|
| 1. \`fix(tagespuls): consolidate slot_2 + slot_3 into impulse_text, drop labels\` | BUG-DAILY-001, 002 | (filled at PR time) |
| 2. \`fix(tagespuls): hydrate Phase 2 from existing_decision on mount\` | BUG-DAILY-003, 004 | |
| 3. \`fix(tagespuls): Phase 2 keeps impulse_text visible above interpretation\` | BUG-DAILY-005 | |
| 4. \`docs(plans): tagespuls bug-daily-001-005 implementation plan\` | trail of intent | |

## Highlights

### BUG-001 + BUG-002 — Single consolidated text, no labels
"Bridge to today" / "Action impulse" were INTERNAL prompt structure leaking into UI. LLM now produces ONE woven paragraph; component renders single \`<p>\` with no headers. Wire shape: new \`aphorism.impulse_text\` field; legacy \`slot_2\`/\`slot_3\` stay for cached-row back-compat. DB column reuse — no migration.

### BUG-003 + BUG-004 — Persistent lock on mount
\`/api/daily-pulse\` now includes \`existing_decision: { archetype_key, text } | null\`. Hook hydrates Phase 2 state IMMEDIATELY on mount when present — no Phase 1 flash, no chance to "pick again" via browser back. No localStorage; server is source of truth.

### BUG-005 — Phase 2 extends, doesn't replace
Deep interpretation (Phase 2) now keeps the consolidated \`impulse_text\` visible above the figure-specific interpretation. Both layers always shown.

## Test plan

- [ ] \`npm test\` — full suite green except pre-existing flakes
- [ ] \`npx tsc --noEmit\` — clean
- [ ] \`npm run build\` — OK
- [ ] Manual smoke after Railway redeploy:
  - Land on dashboard fresh: see impulse_text as ONE paragraph (no "Brücke ins Heute" / "Handlungsimpuls" headers)
  - Pick a figure: deep interpretation appears BELOW the impulse_text (not replacing it)
  - Browser back: stays on Phase 2 with locked decision (no Phase 1 with active buttons)
  - Refresh: Phase 2 renders immediately from server hydration, no flicker

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Done-when checklist

- [ ] Commit 1 (BUG-001, 002): TPC-NO-LABELS-001/002 pass; tagespuls-card suite green
- [ ] Commit 2 (BUG-003, 004): DPH-LOCK-MOUNT-001/002 pass; existing tests adapted to new schema field
- [ ] Commit 3 (BUG-005): TPC-PHASE2-IMPULSE-001/002 pass
- [ ] Commit 4 (plan): plan doc committed
- [ ] tsc clean throughout
- [ ] build succeeds throughout
- [ ] PR opened on main with all 4 commits visible

## Out of scope (deliberate)

- **DB schema migration** to a dedicated `impulse_text` column. Column reuse on `slot_2` is sufficient. A migration that drops `slot_3` and renames `slot_2` to `impulse_text` is a future hygiene task (purely cosmetic — wire shape already presents the new contract).
- **06:00-local-time daily rollover** (BUG-DAILY-004 AC #6). The current system uses UTC date for `daily_pulses` keying. A timezone-aware date rollover (06:00 user-local) requires a separate spec discussion (which timezone? `Intl.DateTimeFormat`? user's birth_data timezone?). Document in the plan, ship the daily-keyed lock, defer the exact 06:00 cutoff.
- **"Explore" feature** (BUG-DAILY-002 AC #4: "Explore kann den Text erneut oder vertieft anzeigen"). No "Explore" UI exists today; the spec implies a future expand-text button or modal. Out of scope for this fix; the persistent text + stable Phase 2 enable that future work.
- **History API \`pushState\` on selection**. Browser-back is solved by mount-time hydration (server returns existing_decision). \`pushState\` would add a new history entry and complicate other navigation flows. Skip unless the audit re-flags this.

## References

- Source audit (this session, 2026-05-10): 5 user-reported bugs on Tagesimpuls
- Implementation depends on: PRs #335 + #336 (already merged)
- Related plan: \`docs/plans/2026-05-09-tagespuls-strict-rules.md\` (parent C-1..C-3 + I-1 work)
- Related plan: \`docs/plans/2026-05-09-tagespuls-followup-findings.md\` (parent I-1..I-4 + M-1, M-3..M-5 review fixes)

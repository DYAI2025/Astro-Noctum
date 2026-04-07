# BUG-23 Code Review: Apply Two MEDIUM Findings

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close two MEDIUM regression-risk findings from the PR #249 code review: (1) add an explicit `pointer-events: auto !important` to the body-level ElevenLabs CSS rule, and (2) add a structural assertion to the regression test.

**Architecture:** Two-file change — one CSS line added to `src/index.css`, one test case added to `src/__tests__/bug-23-pointer-events.test.ts`. Both changes are on branch `fix/bug-23-elevenlabs-overlay`.

**Tech Stack:** CSS, Vitest

---

### Task 1: Update the CSS rule to declare `pointer-events: auto !important` explicitly

**Files:**
- Modify: `src/index.css` (body-level ElevenLabs selector block, ~line 785)

**Step 1: Confirm you are on the right branch**

```bash
git branch --show-current
```

Expected: `fix/bug-23-elevenlabs-overlay`

If on `main`, run:
```bash
git checkout fix/bug-23-elevenlabs-overlay
```

**Step 2: Apply the CSS change**

In `src/index.css`, find the block:

```css
body > div[class*="eleven"],
body > div[id*="eleven"],
body > div[class*="convai"],
body > div[id*="convai"] {
  z-index: 999999 !important;
  position: fixed !important;
  /* pointer-events intentionally omitted: SDK injects interactive call UI here (BUG-23) */
}
```

Replace it with:

```css
body > div[class*="eleven"],
body > div[id*="eleven"],
body > div[class*="convai"],
body > div[id*="convai"] {
  z-index: 999999 !important;
  position: fixed !important;
  pointer-events: auto !important; /* SDK injects interactive call UI here — must not be suppressed (BUG-23) */
}
```

**Step 3: Update the two existing negative-assertion tests to also guard against `auto` being removed**

The existing two tests in `src/__tests__/bug-23-pointer-events.test.ts` check that `pointer-events: none` is absent. They still pass after this change (auto ≠ none). No change needed to those tests.

**Step 4: Add a structural assertion test**

In `src/__tests__/bug-23-pointer-events.test.ts`, add a third `it` block inside the `describe` (after line 31, before the closing `}`):

```typescript
  it('body-level SDK selector block must declare pointer-events:auto', () => {
    // Affirmative guard: the block must actively permit pointer events.
    // A negative-only check (no "none") passes if the rule is deleted entirely.
    const requiredPattern =
      /body\s*>\s*div\[[^\]]*eleven[^\]]*\][^{]*\{[^}]*pointer-events\s*:\s*auto/s;
    expect(
      requiredPattern.test(css),
      'Missing pointer-events:auto on body > div[*eleven] — ElevenLabs SDK interactive overlays may be suppressed (BUG-23)',
    ).toBe(true);
  });
```

**Step 5: Run the regression tests**

```bash
npx vitest run src/__tests__/bug-23-pointer-events.test.ts
```

Expected: **3 PASS** (2 existing + 1 new).

**Step 6: Run full suite**

```bash
npm run test
```

Expected: all previously-passing tests still pass, +1 new (3 total in bug-23 file).

---

### Task 2: Commit and push

**Step 1: Commit**

```bash
git add src/index.css src/__tests__/bug-23-pointer-events.test.ts
git commit -m "fix(BUG-23): explicit pointer-events:auto on body-level SDK rule + structural test (code review)"
```

**Step 2: Push**

```bash
git push
```

PR #249 will auto-update. No new PR needed.

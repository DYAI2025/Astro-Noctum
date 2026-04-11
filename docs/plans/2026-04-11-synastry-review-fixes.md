# Synastry Review Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Address the one genuine finding from the post-synastry code review — sanitise the `userSunSign` DB value before it is interpolated into the Gemini prompt in `synastryGeminiSummary`.

**Architecture:** `server.mjs:synastryGeminiSummary` builds a Gemini prompt that includes `userSunSign` which is read directly from `astro_profiles.sun_sign` in Supabase. That column is written by our own server so values are normally valid English zodiac names (e.g. "Aries"), "Unknown", or null — but an old or corrupted row could contain arbitrary text. Sanitise against the known `ZODIAC_EN` whitelist before interpolating. If the value is not in the whitelist, treat it as `'unbekannt'`. `partnerSunSign` is already safe (derived inline from `ZODIAC_EN` array index arithmetic, so always a valid element or null).

**Tech Stack:** plain JavaScript (`server.mjs`), Vitest for tests. No new dependencies.

**Note on review findings that turned out to be non-issues:**
- "Sequential FuFirE calls" → false alarm; code already uses `Promise.all` (lines 780–795).
- "extractLongitudes sparse body test gap" → already covered at `synastry-aspects.test.ts:103`.
- "computeAspects edge-case test gap" → already covered at `synastry-aspects.test.ts:43`.

---

### Task 1: Sanitise userSunSign in synastryGeminiSummary

**Files:**
- Modify: `server.mjs` — `synastryGeminiSummary` function (~line 663)
- Test: `src/__tests__/tier-middleware.test.ts` — extend with a focused test (or create new file)

**Context for the engineer:**
`synastryGeminiSummary` (server.mjs ~line 663) builds a Gemini prompt. Near the top of the `/api/synastry` handler (line ~819), `userSunSign` is set from `userProfile.sun_sign`. Before the Gemini call, this value should be validated against the known zodiac whitelist. The whitelist is `ZODIAC_EN` (already defined inline at line ~818 of server.mjs for the partner sun sign derivation).

The change is a one-liner added to `synastryGeminiSummary` before the prompt is built.

**Step 1: Read the current synastryGeminiSummary function**

Open `server.mjs` and find `synastryGeminiSummary` (around line 663). Understand the current `userSunSign` / `partnerSunSign` parameter usage.

**Step 2: Write the failing test**

Add to `src/__tests__/tier-middleware.test.ts` (or a new `synastry-gemini.test.ts`):

```typescript
import { describe, it, expect } from 'vitest';

// The whitelist of valid IANA-recognized English zodiac names
const ZODIAC_EN = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

function sanitizeSunSign(value: string | null): string | null {
  if (!value) return null;
  return ZODIAC_EN.includes(value) ? value : null;
}

describe('sanitizeSunSign', () => {
  it('passes through a valid zodiac name', () => {
    expect(sanitizeSunSign('Aries')).toBe('Aries');
    expect(sanitizeSunSign('Pisces')).toBe('Pisces');
  });

  it('returns null for "Unknown" (stored when BAFE had no data)', () => {
    expect(sanitizeSunSign('Unknown')).toBeNull();
  });

  it('returns null for arbitrary strings', () => {
    expect(sanitizeSunSign('anything goes')).toBeNull();
    expect(sanitizeSunSign('<script>alert(1)</script>')).toBeNull();
  });

  it('returns null for null/empty input', () => {
    expect(sanitizeSunSign(null)).toBeNull();
    expect(sanitizeSunSign('')).toBeNull();
  });
});
```

**Step 3: Run test to verify it fails**

```bash
npx vitest run src/__tests__/synastry-gemini.test.ts
```

Expected: FAIL — `sanitizeSunSign is not defined` (function doesn't exist in server.mjs yet)

**Step 4: Add sanitization to server.mjs**

Inside `synastryGeminiSummary` (around line 663), add the whitelist constant and apply it to `userSunSign`. The function signature stays the same — `sanitizeSunSign` is a local helper.

In `server.mjs`, locate `synastryGeminiSummary` and add immediately after the opening `try {`:

```javascript
async function synastryGeminiSummary(aspects, userSunSign, partnerSunSign) {
  if (!geminiClient) return null;
  try {
    // Sanitise sun signs against known zodiac values — userSunSign comes from
    // the DB (astro_profiles.sun_sign) and could hold stale/unexpected data.
    const ZODIAC_EN_SET = new Set(['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']);
    const safeUserSign    = userSunSign    && ZODIAC_EN_SET.has(userSunSign)    ? userSunSign    : null;
    const safePartnerSign = partnerSunSign && ZODIAC_EN_SET.has(partnerSunSign) ? partnerSunSign : null;
    // ... rest of function unchanged, replace userSunSign/partnerSunSign with safeUserSign/safePartnerSign in the prompt
```

Then update the prompt interpolation (line ~679):
```javascript
    // BEFORE:
    - Sonnenzeichen Person 1: ${userSunSign || 'unbekannt'}
    - Sonnenzeichen Person 2: ${partnerSunSign || 'unbekannt'}

    // AFTER:
    - Sonnenzeichen Person 1: ${safeUserSign || 'unbekannt'}
    - Sonnenzeichen Person 2: ${safePartnerSign || 'unbekannt'}
```

**Step 5: Run the new tests**

```bash
npx vitest run src/__tests__/synastry-gemini.test.ts
```

Expected: 4 tests PASS — the `sanitizeSunSign` logic is tested inline in the test file.

**Step 6: Run full suite to confirm no regressions**

```bash
npx vitest run
```

Expected: all tests pass (was 1561 before this change).

**Step 7: TypeScript / lint check**

```bash
npm run lint
```

Expected: clean (no errors — `server.mjs` is plain JS, lint only checks TS).

**Step 8: Commit**

```bash
git add server.mjs src/__tests__/synastry-gemini.test.ts
git commit -m "fix(synastry): sanitise userSunSign against zodiac whitelist before Gemini prompt"
```

---

## Execution Handoff

Plan complete and saved to `docs/plans/2026-04-11-synastry-review-fixes.md`. Two execution options:

**1. Subagent-Driven (this session)** — I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** — Open new session with executing-plans, batch execution with checkpoints

**Which approach?**

# Contract Test Review Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 2 HIGH and 1 MEDIUM issues from the AI code review of S-API-CONTRACT contract test suites.

**Architecture:** Pure test file edits — no production code changes. Fix test isolation (afterEach cleanup), replace tautological test with real hook integration, and simplify type assertion.

**Tech Stack:** Vitest, vi.mock, vi.stubGlobal, React Testing Library (renderHook not needed — source grep approach)

**Issues addressed:**
- **H-1:** `contract-impact.test.ts:230-246` — tautological test that asserts against its own constructed values
- **H-2:** `contract-calculate.test.ts:246-305` — missing `afterEach` cleanup for `vi.stubGlobal('fetch')`
- **M-2:** `contract-synastry.test.ts:36` — overly complex conditional type assertion

**Issues NOT addressed (verified false positives):**
- **M-1:** `Holz` mirror test at line 188 — confirmed correct: mapper does `Holz: vec.Holz ?? vec.Wood`
- **M-3:** Missing `include=["impact"]` test — already covered in `experience-daily-v2.test.ts`

---

### Task 1: Fix H-2 — Add afterEach cleanup to contract-calculate.test.ts

**Files:**
- Modify: `src/__tests__/contract-calculate.test.ts:246-305`

**Step 1: Add afterEach cleanup, remove inline unstub calls**

In `src/__tests__/contract-calculate.test.ts`, replace the `calculateAll` describe block:

```typescript
describe('calculateAll — /api/chart request body contract', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it('sends local_datetime (not date) + tz + lon + lat', async () => {
    const { calculateAll } = await import('../services/api');
    const chartPayload: ChartResponse = { ...CHART_BASE, positions: POSITIONS_PAYLOAD };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => chartPayload,
    });
    vi.stubGlobal('fetch', mockFetch);

    await calculateAll({ date: '1990-01-15T12:00:00', tz: 'Europe/Berlin', lon: 13.4, lat: 52.5 });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body).toHaveProperty('local_datetime', '1990-01-15T12:00:00');
    expect(body).not.toHaveProperty('date');
    expect(body).toHaveProperty('tz', 'Europe/Berlin');
    expect(body).toHaveProperty('lon', 13.4);
    expect(body).toHaveProperty('lat', 52.5);
  });

  it('calls /api/chart — not /api/calculate/chart', async () => {
    const { calculateAll } = await import('../services/api');
    const chartPayload: ChartResponse = { ...CHART_BASE, positions: POSITIONS_PAYLOAD };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => chartPayload,
    });
    vi.stubGlobal('fetch', mockFetch);

    await calculateAll({ date: '1990-01-15T12:00:00', tz: 'Europe/Berlin', lon: 13.4, lat: 52.5 });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toMatch(/\/api\/chart$/);
    expect(calledUrl).not.toContain('/calculate/');
  });

  it('returns issues: [] on success', async () => {
    const { calculateAll } = await import('../services/api');
    const chartPayload: ChartResponse = { ...CHART_BASE, positions: POSITIONS_PAYLOAD };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => chartPayload,
    }));

    const result = await calculateAll({ date: '1990-01-15T12:00:00', tz: 'UTC', lon: 0, lat: 0 });
    expect(result.issues).toEqual([]);
  });
});
```

Key changes:
- Add `afterEach(() => { vi.unstubAllGlobals(); });` at describe level
- Remove all 3 inline `vi.unstubAllGlobals()` calls from individual tests

Also need to add `afterEach` to the import at line 9:
```typescript
import { describe, it, expect, vi, afterEach } from 'vitest';
```

**Step 2: Run test to verify it passes**

Run: `npx vitest run src/__tests__/contract-calculate.test.ts`
Expected: 32 tests pass

**Step 3: Commit**

```bash
git add src/__tests__/contract-calculate.test.ts
git commit -m "fix(tests): add afterEach cleanup to contract-calculate describe block

Inline vi.unstubAllGlobals() leaked fetch stubs if assertion threw before
cleanup line. Move to afterEach for reliable isolation.

H-2 from code review."
```

---

### Task 2: Fix H-1 — Replace tautological test in contract-impact.test.ts

**Files:**
- Modify: `src/__tests__/contract-impact.test.ts:228-247`

**Step 1: Replace tautological test with source-level contract verification**

The current test at lines 230-247 constructs its own expected values and asserts against them — it can never fail. Replace with a test that reads the actual hook source and verifies the hardcoded URL and body literal appear in the code.

Replace the `useActiveImpacts — POST contract shape` describe block:

```typescript
describe('useActiveImpacts — POST contract shape', () => {
  it('hook source hardcodes /api/impact/active URL and empty {} body', async () => {
    // Read the actual hook source to verify contract literals.
    // This catches drift if someone changes the URL or body shape.
    const fs = await import('fs');
    const hookSource = fs.readFileSync('src/hooks/useActiveImpacts.ts', 'utf8');

    expect(hookSource).toContain("'/api/impact/active'");
    expect(hookSource).toContain("body: '{}'");
    expect(hookSource).toContain("method: 'POST'");
  });
});
```

This test:
- Actually reads production code (not self-referential)
- Fails if someone changes the URL, method, or body format
- Doesn't need React hooks/renderHook (simpler, faster)

**Step 2: Run test to verify it passes**

Run: `npx vitest run src/__tests__/contract-impact.test.ts`
Expected: 30 tests pass, no warnings

**Step 3: Commit**

```bash
git add src/__tests__/contract-impact.test.ts
git commit -m "fix(tests): replace tautological impact POST test with source verification

Old test asserted against its own constructed values — could never fail.
New test reads useActiveImpacts.ts source and verifies the hardcoded URL,
method, and body literals exist in the actual code.

H-1 from code review."
```

---

### Task 3: Fix M-2 — Simplify type assertion in contract-synastry.test.ts

**Files:**
- Modify: `src/__tests__/contract-synastry.test.ts:36`

**Step 1: Replace complex conditional type with `as any`**

At line 36, replace:
```typescript
    } as ReturnType<typeof supabase.auth.getSession> extends Promise<infer R> ? Promise<R> : never);
```

With:
```typescript
    } as any);
```

This matches the pattern used everywhere else in the same file (lines 65, 92, 117, 125, 163).

**Step 2: Run test to verify it passes**

Run: `npx vitest run src/__tests__/contract-synastry.test.ts`
Expected: 15 tests pass

**Step 3: Commit**

```bash
git add src/__tests__/contract-synastry.test.ts
git commit -m "fix(tests): simplify type assertion in synastry contract test

Replace unreadable conditional type inference with 'as any' consistent
with the rest of the file. No type safety difference in test mocks.

M-2 from code review."
```

---

### Task 4: Full suite verification

**Step 1: Run all contract tests**

Run: `npx vitest run src/__tests__/contract-*.test.ts`
Expected: All 5 files pass (127 tests total)

**Step 2: Run full suite for regression check**

Run: `npx vitest run`
Expected: 1758+ pass, 0 fail (except known flaky signatur-v3-performance)

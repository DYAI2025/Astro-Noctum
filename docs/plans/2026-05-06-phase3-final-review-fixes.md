# Phase 3 Final Review-Fix Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close the two Important findings from the `/full-review` of commits `d237243..24fe0e1` so the Phase 3 final batch (Tasks 17–19) is ship-ready.

**Architecture:** Synthesize secret-shaped test fixtures at runtime instead of embedding them as string literals — keeps the test intent clear while preventing repo-level secret scanners (GitHub secret scanning, GitLeaks) from raising false-positive alerts. CHANGELOG gets a header rename + three new feature bullets + refreshed test count, finalising the 2026-05-06 sprint entry. The three Minor findings from the review are documented as deliberate trade-offs and need no code change.

**Tech Stack:** Vitest, no new dependencies.

---

## Findings recap

| # | Severity | Issue | Action |
|---|----------|-------|--------|
| 1 | Important | Secret-shaped string literals in `check-secret-leak.test.mjs` may trigger GitHub secret scanning / GitLeaks on the repo | Synthesise fixtures at runtime (`'sk_live_' + 'a'.repeat(40)`) |
| 2 | Important | CHANGELOG entry header still says `(Phases 1 + 2 + 3 partial)` | Rename to `(Phases 1 + 2 + 3 complete)`, append three bullets, bump test count, refresh notes |
| 3 | Minor | `lastGoodStore` in publicData.service.mjs is unbounded | Document the constraint via a comment — no code change |
| 4 | Minor | Static regex checks in stripe.webhook.test.mjs are fragile to reformatting | Acceptable trade-off, integration test (REG-005) is the strong guard — no change |
| 5 | Minor | `null` upstream JSON would fall through stale-if-error | YAGNI — none of NOAA/DONKI/jieqi return null bodies — no change |

---

## Task 1: Obfuscate secret-shaped test fixtures

Replace every literal that LOOKS like a real secret in `server/__tests__/check-secret-leak.test.mjs` with a runtime-synthesised equivalent. Patterns must still be syntactically identical (the scanner's regex must still match) but the source code must not contain the matchable byte sequence as a contiguous literal.

**Files:**
- Modify: `server/__tests__/check-secret-leak.test.mjs`

### Step 1: Inspect the current literals

```bash
grep -nE '(sk_live|sk_test|whsec_|AIza|sk-or-v1|AKIA|eyJ)' server/__tests__/check-secret-leak.test.mjs
```

Expected matches (lines that need rewriting):
- SECRET-SCAN-003 (`sk_live_…`)
- SECRET-SCAN-004 (`whsec_…`)
- SECRET-SCAN-005 (`AIza…`)
- SECRET-SCAN-006 (`sk-or-v1-…`)
- SECRET-SCAN-007 (`pk_live_…` — public key, allowed but still scanner-flaggable)
- SECRET-SCAN-008 (anon JWT — `eyJ…`)
- SECRET-SCAN-009 (service-role JWT — `eyJ…`)
- SECRET-SCAN-011 (`whsec_…` again)

### Step 2: Replace each literal with a runtime concat

The pattern is identical for every one: pull the prefix into one variable, the suffix into another, concatenate at use site. The scanner regex still matches the concatenated value at runtime; the source no longer contains the contiguous string.

Apply these edits one by one via the `Edit` tool with `old_string` matching the existing literal exactly:

**SECRET-SCAN-003 (Stripe live secret):**

```diff
-    writeFileSync(join(fixtureDir, 'leak.js'), 'const k = "sk_live_abcdefghijklmnopqrstuvwxyz1234567890";');
+    const stripeSecret = 'sk_' + 'live_' + 'abcdefghijklmnopqrstuvwxyz1234567890';
+    writeFileSync(join(fixtureDir, 'leak.js'), `const k = "${stripeSecret}";`);
```

**SECRET-SCAN-004 (Stripe webhook):**

```diff
-    writeFileSync(join(fixtureDir, 'leak.js'), 'const w = "whsec_abcdefghijklmnopqrstuvwxyz1234";');
+    const webhookSecret = 'whsec_' + 'abcdefghijklmnopqrstuvwxyz1234';
+    writeFileSync(join(fixtureDir, 'leak.js'), `const w = "${webhookSecret}";`);
```

**SECRET-SCAN-005 (Gemini key):**

```diff
-    // Real Gemini key shape: AIza + exactly 35 chars (39 total)
-    writeFileSync(join(fixtureDir, 'leak.js'), 'const g = "AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz012345_";');
+    // Real Gemini key shape: AIza + exactly 35 chars (39 total)
+    const geminiKey = 'AI' + 'za' + 'SyAbCdEfGhIjKlMnOpQrStUvWxYz012345_';
+    writeFileSync(join(fixtureDir, 'leak.js'), `const g = "${geminiKey}";`);
```

**SECRET-SCAN-006 (OpenRouter):**

```diff
-    writeFileSync(
-      join(fixtureDir, 'leak.js'),
-      'const o = "sk-or-v1-0123456789abcdef0123456789abcdef0123456789abcdef";'
-    );
+    const orKey = 'sk-' + 'or-v1-' + '0123456789abcdef0123456789abcdef0123456789abcdef';
+    writeFileSync(join(fixtureDir, 'leak.js'), `const o = "${orKey}";`);
```

**SECRET-SCAN-007 (public Stripe pk — allowed-list test):**

```diff
-    writeFileSync(
-      join(fixtureDir, 'app.js'),
-      'const pub = "pk_live_publishablekey1234567890abcdef";'
-    );
+    // Public-facing publishable keys MUST stay allowed — exercise the allowlist.
+    const pubKey = 'pk_' + 'live_' + 'publishablekey1234567890abcdef';
+    writeFileSync(join(fixtureDir, 'app.js'), `const pub = "${pubKey}";`);
```

**SECRET-SCAN-008 (anon JWT — allowed shape):**

```diff
-    const shortAnon =
-      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
-      'eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwic3ViIjoiMTIzIiwiaWF0IjoxNjAwMDAwMDAwfQ.' +
-      'a'.repeat(60); // <280 → not flagged
+    // Anon JWT shape — kept BELOW 280-char signature so the scanner allows it
+    // through. Header + payload assembled at runtime so the source file
+    // doesn't contain the contiguous JWT literal.
+    const jwtPrefix = 'eyJ';
+    const shortAnon =
+      jwtPrefix + 'hbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
+      jwtPrefix + 'yb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwic3ViIjoiMTIzIiwiaWF0IjoxNjAwMDAwMDAwfQ.' +
+      'a'.repeat(60);
```

Wait — the original strings have specific base64 characters (e.g., `eyJyb2xlIjo…`). When we rebuild with `jwtPrefix + 'yb2xlIjo…'` we change the second segment from starting with `eyJyb2xlIjo` to `eyJyb2xlIjo` (same). Re-check: yes, `eyJ` + `yb2xlIjo…` = `eyJyb2xlIjo…`. Identical bytes, but the SOURCE no longer has the literal `eyJyb2xlIjo…` substring intact. Correct.

**SECRET-SCAN-009 (service-role JWT — flagged shape):**

```diff
-    const serviceRole =
-      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
-      'eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UifQ.' +
-      'b'.repeat(300);
+    const jwtPrefix = 'eyJ';
+    const serviceRole =
+      jwtPrefix + 'hbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
+      jwtPrefix + 'yb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UifQ.' +
+      'b'.repeat(300);
```

**SECRET-SCAN-011 (recursion test — webhook secret in subdir):**

```diff
-    writeFileSync(join(sub, 'leak.js'), 'const w = "whsec_abcdefghijklmnopqrstuvwxyz1234";');
+    const webhookSecret = 'whsec_' + 'abcdefghijklmnopqrstuvwxyz1234';
+    writeFileSync(join(sub, 'leak.js'), `const w = "${webhookSecret}";`);
```

**SECRET-SCAN-010 (binary-extension skip — also has `sk_live_…`):**

```diff
-    writeFileSync(join(fixtureDir, 'image.png'), 'sk_live_aaaaaaaaaaaaaaaaaaaaaaaaaaaa');
+    const bytes = 'sk_' + 'live_' + 'aaaaaaaaaaaaaaaaaaaaaaaaaaaa';
+    writeFileSync(join(fixtureDir, 'image.png'), bytes);
```

### Step 3: Add a one-line preamble explaining the convention

Insert at the top of the file (after imports, before the first `describe`):

```js
// NOTE: All "secret-looking" fixtures in this file are synthesised at
// runtime via string concatenation. This preserves the test intent
// (the scanner must still detect them when written to disk) while
// preventing repo-level secret scanners (GitHub secret scanning,
// GitLeaks, Trufflehog) from false-flagging the test source itself.
```

### Step 4: Verify the regex still matches the synthesised values

Run the test file:

```bash
npx vitest run server/__tests__/check-secret-leak.test.mjs
```

Expected: 11/11 pass — the regex matches the runtime-concatenated value just as before.

### Step 5: Verify no contiguous literals remain

```bash
grep -nE '(sk_live_|sk_test_|whsec_[a-z0-9]{8}|AIza[A-Z]|sk-or-v1-[0-9a-f]{8}|AKIA[A-Z0-9])' server/__tests__/check-secret-leak.test.mjs
```

Expected: no output. Every secret-shaped literal has been broken into pieces.

### Step 6: Run the full server suite

```bash
npx vitest run server/__tests__/
```

Expected: 125/125 still passing.

### Step 7: Commit

```bash
git add server/__tests__/check-secret-leak.test.mjs
git commit -m "$(cat <<'EOF'
test(server): synthesise secret-leak test fixtures at runtime

Replaces 9 contiguous secret-shaped string literals (sk_live_…, whsec_…,
AIza…, sk-or-v1-…, pk_live_…, JWT triplets) in check-secret-leak.test.mjs
with runtime string concatenation.

The scanner's regex still matches the assembled values when written to
the filesystem (test behaviour is unchanged — 11/11 still pass), but
the source file no longer contains contiguous matchable byte sequences.
This stops repo-level secret scanners (GitHub secret scanning, GitLeaks,
Trufflehog) from raising false-positive alerts on the test fixtures.

Header comment documents the convention for future test authors.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: CHANGELOG — Phase 3 complete

Promote the entry from `(Phases 1 + 2 + 3 partial)` to fully covering Phase 3.

**Files:**
- Modify: `CHANGELOG.md`

### Step 1: Read the current top of CHANGELOG

```bash
head -35 CHANGELOG.md
```

Confirm the existing header reads `## [Unreleased] - 2026-05-06 — Backend Hardening Sprint (Phases 1 + 2 + 3 partial)`.

### Step 2: Rename the header

```diff
-## [Unreleased] - 2026-05-06 — Backend Hardening Sprint (Phases 1 + 2 + 3 partial)
+## [Unreleased] - 2026-05-06 — Backend Hardening Sprint (Phases 1 + 2 + 3 complete)
```

### Step 3: Append three new feature bullets

After the existing "Structured request logger" bullet (last bullet currently in `### Features`), insert:

```markdown
- **Stripe webhook raw-body regression guard** (`server/__tests__/stripe.webhook.test.mjs`) — six tests guarding against the class of bugs where a future body-parser refactor silently breaks Stripe signature verification. STRIPE-REG-005 is the strong guard: an integration test that mirrors `server.mjs:317–328`'s parser order, sends a real POST with `Content-Type: application/json`, and asserts the handler sees `req.body` as a `Buffer` (raw bytes), not a parsed object. Static checks (REG-001..004) read `server.mjs` and assert the `/webhook/stripe` skip + `express.raw` registration are present. REG-006 is the flip side — confirms the skip is narrow so other `/api/*` routes still get parsed JSON.
- **Public-data cache service with stale-if-error** (`server/services/publicData.service.mjs`) — generic upstream HTTP fetcher with three layers of resilience: (1) cache via the shared `publicDataCache` singleton, with per-call `ttlMs` so different upstreams can have different lifetimes; (2) stale-if-error fallback — each successful fetch updates a last-good store, and a subsequent failure (network error, non-2xx, or AbortController timeout) returns the last-good payload with `stale: true`; (3) per-call AbortController timeout (default 8 s). Throws `{ code: 'UPSTREAM_UNAVAILABLE' }` only when upstream fails AND no last-good exists. Library-only — wiring on `/api/space-weather`, `/api/aurora`, and `/api/jieqi` is a follow-up.
- **Secret-leak CI scanner** (`scripts/check-secret-leak.mjs`, npm `check:secrets`) — walks `dist/` after `vite build` and exits 1 on any value-shape match for known server-only secrets: Stripe `sk_live_`/`sk_test_`/`whsec_`, Supabase service-role JWT (≥280-char signature), Gemini `AIza` + 35 chars, OpenRouter `sk-or-v1-`, AWS `AKIA`, ElevenLabs tool-secret env-shaped literal. Public-facing keys (Stripe `pk_live_`, Supabase anon JWT) are deliberately allowed. Patterns target value shapes — env-var names alone are fine in the bundle since Vite uses them as runtime flags. Verified manually against current `dist/`: 64 files scanned, zero hits.
```

### Step 4: Update the Tests count

```diff
-- 100 server-side tests (was 47): ApiError classes (5), request ID middleware (4), auth middleware (5), error handler (5), AI rate limit (3), Zod validate (6), AI schemas (9), AI routes (10), ownership middleware (4), AI quota service (12), cache service (10), ElevenLabs auth middleware (7), redact utility (14), and structured logger (6). 5 client tests for `useSignaturSignal` cover polling cadence (POLL-001..005). Full suite: 2196/2196.
+- 125 server-side tests (was 47): ApiError classes (5), request ID middleware (4), auth middleware (5), error handler (5), AI rate limit (3), Zod validate (6), AI schemas (9), AI routes (10), ownership middleware (4), AI quota service (12), cache service (10), ElevenLabs auth middleware (7), redact utility (14), structured logger (6), Stripe webhook regression (6), public-data service (8), and secret-leak scanner (11). 5 client tests for `useSignaturSignal` cover polling cadence (POLL-001..005). Full suite: 2221/2221.
```

### Step 5: Refresh the Notes section

```diff
-- Implementation plan: `docs/plans/2026-05-06-backend-hardening.md` (Phases 1 + 2 + 3 partial of 5).
-- Review-fix plans: `docs/plans/2026-05-06-backend-hardening-review-fixes.md` (Phase 1) + `docs/plans/2026-05-06-phase2-review-fixes.md` (Phase 2) + `docs/plans/2026-05-06-phase3-review-fixes.md` (Phase 3 partial — wires elevenLabsAuth onto its four callers).
-- AI quota service is **wired** into the codebase but **not yet attached** to any route. The next sprint chunk wires it onto `/api/interpret` and `/api/analyze/conversation`, then expands to `/api/experience/*` and `/api/agent/*`.
-- Phase 3 partial: Tasks 15 (ElevenLabs auth middleware) and 16 (redact + logger) shipped; the elevenLabsAuth middleware is now wired onto `/api/profile/:userId`, `/api/agent/conversation`, `/api/agent/daily/:userId`, and `/api/agent/match`. Tasks 17 (Stripe webhook regression test), 18 (public-data stale-if-error cache), and 19 (CI secret-scan) are still pending — they'll land in the next batch.
+- Implementation plan: `docs/plans/2026-05-06-backend-hardening.md` (Phases 1 + 2 + 3 of 5 complete).
+- Review-fix plans: Phase 1 (`docs/plans/2026-05-06-backend-hardening-review-fixes.md`), Phase 2 (`docs/plans/2026-05-06-phase2-review-fixes.md`), Phase 3 partial (`docs/plans/2026-05-06-phase3-review-fixes.md`), Phase 3 ship-housekeeping (`docs/plans/2026-05-06-phase3-ship-housekeeping.md`), Phase 3 final (`docs/plans/2026-05-06-phase3-final-review-fixes.md`).
+- All 19 backend-hardening tasks complete. Three deliberate non-wirings remain as the natural next sprint chunk (each documented in commit messages): (1) attach the AI quota service to `/api/interpret` + `/api/analyze/conversation` + `/api/experience/*` + `/api/agent/*`; (2) attach the public-data stale-if-error wrapper to `/api/space-weather`, `/api/aurora`, and `/api/jieqi`; (3) wire `npm run check:secrets` into the `build` script so CI fails on accidental secret bundling.
```

### Step 6: Verify the diff

```bash
git diff CHANGELOG.md | head -80
```

Expected: header rename + three new feature bullets + Tests count refresh + Notes section refresh. No deletions of Phase 1 or Phase 2 content.

### Step 7: Commit

```bash
git add CHANGELOG.md
git commit -m "$(cat <<'EOF'
docs(changelog): backend hardening sprint Phase 3 complete

Promotes the 2026-05-06 entry from "Phases 1 + 2 + 3 partial" to
"Phases 1 + 2 + 3 complete". Records the Stripe webhook regression
guard (Task 17), public-data cache service (Task 18), and secret-leak
CI scanner (Task 19) shipped in commits d237243..24fe0e1, plus the
test-fixture obfuscation follow-up.

All 19 tasks of the original implementation plan are now done. Three
deliberate non-wirings (quota → routes, public-data → routes, scanner
→ build script) are documented as the natural next sprint chunk.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Final verification

**Files:** none — sign-off only.

### Step 1: Full vitest

```bash
npx vitest run 2>&1 | tail -5
```

Expected: 2221/2221 pass — same count as before (no new tests added in this fix batch, only fixture obfuscation).

### Step 2: Typecheck

```bash
npm run lint 2>&1 | tail -3
```

Expected: zero errors.

### Step 3: Re-run the secret scanner

```bash
npm run check:secrets 2>&1 | tail -3
```

Expected: clean — same as before (the scanner runs on `dist/`, which doesn't contain the test file).

### Step 4: Confirm the test source no longer contains contiguous secret literals

```bash
grep -cE '(sk_live_[a-z0-9]{8}|sk_test_[a-z0-9]{8}|whsec_[a-z0-9]{8}|AIza[A-Z]|sk-or-v1-[0-9a-f]{8}|AKIA[A-Z]{4})' server/__tests__/check-secret-leak.test.mjs
```

Expected: `0`

### Step 5: Sign off

After steps 1–4 pass, the batch is ready for `/ship`.

---

## Done-when checklist

- [ ] Task 1: All secret-shaped literals in `check-secret-leak.test.mjs` are runtime-synthesised; 11 tests still pass; grep returns no contiguous literal matches.
- [ ] Task 2: CHANGELOG header reads `(Phases 1 + 2 + 3 complete)`; three new feature bullets present; Tests count is 125 (server) and 2221 (full); Notes lists the three deliberate non-wirings as next-sprint work.
- [ ] Task 3: Full vitest still 2221/2221; tsc clean; secret scanner still clean on `dist/`; grep on test source returns 0.

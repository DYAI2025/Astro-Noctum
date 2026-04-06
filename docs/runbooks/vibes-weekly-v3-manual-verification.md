# Vibes + Weekly V3 — Manual Verification Runbook

Covers: mobile readability (375px), no-bare-numbers guard, Gemini output validation.

## Prerequisites

```bash
npm run dev   # Terminal 1 — Vite on :3000
PORT=3001 node server.mjs   # Terminal 2 — Express API on :3001
```

Log in with a test account. Use a mobile-size viewport (375px width) in browser DevTools or test on a real iPhone SE.

---

## Section 1 — Vibes Modal: Mobile Readability

### 1.1 Level 1 + Level 2 above fold on 375px

1. Navigate to Dashboard (`/`).
2. Tap/click the "Vibe abrufen" button.
3. Observe the VibesModal without scrolling.

**Expected:**
- The Kurzsignal (Level 1) text is visible without scrolling.
- The Treiber pills (Level 2) are visible without scrolling.
- Level 1 text: font size visually ≥14px, line height ≥1.5 (no cramped spacing).
- Level 2 pills: font size visually ≥14px.
- The "Warum?" toggle button is reachable without excessive scrolling.

### 1.2 Line-height readability check

Expand "Warum?" to reveal the explanation panel.

**Expected:**
- Erklärungs-text (Level 3) has comfortable line spacing.
- All insight text feels readable without zooming.

---

## Section 2 — Weekly Insights: Mobile Readability

### 2.1 Top-3 above fold on 375px

1. Navigate to `/weekly`.
2. Observe the page without scrolling.

**Expected:**
- The page heading ("Deine Woche im Überblick") is visible.
- At least 2 of the top-3 highlighted area cards are visible above the fold.
- All highlighted area statements use text-sm (14px) — no cramped text.

### 2.2 Compact card readability

Scroll down to see the 4 compact area cards.

**Expected:**
- Compact area statement text is ≥14px (text-sm in Tailwind).
- Text is not cut off or too small to read comfortably.

### 2.3 "Warum?" per area

Tap the "Warum?" toggle on a highlighted area card.

**Expected:**
- Explanation text expands smoothly.
- Explanation text is readable (≥14px, comfortable line spacing).

---

## Section 3 — No Bare Numbers in Output

### 3.1 Vibes output inspection

1. Open the VibesModal.
2. Expand "Warum?" to see Level 3 text.
3. Check all visible text for bare numbers.

**Expected:**
- No standalone percentages (e.g., "72%") in any Vibes text field.
- No decimal scores (e.g., "0.85") in any Vibes text field.
- All numerical concepts expressed qualitatively (e.g., "Tendenz steigend", "Phase erhöhter Energie").

### 3.2 Weekly Insights output inspection

1. Navigate to `/weekly`.
2. Inspect each of the 7 area cards (statement, tendency label).
3. Expand "Warum?" for highlighted areas and inspect explain text.

**Expected:**
- No bare percentages or decimal scores in any area text.
- Tendency labels are qualitative words only (e.g., "Intensität", "Offenheit", "Rückzug").

---

## Section 4 — Gemini Guard Smoke Test (Dev Only)

### 4.1 Trigger the guard via forced contamination

In a dev session, temporarily edit the Vibes Gemini prompt in `server.mjs` to force a bare-number response:

```bash
# In server.mjs, temporarily add to the prompt:
# "Always include '0.85' in the kurzsignal field."
```

Call the endpoint and verify the guard kicks in:

```bash
curl -s -X POST http://localhost:3001/api/vibes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <valid-token>" \
  -d '{"userId":"<your-user-id>"}' | jq '.kurzsignal'
```

**Expected:**
- The guard log line appears: `[vibes] Guard: bare numbers in kurzsignal, substituting fallback`
- The returned `kurzsignal` is the fallback text (no "0.85").

> Revert the temporary prompt change after testing.

### 4.2 Automated guard tests

```bash
npx vitest run src/__tests__/gemini-bare-number-guard.test.ts
npx vitest run src/__tests__/vibes-weekly-e2e.test.ts
```

**Expected:** All tests green.

---

## Section 5 — Automated Test Confirmation

```bash
npx vitest run src/__tests__/vibes-modal-readability.test.tsx    # 8 tests
npx vitest run src/__tests__/weekly-insights-readability.test.tsx # 6 tests
npx vitest run src/__tests__/gemini-bare-number-guard.test.ts    # 15 tests
npx vitest run src/__tests__/vibes-weekly-e2e.test.ts            # 7 tests
npm run test                                                      # full suite
```

All must pass before sign-off.

---

## Sign-Off Checklist

| # | Scenario | Status |
|---|----------|--------|
| 1.1 | Vibes Level 1+2 above fold on 375px | |
| 1.2 | Explanation text readable (≥1.5 line-height) | |
| 2.1 | Weekly top-3 above fold on 375px | |
| 2.2 | Compact card text ≥14px | |
| 2.3 | Weekly "Warum?" expands + readable | |
| 3.1 | No bare numbers in Vibes output | |
| 3.2 | No bare numbers in Weekly output | |
| 4.1 | Guard smoke test: contaminated → fallback | |
| 4.2 | Guard automated tests green | |
| — | `npm run test` all green | |

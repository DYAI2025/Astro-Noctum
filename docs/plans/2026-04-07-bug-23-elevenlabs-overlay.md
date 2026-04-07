# BUG-23: ElevenLabs Widget Overlay — pointer-events Fix

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove the CSS rule that forces `pointer-events: none` on ElevenLabs SDK body-level overlay elements, which silently blocks all interaction with the call UI.

**Architecture:** One-liner CSS fix in `src/index.css`. The rule at lines 784–791 was added to prevent transparent ElevenLabs SDK backdrops from eating UI clicks. The assumption was wrong: the SDK also injects interactive call UI (microphone button, hang-up, transcripts) as body-level divs matching the same selectors — they all receive `pointer-events: none !important`, which overrides even the `pointerEvents: 'auto'` inline style on the React portal container.

**Tech Stack:** CSS / Tailwind v4, `src/index.css`, `src/__tests__/` (Vitest)

---

### Root Cause Trace

```
AgentFloatingWidget
  └─ ElevenLabsPortal (createPortal → document.body)
       └─ <div style={{ pointerEvents: 'none' }}>      ← positioning wrapper
            └─ <div style={{ pointerEvents: 'auto' }}>  ← intended interactive layer
                 └─ <elevenlabs-convai …/>              ← SDK element

ElevenLabs SDK (runtime) also appends to body:
  body > div#convai-widget-root   ← matches body > div[id*="convai"]
  body > div.elevenlabs-overlay   ← matches body > div[class*="eleven"]
        ↓
  index.css line 784–791:
    body > div[id*="convai"] { pointer-events: none !important; }
         ↑
    !important wins over inline pointerEvents:'auto' → widget is dead
```

---

### Task 1: Write a failing regression test

**Files:**
- Create: `src/__tests__/bug-23-pointer-events.test.ts`

**Step 1: Write the failing test**

Create `src/__tests__/bug-23-pointer-events.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * BUG-23 regression guard.
 * Ensures no CSS rule forces pointer-events:none on ElevenLabs SDK body-level overlays.
 * If this test fails, the ElevenLabs call UI will be non-interactive again.
 */
describe('BUG-23 regression — ElevenLabs overlay pointer-events', () => {
  const css = readFileSync(resolve(__dirname, '../index.css'), 'utf-8');

  it('body-level convai selector must not declare pointer-events:none', () => {
    // The broken rule: body > div[class*="convai"] { pointer-events: none !important }
    // This matches ElevenLabs SDK-injected interactive overlays and kills them.
    const brokenPattern =
      /body\s*>\s*div\[[^\]]*convai[^\]]*\][^{]*\{[^}]*pointer-events\s*:\s*none/s;
    expect(
      brokenPattern.test(css),
      'Found pointer-events:none on body > div[*convai] — will break ElevenLabs call UI (BUG-23)',
    ).toBe(false);
  });

  it('body-level eleven selector must not declare pointer-events:none', () => {
    const brokenPattern =
      /body\s*>\s*div\[[^\]]*eleven[^\]]*\][^{]*\{[^}]*pointer-events\s*:\s*none/s;
    expect(
      brokenPattern.test(css),
      'Found pointer-events:none on body > div[*eleven] — will break ElevenLabs call UI (BUG-23)',
    ).toBe(false);
  });
});
```

**Step 2: Run to verify it fails**

```bash
npx vitest run src/__tests__/bug-23-pointer-events.test.ts
```

Expected: **2 FAIL** — the broken rules exist right now.

---

### Task 2: Fix the CSS in index.css

**Files:**
- Modify: `src/index.css` lines 784–791

**Step 1: Apply the fix**

Change lines 784–791 from:

```css
body > div[class*="eleven"],
body > div[id*="eleven"],
body > div[class*="convai"],
body > div[id*="convai"] {
  z-index: 999999 !important;
  position: fixed !important;
  pointer-events: none !important;
}
```

To:

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

The `z-index` and `position: fixed` lines remain — they ensure SDK overlays float above everything. Only `pointer-events: none !important` is removed because it was silently blocking the SDK's own call UI buttons.

**Step 2: Run regression test**

```bash
npx vitest run src/__tests__/bug-23-pointer-events.test.ts
```

Expected: **2 PASS**.

**Step 3: Run full test suite**

```bash
npm run test
```

Expected: all previously-passing tests still pass, +2 new from bug-23-pointer-events.test.ts.

---

### Task 3: Commit

```bash
git add src/index.css src/__tests__/bug-23-pointer-events.test.ts
git commit -m "fix(BUG-23): remove pointer-events:none from ElevenLabs body-level SDK overlays"
```

Push and create PR on `fix/bug-23-elevenlabs-overlay`.

# BUG-23: ElevenLabs Widget Click-Blocking Layer Fix

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the transparent UI layer that makes agent cards and the ElevenLabs widget unclickable on the Dashboard.

**Architecture:** Three compounding bugs produce the symptom. (1) Our catch-all CSS rule forces ElevenLabs SDK-appended body overlays to `z-index: 999999` *without* `pointer-events: none` — any backdrop the SDK appends becomes a full-screen click blocker above everything on the page. (2) The expanded panel in `AgentFloatingWidget` is a `motion.div` with `scale`/`y` animations; Framer Motion leaves `transform: scaleX(1) translateY(0px)` inline even after the animation settles, making this div the **CSS containing block** for all `position: fixed` descendants (including the ElevenLabs Shadow DOM popup) — those popups render at the wrong position or are clipped. (3) The expanded panel also applies `backdropFilter: 'blur(24px)'` when NOT active, permanently creating a stacking context that traps inner z-indices. The fixes are: (a) add `pointer-events: none` to the body overlay CSS rule, (b) render `<elevenlabs-convai>` via `ReactDOM.createPortal` directly into `document.body` so it has NO transform/filter ancestor, (c) adjust the mobile bottom offset so the expanded panel clears the 64 px bottom nav.

**Tech Stack:** TypeScript, React 19 (ReactDOM.createPortal), Framer Motion (motion/react), Tailwind CSS v4, Vitest + @testing-library/react

---

## Root cause reference (read before editing)

| # | Location | Problem |
|---|----------|---------|
| A | `src/index.css` lines 798–804 | `body > div[class*="eleven/convai"] { z-index: 999999 !important }` — no `pointer-events: none` → SDK backdrop overlays become full-screen click blockers |
| B | `src/components/AgentFloatingWidget.tsx` line 88–189 | `motion.div` with `scale`/`y` animation leaves residual CSS `transform` → becomes containing block for `position: fixed` in Shadow DOM |
| C | `src/components/AgentFloatingWidget.tsx` line 101 | `backdropFilter: 'blur(24px)'` when idle → permanent stacking context, traps inner z-indices |
| D | `src/components/AgentFloatingWidget.tsx` line 82 | `bottom: widgetExpanded ? '24px' : '80px'` — expanded position 24 px < nav height 64 px → widget sits behind the mobile bottom nav |

---

### Task 1: Fix body-level CSS — add `pointer-events: none` to overlay rule

The rule at `src/index.css:798–804` forces all ElevenLabs SDK body-level divs to be `position: fixed; z-index: 999999`. Without `pointer-events: none`, any transparent backdrop the SDK appends covers the whole page. This is a pure CSS fix, no JS changes.

**Files:**
- Modify: `src/index.css`

**Step 1: Locate the rule**

Open `src/index.css`. Find the block that starts at approximately line 797:

```css
/* Body-level overlays appended by the ElevenLabs SDK                    */
body > div[class*="eleven"],
body > div[id*="eleven"],
body > div[class*="convai"],
body > div[id*="convai"] {
  z-index: 999999 !important;
  position: fixed !important;
}
```

**Step 2: Add pointer-events: none**

Replace that entire block with:

```css
/* Body-level overlays appended by the ElevenLabs SDK.
   These are often transparent backdrops — force pointer-events: none so
   they never block clicks on underlying UI.
   The interactive convai element is handled via its own rule above.     */
body > div[class*="eleven"],
body > div[id*="eleven"],
body > div[class*="convai"],
body > div[id*="convai"] {
  z-index: 999999 !important;
  position: fixed !important;
  pointer-events: none !important;
}
```

**Step 3: Verify the surrounding ElevenLabs CSS rules still make sense**

The `elevenlabs-convai` element itself (the interactive web component, NOT body-level divs) is governed by a separate rule above this block:

```css
elevenlabs-convai {
  position: relative;
  z-index: 99999 !important;
  overflow: visible !important;
}
```

That rule does NOT set `pointer-events: none`, which is correct — the web component itself must remain interactive. Confirm those two rules are distinct and not merged.

**Step 4: Run the full test suite**

```bash
npm run test
```

Expected: all tests pass (no CSS tests exist for this, but no regressions).

**Step 5: Commit**

```bash
git add src/index.css
git commit -m "fix(BUG-23): pointer-events none on ElevenLabs body overlay rule to prevent full-screen click blocking"
```

---

### Task 2: Portal the ElevenLabs convai element to document.body

The `<elevenlabs-convai>` web component is currently rendered inside a `motion.div` that applies CSS `transform` (from scale/y animation). Any CSS `transform` on an ancestor makes that ancestor the **containing block** for `position: fixed` children — including any fixed popups the web component creates in its Shadow DOM. These popups then render relative to the 320 px panel, not the viewport, causing them to appear off-screen or at wrong coordinates.

Fix: use `ReactDOM.createPortal` to render `<elevenlabs-convai>` directly under `document.body`, outside any transform/filter ancestor. The portal element is positioned fixed at the same bottom-right location as the panel.

**Files:**
- Modify: `src/components/AgentFloatingWidget.tsx`

**Step 1: Add ReactDOM import**

At the top of `AgentFloatingWidget.tsx`, add:

```typescript
import { createPortal } from 'react-dom';
```

**Step 2: Extract the ElevenLabs portal into a separate component**

Add this below the imports, before `AgentFloatingWidget`:

```typescript
// ── ElevenLabs portal — rendered at document.body level to escape all
// transform/backdrop-filter ancestors that would trap Shadow DOM popups.
function ElevenLabsPortal({
  agentId,
  userId,
  sunSign,
  zodiacAnimal,
  dominantEl,
}: {
  agentId: string;
  userId: string;
  sunSign: string;
  zodiacAnimal: string;
  dominantEl: string;
}) {
  return createPortal(
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        right: 0,
        zIndex: 99999,
        pointerEvents: 'none',         // the web component sets its own pointer-events
      }}
    >
      <div style={{ pointerEvents: 'auto' }}>
        <elevenlabs-convai
          agent-id={agentId}
          dynamic-variables={JSON.stringify({
            user_id: userId,
            chart_context: `${sunSign} / ${zodiacAnimal} / ${dominantEl}`,
          })}
        />
      </div>
    </div>,
    document.body,
  );
}
```

**Step 3: Remove the inline elevenlabs-convai from the expanded panel body**

Inside `AgentFloatingWidget`, in the expanded panel body (around line 176–187), find and remove:

```tsx
{/* ElevenLabs widget — single instance, high z-index for mobile */}
{isPremium && isActive && elevenLabsAgentId && (
  <div className="w-full flex justify-center mt-2 relative z-[99999]">
    <elevenlabs-convai
      agent-id={elevenLabsAgentId}
      dynamic-variables={JSON.stringify({
        user_id: userId,
        chart_context: `${sunSign} / ${zodiacAnimal} / ${dominantEl}`,
      })}
    />
  </div>
)}
```

**Step 4: Render the portal alongside the widget (inside AgentFloatingWidget return)**

At the very end of the `AgentFloatingWidget` return, after the closing `</div>` (the outer fixed container), add the portal:

```tsx
    </div>  {/* ← this closes the outer fixed div */}

    {/* ElevenLabs widget portalled to document.body to escape transform containing-block */}
    {isPremium && isActive && elevenLabsAgentId && (
      <ElevenLabsPortal
        agentId={elevenLabsAgentId}
        userId={userId}
        sunSign={sunSign}
        zodiacAnimal={zodiacAnimal}
        dominantEl={dominantEl}
      />
    )}
  </>   {/* wrap the whole return in a fragment */}
```

**Important**: the `AgentFloatingWidget` return now needs a React Fragment to return two top-level elements. Wrap the entire return in `<>...</>`.

Full structure of the return after edit:

```tsx
return (
  <>
    <div
      className="fixed z-[99999] transition-all duration-300 ease-out"
      style={{ bottom: widgetExpanded ? '88px' : '80px', right: '16px' }}
      // NOTE: bottom value updated in Task 3
    >
      <AnimatePresence mode="wait">
        {widgetExpanded ? (
          <motion.div key="expanded" ...>
            {/* header + body WITHOUT elevenlabs-convai */}
          </motion.div>
        ) : (
          <motion.button key="minimised" ...>
            {/* pill */}
          </motion.button>
        )}
      </AnimatePresence>
    </div>

    {isPremium && isActive && elevenLabsAgentId && (
      <ElevenLabsPortal
        agentId={elevenLabsAgentId}
        userId={userId}
        sunSign={sunSign}
        zodiacAnimal={zodiacAnimal}
        dominantEl={dominantEl}
      />
    )}
  </>
);
```

**Step 5: Remove backdropFilter from the expanded panel when NOT active**

The line at approximately line 101:
```typescript
...(isActive ? {} : { backdropFilter: 'blur(24px)' }),
```

Change to always disable backdropFilter (since the ElevenLabs widget is now portalled, the stacking context trap is gone, but keeping backdropFilter still creates a stacking context that traps other positioned children unnecessarily):

```typescript
// backdropFilter intentionally removed: it creates a stacking context that
// traps z-indices. Background opacity in the gradient above is sufficient.
```

So the entire `style` object on the expanded `motion.div` becomes:

```typescript
style={{
  borderColor: `${agent.accentColor}33`,
  background:
    'linear-gradient(180deg, rgba(15,12,8,0.95) 0%, rgba(25,20,12,0.97) 100%)',
}}
```

**Step 6: Add TypeScript declaration for elevenlabs-convai JSX element (if not already present)**

Check if `src/types/elevenlabs.d.ts` or similar exists. If not, check `src/vite-env.d.ts`. If there is no JSX declaration for `elevenlabs-convai`, add to `src/types/elevenlabs.d.ts` (create if needed):

```typescript
// Extends JSX IntrinsicElements for the ElevenLabs web component
declare namespace JSX {
  interface IntrinsicElements {
    'elevenlabs-convai': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        'agent-id'?: string;
        'dynamic-variables'?: string;
      },
      HTMLElement
    >;
  }
}
```

**Step 7: Run typecheck**

```bash
npm run lint
```

Expected: no TypeScript errors.

**Step 8: Run tests**

```bash
npm run test
```

Expected: all pass.

**Step 9: Commit**

```bash
git add src/components/AgentFloatingWidget.tsx src/types/
git commit -m "fix(BUG-23): portal elevenlabs-convai to document.body, remove backdropFilter from expanded panel"
```

---

### Task 3: Fix mobile bottom offset — widget must clear the bottom nav

The bottom nav is `fixed bottom-0 h-16` = 64 px tall. The expanded widget at `bottom: 24px` sits 40 px inside the nav area. Even with higher z-index, this causes visual overlap and may confuse users. Update the offset to clear the nav.

**Files:**
- Modify: `src/components/AgentFloatingWidget.tsx`

**Step 1: Update the bottom position values**

In `AgentFloatingWidget`, find the outer container style:

```typescript
style={{
  bottom: widgetExpanded ? '24px' : '80px',
  right: '16px',
}}
```

Change to:

```typescript
style={{
  // Minimised: 80px clears the 64px nav with 16px breathing room.
  // Expanded: 88px = 64px nav + 24px gap, so the panel is fully above the nav.
  bottom: widgetExpanded ? '88px' : '80px',
  right: '16px',
}}
```

**Step 2: Run tests**

```bash
npm run test
```

Expected: all pass.

**Step 3: Commit**

```bash
git add src/components/AgentFloatingWidget.tsx
git commit -m "fix(BUG-23): raise expanded widget bottom offset to 88px so it clears the 64px mobile nav"
```

---

### Task 4: Clean up stale ElevenLabs CSS rules that no longer apply

After the portal change, some CSS rules that tried to work around the stacking-context trap are now dead code or misleading. Clean them up to prevent future confusion.

**Files:**
- Modify: `src/index.css`

**Step 1: Remove or update the cosmic-tile has-elevenlabs rule**

Find (approximately lines 784–795):

```css
/* When the widget is active, break its parent cosmic-tile out of any
   stacking context that would otherwise clip/trap the popup. ... */
.cosmic-tile:has(elevenlabs-convai),
div:has([data-agent-widget] elevenlabs-convai) {
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  overflow: visible !important;
  z-index: 99999 !important;
}
```

This selector will never match after the portal change (the convai element is now directly in `document.body`, not inside a `cosmic-tile`). Remove the entire block.

**Step 2: Remove the overly broad elevenlabs-convai * rule**

Find (approximately lines 765–767):

```css
elevenlabs-convai * {
  z-index: 99999 !important;
}
```

This forces z-index on ALL shadow-DOM children, which can interfere with the web component's own internal layout. Remove it. The `elevenlabs-convai` element rule above it (line 759–763) is sufficient.

**Step 3: Run tests**

```bash
npm run test
```

Expected: all pass.

**Step 4: Commit**

```bash
git add src/index.css
git commit -m "refactor(BUG-23): remove stale elevenlabs CSS rules made obsolete by portal approach"
```

---

## Verification

After all 4 tasks, manually verify in the browser:

1. Open the Dashboard as a premium user
2. Scroll to the Agents section — confirm the "Call" buttons are clickable (no transparent overlay blocking them)
3. Click a "Call" button — `AgentFloatingWidget` should expand in the bottom-right, fully above the mobile nav
4. The ElevenLabs convai widget should appear and be interactive
5. On mobile, confirm the expanded panel sits above the bottom nav (gap visible)
6. Open DevTools → Elements → check that `<elevenlabs-convai>` is a direct child of `<body>` (not nested inside `.AgentFloatingWidget`)
7. Open DevTools → Layers panel — confirm the expanded panel's motion.div is NOT a containing block for fixed descendants (no "paint layer" created by transform on it after animation)

```bash
npm run test
npm run lint
```

Expected: all green.

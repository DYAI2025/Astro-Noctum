# Nav Shell Review Fixes — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all 8 issues from the post-batch-1 code review: 2 critical (dead code, missing agent indicator), 4 important (duplication, orphaned divider, no route-close, wrong aria-label), 2 minor (Escape key, mobile overflow).

**Architecture:** Two changes only — `src/App.tsx` (targeted line edits) and a new `src/components/navigation/SettingsMenu.tsx` (extracted from the duplicated desktop+mobile Settings panels). The extraction is the load-bearing step: it deduplicates 80 lines and is the correct location for the divider fix, Escape handler, aria-label, and overflow guard. Close-on-navigate stays in AppShell as a one-liner `useEffect`.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, react-router-dom `useLocation`, Lucide React (`Settings`, `X`, `LogOut`, `ExternalLink`), `usePremium` hook.

---

### Task 1: Remove dead code + restore active agent indicator

**Files:**
- Modify: `src/App.tsx`

Dead functions `AgentNavLink` (lines ~344–360) and `MobileAgentNavButton` (lines ~363–388) are never called after the nav refactor. The `House` icon import is also unused. The Astro-Agents nav button has `navItemClass(false)` hardcoded — it never shows the emerald active indicator.

**Step 1: Remove unused imports from line 23**

Replace:
```ts
import { IconHouse as House, IconSparkles as Sparkles, IconTelescope as TelescopeIcon, IconOrbit as OrbitIcon } from "./components/animated-icons";
```
With (remove `House`):
```ts
import { IconSparkles as Sparkles, IconTelescope as TelescopeIcon, IconOrbit as OrbitIcon } from "./components/animated-icons";
```

**Step 2: Delete the two dead helper functions**

Delete the entire blocks (in one edit, from `// Nav link that opens...` to the closing `}` of `MobileAgentNavButton`):
```
// Nav link that opens the global agent widget
function AgentNavLink(...) { ... }

// Mobile bottom nav voice button — shows active agent state
function MobileAgentNavButton() { ... }
```

**Step 3: Expand useAgent() call inside AppShell and wire active state**

Current line ~410:
```ts
const { setWidgetExpanded } = useAgent();
```
Replace with:
```ts
const { activeAgent, agentStates, setWidgetExpanded } = useAgent();
const agentActive = activeAgent !== null && agentStates[activeAgent]?.active;
```

**Step 4: Update desktop Astro-Agents button (~line 446–453)**

Replace:
```tsx
<button
  onClick={() => setWidgetExpanded(true)}
  className={navItemClass(false)}
  aria-label={t("nav.astroAgents")}
>
  <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
  {t("nav.astroAgents")}
</button>
```
With:
```tsx
<button
  onClick={() => setWidgetExpanded(true)}
  className={navItemClass(agentActive)}
  aria-label={t("nav.astroAgents")}
>
  <span className="relative inline-flex items-center gap-2">
    <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
    {agentActive && (
      <span className="absolute -top-1 -right-2 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
    )}
  </span>
  {t("nav.astroAgents")}
</button>
```

**Step 5: Update mobile Astro-Agents button (~line 665–673)**

Replace:
```tsx
<button
  onClick={() => setWidgetExpanded(true)}
  className={mobileNavItemClass(false)}
  aria-label={t("nav.astroAgents")}
>
  <Sparkles className="w-5 h-5" aria-hidden="true" />
  <span className="text-[9px] uppercase tracking-tight leading-none">{t("nav.astroAgents")}</span>
</button>
```
With:
```tsx
<button
  onClick={() => setWidgetExpanded(true)}
  className={mobileNavItemClass(agentActive)}
  aria-label={t("nav.astroAgents")}
>
  <span className="relative inline-flex">
    <Sparkles className="w-5 h-5" aria-hidden="true" />
    {agentActive && (
      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
    )}
  </span>
  <span className="text-[9px] uppercase tracking-tight leading-none">{t("nav.astroAgents")}</span>
</button>
```

**Step 6: Run TypeScript check**
```bash
npx tsc --noEmit
```
Expected: no output (clean).

**Step 7: Run tests**
```bash
npx vitest run src/__tests__/navigation-variants.test.tsx
```
Expected: 6 passed.

**Step 8: Commit**
```bash
git add src/App.tsx
git commit -m "fix(nav): remove dead AgentNavLink/MobileAgentNavButton; restore active agent indicator"
```

---

### Task 2: Create SettingsMenu component (deduplication + all remaining fixes)

**Files:**
- Create: `src/components/navigation/SettingsMenu.tsx`

This new component receives all Settings-related props and renders the dropdown panel once. Embedding the remaining fixes here is the efficient approach — we fix them as we write the component, not as follow-up patches.

Fixes included:
- **Orphaned divider (Important #4)**: Conditional render via `usePremium()` inside this component
- **Legal close aria-label (Important #6)**: Use `t("legal.closeAriaLabel")`
- **Escape key handler (Minor #7)**: `useEffect` inside this component
- **Mobile overflow guard (Minor #8)**: `max-w-[calc(100vw-2rem)]` on mobile panel

**Step 1: Write the component**

Create `src/components/navigation/SettingsMenu.tsx`:

```tsx
import { useEffect } from "react";
import { LogOut, ExternalLink, X } from "lucide-react";
import { ManageSubscription } from "../ManageSubscription";
import { LEGAL_CONTENT } from "../LegalFooter";
import { usePremium } from "../../hooks/usePremium";

interface SettingsMenuProps {
  /** "desktop" renders dropdown below the button; "mobile" renders above */
  position: "desktop" | "mobile";
  user: { email?: string };
  lang: "de" | "en";
  setLang: (l: "de" | "en") => void;
  planetariumMode: boolean;
  togglePlanetarium: () => void;
  signOut: () => void;
  t: (key: string) => string;
  legalSection: null | "terms" | "privacy";
  onOpenLegal: (s: "terms" | "privacy") => void;
  onClose: () => void;
}

export function SettingsMenu({
  position,
  user,
  lang,
  setLang,
  planetariumMode,
  togglePlanetarium,
  signOut,
  t,
  legalSection,
  onOpenLegal,
  onClose,
}: SettingsMenuProps) {
  const { isPremium } = usePremium();

  // Minor fix #7: Escape key closes the dropdown
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const panelClass =
    position === "desktop"
      ? "absolute right-0 top-full mt-2 w-56 bg-[#00050A]/95 backdrop-blur-xl border border-[#D4AF37]/15 rounded-xl shadow-2xl z-50 py-2"
      : // Minor fix #8: max-w prevents overflow on 320px screens
        "absolute bottom-full right-0 mb-2 w-64 max-w-[calc(100vw-2rem)] bg-[#00050A]/95 backdrop-blur-xl border border-[#D4AF37]/15 rounded-2xl shadow-2xl z-50 py-2";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      <div role="menu" className={panelClass}>
        {/* User profile */}
        <div className="px-4 py-2 border-b border-[#D4AF37]/10 mb-1">
          <p className="text-[9px] uppercase tracking-widest text-[#D4AF37]/40 mb-0.5">
            {t("nav.settingsProfile")}
          </p>
          <p className="text-xs text-white/50 truncate">{user.email}</p>
        </div>

        {/* Language toggle */}
        <div className="px-4 py-2 flex items-center justify-between">
          <span className="text-xs text-white/50">
            {lang === "de" ? "Sprache" : "Language"}
          </span>
          <div className="lang-toggle" role="group" aria-label={lang === "de" ? "Sprachauswahl" : "Language selection"}>
            <button
              className={lang === "de" ? "active" : ""}
              onClick={() => setLang("de")}
              aria-pressed={lang === "de" ? "true" : "false"}
            >
              DE
            </button>
            <button
              className={lang === "en" ? "active" : ""}
              onClick={() => setLang("en")}
              aria-pressed={lang === "en" ? "true" : "false"}
            >
              EN
            </button>
          </div>
        </div>

        {/* Dark / Bright mode */}
        <button
          role="menuitem"
          onClick={() => { togglePlanetarium(); onClose(); }}
          className="w-full px-4 py-2.5 text-left text-sm text-white/60 hover:text-white hover:bg-[#D4AF37]/08 transition-colors flex items-center justify-between"
        >
          <span>
            {planetariumMode ? t("nav.settingsBrightMode") : t("nav.settingsDarkMode")}
          </span>
          <span className="text-[10px] text-[#D4AF37]/40">
            {planetariumMode ? "●" : "○"}
          </span>
        </button>

        {/* Important fix #4: only render subscription section for premium users */}
        {isPremium && (
          <>
            <div className="border-t border-[#D4AF37]/10 my-1" />
            <div className="px-4 py-1">
              <ManageSubscription className="block w-full text-left text-sm text-white/60 hover:text-white py-1.5 transition-colors" />
            </div>
          </>
        )}

        <div className="border-t border-[#D4AF37]/10 my-1" />

        {/* AGB */}
        <button
          role="menuitem"
          onClick={() => { onOpenLegal("terms"); onClose(); }}
          className="w-full px-4 py-2.5 text-left text-sm text-white/60 hover:text-white hover:bg-[#D4AF37]/08 transition-colors"
        >
          {t("nav.settingsAgb")}
        </button>

        {/* Datenschutz */}
        <button
          role="menuitem"
          onClick={() => { onOpenLegal("privacy"); onClose(); }}
          className="w-full px-4 py-2.5 text-left text-sm text-white/60 hover:text-white hover:bg-[#D4AF37]/08 transition-colors"
        >
          {t("nav.settingsPrivacy")}
        </button>

        {/* sky.bazodiac.space */}
        <a
          role="menuitem"
          href="https://sky.bazodiac.space"
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          className="flex items-center justify-between w-full px-4 py-2.5 text-left text-sm text-white/60 hover:text-white hover:bg-[#D4AF37]/08 transition-colors"
        >
          {t("nav.settingsSky")}
          <ExternalLink className="w-3 h-3 text-white/30" aria-hidden="true" />
        </a>

        <div className="border-t border-[#D4AF37]/10 my-1" />

        {/* Logout */}
        <button
          role="menuitem"
          onClick={() => { signOut(); onClose(); }}
          className="w-full px-4 py-2.5 text-left text-sm text-white/60 hover:text-white hover:bg-[#D4AF37]/08 transition-colors flex items-center gap-2"
        >
          <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
          {t("nav.signOut")}
        </button>
      </div>

      {/* Important fix #6: legal modal — aria-label uses translation key */}
      {legalSection && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => onOpenLegal(legalSection)}
          aria-modal="true"
          role="dialog"
        >
          <div
            className="relative max-w-2xl w-full max-h-[80vh] overflow-y-auto rounded-2xl border border-[#D4AF37]/15 bg-[#00050A]/95 backdrop-blur p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h4 className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37]/60 font-semibold">
                {LEGAL_CONTENT[legalSection][lang].title}
              </h4>
              <button
                onClick={() => onOpenLegal(legalSection)}
                className="text-white/30 hover:text-white/60 transition-colors ml-4 shrink-0"
                aria-label={t("legal.closeAriaLabel")}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-white/40 leading-relaxed whitespace-pre-line">
              {LEGAL_CONTENT[legalSection][lang].body}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

> **Note on legal modal placement:** The legal modal is rendered inside `SettingsMenu` so it has access to the lang prop without threading it through AppShell. The `onOpenLegal` callback toggles the section (pass `null` to close): in AppShell, `setLegalSection` already does this correctly.

**Step 2: Export from navigation index**

Modify `src/components/navigation/index.ts`:
```ts
export { NavSidebarA } from "./NavSidebarA";
export { SettingsMenu } from "./SettingsMenu";
```

**Step 3: Run TypeScript check**
```bash
npx tsc --noEmit
```
Expected: no output.

**Step 4: Commit**
```bash
git add src/components/navigation/SettingsMenu.tsx src/components/navigation/index.ts
git commit -m "feat(nav): extract SettingsMenu component — fix divider, escape key, aria-label, overflow"
```

---

### Task 3: Wire SettingsMenu into AppShell + close-on-navigate

**Files:**
- Modify: `src/App.tsx`

Replace the two inline Settings panel blocks (desktop ~lines 518–609, mobile ~lines 707–800) with `<SettingsMenu>`. Add `useEffect` for close-on-navigate. Adjust `legalSection` state and the legal modal out of AppShell's JSX.

**Step 1: Add SettingsMenu import**

Add to the import block at the top of `src/App.tsx`:
```ts
import { SettingsMenu } from "./components/navigation/SettingsMenu";
```

**Step 2: Add close-on-navigate effect inside AppShell function (after existing state declarations)**

After line:
```ts
const [legalSection, setLegalSection] = useState<null | "terms" | "privacy">(null);
```
Add:
```ts
// Important fix #5: close settings + legal on route change
useEffect(() => {
  setSettingsOpen(false);
  setLegalSection(null);
}, [location.pathname]);
```

**Step 3: Replace desktop Settings panel block**

Find the block starting with `{/* Settings dropdown */}` (~line 518) through the closing `</>` (~line 609). Replace with:
```tsx
{settingsOpen && (
  <SettingsMenu
    position="desktop"
    user={user}
    lang={lang}
    setLang={setLang}
    planetariumMode={planetariumMode}
    togglePlanetarium={togglePlanetarium}
    signOut={signOut}
    t={t}
    legalSection={legalSection}
    onOpenLegal={(s) => setLegalSection((prev) => (prev === s ? null : s))}
    onClose={() => setSettingsOpen(false)}
  />
)}
```

**Step 4: Replace mobile Settings panel block**

Find the block starting with `{/* Mobile Settings panel */}` (~line 707) through its closing `</>`. Replace with:
```tsx
{settingsOpen && (
  <SettingsMenu
    position="mobile"
    user={user}
    lang={lang}
    setLang={setLang}
    planetariumMode={planetariumMode}
    togglePlanetarium={togglePlanetarium}
    signOut={signOut}
    t={t}
    legalSection={legalSection}
    onOpenLegal={(s) => setLegalSection((prev) => (prev === s ? null : s))}
    onClose={() => setSettingsOpen(false)}
  />
)}
```

**Step 5: Remove the standalone legal modal block from AppShell**

Delete the entire `{/* ── Legal modal */}` block (~lines 615–644) from AppShell's JSX — it's now rendered inside SettingsMenu.

**Step 6: Remove ManageSubscription and LEGAL_CONTENT imports from App.tsx**

These are now only used in SettingsMenu.tsx. Remove from App.tsx:
```ts
import { ManageSubscription } from "./components/ManageSubscription";
import { LEGAL_CONTENT } from "./components/LegalFooter";
```

Also remove `X` from the lucide import (now only in SettingsMenu):
```ts
// Before:
import { Volume2, VolumeX, Settings, X, LogOut, ExternalLink } from "lucide-react";
// After:
import { Volume2, VolumeX, Settings, LogOut, ExternalLink } from "lucide-react";
```

Wait — `LogOut` and `ExternalLink` are also now only in SettingsMenu. Check which lucide icons remain in App.tsx after removal:
- `Volume2` — audio button (stays in AppShell)
- `VolumeX` — audio button (stays in AppShell)
- `Settings` — the Settings gear button (stays in AppShell)
- `X` — was in legal modal (now removed from AppShell) → remove
- `LogOut` — now in SettingsMenu only → remove
- `ExternalLink` — now in SettingsMenu only → remove

```ts
import { Volume2, VolumeX, Settings } from "lucide-react";
```

**Step 7: Run TypeScript check**
```bash
npx tsc --noEmit
```
Expected: no output (clean).

**Step 8: Run full test suite**
```bash
npm run test
```
Expected: 1045 passed, 1 suite failure (pre-existing tages-energie-helpers env issue — not related).

**Step 9: Commit**
```bash
git add src/App.tsx
git commit -m "refactor(nav): wire SettingsMenu; add close-on-navigate; clean orphaned imports"
```

---

## Verification Checklist

After all tasks complete, manually verify:

- [ ] `npx tsc --noEmit` — clean
- [ ] `npm run test` — 1045 pass
- [ ] Desktop: Astro-Agents button shows emerald dot when an agent session is active
- [ ] Desktop: Settings gear opens dropdown; Escape closes it
- [ ] Desktop: navigating to /signatur while Settings open — dropdown closes automatically
- [ ] Desktop: free user — no orphaned divider between Dark/Bright and AGB
- [ ] Desktop: premium user — Subscription row appears between Dark/Bright and AGB
- [ ] Mobile: Settings panel doesn't overflow left edge on 320px viewport
- [ ] Legal modal close button has correct translated aria-label
- [ ] No `AgentNavLink` or `MobileAgentNavButton` functions in App.tsx

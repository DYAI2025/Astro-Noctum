# Dashboard Flow + Daily Pulse + 3D Signatur + Tagespuls Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Stabilize the Dashboard, surface real-data Daily Pulse + the implemented 3D Signatur, and lay the foundation for the new Tagespuls (aphorism + Rat-der-sechs) architecture without changing astrological formulas, scoring, or payment plumbing.

**Architecture:** Mostly verification + small UX patches over the existing component tree. Two new hotfixes (R3F crash on `/signatur`, Daily-Provider resilience). The Tagespuls neu-architecture (Phase T) is fully scaffolded in `apps/tagespuls_package/` and behind a feature flag — coexists with `useFirstRunDaily` rather than replacing it.

**Tech Stack:** React 19 + Vite + Tailwind v4, react-three-fiber/three.js, Supabase (Postgres + Edge Functions), Express server proxy, Vitest + @testing-library/react.

---

## Reconciliation against the brief — what is already done

The brief was written before the in-flight CTA consolidation work. The current branch state (verified 2026-05-07):

| Brief task | Status in code | Where |
|---|---|---|
| TASK-1.1 isTourStepVisible bug | ✅ **Already fixed** — extracted to `useDashboardTour.ts:117–124` with correct `'done' → false` semantics | `src/hooks/useDashboardTour.ts` |
| TASK-1.2 CTA Inventory | ✅ **Done** in unmerged branch `2026-05-07-dashboard-cta-consolidation` | `docs/upgrade-cta-inventory-2026-05-07.md` |
| TASK-1.3 Single primary CTA | ✅ **Done** in same branch (PremiumGate info-only, AgentSection lock-only, AgentFloatingWidget hidden for free on `/`, nav-locks via hook) | 11 commits `5c3f1fa..a4fd526` |
| TASK-1.4 Checkout error UX + analytics | ✅ **Mostly done** in same branch via `useUpgradeCheckout` hook (6 disambiguated error states, in-flight guard, redirect, 9 analytics events) | `src/hooks/useUpgradeCheckout.ts` |
| TASK-D1 profileIncomplete prop | ✅ Already done | `src/components/dashboard/DailyChartHero.tsx:63–65, 222–224` |
| TASK-D3 delivery-window guard comment | ✅ Already done | `src/hooks/useFirstRunDaily.ts:128–137` |

**Action**: this plan does NOT redo TASK-1.x; it assumes the CTA branch will be merged before execution begins. If the merge is rejected, TASK-1.x re-inclusion is a separate decision. The brief's TASK-1.4 error taxonomy maps onto the hook's existing 6 keys with this correspondence:

| Brief error label | Hook `UpgradeCheckoutError` |
|---|---|
| "Bitte zuerst anmelden." (no user) | `auth_required` |
| "Sitzung abgelaufen." (401) | `auth_required` (same key — server only differentiates via `code: AUTH_REQUIRED` vs `AUTH_INVALID`) |
| "Kein Zugriff." (403) | `already_premium` (server's only 403 path today) |
| "Zahlung derzeit nicht verfügbar." (503) | `stripe_unavailable` |
| "Unerwartete Antwort." (200 no url) | `unknown` |
| "Verbindungsproblem." (network) | `network` |

Acceptable as-is; if the brief's exact label split is required, a follow-up adds 7th error key `auth_expired` distinct from `auth_required`. NOT part of this plan.

---

## New tasks not in the brief (added 2026-05-07 after live investigation)

| ID | Why | Priority |
|---|---|---|
| HOTFIX-A | `/signatur` page crashes hard with R3F error `Cannot set "data-tint"`. ErrorBoundary catches it; user sees "Etwas ist schiefgelaufen" instead of the sphere. **This is the actual root cause for "Signatur kaputt"** — not data flow. | P0 — must ship before Phase 2 |
| HOTFIX-B | `/api/experience/daily` proxies to Gemini, Gemini free-tier returns 429 `RESOURCE_EXHAUSTED` on every call (limit: 0 req/day). Client falls back to deterministic `buildFallbackDaily()` text. Make this provider failure resilient via OpenRouter or 24h cache. | P1 |

---

## Phase 0 — Baseline

**Run before any task. No task starts without baseline.**

```bash
cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum
git status                      # working tree must be clean
git log --oneline -3            # know which branch + commits you're starting from
npx vitest run 2>&1 | tail -5   # full suite must be green
npx tsc --noEmit && echo OK     # tsc must be clean
npm run build 2>&1 | tail -5    # build must succeed
```

Expected baseline: **2280/2280 tests passing**, tsc clean, vite build OK in ~6s.

If any of the three fail before changes — STOP, report the failure, do not proceed. Existing failures must be triaged separately.

---

## HOTFIX-A — R3F data-* removal on `<mesh>` elements

### Task A1: Remove `data-mesh-role` and `data-tint` from R3F nodes in SignatureSphere3D

**Files:**
- Modify: `src/components/signatur-3d/SignatureSphere3D.tsx:373, 390-391, 411`

**Why:** react-three-fiber treats unknown JSX props on `<mesh>` / `<group>` as Three.js property setters. `data-tint="gold"` triggers `Cannot set "data-tint"` in `applyProps` and crashes the entire R3F tree. The data-* attributes were intended as CSS/dev selectors but are non-functional on Three.Object3D.

**Step 1: Write the failing test**

```ts
// src/components/signatur-3d/__tests__/no-r3f-data-attrs.test.tsx
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('SignatureSphere3D — no data-* on R3F nodes (HOTFIX-A)', () => {
  it('SS3D-NO-DATA-001: source has no data-mesh-role attribute', () => {
    const src = readFileSync(resolve(__dirname, '../SignatureSphere3D.tsx'), 'utf8');
    expect(src).not.toMatch(/data-mesh-role/);
  });
  it('SS3D-NO-DATA-002: source has no data-tint attribute', () => {
    const src = readFileSync(resolve(__dirname, '../SignatureSphere3D.tsx'), 'utf8');
    expect(src).not.toMatch(/data-tint/);
  });
});
```

(Source-level guard rather than mounting Canvas — R3F is not testable in jsdom without a heavy WebGL mock, and the bug is purely structural.)

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/components/signatur-3d/__tests__/no-r3f-data-attrs.test.tsx
```

Expected: FAIL with `Expected source not to match /data-mesh-role/` and same for `/data-tint/`.

**Step 3: Remove the data-* props from `SignatureSphere3D.tsx`**

Lines 373, 390, 391, 411 — delete just those JSX attribute lines. The visual output is unchanged (data-* are non-functional on R3F nodes).

If the props were intended to be discoverable in a CSS-based dev tool, replace with `userData={{ meshRole: '<value>', tint: '<value>' }}` — that IS the supported R3F way. For this hotfix, simple removal is enough; userData migration can be a follow-up.

**Step 4: Run tests to verify they pass**

```bash
npx vitest run src/components/signatur-3d/__tests__/no-r3f-data-attrs.test.tsx
npx vitest run    # full suite must stay green (was 2280)
npx tsc --noEmit
```

Expected: 2 + 2280 = 2282/2282 passing, tsc clean.

**Step 5: Live smoke test**

Start dev server (Vite + Express). Open `http://localhost:3000/signatur` in browser. Expected: 3D sphere renders, no "Etwas ist schiefgelaufen" overlay, no R3F errors in console.

```bash
# Browser console — install error trap before navigating then check
# (See docs in this plan's investigation log if you need the harness recipe)
```

**Step 6: Commit**

```bash
git add src/components/signatur-3d/SignatureSphere3D.tsx \
        src/components/signatur-3d/__tests__/no-r3f-data-attrs.test.tsx
git commit -m "$(cat <<'EOF'
fix(signatur-3d): remove data-* props from R3F mesh nodes

R3F's applyProps treats unknown JSX attributes on <mesh>/<group>
as Three.js property setters. `data-tint="gold"` and the three
`data-mesh-role` attributes (lines 373, 390-391, 411 from commit
33a1119) triggered:

  Uncaught Error: R3F: Cannot set "data-tint".
  Ensure it is an object before setting "tint".

ErrorBoundary caught it and the entire /signatur page rendered as
"Etwas ist schiefgelaufen" instead of the Chladni sphere. This is
the actual root cause of "Signatur kaputt" — not the FuFirE 401
fallback.

The data-* attrs were non-functional on R3F nodes (CSS selectors
don't reach Three.Object3D). Removed entirely; if dev-time
discoverability is needed later, userData={{...}} is the R3F-
supported equivalent.

Source-level guard tests prevent re-introduction.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## HOTFIX-B — Daily provider resilience

### Task B1: Server-side OpenRouter fallback when Gemini returns 429 on /api/experience/daily

**Files:**
- Modify: `server.mjs` — find the daily handler block (around line 2568) + the AI router quota path (search for `[ai-router] gemini-direct quota/429`)

**Why:** Gemini free-tier daily limit is 0 req/day for `gemini-2.0-flash`. Currently the AI router falls through to nothing when quota is exhausted — the response cascades into `[experience/daily] Error: 429` and the client uses `buildFallbackDaily()` (deterministic generic German text). User sees the same "Heute fließt deine Energie ruhig..." every day.

The server already has `OPENROUTER_API_KEY` plumbing (env var documented). Wire it as the AI-router's fallback specifically for the daily endpoint when the primary provider returns 429.

**Step 1: Inspect the AI router**

```bash
grep -n "gemini-direct\|openrouter\|ai-router" server.mjs | head -30
```

Identify the quota-fallthrough path. There's likely a `routeAI()` or similar helper that picks the provider.

**Step 2: Write integration tests for the fallback path**

```js
// server/__tests__/experience-daily-fallback.test.mjs
// Mock global.fetch: first call (Gemini) returns 429, second call (OpenRouter) returns valid completion.
// Hit /api/experience/daily with a valid body, assert response is valid (not 429, has fusion.synthesis).
```

(Reuse the test harness pattern in existing `server/__tests__/*.test.mjs`.)

**Step 3: Implement provider fallback**

```js
// In the daily handler (around the AI call):
async function callDailyAi(prompt) {
  try {
    return await callGemini(prompt);
  } catch (err) {
    if (err.status === 429 && process.env.OPENROUTER_API_KEY) {
      console.log('[experience/daily] Gemini 429 → OpenRouter fallback');
      return await callOpenRouter(prompt);
    }
    throw err;
  }
}
```

Adapt to the actual existing AI router shape — don't add a new abstraction layer. If `callOpenRouter()` doesn't exist, this is out of scope and we fall back to step 4 (cache-only).

**Step 4: Add 24h response cache for daily**

```js
// In daily handler — before AI call:
const cacheKey = `daily:${userId}:${targetDate}:${lang}`;
const cached = await getCachedDaily(cacheKey);
if (cached) return res.json(cached);

// After successful AI call:
await setCachedDaily(cacheKey, response, 24 * 3600);
```

The 24h cache is the pragmatic bottom line — even if both providers fail, every user only hits AI once per day per locale. The existing daily endpoint already has a caching helper around line 2600 (`cacheKeyD = ` daily:...) — verify and extend.

**Step 5: Run tests**

```bash
npx vitest run server/__tests__/experience-daily-fallback.test.mjs
npx vitest run    # full suite stable
```

**Step 6: Verify live**

```bash
# Restart Express, hit /api/experience/daily, check logs:
tail -f /tmp/express-dev.log | grep -E "OpenRouter fallback|429|cache hit"
```

**Step 7: Commit**

```bash
git add server.mjs server/__tests__/experience-daily-fallback.test.mjs
git commit -m "$(cat <<'EOF'
fix(experience/daily): OpenRouter fallback + 24h cache when Gemini 429

Gemini free-tier limit (0 req/day) cascaded into the client
fallback every single call. Result: 100% of users see the same
deterministic German text as their "Tagesimpuls" — never a real
horoscope. Two layers:

1. Provider fallback — when Gemini returns 429 and
   OPENROUTER_API_KEY is set, retry once via OpenRouter. Same
   prompt, same response shape. Logs "Gemini 429 → OpenRouter
   fallback" so quota events stay visible.

2. 24h response cache keyed by user+date+locale. Even if both
   providers fail, the user only triggers AI once per day. The
   existing cacheKeyD around server.mjs:2600 is extended to wrap
   the response, not just the prompt input.

Closes the "Tagesimpuls fehlt" symptom from the user-reported
2026-05-07 regression triage.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase D — Daily Pulse Visibility

### Task D2: Fallback-Origin sichtbar machen

**Files:**
- Modify: `src/components/dashboard/DailyChartHero.tsx` (add prop + render)
- Modify: `src/components/Dashboard.tsx` (derive + pass)
- Test: `src/__tests__/daily-chart-hero-fallback-label.test.tsx`

**Why:** When `buildFallbackDaily()` fires (FuFirE/Gemini down), `meta.engine_version` is set to `'v1-local-fallback'` but the user sees the same UI as a real response. They have no way to know the content is generic.

**Step 1: Write the failing test**

```tsx
// src/__tests__/daily-chart-hero-fallback-label.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/src/contexts/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'de' as const, t: (k: string) => k }),
}));

import { DailyChartHero } from '@/src/components/dashboard/DailyChartHero';

const baseProps = {
  loading: false,
  baseCoherence: 60,
  positiveDailyDelta: 0,
  displayedCoherence: 60,
  spaceWeather: { kpIndex: 0, solarPressureScore: 0.18, geomagnetic: 'quiet' as const, solar: 'quiet' as const, ringModulation: 1.0 },
  transitEvents: [],
  dayMode: 'pulse' as const,
  birthSign: 'Aries',
  impulsText: 'Generic fallback text.',
  profileIncomplete: false,
  onCompleteProfile: () => {},
  onOpenDayModal: () => {},
};

describe('DailyChartHero fallback indicator (TASK-D2)', () => {
  it('DCH-FB-001: shows fallback indicator when isFallback=true and impuls is present', () => {
    render(<DailyChartHero {...baseProps} isFallback={true} />);
    expect(screen.getByTestId('fallback-indicator')).toBeInTheDocument();
    expect(screen.getByText(/Heute nicht verfügbar/i)).toBeInTheDocument();
  });
  it('DCH-FB-002: NO indicator when isFallback=false', () => {
    render(<DailyChartHero {...baseProps} isFallback={false} />);
    expect(screen.queryByTestId('fallback-indicator')).not.toBeInTheDocument();
  });
  it('DCH-FB-003: NO indicator when isFallback=true but impulsText empty (profile-incomplete already shows different state)', () => {
    render(<DailyChartHero {...baseProps} isFallback={true} impulsText={undefined} profileIncomplete={true} />);
    expect(screen.queryByTestId('fallback-indicator')).not.toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/__tests__/daily-chart-hero-fallback-label.test.tsx
```

Expected: FAIL — prop `isFallback` doesn't exist yet.

**Step 3: Add the prop and render in DailyChartHero**

```tsx
// src/components/dashboard/DailyChartHero.tsx
// In Props interface, add:
isFallback?: boolean;

// In the component params destructure:
isFallback = false,

// In Section D (after the impulsText paragraph):
{isFallback && hasImpuls && (
  <p
    className="text-[9px] text-center mt-2"
    style={{ color: 'var(--tile-text-secondary)', opacity: 0.4 }}
    data-testid="fallback-indicator"
  >
    {isDe ? '↻ Heute nicht verfügbar — generischer Inhalt' : '↻ Unavailable today — generic content'}
  </p>
)}
```

**Step 4: Pass `isFallback` from Dashboard.tsx**

```tsx
// src/components/Dashboard.tsx — at the DailyChartHero mount (around line 376)
isFallback={dailyData?.meta?.engine_version === 'v1-local-fallback'}
```

**Step 5: Verify**

```bash
npx vitest run src/__tests__/daily-chart-hero-fallback-label.test.tsx
npx vitest run    # full suite stable
npx tsc --noEmit
```

**Step 6: Commit**

```bash
git add src/components/dashboard/DailyChartHero.tsx \
        src/components/Dashboard.tsx \
        src/__tests__/daily-chart-hero-fallback-label.test.tsx
git commit -m "$(cat <<'EOF'
feat(dashboard): visible fallback indicator on DailyChartHero (TASK-D2)

When buildFallbackDaily() fires due to FuFirE/Gemini outage, the
client used to render the generic deterministic text as if it were
the real horoscope. New optional `isFallback` prop on
DailyChartHero renders a 9px-opacity-40% line under the impuls
paragraph: "↻ Heute nicht verfügbar — generischer Inhalt"
(DE) / "↻ Unavailable today — generic content" (EN).

Dashboard.tsx derives the flag from
`dailyData?.meta?.engine_version === 'v1-local-fallback'`. Real API
response → no label. Profile-incomplete → no label (different state
already handled).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task D4: Verify "vertiefen →" path with fallback data

**Files:**
- Modify: `src/components/Dashboard.tsx` (comment only)

**Why:** Verify there's no codepath where `dailyData !== null` (fallback fired) but `onOpenDayModal` is omitted. Brief notes the current `dailyEnabled` guard is independent of `dailyData` — confirm and document.

**Step 1: Read the current callsite**

```bash
grep -n "onOpenDayModal\|dailyEnabled" src/components/Dashboard.tsx | head -5
```

Expected: `onOpenDayModal={dailyEnabled ? () => setIsDayModalOpen(true) : undefined}` — gated only on the feature flag.

**Step 2: Add documentation comment above that line**

```tsx
// onOpenDayModal is intentionally passed regardless of dailyData
// presence. Fallback data is a valid basis for opening the detail
// modal; the modal itself handles fallback-aware rendering.
onOpenDayModal={dailyEnabled ? () => setIsDayModalOpen(true) : undefined}
```

**Step 3: Verify** — `tsc --noEmit` clean. No test needed; this is purely documentation.

**Step 4: Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "docs(dashboard): document vertiefen-button is fallback-agnostic (TASK-D4)"
```

---

## Phase 2 — 3D Signatur Sichtbarkeit

### Task 2.1: Verify chladniParams pipeline + Wu-Xing DE/EN drift risk

**Files:**
- Read: `src/lib/cymatics/bazi-to-chladni.ts`
- Read: `src/pages/SignaturPage.tsx` (where SignaturRenderer is mounted, line ~325)
- Read: `src/components/signatur-renderer/SignaturRenderer.tsx`
- Output: `docs/2026-05-07-signatur-3d-pipeline-audit.md`

**Why:** The brief reports "User findet die Kugel nicht" — but the live investigation showed the actual cause is the R3F crash (HOTFIX-A). After A1 lands, the secondary question is: does `chladniParams` get computed for typical profiles, or does the page fall back to `<CymaticsFallback/>` (Water default) for everyone?

**Step 1: Inspect the BaZi → Chladni pipeline**

```bash
grep -n "baziToChladni\|computeChladni\|ChladniParams" src/lib/cymatics/bazi-to-chladni.ts | head -10
grep -n "chladniParams" src/pages/SignaturPage.tsx | head -5
```

Read the function signature and what it requires. Check if it depends on `apiData?.bazi?.dominant_element` (English key) vs `dominantes_element` (German key — known DE/EN drift bug).

**Step 2: Live trace via dev server**

```bash
# With dev servers running, open /signatur as the test user
# In browser console:
window.__chladniDebug = (params) => console.log('chladniParams:', JSON.stringify(params));
# Then navigate to /signatur and watch console.
```

Or — read `SignaturPage.tsx` lines around 320 to see how `chladniParams` is computed, and instrument `[chladni]` log lines in `bazi-to-chladni.ts` temporarily for one verification cycle.

**Step 3: Document findings in `docs/2026-05-07-signatur-3d-pipeline-audit.md`**

- What does `baziToChladni()` need? What does it produce when the input has the DE-keyed Wu-Xing dominant element vs EN?
- What % of production users have the prerequisite data? (Check Supabase: `select count(*) from astro_profiles where wuxing_data is not null`)
- If DE/EN drift causes blank `chladniParams` for some users → document the failure rate. Recommend separate fix-track (per the brief's Hinweis #8).

**Step 4: Commit**

```bash
git add docs/2026-05-07-signatur-3d-pipeline-audit.md
git commit -m "docs(signatur-3d): pipeline audit — chladniParams data flow + DE/EN risk"
```

---

### Task 2.2: SignaturAnchorCard on the Dashboard (Option B)

**Files:**
- Create: `src/components/dashboard/SignaturAnchorCard.tsx`
- Create: `src/__tests__/signatur-anchor-card.test.tsx`
- Modify: `src/components/Dashboard.tsx` (mount SignaturAnchorCard in the new hierarchy slot)

**Why:** Anchor card with `<NatalSignaturStatic>` (or equivalent) preview + "Deine Signatur ansehen →" CTA navigating to `/signatur`. NO WebGL on the dashboard yet — performance-safe, hop into `/signatur` only when user wants to engage. Brief's Option A (embedded R3F on dashboard) is deferred until Option B is stable in prod.

**Step 1: Write the failing test**

```tsx
// src/__tests__/signatur-anchor-card.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }));
vi.mock('@/src/contexts/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'de' as const, t: (k: string) => k }),
}));

import { SignaturAnchorCard } from '@/src/components/dashboard/SignaturAnchorCard';

describe('SignaturAnchorCard (TASK-2.2)', () => {
  it('SAC-001: renders preview + CTA', () => {
    render(<SignaturAnchorCard dominantElement="feuer" birthSign="Aries" />);
    expect(screen.getByTestId('signatur-anchor-card')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /signatur ansehen/i })).toBeInTheDocument();
  });
  it('SAC-002: CTA navigates to /signatur', async () => {
    const user = userEvent.setup();
    render(<SignaturAnchorCard dominantElement="feuer" birthSign="Aries" />);
    await user.click(screen.getByRole('button', { name: /signatur ansehen/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/signatur');
  });
  it('SAC-003: empty state when neither prop is provided', () => {
    render(<SignaturAnchorCard />);
    // Render an explanatory empty state, not a broken preview
    expect(screen.getByTestId('signatur-anchor-card')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/__tests__/signatur-anchor-card.test.tsx
```

Expected: FAIL — component doesn't exist.

**Step 3: Implement SignaturAnchorCard**

```tsx
// src/components/dashboard/SignaturAnchorCard.tsx
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/src/contexts/LanguageContext';

interface Props {
  dominantElement?: string;
  birthSign?: string;
}

export function SignaturAnchorCard({ dominantElement, birthSign }: Props) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  return (
    <section
      className="cosmic-tile p-6 rounded-[2rem] flex items-center gap-4"
      data-testid="signatur-anchor-card"
    >
      {/* Static preview placeholder. NatalSignaturStatic if available, else 1-line glyph + element. */}
      <div className="flex-1">
        <p className="text-xs uppercase tracking-[0.2em] text-ink/60">
          {t('signatur.anchor.title') /* "Deine Signatur" */}
        </p>
        <p className="text-xs text-ink/40 mt-1">
          {dominantElement && birthSign
            ? `${birthSign} · ${dominantElement}`
            : t('signatur.anchor.empty') /* "Profil unvollständig" */}
        </p>
      </div>
      <button
        type="button"
        onClick={() => navigate('/signatur')}
        className="text-sm text-gold hover:text-gold/80 transition-colors"
      >
        {t('signatur.anchor.cta') /* "Signatur ansehen →" */}
      </button>
    </section>
  );
}
```

Add the i18n keys to `src/i18n/translations.ts` (DE+EN):

```ts
signatur: {
  // ...existing keys
  anchor: {
    title: /* DE */ 'Deine Signatur' /* EN */ 'Your Signature',
    cta: /* DE */ 'Signatur ansehen →' /* EN */ 'View signature →',
    empty: /* DE */ 'Profil unvollständig' /* EN */ 'Profile incomplete',
  },
},
```

**Step 4: Run tests**

```bash
npx vitest run src/__tests__/signatur-anchor-card.test.tsx
npx vitest run    # full suite stable
npm run check:text-integrity
npx tsc --noEmit
```

**Step 5: Mount in Dashboard.tsx (after DailyChartHero, before AgentSection)**

```tsx
{/* ═══ 1.5 SIGNATUR ANCHOR ══════════════════════════════════════ */}
<motion.div {...fadeIn(0.10)}>
  <SectionErrorBoundary name="SignaturAnchor">
    <SignaturAnchorCard
      dominantElement={apiData?.wuxing?.dominant_element}
      birthSign={apiData?.western?.zodiac_sign}
    />
  </SectionErrorBoundary>
</motion.div>
```

**Step 6: Commit**

```bash
git add src/components/dashboard/SignaturAnchorCard.tsx \
        src/__tests__/signatur-anchor-card.test.tsx \
        src/components/Dashboard.tsx \
        src/i18n/translations.ts
git commit -m "$(cat <<'EOF'
feat(dashboard): SignaturAnchorCard preview + CTA on dashboard (TASK-2.2)

Free + premium users now see a static anchor on the dashboard
linking to /signatur. Performance-safe: no WebGL on dashboard
mount; users opt into the 3D Chladni sphere by tapping the CTA.

Empty state when profile incomplete. Follows the new dashboard
hierarchy:
  1. DailyChartHero
  2. SignaturAnchor          ← NEW (here)
  3. Active Influences       (later in DailyChartHero)
  4. Agents
  5. Bottom upgrade card

Brief Option B (preview + link). Option A (embedded R3F on
dashboard) is deferred until B is stable in prod.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 3 — Dashboard-Informationshierarchie

### Task 3.1: Section ordering — verify against brief target

**Files:**
- Modify (verify only): `src/components/Dashboard.tsx`
- Output: `docs/2026-05-07-dashboard-hierarchy-audit.md`

**Why:** The brief specifies a target hierarchy; verify the post-Phase 2 dashboard matches. After SignaturAnchorCard lands, the order should be:

```
1. DailyChartHero          — was ist heute los
2. SignaturAnchorCard      — wer bin ich (persistent)        [Phase 2]
3. AgentSection            — vertiefen via voice
4. DashboardAstroSection   — Big Four (PremiumGate, info-only)
5. DashboardInterpretationSection  — AI-Synthese (PremiumGate)
6. DashboardTagesEnergie   — Day-Pulse details
7. MagnetsturmKarte        — space weather card
8. DashboardBottomUpgradeCard  — single upgrade CTA (free only)
```

**Step 1: Read current Dashboard JSX top-to-bottom and capture the order**

```bash
grep -nE "^\s*<[A-Z]|^\s*\{!isPremium" src/components/Dashboard.tsx | head -40
```

**Step 2: Document deviations from brief target in `docs/2026-05-07-dashboard-hierarchy-audit.md`**

Identify:
- Sections that are out of order
- Sections that are missing from the brief target
- Sections in the brief target that don't exist in code (skip if dead)

**Step 3: Apply minimal reordering if needed** (no new components, just JSX block reorder)

If the order is mostly right, document and skip code changes. If a clear improvement is identified, apply with one git commit.

**Step 4: Commit**

```bash
git add docs/2026-05-07-dashboard-hierarchy-audit.md src/components/Dashboard.tsx
git commit -m "refactor(dashboard): align section order with target hierarchy (TASK-3.1)"
```

---

### Task 3.2: Retention metric TODOs

**Files:**
- Modify (annotate only): `src/components/Dashboard.tsx`, `src/components/dashboard/DayModeModal.tsx`, `src/components/dashboard/SignaturAnchorCard.tsx`

**Why:** Brief requires `TODO(analytics):` markers at key user-action surfaces so an analytics-focused sprint can wire them up later.

**Step 1: Add TODO comments**

```tsx
// Dashboard.tsx — first dashboard mount
useEffect(() => {
  // TODO(analytics): trackEvent('dashboard_first_interaction') on first user action
}, []);

// DayModeModal.tsx — on open
useEffect(() => {
  if (open) {
    // TODO(analytics): trackEvent('daily_detail_open_rate')
  }
}, [open]);

// SignaturAnchorCard.tsx — on CTA click
onClick={() => {
  // TODO(analytics): trackEvent('signatur_sphere_interaction')
  navigate('/signatur');
}}
```

**Step 2: Verify** — tsc clean.

**Step 3: Commit**

```bash
git add src/components/Dashboard.tsx \
        src/components/dashboard/DayModeModal.tsx \
        src/components/dashboard/SignaturAnchorCard.tsx
git commit -m "chore(analytics): TODO markers for retention metrics (TASK-3.2)"
```

---

## Phase 4 — Daily Chart API Cleanup

### Task 4.1: /api/impact/active contract documentation

**Files:**
- Modify: `src/hooks/useActiveImpacts.ts` (comment only)
- Read: `server.mjs` `/api/impact/active` handler

**Step 1: Inspect server-side handler**

```bash
grep -n "/api/impact/active" server.mjs | head -5
```

Find the handler. Read 30 lines. Determine: does it use `req.body`, or does it resolve the user from `req.userId` (set by `requireUserAuth`)?

**Step 2: Document in the hook**

```ts
// src/hooks/useActiveImpacts.ts — at the fetch call
const res = await authedFetch('/api/impact/active', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  // Contract: server is profile-driven (resolves req.userId from session,
  // loads astro_profiles + computes impacts server-side). Empty body is
  // intentional — see server.mjs:<line>.
  body: '{}',
});
```

**Step 3: Commit**

```bash
git add src/hooks/useActiveImpacts.ts
git commit -m "docs(useActiveImpacts): document /api/impact/active is server-profile-driven (TASK-4.1)"
```

---

### Task 4.2: DailyChartHero data sources — verify single source of truth

**Files:**
- Read: `src/components/dashboard/DailyChartHero.tsx`
- Read: `src/hooks/useActiveImpacts.ts`
- Read: `src/components/Dashboard.tsx`
- Output: `docs/2026-05-07-coherence-data-sources.md`

**Step 1: Trace `baseCoherence`, `positiveDailyDelta`, `displayedCoherence` upstream**

```bash
grep -nE "baseCoherence|positiveDailyDelta|displayedCoherence|impactBaseCoherence|impactPositiveDailyDelta|impactDisplayedCoherence" \
  src/components/Dashboard.tsx src/components/dashboard/DailyChartHero.tsx src/hooks/useActiveImpacts.ts | head -20
```

**Step 2: Document the data flow**

If both `useActiveImpacts` and another hook touch these fields → flag as duplication. If only `useActiveImpacts` is the source → document the contract and pass through Dashboard.

**Step 3: Commit**

```bash
git add docs/2026-05-07-coherence-data-sources.md
git commit -m "docs(daily-chart): document baseCoherence/delta/displayed data flow (TASK-4.2)"
```

---

### Task 4.3: Degraded states visible — Driver-Strip dashes

**Files:**
- Modify: `src/components/dashboard/DailyChartHero.tsx` (Driver Strip block)
- Test: Reuse `daily-chart-hero-fallback-label.test.tsx` or create dedicated

**Step 1: Find the Driver Strip rendering**

```bash
grep -n "Geomagnetic\|Solar pressure\|Transit activity\|driver-strip" src/components/dashboard/DailyChartHero.tsx | head -5
```

**Step 2: Add fallback dashes when value is null/undefined**

```tsx
// Before:
<span>{spaceWeather.kpIndex.toFixed(1)}</span>
// After:
<span>{spaceWeather.kpIndex != null ? spaceWeather.kpIndex.toFixed(1) : '—'}</span>
```

(Apply to all three driver values.)

**Step 3: Test + commit**

```bash
npx vitest run src/__tests__/daily-chart-hero-fallback-label.test.tsx
git add src/components/dashboard/DailyChartHero.tsx
git commit -m "feat(daily-chart): em-dash placeholders when driver values null (TASK-4.3)"
```

---

## Phase 5 — GreenOps

### Task 5.1: Transit-Polling-Frequenz reduzieren

**Files:**
- Modify: `src/hooks/useSignaturSignal.ts`
- Test: `src/__tests__/use-signatur-signal-polling.test.ts`

**Step 1: Read current polling logic**

```bash
grep -n "800\|setInterval\|POLL_INTERVAL\|visibilitychange" src/hooks/useSignaturSignal.ts | head -10
```

**Step 2: Write test for visibility-aware polling**

```ts
// Mock document.visibilityState; assert poll interval is 60000ms when hidden, 15000ms when visible.
// Mock global.fetch + assert request count over a simulated 5-minute window with hidden tab is < 6.
```

**Step 3: Implement visibility-aware polling**

```ts
const POLL_INTERVAL = 15_000;
const HIDDEN_INTERVAL = 60_000;

useEffect(() => {
  let id: number;
  const tick = () => {
    fetchTransitState();
    const interval = document.visibilityState === 'hidden' ? HIDDEN_INTERVAL : POLL_INTERVAL;
    id = window.setTimeout(tick, interval);
  };
  tick();
  const onVis = () => {
    if (document.visibilityState === 'visible') {
      window.clearTimeout(id);
      tick();  // immediate refresh on focus
    }
  };
  document.addEventListener('visibilitychange', onVis);
  return () => {
    window.clearTimeout(id);
    document.removeEventListener('visibilitychange', onVis);
  };
}, [/* deps */]);
```

**Step 4: Test + commit**

```bash
npx vitest run src/__tests__/use-signatur-signal-polling.test.ts
git add src/hooks/useSignaturSignal.ts src/__tests__/use-signatur-signal-polling.test.ts
git commit -m "perf(signatur): visibility-aware polling, 15s active / 60s hidden (TASK-5.1)"
```

---

### Task 5.2: SpaceWeather-Hook deduplizieren

**Files:**
- Modify: `src/components/dashboard/MagnetsturmKarte.tsx` (accept prop instead of calling hook)
- Modify: `src/components/Dashboard.tsx` (pass spaceWeather prop)
- Test: `src/__tests__/magnetsturm-karte-prop-driven.test.tsx`

**Step 1: Test that MagnetsturmKarte accepts spaceWeather as prop**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MagnetsturmKarte } from '@/src/components/dashboard/MagnetsturmKarte';

it('MK-PROP-001: renders from prop, no hook call', () => {
  const sw = { kpIndex: 4, geomagnetic: 'unsettled' as const, /* ... */ };
  render(<MagnetsturmKarte spaceWeather={sw} />);
  expect(screen.getByText(/Kp/)).toBeInTheDocument();
});
```

**Step 2: Refactor MagnetsturmKarte**

```tsx
interface Props { spaceWeather: SpaceWeatherState; }
export function MagnetsturmKarte({ spaceWeather }: Props) {
  // Remove `useSpaceWeather()` call — read from prop instead.
  // ... same render logic ...
}
```

**Step 3: Update Dashboard.tsx mount**

```tsx
const spaceWeather = useSpaceWeather();
// ...
<MagnetsturmKarte spaceWeather={spaceWeather} />
```

**Step 4: Test + commit**

```bash
npx vitest run src/__tests__/magnetsturm-karte-prop-driven.test.tsx
git add src/components/dashboard/MagnetsturmKarte.tsx \
        src/components/Dashboard.tsx \
        src/__tests__/magnetsturm-karte-prop-driven.test.tsx
git commit -m "perf(dashboard): MagnetsturmKarte is prop-driven, single SpaceWeather poller (TASK-5.2)"
```

---

## Phase T — Tagespuls Neu-Architektur

> ⚠️ **Phase T is GATED on TASK-T0.** Currently `aphorisms.json` is empty (0 approved out of 21 markdown files: 16 draft + 5 review). Phase T will not execute until Ben approves ≥15 aphorisms across 3 mode-tags.

### Task T0: Prerequisite Gate — verify aphorisms.json non-empty

**Files:**
- Read: `apps/tagespuls_package/packages/voice/data/aphorisms.json`
- Output: `docs/tagespuls-gate-check.txt`

**Step 1: Run the gate check**

```bash
python3 -c "
import json
d = json.load(open('apps/tagespuls_package/packages/voice/data/aphorisms.json'))
modes = {t for a in d for t in a['mode_tags']}
print(f'{len(d)} aphorisms, modes: {modes}')
assert len(d) >= 15, 'Zu wenig approved aphorisms — Prerequisite nicht erfüllt'
assert {'pulse','trace','spannung'} <= modes or len(d) >= 10, 'Mode-Coverage unvollständig'
print('Gate: OK')
" 2>&1 | tee docs/tagespuls-gate-check.txt
```

**Step 2: Decision branch**

- **Gate PASS** → continue to T1.
- **Gate FAIL** → STOP. Output `docs/tagespuls-gate-check.txt` with exit code, alert PO (Ben). The remaining T1-T7 tasks remain in this plan but are blocked.

**Step 3: Commit gate result**

```bash
git add docs/tagespuls-gate-check.txt
git commit -m "$(cat <<'EOF'
docs(tagespuls): TASK-T0 gate check result

Records the current approval state of the aphorism corpus.
Gate threshold: ≥15 approved across pulse/trace/spannung mode-tags.

Status: <PASS|FAIL>
Approved count: <N>

If FAIL: Phase T (T1-T7) is blocked until PO approval round
flips additional aph-*.md files from `status: draft|review` to
`status: approved`.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task T1: Supabase migration — 6 tables from packages/db/schema.sql

**Files:**
- Create: `supabase-migrations/20260507_tagespuls_tables.sql`
- Reference: `apps/tagespuls_package/packages/db/schema.sql`

**Step 1: Copy schema with adaptations**

Adapt for the live Bazodiac Supabase project:
- Use `auth.users(id)` for `user_id` foreign keys
- Add RLS policies (service_role only — mirrors `ai_quota` lockdown pattern from the recent backend hardening sprint)
- Match column types and constraints exactly

**Step 2: Apply via Supabase MCP or CLI**

```bash
# Option A — Supabase MCP (preferred):
# Use mcp__claude_ai_Supabase__apply_migration with name="tagespuls_tables", query=<contents>

# Option B — CLI:
psql $DATABASE_URL -f supabase-migrations/20260507_tagespuls_tables.sql
```

**Step 3: Verify**

```bash
# Via MCP: mcp__claude_ai_Supabase__list_tables
# Or psql: \d aphorisms; \d daily_pulses; \d daily_interpretations
```

All 6 tables exist with correct columns + RLS enabled.

**Step 4: Update `supabase-schema.sql` to keep schema-file/migration parity**

Per memory `feedback_schema_migration_alignment.md`: both files must describe the same end state.

**Step 5: Commit**

```bash
git add supabase-migrations/20260507_tagespuls_tables.sql supabase-schema.sql
git commit -m "feat(db): tagespuls tables migration (TASK-T1)"
```

---

### Task T2: Aphorismen seed (only after T0 PASS)

**Files:**
- Create: `scripts/seed-aphorisms.mjs` (Node, not Python — keeps it in npm scripts)
- Modify: `package.json` (add `seed:aphorisms` script)

**Step 1: Write the seed script**

```js
// scripts/seed-aphorisms.mjs
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const data = JSON.parse(readFileSync('apps/tagespuls_package/packages/voice/data/aphorisms.json', 'utf8'));
const client = createClient(url, key);

let inserted = 0;
for (const a of data) {
  const { error } = await client.from('aphorisms').upsert({
    id: a.id,
    status: a.status,
    text_de: a.text.de,
    text_en: a.text.en,
    text_original: a.text.original ?? null,
    author: a.source.author,
    work: a.source.work ?? null,
    year: a.source.year ?? null,
    original_language: a.source.original_language,
    translator_de: a.source.translator_de ?? null,
    translator_en: a.source.translator_en ?? null,
    copyright: a.copyright,
    attribution_status: a.attribution_status,
    attribution_note: a.attribution_note ?? null,
    mode_tags: a.mode_tags,
    tone_tags: a.tone_tags ?? [],
    element_affinity: a.element_affinity ?? [],
    figure_affinity: a.figure_affinity ?? [],
    season_affinity: a.season_affinity ?? [],
    word_count_de: a.word_count_de,
    word_count_en: a.word_count_en,
    quality_rating: a.quality_rating,
    cooldown_days: a.cooldown_days ?? 30,
  });
  if (error) {
    console.error(`Failed to seed ${a.id}:`, error.message);
  } else {
    inserted++;
  }
}
console.log(`Seeded ${inserted}/${data.length} aphorisms`);
```

**Step 2: Add npm script**

```json
"seed:aphorisms": "node --env-file=.env scripts/seed-aphorisms.mjs"
```

**Step 3: Run**

```bash
npm run seed:aphorisms
# Expected: "Seeded N/N aphorisms" where N >= 15
```

**Step 4: Verify in Supabase**

```sql
SELECT count(*) FROM aphorisms WHERE status = 'approved';
-- Expected: >= 15
```

**Step 5: Commit**

```bash
git add scripts/seed-aphorisms.mjs package.json
git commit -m "feat(seed): aphorisms seed script (TASK-T2)"
```

---

### Task T3: Express route /api/daily-pulse (preferred over Edge Function)

> **Architecture decision deviation from brief**: The brief specifies Supabase Edge Functions. The existing Bazodiac architecture uses an Express server (`server.mjs`) for ALL API routes — daily, transit-state, agent, checkout. Adding Edge Functions would introduce a new deployment surface, new auth boundary, new env-var management. Use Express to match existing pattern. Document this deviation in `2-design/decisions/DEC-tagespuls-on-express.md`.

**Files:**
- Create: `2-design/decisions/DEC-tagespuls-on-express.md`
- Modify: `server.mjs` (add `/api/daily-pulse` route)
- Test: `server/__tests__/daily-pulse-route.test.mjs`

**Step 1: Document the architecture decision**

Decision: keep Tagespuls on Express, not Edge Functions. Rationale: existing daily/transit/checkout routes are all on Express; introducing Edge Functions duplicates auth, deployment, observability. Edge Functions can be migration target after the feature stabilizes.

**Step 2: Write integration test**

```js
// server/__tests__/daily-pulse-route.test.mjs
// Mock Supabase + Gemini, hit GET /api/daily-pulse?date=2026-05-07&locale=de with valid JWT
// Assert response shape: { id, date, mode, intensity, aphorism, slot_1, slot_2, slot_3, council, weather_stale }
// Determinism: same userId+date+locale → same aphorism.id
```

**Step 3: Implement the route**

```js
// server.mjs
app.get('/api/daily-pulse', requireUserAuth, async (req, res) => {
  const userId = req.userId;
  const { date = new Date().toISOString().slice(0, 10), locale = 'de' } = req.query;

  // 1. Load user_astro_profiles row (or fall back to astro_profiles for now)
  // 2. Load cosmic_weather_snapshots for date (or latest stale)
  // 3. Compute harmony_index via dot-product (port from packages/voice/src/tagespuls.ts)
  // 4. Compute mode + intensity via dayModeFromHarmony()
  // 5. Load approved aphorisms filtered by mode_tags + cooldown
  // 6. Run selectAphorism() — top-5 by quality_rating, hash(userId+date+mode) % 5
  // 7. Generate slot_2 + slot_3 via Gemini (with OpenRouter fallback from HOTFIX-B)
  // 8. Upsert daily_pulses row
  // 9. Return response

  // Error handling per brief: 422 if no profile, fallback aphorism if pool empty, retry-once on LLM error.
});
```

Use `@bazodiac/shared` to import `selectAphorism` and `dayModeFromHarmony` from `apps/tagespuls_package/packages/voice/src/tagespuls.ts`. If that package isn't a workspace package, copy the two pure functions into `src/lib/daily-pulse/` and import there. Don't reinvent.

**Step 4: Run tests + commit**

```bash
npx vitest run server/__tests__/daily-pulse-route.test.mjs
git add server.mjs server/__tests__/daily-pulse-route.test.mjs \
        2-design/decisions/DEC-tagespuls-on-express.md
git commit -m "feat(api): /api/daily-pulse route (TASK-T3)"
```

---

### Task T4: Express route /api/daily-interpretation

**Files:**
- Modify: `server.mjs`
- Test: `server/__tests__/daily-interpretation-route.test.mjs`

Mirror T3 structure for POST `/api/daily-interpretation`. Validate `selected_archetype_key` against the 6 council enum. LLM call uses `day-pulse-trace` skill content as system prompt. Cache by `(daily_pulse_id, selected_archetype_key, locale)` — same combo returns existing row, no re-LLM.

**Commit message:** `feat(api): /api/daily-interpretation route (TASK-T4)`

---

### Task T5: useDailyPulse client hook

**Files:**
- Create: `src/hooks/useDailyPulse.ts`
- Test: `src/__tests__/use-daily-pulse.test.ts`

Mirror the contract from the brief. `useDailyPulse(userId, birthData, locale)` returns `{ pulse, council, interpretation, loading, loadingInterpretation, isFallback, selectCouncilFigure }`. Cache in `localStorage` by `daily_pulse_cache:${date}:${locale}`. `birthData === null` → `pulse: null` immediately.

**Test cases:**
- DP-001: birthData null → pulse null, no fetch
- DP-002: happy path → fetches GET /api/daily-pulse, returns pulse + council
- DP-003: API 500 → isFallback true, fallback pulse
- DP-004: cache hit → no fetch
- DP-005: selectCouncilFigure → POSTs /api/daily-interpretation, returns text
- DP-006: same figure twice → uses cached interpretation

**Commit message:** `feat(client): useDailyPulse hook (TASK-T5)`

---

### Task T6: TagespulsCard component

**Files:**
- Create: `src/components/dashboard/TagespulsCard.tsx`
- Test: `src/__tests__/tagespuls-card.test.tsx`

Two-phase card per brief:

**Phase 1** (initial mount):
- Mode chip (PULS/SPUR/SPANNUNG)
- Aphorism (slot_1) + author
- slot_2 (Brücke ins Heute)
- slot_3 (Handlungsimpuls)
- "Wer begleitet dich heute?" + 6 council buttons (Sun/Moon/Asc/DayMaster/YearAnimal/WuXing)

**Phase 2** (after figure tap):
- Selected figure name + glyph
- interpretation.text
- "Andere Figur wählen →" back-button

**Loading state:** skeleton placeholders (no empty card).
**Empty state (no profile):** Profile-CTA (mirror DailyChartHero).
**Fallback state:** label per TASK-D2 pattern.

**Test cases:** 10+ across phases, states, council selection, loading.

**Commit message:** `feat(dashboard): TagespulsCard component (TASK-T6)`

---

### Task T7: Dashboard wiring + feature flag

**Files:**
- Modify: `src/lib/feature-flags.ts` (add `tagespuls_neu_v1: false`)
- Modify: `src/components/Dashboard.tsx` (mount conditional on flag)
- Test: `src/__tests__/dashboard-tagespuls-flag.test.tsx`

**Step 1: Add flag**

```ts
// src/lib/feature-flags.ts
const FLAGS = {
  // ...existing
  tagespuls_neu_v1: false,  // gate for the new aphorism-based card; co-exists with DailyChartHero
};
```

**Step 2: Mount in Dashboard with flag check**

```tsx
const tagespulsNeuEnabled = isFeatureEnabled('tagespuls_neu_v1');
const tagespuls = useDailyPulse(userId, profileMeta.birthInput, lang === 'en' ? 'en' : 'de');

{/* Position: BEFORE DailyChartHero per brief — Tagespuls frames the day, DailyChartHero adds depth */}
{tagespulsNeuEnabled && (
  <SectionErrorBoundary name="TagespulsCard">
    <TagespulsCard
      pulse={tagespuls.pulse}
      council={tagespuls.council}
      interpretation={tagespuls.interpretation}
      loading={tagespuls.loading}
      isFallback={tagespuls.isFallback}
      onSelectFigure={tagespuls.selectCouncilFigure}
      locale={lang === 'en' ? 'en' : 'de'}
    />
  </SectionErrorBoundary>
)}
```

**Step 3: Test the flag gate**

```tsx
it('TPF-001: TagespulsCard hidden when flag off (default)', () => { /* */ });
it('TPF-002: TagespulsCard visible when flag on', () => { /* mock localStorage override */ });
```

**Step 4: Commit**

```bash
git add src/lib/feature-flags.ts src/components/Dashboard.tsx \
        src/__tests__/dashboard-tagespuls-flag.test.tsx
git commit -m "feat(dashboard): mount TagespulsCard behind tagespuls_neu_v1 flag (TASK-T7)"
```

---

## PR plan + acceptance criteria

This plan ships as **3 PRs**. The CTA consolidation branch (`2026-05-07-dashboard-cta-consolidation`, 12 commits) is independent and can land first.

### PR 1 — Hotfixes + Phase D + Phase 4 (today, 4-6h)

Branch: `2026-05-07-dashboard-stability-hotfixes`. Pre-req: CTA consolidation merged.

- [ ] HOTFIX-A: R3F data-* removed; `/signatur` no longer crashes
- [ ] HOTFIX-B: OpenRouter fallback wired + 24h cache; user sees real horoscope when Gemini OK, fresh fallback only when both fail
- [ ] TASK-D2: Fallback indicator visible
- [ ] TASK-D4: Documentation comment on vertiefen-button
- [ ] TASK-4.1/4.2/4.3: API contract documented + degraded states visible

Acceptance:
- [ ] `tsc --noEmit` clean
- [ ] `npm run build` succeeds
- [ ] `/signatur` loads without ErrorBoundary catch (manual smoke)
- [ ] Real Gemini call → no fallback indicator on `/`
- [ ] Mock Gemini outage → fallback indicator visible

### PR 2 — Phase 2 + Phase 3 + Phase 5 (this week, 4-8h)

Branch: `2026-05-07-dashboard-3d-anchor`. Pre-req: PR 1 merged.

- [ ] TASK-2.1: Pipeline audit doc
- [ ] TASK-2.2: SignaturAnchorCard mounted on dashboard
- [ ] TASK-3.1: Section ordering audit + minimal reorder
- [ ] TASK-3.2: Retention TODO markers
- [ ] TASK-5.1: Visibility-aware polling
- [ ] TASK-5.2: SpaceWeather hook deduplication

Acceptance:
- [ ] `/signatur` reachable from dashboard via SignaturAnchorCard
- [ ] Network tab: 1 SpaceWeather poller (was 2)
- [ ] Network tab: hidden tab → 60s polling (was 800ms / 15s)
- [ ] `tsc --noEmit` clean

### PR 3 — Phase T (gated) (timeline TBD — depends on PO approval cycle)

Branch: `2026-05-07-tagespuls-architecture`. Pre-req: TASK-T0 PASS.

- [ ] T0 gate: ≥15 approved aphorisms with 3-mode coverage
- [ ] T1: tables migrated, schema parity preserved
- [ ] T2: aphorisms seeded
- [ ] T3: /api/daily-pulse returns valid response
- [ ] T4: /api/daily-interpretation idempotent per (pulse_id, archetype_key, locale)
- [ ] T5: useDailyPulse handles all 6 test cases
- [ ] T6: TagespulsCard renders both phases + loading/empty/fallback
- [ ] T7: feature flag gates the card; default off

Acceptance:
- [ ] With `tagespuls_neu_v1` localStorage override → TagespulsCard appears above DailyChartHero
- [ ] Council figure tap → Phase 2 visible
- [ ] Cache: same user same date → no second AI call
- [ ] `tsc --noEmit` clean

---

## Done-when checklist

- [ ] PR 1 merged: dashboard stable, /signatur loads, Tagesimpuls is real
- [ ] PR 2 merged: 3D anchor on dashboard, polling clean
- [ ] PR 3 merged: Tagespuls architecture live behind flag (when T0 passes)
- [ ] CHANGELOG entries for each PR
- [ ] `npm test`, `npm run lint`, `npm run build` all green at every PR boundary

## Out of scope (deliberate)

- Wu-Xing DE/EN drift fix in `bazi-to-chladni.ts` — separate fix-track per brief Hinweis #8
- Replacing `/api/experience/daily` with `/api/daily-pulse` — both coexist this sprint per Hinweis #10
- Migrating Phase T to Supabase Edge Functions — keep on Express; future migration target documented in DEC-tagespuls-on-express
- Aphorism approval round itself — that's a PO content task, not a code task
- Stripe rebuild revisions — already shipped 2026-05-07
- Astrological formulas, scoring, ephemeris — explicitly forbidden by brief

---

## References

- Brief: this user message (chat invocation, 2026-05-07)
- CTA consolidation branch: `2026-05-07-dashboard-cta-consolidation` (12 commits, pushed, awaiting merge to main)
- Tagespuls package: `apps/tagespuls_package/` — schema.sql, openapi.yaml, voice/src/tagespuls.ts, 21 review markdowns
- Live investigation log (today): R3F data-tint crash, FuFirE 401, Gemini 429, aphorism count 0/16/5
- Existing main app: `src/lib/daily-pulse/` — aphorism-select.ts, aphorism-to-wire.ts, council.ts, mode.ts (TS port already in place)
- Memory: `feedback_schema_migration_alignment.md` — supabase-schema.sql + supabase-migrations/ must agree on end state

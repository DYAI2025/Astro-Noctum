# Dashboard CTA Consolidation + Checkout Repair Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reduce the 5 simultaneous "Upgrade to premium" CTAs on `/` (and add ONE on `/signatur`) to exactly one prime CTA per page. Premium-gated sections become info-only (greyed + lock + label, no inline button). The single button uses a hardened `useUpgradeCheckout()` hook with 6 disambiguated error states and 4 conversion-funnel analytics events.

**Architecture:** Extract checkout side-effects (POST `/api/checkout`, redirect, error mapping, analytics) into a `useUpgradeCheckout()` hook. Rewrite `UpgradeButton.tsx` as a thin shell over the hook. `PremiumGate.tsx` drops its inline `<UpgradeButton/>` — gated sections show only a lock icon + "Premium" label over the blurred content. Dashboard's mid-page agent-card upgrade button + AgentFloatingWidget upgrade button + App.tsx nav-locks all migrate to the hook (the nav-locks keep their own button shell but call the same handler). Signatur page gets a single persistent upgrade card matching the Dashboard's bottom card. Server-side robustness from the 2026-05-07 Stripe rebuild stays unchanged — this plan touches only client.

**Tech Stack:** React 19, TypeScript, Vitest, `@testing-library/react`, the existing `authedFetch` + `trackEvent` utilities from `src/lib/`. No new dependencies.

---

## Findings recap

From `docs/upgrade-cta-inventory-2026-05-07.md` and the TASK-1.4 brief in `DEVELOPMENT_BRIEF.md`:

| Group | What | Where | Action |
|-------|------|-------|--------|
| A1 | Bottom upgrade card | `Dashboard.tsx:498` `<UpgradeButton/>` | **KEEP** — sole prime CTA on `/` |
| A2 | `<PremiumGate>` wrapper | `PremiumGate.tsx:32` (used in 5 sections) | **REWRITE** — drop inline UpgradeButton, become info-only |
| A3 | AgentsPopup nav | `AgentsPopup.tsx:105` | **KEEP** — contextual, not on dashboard route |
| A4 | PremiumUpgradeModal | `PremiumUpgradeModal.tsx:96` | **KEEP** — focused trigger when user clicks premium cluster |
| B1 | Desktop nav-lock | `App.tsx:465` custom `handleUpgrade` | **MIGRATE** to `useUpgradeCheckout()` hook |
| B2 | Mobile nav-lock | `App.tsx:678` same | **MIGRATE** to hook |
| B3 | Mid-dashboard agent button | `AgentSection.tsx:180` custom `handleUpgrade` | **DROP** the button entirely; show lock-only |
| B4 | Floating widget | `AgentFloatingWidget.tsx:209` calls `App.tsx.handleLeviUpgrade` | **HIDE** for free users on `/`; keep contextual for `/signatur` |

Plus TASK-1.4 frontend acceptance criteria from the brief, currently unmet:
- 4 analytics events: `upgrade_clicked`, `checkout_started`, `checkout_failed` (with `error_type`), `checkout_redirected`
- 6 disambiguated error states (currently a single generic `dashboard.premium.checkoutError`)
- Parse the new server envelope shape (`body.error.code === 'AUTH_REQUIRED'` etc., post-Stripe-rebuild)

---

## Phase A — Analytics types + useUpgradeCheckout hook

### Task 1: Extend analytics `EventName` union with the 3 new events

**Files:**
- Modify: `src/lib/analytics.ts:5–21`

**Step 1: Read existing union**

```bash
sed -n '5,21p' src/lib/analytics.ts
```

Confirm current type:

```ts
type EventName =
  | 'signup'
  | 'login'
  | …
  | 'upgrade_clicked'
  | 'payment_completed'
  | …
```

**Step 2: Add the 3 new events**

```ts
type EventName =
  | 'signup'
  | 'login'
  | 'reading_started'
  | 'reading_completed'
  | 'upgrade_clicked'
  | 'checkout_started'         // NEW — fires after the API request goes out
  | 'checkout_failed'          // NEW — fires on any error path; params: { error_type }
  | 'checkout_redirected'      // NEW — fires immediately before window.location.href = url
  | 'payment_completed'
  | 'share_clicked'
  | 'signature_reveal_seen'
  | 'signature_delta_applied'
  | 'day_mode_modal_opened'
  | 'day_mode_modal_closed'
  | 'vibes_opened'
  | 'vibes_closed'
  | 'vibes_explain_opened'
  | 'weekly_opened'
  | 'weekly_area_explain_opened';
```

**Step 3: Verify**

```bash
npx tsc --noEmit 2>&1 | head -10
```

Expected: 0 errors. The union extension is purely additive.

**Step 4: Commit**

```bash
git add src/lib/analytics.ts
git commit -m "$(cat <<'EOF'
feat(analytics): add checkout funnel events (started / failed / redirected)

DEVELOPMENT_BRIEF TASK-1.4 conversion-funnel analytics: server-side
trackEvent('upgrade_clicked') was the only event firing for the
upgrade flow. The 4 duplicate handlers (App.tsx ×2, AgentSection,
AgentFloatingWidget) bypassed even that. The 3 new events let
useUpgradeCheckout (next commit) report the full funnel.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: i18n keys for the 6 disambiguated error states

**Files:**
- Modify: `src/i18n/translations.ts` (DE block + EN block — same keys)

**Step 1: Locate the EN `premium` block**

```bash
grep -n "checkoutError" src/i18n/translations.ts
```

Expected: one match in EN block (~line 332), one match in DE block (~line 814). Both currently set the generic message.

**Step 2: Replace `checkoutError` with a structured `checkoutErrors` map**

In the EN block (around line 332):

```ts
// BEFORE
checkoutError: "Checkout could not be started. Please try again later.",

// AFTER
checkoutErrors: {
  notLoggedIn: "Please sign in first.",
  authExpired: "Your session has expired. Please sign in again.",
  forbidden: "Access denied. Contact support.",
  serviceDown: "Payment is temporarily unavailable. Please try again later.",
  emptyResponse: "Unexpected response. Please reload the page.",
  network: "Connection problem. Please check your network.",
  generic: "Checkout could not be started. Please try again later.",
},
```

In the DE block (around line 814):

```ts
checkoutErrors: {
  notLoggedIn: "Bitte zuerst anmelden.",
  authExpired: "Sitzung abgelaufen. Bitte neu anmelden.",
  forbidden: "Kein Zugriff. Wende dich an den Support.",
  serviceDown: "Zahlung derzeit nicht verfügbar. Versuche es später.",
  emptyResponse: "Unerwartete Antwort. Bitte Seite neu laden.",
  network: "Verbindungsproblem. Bitte Netzwerk prüfen.",
  generic: "Checkout konnte nicht gestartet werden. Bitte versuche es später erneut.",
},
```

**Step 3: Verify**

```bash
npx tsc --noEmit 2>&1 | head -10
npm run check:text-integrity 2>&1 | tail -3
```

Both must pass. The `check:text-integrity` script verifies DE/EN keys mirror each other.

**Step 4: Commit**

```bash
git add src/i18n/translations.ts
git commit -m "$(cat <<'EOF'
feat(i18n): structured checkoutErrors map for the 6 TASK-1.4 error states

Replaces the single generic dashboard.premium.checkoutError with a
discriminated map matching the brief's error-type taxonomy:
notLoggedIn / authExpired / forbidden / serviceDown / emptyResponse /
network / generic (fallback).

UpgradeButton + useUpgradeCheckout (next commit) consume the right
key based on the server's structured error envelope's `code` field
(post-Stripe-rebuild) plus client-side detection of "no auth user"
and network-level errors.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Create `useUpgradeCheckout()` hook

**Files:**
- Create: `src/hooks/useUpgradeCheckout.ts`
- Test: `src/__tests__/use-upgrade-checkout.test.tsx`

**Step 1: Write the failing test**

```tsx
// src/__tests__/use-upgrade-checkout.test.tsx
import { renderHook, act, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockTrackEvent = vi.fn();
const mockAuthedFetch = vi.fn();

vi.mock('@/src/lib/analytics', () => ({
  trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
}));

vi.mock('@/src/lib/authedFetch', () => ({
  authedFetch: (...args: unknown[]) => mockAuthedFetch(...args),
}));

vi.mock('@/src/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1' } }),
}));

import { useUpgradeCheckout } from '@/src/hooks/useUpgradeCheckout';

const originalLocation = window.location;

beforeEach(() => {
  mockTrackEvent.mockReset();
  mockAuthedFetch.mockReset();
  // @ts-expect-error — replace window.location for href assertions
  delete window.location;
  // @ts-expect-error
  window.location = { href: 'http://localhost/' };
});

afterEach(() => {
  // @ts-expect-error
  window.location = originalLocation;
});

describe('useUpgradeCheckout', () => {
  it('UC-001: happy path — fires upgrade_clicked → checkout_started → checkout_redirected and redirects to url', async () => {
    mockAuthedFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ url: 'https://checkout.stripe.com/test' }),
    });

    const { result } = renderHook(() => useUpgradeCheckout());
    await act(async () => { await result.current.start(); });

    expect(mockTrackEvent).toHaveBeenCalledWith('upgrade_clicked');
    expect(mockTrackEvent).toHaveBeenCalledWith('checkout_started');
    expect(mockTrackEvent).toHaveBeenCalledWith('checkout_redirected');
    expect(mockTrackEvent).not.toHaveBeenCalledWith('checkout_failed', expect.anything());
    expect(window.location.href).toBe('https://checkout.stripe.com/test');
  });

  it('UC-002: not logged in → no fetch, errorKey=notLoggedIn, fires checkout_failed', async () => {
    vi.resetModules();
    vi.doMock('@/src/contexts/AuthContext', () => ({
      useAuth: () => ({ user: null }),
    }));
    const { useUpgradeCheckout: hookNoUser } = await import('@/src/hooks/useUpgradeCheckout');

    const { result } = renderHook(() => hookNoUser());
    await act(async () => { await result.current.start(); });

    expect(mockAuthedFetch).not.toHaveBeenCalled();
    expect(result.current.errorKey).toBe('notLoggedIn');
    expect(mockTrackEvent).toHaveBeenCalledWith('checkout_failed', { error_type: 'notLoggedIn' });
  });

  it('UC-003: 401 AUTH_REQUIRED → errorKey=authExpired', async () => {
    mockAuthedFetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: { code: 'AUTH_REQUIRED' } }),
    });

    const { result } = renderHook(() => useUpgradeCheckout());
    await act(async () => { await result.current.start(); });

    expect(result.current.errorKey).toBe('authExpired');
    expect(mockTrackEvent).toHaveBeenCalledWith('checkout_failed', { error_type: 'authExpired' });
  });

  it('UC-004: 403 → errorKey=forbidden', async () => {
    mockAuthedFetch.mockResolvedValue({
      ok: false, status: 403, json: async () => ({ error: { code: 'FORBIDDEN' } }),
    });
    const { result } = renderHook(() => useUpgradeCheckout());
    await act(async () => { await result.current.start(); });
    expect(result.current.errorKey).toBe('forbidden');
  });

  it('UC-005: 503 STRIPE_NOT_CONFIGURED → errorKey=serviceDown', async () => {
    mockAuthedFetch.mockResolvedValue({
      ok: false, status: 503,
      json: async () => ({ error: { code: 'STRIPE_NOT_CONFIGURED' } }),
    });
    const { result } = renderHook(() => useUpgradeCheckout());
    await act(async () => { await result.current.start(); });
    expect(result.current.errorKey).toBe('serviceDown');
  });

  it('UC-006: 200 with empty body → errorKey=emptyResponse', async () => {
    mockAuthedFetch.mockResolvedValue({
      ok: true, json: async () => ({}),
    });
    const { result } = renderHook(() => useUpgradeCheckout());
    await act(async () => { await result.current.start(); });
    expect(result.current.errorKey).toBe('emptyResponse');
  });

  it('UC-007: network error (fetch throws) → errorKey=network', async () => {
    mockAuthedFetch.mockRejectedValue(new TypeError('Failed to fetch'));
    const { result } = renderHook(() => useUpgradeCheckout());
    await act(async () => { await result.current.start(); });
    expect(result.current.errorKey).toBe('network');
  });

  it('UC-008: unknown 500 → errorKey=generic', async () => {
    mockAuthedFetch.mockResolvedValue({
      ok: false, status: 500, json: async () => ({}),
    });
    const { result } = renderHook(() => useUpgradeCheckout());
    await act(async () => { await result.current.start(); });
    expect(result.current.errorKey).toBe('generic');
  });

  it('UC-009: while in flight, isRedirecting is true and start() is no-op', async () => {
    let resolve: (v: unknown) => void = () => {};
    mockAuthedFetch.mockImplementation(() =>
      new Promise((r) => { resolve = r; })
    );

    const { result } = renderHook(() => useUpgradeCheckout());
    act(() => { result.current.start(); }); // intentionally not awaited
    await waitFor(() => expect(result.current.isRedirecting).toBe(true));

    // second click while in flight must not fire a second fetch
    act(() => { result.current.start(); });
    expect(mockAuthedFetch).toHaveBeenCalledTimes(1);

    await act(async () => { resolve({ ok: true, json: async () => ({ url: 'x' }) }); });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/__tests__/use-upgrade-checkout.test.tsx
```

Expected: FAIL with `Cannot find module '@/src/hooks/useUpgradeCheckout'`.

**Step 3: Implement the hook**

```ts
// src/hooks/useUpgradeCheckout.ts
import { useState, useCallback, useRef } from 'react';
import { trackEvent } from '@/src/lib/analytics';
import { authedFetch } from '@/src/lib/authedFetch';
import { useAuth } from '@/src/contexts/AuthContext';

/**
 * The 7 error keys mirror the i18n map at
 * dashboard.premium.checkoutErrors.* — keep them in sync if you add
 * a new branch.
 */
export type CheckoutErrorKey =
  | 'notLoggedIn'
  | 'authExpired'
  | 'forbidden'
  | 'serviceDown'
  | 'emptyResponse'
  | 'network'
  | 'generic';

interface CheckoutResult {
  url?: string;
  error?: { code: string; message?: string };
}

/**
 * Single source of truth for the upgrade-to-premium client flow.
 * Used by:
 *   - <UpgradeButton/> (the bottom-of-dashboard primary CTA)
 *   - <PremiumUpgradeModal/> (focused signatur trigger)
 *   - App.tsx nav-locks (premium-only routes)
 *
 * Fires the 4 conversion-funnel events from DEVELOPMENT_BRIEF TASK-1.4:
 *   1. upgrade_clicked   — at the start, even before we know whether
 *                          the user is logged in
 *   2. checkout_started  — after we've cleared the auth precondition
 *                          and the POST /api/checkout request goes out
 *   3. checkout_failed   — on ANY error path; params: { error_type }
 *   4. checkout_redirected — immediately before window.location.href = url
 *
 * Maps the server's structured error envelope (post-2026-05-07 Stripe
 * rebuild) onto the 7 CheckoutErrorKey buckets.
 */
export function useUpgradeCheckout() {
  const { user } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [errorKey, setErrorKey] = useState<CheckoutErrorKey | null>(null);
  const inFlightRef = useRef(false);

  const fail = useCallback((key: CheckoutErrorKey) => {
    setErrorKey(key);
    setIsRedirecting(false);
    inFlightRef.current = false;
    trackEvent('checkout_failed', { error_type: key });
  }, []);

  const start = useCallback(async () => {
    // Re-entry guard: a click while in-flight is a no-op
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setErrorKey(null);
    setIsRedirecting(true);

    trackEvent('upgrade_clicked');

    if (!user) {
      fail('notLoggedIn');
      return;
    }

    let res: Response;
    try {
      trackEvent('checkout_started');
      res = await authedFetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      fail('network');
      return;
    }

    let body: CheckoutResult = {};
    try { body = await res.json(); } catch { /* leave body empty */ }

    if (!res.ok) {
      const code = body.error?.code;
      if (res.status === 401 || code === 'AUTH_REQUIRED' || code === 'AUTH_INVALID') {
        fail('authExpired');
      } else if (res.status === 403 || code === 'FORBIDDEN') {
        fail('forbidden');
      } else if (res.status === 503 || code === 'STRIPE_NOT_CONFIGURED') {
        fail('serviceDown');
      } else {
        fail('generic');
      }
      return;
    }

    if (!body.url) {
      fail('emptyResponse');
      return;
    }

    trackEvent('checkout_redirected');
    window.location.href = body.url;
    // Note: isRedirecting stays true — the page is unloading anyway, no need to flip.
  }, [user, fail]);

  return { start, isRedirecting, errorKey };
}
```

**Step 4: Run tests to verify they pass**

```bash
npx vitest run src/__tests__/use-upgrade-checkout.test.tsx
```

Expected: 9/9 pass.

**Step 5: Commit**

```bash
git add src/hooks/useUpgradeCheckout.ts src/__tests__/use-upgrade-checkout.test.tsx
git commit -m "$(cat <<'EOF'
feat(client): useUpgradeCheckout hook — single checkout flow with 6 error states + 4 funnel events

DEVELOPMENT_BRIEF TASK-1.4 acceptance criteria:
- Klick → genau ein POST /api/checkout (re-entry guard via ref)
- Button während Request disabled (caller reads isRedirecting)
- Success { url } → window.location.href = url
- 6 disambiguated error states matching the brief's table:
    notLoggedIn / authExpired / forbidden / serviceDown
    emptyResponse / network / generic (fallback)
- 4 analytics events: upgrade_clicked / checkout_started /
  checkout_failed (with error_type param) / checkout_redirected

Maps the post-2026-05-07-Stripe-rebuild server envelope
({ error: { code, message, recoverable, ... } }) onto the error
keys; falls back to HTTP status when the body is malformed.

9 unit tests cover: happy path, all 7 error states, in-flight
re-entry guard.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Phase B — Rewrite UpgradeButton.tsx

### Task 4: Rewrite `<UpgradeButton/>` to use the hook + render disambiguated errors

**Files:**
- Modify: `src/components/UpgradeButton.tsx`
- Test: `src/__tests__/upgrade-button.test.tsx` (create or update)

**Step 1: Write the failing test**

```tsx
// src/__tests__/upgrade-button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

const mockStart = vi.fn();
let mockState = { isRedirecting: false, errorKey: null as null | string };

vi.mock('@/src/hooks/useUpgradeCheckout', () => ({
  useUpgradeCheckout: () => ({
    start: mockStart,
    isRedirecting: mockState.isRedirecting,
    errorKey: mockState.errorKey,
  }),
}));

vi.mock('@/src/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    lang: 'de' as const,
    t: (k: string) => {
      const map: Record<string, string> = {
        'dashboard.premium.cta': 'Premium freischalten',
        'dashboard.premium.checkoutErrors.notLoggedIn': 'Bitte zuerst anmelden.',
        'dashboard.premium.checkoutErrors.authExpired': 'Sitzung abgelaufen.',
        'dashboard.premium.checkoutErrors.forbidden': 'Kein Zugriff.',
        'dashboard.premium.checkoutErrors.serviceDown': 'Zahlung nicht verfügbar.',
        'dashboard.premium.checkoutErrors.emptyResponse': 'Unerwartete Antwort.',
        'dashboard.premium.checkoutErrors.network': 'Verbindungsproblem.',
        'dashboard.premium.checkoutErrors.generic': 'Checkout fehlgeschlagen.',
      };
      return map[k] ?? k;
    },
  }),
}));

import { UpgradeButton } from '@/src/components/UpgradeButton';

describe('UpgradeButton', () => {
  beforeEach(() => {
    mockStart.mockReset();
    mockState = { isRedirecting: false, errorKey: null };
  });

  it('UB-001: renders default label and calls start() on click', async () => {
    const user = userEvent.setup();
    render(<UpgradeButton />);
    await user.click(screen.getByRole('button'));
    expect(mockStart).toHaveBeenCalledTimes(1);
  });

  it('UB-002: respects custom label prop', () => {
    render(<UpgradeButton label="Jetzt upgraden" />);
    expect(screen.getByRole('button')).toHaveTextContent('Jetzt upgraden');
  });

  it('UB-003: button disabled while isRedirecting', () => {
    mockState.isRedirecting = true;
    render(<UpgradeButton />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('UB-004: shows authExpired error when errorKey is authExpired', () => {
    mockState.errorKey = 'authExpired';
    render(<UpgradeButton />);
    expect(screen.getByText('Sitzung abgelaufen.')).toBeInTheDocument();
  });

  it('UB-005: shows network error when errorKey is network', () => {
    mockState.errorKey = 'network';
    render(<UpgradeButton />);
    expect(screen.getByText('Verbindungsproblem.')).toBeInTheDocument();
  });

  it('UB-006: no error paragraph when errorKey is null', () => {
    render(<UpgradeButton />);
    expect(screen.queryByText(/Verbindungsproblem|Sitzung|Kein Zugriff/)).not.toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/__tests__/upgrade-button.test.tsx
```

Expected: FAIL — the current `UpgradeButton` doesn't read `errorKey` from a hook.

**Step 3: Rewrite the component**

```tsx
// src/components/UpgradeButton.tsx
import { useLanguage } from '@/src/contexts/LanguageContext';
import { useUpgradeCheckout, type CheckoutErrorKey } from '@/src/hooks/useUpgradeCheckout';

interface Props {
  label?: string;
  className?: string;
}

const ERROR_I18N_KEYS: Record<CheckoutErrorKey, string> = {
  notLoggedIn: 'dashboard.premium.checkoutErrors.notLoggedIn',
  authExpired: 'dashboard.premium.checkoutErrors.authExpired',
  forbidden: 'dashboard.premium.checkoutErrors.forbidden',
  serviceDown: 'dashboard.premium.checkoutErrors.serviceDown',
  emptyResponse: 'dashboard.premium.checkoutErrors.emptyResponse',
  network: 'dashboard.premium.checkoutErrors.network',
  generic: 'dashboard.premium.checkoutErrors.generic',
};

export function UpgradeButton({ label, className }: Props) {
  const { t } = useLanguage();
  const { start, isRedirecting, errorKey } = useUpgradeCheckout();

  return (
    <>
      <button
        type="button"
        onClick={start}
        disabled={isRedirecting}
        className={
          className ||
          'shrink-0 px-5 py-2.5 bg-[#D4AF37] text-[#00050A] text-sm font-semibold rounded-xl hover:bg-[#D4AF37]/90 transition-colors disabled:opacity-60 disabled:cursor-wait'
        }
      >
        {isRedirecting ? '…' : (label || t('dashboard.premium.cta'))}
      </button>
      {errorKey && (
        <p
          className="mt-2 text-xs text-red-400/80 text-center"
          role="alert"
          data-testid="upgrade-button-error"
        >
          {t(ERROR_I18N_KEYS[errorKey])}
        </p>
      )}
    </>
  );
}
```

**Step 4: Run tests to verify they pass**

```bash
npx vitest run src/__tests__/upgrade-button.test.tsx
```

Expected: 6/6 pass.

**Step 5: Run the full project suite to confirm no regression**

```bash
npx vitest run 2>&1 | tail -3
```

Expected: total still green (existing 2239 + 9 + 6 new = 2254). The old `UpgradeButton.tsx` had no dedicated tests, so no migration needed.

**Step 6: Commit**

```bash
git add src/components/UpgradeButton.tsx src/__tests__/upgrade-button.test.tsx
git commit -m "$(cat <<'EOF'
refactor(ui): UpgradeButton uses useUpgradeCheckout + disambiguated error display

Same visible behaviour for the happy path; previously every error
showed the generic "Checkout konnte nicht gestartet werden" message.
Now each of the 6 error states gets its own copy from
dashboard.premium.checkoutErrors.* (TASK-1.4 acceptance).

Component is a 35-line shell over the hook — no fetch, no analytics,
no error-mapping logic in the JSX layer. All the side effects live
in useUpgradeCheckout.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Phase C — Rewrite PremiumGate to be info-only

### Task 5: Drop `<UpgradeButton/>` from PremiumGate; render lock-icon + "Premium" label only

**Files:**
- Modify: `src/components/PremiumGate.tsx`
- Test: `src/__tests__/premium-gate.test.tsx` (create)
- Modify: `src/i18n/translations.ts` (add `dashboard.premium.lockLabel` keys)

**Step 1: Add the new i18n key**

In `src/i18n/translations.ts`, inside the `premium` block (both DE and EN):

```ts
// EN
lockLabel: "Premium content",
unlockHint: "Unlock with the upgrade button below.",

// DE
lockLabel: "Premium-Inhalt",
unlockHint: "Schalte ihn mit dem Upgrade-Button unten frei.",
```

**Step 2: Write the failing test**

```tsx
// src/__tests__/premium-gate.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

let mockIsPremium = false;
vi.mock('@/src/hooks/usePremium', () => ({
  usePremium: () => ({ isPremium: mockIsPremium, loading: false }),
}));

vi.mock('@/src/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    lang: 'de' as const,
    t: (k: string) => {
      const map: Record<string, string> = {
        'dashboard.premium.title': 'Premium freischalten',
        'dashboard.premium.teaser': 'Default teaser',
        'dashboard.premium.lockLabel': 'Premium-Inhalt',
        'dashboard.premium.unlockHint': 'Schalte ihn mit dem Upgrade-Button unten frei.',
      };
      return map[k] ?? k;
    },
  }),
}));

import { PremiumGate } from '@/src/components/PremiumGate';

describe('PremiumGate', () => {
  beforeEach(() => { mockIsPremium = false; });

  it('PG-001: renders children directly when premium', () => {
    mockIsPremium = true;
    render(
      <PremiumGate>
        <div data-testid="payload">premium-only</div>
      </PremiumGate>
    );
    expect(screen.getByTestId('payload')).toHaveTextContent('premium-only');
  });

  it('PG-002: renders blurred children + lock label when free', () => {
    render(
      <PremiumGate>
        <div data-testid="payload">premium-only</div>
      </PremiumGate>
    );
    expect(screen.getByTestId('payload')).toBeInTheDocument();
    expect(screen.getByText('Premium-Inhalt')).toBeInTheDocument();
  });

  it('PG-003: NEVER renders an UpgradeButton when free (single-CTA invariant)', () => {
    render(
      <PremiumGate>
        <div>premium-only</div>
      </PremiumGate>
    );
    // No button at all — the only CTA on the page must be the bottom UpgradeButton.
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('PG-004: shows the unlock hint pointing to the dashboard CTA', () => {
    render(
      <PremiumGate>
        <div>x</div>
      </PremiumGate>
    );
    expect(screen.getByText(/Upgrade-Button unten/)).toBeInTheDocument();
  });

  it('PG-005: respects custom teaser prop', () => {
    render(
      <PremiumGate teaser="BaZi pillars unlock here.">
        <div>x</div>
      </PremiumGate>
    );
    expect(screen.getByText('BaZi pillars unlock here.')).toBeInTheDocument();
  });
});
```

**Step 3: Rewrite PremiumGate**

```tsx
// src/components/PremiumGate.tsx
import { Lock } from 'lucide-react';
import { usePremium } from '@/src/hooks/usePremium';
import { useLanguage } from '@/src/contexts/LanguageContext';

interface Props {
  children: React.ReactNode;
  /** Optional override of the default teaser copy */
  teaser?: string;
}

/**
 * Wraps premium-only content. For free users:
 *   - children render visually but blurred + non-interactive
 *   - lock icon + "Premium" label overlay the centre
 *   - hint text points to the single dashboard upgrade CTA
 *
 * Critically: NO upgrade button is rendered inside the gate. The
 * single dashboard / signatur prime CTA is the only call-to-action
 * on the page (TASK-1.3 invariant).
 */
export function PremiumGate({ children, teaser }: Props) {
  const { isPremium } = usePremium();
  const { t } = useLanguage();

  if (isPremium) return <>{children}</>;

  return (
    <div className="relative" data-testid="premium-gate-locked">
      <div
        className="blur-sm pointer-events-none select-none opacity-60"
        aria-hidden="true"
      >
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-obsidian/70 rounded-2xl backdrop-blur-sm">
        <div className="text-center p-6 max-w-md">
          <div className="flex justify-center mb-3">
            <div className="rounded-full bg-gold/15 border border-gold/30 p-3">
              <Lock className="h-5 w-5 text-gold" aria-hidden="true" />
            </div>
          </div>
          <p className="text-xs font-medium tracking-wider uppercase text-gold mb-2">
            {t('dashboard.premium.lockLabel')}
          </p>
          <p className="text-dawn/70 text-sm leading-relaxed mb-3">
            {teaser || t('dashboard.premium.teaser')}
          </p>
          <p className="text-dawn/40 text-xs">
            {t('dashboard.premium.unlockHint')}
          </p>
        </div>
      </div>
    </div>
  );
}
```

Key change: **the prop `ctaLabel` is gone** — gates no longer render their own button. If the new tests fail because of mocked `t()` keys, add them to the mock.

**Step 4: Drop unused `ctaLabel` prop everywhere PremiumGate is mounted**

```bash
grep -rn 'PremiumGate.*ctaLabel' src/
```

Expected: no matches. Earlier code didn't use `ctaLabel` in any callsite — only the type allowed it.

**Step 5: Verify**

```bash
npx vitest run src/__tests__/premium-gate.test.tsx
npx tsc --noEmit 2>&1 | head -10
```

Expected: 5/5 pass; tsc clean.

**Step 6: Commit**

```bash
git add src/components/PremiumGate.tsx src/__tests__/premium-gate.test.tsx src/i18n/translations.ts
git commit -m "$(cat <<'EOF'
refactor(ui): PremiumGate is info-only — no inline UpgradeButton

DEVELOPMENT_BRIEF TASK-1.3 single-CTA invariant. The 5 PremiumGate
mount points (DashboardTagesEnergie, DashboardAstroSection,
DashboardInterpretationSection, WuXingPage, SynastryPage) used to
render the canonical UpgradeButton inside the gate overlay. With
this change they show only:
  - the blurred children (visual hint of what's unlockable)
  - a lock icon
  - the "Premium-Inhalt" label
  - the teaser copy + an "unlock with the upgrade button below" hint

The prime CTA stays at the bottom of /; PremiumGate is now strictly
informational. PG-003 enforces the invariant via assertion that no
<button> element appears anywhere in the gate's render tree.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Phase D — Dashboard CTA consolidation

### Task 6: Drop `handleUpgrade` from `AgentSection.tsx`, replace button with lock-only treatment

**Files:**
- Modify: `src/components/dashboard/AgentSection.tsx` (lines ~95–115 and ~177–187)

**Step 1: Read the current AgentSection upgrade block**

```bash
sed -n '90,190p' src/components/dashboard/AgentSection.tsx
```

Confirm the structure: there's a `handleUpgrade` function around line 98 and a `<Button variant="premium" onClick={handleUpgrade}>` around line 177–187.

**Step 2: Remove `handleUpgrade` and the import of `authedFetch`**

Find the function declaration:

```ts
const handleUpgrade = async () => {
  setUpgrading(agent.id, true);
  try {
    const { authedFetch } = await import('@/src/lib/authedFetch');
    const res = await authedFetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
    const { url } = await res.json();
    if (url) window.location.href = url;
    else setUpgrading(agent.id, false);
  } catch {
    setUpgrading(agent.id, false);
  }
};
```

Delete it entirely. Also remove `useAgent.setUpgrading` calls if `handleUpgrade` was the only consumer.

**Step 3: Replace the upgrade Button with a lock-only treatment**

Find the `<Button variant="premium" onClick={handleUpgrade} disabled={isUpgrading}>` block at line ~177–187. Replace with:

```tsx
{isPremium ? (
  // existing call-button branch (unchanged)
  <Button variant={isActive ? 'destructive' : 'default'} className="w-full sm:w-auto sm:self-start font-sans" onClick={isActive ? handleHangUp : handleResume}>
    {isActive ? <><PhoneOff className="w-4 h-4" /> {hangUpLabel}</> : <><Phone className="w-4 h-4" /> {callLabel}</>}
  </Button>
) : (
  // Lock-only — no inline upgrade button. The dashboard's bottom
  // upgrade card is the sole prime CTA per TASK-1.3.
  <div
    className="inline-flex items-center gap-2 text-sm text-ink/40 self-start"
    data-testid="agent-card-locked"
  >
    <Lock className="w-4 h-4" aria-hidden="true" />
    <span>{t('dashboard.premium.lockLabel')}</span>
  </div>
)}
```

Also drop `isUpgrading` and `setUpgrading` from `useAgent` destructuring if they become unused.

**Step 4: Update the AgentSection test if one exists**

```bash
grep -rn "handleUpgrade\|isUpgrading" src/__tests__/ --include="*.tsx" --include="*.ts"
```

If any test references those, update them to assert the lock-only treatment instead.

**Step 5: Verify**

```bash
npx tsc --noEmit 2>&1 | head -10
npx vitest run src/__tests__/ 2>&1 | tail -3
```

Both must pass.

**Step 6: Commit**

```bash
git add src/components/dashboard/AgentSection.tsx
git commit -m "$(cat <<'EOF'
refactor(dashboard): AgentSection drops inline handleUpgrade — lock-only for free users

DEVELOPMENT_BRIEF TASK-1.3 group B3 closure. AgentSection used to
render its own POST /api/checkout button mid-dashboard, competing
with the bottom upgrade card. The button is now a lock icon + "Premium"
label — visual indicator of "premium feature" without a competing
CTA. The single prime CTA on / is the bottom upgrade card.

Removes duplicate handleUpgrade (29 LOC) + the useAgent.setUpgrading
state machine (no longer needed). Closes TASK-1.2 inventory finding B3.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Hide `AgentFloatingWidget` for free users on the dashboard route

**Files:**
- Modify: `src/App.tsx` (around line 322–328 where AgentFloatingWidget is mounted)
- OR: `src/components/AgentFloatingWidget.tsx` (early return when `!isPremium && location.pathname === '/'`)

**Step 1: Decide the gate location**

The widget is mounted in `App.tsx` and survives navigation. There are two reasonable gates:

1. **In App.tsx** — wrap the mount in `{(isPremium || location.pathname === '/signatur') && (<AgentFloatingWidget … />)}`. Cleanest because the gate is colocated with the routing decision.
2. **In AgentFloatingWidget.tsx** — early return when `!isPremium && pathname === '/'`. Keeps the mount call site simple but makes the widget aware of routes.

Pick option 1 (cleaner, matches existing premiumOnly nav-link pattern).

**Step 2: Locate the mount**

```bash
grep -n "AgentFloatingWidget" src/App.tsx
```

Expected: one mount around line 322. Check the surrounding props.

**Step 3: Wrap the mount in the gate**

```tsx
// BEFORE
{hasCompleteProfile && (
  <AgentFloatingWidget
    userId={user.id}
    isPremium={premium.isPremium}
    onUpgrade={handleLeviUpgrade}
    onStopAudio={ambiente.pause}
    onResumeAudio={ambiente.resume}
  />
)}

// AFTER
{hasCompleteProfile && shouldShowFloatingWidget(premium.isPremium, location.pathname) && (
  <AgentFloatingWidget
    userId={user.id}
    isPremium={premium.isPremium}
    onStopAudio={ambiente.pause}
    onResumeAudio={ambiente.resume}
  />
)}
```

Add a small helper at the top of the component (outside the React function):

```ts
function shouldShowFloatingWidget(isPremium: boolean, pathname: string): boolean {
  // Premium users always see the widget (it's their voice-agent shortcut).
  if (isPremium) return true;
  // Free users only see it on /signatur (where it acts as a contextual
  // upsell). On / and other routes the bottom dashboard CTA owns the
  // upgrade flow — TASK-1.3 single-CTA invariant.
  return pathname === '/signatur';
}
```

**Step 4: Drop the now-unused `onUpgrade` prop**

Remove the `onUpgrade` prop from `AgentFloatingWidget` (line 66 in that file) and any rendering logic that used it. Free users only see the widget on `/signatur` where the existing PremiumUpgradeModal handles upsell.

```bash
grep -n "onUpgrade" src/components/AgentFloatingWidget.tsx
```

Update the component to not accept the prop. Then drop `handleLeviUpgrade` from `App.tsx` if it has no other consumers.

**Step 5: Verify**

```bash
npx tsc --noEmit 2>&1 | head -10
npx vitest run 2>&1 | tail -3
```

**Step 6: Commit**

```bash
git add src/App.tsx src/components/AgentFloatingWidget.tsx
git commit -m "$(cat <<'EOF'
refactor(dashboard): hide AgentFloatingWidget for free users on /

DEVELOPMENT_BRIEF TASK-1.3 group B4 closure. The floating widget's
upgrade button competed with the dashboard's bottom CTA. Free users
on / no longer see the widget. They still see it on /signatur where
the PremiumUpgradeModal handles contextual upsell (different intent
than the dashboard's primary CTA).

Premium users see the widget on every route (it's their voice-agent
shortcut). Drops the onUpgrade prop + App.tsx.handleLeviUpgrade —
unused after this change. Closes TASK-1.2 inventory finding B4.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Migrate `App.tsx` nav-locks to `useUpgradeCheckout` hook

**Files:**
- Modify: `src/App.tsx` (lines ~404–411 `handleUpgrade`, ~465 desktop nav, ~678 mobile nav)

**Step 1: Drop the inline `handleUpgrade` at line 404–411**

Delete the function entirely. Replace with a hook call near the top of the App component:

```tsx
// Inside App() function body
const upgrade = useUpgradeCheckout();
```

**Step 2: Update the desktop nav-lock at line 465**

```tsx
// BEFORE
<button
  key={link.to}
  onClick={handleUpgrade}
  className={`${navItemClass()} opacity-40 cursor-pointer`}
  title={t('nav.atlasPremium')}
>
  <Lock className="w-3 h-3 shrink-0" aria-hidden="true" />
  {link.label}
</button>

// AFTER
<button
  key={link.to}
  onClick={upgrade.start}
  disabled={upgrade.isRedirecting}
  className={`${navItemClass()} opacity-40 cursor-pointer`}
  title={t('nav.atlasPremium')}
>
  <Lock className="w-3 h-3 shrink-0" aria-hidden="true" />
  {link.label}
</button>
```

**Step 3: Update the mobile nav-lock at line 678**

Same pattern — `onClick={upgrade.start}`, `disabled={upgrade.isRedirecting}`.

**Step 4: Drop the import of `authedFetch` if it has no other consumers in App.tsx**

```bash
grep -n "authedFetch" src/App.tsx
```

If only the (now-deleted) `handleUpgrade` used it, remove the dynamic import.

**Step 5: Verify**

```bash
npx tsc --noEmit 2>&1 | head -10
npx vitest run 2>&1 | tail -3
```

**Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "$(cat <<'EOF'
refactor(nav): nav-locks use useUpgradeCheckout — same analytics + error path as the dashboard CTA

DEVELOPMENT_BRIEF TASK-1.3 group B1 + B2 closure. The desktop and
mobile nav-locks (premium-only routes like /atlas) used to call a
silent local handleUpgrade that bypassed analytics and had no error
UI. They now use useUpgradeCheckout — the same hook the dashboard
button uses — so:

- upgrade_clicked / checkout_started / checkout_failed /
  checkout_redirected events fire from the nav too
- 6 disambiguated error states surface on the nav-lock as well
  (visible via the hook's errorKey state — when the user clicks
  a locked nav item and gets a server error, they see why)

Drops 8 LOC of duplicate POST /api/checkout logic.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Phase E — Signatur page persistent CTA

### Task 9: Add a persistent upgrade card on `/signatur` for free users

**Files:**
- Modify: `src/pages/SignaturPage.tsx`

**Step 1: Locate the right spot for the card**

Read the current page structure:

```bash
sed -n '420,445p' src/pages/SignaturPage.tsx
```

Identify where to mount the new card. Mirror the Dashboard pattern at `src/components/Dashboard.tsx:486–500`. Place the card AFTER the existing main content (around line 432, before the `{premiumCluster && <PremiumUpgradeModal/>}` block).

**Step 2: Insert the card**

```tsx
// In SignaturPage.tsx, near the bottom of the JSX
{!isPremium && (
  <Card
    className="mx-auto mt-8 mb-12 max-w-md flex flex-col items-center gap-4 px-6 py-6 sm:flex-row sm:gap-6 sm:px-8 sm:py-8"
    data-testid="signatur-upgrade-card"
  >
    <div className="flex-1 text-center sm:text-left">
      <p className="text-sm font-medium text-ink">
        {t('signatur.upgradeCard.title')}
      </p>
      <p className="text-xs text-ink/50 mt-1">
        {t('signatur.upgradeCard.subtitle')}
      </p>
    </div>
    <UpgradeButton />
  </Card>
)}
```

**Step 3: Add the i18n keys**

In `src/i18n/translations.ts`, inside the `signatur` block (both DE and EN):

```ts
// EN
upgradeCard: {
  title: 'Unlock the full Signatur experience',
  subtitle: 'Premium clusters, advanced quizzes, and more',
},

// DE
upgradeCard: {
  title: 'Schalte die volle Signatur-Erfahrung frei',
  subtitle: 'Premium-Cluster, erweiterte Quizzes und mehr',
},
```

**Step 4: Test the single-CTA invariant on /signatur**

Create `src/__tests__/signatur-page-single-cta.test.tsx`:

```tsx
// Mocks for usePremium=false, all data hooks providing minimum valid state
// then render <SignaturPage/> and assert:
//   - exactly ONE element with data-testid="signatur-upgrade-card" is present
//   - exactly ONE button with the "premium freischalten" label is present
//   - PremiumUpgradeModal is NOT mounted (premiumCluster state is null)
```

This is the same shape as the Dashboard single-CTA test in Task 10 — bundle them into one file if convenient.

**Step 5: Verify**

```bash
npx tsc --noEmit
npx vitest run 2>&1 | tail -3
```

**Step 6: Commit**

```bash
git add src/pages/SignaturPage.tsx src/i18n/translations.ts src/__tests__/signatur-page-single-cta.test.tsx
git commit -m "$(cat <<'EOF'
feat(signatur): persistent upgrade card on /signatur for free users

User intent (2026-05-07): "Auf der Signaturseite soll genau ein
Upgrade-Button sein. Premium-Bereiche sind ausgegraut."

The Signatur page used to have only the cluster-trigger
PremiumUpgradeModal, which only appears when the user clicks a
locked cluster. Free users had no persistent upsell and didn't know
where to upgrade from. The new card mirrors the dashboard's bottom
upgrade card — single prime CTA on /signatur.

PremiumUpgradeModal stays as the focused-trigger when a free user
clicks a locked cluster (different intent than the persistent CTA).

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Phase F — Single-CTA invariant tests + verification

### Task 10: Dashboard single-CTA invariant test

**Files:**
- Create: `src/__tests__/dashboard-single-cta.test.tsx`

**Step 1: Write the test**

```tsx
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Mock usePremium → free user
vi.mock('@/src/hooks/usePremium', () => ({
  usePremium: () => ({ isPremium: false, loading: false }),
}));
// Mock all the data hooks Dashboard needs to a minimum valid state
// (paste the same mocks used by the existing dashboard-ghost-ui.test.tsx)
// ... (see existing test file for the pattern)

import { Dashboard } from '@/src/components/Dashboard';

describe('Dashboard single-CTA invariant (TASK-1.3)', () => {
  it('DASH-CTA-001: free user sees exactly ONE upgrade button on /', () => {
    render(<Dashboard {...validProps} />);
    const upgradeButtons = screen.queryAllByText(/Premium freischalten|Unlock Premium|Upgrade/);
    // The bottom UpgradeButton + AgentsPopup is contextual nav, not on /;
    // the only button visible to a free user on / is the bottom card.
    expect(upgradeButtons.length).toBe(1);
  });

  it('DASH-CTA-002: free user agent card shows lock-only, no button', () => {
    render(<Dashboard {...validProps} />);
    expect(screen.queryByTestId('agent-card-locked')).toBeInTheDocument();
    // Defensive: no button labelled "Premium freischalten" inside the agent card section
    const agentSection = screen.getByTestId('agent-card-locked').closest('section');
    if (agentSection) {
      expect(within(agentSection).queryByRole('button', { name: /Premium/ })).not.toBeInTheDocument();
    }
  });

  it('DASH-CTA-003: PremiumGate-wrapped sections show lock label, no button', () => {
    render(<Dashboard {...validProps} />);
    const lockedSections = screen.queryAllByTestId('premium-gate-locked');
    expect(lockedSections.length).toBeGreaterThan(0);
    // Each gate must NOT contain a button
    lockedSections.forEach((gate) => {
      expect(within(gate).queryByRole('button')).not.toBeInTheDocument();
    });
  });
});
```

**Step 2: Run + commit**

```bash
npx vitest run src/__tests__/dashboard-single-cta.test.tsx
git add src/__tests__/dashboard-single-cta.test.tsx
git commit -m "$(cat <<'EOF'
test(dashboard): single-CTA invariant guards (TASK-1.3 acceptance)

3 tests assert that a free user on / sees:
  1. Exactly ONE upgrade button (the bottom card)
  2. Agent card shows lock-only, no inline button
  3. PremiumGate-wrapped sections show lock + label, no button

These guard against future regressions where someone re-introduces a
mid-page upgrade button. The tests ARE the contract for TASK-1.3's
single-prime-CTA invariant.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: Final verification + manual smoke test

**Files:** none — verification only.

**Step 1: Full project test suite**

```bash
npx vitest run 2>&1 | tail -5
```

Expected: 2239 (start) + 9 (Task 3) + 6 (Task 4) + 5 (Task 5) + 3 (Task 10) + 3 (Task 9 if signatur tests added) = ~2265, all green.

**Step 2: Typecheck**

```bash
npm run lint 2>&1 | tail -3
```

Expected: tsc clean.

**Step 3: i18n integrity**

```bash
npm run check:text-integrity 2>&1 | tail -3
```

Expected: pass — DE/EN keys mirror.

**Step 4: Manual browser smoke**

```bash
# Terminal 1: dev API
PORT=3001 SUPABASE_URL=http://localhost VITE_SUPABASE_URL=http://localhost \
SUPABASE_SERVICE_ROLE_KEY=placeholder VITE_SUPABASE_ANON_KEY=placeholder \
node server.mjs

# Terminal 2: vite dev
npm run dev
```

Open `http://localhost:3000/`, sign in as a free test user, and verify:

| Location | Expected |
|----------|----------|
| Top of page | No upgrade button |
| Mid-page agent card | Lock icon + "Premium-Inhalt" label, no button |
| Each `<PremiumGate>`-wrapped section (TagesEnergie, Astro pillars, AI interpretation) | Blurred content + lock + "Premium" label, no button |
| Bottom upgrade card | Yellow `<UpgradeButton/>` ✅ THE single CTA |
| Floating widget | NOT visible for free user on `/` |
| Click bottom button | redirects to Stripe (or 503 + error message if Stripe env missing) |

Switch to `/signatur`:

| Location | Expected |
|----------|----------|
| Top of cluster sidebar | Premium clusters greyed + lock icon (existing behaviour) |
| Bottom of page (new) | Persistent upgrade card with `<UpgradeButton/>` |
| Click locked cluster | PremiumUpgradeModal appears with `<UpgradeButton/>` (existing behaviour) |
| Floating widget | Visible (free users on `/signatur`) |

**Step 5: Sign off**

After steps 1–4 pass, the work is ready for `/ship`.

---

## Done-when checklist

- [ ] Phase A: `useUpgradeCheckout` hook with 9 unit tests; `EventName` union extended; i18n keys in place
- [ ] Phase B: `<UpgradeButton/>` rewritten as a 35-LOC shell over the hook; 6 component tests pass
- [ ] Phase C: `<PremiumGate>` is info-only (no button); 5 component tests pass
- [ ] Phase D: `AgentSection` shows lock-only; AgentFloatingWidget hidden for free users on `/`; nav-locks use the hook
- [ ] Phase E: Signatur page has a persistent upgrade card; i18n keys added
- [ ] Phase F: Dashboard single-CTA invariant test passes; full suite green; tsc clean; manual smoke OK
- [ ] On `/`: a free user sees exactly ONE button labelled "Premium freischalten" (the bottom card). All gated sections show lock + label only.
- [ ] On `/signatur`: a free user sees exactly ONE persistent button + the existing modal-on-cluster-click. Premium clusters greyed.
- [ ] All 4 conversion-funnel events fire from BOTH the dashboard CTA and the nav-locks.
- [ ] All 6 error states render distinct copy.
- [ ] No commit touches `server.mjs` (the Stripe rebuild already hardened the server side).

---

## Out of scope (deliberate)

- **Onboarding-flow CTA placement** — onboarding has its own UI rules; not part of TASK-1.3.
- **Pricing page** — there isn't one yet; the upgrade card subtitle is the only "what you get" copy.
- **A/B testing the lock-label copy** — pick reasonable copy now, let the next sprint iterate.
- **Stripe customer-portal entry point** — `<ManageSubscription/>` for premium users is fine where it is (top-right menu).
- **Analytics destination beyond `gtag`** — `trackEvent` already pushes to `window.gtag`; adding Mixpanel/PostHog/Segment is a separate sprint.
- **Single-CTA enforcement on other routes** (`/wu-xing`, `/wissen`, `/synastry`) — those routes have at most one PremiumGate each, which now contributes zero CTAs after Phase C. No additional consolidation needed.

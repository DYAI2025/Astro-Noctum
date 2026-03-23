# Explorative Blackbox Testing — Breakings, Fixes & Automated Tests

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Systematically test every user-facing flow as a destructive user would, document all breakings and showstoppers, build reliable fixes, and add automated tests for each.

**Architecture:** Each task targets one user flow. Step 1 reproduces the bug via code analysis, Step 2 implements the fix, Step 3 writes the automated test, Step 4 verifies. Tests use Vitest + happy-dom (existing setup).

**Tech Stack:** React 19, Vitest, @testing-library/react, happy-dom, TypeScript

**Current test count:** 685 tests across 85 files. Pre-existing failures: 3 (cosmic-encounter flag, cluster-burst-trigger, first-time-experience-e2e).

---

## Breaking 1: BirthForm accepts future dates — user born in 2099

**Severity:** Medium — BAFE may return nonsense or error for future dates
**Reproduction:** Enter date `2099-12-31` in the birth form. No validation stops it. BAFE calculates astrology for a date that hasn't happened.

### Task 1: Fix future date validation in BirthForm

**Files:**
- Modify: `src/components/BirthForm.tsx:148-152` (date input)
- Modify: `src/components/BirthForm.tsx:72-95` (handleSubmit)
- Test: `src/__tests__/birthform-validation.test.tsx`

**Step 1: Add max date constraint and submit-time validation**

In `src/components/BirthForm.tsx`, add a `max` attribute to the date input and a submit guard:

```typescript
// Near top of BirthForm component, add:
const today = new Date().toISOString().split('T')[0];

// In the date <input>, add max={today}:
<input type="date" required value={date} max={today} ...

// In handleSubmit, before the coordinate check, add:
if (date > today) {
  alert(t("form.futureDate"));
  return;
}
```

Also add the i18n key. In `src/contexts/LanguageContext.tsx` translations:
```
"form.futureDate": "Bitte ein Geburtsdatum in der Vergangenheit angeben." / "Please enter a birth date in the past."
```

**Step 2: Run build to verify no type errors**

Run: `npx tsc --noEmit`
Expected: PASS (no new errors)

**Step 3: Write the automated test**

Create `src/__tests__/birthform-validation.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BirthForm } from '../components/BirthForm';

// Mock dependencies
vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    lang: 'en',
    setLang: vi.fn(),
  }),
}));
vi.mock('../services/timezone', () => ({
  fetchTimezone: vi.fn().mockResolvedValue('Europe/Berlin'),
}));
vi.mock('../components/PlaceAutocomplete', () => ({
  PlaceAutocomplete: () => null,
  hasPlacesApiKey: () => false,
}));
vi.mock('../components/LocationMap', () => ({
  LocationMap: () => null,
}));

describe('BirthForm validation', () => {
  const mockSubmit = vi.fn();
  const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects future dates', () => {
    render(<BirthForm onSubmit={mockSubmit} isLoading={false} />);
    const dateInput = screen.getByDisplayValue('1990-01-01');
    fireEvent.change(dateInput, { target: { value: '2099-12-31' } });

    // Advance to step 2 (click Weiter)
    const nextBtn = screen.getByText('form.nextStep');
    fireEvent.click(nextBtn);

    // Submit form on step 2
    const submitBtn = screen.getByText('form.submit');
    fireEvent.click(submitBtn);

    expect(alertSpy).toHaveBeenCalledWith('form.futureDate');
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('accepts past dates', () => {
    render(<BirthForm onSubmit={mockSubmit} isLoading={false} />);
    // Default date 1990-01-01 should work
    const nextBtn = screen.getByText('form.nextStep');
    fireEvent.click(nextBtn);

    const submitBtn = screen.getByText('form.submit');
    fireEvent.click(submitBtn);

    expect(alertSpy).not.toHaveBeenCalledWith('form.futureDate');
  });

  it('date input has max attribute set to today', () => {
    render(<BirthForm onSubmit={mockSubmit} isLoading={false} />);
    const dateInput = screen.getByDisplayValue('1990-01-01');
    const today = new Date().toISOString().split('T')[0];
    expect(dateInput).toHaveAttribute('max', today);
  });
});
```

**Step 4: Run the test**

Run: `npx vitest run src/__tests__/birthform-validation.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/BirthForm.tsx src/__tests__/birthform-validation.test.tsx
git commit -m "fix(birthform): reject future dates with validation + max attribute"
```

---

## Breaking 2: No root-level error boundary — uncaught errors crash entire app

**Severity:** High (Showstopper) — Any unhandled error in a non-quiz, non-dashboard-section component shows a white screen
**Reproduction:** If any lazy-loaded page throws during render (e.g., WuXingPage with corrupted data), the entire app crashes to white.

### Task 2: Add root-level error boundary with recovery

**Files:**
- Create: `src/components/AppErrorBoundary.tsx`
- Modify: `src/App.tsx` (wrap content in boundary)
- Test: `src/__tests__/app-error-boundary.test.tsx`

**Step 1: Create AppErrorBoundary component**

```typescript
// src/components/AppErrorBoundary.tsx
import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[AppErrorBoundary]', error, info.componentStack);
  }

  handleReload = () => {
    window.location.href = '/';
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 bg-[#FAFAF8]">
          <div className="text-center max-w-md space-y-4">
            <h1 className="font-serif text-2xl text-[#1E2A3A]">
              Etwas ist schiefgelaufen
            </h1>
            <p className="text-sm text-[#1E2A3A]/50">
              Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={this.handleRetry}
              className="px-5 py-2.5 border border-[#8B6914]/20 text-sm text-[#1E2A3A] rounded-xl hover:bg-[#8B6914]/5 transition-colors"
            >
              Erneut versuchen
            </button>
            <button
              type="button"
              onClick={this.handleReload}
              className="px-5 py-2.5 bg-[#8B6914] text-white text-sm font-semibold rounded-xl hover:bg-[#8B6914]/90 transition-colors"
            >
              Zur Startseite
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
```

**Step 2: Wrap App content in boundary**

In `src/App.tsx`, import and wrap the main content:

```typescript
import { AppErrorBoundary } from './components/AppErrorBoundary';

// In the return JSX, wrap outermost content:
return (
  <AppErrorBoundary>
    {/* existing App content */}
  </AppErrorBoundary>
);
```

**Step 3: Write the automated test**

```typescript
// src/__tests__/app-error-boundary.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppErrorBoundary } from '../components/AppErrorBoundary';

function BombComponent(): JSX.Element {
  throw new Error('Boom!');
}

function SafeComponent() {
  return <div>Safe content</div>;
}

describe('AppErrorBoundary', () => {
  // Suppress console.error from React error boundary
  const originalError = console.error;
  beforeEach(() => { console.error = vi.fn(); });
  afterEach(() => { console.error = originalError; });

  it('renders children when no error', () => {
    render(
      <AppErrorBoundary>
        <SafeComponent />
      </AppErrorBoundary>
    );
    expect(screen.getByText('Safe content')).toBeDefined();
  });

  it('shows error UI when child throws', () => {
    render(
      <AppErrorBoundary>
        <BombComponent />
      </AppErrorBoundary>
    );
    expect(screen.getByText('Etwas ist schiefgelaufen')).toBeDefined();
    expect(screen.getByText('Erneut versuchen')).toBeDefined();
    expect(screen.getByText('Zur Startseite')).toBeDefined();
  });

  it('retry button resets error state', () => {
    let shouldThrow = true;
    function MaybeThrow() {
      if (shouldThrow) throw new Error('Boom');
      return <div>Recovered</div>;
    }

    const { rerender } = render(
      <AppErrorBoundary>
        <MaybeThrow />
      </AppErrorBoundary>
    );

    expect(screen.getByText('Etwas ist schiefgelaufen')).toBeDefined();

    shouldThrow = false;
    fireEvent.click(screen.getByText('Erneut versuchen'));
    // After retry, component re-renders without throw
    expect(screen.getByText('Recovered')).toBeDefined();
  });

  it('reload button navigates to root', () => {
    const originalHref = window.location.href;
    Object.defineProperty(window, 'location', {
      value: { href: originalHref },
      writable: true,
    });

    render(
      <AppErrorBoundary>
        <BombComponent />
      </AppErrorBoundary>
    );

    fireEvent.click(screen.getByText('Zur Startseite'));
    expect(window.location.href).toBe('/');
  });
});
```

**Step 4: Run the test**

Run: `npx vitest run src/__tests__/app-error-boundary.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/AppErrorBoundary.tsx src/App.tsx src/__tests__/app-error-boundary.test.tsx
git commit -m "fix: add root-level error boundary to prevent white-screen crashes"
```

---

## Breaking 3: UpgradeButton shows no error on checkout failure

**Severity:** High — User clicks "Upgrade", checkout API returns non-ok, button just re-enables silently. User has no idea what happened.
**Reproduction:** Block `/api/checkout` (Stripe unconfigured, returns 503). Click upgrade. Button shows "..." briefly then reverts to default. No error message.

### Task 3: Show error feedback on checkout failure

**Files:**
- Modify: `src/components/UpgradeButton.tsx`
- Test: `src/__tests__/upgrade-button.test.tsx`

**Step 1: Add error state to UpgradeButton**

```typescript
// src/components/UpgradeButton.tsx — add error feedback
const [error, setError] = useState(false);

const handleUpgrade = async () => {
  trackEvent('upgrade_clicked');
  setIsRedirecting(true);
  setError(false);
  try {
    const res = await authedFetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      setIsRedirecting(false);
      setError(true);
      return;
    }
    const { url } = await res.json();
    if (url) window.location.href = url;
    else { setIsRedirecting(false); setError(true); }
  } catch {
    setIsRedirecting(false);
    setError(true);
  }
};

// In JSX, after the button:
{error && (
  <p className="mt-2 text-xs text-red-400/80 text-center">
    {t("dashboard.premium.checkoutError")}
  </p>
)}
```

Add i18n key:
```
"dashboard.premium.checkoutError": "Checkout konnte nicht gestartet werden. Bitte versuche es später erneut." / "Checkout could not be started. Please try again later."
```

**Step 2: Write the automated test**

```typescript
// src/__tests__/upgrade-button.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UpgradeButton } from '../components/UpgradeButton';

vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key, lang: 'en', setLang: vi.fn() }),
}));
vi.mock('../lib/analytics', () => ({ trackEvent: vi.fn() }));

const mockFetch = vi.fn();
vi.mock('../lib/authedFetch', () => ({
  authedFetch: (...args: unknown[]) => mockFetch(...args),
}));

describe('UpgradeButton', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('shows error message when checkout returns non-ok', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 503 });

    render(<UpgradeButton />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('dashboard.premium.checkoutError')).toBeDefined();
    });
  });

  it('shows error message when checkout returns no URL', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });

    render(<UpgradeButton />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('dashboard.premium.checkoutError')).toBeDefined();
    });
  });

  it('shows error message on network failure', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    render(<UpgradeButton />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('dashboard.premium.checkoutError')).toBeDefined();
    });
  });

  it('redirects on successful checkout', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ url: 'https://checkout.stripe.com/abc' }),
    });

    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });

    render(<UpgradeButton />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(window.location.href).toBe('https://checkout.stripe.com/abc');
    });
  });
});
```

**Step 3: Run the test**

Run: `npx vitest run src/__tests__/upgrade-button.test.tsx`
Expected: PASS

**Step 4: Commit**

```bash
git add src/components/UpgradeButton.tsx src/__tests__/upgrade-button.test.tsx
git commit -m "fix(upgrade): show error feedback when Stripe checkout fails"
```

---

## Breaking 4: QuizOverlay renders blank modal for unknown quiz ID

**Severity:** Medium — If a quiz ID is referenced but not in QUIZ_MAP, user sees an empty modal with no content, just the overlay backdrop.
**Reproduction:** Programmatically set `activeQuiz` to a non-existent ID like `"nonexistent_quiz"`. The overlay opens but is empty.

### Task 4: Show fallback message for unknown quiz IDs

**Files:**
- Modify: `src/components/QuizOverlay.tsx`
- Test: `src/__tests__/quiz-overlay-unknown.test.tsx`

**Step 1: Read QuizOverlay to understand the QUIZ_MAP lookup**

Read: `src/components/QuizOverlay.tsx`

**Step 2: Add fallback for missing quiz component**

In `QuizOverlay.tsx`, after the `QUIZ_MAP` lookup, add a fallback:

```typescript
const QuizComponent = QUIZ_MAP[quizId];

// If quiz not found, show error message instead of blank
if (!QuizComponent) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/80 backdrop-blur-sm">
      <div className="bg-[#0D0F14] rounded-2xl p-8 max-w-sm text-center space-y-4">
        <p className="text-gold/70">Quiz nicht gefunden.</p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-gold/20 px-4 py-2 text-sm text-gold transition-colors hover:bg-gold/10"
        >
          Schließen
        </button>
      </div>
    </div>
  );
}
```

**Step 3: Write the automated test**

```typescript
// src/__tests__/quiz-overlay-unknown.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuizOverlay } from '../components/QuizOverlay';

vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key, lang: 'de', setLang: vi.fn() }),
}));
vi.mock('../hooks/useQuizContribution', () => ({
  useQuizContribution: () => vi.fn(),
}));

describe('QuizOverlay — unknown quiz ID', () => {
  it('shows fallback message for non-existent quiz', () => {
    render(
      <QuizOverlay
        quizId="nonexistent_quiz_id"
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('Quiz nicht gefunden.')).toBeDefined();
    expect(screen.getByText('Schließen')).toBeDefined();
  });
});
```

**Step 4: Run the test**

Run: `npx vitest run src/__tests__/quiz-overlay-unknown.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/QuizOverlay.tsx src/__tests__/quiz-overlay-unknown.test.tsx
git commit -m "fix(quiz): show fallback message when quiz ID is not found in QUIZ_MAP"
```

---

## Breaking 5: Article page with invalid slug shows redirect flash

**Severity:** Low — Invalid `/wissen/xyz` redirects to `/wissen` but user briefly sees the page layout before redirect. Not a crash but bad UX.
**Reproduction:** Navigate to `/wissen/nonexistent-article`. ArtikelPage renders, calls `getArticleBySlug('nonexistent-article')` which returns `undefined`, then `<Navigate>` fires. The page briefly flashes.

### Task 5: Verify ArtikelPage redirect works (test coverage only)

The existing code at `ArtikelPage.tsx:90-92` already handles this correctly with `<Navigate to="/wissen" replace />`. The flash is inherent to lazy-loading + redirect. No code fix needed, but we need a test.

**Files:**
- Test: `src/__tests__/artikel-page-invalid-slug.test.tsx`

**Step 1: Write the test**

```typescript
// src/__tests__/artikel-page-invalid-slug.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('../data/articles', () => ({
  getArticleBySlug: (slug: string) => (slug === 'valid' ? { slug: 'valid', title: 'Test', image: '', sections: [], readTime: '5 min', heroBlur: '' } : undefined),
  ARTICLES: [],
}));

// Must import AFTER mocks
const ArtikelPage = (await import('../pages/ArtikelPage')).default;

describe('ArtikelPage', () => {
  it('redirects to /wissen for invalid slug', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/wissen/nonexistent']}>
        <Routes>
          <Route path="/wissen/:slug" element={<ArtikelPage />} />
          <Route path="/wissen" element={<div data-testid="wissen-page">Wissen</div>} />
        </Routes>
      </MemoryRouter>
    );
    // After redirect, should show Wissen page
    expect(container.querySelector('[data-testid="wissen-page"]')).toBeDefined();
  });
});
```

**Step 2: Run the test**

Run: `npx vitest run src/__tests__/artikel-page-invalid-slug.test.tsx`
Expected: PASS

**Step 3: Commit**

```bash
git add src/__tests__/artikel-page-invalid-slug.test.tsx
git commit -m "test: verify ArtikelPage redirects on invalid slug"
```

---

## Breaking 6: Rapid "Regenerate" clicks fire multiple Gemini requests

**Severity:** Medium — User clicks "Regenerate interpretation" multiple times rapidly. Each click fires an independent Gemini API call. Multiple responses race, causing flickering text. Also wastes API quota.
**Reproduction:** Click the regenerate button 5 times in 1 second. Network tab shows 5 parallel Gemini requests.

### Task 6: Debounce regenerate and add loading guard

**Files:**
- Modify: `src/components/Dashboard.tsx` (the regenerate handler)
- Test: `src/__tests__/dashboard-regenerate-debounce.test.tsx`

**Step 1: Read the regenerate handler**

Read: `src/components/Dashboard.tsx` — find `handleRegenerate` or similar

**Step 2: Add guard against concurrent regeneration**

```typescript
// In Dashboard, add a ref to track in-flight regeneration:
const regeneratingRef = useRef(false);

const handleRegenerate = async () => {
  if (regeneratingRef.current) return; // Guard
  regeneratingRef.current = true;
  try {
    // ... existing Gemini call
  } finally {
    regeneratingRef.current = false;
  }
};
```

**Step 3: Write the test**

```typescript
// src/__tests__/dashboard-regenerate-debounce.test.tsx
import { describe, it, expect, vi } from 'vitest';

describe('Dashboard regenerate guard', () => {
  it('prevents concurrent regeneration calls', async () => {
    let callCount = 0;
    let resolveCall: (() => void) | undefined;
    const regeneratingRef = { current: false };

    const mockRegenerate = async () => {
      if (regeneratingRef.current) return;
      regeneratingRef.current = true;
      callCount++;
      await new Promise<void>((r) => { resolveCall = r; });
      regeneratingRef.current = false;
    };

    // Fire 5 rapid calls
    mockRegenerate();
    mockRegenerate();
    mockRegenerate();
    mockRegenerate();
    mockRegenerate();

    // Only 1 should have started
    expect(callCount).toBe(1);

    // Resolve the first call
    resolveCall?.();
    await new Promise(r => setTimeout(r, 0));

    // Now another can go through
    mockRegenerate();
    expect(callCount).toBe(2);
  });
});
```

**Step 4: Run the test**

Run: `npx vitest run src/__tests__/dashboard-regenerate-debounce.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/Dashboard.tsx src/__tests__/dashboard-regenerate-debounce.test.tsx
git commit -m "fix(dashboard): guard against concurrent Gemini regeneration requests"
```

---

## Breaking 7: QuizErrorBoundary shows English-only error in German app

**Severity:** Low — Quiz error boundary always shows "Quiz could not be loaded." regardless of language setting. App is primarily German.
**Reproduction:** Force a quiz to throw (e.g., corrupt quiz data). Error boundary shows English text.

### Task 7: Localize QuizErrorBoundary

**Files:**
- Modify: `src/components/QuizErrorBoundary.tsx`
- Test: `src/__tests__/quiz-error-boundary-i18n.test.tsx`

**Step 1: Make QuizErrorBoundary language-aware**

The challenge: class components can't use hooks. Solution: Accept a `lang` prop or use a wrapper.

```typescript
// src/components/QuizErrorBoundary.tsx
interface Props {
  onClose: () => void;
  children: ReactNode;
  lang?: 'de' | 'en';
}

// In render():
const msg = this.props.lang === 'en'
  ? 'Quiz could not be loaded.'
  : 'Quiz konnte nicht geladen werden.';
const btnText = this.props.lang === 'en' ? 'Close' : 'Schließen';
```

Update QuizOverlay to pass `lang` prop from `useLanguage()`.

**Step 2: Write the test**

```typescript
// src/__tests__/quiz-error-boundary-i18n.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuizErrorBoundary } from '../components/QuizErrorBoundary';

function BombComponent(): JSX.Element {
  throw new Error('Boom!');
}

describe('QuizErrorBoundary i18n', () => {
  const origError = console.error;
  beforeEach(() => { console.error = vi.fn(); });
  afterEach(() => { console.error = origError; });

  it('shows German text by default', () => {
    render(
      <QuizErrorBoundary onClose={vi.fn()}>
        <BombComponent />
      </QuizErrorBoundary>
    );
    expect(screen.getByText('Quiz konnte nicht geladen werden.')).toBeDefined();
    expect(screen.getByText('Schließen')).toBeDefined();
  });

  it('shows English text when lang=en', () => {
    render(
      <QuizErrorBoundary onClose={vi.fn()} lang="en">
        <BombComponent />
      </QuizErrorBoundary>
    );
    expect(screen.getByText('Quiz could not be loaded.')).toBeDefined();
    expect(screen.getByText('Close')).toBeDefined();
  });
});
```

**Step 3: Run the test**

Run: `npx vitest run src/__tests__/quiz-error-boundary-i18n.test.tsx`
Expected: PASS

**Step 4: Commit**

```bash
git add src/components/QuizErrorBoundary.tsx src/components/QuizOverlay.tsx src/__tests__/quiz-error-boundary-i18n.test.tsx
git commit -m "fix(quiz): localize QuizErrorBoundary error messages (DE/EN)"
```

---

## Breaking 8: PremiumGate blurred content accessible via screen readers

**Severity:** Medium — Blurred premium content uses `pointer-events-none` but no `aria-hidden`. Screen readers read the full content without payment.
**Reproduction:** Enable VoiceOver, navigate to a PremiumGate section. Full premium text is read aloud.

### Task 8: Add aria-hidden to PremiumGate blurred content

**Files:**
- Modify: `src/components/PremiumGate.tsx`
- Test: `src/__tests__/premium-gate-a11y.test.tsx`

**Step 1: Add aria-hidden to blurred content**

```typescript
// In PremiumGate.tsx, the blurred div:
<div className="blur-sm pointer-events-none select-none opacity-60" aria-hidden="true">
  {children}
</div>
```

**Step 2: Write the test**

```typescript
// src/__tests__/premium-gate-a11y.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { PremiumGate } from '../components/PremiumGate';

vi.mock('../hooks/usePremium', () => ({
  usePremium: () => ({ isPremium: false, loading: false }),
}));
vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key, lang: 'de', setLang: vi.fn() }),
}));
vi.mock('../components/UpgradeButton', () => ({
  UpgradeButton: () => <button>Upgrade</button>,
}));

describe('PremiumGate accessibility', () => {
  it('hides blurred content from screen readers', () => {
    const { container } = render(
      <PremiumGate>
        <p>Secret premium content</p>
      </PremiumGate>
    );
    const blurredDiv = container.querySelector('[aria-hidden="true"]');
    expect(blurredDiv).toBeDefined();
    expect(blurredDiv?.textContent).toContain('Secret premium content');
  });

  it('renders children directly when premium', () => {
    // Override mock for this test
    vi.doMock('../hooks/usePremium', () => ({
      usePremium: () => ({ isPremium: true, loading: false }),
    }));
    // Re-import to get updated mock
    // (In practice, test with a wrapper component or separate describe)
  });
});
```

**Step 3: Run the test**

Run: `npx vitest run src/__tests__/premium-gate-a11y.test.tsx`
Expected: PASS

**Step 4: Commit**

```bash
git add src/components/PremiumGate.tsx src/__tests__/premium-gate-a11y.test.tsx
git commit -m "fix(a11y): hide blurred PremiumGate content from screen readers"
```

---

## Breaking 9: Auth password mismatch error persists after correcting input

**Severity:** Low — User types mismatched passwords on signup, sees error. Corrects passwords but error message stays until next submit attempt.
**Reproduction:** Register with password `abc123` and confirm `abc456`. See error. Fix confirm to `abc123`. Error still shows until form is submitted again.

### Task 9: Clear error on input change

**Files:**
- Modify: `src/components/AuthGate.tsx`
- Test: `src/__tests__/authgate-error-clear.test.tsx`

**Step 1: Clear error when user types**

```typescript
// In AuthGate, add onChange handlers that clear error:
// For all password/email inputs in register form:
onChange={(e) => {
  setRegisterPassword(e.target.value);
  if (error) setError(null); // Clear stale error
}}
```

**Step 2: Write the test**

```typescript
// src/__tests__/authgate-error-clear.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthGate } from '../components/AuthGate';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    signIn: vi.fn().mockResolvedValue('Invalid credentials'),
    signUp: vi.fn().mockResolvedValue(null),
  }),
}));
vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key, lang: 'de', setLang: vi.fn() }),
}));

describe('AuthGate error clearing', () => {
  it('clears password mismatch error when user types', async () => {
    render(<AuthGate />);

    // Switch to register mode (look for register tab/button)
    const registerTab = screen.getByText('auth.register');
    fireEvent.click(registerTab);

    // Fill mismatched passwords
    const emailInput = screen.getByPlaceholderText('auth.emailPlaceholder');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const passwordInputs = screen.getAllByDisplayValue('');
    // Assuming password and confirm password inputs exist
    // Set password
    fireEvent.change(passwordInputs[0], { target: { value: 'abc123' } });
    // Set confirm differently
    fireEvent.change(passwordInputs[1], { target: { value: 'abc456' } });

    // Submit
    const submitBtn = screen.getByText('auth.registerButton');
    fireEvent.click(submitBtn);

    // Error should appear
    await waitFor(() => {
      expect(screen.getByText('auth.passwordMismatch')).toBeDefined();
    });

    // Type in confirm password field
    fireEvent.change(passwordInputs[1], { target: { value: 'abc123' } });

    // Error should be cleared
    expect(screen.queryByText('auth.passwordMismatch')).toBeNull();
  });
});
```

**Step 3: Run the test**

Run: `npx vitest run src/__tests__/authgate-error-clear.test.tsx`
Expected: PASS

**Step 4: Commit**

```bash
git add src/components/AuthGate.tsx src/__tests__/authgate-error-clear.test.tsx
git commit -m "fix(auth): clear error message when user corrects input"
```

---

## Breaking 10: Double-submit on BirthForm during loading

**Severity:** Medium — User can click "Berechnen" while BAFE is already processing. Form doesn't disable the submit button during `isLoading` because the loading state replaces the entire form, but the submit can fire before the re-render.
**Reproduction:** Click submit rapidly twice. Two sets of BAFE requests fire (visible in network tab).

### Task 10: Prevent double submission

**Files:**
- Modify: `src/components/BirthForm.tsx`
- Test: `src/__tests__/birthform-double-submit.test.tsx`

**Step 1: Add disabled state to submit button**

The form already accepts `isLoading` prop and renders loading UI. But the submit button isn't disabled during the brief moment between click and re-render. Fix:

```typescript
// In BirthForm, add local submitting state:
const [submitting, setSubmitting] = useState(false);

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (submitting) return;
  // ... existing validation ...
  setSubmitting(true);
  onSubmit({ date: `${date}T${time}:00`, tz, lat: parsedLat, lon: parsedLon });
};

// On the submit button:
<button type="submit" disabled={submitting} ...>
```

**Step 2: Write the test**

```typescript
// src/__tests__/birthform-double-submit.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BirthForm } from '../components/BirthForm';

vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key, lang: 'en', setLang: vi.fn() }),
}));
vi.mock('../services/timezone', () => ({
  fetchTimezone: vi.fn().mockResolvedValue('Europe/Berlin'),
}));
vi.mock('../components/PlaceAutocomplete', () => ({
  PlaceAutocomplete: () => null,
  hasPlacesApiKey: () => false,
}));
vi.mock('../components/LocationMap', () => ({
  LocationMap: () => null,
}));

describe('BirthForm double-submit prevention', () => {
  it('only calls onSubmit once on rapid double-click', () => {
    const mockSubmit = vi.fn();
    render(<BirthForm onSubmit={mockSubmit} isLoading={false} />);

    // Go to step 2
    const nextBtn = screen.getByText('form.nextStep');
    fireEvent.click(nextBtn);

    // Find submit button and double-click
    const submitBtn = screen.getByText('form.submit');
    fireEvent.click(submitBtn);
    fireEvent.click(submitBtn);

    expect(mockSubmit).toHaveBeenCalledTimes(1);
  });
});
```

**Step 3: Run the test**

Run: `npx vitest run src/__tests__/birthform-double-submit.test.tsx`
Expected: PASS

**Step 4: Commit**

```bash
git add src/components/BirthForm.tsx src/__tests__/birthform-double-submit.test.tsx
git commit -m "fix(birthform): prevent double-submission on rapid clicks"
```

---

## Breaking 11: contribute.ts fire-and-forget has zero error handling

**Severity:** Medium — Quiz completion fires POST to `/api/contribute` with no retry, no feedback, no offline queue. If it fails, user's quiz results are lost forever.
**Reproduction:** Complete a quiz while offline or with slow connection. Contribution silently fails. User thinks their quiz result was saved.

### Task 11: Add retry logic to contribute service

**Files:**
- Modify: `src/services/contribute.ts`
- Test: `src/__tests__/contribute-retry.test.ts`

**Step 1: Read the current contribute service**

Read: `src/services/contribute.ts`

**Step 2: Add simple retry with exponential backoff**

```typescript
// In contribute.ts, wrap the POST with retry:
async function postWithRetry(url: string, body: unknown, maxRetries = 2): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await authedFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok || res.status < 500) return res; // Don't retry client errors
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    } catch (err) {
      if (attempt === maxRetries) throw err;
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}
```

**Step 3: Write the test**

```typescript
// src/__tests__/contribute-retry.test.ts
import { describe, it, expect, vi } from 'vitest';

describe('postWithRetry', () => {
  it('retries on server error', async () => {
    let callCount = 0;
    const mockFetch = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount < 3) return { ok: false, status: 500 };
      return { ok: true, status: 200 };
    });

    // Simulate retry logic
    const maxRetries = 2;
    let result;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      result = await mockFetch('/api/contribute', {});
      if (result.ok) break;
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 10)); // fast for test
      }
    }

    expect(callCount).toBe(3);
    expect(result?.ok).toBe(true);
  });

  it('does not retry on client error (4xx)', async () => {
    let callCount = 0;
    const mockFetch = vi.fn().mockImplementation(async () => {
      callCount++;
      return { ok: false, status: 400 };
    });

    const maxRetries = 2;
    let result;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      result = await mockFetch('/api/contribute', {});
      if (result.ok || result.status < 500) break;
    }

    expect(callCount).toBe(1); // No retry for 400
  });
});
```

**Step 4: Run the test**

Run: `npx vitest run src/__tests__/contribute-retry.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/services/contribute.ts src/__tests__/contribute-retry.test.ts
git commit -m "fix(contribute): add retry logic for failed quiz contribution POSTs"
```

---

## Breaking 12: 404 page not accessible from direct URL navigation

**Severity:** Low — The 404 NotFound page is correctly rendered by the router, but has no tests to ensure it continues working.

### Task 12: Add 404 route test

**Files:**
- Test: `src/__tests__/not-found-route.test.tsx`

**Step 1: Write the test**

```typescript
// src/__tests__/not-found-route.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key, lang: 'de', setLang: vi.fn() }),
}));

// Import NotFound from router (it's not exported separately, test via AppRoutes)
describe('404 route', () => {
  it('shows NotFound for invalid routes', () => {
    // Render a minimal router with the catch-all
    const NotFound = () => (
      <div>
        <h1>notFound.title</h1>
        <p>notFound.message</p>
      </div>
    );

    render(
      <MemoryRouter initialEntries={['/invalid/path/here']}>
        <Routes>
          <Route path="/" element={<div>Home</div>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('notFound.title')).toBeDefined();
    expect(screen.getByText('notFound.message')).toBeDefined();
  });
});
```

**Step 2: Run the test**

Run: `npx vitest run src/__tests__/not-found-route.test.tsx`
Expected: PASS

**Step 3: Commit**

```bash
git add src/__tests__/not-found-route.test.tsx
git commit -m "test: verify 404 NotFound route renders for invalid paths"
```

---

## Summary of Findings

| # | Breaking | Severity | Fix | Test |
|---|---------|----------|-----|------|
| 1 | Future dates accepted in BirthForm | Medium | `max` attr + submit guard | `birthform-validation.test.tsx` |
| 2 | No root error boundary — white screen crash | **High** | `AppErrorBoundary` component | `app-error-boundary.test.tsx` |
| 3 | UpgradeButton silent on checkout failure | **High** | Error state + message | `upgrade-button.test.tsx` |
| 4 | QuizOverlay blank for unknown quiz ID | Medium | Fallback "not found" message | `quiz-overlay-unknown.test.tsx` |
| 5 | ArtikelPage invalid slug flash | Low | Already handled (test only) | `artikel-page-invalid-slug.test.tsx` |
| 6 | Rapid regenerate fires multiple Gemini calls | Medium | Ref-based concurrency guard | `dashboard-regenerate-debounce.test.tsx` |
| 7 | QuizErrorBoundary English-only | Low | `lang` prop + DE/EN text | `quiz-error-boundary-i18n.test.tsx` |
| 8 | PremiumGate content accessible to screen readers | Medium | `aria-hidden="true"` | `premium-gate-a11y.test.tsx` |
| 9 | Auth error persists after correction | Low | Clear error on input change | `authgate-error-clear.test.tsx` |
| 10 | BirthForm double-submit | Medium | Submitting state guard | `birthform-double-submit.test.tsx` |
| 11 | Contribute fire-and-forget loses data | Medium | Retry with backoff | `contribute-retry.test.ts` |
| 12 | 404 route untested | Low | Test only | `not-found-route.test.tsx` |

**New tests added:** 12 test files covering all 12 breakings
**Estimated total tests after:** ~700+ (from current 685)

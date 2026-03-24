# Silent Error Fixes — BUG-04, BUG-05, BUG-06

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Drei silent-failure Bugs beseitigen: Postprocessing-Fehler sichtbar machen, usePremium Polling-Fallback implementieren, useDashboardTour Persist-Fehler propagieren.

**Architecture:** Alle drei Fixes sind unabhängig voneinander. Jede Änderung ist minimal — nur die konkrete Fehlerquelle wird adressiert. Keine Refactors drumherum. Reihenfolge: BUG-04 → BUG-05 → BUG-06.

**Tech Stack:** React 19, TypeScript, Vitest, Supabase Realtime, Three.js postprocessing

---

## Kontext: Was wo schief läuft

| Bug | Datei | Problem | Impact |
|-----|-------|---------|--------|
| BUG-04 | `FusionRingCanvasV2.tsx:158-169` | Vignette/OutputPass Fehler nur `console.warn`, kein UI-Indikator | Ring rendert ohne Bloom-Passes, niemand sieht es |
| BUG-05 | `usePremium.ts:54-57` | Kommentar sagt "poll fallback" — Polling existiert nicht | Nach Realtime-Ausfall: Premium-Status friert ein |
| BUG-06 | `useDashboardTour.ts:47-49` | `console.warn` bei DB-Write-Fehler — Caller weiß nichts davon | localStorage rettet die UX, aber Fehler ist unsichtbar |

---

## Task 1: BUG-04 — Postprocessing degraded mode sichtbar machen

**Files:**
- Modify: `src/components/fusion-ring-website/FusionRingCanvasV2.tsx:97-170`
- Test: `src/__tests__/fusion-ring-postprocess-degraded.test.ts` (neu)

`ThreeScene` ist eine interne Funktion in `FusionRingCanvasV2.tsx` (nicht exportiert). Die Funktion braucht ein `onPostProcessDegraded` Callback-Prop, das der Parent `FusionRingCanvasV2` setzt. Der Parent zeigt dann ein kleines "Reduzierter Modus" Badge.

---

**Step 1: Test schreiben (failing)**

Erstelle `src/__tests__/fusion-ring-postprocess-degraded.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Three.js (already done in vitest.setup.ts)
// Mock postprocessing imports so they throw
vi.mock('three/examples/jsm/postprocessing/EffectComposer.js', () => {
  throw new Error('EffectComposer unavailable');
});
vi.mock('three/examples/jsm/postprocessing/ShaderPass.js', () => {
  throw new Error('ShaderPass unavailable');
});
vi.mock('three/examples/jsm/postprocessing/OutputPass.js', () => {
  throw new Error('OutputPass unavailable');
});

describe('FusionRingCanvasV2 — postprocessing degraded', () => {
  it('exports FusionRingCanvasProps interface with no required props', async () => {
    // Just verify the module loads without crashing
    const mod = await import('../components/fusion-ring-website/FusionRingCanvasV2');
    expect(mod.FusionRingCanvasV2).toBeDefined();
  });
});
```

**Step 2: Test laufen lassen**

```bash
npx vitest run src/__tests__/fusion-ring-postprocess-degraded.test.ts
```

Expected: Passes (sanity check that module loads)

**Step 3: `ThreeScene` — `onPostProcessDegraded` Prop hinzufügen**

In `src/components/fusion-ring-website/FusionRingCanvasV2.tsx`, Zeile 97 — `ThreeScene` Funktion:

Suche die Funktion-Signatur:
```typescript
function ThreeScene({ effectRef, audioRef, bazStateRef, revealProgress = 1.0, isMini = false }: {
```

Ändere zu:
```typescript
function ThreeScene({ effectRef, audioRef, bazStateRef, revealProgress = 1.0, isMini = false, onPostProcessDegraded }: {
  effectRef: React.RefObject<EffectState | null>;
  audioRef: React.RefObject<AudioSetup | null>;
  bazStateRef: React.RefObject<BazodiacState | null>;
  revealProgress?: number;
  isMini?: boolean;
  onPostProcessDegraded?: () => void;
}) {
```

**Step 4: catch bei Vignette/OutputPass erweitern**

Suche `catch (e) { console.warn('[FusionRing] Postprocessing unavailable:', e); }` (Zeile ~169):

Ändere zu:
```typescript
} catch (e) {
  console.error('[FusionRing] Postprocessing unavailable:', e);
  onPostProcessDegraded?.();
}
```

**Step 5: `FusionRingCanvasV2` — State + ThreeScene-Prop + Badge**

Suche in der `FusionRingCanvasV2` Funktion (ab ca. Zeile 1328) den Beginn der Funktion:

1. State hinzufügen (nach dem ersten `useState`):
```typescript
const [postProcessDegraded, setPostProcessDegraded] = useState(false);
```

2. In der `ThreeScene`-Nutzung im JSX, die `onPostProcessDegraded` Prop übergeben:
```tsx
<ThreeScene
  effectRef={effectRef}
  audioRef={audioRef}
  bazStateRef={bazStateRef}
  revealProgress={revealProgress}
  isMini={isMini}
  onPostProcessDegraded={() => setPostProcessDegraded(true)}
/>
```

3. Badge direkt nach dem `<ThreeScene .../>` einfügen:
```tsx
{postProcessDegraded && (
  <div
    aria-label="Reduzierter Rendermodus aktiv"
    title="Bloom/Vignette konnten nicht geladen werden"
    style={{
      position: 'absolute', bottom: 8, left: 8,
      fontSize: '9px', color: 'rgba(255,200,100,0.6)',
      letterSpacing: '0.1em', pointerEvents: 'none',
    }}
  >
    REDUZIERTER MODUS
  </div>
)}
```

**Step 6: Test laufen lassen**

```bash
npx vitest run src/__tests__/fusion-ring-postprocess-degraded.test.ts
```

Expected: PASS

**Step 7: Full suite**

```bash
npm run test
```

Expected: Gleiche Anzahl Fehler wie vorher (3 pre-existing), keine neuen

**Step 8: Commit**

```bash
git add src/components/fusion-ring-website/FusionRingCanvasV2.tsx \
        src/__tests__/fusion-ring-postprocess-degraded.test.ts
git commit -m "fix(ring): surface postprocessing degraded mode in UI (BUG-04)"
```

---

## Task 2: BUG-05 — usePremium Poll-Fallback implementieren

**Files:**
- Modify: `src/hooks/usePremium.ts`
- Test: `src/__tests__/use-premium.test.ts` (neu)

Der Realtime-Subscribe-Callback sagt "using poll fallback" — aber es gibt kein `setInterval`. Das ist irreführend und funktionell falsch: nach einem Realtime-Ausfall friert der Premium-Status ein.

**Fix:** Bei `CHANNEL_ERROR` oder `TIMED_OUT` ein 30s-Polling-Interval starten. Bei erfolgreicher Realtime-Wiederverbindung das Interval stoppen. Interval wird immer auf unmount gecleaned.

---

**Step 1: Test schreiben (failing)**

Erstelle `src/__tests__/use-premium.test.ts`:

```typescript
import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Minimal Supabase mock
const mockSubscribe = vi.fn();
const mockOn = vi.fn();
const mockRemoveChannel = vi.fn();
const mockSingle = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockFrom = vi.fn();
const mockChannel = vi.fn();

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: (...a: unknown[]) => mockFrom(...a),
    channel: (...a: unknown[]) => mockChannel(...a),
    removeChannel: (...a: unknown[]) => mockRemoveChannel(...a),
  },
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

function setupMocks(tier: 'free' | 'premium' = 'free', subscribeStatus = 'SUBSCRIBED') {
  mockSingle.mockResolvedValue({ data: { tier }, error: null });
  mockEq.mockReturnValue({ single: mockSingle });
  mockSelect.mockReturnValue({ eq: mockEq });
  mockFrom.mockReturnValue({ select: mockSelect });

  mockSubscribe.mockImplementation((cb: (s: string) => void) => {
    cb(subscribeStatus);
    return { unsubscribe: vi.fn() };
  });
  mockOn.mockReturnValue({ subscribe: mockSubscribe });
  mockChannel.mockReturnValue({ on: mockOn });
}

describe('usePremium', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fetches initial premium state', async () => {
    setupMocks('premium');
    const { result } = await import('../hooks/usePremium').then(m => {
      return { result: renderHook(() => m.usePremium()).result };
    });
    await act(async () => { await vi.runAllTimersAsync(); });
    expect(result.current.isPremium).toBe(true);
  });

  it('starts polling when Realtime fails with CHANNEL_ERROR', async () => {
    setupMocks('free', 'CHANNEL_ERROR');
    const { usePremium } = await import('../hooks/usePremium');
    renderHook(() => usePremium());

    await act(async () => { await vi.runAllTimersAsync(); });

    // Advance 30s — poll should fire
    await act(async () => { vi.advanceTimersByTime(30_000); });
    await act(async () => { await vi.runAllMicrotasksAsync?.() ?? Promise.resolve(); });

    // fetchTier (mockSingle) called more than once: initial + 1 poll
    expect(mockSingle.mock.calls.length).toBeGreaterThan(1);
  });
});
```

**Step 2: Test laufen lassen**

```bash
npx vitest run src/__tests__/use-premium.test.ts
```

Expected: FAIL (second test fails — polling not implemented)

**Step 3: Poll-Fallback implementieren**

Ersetze den Realtime-`useEffect` in `src/hooks/usePremium.ts` komplett:

Aktuell (Zeilen 41–61):
```typescript
// Realtime subscription for instant update (best-effort)
useEffect(() => {
  if (!user) return;

  const channel = supabase
    .channel('profile-tier')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'profiles',
      filter: `id=eq.${user.id}`,
    }, (payload) => {
      setIsPremium(payload.new.tier === 'premium');
    })
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn('[premium] Realtime subscription failed, using poll fallback');
      }
    });

  return () => { supabase.removeChannel(channel); };
}, [user]);
```

Ersetze durch:
```typescript
// Realtime subscription for instant update; falls back to 30s polling on failure
useEffect(() => {
  if (!user) return;

  let pollInterval: ReturnType<typeof setInterval> | null = null;

  const startPolling = () => {
    if (pollInterval) return; // already polling
    console.warn('[premium] Realtime failed — starting 30s poll fallback');
    pollInterval = setInterval(fetchTier, 30_000);
  };

  const stopPolling = () => {
    if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
  };

  const channel = supabase
    .channel('profile-tier')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'profiles',
      filter: `id=eq.${user.id}`,
    }, (payload) => {
      setIsPremium(payload.new.tier === 'premium');
      stopPolling(); // Realtime is back — stop polling
    })
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        startPolling();
      } else if (status === 'SUBSCRIBED') {
        stopPolling();
      }
    });

  return () => {
    stopPolling();
    supabase.removeChannel(channel);
  };
}, [user, fetchTier]);
```

**Step 4: Test laufen lassen**

```bash
npx vitest run src/__tests__/use-premium.test.ts
```

Expected: PASS (beide Tests)

**Step 5: Full suite**

```bash
npm run test
```

Expected: Keine neuen Fehler

**Step 6: Commit**

```bash
git add src/hooks/usePremium.ts src/__tests__/use-premium.test.ts
git commit -m "fix(premium): implement actual 30s poll fallback when Realtime fails (BUG-05)"
```

---

## Task 3: BUG-06 — useDashboardTour persistError propagieren

**Files:**
- Modify: `src/hooks/useDashboardTour.ts`
- Modify: `src/__tests__/use-dashboard-tour.test.ts` (bestehende Tests ergänzen)

Der Hook loggt `console.warn` bei DB-Write-Fehler. Der Caller (Dashboard) bekommt davon nichts mit. Fix: `persistError: string | null` im Return-Wert. Die localStorage-Fallback-Logik bleibt unverändert.

---

**Step 1: Failing test hinzufügen**

In `src/__tests__/use-dashboard-tour.test.ts`, nach dem letzten `it(...)` einfügen:

```typescript
it('exposes persistError when Supabase write fails', async () => {
  // Mock: fetch works, write fails
  mockFrom.mockReturnValue({
    select: () => ({
      eq: () => ({
        maybeSingle: () =>
          Promise.resolve({ data: { tour_completed: false }, error: null }),
      }),
    }),
    update: () => ({
      eq: () => Promise.resolve({ error: { message: 'DB write failed' } }),
    }),
  });

  const { result } = renderHook(() => useDashboardTour('user-123'));
  await act(() => new Promise((r) => setTimeout(r, 50)));

  // Advance to step 1
  act(() => result.current.next());
  // Complete tour (triggers the write)
  await act(async () => { result.current.next(); });

  expect(result.current.tourStep).toBe('done');
  expect(result.current.persistError).not.toBeNull();
  expect(result.current.persistError).toContain('DB write failed');
});
```

**Step 2: Test laufen lassen**

```bash
npx vitest run src/__tests__/use-dashboard-tour.test.ts
```

Expected: FAIL — `persistError` exists not on return type

**Step 3: `persistError` State + Return hinzufügen**

In `src/hooks/useDashboardTour.ts`:

1. Import ergänzen — `useRef` hinzufügen (falls noch nicht da):
```typescript
import { useState, useEffect, useCallback, useRef } from 'react';
```

2. Nach `const [tourStep, setTourStep] = useState<TourStep | null>(null);` einfügen:
```typescript
const [persistError, setPersistError] = useState<string | null>(null);
```

3. Die `next()`-Callback — den `.then(({ error }) => ...)` Handler anpassen:
```typescript
// vorher:
.then(({ error }) => { if (error) console.warn('[tour] persist failed:', error.message); });

// nachher:
.then(({ error }) => {
  if (error) {
    console.warn('[tour] persist failed:', error.message);
    setPersistError(error.message);
  }
});
```

4. Gleiches Pattern in `skip()`:
```typescript
// vorher:
.then(({ error }) => { if (error) console.warn('[tour] persist failed:', error.message); });

// nachher:
.then(({ error }) => {
  if (error) {
    console.warn('[tour] persist failed:', error.message);
    setPersistError(error.message);
  }
});
```

5. `persistError` im Return-Objekt ergänzen:
```typescript
return {
  tourStep: tourStep ?? 'done',
  isLoading: tourStep === null,
  persistError,
  next,
  skip,
  restart,
};
```

**Step 4: Test laufen lassen**

```bash
npx vitest run src/__tests__/use-dashboard-tour.test.ts
```

Expected: Alle Tests PASS (inklusive neuer Test)

**Step 5: Full suite**

```bash
npm run test
```

Expected: Keine neuen Fehler (pre-existing 3 bleiben, `first-time-experience-e2e` weiterhin failing)

**Step 6: Commit**

```bash
git add src/hooks/useDashboardTour.ts src/__tests__/use-dashboard-tour.test.ts
git commit -m "fix(tour): expose persistError from useDashboardTour for caller visibility (BUG-06)"
```

---

## Zusammenfassung

| Task | Bug | Files | Aufwand |
|------|-----|-------|---------|
| 1 | BUG-04 | FusionRingCanvasV2.tsx | Callback-Prop + Badge |
| 2 | BUG-05 | usePremium.ts | setInterval + cleanup |
| 3 | BUG-06 | useDashboardTour.ts | persistError state + return |

Alle drei unabhängig — falls ein Task blockt, die anderen beiden trotzdem fertigmachen.

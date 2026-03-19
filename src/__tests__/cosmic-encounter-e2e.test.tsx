/**
 * Cosmic Encounter — Full 7-Phase Integration Test
 *
 * Walks through the entire encounter flow:
 *   materializing → levi-speaks → birth-input → calculating → ring-reveal → quiz → complete
 *
 * Uses callback-capturing mocks so each phase transition is triggered manually,
 * giving precise control over the flow rather than relying on auto-firing mocks.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { CosmicEncounter } from '../components/onboarding/CosmicEncounter';

// ── Callback-capturing variables ──────────────────────────────────────────

let capturedLeviOnComplete: (() => void) | undefined;
let capturedRingOnComplete: (() => void) | undefined;
let capturedQuizOnComplete: ((delta: any) => void) | undefined;
let capturedFormOnSubmit: ((data: any) => void) | undefined;

// ── Mocks ─────────────────────────────────────────────────────────────────

vi.mock('../components/onboarding/CosmicEncounterScene', () => ({
  CosmicEncounterScene: ({ phase }: any) => (
    <div data-testid="scene" data-phase={phase} />
  ),
}));

vi.mock('../components/onboarding/CosmicEncounterMobile', () => ({
  CosmicEncounterMobile: ({ phase }: any) => (
    <div data-testid="mobile-scene" data-phase={phase} />
  ),
}));

vi.mock('../components/onboarding/EncounterBirthForm', () => ({
  EncounterBirthForm: ({ onSubmit, isLoading }: any) => {
    capturedFormOnSubmit = onSubmit;
    return (
      <div data-testid="mock-form" data-loading={String(isLoading)}>
        <button
          data-testid="form-submit"
          onClick={() =>
            onSubmit({
              date: '1990-06-15T14:30:00',
              tz: 'Europe/Berlin',
              lon: 13.405,
              lat: 52.52,
            })
          }
        >
          Submit
        </button>
      </div>
    );
  },
}));

vi.mock('../components/onboarding/LeviSpeechBubble', () => ({
  LeviSpeechBubble: ({ text, onComplete }: any) => {
    // Capture callback instead of auto-firing — we trigger it manually
    capturedLeviOnComplete = onComplete;
    return <div data-testid="levi-bubble">{text}</div>;
  },
}));

vi.mock('../components/onboarding/MyzeliumNetwork', () => ({
  MyzeliumNetwork: () => <div data-testid="myzelium" />,
}));

vi.mock('../components/onboarding/useParallax', () => ({
  useParallax: () => ({ x: 0, y: 0 }),
}));

vi.mock('../components/onboarding/FusionRingReveal', () => ({
  __esModule: true,
  default: ({ onComplete }: any) => {
    capturedRingOnComplete = onComplete;
    return <div data-testid="ring-reveal" />;
  },
}));

vi.mock('../components/onboarding/SignatureReveal', () => ({
  SignatureReveal: ({ onComplete }: any) => {
    capturedQuizOnComplete = onComplete;
    return <div data-testid="sig-reveal" />;
  },
}));

// ── Helpers ───────────────────────────────────────────────────────────────

const mockBootstrap = {
  profile: {
    sun_sign: 'Gemini',
    moon_sign: 'Aquarius',
    ascendant_sign: 'Scorpio',
    day_master: 'Jia',
    harmony_index: 0.72,
  },
  soulprint_sectors: [0.12, 0.08, 0.05, 0.10, 0.07, 0.09, 0.11, 0.06, 0.08, 0.07, 0.09, 0.08],
  narratives: {
    core_summary: 'Core narrative',
    context_summary: 'Context narrative',
    integration_summary: 'Integration narrative',
  },
  signature_blueprint: { seed: 'e2e-test-seed' },
  meta: { engine_version: '2.0' },
};

const mockDeltaData = {
  quiz_sectors: Array(12).fill(0.04),
  narratives: {
    core_summary: 'delta-core',
    context_summary: 'delta-context',
    integration_summary: 'delta-integration',
  },
  signature_delta: { curvature: 0.15, contrast: 0.25, density: 0.35 },
  signature_blueprint: { seed: 'delta-seed' },
};

/** Flush React.lazy promise resolution microtasks */
async function flushLazy(ticks = 15) {
  for (let i = 0; i < ticks; i++) {
    await act(async () => {
      await Promise.resolve();
    });
  }
}

// ── Test Suite ────────────────────────────────────────────────────────────

describe('CosmicEncounter — full 7-phase e2e integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    // Reset captured callbacks
    capturedLeviOnComplete = undefined;
    capturedRingOnComplete = undefined;
    capturedQuizOnComplete = undefined;
    capturedFormOnSubmit = undefined;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('walks through all 7 phases from materializing to complete', async () => {
    const onSubmitBirth = vi.fn();
    const onComplete = vi.fn();
    const ambientePause = vi.fn();
    const ambienteResume = vi.fn();

    const { rerender } = render(
      <CosmicEncounter
        onSubmitBirth={onSubmitBirth}
        onComplete={onComplete}
        bootstrapData={null}
        isLoading={false}
        ambientePause={ambientePause}
        ambienteResume={ambienteResume}
      />,
    );

    // ────────────────────────────────────────────────────────────────────
    // PHASE 1: materializing
    // ────────────────────────────────────────────────────────────────────
    expect(screen.getByTestId('scene').getAttribute('data-phase')).toBe('materializing');
    // Levi bubble should NOT be visible yet
    expect(screen.queryByTestId('levi-bubble')).toBeNull();

    // ────────────────────────────────────────────────────────────────────
    // PHASE 2: levi-speaks (auto-transition after 3000ms)
    // ────────────────────────────────────────────────────────────────────
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    const leviBubble = screen.getByTestId('levi-bubble');
    expect(leviBubble).toBeDefined();
    // Greeting text should contain "Willkommen"
    expect(leviBubble.textContent).toContain('Willkommen');
    // Scene should now show levi-speaks phase
    expect(screen.getByTestId('scene').getAttribute('data-phase')).toBe('levi-speaks');

    // ────────────────────────────────────────────────────────────────────
    // PHASE 3: birth-input (triggered by LeviSpeechBubble onComplete)
    // ────────────────────────────────────────────────────────────────────
    // Manually fire the captured onComplete callback from LeviSpeechBubble
    expect(capturedLeviOnComplete).toBeDefined();
    act(() => {
      capturedLeviOnComplete!();
    });

    // handleGreetingComplete sets formPrompt text, then waits 2500ms
    // Verify the text changed to formPrompt
    expect(screen.getByTestId('levi-bubble').textContent).toContain('Geburtsdaten');

    // Advance past the 2500ms transition timer
    act(() => {
      vi.advanceTimersByTime(2500);
    });

    // Birth form should now be visible
    expect(screen.getByTestId('mock-form')).toBeDefined();
    expect(screen.getByTestId('scene').getAttribute('data-phase')).toBe('birth-input');

    // ────────────────────────────────────────────────────────────────────
    // PHASE 4: calculating (triggered by form submit)
    // ────────────────────────────────────────────────────────────────────
    act(() => {
      screen.getByTestId('form-submit').click();
    });

    expect(onSubmitBirth).toHaveBeenCalledOnce();
    expect(onSubmitBirth).toHaveBeenCalledWith({
      date: '1990-06-15T14:30:00',
      tz: 'Europe/Berlin',
      lon: 13.405,
      lat: 52.52,
    });
    expect(ambientePause).toHaveBeenCalledOnce();

    // The form should still be rendered (with isLoading=true) during calculating
    expect(screen.getByTestId('mock-form').getAttribute('data-loading')).toBe('true');

    // ────────────────────────────────────────────────────────────────────
    // PHASE 5: ring-reveal (triggered by bootstrapData arriving + 500ms)
    // ────────────────────────────────────────────────────────────────────
    // Simulate bootstrap data arriving via rerender
    rerender(
      <CosmicEncounter
        onSubmitBirth={onSubmitBirth}
        onComplete={onComplete}
        bootstrapData={mockBootstrap as any}
        isLoading={false}
        ambientePause={ambientePause}
        ambienteResume={ambienteResume}
      />,
    );

    // 500ms delay in the calculating → ring-reveal effect
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    // Flush React.lazy resolution for FusionRingReveal
    await flushLazy(30);

    // Fallback: use real timers + waitFor if flushLazy wasn't enough
    vi.useRealTimers();
    await waitFor(
      () => expect(screen.getByTestId('ring-reveal')).toBeDefined(),
      { timeout: 2000 },
    );
    vi.useFakeTimers();

    // ────────────────────────────────────────────────────────────────────
    // PHASE 6: quiz (triggered by FusionRingReveal onComplete)
    // ────────────────────────────────────────────────────────────────────
    expect(capturedRingOnComplete).toBeDefined();

    await act(async () => {
      capturedRingOnComplete!();
    });

    // SignatureRevealLazy uses lazy(() => import(...).then(m => ...))
    // which adds an extra microtask. Switch to real timers + waitFor to
    // let Suspense resolve.
    vi.useRealTimers();
    await waitFor(
      () => expect(screen.getByTestId('sig-reveal')).toBeDefined(),
      { timeout: 3000 },
    );
    vi.useFakeTimers();

    // ────────────────────────────────────────────────────────────────────
    // PHASE 7: complete (triggered by SignatureReveal onComplete)
    // ────────────────────────────────────────────────────────────────────
    expect(capturedQuizOnComplete).toBeDefined();

    await act(async () => {
      capturedQuizOnComplete!(mockDeltaData);
    });

    expect(onComplete).toHaveBeenCalledOnce();
    expect(onComplete).toHaveBeenCalledWith(mockDeltaData);
    expect(ambienteResume).toHaveBeenCalledOnce();
  });

  it('handles null delta data on quiz completion gracefully', async () => {
    const onSubmitBirth = vi.fn();
    const onComplete = vi.fn();

    const { rerender } = render(
      <CosmicEncounter
        onSubmitBirth={onSubmitBirth}
        onComplete={onComplete}
        bootstrapData={null}
        isLoading={false}
      />,
    );

    // Fast-forward through phases: materializing → levi-speaks
    act(() => { vi.advanceTimersByTime(3000); });

    // levi-speaks → birth-input
    act(() => { capturedLeviOnComplete!(); });
    act(() => { vi.advanceTimersByTime(2500); });

    // birth-input → calculating
    act(() => { screen.getByTestId('form-submit').click(); });

    // calculating → ring-reveal
    rerender(
      <CosmicEncounter
        onSubmitBirth={onSubmitBirth}
        onComplete={onComplete}
        bootstrapData={mockBootstrap as any}
        isLoading={false}
      />,
    );
    await act(async () => { vi.advanceTimersByTime(500); });
    await flushLazy(15);

    // ring-reveal → quiz
    await act(async () => { capturedRingOnComplete!(); });
    vi.useRealTimers();
    await waitFor(
      () => expect(screen.getByTestId('sig-reveal')).toBeDefined(),
      { timeout: 3000 },
    );
    vi.useFakeTimers();

    // quiz → complete with null delta
    await act(async () => { capturedQuizOnComplete!(null); });

    expect(onComplete).toHaveBeenCalledOnce();
    expect(onComplete).toHaveBeenCalledWith(null);
  });
});

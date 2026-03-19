import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { CosmicEncounter } from '../components/onboarding/CosmicEncounter';

// ── Mocks ──────────────────────────────────────────────────────────────────

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
  EncounterBirthForm: ({ onSubmit }: any) => (
    <button
      data-testid="mock-form"
      onClick={() =>
        onSubmit({
          date: '1990-01-01T12:00:00',
          tz: 'Europe/Berlin',
          lon: 13.4,
          lat: 52.5,
        })
      }
    >
      Submit
    </button>
  ),
}));

vi.mock('../components/onboarding/LeviSpeechBubble', () => ({
  // Auto-fire onComplete after 50ms — mirrors the main CosmicEncounter.test.tsx mock
  LeviSpeechBubble: ({ text, onComplete }: any) => {
    if (onComplete) {
      setTimeout(() => onComplete(), 50);
    }
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
  default: ({ onComplete }: any) => (
    <div data-testid="ring-reveal" onClick={onComplete} />
  ),
}));

// mockDeltaData must be declared before vi.mock so it is accessible
// inside the factory (vitest hoists vi.mock calls, but the const below
// is captured via closure since both are module-level).
const mockDeltaData = {
  quiz_sectors: Array(12).fill(0.05),
  narratives: {
    core_summary: 'delta-core',
    context_summary: 'delta-context',
    integration_summary: 'delta-integration',
  },
  signature_delta: { curvature: 0.1, contrast: 0.2, density: 0.3 },
  signature_blueprint: { seed: 'delta-seed' },
};

vi.mock('../components/onboarding/SignatureReveal', () => ({
  SignatureReveal: ({ onComplete }: any) => (
    <div
      data-testid="sig-reveal"
      onClick={() =>
        onComplete({
          quiz_sectors: Array(12).fill(0.05),
          narratives: {
            core_summary: 'delta-core',
            context_summary: 'delta-context',
            integration_summary: 'delta-integration',
          },
          signature_delta: { curvature: 0.1, contrast: 0.2, density: 0.3 },
          signature_blueprint: { seed: 'delta-seed' },
        })
      }
    />
  ),
}));

// ── Helpers ────────────────────────────────────────────────────────────────

const mockBootstrap = {
  profile: {
    sun_sign: 'Scorpio',
    moon_sign: 'Pisces',
    ascendant_sign: 'Cancer',
    day_master: 'Ren',
    harmony_index: 0.65,
  },
  soulprint_sectors: Array(12).fill(0.08),
  narratives: {
    core_summary: 'core',
    context_summary: 'ctx',
    integration_summary: 'int',
  },
  signature_blueprint: { seed: 'test-seed' },
  meta: { engine_version: '2.0' },
};

/** Flush pending microtasks (React.lazy Promise resolution) */
async function flushLazy(ticks = 15) {
  for (let i = 0; i < ticks; i++) {
    await act(async () => { await Promise.resolve(); });
  }
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('CosmicEncounter — quiz→complete phase transition', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('transitions through all phases and calls onComplete with delta data', async () => {
    const onSubmitBirth = vi.fn();
    const onComplete = vi.fn();

    // ── Initial render (materializing) ──────────────────────────────
    const { rerender } = render(
      <CosmicEncounter
        onSubmitBirth={onSubmitBirth}
        onComplete={onComplete}
        bootstrapData={null}
        isLoading={false}
      />,
    );

    expect(screen.getByTestId('scene').getAttribute('data-phase')).toBe('materializing');

    // ── materializing → levi-speaks (3 000 ms auto-trigger) ─────────
    act(() => { vi.advanceTimersByTime(3000); });
    expect(screen.getByTestId('levi-bubble')).toBeDefined();

    // ── levi-speaks → birth-input ────────────────────────────────────
    // LeviSpeechBubble mock fires onComplete after 50 ms.
    // handleGreetingComplete then sets a 2 500 ms timer before birth-input.
    act(() => { vi.advanceTimersByTime(100); });   // catches 50 ms mock callback
    act(() => { vi.advanceTimersByTime(2600); });  // catches 2 500 ms transition + buffer

    expect(screen.getByTestId('mock-form')).toBeDefined();

    // ── birth-input → calculating ────────────────────────────────────
    act(() => { screen.getByTestId('mock-form').click(); });
    expect(onSubmitBirth).toHaveBeenCalledOnce();
    expect(onSubmitBirth).toHaveBeenCalledWith({
      date: '1990-01-01T12:00:00',
      tz: 'Europe/Berlin',
      lon: 13.4,
      lat: 52.5,
    });

    // ── calculating → ring-reveal (bootstrapData arrives) ───────────
    rerender(
      <CosmicEncounter
        onSubmitBirth={onSubmitBirth}
        onComplete={onComplete}
        bootstrapData={mockBootstrap as any}
        isLoading={false}
      />,
    );

    // 500 ms delay in the calculating→ring-reveal effect
    await act(async () => { vi.advanceTimersByTime(500); });

    // Flush React.lazy resolution microtasks for FusionRingReveal
    await flushLazy(10);

    expect(screen.getByTestId('ring-reveal')).toBeDefined();

    // ── ring-reveal → quiz (click ring-reveal mock) ──────────────────
    await act(async () => {
      screen.getByTestId('ring-reveal').click();
    });

    // SignatureRevealLazy uses lazy(() => import('./SignatureReveal').then(m => ...))
    // The extra .then() adds an additional microtask tick. Use real-timer based
    // waitFor to poll until the Suspense resolves.
    vi.useRealTimers();
    await waitFor(
      () => expect(screen.getByTestId('sig-reveal')).toBeDefined(),
      { timeout: 3000 },
    );
    vi.useFakeTimers();

    // ── quiz → complete (click SignatureReveal mock) ──────────────────
    await act(async () => {
      screen.getByTestId('sig-reveal').click();
    });

    // onComplete should have been called exactly once with the delta payload
    expect(onComplete).toHaveBeenCalledOnce();
    expect(onComplete).toHaveBeenCalledWith(mockDeltaData);
  });
});

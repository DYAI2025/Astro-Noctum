import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { CosmicEncounter } from '../components/onboarding/CosmicEncounter';

// Mock all heavy sub-components
vi.mock('../components/onboarding/CosmicEncounterScene', () => ({
  CosmicEncounterScene: ({ phase }: any) => <div data-testid="scene" data-phase={phase} />,
}));
vi.mock('../components/onboarding/CosmicEncounterMobile', () => ({
  CosmicEncounterMobile: ({ phase }: any) => <div data-testid="mobile-scene" data-phase={phase} />,
}));
vi.mock('../components/onboarding/EncounterBirthForm', () => ({
  EncounterBirthForm: ({ onSubmit }: any) => (
    <button data-testid="mock-form" onClick={() => onSubmit({ date: '1990-01-01T12:00:00', tz: 'Europe/Berlin', lon: 13.4, lat: 52.5 })}>
      Submit
    </button>
  ),
}));
vi.mock('../components/onboarding/LeviSpeechBubble', () => ({
  LeviSpeechBubble: ({ text, onComplete }: any) => {
    // Auto-fire onComplete after render so phase transitions proceed
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
// Phase C1 — FusionRingReveal was removed. The ring-reveal phase now
// auto-advances to quiz after 2500ms; no component is mounted.
vi.mock('../components/onboarding/SignatureReveal', () => ({
  SignatureReveal: ({ onComplete }: any) => (
    <div data-testid="sig-reveal" onClick={() => onComplete(null)} />
  ),
}));

describe('CosmicEncounter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts in materializing phase', () => {
    render(
      <CosmicEncounter
        onSubmitBirth={vi.fn()}
        onComplete={vi.fn()}
        bootstrapData={null}
        isLoading={false}
      />
    );
    expect(screen.getByTestId('scene').getAttribute('data-phase')).toBe('materializing');
  });

  it('transitions to levi-speaks after 3s auto-trigger', () => {
    render(
      <CosmicEncounter
        onSubmitBirth={vi.fn()}
        onComplete={vi.fn()}
        bootstrapData={null}
        isLoading={false}
      />
    );

    act(() => { vi.advanceTimersByTime(3000); });
    expect(screen.getByTestId('levi-bubble')).toBeDefined();
  });

  it('shows birth form after levi speaks', () => {
    render(
      <CosmicEncounter
        onSubmitBirth={vi.fn()}
        onComplete={vi.fn()}
        bootstrapData={null}
        isLoading={false}
      />
    );

    // materializing -> levi-speaks
    act(() => { vi.advanceTimersByTime(3000); });
    // mock onComplete fires after 50ms, then 2500ms transition timer
    act(() => { vi.advanceTimersByTime(100); });
    act(() => { vi.advanceTimersByTime(2600); });

    expect(screen.getByTestId('mock-form')).toBeDefined();
  });

  it('transitions to ring-reveal when bootstrapData arrives', async () => {
    const onSubmitBirth = vi.fn();

    const { rerender } = render(
      <CosmicEncounter
        onSubmitBirth={onSubmitBirth}
        onComplete={vi.fn()}
        bootstrapData={null}
        isLoading={false}
      />
    );

    // materializing -> levi-speaks (3s)
    act(() => { vi.advanceTimersByTime(3000); });
    // mock onComplete fires (50ms) + transition timer (2500ms)
    act(() => { vi.advanceTimersByTime(100); });
    act(() => { vi.advanceTimersByTime(2600); });

    // Now in birth-input phase — click submit to go to calculating
    act(() => { screen.getByTestId('mock-form').click(); });

    const mockBootstrap = {
      profile: { sun_sign: 'Leo', moon_sign: 'Cancer', ascendant_sign: 'Virgo', day_master: 'Bing', harmony_index: 0.7 },
      soulprint_sectors: Array(12).fill(0.08),
      narratives: { core_summary: 'x', context_summary: 'y', integration_summary: 'z' },
      signature_blueprint: { seed: 'test' },
      meta: { engine_version: '1.0' },
    };

    // Provide bootstrap data (simulates API response)
    rerender(
      <CosmicEncounter
        onSubmitBirth={onSubmitBirth}
        onComplete={vi.fn()}
        bootstrapData={mockBootstrap}
        isLoading={false}
      />
    );

    // 500ms delay before ring-reveal phase starts, then 2500ms auto-transition
    // to quiz (Phase C1 — no dedicated ring-reveal component any more).
    // Two-stage advance: React must commit the ring-reveal phase first so the
    // auto-transition useEffect can register its 2500ms timer.
    await act(async () => { vi.advanceTimersByTime(500); });
    await act(async () => { vi.advanceTimersByTime(2500); });
    // Flush React.lazy microtasks for SignatureRevealLazy
    for (let i = 0; i < 30; i++) {
      await act(async () => { await Promise.resolve(); });
    }
    // Use waitFor with real timers to let Suspense resolve
    vi.useRealTimers();
    const { waitFor: wf } = await import('@testing-library/react');
    await wf(() => expect(screen.getByTestId('sig-reveal')).toBeDefined(), { timeout: 2000 });
    vi.useFakeTimers();
  });

  it('calls ambientePause when form is submitted', () => {
    const pause = vi.fn();
    render(
      <CosmicEncounter
        onSubmitBirth={vi.fn()}
        onComplete={vi.fn()}
        bootstrapData={null}
        isLoading={false}
        ambientePause={pause}
      />
    );

    // materializing -> levi-speaks
    act(() => { vi.advanceTimersByTime(3000); });
    // mock onComplete fires (50ms) + transition timer (2500ms)
    act(() => { vi.advanceTimersByTime(100); });
    act(() => { vi.advanceTimersByTime(2600); });

    // Submit form
    fireEvent.click(screen.getByTestId('mock-form'));
    expect(pause).toHaveBeenCalledOnce();
  });
});

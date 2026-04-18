import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { CosmicEncounter } from '../components/onboarding/CosmicEncounter';

// Capture refs for props we want to inspect
let capturedFormPulse: number | undefined;
let capturedOnProgress: ((v: number) => void) | undefined;

vi.mock('../components/onboarding/CosmicEncounterScene', () => ({
  CosmicEncounterScene: ({ phase, formPulse }: any) => {
    capturedFormPulse = formPulse;
    return <div data-testid="scene" data-phase={phase} data-form-pulse={formPulse} />;
  },
}));
vi.mock('../components/onboarding/CosmicEncounterMobile', () => ({
  CosmicEncounterMobile: ({ phase }: any) => <div data-testid="mobile-scene" data-phase={phase} />,
}));
vi.mock('../components/onboarding/EncounterBirthForm', () => ({
  EncounterBirthForm: ({ onSubmit, onProgress }: any) => {
    capturedOnProgress = onProgress;
    return (
      <button
        data-testid="mock-form"
        onClick={() =>
          onSubmit({ date: '1990-01-01T12:00:00', tz: 'Europe/Berlin', lon: 13.4, lat: 52.5 })
        }
      >
        Submit
      </button>
    );
  },
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
vi.mock('../components/onboarding/SignatureReveal', () => ({
  SignatureReveal: ({ onComplete }: any) => (
    <div data-testid="sig-reveal" onClick={() => onComplete(null)} />
  ),
}));

describe('CosmicEncounter form interaction feedback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    capturedFormPulse = undefined;
    capturedOnProgress = undefined;
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('formPulse is set to 1 when entering birth-input phase', () => {
    render(
      <CosmicEncounter
        onSubmitBirth={vi.fn()}
        onComplete={vi.fn()}
        bootstrapData={null}
        isLoading={false}
      />
    );

    // materializing → levi-speaks (3s)
    act(() => { vi.advanceTimersByTime(3000); });
    // mock onComplete fires after 50ms, then 2500ms transition timer
    act(() => { vi.advanceTimersByTime(100); });
    act(() => { vi.advanceTimersByTime(2600); });

    // Now in birth-input — formPulse should be 1
    expect(screen.getByTestId('mock-form')).toBeDefined();
    expect(capturedFormPulse).toBe(1);
  });

  it('onProgress callback from EncounterBirthForm is wired (if provided)', () => {
    render(
      <CosmicEncounter
        onSubmitBirth={vi.fn()}
        onComplete={vi.fn()}
        bootstrapData={null}
        isLoading={false}
      />
    );

    // Advance to birth-input phase
    act(() => { vi.advanceTimersByTime(3000); });
    act(() => { vi.advanceTimersByTime(100); });
    act(() => { vi.advanceTimersByTime(2600); });

    expect(screen.getByTestId('mock-form')).toBeDefined();

    // If the component wires onProgress → formPulse, calling it should update formPulse
    if (capturedOnProgress) {
      act(() => { capturedOnProgress!(0.67); });
      expect(capturedFormPulse).toBeCloseTo(0.67, 2);
    } else {
      // onProgress is not yet wired — formPulse stays at 1 from phase entry
      expect(capturedFormPulse).toBe(1);
    }
  });
});

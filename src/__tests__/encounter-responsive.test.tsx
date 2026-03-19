import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { CosmicEncounter } from '../components/onboarding/CosmicEncounter';

// Mock all sub-components
vi.mock('../components/onboarding/CosmicEncounterScene', () => ({
  CosmicEncounterScene: ({ phase }: any) => <div data-testid="scene" data-phase={phase} />,
}));
vi.mock('../components/onboarding/CosmicEncounterMobile', () => ({
  CosmicEncounterMobile: ({ phase }: any) => <div data-testid="mobile-scene" data-phase={phase} />,
}));
vi.mock('../components/onboarding/EncounterBirthForm', () => ({
  EncounterBirthForm: ({ onSubmit }: any) => (
    <button
      data-testid="mock-form"
      onClick={() =>
        onSubmit({ date: '1990-01-01T12:00:00', tz: 'Europe/Berlin', lon: 13.4, lat: 52.5 })
      }
    >
      Submit
    </button>
  ),
}));
vi.mock('../components/onboarding/LeviSpeechBubble', () => ({
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
  default: ({ onComplete }: any) => <div data-testid="ring-reveal" onClick={onComplete} />,
}));
vi.mock('../components/onboarding/SignatureReveal', () => ({
  SignatureReveal: ({ onComplete }: any) => (
    <div data-testid="sig-reveal" onClick={() => onComplete(null)} />
  ),
}));

// useIsMobile in CosmicEncounter reads window.innerWidth at useState initializer time.
// Setting it before render is sufficient to control which scene component is mounted.

describe('CosmicEncounter responsive breakpoint', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders desktop scene when innerWidth = 1024', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });

    render(
      <CosmicEncounter
        onSubmitBirth={vi.fn()}
        onComplete={vi.fn()}
        bootstrapData={null}
        isLoading={false}
      />
    );

    expect(screen.getByTestId('scene')).toBeDefined();
    expect(screen.queryByTestId('mobile-scene')).toBeNull();
  });

  it('renders mobile scene when innerWidth = 375', () => {
    Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });

    render(
      <CosmicEncounter
        onSubmitBirth={vi.fn()}
        onComplete={vi.fn()}
        bootstrapData={null}
        isLoading={false}
      />
    );

    expect(screen.getByTestId('mobile-scene')).toBeDefined();
    expect(screen.queryByTestId('scene')).toBeNull();
  });
});

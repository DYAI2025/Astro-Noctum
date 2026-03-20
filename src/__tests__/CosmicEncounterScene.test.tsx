import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { CosmicEncounterScene } from '../components/onboarding/CosmicEncounterScene';

// Mock artifacts
vi.mock('../components/onboarding/artifacts/FormArtifact', () => ({
  createFormArtifact: vi.fn(() => ({
    add: vi.fn(),
    scale: { x: 0, y: 0, z: 0, set: vi.fn(), setScalar: vi.fn() },
    position: { x: 0, y: 0, z: 0, set: vi.fn(), copy: vi.fn() },
    rotation: { x: 0, y: 0, z: 0 },
    userData: { type: 'form' },
    update: vi.fn(),
    dispose: vi.fn(),
    heartbeat: 0,
  })),
}));

vi.mock('../components/onboarding/artifacts/LeviArtifact', () => ({
  createLeviArtifact: vi.fn(() => ({
    add: vi.fn(),
    scale: { x: 0, y: 0, z: 0, set: vi.fn(), setScalar: vi.fn() },
    position: { x: 0, y: 0, z: 0, set: vi.fn(), copy: vi.fn() },
    rotation: { x: 0, y: 0, z: 0 },
    userData: { type: 'levi' },
    update: vi.fn(),
    dispose: vi.fn(),
    speaking: 0,
  })),
}));

afterEach(cleanup);

describe('CosmicEncounterScene', () => {
  it('renders a canvas container', () => {
    render(<CosmicEncounterScene phase="materializing" />);
    expect(screen.getByTestId('cosmic-scene')).toBeDefined();
  });

  it('passes phase to data attribute', () => {
    render(<CosmicEncounterScene phase="levi-speaks" />);
    expect(screen.getByTestId('cosmic-scene').getAttribute('data-phase')).toBe('levi-speaks');
  });

  it('accepts parallax offsets without throwing', () => {
    render(
      <CosmicEncounterScene
        phase="materializing"
        formOffset={{ x: 10, y: 5 }}
        leviOffset={{ x: -20, y: -10 }}
      />
    );
    expect(screen.getByTestId('cosmic-scene')).toBeDefined();
  });
});

import { describe, it, expect } from 'vitest';
import { createLeviArtifact } from '../components/onboarding/artifacts/LeviArtifact';

describe('LeviArtifact', () => {
  it('returns a Group with add method', () => {
    const artifact = createLeviArtifact();
    expect(artifact).toBeDefined();
    expect(artifact.add).toBeDefined();
  });

  it('starts at scale 0', () => {
    const artifact = createLeviArtifact();
    expect(artifact.scale.x).toBe(0);
  });

  it('has userData.type = "levi"', () => {
    const artifact = createLeviArtifact();
    expect(artifact.userData.type).toBe('levi');
  });

  it('dispose() does not throw', () => {
    const artifact = createLeviArtifact();
    expect(() => artifact.dispose()).not.toThrow();
  });

  it('update() does not throw', () => {
    const artifact = createLeviArtifact();
    expect(() => artifact.update(1.0, 0.016)).not.toThrow();
  });
});

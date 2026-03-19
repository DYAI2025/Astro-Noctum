import { describe, it, expect } from 'vitest';
import { createFormArtifact } from '../components/onboarding/artifacts/FormArtifact';

describe('FormArtifact', () => {
  it('returns a Group with add method', () => {
    const artifact = createFormArtifact();
    expect(artifact).toBeDefined();
    expect(artifact.add).toBeDefined();
  });

  it('starts at scale 0 (for materialization animation)', () => {
    const artifact = createFormArtifact();
    expect(artifact.scale.x).toBe(0);
    expect(artifact.scale.y).toBe(0);
    expect(artifact.scale.z).toBe(0);
  });

  it('has userData.type = "form"', () => {
    const artifact = createFormArtifact();
    expect(artifact.userData.type).toBe('form');
  });

  it('dispose() does not throw', () => {
    const artifact = createFormArtifact();
    expect(() => artifact.dispose()).not.toThrow();
  });

  it('update() does not throw', () => {
    const artifact = createFormArtifact();
    expect(() => artifact.update(1.0, 0.016)).not.toThrow();
  });
});

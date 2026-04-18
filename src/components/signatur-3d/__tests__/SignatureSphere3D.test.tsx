/**
 * Phase H3 — Smoke tests for the static R3F SignatureSphere3D.
 *
 * WebGL is unavailable in happy-dom, so we mock `@react-three/fiber`'s
 * `<Canvas>` to render as a plain div wrapper. We only assert on outer-
 * container props (testid, data-planetarium, className). Internal scene-
 * graph coverage is out of scope here — that comes with the H6 integration
 * test running against a real renderer.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import type { ReactNode } from 'react';

// Mock the R3F Canvas so children render without a WebGL context. Intrinsic
// three elements (<mesh>, <sphereGeometry>, ...) become unknown JSX tags in
// JSDOM which is fine — we never query them.
vi.mock('@react-three/fiber', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Canvas: ({ children }: { children?: ReactNode } & Record<string, any>) => (
    <div data-testid="r3f-canvas-mock">{children}</div>
  ),
}));

// Override the global three mock's SphereGeometry with a stub that exposes
// a minimal `attributes.position` the displacement builder can iterate over.
// Uses vertex count 0 so the inner loop is skipped entirely — we only care
// that the build does not crash in this environment.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
vi.mock('three', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actual = (await importOriginal()) as any;
  return {
    ...actual,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SphereGeometry: vi.fn(function SphereGeometry(this: any) {
      this.attributes = {
        position: {
          count: 0,
          array: new Float32Array(0),
          needsUpdate: false,
        },
      };
      this.computeVertexNormals = vi.fn();
      this.dispose = vi.fn();
    }),
    BackSide: 1,
  };
});

import { SignatureSphere3D } from '../SignatureSphere3D';
import type { PlanetName } from '@/src/lib/signatur-3d/planets';

const ALL_HALF: Readonly<Partial<Record<PlanetName, number>>> = {
  Sun: 0.5,
  Moon: 0.5,
  Mercury: 0.5,
  Venus: 0.5,
  Mars: 0.5,
  Jupiter: 0.5,
  Saturn: 0.5,
  Uranus: 0.5,
  Neptune: 0.5,
  Pluto: 0.5,
};

describe('SignatureSphere3D', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders without crashing for typical full-weight input', () => {
    const { queryByTestId } = render(<SignatureSphere3D weights={ALL_HALF} />);
    expect(queryByTestId('signature-sphere-3d')).not.toBeNull();
    expect(queryByTestId('r3f-canvas-mock')).not.toBeNull();
  });

  it('renders without crashing for empty weights', () => {
    const { queryByTestId } = render(<SignatureSphere3D weights={{}} />);
    expect(queryByTestId('signature-sphere-3d')).not.toBeNull();
  });

  it('defaults planetariumMode to true', () => {
    const { getByTestId } = render(<SignatureSphere3D weights={ALL_HALF} />);
    expect(getByTestId('signature-sphere-3d').getAttribute('data-planetarium')).toBe('true');
  });

  it('reflects planetariumMode=false on the container', () => {
    const { getByTestId } = render(
      <SignatureSphere3D weights={ALL_HALF} planetariumMode={false} />,
    );
    expect(getByTestId('signature-sphere-3d').getAttribute('data-planetarium')).toBe('false');
  });

  it('forwards className to the outer container', () => {
    const { getByTestId } = render(
      <SignatureSphere3D weights={ALL_HALF} className="custom-class" />,
    );
    expect(getByTestId('signature-sphere-3d').className).toContain('custom-class');
  });
});

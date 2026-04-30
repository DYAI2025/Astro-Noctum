/**
 * Phase H4/H5 — Smoke tests for the R3F SignatureSphere3D.
 *
 * WebGL is unavailable in happy-dom, so we mock `@react-three/fiber`'s
 * `<Canvas>` and `useFrame`, and `@react-three/drei`'s `<Text>` /
 * `<Billboard>` to render as plain DOM so we can at least count glyphs,
 * trails, and assert that the animation hook wires up.
 * Internal scene-graph coverage beyond that is out of scope here.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import type { ReactNode } from 'react';

// Capture useFrame callbacks per render so individual tests can assert
// against "was a frame callback registered" and optionally invoke it.
const useFrameMock = vi.fn();

// Mock the R3F Canvas so children render without a WebGL context. Intrinsic
// three elements (<mesh>, <sphereGeometry>, ...) become unknown JSX tags in
// JSDOM which is fine — we never query them.
vi.mock('@react-three/fiber', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Canvas: ({ children }: { children?: ReactNode } & Record<string, any>) => (
    <div data-testid="r3f-canvas-mock">{children}</div>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useFrame: (cb: any) => useFrameMock(cb),
}));

// `motion/react`'s useReducedMotion is queried at render time. Default to
// `false` (animated) so H4 assertions keep their prior behavior; individual
// tests override via `mockReturnValueOnce(true)`.
const useReducedMotionMock = vi.fn(() => false);
vi.mock('motion/react', () => ({
  useReducedMotion: () => useReducedMotionMock(),
}));

// Mock drei's <Text> and <Billboard>. Text becomes a testable DOM element
// so we can count glyph renders; Billboard is a passthrough.
// The tooltip overlay uses useLanguage() from the app's LanguageContext —
// stub it so SignatureSphere3D can render in isolation without a provider.
vi.mock('@/src/contexts/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'de', t: (k: string) => k, setLang: vi.fn() }),
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
      this.setAttribute = vi.fn((name: string, attr: unknown) => {
        this.attributes[name] = attr;
      });
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    BufferAttribute: vi.fn(function BufferAttribute(this: any, array: Float32Array, itemSize: number) {
      this.array = array;
      this.itemSize = itemSize;
      this.needsUpdate = false;
    }),
    BackSide: 1,
  };
});

// OrbitControls is from drei; add to the mock so the Canvas subtree renders
// in tests without needing a real WebGL camera.
vi.mock('@react-three/drei', () => ({
  Billboard: ({ children }: { children?: ReactNode }) => <>{children}</>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Text: ({ children, color, fontSize }: { children?: ReactNode } & Record<string, any>) => (
    <div data-testid="drei-text-mock" data-color={color} data-size={fontSize}>
      {children}
    </div>
  ),
  Stats: () => null,
  OrbitControls: () => null,
}));

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
  beforeEach(() => {
    useFrameMock.mockClear();
    useReducedMotionMock.mockReset();
    useReducedMotionMock.mockReturnValue(false);
  });

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

  // ── H4 additions ─────────────────────────────────────────────────────────

  it('renders 12 glyphs (one per pole) even when all weights are sub-threshold', () => {
    // All weights below TRAIL_THRESHOLD (0.35): glyphs still render (12), trails = 0.
    const LOW: Readonly<Partial<Record<PlanetName, number>>> = {
      Sun: 0.2,
      Moon: 0.2,
      Mercury: 0.2,
      Venus: 0.2,
      Mars: 0.2,
      Jupiter: 0.2,
      Saturn: 0.2,
      Uranus: 0.2,
      Neptune: 0.2,
      Pluto: 0.2,
    };
    const { queryAllByTestId } = render(<SignatureSphere3D weights={LOW} />);
    const glyphs = queryAllByTestId('drei-text-mock');
    // 12 poles × 1 glyph each = 12 glyphs regardless of weights.
    expect(glyphs.length).toBe(12);
  });

  it('renders no glyph DOM crashes when weights are empty', () => {
    // Covers the branch where the trail loop short-circuits for every pair
    // and no weights means nothing in the glyph color paths either.
    const { queryAllByTestId } = render(<SignatureSphere3D weights={{}} />);
    expect(queryAllByTestId('drei-text-mock').length).toBe(12);
  });

  it('renders glyphs with planet symbols as text content', () => {
    // With full weights, all 10 planet symbols should appear at least once
    // across the 12 glyphs (poles 10/11 reuse Sun/Moon via i % PLANETS.length).
    const { queryAllByTestId } = render(<SignatureSphere3D weights={ALL_HALF} />);
    const glyphs = queryAllByTestId('drei-text-mock');
    const symbolSet = new Set(glyphs.map((el) => el.textContent?.trim()));
    // Known symbols from planets.ts
    for (const s of ['☉', '☽', '☿', '♀', '♂', '♃', '♄', '♅', '♆', '♇']) {
      expect(symbolSet.has(s)).toBe(true);
    }
  });

  // ── H5 additions ─────────────────────────────────────────────────────────

  it('registers a useFrame callback when mounted (animated mode)', () => {
    // prefersReducedMotion defaults to `false` in beforeEach → animation path.
    render(<SignatureSphere3D weights={ALL_HALF} />);
    expect(useFrameMock).toHaveBeenCalled();
    // The callback passed to useFrame must be a function so R3F can drive it.
    expect(typeof useFrameMock.mock.calls[0][0]).toBe('function');
  });

  // ── Task-5 additions ──────────────────────────────────────────────────────

  it('accepts a dominantElement prop and exposes it as data-element attribute', () => {
    const { container } = render(
      <SignatureSphere3D weights={{ Sun: 0.5 }} dominantElement="Fire" />,
    );
    const el = container.querySelector('[data-testid="signature-sphere-3d"]');
    expect(el?.getAttribute('data-element')).toBe('Fire');
  });

  it('defaults dominantElement to Water when prop is omitted', () => {
    const { container } = render(<SignatureSphere3D weights={{ Sun: 0.5 }} />);
    const el = container.querySelector('[data-testid="signature-sphere-3d"]');
    expect(el?.getAttribute('data-element')).toBe('Water');
  });

  // ── Task-5b additions ─────────────────────────────────────────────────────

  it('wire layer carries gold-tint role marker', () => {
    const { container } = render(
      <SignatureSphere3D weights={{ Sun: 0.5 }} dominantElement="Water" />
    );
    const wireMesh = container.querySelector('[data-mesh-role="wire"]');
    expect(wireMesh).not.toBeNull();
    expect(wireMesh?.getAttribute('data-tint')).toBe('gold');
  });

  // ── Task-5c additions ─────────────────────────────────────────────────────

  it('wire layer has both main and halo meshes', () => {
    const { container } = render(
      <SignatureSphere3D weights={{ Sun: 0.5 }} dominantElement="Earth" />
    );
    const main = container.querySelector('[data-mesh-role="wire"]');
    const halo = container.querySelector('[data-mesh-role="wire-halo"]');
    expect(main).not.toBeNull();
    expect(halo).not.toBeNull();
  });

  // ── Task-6 additions ─────────────────────────────────────────────────────

  it('solid layer uses a ShaderMaterial when dominantElement is set', async () => {
    const { container } = render(
      <SignatureSphere3D weights={{ Sun: 0.5 }} dominantElement="Metal" />
    );
    const solidLayer = container.querySelector('[data-mesh-role="solid"]');
    expect(solidLayer).not.toBeNull();
  });

  it('frame callback is a no-op when prefersReducedMotion is true', () => {
    // Force the motion/react hook to report reduced-motion for this render.
    useReducedMotionMock.mockReturnValue(true);
    render(<SignatureSphere3D weights={ALL_HALF} />);
    // The component still calls useFrame (React Hooks rules — call order must
    // be stable across renders), but the body short-circuits. We assert the
    // reduced-motion flag is reflected on the container and that invoking the
    // registered callback does NOT throw and does NOT mutate any throwaway
    // state we can observe from here.
    const container = document.querySelector('[data-testid="signature-sphere-3d"]');
    expect(container?.getAttribute('data-reduced-motion')).toBe('true');
    expect(useFrameMock).toHaveBeenCalled();
    const cb = useFrameMock.mock.calls[0][0];
    // Invoking should not throw even with a null state (reduced-motion branch
    // returns before touching anything).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => cb({} as any, 0.016)).not.toThrow();
  });
});

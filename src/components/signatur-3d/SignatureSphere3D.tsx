/**
 * Phase H4 — Static R3F rendering of a Chladni-displaced signature sphere
 * with per-planet pole glyphs and trails between dominant antipodal pole pairs.
 *
 * Scene graph (time = 0 snapshot):
 *   - Haze sphere (inward-facing dark shell)
 *   - Wire sphere (Chladni-displaced wireframe, r = 1.0)
 *   - Solid sphere (Chladni-displaced, r = 0.93)
 *   - 12 pole groups: a small planet-tinted sphere + billboarded glyph
 *     (the planet's Unicode symbol) — one per pole.
 *   - 0..6 tube-geometry trails along great-circle paths between antipodal
 *     pole pairs whose assigned planet weight ≥ TRAIL_THRESHOLD.
 *
 * Animation (useFrame) arrives in Phase H5; FusionRing3D integration in H6.
 *
 * Pure math — `chladniDisplacement`, `getPolePositions`, `getPolePairs`,
 * `buildTrailPath` — lives in `src/lib/signatur-3d/sphere-chladni.ts` (H2).
 */
import { useEffect, useMemo, useRef, type ReactElement } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';

import { PLANETS } from '@/src/lib/signatur-3d/planets';
import type { PlanetName } from '@/src/lib/signatur-3d/planets';
import {
  buildTrailPath,
  chladniDisplacement,
  getPolePairs,
  getPolePositions,
} from '@/src/lib/signatur-3d/sphere-chladni';

export interface SignatureSphere3DProps {
  /** Per-planet amplitude weights (e.g. result of `soulprintToPlanetWeights()`). */
  weights: Readonly<Partial<Record<PlanetName, number>>>;
  /** Dark (true) or bright (false) theme. Default true. */
  planetariumMode?: boolean;
  /** Optional CSS class on the outer container. */
  className?: string;
}

/** Wireframe-layer radius. Solid layer sits slightly inside at 0.93. */
const WIRE_RADIUS = 1.0;
const SOLID_RADIUS = 0.93;
/** Displacement amplitude as a fraction of the layer radius. */
const DISPLACEMENT_FACTOR = 0.18;
/** Sphere tessellation — matches the Cymantics prototype. */
const SPHERE_SEGMENTS = 72;
/** Pole-marker geometry size (H4: downsized from 0.04; glyph provides the read). */
const POLE_MARKER_RADIUS = 0.025;
/** Glyph font size in world units. */
const GLYPH_FONT_SIZE = 0.07;
/** Glyph lift above the pole along +y in the billboard's local frame. */
const GLYPH_LIFT = 0.06;
/** Minimum planet weight for a trail to render for its antipodal pair. */
const TRAIL_THRESHOLD = 0.35;
/** Max trail tube-radius scale (multiplied by weight). */
const TRAIL_RADIUS_SCALE = 0.004;
/** Ripple amplitude (multiplied by weight) fed into buildTrailPath. */
const TRAIL_RIPPLE_SCALE = 0.04;
/** Tube segment count per trail. */
const TRAIL_TUBE_STEPS = 48;
/** Tube radial-segment count per trail. */
const TRAIL_TUBE_RADIAL = 4;

/**
 * Build a Chladni-displaced SphereGeometry. Mutates position buffer in place
 * starting from a fresh `new THREE.SphereGeometry`, then recomputes normals.
 *
 * Extracted so both wire and solid layers share identical topology and the
 * `useMemo` dependency list stays compact.
 */
function buildDisplacedSphere(
  radius: number,
  weights: Readonly<Partial<Record<PlanetName, number>>>,
): THREE.SphereGeometry {
  const geo = new THREE.SphereGeometry(radius, SPHERE_SEGMENTS, SPHERE_SEGMENTS);
  const pos = geo.attributes.position;
  const arr = pos.array as Float32Array;
  const amplitude = radius * DISPLACEMENT_FACTOR;

  for (let i = 0; i < pos.count; i++) {
    const x = arr[i * 3];
    const y = arr[i * 3 + 1];
    const z = arr[i * 3 + 2];
    const r = Math.sqrt(x * x + y * y + z * z);
    if (r < 1e-6) continue;

    const theta = Math.acos(Math.max(-1, Math.min(1, y / r)));
    const phi = Math.atan2(z, x);
    const disp = chladniDisplacement(theta, phi, weights, 0);
    const scale = 1 + (disp * amplitude) / radius;

    arr[i * 3] = x * scale;
    arr[i * 3 + 1] = y * scale;
    arr[i * 3 + 2] = z * scale;
  }

  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/**
 * R3F component rendering the static Chladni signature sphere.
 *
 * Caller is expected to pass a stable `weights` reference (e.g. memoized via
 * `useMemo` at the call-site); we do NOT defensively clone.
 */
export function SignatureSphere3D({
  weights,
  planetariumMode = true,
  className,
}: SignatureSphere3DProps): ReactElement {
  const wireGeomRef = useRef<THREE.SphereGeometry | null>(null);
  const solidGeomRef = useRef<THREE.SphereGeometry | null>(null);

  // Rebuild geometries only when weights change.
  const wireGeom = useMemo(() => buildDisplacedSphere(WIRE_RADIUS, weights), [weights]);
  const solidGeom = useMemo(() => buildDisplacedSphere(SOLID_RADIUS, weights), [weights]);

  wireGeomRef.current = wireGeom;
  solidGeomRef.current = solidGeom;

  // Dispose GPU resources on unmount.
  useEffect(() => {
    return () => {
      wireGeomRef.current?.dispose();
      solidGeomRef.current?.dispose();
    };
  }, []);

  // Pole markers: 12 poles → PLANETS[i % 10] for color.
  const polePositions = useMemo(() => getPolePositions(WIRE_RADIUS), []);

  /**
   * Trails: one per antipodal pole pair whose assigned planet's weight
   * meets TRAIL_THRESHOLD. Paired planet index is `pairIdx` (0..5), so at
   * most 6 trails regardless of weight distribution. Each trail carries a
   * precomputed CatmullRomCurve3 that later feeds a <tubeGeometry>.
   *
   * JS-only objects (Vector3, CatmullRomCurve3) — no GPU handles — so we
   * do not need to dispose the curve itself. The <tubeGeometry> JSX is
   * disposed by R3F when the element re-mounts on weight change (R3F
   * attaches `geometry` with `dispose-true` semantics by default).
   */
  const trails = useMemo(() => {
    const pairs = getPolePairs(WIRE_RADIUS);
    const result: {
      curve: THREE.CatmullRomCurve3;
      color: string;
      radius: number;
      weight: number;
    }[] = [];
    pairs.forEach((pair, pairIdx) => {
      const planet = PLANETS[pairIdx % PLANETS.length];
      const w = weights[planet.name] ?? 0;
      if (w < TRAIL_THRESHOLD) return;

      const ripple = TRAIL_RIPPLE_SCALE * w;
      const frequency = 2 + (planet.poleIndex % 4);
      const points = buildTrailPath(
        pair[0],
        pair[1],
        WIRE_RADIUS,
        ripple,
        frequency,
        TRAIL_TUBE_STEPS,
        0,
      );
      const vectors = points.map((p) => new THREE.Vector3(p.x, p.y, p.z));
      const curve = new THREE.CatmullRomCurve3(vectors);
      result.push({
        curve,
        color: planet.color,
        radius: TRAIL_RADIUS_SCALE * w,
        weight: w,
      });
    });
    return result;
  }, [weights]);

  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 2;

  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    position: 'relative',
    background: planetariumMode ? '#02020a' : 'transparent',
  };

  return (
    <div
      data-testid="signature-sphere-3d"
      data-planetarium={planetariumMode}
      className={className}
      style={containerStyle}
    >
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 45 }}
        dpr={dpr}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.4} color={0x4f6ef7} />
        <pointLight position={[3, 3, 3]} intensity={3} color={0x4f6ef7} distance={20} />
        <pointLight position={[-3, -2, 2]} intensity={2} color={0x00d4ff} distance={20} />
        <pointLight position={[0, -4, -3]} intensity={1.5} color={0x7b3ff7} distance={15} />

        <group>
          {/* Haze shell — inward-facing dark backdrop inside the sphere. */}
          <mesh>
            <sphereGeometry args={[1.06, 32, 32]} />
            <meshBasicMaterial
              color={0x05050f}
              transparent
              opacity={0.7}
              side={THREE.BackSide}
            />
          </mesh>

          {/* Wire layer — Chladni-displaced wireframe. */}
          <mesh geometry={wireGeom}>
            <meshStandardMaterial
              color={0x4f6ef7}
              wireframe
              transparent
              opacity={0.2}
              emissive={0x1a2a8f}
              emissiveIntensity={0.6}
            />
          </mesh>

          {/* Solid layer — slightly smaller, dark core. */}
          <mesh geometry={solidGeom}>
            <meshStandardMaterial
              color={0x06060f}
              transparent
              opacity={0.8}
              roughness={0.9}
              metalness={0.05}
            />
          </mesh>

          {/* 12 pole groups — a small planet-tinted sphere + billboarded glyph. */}
          {polePositions.map((p, i) => {
            const planet = PLANETS[i % PLANETS.length];
            return (
              <group key={`pole-${i}`} position={[p.x, p.y, p.z]}>
                <mesh>
                  <sphereGeometry args={[POLE_MARKER_RADIUS, 16, 16]} />
                  <meshBasicMaterial color={planet.color} />
                </mesh>
                <Billboard follow>
                  <Text
                    position={[0, GLYPH_LIFT, 0]}
                    fontSize={GLYPH_FONT_SIZE}
                    color={planet.color}
                    anchorX="center"
                    anchorY="middle"
                  >
                    {planet.symbol}
                  </Text>
                </Billboard>
              </group>
            );
          })}

          {/* Trails — one tube per dominant antipodal pair. Opacity scales with weight. */}
          {trails.map((trail, idx) => (
            <mesh key={`trail-${idx}`}>
              <tubeGeometry
                args={[trail.curve, TRAIL_TUBE_STEPS, trail.radius, TRAIL_TUBE_RADIAL, false]}
              />
              <meshBasicMaterial
                color={trail.color}
                transparent
                opacity={0.15 + (trail.weight - TRAIL_THRESHOLD) * 0.25}
              />
            </mesh>
          ))}
        </group>
      </Canvas>
    </div>
  );
}

/**
 * Phase H5 — Animated R3F rendering of a Chladni-displaced signature sphere
 * with per-planet pole glyphs and trails between dominant antipodal pole pairs.
 *
 * Scene graph:
 *   - Haze sphere (inward-facing dark shell)
 *   - Wire sphere (Chladni-displaced wireframe, r = 1.0)
 *   - Solid sphere (Chladni-displaced, r = 0.93)
 *   - 12 pole groups: a small planet-tinted sphere + billboarded glyph
 *     (the planet's Unicode symbol) — one per pole.
 *   - 0..6 tube-geometry trails along great-circle paths between antipodal
 *     pole pairs whose assigned planet weight ≥ TRAIL_THRESHOLD.
 *
 * Animation (H5):
 *   - Whole signature group rotates slowly on Y (with a slight X wobble).
 *   - Wire + solid Chladni geometries morph in place every 4th frame
 *     (≈15fps effective). Geometry updates read from a stored Float32Array
 *     snapshot of the ORIGINAL undeformed (unit-sphere × radius) positions,
 *     then write freshly-displaced positions into the live buffer — this
 *     makes the morph drift-free (we never deform an already-deformed
 *     sample).
 *   - Trails remain static this phase (H5 non-goal); they will animate
 *     via `trailTime` in H6 when integrated with SignaturRenderer.
 *   - `useReducedMotion()` from `motion/react` short-circuits the loop
 *     entirely: rotation + morph are skipped, the sphere stays at t=0.
 *
 * SignaturRenderer integration lands in Phase H6.
 */
import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Billboard, OrbitControls, Text, Stats } from '@react-three/drei';
import { useReducedMotion } from 'motion/react';

import { PLANETS, PLANET_MAP } from '@/src/lib/signatur-3d/planets';
import type { PlanetName } from '@/src/lib/signatur-3d/planets';
import {
  buildTrailPath,
  chladniDisplacement,
  computeChladniVertexColors,
  getPolePairs,
  getPolePositions,
  writeChladniVertexColors,
} from '@/src/lib/signatur-3d/sphere-chladni';
import {
  PLANET_INFLUENCE,
  TIER_LABEL,
  TIER_SHORT_LABEL,
  tierFor,
} from '@/src/lib/signatur-3d/planet-tooltips';
import { useLanguage } from '@/src/contexts/LanguageContext';
import type { WuxingElement } from '@/src/lib/signatur-3d/wuxing-surfaces';

/** Never let raycasts hit the wire/solid/haze sphere meshes — only the
 *  pole markers should receive pointer events so hover tooltips work.
 *  Returned from a `raycast` prop so R3F's event reconciler skips it. */
const SKIP_RAYCAST = () => {};

export interface SignatureSphere3DProps {
  /** Per-planet amplitude weights (e.g. result of `soulprintToPlanetWeights()`). */
  weights: Readonly<Partial<Record<PlanetName, number>>>;
  /** Dark (true) or bright (false) theme. Default true. */
  planetariumMode?: boolean;
  /** Optional CSS class on the outer container. */
  className?: string;
  /** Current Kp geomagnetic index (0–9). Drives morph-speed multiplier so the
   *  sphere visibly breathes faster during geomagnetic storms. Default 0. */
  kpIndex?: number;
  /** Dominant Wuxing element drives the sphere's surface material. Defaults to 'Water'. */
  dominantElement?: WuxingElement;
}

/** Wireframe-layer radius. Solid layer sits slightly inside at 0.93. */
const WIRE_RADIUS = 1.0;
const SOLID_RADIUS = 0.93;
/** Displacement amplitude as a fraction of the layer radius.
 *  Trimmed 0.30→0.12 (2026-04-21) — 0.30 over-deformed the surface so
 *  inward dips punched through the dark solid shell and made the sphere
 *  look broken. 0.12 keeps the geometry coherent; the per-planet signal
 *  now reads through the vertex-colour node pattern instead of big bumps. */
const DISPLACEMENT_FACTOR = 0.12;
/** Sphere tessellation — matches the Cymantics prototype. */
const SPHERE_SEGMENTS = 72;
/** Pole-marker geometry size (H4: downsized from 0.04; glyph provides the read). */
const POLE_MARKER_RADIUS = 0.025;
/** Glyph font size in world units. */
const GLYPH_FONT_SIZE = 0.07;
/** Glyph lift above the pole along +y in the billboard's local frame. */
const GLYPH_LIFT = 0.06;
/** Minimum planet weight for a trail to render for its antipodal pair.
 *  Lowered 0.35→0.15 (2026-04-21) — 0.35 was prohibitive, most users saw
 *  zero trails. 0.15 yields 3–5 visible energy bands for typical signatures. */
const TRAIL_THRESHOLD = 0.15;
/** Max trail tube-radius scale (multiplied by weight). */
const TRAIL_RADIUS_SCALE = 0.004;
/** Ripple amplitude (multiplied by weight) fed into buildTrailPath. */
const TRAIL_RIPPLE_SCALE = 0.04;
/** Tube segment count per trail. */
const TRAIL_TUBE_STEPS = 48;
/** Tube radial-segment count per trail. */
const TRAIL_TUBE_RADIAL = 4;

// ── Animation tuning (H5) ─────────────────────────────────────────────────
/** Per-frame Y rotation (radians). Slow drift. */
const ROT_Y_PER_FRAME = 0.0018;
/** Per-frame X rotation (radians). Subtle wobble. */
const ROT_X_PER_FRAME = 0.0006;
/** Morph the geometry every Nth frame (≈15fps morph at 60fps render). */
const MORPH_EVERY_N_FRAMES = 4;
/** Solid-layer time runs slower than wire — visual "inside lags outside". */
const SOLID_TIME_SCALE = 0.7;

/**
 * Build a Chladni-displaced SphereGeometry. Mutates position buffer in place
 * starting from a fresh `new THREE.SphereGeometry`, then recomputes normals.
 *
 * Extracted so both wire and solid layers share identical topology and the
 * `useMemo` dependency list stays compact.
 *
 * Returns the geometry AND a Float32Array snapshot of the *original* (before
 * Chladni-displacement) vertex positions — callers use that snapshot as the
 * reference frame for in-place animation updates so the morph never drifts.
 */
function buildDisplacedSphere(
  radius: number,
  weights: Readonly<Partial<Record<PlanetName, number>>>,
  withVertexColors = false,
): { geometry: THREE.SphereGeometry; originalPositions: Float32Array } {
  const geo = new THREE.SphereGeometry(radius, SPHERE_SEGMENTS, SPHERE_SEGMENTS);
  const pos = geo.attributes.position;
  const arr = pos.array as Float32Array;
  // Snapshot the clean unit-sphere × radius positions BEFORE we displace them.
  // This is the stable reference frame for every future in-place morph update.
  const originalPositions = new Float32Array(arr);
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

  // Attach a vertex-colour buffer keyed to the original (undeformed)
  // positions so the Chladni-node pattern paints where the caller intends
  // it — not on the already-displaced positions, which would wobble with
  // the geometry morph.
  if (withVertexColors) {
    const colors = computeChladniVertexColors(originalPositions, weights, 0);
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  }

  return { geometry: geo, originalPositions };
}

/**
 * In-place Chladni morph for an already-built displaced sphere.
 *
 * CRITICAL: reads vertex positions from the supplied `originalPositions`
 * snapshot (the clean, undeformed unit-sphere × radius positions) and
 * writes displaced positions into the live attribute buffer. Reading from
 * a fresh reference each frame avoids the feedback-loop drift that would
 * result from re-deforming an already-deformed sample.
 */
function updateChladniGeometryInPlace(
  geom: THREE.BufferGeometry | null,
  originalPositions: Float32Array | null,
  weights: Readonly<Partial<Record<PlanetName, number>>>,
  time: number,
  radius: number,
): void {
  if (!geom || !originalPositions) return;
  const pos = geom.attributes.position;
  if (!pos) return;
  const arr = pos.array as Float32Array;
  const amplitudeBase = radius * DISPLACEMENT_FACTOR;
  const count = pos.count;

  for (let i = 0; i < count; i++) {
    const xi = i * 3;
    // Read from ORIGINAL (stable, undeformed) positions.
    const x = originalPositions[xi];
    const y = originalPositions[xi + 1];
    const z = originalPositions[xi + 2];
    const r = Math.sqrt(x * x + y * y + z * z);
    if (r < 1e-6) continue;
    const theta = Math.acos(Math.max(-1, Math.min(1, y / r)));
    const phi = Math.atan2(z, x);
    const disp = chladniDisplacement(theta, phi, weights, time);
    const scale = (radius + disp * amplitudeBase) / r;
    arr[xi] = x * scale;
    arr[xi + 1] = y * scale;
    arr[xi + 2] = z * scale;
  }
  pos.needsUpdate = true;
  // Re-derive normals so the solid sphere's meshStandardMaterial lighting
  // tracks the displaced geometry. With SPHERE_SEGMENTS = 72 this is ~10k
  // triangles → ~0.3–0.6 ms per call on a mid-range laptop; acceptable
  // because the whole position/normal update is already throttled to
  // every MORPH_EVERY_N_FRAMES (4) frames in the caller. If we ever raise
  // SPHERE_SEGMENTS or drop the throttle, consider caching a single
  // original-normal buffer and rotating it per-vertex instead of the full
  // BufferGeometry recompute.
  geom.computeVertexNormals();

  // If the geometry carries a vertex-colour attribute, flow the same
  // Chladni field into it so the node pattern on the surface animates in
  // sync with the geometry morph.
  const colorAttr = geom.attributes.color as THREE.BufferAttribute | undefined;
  if (colorAttr) {
    writeChladniVertexColors(
      colorAttr.array as Float32Array,
      originalPositions,
      weights,
      time,
    );
    colorAttr.needsUpdate = true;
  }
}

// ── Internal animated scene sub-component ────────────────────────────────
// `useFrame` is only valid inside an `<Canvas>` subtree, so the scene graph
// plus its animation hook live here. Kept module-local on purpose — there is
// no other caller and the prop shape is specific to the parent's refs.

interface AnimatedSceneProps {
  weights: Readonly<Partial<Record<PlanetName, number>>>;
  wireGeom: THREE.SphereGeometry;
  solidGeom: THREE.SphereGeometry;
  wireOriginalPositions: Float32Array;
  solidOriginalPositions: Float32Array;
  polePositions: ReturnType<typeof getPolePositions>;
  trails: {
    curve: THREE.CatmullRomCurve3;
    color: string;
    radius: number;
    weight: number;
  }[];
  prefersReducedMotion: boolean;
  /** 0–9; scales the morph-clock so higher Kp = faster breathing. */
  kpIndex: number;
  /** Hover handlers — drive the tooltip overlay outside the Canvas. */
  onPoleHover: (name: PlanetName | null) => void;
}

function AnimatedScene({
  weights,
  wireGeom,
  solidGeom,
  wireOriginalPositions,
  solidOriginalPositions,
  polePositions,
  trails,
  prefersReducedMotion,
  kpIndex,
  onPoleHover,
}: AnimatedSceneProps): ReactElement {
  const signatureGroupRef = useRef<THREE.Group | null>(null);
  const timeRef = useRef(0);
  const frameCountRef = useRef(0);

  // Kp 0 → ×1.0 (calm), Kp 5 (G1 storm) → ×2.0, Kp 9 (G5 extreme) → ×2.8.
  // Clamped so a missing/NaN reading never freezes or over-spins the sphere.
  const kpSpeedMult = 1 + Math.min(Math.max(kpIndex, 0), 9) / 5;

  useFrame((_state, delta) => {
    if (prefersReducedMotion) return;

    // delta is seconds; Cymantics-style math is in ms.
    // Scale by Kp so the sphere visibly breathes faster during storms.
    timeRef.current += delta * 1000 * kpSpeedMult;
    frameCountRef.current += 1;

    // Y rotation is now handled by OrbitControls autoRotate (so user drag
    // and auto-drift share the same source). We keep a very subtle X wobble
    // on the group so the pole layout still feels alive when the camera is
    // parked. `ROT_Y_PER_FRAME` is deliberately unused here; kept as a
    // reference constant in case OrbitControls is ever removed.
    void ROT_Y_PER_FRAME;
    if (signatureGroupRef.current) {
      signatureGroupRef.current.rotation.x += ROT_X_PER_FRAME;
    }

    // Geometry morph — throttled to every Nth frame to keep CPU cost flat.
    if (frameCountRef.current % MORPH_EVERY_N_FRAMES === 0) {
      updateChladniGeometryInPlace(
        wireGeom,
        wireOriginalPositions,
        weights,
        timeRef.current,
        WIRE_RADIUS,
      );
      updateChladniGeometryInPlace(
        solidGeom,
        solidOriginalPositions,
        weights,
        timeRef.current * SOLID_TIME_SCALE,
        SOLID_RADIUS,
      );
    }
  });

  return (
    <>
      <ambientLight intensity={0.4} color={0x4f6ef7} />
      <pointLight position={[3, 3, 3]} intensity={3} color={0x4f6ef7} distance={20} />
      <pointLight position={[-3, -2, 2]} intensity={2} color={0x00d4ff} distance={20} />
      <pointLight position={[0, -4, -3]} intensity={1.5} color={0x7b3ff7} distance={15} />

      <group ref={signatureGroupRef}>
        {/* Haze shell — inward-facing dark backdrop inside the sphere.
            raycast disabled so it never intercepts pole hovers. */}
        <mesh raycast={SKIP_RAYCAST}>
          <sphereGeometry args={[1.06, 32, 32]} />
          <meshBasicMaterial
            color={0x05050f}
            transparent
            opacity={0.7}
            side={THREE.BackSide}
          />
        </mesh>

        {/* Halo — shadow outline behind gold wire for contrast on all element surfaces */}
        <mesh
          geometry={wireGeom}
          raycast={SKIP_RAYCAST}
          data-mesh-role="wire-halo"
          scale={1.005}
          renderOrder={1}
        >
          <meshBasicMaterial
            color={0x000000}
            wireframe
            transparent
            opacity={0.30}
            depthWrite={false}
          />
        </mesh>

        {/* Gold wire — main Chladni line layer */}
        <mesh
          geometry={wireGeom}
          raycast={SKIP_RAYCAST}
          data-mesh-role="wire"
          data-tint="gold"
          renderOrder={2}
        >
          <meshStandardMaterial
            color={0xD4AF37}
            wireframe
            transparent
            opacity={0.40}
            emissive={0x8B6914}
            emissiveIntensity={0.5}
          />
        </mesh>

        {/* Solid layer — slightly smaller, dark core. Vertex colours carry
            the Chladni-node pattern so the surface itself visibly encodes
            the standing-wave structure (2026-04-21). Skip raycast so the
            sphere never intercepts pole hovers. */}
        <mesh geometry={solidGeom} raycast={SKIP_RAYCAST}>
          <meshStandardMaterial
            vertexColors
            transparent
            opacity={0.92}
            roughness={0.55}
            metalness={0.15}
            emissive={0x0a0a2a}
            emissiveIntensity={0.35}
          />
        </mesh>

        {/* 12 pole groups — a small planet-tinted sphere + billboarded glyph.
            Marker size, glyph size and emissive intensity all scale with the
            planet's weight so dominant frequencies visibly glow and quiet
            planets fade into the backdrop (2026-04-21). */}
        {polePositions.map((p, i) => {
          const planet = PLANETS[i % PLANETS.length];
          const w = Math.max(0, Math.min(1, weights[planet.name] ?? 0));
          // Scale: 0.5× at w=0 up to 1.5× at w=1 — keeps even 0-weight poles
          // visible so the 12-axis layout still reads.
          const sizeMult = 0.5 + w;
          const markerRadius = POLE_MARKER_RADIUS * sizeMult;
          const glyphSize = GLYPH_FONT_SIZE * (0.7 + w * 0.6);
          // meshStandardMaterial so we can modulate emissive with weight; the
          // three scene pointLights (blue/cyan/purple) make the base color
          // readable even at emissiveIntensity 0.
          return (
            <group
              key={`pole-${i}`}
              position={[p.x, p.y, p.z]}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'pointer';
                onPoleHover(planet.name);
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'auto';
                onPoleHover(null);
              }}
            >
              <mesh>
                <sphereGeometry args={[markerRadius, 16, 16]} />
                <meshStandardMaterial
                  color={planet.color}
                  emissive={planet.color}
                  emissiveIntensity={0.2 + w * 1.5}
                />
              </mesh>
              <Billboard follow>
                <Text
                  position={[0, GLYPH_LIFT, 0]}
                  fontSize={glyphSize}
                  color={planet.color}
                  fillOpacity={0.5 + w * 0.5}
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
    </>
  );
}

/**
 * SignatureSphere3D — R3F Chladni sphere with per-planet weighted standing waves.
 *
 * R3F component rendering the animated Chladni signature sphere. Caller is
 * expected to pass a stable `weights` reference (e.g. memoized via `useMemo`
 * at the call-site); we do NOT defensively clone.
 *
 * Performance notes:
 * - Pixel ratio capped at `dpr={[1, 2]}` — iPhone 14 has DPR 3; limiting to 2
 *   caps the GPU workload at ~4× backing buffer vs. native 9×.
 * - Geometry morph runs every 4th frame (15 fps effective) via in-place
 *   BufferAttribute update. Wire + solid spheres share the same update pattern.
 * - useMemo dependencies: {@link SignatureSphere3DProps.weights} is the only
 *   reactive input to the expensive geometry build. Parent must pass a stable
 *   reference (or a value-equivalent object) to avoid per-render rebuild.
 * - useReducedMotion (motion/react) short-circuits the useFrame loop entirely.
 * - DEV-only: a drei <Stats /> panel is mounted inside the Canvas for on-device
 *   FPS monitoring.
 *
 * Trail tubes:
 * - Drawn only for the 6 antipodal pole pairs whose assigned planet weight
 *   >= 0.35 (weights below render no trail, reducing triangle count).
 *
 * Data contract:
 * - `weights` keys are the 10 Cousto planet names; missing keys default to 0.
 * - Typical source: soulprintToPlanetWeights(signalData.baseSignals) from
 *   the parent SignaturRenderer component.
 */
export function SignatureSphere3D({
  weights,
  planetariumMode = true,
  className,
  kpIndex = 0,
  dominantElement = 'Water',
}: SignatureSphere3DProps): ReactElement {
  const wireGeomRef = useRef<THREE.SphereGeometry | null>(null);
  const solidGeomRef = useRef<THREE.SphereGeometry | null>(null);

  // Rebuild geometries only when weights change. Each build also returns an
  // immutable snapshot of the undeformed vertex positions, which the animated
  // morph reads from every frame to stay drift-free.
  //
  // Solid layer carries the Chladni-node vertex-colour pattern — that is the
  // "pattern on the surface" the user sees. Wire layer stays flat-colour so
  // its contour lines aren't fighting the node pattern for visual attention.
  const wireBuilt = useMemo(() => buildDisplacedSphere(WIRE_RADIUS, weights, false), [weights]);
  const solidBuilt = useMemo(() => buildDisplacedSphere(SOLID_RADIUS, weights, true), [weights]);

  const wireGeom = wireBuilt.geometry;
  const solidGeom = solidBuilt.geometry;

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

  // `useReducedMotion()` may return null when the media query is unsupported;
  // we coerce to boolean so the render-graph sees a stable primitive.
  const prefersReducedMotion = useReducedMotion() ?? false;

  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 2;

  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    position: 'relative',
    background: planetariumMode ? '#02020a' : 'transparent',
  };

  // Hover-tooltip state. Lives at the outer component so the tooltip overlay
  // (rendered as a sibling of <Canvas>) can pull full Tailwind styling while
  // the inner pole <group> fires pointer events.
  const [hoveredPole, setHoveredPole] = useState<PlanetName | null>(null);
  const { lang } = useLanguage();
  const isDe = lang === 'de';

  return (
    <div
      data-testid="signature-sphere-3d"
      data-planetarium={planetariumMode}
      data-reduced-motion={prefersReducedMotion}
      data-element={dominantElement}
      className={className}
      style={containerStyle}
    >
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 45 }}
        dpr={dpr}
        gl={{ antialias: true, alpha: true }}
      >
        {import.meta.env.DEV && <Stats />}
        {/* User-facing rotation. Pan + zoom are disabled so the sphere
            stays the visual centrepiece; users can drag to reorient it,
            otherwise it drifts on its own via autoRotate. */}
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          autoRotate={!prefersReducedMotion}
          autoRotateSpeed={0.6}
          rotateSpeed={0.6}
          dampingFactor={0.15}
          enableDamping
        />
        <AnimatedScene
          weights={weights}
          wireGeom={wireGeom}
          solidGeom={solidGeom}
          wireOriginalPositions={wireBuilt.originalPositions}
          solidOriginalPositions={solidBuilt.originalPositions}
          polePositions={polePositions}
          trails={trails}
          prefersReducedMotion={prefersReducedMotion}
          kpIndex={kpIndex}
          onPoleHover={setHoveredPole}
        />
      </Canvas>

      {hoveredPole && (
        <PoleTooltip
          planetName={hoveredPole}
          weight={Math.max(0, Math.min(1, weights[hoveredPole] ?? 0))}
          isDe={isDe}
        />
      )}
    </div>
  );
}

// ── Tooltip overlay (outside the R3F Canvas) ────────────────────────────
// Absolute-positioned so it floats on top of the sphere without pushing
// layout. Rendered conditionally on hover. Styled with Tailwind so it
// matches the rest of the app's dark luxury palette.
function PoleTooltip({
  planetName,
  weight,
  isDe,
}: {
  planetName: PlanetName;
  weight: number;
  isDe: boolean;
}): ReactElement {
  const planet = PLANET_MAP[planetName];
  const tier = tierFor(weight);
  const influence = PLANET_INFLUENCE[planetName][isDe ? 'de' : 'en'];
  const tierLine = TIER_LABEL[tier][isDe ? 'de' : 'en'];
  const tierShort = TIER_SHORT_LABEL[tier][isDe ? 'de' : 'en'];
  const percent = Math.round(weight * 100);
  const displayName = isDe ? planet.name_de : planet.name;
  const archetype = isDe ? planet.archetype_de : planet.archetype_en;
  const weightLabel = isDe ? 'Dein Anteil' : 'Your share';

  return (
    <div
      data-testid="pole-tooltip"
      data-planet={planetName}
      className="pointer-events-none absolute left-3 top-3 z-30 max-w-[280px] rounded-xl border border-white/15 bg-black/75 p-3 text-white shadow-[0_0_40px_rgba(0,0,0,0.6)] backdrop-blur-md sm:left-4 sm:top-4 sm:max-w-[320px] sm:p-4"
    >
      <div className="flex items-center gap-2">
        <span
          className="text-2xl leading-none"
          style={{ color: planet.color }}
          aria-hidden="true"
        >
          {planet.symbol}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-wide">{displayName}</p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/60">
            {archetype}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 rounded-md border border-white/10 bg-white/5 px-2 py-1.5">
        <span className="text-[11px] uppercase tracking-wider text-white/60">
          {weightLabel}
        </span>
        <span className="text-[13px] font-semibold" style={{ color: planet.color }}>
          {percent}% · {tierShort}
        </span>
      </div>

      <p className="mt-2 text-[12px] leading-snug text-white/70">{tierLine}</p>

      <p className="mt-2 text-[13px] leading-relaxed text-white/90">{influence}</p>
    </div>
  );
}

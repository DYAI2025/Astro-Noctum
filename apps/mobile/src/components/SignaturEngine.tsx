/**
 * SignaturEngine — Mobile Bazodiac Signature Renderer
 *
 * Uses expo-gl + expo-three to render the same spirograph particle system
 * as the web FusionRingCanvasV2, driven by the shared bazodiac-engine.
 *
 * Mobile optimizations:
 *  - budgetMultiplier 0.4 (~11K particles)
 *  - pixelRatio 1, no antialiasing
 *  - 30fps cap via setTimeout
 *  - powerPreference: 'low-power'
 *  - Full GPU resource disposal on unmount
 */

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { PanResponder, View } from 'react-native';
import { GLView, type ExpoWebGLRenderingContext } from 'expo-gl';
import { Renderer } from 'expo-three';
import {
  Scene,
  OrthographicCamera,
  BufferGeometry,
  BufferAttribute,
  ShaderMaterial,
  Points,
  AdditiveBlending,
} from 'three';
import {
  generateSignature,
  type QuizDimension,
} from '@bazodiac/shared';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SignaturEngineProps {
  natalWeights: Map<string, number>;
  quizWeights?: Map<QuizDimension, number>;
  kpIndex?: number;
  size?: number;
  onReady?: () => void;
  /**
   * Called when the V2 GL engine fails to initialise (e.g. WebGL context
   * unavailable on device). The caller should render the V1 fallback and
   * log the degradation explicitly — no silent fallback.
   */
  onFailed?: () => void;
}

// ---------------------------------------------------------------------------
// Shaders
// ---------------------------------------------------------------------------

const VERTEX_SHADER = `
attribute float size;
attribute float alpha;
varying float vAlpha;
varying vec3 vColor;
void main() {
  vColor = color;
  vAlpha = alpha;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = size * (300.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const FRAGMENT_SHADER = `
precision mediump float;
varying float vAlpha;
varying vec3 vColor;
void main() {
  float d = length(gl_PointCoord - vec2(0.5));
  if (d > 0.5) discard;
  float soft = 1.0 - smoothstep(0.3, 0.5, d);
  gl_FragColor = vec4(vColor, vAlpha * soft);
}
`;

// ---------------------------------------------------------------------------
// Layer size/alpha scaling — mirrors the web V2 loadSignature logic
// ---------------------------------------------------------------------------

interface LayerConfig {
  sizeScale: number;
  alphaScale: number;
}

const LAYER_CONFIGS: Record<string, LayerConfig> = {
  glow:        { sizeScale: 0.12,  alphaScale: 0.6 },
  curve:       { sizeScale: 0.035, alphaScale: 1.3 },
  fractal:     { sizeScale: 0.025, alphaScale: 1.0 },
  subfractal:  { sizeScale: 0.015, alphaScale: 0.7 },
  bridge:      { sizeScale: 0.03,  alphaScale: 1.0 },
  centerjump:  { sizeScale: 0.04,  alphaScale: 1.4 },
  zodiac:      { sizeScale: 0.025, alphaScale: 1.0 },
  transit:     { sizeScale: 0.05,  alphaScale: 1.0 },
};

// ---------------------------------------------------------------------------
// Touch → world coordinate conversion
// ---------------------------------------------------------------------------

const touchToWorld = (px: number, py: number, viewSize: number) => {
  const x = ((px / viewSize) * 2 - 1) * 3;
  const y = -((py / viewSize) * 2 - 1) * 3;
  return { x, y };
};

// ---------------------------------------------------------------------------
// Burst particle type
// ---------------------------------------------------------------------------

interface BurstParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  lifetime: number;
  age: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SignaturEngine({
  natalWeights,
  quizWeights,
  kpIndex = 0,
  size = 300,
  onReady,
  onFailed,
}: SignaturEngineProps) {
  const animationRef = useRef<number>(0);
  const disposeRef = useRef<(() => void) | null>(null);

  // Touch interaction refs
  const burstParticlesRef = useRef<BurstParticle[]>([]);
  const cameraOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraTargetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraRef = useRef<OrthographicCamera | null>(null);

  // -----------------------------------------------------------------------
  // PanResponder for touch interaction
  // -----------------------------------------------------------------------

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const touch = evt.nativeEvent;
          const world = touchToWorld(touch.locationX, touch.locationY, size);

          // Haptic feedback
          try {
            const Haptics = require('expo-haptics');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } catch {}

          // Create burst of 50 gold particles at touch position
          const burst: BurstParticle[] = [];
          for (let i = 0; i < 50; i++) {
            const angle = (Math.PI * 2 * i) / 50 + (Math.random() - 0.5) * 0.5;
            const speed = 0.02 + Math.random() * 0.04;
            burst.push({
              x: world.x,
              y: world.y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              alpha: 0.8,
              size: 6 + Math.random() * 4,
              lifetime: 60,
              age: 0,
            });
          }
          burstParticlesRef.current = [
            ...burstParticlesRef.current,
            ...burst,
          ];
        },
        onPanResponderMove: (_evt, gestureState) => {
          // Parallax: offset camera by touch delta
          cameraTargetRef.current = {
            x: gestureState.dx * 0.002,
            y: -gestureState.dy * 0.002,
          };
        },
        onPanResponderRelease: () => {
          // Drift camera back to center
          cameraTargetRef.current = { x: 0, y: 0 };
        },
        onPanResponderTerminate: () => {
          cameraTargetRef.current = { x: 0, y: 0 };
        },
      }),
    [size],
  );

  // -----------------------------------------------------------------------
  // GL context setup
  // -----------------------------------------------------------------------

  const onContextCreate = useCallback(
    async (gl: ExpoWebGLRenderingContext) => {
    try {
      // ----- Renderer -----
      const renderer = new Renderer({ gl });
      renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
      renderer.setPixelRatio(1);
      renderer.setClearColor(0x060b12, 1); // dark Bazodiac background, fully opaque

      // ----- Scene & Camera -----
      const scene = new Scene();
      const aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
      const viewRange = 3;
      const camera = new OrthographicCamera(
        -viewRange * aspect,
        viewRange * aspect,
        viewRange,
        -viewRange,
        0.1,
        100,
      );
      camera.position.set(0, 0, 10);
      camera.lookAt(0, 0, 0);

      // ----- Generate signature -----
      const quiz = quizWeights ?? new Map<QuizDimension, number>();
      const MAX_R = 2.0;

      // generateSignature computes weights internally, applies kaleidoscope,
      // and returns the full particle set. The engine's internal budget logic
      // yields ~28K particles at default; we cap to 14K on mobile below.
      const sig = generateSignature(natalWeights, quiz, MAX_R, true);

      // We further cap on mobile to be safe
      const MAX_MOBILE_PARTICLES = 14000;
      const particles = sig.particles.length > MAX_MOBILE_PARTICLES
        ? sig.particles.slice(0, MAX_MOBILE_PARTICLES)
        : sig.particles;
      const count = particles.length;

      // ----- Build buffer arrays -----
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const sizes = new Float32Array(count);
      const alphas = new Float32Array(count);

      for (let i = 0; i < count; i++) {
        const p = particles[i]!;
        const cfg = LAYER_CONFIGS[p.layer] ?? LAYER_CONFIGS.curve!;

        // 2D layout: x/y in plane, z=0
        positions[i * 3] = p.x;
        positions[i * 3 + 1] = p.y;
        positions[i * 3 + 2] = 0;

        colors[i * 3] = p.color[0];
        colors[i * 3 + 1] = p.color[1];
        colors[i * 3 + 2] = p.color[2];

        sizes[i] = p.r * cfg.sizeScale;
        alphas[i] = Math.min(1.0, p.alpha * cfg.alphaScale);
      }

      // ----- Geometry -----
      const geometry = new BufferGeometry();
      geometry.setAttribute('position', new BufferAttribute(positions, 3));
      geometry.setAttribute('color', new BufferAttribute(colors, 3));
      geometry.setAttribute('size', new BufferAttribute(sizes, 1));
      geometry.setAttribute('alpha', new BufferAttribute(alphas, 1));

      // ----- Material -----
      const material = new ShaderMaterial({
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      });

      // ----- Points mesh -----
      const points = new Points(geometry, material);
      scene.add(points);

      // ----- Store base positions for animation -----
      const basePositions = new Float32Array(positions);

      // ----- Kp-Index modulation factors -----
      const kpDriftFactor = kpIndex >= 3 ? 1 + (kpIndex - 3) * 0.15 : 1;
      const kpAlphaBoost = kpIndex >= 5 ? 1.2 : 1.0;
      const kpTurbulence = kpIndex >= 5;

      // If kpIndex >= 5, boost glow particle alphas
      if (kpAlphaBoost > 1.0) {
        for (let i = 0; i < count; i++) {
          if (particles[i]!.layer === 'glow') {
            alphas[i] = Math.min(1.0, alphas[i]! * kpAlphaBoost);
          }
        }
        geometry.attributes.alpha!.needsUpdate = true;
      }

      // ----- Store camera ref for touch interaction -----
      cameraRef.current = camera;

      // ----- Burst particle rendering -----
      // We maintain a separate Points object for burst particles
      const BURST_MAX = 200; // max burst particles at once
      const burstPositions = new Float32Array(BURST_MAX * 3);
      const burstColors = new Float32Array(BURST_MAX * 3);
      const burstSizes = new Float32Array(BURST_MAX);
      const burstAlphas = new Float32Array(BURST_MAX);

      const burstGeometry = new BufferGeometry();
      burstGeometry.setAttribute('position', new BufferAttribute(burstPositions, 3));
      burstGeometry.setAttribute('color', new BufferAttribute(burstColors, 3));
      burstGeometry.setAttribute('size', new BufferAttribute(burstSizes, 1));
      burstGeometry.setAttribute('alpha', new BufferAttribute(burstAlphas, 1));
      burstGeometry.setDrawRange(0, 0);

      const burstMaterial = new ShaderMaterial({
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      });

      const burstPoints = new Points(burstGeometry, burstMaterial);
      scene.add(burstPoints);

      // ----- Animation -----
      let disposed = false;
      let lastFrameTime = 0;
      const FRAME_INTERVAL = 33; // ~30fps

      const animate = (time: number) => {
        if (disposed) return;

        // 30fps throttle
        if (time - lastFrameTime < FRAME_INTERVAL) {
          animationRef.current = requestAnimationFrame(animate);
          return;
        }
        lastFrameTime = time;

        const t = time * 0.001; // seconds
        const posArr = geometry.attributes.position!.array as Float32Array;

        for (let i = 0; i < count; i++) {
          const p = particles[i]!;
          const idx = i * 3;

          // Base position
          let bx = basePositions[idx]!;
          let by = basePositions[idx + 1]!;

          // Drift: slowly accumulate velocity, but wrap around to prevent escape
          bx += p.vx * kpDriftFactor;
          by += p.vy * kpDriftFactor;

          // Wrap particles that drift too far — keeps them in the visible scene
          const maxDrift = 3.5;
          if (bx > maxDrift) bx -= maxDrift * 2;
          if (bx < -maxDrift) bx += maxDrift * 2;
          if (by > maxDrift) by -= maxDrift * 2;
          if (by < -maxDrift) by += maxDrift * 2;

          basePositions[idx] = bx;
          basePositions[idx + 1] = by;

          // Phase oscillation — breathing motion
          let oscX = Math.sin(t * 0.4 + p.phase) * 0.02;
          let oscY = Math.sin(t * 0.3 + p.phase * 1.3) * 0.014;

          // Layer-specific breathing amplitude
          if (p.layer === 'glow') {
            oscX *= 2.5;
            oscY *= 2.5;
          } else if (p.layer === 'fractal' || p.layer === 'subfractal') {
            oscX *= 0.4;
            oscY *= 0.4;
          }

          // Kp turbulence — add high-frequency jitter
          if (kpTurbulence) {
            oscX += Math.sin(t * 3.0 + p.phase * 2.7) * 0.008;
            oscY += Math.cos(t * 2.5 + p.phase * 3.1) * 0.008;
          }

          posArr[idx] = bx + oscX;
          posArr[idx + 1] = by + oscY;
          // z stays 0
        }

        geometry.attributes.position!.needsUpdate = true;

        // ----- Update burst particles -----
        const bursts = burstParticlesRef.current;
        let aliveCount = 0;

        for (let i = 0; i < bursts.length && aliveCount < BURST_MAX; i++) {
          const bp = bursts[i]!;
          bp.x += bp.vx;
          bp.y += bp.vy;
          bp.age++;
          bp.alpha = 0.8 * (1 - bp.age / bp.lifetime);

          if (bp.alpha < 0.01) continue;

          const idx = aliveCount * 3;
          burstPositions[idx] = bp.x;
          burstPositions[idx + 1] = bp.y;
          burstPositions[idx + 2] = 0;

          // Gold color
          burstColors[idx] = 1.0;
          burstColors[idx + 1] = 0.85;
          burstColors[idx + 2] = 0.2;

          burstSizes[aliveCount] = bp.size * 0.01; // scale down for ortho camera
          burstAlphas[aliveCount] = bp.alpha;
          aliveCount++;
        }

        // Remove dead particles in-place (avoid creating new arrays every frame)
        let writeIdx = 0;
        for (let i = 0; i < bursts.length; i++) {
          const bp = bursts[i]!;
          if (bp.alpha >= 0.01 && bp.age < bp.lifetime) {
            bursts[writeIdx++] = bp;
          }
        }
        bursts.length = writeIdx;

        burstGeometry.setDrawRange(0, aliveCount);
        burstGeometry.attributes.position!.needsUpdate = true;
        burstGeometry.attributes.color!.needsUpdate = true;
        burstGeometry.attributes.size!.needsUpdate = true;
        burstGeometry.attributes.alpha!.needsUpdate = true;

        // ----- Camera parallax drift -----
        const target = cameraTargetRef.current;
        const offset = cameraOffsetRef.current;
        offset.x += (target.x - offset.x) * 0.08;
        offset.y += (target.y - offset.y) * 0.08;
        camera.position.set(offset.x, offset.y, 10);
        camera.lookAt(offset.x, offset.y, 0);

        renderer.render(scene, camera);
        gl.endFrameEXP();

        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);

      // ----- Disposal closure -----
      disposeRef.current = () => {
        disposed = true;
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = 0;
        }
        geometry.dispose();
        material.dispose();
        burstGeometry.dispose();
        burstMaterial.dispose();
        renderer.dispose();
      };

      onReady?.();
    } catch (err) {
      console.warn(
        '[SignaturEngine] V2 GL context failed — degrading to V1 SignaturCanvas.',
        err,
      );
      onFailed?.();
    }
    },
    // We intentionally only depend on the initial values.
    // Re-creating the GL scene for prop changes would be wasteful;
    // instead, hot-update via refs if needed in the future.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [natalWeights, quizWeights, kpIndex],
  );

  // -----------------------------------------------------------------------
  // Cleanup on unmount
  // -----------------------------------------------------------------------

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      disposeRef.current?.();
    };
  }, []);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <View {...panResponder.panHandlers} style={{ width: size, height: size, backgroundColor: '#060b12', borderRadius: 16, overflow: 'hidden' }}>
      <GLView
        style={{ width: size, height: size }}
        onContextCreate={onContextCreate}
      />
    </View>
  );
}

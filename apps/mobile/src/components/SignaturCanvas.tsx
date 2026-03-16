import { useEffect, useRef, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { GLView, type ExpoWebGLRenderingContext } from 'expo-gl';
import { Renderer } from 'expo-three';
import {
  Scene,
  PerspectiveCamera,
  AmbientLight,
  DirectionalLight,
  Clock,
  Color,
  BufferGeometry,
  BufferAttribute,
  ShaderMaterial,
  Points,
  PointsMaterial,
  AdditiveBlending,
  Group,
} from 'three';

// === SOUL PROFILE (fallback when no real user data available) ===
const DEFAULT_SOUL_PROFILE = [
  0.6, 0.45, 0.8, 0.35, 0.7, 0.55, 0.9, 0.4,
  0.65, 0.5, 0.75, 0.3, 0.85, 0.6, 0.42, 0.72,
  0.58, 0.88, 0.38, 0.68, 0.52, 0.78, 0.44, 0.82,
  0.56, 0.7, 0.48, 0.62, 0.9, 0.36, 0.74, 0.54,
];

// Module-level active profile — synced from sectors prop via useEffect.
// Read by soulNoise() during particle generation.
let _activeSoulProfile: number[] = DEFAULT_SOUL_PROFILE;

function hash(n: number): number {
  const x = Math.sin(n * 127.1 + n * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function soulNoise(angle: number, seed: number): number {
  const profile = _activeSoulProfile;
  const idx = ((angle / (Math.PI * 2)) * profile.length) % profile.length;
  const i0 = Math.floor(idx) % profile.length;
  const i1 = (i0 + 1) % profile.length;
  const frac = idx - Math.floor(idx);
  const t = frac * frac * (3 - 2 * frac); // smoothstep
  const v0 = profile[i0] ?? 0.5;
  const v1 = profile[i1] ?? 0.5;
  return (v0 * (1 - t) + v1 * t) * seed;
}

// Camera orbit constants (matching web canvas)
const HOME_ROT_X = 1.48;  // near 90° — almost straight down, slight depth
const HOME_ROT_Y = 0;
const HOME_ZOOM = 8.5;
const IDLE_DELAY = 1500;   // ms after last touch before returning home
const RETURN_SPEED = 0.012;

interface SignaturCanvasProps {
  /** 12-sector fusion signal values — drives ring deformation */
  sectors?: number[];
  /** Pause rendering when screen not visible */
  paused?: boolean;
}

export function SignaturCanvas({ sectors, paused = false }: SignaturCanvasProps) {
  const rafRef = useRef<number>(0);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  // Camera orbit state — ref so the GL render loop can read it
  const cameraState = useRef({
    targetRotX: HOME_ROT_X,
    targetRotY: HOME_ROT_Y,
    currentRotX: HOME_ROT_X,
    currentRotY: HOME_ROT_Y,
    zoom: HOME_ZOOM,
    targetZoom: HOME_ZOOM,
    lastInteraction: 0,
  });

  // Track previous gesture values for computing deltas
  const prevPan = useRef({ x: 0, y: 0 });
  const prevPinchScale = useRef(1);

  // Store disposable GPU resources for cleanup on unmount
  const disposablesRef = useRef<Array<{ dispose: () => void }>>([]);

  // Sync 12-sector signal → 32-point soul profile via smoothstep interpolation
  useEffect(() => {
    if (sectors && sectors.length === 12) {
      _activeSoulProfile = Array.from({ length: 32 }, (_, i) => {
        const t = (i / 32) * 12;
        const i0 = Math.floor(t) % 12;
        const i1 = (i0 + 1) % 12;
        const frac = t - Math.floor(t);
        const s = frac * frac * (3 - 2 * frac);
        return (sectors[i0] ?? 0.5) * (1 - s) + (sectors[i1] ?? 0.5) * s;
      });
    } else {
      _activeSoulProfile = DEFAULT_SOUL_PROFILE;
    }
    return () => { _activeSoulProfile = DEFAULT_SOUL_PROFILE; };
  }, [sectors]);

  // Gesture handlers
  const panGesture = useMemo(() =>
    Gesture.Pan()
      .activeOffsetX([-10, 10]) // 10px dead zone to avoid conflict with tab swipe
      .activeOffsetY([-10, 10])
      .onBegin((e) => {
        prevPan.current = { x: e.translationX, y: e.translationY };
      })
      .onUpdate((e) => {
        const cs = cameraState.current;
        const dx = e.translationX - prevPan.current.x;
        const dy = e.translationY - prevPan.current.y;
        prevPan.current = { x: e.translationX, y: e.translationY };

        cs.targetRotY += dx * 0.005;
        cs.targetRotX = Math.max(0.05, Math.min(1.55, cs.targetRotX + dy * 0.003));
        cs.lastInteraction = Date.now();
      }),
  []);

  const pinchGesture = useMemo(() =>
    Gesture.Pinch()
      .onBegin(() => {
        prevPinchScale.current = 1;
      })
      .onUpdate((e) => {
        const cs = cameraState.current;
        // Compute scale delta since last update
        const scaleDelta = e.scale / prevPinchScale.current;
        prevPinchScale.current = e.scale;
        // Pinch out (scaleDelta > 1) = zoom in (lower zoom value)
        cs.targetZoom = Math.max(4, Math.min(12, cs.targetZoom / scaleDelta));
        cs.lastInteraction = Date.now();
      }),
  []);

  const composedGesture = useMemo(
    () => Gesture.Simultaneous(panGesture, pinchGesture),
    [panGesture, pinchGesture],
  );

  const onContextCreate = useCallback((gl: ExpoWebGLRenderingContext) => {
    // === RENDERER ===
    const renderer = new Renderer({ gl });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    renderer.setClearColor(0x030308);

    // === SCENE ===
    const scene = new Scene();

    // === CAMERA ===
    const aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
    const camera = new PerspectiveCamera(40, aspect, 0.1, 100);
    camera.position.set(
      0,
      Math.sin(HOME_ROT_X) * HOME_ZOOM,
      Math.cos(HOME_ROT_X) * HOME_ZOOM,
    );
    camera.lookAt(0, 0, 0);

    // === LIGHTING ===
    const keyLight = new DirectionalLight(0xf5ede0, 2.0);
    keyLight.position.set(5, 8, 5);
    scene.add(keyLight);

    const fillLight = new DirectionalLight(0x8898c0, 0.6);
    fillLight.position.set(-5, 3, -3);
    scene.add(fillLight);

    const ambient = new AmbientLight(0x1a1a3e, 0.3);
    scene.add(ambient);

    // === RING GROUP ===
    const ringGroup = new Group();
    scene.add(ringGroup);

    const RADIUS = 2;
    const TUBE = 0.22;

    // === RING PARTICLES (6,000) ===
    const RING_COUNT = 6000;
    const ringPositions = new Float32Array(RING_COUNT * 3);
    const ringColors = new Float32Array(RING_COUNT * 3);
    const ringSizes = new Float32Array(RING_COUNT);

    const brightColor = new Color(0xc0c8d8);
    const dimColor = new Color(0x3a3a48);

    for (let i = 0; i < RING_COUNT; i++) {
      const mainAngle = (i / RING_COUNT) * Math.PI * 2 + hash(i) * 0.02;
      const tubeAngle = hash(i * 7 + 3) * Math.PI * 2;
      const normalizedAngle = mainAngle % (Math.PI * 2);

      // Soul noise harmonics (simplified — fewer octaves for mobile)
      const soulVal = soulNoise(normalizedAngle, 1.0);
      const h1 = soulNoise(normalizedAngle * 3 + 0.5, 0.4);
      const h2 = soulNoise(normalizedAngle * 7 + 1.2, 0.2);
      const soulDisplacement = (soulVal + h1 + h2 - 0.3) * 0.25;

      const microNoise = (hash(i * 13 + 7) - 0.5) * 0.06;
      const localTube = TUBE + soulDisplacement + microNoise;

      const r = RADIUS + Math.cos(tubeAngle) * localTube;
      const y = Math.sin(tubeAngle) * localTube;
      const x = Math.cos(mainAngle) * r;
      const z = Math.sin(mainAngle) * r;

      ringPositions[i * 3] = x;
      ringPositions[i * 3 + 1] = y;
      ringPositions[i * 3 + 2] = z;

      const brightness = 0.3 + soulVal * 0.5 + hash(i * 17) * 0.2;
      const col = new Color().lerpColors(dimColor, brightColor, brightness);
      ringColors[i * 3] = col.r;
      ringColors[i * 3 + 1] = col.g;
      ringColors[i * 3 + 2] = col.b;

      const outerFactor = 0.5 + Math.cos(tubeAngle) * 0.5;
      ringSizes[i] = 0.012 + outerFactor * 0.015 + soulVal * 0.005;
    }

    const ringGeo = new BufferGeometry();
    ringGeo.setAttribute('position', new BufferAttribute(ringPositions, 3));
    ringGeo.setAttribute('color', new BufferAttribute(ringColors, 3));
    ringGeo.setAttribute('size', new BufferAttribute(ringSizes, 1));

    const ringMat = new ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (200.0 / -mvPosition.z);
          gl_PointSize = max(gl_PointSize, 1.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float alpha = 1.0 - smoothstep(0.3, 0.5, d);
          gl_FragColor = vec4(vColor, alpha * 0.85);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });

    const ringParticles = new Points(ringGeo, ringMat);
    ringGroup.add(ringParticles);

    // === CORONA GLOW PARTICLES (800 — peaks only) ===
    const CORONA_COUNT = 800;
    const coronaPositions = new Float32Array(CORONA_COUNT * 3);
    const coronaColors = new Float32Array(CORONA_COUNT * 3);
    const coronaSizes = new Float32Array(CORONA_COUNT);

    const glowColor = new Color(0x4a8abc);

    for (let i = 0; i < CORONA_COUNT; i++) {
      const mainAngle = (i / CORONA_COUNT) * Math.PI * 2 + hash(i + 50000) * 0.05;
      const normalizedAngle = mainAngle % (Math.PI * 2);
      const soulVal = soulNoise(normalizedAngle, 1.0);
      const h1 = soulNoise(normalizedAngle * 3 + 0.5, 0.4);
      const soulDisp = (soulVal + h1 - 0.2) * 0.55;

      const isPeak = soulVal > 0.5;
      const coronaHeight = isPeak
        ? soulDisp * 1.2 + hash(i + 70000) * 0.15
        : soulDisp * 0.3;

      const tubeAngle = hash(i * 11 + 70000) * Math.PI * 2;
      const localTube = TUBE + coronaHeight + hash(i * 19 + 80000) * 0.05;
      const r = RADIUS + Math.cos(tubeAngle) * localTube;
      const y = Math.sin(tubeAngle) * localTube;
      const x = Math.cos(mainAngle) * r;
      const z = Math.sin(mainAngle) * r;

      coronaPositions[i * 3] = x;
      coronaPositions[i * 3 + 1] = y;
      coronaPositions[i * 3 + 2] = z;

      const intensity = isPeak ? 0.5 + soulVal * 0.5 : 0.2;
      const col = new Color().copy(glowColor).multiplyScalar(intensity);
      coronaColors[i * 3] = col.r;
      coronaColors[i * 3 + 1] = col.g;
      coronaColors[i * 3 + 2] = col.b;

      coronaSizes[i] = isPeak ? 0.025 + soulVal * 0.03 : 0.01;
    }

    const coronaGeo = new BufferGeometry();
    coronaGeo.setAttribute('position', new BufferAttribute(coronaPositions, 3));
    coronaGeo.setAttribute('color', new BufferAttribute(coronaColors, 3));
    coronaGeo.setAttribute('size', new BufferAttribute(coronaSizes, 1));

    const coronaMat = new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uGlowIntensity: { value: 1.0 },
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (200.0 / -mvPosition.z);
          gl_PointSize = max(gl_PointSize, 1.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        uniform float uGlowIntensity;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float alpha = (1.0 - smoothstep(0.1, 0.5, d)) * 0.6 * uGlowIntensity;
          gl_FragColor = vec4(vColor * 1.5, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });

    const coronaParticles = new Points(coronaGeo, coronaMat);
    ringGroup.add(coronaParticles);

    // === AMBIENT DUST (200 sparse particles) ===
    const DUST_COUNT = 200;
    const dustPositions = new Float32Array(DUST_COUNT * 3);
    for (let i = 0; i < DUST_COUNT; i++) {
      const angle = hash(i * 53) * Math.PI * 2;
      const r = RADIUS + (hash(i * 67) - 0.5) * 1.2;
      dustPositions[i * 3] = Math.cos(angle) * r;
      dustPositions[i * 3 + 1] = (hash(i * 79) - 0.5) * 0.8;
      dustPositions[i * 3 + 2] = Math.sin(angle) * r;
    }
    const dustGeo = new BufferGeometry();
    dustGeo.setAttribute('position', new BufferAttribute(dustPositions, 3));
    const dustMat = new PointsMaterial({
      color: 0x4a6a8a,
      size: 0.008,
      transparent: true,
      opacity: 0.3,
      sizeAttenuation: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    const dust = new Points(dustGeo, dustMat);
    ringGroup.add(dust);

    // === RENDER LOOP ===
    const clock = new Clock();
    let lastFrameTime = 0;
    const TARGET_INTERVAL = 1000 / 30; // 30fps cap

    // Capture ref for closure — ref object is stable, .current updates live
    const csRef = cameraState;

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);

      if (pausedRef.current) return;

      const now = performance.now();
      if (now - lastFrameTime < TARGET_INTERVAL) return;
      lastFrameTime = now;

      const t = clock.getElapsedTime();
      const cs = csRef.current;

      // Return-to-home when idle
      if (Date.now() - cs.lastInteraction > IDLE_DELAY) {
        cs.targetRotX += (HOME_ROT_X - cs.targetRotX) * RETURN_SPEED;
        cs.targetRotY += (HOME_ROT_Y - cs.targetRotY) * RETURN_SPEED;
        cs.targetZoom += (HOME_ZOOM - cs.targetZoom) * RETURN_SPEED;
      }

      // Smooth camera interpolation
      cs.currentRotY += (cs.targetRotY - cs.currentRotY) * 0.05;
      cs.currentRotX += (cs.targetRotX - cs.currentRotX) * 0.05;
      cs.zoom += (cs.targetZoom - cs.zoom) * 0.05;

      // Apply camera position from spherical coordinates
      camera.position.x = Math.sin(cs.currentRotY) * Math.cos(cs.currentRotX) * cs.zoom;
      camera.position.y = Math.sin(cs.currentRotX) * cs.zoom;
      camera.position.z = Math.cos(cs.currentRotY) * Math.cos(cs.currentRotX) * cs.zoom;
      camera.lookAt(0, 0, 0);

      // Ring breathing (subtle vertical float)
      ringGroup.position.y = Math.sin(t * 0.3) * 0.03;

      // Dust drift
      dust.rotation.y = t * 0.003;

      // Corona glow pulse
      coronaMat.uniforms.uGlowIntensity.value = 0.8 + Math.sin(t * 0.4) * 0.2;

      // Update time uniforms
      ringMat.uniforms.uTime.value = t;
      coronaMat.uniforms.uTime.value = t;

      renderer.render(scene, camera);
      gl.endFrameEXP();
    };

    // Store disposable resources for cleanup
    disposablesRef.current = [ringGeo, ringMat, coronaGeo, coronaMat, dustGeo, dustMat, renderer];

    animate();
  }, []);

  // Cleanup: cancel render loop + dispose GPU resources
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      for (const d of disposablesRef.current) d.dispose();
      disposablesRef.current = [];
    };
  }, []);

  return (
    <View style={styles.container}>
      <GestureDetector gesture={composedGesture}>
        <GLView
          style={styles.gl}
          onContextCreate={onContextCreate}
          msaaSamples={0}
        />
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030308',
  },
  gl: {
    flex: 1,
  },
});

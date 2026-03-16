# 3D Signatur Native Mobile — Tasks 7-9 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the WebView-based Fusion Ring with a native 3D particle ring rendered via expo-gl + three.js on iOS, with touch gestures and mobile performance optimizations.

**Architecture:** The web canvas (`FusionRingWebsiteCanvas.tsx`, ~1750 lines) renders 28,000 ring particles + 3,000 corona particles using Three.js Points with custom GLSL shaders, profile-driven deformation channels, and 8 transit effect types. The mobile port simplifies this to ~6,000 ring + ~800 corona particles, drops audio/effects/environment-map, caps at 30fps, and uses `react-native-gesture-handler` for touch instead of DOM events. The `computeFusionSignal()` from `@bazodiac/shared` provides the 12-sector signal that drives ring shape.

**Tech Stack:** expo-gl, three, expo-three, @bazodiac/shared (fusion signal math), react-native-gesture-handler (already installed), React Native 0.79 / Expo 53

---

## Task 7: Set up expo-gl + three.js rendering context

**Files:**
- Modify: `apps/mobile/package.json` (add expo-gl, three, expo-three)
- Create: `apps/mobile/src/components/SignaturCanvas.tsx`

### Step 1: Install dependencies

```bash
cd apps/mobile && npx expo install expo-gl three expo-three
```

Verify these appear in `package.json` dependencies:
- `expo-gl`: `~15.0.x`
- `three`: `^0.170.x` (expo-three peer dep — check compatibility)
- `expo-three`: `^8.0.x`

### Step 2: Run typecheck to verify no conflicts

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: PASS (no new errors from the three.js types)

### Step 3: Create minimal SignaturCanvas with rotating torus

Create `apps/mobile/src/components/SignaturCanvas.tsx`:

```typescript
import { useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { GLView, type ExpoWebGLRenderingContext } from 'expo-gl';
import { Renderer } from 'expo-three';
import {
  Scene,
  PerspectiveCamera,
  TorusGeometry,
  MeshBasicMaterial,
  Mesh,
  AmbientLight,
  Clock,
} from 'three';

interface SignaturCanvasProps {
  /** 12-sector fusion signal values — drives ring deformation later */
  sectors?: number[];
  /** Pause rendering when screen not visible */
  paused?: boolean;
}

export function SignaturCanvas({ paused = false }: SignaturCanvasProps) {
  const rafRef = useRef<number>(0);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

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
    camera.position.set(0, 6, 8);
    camera.lookAt(0, 0, 0);

    // === LIGHTING ===
    const ambient = new AmbientLight(0x4a6a8a, 1.5);
    scene.add(ambient);

    // === PLACEHOLDER RING ===
    const torusGeo = new TorusGeometry(2, 0.22, 16, 100);
    const torusMat = new MeshBasicMaterial({
      color: 0xc0c8d8,
      wireframe: true,
    });
    const torus = new Mesh(torusGeo, torusMat);
    torus.rotation.x = Math.PI / 2; // lay flat
    scene.add(torus);

    // === RENDER LOOP ===
    const clock = new Clock();
    let lastFrameTime = 0;
    const TARGET_INTERVAL = 1000 / 30; // 30fps cap

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);

      if (pausedRef.current) return;

      const now = performance.now();
      if (now - lastFrameTime < TARGET_INTERVAL) return;
      lastFrameTime = now;

      const t = clock.getElapsedTime();
      torus.rotation.z = t * 0.1; // slow rotation

      renderer.render(scene, camera);
      gl.endFrameEXP();
    };

    animate();
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <View style={styles.container}>
      <GLView
        style={styles.gl}
        onContextCreate={onContextCreate}
        msaaSamples={0}
      />
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
```

### Step 4: Smoke-test in FuRingScreen

Temporarily import `SignaturCanvas` into `FuRingScreen.tsx` and render it above the sector bars to verify GL rendering works:

```typescript
// At top of FuRingScreen.tsx, add:
import { SignaturCanvas } from '../components/SignaturCanvas';

// In the JSX, add before the FlatList:
<View style={{ height: 300 }}>
  <SignaturCanvas />
</View>
```

### Step 5: Verify rendering on iOS simulator

```bash
cd apps/mobile && npx expo run:ios
```

Navigate to FuRing tab. Verify:
- A wireframe torus renders in a black 300px-tall container
- It rotates slowly
- No GL errors in the console
- App doesn't crash or freeze

### Step 6: Revert smoke-test changes in FuRingScreen

Remove the temporary `SignaturCanvas` import and `<View>` wrapper from FuRingScreen — we'll integrate properly in Task 9.

### Step 7: Commit

```bash
git add apps/mobile/package.json apps/mobile/src/components/SignaturCanvas.tsx
git commit -m "feat(mobile): set up expo-gl + three.js rendering context with placeholder torus"
```

---

## Task 8: Port Signatur ring geometry and shaders

**Files:**
- Modify: `apps/mobile/src/components/SignaturCanvas.tsx`

**Context — Web canvas architecture to port:**

The web canvas (`FusionRingWebsiteCanvas.tsx`) builds the ring from:
1. **28,000 ring particles** positioned on a torus (R=2, tube=0.22) with per-particle deformation from `soulNoise()` + profile channels
2. **3,000 corona particles** at peaks (taller, sparser, blue glow)
3. **500 ambient dust** floating around
4. **Custom GLSL vertex/fragment shaders** for point size attenuation + soft circular particles
5. **Profile deformation channels**: `radiusOffset`, `tubeScale`, `roughness`, `colorTint`, `coronaFactor` — all angle-based

**Mobile simplification:**
- Ring: 6,000 particles (vs 28k) — still looks dense on phone screen
- Corona: 800 particles (vs 3k)
- Dust: 200 (vs 500)
- No profile deformation channels (use soulNoise only from the 12-sector signal)
- No effects system (no spikes, beams, cascades, shockwaves)
- No audio engine
- No environment map

### Step 1: Add the soulNoise function

Port the `soulNoise()` + `hash()` functions from the web canvas. These are pure math — no DOM dependencies:

```typescript
// Add at module level in SignaturCanvas.tsx

const DEFAULT_SOUL_PROFILE = [
  0.6, 0.45, 0.8, 0.35, 0.7, 0.55, 0.9, 0.4,
  0.65, 0.5, 0.75, 0.3, 0.85, 0.6, 0.42, 0.72,
  0.58, 0.88, 0.38, 0.68, 0.52, 0.78, 0.44, 0.82,
  0.56, 0.7, 0.48, 0.62, 0.9, 0.36, 0.74, 0.54,
];

let _activeSoulProfile: number[] = DEFAULT_SOUL_PROFILE;

function hash(n: number): number {
  let x = Math.sin(n * 127.1 + n * 311.7) * 43758.5453;
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
```

### Step 2: Build 12→32 sector interpolation from props

Add `useEffect` to sync the `sectors` prop (12 values from `computeFusionSignal`) into the module-level `_activeSoulProfile` (32 values):

```typescript
// Inside SignaturCanvas component body:
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
```

### Step 3: Replace placeholder torus with particle ring

Replace the torus mesh in `onContextCreate` with the particle ring system. The structure follows the web canvas but at reduced particle counts:

```typescript
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

  // Color
  const brightness = 0.3 + soulVal * 0.5 + hash(i * 17) * 0.2;
  const col = new Color().lerpColors(dimColor, brightColor, brightness);
  ringColors[i * 3] = col.r;
  ringColors[i * 3 + 1] = col.g;
  ringColors[i * 3 + 2] = col.b;

  // Size
  const outerFactor = 0.5 + Math.cos(tubeAngle) * 0.5;
  ringSizes[i] = 0.012 + outerFactor * 0.015 + soulVal * 0.005;
}

const ringGeo = new BufferGeometry();
ringGeo.setAttribute('position', new BufferAttribute(ringPositions, 3));
ringGeo.setAttribute('color', new BufferAttribute(ringColors, 3));
ringGeo.setAttribute('size', new BufferAttribute(ringSizes, 1));

// Custom shader for varied point sizes
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
  // Note: AdditiveBlending may need THREE import
});
ringMat.blending = 2; // AdditiveBlending = 2

const ringParticles = new Points(ringGeo, ringMat);
scene.add(ringParticles);
```

### Step 4: Add corona glow particles

```typescript
// === CORONA (800 particles — peaks only) ===
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
  uniforms: { uTime: { value: 0 }, uGlowIntensity: { value: 1.0 } },
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
});
coronaMat.blending = 2; // AdditiveBlending

const coronaParticles = new Points(coronaGeo, coronaMat);
scene.add(coronaParticles);
```

### Step 5: Add ambient dust

```typescript
// === DUST (200 sparse particles) ===
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
});
dustMat.blending = 2; // AdditiveBlending
dustMat.depthWrite = false;
const dust = new Points(dustGeo, dustMat);
scene.add(dust);
```

### Step 6: Add idle breathing animation

In the `animate()` function, add the breathing motion from the web canvas:

```typescript
// In animate(), after the 30fps gate:
const t = clock.getElapsedTime();

// Ring breathing (subtle vertical float)
ringParticles.position.y = Math.sin(t * 0.3) * 0.03;
coronaParticles.position.y = Math.sin(t * 0.3) * 0.03;

// Dust drift
dust.rotation.y = t * 0.003;

// Corona glow pulse
coronaMat.uniforms.uGlowIntensity.value = 0.8 + Math.sin(t * 0.4) * 0.2;

// Update time uniforms
ringMat.uniforms.uTime.value = t;
coronaMat.uniforms.uTime.value = t;

renderer.render(scene, camera);
gl.endFrameEXP();
```

### Step 7: Update imports

Ensure all Three.js classes are imported:

```typescript
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
} from 'three';
```

### Step 8: Verify rendering on iOS simulator

```bash
cd apps/mobile && npx expo run:ios
```

Temporarily mount `<SignaturCanvas sectors={fusion.sectors} />` in FuRingScreen. Verify:
- Particle ring renders with sector-driven shape variations
- Corona glow at peaks is visible
- Dust floats in background
- Breathing animation is smooth at 30fps
- No GL errors

### Step 9: Revert temporary FuRingScreen changes

### Step 10: Commit

```bash
git add apps/mobile/src/components/SignaturCanvas.tsx
git commit -m "feat(mobile): port Signatur particle ring geometry and shaders from web canvas"
```

---

## Task 9: Add touch interaction and performance tuning

**Files:**
- Modify: `apps/mobile/src/components/SignaturCanvas.tsx`
- Modify: `apps/mobile/src/screens/FuRingScreen.tsx`

### Step 1: Add camera orbit state to SignaturCanvas

Add touch-driven camera control (matching the web canvas orbit logic). The camera state is managed outside the GL callback via refs:

```typescript
// Add to SignaturCanvas component, before onContextCreate:

const cameraState = useRef({
  targetRotX: 1.48,  // near top-down, matching web HOME_ROT_X
  targetRotY: 0,
  currentRotX: 1.48,
  currentRotY: 0,
  zoom: 8.5,
  targetZoom: 8.5,
  lastInteraction: 0,
});
```

### Step 2: Add pan gesture handler for orbit rotation

Wrap the `GLView` with gesture handlers from `react-native-gesture-handler`:

```typescript
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

// In component body:
const panGesture = Gesture.Pan()
  .onUpdate((e) => {
    const state = cameraState.current;
    state.targetRotY += e.translationX * 0.003;
    state.targetRotX = Math.max(0.05, Math.min(1.55,
      state.targetRotX + e.translationY * 0.002
    ));
    state.lastInteraction = Date.now();
  });

const pinchGesture = Gesture.Pinch()
  .onUpdate((e) => {
    const state = cameraState.current;
    // Pinch out = zoom in (lower value), pinch in = zoom out
    state.targetZoom = Math.max(4, Math.min(12,
      state.targetZoom / e.scale
    ));
    state.lastInteraction = Date.now();
  });

const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);
```

Update the JSX:

```tsx
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
```

### Step 3: Update animation loop to read camera state

In `animate()`, read from `cameraState.current` and apply camera interpolation:

```typescript
// Return-to-home when idle (1.5s after last touch)
const HOME_ROT_X = 1.48;
const HOME_ROT_Y = 0;
const HOME_ZOOM = 8.5;
const IDLE_DELAY = 1500;
const RETURN_SPEED = 0.012;

const cs = cameraStateRef.current; // pass ref into onContextCreate closure

const now = Date.now();
if (now - cs.lastInteraction > IDLE_DELAY) {
  cs.targetRotX += (HOME_ROT_X - cs.targetRotX) * RETURN_SPEED;
  cs.targetRotY += (HOME_ROT_Y - cs.targetRotY) * RETURN_SPEED;
  cs.targetZoom += (HOME_ZOOM - cs.targetZoom) * RETURN_SPEED;
}

cs.currentRotY += (cs.targetRotY - cs.currentRotY) * 0.05;
cs.currentRotX += (cs.targetRotX - cs.currentRotX) * 0.05;
cs.zoom += (cs.targetZoom - cs.zoom) * 0.05;

camera.position.x = Math.sin(cs.currentRotY) * Math.cos(cs.currentRotX) * cs.zoom;
camera.position.y = Math.sin(cs.currentRotX) * cs.zoom;
camera.position.z = Math.cos(cs.currentRotY) * Math.cos(cs.currentRotX) * cs.zoom;
camera.lookAt(0, 0, 0);
```

**Important:** Pass `cameraState` as a ref captured in the `onContextCreate` closure. Since `onContextCreate` is a `useCallback` with `[]` deps, use a ref pattern:

```typescript
const cameraStateRef = useRef(cameraState.current);
// Keep ref synchronized
cameraStateRef.current = cameraState.current;
```

Actually simpler: just use one ref directly and read it inside `onContextCreate` — the closure captures the ref object (stable), and `.current` is always up to date.

### Step 4: Performance optimizations

Apply these inside `onContextCreate`:

```typescript
// 1. 30fps cap (already done in Step 3 of Task 7)
const TARGET_INTERVAL = 1000 / 30;

// 2. Pixel ratio capped to 1 (saves 4x fill rate on Retina)
// expo-gl handles this — no devicePixelRatio in the shader
// The shader already uses fixed 200.0 instead of uPixelRatio * 300.0

// 3. No antialiasing
// GLView msaaSamples={0} already set

// 4. Visibility check — pause when screen not focused
// Already handled via `paused` prop + `pausedRef`
```

### Step 5: Add `paused` control via screen focus

In `FuRingScreen.tsx`, use React Navigation's `useIsFocused()`:

```typescript
import { useIsFocused } from '@react-navigation/native';

// In FuRingScreen:
const isFocused = useIsFocused();

// Pass to canvas:
<SignaturCanvas sectors={fusion.sectors} paused={!isFocused} />
```

### Step 6: Rewrite FuRingScreen to use native SignaturCanvas

Replace the entire FuRingScreen implementation. Remove the WebView import and "Open Advanced Visual" button. The new screen layout:

```typescript
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { computeFusionSignal } from '@bazodiac/shared';
import { useAppState } from '../contexts/AppStateContext';
import { SignaturCanvas } from '../components/SignaturCanvas';

function vectorFrom(input: unknown): number[] {
  if (Array.isArray(input)) {
    return new Array(12).fill(0).map((_, idx) => Number(input[idx] ?? 0));
  }
  if (input && typeof input === 'object') {
    const values = Object.values(input as Record<string, unknown>).map(
      (value) => Number(value || 0),
    );
    if (values.length >= 12) return values.slice(0, 12);
  }
  return new Array(12).fill(0);
}

export function FuRingScreen() {
  const { profile } = useAppState();
  const isFocused = useIsFocused();

  const fusion = useMemo(() => {
    const astro = profile?.astro_json || {};
    const western = vectorFrom(astro?.fusion?.western ?? astro?.western?.vector);
    const bazi = vectorFrom(astro?.fusion?.bazi ?? astro?.bazi?.vector);
    const wuxing = vectorFrom(astro?.fusion?.wuxing ?? astro?.wuxing?.vector);
    const quiz = vectorFrom(astro?.fusion?.quiz ?? astro?.quiz?.vector);
    return computeFusionSignal(western, bazi, wuxing, quiz, Number(astro?.quiz?.completed || 0), 7);
  }, [profile]);

  return (
    <View style={styles.container}>
      {/* 3D Ring — fills available space */}
      <View style={styles.canvasWrapper}>
        <SignaturCanvas sectors={fusion.sectors} paused={!isFocused} />
      </View>

      {/* Status bar — resolution + peak sectors */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          Resolution: {fusion.resolution}%
        </Text>
        <Text style={styles.statusText}>
          Peak: S{fusion.peakSectors.map((s) => s + 1).join(', S')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030308',
  },
  canvasWrapper: {
    flex: 1,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  statusText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
```

### Step 7: Verify end-to-end on iOS simulator

```bash
cd apps/mobile && npx expo run:ios
```

Verify:
- [ ] FuRing tab shows the native 3D particle ring (no WebView)
- [ ] Ring shape varies by sector (peaks visible at high-signal sectors)
- [ ] Pan gesture rotates the camera orbit
- [ ] Pinch gesture zooms in/out
- [ ] Camera returns to home position after 1.5s idle
- [ ] Ring breathes gently (subtle vertical float)
- [ ] Corona glow pulses at peaks
- [ ] Switching tabs pauses rendering (check CPU in Instruments)
- [ ] No memory leaks (monitor in Xcode Instruments after 5 min)
- [ ] Consistent 30fps (no drops below 25fps on iPhone 12+)

### Step 8: Commit

```bash
git add apps/mobile/src/components/SignaturCanvas.tsx apps/mobile/src/screens/FuRingScreen.tsx
git commit -m "feat(mobile): add touch interaction, replace WebView with native Signatur canvas"
```

---

## Risk Mitigations

| Risk | Mitigation |
|------|-----------|
| expo-gl ShaderMaterial not supported | expo-three wraps WebGL — custom shaders work. If GLSL compilation fails, fall back to `PointsMaterial` with per-vertex colors (loses size variation but still looks good) |
| 6,000 particles too slow on older iPhones | Reduce to 3,000. The ring still looks solid at 3k on a 6.1" screen. Add a `particleCount` prop for per-device tuning |
| Gesture conflict with tab navigator swipe | `GestureDetector` uses `react-native-gesture-handler` which coordinates with navigation. If conflict occurs, set `activeOffsetX: [-10, 10]` on the pan gesture to require 10px minimum drag |
| Three.js types cause tsc errors in RN | Some Three.js types reference `HTMLCanvasElement`. Use `skipLibCheck: true` in mobile tsconfig if needed (already common in RN projects) |

## NOT in Scope (This Plan)

- Transit effects (resonanzsprung, burst, crunch, etc.) — add later as Task 10+
- Profile deformation channels (quiz stamps, dents, ridges) — requires porting `fusion-ring-profile.ts`
- Audio engine — not applicable on mobile
- Particle displacement animation (idle breathing per-particle) — the ring shape is static per signal update; only camera moves

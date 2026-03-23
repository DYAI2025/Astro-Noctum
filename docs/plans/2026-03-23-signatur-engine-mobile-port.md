# Signatur Engine — Mobile Port (identisch mit Web)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Die Web-Signatur-Engine (28K Partikel, Cousto-Frequenzen, Spirograph-Geometrie) 1:1 auf Mobile portieren via expo-gl + Three.js. Ein User der sich auf bazodiac.space einloggt und dann die App öffnet, muss exakt die gleiche Signatur sehen.

**Architecture:** Die Engine (`bazodiac-engine.ts`, 891 Zeilen) ist **pure TypeScript** — kein DOM, kein Browser-API. Sie kann direkt im Mobile-Bundle verwendet werden. Der Renderer (`FusionRingCanvasV2.tsx`, 1778 Zeilen) nutzt Three.js `BufferGeometry` + `Points` + `ShaderMaterial` — das ist kompatibel mit expo-gl via `expo-three`. Der Port extrahiert die Engine in `packages/shared/` und erstellt einen neuen mobil-optimierten Renderer.

**Tech Stack:** expo-gl (bereits installiert), three (bereits installiert), expo-three (bereits installiert), bazodiac-engine.ts (pure TS, portabel)

**Kompatibilität:** iPhone 13 Pro Max und neuer (A15 Bionic GPU, Metal 2.4)

---

## Was portiert wird

### Aus `bazodiac-engine.ts` (891 Zeilen) — UNVERÄNDERT:
- Math Utilities (clamp, lerp, hash01, logNormHz)
- Planet Data (7 Planeten mit Cousto-Hz, Farben, Zodiac)
- Weight Computation (natal + quiz → planet weights)
- Spirograph Parameters (Hz → SpiroParams)
- Particle Generation (4-Tier: glow, curve, fractal, subfractal)
- Kaleidoscope Folding
- Emergence Detection
- Transit Overlay Particles

### Aus `FusionRingCanvasV2.tsx` (1778 Zeilen) — ADAPTIERT:
- Three.js Scene Setup → GLView statt DOM Canvas
- BufferGeometry Particle System → identisch
- Animation Loop → requestAnimationFrame via expo-gl
- Effects System (Resonanzsprung, Dominanzwechsel, etc.)
- **ENTFERNT:** Config Panel UI, Audio Integration, HTML Overlays
- **HINZUGEFÜGT:** Touch-Interaktion via PanResponder, Mobile GPU Budget

---

## Tasks

### Task 1: Engine in shared package kopieren

**Files:**
- Copy: `src/components/fusion-ring-website/bazodiac-engine.ts` → `packages/shared/src/signatur/bazodiac-engine.ts`
- Create: `packages/shared/src/signatur/index.ts`
- Modify: `packages/shared/src/index.ts`

Die Engine ist pure TypeScript — keine Browser-Dependencies. Kopieren, barrel export erstellen, typecheck.

```bash
mkdir -p packages/shared/src/signatur
cp src/components/fusion-ring-website/bazodiac-engine.ts packages/shared/src/signatur/
```

Barrel:
```typescript
export * from './bazodiac-engine';
```

Index:
```typescript
export * from "./signatur";
```

### Task 2: Mobile Signatur Renderer erstellen

**Files:**
- Create: `apps/mobile/src/components/SignaturEngine.tsx`

Dies ist der Kern-Port. Der Component:

1. **GLView Setup** (expo-gl):
```typescript
import { GLView } from 'expo-gl';
import { Renderer, THREE } from 'expo-three';
```

2. **Scene erstellen:**
- `THREE.Scene` mit schwarzem Background
- `THREE.OrthographicCamera` (2D-Projektion, kein Perspektive)
- `THREE.Points` mit `THREE.BufferGeometry` (positions, colors, sizes, alphas)
- Custom `THREE.ShaderMaterial` mit vertex + fragment shader

3. **Particle System:**
- Rufe `generateSignature()` aus der shared Engine auf
- Erstelle `Float32Array` Buffers für positions, colors, sizes, alphas
- Update in der Animation Loop (drift, phase, emergence)

4. **Mobile Optimierungen:**
- Budget: `budgetMultiplier: 0.4` (28K → ~11K Partikel — genug für iPhone 13+)
- Pixel Ratio: 1 (nicht 2 oder 3)
- FPS: 30 (nicht 60)
- Kein Bloom/PostProcessing
- `powerPreference: 'low-power'`

5. **Animation Loop:**
```typescript
const animate = (time: number) => {
  // Update particle positions (drift, phase oscillation)
  // Update emergence detection
  // Update transit overlay if active
  gl.endFrameEXP();
  requestAnimationFrame(animate);
};
```

6. **Props Interface:**
```typescript
interface SignaturEngineProps {
  natalWeights: Map<string, number>;
  quizWeights?: Map<string, number>;
  kpIndex?: number;
  onReady?: () => void;
  style?: ViewStyle;
}
```

### Task 3: Touch-Interaktion

**Files:**
- Modify: `apps/mobile/src/components/SignaturEngine.tsx`

Via `PanResponder`:
- **Touch down:** Emit burst particles at touch point
- **Pan:** Rotate camera slightly (parallax effect)
- **Pinch:** Scale view
- **Haptic:** On burst particle emission

Touch coordinates → Three.js world space via raycasting.

### Task 4: Transit/Kp-Modulation

**Files:**
- Modify: `apps/mobile/src/components/SignaturEngine.tsx`

`kpIndex` prop drives:
- Particle drift speed (higher Kp = faster drift)
- Glow alpha (higher Kp = brighter)
- Optional: trigger `korona_eruption` effect from the engine's EffectSystem

### Task 5: Integration in FuRingScreen

**Files:**
- Modify: `apps/mobile/src/screens/FuRingScreen.tsx`

Replace the current SignaturRing (12 bars) with SignaturEngine:

```tsx
<SignaturEngine
  natalWeights={natalWeightsFromProfile}
  quizWeights={quizWeightsFromCompleted}
  kpIndex={kpIndex}
  style={{ width: '100%', aspectRatio: 1 }}
/>
```

Die `natalWeights` kommen aus `signatur-bridge.ts`:
```typescript
import { soulprintToNatalWeights } from '../../packages/shared/src/signatur/signatur-bridge';
```

### Task 6: Web-App auf shared Engine umstellen

**Files:**
- Modify: `src/components/fusion-ring-website/FusionRingCanvasV2.tsx`
- Modify: `src/components/fusion-ring-website/bazodiac-engine.ts` → redirect import

Die Web-App importiert die Engine jetzt aus `@bazodiac/shared` statt lokal. Sicherstellen dass die Signatur auf Web identisch bleibt.

---

## Performance Budget (iPhone 13 Pro Max)

| Metric | Budget | Wie |
|--------|--------|-----|
| Partikel | 11K (40% von 28K) | `budgetMultiplier: 0.4` |
| FPS | 30 | `setInterval` statt rAF |
| Pixel Ratio | 1 | Kein Retina-Rendering |
| GPU Memory | < 50MB | Nur Points, kein Mesh |
| Battery | < 5% pro Stunde | low-power preference |
| Startup | < 500ms | Particles pre-computed |

---

## Reihenfolge

| # | Task | Aufwand | Abhängigkeit |
|---|------|---------|-------------|
| 1 | Engine → shared | 15 min | — |
| 2 | Mobile Renderer | 2-3h | Task 1 |
| 3 | Touch | 30 min | Task 2 |
| 4 | Kp-Modulation | 20 min | Task 2 |
| 5 | FuRingScreen Integration | 30 min | Tasks 2-4 |
| 6 | Web auf shared umstellen | 20 min | Task 1 |

# Sphere Wuxing Surfaces Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Lass die `SignatureSphere3D` ihre Oberfläche dynamisch an das dominante Wuxing-Element des Users anpassen — `fire` glüht und fließt wie Lava, `earth` zeigt mineralische Stein-Plastik, `wood` trägt Maserung mit Knoten, `metal` reflektiert mit scharfem Glanzlicht, `water` wellt sich mit Lichtbrechung. Chladni-Pattern bleiben darüber liegend, Pol-Marker und Trails unverändert.

**Architecture:** Live-Code ist React-Three-Fiber mit Three.js `meshStandardMaterial`. Wir ersetzen das Solid-Layer-Material durch ein **Custom `ShaderMaterial` pro Element** mit eigenem GLSL-Vertex- und Fragment-Shader. Vertex-Shader: bestehende Chladni-Displacement plus Element-Heightfield-Bump (mikroskopische 3D-Plastik). Fragment-Shader: Pro-Pixel Element-Albedo mit Lambert + Blinn-Phong-Lighting in Tangent-Space, plus emissive für Fire/Water. Auswahl über `uniform int u_element` und Switch im Shader, ein Material für alle fünf Elemente — niedrige GPU-Setup-Kosten. Wireframe-Layer, Pol-Marker und Trails bleiben mit ihren existierenden Standard-Materialien. Heightfield-Funktionen (Voronoi für Earth, Wave-Stack für Water etc.) und Albedo-Logik werden im Web-Mockup `outputs/preview-3d-wuxing.html` (Phase 1, 2026-04-30) bereits validiert — wir portieren sie nach GLSL.

**Tech Stack:** TypeScript, React 18, Three.js (über @react-three/fiber + drei), Vitest für Math-Tests, Storybook für visuelle Verifikation pro Element.

**Branch:** `feature/sphere-wuxing-surfaces` (neuer Worktree, isoliert von laufenden Streams)

---

## Task 0: Worktree und Branch anlegen

**Files:**
- Worktree-Pfad: `Bazodiac-WebApp/Astro-Noctum/.worktrees/sphere-wuxing-surfaces/`

**Step 1: Worktree anlegen**

```bash
cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum
git fetch origin
git worktree add .worktrees/sphere-wuxing-surfaces -b feature/sphere-wuxing-surfaces origin/main
```

**Step 2: In den Worktree wechseln und Dependencies installieren**

```bash
cd .worktrees/sphere-wuxing-surfaces
npm install
```

**Step 3: Baseline-Build verifizieren**

```bash
npx tsc --noEmit
npm test -- SignatureSphere3D
```

Erwartet: tsc grün, Tests grün. Das ist der Baseline-State, gegen den wir arbeiten.

**Step 4: Commit "chore: branch baseline"**

```bash
git commit --allow-empty -m "chore: branch baseline for sphere-wuxing-surfaces"
```

---

## Task 1: Wuxing-Element-Typ vereinheitlichen und Konstanten anlegen

**Kontext:** `WuxingElement` aus `bazi-to-chladni.ts` nutzt Capitalized Strings (`'Fire'`, `'Earth'`, etc.). GLSL-Shader brauchen Integer-Codes. Wir legen eine Mapping-Konstante an plus die Material-Properties pro Element.

**Files:**
- Create: `src/lib/signatur-3d/wuxing-surfaces.ts`
- Test: `src/lib/signatur-3d/__tests__/wuxing-surfaces.test.ts`

**Step 1: Failing test schreiben**

```typescript
// __tests__/wuxing-surfaces.test.ts
import { describe, it, expect } from 'vitest';
import {
  ELEMENT_INDEX,
  MATERIAL_PROPS,
  PLASTICITY,
  type WuxingElement,
} from '../wuxing-surfaces';

describe('wuxing-surfaces constants', () => {
  it('maps each Wuxing element to a unique integer index 0..4', () => {
    const indices = (['Fire', 'Earth', 'Wood', 'Metal', 'Water'] as WuxingElement[])
      .map((el) => ELEMENT_INDEX[el]);
    expect(new Set(indices).size).toBe(5);
    expect(Math.min(...indices)).toBe(0);
    expect(Math.max(...indices)).toBe(4);
  });

  it('defines material properties for all 5 elements', () => {
    (['Fire', 'Earth', 'Wood', 'Metal', 'Water'] as WuxingElement[]).forEach((el) => {
      expect(MATERIAL_PROPS[el]).toBeDefined();
      expect(MATERIAL_PROPS[el].specStrength).toBeGreaterThanOrEqual(0);
      expect(MATERIAL_PROPS[el].specStrength).toBeLessThanOrEqual(1);
      expect(MATERIAL_PROPS[el].specExp).toBeGreaterThan(0);
    });
  });

  it('metal has the strongest specular, fire the weakest', () => {
    expect(MATERIAL_PROPS.Metal.specStrength).toBeGreaterThan(MATERIAL_PROPS.Water.specStrength);
    expect(MATERIAL_PROPS.Water.specStrength).toBeGreaterThan(MATERIAL_PROPS.Wood.specStrength);
    expect(MATERIAL_PROPS.Fire.specStrength).toBeLessThan(MATERIAL_PROPS.Earth.specStrength);
  });

  it('plasticity is bounded 0.3..1.5 for all elements', () => {
    (['Fire', 'Earth', 'Wood', 'Metal', 'Water'] as WuxingElement[]).forEach((el) => {
      expect(PLASTICITY[el]).toBeGreaterThanOrEqual(0.3);
      expect(PLASTICITY[el]).toBeLessThanOrEqual(1.5);
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- wuxing-surfaces
```

Erwartet: FAIL — Module existiert nicht.

**Step 3: Minimale Implementation schreiben**

```typescript
// src/lib/signatur-3d/wuxing-surfaces.ts
import type { WuxingElement } from '../cymatics/bazi-to-chladni';

export type { WuxingElement };

/** Integer-Codes für GLSL-Shader (uniform int u_element). */
export const ELEMENT_INDEX: Record<WuxingElement, number> = {
  Fire:  0,
  Earth: 1,
  Wood:  2,
  Metal: 3,
  Water: 4,
};

/** Spezular-Anteil und Schärfe pro Element. Werte aus 2026-04-30 Mockup-Tuning. */
export const MATERIAL_PROPS: Record<WuxingElement, { specStrength: number; specExp: number }> = {
  Fire:  { specStrength: 0.06, specExp: 6 },
  Earth: { specStrength: 0.10, specExp: 14 },
  Wood:  { specStrength: 0.12, specExp: 22 },
  Metal: { specStrength: 0.65, specExp: 95 },
  Water: { specStrength: 0.50, specExp: 65 },
};

/** Plastik-Skalierung der Heightfield-Bump. Hoch = tiefere Plastik. */
export const PLASTICITY: Record<WuxingElement, number> = {
  Fire:  1.00,
  Earth: 1.30,
  Wood:  0.95,
  Metal: 0.45,
  Water: 0.75,
};
```

**Step 4: Test grün verifizieren**

```bash
npm test -- wuxing-surfaces
```

Erwartet: PASS, alle 4 Tests.

**Step 5: Typecheck**

```bash
npx tsc --noEmit
```

Erwartet: keine Errors.

**Step 6: Commit**

```bash
git add src/lib/signatur-3d/wuxing-surfaces.ts src/lib/signatur-3d/__tests__/wuxing-surfaces.test.ts
git commit -m "feat(sphere): add wuxing element index, material props, plasticity constants"
```

---

## Task 2: Element-Paletten zentralisieren

**Kontext:** Das Mockup nutzt `SURFACE_PALETTES` mit `inner`/`mid`/`outer` für dark/bright. Wir bringen das ins Live-Code-System mit Same-Schema und exportieren es als Helper für GLSL-Uniform-Befüllung.

**Files:**
- Modify: `src/lib/signatur-3d/wuxing-surfaces.ts`
- Modify: `src/lib/signatur-3d/__tests__/wuxing-surfaces.test.ts`

**Step 1: Test-Erweiterung schreiben**

```typescript
// In wuxing-surfaces.test.ts ergänzen:
import { SURFACE_PALETTES, paletteToVec3Array } from '../wuxing-surfaces';

describe('wuxing-surfaces palettes', () => {
  it('defines dark and bright palette for all 5 elements', () => {
    (['Fire', 'Earth', 'Wood', 'Metal', 'Water'] as WuxingElement[]).forEach((el) => {
      expect(SURFACE_PALETTES[el].dark).toBeDefined();
      expect(SURFACE_PALETTES[el].bright).toBeDefined();
      expect(SURFACE_PALETTES[el].dark.inner).toHaveLength(3);
      expect(SURFACE_PALETTES[el].dark.mid).toHaveLength(3);
      expect(SURFACE_PALETTES[el].dark.outer).toHaveLength(3);
    });
  });

  it('paletteToVec3Array yields 9 floats normalized 0..1', () => {
    const arr = paletteToVec3Array(SURFACE_PALETTES.Fire.dark);
    expect(arr).toHaveLength(9);
    arr.forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    });
  });
});
```

**Step 2: Run, fails**

```bash
npm test -- wuxing-surfaces
```

Erwartet: FAIL — `SURFACE_PALETTES` und `paletteToVec3Array` existieren nicht.

**Step 3: Implementation ergänzen**

```typescript
// In wuxing-surfaces.ts ergänzen:

export interface ElementPalette {
  inner: readonly [number, number, number];
  mid: readonly [number, number, number];
  outer: readonly [number, number, number];
}

export const SURFACE_PALETTES: Record<WuxingElement, { dark: ElementPalette; bright: ElementPalette }> = {
  Fire: {
    dark:   { inner: [255, 184,  96], mid: [182,  74,  31], outer: [ 43,  14,  10] },
    bright: { inner: [255, 208, 138], mid: [214, 110,  52], outer: [126,  54,  28] },
  },
  Earth: {
    dark:   { inner: [210, 171, 106], mid: [126,  93,  52], outer: [ 42,  32,  24] },
    bright: { inner: [226, 198, 147], mid: [160, 124,  76], outer: [ 92,  72,  49] },
  },
  Wood: {
    dark:   { inner: [186, 128,  70], mid: [112,  73,  35], outer: [ 34,  22,  13] },
    bright: { inner: [212, 162, 106], mid: [142,  98,  54], outer: [ 82,  57,  35] },
  },
  Metal: {
    dark:   { inner: [220, 228, 235], mid: [128, 141, 152], outer: [ 34,  43,  52] },
    bright: { inner: [236, 241, 246], mid: [164, 176, 187], outer: [ 94, 107, 119] },
  },
  Water: {
    dark:   { inner: [121, 214, 244], mid: [ 37, 102, 143], outer: [ 10,  28,  50] },
    bright: { inner: [164, 227, 245], mid: [ 73, 145, 186], outer: [ 49,  89, 122] },
  },
};

/** Flacht eine Palette in 9 Floats (0..1) für GLSL `uniform vec3[3]`. */
export function paletteToVec3Array(p: ElementPalette): number[] {
  return [
    p.inner[0] / 255, p.inner[1] / 255, p.inner[2] / 255,
    p.mid[0]   / 255, p.mid[1]   / 255, p.mid[2]   / 255,
    p.outer[0] / 255, p.outer[1] / 255, p.outer[2] / 255,
  ];
}
```

**Step 4: Tests grün, tsc grün**

```bash
npm test -- wuxing-surfaces && npx tsc --noEmit
```

**Step 5: Commit**

```bash
git add src/lib/signatur-3d/wuxing-surfaces.ts src/lib/signatur-3d/__tests__/wuxing-surfaces.test.ts
git commit -m "feat(sphere): add element surface palettes (dark/bright) and GLSL vec3 helper"
```

---

## Task 3: GLSL-Shader-Strings als Konstanten anlegen

**Kontext:** Die eigentliche Pixel-Logik. Vertex-Shader macht Sphere-Pose plus Heightfield-Bump für die Plastik (klein, ~3% Radius). Fragment-Shader berechnet Heightfield + numerischen Gradient + Tangent-Space-Lighting + Element-Albedo. Switch über `uniform int u_element`.

**Files:**
- Create: `src/lib/signatur-3d/wuxing-shaders.ts`
- Test: `src/lib/signatur-3d/__tests__/wuxing-shaders.test.ts`

**Step 1: Failing test (Smoke-Test, GLSL kann man nicht direkt unit-testen, nur dass die Strings gewisse Marker enthalten)**

```typescript
// __tests__/wuxing-shaders.test.ts
import { describe, it, expect } from 'vitest';
import { VERTEX_SHADER, FRAGMENT_SHADER } from '../wuxing-shaders';

describe('wuxing-shaders', () => {
  it('vertex shader declares uniforms for time, plasticity, element', () => {
    expect(VERTEX_SHADER).toContain('uniform float u_time');
    expect(VERTEX_SHADER).toContain('uniform float u_plasticity');
    expect(VERTEX_SHADER).toContain('uniform int u_element');
    expect(VERTEX_SHADER).toContain('varying vec2 v_uv');
    expect(VERTEX_SHADER).toContain('gl_Position');
  });

  it('fragment shader has a switch on u_element with 5 cases', () => {
    expect(FRAGMENT_SHADER).toContain('uniform int u_element');
    expect(FRAGMENT_SHADER).toContain('uniform vec3 u_palette[3]');
    // 5 element cases (could be if/else chain or switch)
    const fireMatch = FRAGMENT_SHADER.match(/u_element\s*==\s*0/);
    const waterMatch = FRAGMENT_SHADER.match(/u_element\s*==\s*4/);
    expect(fireMatch).not.toBeNull();
    expect(waterMatch).not.toBeNull();
  });

  it('fragment shader implements lambert + blinn-phong lighting', () => {
    expect(FRAGMENT_SHADER).toContain('u_lightDir');
    expect(FRAGMENT_SHADER).toContain('u_specStrength');
    expect(FRAGMENT_SHADER).toContain('u_specExp');
    // Heightfield gradient as forward-diff implies multiple heightField() calls
    expect(FRAGMENT_SHADER.match(/heightField/g)?.length).toBeGreaterThanOrEqual(3);
  });
});
```

**Step 2: Run, fails**

```bash
npm test -- wuxing-shaders
```

Erwartet: FAIL — Module fehlt.

**Step 3: Vollständige Shader schreiben**

```typescript
// src/lib/signatur-3d/wuxing-shaders.ts

/**
 * Vertex-Shader: berechnet UV, Normale, View-Position und macht eine
 * kleine Element-Heightfield-Erhebung (5% Radius) auf der Sphäre.
 * Die größere Chladni-Displacement passiert weiter in JS (CPU-Buffer-Update),
 * dieser Shader fügt nur die mikroskopische Wuxing-Plastik hinzu.
 */
export const VERTEX_SHADER = /* glsl */`
  uniform float u_time;
  uniform float u_plasticity;
  uniform int u_element;

  varying vec2 v_uv;
  varying vec3 v_normal;
  varying vec3 v_viewPos;
  varying float v_height;

  // Spherical UV from position (assuming centered unit sphere * radius)
  vec2 sphereUV(vec3 p) {
    float r = length(p);
    float lon = atan(p.x, p.z);
    float lat = asin(clamp(p.y / r, -1.0, 1.0));
    return vec2(lon / (2.0 * 3.14159265) + 0.5, 0.5 - lat / 3.14159265);
  }

  // Sehr leichte Heightfield-Erhebung (1.5% Radius) im Vertex-Shader.
  // Der Hauptanteil der Plastik kommt aus dem Fragment-Shader-Lighting,
  // hier nur ein leichter "Atem" der Geometrie für nicht-flache Silhouette.
  float vertexHeight(vec2 uv) {
    if (u_element == 0) {
      // Fire — gentle billowing
      return 0.5 * sin(uv.x * 6.283 + sin(uv.y * 5.0)) + 0.3 * sin(uv.y * 9.0 - u_time * 0.4);
    } else if (u_element == 1) {
      // Earth — flat, only minimal noise
      return 0.1 * sin(uv.x * 22.0) * sin(uv.y * 17.0);
    } else if (u_element == 2) {
      // Wood — radial rings, very subtle
      vec2 c = uv - vec2(0.42, 0.58);
      return 0.2 * sin(length(c) * 38.0);
    } else if (u_element == 3) {
      // Metal — flat (smooth surface)
      return 0.0;
    } else {
      // Water — mid-amplitude waves, time-animated
      return 0.3 * sin((uv.x * 9.0 + uv.y * 4.0) * 3.14 + u_time * 0.7)
           + 0.2 * sin((uv.x * 4.0 - uv.y * 11.0) * 3.14 + u_time * 0.4);
    }
  }

  void main() {
    vec2 uv = sphereUV(position);
    v_uv = uv;

    float h = vertexHeight(uv);
    v_height = h;

    // Heightfield-Verschiebung entlang der Normalen, klein (1.5% × plasticity).
    vec3 displaced = position + normal * h * 0.015 * u_plasticity;

    vec4 mvPos = modelViewMatrix * vec4(displaced, 1.0);
    v_viewPos = mvPos.xyz;
    v_normal = normalize(normalMatrix * normal);

    gl_Position = projectionMatrix * mvPos;
  }
`;

/**
 * Fragment-Shader: pro Pixel Heightfield + numerischer Gradient (Forward-Diff)
 * → Tangent-Space-Normale → Lambert-Diffuse + Blinn-Phong-Specular.
 * Albedo aus Element-spezifischer Farbformel auf Basis der Höhe.
 */
export const FRAGMENT_SHADER = /* glsl */`
  precision highp float;

  uniform int u_element;
  uniform float u_time;
  uniform float u_plasticity;
  uniform float u_specStrength;
  uniform float u_specExp;
  uniform vec3 u_palette[3];      // [inner, mid, outer]
  uniform vec3 u_lightDir;        // pre-normalized
  uniform vec3 u_halfDir;         // pre-normalized (light + view, normalized)
  uniform float u_ambient;        // 0.20 default
  uniform float u_brightMode;     // 0.0 dark, 1.0 bright

  varying vec2 v_uv;
  varying vec3 v_normal;
  varying vec3 v_viewPos;
  varying float v_height;

  // Heightfield, eine Funktion pro Element. Identisch zum Mockup,
  // mit u_time als Animation für Fire und Water.
  float heightField(vec2 uv) {
    float PI = 3.14159265;
    if (u_element == 0) {
      // Fire — turbulente Lava-Strömung mit zeitlicher Animation
      float base = 0.5 * sin(uv.x * 8.0 * PI + sin(uv.y * 5.0 * PI) * 1.5 + u_time * 0.3);
      float flow = 0.3 * sin((uv.x * 3.0 + uv.y * 7.0) * PI + (uv.x - uv.y) * 2.0 + u_time * 0.5);
      float flicker = 0.2 * sin(uv.x * 22.0 * PI + u_time) * sin(uv.y * 18.0 * PI);
      return base + flow + flicker;
    } else if (u_element == 1) {
      // Earth — fixe Voronoi-artige Stein-Felder. 6 Seeds in const-Array.
      vec2 seeds[6];
      seeds[0] = vec2(0.18, 0.22);
      seeds[1] = vec2(0.42, 0.18);
      seeds[2] = vec2(0.74, 0.31);
      seeds[3] = vec2(0.21, 0.58);
      seeds[4] = vec2(0.55, 0.49);
      seeds[5] = vec2(0.81, 0.66);
      float minD = 1.0;
      float secondD = 1.0;
      for (int i = 0; i < 6; i++) {
        float d = distance(uv, seeds[i]);
        if (d < minD) {
          secondD = minD;
          minD = d;
        } else if (d < secondD) {
          secondD = d;
        }
      }
      float vein = clamp((secondD - minD) * 1.6, 0.0, 1.0);
      float grain = 0.10 * sin(uv.x * 42.0 * PI + uv.y * 37.0 * PI) * sin(uv.x * 53.0 * PI - uv.y * 29.0 * PI);
      return vein * 0.85 + grain;
    } else if (u_element == 2) {
      // Wood — Ringe um Off-Center-Punkt + Knoten + Faser
      vec2 c = uv - vec2(0.42, 0.58);
      float r = length(c);
      float rings = sin(r * 38.0 * PI + sin(uv.y * 7.0 * PI) * 2.5);
      float grain = 0.08 * sin(uv.x * 90.0 * PI + uv.y * 8.0 * PI);
      vec2 knotC = uv - vec2(0.74, 0.31);
      float knot = exp(-dot(knotC, knotC) * 38.0) * 0.7;
      return rings * 0.40 + grain + knot;
    } else if (u_element == 3) {
      // Metal — fein-Bürste mit minimaler Imperfection
      float brush = 0.05 * sin(uv.y * 280.0 * PI + sin(uv.x * 8.0 * PI) * 0.8);
      float flow = 0.04 * sin(uv.x * 5.0 * PI + uv.y * 3.0 * PI);
      float breath = 0.02 * sin(uv.x * 1.7 * PI + uv.y * 2.1 * PI);
      return brush + flow + breath;
    } else {
      // Water — drei überlagerte Wellenfelder, animiert
      float wave1 = 0.30 * sin((uv.x * 9.0 + uv.y * 4.0) * PI + sin(uv.y * 3.0 * PI) * 0.5 + u_time * 0.6);
      float wave2 = 0.20 * sin((uv.x * 4.0 - uv.y * 11.0) * PI + 1.2 + u_time * 0.4);
      float wave3 = 0.10 * sin((uv.x * 17.0 + uv.y * 20.0) * PI + 2.7 + u_time * 0.8);
      return wave1 + wave2 + wave3;
    }
  }

  // Albedo pro Element auf Basis der Höhe und der Element-Palette
  vec3 albedoFromHeight(float h, vec2 uv) {
    vec3 cInner = u_palette[0];
    vec3 cMid   = u_palette[1];
    vec3 cOuter = u_palette[2];

    if (u_element == 0) {
      // Fire — heißer mit höherem h, plus emissive Glow
      float t = clamp((h + 0.8) / 1.6, 0.0, 1.0);
      vec3 base = mix(mix(cOuter, cMid, pow(t, 0.7)), cInner, pow(t, 1.6));
      if (h > 0.30) {
        float glow = (h - 0.30) * 1.4;
        base += cInner * glow * 0.45;
      }
      return base;
    } else if (u_element == 1) {
      float t = clamp(0.20 + h * 1.1, 0.0, 1.0);
      return mix(mix(cOuter, cMid, pow(t, 0.85)), cInner, pow(t, 1.6));
    } else if (u_element == 2) {
      float t = clamp((h + 0.7) / 1.4, 0.0, 1.0);
      return mix(mix(cOuter, cMid, pow(t, 0.9)), cInner, pow(t, 1.5));
    } else if (u_element == 3) {
      // Metal — fast uniform, leicht moduliert
      return mix(cMid, cInner, 0.45 + abs(h) * 0.55);
    } else {
      // Water — Cyan-Schimmer auf Wellenkamm
      float t = clamp((h + 0.6) / 1.2, 0.0, 1.0);
      vec3 base = mix(mix(cOuter, cMid, pow(t, 0.85)), cInner, pow(t, 1.5));
      if (h > 0.30) {
        float sheen = (h - 0.30) * 0.85;
        base += vec3(sheen * 0.12, sheen * 0.20, sheen * 0.25);
      }
      return base;
    }
  }

  void main() {
    vec2 uv = v_uv;
    float eps = 0.0035;

    float h  = heightField(uv);
    float hu = heightField(uv + vec2(eps, 0.0));
    float hv = heightField(uv + vec2(0.0, eps));
    float gu = (hu - h) / eps * u_plasticity;
    float gv = (hv - h) / eps * u_plasticity;

    // Tangent-Space-Normale (vereinfacht — Mikro-Plastik auf der Sphäre)
    vec3 nMicro = normalize(vec3(-gu, -gv, 1.0));

    // Lambert + Blinn-Phong
    float ndotl = max(0.0, dot(nMicro, u_lightDir));
    float ndoth = max(0.0, dot(nMicro, u_halfDir));
    float specular = pow(ndoth, u_specExp) * u_specStrength;

    vec3 albedo = albedoFromHeight(h, uv);

    // Globales Sphären-Limb über View-Z der World-Normale
    float limb = 0.55 + pow(max(v_normal.z, 0.0), 0.6) * 0.45;

    float lighting = u_ambient + ndotl * (1.0 - u_ambient);
    vec3 specColor = (u_element == 3 || u_element == 4) ? vec3(1.0) : vec3(1.0, 0.94, 0.86);
    vec3 finalColor = albedo * lighting * limb + specular * specColor;

    // Bright-Mode: leichtes Aufhellen
    if (u_brightMode > 0.5) {
      finalColor = mix(finalColor, vec3(1.0), 0.06);
    }

    gl_FragColor = vec4(finalColor, 0.92);
  }
`;
```

**Step 4: Test grün**

```bash
npm test -- wuxing-shaders
```

Erwartet: PASS — alle drei Smoke-Tests.

**Step 5: Commit**

```bash
git add src/lib/signatur-3d/wuxing-shaders.ts src/lib/signatur-3d/__tests__/wuxing-shaders.test.ts
git commit -m "feat(sphere): add GLSL vertex+fragment shaders for wuxing element surfaces"
```

---

## Task 4: ShaderMaterial-Builder mit Uniform-Setup

**Kontext:** Wir wrappen die Shader in eine Three.js-Builder-Funktion, die ein konfiguriertes `ShaderMaterial` zurückgibt. Caller liefert Element + planetariumMode + Initial-Time. Material expose ein `setElement(el)` und `setTime(t)`-Setter.

**Files:**
- Create: `src/lib/signatur-3d/wuxing-material.ts`
- Test: `src/lib/signatur-3d/__tests__/wuxing-material.test.ts`

**Step 1: Failing test**

```typescript
// __tests__/wuxing-material.test.ts
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { buildWuxingMaterial } from '../wuxing-material';

describe('buildWuxingMaterial', () => {
  it('returns a THREE.ShaderMaterial with all required uniforms', () => {
    const mat = buildWuxingMaterial({ element: 'Water', planetariumMode: true });
    expect(mat).toBeInstanceOf(THREE.ShaderMaterial);
    expect(mat.uniforms.u_element.value).toBe(4);
    expect(mat.uniforms.u_time.value).toBe(0);
    expect(mat.uniforms.u_plasticity.value).toBeCloseTo(0.75, 2);
    expect(mat.uniforms.u_specStrength.value).toBeCloseTo(0.50, 2);
    expect(mat.uniforms.u_specExp.value).toBe(65);
    expect(mat.uniforms.u_palette.value).toHaveLength(3);
  });

  it('respects planetariumMode false → bright palette + brightMode flag', () => {
    const mat = buildWuxingMaterial({ element: 'Fire', planetariumMode: false });
    expect(mat.uniforms.u_brightMode.value).toBe(1);
    // bright fire inner is [255, 208, 138] → normalized
    const innerR = (mat.uniforms.u_palette.value[0] as THREE.Vector3).x;
    expect(innerR).toBeCloseTo(255 / 255, 3);
  });

  it('updateElement swaps uniforms in place without recreating material', () => {
    const mat = buildWuxingMaterial({ element: 'Earth', planetariumMode: true });
    const initialPaletteRef = mat.uniforms.u_palette.value;
    mat.userData.updateElement('Metal');
    expect(mat.uniforms.u_element.value).toBe(3);
    expect(mat.uniforms.u_specStrength.value).toBeCloseTo(0.65, 2);
    // Palette ist neu, aber Material-Referenz dieselbe
    expect(mat.uniforms.u_palette.value).not.toBe(initialPaletteRef);
  });
});
```

**Step 2: Run, fails**

```bash
npm test -- wuxing-material
```

**Step 3: Implementation**

```typescript
// src/lib/signatur-3d/wuxing-material.ts
import * as THREE from 'three';
import {
  ELEMENT_INDEX,
  MATERIAL_PROPS,
  PLASTICITY,
  SURFACE_PALETTES,
  paletteToVec3Array,
  type WuxingElement,
} from './wuxing-surfaces';
import { VERTEX_SHADER, FRAGMENT_SHADER } from './wuxing-shaders';

const LIGHT_DIR = new THREE.Vector3(0.32, -0.42, 0.85).normalize();
const VIEW_DIR = new THREE.Vector3(0, 0, 1);
const HALF_DIR = LIGHT_DIR.clone().add(VIEW_DIR).normalize();

function paletteToVec3s(p: { inner: readonly number[]; mid: readonly number[]; outer: readonly number[] }) {
  const flat = paletteToVec3Array(p as never);
  return [
    new THREE.Vector3(flat[0], flat[1], flat[2]),
    new THREE.Vector3(flat[3], flat[4], flat[5]),
    new THREE.Vector3(flat[6], flat[7], flat[8]),
  ];
}

export interface WuxingMaterialOptions {
  element: WuxingElement;
  planetariumMode: boolean;
}

export function buildWuxingMaterial({ element, planetariumMode }: WuxingMaterialOptions): THREE.ShaderMaterial {
  const palette = planetariumMode ? SURFACE_PALETTES[element].dark : SURFACE_PALETTES[element].bright;
  const props = MATERIAL_PROPS[element];

  const material = new THREE.ShaderMaterial({
    uniforms: {
      u_time:         { value: 0 },
      u_element:      { value: ELEMENT_INDEX[element] },
      u_plasticity:   { value: PLASTICITY[element] },
      u_specStrength: { value: props.specStrength },
      u_specExp:      { value: props.specExp },
      u_palette:      { value: paletteToVec3s(palette) },
      u_lightDir:     { value: LIGHT_DIR },
      u_halfDir:      { value: HALF_DIR },
      u_ambient:      { value: 0.20 },
      u_brightMode:   { value: planetariumMode ? 0 : 1 },
    },
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    transparent: true,
    side: THREE.FrontSide,
  });

  material.userData.updateElement = (next: WuxingElement) => {
    const nextPalette = planetariumMode ? SURFACE_PALETTES[next].dark : SURFACE_PALETTES[next].bright;
    const nextProps = MATERIAL_PROPS[next];
    material.uniforms.u_element.value = ELEMENT_INDEX[next];
    material.uniforms.u_plasticity.value = PLASTICITY[next];
    material.uniforms.u_specStrength.value = nextProps.specStrength;
    material.uniforms.u_specExp.value = nextProps.specExp;
    material.uniforms.u_palette.value = paletteToVec3s(nextPalette);
  };

  material.userData.updateTime = (t: number) => {
    material.uniforms.u_time.value = t;
  };

  return material;
}
```

**Step 4: Test grün, tsc grün**

```bash
npm test -- wuxing-material && npx tsc --noEmit
```

**Step 5: Commit**

```bash
git add src/lib/signatur-3d/wuxing-material.ts src/lib/signatur-3d/__tests__/wuxing-material.test.ts
git commit -m "feat(sphere): add wuxing ShaderMaterial builder with element switch + time uniform"
```

---

## Task 5: SignatureSphere3D — `dominantElement` Prop annehmen

**Kontext:** Wir erweitern das Interface, fügen den Prop am API-Rand hinzu, default `'Water'`. Noch keine Verwendung — Architektur-Setup vor Implementations-Schritt.

**Files:**
- Modify: `src/components/signatur-3d/SignatureSphere3D.tsx` (Zeile 58–68 Interface)
- Modify: `src/components/signatur-3d/__tests__/SignatureSphere3D.test.tsx`

**Step 1: Failing test**

```typescript
// In SignatureSphere3D.test.tsx ergänzen:
import { render } from '@testing-library/react';
import { SignatureSphere3D } from '../SignatureSphere3D';

it('accepts a dominantElement prop and exposes it as data attribute', () => {
  const { container } = render(
    <SignatureSphere3D weights={{ Sun: 0.5 }} dominantElement="Fire" />
  );
  const el = container.querySelector('[data-testid="signature-sphere-3d"]');
  expect(el?.getAttribute('data-element')).toBe('Fire');
});
```

**Step 2: Run, fails**

```bash
npm test -- SignatureSphere3D
```

**Step 3: Prop hinzufügen**

```typescript
// In SignatureSphere3D.tsx:
// 1. Import:
import type { WuxingElement } from '@/src/lib/signatur-3d/wuxing-surfaces';

// 2. Interface erweitern:
export interface SignatureSphere3DProps {
  weights: Readonly<Partial<Record<PlanetName, number>>>;
  planetariumMode?: boolean;
  className?: string;
  kpIndex?: number;
  /** Dominant Wuxing element drives the sphere's surface material.
   *  Defaults to 'Water' when omitted. */
  dominantElement?: WuxingElement;
}

// 3. Component-Args:
export function SignatureSphere3D({
  weights,
  planetariumMode = true,
  className,
  kpIndex = 0,
  dominantElement = 'Water',
}: SignatureSphere3DProps): ReactElement {
  // ...

// 4. Auf dem äußeren div ergänzen:
<div
  data-testid="signature-sphere-3d"
  data-planetarium={planetariumMode}
  data-reduced-motion={prefersReducedMotion}
  data-element={dominantElement}
  className={className}
  style={containerStyle}
>
```

**Step 4: Tests grün**

```bash
npm test -- SignatureSphere3D && npx tsc --noEmit
```

**Step 5: Commit**

```bash
git add src/components/signatur-3d/SignatureSphere3D.tsx src/components/signatur-3d/__tests__/SignatureSphere3D.test.tsx
git commit -m "feat(sphere): add dominantElement prop to SignatureSphere3D"
```

---

## Task 5b: Chladni-Wireframe Gold-Färbung

**Kontext:** Coverage-Gap 1 aus dem externen Implementierungsprompt. Bisher rendert das Wire-Layer in `0x4f6ef7` (blau-violett aus Cymantics-Prototype). Externer Prompt: *„Linienfarbe Gold. Linien dürfen nicht die Elementfarbe übernehmen. Linien müssen sich auf jeder Oberfläche klar abheben."* Wir färben das Wireframe um auf gedämpftes Gold mit reduziertem Emissive — Element-Material bleibt visuell dominant, Wireframe wird zur „goldenen Gravur" über der Oberfläche.

**Files:**
- Modify: `src/components/signatur-3d/SignatureSphere3D.tsx` (Wire-Layer-Material)
- Modify: `src/components/signatur-3d/__tests__/SignatureSphere3D.test.tsx`

**Step 1: Failing Test**

```typescript
// In SignatureSphere3D.test.tsx ergänzen:
it('wire layer carries gold-tint role marker', () => {
  const { container } = render(
    <SignatureSphere3D weights={{ Sun: 0.5 }} dominantElement="Water" />
  );
  const wireMesh = container.querySelector('[data-mesh-role="wire"]');
  expect(wireMesh).not.toBeNull();
  expect(wireMesh?.getAttribute('data-tint')).toBe('gold');
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- SignatureSphere3D
```

Erwartet: FAIL — data-mesh-role und data-tint existieren nicht.

**Step 3: Wire-Layer umfärben**

```typescript
// In SignatureSphere3D.tsx, AnimatedScene Wire-Mesh Block:
<mesh
  geometry={wireGeom}
  raycast={SKIP_RAYCAST}
  data-mesh-role="wire"
  data-tint="gold"
>
  <meshStandardMaterial
    color={0xD4AF37}        // Gold (war 0x4f6ef7)
    wireframe
    transparent
    opacity={0.40}          // war 0.20 — präsenter, weil emissive reduziert
    emissive={0x8B6914}     // gedämpftes Gold (war 0x1a2a8f blau)
    emissiveIntensity={0.5} // war 0.6
  />
</mesh>
```

**Step 4: Tests grün, visuelle Smoke**

```bash
npm test -- SignatureSphere3D
npx tsc --noEmit
npm run dev
# /signatur, 3D-Modus, alle 5 Elemente durchschalten:
# Wireframe muss sichtbar gold sein, nicht blau.
# Auf jedem Element-Material muss Gold gut kontrastieren.
```

**Step 5: Commit**

```bash
git add src/components/signatur-3d/SignatureSphere3D.tsx src/components/signatur-3d/__tests__/SignatureSphere3D.test.tsx
git commit -m "feat(sphere): recolor wireframe layer to gold (semantic-line hierarchy)"
```

---

## Task 5c: Halo-Wireframe als zweite Mesh-Schicht

**Kontext:** Coverage-Gap 2. Externer Prompt verlangt *„neutraler Gold-/Schatten-Halo"* um die Chladni-Linien für Lesbarkeit auf jeder Element-Oberfläche. WebGL kann `lineWidth > 1` nicht zuverlässig — Lösung: zweite Wireframe-Mesh leicht außen (Skala 1.005) mit dunklem Material und niedriger Opacity, gerendert hinter der Hauptlinie. Render-Order plus `depthWrite: false` verhindern Z-Fighting.

**Files:**
- Modify: `src/components/signatur-3d/SignatureSphere3D.tsx`
- Modify: `src/components/signatur-3d/__tests__/SignatureSphere3D.test.tsx`

**Step 1: Failing Test**

```typescript
// In SignatureSphere3D.test.tsx ergänzen:
it('wire layer has both main and halo meshes', () => {
  const { container } = render(
    <SignatureSphere3D weights={{ Sun: 0.5 }} dominantElement="Earth" />
  );
  const main = container.querySelector('[data-mesh-role="wire"]');
  const halo = container.querySelector('[data-mesh-role="wire-halo"]');
  expect(main).not.toBeNull();
  expect(halo).not.toBeNull();
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- SignatureSphere3D
```

**Step 3: Halo-Mesh hinzufügen**

```typescript
// In AnimatedScene, direkt VOR dem Hauptwire-Mesh aus Task 5b einfügen:
<mesh
  geometry={wireGeom}
  raycast={SKIP_RAYCAST}
  data-mesh-role="wire-halo"
  scale={1.005}             // 0.5% nach außen für Halo-Wirkung
  renderOrder={1}           // hinter Hauptwireframe
>
  <meshBasicMaterial
    color={0x000000}        // Schwarz für Schatten-Kontrast
    wireframe
    transparent
    opacity={0.30}
    depthWrite={false}      // verhindert Z-Fighting
  />
</mesh>

{/* Hauptwire-Mesh aus Task 5b folgt direkt darunter, mit renderOrder={2} */}
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
```

**Step 4: Tests grün, visuelle Smoke**

```bash
npm test -- SignatureSphere3D
npx tsc --noEmit
npm run dev
# /signatur, 3D-Modus: Goldwireframe muss eine sanfte schwarze Aura zeigen.
# Bei allen 5 Elementen muss die Linie gut lesbar bleiben.
# Bright-Mode prüfen: kein "harter Druck" durch Schatten.
# Falls Bright-Mode zu hart wirkt: opacity auf 0.20 senken oder
# Halo-Farbe auf 0x2a2018 (dunkles Bronze) ändern.
```

**Step 5: Commit**

```bash
git add src/components/signatur-3d/SignatureSphere3D.tsx src/components/signatur-3d/__tests__/SignatureSphere3D.test.tsx
git commit -m "feat(sphere): add halo wireframe mesh for chladni-line contrast"
```

---

## Task 6: Solid-Layer auf Wuxing-ShaderMaterial umstellen

**Kontext:** Der eigentliche visuelle Schritt. Im Solid-Mesh tauschen wir `meshStandardMaterial` mit `vertexColors` gegen unser `ShaderMaterial`. Das Material wird beim Mount gebaut und bei Element-Wechsel via `updateElement` gepflegt — ohne Material-Re-Create (Three.js mag das für GPU-State nicht).

**Files:**
- Modify: `src/components/signatur-3d/SignatureSphere3D.tsx` (Solid-Mesh Block + AnimatedScene)

**Step 1: Failing test (visual snapshot via Storybook ist eigentliche Verifikation; hier nur dass Solid-Layer kein meshStandardMaterial mehr ist)**

```typescript
// In SignatureSphere3D.test.tsx ergänzen:
it('solid layer uses a ShaderMaterial when dominantElement is set', async () => {
  const { container } = render(
    <SignatureSphere3D weights={{ Sun: 0.5 }} dominantElement="Metal" />
  );
  // Find the solid-layer mesh — it has data-mesh-role="solid" after this task
  const solidLayer = container.querySelector('[data-mesh-role="solid"]');
  expect(solidLayer).not.toBeNull();
});
```

**Step 2: Run, fails**

```bash
npm test -- SignatureSphere3D
```

**Step 3: Solid-Layer umstellen**

```typescript
// In AnimatedScene-Props (Interface):
interface AnimatedSceneProps {
  // ... existing props
  dominantElement: WuxingElement;
  planetariumMode: boolean;
}

// In AnimatedScene-Body, vor dem return:
const wuxingMaterialRef = useRef<THREE.ShaderMaterial | null>(null);

// Material einmal bauen
const wuxingMaterial = useMemo(
  () => buildWuxingMaterial({ element: dominantElement, planetariumMode }),
  // Dependencies bewusst leer — bauen einmal, dann via updateElement pflegen
  [],
);

// Element-Wechsel: in-place update (kein Re-Mount)
useEffect(() => {
  wuxingMaterial.userData.updateElement(dominantElement);
}, [dominantElement, wuxingMaterial]);

// Time-Uniform pflegen — ergänze in useFrame:
useFrame((_state, delta) => {
  // ... existing rotation + morph
  wuxingMaterial.userData.updateTime(timeRef.current * 0.001);
});

wuxingMaterialRef.current = wuxingMaterial;

// Solid-Mesh JSX austauschen:
<mesh
  geometry={solidGeom}
  raycast={SKIP_RAYCAST}
  data-mesh-role="solid"
  material={wuxingMaterial}
/>

// Cleanup bei Unmount:
useEffect(() => {
  return () => {
    wuxingMaterial.dispose();
  };
}, [wuxingMaterial]);
```

```typescript
// In der Outer SignatureSphere3D-Funktion AnimatedScene mit dominantElement aufrufen:
<AnimatedScene
  // ... existing props
  dominantElement={dominantElement}
  planetariumMode={planetariumMode}
/>
```

```typescript
// Imports am Anfang der Datei ergänzen:
import { buildWuxingMaterial } from '@/src/lib/signatur-3d/wuxing-material';
```

**Step 4: Tests grün, tsc grün, manueller Smoke-Test**

```bash
npm test -- SignatureSphere3D
npx tsc --noEmit
npm run dev
# Im Browser auf /signatur navigieren, 3D-Modus wählen, prüfen dass Sphäre rendert
# (kein WebGL-Error in Konsole, Element-Material sichtbar)
```

**Step 5: Commit**

```bash
git add src/components/signatur-3d/SignatureSphere3D.tsx
git commit -m "feat(sphere): swap solid-layer material for wuxing ShaderMaterial driven by dominantElement"
```

---

## Task 7: SignaturRenderer — `dominantElement` durchreichen

**Kontext:** Ein-Zeilen-Glue. `SignaturRenderer` bekommt `chladniParams.dominantElement` und reicht es an `SignatureSphere3D` weiter.

**Files:**
- Modify: `src/components/signatur-renderer/SignaturRenderer.tsx`
- Modify: `src/__tests__/SignaturRenderer.test.tsx`

**Step 1: Failing test**

```typescript
// In SignaturRenderer.test.tsx:
it('forwards chladniParams.dominantElement to SignatureSphere3D', () => {
  const { container } = render(
    <SignaturRenderer
      userId="u1"
      labels={MOCK_LABELS}
      chladniParams={{
        m: 4, n: 3, a: 1, b: 1,
        dominantElement: 'Wood',
        harmonyIndex: 0.6,
      }}
    />
  );
  // 3D-Container should receive the element
  const sphere = container.querySelector('[data-element]');
  expect(sphere?.getAttribute('data-element')).toBe('Wood');
});
```

**Step 2: Run, fails**

```bash
npm test -- SignaturRenderer
```

**Step 3: Einen-Zeilen-Pass**

```typescript
// In SignaturRenderer.tsx, im 3D-Container:
<SignatureSphere3D
  weights={effectivePlanetWeights}
  planetariumMode={planetariumMode}
  kpIndex={kpIndex}
  dominantElement={chladniParams?.dominantElement}
  className="h-full w-full"
/>
```

**Step 4: Tests grün**

```bash
npm test -- SignaturRenderer && npx tsc --noEmit
```

**Step 5: Commit**

```bash
git add src/components/signatur-renderer/SignaturRenderer.tsx src/__tests__/SignaturRenderer.test.tsx
git commit -m "feat(sphere): forward dominantElement from SignaturRenderer to SignatureSphere3D"
```

---

## Task 8: Storybook-Story pro Element

**Kontext:** Visuelle Verifikation der fünf Element-Oberflächen. Eine Story pro Element plus eine Bright/Dark-Vergleichsstory.

**Files:**
- Modify: `src/stories/SignaturRenderer.stories.tsx` (oder neu: `src/stories/SignatureSphere3D.stories.tsx`)

**Step 1: Story-Skelett ergänzen**

```typescript
// In SignaturRenderer.stories.tsx oder neu:
import type { Meta, StoryObj } from '@storybook/react';
import { SignatureSphere3D } from '../components/signatur-3d/SignatureSphere3D';

const meta: Meta<typeof SignatureSphere3D> = {
  title: 'Signatur 3D/Wuxing Surfaces',
  component: SignatureSphere3D,
};
export default meta;
type Story = StoryObj<typeof SignatureSphere3D>;

const SAMPLE_WEIGHTS = {
  Sun: 0.65, Moon: 0.45, Mercury: 0.30, Venus: 0.50,
  Mars: 0.55, Jupiter: 0.40, Saturn: 0.35, Uranus: 0.25,
  Neptune: 0.30, Pluto: 0.20,
};

export const FireDark: Story = { args: { weights: SAMPLE_WEIGHTS, dominantElement: 'Fire', planetariumMode: true } };
export const EarthDark: Story = { args: { weights: SAMPLE_WEIGHTS, dominantElement: 'Earth', planetariumMode: true } };
export const WoodDark: Story = { args: { weights: SAMPLE_WEIGHTS, dominantElement: 'Wood', planetariumMode: true } };
export const MetalDark: Story = { args: { weights: SAMPLE_WEIGHTS, dominantElement: 'Metal', planetariumMode: true } };
export const WaterDark: Story = { args: { weights: SAMPLE_WEIGHTS, dominantElement: 'Water', planetariumMode: true } };

export const FireBright: Story = { args: { weights: SAMPLE_WEIGHTS, dominantElement: 'Fire', planetariumMode: false } };
export const WaterBright: Story = { args: { weights: SAMPLE_WEIGHTS, dominantElement: 'Water', planetariumMode: false } };
```

**Step 2: Storybook starten und visuell prüfen**

```bash
npm run storybook
# Im Browser: jede der 7 Stories öffnen, visuell prüfen:
# - Fire: glüht, Lava-Fluss erkennbar, dunkles Magma in Tiefen
# - Earth: Voronoi-Stein-Felder mit Adern an Grenzen sichtbar
# - Wood: konzentrische Ringe, ein Knoten unten-rechts erkennbar
# - Metal: scharfes Glanzlicht, sehr glatte Oberfläche, fein-Bürste
# - Water: Wellen mit Cyan-Schimmer auf Wellenkamm
# - Bright-Modi: heller, weniger Schwarz-Säume
```

**Step 3: Falls visuelle Mängel — Konstanten-Tuning in `wuxing-surfaces.ts`**

Tunings-Knobs (alle in `wuxing-surfaces.ts` änderbar, kein Shader-Recompile nötig):
- `PLASTICITY[X]` — höher = tiefere Plastik
- `MATERIAL_PROPS[X].specStrength` — höher = mehr Glanz
- `MATERIAL_PROPS[X].specExp` — höher = schärferer Glanzpunkt
- `SURFACE_PALETTES[X].dark.{inner,mid,outer}` — Farben

**Step 4: Commit**

```bash
git add src/stories/SignaturRenderer.stories.tsx
git commit -m "test(sphere): add storybook stories for all 5 wuxing element materials"
```

---

## Task 9: Performance-Smoke-Test mit Stats-Panel

**Kontext:** Verifizieren, dass die 5 Element-Materialien 60fps auf MacBook M1 halten. Stats-Panel ist im DEV-Build schon eingehängt — wir lesen es einmal pro Element.

**Files:**
- Keine Code-Änderung; manueller Verification-Schritt

**Step 1: Dev-Build starten und Stats prüfen**

```bash
cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/.worktrees/sphere-wuxing-surfaces
npm run dev
# Auf /signatur navigieren, 3D-Modus, jedes der fünf Elemente durchschalten
# Stats-Panel oben-links: FPS soll bei 60 bleiben (60.0 ± 2.0 ist ok)
```

**Step 2: Falls FPS einbricht (< 55fps stabil)**

Optimierung in dieser Reihenfolge versuchen:
1. `SPHERE_SEGMENTS` in `SignatureSphere3D.tsx` von 72 auf 64 reduzieren
2. `MORPH_EVERY_N_FRAMES` von 4 auf 6 erhöhen
3. Im Fragment-Shader bei Earth-Element: Voronoi-Loop von 6 auf 5 Seeds reduzieren
4. Heightfield-Komplexität reduzieren (z. B. Wave3 in Water entfernen)

**Step 3: Mobile-Verify**

Auf einem iPhone 12 oder Android mit DevTools Remote-Debugging — typisch 30fps Cap durch DPR=2. Wenn drüber 30fps → ok.

**Step 4: Commit (auch wenn nichts geändert)**

```bash
git commit --allow-empty -m "test(sphere): verify 60fps on M1 across all 5 wuxing elements"
```

---

## Task 9b: Partikel-Layer nahe Chladni-Nodallinien (Variante B)

**Kontext:** Coverage-Gap 3 aus dem externen Implementierungsprompt. Variante B aus dem Coverage-Review: Pol-Marker und Trails bleiben (explizite Planeten-Lesung), zusätzlich subtile Partikel als dritte Schicht (emergente Aktivierungs-Lesung). Externer Prompt: *„dezente Partikel nahe der Chladni-Nodallinie. Müssen kontrastarm bleiben und dürfen die Materialwirkung nicht dominieren."*

R3F-Implementation: ein `<points>`-Mesh mit ~3000 Partikeln. Position-Sampling: pro Partikel ein Punkt auf der Sphären-Oberfläche, an dem `|chladniDisplacement| < threshold` gilt. Sample-Funktion ist deterministisch via Seed → reproduzierbar zwischen Renders bei gleichen Weights.

**Files:**
- Create: `src/lib/signatur-3d/chladni-particle-layer.ts`
- Test: `src/lib/signatur-3d/__tests__/chladni-particle-layer.test.ts`
- Modify: `src/components/signatur-3d/SignatureSphere3D.tsx`

**Step 1: Failing Test (Sample-Funktion)**

```typescript
// __tests__/chladni-particle-layer.test.ts
import { describe, it, expect } from 'vitest';
import { sampleChladniNodalPoints } from '../chladni-particle-layer';

describe('sampleChladniNodalPoints', () => {
  it('returns x/y/z floats for the requested point count', () => {
    const weights = { Sun: 0.5, Mars: 0.4 };
    const pts = sampleChladniNodalPoints(weights, 1000, 1.0, 0.10);
    expect(pts.length).toBe(3000); // 1000 * 3
  });

  it('places all points on the unit sphere within 1% tolerance', () => {
    const pts = sampleChladniNodalPoints({ Sun: 0.5 }, 500, 1.0, 0.10);
    for (let i = 0; i < pts.length; i += 3) {
      const r = Math.sqrt(pts[i]**2 + pts[i+1]**2 + pts[i+2]**2);
      expect(r).toBeGreaterThan(0.99);
      expect(r).toBeLessThan(1.01);
    }
  });

  it('returns deterministic positions for the same seed', () => {
    const w = { Sun: 0.5 };
    const a = sampleChladniNodalPoints(w, 200, 1.0, 0.10, 42);
    const b = sampleChladniNodalPoints(w, 200, 1.0, 0.10, 42);
    expect(a).toEqual(b);
  });

  it('different seeds yield different positions', () => {
    const w = { Sun: 0.5 };
    const a = sampleChladniNodalPoints(w, 100, 1.0, 0.10, 1);
    const b = sampleChladniNodalPoints(w, 100, 1.0, 0.10, 99);
    expect(a).not.toEqual(b);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- chladni-particle-layer
```

**Step 3: Implementation**

```typescript
// src/lib/signatur-3d/chladni-particle-layer.ts
import { chladniDisplacement } from './sphere-chladni';
import type { PlanetName } from './planets';

/** Linear-Congruential PRNG für deterministisches Sampling. */
function makeRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return ((s >>> 0) / 0xffffffff);
  };
}

/**
 * Sampelt n Punkte auf einer Sphäre mit Radius `radius`, dort wo
 * `|chladniDisplacement(theta, phi, weights, 0)| < threshold` gilt — also
 * nahe der Chladni-Nodallinien. Liefert ein flaches Float32Array
 * [x,y,z, x,y,z, ...] für direkte Übergabe an Three.js BufferAttribute.
 *
 * Falls bei sehr restriktivem threshold nicht genug Treffer in
 * `count * 200` Versuchen → der Rest wird mit gleichmäßiger Verteilung
 * aufgefüllt, damit die Geometrie nicht halbleer ist.
 */
export function sampleChladniNodalPoints(
  weights: Readonly<Partial<Record<PlanetName, number>>>,
  count: number,
  radius: number,
  threshold: number,
  seed = 1,
): Float32Array {
  const out = new Float32Array(count * 3);
  const rng = makeRng(seed);
  const TAU = Math.PI * 2;

  let idx = 0;
  let attempts = 0;
  const maxAttempts = count * 200;

  while (idx < count && attempts < maxAttempts) {
    // Uniform sphere sampling (Marsaglia)
    const theta = Math.acos(1 - 2 * rng());
    const phi = rng() * TAU;
    const disp = chladniDisplacement(theta, phi, weights, 0);

    if (Math.abs(disp) < threshold) {
      const sinT = Math.sin(theta);
      out[idx * 3]     = radius * sinT * Math.cos(phi);
      out[idx * 3 + 1] = radius * Math.cos(theta);
      out[idx * 3 + 2] = radius * sinT * Math.sin(phi);
      idx += 1;
    }
    attempts += 1;
  }

  // Fallback: Rest mit gleichmäßiger Verteilung füllen
  while (idx < count) {
    const theta = Math.acos(1 - 2 * rng());
    const phi = rng() * TAU;
    const sinT = Math.sin(theta);
    out[idx * 3]     = radius * sinT * Math.cos(phi);
    out[idx * 3 + 1] = radius * Math.cos(theta);
    out[idx * 3 + 2] = radius * sinT * Math.sin(phi);
    idx += 1;
  }

  return out;
}
```

**Step 4: Tests grün**

```bash
npm test -- chladni-particle-layer && npx tsc --noEmit
```

**Step 5: Partikel-Layer in SignatureSphere3D einbauen**

```typescript
// In SignatureSphere3D.tsx — Imports ergänzen:
import { sampleChladniNodalPoints } from '@/src/lib/signatur-3d/chladni-particle-layer';

// Konstanten am Modul-Anfang ergänzen:
const PARTICLE_COUNT = 3000;
const PARTICLE_THRESHOLD = 0.10;
const PARTICLE_RADIUS = 1.005;     // leicht über Wire-Radius (1.0)
const PARTICLE_SIZE_DARK = 0.012;
const PARTICLE_SIZE_BRIGHT = 0.014;
const PARTICLE_OPACITY_DARK = 0.40;
const PARTICLE_OPACITY_BRIGHT = 0.50;

// In SignatureSphere3D-Hauptkomponente, nach wireBuilt/solidBuilt:
const particlePositions = useMemo(
  () => sampleChladniNodalPoints(weights, PARTICLE_COUNT, PARTICLE_RADIUS, PARTICLE_THRESHOLD, 42),
  [weights],
);

// AnimatedSceneProps erweitern:
particlePositions: Float32Array;

// AnimatedScene-Aufruf ergänzen:
<AnimatedScene
  // ... bestehende Props
  particlePositions={particlePositions}
/>

// In AnimatedScene-JSX, NACH Trail-Map und VOR </group>:
<points raycast={SKIP_RAYCAST} data-mesh-role="particles">
  <bufferGeometry>
    <bufferAttribute
      attach="attributes-position"
      count={PARTICLE_COUNT}
      array={particlePositions}
      itemSize={3}
    />
  </bufferGeometry>
  <pointsMaterial
    size={planetariumMode ? PARTICLE_SIZE_DARK : PARTICLE_SIZE_BRIGHT}
    color={planetariumMode ? 0xffffff : 0x1e2a3a}
    transparent
    opacity={planetariumMode ? PARTICLE_OPACITY_DARK : PARTICLE_OPACITY_BRIGHT}
    sizeAttenuation
    depthWrite={false}
  />
</points>
```

**Step 6: Tests grün, visuelle Smoke**

```bash
npm test -- SignatureSphere3D chladni-particle-layer
npx tsc --noEmit
npm run dev
# /signatur, 3D: subtile Punkte sollen an Chladni-Nodallinien sichtbar sein,
# zusätzlich zu Pol-Markern und Trails. Bei keinem Element darf die Materialwirkung
# dominiert werden — Partikel müssen kontrast-arm bleiben.
# Auf allen 5 Elementen prüfen.
# Falls zu prominent: PARTICLE_OPACITY_DARK auf 0.30 oder PARTICLE_SIZE_DARK auf 0.010.
```

**Step 7: Commit**

```bash
git add src/lib/signatur-3d/chladni-particle-layer.ts \
        src/lib/signatur-3d/__tests__/chladni-particle-layer.test.ts \
        src/components/signatur-3d/SignatureSphere3D.tsx
git commit -m "feat(sphere): add subtle particle layer at chladni nodal lines (variant B)"
```

---

## Task 10: Smoke-Test gegen echtes BaZi-Profil

**Kontext:** End-to-End-Verify mit einem echten User. Login als Test-User, 3D-Modus aktivieren, prüfen dass das richtige Element gerendert wird.

**Files:**
- Keine Code-Änderung; E2E-Schritt

**Step 1: Echte BaZi-Profile durchspielen**

```bash
npm run dev
# Login als Test-User mit bekanntem dominantem Element (z. B. Wasser)
# Auf /signatur, 3D-Modus
# Verifizieren: Sphäre zeigt Water-Material (Wellen, blau, Cyan-Sheen)
# Falls möglich: zweiten Test-User mit anderem Element prüfen
```

**Step 2: Edge-Cases**

- User ohne Geburtsdatum (chladniParams undefined) → CymaticsFallback wird gezeigt, 3D-Mode greift nicht
- User mit unklarer Element-Verteilung (nahezu gleiche Werte) → dominantElement ist trotzdem deterministisch ein Element

**Step 3: Falls Bug → fix + commit**

**Step 4: Commit**

```bash
git commit --allow-empty -m "test(sphere): smoke-test wuxing surfaces against live BaZi profiles"
```

---

## Task 11: PR vorbereiten

**Files:**
- Modify: keine Code-Änderung; PR-Erstellung

**Step 1: Diff gegen main reviewen**

```bash
git log main..HEAD --oneline
git diff main..HEAD --stat
```

Erwartet: ~6–8 Commits, ~800–1200 Zeilen Changes (haupthauptsächlich Shader-Strings + Material-Builder).

**Step 2: PR-Beschreibung schreiben**

Inhalt:
- Goal: Wuxing-Element-Material auf der `SignatureSphere3D`
- Architektur-Diagramm (sphere-3d Solid-Layer ← ShaderMaterial ← element/palette/material-props)
- Vorher/Nachher-Screenshots (5 Elemente, dark mode + bright mode)
- Performance-Bilanz (FPS pro Element auf M1)
- Risiko-Liste:
  - Custom ShaderMaterial: keine standard PBR-Roughness/Metalness; pure Lambert+Blinn-Phong
  - Mobile DPR=2 cap könnte auf älteren Geräten knapp werden
  - Vertex-Color-Chladni-Pattern aus dem alten Solid-Layer ist gewichen — Chladni-Knoten sind jetzt nur noch via Wireframe und Pol-Marker sichtbar; falls das fehlt, könnte eine Vertex-Color-Schicht im neuen Shader ergänzt werden (separate Iteration)

**Step 3: Push + PR**

```bash
git push -u origin feature/sphere-wuxing-surfaces
# PR auf GitHub erstellen mit obiger Beschreibung
```

**Step 4: Worktree behalten bis PR merged**

Worktree wird nach Merge entfernt:

```bash
cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum
git worktree remove .worktrees/sphere-wuxing-surfaces
```

---

## Risiken und Open Questions

1. **Vertex-Color-Chladni-Pattern.** Der bisherige `solidGeom` trug eine Vertex-Color-Map mit Chladni-Knoten. Mit dem neuen `ShaderMaterial` ist das weg — die Chladni-Knoten sind nur noch im Wireframe-Layer (oben drüber) und in den Pol-Markern sichtbar. Wenn das Element-Material das überdeckt, sollten wir die Chladni-Knoten zusätzlich im Fragment-Shader als Modulation einarbeiten (weiterer Uniform `u_chladniWeights[10]`, eine ableitbare GLSL-Funktion). Out-of-scope für diese Iteration; als Issue offen halten.

2. **Animations-Time-Sync mit Three.js Clock.** Der Mockup nutzt einen lokalen `t`-Counter. In R3F kommt `useFrame((state, delta))` mit Game-State; wir nutzen `state.clock.elapsedTime` als Time-Uniform. Sicherstellen, dass Reduced-Motion das auf 0 fixiert.

3. **iPhone-Performance.** Die Voronoi-Loop in Earth (6 Seeds) plus zwei `pow()` calls pro Pixel kann auf iPhone-12-GPUs schon teuer werden. Falls FPS einbricht, ist die erste Optimierung: Earth-Heightfield als pre-baked Texture (1024×512) auf dem CPU rendern und als `sampler2D` an den Fragment-Shader geben — separate Iteration.

4. **Chladni-Displacement-Konflikt.** Die existierende Chladni-Geometrie-Displacement (12% Radius) wirkt zusätzlich zur Element-Plastik. Bei Earth (PLASTICITY 1.30) könnten beide zusammen zu Über-Deformation führen. Verifikation in Storybook-Story Earth+Sun=0.9 — falls problematisch, `DISPLACEMENT_FACTOR` auf 0.10 senken oder Element-Plastik im Vertex-Shader weiter dämpfen.

---

## Plan complete and saved to `docs/plans/2026-04-30-sphere-wuxing-surfaces.md`. Two execution options:

**1. Subagent-Driven (this session)** — Ich dispatche fresh subagent pro Task, review zwischen Tasks, schnelle Iteration. Empfohlen wenn du dabei sein willst und Feedback geben magst.

**2. Parallel Session (separate)** — Du öffnest neue Session im Worktree mit `executing-plans`, batch execution mit Checkpoints. Empfohlen wenn du den Plan an Claude Code/Cursor übergeben willst und parallel an etwas anderem arbeitest.

**Welche Variante?**

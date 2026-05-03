import * as THREE from 'three';
import { VERTEX_SHADER, FRAGMENT_SHADER } from './wuxing-shaders';
import {
  ELEMENT_INDEX,
  MATERIAL_PROPS,
  PLASTICITY,
  SURFACE_PALETTES,
  paletteToVec3Array,
  type WuxingElement,
} from './wuxing-surfaces';

export interface WuxingMaterialUserData {
  updateElement: (el: WuxingElement) => void;
  updateTime: (t: number) => void;
  /** Update dark/bright mode after construction. Must be called if planetariumMode
   *  changes at runtime — dark is baked into the closure and not auto-reactive. */
  updatePlanetariumMode: (mode: boolean) => void;
}

export interface WuxingMaterialOptions {
  element: WuxingElement;
  planetariumMode: boolean;
}

// Fixed light direction (normalized) — matches the three.js scene point lights
// in SignatureSphere3D (primary at [3,3,3]).
const LIGHT_DIR = new THREE.Vector3(3, 3, 3).normalize();
// Half-direction for Blinn-Phong: (light + view) normalized.
// Camera is at [0,0,4.5] in the scene, so view direction is [0,0,1] in view space.
// We pre-normalize for performance.
const HALF_DIR = LIGHT_DIR.clone().add(new THREE.Vector3(0, 0, 1)).normalize();

function makePaletteUniforms(element: WuxingElement, dark: boolean): THREE.Vector3[] {
  const palette = dark ? SURFACE_PALETTES[element].dark : SURFACE_PALETTES[element].bright;
  const flat = paletteToVec3Array(palette);
  return [
    new THREE.Vector3(flat[0], flat[1], flat[2]),
    new THREE.Vector3(flat[3], flat[4], flat[5]),
    new THREE.Vector3(flat[6], flat[7], flat[8]),
  ];
}

/** Coerce an arbitrary input to a valid WuxingElement key. Logs the bad value
 *  in dev so upstream data quality issues stay visible instead of crashing
 *  the renderer. Mirrors the defensive `?? 'Water'` defaults already used in
 *  CymaticsFallback. */
function coerceWuxingElement(input: unknown): WuxingElement {
  if (
    input === 'Fire' ||
    input === 'Earth' ||
    input === 'Wood' ||
    input === 'Metal' ||
    input === 'Water'
  ) {
    return input;
  }
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.warn('[wuxing-material] invalid element value, defaulting to Water:', input);
  }
  try {
    sessionStorage.setItem('__wuxingBadElement', JSON.stringify({ value: input, t: Date.now() }));
  } catch { /* ignore */ }
  return 'Water';
}

export function buildWuxingMaterial(options: WuxingMaterialOptions): THREE.ShaderMaterial {
  const safeElement = coerceWuxingElement(options.element);
  const { planetariumMode } = options;
  // Track mutable closure state so updatePlanetariumMode can re-paint without re-creating.
  let currentElement = safeElement;
  let isDark = planetariumMode;
  const element = safeElement;
  const props = MATERIAL_PROPS[element] ?? MATERIAL_PROPS.Water;

  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    transparent: true,
    uniforms: {
      u_element:      { value: ELEMENT_INDEX[element] },
      u_time:         { value: 0.0 },
      u_plasticity:   { value: PLASTICITY[element] },
      u_specStrength: { value: props.specStrength },
      u_specExp:      { value: props.specExp },
      u_palette:      { value: makePaletteUniforms(element, isDark) },
      u_lightDir:     { value: LIGHT_DIR.clone() },
      u_halfDir:      { value: HALF_DIR.clone() },
      u_ambient:      { value: 0.20 },
      u_brightMode:   { value: isDark ? 0.0 : 1.0 },
    },
  });

  (material.userData as WuxingMaterialUserData).updateElement = (el: WuxingElement) => {
    const safeEl = coerceWuxingElement(el);
    currentElement = safeEl;
    const p = MATERIAL_PROPS[safeEl] ?? MATERIAL_PROPS.Water;
    material.uniforms.u_element.value = ELEMENT_INDEX[safeEl];
    material.uniforms.u_plasticity.value = PLASTICITY[safeEl];
    material.uniforms.u_specStrength.value = p.specStrength;
    material.uniforms.u_specExp.value = p.specExp;
    material.uniforms.u_palette.value = makePaletteUniforms(safeEl, isDark);
  };

  (material.userData as WuxingMaterialUserData).updateTime = (t: number) => {
    material.uniforms.u_time.value = t;
  };

  (material.userData as WuxingMaterialUserData).updatePlanetariumMode = (mode: boolean) => {
    isDark = mode;
    material.uniforms.u_brightMode.value = mode ? 0.0 : 1.0;
    material.uniforms.u_palette.value = makePaletteUniforms(currentElement, mode);
  };

  return material;
}

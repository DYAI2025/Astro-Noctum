import type { WuxingElement } from '../cymatics/bazi-to-chladni';

export type { WuxingElement };

/** Integer codes for GLSL shader (uniform int u_element). */
export const ELEMENT_INDEX: Record<WuxingElement, number> = {
  Fire:  0,
  Earth: 1,
  Wood:  2,
  Metal: 3,
  Water: 4,
};

/** Specular strength and shininess per element. */
export const MATERIAL_PROPS: Record<WuxingElement, { specStrength: number; specExp: number }> = {
  Fire:  { specStrength: 0.06, specExp: 6 },
  Earth: { specStrength: 0.10, specExp: 14 },
  Wood:  { specStrength: 0.12, specExp: 22 },
  Metal: { specStrength: 0.65, specExp: 95 },
  Water: { specStrength: 0.50, specExp: 65 },
};

/** Heightfield bump scale per element. Higher = deeper relief. */
export const PLASTICITY: Record<WuxingElement, number> = {
  Fire:  1.00,
  Earth: 1.30,
  Wood:  0.95,
  Metal: 0.45,
  Water: 0.75,
};

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

/** Flatten palette to 9 floats (0..1) for GLSL `uniform vec3[3]`. */
export function paletteToVec3Array(p: ElementPalette): number[] {
  return [
    p.inner[0] / 255, p.inner[1] / 255, p.inner[2] / 255,
    p.mid[0]   / 255, p.mid[1]   / 255, p.mid[2]   / 255,
    p.outer[0] / 255, p.outer[1] / 255, p.outer[2] / 255,
  ];
}

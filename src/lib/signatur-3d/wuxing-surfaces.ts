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

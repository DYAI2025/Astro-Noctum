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

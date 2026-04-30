import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { ELEMENT_INDEX } from '../wuxing-surfaces';

// This test runs in happy-dom without a real WebGL context.
// ShaderMaterial construction doesn't need WebGL — we just verify the uniform layout.
import { buildWuxingMaterial } from '../wuxing-material';

describe('buildWuxingMaterial', () => {
  it('returns a THREE.ShaderMaterial', () => {
    const mat = buildWuxingMaterial({ element: 'Fire', planetariumMode: true });
    expect(mat).toBeInstanceOf(THREE.ShaderMaterial);
    mat.dispose();
  });

  it('sets up expected uniforms', () => {
    const mat = buildWuxingMaterial({ element: 'Metal', planetariumMode: false });
    expect(mat.uniforms.u_element).toBeDefined();
    expect(mat.uniforms.u_time).toBeDefined();
    expect(mat.uniforms.u_plasticity).toBeDefined();
    expect(mat.uniforms.u_specStrength).toBeDefined();
    expect(mat.uniforms.u_specExp).toBeDefined();
    expect(mat.uniforms.u_palette).toBeDefined();
    expect(mat.uniforms.u_lightDir).toBeDefined();
    expect(mat.uniforms.u_halfDir).toBeDefined();
    expect(mat.uniforms.u_ambient).toBeDefined();
    expect(mat.uniforms.u_brightMode).toBeDefined();
    mat.dispose();
  });

  it('initial u_element value matches ELEMENT_INDEX for given element', () => {
    const mat = buildWuxingMaterial({ element: 'Water', planetariumMode: true });
    expect(mat.uniforms.u_element.value).toBe(ELEMENT_INDEX['Water']);
    mat.dispose();
  });

  it('updateElement mutates uniform in place without re-creating the material', () => {
    const mat = buildWuxingMaterial({ element: 'Wood', planetariumMode: true });
    mat.userData.updateElement('Fire');
    expect(mat.uniforms.u_element.value).toBe(ELEMENT_INDEX['Fire']);
    mat.dispose();
  });

  it('updateTime mutates u_time uniform', () => {
    const mat = buildWuxingMaterial({ element: 'Earth', planetariumMode: true });
    mat.userData.updateTime(3.14);
    expect(mat.uniforms.u_time.value).toBeCloseTo(3.14);
    mat.dispose();
  });
});

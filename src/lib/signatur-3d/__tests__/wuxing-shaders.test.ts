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
    const fireMatch = FRAGMENT_SHADER.match(/u_element\s*==\s*0/);
    const waterMatch = FRAGMENT_SHADER.match(/u_element\s*==\s*4/);
    expect(fireMatch).not.toBeNull();
    expect(waterMatch).not.toBeNull();
  });

  it('fragment shader implements lambert + blinn-phong lighting', () => {
    expect(FRAGMENT_SHADER).toContain('u_lightDir');
    expect(FRAGMENT_SHADER).toContain('u_specStrength');
    expect(FRAGMENT_SHADER).toContain('u_specExp');
    expect(FRAGMENT_SHADER.match(/heightField/g)?.length).toBeGreaterThanOrEqual(3);
  });
});

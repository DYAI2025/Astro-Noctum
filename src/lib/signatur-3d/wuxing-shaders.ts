export const VERTEX_SHADER = /* glsl */`
  uniform float u_time;
  uniform float u_plasticity;
  uniform int u_element;

  varying vec2 v_uv;
  varying vec3 v_normal;
  varying vec3 v_viewPos;
  varying float v_height;

  vec2 sphereUV(vec3 p) {
    float r = length(p);
    float lon = atan(p.x, p.z);
    float lat = asin(clamp(p.y / r, -1.0, 1.0));
    return vec2(lon / (2.0 * 3.14159265) + 0.5, 0.5 - lat / 3.14159265);
  }

  float vertexHeight(vec2 uv) {
    if (u_element == 0) {
      return 0.5 * sin(uv.x * 6.283 + sin(uv.y * 5.0)) + 0.3 * sin(uv.y * 9.0 - u_time * 0.4);
    } else if (u_element == 1) {
      return 0.1 * sin(uv.x * 22.0) * sin(uv.y * 17.0);
    } else if (u_element == 2) {
      vec2 c = uv - vec2(0.42, 0.58);
      return 0.2 * sin(length(c) * 38.0);
    } else if (u_element == 3) {
      return 0.0;
    } else {
      return 0.3 * sin((uv.x * 9.0 + uv.y * 4.0) * 3.14 + u_time * 0.7)
           + 0.2 * sin((uv.x * 4.0 - uv.y * 11.0) * 3.14 + u_time * 0.4);
    }
  }

  void main() {
    vec2 uv = sphereUV(position);
    v_uv = uv;
    float h = vertexHeight(uv);
    v_height = h;
    vec3 displaced = position + normal * h * 0.015 * u_plasticity;
    vec4 mvPos = modelViewMatrix * vec4(displaced, 1.0);
    v_viewPos = mvPos.xyz;
    v_normal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mvPos;
  }
`;

export const FRAGMENT_SHADER = /* glsl */`
  precision highp float;

  uniform int u_element;
  uniform float u_time;
  uniform float u_plasticity;
  uniform float u_specStrength;
  uniform float u_specExp;
  uniform vec3 u_palette[3];
  uniform vec3 u_lightDir;
  uniform vec3 u_halfDir;
  uniform float u_ambient;
  uniform float u_brightMode;

  varying vec2 v_uv;
  varying vec3 v_normal;
  varying vec3 v_viewPos;
  varying float v_height;

  float heightField(vec2 uv) {
    float PI = 3.14159265;
    if (u_element == 0) {
      float base = 0.5 * sin(uv.x * 8.0 * PI + sin(uv.y * 5.0 * PI) * 1.5 + u_time * 0.3);
      float flow = 0.3 * sin((uv.x * 3.0 + uv.y * 7.0) * PI + (uv.x - uv.y) * 2.0 + u_time * 0.5);
      float flicker = 0.2 * sin(uv.x * 22.0 * PI + u_time) * sin(uv.y * 18.0 * PI);
      return base + flow + flicker;
    } else if (u_element == 1) {
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
        if (d < minD) { secondD = minD; minD = d; }
        else if (d < secondD) { secondD = d; }
      }
      float vein = clamp((secondD - minD) * 1.6, 0.0, 1.0);
      float grain = 0.10 * sin(uv.x * 42.0 * PI + uv.y * 37.0 * PI) * sin(uv.x * 53.0 * PI - uv.y * 29.0 * PI);
      return vein * 0.85 + grain;
    } else if (u_element == 2) {
      vec2 c = uv - vec2(0.42, 0.58);
      float r = length(c);
      float rings = sin(r * 38.0 * PI + sin(uv.y * 7.0 * PI) * 2.5);
      float grain = 0.08 * sin(uv.x * 90.0 * PI + uv.y * 8.0 * PI);
      vec2 knotC = uv - vec2(0.74, 0.31);
      float knot = exp(-dot(knotC, knotC) * 38.0) * 0.7;
      return rings * 0.40 + grain + knot;
    } else if (u_element == 3) {
      float brush = 0.05 * sin(uv.y * 280.0 * PI + sin(uv.x * 8.0 * PI) * 0.8);
      float flow = 0.04 * sin(uv.x * 5.0 * PI + uv.y * 3.0 * PI);
      float breath = 0.02 * sin(uv.x * 1.7 * PI + uv.y * 2.1 * PI);
      return brush + flow + breath;
    } else {
      float wave1 = 0.30 * sin((uv.x * 9.0 + uv.y * 4.0) * PI + sin(uv.y * 3.0 * PI) * 0.5 + u_time * 0.6);
      float wave2 = 0.20 * sin((uv.x * 4.0 - uv.y * 11.0) * PI + 1.2 + u_time * 0.4);
      float wave3 = 0.10 * sin((uv.x * 17.0 + uv.y * 20.0) * PI + 2.7 + u_time * 0.8);
      return wave1 + wave2 + wave3;
    }
  }

  vec3 albedoFromHeight(float h, vec2 uv) {
    vec3 cInner = u_palette[0];
    vec3 cMid   = u_palette[1];
    vec3 cOuter = u_palette[2];
    if (u_element == 0) {
      float t = clamp((h + 0.8) / 1.6, 0.0, 1.0);
      vec3 base = mix(mix(cOuter, cMid, pow(t, 0.7)), cInner, pow(t, 1.6));
      if (h > 0.30) { base += cInner * (h - 0.30) * 1.4 * 0.45; }
      return base;
    } else if (u_element == 1) {
      float t = clamp(0.20 + h * 1.1, 0.0, 1.0);
      return mix(mix(cOuter, cMid, pow(t, 0.85)), cInner, pow(t, 1.6));
    } else if (u_element == 2) {
      float t = clamp((h + 0.7) / 1.4, 0.0, 1.0);
      return mix(mix(cOuter, cMid, pow(t, 0.9)), cInner, pow(t, 1.5));
    } else if (u_element == 3) {
      return mix(cMid, cInner, 0.45 + abs(h) * 0.55);
    } else {
      float t = clamp((h + 0.6) / 1.2, 0.0, 1.0);
      vec3 base = mix(mix(cOuter, cMid, pow(t, 0.85)), cInner, pow(t, 1.5));
      if (h > 0.30) { base += vec3((h - 0.30) * 0.85 * 0.12, (h - 0.30) * 0.85 * 0.20, (h - 0.30) * 0.85 * 0.25); }
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
    vec3 nMicro = normalize(vec3(-gu, -gv, 1.0));
    float ndotl = max(0.0, dot(nMicro, u_lightDir));
    float ndoth = max(0.0, dot(nMicro, u_halfDir));
    float specular = pow(ndoth, u_specExp) * u_specStrength;
    vec3 albedo = albedoFromHeight(h, uv);
    float limb = 0.55 + pow(max(v_normal.z, 0.0), 0.6) * 0.45;
    float lighting = u_ambient + ndotl * (1.0 - u_ambient);
    vec3 specColor = (u_element == 3 || u_element == 4) ? vec3(1.0) : vec3(1.0, 0.94, 0.86);
    vec3 finalColor = albedo * lighting * limb + specular * specColor;
    if (u_brightMode > 0.5) { finalColor = mix(finalColor, vec3(1.0), 0.06); }
    gl_FragColor = vec4(finalColor, 0.92);
  }
`;

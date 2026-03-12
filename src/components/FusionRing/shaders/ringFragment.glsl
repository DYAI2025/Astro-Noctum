#version 300 es
precision highp float;

in vec3 vNormal;
in vec3 vPosition;
in float vSignal;

uniform float uTime;
uniform float uResolution;
uniform float uKpBoost;

out vec4 fragColor;

const vec3 GOLD = vec3(0.83, 0.70, 0.22);
const vec3 DEEP = vec3(0.02, 0.01, 0.08);

vec3 elementColor(float sector) {
  // exakte SECTOR_COLORS Interpolation
  int s = int(sector);
  vec3 c1 = vec3(0.18,0.49,0.20); // Wood etc. – ersetze durch echte Werte aus colors.ts
  vec3 c2 = vec3(0.90,0.56,0.0);  // Fire
  return mix(c1, c2, fract(sector));
}

void main() {
  float angle = atan(vPosition.y, vPosition.x);
  float sector = mod(angle + 3.1415926535, 6.283185307) * 1.909859; // /30°
  
  vec3 baseCol = elementColor(sector);
  
  // Kristalline Refraction (fake)
  float refr = 1.0 - abs(dot(normalize(vNormal), vec3(0.0,0.0,1.0)));
  refr = pow(refr, 2.2);
  
  // Procedural Caustics (3-layer sin)
  float caustics = sin(vPosition.x * 12.0 + uTime * 3.0) * 
                   cos(vPosition.y * 12.0 + uTime * 2.8) * 
                   sin(uTime * 1.2);
  caustics = pow(abs(caustics), 3.0) * 0.6;
  
  // Pulsierende Adern + Glow
  float veins = sin(angle * 24.0 + uTime * 6.0) * vSignal * 0.7;
  float glow = pow(vSignal, 1.8) * (1.0 + uKpBoost);
  
  vec3 color = mix(baseCol, GOLD, veins * 0.8);
  color += vec3(1.0, 0.85, 0.4) * (glow * 1.4 + caustics * 0.8);
  
  // Final Alpha & Fresnel
  float alpha = 0.85 + refr * 0.4;
  if (uResolution < 0.4) alpha *= 0.7; // Low-Res Mode
  
  fragColor = vec4(color * (0.8 + glow * 0.6), alpha);
}

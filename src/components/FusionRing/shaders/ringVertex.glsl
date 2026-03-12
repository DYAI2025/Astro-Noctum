#version 300 es
precision highp float;

in vec3 position;
in vec3 normal;

uniform float uTime;
uniform float uSignal[12];
uniform float uKpBoost;

out vec3 vNormal;
out vec3 vPosition;
out float vSignal;

const float BASE_RADIUS = 4.2;
const float SECTOR_ANGLE = 0.5235987756; // 30° in rad

void main() {
  float angle = atan(position.y, position.x);
  float sector = mod(angle + 3.1415926535, 6.283185307) / SECTOR_ANGLE;
  int s = int(sector);
  float t = fract(sector);
  
  // Signal-Interpolation + Power-Curve
  float sig = mix(uSignal[s % 12], uSignal[(s+1) % 12], t);
  sig = pow(max(0.0, sig), 1.5) * (1.0 + uKpBoost * 0.3);
  
  // Organische Displacement (Erosion + Atmung)
  vec3 pos = position;
  float disp = sig * 0.45 * (1.0 + 0.08 * sin(uTime * 1.8 + angle * 8.0));
  pos += normal * disp;
  
  vNormal = normal;
  vPosition = pos;
  vSignal = sig;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}

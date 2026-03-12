#version 300 es
precision highp float;

in vec3 position;
in float life;

uniform float uTime;
uniform float uSignal[12];

out float vLife;

void main() {
  float angle = position.x * 6.283185307; // 0-1 → 360°
  float radius = 4.3 + sin(uTime * 2.0 + angle) * 0.15;
  
  // Flow entlang Ring + Signal-Anziehung
  float sig = uSignal[int(angle * 1.909859) % 12];
  vec3 pos = vec3(cos(angle) * radius, sin(angle) * radius, position.z * (1.0 + sig * 0.8));
  
  // Gentle spiral movement
  pos.z += sin(uTime * 1.5 + angle * 3.0) * 0.3 * sig;
  
  vLife = life;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = 3.5 * (1.0 + sig * 0.6);
}

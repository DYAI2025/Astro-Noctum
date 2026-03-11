import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// ---------------------------------------------------------------------------
// Shader Logic: Fu-Ring Anatomie (Layer 1, 2, 4)
// ---------------------------------------------------------------------------

const SECTOR_COLORS = [
  new THREE.Color('#E63946'), new THREE.Color('#C9A227'), new THREE.Color('#E9C46A'),
  new THREE.Color('#A8DADC'), new THREE.Color('#F4A261'), new THREE.Color('#6B9080'),
  new THREE.Color('#D4A5A5'), new THREE.Color('#9B2335'), new THREE.Color('#7B2D8E'),
  new THREE.Color('#2B2D42'), new THREE.Color('#00B4D8'), new THREE.Color('#48BFE3'),
];

const FRAGMENT_SHADER = `
  uniform float uTime;
  uniform float uSignals[12];
  uniform vec3 uColors[12];
  uniform float uSpikeIntensity;    // Layer 4
  uniform float uShowEquilibrium;   // Layer 5
  uniform float uNoiseAmount;       // Layer 1
  varying vec2 vUv;

  #define PI 3.14159265359

  // Simplex-ish Noise for "Eroded" Texture
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f*f*(3.0-2.0*f);
    return mix(mix(hash(i + vec2(0,0)), hash(i + vec2(1,0)), u.x),
               mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
  }

  float getSignal(float angle) {
    float normalized = (angle / (2.0 * PI)) * 12.0;
    int left = int(floor(normalized)) % 12;
    int right = (left + 1) % 12;
    float t = fract(normalized);
    float smoothT = t * t * (3.0 - 2.0 * t);
    float valL = 0.0; float valR = 0.0;
    for(int i = 0; i < 12; i++) {
      if(i == left) valL = uSignals[i];
      if(i == right) valR = uSignals[i];
    }
    return mix(valL, valR, smoothT);
  }

  vec3 getColor(float angle) {
    float normalized = (angle / (2.0 * PI)) * 12.0;
    int left = int(floor(normalized)) % 12;
    int right = (left + 1) % 12;
    float t = fract(normalized);
    vec3 colL = vec3(0.0); vec3 colR = vec3(0.0);
    for(int i = 0; i < 12; i++) {
      if(i == left) colL = uColors[i];
      if(i == right) colR = uColors[i];
    }
    return mix(colL, colR, t);
  }

  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    float dist = length(uv);
    float angle = atan(uv.y, uv.x) + PI / 2.0;
    if (angle < 0.0) angle += 2.0 * PI;

    float signal = getSignal(angle);
    vec3 baseColor = getColor(angle);

    // Layer 1: Eroded Noise Canvas
    float n = noise(uv * 10.0 + uTime * 0.2) * uNoiseAmount;
    
    // Layer 4: Crystalline Spikes (Sharp high-frequency additive)
    float spike = pow(abs(sin(angle * 50.0 + uTime * 10.0)), 10.0) * signal * uSpikeIntensity;
    
    // Geometry
    float innerR = 0.4;
    float equilibriumR = 0.65;
    float outerR = innerR + (0.4 * (0.2 + signal * 0.8)) + spike;
    
    // Render Ring
    float ringMask = smoothstep(innerR - 0.01, innerR, dist) * smoothstep(outerR + 0.01, outerR, dist);
    
    // Layer 5: Equilibrium Line (Dashed)
    float eqLine = 0.0;
    if (uShowEquilibrium > 0.5) {
      float eqDist = abs(dist - equilibriumR);
      float dash = step(0.5, fract(angle * 10.0));
      eqLine = smoothstep(0.01, 0.0, eqDist) * dash * 0.5;
    }

    // Final Color
    vec3 color = baseColor * (0.5 + signal * 0.5 + n);
    color += vec3(1.0) * spike * 2.0; // Glow for spikes
    
    float glow = exp(-pow(dist - (innerR + outerR) * 0.5, 2.0) * 40.0);
    color += baseColor * glow * 0.4;

    gl_FragColor = vec4(color, max(ringMask, eqLine));
  }
`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface OptimizedFuRingProps {
  signals: number[];
  size?: number;
  mode?: 'normal' | 'divergence' | 'equilibrium' | 'transit';
}

export default function OptimizedFuRing({
  signals,
  size = 400,
  mode = 'normal',
}: OptimizedFuRingProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const koronaRef = useRef<THREE.Points | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Post-Processing
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(size, size), 0.8, 0.4, 0.85);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());

    // Layer 1, 2, 4 Material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSignals: { value: signals },
        uColors: { value: SECTOR_COLORS },
        uSpikeIntensity: { value: 0 },
        uShowEquilibrium: { value: 0 },
        uNoiseAmount: { value: 0.1 },
      },
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });
    materialRef.current = material;

    const ringMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(ringMesh);

    // Layer 3: Korona (Particle System)
    const particleCount = 2000;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(particleCount * 3);
    const pAngles = new Float32Array(particleCount);
    for(let i=0; i<particleCount; i++) {
      pAngles[i] = Math.random() * Math.PI * 2;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('angle', new THREE.BufferAttribute(pAngles, 1));

    const pMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uSignals: { value: signals }, uColors: { value: SECTOR_COLORS } },
      vertexShader: `
        attribute float angle;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uTime;
        uniform float uSignals[12];
        uniform vec3 uColors[12];
        
        #define PI 3.14159265359

        void main() {
          int idx = int(floor((angle / (2.0 * PI)) * 12.0)) % 12;
          float signal = uSignals[idx];
          
          // Organic curve path
          float r = 0.5 + (0.4 * signal) + 0.1 * sin(uTime * 2.0 + angle * 5.0);
          vec3 pos = vec3(cos(angle) * r, sin(angle) * r, 0.0);
          
          // Add some jitter
          pos.xy += vec2(sin(uTime + angle), cos(uTime + angle)) * 0.02 * signal;
          
          vColor = uColors[idx];
          vAlpha = smoothstep(0.0, 0.3, signal);
          
          gl_PointSize = 2.0 * (1.0 + signal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `varying vec3 vColor; varying float vAlpha; void main() { gl_FragColor = vec4(vColor, vAlpha * 0.6); }`,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });
    const korona = new THREE.Points(pGeo, pMat);
    scene.add(korona);
    koronaRef.current = korona;

    let raf: number;
    const clock = new THREE.Clock();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      material.uniforms.uTime.value = t;
      pMat.uniforms.uTime.value = t;
      composer.render();
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
          obj.geometry.dispose();
          if (obj.material instanceof THREE.Material) obj.material.dispose();
        }
      });
      renderer.dispose();
      composer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  // Update uniforms based on mode and signals
  useEffect(() => {
    if (materialRef.current) {
      const u = materialRef.current.uniforms;
      u.uSignals.value = signals;
      u.uSpikeIntensity.value = mode === 'divergence' ? 0.3 : (mode === 'transit' ? 0.15 : 0);
      u.uShowEquilibrium.value = mode === 'equilibrium' ? 1.0 : 0;
      u.uNoiseAmount.value = mode === 'transit' ? 0.4 : 0.1;
    }
    if (koronaRef.current) {
      (koronaRef.current.material as THREE.ShaderMaterial).uniforms.uSignals.value = signals;
    }
  }, [signals, mode]);

  return <div ref={containerRef} style={{ width: size, height: size }} />;
}

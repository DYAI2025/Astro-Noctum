import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// ---------------------------------------------------------------------------
// Constants & Shaders
// ---------------------------------------------------------------------------

const SECTOR_COLORS = [
  new THREE.Color('#E63946'), // Widder
  new THREE.Color('#C9A227'), // Stier
  new THREE.Color('#E9C46A'), // Zwillinge
  new THREE.Color('#A8DADC'), // Krebs
  new THREE.Color('#F4A261'), // Löwe
  new THREE.Color('#6B9080'), // Jungfrau
  new THREE.Color('#D4A5A5'), // Waage
  new THREE.Color('#9B2335'), // Skorpion
  new THREE.Color('#7B2D8E'), // Schütze
  new THREE.Color('#2B2D42'), // Steinbock
  new THREE.Color('#00B4D8'), // Wassermann
  new THREE.Color('#48BFE3'), // Fische
];

const VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  uniform float uTime;
  uniform float uSignals[12];
  uniform vec3 uColors[12];
  varying vec2 vUv;

  #define PI 3.14159265359

  float smoothStepInterpolate(float signals[12], float angle) {
    float normalized = (angle / (2.0 * PI)) * 12.0;
    int left = int(floor(normalized)) % 12;
    int right = (left + 1) % 12;
    float t = normalized - floor(normalized);
    float smoothT = t * t * (3.0 - 2.0 * t);
    
    float valL = 0.0;
    float valR = 0.0;
    
    for(int i = 0; i < 12; i++) {
      if(i == left) valL = signals[i];
      if(i == right) valR = signals[i];
    }
    
    return mix(valL, valR, smoothT);
  }

  vec3 colorAtAngle(vec3 colors[12], float angle) {
    float normalized = (angle / (2.0 * PI)) * 12.0;
    int left = int(floor(normalized)) % 12;
    int right = (left + 1) % 12;
    float t = normalized - floor(normalized);
    float smoothT = t * t * (3.0 - 2.0 * t);
    
    vec3 colL = vec3(0.0);
    vec3 colR = vec3(0.0);
    
    for(int i = 0; i < 12; i++) {
      if(i == left) colL = colors[i];
      if(i == right) colR = colors[i];
    }
    
    return mix(colL, colR, smoothT);
  }

  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    float dist = length(uv);
    float angle = atan(uv.y, uv.x) + PI / 2.0;
    if (angle < 0.0) angle += 2.0 * PI;
    if (angle > 2.0 * PI) angle -= 2.0 * PI;

    float signal = smoothStepInterpolate(uSignals, angle);
    vec3 baseColor = colorAtAngle(uColors, angle);

    // Animation: Breathing
    float breathing = 1.0 + 0.02 * sin(uTime * 1.5 + angle * 2.0) * (0.3 + signal * 0.7);
    
    // Geometry
    float innerR = 0.45;
    float outerR = innerR + (0.45 * (0.3 + signal * 0.7)) * breathing;
    
    // Mask
    float ringMask = smoothstep(innerR - 0.01, innerR, dist) * smoothstep(outerR + 0.01, outerR, dist);
    
    // Visual Polish
    vec3 color = baseColor * (0.6 + signal * 0.4);
    float glow = exp(-pow(dist - (innerR + outerR) * 0.5, 2.0) * 50.0);
    color += baseColor * glow * 0.5;

    gl_FragColor = vec4(color, ringMask * (0.8 + 0.2 * signal));
  }
`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface OptimizedFuRingProps {
  signals: number[];
  size?: number;
  className?: string;
}

export default function OptimizedFuRing({
  signals,
  size = 400,
  className,
}: OptimizedFuRingProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);

  // Update uniforms when signals change
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uSignals.value = signals;
    }
  }, [signals]);

  // Handle Resize
  useEffect(() => {
    if (rendererRef.current && composerRef.current) {
      rendererRef.current.setSize(size, size);
      composerRef.current.setSize(size, size);
    }
  }, [size]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Bloom
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(size, size), 0.6, 0.4, 0.85);
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());
    composerRef.current = composer;

    // Material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSignals: { value: signals },
        uColors: { value: SECTOR_COLORS },
      },
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });
    materialRef.current = material;

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    // Animation Loop
    let raf: number;
    const clock = new THREE.Clock();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (materialRef.current) {
        materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
      }
      composer.render();
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      renderer.dispose();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  return (
    <div 
      ref={containerRef} 
      className={className} 
      style={{ width: size, height: size, position: 'relative' }} 
    />
  );
}

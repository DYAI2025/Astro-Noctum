import { useState, useEffect, useRef, useCallback } from 'react';
import type * as THREE_TYPES from 'three';
import { createFusionAudio, type FusionAudioEngine } from './fusion-ring-audio';
import { createDemoProfile, compileProfile, type DeformationChannels, type FusionRingProfile } from './fusion-ring-profile';
import { FusionRingInputController } from './fusion-ring-input';
import { createDemoTransitState, type RingEffectType, type TransitStateV1 } from './fusion-ring-transit';
import type { QuizClusterResult } from './fusion-ring-input';

function isWebGLAvailable(): boolean {
  try {
    const canvas = document?.createElement?.('canvas');
    if (!canvas) return false;
    const gl = canvas?.getContext?.('webgl2') || canvas?.getContext?.('webgl');
    return !!gl;
  } catch {
    return false;
  }
}

type EffectType = 'resonanzsprung' | 'dominanzwechsel' | 'mond_event' | 'spannungsachse' | 'korona_eruption' | 'divergenz_spike' | 'burst' | 'crunch' | null;

interface EffectState {
  type: EffectType;
  startTime: number;
  duration: number;
  /** Effect intensity 0–1 (default 1.0 for legacy button triggers) */
  intensity: number;
  /** Primary affected sector 0–11 */
  sector: number;
}

const EFFECT_CONFIGS: Record<string, { label: string; sublabel: string; color: string; borderColor: string }> = {
  resonanzsprung: { label: 'RESONANZSPRUNG', sublabel: 'Delta \u2265 0.18 \u00b7 Sector Spike', color: 'rgba(255,58,42,0.9)', borderColor: 'rgba(255,58,42,0.4)' },
  dominanzwechsel: { label: 'DOMINANZWECHSEL', sublabel: 'Sector Override \u00b7 \u2265 0.08', color: 'rgba(255,184,42,0.9)', borderColor: 'rgba(255,184,42,0.4)' },
  mond_event: { label: 'MOND-EVENT', sublabel: 'Lunar Phase \u00b7 Peak Sector', color: 'rgba(180,200,255,0.9)', borderColor: 'rgba(180,200,255,0.4)' },
  spannungsachse: { label: 'SPANNUNGSACHSE', sublabel: 'Opposition Tension \u00b7 S1\u2194S7', color: 'rgba(200,80,255,0.9)', borderColor: 'rgba(200,80,255,0.4)' },
  korona_eruption: { label: 'KORONA-ERUPTION', sublabel: 'Energy Strands \u00b7 Peak Overflow', color: 'rgba(42,255,90,0.9)', borderColor: 'rgba(42,255,90,0.4)' },
  divergenz_spike: { label: 'DIVERGENZ', sublabel: 'DIVERGENCE DETECTED', color: 'rgba(255,255,255,0.95)', borderColor: 'rgba(255,80,60,0.5)' },
  burst: { label: 'BURST', sublabel: 'Particle Explosion · Outward', color: 'rgba(255,200,60,0.95)', borderColor: 'rgba(255,160,30,0.5)' },
  crunch: { label: 'CRUNCH', sublabel: 'Compression · Inward Collapse', color: 'rgba(100,180,255,0.95)', borderColor: 'rgba(60,120,255,0.5)' },
};

// === SOUL PROFILE (simulated horoscope/quiz mapping) ===
const SOUL_PROFILE = [
  0.6, 0.45, 0.8, 0.35, 0.7, 0.55, 0.9, 0.4,
  0.65, 0.5, 0.75, 0.3, 0.85, 0.6, 0.42, 0.72,
  0.58, 0.88, 0.38, 0.68, 0.52, 0.78, 0.44, 0.82,
  0.56, 0.7, 0.48, 0.62, 0.9, 0.36, 0.74, 0.54,
];

function soulNoise(angle: number, seed: number): number {
  const idx = ((angle / (Math.PI * 2)) * SOUL_PROFILE.length) % SOUL_PROFILE.length;
  const i0 = Math.floor(idx) % SOUL_PROFILE.length;
  const i1 = (i0 + 1) % SOUL_PROFILE.length;
  const frac = idx - Math.floor(idx);
  const t = frac * frac * (3 - 2 * frac);
  const v0 = SOUL_PROFILE[i0] ?? 0.5;
  const v1 = SOUL_PROFILE[i1] ?? 0.5;
  return (v0 * (1 - t) + v1 * t) * seed;
}

// Simple hash for deterministic pseudo-random
function hash(n: number): number {
  let x = Math.sin(n * 127.1 + n * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function ThreeScene({ effectRef, audioRef }: { effectRef: React.MutableRefObject<EffectState | null>; audioRef: React.MutableRefObject<FusionAudioEngine | null> }) {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef?.current) return;
    let disposed = false;
    const container = canvasRef.current;

    const initScene = async () => {
      const THREE = await import('three');

      // === CONTAINER DIMENSIONS ===
      const rect = container.getBoundingClientRect();
      const width = rect.width || window.innerWidth;
      const height = rect.height || window.innerHeight;

      // === RENDERER ===
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.8;
      renderer.setClearColor(0x030308);
      container.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0x030308, 16, 40);

      const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
      // Initial position: top-down face view matching HOME constants
      camera.position.set(0, Math.sin(1.48) * 11.5, Math.cos(1.48) * 11.5);
      camera.lookAt(0, 0, 0);

      const clock = new THREE.Clock();

      // === LIGHTING ===
      const keyLight = new THREE.DirectionalLight(0xf5ede0, 2.0);
      keyLight.position.set(5, 8, 5);
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0x8898c0, 0.8);
      fillLight.position.set(-5, 3, -3);
      scene.add(fillLight);

      const rimLight = new THREE.DirectionalLight(0x607090, 0.4);
      rimLight.position.set(0, -3, -5);
      scene.add(rimLight);

      const ambient = new THREE.AmbientLight(0x1a1a3e, 0.3);
      scene.add(ambient);

      const coreLight = new THREE.PointLight(0x2a5a8a, 2.5, 6);
      coreLight.position.set(0, 0, 0);
      scene.add(coreLight);

      // === RING GROUP ===
      const ringGroup = new THREE.Group();
      ringGroup.rotation.set(0, 0, 0);  // flat — camera angle handles perspective
      scene.add(ringGroup);

      const RADIUS = 2;
      const TUBE = 0.22;

      // ==========================================================
      // === PROFILE-DRIVEN PARTICLE RING ===
      // The ring's permanent shape comes from the FusionRingProfile:
      //   Layer 1: Astro base (zodiac sectors + Wu Xing) = immutable
      //   Layer 2: Quiz stamps (dents, bulges, ridges, etc.) = permanent
      // Both layers are compiled into 5 continuous deformation channels
      // that the particle generator reads per-particle.
      // ==========================================================

      const demoProfile = createDemoProfile();
      const channels = compileProfile(demoProfile);

      const RING_PARTICLE_COUNT = 28000;
      const ringPositions = new Float32Array(RING_PARTICLE_COUNT * 3);
      const ringBasePositions = new Float32Array(RING_PARTICLE_COUNT * 3);
      const ringColors = new Float32Array(RING_PARTICLE_COUNT * 3);
      const ringSizes = new Float32Array(RING_PARTICLE_COUNT);
      const ringPhases = new Float32Array(RING_PARTICLE_COUNT);
      const ringNoiseOffsets = new Float32Array(RING_PARTICLE_COUNT);

      // Base monochrome color (titanium/iridium)
      const brightColor = new THREE.Color(0xc0c8d8);
      const dimColor = new THREE.Color(0x3a3a48);

      for (let i = 0; i < RING_PARTICLE_COUNT; i++) {
        const mainAngle = (i / RING_PARTICLE_COUNT) * Math.PI * 2 + hash(i) * 0.02;
        const tubeAngle = hash(i * 7 + 3) * Math.PI * 2;
        const normalizedAngle = mainAngle % (Math.PI * 2);

        // === READ PROFILE DEFORMATION CHANNELS ===
        const profileRadius = channels.radiusOffset(normalizedAngle); // -0.4 to +0.4
        const profileTube = channels.tubeScale(normalizedAngle);       // 0.4 to ~1.5
        const profileRough = channels.roughness(normalizedAngle);      // 0 to 1
        const profileTint = channels.colorTint(normalizedAngle);       // [r,g,b, intensity]
        // Soul noise harmonics (micro-texture on top of profile shape)
        const soulVal = soulNoise(normalizedAngle, 1.0);
        const h1 = soulNoise(normalizedAngle * 3 + 0.5, 0.4);
        const h2 = soulNoise(normalizedAngle * 7 + 1.2, 0.2);
        const h3 = soulNoise(normalizedAngle * 13 + 2.1, 0.1);
        const h4 = soulNoise(normalizedAngle * 23 + 3.7, 0.06);
        const soulDisplacement = (soulVal + h1 + h2 + h3 + h4 - 0.5) * 0.25;

        // Roughness-driven micro-noise (more roughness = more scatter)
        const roughScale = 0.04 + profileRough * 0.10;
        const microNoise = (hash(i * 13 + 7) - 0.5) * roughScale;
        const medNoise = (hash(i * 31 + 11) - 0.5) * roughScale * 0.5;

        // Combined tube radius: base + profile deformation + soul texture + roughness
        const localTube = (TUBE * profileTube) + (profileRadius * 0.5) + soulDisplacement + microNoise + medNoise;

        // Position on torus
        const r = RADIUS + Math.cos(tubeAngle) * localTube;
        const y = Math.sin(tubeAngle) * localTube;
        const x = Math.cos(mainAngle) * r;
        const z = Math.sin(mainAngle) * r;

        ringPositions[i * 3] = x;
        ringPositions[i * 3 + 1] = y;
        ringPositions[i * 3 + 2] = z;
        ringBasePositions[i * 3] = x;
        ringBasePositions[i * 3 + 1] = y;
        ringBasePositions[i * 3 + 2] = z;

        // === COLOR: monochrome base + profile tint ===
        const brightness = 0.3 + soulVal * 0.5 + hash(i * 17) * 0.2;
        const col = new THREE.Color().lerpColors(dimColor, brightColor, brightness);
        // Apply profile color tint
        if (profileTint[3] > 0.01) {
          const tintCol = new THREE.Color(profileTint[0], profileTint[1], profileTint[2]);
          col.lerp(tintCol, profileTint[3]);
        }
        ringColors[i * 3] = col.r;
        ringColors[i * 3 + 1] = col.g;
        ringColors[i * 3 + 2] = col.b;

        // === SIZE: varies with tube position + profile influence ===
        const outerFactor = 0.5 + Math.cos(tubeAngle) * 0.5;
        const profileSizeBoost = Math.max(0, profileRadius) * 0.004; // bulges get slightly bigger particles
        ringSizes[i] = (0.008 + outerFactor * 0.012 + soulVal * 0.004 + hash(i * 23) * 0.004 + profileSizeBoost);

        ringPhases[i] = hash(i * 41 + 13) * Math.PI * 2;
        ringNoiseOffsets[i] = soulDisplacement + profileRadius * 0.3;
      }

      const ringGeo = new THREE.BufferGeometry();
      ringGeo.setAttribute('position', new THREE.BufferAttribute(ringPositions, 3));
      ringGeo.setAttribute('color', new THREE.BufferAttribute(ringColors, 3));
      ringGeo.setAttribute('size', new THREE.BufferAttribute(ringSizes, 1));

      // Custom shader material for varied point sizes
      const ringMat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: Math.min(window.devicePixelRatio, 1.5) },
        },
        vertexShader: `
          attribute float size;
          attribute vec3 color;
          varying vec3 vColor;
          uniform float uTime;
          uniform float uPixelRatio;
          void main() {
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * uPixelRatio * (300.0 / -mvPosition.z);
            gl_PointSize = max(gl_PointSize, 1.0);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          void main() {
            // Soft circular particle
            float d = length(gl_PointCoord - vec2(0.5));
            if (d > 0.5) discard;
            float alpha = 1.0 - smoothstep(0.3, 0.5, d);
            gl_FragColor = vec4(vColor, alpha * 0.85);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      const ringParticles = new THREE.Points(ringGeo, ringMat);
      ringGroup.add(ringParticles);

      // === CORONA GLOW PARTICLES (brighter, sparser, larger at peaks) ===
      const CORONA_COUNT = 3000;
      const coronaPositions = new Float32Array(CORONA_COUNT * 3);
      const coronaBasePositions = new Float32Array(CORONA_COUNT * 3);
      const coronaColors = new Float32Array(CORONA_COUNT * 3);
      const coronaSizes = new Float32Array(CORONA_COUNT);
      const coronaPhases = new Float32Array(CORONA_COUNT);

      const glowColor = new THREE.Color(0x4a8abc);

      for (let i = 0; i < CORONA_COUNT; i++) {
        const mainAngle = (i / CORONA_COUNT) * Math.PI * 2 + hash(i + 50000) * 0.05;
        const normalizedAngle = mainAngle % (Math.PI * 2);
        const soulVal = soulNoise(normalizedAngle, 1.0);
        const h1 = soulNoise(normalizedAngle * 3 + 0.5, 0.4);
        const h2 = soulNoise(normalizedAngle * 7 + 1.2, 0.2);
        const soulDisp = (soulVal + h1 + h2 - 0.3) * 0.55;

        // Profile: corona height factor (bulges/ridges → taller corona)
        const cFactor = channels.coronaFactor(normalizedAngle);
        const profileRadius = channels.radiusOffset(normalizedAngle);
        const profileTint = channels.colorTint(normalizedAngle);

        // Only emit corona at peaks (soul > threshold OR profile bulge)
        const isPeak = soulVal > 0.5 || profileRadius > 0.1;
        const coronaHeight = isPeak
          ? soulDisp * cFactor * 1.2 + hash(i + 70000) * 0.15
          : soulDisp * 0.3 * cFactor;

        const tubeAngle = hash(i * 11 + 70000) * Math.PI * 2;
        const profileTube = channels.tubeScale(normalizedAngle);
        const localTube = (TUBE * profileTube) + coronaHeight + hash(i * 19 + 80000) * 0.05;
        const r = RADIUS + Math.cos(tubeAngle) * localTube;
        const y = Math.sin(tubeAngle) * localTube;
        const x = Math.cos(mainAngle) * r;
        const z = Math.sin(mainAngle) * r;

        coronaPositions[i * 3] = x;
        coronaPositions[i * 3 + 1] = y;
        coronaPositions[i * 3 + 2] = z;
        coronaBasePositions[i * 3] = x;
        coronaBasePositions[i * 3 + 1] = y;
        coronaBasePositions[i * 3 + 2] = z;

        // Corona color: profile tint blended with glow
        const intensity = isPeak ? 0.5 + soulVal * 0.5 : 0.2;
        const col = new THREE.Color().copy(glowColor).multiplyScalar(intensity);
        if (profileTint[3] > 0.05) {
          const tCol = new THREE.Color(profileTint[0], profileTint[1], profileTint[2]);
          col.lerp(tCol, profileTint[3] * 0.5);
        }
        coronaColors[i * 3] = col.r;
        coronaColors[i * 3 + 1] = col.g;
        coronaColors[i * 3 + 2] = col.b;

        coronaSizes[i] = isPeak ? (0.02 + soulVal * 0.025) * cFactor : 0.008 + hash(i * 29) * 0.005;
        coronaPhases[i] = hash(i * 37 + 90000) * Math.PI * 2;
      }

      const coronaGeo = new THREE.BufferGeometry();
      coronaGeo.setAttribute('position', new THREE.BufferAttribute(coronaPositions, 3));
      coronaGeo.setAttribute('color', new THREE.BufferAttribute(coronaColors, 3));
      coronaGeo.setAttribute('size', new THREE.BufferAttribute(coronaSizes, 1));

      const coronaMat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: Math.min(window.devicePixelRatio, 1.5) },
          uGlowIntensity: { value: 1.0 },
        },
        vertexShader: `
          attribute float size;
          attribute vec3 color;
          varying vec3 vColor;
          uniform float uPixelRatio;
          void main() {
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * uPixelRatio * (300.0 / -mvPosition.z);
            gl_PointSize = max(gl_PointSize, 1.0);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          uniform float uGlowIntensity;
          void main() {
            float d = length(gl_PointCoord - vec2(0.5));
            if (d > 0.5) discard;
            float alpha = (1.0 - smoothstep(0.1, 0.5, d)) * 0.6 * uGlowIntensity;
            gl_FragColor = vec4(vColor * 1.5, alpha);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      const coronaParticles = new THREE.Points(coronaGeo, coronaMat);
      ringGroup.add(coronaParticles);

      // === WU XING ELEMENT DATA (colors for sector tinting — no mesh geometry) ===
      const ELEMENTS = [
        { name: 'Wood', color: 0x2a8040, emissive: 0x1a6a2a, glow: 0x3aff6a, lightColor: 0x2aff5a },
        { name: 'Fire', color: 0x8a2a2a, emissive: 0x6a1a1a, glow: 0xff4a3a, lightColor: 0xff3a2a },
        { name: 'Earth', color: 0x7a6a2a, emissive: 0x5a4a1a, glow: 0xffc83a, lightColor: 0xffb82a },
        { name: 'Metal', color: 0x5a5a6a, emissive: 0x3a3a5a, glow: 0xd0d8f0, lightColor: 0xc0c8e0 },
        { name: 'Water', color: 0x2a3a7a, emissive: 0x1a2a6a, glow: 0x3a9aff, lightColor: 0x2a8aff },
      ];

      const nodeAngles: number[] = [];
      ELEMENTS.forEach((_, i) => {
        nodeAngles.push((i / 5) * Math.PI * 2);
      });

      // === AMBIENT DUST (sparse floating particles around the ring) ===
      const dustCount = 500;
      const dustPositions = new Float32Array(dustCount * 3);
      for (let i = 0; i < dustCount; i++) {
        const angle = hash(i * 53) * Math.PI * 2;
        const r = RADIUS + (hash(i * 67) - 0.5) * 1.2;
        dustPositions[i * 3] = Math.cos(angle) * r;
        dustPositions[i * 3 + 1] = (hash(i * 79) - 0.5) * 0.8;
        dustPositions[i * 3 + 2] = Math.sin(angle) * r;
      }
      const dustGeo = new THREE.BufferGeometry();
      dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
      const dustMat = new THREE.PointsMaterial({
        color: 0x4a6a8a,
        size: 0.006,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      });
      const dust = new THREE.Points(dustGeo, dustMat);
      ringGroup.add(dust);

      // === ENVIRONMENT MAP ===
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      const envScene = new THREE.Scene();
      envScene.background = new THREE.Color(0x080818);
      const envL1 = new THREE.PointLight(0x2a6a9a, 3, 10);
      envL1.position.set(3, 3, 3);
      envScene.add(envL1);
      const envL2 = new THREE.PointLight(0x6a2a4a, 2, 10);
      envL2.position.set(-3, -1, 2);
      envScene.add(envL2);
      const envL3 = new THREE.PointLight(0x3a7a4a, 1.5, 10);
      envL3.position.set(0, 4, -3);
      envScene.add(envL3);
      const envMap = pmremGenerator.fromScene(envScene, 0.04).texture;
      scene.environment = envMap;
      pmremGenerator.dispose();

      // === EFFECT OBJECTS ===
      const effectLight1 = new THREE.PointLight(0xffffff, 0, 8);
      scene.add(effectLight1);
      const effectLight2 = new THREE.PointLight(0xffffff, 0, 8);
      scene.add(effectLight2);

      // === PROCEDURAL GLOW TEXTURES ===
      // Soft radial glow — used for point sprites and energy nodes
      const glowCanvas = document.createElement('canvas');
      glowCanvas.width = 128; glowCanvas.height = 128;
      const glowCtx = glowCanvas.getContext('2d')!;
      const grad = glowCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.15, 'rgba(255,255,255,0.8)');
      grad.addColorStop(0.4, 'rgba(255,200,180,0.3)');
      grad.addColorStop(0.7, 'rgba(255,120,80,0.08)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      glowCtx.fillStyle = grad;
      glowCtx.fillRect(0, 0, 128, 128);
      const glowTexture = new THREE.CanvasTexture(glowCanvas);

      // Elongated vertical energy beam texture
      const beamCanvas = document.createElement('canvas');
      beamCanvas.width = 32; beamCanvas.height = 256;
      const beamCtx = beamCanvas.getContext('2d')!;
      const beamGrad = beamCtx.createLinearGradient(0, 0, 0, 256);
      beamGrad.addColorStop(0, 'rgba(255,255,255,0)');
      beamGrad.addColorStop(0.05, 'rgba(255,255,255,0.6)');
      beamGrad.addColorStop(0.15, 'rgba(255,255,255,1)');
      beamGrad.addColorStop(0.5, 'rgba(255,220,180,0.7)');
      beamGrad.addColorStop(0.85, 'rgba(255,120,80,0.2)');
      beamGrad.addColorStop(1, 'rgba(0,0,0,0)');
      beamCtx.fillStyle = beamGrad;
      beamCtx.fillRect(0, 0, 32, 256);
      // Add a bright core line
      const coreGrad = beamCtx.createLinearGradient(0, 0, 32, 0);
      coreGrad.addColorStop(0, 'rgba(255,255,255,0)');
      coreGrad.addColorStop(0.35, 'rgba(255,255,255,0)');
      coreGrad.addColorStop(0.5, 'rgba(255,255,255,0.9)');
      coreGrad.addColorStop(0.65, 'rgba(255,255,255,0)');
      coreGrad.addColorStop(1, 'rgba(255,255,255,0)');
      beamCtx.globalCompositeOperation = 'lighter';
      beamCtx.fillStyle = coreGrad;
      beamCtx.fillRect(0, 0, 32, 256);
      const beamTexture = new THREE.CanvasTexture(beamCanvas);

      // === ENERGY SPIKE SPRITES (Resonanzsprung / Divergenz) ===
      const spikeMeshes: THREE_TYPES.Mesh[] = [];
      const spikeGroup = new THREE.Group();
      ringGroup.add(spikeGroup);
      for (let i = 0; i < 12; i++) {
        const spikeGeo = new THREE.PlaneGeometry(0.12, 1.2);
        const spikeMat = new THREE.MeshBasicMaterial({
          map: beamTexture, color: 0xff4a3a, transparent: true, opacity: 0,
          blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false,
        });
        const spike = new THREE.Mesh(spikeGeo, spikeMat);
        spike.visible = false;
        spikeGroup.add(spike);
        spikeMeshes.push(spike);
        // Add a perpendicular cross-plane for volumetric look
        const crossGeo = new THREE.PlaneGeometry(0.12, 1.2);
        const crossMat = new THREE.MeshBasicMaterial({
          map: beamTexture, color: 0xff4a3a, transparent: true, opacity: 0,
          blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false,
        });
        const cross = new THREE.Mesh(crossGeo, crossMat);
        cross.rotation.y = Math.PI / 2;
        spike.add(cross);
      }

      // === ENERGY ARC BEAM (Spannungsachse) ===
      // Core beam + outer glow halo
      const beamGeo = new THREE.PlaneGeometry(0.06, RADIUS * 2.2);
      const beamMat = new THREE.MeshBasicMaterial({
        map: beamTexture, color: 0xc850ff, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false,
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.visible = false;
      ringGroup.add(beam);
      // Wide outer glow
      const beamGlowGeo = new THREE.PlaneGeometry(0.35, RADIUS * 2.2);
      const beamGlowMat = new THREE.MeshBasicMaterial({
        map: beamTexture, color: 0xc850ff, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false,
      });
      const beamGlow = new THREE.Mesh(beamGlowGeo, beamGlowMat);
      beam.add(beamGlow);
      // Cross plane
      const beamCrossGeo = new THREE.PlaneGeometry(0.06, RADIUS * 2.2);
      const beamCrossMat = new THREE.MeshBasicMaterial({
        map: beamTexture, color: 0xc850ff, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false,
      });
      const beamCross = new THREE.Mesh(beamCrossGeo, beamCrossMat);
      beamCross.rotation.y = Math.PI / 2;
      beam.add(beamCross);

      // === PULSE ENERGY RINGS (Mond-Event) ===
      const pulseRings: THREE_TYPES.Mesh[] = [];
      for (let i = 0; i < 3; i++) {
        const pulseGeo = new THREE.TorusGeometry(RADIUS, 0.035, 16, 128);
        const pulseMat = new THREE.MeshBasicMaterial({
          color: 0xb4c8ff, transparent: true, opacity: 0,
          blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false,
        });
        const pr = new THREE.Mesh(pulseGeo, pulseMat);
        pr.visible = false;
        ringGroup.add(pr);
        pulseRings.push(pr);
      }

      // === KORONA ENERGY STRANDS (particle streams) ===
      const koronaStrands: THREE_TYPES.Mesh[] = [];
      const koronaGroup = new THREE.Group();
      ringGroup.add(koronaGroup);
      for (let i = 0; i < 24; i++) {
        const strandGeo = new THREE.PlaneGeometry(0.06, 1.6);
        const strandMat = new THREE.MeshBasicMaterial({
          map: beamTexture, color: 0x3aff6a, transparent: true, opacity: 0,
          blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false,
        });
        const strand = new THREE.Mesh(strandGeo, strandMat);
        strand.visible = false;
        koronaGroup.add(strand);
        koronaStrands.push(strand);
        // Cross plane for volume
        const sCross = new THREE.Mesh(
          new THREE.PlaneGeometry(0.06, 1.6),
          new THREE.MeshBasicMaterial({
            map: beamTexture, color: 0x3aff6a, transparent: true, opacity: 0,
            blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false,
          })
        );
        sCross.rotation.y = Math.PI / 2;
        strand.add(sCross);
      }

      // === CASCADE ENERGY PARTICLES (Dominanzwechsel) ===
      const cascadeCount = 400;
      const cascadePositions = new Float32Array(cascadeCount * 3);
      const cascadeGeo = new THREE.BufferGeometry();
      cascadeGeo.setAttribute('position', new THREE.BufferAttribute(cascadePositions, 3));
      const cascadeMat = new THREE.PointsMaterial({
        color: 0xffc83a, size: 0.08, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
        map: glowTexture,
      });
      const cascadeParticles = new THREE.Points(cascadeGeo, cascadeMat);
      cascadeParticles.visible = false;
      ringGroup.add(cascadeParticles);

      // === SHOCKWAVE ENERGY RING (Divergenz / Burst) ===
      const shockGeo = new THREE.RingGeometry(RADIUS - 0.05, RADIUS + 0.25, 128);
      const shockMat = new THREE.MeshBasicMaterial({
        color: 0xff5040, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false,
      });
      const shockwave = new THREE.Mesh(shockGeo, shockMat);
      shockwave.visible = false;
      ringGroup.add(shockwave);
      // Inner glow ring
      const shockInnerGeo = new THREE.RingGeometry(RADIUS - 0.02, RADIUS + 0.08, 128);
      const shockInnerMat = new THREE.MeshBasicMaterial({
        color: 0xffffff, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false,
      });
      const shockInner = new THREE.Mesh(shockInnerGeo, shockInnerMat);
      shockwave.add(shockInner);

      // === MOUSE / TOUCH CONTROLS ===
      // Home position: top-down face view, fully zoomed out — see the full ring circle
      const HOME_ROT_X = 1.48;  // near 90° (π/2=1.57) — almost straight down, slight depth
      const HOME_ROT_Y = 0;     // centered, no horizontal rotation
      const HOME_ZOOM = 8.5;    // far out — entire ring visible with breathing room

      let targetRotY = HOME_ROT_Y;
      let targetRotX = HOME_ROT_X;
      let currentRotY = HOME_ROT_Y;
      let currentRotX = HOME_ROT_X;
      let zoom = HOME_ZOOM;
      let targetZoom = HOME_ZOOM;
      const mouse = { isDown: false, prevX: 0, prevY: 0, lastInteraction: 0 };

      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        targetZoom = Math.max(3, Math.min(10, targetZoom + e.deltaY * 0.005));
        mouse.lastInteraction = Date.now();
      };
      const onMouseDown = (e: MouseEvent) => {
        mouse.isDown = true; mouse.prevX = e.clientX; mouse.prevY = e.clientY;
        mouse.lastInteraction = Date.now();
      };
      const onMouseMove = (e: MouseEvent) => {
        if (mouse.isDown) {
          targetRotY += (e.clientX - mouse.prevX) * 0.005;
          targetRotX = Math.max(0.05, Math.min(1.55, targetRotX + (e.clientY - mouse.prevY) * 0.003));
          mouse.prevX = e.clientX; mouse.prevY = e.clientY;
          mouse.lastInteraction = Date.now();
        }
      };
      const onMouseUp = () => { mouse.isDown = false; };
      const onTouchStart = (e: TouchEvent) => {
        const t = e.touches?.[0];
        if (t) { mouse.isDown = true; mouse.prevX = t.clientX; mouse.prevY = t.clientY; mouse.lastInteraction = Date.now(); }
      };
      const onTouchMove = (e: TouchEvent) => {
        const t = e.touches?.[0];
        if (mouse.isDown && t) {
          targetRotY += (t.clientX - mouse.prevX) * 0.005;
          targetRotX = Math.max(0.05, Math.min(1.55, targetRotX + (t.clientY - mouse.prevY) * 0.003));
          mouse.prevX = t.clientX; mouse.prevY = t.clientY;
          mouse.lastInteraction = Date.now();
        }
      };
      const onTouchEnd = () => { mouse.isDown = false; };

      const el = renderer.domElement;
      el.addEventListener('wheel', onWheel, { passive: false });
      el.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      el.addEventListener('touchstart', onTouchStart, { passive: true });
      window.addEventListener('touchmove', onTouchMove, { passive: true });
      window.addEventListener('touchend', onTouchEnd);

      const onResize = () => {
        const rect = container.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        camera.aspect = rect.width / rect.height;
        camera.updateProjectionMatrix();
        renderer.setSize(rect.width, rect.height);
        ringMat.uniforms.uPixelRatio!.value = Math.min(window.devicePixelRatio, 1.5);
        coronaMat.uniforms.uPixelRatio!.value = Math.min(window.devicePixelRatio, 1.5);
      };
      const resizeObserver = new ResizeObserver(onResize);
      resizeObserver.observe(container);

      // === EFFECT PROCESSING ===
      let activeEffectStartTime = -1;

      // Track per-particle color injection for transit effects
      const ringColorInjection = new Float32Array(RING_PARTICLE_COUNT * 3);
      const coronaColorInjection = new Float32Array(CORONA_COUNT * 3);
      // Per-particle displacement targets (for smooth interpolation)
      const ringDisplacementTarget = new Float32Array(RING_PARTICLE_COUNT * 3);
      const ringDisplacementCurrent = new Float32Array(RING_PARTICLE_COUNT * 3);
      const coronaDisplacementTarget = new Float32Array(CORONA_COUNT * 3);
      const coronaDisplacementCurrent = new Float32Array(CORONA_COUNT * 3);

      /** Global intensity multiplier from EffectState.intensity (0–1). Applied to all effect amplitudes. */
      let effectIntensityMultiplier = 1.0;
      /** Active effect's primary sector (from EffectState.sector). Available to init/update functions. */
      let effectPrimarySector = 0;

      function processEffect(t: number, dt: number) {
        const eff = effectRef.current;
        if (!eff || !eff.type) {
          fadeOutEffects(dt);
          effectIntensityMultiplier = 1.0;
          return;
        }
        // Read intensity/sector from effect state (default 1.0 / 0 for legacy button triggers)
        effectIntensityMultiplier = eff.intensity ?? 1.0;
        effectPrimarySector = eff.sector ?? 0;
        if (eff.startTime !== activeEffectStartTime) {
          activeEffectStartTime = eff.startTime;
          initializeEffect(eff.type, t);
        }
        const progress = Math.min(1, (Date.now() - eff.startTime) / (eff.duration * 1000));
        if (progress >= 1) {
          effectRef.current = null;
          activeEffectStartTime = -1;
          return;
        }
        updateEffect(eff.type, progress, t);
      }

      function initializeEffect(type: EffectType, t: number) {
        hideAllEffects();
        // Trigger audio thunder peak
        if (type && audioRef.current) audioRef.current.triggerPeak(type);
        switch (type) {
          case 'resonanzsprung': initResonanzsprung(t); break;
          case 'dominanzwechsel': initDominanzwechsel(); break;
          case 'mond_event': initMondEvent(); break;
          case 'spannungsachse': initSpannungsachse(); break;
          case 'korona_eruption': initKoronaEruption(); break;
          case 'divergenz_spike': initDivergenzSpike(); break;
          case 'burst': initBurst(); break;
          case 'crunch': initCrunch(); break;
        }
      }

      // Helper: sync opacity to mesh + all children
      function setMeshTreeOpacity(mesh: THREE_TYPES.Object3D, opacity: number) {
        if ((mesh as any).material) (mesh as any).material.opacity = opacity;
        mesh.children.forEach(c => { if ((c as any).material) (c as any).material.opacity = opacity; });
      }

      function hideAllEffects() {
        spikeMeshes.forEach(s => { s.visible = false; setMeshTreeOpacity(s, 0); });
        beam.visible = false; setMeshTreeOpacity(beam, 0);
        pulseRings.forEach(p => { p.visible = false; (p.material as any).opacity = 0; });
        koronaStrands.forEach(s => { s.visible = false; setMeshTreeOpacity(s, 0); });
        cascadeParticles.visible = false; (cascadeMat as any).opacity = 0;
        shockwave.visible = false; setMeshTreeOpacity(shockwave, 0);
        effectLight1.intensity = 0;
        effectLight2.intensity = 0;
      }

      function fadeOutEffects(dt: number) {
        const fs = dt * 2;
        spikeMeshes.forEach(s => {
          if (s.visible) { const o = Math.max(0, (s.material as any).opacity - fs); setMeshTreeOpacity(s, o); if (o <= 0) s.visible = false; }
        });
        if (beam.visible) { const o = Math.max(0, (beamMat as any).opacity - fs); setMeshTreeOpacity(beam, o); if (o <= 0) beam.visible = false; }
        pulseRings.forEach(p => {
          if (p.visible) { (p.material as any).opacity = Math.max(0, (p.material as any).opacity - fs); if ((p.material as any).opacity <= 0) p.visible = false; }
        });
        koronaStrands.forEach(s => {
          if (s.visible) { const o = Math.max(0, (s.material as any).opacity - fs); setMeshTreeOpacity(s, o); if (o <= 0) s.visible = false; }
        });
        if (cascadeParticles.visible) { (cascadeMat as any).opacity = Math.max(0, (cascadeMat as any).opacity - fs); if ((cascadeMat as any).opacity <= 0) cascadeParticles.visible = false; }
        if (shockwave.visible) { const o = Math.max(0, (shockMat as any).opacity - fs); setMeshTreeOpacity(shockwave, o); if (o <= 0) shockwave.visible = false; }
        effectLight1.intensity = Math.max(0, effectLight1.intensity - fs * 2);
        effectLight2.intensity = Math.max(0, effectLight2.intensity - fs * 2);
        // Fade out color injection
        for (let i = 0; i < ringColorInjection.length; i++) {
          ringColorInjection[i] *= 0.93;
        }
        for (let i = 0; i < coronaColorInjection.length; i++) {
          coronaColorInjection[i] *= 0.93;
        }
        // Relax displacement targets toward zero
        for (let i = 0; i < ringDisplacementTarget.length; i++) {
          ringDisplacementTarget[i] *= 0.9;
        }
        for (let i = 0; i < coronaDisplacementTarget.length; i++) {
          coronaDisplacementTarget[i] *= 0.9;
        }
      }

      // === HELPER: angle diff with wrapping ===
      function angleDist(a: number, b: number): number {
        let d = Math.abs(a - b);
        if (d > Math.PI) d = Math.PI * 2 - d;
        return d;
      }

      // === PARTICLE DISPLACEMENT SYSTEM ===
      // Sets displacement targets per particle. The animation loop smoothly interpolates.

      /** Sector burst: particles near sectorAngle explode outward + upward */
      function displaceSectorBurst(t: number, sectorIdx: number, amplitude: number, spread: number, upward: number) {
        // Scale amplitude by global effect intensity multiplier
        amplitude *= effectIntensityMultiplier;
        const sectorAngle = nodeAngles[sectorIdx] ?? 0;
        const nSector = sectorAngle < 0 ? sectorAngle + Math.PI * 2 : sectorAngle;

        for (let i = 0; i < RING_PARTICLE_COUNT; i++) {
          const bx = ringBasePositions[i * 3] ?? 0;
          const by = ringBasePositions[i * 3 + 1] ?? 0;
          const bz = ringBasePositions[i * 3 + 2] ?? 0;
          const angle = Math.atan2(bz, bx);
          const na = angle < 0 ? angle + Math.PI * 2 : angle;
          const diff = angleDist(na, nSector);

          if (diff < spread) {
            const strength = Math.cos(diff * Math.PI / (spread * 2)) * amplitude;
            const dist = Math.sqrt(bx * bx + bz * bz);
            const dirX = dist > 0.01 ? bx / dist : 0;
            const dirZ = dist > 0.01 ? bz / dist : 0;
            const tremor = Math.sin(t * 18 + i * 0.03) * 0.3 + Math.sin(t * 31 + i * 0.07) * 0.15;
            ringDisplacementTarget[i * 3] = dirX * strength * (1 + tremor);
            ringDisplacementTarget[i * 3 + 1] = strength * upward * (0.8 + Math.sin(t * 12 + i * 0.02) * 0.4);
            ringDisplacementTarget[i * 3 + 2] = dirZ * strength * (1 + tremor);
          }
        }

        // Corona particles too
        for (let i = 0; i < CORONA_COUNT; i++) {
          const bx = coronaBasePositions[i * 3] ?? 0;
          const by = coronaBasePositions[i * 3 + 1] ?? 0;
          const bz = coronaBasePositions[i * 3 + 2] ?? 0;
          const angle = Math.atan2(bz, bx);
          const na = angle < 0 ? angle + Math.PI * 2 : angle;
          const diff = angleDist(na, nSector);

          if (diff < spread) {
            const strength = Math.cos(diff * Math.PI / (spread * 2)) * amplitude * 1.8;
            const dist = Math.sqrt(bx * bx + bz * bz);
            const dirX = dist > 0.01 ? bx / dist : 0;
            const dirZ = dist > 0.01 ? bz / dist : 0;
            coronaDisplacementTarget[i * 3] = dirX * strength;
            coronaDisplacementTarget[i * 3 + 1] = strength * upward * 1.5;
            coronaDisplacementTarget[i * 3 + 2] = dirZ * strength;
          }
        }
      }

      /** Global wave: all particles pulse outward in a radial wave pattern */
      function displaceGlobalWave(t: number, amplitude: number, waveFreq: number, speed: number) {
        for (let i = 0; i < RING_PARTICLE_COUNT; i++) {
          const bx = ringBasePositions[i * 3] ?? 0;
          const by = ringBasePositions[i * 3 + 1] ?? 0;
          const bz = ringBasePositions[i * 3 + 2] ?? 0;
          const angle = Math.atan2(bz, bx);
          const na = angle < 0 ? angle + Math.PI * 2 : angle;
          const dist = Math.sqrt(bx * bx + bz * bz);
          const dirX = dist > 0.01 ? bx / dist : 0;
          const dirZ = dist > 0.01 ? bz / dist : 0;

          const wave = Math.sin(na * waveFreq + t * speed) * amplitude;
          const microWave = Math.sin(na * 11 + t * speed * 1.7) * amplitude * 0.2;
          ringDisplacementTarget[i * 3] = dirX * (wave + microWave);
          ringDisplacementTarget[i * 3 + 1] = by * (wave + microWave) * 0.5;
          ringDisplacementTarget[i * 3 + 2] = dirZ * (wave + microWave);
        }

        for (let i = 0; i < CORONA_COUNT; i++) {
          const bx = coronaBasePositions[i * 3] ?? 0;
          const by = coronaBasePositions[i * 3 + 1] ?? 0;
          const bz = coronaBasePositions[i * 3 + 2] ?? 0;
          const angle = Math.atan2(bz, bx);
          const na = angle < 0 ? angle + Math.PI * 2 : angle;
          const dist = Math.sqrt(bx * bx + bz * bz);
          const dirX = dist > 0.01 ? bx / dist : 0;
          const dirZ = dist > 0.01 ? bz / dist : 0;

          const wave = Math.sin(na * waveFreq + t * speed) * amplitude * 2.0;
          coronaDisplacementTarget[i * 3] = dirX * wave;
          coronaDisplacementTarget[i * 3 + 1] = wave * 0.8;
          coronaDisplacementTarget[i * 3 + 2] = dirZ * wave;
        }
      }

      /** Axis tension: particles oscillate along a line between two nodes */
      function displaceAxisTension(t: number, sectorA: number, sectorB: number, amplitude: number) {
        const angleA = nodeAngles[sectorA] ?? 0;
        const angleB = nodeAngles[sectorB] ?? 0;
        const naA = angleA < 0 ? angleA + Math.PI * 2 : angleA;
        const naB = angleB < 0 ? angleB + Math.PI * 2 : angleB;

        // Axis direction from A to B on the ring
        const axX = Math.cos(angleB) - Math.cos(angleA);
        const axZ = Math.sin(angleB) - Math.sin(angleA);
        const axLen = Math.sqrt(axX * axX + axZ * axZ);
        const nAxX = axLen > 0.01 ? axX / axLen : 1;
        const nAxZ = axLen > 0.01 ? axZ / axLen : 0;

        for (let i = 0; i < RING_PARTICLE_COUNT; i++) {
          const bx = ringBasePositions[i * 3] ?? 0;
          const by = ringBasePositions[i * 3 + 1] ?? 0;
          const bz = ringBasePositions[i * 3 + 2] ?? 0;
          const angle = Math.atan2(bz, bx);
          const na = angle < 0 ? angle + Math.PI * 2 : angle;

          const distA = angleDist(na, naA);
          const distB = angleDist(na, naB);
          const nearAxis = Math.min(distA, distB);
          const influence = nearAxis < 1.0 ? Math.cos(nearAxis * Math.PI / 2.0) : 0;

          if (influence > 0.01) {
            // Push along axis with rapid oscillation
            const osc = Math.sin(t * 22 + na * 5) * amplitude * influence;
            const vibrate = Math.sin(t * 40 + i * 0.1) * amplitude * 0.15 * influence;
            ringDisplacementTarget[i * 3] = nAxX * osc + vibrate;
            ringDisplacementTarget[i * 3 + 1] = Math.sin(t * 15 + i * 0.05) * amplitude * 0.2 * influence;
            ringDisplacementTarget[i * 3 + 2] = nAxZ * osc + vibrate;
          }
        }

        for (let i = 0; i < CORONA_COUNT; i++) {
          const bx = coronaBasePositions[i * 3] ?? 0;
          const bz = coronaBasePositions[i * 3 + 2] ?? 0;
          const angle = Math.atan2(bz, bx);
          const na = angle < 0 ? angle + Math.PI * 2 : angle;
          const distA = angleDist(na, naA);
          const distB = angleDist(na, naB);
          const nearAxis = Math.min(distA, distB);
          const influence = nearAxis < 1.0 ? Math.cos(nearAxis * Math.PI / 2.0) : 0;
          if (influence > 0.01) {
            const osc = Math.sin(t * 22 + na * 5) * amplitude * influence * 1.5;
            coronaDisplacementTarget[i * 3] = nAxX * osc;
            coronaDisplacementTarget[i * 3 + 1] = Math.sin(t * 18 + i * 0.1) * amplitude * 0.4 * influence;
            coronaDisplacementTarget[i * 3 + 2] = nAxZ * osc;
          }
        }
      }

      /** Eruption: particles at soul-profile peaks shoot upward */
      function displaceEruption(t: number, amplitude: number) {
        for (let i = 0; i < RING_PARTICLE_COUNT; i++) {
          const bx = ringBasePositions[i * 3] ?? 0;
          const by = ringBasePositions[i * 3 + 1] ?? 0;
          const bz = ringBasePositions[i * 3 + 2] ?? 0;
          const angle = Math.atan2(bz, bx);
          const na = angle < 0 ? angle + Math.PI * 2 : angle;
          const soulVal = soulNoise(na, 1.0);
          const dist = Math.sqrt(bx * bx + bz * bz);
          const dirX = dist > 0.01 ? bx / dist : 0;
          const dirZ = dist > 0.01 ? bz / dist : 0;

          // Only peaks erupt strongly, valleys stay calm
          const peakFactor = Math.max(0, (soulVal - 0.4) / 0.6);
          const eruptionStrength = peakFactor * amplitude;
          const timeWave = Math.sin(t * 6 + na * 3) * 0.5 + 0.5;

          ringDisplacementTarget[i * 3] = dirX * eruptionStrength * timeWave * 0.6;
          ringDisplacementTarget[i * 3 + 1] = eruptionStrength * timeWave * 1.2 + Math.sin(t * 10 + i * 0.01) * eruptionStrength * 0.3;
          ringDisplacementTarget[i * 3 + 2] = dirZ * eruptionStrength * timeWave * 0.6;
        }

        for (let i = 0; i < CORONA_COUNT; i++) {
          const bx = coronaBasePositions[i * 3] ?? 0;
          const by = coronaBasePositions[i * 3 + 1] ?? 0;
          const bz = coronaBasePositions[i * 3 + 2] ?? 0;
          const angle = Math.atan2(bz, bx);
          const na = angle < 0 ? angle + Math.PI * 2 : angle;
          const soulVal = soulNoise(na, 1.0);
          const dist = Math.sqrt(bx * bx + bz * bz);
          const dirX = dist > 0.01 ? bx / dist : 0;
          const dirZ = dist > 0.01 ? bz / dist : 0;

          const peakFactor = Math.max(0, (soulVal - 0.35) / 0.65);
          const eruptionStrength = peakFactor * amplitude * 2.5;
          const timeWave = Math.sin(t * 5 + na * 2 + i * 0.02) * 0.5 + 0.5;

          coronaDisplacementTarget[i * 3] = dirX * eruptionStrength * timeWave * 0.5;
          coronaDisplacementTarget[i * 3 + 1] = eruptionStrength * timeWave * 1.8;
          coronaDisplacementTarget[i * 3 + 2] = dirZ * eruptionStrength * timeWave * 0.5;
        }
      }

      /** Divergence explosion: all particles blast outward violently with trembling */
      function displaceDivergence(t: number, amplitude: number, trembleAmount: number) {
        for (let i = 0; i < RING_PARTICLE_COUNT; i++) {
          const bx = ringBasePositions[i * 3] ?? 0;
          const by = ringBasePositions[i * 3 + 1] ?? 0;
          const bz = ringBasePositions[i * 3 + 2] ?? 0;
          const dist = Math.sqrt(bx * bx + bz * bz);
          const dirX = dist > 0.01 ? bx / dist : 0;
          const dirZ = dist > 0.01 ? bz / dist : 0;

          const explode = amplitude * (0.7 + hash(i * 13) * 0.6);
          const tremble = trembleAmount * (Math.sin(t * 35 + i * 0.15) * 0.5 + Math.sin(t * 53 + i * 0.23) * 0.3 + Math.sin(t * 71 + i * 0.31) * 0.2);

          ringDisplacementTarget[i * 3] = dirX * explode + tremble;
          ringDisplacementTarget[i * 3 + 1] = by * explode * 0.8 + Math.sin(t * 40 + i * 0.09) * trembleAmount * 0.5;
          ringDisplacementTarget[i * 3 + 2] = dirZ * explode + Math.sin(t * 37 + i * 0.13) * tremble;
        }

        for (let i = 0; i < CORONA_COUNT; i++) {
          const bx = coronaBasePositions[i * 3] ?? 0;
          const by = coronaBasePositions[i * 3 + 1] ?? 0;
          const bz = coronaBasePositions[i * 3 + 2] ?? 0;
          const dist = Math.sqrt(bx * bx + bz * bz);
          const dirX = dist > 0.01 ? bx / dist : 0;
          const dirZ = dist > 0.01 ? bz / dist : 0;

          const explode = amplitude * 2.0 * (0.5 + hash(i * 17 + 50000) * 1.0);
          const tremble = trembleAmount * 1.5 * Math.sin(t * 30 + i * 0.2);

          coronaDisplacementTarget[i * 3] = dirX * explode + tremble;
          coronaDisplacementTarget[i * 3 + 1] = explode * 1.2 + Math.sin(t * 25 + i * 0.15) * trembleAmount;
          coronaDisplacementTarget[i * 3 + 2] = dirZ * explode + Math.sin(t * 28 + i * 0.18) * tremble;
        }
      }

      /** Flow: particles stream from one sector to another in an arc */
      function displaceFlow(t: number, fromIdx: number, toIdx: number, progress: number, amplitude: number) {
        const fromAngle = nodeAngles[fromIdx] ?? 0;
        const toAngle = nodeAngles[toIdx] ?? 0;
        const naFrom = fromAngle < 0 ? fromAngle + Math.PI * 2 : fromAngle;
        const naTo = toAngle < 0 ? toAngle + Math.PI * 2 : toAngle;

        for (let i = 0; i < RING_PARTICLE_COUNT; i++) {
          const bx = ringBasePositions[i * 3] ?? 0;
          const by = ringBasePositions[i * 3 + 1] ?? 0;
          const bz = ringBasePositions[i * 3 + 2] ?? 0;
          const angle = Math.atan2(bz, bx);
          const na = angle < 0 ? angle + Math.PI * 2 : angle;

          const distFrom = angleDist(na, naFrom);
          const distTo = angleDist(na, naTo);

          // Particles near source get pushed toward target
          if (distFrom < 1.2) {
            const influence = Math.cos(distFrom * Math.PI / 2.4);
            // Flow direction: tangential along ring toward target
            const flowPhase = progress * 2 + distFrom * 0.5;
            const tangent = Math.sin(flowPhase * Math.PI);
            const lift = Math.sin(flowPhase * Math.PI) * amplitude * 0.8 * influence;
            const tangentialX = -Math.sin(angle);
            const tangentialZ = Math.cos(angle);
            const sign = angleDist(na + 0.1, naTo) < angleDist(na - 0.1, naTo) ? 1 : -1;

            ringDisplacementTarget[i * 3] = tangentialX * sign * tangent * amplitude * influence * 0.4;
            ringDisplacementTarget[i * 3 + 1] = lift;
            ringDisplacementTarget[i * 3 + 2] = tangentialZ * sign * tangent * amplitude * influence * 0.4;
          }
          // Particles near target swell outward
          if (distTo < 0.8) {
            const influence = Math.cos(distTo * Math.PI / 1.6) * progress;
            const dist2 = Math.sqrt(bx * bx + bz * bz);
            const dirX = dist2 > 0.01 ? bx / dist2 : 0;
            const dirZ = dist2 > 0.01 ? bz / dist2 : 0;
            ringDisplacementTarget[i * 3] += dirX * amplitude * influence * 0.3;
            ringDisplacementTarget[i * 3 + 1] += Math.sin(t * 8 + i * 0.02) * amplitude * influence * 0.2;
            ringDisplacementTarget[i * 3 + 2] += dirZ * amplitude * influence * 0.3;
          }
        }

        // Corona particles also flow
        for (let i = 0; i < CORONA_COUNT; i++) {
          const bx = coronaBasePositions[i * 3] ?? 0;
          const bz = coronaBasePositions[i * 3 + 2] ?? 0;
          const angle = Math.atan2(bz, bx);
          const na = angle < 0 ? angle + Math.PI * 2 : angle;
          const distFrom = angleDist(na, naFrom);
          if (distFrom < 1.0) {
            const influence = Math.cos(distFrom * Math.PI / 2.0);
            coronaDisplacementTarget[i * 3 + 1] = Math.sin(progress * Math.PI) * amplitude * influence * 1.2;
          }
        }
      }

      // Smooth interpolation of displacement in animation loop
      function applyDisplacements(lerpSpeed: number) {
        const ringPos = ringGeo.getAttribute('position') as THREE_TYPES.BufferAttribute;
        for (let i = 0; i < RING_PARTICLE_COUNT; i++) {
          const i3 = i * 3;
          ringDisplacementCurrent[i3] += (ringDisplacementTarget[i3] - ringDisplacementCurrent[i3]) * lerpSpeed;
          ringDisplacementCurrent[i3 + 1] += (ringDisplacementTarget[i3 + 1] - ringDisplacementCurrent[i3 + 1]) * lerpSpeed;
          ringDisplacementCurrent[i3 + 2] += (ringDisplacementTarget[i3 + 2] - ringDisplacementCurrent[i3 + 2]) * lerpSpeed;

          ringPos.setXYZ(i,
            (ringBasePositions[i3] ?? 0) + ringDisplacementCurrent[i3],
            (ringBasePositions[i3 + 1] ?? 0) + ringDisplacementCurrent[i3 + 1],
            (ringBasePositions[i3 + 2] ?? 0) + ringDisplacementCurrent[i3 + 2]
          );
        }
        ringPos.needsUpdate = true;

        const coronaPos = coronaGeo.getAttribute('position') as THREE_TYPES.BufferAttribute;
        for (let i = 0; i < CORONA_COUNT; i++) {
          const i3 = i * 3;
          coronaDisplacementCurrent[i3] += (coronaDisplacementTarget[i3] - coronaDisplacementCurrent[i3]) * lerpSpeed;
          coronaDisplacementCurrent[i3 + 1] += (coronaDisplacementTarget[i3 + 1] - coronaDisplacementCurrent[i3 + 1]) * lerpSpeed;
          coronaDisplacementCurrent[i3 + 2] += (coronaDisplacementTarget[i3 + 2] - coronaDisplacementCurrent[i3 + 2]) * lerpSpeed;

          coronaPos.setXYZ(i,
            (coronaBasePositions[i3] ?? 0) + coronaDisplacementCurrent[i3],
            (coronaBasePositions[i3 + 1] ?? 0) + coronaDisplacementCurrent[i3 + 1],
            (coronaBasePositions[i3 + 2] ?? 0) + coronaDisplacementCurrent[i3 + 2]
          );
        }
        coronaPos.needsUpdate = true;
      }

      function injectColor(sectorIdx: number, color: THREE_TYPES.Color, intensity: number) {
        // Scale intensity by global effect multiplier
        intensity *= effectIntensityMultiplier;
        for (let i = 0; i < RING_PARTICLE_COUNT; i++) {
          const bx = ringBasePositions[i * 3] ?? 0;
          const bz = ringBasePositions[i * 3 + 2] ?? 0;
          const angle = Math.atan2(bz, bx);
          const na = angle < 0 ? angle + Math.PI * 2 : angle;

          let factor = 0;
          if (sectorIdx >= 0) {
            const sectorAngle = nodeAngles[sectorIdx] ?? 0;
            const ns = sectorAngle < 0 ? sectorAngle + Math.PI * 2 : sectorAngle;
            const diff = angleDist(na, ns);
            if (diff < 0.8) factor = Math.cos(diff * Math.PI / 1.6) * intensity;
          } else {
            factor = intensity * 0.5;
          }

          if (factor > 0.01) {
            ringColorInjection[i * 3] = Math.max(ringColorInjection[i * 3] ?? 0, color.r * factor);
            ringColorInjection[i * 3 + 1] = Math.max(ringColorInjection[i * 3 + 1] ?? 0, color.g * factor);
            ringColorInjection[i * 3 + 2] = Math.max(ringColorInjection[i * 3 + 2] ?? 0, color.b * factor);
          }
        }

        // Also inject into corona
        for (let i = 0; i < CORONA_COUNT; i++) {
          const bx = coronaBasePositions[i * 3] ?? 0;
          const bz = coronaBasePositions[i * 3 + 2] ?? 0;
          const angle = Math.atan2(bz, bx);
          const na = angle < 0 ? angle + Math.PI * 2 : angle;

          let factor = 0;
          if (sectorIdx >= 0) {
            const sectorAngle = nodeAngles[sectorIdx] ?? 0;
            const ns = sectorAngle < 0 ? sectorAngle + Math.PI * 2 : sectorAngle;
            const diff = angleDist(na, ns);
            if (diff < 0.8) factor = Math.cos(diff * Math.PI / 1.6) * intensity;
          } else {
            factor = intensity * 0.5;
          }
          if (factor > 0.01) {
            coronaColorInjection[i * 3] = Math.max(coronaColorInjection[i * 3] ?? 0, color.r * factor);
            coronaColorInjection[i * 3 + 1] = Math.max(coronaColorInjection[i * 3 + 1] ?? 0, color.g * factor);
            coronaColorInjection[i * 3 + 2] = Math.max(coronaColorInjection[i * 3 + 2] ?? 0, color.b * factor);
          }
        }
      }

      // Apply color injection to ring + corona particles
      function applyColorInjection() {
        const ringColorAttr = ringGeo.getAttribute('color') as THREE_TYPES.BufferAttribute;
        for (let i = 0; i < RING_PARTICLE_COUNT; i++) {
          const i3 = i * 3;
          ringColorAttr.setXYZ(i,
            Math.min(1, (ringColors[i3] ?? 0) + (ringColorInjection[i3] ?? 0)),
            Math.min(1, (ringColors[i3 + 1] ?? 0) + (ringColorInjection[i3 + 1] ?? 0)),
            Math.min(1, (ringColors[i3 + 2] ?? 0) + (ringColorInjection[i3 + 2] ?? 0))
          );
        }
        ringColorAttr.needsUpdate = true;

        const coronaColorAttr = coronaGeo.getAttribute('color') as THREE_TYPES.BufferAttribute;
        for (let i = 0; i < CORONA_COUNT; i++) {
          const i3 = i * 3;
          coronaColorAttr.setXYZ(i,
            Math.min(1, (coronaColors[i3] ?? 0) + (coronaColorInjection[i3] ?? 0)),
            Math.min(1, (coronaColors[i3 + 1] ?? 0) + (coronaColorInjection[i3 + 1] ?? 0)),
            Math.min(1, (coronaColors[i3 + 2] ?? 0) + (coronaColorInjection[i3 + 2] ?? 0))
          );
        }
        coronaColorAttr.needsUpdate = true;
      }

      // --- RESONANZSPRUNG ---
      let resonanzSector = 0;
      function initResonanzsprung(t: number) {
        resonanzSector = Math.floor(t * 100) % 5;
        const angle = nodeAngles[resonanzSector] ?? 0;
        const color = new THREE.Color(ELEMENTS[resonanzSector]?.glow ?? 0xff4a3a);
        for (let i = 0; i < 3; i++) {
          const spike = spikeMeshes[i];
          if (!spike) continue;
          const offsetAngle = angle + (i - 1) * 0.15;
          spike.position.set(Math.cos(offsetAngle) * RADIUS, 0, Math.sin(offsetAngle) * RADIUS);
          spike.lookAt(Math.cos(offsetAngle) * (RADIUS + 1), 0.5, Math.sin(offsetAngle) * (RADIUS + 1));
          spike.rotateX(-Math.PI / 2);
          (spike.material as any).color = color;
          spike.visible = true;
          spike.scale.set(1, 0, 1);
        }
        effectLight1.color = color;
        effectLight1.position.set(Math.cos(angle) * RADIUS, 0.5, Math.sin(angle) * RADIUS);
      }

      function updateResonanzsprung(progress: number, t: number) {
        const ease = progress < 0.3 ? progress / 0.3 : progress < 0.7 ? 1 : 1 - (progress - 0.7) / 0.3;
        for (let i = 0; i < 3; i++) {
          const spike = spikeMeshes[i];
          if (!spike?.visible) continue;
          spike.scale.set(1 + ease * 0.5, Math.pow(ease, 0.5) * (1.2 + Math.sin(t * 15 + i) * 0.3), 1 + ease * 0.5);
          setMeshTreeOpacity(spike, ease * 0.8);
        }
        effectLight1.intensity = ease * 5;
        ringGroup.position.x = Math.sin(t * 25) * ease * 0.015;
        ringGroup.position.z = Math.cos(t * 30) * ease * 0.01;
        // Sector burst: particles explode outward at affected sector
        displaceSectorBurst(t, resonanzSector, ease * 0.35, 0.8, 0.6);
        const sectorColor = new THREE.Color(ELEMENTS[resonanzSector]?.glow ?? 0xff4a3a);
        injectColor(resonanzSector, sectorColor, ease * 0.6);
      }

      // --- DOMINANZWECHSEL ---
      let domFrom = 0, domTo = 0;
      function initDominanzwechsel() {
        domFrom = Math.floor(Date.now() / 1000) % 5;
        domTo = (domFrom + 1 + Math.floor(Date.now() / 100) % 3) % 5;
        cascadeParticles.visible = true;
        const pos = cascadeGeo.getAttribute('position') as THREE_TYPES.BufferAttribute;
        for (let i = 0; i < cascadeCount; i++) {
          const fromAngle = nodeAngles[domFrom] ?? 0;
          const r = RADIUS + ((i * 7) % 11) / 11 * 0.3 - 0.15;
          pos.setXYZ(i, Math.cos(fromAngle) * r, ((i * 3) % 7) / 7 * 0.2 - 0.1, Math.sin(fromAngle) * r);
        }
        pos.needsUpdate = true;
        effectLight1.color.set(ELEMENTS[domFrom]?.glow ?? 0xffc83a);
        effectLight2.color.set(ELEMENTS[domTo]?.glow ?? 0x3aff6a);
      }

      function updateDominanzwechsel(progress: number, t: number) {
        const fromAngle = nodeAngles[domFrom] ?? 0;
        const toAngle = nodeAngles[domTo] ?? 0;
        const ease = Math.sin(progress * Math.PI);
        const pos = cascadeGeo.getAttribute('position') as THREE_TYPES.BufferAttribute;
        for (let i = 0; i < cascadeCount; i++) {
          const pp = Math.min(1, Math.max(0, (progress * 1.5 - (i / cascadeCount) * 0.5)));
          const angle = fromAngle + (toAngle - fromAngle) * pp;
          const r = RADIUS + Math.sin(pp * Math.PI) * 0.4 + Math.sin(t * 10 + i) * 0.05;
          const y = Math.sin(pp * Math.PI) * 0.5 + Math.sin(t * 8 + i * 0.1) * 0.05;
          pos.setXYZ(i, Math.cos(angle) * r, y, Math.sin(angle) * r);
        }
        pos.needsUpdate = true;
        (cascadeMat as any).opacity = ease * 0.9;
        cascadeMat.size = 0.08 + ease * 0.05;
        effectLight1.position.set(Math.cos(fromAngle) * RADIUS, 0.3, Math.sin(fromAngle) * RADIUS);
        effectLight1.intensity = (1 - progress) * 3;
        effectLight2.position.set(Math.cos(toAngle) * RADIUS, 0.3, Math.sin(toAngle) * RADIUS);
        effectLight2.intensity = progress * 4;
        // Particle flow from source to target
        displaceFlow(t, domFrom, domTo, progress, ease * 0.3);
        // Color flow: from source to target
        const fromColor = new THREE.Color(ELEMENTS[domFrom]?.glow ?? 0xffc83a);
        const toColor = new THREE.Color(ELEMENTS[domTo]?.glow ?? 0x3aff6a);
        injectColor(domFrom, fromColor, (1 - progress) * 0.4);
        injectColor(domTo, toColor, progress * 0.5);
      }

      // --- MOND-EVENT ---
      function initMondEvent() {
        pulseRings.forEach(p => { p.visible = true; p.scale.set(0.3, 0.3, 0.3); (p.material as any).color.set(0xb4c8ff); });
        effectLight1.color.set(0xb4c8ff);
        effectLight2.color.set(0x8090d0);
      }

      function updateMondEvent(progress: number, t: number) {
        const ease = Math.sin(progress * Math.PI);
        pulseRings.forEach((p, i) => {
          const delay = i * 0.15;
          const lp = Math.max(0, Math.min(1, (progress - delay) / (1 - delay)));
          const s = 0.5 + lp * 1.0;
          p.scale.set(s, s, s);
          (p.material as any).opacity = Math.sin(lp * Math.PI) * 0.6;
          p.rotation.x = Math.PI / 2 + Math.sin(t * 2 + i) * 0.1;
          p.rotation.z = t * 0.5 + i * 0.5;
        });
        effectLight1.position.set(0, 1, 0);
        effectLight1.intensity = ease * 4;
        effectLight2.position.set(0, -1, 0);
        effectLight2.intensity = ease * 2;
        ringGroup.position.y = Math.sin(t * 0.3) * 0.03 + Math.sin(t * 1.5) * ease * 0.05;
        // Gentle breathing wave across all particles
        displaceGlobalWave(t, ease * 0.12, 3, 1.5);
        // Lunar silver glow on particles
        const lunarColor = new THREE.Color(0xb4c8ff);
        injectColor(-1, lunarColor, ease * 0.2);
        coronaMat.uniforms.uGlowIntensity!.value = 1.0 + ease * 2.0;
      }

      // --- SPANNUNGSACHSE ---
      let tensionA = 0, tensionB = 0;
      function initSpannungsachse() {
        tensionA = Math.floor(Date.now() / 1000) % 5;
        tensionB = (tensionA + 2 + Math.floor(Date.now() / 100) % 2) % 5;
        beam.visible = true;
        const aAngle = nodeAngles[tensionA] ?? 0;
        const bAngle = nodeAngles[tensionB] ?? 0;
        const ax = Math.cos(aAngle) * RADIUS, az = Math.sin(aAngle) * RADIUS;
        const bx = Math.cos(bAngle) * RADIUS, bz = Math.sin(bAngle) * RADIUS;
        beam.position.set((ax + bx) / 2, 0, (az + bz) / 2);
        beam.scale.set(1, Math.sqrt((bx - ax) ** 2 + (bz - az) ** 2) / (RADIUS * 2), 1);
        beam.lookAt(bx, 0, bz);
        beam.rotateX(Math.PI / 2);
        effectLight1.color.set(ELEMENTS[tensionA]?.glow ?? 0xc850ff);
        effectLight2.color.set(ELEMENTS[tensionB]?.glow ?? 0xff5040);
      }

      function updateSpannungsachse(progress: number, t: number) {
        const ease = Math.sin(progress * Math.PI);
        const flicker = 1 + Math.sin(t * 20) * 0.2;
        const beamOpacity = ease * 0.5 * flicker;
        setMeshTreeOpacity(beam, beamOpacity);
        (beamMat as any).color.setHex(progress < 0.5 ? 0xc850ff : 0xff5040);
        const aAngle = nodeAngles[tensionA] ?? 0;
        const bAngle = nodeAngles[tensionB] ?? 0;
        effectLight1.position.set(Math.cos(aAngle) * RADIUS, 0.3, Math.sin(aAngle) * RADIUS);
        effectLight1.intensity = ease * 4 * flicker;
        effectLight2.position.set(Math.cos(bAngle) * RADIUS, 0.3, Math.sin(bAngle) * RADIUS);
        effectLight2.intensity = ease * 4 * flicker;
        ringGroup.position.x = Math.sin(t * 18) * ease * 0.008;
        // Axis tension: particles vibrate between the two nodes
        displaceAxisTension(t, tensionA, tensionB, ease * 0.2);
        // Color tension nodes
        const colA = new THREE.Color(ELEMENTS[tensionA]?.glow ?? 0xc850ff);
        const colB = new THREE.Color(ELEMENTS[tensionB]?.glow ?? 0xff5040);
        injectColor(tensionA, colA, ease * 0.5);
        injectColor(tensionB, colB, ease * 0.5);
      }

      // --- KORONA-ERUPTION ---
      function initKoronaEruption() {
        koronaStrands.forEach((strand, i) => {
          strand.visible = true;
          const angle = (i / 24) * Math.PI * 2 + i * 0.1;
          strand.position.set(Math.cos(angle) * RADIUS, 0, Math.sin(angle) * RADIUS);
          strand.lookAt(Math.cos(angle) * (RADIUS + 2), Math.sin(i * 0.5) * 0.5, Math.sin(angle) * (RADIUS + 2));
          strand.rotateX(-Math.PI / 2);
          strand.scale.set(1, 0, 1);
          (strand.material as any).color.set(ELEMENTS[i % 5]?.glow ?? 0x3aff6a);
        });
        effectLight1.color.set(0x3aff6a);
        effectLight2.color.set(0x2aff5a);
      }

      function updateKoronaEruption(progress: number, t: number) {
        const ease = Math.sin(progress * Math.PI);
        koronaStrands.forEach((strand, i) => {
          const delay = (i / 24) * 0.3;
          const lp = Math.max(0, Math.min(1, (progress - delay) / (1 - delay)));
          const le = Math.sin(lp * Math.PI);
          strand.scale.set(1 + le * 0.5, le * (0.8 + Math.sin(t * 6 + i) * 0.3), 1 + le * 0.5);
          setMeshTreeOpacity(strand, le * 0.7);
        });
        effectLight1.position.set(0, 1.5, 0);
        effectLight1.intensity = ease * 3;
        effectLight2.position.set(0, -0.5, 0);
        effectLight2.intensity = ease * 2;
        // Eruption: particles at soul-peaks shoot upward
        displaceEruption(t, ease * 0.4);
        coronaMat.uniforms.uGlowIntensity!.value = 1.0 + ease * 3.0;
        // All element colors inject
        ELEMENTS.forEach((el, i) => {
          injectColor(i, new THREE.Color(el.glow), ease * 0.3);
        });
      }

      // --- DIVERGENZ-SPIKE ---
      function initDivergenzSpike() {
        spikeMeshes.forEach((spike, i) => {
          spike.visible = true;
          const angle = (i / 12) * Math.PI * 2;
          spike.position.set(Math.cos(angle) * RADIUS, 0, Math.sin(angle) * RADIUS);
          spike.lookAt(Math.cos(angle) * (RADIUS + 1), 0.3, Math.sin(angle) * (RADIUS + 1));
          spike.rotateX(-Math.PI / 2);
          spike.scale.set(1, 0, 1);
          (spike.material as any).color.set(i % 3 === 0 ? 0xff4030 : i % 3 === 1 ? 0xffffff : 0xff8060);
        });
        shockwave.visible = true;
        shockwave.scale.set(0.5, 0.5, 0.5);
        effectLight1.color.set(0xff4030);
        effectLight2.color.set(0xff8060);
      }

      function updateDivergenzSpike(progress: number, t: number) {
        const phase1 = Math.min(1, progress / 0.2);
        const phase2 = progress > 0.2 && progress < 0.7 ? 1 : 0;
        const phase3 = progress >= 0.7 ? (progress - 0.7) / 0.3 : 0;
        const intensity = phase1 * (1 - phase3);
        spikeMeshes.forEach((spike, i) => {
          if (!spike.visible) return;
          const tremble = phase2 * Math.sin(t * 30 + i * 2) * 0.15;
          spike.scale.set(1 + intensity * 0.8 + tremble * 0.5, intensity * (0.8 + Math.sin(i * 1.3) * 0.5 + tremble), 1 + intensity * 0.8 + tremble * 0.5);
          setMeshTreeOpacity(spike, intensity * 0.9);
        });
        shockwave.scale.setScalar(0.5 + progress * 1.2);
        setMeshTreeOpacity(shockwave, intensity * 0.4);
        const shake = phase2 * 0.025;
        ringGroup.position.x = Math.sin(t * 35) * shake;
        ringGroup.position.z = Math.cos(t * 40) * shake;
        ringGroup.position.y = Math.sin(t * 0.3) * 0.03 + Math.sin(t * 25) * shake * 0.5;
        effectLight1.position.set(0, 2, 0);
        effectLight1.intensity = intensity * 8;
        effectLight2.position.set(0, -1, 0);
        effectLight2.intensity = intensity * 5;
        renderer.toneMappingExposure = 1.8 + intensity * 1.5;
        // Violent divergence explosion: particles blast outward with trembling
        displaceDivergence(t, intensity * 0.4, intensity * 0.06);
        coronaMat.uniforms.uGlowIntensity!.value = 1.0 + intensity * 4.0;
        // Divergence white/red injection
        const divColor = new THREE.Color(0xff4030);
        injectColor(-1, divColor, intensity * 0.5);
      }

      // --- BURST (Particle Explosion Outward) ---
      function initBurst() {
        shockwave.visible = true;
        shockwave.scale.set(0.3, 0.3, 0.3);
        effectLight1.color.set(0xffc83a);
        effectLight2.color.set(0xff8040);
      }

      function updateBurst(progress: number, t: number) {
        // Fast attack, slow decay
        const attack = Math.min(1, progress / 0.15);
        const decay = progress > 0.4 ? Math.max(0, 1 - (progress - 0.4) / 0.6) : 1;
        const intensity = attack * decay;

        // Massive outward explosion — amplified divergence
        const burstAmp = intensity * 0.8;
        const trembleAmp = intensity * 0.1;
        for (let i = 0; i < RING_PARTICLE_COUNT; i++) {
          const bx = ringBasePositions[i * 3] ?? 0;
          const by = ringBasePositions[i * 3 + 1] ?? 0;
          const bz = ringBasePositions[i * 3 + 2] ?? 0;
          const dist = Math.sqrt(bx * bx + bz * bz);
          const dirX = dist > 0.01 ? bx / dist : 0;
          const dirZ = dist > 0.01 ? bz / dist : 0;

          const scatter = hash(i * 13) * 0.8 + 0.4;
          const tremble = trembleAmp * (Math.sin(t * 35 + i * 0.15) + Math.sin(t * 53 + i * 0.23) * 0.6);
          ringDisplacementTarget[i * 3] = dirX * burstAmp * scatter + tremble;
          ringDisplacementTarget[i * 3 + 1] = (by + (hash(i * 29) - 0.5) * 0.3) * burstAmp * scatter * 1.2;
          ringDisplacementTarget[i * 3 + 2] = dirZ * burstAmp * scatter + Math.sin(t * 37 + i * 0.13) * tremble;
        }

        for (let i = 0; i < CORONA_COUNT; i++) {
          const bx = coronaBasePositions[i * 3] ?? 0;
          const by = coronaBasePositions[i * 3 + 1] ?? 0;
          const bz = coronaBasePositions[i * 3 + 2] ?? 0;
          const dist = Math.sqrt(bx * bx + bz * bz);
          const dirX = dist > 0.01 ? bx / dist : 0;
          const dirZ = dist > 0.01 ? bz / dist : 0;
          const scatter = hash(i * 17 + 50000) * 1.2 + 0.5;
          coronaDisplacementTarget[i * 3] = dirX * burstAmp * scatter * 2.5;
          coronaDisplacementTarget[i * 3 + 1] = burstAmp * scatter * 2.0 + Math.sin(t * 20 + i * 0.1) * trembleAmp;
          coronaDisplacementTarget[i * 3 + 2] = dirZ * burstAmp * scatter * 2.5;
        }

        // Shockwave expanding ring
        shockwave.scale.setScalar(0.3 + progress * 2.0);
        setMeshTreeOpacity(shockwave, intensity * 0.5);

        // Warm explosion color injection
        const burstColor = new THREE.Color(0xffc83a);
        injectColor(-1, burstColor, intensity * 0.4);
        coronaMat.uniforms.uGlowIntensity!.value = 1.0 + intensity * 4.0;

        effectLight1.position.set(0, 1.5, 0);
        effectLight1.intensity = intensity * 8;
        effectLight2.position.set(0, -1, 0);
        effectLight2.intensity = intensity * 4;
        renderer.toneMappingExposure = 1.8 + intensity * 1.2;

        // Camera shake
        const shake = intensity * 0.02;
        ringGroup.position.x = Math.sin(t * 30) * shake;
        ringGroup.position.z = Math.cos(t * 35) * shake;
      }

      // --- CRUNCH (Compression Inward) ---
      function initCrunch() {
        effectLight1.color.set(0x3a8aff);
        effectLight2.color.set(0x6040ff);
      }

      function updateCrunch(progress: number, t: number) {
        // Slow build, hold, then release
        const build = Math.min(1, progress / 0.4);
        const hold = progress > 0.4 && progress < 0.7 ? 1 : 0;
        const release = progress >= 0.7 ? Math.max(0, 1 - (progress - 0.7) / 0.3) : 0;
        const intensity = build * (progress < 0.7 ? 1 : 0) + hold + release * 0.3;
        const crunchStrength = (build * (progress < 0.7 ? 1 : release)) * 0.6;

        // Particles contract inward toward ring center
        for (let i = 0; i < RING_PARTICLE_COUNT; i++) {
          const bx = ringBasePositions[i * 3] ?? 0;
          const by = ringBasePositions[i * 3 + 1] ?? 0;
          const bz = ringBasePositions[i * 3 + 2] ?? 0;
          const dist = Math.sqrt(bx * bx + bz * bz);
          const dirX = dist > 0.01 ? bx / dist : 0;
          const dirZ = dist > 0.01 ? bz / dist : 0;

          // Inward = negative radial direction
          const squeeze = -crunchStrength * (0.6 + hash(i * 19) * 0.4);
          // Also compress vertically
          const ySquash = -by * crunchStrength * 0.8;
          const vibrate = hold * Math.sin(t * 25 + i * 0.1) * 0.015;

          ringDisplacementTarget[i * 3] = dirX * squeeze + vibrate;
          ringDisplacementTarget[i * 3 + 1] = ySquash + vibrate * 0.5;
          ringDisplacementTarget[i * 3 + 2] = dirZ * squeeze + Math.sin(t * 28 + i * 0.13) * vibrate;
        }

        for (let i = 0; i < CORONA_COUNT; i++) {
          const bx = coronaBasePositions[i * 3] ?? 0;
          const by = coronaBasePositions[i * 3 + 1] ?? 0;
          const bz = coronaBasePositions[i * 3 + 2] ?? 0;
          const dist = Math.sqrt(bx * bx + bz * bz);
          const dirX = dist > 0.01 ? bx / dist : 0;
          const dirZ = dist > 0.01 ? bz / dist : 0;
          const squeeze = -crunchStrength * 1.5 * (0.5 + hash(i * 23 + 50000) * 0.5);
          coronaDisplacementTarget[i * 3] = dirX * squeeze;
          coronaDisplacementTarget[i * 3 + 1] = -by * crunchStrength * 1.5;
          coronaDisplacementTarget[i * 3 + 2] = dirZ * squeeze;
        }

        // Cool blue color injection
        const crunchColor = new THREE.Color(0x3a8aff);
        injectColor(-1, crunchColor, intensity * 0.35);
        coronaMat.uniforms.uGlowIntensity!.value = 1.0 + intensity * 2.0;

        effectLight1.position.set(0, 0.5, 0);
        effectLight1.intensity = intensity * 5;
        effectLight2.position.set(0, -0.5, 0);
        effectLight2.intensity = intensity * 3;
        renderer.toneMappingExposure = 1.8 - intensity * 0.3; // Slightly darker during crunch

        // Subtle vibration during hold
        const vib = hold * 0.01;
        ringGroup.position.x = Math.sin(t * 20) * vib;
        ringGroup.position.z = Math.cos(t * 23) * vib;
      }

      function updateEffect(type: EffectType, progress: number, t: number) {
        switch (type) {
          case 'resonanzsprung': updateResonanzsprung(progress, t); break;
          case 'dominanzwechsel': updateDominanzwechsel(progress, t); break;
          case 'mond_event': updateMondEvent(progress, t); break;
          case 'spannungsachse': updateSpannungsachse(progress, t); break;
          case 'korona_eruption': updateKoronaEruption(progress, t); break;
          case 'divergenz_spike': updateDivergenzSpike(progress, t); break;
          case 'burst': updateBurst(progress, t); break;
          case 'crunch': updateCrunch(progress, t); break;
        }
      }

      // === ANIMATION LOOP ===
      let frameId = 0;
      const animate = () => {
        if (disposed) return;
        frameId = requestAnimationFrame(animate);

        const t = clock.getElapsedTime();
        const dt = clock.getDelta() || 0.016;

        // Return-to-home: when user is not interacting, slowly drift back to home position
        const IDLE_DELAY = 1500; // ms after last interaction before returning home
        const RETURN_SPEED = 0.012; // slow, cinematic return
        if (!mouse.isDown && (Date.now() - mouse.lastInteraction) > IDLE_DELAY) {
          targetRotX += (HOME_ROT_X - targetRotX) * RETURN_SPEED;
          targetRotY += (HOME_ROT_Y - targetRotY) * RETURN_SPEED;
          targetZoom += (HOME_ZOOM - targetZoom) * RETURN_SPEED;
        }

        currentRotY += (targetRotY - currentRotY) * 0.05;
        currentRotX += (targetRotX - currentRotX) * 0.05;
        zoom += (targetZoom - zoom) * 0.05;

        camera.position.x = Math.sin(currentRotY) * Math.cos(currentRotX) * zoom;
        camera.position.y = Math.sin(currentRotX) * zoom;
        camera.position.z = Math.cos(currentRotY) * Math.cos(currentRotX) * zoom;
        camera.lookAt(0, 0, 0);

        // Ring breathing (idle)
        if (!effectRef.current) {
          ringGroup.position.y = Math.sin(t * 0.3) * 0.03;
          ringGroup.position.x = 0;
          ringGroup.position.z = 0;
          renderer.toneMappingExposure = 1.8;
        }

        // Subtle dust drift only (no ring/corona rotation)
        dust.rotation.y = t * 0.003;

        // Idle particle breathing — subtle displacement waves via target system
        if (!effectRef.current) {
          for (let i = 0; i < RING_PARTICLE_COUNT; i++) {
            const bx = ringBasePositions[i * 3] ?? 0;
            const by = ringBasePositions[i * 3 + 1] ?? 0;
            const bz = ringBasePositions[i * 3 + 2] ?? 0;
            const angle = Math.atan2(bz, bx);
            const na = angle < 0 ? angle + Math.PI * 2 : angle;
            const wave = Math.sin(na * 3 + t * 0.6) * 0.008 + Math.sin(na * 7 + t * 0.3) * 0.004;
            const dist = Math.sqrt(bx * bx + bz * bz);
            const dirX = dist > 0.01 ? bx / dist : 0;
            const dirZ = dist > 0.01 ? bz / dist : 0;
            ringDisplacementTarget[i * 3] = dirX * wave;
            ringDisplacementTarget[i * 3 + 1] = by * wave * 0.2;
            ringDisplacementTarget[i * 3 + 2] = dirZ * wave;
          }
          for (let i = 0; i < CORONA_COUNT; i++) {
            const bx = coronaBasePositions[i * 3] ?? 0;
            const bz = coronaBasePositions[i * 3 + 2] ?? 0;
            const angle = Math.atan2(bz, bx);
            const na = angle < 0 ? angle + Math.PI * 2 : angle;
            const wave = Math.sin(na * 3 + t * 0.5) * 0.01;
            const dist = Math.sqrt(bx * bx + bz * bz);
            const dirX = dist > 0.01 ? bx / dist : 0;
            const dirZ = dist > 0.01 ? bz / dist : 0;
            coronaDisplacementTarget[i * 3] = dirX * wave;
            coronaDisplacementTarget[i * 3 + 1] = wave * 0.3;
            coronaDisplacementTarget[i * 3 + 2] = dirZ * wave;
          }
        }

        // (Node pulse removed — pure particle aesthetic)

        // Corona glow pulse
        if (!effectRef.current) {
          coronaMat.uniforms.uGlowIntensity!.value = 0.8 + Math.sin(t * 0.4) * 0.2;
        }

        // Update time uniform
        ringMat.uniforms.uTime!.value = t;
        coronaMat.uniforms.uTime!.value = t;

        // Smoothly interpolate particle displacements (lerp speed: fast during effects, gentle idle)
        const lerpSpeed = effectRef.current ? 0.12 : 0.06;
        applyDisplacements(lerpSpeed);

        // Apply accumulated color injection
        applyColorInjection();

        // Update audio engine: compute effect intensity for sound modulation
        if (audioRef.current) {
          const eff = effectRef.current;
          let audioIntensity = 0;
          let audioEffectType: string | null = null;
          if (eff && eff.type) {
            const progress = Math.min(1, (Date.now() - eff.startTime) / (eff.duration * 1000));
            audioIntensity = Math.sin(progress * Math.PI); // bell curve
            audioEffectType = eff.type;
          }
          audioRef.current.update(t, audioIntensity, audioEffectType);
        }

        processEffect(t, dt);
        // Apply global intensity multiplier to effect lights
        effectLight1.intensity *= effectIntensityMultiplier;
        effectLight2.intensity *= effectIntensityMultiplier;

        renderer.render(scene, camera);
      };

      animate();

      return () => {
        disposed = true;
        cancelAnimationFrame(frameId);
        el.removeEventListener('wheel', onWheel);
        el.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        el.removeEventListener('touchstart', onTouchStart);
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
        resizeObserver.disconnect();
        renderer.dispose();
        if (canvasRef.current?.contains?.(renderer.domElement)) {
          canvasRef.current.removeChild(renderer.domElement);
        }
      };
    };

    const cleanup = initScene();
    return () => { cleanup?.then?.((fn) => fn?.()); };
  }, []);

  return <div ref={canvasRef} style={{ width: '100%', height: '100%' }} />;
}

// Re-export RingEffectType for backward compatibility
export type { RingEffectType } from './fusion-ring-transit';

interface FusionRingWebsiteCanvasProps {
  queuedEffect?: { id: string; type: string } | null;
  showEffectControls?: boolean;
  className?: string;
}

export function FusionRingWebsiteCanvas(_props: FusionRingWebsiteCanvasProps) {
  return <FusionRingCanvasInner />;
}

export default FusionRingWebsiteCanvas;

function FusionRingCanvasInner() {
  const [mounted, setMounted] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);
  const [activeEffect, setActiveEffect] = useState<EffectType>(null);
  const effectRef = useRef<EffectState | null>(null);
  const audioRef = useRef<FusionAudioEngine | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);

  useEffect(() => {
    setMounted(true);
    setWebglSupported(isWebGLAvailable());
    audioRef.current = createFusionAudio();
    return () => { audioRef.current?.dispose(); audioRef.current = null; };
  }, []);

  const toggleAudio = useCallback(() => {
    if (!audioRef.current) return;
    if (audioEnabled) { audioRef.current.disable(); } else { audioRef.current.enable(); }
    setAudioEnabled((v) => !v);
  }, [audioEnabled]);

  /**
   * Trigger an effect with optional intensity (0–1) and sector (0–11).
   * Called from UI buttons (intensity=1.0) or from InputController (variable intensity).
   */
  const triggerEffect = useCallback((
    type: EffectType,
    options?: { intensity?: number; duration?: number; sector?: number }
  ) => {
    if (!type) return;
    setActiveEffect(type);
    const defaultDuration = type === 'divergenz_spike' ? 5 : type === 'burst' ? 3.5 : type === 'crunch' ? 4.5 : 4;
    const duration = options?.duration ?? defaultDuration;
    const intensity = Math.max(0, Math.min(1, options?.intensity ?? 1.0));
    const sector = options?.sector ?? 0;
    effectRef.current = { type, startTime: Date.now(), duration, intensity, sector };
    setTimeout(() => setActiveEffect(null), duration * 1000);
  }, []);

  // --- Input Controller ---
  const inputControllerRef = useRef<FusionRingInputController | null>(null);
  const [showDataPanel, setShowDataPanel] = useState(false);
  const [manualIntensity, setManualIntensity] = useState(0.8);
  const [manualDuration, setManualDuration] = useState(4);
  const [manualSector, setManualSector] = useState(0);
  const [transitLog, setTransitLog] = useState<string[]>([]);

  useEffect(() => {
    const profile = createDemoProfile();
    const controller = new FusionRingInputController(profile);
    controller.onEffectTrigger((trigger) => {
      triggerEffect(trigger.type as EffectType, {
        intensity: trigger.intensity,
        duration: trigger.duration,
        sector: trigger.sector,
      });
      setTransitLog(prev => [...prev.slice(-9), `▸ ${trigger.type} (I:${trigger.intensity.toFixed(2)}, S:${trigger.sector})`]);
    });
    inputControllerRef.current = controller;
    return () => { controller.destroy(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps — canvas/animation refs excluded; Three.js manages its own lifecycle
  }, []);

  const ingestTransitJSON = useCallback((json: string) => {
    try {
      const state = JSON.parse(json) as TransitStateV1;
      inputControllerRef.current?.ingestTransitState(state);
      setTransitLog(prev => [...prev.slice(-9), `✓ Transit State ingested (${state.events?.length ?? 0} events)`]);
    } catch (e: unknown) {
      setTransitLog(prev => [...prev.slice(-9), `✗ Parse error: ${e instanceof Error ? e.message : 'unknown'}`]);
    }
  }, []);

  const ingestQuizJSON = useCallback((json: string) => {
    try {
      const result = JSON.parse(json) as QuizClusterResult;
      inputControllerRef.current?.ingestQuizCluster(result);
      setTransitLog(prev => [...prev.slice(-9), `✓ Quiz Cluster ingested (${result.facettes?.length ?? 0} facettes)`]);
    } catch (e: unknown) {
      setTransitLog(prev => [...prev.slice(-9), `✗ Parse error: ${e instanceof Error ? e.message : 'unknown'}`]);
    }
  }, []);

  const loadDemoTransit = useCallback(() => {
    const demo = createDemoTransitState();
    inputControllerRef.current?.ingestTransitState(demo);
    setTransitLog(prev => [...prev.slice(-9), `✓ Demo Transit loaded (${demo.events.length} events)`]);
  }, []);

  if (!mounted) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="w-32 h-32 rounded-full border border-cyan-900/30 animate-pulse" />
      </div>
    );
  }

  if (!webglSupported) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <FallbackRing />
      </div>
    );
  }

  const effects = [
    'resonanzsprung', 'dominanzwechsel', 'mond_event',
    'spannungsachse', 'korona_eruption', 'divergenz_spike',
    'burst', 'crunch',
  ] as EffectType[];

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#030308', position: 'relative', overflow: 'hidden' }}>
      <ThreeScene effectRef={effectRef} audioRef={audioRef} />

      {/* Effect Buttons */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
        padding: '16px 12px', gap: '8px', flexWrap: 'wrap', zIndex: 10,
        background: 'linear-gradient(to top, rgba(3,3,8,0.9) 0%, rgba(3,3,8,0.5) 60%, transparent 100%)',
        pointerEvents: 'none',
      }}>
        {effects.map((eff) => {
          if (!eff) return null;
          const config = EFFECT_CONFIGS[eff];
          if (!config) return null;
          const isActive = activeEffect === eff;
          return (
            <button
              key={eff}
              onClick={() => triggerEffect(eff)}
              disabled={!!activeEffect}
              style={{
                pointerEvents: 'auto', position: 'relative',
                padding: '10px 16px',
                background: isActive ? `linear-gradient(135deg, ${config.borderColor}, rgba(3,3,8,0.8))` : 'rgba(10,10,20,0.7)',
                border: `1px solid ${isActive ? config.color : 'rgba(80,90,120,0.3)'}`,
                borderRadius: '8px',
                color: isActive ? config.color : 'rgba(180,190,210,0.8)',
                fontSize: '10px', fontFamily: '"SF Mono", "Fira Code", monospace',
                letterSpacing: '1.5px', fontWeight: 600,
                cursor: activeEffect ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                opacity: activeEffect && !isActive ? 0.4 : 1,
                backdropFilter: 'blur(10px)', textTransform: 'uppercase',
                lineHeight: 1.4, textAlign: 'center', minWidth: '130px',
                boxShadow: isActive ? `0 0 20px ${config.borderColor}` : 'none',
              }}
            >
              <div style={{ fontSize: '10px', fontWeight: 700 }}>{config.label}</div>
              <div style={{ fontSize: '8px', opacity: 0.6, marginTop: '2px', letterSpacing: '0.5px' }}>{config.sublabel}</div>
              {isActive && (
                <div style={{
                  position: 'absolute', top: -1, left: -1, right: -1, bottom: -1,
                  borderRadius: '8px', border: `1px solid ${config.color}`,
                  animation: 'pulse-border 1s ease-in-out infinite', pointerEvents: 'none',
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Audio Toggle */}
      <button
        onClick={toggleAudio}
        aria-label={audioEnabled ? 'Mute audio' : 'Enable audio'}
        style={{
          position: 'absolute', top: '20px', right: '20px', zIndex: 20,
          width: '40px', height: '40px', borderRadius: '50%',
          background: audioEnabled ? 'rgba(20,180,220,0.15)' : 'rgba(10,10,20,0.6)',
          border: `1px solid ${audioEnabled ? 'rgba(20,180,220,0.5)' : 'rgba(80,90,120,0.3)'}`,
          color: audioEnabled ? 'rgba(20,180,220,0.9)' : 'rgba(120,130,150,0.6)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(10px)', transition: 'all 0.3s ease',
          boxShadow: audioEnabled ? '0 0 15px rgba(20,180,220,0.2)' : 'none',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          {audioEnabled ? (
            <>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </>
          ) : (
            <>
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </>
          )}
        </svg>
      </button>

      {/* Active Effect HUD Label */}
      {activeEffect && EFFECT_CONFIGS[activeEffect] && (
        <div style={{
          position: 'absolute', top: '24px', left: '50%',
          transform: 'translateX(-50%)', zIndex: 10, textAlign: 'center',
          animation: 'fade-in-down 0.5s ease-out',
        }}>
          <div style={{
            fontFamily: '"SF Mono", "Fira Code", monospace',
            fontSize: '11px', letterSpacing: '3px',
            color: EFFECT_CONFIGS[activeEffect]!.color,
            textTransform: 'uppercase', fontWeight: 700,
            textShadow: `0 0 20px ${EFFECT_CONFIGS[activeEffect]!.borderColor}`,
          }}>
            \u25C6 {EFFECT_CONFIGS[activeEffect]!.label} \u25C6
          </div>
          <div style={{
            fontFamily: '"SF Mono", "Fira Code", monospace',
            fontSize: '9px', letterSpacing: '2px',
            color: 'rgba(180,190,210,0.5)', marginTop: '4px',
          }}>
            {EFFECT_CONFIGS[activeEffect]!.sublabel}
          </div>
        </div>
      )}

      {/* Data Input Toggle */}
      <button
        onClick={() => setShowDataPanel(v => !v)}
        style={{
          position: 'absolute', top: '20px', left: '20px', zIndex: 20,
          padding: '8px 14px', borderRadius: '8px',
          background: showDataPanel ? 'rgba(20,180,220,0.15)' : 'rgba(10,10,20,0.6)',
          border: `1px solid ${showDataPanel ? 'rgba(20,180,220,0.5)' : 'rgba(80,90,120,0.3)'}`,
          color: showDataPanel ? 'rgba(20,180,220,0.9)' : 'rgba(120,130,150,0.6)',
          cursor: 'pointer', fontFamily: '"SF Mono", "Fira Code", monospace',
          fontSize: '9px', letterSpacing: '1.5px', fontWeight: 600,
          backdropFilter: 'blur(10px)', transition: 'all 0.3s ease',
        }}
      >
        {showDataPanel ? '✕ CLOSE' : '◈ DATA INPUT'}
      </button>

      {/* Data Input Panel */}
      {showDataPanel && (
        <div style={{
          position: 'absolute', top: '70px', left: '20px', zIndex: 20,
          width: '340px', maxHeight: 'calc(100vh - 140px)', overflowY: 'auto',
          background: 'rgba(5,5,15,0.92)', border: '1px solid rgba(80,90,120,0.3)',
          borderRadius: '12px', padding: '16px', backdropFilter: 'blur(20px)',
          fontFamily: '"SF Mono", "Fira Code", monospace', color: 'rgba(180,190,210,0.8)',
        }}>
          {/* Manual Effect Trigger */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '9px', letterSpacing: '2px', color: 'rgba(20,180,220,0.7)', marginBottom: '8px', fontWeight: 700 }}>
              MANUAL EFFECT TRIGGER
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
              {effects.map(eff => eff && (
                <button key={eff} onClick={() => triggerEffect(eff, { intensity: manualIntensity, duration: manualDuration, sector: manualSector })}
                  disabled={!!activeEffect}
                  style={{
                    padding: '4px 8px', fontSize: '8px', letterSpacing: '1px',
                    background: 'rgba(20,20,40,0.8)', border: '1px solid rgba(80,90,120,0.3)',
                    borderRadius: '4px', color: EFFECT_CONFIGS[eff]?.color ?? '#fff',
                    cursor: activeEffect ? 'not-allowed' : 'pointer', opacity: activeEffect ? 0.4 : 1,
                  }}
                >{eff.toUpperCase()}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '12px', fontSize: '9px' }}>
              <label style={{ flex: 1 }}>
                <span style={{ opacity: 0.5 }}>Intensity: {manualIntensity.toFixed(2)}</span>
                <input type="range" min="0" max="1" step="0.05" value={manualIntensity}
                  onChange={e => setManualIntensity(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#14b4dc' }} />
              </label>
              <label style={{ flex: 1 }}>
                <span style={{ opacity: 0.5 }}>Duration: {manualDuration}s</span>
                <input type="range" min="1" max="10" step="0.5" value={manualDuration}
                  onChange={e => setManualDuration(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#14b4dc' }} />
              </label>
            </div>
            <label style={{ fontSize: '9px', display: 'block', marginTop: '6px' }}>
              <span style={{ opacity: 0.5 }}>Sector: {manualSector}</span>
              <input type="range" min="0" max="11" step="1" value={manualSector}
                onChange={e => setManualSector(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#14b4dc' }} />
            </label>
          </div>

          {/* Separator */}
          <div style={{ height: '1px', background: 'rgba(80,90,120,0.3)', margin: '12px 0' }} />

          {/* Transit State JSON Input */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '9px', letterSpacing: '2px', color: 'rgba(255,184,42,0.7)', marginBottom: '8px', fontWeight: 700 }}>
              CHANNEL A · TRANSIT STATE
            </div>
            <textarea
              id="transit-json-input"
              placeholder='Paste TRANSIT_STATE_v1 JSON here...'
              rows={4}
              style={{
                width: '100%', background: 'rgba(10,10,25,0.8)', border: '1px solid rgba(80,90,120,0.3)',
                borderRadius: '6px', padding: '8px', color: 'rgba(180,190,210,0.8)',
                fontSize: '9px', fontFamily: '"SF Mono", "Fira Code", monospace', resize: 'vertical',
              }}
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <button onClick={() => {
                const el = document.getElementById('transit-json-input') as HTMLTextAreaElement;
                if (el?.value) ingestTransitJSON(el.value);
              }} style={{
                flex: 1, padding: '6px', fontSize: '9px', letterSpacing: '1px',
                background: 'rgba(255,184,42,0.1)', border: '1px solid rgba(255,184,42,0.3)',
                borderRadius: '4px', color: 'rgba(255,184,42,0.8)', cursor: 'pointer',
              }}>INGEST</button>
              <button onClick={loadDemoTransit} style={{
                flex: 1, padding: '6px', fontSize: '9px', letterSpacing: '1px',
                background: 'rgba(20,180,220,0.1)', border: '1px solid rgba(20,180,220,0.3)',
                borderRadius: '4px', color: 'rgba(20,180,220,0.8)', cursor: 'pointer',
              }}>DEMO TRANSIT</button>
            </div>
          </div>

          {/* Separator */}
          <div style={{ height: '1px', background: 'rgba(80,90,120,0.3)', margin: '12px 0' }} />

          {/* Quiz Cluster JSON Input */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '9px', letterSpacing: '2px', color: 'rgba(42,255,90,0.7)', marginBottom: '8px', fontWeight: 700 }}>
              CHANNEL B · QUIZ CLUSTER
            </div>
            <textarea
              id="quiz-json-input"
              placeholder='Paste QuizClusterResult JSON here...'
              rows={3}
              style={{
                width: '100%', background: 'rgba(10,10,25,0.8)', border: '1px solid rgba(80,90,120,0.3)',
                borderRadius: '6px', padding: '8px', color: 'rgba(180,190,210,0.8)',
                fontSize: '9px', fontFamily: '"SF Mono", "Fira Code", monospace', resize: 'vertical',
              }}
            />
            <button onClick={() => {
              const el = document.getElementById('quiz-json-input') as HTMLTextAreaElement;
              if (el?.value) ingestQuizJSON(el.value);
            }} style={{
              width: '100%', marginTop: '6px', padding: '6px', fontSize: '9px', letterSpacing: '1px',
              background: 'rgba(42,255,90,0.1)', border: '1px solid rgba(42,255,90,0.3)',
              borderRadius: '4px', color: 'rgba(42,255,90,0.8)', cursor: 'pointer',
            }}>INGEST QUIZ</button>
          </div>

          {/* Event Log */}
          {transitLog.length > 0 && (
            <div>
              <div style={{ fontSize: '9px', letterSpacing: '2px', color: 'rgba(180,190,210,0.4)', marginBottom: '6px', fontWeight: 700 }}>
                EVENT LOG
              </div>
              <div style={{
                fontSize: '8px', lineHeight: '1.6', color: 'rgba(180,190,210,0.5)',
                maxHeight: '100px', overflowY: 'auto',
              }}>
                {transitLog.map((log, i) => <div key={i}>{log}</div>)}
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes pulse-border { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
        @keyframes fade-in-down { 0% { opacity: 0; transform: translateX(-50%) translateY(-10px); } 100% { opacity: 1; transform: translateX(-50%) translateY(0); } }
      `}</style>
    </div>
  );
}

function FallbackRing() {
  return (
    <div className="relative flex items-center justify-center" style={{ perspective: '1200px' }}>
      <style>{`
        @keyframes ringRotate3D { 0% { transform: rotateX(65deg) rotateZ(0deg); } 100% { transform: rotateX(65deg) rotateZ(360deg); } }
        @keyframes ringPulse { 0%, 100% { box-shadow: 0 0 60px rgba(42,90,138,0.4), inset 0 0 30px rgba(26,58,90,0.5); } 50% { box-shadow: 0 0 100px rgba(42,106,154,0.6), inset 0 0 50px rgba(26,58,90,0.7); } }
        .ring-outer { width: min(380px, 80vw); height: min(380px, 80vw); border-radius: 50%; border: 14px solid #2a2a38; animation: ringRotate3D 25s linear infinite, ringPulse 4s ease-in-out infinite; }
      `}</style>
      <div className="ring-outer" />
    </div>
  );
}

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type * as THREE_TYPES from 'three';
import { createFusionAudio, type FusionAudioEngine } from './fusion-ring-audio';
import {
  PLANETS,
  PLANET_MAP,
  ZODIAC_SIGNS,
  QUIZ_DIMS,
  computeWeights,
  generateSignature,
  generateTransitParticles,
  computeSpiroParams,
  computeEmergence,
  createTestPreset,
  getTier,
  fractalDepth,
  hash01,
  lerp,
  clamp,
  type BazodiacSignature,
  type BazodiacWeights,
  type BazParticle,
  type QuizDimension,
  type PlanetDef,
} from './bazodiac-engine';
import { FusionRingInputController } from './fusion-ring-input';
import { createDemoTransitState, type TransitStateV1 } from './fusion-ring-transit';
import {
  createDemoProfile,
  type FusionRingProfile,
} from './fusion-ring-profile';
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
  intensity: number;
  sector: number;
}

const EFFECT_CONFIGS: Record<string, { label: string; sublabel: string; color: string; borderColor: string }> = {
  resonanzsprung: { label: 'RESONANZSPRUNG', sublabel: 'Delta \u2265 0.18 \u00b7 Sector Spike', color: 'rgba(255,58,42,0.9)', borderColor: 'rgba(255,58,42,0.4)' },
  dominanzwechsel: { label: 'DOMINANZWECHSEL', sublabel: 'Sector Override \u00b7 \u2265 0.08', color: 'rgba(255,184,42,0.9)', borderColor: 'rgba(255,184,42,0.4)' },
  mond_event: { label: 'MOND-EVENT', sublabel: 'Lunar Phase \u00b7 Peak Sector', color: 'rgba(180,200,255,0.9)', borderColor: 'rgba(180,200,255,0.4)' },
  spannungsachse: { label: 'SPANNUNGSACHSE', sublabel: 'Opposition Tension \u00b7 S1\u2194S7', color: 'rgba(200,80,255,0.9)', borderColor: 'rgba(200,80,255,0.4)' },
  korona_eruption: { label: 'KORONA-ERUPTION', sublabel: 'Energy Strands \u00b7 Peak Overflow', color: 'rgba(42,255,90,0.9)', borderColor: 'rgba(42,255,90,0.4)' },
  divergenz_spike: { label: 'DIVERGENZ', sublabel: 'DIVERGENCE DETECTED', color: 'rgba(255,255,255,0.95)', borderColor: 'rgba(255,80,60,0.5)' },
  burst: { label: 'BURST', sublabel: 'Particle Explosion \u00b7 Outward', color: 'rgba(255,200,60,0.95)', borderColor: 'rgba(255,160,30,0.5)' },
  crunch: { label: 'CRUNCH', sublabel: 'Compression \u00b7 Inward Collapse', color: 'rgba(100,180,255,0.95)', borderColor: 'rgba(60,120,255,0.5)' },
};

export interface FusionRingCanvasProps {
  natalWeights?: Record<string, number>;
  quizWeights?: Record<string, number>;
  isMini?: boolean;
  showUI?: boolean;
  revealProgress?: number; // 0..1, used for onboarding reveal
  className?: string;
}

// Simple hash for deterministic pseudo-random
function hash(n: number): number {
  let x = Math.sin(n * 127.1 + n * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// ================================================================
// BAZODIAC WEIGHT STATE — shared between ThreeScene and UI
// ================================================================
interface BazodiacState {
  natal: Map<string, number>;
  quiz: Map<QuizDimension, number>;
}

function ThreeScene({ effectRef, audioRef, bazStateRef, revealProgress = 1.0, isMini = false }: {
  effectRef: React.MutableRefObject<EffectState | null>;
  audioRef: React.MutableRefObject<FusionAudioEngine | null>;
  bazStateRef: React.MutableRefObject<BazodiacState>;
  revealProgress?: number;
  isMini?: boolean;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef?.current) return;
    let disposed = false;

    const initScene = async () => {
      const THREE = await import('three');
      let EffectComposer, RenderPass, UnrealBloomPass;
      try {
        const EC = await import('three/examples/jsm/postprocessing/EffectComposer.js');
        const RP = await import('three/examples/jsm/postprocessing/RenderPass.js');
        const UB = await import('three/examples/jsm/postprocessing/UnrealBloomPass.js');
        EffectComposer = EC.EffectComposer;
        RenderPass = RP.RenderPass;
        UnrealBloomPass = UB.UnrealBloomPass;
      } catch(e) { console.warn('THREE postprocessing missing, running without bloom'); }

      // === CORE OBJECTS ===
      const scene = new THREE.Scene();
      const container = canvasRef.current;
      const width = container?.clientWidth || window.innerWidth;
      const height = container?.clientHeight || window.innerHeight;
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      const geometry = new THREE.BufferGeometry();

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
      renderer.setClearColor(0x08080e);
      canvasRef.current?.appendChild?.(renderer.domElement);

      let composer: any;
      let bloomPass: any;
      if (EffectComposer) {
        composer = new EffectComposer(renderer);
        const renderPass = new RenderPass(scene, camera);
        composer.addPass(renderPass);

        bloomPass = new UnrealBloomPass(
          new THREE.Vector2(width, height),
          0.35,  // strength (reduced for subtlety)
          0.4,   // radius
          0.9    // threshold (higher = only brightest particles bloom)
        );
        composer.addPass(bloomPass);

        try {
          // Vignette pass — draws focus toward centre
          // @ts-ignore
          const SP = await import('three/examples/jsm/postprocessing/ShaderPass.js');
          const vignetteShader = {
            uniforms: { tDiffuse: { value: null }, darkness: { value: 0.6 }, offset: { value: 1.2 } },
            vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
            fragmentShader: `uniform sampler2D tDiffuse; uniform float darkness; uniform float offset; varying vec2 vUv; void main() { vec4 texel = texture2D(tDiffuse, vUv); vec2 uv = (vUv - 0.5) * 2.0; float vig = clamp(offset - dot(uv, uv) * darkness, 0.0, 1.0); gl_FragColor = vec4(texel.rgb * vig, texel.a); }`,
          };
          // @ts-ignore
          composer.addPass(new SP.ShaderPass(vignetteShader));
          // @ts-ignore
          const OP = await import('three/examples/jsm/postprocessing/OutputPass.js');
          composer.addPass(new OP.OutputPass());
        } catch(e) {}
      }

      const clock = new THREE.Clock();

      // === LIGHTING ===
      const keyLight = new THREE.DirectionalLight(0xf5ede0, 1.5);
      keyLight.position.set(5, 8, 5);
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0x8898c0, 0.6);
      fillLight.position.set(-5, 3, -3);
      scene.add(fillLight);

      const ambient = new THREE.AmbientLight(0x1a1a3e, 0.3);
      scene.add(ambient);

      const coreLight = new THREE.PointLight(0x2a5a8a, 2.0, 6);
      coreLight.position.set(0, 0, 0);
      scene.add(coreLight);

      // Effect lights
      const effectLight1 = new THREE.PointLight(0xff3a2a, 0, 8);
      effectLight1.position.set(0, 1, 0);
      scene.add(effectLight1);
      const effectLight2 = new THREE.PointLight(0x3a9aff, 0, 8);
      effectLight2.position.set(0, -1, 0);
      scene.add(effectLight2);

      // === MAIN GROUP ===
      const ringGroup = new THREE.Group();
      scene.add(ringGroup);

      const MAX_R = 2.0;
      const RADIUS = 2.2;

      // ========================================
      // BAZODIAC PARTICLE SYSTEM
      // ========================================
      const MAX_PARTICLES = 35000; // headroom above 28k

      const positions = new Float32Array(MAX_PARTICLES * 3);
      const basePositions = new Float32Array(MAX_PARTICLES * 3);
      const colors = new Float32Array(MAX_PARTICLES * 3);
      const sizes = new Float32Array(MAX_PARTICLES);
      const alphas = new Float32Array(MAX_PARTICLES);
      const phases = new Float32Array(MAX_PARTICLES);
      const layers = new Float32Array(MAX_PARTICLES);

      let particleCount = 0;
      let currentSignature: BazodiacSignature | null = null;

      // Displacement system for effects
      const displacementTarget = new Float32Array(MAX_PARTICLES * 3);
      const displacementCurrent = new Float32Array(MAX_PARTICLES * 3);
      // Color injection
      const colorInjection = new Float32Array(MAX_PARTICLES * 3);
      const colorInjectionTarget = new Float32Array(MAX_PARTICLES * 3);

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
      geometry.setAttribute('layer', new THREE.BufferAttribute(layers, 1));
      geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

      const particleUniforms = {
        uTime: { value: 0 },
        uReveal: { value: revealProgress }
      };

      // Custom shader material for particles
      const particleMat = new THREE.ShaderMaterial({
        uniforms: particleUniforms,
        vertexShader: `
          uniform float uTime;
          uniform float uReveal;
          attribute float size;
          attribute float alpha;
          attribute vec3 color;
          attribute float layer;

          varying vec3 vColor;
          varying float vAlpha;
          varying float vLayer;

          void main() {
            vColor = color;
            vLayer = layer;

            float finalSize = size;
            float finalAlpha = alpha;

            vec3 pos = position;

            // Reveal Animation: start at center, expand out
            float revealScale = 0.2 + uReveal * 0.8;
            pos *= revealScale;
            finalAlpha *= smoothstep(0.0, 0.3, uReveal);
            finalSize *= smoothstep(0.0, 0.1, uReveal);

            // Bridge: pulsing logic
            if (layer == 4.0) {
              finalSize *= 1.0 + 0.3 * sin(uTime * 3.0 + pos.x * 2.0);
              finalAlpha *= 0.7 + 0.3 * sin(uTime * 2.0 + pos.z);
            }
            // Zodiac Roots grounding
            if (layer == 6.0) {
              finalAlpha = min(1.0, finalAlpha * 1.3);
            }

            vAlpha = finalAlpha;

            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_PointSize = finalSize * (600.0 / -mvPosition.z);
            gl_PointSize = clamp(gl_PointSize, 0.5, 80.0);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          varying float vAlpha;
          varying float vLayer;
          void main() {
            vec2 pt = gl_PointCoord - vec2(0.5);
            float dist = length(pt);
            if (dist > 0.5) discard;

            // Dual-Core Glow with HDR Kern
            float core = 1.0 - smoothstep(0.0, 0.12, dist);
            float halo = 1.0 - smoothstep(0.0, 0.5, dist);
            halo = pow(halo, 2.5);

            float glow = core * 0.7 + halo * 0.5;

            // HDR Boost for centerjump
            float boost = (vLayer == 5.0) ? 2.5 : 1.5;
            vec3 col = vColor * (1.0 + core * boost);

            gl_FragColor = vec4(col, vAlpha * glow);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      const particleSystem = new THREE.Points(geometry, particleMat);
      ringGroup.add(particleSystem);

      // === ZODIAC RING SPRITES ===
      const zodiacSprites: THREE_TYPES.Sprite[] = [];
      function createZodiacRing() {
        // Remove old
        zodiacSprites.forEach(s => ringGroup.remove(s));
        zodiacSprites.length = 0;

        ZODIAC_SIGNS.forEach(sign => {
          const canvas = document.createElement('canvas');
          canvas.width = 128;
          canvas.height = 128;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          ctx.clearRect(0, 0, 128, 128);

          // Check if any fractal planet is in this sign
          const isActive = currentSignature?.weights.ranked.some(
            r => r.weight >= 0.75 && PLANET_MAP.get(r.id)?.sign === sign.name
          ) ?? false;

          // Draw glow circle behind symbol
          if (isActive) {
            const gradient = ctx.createRadialGradient(64, 64, 10, 64, 64, 60);
            gradient.addColorStop(0, 'rgba(255,220,120,0.25)');
            gradient.addColorStop(1, 'rgba(255,220,120,0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 128, 128);
          }

          // Draw symbol
          ctx.font = 'bold 72px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = isActive ? 'rgba(255,220,120,0.95)' : 'rgba(140,160,190,0.5)';
          ctx.fillText(sign.symbol, 64, 64);

          const texture = new THREE.CanvasTexture(canvas);
          texture.needsUpdate = true;
          const spriteMat = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthWrite: false,
          });
          const sprite = new THREE.Sprite(spriteMat);
          const rad = sign.deg * Math.PI / 180;
          const rr = MAX_R * 1.12;
          sprite.position.set(Math.cos(rad) * rr, 0, -Math.sin(rad) * rr);
          const sc = isActive ? 0.50 : 0.32;
          sprite.scale.set(sc, sc, sc);
          ringGroup.add(sprite);
          zodiacSprites.push(sprite);
        });
      }

      // === AMBIENT DUST ===
      const DUST_COUNT = 1500;
      const dustGeo = new THREE.BufferGeometry();
      const dustPos = new Float32Array(DUST_COUNT * 3);
      const dustSz = new Float32Array(DUST_COUNT);
      for (let i = 0; i < DUST_COUNT; i++) {
        dustPos[i * 3] = (Math.random() - 0.5) * 12;
        dustPos[i * 3 + 1] = (Math.random() - 0.5) * 6;
        dustPos[i * 3 + 2] = (Math.random() - 0.5) * 12;
        dustSz[i] = Math.random() * 2.5 + 0.2;
      }
      dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
      dustGeo.setAttribute('size', new THREE.BufferAttribute(dustSz, 1));
      const dustMat = new THREE.PointsMaterial({
        size: 0.012,
        color: 0x3a4a5a,
        transparent: true,
        opacity: 0.08,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      });
      const dust = new THREE.Points(dustGeo, dustMat);
      scene.add(dust);

      // === SKY DOME — living nebula background ===
      const bgGeo = new THREE.SphereGeometry(30, 32, 32);
      const bgMat = new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uColor1: { value: new THREE.Color(0x08080e) },
          uColor2: { value: new THREE.Color(0x0a1020) },
          uColor3: { value: new THREE.Color(0x100818) },
        },
        vertexShader: `
          varying vec3 vWorldPos;
          void main() {
            vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform vec3 uColor1;
          uniform vec3 uColor2;
          uniform vec3 uColor3;
          varying vec3 vWorldPos;
          void main() {
            float y = normalize(vWorldPos).y;
            vec3 col = mix(uColor1, uColor2, smoothstep(-0.3, 0.3, y));
            col = mix(col, uColor3, smoothstep(0.2, 0.8, y) * 0.5);
            col *= 1.0 + sin(uTime * 0.15) * 0.03;
            gl_FragColor = vec4(col, 1.0);
          }
        `,
      });
      const bgSphere = new THREE.Mesh(bgGeo, bgMat);
      scene.add(bgSphere);

      // ========================================
      // LOAD SIGNATURE INTO BUFFERS
      // ========================================
      function loadSignature(sig: BazodiacSignature) {
        currentSignature = sig;
        const pts = sig.particles;
        particleCount = Math.min(pts.length, MAX_PARTICLES);
        const LAYER_MAP: Record<string, number> = {
          glow: 0, curve: 1, fractal: 2, subfractal: 3,
          bridge: 4, centerjump: 5, zodiac: 6, transit: 7
        };

        for (let i = 0; i < particleCount; i++) {
          const p = pts[i]!;

          let sizeScale = 0.04;
          let alphaScale = 1.0;
          let yOffset = 0;

          switch (p.layer) {
            case 'glow':
              sizeScale = 0.07;
              alphaScale = 0.25;
              yOffset = (hash01(p.phase, 42) - 0.5) * 0.4;
              break;
            case 'curve':
              sizeScale = 0.035;
              alphaScale = 1.3;
              yOffset = (hash01(p.phase, 43) - 0.5) * 0.03;
              break;
            case 'fractal':
              sizeScale = 0.025;
              yOffset = 0.02 + hash01(p.phase, 44) * 0.06;
              break;
            case 'subfractal':
              sizeScale = 0.015;
              alphaScale = 0.7;
              yOffset = 0.04 + hash01(p.phase, 45) * 0.08;
              break;
            case 'bridge':
              sizeScale = 0.03;
              yOffset = 0.01 + hash01(p.phase, 46) * 0.04;
              break;
            case 'centerjump':
              sizeScale = 0.04;
              alphaScale = 1.4;
              yOffset = 0;
              break;
            case 'zodiac':
              sizeScale = 0.025;
              yOffset = -0.15;
              break;
            case 'transit':
              sizeScale = 0.05;
              yOffset = hash01(p.phase, 47) * 0.2;
              break;
          }

          positions[i * 3] = p.x;
          positions[i * 3 + 1] = yOffset;
          positions[i * 3 + 2] = -p.y;
          basePositions[i * 3] = p.x;
          basePositions[i * 3 + 1] = yOffset;
          basePositions[i * 3 + 2] = -p.y;

          colors[i * 3] = p.color[0];
          colors[i * 3 + 1] = p.color[1];
          colors[i * 3 + 2] = p.color[2];

          sizes[i] = p.r * sizeScale;
          alphas[i] = Math.min(1.0, p.alpha * alphaScale);
          phases[i] = p.phase;
          layers[i] = LAYER_MAP[p.layer] ?? 1;
        }

        // Zero out unused
        for (let i = particleCount; i < MAX_PARTICLES; i++) {
          positions[i * 3] = 0;
          positions[i * 3 + 1] = -100;
          positions[i * 3 + 2] = 0;
          sizes[i] = 0;
          alphas[i] = 0;
        }

        // Reset displacements
        displacementTarget.fill(0);
        displacementCurrent.fill(0);
        colorInjection.fill(0);
        colorInjectionTarget.fill(0);

        geometry.attributes.position!.needsUpdate = true;
        geometry.attributes.color!.needsUpdate = true;
        geometry.attributes.size!.needsUpdate = true;
        geometry.attributes.alpha!.needsUpdate = true;
        geometry.attributes.layer!.needsUpdate = true;
        geometry.setDrawRange(0, particleCount);

        createZodiacRing();
      }

      // === INITIAL LOAD (Test Preset) ===
      function rebuildFromState() {
        const state = bazStateRef.current;
        const sig = generateSignature(state.natal, state.quiz, MAX_R, true);
        loadSignature(sig);
      }

      rebuildFromState();

      // Instance-scoped bridge for external rebuild
      (renderer.domElement as any).__fusionRingRebuild = rebuildFromState;

      // ========================================
      // MOUSE / TOUCH CONTROLS
      // ========================================
      const HOME_ROT_X = 1.48;
      const HOME_ROT_Y = 0;
      const HOME_ZOOM = 8.5;
      let targetRotX = HOME_ROT_X;
      let targetRotY = HOME_ROT_Y;
      let targetZoom = HOME_ZOOM;
      let currentRotX = HOME_ROT_X;
      let currentRotY = HOME_ROT_Y;
      let zoom = HOME_ZOOM;

      const mouse = { isDown: false, lastX: 0, lastY: 0, lastInteraction: Date.now() };

      const el = renderer.domElement;
      const onMouseDown = (e: MouseEvent) => {
        mouse.isDown = true;
        mouse.lastX = e.clientX;
        mouse.lastY = e.clientY;
        mouse.lastInteraction = Date.now();
      };
      const onMouseMove = (e: MouseEvent) => {
        if (!mouse.isDown) return;
        const dx = e.clientX - mouse.lastX;
        const dy = e.clientY - mouse.lastY;
        targetRotY += dx * 0.003;
        targetRotX = Math.max(0.2, Math.min(1.55, targetRotX + dy * 0.003));
        mouse.lastX = e.clientX;
        mouse.lastY = e.clientY;
        mouse.lastInteraction = Date.now();
      };
      const onMouseUp = () => { mouse.isDown = false; };
      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        targetZoom = Math.max(4, Math.min(15, targetZoom + e.deltaY * 0.005));
        mouse.lastInteraction = Date.now();
      };

      let touchStartDist = 0;
      const onTouchStart = (e: TouchEvent) => {
        if (e.touches.length === 1) {
          mouse.isDown = true;
          mouse.lastX = e.touches[0]!.clientX;
          mouse.lastY = e.touches[0]!.clientY;
        } else if (e.touches.length === 2) {
          const dx = e.touches[0]!.clientX - e.touches[1]!.clientX;
          const dy = e.touches[0]!.clientY - e.touches[1]!.clientY;
          touchStartDist = Math.hypot(dx, dy);
        }
        mouse.lastInteraction = Date.now();
      };
      const onTouchMove = (e: TouchEvent) => {
        if (e.touches.length === 1 && mouse.isDown) {
          const dx = e.touches[0]!.clientX - mouse.lastX;
          const dy = e.touches[0]!.clientY - mouse.lastY;
          targetRotY += dx * 0.003;
          targetRotX = Math.max(0.2, Math.min(1.55, targetRotX + dy * 0.003));
          mouse.lastX = e.touches[0]!.clientX;
          mouse.lastY = e.touches[0]!.clientY;
        } else if (e.touches.length === 2) {
          const dx = e.touches[0]!.clientX - e.touches[1]!.clientX;
          const dy = e.touches[0]!.clientY - e.touches[1]!.clientY;
          const dist = Math.hypot(dx, dy);
          const delta = touchStartDist - dist;
          targetZoom = Math.max(4, Math.min(15, targetZoom + delta * 0.01));
          touchStartDist = dist;
        }
        mouse.lastInteraction = Date.now();
      };
      const onTouchEnd = () => { mouse.isDown = false; };

      el.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      el.addEventListener('wheel', onWheel, { passive: false });
      el.addEventListener('touchstart', onTouchStart, { passive: true });
      window.addEventListener('touchmove', onTouchMove, { passive: true });
      window.addEventListener('touchend', onTouchEnd);

      const onResize = () => {
        if (disposed) return;
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        if (composer) {
          composer.setSize(window.innerWidth, window.innerHeight);
        }
      };
      window.addEventListener('resize', onResize);

      // ========================================
      // EFFECT SYSTEM (Displacement)
      // ========================================
      let effectIntensityMultiplier = 1.0;

      function applyDisplacements(speed: number) {
        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3;
          displacementCurrent[i3] += (displacementTarget[i3]! - displacementCurrent[i3]!) * speed;
          displacementCurrent[i3 + 1] += (displacementTarget[i3 + 1]! - displacementCurrent[i3 + 1]!) * speed;
          displacementCurrent[i3 + 2] += (displacementTarget[i3 + 2]! - displacementCurrent[i3 + 2]!) * speed;
          positions[i3] = basePositions[i3]! + displacementCurrent[i3]!;
          positions[i3 + 1] = basePositions[i3 + 1]! + displacementCurrent[i3 + 1]!;
          positions[i3 + 2] = basePositions[i3 + 2]! + displacementCurrent[i3 + 2]!;
        }
        geometry.attributes.position!.needsUpdate = true;
      }

      function applyColorInjection() {
        let anyActive = false;
        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3;
          const str = colorInjectionTarget[i3]! + colorInjectionTarget[i3 + 1]! + colorInjectionTarget[i3 + 2]!;
          if (str > 0.001) anyActive = true;
          colorInjection[i3] += (colorInjectionTarget[i3]! - colorInjection[i3]!) * 0.08;
          colorInjection[i3 + 1] += (colorInjectionTarget[i3 + 1]! - colorInjection[i3 + 1]!) * 0.08;
          colorInjection[i3 + 2] += (colorInjectionTarget[i3 + 2]! - colorInjection[i3 + 2]!) * 0.08;
          if (currentSignature && i < currentSignature.particles.length) {
            const p = currentSignature.particles[i]!;
            colors[i3] = p.color[0] + colorInjection[i3]!;
            colors[i3 + 1] = p.color[1] + colorInjection[i3 + 1]!;
            colors[i3 + 2] = p.color[2] + colorInjection[i3 + 2]!;
          }
        }
        if (anyActive) geometry.attributes.color!.needsUpdate = true;
        // Decay injection targets
        for (let i = 0; i < particleCount * 3; i++) {
          colorInjectionTarget[i]! *= 0.95;
        }
      }

      /** Inject color into particles near a specific planet or all (-1) */
      function injectColor(planetIdx: number, color: THREE_TYPES.Color, strength: number) {
        if (!currentSignature) return;
        for (let i = 0; i < particleCount; i++) {
          const p = currentSignature.particles[i];
          if (!p) continue;
          let match = planetIdx < 0; // -1 = global
          if (!match && planetIdx >= 0 && planetIdx < PLANETS.length) {
            match = p.planetId === PLANETS[planetIdx]?.id;
          }
          if (match) {
            const i3 = i * 3;
            colorInjectionTarget[i3] = Math.max(colorInjectionTarget[i3]!, color.r * strength);
            colorInjectionTarget[i3 + 1] = Math.max(colorInjectionTarget[i3 + 1]!, color.g * strength);
            colorInjectionTarget[i3 + 2] = Math.max(colorInjectionTarget[i3 + 2]!, color.b * strength);
          }
        }
      }

      // === EFFECT IMPLEMENTATIONS (simplified for Bazodiac) ===

      function displaceRadial(t: number, amp: number, outward: boolean) {
        for (let i = 0; i < particleCount; i++) {
          const bx = basePositions[i * 3]!;
          const bz = basePositions[i * 3 + 2]!;
          const dist = Math.sqrt(bx * bx + bz * bz);
          if (dist < 0.01) continue;
          const dirX = bx / dist;
          const dirZ = bz / dist;
          const scatter = hash(i * 13) * 0.5 + 0.5;
          const d = (outward ? 1 : -1) * amp * scatter;
          const tremble = Math.sin(t * 20 + i * 0.1) * amp * 0.1;
          displacementTarget[i * 3] = dirX * d + tremble;
          displacementTarget[i * 3 + 1] = (hash(i * 29) - 0.5) * amp * 0.3;
          displacementTarget[i * 3 + 2] = dirZ * d + Math.sin(t * 22 + i * 0.12) * amp * 0.05;
        }
      }

      function displaceWave(t: number, amp: number) {
        for (let i = 0; i < particleCount; i++) {
          const bx = basePositions[i * 3]!;
          const bz = basePositions[i * 3 + 2]!;
          const angle = Math.atan2(bz, bx);
          const dist = Math.sqrt(bx * bx + bz * bz);
          const wave = Math.sin(angle * 3 + t * 4) * amp * dist * 0.3;
          const dirX = dist > 0.01 ? bx / dist : 0;
          const dirZ = dist > 0.01 ? bz / dist : 0;
          displacementTarget[i * 3] = dirX * wave;
          displacementTarget[i * 3 + 1] = Math.sin(dist * 5 + t * 3) * amp * 0.15;
          displacementTarget[i * 3 + 2] = dirZ * wave;
        }
      }

      function displaceSector(t: number, sector: number, amp: number) {
        const sectorAngle = (sector / 12) * Math.PI * 2;
        const sectorWidth = Math.PI / 4;
        for (let i = 0; i < particleCount; i++) {
          const bx = basePositions[i * 3]!;
          const bz = basePositions[i * 3 + 2]!;
          const angle = Math.atan2(bz, bx);
          let diff = angle - sectorAngle;
          if (diff > Math.PI) diff -= 2 * Math.PI;
          if (diff < -Math.PI) diff += 2 * Math.PI;
          const proximity = Math.max(0, 1 - Math.abs(diff) / sectorWidth);
          const dist = Math.sqrt(bx * bx + bz * bz);
          const dirX = dist > 0.01 ? bx / dist : 0;
          const dirZ = dist > 0.01 ? bz / dist : 0;
          const d = proximity * amp * (0.5 + Math.sin(t * 8 + i * 0.05) * 0.3);
          displacementTarget[i * 3] = dirX * d;
          displacementTarget[i * 3 + 1] = proximity * amp * 0.2 * Math.sin(t * 6);
          displacementTarget[i * 3 + 2] = dirZ * d;
        }
      }

      // === PROCESS EFFECTS ===
      function processEffect(t: number, dt: number) {
        const eff = effectRef.current;
        if (!eff || !eff.type) {
          effectLight1.intensity = 0;
          effectLight2.intensity = 0;
          effectIntensityMultiplier = 1.0;
          return;
        }

        const elapsed = (Date.now() - eff.startTime) / 1000;
        const progress = Math.min(1, elapsed / eff.duration);
        if (progress >= 1) {
          effectRef.current = null;
          displacementTarget.fill(0);
          effectLight1.intensity = 0;
          effectLight2.intensity = 0;
          effectIntensityMultiplier = 1.0;
          renderer.toneMappingExposure = 1.8;
          return;
        }

        effectIntensityMultiplier = eff.intensity;
        const ease = Math.sin(progress * Math.PI);
        const amp = ease * eff.intensity;

        switch (eff.type) {
          case 'resonanzsprung': {
            displaceSector(t, eff.sector, amp * 0.4);
            const sCol = new THREE.Color(0xff3a2a);
            injectColor(eff.sector % 7, sCol, amp * 0.5);
            effectLight1.color.set(0xff3a2a);
            effectLight1.intensity = amp * 4;
            effectLight2.intensity = amp * 2;
            break;
          }
          case 'dominanzwechsel': {
            displaceWave(t, amp * 0.3);
            const dCol = new THREE.Color(0xffb82a);
            injectColor(-1, dCol, amp * 0.3);
            effectLight1.color.set(0xffb82a);
            effectLight1.intensity = amp * 3;
            effectLight2.color.set(0xff8040);
            effectLight2.intensity = amp * 2;
            break;
          }
          case 'mond_event': {
            // Moon = index 1
            displaceWave(t, amp * 0.15);
            const mCol = new THREE.Color(0xb4c8ff);
            injectColor(1, mCol, amp * 0.6);
            effectLight1.color.set(0xb4c8ff);
            effectLight1.intensity = amp * 3;
            effectLight2.intensity = amp * 1.5;
            coreLight.intensity = 2.0 + amp * 2;
            break;
          }
          case 'spannungsachse': {
            // Tension between two opposite sectors
            const sA = eff.sector;
            const sB = (eff.sector + 6) % 12;
            displaceSector(t, sA, amp * 0.3);
            displaceSector(t, sB, amp * 0.3);
            effectLight1.color.set(0xc850ff);
            effectLight1.intensity = amp * 4;
            effectLight2.color.set(0xff5040);
            effectLight2.intensity = amp * 3;
            ringGroup.position.x = Math.sin(t * 18) * amp * 0.008;
            break;
          }
          case 'korona_eruption': {
            displaceRadial(t, amp * 0.3, true);
            PLANETS.forEach((pl, i) => {
              injectColor(i, new THREE.Color(pl.hexColor), amp * 0.3);
            });
            effectLight1.color.set(0x3aff6a);
            effectLight1.intensity = amp * 4;
            effectLight2.color.set(0x2aff5a);
            effectLight2.intensity = amp * 3;
            break;
          }
          case 'divergenz_spike': {
            const phase1 = Math.min(1, progress / 0.2);
            const phase3 = progress >= 0.7 ? (progress - 0.7) / 0.3 : 0;
            const intensity = phase1 * (1 - phase3) * eff.intensity;
            displaceRadial(t, intensity * 0.4, true);
            const divCol = new THREE.Color(0xff4030);
            injectColor(-1, divCol, intensity * 0.5);
            effectLight1.color.set(0xff4030);
            effectLight1.intensity = intensity * 8;
            effectLight2.color.set(0xff8060);
            effectLight2.intensity = intensity * 5;
            renderer.toneMappingExposure = 1.8 + intensity * 1.5;
            const shake = intensity * 0.025;
            ringGroup.position.x = Math.sin(t * 35) * shake;
            ringGroup.position.z = Math.cos(t * 40) * shake;
            break;
          }
          case 'burst': {
            const attack = Math.min(1, progress / 0.15);
            const decay = progress > 0.4 ? Math.max(0, 1 - (progress - 0.4) / 0.6) : 1;
            const intensity = attack * decay * eff.intensity;
            displaceRadial(t, intensity * 0.8, true);
            const burstCol = new THREE.Color(0xffc83a);
            injectColor(-1, burstCol, intensity * 0.4);
            effectLight1.color.set(0xffc83a);
            effectLight1.intensity = intensity * 8;
            effectLight2.color.set(0xff8040);
            effectLight2.intensity = intensity * 4;
            renderer.toneMappingExposure = 1.8 + intensity * 1.2;
            const shake = intensity * 0.02;
            ringGroup.position.x = Math.sin(t * 30) * shake;
            ringGroup.position.z = Math.cos(t * 35) * shake;
            break;
          }
          case 'crunch': {
            const build = Math.min(1, progress / 0.4);
            const release = progress >= 0.7 ? Math.max(0, 1 - (progress - 0.7) / 0.3) : 0;
            const intensity = build * (progress < 0.7 ? 1 : release) * eff.intensity * 0.6;
            displaceRadial(t, intensity, false);
            const crunchCol = new THREE.Color(0x3a8aff);
            injectColor(-1, crunchCol, intensity * 0.5);
            effectLight1.color.set(0x3a8aff);
            effectLight1.intensity = intensity * 5;
            effectLight2.color.set(0x6040ff);
            effectLight2.intensity = intensity * 3;
            renderer.toneMappingExposure = 1.8 - intensity * 0.3;
            const vib = intensity * 0.01;
            ringGroup.position.x = Math.sin(t * 20) * vib;
            ringGroup.position.z = Math.cos(t * 23) * vib;
            break;
          }
        }
      }

      // === ANIMATION LOOP ===
      let frameId = 0;
      const animate = () => {
        if (disposed) return;
        frameId = requestAnimationFrame(animate);

        const t = clock.getElapsedTime();
        const dt = clock.getDelta() || 0.016;

        // Emergence-driven bloom and material intensity
        if (bloomPass && currentSignature) {
          const emergenceVal = currentSignature.emergence.emergence;
          bloomPass.strength = lerp(0.25, 0.55, emergenceVal);
        }

        // Return-to-home
        const IDLE_DELAY = 1500;
        const RETURN_SPEED = 0.012;
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

        // Breathing
        if (!effectRef.current) {
          ringGroup.position.y = Math.sin(t * 0.3) * 0.03;
          ringGroup.position.x = 0;
          ringGroup.position.z = 0;
          renderer.toneMappingExposure = 1.8;
          coreLight.intensity = 2.0;
        }

        dust.rotation.y = t * 0.003;

        // Idle particle breathing
        if (!effectRef.current) {
          for (let i = 0; i < particleCount; i++) {
            const bx = basePositions[i * 3]!;
            const bz = basePositions[i * 3 + 2]!;
            const angle = Math.atan2(bz, bx);
            const na = angle < 0 ? angle + Math.PI * 2 : angle;
            const wave = Math.sin(na * 3 + t * 0.6) * 0.008 + Math.sin(na * 7 + t * 0.3) * 0.004;
            const dist = Math.sqrt(bx * bx + bz * bz);
            const dirX = dist > 0.01 ? bx / dist : 0;
            const dirZ = dist > 0.01 ? bz / dist : 0;
            displacementTarget[i * 3] = dirX * wave;
            // Layer-differentiated Y breathing
            const layerVal = layers[i] ?? 1;
            let yBreath: number;
            if (layerVal === 0) {
              // Glow: slow, wide — atmospheric float
              yBreath = Math.sin(t * 0.25 + phases[i]!) * 0.05;
            } else if (layerVal >= 2 && layerVal <= 3) {
              // Fractal / subfractal: fast micro-vibration
              yBreath = Math.sin(t * 1.2 + phases[i]!) * 0.008;
            } else {
              // Curve, bridge, centerjump, zodiac: gentle default
              yBreath = Math.sin(t * 0.4 + phases[i]!) * 0.005;
            }
            displacementTarget[i * 3 + 1] = yBreath;
            displacementTarget[i * 3 + 2] = dirZ * wave;
          }
        }

        // Displacement + color
        const lerpSpeed = effectRef.current ? 0.12 : 0.06;
        applyDisplacements(lerpSpeed);
        applyColorInjection();

        // CPU centerjump flow: particles radiate from centre to their target position
        if (currentSignature) {
          for (let i = 0; i < particleCount; i++) {
            if (layers[i] !== 5) continue; // 5 = centerjump
            const p = currentSignature.particles[i];
            if (!p) continue;
            const flowPhase = (t * 0.4 + phases[i]!) % 1.0;
            const eased = 1.0 - Math.pow(1.0 - flowPhase, 3);
            positions[i * 3]     = p.baseX * eased;
            positions[i * 3 + 1] = basePositions[i * 3 + 1]!;
            positions[i * 3 + 2] = -p.baseY * eased;
            alphas[i] = p.alpha * (1.0 - eased * 0.6);
            sizes[i]  = p.r * 0.04 * (0.5 + (1.0 - eased) * 0.5);
          }
          geometry.attributes.position!.needsUpdate = true;
          geometry.attributes.alpha!.needsUpdate = true;
          geometry.attributes.size!.needsUpdate = true;
        }

        // Audio
        if (audioRef.current) {
          const eff = effectRef.current;
          let audioIntensity = 0;
          let audioEffectType: string | null = null;
          if (eff && eff.type) {
            const progress = Math.min(1, (Date.now() - eff.startTime) / (eff.duration * 1000));
            audioIntensity = Math.sin(progress * Math.PI);
            audioEffectType = eff.type;
          }
          audioRef.current.update(t, audioIntensity, audioEffectType);
        }

        processEffect(t, dt);
        effectLight1.intensity *= effectIntensityMultiplier;
        effectLight2.intensity *= effectIntensityMultiplier;

        particleUniforms.uTime.value = t;
        particleUniforms.uReveal.value = revealProgress;
        bgMat.uniforms.uTime.value = t;

        if (composer) {
          if (bloomPass) {
            // Dynamic bloom pulse based on signature emergence or just time
            const intensityBase = currentSignature?.emergence.emergence || 0.5;
            bloomPass.strength = 0.35 + Math.sin(t * 0.5) * 0.15 * intensityBase;
            bloomPass.threshold = 0.85 + Math.sin(t * 0.3) * 0.05;
          }
          composer.render();
        } else {
          renderer.render(scene, camera);
        }
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
        window.removeEventListener('resize', onResize);
        renderer.dispose();
        if (canvasRef.current?.contains?.(renderer.domElement)) {
          canvasRef.current.removeChild(renderer.domElement);
        }
      };
    };

    const cleanup = initScene();
    return () => { cleanup?.then?.((fn) => fn?.()); };
  }, [revealProgress, isMini]);

  return <div ref={canvasRef} style={{ width: '100%', height: '100%' }} />;
}

// ═══════════════════════════════════════════════════════════════════
// BAZODIAC CONFIG PANEL — Planet Weight Editor
// ═══════════════════════════════════════════════════════════════════

function BazodiacConfigPanel({ bazState, onUpdate, version }: {
  bazState: BazodiacState;
  onUpdate: (s: BazodiacState) => void;
  version: number;
}) {
  const [tab, setTab] = useState<'planets' | 'quiz' | 'json'>('planets');
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');

  const panelStyle: React.CSSProperties = {
    position: 'absolute', top: '70px', right: '20px', zIndex: 20,
    width: '360px', maxHeight: 'calc(100vh - 140px)', overflowY: 'auto',
    background: 'rgba(8,8,18,0.92)', borderRadius: '12px',
    border: '1px solid rgba(220,160,20,0.25)', padding: '16px',
    fontFamily: '"SF Mono", "Fira Code", monospace', fontSize: '9px',
    backdropFilter: 'blur(12px)', color: 'rgba(200,200,220,0.8)',
  };
  const labelStyle: React.CSSProperties = { color: 'rgba(220,180,40,0.7)', fontSize: '8px', letterSpacing: '1px', marginBottom: '4px', textTransform: 'uppercase' as const };
  const sliderStyle: React.CSSProperties = { width: '100%', cursor: 'pointer', height: '4px' };
  const tabBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '5px 10px', borderRadius: '4px', border: 'none', cursor: 'pointer',
    background: active ? 'rgba(220,160,20,0.2)' : 'transparent',
    color: active ? 'rgba(220,180,40,0.9)' : 'rgba(120,130,150,0.6)',
    fontSize: '9px', fontFamily: 'inherit', letterSpacing: '1px',
  });

  const updateNatal = (planetId: string, val: number) => {
    const natal = new Map(bazState.natal);
    natal.set(planetId, val);
    onUpdate({ ...bazState, natal });
  };

  const updateQuiz = (dim: QuizDimension, val: number) => {
    const quiz = new Map(bazState.quiz);
    quiz.set(dim, val);
    onUpdate({ ...bazState, quiz });
  };

  const loadTestPreset = () => {
    onUpdate(createTestPreset());
  };

  const loadFlat = () => {
    const natal = new Map<string, number>();
    PLANETS.forEach(p => natal.set(p.id, 0.5));
    const quiz = new Map<QuizDimension, number>();
    QUIZ_DIMS.forEach(d => quiz.set(d, 0.5));
    onUpdate({ natal, quiz });
  };

  const weights = computeWeights(bazState.natal, bazState.quiz);

  const QUIZ_LABELS: Record<QuizDimension, string> = {
    empathy: '\u{1F497} Empathie',
    logic: '\u{1F9E0} Logik',
    creativity: '\u{1F3A8} Kreativit\u00e4t',
    discipline: '\u2694 Disziplin',
    intuition: '\u{1F52E} Intuition',
    assertion: '\u{1F525} Durchsetzung',
  };

  const exportJSON = () => {
    const obj = {
      natal: Object.fromEntries(bazState.natal),
      quiz: Object.fromEntries(bazState.quiz),
    };
    navigator.clipboard?.writeText(JSON.stringify(obj, null, 2));
    setJsonError('\u2713 Copied to clipboard');
    setTimeout(() => setJsonError(''), 2000);
  };

  const importJSON = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      const natal = new Map<string, number>(Object.entries(parsed.natal ?? {}));
      const quiz = new Map<QuizDimension, number>(Object.entries(parsed.quiz ?? {}) as [QuizDimension, number][]);
      onUpdate({ natal, quiz });
      setJsonError('');
      setJsonInput('');
    } catch (e: unknown) {
      setJsonError(e instanceof Error ? e.message : 'Parse error');
    }
  };

  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ color: 'rgba(220,180,40,0.9)', fontSize: '10px', letterSpacing: '2px' }}>BAZODIAC v{version}</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={loadTestPreset} style={{ ...tabBtnStyle(false), fontSize: '7px' }} title="Test-Preset laden">TEST</button>
          <button onClick={loadFlat} style={{ ...tabBtnStyle(false), fontSize: '7px' }} title="Neutral">FLAT</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', borderBottom: '1px solid rgba(80,90,120,0.2)', paddingBottom: '8px' }}>
        <button onClick={() => setTab('planets')} style={tabBtnStyle(tab === 'planets')}>PLANETEN</button>
        <button onClick={() => setTab('quiz')} style={tabBtnStyle(tab === 'quiz')}>QUIZ</button>
        <button onClick={() => setTab('json')} style={tabBtnStyle(tab === 'json')}>JSON</button>
      </div>

      {/* PLANETS TAB */}
      {tab === 'planets' && (
        <div>
          <div style={labelStyle}>Natal-Gewichte (0\u20131)</div>
          {PLANETS.map(planet => {
            const w = bazState.natal.get(planet.id) ?? 0.5;
            const finalW = weights.weights.get(planet.id) ?? 0;
            const tier = getTier(finalW);
            const tierLabel = ['Glow', 'Form', 'Geometrie', 'Fraktal'][tier];
            return (
              <div key={planet.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
                <span style={{ width: '70px', fontSize: '8px', color: planet.hexColor }}>
                  {planet.id}
                </span>
                <input type="range" min={0} max={100} value={Math.round(w * 100)}
                  onChange={e => updateNatal(planet.id, Number(e.target.value) / 100)}
                  style={{ ...sliderStyle, accentColor: planet.hexColor, flex: 1 }} />
                <span style={{ width: '28px', textAlign: 'right', fontSize: '8px', color: planet.hexColor }}>
                  {w.toFixed(2)}
                </span>
                <span style={{ width: '40px', textAlign: 'right', fontSize: '7px', color: 'rgba(180,190,210,0.4)' }}>
                  \u2192{finalW.toFixed(2)}
                </span>
                <span style={{ width: '55px', textAlign: 'right', fontSize: '7px', color: tier === 3 ? planet.hexColor : 'rgba(120,130,150,0.5)' }}>
                  T{tier} {tierLabel}
                </span>
              </div>
            );
          })}

          {/* Weight Summary */}
          <div style={{ marginTop: '12px', padding: '8px', borderRadius: '6px', background: 'rgba(20,20,40,0.5)', border: '1px solid rgba(80,90,120,0.2)' }}>
            <div style={labelStyle}>Gewichtete Signatur</div>
            <div style={{ fontSize: '8px', color: 'rgba(180,190,210,0.6)', lineHeight: 1.6 }}>
              Dominant: <span style={{ color: weights.dominant.hexColor }}>{weights.dominant.id}</span>
              {' \u00b7 '}Emergence: {weights.ranked.filter(r => r.weight >= 0.75).length} Fraktal-Planeten
              {' \u00b7 '}kFolds: {Math.max(3, Math.round(computeSpiroParams(weights.dominant.hz).n))}
            </div>
          </div>
        </div>
      )}

      {/* QUIZ TAB */}
      {tab === 'quiz' && (
        <div>
          <div style={labelStyle}>Quiz-Dimensionen (0\u20131, 0.5 = neutral)</div>
          {QUIZ_DIMS.map(dim => {
            const val = bazState.quiz.get(dim) ?? 0.5;
            return (
              <div key={dim} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
                <span style={{ width: '110px', fontSize: '8px', color: 'rgba(180,190,210,0.6)' }}>
                  {QUIZ_LABELS[dim]}
                </span>
                <input type="range" min={0} max={100} value={Math.round(val * 100)}
                  onChange={e => updateQuiz(dim, Number(e.target.value) / 100)}
                  style={{ ...sliderStyle, accentColor: '#14b4dc', flex: 1 }} />
                <span style={{ width: '28px', textAlign: 'right', fontSize: '8px', color: 'rgba(220,180,40,0.6)' }}>
                  {val.toFixed(2)}
                </span>
              </div>
            );
          })}
          <div style={{ marginTop: '8px', fontSize: '7px', color: 'rgba(120,130,150,0.4)' }}>
            Quiz-Werte modulieren die Natal-Gewichte. 0.5 = kein Einfluss.
          </div>
        </div>
      )}

      {/* JSON TAB */}
      {tab === 'json' && (
        <div>
          <div style={labelStyle}>Profil exportieren</div>
          <button onClick={exportJSON} style={{ ...tabBtnStyle(false), marginBottom: '8px', border: '1px solid rgba(220,160,20,0.3)', width: '100%' }}>
            {'\u{1F4CB}'} JSON IN CLIPBOARD KOPIEREN
          </button>
          <div style={labelStyle}>Profil importieren</div>
          <textarea
            value={jsonInput}
            onChange={e => setJsonInput(e.target.value)}
            placeholder='{"natal": {"Mars": 1.0, ...}, "quiz": {"empathy": 0.5, ...}}'
            style={{
              width: '100%', height: '120px', background: 'rgba(10,10,20,0.8)',
              border: '1px solid rgba(80,90,120,0.3)', borderRadius: '4px',
              color: 'rgba(200,200,220,0.7)', fontSize: '8px', fontFamily: 'inherit',
              padding: '6px', resize: 'vertical',
            }}
          />
          <button onClick={importJSON} style={{ ...tabBtnStyle(false), marginTop: '4px', border: '1px solid rgba(220,160,20,0.3)', width: '100%' }}>
            IMPORTIEREN
          </button>
          {jsonError && <div style={{ marginTop: '4px', fontSize: '8px', color: jsonError.startsWith('\u2713') ? 'rgba(100,220,100,0.7)' : 'rgba(255,100,100,0.7)' }}>{jsonError}</div>}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function FusionRingCanvas({
  natalWeights,
  quizWeights,
  isMini = false,
  showUI = false,
  revealProgress = 1.0,
  className,
}: FusionRingCanvasProps) {
  const [mounted, setMounted] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);
  const [activeEffect, setActiveEffect] = useState<EffectType>(null);
  const effectRef = useRef<EffectState | null>(null);
  const audioRef = useRef<FusionAudioEngine | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [showDataPanel, setShowDataPanel] = useState(false);
  const [bazVersion, setBazVersion] = useState(0);

  // Bazodiac state
  const bazStateRef = useRef<BazodiacState>({
    natal: new Map(
      natalWeights
        ? natalWeights instanceof Map
          ? Array.from(natalWeights.entries())
          : Object.entries(natalWeights)
        : Array.from(createTestPreset().natal.entries())
    ),
    quiz: new Map(
      quizWeights
        ? quizWeights instanceof Map
          ? Array.from(quizWeights.entries())
          : Object.entries(quizWeights)
        : Array.from(createTestPreset().quiz.entries())
    ) as any,
  });

  // Sync props to state ref
  useEffect(() => {
    if (natalWeights) {
      bazStateRef.current.natal = new Map(
        natalWeights instanceof Map
          ? Array.from(natalWeights.entries())
          : Object.entries(natalWeights)
      );
    }
    if (quizWeights) {
      bazStateRef.current.quiz = new Map(
        (quizWeights instanceof Map
          ? Array.from(quizWeights.entries())
          : Object.entries(quizWeights)) as any
      );
    }
    setBazVersion(v => v + 1);
    const rebuild = (window as any).__fusionRingRebuild;
    if (typeof rebuild === 'function') rebuild();
  }, [natalWeights, quizWeights]);

  // Legacy profile ref for InputController compatibility
  const profileRef = useRef<FusionRingProfile>(createDemoProfile());


  const updateBazState = useCallback((newState: BazodiacState) => {
    bazStateRef.current = newState;
    setBazVersion(v => v + 1);
    const rebuild = (window as any).__fusionRingRebuild;
    if (typeof rebuild === 'function') rebuild();
  }, []);

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
  const [manualIntensity, setManualIntensity] = useState(0.8);
  const [manualDuration, setManualDuration] = useState(4);
  const [manualSector, setManualSector] = useState(0);
  const [transitLog, setTransitLog] = useState<string[]>([]);

  useEffect(() => {
    const controller = new FusionRingInputController(profileRef.current);
    controller.onEffectTrigger((trigger) => {
      triggerEffect(trigger.type as EffectType, {
        intensity: trigger.intensity,
        duration: trigger.duration,
        sector: trigger.sector,
      });
      setTransitLog(prev => [...prev.slice(-9), `\u25b8 ${trigger.type} (I:${trigger.intensity.toFixed(2)}, S:${trigger.sector})`]);
    });
    inputControllerRef.current = controller;
    return () => { controller.destroy(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ingestTransitJSON = useCallback((json: string) => {
    try {
      const state = JSON.parse(json) as TransitStateV1;
      inputControllerRef.current?.ingestTransitState(state);
      setTransitLog(prev => [...prev.slice(-9), `\u2713 Transit State ingested (${state.events?.length ?? 0} events)`]);
    } catch (e: unknown) {
      setTransitLog(prev => [...prev.slice(-9), `\u2717 Parse error: ${e instanceof Error ? e.message : 'unknown'}`]);
    }
  }, []);

  const ingestQuizJSON = useCallback((json: string) => {
    try {
      const result = JSON.parse(json) as QuizClusterResult;
      inputControllerRef.current?.ingestQuizCluster(result);
      setTransitLog(prev => [...prev.slice(-9), `\u2713 Quiz Cluster ingested (${result.facettes?.length ?? 0} facettes)`]);
    } catch (e: unknown) {
      setTransitLog(prev => [...prev.slice(-9), `\u2717 Parse error: ${e instanceof Error ? e.message : 'unknown'}`]);
    }
  }, []);

  const loadDemoTransit = useCallback(() => {
    const demo = createDemoTransitState();
    inputControllerRef.current?.ingestTransitState(demo);
    setTransitLog(prev => [...prev.slice(-9), `\u2713 Demo Transit loaded (${demo.events.length} events)`]);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <div className="w-32 h-32 rounded-full border border-cyan-900/30 animate-pulse" />
      </div>
    );
  }

  if (!webglSupported) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
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
    <div className={className} style={{ width: '100%', height: '100%', background: '#08080e', position: 'relative', overflow: 'hidden' }}>
      <ThreeScene
        effectRef={effectRef}
        audioRef={audioRef}
        bazStateRef={bazStateRef}
        revealProgress={revealProgress}
        isMini={isMini}
      />

      {showUI && (
        <>
          {/* Effect Buttons */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
            padding: '16px 12px', gap: '8px', flexWrap: 'wrap', zIndex: 10,
            background: 'linear-gradient(to top, rgba(8,8,14,0.9) 0%, rgba(8,8,14,0.5) 60%, transparent 100%)',
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
                background: isActive ? `linear-gradient(135deg, ${config.borderColor}, rgba(8,8,14,0.8))` : 'rgba(10,10,20,0.7)',
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

      {/* Active Effect HUD */}
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
            \u25c6 {EFFECT_CONFIGS[activeEffect]!.label} \u25c6
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
        {showDataPanel ? '\u2715 CLOSE' : '\u25c8 DATA INPUT'}
      </button>

      {/* Config Panel Toggle */}
      <button
        onClick={() => setShowConfigPanel(v => !v)}
        style={{
          position: 'absolute', top: '20px', left: '160px', zIndex: 20,
          padding: '8px 14px', borderRadius: '8px',
          background: showConfigPanel ? 'rgba(220,160,20,0.15)' : 'rgba(10,10,20,0.6)',
          border: `1px solid ${showConfigPanel ? 'rgba(220,160,20,0.5)' : 'rgba(80,90,120,0.3)'}`,
          color: showConfigPanel ? 'rgba(220,180,40,0.9)' : 'rgba(120,130,150,0.6)',
          cursor: 'pointer', fontFamily: '"SF Mono", "Fira Code", monospace',
          fontSize: '9px', letterSpacing: '1.5px', fontWeight: 600,
          backdropFilter: 'blur(10px)', transition: 'all 0.3s ease',
        }}
      >
        {showConfigPanel ? '\u2715 CLOSE' : '\u2699 BAZODIAC'}
      </button>

      {/* Bazodiac Config Panel */}
      {showConfigPanel && (
        <BazodiacConfigPanel
          bazState={bazStateRef.current}
          onUpdate={updateBazState}
          version={bazVersion}
        />
      )}

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

          <div style={{ height: '1px', background: 'rgba(80,90,120,0.3)', margin: '12px 0' }} />

          {/* Transit State JSON Input */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '9px', letterSpacing: '2px', color: 'rgba(255,184,42,0.7)', marginBottom: '8px', fontWeight: 700 }}>
              CHANNEL A \u00b7 TRANSIT STATE
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

          <div style={{ height: '1px', background: 'rgba(80,90,120,0.3)', margin: '12px 0' }} />

          {/* Quiz Cluster JSON Input */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '9px', letterSpacing: '2px', color: 'rgba(42,255,90,0.7)', marginBottom: '8px', fontWeight: 700 }}>
              CHANNEL B \u00b7 QUIZ CLUSTER
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
    </>
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

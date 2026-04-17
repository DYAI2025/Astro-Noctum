import { useState, useEffect, useRef, useCallback } from 'react';
import type * as THREE_TYPES from 'three';
import { createFusionAudio, type FusionAudioEngine } from './fusion-ring-audio';
import {
  PLANETS,
  PLANET_MAP,
  ZODIAC_SIGNS,
  generateSignature,
  computeSpiroParams,
  createTestPreset,
  hash01,
  lerp,
  clamp,
  type BazodiacSignature,
  type BazodiacWeights,
  type BazParticle,
  type QuizDimension,
  type PlanetDef,
} from './bazodiac-engine';
import {
  createDemoProfile,
  createEmptySedimentationState,
  type FusionRingProfile,
} from './fusion-ring-profile';
import { computeDensityField, type DensityField as EngineDensityField } from '../signatur-v3/bipolar-engine';

// DebugInjection für DevUI-Overrides (Renderer-Schicht)
import { DebugInjection, isDebugMode } from '../../debug/debug-injection';
import type { DebugOverrides, DensityField } from '../../debug/types';

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
  clusterColorHex?: string;
}

// Palette constants for dark / bright theme modes (V2 uses deeper dark for richer bloom)
const V2_DARK_BG = 0x08080e as const;
const V2_BRIGHT_BG = 0xf1f5f9 as const;
const V2_DARK_SKY1 = 0x08080e as const;
const V2_DARK_SKY2 = 0x0a1020 as const;
const V2_DARK_SKY3 = 0x100818 as const;
const V2_BRIGHT_SKY1 = 0xf1f5f9 as const;
const V2_BRIGHT_SKY2 = 0xe2e8f0 as const;
const V2_BRIGHT_SKY3 = 0xf8fafc as const;

export interface FusionRingCanvasProps {
  natalWeights?: Record<string, number>;
  quizWeights?: Record<string, number>;
  isMini?: boolean;
  revealProgress?: number; // 0..1, used for onboarding reveal
  effectTrigger?: { type: string; color?: string; timestamp: number; intensity?: number } | null;
  solarModulation?: number; // 1.0–1.5, multiplied into particle intensity
  className?: string;
  /** Optional dissonance visual modulation from useDissonance() */
  dissonanceModulation?: import('../../lib/fusion-ring/dissonance-visual').VisualModulation | null;
  /** Called when WebGL is unavailable — caller should render a 2D fallback instead */
  onFailed?: () => void;
  /** Planetarium (dark) or Solar System (bright) theme. Default: true (dark). */
  planetariumMode?: boolean;
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
  solarModulation: number;
  dissonanceModulation?: import('../../lib/fusion-ring/dissonance-visual').VisualModulation | null;
}

function ThreeScene({ effectRef, audioRef, bazStateRef, revealProgress = 1.0, isMini = false, onPostProcessDegraded, planetariumMode = true }: {
  effectRef: React.MutableRefObject<EffectState | null>;
  audioRef: React.MutableRefObject<FusionAudioEngine | null>;
  bazStateRef: React.MutableRefObject<BazodiacState>;
  revealProgress?: number;
  isMini?: boolean;
  onPostProcessDegraded?: () => void;
  planetariumMode?: boolean;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const densityCanvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<import('three').WebGLRenderer | null>(null);
  const skyMatRef = useRef<import('three').ShaderMaterial | null>(null);

  // DebugInjection für Renderer-Overrides
  const debugOverridesRef = useRef<DebugOverrides>({});
  const currentSignatureRef = useRef<BazodiacSignature | null>(null);
  const polesRef = useRef<Array<{ dimensionId: string; pole: 'A' | 'B'; x: number; y: number; trail: Float32Array; trailLength: number; trailHead: number }>>([]);
  
  useEffect(() => {
    if (!isDebugMode()) return;
    const debug = DebugInjection.getInstance();
    const unsubscribe = debug.subscribe((state) => {
      debugOverridesRef.current = state.overrides;
      
      // Density Field berechnen wenn aktiviert
      if (state.overrides.showDensityField && densityCanvasRef.current && currentSignatureRef.current) {
        renderDensityField(densityCanvasRef.current, state.overrides.densityThreshold ?? 0.7);
      }
    });
    return unsubscribe;
  }, []);

  // Density Field rendern
  const renderDensityField = useCallback((canvas: HTMLCanvasElement, threshold: number) => {
    const ctx = canvas.getContext('2d');
    if (!ctx || !currentSignatureRef.current) return;

    // Simuliere Pole-States aus Signatur für Density-Field
    const mockPoles = polesRef.current.map(pole => ({
      ...pole,
      radius: 100,
      speed: 0.01,
      theta: 0,
    }));

    const config = { maxR: 200, maxTrailLength: 2000, trailPersistence: 0.85, timeScale: 1.0 };
    const field = computeDensityField(mockPoles as any, config, 128);

    const imageData = ctx.createImageData(128, 128);
    const data = imageData.data;

    for (let i = 0; i < field.grid.length; i++) {
      const density = field.grid[i] / (field.maxDensity || 1);
      const idx = i * 4;

      // Heatmap-Color: Blau (niedrig) → Gelb → Rot (hoch)
      data[idx] = Math.min(255, density * 3 * 255);     // R
      data[idx + 1] = Math.min(255, Math.max(0, (density - 0.33) * 3 * 255)); // G
      data[idx + 2] = Math.min(255, Math.max(0, (density - 0.66) * 3 * 255)); // B
      data[idx + 3] = 128; // Alpha
    }

    ctx.putImageData(imageData, 0, 0);
  }, []);

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
      } catch(e) {
        console.error('[FusionRing] Postprocessing imports failed, running without bloom:', e);
        onPostProcessDegraded?.();
      }

      // === CORE OBJECTS ===
      const container = canvasRef.current;
      const width = container?.clientWidth || window.innerWidth;
      const height = container?.clientHeight || window.innerHeight;
      const scene = new THREE.Scene();
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
      renderer.toneMappingExposure = 1.5;
      renderer.setClearColor(planetariumMode ? V2_DARK_BG : V2_BRIGHT_BG);
      rendererRef.current = renderer;
      canvasRef.current?.appendChild?.(renderer.domElement);
      
      let composer: any;
      let bloomPass: any;
      if (EffectComposer && RenderPass && UnrealBloomPass) {
        composer = new EffectComposer(renderer);
        const renderPass = new RenderPass(scene, camera);
        composer.addPass(renderPass);

        // Debug-Override für Bloom-Stärke (default: 0.35 — reduced from 0.55 per user feedback)
        const debugBloomStrength = isDebugMode() && debugOverridesRef.current.glowRadiusOverride
          ? (debugOverridesRef.current.glowRadiusOverride[0] / 30) * 1.2
          : 0.35;

        bloomPass = new UnrealBloomPass(
          new THREE.Vector2(width, height),
          debugBloomStrength,  // strength (wird später dynamisch angepasst)
          0.35,  // radius
          0.92   // threshold
        );
        composer.addPass(bloomPass);

        try {
          // Vignette pass — draws focus toward centre
          const SP = await import('three/examples/jsm/postprocessing/ShaderPass.js');
          const vignetteShader = {
            uniforms: { tDiffuse: { value: null }, darkness: { value: 0.6 }, offset: { value: 1.2 } },
            vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
            fragmentShader: `uniform sampler2D tDiffuse; uniform float darkness; uniform float offset; varying vec2 vUv; void main() { vec4 texel = texture2D(tDiffuse, vUv); vec2 uv = (vUv - 0.5) * 2.0; float vig = clamp(offset - dot(uv, uv) * darkness, 0.0, 1.0); gl_FragColor = vec4(texel.rgb * vig, texel.a); }`,
          };
          composer.addPass(new SP.ShaderPass(vignetteShader));
          const OP = await import('three/examples/jsm/postprocessing/OutputPass.js');
          composer.addPass(new OP.OutputPass());
        } catch (e) {
          console.error('[FusionRing] Postprocessing unavailable:', e);
          onPostProcessDegraded?.();
        }
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

            // Saturation boost — increase vibrancy without overexposing
            float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
            col = mix(vec3(lum), col, 1.5);

            gl_FragColor = vec4(col, vAlpha * glow);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      // Debug-Override: Additive Blend deaktivieren (zum Testen von Farb-Logik)
      if (isDebugMode()) {
        const debug = DebugInjection.getInstance();
        const overrides = debug.getOverrides();
        if (overrides.disableAdditiveBlend) {
          particleMat.blending = THREE.NormalBlending;
        }
        // Debug-Override: Fade-Alpha anpassen
        if (overrides.fadeAlphaOverride !== undefined) {
          particleMat.opacity = overrides.fadeAlphaOverride;
        }
      }

      const particleSystem = new THREE.Points(geometry, particleMat);
      ringGroup.add(particleSystem);

      // === ZODIAC RING SPRITES ===
      const zodiacSprites: THREE_TYPES.Sprite[] = [];
      function createZodiacRing() {
        // Remove old and dispose materials/textures to avoid leaks
        zodiacSprites.forEach(sprite => {
          // Dispose sprite material(s) and their maps
          const material = sprite.material as
            | THREE_TYPES.Material
            | THREE_TYPES.Material[]
            | undefined;

          const disposeMaterial = (mat: THREE_TYPES.Material | undefined) => {
            if (!mat) return;
            const anyMat = mat as THREE_TYPES.Material & {
              map?: THREE_TYPES.Texture | null;
            };
            if (anyMat.map) {
              anyMat.map.dispose();
              anyMat.map = null;
            }
            mat.dispose();
          };

          if (Array.isArray(material)) {
            material.forEach(m => disposeMaterial(m));
          } else {
            disposeMaterial(material);
          }

          ringGroup.remove(sprite);
        });
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
          uColor1: { value: new THREE.Color(planetariumMode ? V2_DARK_SKY1 : V2_BRIGHT_SKY1) },
          uColor2: { value: new THREE.Color(planetariumMode ? V2_DARK_SKY2 : V2_BRIGHT_SKY2) },
          uColor3: { value: new THREE.Color(planetariumMode ? V2_DARK_SKY3 : V2_BRIGHT_SKY3) },
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
      skyMatRef.current = bgMat;

      // ========================================
      // LOAD SIGNATURE INTO BUFFERS
      // ========================================
      function loadSignature(sig: BazodiacSignature) {
        currentSignature = sig;
        currentSignatureRef.current = sig; // Für Density-Field-Overlay
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
              sizeScale = 0.12;
              alphaScale = 0.6;
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

      // Window bridge for external rebuild
      (window as any).__fusionRingRebuild = rebuildFromState;

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
        const c = canvasRef.current;
        const w = c?.clientWidth || window.innerWidth;
        const h = c?.clientHeight || window.innerHeight;
        if (h <= 0) return;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();

        if (composer) {
          composer.setSize(w, h);
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
          renderer.toneMappingExposure = 1.5;
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
            renderer.toneMappingExposure = 1.5 + intensity * 1.5;
            const shake = intensity * 0.025;
            ringGroup.position.x = Math.sin(t * 35) * shake;
            ringGroup.position.z = Math.cos(t * 40) * shake;
            break;
          }
          case 'burst': {
            const attack = Math.min(1, progress / 0.12);
            const decay = progress > 0.35 ? Math.max(0, 1 - (progress - 0.35) / 0.65) : 1;
            // Secondary resonance oscillation after initial burst
            const resonancePhase = progress > 0.25 ? (progress - 0.25) / 0.75 : 0;
            const resonanceWave = resonancePhase > 0 ? Math.sin(resonancePhase * Math.PI * (3 + eff.intensity * 4)) * (1 - resonancePhase) : 0;
            const intensity = (attack * decay + resonanceWave * 0.3) * eff.intensity;
            displaceRadial(t, intensity * 0.8, true);
            // Use cluster color if available, fallback to gold
            const burstCol = eff.clusterColorHex ? new THREE.Color(eff.clusterColorHex) : new THREE.Color(0xffc83a);
            injectColor(-1, burstCol, intensity * 0.5);
            effectLight1.color.copy(burstCol);
            effectLight1.intensity = intensity * (5 + eff.intensity * 5);
            effectLight2.color.set(0xff8040);
            effectLight2.intensity = intensity * (3 + eff.intensity * 3);
            renderer.toneMappingExposure = 1.5 + intensity * (0.8 + eff.intensity * 0.8);
            const shake = intensity * (0.01 + eff.intensity * 0.015);
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
            renderer.toneMappingExposure = 1.5 - intensity * 0.3;
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

        // Debug-Override: Bloom-Stärke manuell überschreiben
        let bloomStrengthOverride: number | null = null;
        if (isDebugMode() && debugOverridesRef.current.glowRadiusOverride) {
          const [glowMin, glowMax] = debugOverridesRef.current.glowRadiusOverride;
          bloomStrengthOverride = (glowMin / 30) * 1.2;
        }

        // Emergence-driven bloom and material intensity
        if (bloomPass && currentSignature) {
          const emergenceVal = currentSignature.emergence.emergence;
          
          if (bloomStrengthOverride !== null) {
            // Debug-Override hat Vorrang
            bloomPass.strength = bloomStrengthOverride;
          } else {
            // Normale Berechnung
            bloomPass.strength = lerp(0.25, 0.55, emergenceVal);

            // Solar modulation — scale bloom strength by live space weather
            const solarMod = bazStateRef.current?.solarModulation ?? 1.0;
            if (solarMod > 1.0) {
              bloomPass.strength = bloomPass.strength * solarMod;
            }

            // Dissonance complexity modulation — fractalBoost lifts bloom
            const dMod = bazStateRef.current?.dissonanceModulation;
            if (dMod && dMod.fractalBoost > 0) {
              bloomPass.strength = bloomPass.strength * (1 + dMod.fractalBoost * 0.4);
            }
          }
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
          renderer.toneMappingExposure = 1.5;
          coreLight.intensity = 2.0;

          // Subtle exposure pulse during solar storms (Kp > ~4)
          if ((bazStateRef.current?.solarModulation ?? 1.0) > 1.05) {
            const pulse = 1 + Math.sin(t * 2) * 0.03 * ((bazStateRef.current?.solarModulation ?? 1.0) - 1);
            renderer.toneMappingExposure *= pulse;
          }
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
            // Dissonance texture modulation — add vibration on top of base yBreath
            const dMod2 = bazStateRef.current?.dissonanceModulation;
            if (dMod2 && dMod2.vibrationAmplitude > 0) {
              const amp = dMod2.vibrationAmplitude * 0.025;
              const flicker = dMod2.flickerRate > 0 ? dMod2.flickerRate : 1;
              if (dMod2.vibrationStyle === 'angular') {
                const frac = (t * flicker + phases[i]!) % 1.0;
                yBreath += amp * (2 * frac - 1);
              } else if (dMod2.vibrationStyle === 'organic') {
                yBreath += amp * Math.sin(t * flicker * Math.PI * 2 + phases[i]!);
              }
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
            bloomPass.strength = 0.7 + Math.sin(t * 0.5) * 0.2 * intensityBase;
            bloomPass.threshold = 0.2 + Math.sin(t * 0.3) * 0.1;
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

        // === EVENT LISTENER CLEANUP ===
        el.removeEventListener('wheel', onWheel);
        el.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        el.removeEventListener('touchstart', onTouchStart);
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
        window.removeEventListener('resize', onResize);

        // === THREE.JS RESOURCE CLEANUP ===
        // Dispose particle system
        geometry.dispose();
        particleMat.dispose();
        particleSystem.removeFromParent();

        // Dispose zodiac sprites with textures
        zodiacSprites.forEach(sprite => {
          const material = sprite.material as THREE_TYPES.SpriteMaterial;
          if (material?.map) {
            material.map.dispose();
            material.map = null;
          }
          material?.dispose();
          sprite.geometry?.dispose();
          ringGroup.remove(sprite);
        });
        zodiacSprites.length = 0;

        // Dispose dust
        dustGeo.dispose();
        dustMat.dispose();
        dust.removeFromParent();

        // Dispose sky dome
        bgGeo.dispose();
        bgMat.dispose();
        bgSphere.removeFromParent();

        // Dispose lights
        keyLight.removeFromParent();
        fillLight.removeFromParent();
        ambient.removeFromParent();
        coreLight.removeFromParent();
        effectLight1.removeFromParent();
        effectLight2.removeFromParent();

        // Dispose post-processing
        if (composer) {
          composer.dispose();
          composer = null;
        }
        if (bloomPass) {
          bloomPass.dispose();
          bloomPass = null;
        }

        // Dispose renderer
        renderer.dispose();
        renderer.forceContextLoss();
        rendererRef.current = null;
        skyMatRef.current = null;
        if (canvasRef.current?.contains?.(renderer.domElement)) {
          canvasRef.current.removeChild(renderer.domElement);
        }

        // Clear scene
        scene.clear();

        // Clear window bridge
        delete (window as any).__fusionRingRebuild;
      };
    };

    const cleanup = initScene();
    return () => { cleanup?.then?.((fn) => fn?.()); };
  }, []);

  // React to planetariumMode changes — update clearColor and sky dome uniforms reactively
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setClearColor(planetariumMode ? V2_DARK_BG : V2_BRIGHT_BG);
    }
    const mat = skyMatRef.current;
    if (mat) {
      mat.uniforms.uColor1.value.setHex(planetariumMode ? V2_DARK_SKY1 : V2_BRIGHT_SKY1);
      mat.uniforms.uColor2.value.setHex(planetariumMode ? V2_DARK_SKY2 : V2_BRIGHT_SKY2);
      mat.uniforms.uColor3.value.setHex(planetariumMode ? V2_DARK_SKY3 : V2_BRIGHT_SKY3);
    }
  }, [planetariumMode]);

  return (
    <div ref={canvasRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Density Field Overlay (nur im Debug-Modus sichtbar) */}
      <canvas
        ref={densityCanvasRef}
        width={128}
        height={128}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          opacity: 0.6,
          display: isDebugMode() && debugOverridesRef.current.showDensityField ? 'block' : 'none',
        }}
      />
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
  revealProgress = 1.0,
  effectTrigger,
  solarModulation = 1.0,
  className,
  dissonanceModulation,
  onFailed,
  planetariumMode = true,
}: FusionRingCanvasProps) {
  const [mounted, setMounted] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);
  const [postProcessDegraded, setPostProcessDegraded] = useState(false);
  const effectRef = useRef<EffectState | null>(null);
  const audioRef = useRef<FusionAudioEngine | null>(null);
  const [bazVersion, setBazVersion] = useState(0);

  // Bazodiac state
  const bazStateRef = useRef<BazodiacState>({
    natal: new Map(Object.entries(natalWeights || createTestPreset().natal)),
    quiz: new Map(Object.entries(quizWeights || createTestPreset().quiz).map(([k, v]) => [k as QuizDimension, v])),
    solarModulation,
  });

  const prevNatalRef = useRef<Record<string, number> | undefined>(undefined);
  const prevQuizRef = useRef<Record<string, number> | undefined>(undefined);

  // Sync props to state ref — skip rebuild when weights change by < threshold
  useEffect(() => {
    let needsRebuild = false;

    if (natalWeights) {
      const prev = prevNatalRef.current;
      const significantChange = !prev || Object.keys(natalWeights).some(
        k => Math.abs((natalWeights[k] ?? 0) - (prev[k] ?? 0)) >= 0.01
      );
      if (significantChange) {
        bazStateRef.current.natal = new Map(Object.entries(natalWeights));
        prevNatalRef.current = natalWeights;
        needsRebuild = true;
      }
    }
    if (quizWeights) {
      const prevQuiz = prevQuizRef.current;
      const quizChanged = !prevQuiz || Object.keys(quizWeights).some(
        k => Math.abs((quizWeights[k] ?? 0) - (prevQuiz[k] ?? 0)) >= 0.01
      );
      if (quizChanged) {
        bazStateRef.current.quiz = new Map(Object.entries(quizWeights).map(([k, v]) => [k as QuizDimension, v]));
        prevQuizRef.current = quizWeights;
        needsRebuild = true;
      }
    }
    bazStateRef.current.solarModulation = solarModulation;
    bazStateRef.current.dissonanceModulation = dissonanceModulation;

    if (needsRebuild) {
      setBazVersion(v => v + 1);
      const rebuild = ((window as unknown) as Record<string, unknown>).__fusionRingRebuild as (() => void) | undefined;
      if (typeof rebuild === 'function') rebuild();
    }
  }, [natalWeights, quizWeights, solarModulation, dissonanceModulation]);

  useEffect(() => {
    setMounted(true);
    const supported = isWebGLAvailable();
    setWebglSupported(supported);
    if (!supported) {
      onFailed?.();
    }
    audioRef.current = createFusionAudio();
    return () => {
      audioRef.current?.dispose();
      audioRef.current = null;
    };
  // onFailed is intentionally excluded — it's a callback ref, stable identity is caller's responsibility
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerEffect = useCallback((
    type: EffectType,
    options?: { intensity?: number; duration?: number; sector?: number }
  ) => {
    if (!type) return;
    const defaultDuration = type === 'divergenz_spike' ? 5 : type === 'burst' ? 3.5 : type === 'crunch' ? 4.5 : 4;
    const duration = options?.duration ?? defaultDuration;
    const intensity = Math.max(0, Math.min(1, options?.intensity ?? 1.0));
    const sector = options?.sector ?? 0;
    effectRef.current = { type, startTime: Date.now(), duration, intensity, sector };
  }, []);

  // External effect trigger via prop
  const lastTriggerRef = useRef<number>(0);
  useEffect(() => {
    if (!effectTrigger || effectTrigger.timestamp === lastTriggerRef.current) return;
    lastTriggerRef.current = effectTrigger.timestamp;
    const sig = effectTrigger.intensity ?? 0.7;
    triggerEffect(effectTrigger.type as EffectType, {
      intensity: 0.5 + sig * 0.5,    // 0.5–1.0 range scaled by significance
      duration: 2.0 + sig * 3.0,     // 2s–5s range — longer sustain for higher significance
    });
    // Inject cluster color into the effect state for tinted burst
    if (effectTrigger.color && effectRef.current) {
      effectRef.current.clusterColorHex = effectTrigger.color;
    }
  }, [effectTrigger, triggerEffect]);

  if (!mounted) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="w-32 h-32 rounded-full border border-cyan-900/30 animate-pulse" />
      </div>
    );
  }

  if (!webglSupported) {
    // When a parent registers onFailed it handles the fallback — render nothing here
    if (onFailed) return null;
    return (
      <div className={`bg-black flex items-center justify-center ${className ?? ''}`}>
        <FallbackRing />
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{ width: '100%', height: '100%', background: planetariumMode ? '#08080e' : '#f1f5f9', position: 'relative', overflow: 'hidden' }}
    >
      <ThreeScene
        effectRef={effectRef}
        audioRef={audioRef}
        bazStateRef={bazStateRef}
        revealProgress={revealProgress}
        isMini={isMini}
        onPostProcessDegraded={() => setPostProcessDegraded(true)}
        planetariumMode={planetariumMode}
      />

      {postProcessDegraded && (
        <div
          aria-label="Reduzierter Rendermodus aktiv"
          title="Bloom/Vignette konnten nicht geladen werden"
          style={{
            position: 'absolute', bottom: 8, left: 8,
            fontSize: '9px', color: 'rgba(255,200,100,0.6)',
            letterSpacing: '0.1em', pointerEvents: 'none',
          }}
        >
          REDUZIERTER MODUS
        </div>
      )}
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

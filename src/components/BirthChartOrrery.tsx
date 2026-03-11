// ═══════════════════════════════════════════════════════════════════════════════
// CELESTIAL ORRERY — Enhanced Edition for Astro-Noctum
// ✦ Bloom Post-Processing   ✦ Earth Day/Night Shader   ✦ Star Sprites
// ✦ Orbit Trails            ✦ Ekliptik-Band             ✦ Zodiak-Highlights
// ✦ Shooting Stars          ✦ Smooth Transition         ✦ Hover Raycasting
// Ported from 3DSolarSystem_animation reference implementation
// ═══════════════════════════════════════════════════════════════════════════════

import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { EffectComposer }  from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass }      from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass }      from 'three/examples/jsm/postprocessing/OutputPass.js';
import { Play, Pause }     from 'lucide-react';

import {
  PLANETS, STARS, CITIES, CONSTELLATION_LINES, CONSTELLATION_NAMES,
  SUN_RADIUS, ORBIT_SCALE,
} from '../lib/astronomy/data';
import {
  getPlanetPosition, solveKepler, daysSinceJ2000,
  equatorialToHorizontal, horizontalTo3D, eclipticToEquatorial,
  dateToJD, getLST,
} from '../lib/astronomy/calculations';
import {
  createSunMaterial, createPlanetMaterial, createAtmosphereShader,
  createSaturnRingsMaterial, createSkyDomeShader, createGroundShader,
  createMilkyWayBackground, updateMaterials,
  createEarthDayNightMaterial, updateEarthSunDirection, createStarSpriteTexture,
} from '../lib/3d/materials';
import type { StarData, HoveredObject, ViewMode } from '../lib/astronomy/types';
import { useCelestialOrrery } from '../hooks/useCelestialOrrery';
import { useLanguage } from '../contexts/LanguageContext';

// ─── Statische Lookups ────────────────────────────────────────────────────────
const STAR_MAP: Record<string, StarData> = {};
STARS.forEach(s => { STAR_MAP[s.name] = s; });

const ZODIAC_CONS = new Set([
  'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
  'Libra','Scorpius','Sagittarius','Capricornus','Aquarius','Pisces',
]);

interface ConLineMeta { star1: string; star2: string; con: string; zodiac: boolean; }
const CON_LINE_META: ConLineMeta[] = [];
Object.entries(CONSTELLATION_LINES).forEach(([con, pairs]) =>
  pairs.forEach(([s1, s2]) =>
    CON_LINE_META.push({ star1: s1, star2: s2, con, zodiac: ZODIAC_CONS.has(con) })
  )
);

// ─── Konstanten ───────────────────────────────────────────────────────────────
const PLAN_RADIUS      = 160;
const PLAN_CAM_Y       = 1.7;
const TRANSITION_SPEED = 3.5;
const ORBIT_STEPS      = 180;
const ECLIPTIC_STEPS   = 180;
const TRAIL_STEPS      = 54;

interface ShootingStar {
  line: THREE.Line; t: number; duration: number;
  az0: number; alt0: number; dAz: number; dAlt: number;
}

const ease = (t: number) => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3) / 2;

function makeCardinalSprite(label: string, color: string): THREE.Sprite {
  const C = document.createElement('canvas');
  C.width = C.height = 128;
  const ctx = C.getContext('2d')!;
  ctx.font = 'bold 64px sans-serif';
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 64, 64);
  return new THREE.Sprite(new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(C), transparent: true, opacity: 0.8, depthWrite: false,
  }));
}

function makeConNameSprite(text: string): THREE.Sprite {
  const C = document.createElement('canvas');
  C.width = 256; C.height = 64;
  const ctx = C.getContext('2d')!;
  ctx.font = '20px sans-serif';
  ctx.fillStyle = 'rgba(120,165,230,0.9)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text.toUpperCase(), 128, 32);
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(C), transparent: true, opacity: 0.75, depthWrite: false,
  }));
  spr.scale.set(16, 4, 1);
  return spr;
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface BirthChartOrreryProps {
  birthDate: Date;
  planetariumMode?: boolean;
  birthConstellation?: string;
  /** Auto-start time-lapse on mount (first visit experience) */
  autoPlay?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function BirthChartOrrery({
  birthDate,
  planetariumMode = false,
  birthConstellation,
  autoPlay = false,
}: BirthChartOrreryProps) {
  const { lang, t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);

  const hook = useCelestialOrrery(CITIES[0], birthDate);
  const {
    viewMode, simTime, observerLat, observerLon,
    showConstellations, showConstellationNames,
    sceneRef, cameraRef, rendererRef,
    setViewMode, setSimTime, isPlaying, speed,
    setIsPlaying, currentDate, setHoveredObject, hoveredObject,
  } = hook;

  // Sync planetariumMode prop → hook viewMode
  const viewModeRef = useRef<ViewMode>(planetariumMode ? 'planetarium' : 'orrery');
  useEffect(() => {
    const mode: ViewMode = planetariumMode ? 'planetarium' : 'orrery';
    viewModeRef.current = mode;
    setViewMode(mode);
  }, [planetariumMode, setViewMode]);

  // Sync birthDate → simTime
  useEffect(() => {
    setSimTime(daysSinceJ2000(birthDate));
    setIsPlaying(autoPlay);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [birthDate]);

  // ── Three.js Objekt-Refs ─────────────────────────────────────────────────
  const composerRef      = useRef<EffectComposer | null>(null);
  const planetMeshesRef  = useRef<Record<string, THREE.Mesh>>({});
  const orbitLinesRef    = useRef<Record<string, THREE.Line>>({});
  const orbitTrailsRef   = useRef<Record<string, THREE.Line>>({});
  const saturnRingsRef   = useRef<THREE.Mesh | null>(null);
  const sunMaterialRef   = useRef<THREE.ShaderMaterial | null>(null);
  const earthMatRef      = useRef<THREE.ShaderMaterial | null>(null);
  const orreryGroupRef   = useRef<THREE.Group | null>(null);

  // Planetarium
  const planGroupRef      = useRef<THREE.Group | null>(null);
  const starObjectsRef    = useRef<Record<string, THREE.Object3D>>({});
  const conLinesRef       = useRef<THREE.Line[]>([]);
  const conNameSpritesRef = useRef<Record<string, THREE.Sprite>>({});
  const planetSkyRef      = useRef<Record<string, THREE.Mesh>>({});
  const eclipticLineRef   = useRef<THREE.Line | null>(null);

  // Shooting Stars
  const shootingStarsRef    = useRef<ShootingStar[]>([]);
  const elapsedRef          = useRef(0);
  const nextShootingStarRef = useRef(6 + Math.random() * 8);

  // Animation loop refs
  const simTimeRef     = useRef(daysSinceJ2000(birthDate));
  const obsLatRef      = useRef(observerLat);
  const obsLonRef      = useRef(observerLon);
  const showConRef     = useRef(true);
  const showConNRef    = useRef(true);
  const showOrbitsRef  = useRef(true);
  const isPlayingRef   = useRef(false);
  const speedRef       = useRef(speed);

  // Camera
  const sph  = useRef({ theta: Math.PI / 4, phi: Math.PI / 3, radius: 160 });
  const sphT = useRef({ theta: Math.PI / 4, phi: Math.PI / 3, radius: 160 });
  const planLook = useRef({ azimuth: 180, altitude: 25 });

  // Mouse
  const isDragging = useRef(false);
  const lastMouse  = useRef({ x: 0, y: 0 });
  const mouseNorm  = useRef({ x: 0, y: 0 });

  // Transition
  const transitionT = useRef(planetariumMode ? 1 : 0);

  // Callback refs
  const setHoveredRef = useRef(setHoveredObject);
  useEffect(() => { setHoveredRef.current = setHoveredObject; });

  // Ref syncs
  useEffect(() => { simTimeRef.current    = simTime; },          [simTime]);
  useEffect(() => { obsLatRef.current     = observerLat; },      [observerLat]);
  useEffect(() => { obsLonRef.current     = observerLon; },      [observerLon]);
  useEffect(() => { showConRef.current    = showConstellations; },[showConstellations]);
  useEffect(() => { showConNRef.current   = showConstellationNames; },[showConstellationNames]);
  useEffect(() => { isPlayingRef.current  = isPlaying; },        [isPlaying]);
  useEffect(() => { speedRef.current      = speed; },            [speed]);

  // ═══════════════════════════════════════════════════════════════════════════
  // THREE.JS INIT
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const W  = el.clientWidth;
    const H  = el.clientHeight;

    // ── Scene / Camera / Renderer ──────────────────────────────────────────
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 10000);
    camera.position.set(100, 80, 100);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
    renderer.toneMapping       = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    el.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ── Bloom Post-Processing ──────────────────────────────────────────────
    const composer   = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), 0.75, 0.55, 0.18));
    composer.addPass(new OutputPass());
    composerRef.current = composer;

    // ════════════════════════════════════════════════════════════════════════
    // ORRERY GRUPPE
    // ════════════════════════════════════════════════════════════════════════
    const orreryGroup = new THREE.Group();
    orreryGroupRef.current = orreryGroup;
    scene.add(orreryGroup);

    // Beleuchtung
    const sunLight = new THREE.PointLight('#FFF8EE', 3.5, 1200);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    scene.add(sunLight);
    scene.add(new THREE.AmbientLight('#222233', 0.25));
    scene.add(new THREE.HemisphereLight('#3355AA', '#110A22', 0.45));

    // Sonne
    const sunMat = createSunMaterial();
    sunMaterialRef.current = sunMat;
    const sun = new THREE.Mesh(new THREE.SphereGeometry(SUN_RADIUS, 64, 64), sunMat);
    sun.userData = { type: 'sun', name: 'Sonne' };
    orreryGroup.add(sun);

    // Glow
    ([
      { scale: 1.3, color: '#FFE4B5', opacity: 0.50 },
      { scale: 1.7, color: '#FFD700', opacity: 0.22 },
      { scale: 2.2, color: '#FFA500', opacity: 0.12 },
      { scale: 2.8, color: '#FF6B35', opacity: 0.05 },
    ] as const).forEach(({ scale, color, opacity }) => {
      orreryGroup.add(new THREE.Mesh(
        new THREE.SphereGeometry(SUN_RADIUS * scale, 32, 32),
        new THREE.MeshBasicMaterial({
          color, transparent: true, opacity,
          side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false,
        }),
      ));
    });

    // ── Planeten ───────────────────────────────────────────────────────────
    Object.entries(PLANETS).forEach(([key, planet]) => {
      let mat: THREE.Material;
      if (key === 'earth') {
        const earthMat = createEarthDayNightMaterial();
        earthMatRef.current = earthMat;
        mat = earthMat;
      } else {
        mat = createPlanetMaterial(planet.color, 0.15, 0.65, 0.15);
      }

      const mesh = new THREE.Mesh(new THREE.SphereGeometry(planet.radius, 48, 48), mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { type: 'planet', key, name: planet.name, symbol: planet.symbol, color: planet.color };
      orreryGroup.add(mesh);
      planetMeshesRef.current[key] = mesh;

      // Atmosphere
      if (['jupiter','saturn','uranus','neptune'].includes(key)) {
        mesh.add(new THREE.Mesh(
          new THREE.SphereGeometry(planet.radius * 1.12, 16, 16),
          createAtmosphereShader(planet.color, 0.55),
        ));
      }
      if (key === 'earth') {
        mesh.add(new THREE.Mesh(
          new THREE.SphereGeometry(planet.radius * 1.08, 16, 16),
          createAtmosphereShader('#6AAEED', 0.85),
        ));
      }

      // Saturn Rings
      if (planet.rings) {
        const rings = new THREE.Mesh(
          new THREE.RingGeometry(planet.radius * 1.4, planet.radius * 2.2, 128),
          createSaturnRingsMaterial(),
        );
        rings.rotation.x = Math.PI / 2.5;
        rings.castShadow = rings.receiveShadow = true;
        scene.add(rings);
        saturnRingsRef.current = rings;
      }

      // Orbit Ellipse
      const orbitPts: THREE.Vector3[] = [];
      for (let s = 0; s <= ORBIT_STEPS; s++) {
        const M_s = (s / ORBIT_STEPS) * 2 * Math.PI;
        const E_s = solveKepler(M_s, planet.e);
        const nu  = 2 * Math.atan2(
          Math.sqrt(1 + planet.e) * Math.sin(E_s / 2),
          Math.sqrt(1 - planet.e) * Math.cos(E_s / 2),
        );
        const r_s = planet.a * (1 - planet.e * Math.cos(E_s));
        const xO = r_s * Math.cos(nu), yO = r_s * Math.sin(nu);
        const iR = planet.i * Math.PI / 180, oR = planet.omega * Math.PI / 180, wR = planet.w * Math.PI / 180;
        const cO = Math.cos(oR), sO = Math.sin(oR), cW = Math.cos(wR), sW = Math.sin(wR);
        const cI = Math.cos(iR), sI = Math.sin(iR);
        const x = (cO*cW - sO*sW*cI)*xO + (-cO*sW - sO*cW*cI)*yO;
        const y = (sO*cW + cO*sW*cI)*xO + (-sO*sW + cO*cW*cI)*yO;
        const z = sW*sI*xO + cW*sI*yO;
        const sc = r_s > 0 ? Math.log10(r_s + 1) * ORBIT_SCALE / r_s : 0;
        orbitPts.push(new THREE.Vector3(x*sc, z*sc, -y*sc));
      }
      const orbitLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(orbitPts),
        new THREE.LineBasicMaterial({ color: planet.color, transparent: true, opacity: 0.18 }),
      );
      orreryGroup.add(orbitLine);
      orbitLinesRef.current[key] = orbitLine;

      // Orbit Trail
      const trailGeo = new THREE.BufferGeometry();
      trailGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array((TRAIL_STEPS+1)*3), 3));
      trailGeo.setAttribute('color',    new THREE.Float32BufferAttribute(new Float32Array((TRAIL_STEPS+1)*3), 3));
      const trailLine = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({
        vertexColors: true, transparent: true, opacity: 0.85,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      orreryGroup.add(trailLine);
      orbitTrailsRef.current[key] = trailLine;
    });

    // ── Background Stars ───────────────────────────────────────────────────
    const bgPos: number[] = [];
    for (let i = 0; i < 6000; i++) {
      const t = Math.random() * Math.PI * 2;
      const p = Math.acos(2 * Math.random() - 1);
      const r = 450 + Math.random() * 350;
      bgPos.push(r*Math.sin(p)*Math.cos(t), r*Math.sin(p)*Math.sin(t), r*Math.cos(p));
    }
    const bgGeo = new THREE.BufferGeometry();
    bgGeo.setAttribute('position', new THREE.Float32BufferAttribute(bgPos, 3));
    scene.add(new THREE.Points(bgGeo, new THREE.PointsMaterial({
      color: '#FFFFFF', size: 0.9, transparent: true, opacity: 0.65, sizeAttenuation: true,
    })));
    createMilkyWayBackground(scene);

    // ════════════════════════════════════════════════════════════════════════
    // PLANETARIUM GRUPPE
    // ════════════════════════════════════════════════════════════════════════
    const planGroup = new THREE.Group();
    planGroupRef.current = planGroup;
    planGroup.visible = transitionT.current > 0.05;
    scene.add(planGroup);

    // Sky Dome
    planGroup.add(new THREE.Mesh(new THREE.SphereGeometry(PLAN_RADIUS, 64, 64), createSkyDomeShader()));

    // Ground
    const ground = new THREE.Mesh(new THREE.CircleGeometry(PLAN_RADIUS * 0.98, 128), createGroundShader());
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    planGroup.add(ground);

    // Horizon Ring
    const horizRing = new THREE.Mesh(
      new THREE.RingGeometry(PLAN_RADIUS * 0.965, PLAN_RADIUS * 0.975, 128),
      new THREE.MeshBasicMaterial({ color: '#1E4060', transparent: true, opacity: 0.55, side: THREE.DoubleSide }),
    );
    horizRing.rotation.x = -Math.PI / 2;
    planGroup.add(horizRing);

    // Ecliptic Line
    const eclGeo  = new THREE.BufferGeometry().setFromPoints(
      Array.from({ length: ECLIPTIC_STEPS + 1 }, () => new THREE.Vector3()),
    );
    const eclLine = new THREE.Line(eclGeo, new THREE.LineBasicMaterial({
      color: '#886622', transparent: true, opacity: 0.45,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    eclLine.visible = false;
    planGroup.add(eclLine);
    eclipticLineRef.current = eclLine;

    // Star Sprites
    STARS.forEach(star => {
      const tex = createStarSpriteTexture(star.mag);
      const spr = new THREE.Sprite(new THREE.SpriteMaterial({
        map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      const size = Math.max(1.8, 6.5 - star.mag * 1.1);
      spr.scale.set(size, size, 1);
      spr.userData = { type: 'star', name: star.name, mag: star.mag, con: star.con, ra: star.ra, dec: star.dec };
      spr.visible = false;
      planGroup.add(spr);
      starObjectsRef.current[star.name] = spr;
    });

    // Planet sky markers
    Object.entries(PLANETS).forEach(([key, planet]) => {
      const sz = Math.max(0.3, planet.radius * 0.38);
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(sz, 12, 12),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(planet.color) }),
      );
      mesh.userData = { type: 'planet', key, name: planet.name, symbol: planet.symbol, color: planet.color, ra: 0, dec: 0 };
      mesh.visible = false;
      mesh.add(new THREE.Mesh(
        new THREE.SphereGeometry(sz * 3.0, 8, 8),
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(planet.color),
          transparent: true, opacity: 0.20, side: THREE.BackSide,
          blending: THREE.AdditiveBlending, depthWrite: false,
        }),
      ));
      planGroup.add(mesh);
      planetSkyRef.current[key] = mesh;
    });

    // Constellation Lines — Zodiac golden, others blue
    CON_LINE_META.forEach(meta => {
      const color = meta.zodiac ? '#C8930A' : '#1E4488';
      const line  = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
        new THREE.LineBasicMaterial({ color, transparent: true, opacity: meta.zodiac ? 0.50 : 0.35 }),
      );
      line.visible = false;
      planGroup.add(line);
      conLinesRef.current.push(line);
    });

    // Constellation name sprites
    Object.keys(CONSTELLATION_NAMES).forEach(conKey => {
      const spr = makeConNameSprite(CONSTELLATION_NAMES[conKey]);
      spr.visible = false;
      planGroup.add(spr);
      conNameSpritesRef.current[conKey] = spr;
    });

    // Cardinal directions
    ([
      { label: 'N', az: 0,   color: '#7799FF' },
      { label: 'O', az: 90,  color: '#99AABB' },
      { label: 'S', az: 180, color: '#99AABB' },
      { label: 'W', az: 270, color: '#99AABB' },
    ] as const).forEach(({ label, az, color }) => {
      const spr = makeCardinalSprite(label, color);
      const p   = horizontalTo3D(3, az, PLAN_RADIUS * 0.91);
      spr.position.set(p.x, p.y, p.z);
      planGroup.add(spr);
    });

    // ════════════════════════════════════════════════════════════════════════
    // MOUSE & INPUT
    // ════════════════════════════════════════════════════════════════════════
    const onMouseDown  = (e: MouseEvent) => { isDragging.current = true; lastMouse.current = { x: e.clientX, y: e.clientY }; };
    const onMouseUp    = () => { isDragging.current = false; };
    const onMouseLeave = () => { isDragging.current = false; setHoveredRef.current(null); };
    const onMouseMove  = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      mouseNorm.current = {
        x:  ((e.clientX - rect.left) / rect.width)  * 2 - 1,
        y: -((e.clientY - rect.top)  / rect.height) * 2 + 1,
      };
      if (!isDragging.current) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      if (viewModeRef.current === 'orrery') {
        sphT.current.theta -= dx * 0.005;
        sphT.current.phi = Math.max(0.1, Math.min(Math.PI - 0.1, sphT.current.phi + dy * 0.005));
      } else if (viewModeRef.current === 'planetarium') {
        planLook.current.azimuth  = (planLook.current.azimuth - dx * 0.20 + 360) % 360;
        planLook.current.altitude = Math.max(-5, Math.min(88, planLook.current.altitude - dy * 0.15));
      }
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (viewModeRef.current !== 'orrery') return;
      sphT.current.radius = Math.max(25, Math.min(600, sphT.current.radius + e.deltaY * 0.25));
    };

    el.addEventListener('mousedown',  onMouseDown);
    el.addEventListener('mouseup',    onMouseUp);
    el.addEventListener('mouseleave', onMouseLeave);
    el.addEventListener('mousemove',  onMouseMove);
    el.addEventListener('wheel',      onWheel, { passive: false });

    // ── Touch events (mobile) ────────────────────────────────────────────
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging.current = true;
        lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };
    const onTouchEnd = () => { isDragging.current = false; };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current || e.touches.length !== 1) return;
      e.preventDefault();
      const dx = e.touches[0].clientX - lastMouse.current.x;
      const dy = e.touches[0].clientY - lastMouse.current.y;
      lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      if (viewModeRef.current === 'orrery') {
        sphT.current.theta -= dx * 0.005;
        sphT.current.phi = Math.max(0.1, Math.min(Math.PI - 0.1, sphT.current.phi + dy * 0.005));
      } else if (viewModeRef.current === 'planetarium') {
        planLook.current.azimuth  = (planLook.current.azimuth - dx * 0.20 + 360) % 360;
        planLook.current.altitude = Math.max(-5, Math.min(88, planLook.current.altitude - dy * 0.15));
      }
    };
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend',   onTouchEnd);
    el.addEventListener('touchmove',  onTouchMove, { passive: false });

    // ════════════════════════════════════════════════════════════════════════
    // ANIMATION LOOP
    // ════════════════════════════════════════════════════════════════════════
    const ray   = new THREE.Raycaster();
    const clock = new THREE.Clock();
    let raf: number;

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      elapsedRef.current += dt;

      updateMaterials(dt, sunMaterialRef.current ?? undefined);

      // Earth Day/Night
      if (earthMatRef.current && planetMeshesRef.current['earth']) {
        updateEarthSunDirection(earthMatRef.current, planetMeshesRef.current['earth'].position);
      }

      // Time simulation
      if (isPlayingRef.current) {
        simTimeRef.current += dt * speedRef.current / 86400;
      }

      // Update planet positions
      Object.entries(PLANETS).forEach(([key, planet]) => {
        const mesh = planetMeshesRef.current[key];
        if (!mesh) return;
        const pos = getPlanetPosition(planet, simTimeRef.current, ORBIT_SCALE);
        mesh.position.set(pos.x, pos.y, pos.z);
        if (key === 'saturn' && saturnRingsRef.current) {
          saturnRingsRef.current.position.set(pos.x, pos.y, pos.z);
        }
      });

      // Orbit Trails
      const trailCol = new THREE.Color();
      Object.entries(PLANETS).forEach(([key, planet]) => {
        const trail = orbitTrailsRef.current[key];
        if (!trail) return;
        const TRAIL_DAYS = Math.min(planet.period * 0.15, 365);
        const positions = new Float32Array((TRAIL_STEPS + 1) * 3);
        const colors    = new Float32Array((TRAIL_STEPS + 1) * 3);
        trailCol.set(planet.color);
        for (let step = 0; step <= TRAIL_STEPS; step++) {
          const t_trail = simTimeRef.current - (TRAIL_STEPS - step) / TRAIL_STEPS * TRAIL_DAYS;
          const p = getPlanetPosition(planet, t_trail, ORBIT_SCALE);
          positions[step*3] = p.x; positions[step*3+1] = p.y; positions[step*3+2] = p.z;
          const alpha = (step / TRAIL_STEPS) * 0.75;
          colors[step*3] = trailCol.r*alpha; colors[step*3+1] = trailCol.g*alpha; colors[step*3+2] = trailCol.b*alpha;
        }
        trail.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        trail.geometry.setAttribute('color',    new THREE.Float32BufferAttribute(colors, 3));
      });

      // ── Transition ──────────────────────────────────────────────────────
      const targetT = viewModeRef.current === 'planetarium' ? 1.0 : 0.0;
      transitionT.current += (targetT - transitionT.current) * Math.min(1, dt * TRANSITION_SPEED);
      const tE = ease(Math.max(0, Math.min(1, transitionT.current)));

      if (orreryGroupRef.current) orreryGroupRef.current.visible = tE < 0.68;
      if (planGroupRef.current)   planGroupRef.current.visible   = tE > 0.32;
      if (saturnRingsRef.current) saturnRingsRef.current.visible = tE < 0.68;

      // ── Camera ──────────────────────────────────────────────────────────
      const s = sph.current, st = sphT.current;
      s.theta  += (st.theta  - s.theta)  * 0.08;
      s.phi    += (st.phi    - s.phi)    * 0.08;
      s.radius += (st.radius - s.radius) * 0.08;

      const orreyPos = new THREE.Vector3(
        s.radius * Math.sin(s.phi) * Math.cos(s.theta),
        s.radius * Math.cos(s.phi),
        s.radius * Math.sin(s.phi) * Math.sin(s.theta),
      );
      const planPos = new THREE.Vector3(0, PLAN_CAM_Y, 0);
      camera.position.lerpVectors(orreyPos, planPos, tE);

      const look = planLook.current;
      const lookPt   = horizontalTo3D(look.altitude, look.azimuth, 50);
      const planTgt  = new THREE.Vector3(lookPt.x, PLAN_CAM_Y + lookPt.y, lookPt.z);
      const orreyTgt = new THREE.Vector3(0, 0, 0);
      camera.lookAt(orreyTgt.clone().lerp(planTgt, tE));

      // Orbit line visibility
      Object.values(orbitLinesRef.current).forEach(l => { if (l) l.visible = showOrbitsRef.current && tE < 0.55; });
      Object.values(orbitTrailsRef.current).forEach(l => { if (l) l.visible = tE < 0.55; });

      // ── Planetarium Sky ─────────────────────────────────────────────────
      if (tE > 0.32) {
        const jd  = dateToJD(currentDate);
        const lst = getLST(jd, obsLonRef.current);

        // Stars
        STARS.forEach(star => {
          const obj = starObjectsRef.current[star.name];
          if (!obj) return;
          const horiz = equatorialToHorizontal(star.ra, star.dec, obsLatRef.current, lst);
          if (horiz.altitude < -4) { obj.visible = false; return; }
          obj.visible = true;
          const p = horizontalTo3D(Math.max(horiz.altitude, 0.2), horiz.azimuth, PLAN_RADIUS * 0.94);
          obj.position.set(p.x, p.y, p.z);
        });

        // Constellation lines
        CON_LINE_META.forEach((meta, i) => {
          const line = conLinesRef.current[i];
          if (!line) return;
          const o1 = starObjectsRef.current[meta.star1];
          const o2 = starObjectsRef.current[meta.star2];
          if (!o1?.visible || !o2?.visible) { line.visible = false; return; }
          line.visible = showConRef.current;
          const arr = new Float32Array([
            o1.position.x, o1.position.y, o1.position.z,
            o2.position.x, o2.position.y, o2.position.z,
          ]);
          line.geometry.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
        });

        // Constellation names
        Object.entries(CONSTELLATION_LINES).forEach(([conKey, pairs]) => {
          const spr = conNameSpritesRef.current[conKey];
          if (!spr) return;
          if (!showConNRef.current) { spr.visible = false; return; }
          let cx = 0, cy = 0, cz = 0, cnt = 0;
          const names = new Set<string>();
          pairs.forEach(([s1, s2]) => { names.add(s1); names.add(s2); });
          names.forEach(name => {
            const o = starObjectsRef.current[name];
            if (o?.visible) { cx += o.position.x; cy += o.position.y; cz += o.position.z; cnt++; }
          });
          if (cnt < 2) { spr.visible = false; return; }
          cx /= cnt; cy /= cnt; cz /= cnt;
          const len = Math.sqrt(cx*cx + cy*cy + cz*cz);
          const r   = PLAN_RADIUS * 0.87;
          spr.position.set(cx/len*r, Math.max(cy/len*r, 4), cz/len*r);
          spr.visible = true;
        });

        // Ecliptic Line
        if (eclipticLineRef.current) {
          const eclPts: number[] = [];
          for (let step = 0; step <= ECLIPTIC_STEPS; step++) {
            const lonRad = (step / ECLIPTIC_STEPS) * 360 * Math.PI / 180;
            const { ra, dec } = eclipticToEquatorial(Math.cos(lonRad), Math.sin(lonRad), 0);
            const horiz = equatorialToHorizontal(ra, dec, obsLatRef.current, lst);
            if (horiz.altitude > -3) {
              const p = horizontalTo3D(Math.max(horiz.altitude, 0.1), horiz.azimuth, PLAN_RADIUS * 0.88);
              eclPts.push(p.x, p.y, p.z);
            }
          }
          if (eclPts.length > 0) {
            eclipticLineRef.current.geometry.setAttribute(
              'position', new THREE.Float32BufferAttribute(eclPts, 3),
            );
            eclipticLineRef.current.visible = true;
          }
        }

        // Planets on sky
        Object.entries(PLANETS).forEach(([key, planet]) => {
          const marker = planetSkyRef.current[key];
          if (!marker) return;
          const { a, e, i, omega, w, M0, period } = planet;
          const n = (2 * Math.PI) / period;
          const M_p = ((M0 * Math.PI / 180) + n * simTimeRef.current) % (2 * Math.PI);
          const E_p = solveKepler(M_p, e);
          const nu  = 2 * Math.atan2(Math.sqrt(1+e)*Math.sin(E_p/2), Math.sqrt(1-e)*Math.cos(E_p/2));
          const r_p = a * (1 - e * Math.cos(E_p));
          const xO = r_p * Math.cos(nu), yO = r_p * Math.sin(nu);
          const iR = i*Math.PI/180, oR = omega*Math.PI/180, wR = w*Math.PI/180;
          const cO=Math.cos(oR), sO=Math.sin(oR), cW=Math.cos(wR), sW=Math.sin(wR), cI=Math.cos(iR), sI=Math.sin(iR);
          const xE = (cO*cW - sO*sW*cI)*xO + (-cO*sW - sO*cW*cI)*yO;
          const yE = (sO*cW + cO*sW*cI)*xO + (-sO*sW + cO*cW*cI)*yO;
          const zE = sW*sI*xO + cW*sI*yO;
          const { ra, dec } = eclipticToEquatorial(xE, yE, zE);
          marker.userData.ra = ra;
          marker.userData.dec = dec;
          const horiz = equatorialToHorizontal(ra, dec, obsLatRef.current, lst);
          if (horiz.altitude < -4) { marker.visible = false; return; }
          marker.visible = true;
          const p = horizontalTo3D(Math.max(horiz.altitude, 0.2), horiz.azimuth, PLAN_RADIUS * 0.91);
          marker.position.set(p.x, p.y, p.z);
        });
      }

      // ── Shooting Stars ──────────────────────────────────────────────────
      if (viewModeRef.current === 'planetarium' && planGroupRef.current && tE > 0.8) {
        if (elapsedRef.current > nextShootingStarRef.current) {
          const az0 = Math.random()*360, alt0 = 25+Math.random()*55;
          const dAz = (Math.random()-0.5)*70, dAlt = -(12+Math.random()*30);
          const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
          const mat = new THREE.LineBasicMaterial({
            color: '#FFFFFF', transparent: true, opacity: 0,
            blending: THREE.AdditiveBlending, depthWrite: false,
          });
          const line = new THREE.Line(geo, mat);
          planGroupRef.current.add(line);
          shootingStarsRef.current.push({ line, t: 0, duration: 0.5+Math.random()*0.5, az0, alt0, dAz, dAlt });
          nextShootingStarRef.current = elapsedRef.current + 7 + Math.random() * 14;
        }
        shootingStarsRef.current = shootingStarsRef.current.filter(ss => {
          ss.t += dt / ss.duration;
          if (ss.t >= 1) {
            planGroupRef.current?.remove(ss.line);
            ss.line.geometry.dispose();
            (ss.line.material as THREE.Material).dispose();
            return false;
          }
          const opacity = ss.t < 0.15 ? ss.t / 0.15 : Math.max(0, 1 - (ss.t - 0.15) / 0.85);
          (ss.line.material as THREE.LineBasicMaterial).opacity = opacity * 0.88;
          const h_az = ss.az0 + ss.t * ss.dAz;
          const h_alt = ss.alt0 + ss.t * ss.dAlt;
          const tf = Math.min(ss.t, 0.18);
          const t_az = ss.az0 + (ss.t - tf) * ss.dAz;
          const t_alt = ss.alt0 + (ss.t - tf) * ss.dAlt;
          if (h_alt < -3) { (ss.line.material as THREE.LineBasicMaterial).opacity = 0; return true; }
          const p1 = horizontalTo3D(Math.max(h_alt, 0.1), h_az, PLAN_RADIUS * 0.92);
          const p2 = horizontalTo3D(Math.max(t_alt, 0.1), t_az, PLAN_RADIUS * 0.92);
          ss.line.geometry.setAttribute('position', new THREE.Float32BufferAttribute(
            new Float32Array([p1.x, p1.y, p1.z, p2.x, p2.y, p2.z]), 3,
          ));
          return true;
        });
      }

      // ── Raycasting ──────────────────────────────────────────────────────
      ray.setFromCamera(new THREE.Vector2(mouseNorm.current.x, mouseNorm.current.y), camera);
      let hovered: HoveredObject | null = null;
      const rect = el.getBoundingClientRect();

      if (viewModeRef.current === 'orrery' && tE < 0.35) {
        const hits = ray.intersectObjects(Object.values(planetMeshesRef.current), false);
        if (hits.length > 0) {
          const obj = hits[0].object;
          const sp  = obj.position.clone().project(camera);
          hovered = {
            name: obj.userData.name, type: 'planet', altitude: 0, azimuth: 0,
            symbol: obj.userData.symbol, color: obj.userData.color,
            screenX: (sp.x+1)/2*rect.width, screenY: (-sp.y+1)/2*rect.height,
          };
        }
      } else if (viewModeRef.current === 'planetarium' && tE > 0.65) {
        const visStars = Object.values(starObjectsRef.current).filter(o => o.visible);
        const visPlanets = Object.values(planetSkyRef.current).filter(m => m.visible);
        const hits = ray.intersectObjects([...visStars, ...visPlanets], false);
        if (hits.length > 0) {
          const obj = hits[0].object;
          const sp  = obj.position.clone().project(camera);
          const jd  = dateToJD(currentDate);
          const lst = getLST(jd, obsLonRef.current);
          const horiz = equatorialToHorizontal(
            obj.userData.ra ?? 0, obj.userData.dec ?? 0, obsLatRef.current, lst,
          );
          hovered = {
            name: obj.userData.name, type: obj.userData.type as 'star'|'planet',
            altitude: Math.round(horiz.altitude*10)/10,
            azimuth:  Math.round(horiz.azimuth*10)/10,
            mag: obj.userData.mag, con: obj.userData.con,
            symbol: obj.userData.symbol, color: obj.userData.color,
            screenX: (sp.x+1)/2*rect.width, screenY: (-sp.y+1)/2*rect.height,
          };
        }
      }
      setHoveredRef.current(hovered);

      // Bloom Composer render
      composerRef.current?.render();
    };
    animate();

    // ── Resize ──────────────────────────────────────────────────────────
    const onResize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composerRef.current?.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      el.removeEventListener('mousedown',  onMouseDown);
      el.removeEventListener('mouseup',    onMouseUp);
      el.removeEventListener('mouseleave', onMouseLeave);
      el.removeEventListener('mousemove',  onMouseMove);
      el.removeEventListener('wheel',      onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend',   onTouchEnd);
      el.removeEventListener('touchmove',  onTouchMove);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derived display ────────────────────────────────────────────────────────
  const locale  = lang === 'de' ? 'de-DE' : 'en-GB';
  const dateStr = birthDate.toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-[#8B6914]/15 bg-[#0a1628]/90 shadow-[0_4px_32px_rgba(0,20,60,0.15)]">
      {/* Top-left label */}
      <div className="absolute top-4 left-5 z-10 pointer-events-none">
        <p className="text-[#8B6914]/70 text-[8px] uppercase tracking-[0.4em] mb-1">
          {planetariumMode
            ? (lang === 'de' ? '✦ PLANETARIUM' : '✦ PLANETARIUM')
            : (lang === 'de' ? '☉ SONNENSYSTEM' : '☉ SOLAR SYSTEM')
          }
        </p>
        <p className="text-[10px] text-white/35">
          {t('dashboard.orrery.datePrefix')} {dateStr}
        </p>
      </div>

      {/* Play/Pause */}
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className="absolute top-4 right-5 z-10 w-8 h-8 rounded-full border border-[#8B6914]/25 flex items-center justify-center hover:bg-[#8B6914]/15 hover:border-[#8B6914]/45 transition-all bg-black/40 backdrop-blur-sm"
      >
        {isPlaying
          ? <Pause className="w-3 h-3 text-[#8B6914]/80" />
          : <Play  className="w-3 h-3 text-[#8B6914]/80 ml-0.5" />
        }
      </button>

      {/* Planet legend (orrery mode) */}
      {!planetariumMode && (
        <div className="absolute bottom-4 left-5 z-10 flex flex-wrap gap-3 pointer-events-none">
          {Object.entries(PLANETS)
            .filter(([key]) => key !== 'earth')
            .map(([key, planet]) => (
              <span key={key} className="flex items-center gap-1.5 text-[9px] text-white/40">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: planet.color, boxShadow: `0 0 4px ${planet.color}40` }} />
                {planet.name}
              </span>
            ))}
        </div>
      )}

      {/* Planetarium hint */}
      {planetariumMode && (
        <div className="absolute bottom-4 left-5 right-5 z-10 pointer-events-none text-center">
          <p className="text-[9px] text-white/25 tracking-widest uppercase font-mono">
            {lang === 'de'
              ? 'ZIEHEN ZUM UMSCHAUEN · MAUSZEIGER ÜBER OBJEKTE FÜR INFO'
              : 'DRAG TO LOOK AROUND · HOVER OBJECTS FOR INFO'}
          </p>
        </div>
      )}

      {/* Hover Tooltip */}
      {hoveredObject && (
        <div
          className="absolute pointer-events-none z-30"
          style={{ left: (hoveredObject.screenX ?? 0) + 16, top: (hoveredObject.screenY ?? 0) - 10 }}
        >
          <div className="bg-[#050a14]/75 backdrop-blur-[14px] border border-blue-400/18 rounded-[10px] px-3.5 py-2.5 text-[#C8D8F0] font-mono text-xs min-w-[160px]">
            <div className="flex items-center gap-2 mb-1">
              {hoveredObject.symbol && (
                <span className="text-lg" style={{ color: hoveredObject.color ?? '#D4AF37' }}>
                  {hoveredObject.symbol}
                </span>
              )}
              <span className="text-[13px] text-[#EEF0FF] font-medium">{hoveredObject.name}</span>
            </div>
            {hoveredObject.type === 'star' && hoveredObject.mag != null && (
              <p className="text-[10px] text-[#667788]">Mag: <span className="text-[#AABBCC]">{hoveredObject.mag.toFixed(2)}</span></p>
            )}
            {hoveredObject.con && (
              <p className="text-[10px] text-[#667788]">{lang === 'de' ? 'Sternbild' : 'Constellation'}: <span className="text-[#AABBCC]">{CONSTELLATION_NAMES[hoveredObject.con] || hoveredObject.con}</span></p>
            )}
            {hoveredObject.altitude !== 0 && (
              <div className="mt-1.5 pt-1.5 border-t border-blue-400/15">
                <p className="text-[10px] text-[#667788]">{lang === 'de' ? 'Höhe' : 'Alt'}: <span className="text-[#AABBCC]">{hoveredObject.altitude}°</span></p>
                <p className="text-[10px] text-[#667788]">{lang === 'de' ? 'Azimut' : 'Az'}: <span className="text-[#AABBCC]">{hoveredObject.azimuth}°</span></p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Three.js Canvas */}
      <div
        ref={containerRef}
        className="w-full h-[260px] md:h-[460px]"
        style={{ cursor: planetariumMode ? 'crosshair' : 'grab' }}
      />
    </div>
  );
}

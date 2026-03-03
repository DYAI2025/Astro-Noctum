import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { PLANETS, SUN_RADIUS, ORBIT_SCALE } from "../lib/astronomy/data";
import { getPlanetPosition, solveKepler, daysSinceJ2000 } from "../lib/astronomy/calculations";
import {
  createSunMaterial,
  createPlanetMaterial,
  createAtmosphereShader,
  createSaturnRingsMaterial,
  createMilkyWayBackground,
  updateMaterials,
} from "../lib/3d/materials";
import { Play, Pause } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

interface BirthChartOrreryProps {
  /** ISO date string or Date for the birth moment */
  birthDate: Date;
  /** Optional: height of the orrery container */
  height?: string;
}

export function BirthChartOrrery({ birthDate, height = "420px" }: BirthChartOrreryProps) {
  const { lang, t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sunMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const planetMeshesRef = useRef<Record<string, THREE.Mesh>>({});
  const saturnRingsRef = useRef<THREE.Mesh | null>(null);
  const animFrameRef = useRef<number>(0);
  const simTimeRef = useRef(daysSinceJ2000(birthDate));
  const [isPlaying, setIsPlaying] = useState(false);
  const isPlayingRef = useRef(false);

  // Sync ref with state
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Reset simTime when birthDate changes
  useEffect(() => {
    simTimeRef.current = daysSinceJ2000(birthDate);
    updatePlanetPositions();
  }, [birthDate]);

  function updatePlanetPositions() {
    Object.entries(PLANETS).forEach(([key, planet]) => {
      const mesh = planetMeshesRef.current[key];
      if (!mesh) return;
      const pos = getPlanetPosition(planet, simTimeRef.current, ORBIT_SCALE);
      mesh.position.set(pos.x, pos.y, pos.z);
      if (key === "saturn" && saturnRingsRef.current) {
        saturnRingsRef.current.position.set(pos.x, pos.y, pos.z);
      }
    });
  }

  // Initialize Three.js scene once
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 10000);
    camera.position.set(80, 60, 80);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const sunLight = new THREE.PointLight("#FFFFEE", 3, 1000);
    scene.add(sunLight);
    scene.add(new THREE.AmbientLight("#334455", 0.3));
    scene.add(new THREE.HemisphereLight("#4466AA", "#221122", 0.5));

    // Sun
    const sunGeo = new THREE.SphereGeometry(SUN_RADIUS, 64, 64);
    const sunMat = createSunMaterial();
    sunMatRef.current = sunMat;
    scene.add(new THREE.Mesh(sunGeo, sunMat));

    // Sun glow layers
    const glowColors = ["#FFE4B5", "#FFD700", "#FFA500", "#FF6B35"];
    const glowScales = [1.3, 1.6, 2.0, 2.5];
    const glowOpacities = [0.4, 0.2, 0.12, 0.06];
    glowScales.forEach((scale, i) => {
      const glowGeo = new THREE.SphereGeometry(SUN_RADIUS * scale, 32, 32);
      const glowMat = new THREE.MeshBasicMaterial({
        color: glowColors[i],
        transparent: true,
        opacity: glowOpacities[i],
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
      });
      scene.add(new THREE.Mesh(glowGeo, glowMat));
    });

    // Create planets
    Object.entries(PLANETS).forEach(([key, planet]) => {
      const geo = new THREE.SphereGeometry(planet.radius, 32, 32);
      const mat = createPlanetMaterial(planet.color, 0.15, 0.65, 0.15);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.userData = { type: "planet", key, name: planet.name, symbol: planet.symbol };
      scene.add(mesh);
      planetMeshesRef.current[key] = mesh;

      // Atmospheric glow for gas giants
      if (["jupiter", "saturn", "uranus", "neptune"].includes(key)) {
        const atmoGeo = new THREE.SphereGeometry(planet.radius * 1.15, 16, 16);
        mesh.add(new THREE.Mesh(atmoGeo, createAtmosphereShader(planet.color, 0.6)));
      }

      // Earth atmosphere
      if (key === "earth") {
        const atmoGeo = new THREE.SphereGeometry(planet.radius * 1.1, 16, 16);
        mesh.add(new THREE.Mesh(atmoGeo, createAtmosphereShader("#4A90D9", 0.8)));
      }

      // Saturn rings
      if (planet.rings) {
        const ringGeo = new THREE.RingGeometry(planet.radius * 1.4, planet.radius * 2.2, 128);
        const rings = new THREE.Mesh(ringGeo, createSaturnRingsMaterial());
        rings.rotation.x = Math.PI / 2.5;
        scene.add(rings);
        saturnRingsRef.current = rings;
      }

      // Orbit path
      const orbitPoints: THREE.Vector3[] = [];
      for (let angle = 0; angle <= 360; angle += 2) {
        const M = (angle * Math.PI) / 180;
        const E = solveKepler(M, planet.e);
        const nu = 2 * Math.atan2(
          Math.sqrt(1 + planet.e) * Math.sin(E / 2),
          Math.sqrt(1 - planet.e) * Math.cos(E / 2),
        );
        const r = planet.a * (1 - planet.e * Math.cos(E));
        const xOrb = r * Math.cos(nu);
        const yOrb = r * Math.sin(nu);
        const iRad = (planet.i * Math.PI) / 180;
        const omegaRad = (planet.omega * Math.PI) / 180;
        const wRad = (planet.w * Math.PI) / 180;
        const cosO = Math.cos(omegaRad), sinO = Math.sin(omegaRad);
        const cosW = Math.cos(wRad), sinW = Math.sin(wRad);
        const cosI = Math.cos(iRad), sinI = Math.sin(iRad);
        const x = (cosO * cosW - sinO * sinW * cosI) * xOrb + (-cosO * sinW - sinO * cosW * cosI) * yOrb;
        const y = (sinO * cosW + cosO * sinW * cosI) * xOrb + (-sinO * sinW + cosO * cosW * cosI) * yOrb;
        const z = sinW * sinI * xOrb + cosW * sinI * yOrb;
        const scaled = Math.log10(r + 1) * ORBIT_SCALE;
        const factor = scaled / r;
        orbitPoints.push(new THREE.Vector3(x * factor, z * factor, -y * factor));
      }
      scene.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(orbitPoints),
          new THREE.LineBasicMaterial({ color: planet.color, transparent: true, opacity: 0.15 }),
        ),
      );
    });

    // Background stars
    const starGeo = new THREE.BufferGeometry();
    const starPositions: number[] = [];
    for (let i = 0; i < 5000; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 400 + Math.random() * 400;
      starPositions.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi),
      );
    }
    starGeo.setAttribute("position", new THREE.Float32BufferAttribute(starPositions, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: "#FFFFFF", size: 0.8, transparent: true, opacity: 0.6,
    })));

    // Milky Way
    createMilkyWayBackground(scene);

    // Set initial planet positions at birth date
    updatePlanetPositions();

    // Camera orbit control
    let spherical = { theta: Math.PI / 4, phi: Math.PI / 3, radius: 130 };
    let targetSpherical = { ...spherical };
    let isDragging = false;
    let lastMouse = { x: 0, y: 0 };

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      lastMouse = { x: e.clientX, y: e.clientY };
    };
    const onPointerUp = () => { isDragging = false; };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      targetSpherical.theta -= (e.clientX - lastMouse.x) * 0.005;
      targetSpherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, targetSpherical.phi + (e.clientY - lastMouse.y) * 0.005));
      lastMouse = { x: e.clientX, y: e.clientY };
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetSpherical.radius = Math.max(25, Math.min(400, targetSpherical.radius + e.deltaY * 0.25));
    };

    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointerup", onPointerUp);
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("wheel", onWheel, { passive: false });

    // Animation loop
    const clock = new THREE.Clock();
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      updateMaterials(delta, sunMatRef.current || undefined);

      // Advance time if playing
      if (isPlayingRef.current) {
        simTimeRef.current += (86400 / 86400) * delta * 60; // 1 day per second * 60
        updatePlanetPositions();
      }

      // Smooth camera orbit
      spherical.theta += (targetSpherical.theta - spherical.theta) * 0.08;
      spherical.phi += (targetSpherical.phi - spherical.phi) * 0.08;
      spherical.radius += (targetSpherical.radius - spherical.radius) * 0.08;
      camera.position.set(
        spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta),
        spherical.radius * Math.cos(spherical.phi),
        spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta),
      );
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("wheel", onWheel);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const locale = lang === "de" ? "de-DE" : "en-GB";

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-[#8B6914]/15 bg-[#0a1628]/90 shadow-[0_4px_32px_rgba(0,20,60,0.15)]">
      {/* Label */}
      <div className="absolute top-4 left-5 z-10 pointer-events-none">
        <p className="text-[#8B6914]/70 text-[8px] uppercase tracking-[0.4em] mb-1">
          {t("dashboard.orrery.sectionLabel")}
        </p>
        <p className="text-[10px] text-white/35">
          {t("dashboard.orrery.datePrefix")}{" "}
          {birthDate.toLocaleDateString(locale, { day: "2-digit", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Play/Pause toggle */}
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className="absolute top-4 right-5 z-10 w-8 h-8 rounded-full border border-[#8B6914]/25 flex items-center justify-center hover:bg-[#8B6914]/15 hover:border-[#8B6914]/45 transition-all bg-black/40 backdrop-blur-sm"
        title={isPlaying ? t("dashboard.orrery.pauseTitle") : t("dashboard.orrery.playTitle")}
      >
        {isPlaying ? (
          <Pause className="w-3 h-3 text-[#8B6914]/80" />
        ) : (
          <Play className="w-3 h-3 text-[#8B6914]/80 ml-0.5" />
        )}
      </button>

      {/* Planet legend */}
      <div className="absolute bottom-4 left-5 z-10 flex flex-wrap gap-3 pointer-events-none">
        {Object.entries(PLANETS)
          .filter(([key]) => key !== "earth")
          .map(([key, planet]) => (
            <span key={key} className="flex items-center gap-1.5 text-[9px] text-white/40">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: planet.color, boxShadow: `0 0 4px ${planet.color}40` }}
              />
              {planet.name}
            </span>
          ))}
      </div>

      {/* Three.js canvas container */}
      <div
        ref={containerRef}
        style={{ width: "100%", height, cursor: "grab" }}
      />
    </div>
  );
}

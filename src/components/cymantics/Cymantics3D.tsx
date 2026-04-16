import { useEffect, useRef, useCallback, Component, ReactNode, useMemo } from "react";
import * as THREE from "three";
import { PLANETS, computeSignatureWeights, type Planet } from "./planetaryFrequencies";
import { chladniDisplacement, getPolePositions, type SignatureParams } from "./cymatics";

// ═══════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════

export interface SolarModulation {
  kpIndex: number;
  ringModulation: number;
  flareIntensity: number;
}

export interface Cymantics3DProps {
  natalWeights: Record<string, number>;
  quizWeights: Record<string, number>;
  solarModulation?: SolarModulation;
  dominantPlanet?: Planet | null;
  onReady?: () => void;
  className?: string;
  width?: number;
  height?: number;
}

// ═══════════════════════════════════════
//  COMPONENTS
// ═══════════════════════════════════════

interface EBState { hasError: boolean }
class WebGLErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, EBState> {
  state: EBState = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() { return this.state.hasError ? this.props.fallback : this.props.children; }
}

function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")));
  } catch { return false; }
}

function CssSignatureFallback({ dominantPlanet }: { dominantPlanet: Planet | null }) {
  const color = dominantPlanet?.color ?? "#4f6ef7";
  return (
    <div style={{ width: "100%", height: "100%", position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse-ring { 0%,100% { opacity:0.15; transform:scale(1); } 50% { opacity:0.4; transform:scale(1.04); } }
        .css-ring { position:absolute; border-radius:50%; border:1px solid; animation:pulse-ring 4s ease-in-out infinite; }
      `}</style>
      <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
         {[280, 240, 200, 160].map((s, i) => (
          <div key={i} className="css-ring" style={{
            width: s, height: s,
            borderColor: `${color}${["22","18","14","10"][i]}`,
            animationDelay: `${i * 0.8}s`, animationDuration: `${4 + i}s`
          }} />
        ))}
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: color, filter: "blur(20px)", opacity: 0.4 }} />
      </div>
    </div>
  );
}

function Cymantics3DInner({ natalWeights, quizWeights, solarModulation, dominantPlanet, onReady, width, height }: Cymantics3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    frameId: number;
    signatureGroup: THREE.Group;
    wireMesh: THREE.Mesh | null;
    solidMesh: THREE.Mesh | null;
    trailLines: THREE.Line[];
    weights: number[];
    targetWeights: number[];
    time: number;
    mouseX: number;
    mouseY: number;
  } | null>(null);

  const solarRef = useRef(solarModulation);
  solarRef.current = solarModulation;

  const weightsArr = useMemo(() => computeSignatureWeights(natalWeights, quizWeights), [natalWeights, quizWeights]);

  const buildWireMesh = useCallback((weights: number[], time: number, radius: number) => {
    const res = 64;
    const geo = new THREE.SphereGeometry(radius, res, res);
    const pos = geo.attributes.position;
    
    // Solar storm expands the amplitude
    const solarMod = solarRef.current?.ringModulation ?? 1.0;
    const amplitudeBase = radius * 0.16 * solarMod;

    for (let i = 0; i < pos.count; i++) {
      const x = (pos.array as Float32Array)[i * 3];
      const y = (pos.array as Float32Array)[i * 3 + 1];
      const z = (pos.array as Float32Array)[i * 3 + 2];
      const r = Math.sqrt(x * x + y * y + z * z);
      if (r < 0.001) continue;
      const theta = Math.acos(Math.max(-1, Math.min(1, y / r)));
      const phi = Math.atan2(z, x);
      
      const params: SignatureParams = { weights, time, resolution: res, radius };
      const disp = chladniDisplacement(theta, phi, params);
      const scale = 1 + disp * (amplitudeBase / radius);
      
      (pos.array as Float32Array)[i * 3] = x * scale;
      (pos.array as Float32Array)[i * 3 + 1] = y * scale;
      (pos.array as Float32Array)[i * 3 + 2] = z * scale;
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }, []);

  const buildTrails = useCallback((weights: number[], time: number, radius: number): THREE.Line[] => {
    const lines: THREE.Line[] = [];
    const poles = getPolePositions(radius);
    const solarMod = solarRef.current?.kpIndex ?? 3;

    for (let i = 0; i < poles.length; i++) {
      const planet = PLANETS[i % PLANETS.length];
      const w = weights[i % weights.length];
      const target = poles[(i + 5) % poles.length]; // asymmetric connection for 10 planets
      const steps = 48;
      const points: THREE.Vector3[] = [];

      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const p = new THREE.Vector3().lerpVectors(poles[i], target, t).normalize();
        
        // Solar intensity affects ripple speed and height
        const ripple = Math.sin(t * Math.PI * 4 + time * 0.001 * (planet.baseFrequency / 50) * (1 + solarMod * 0.1)) * 0.04 * w;
        p.multiplyScalar(radius * (1.0 + ripple));
        points.push(p);
      }

      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const alpha = 0.2 + w * 0.5;
      const color = new THREE.Color(planet.color);
      const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: alpha });
      lines.push(new THREE.Line(lineGeo, mat));
    }
    return lines;
  }, []);

  useEffect(() => {
    if (!mountRef.current || !isWebGLAvailable()) return;

    const w = mountRef.current.clientWidth || 500;
    const h = mountRef.current.clientHeight || 500;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.z = 4.2;

    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);
    const point = new THREE.PointLight(0xffffff, 2, 20);
    point.position.set(5, 5, 5);
    scene.add(point);

    const signatureGroup = new THREE.Group();
    scene.add(signatureGroup);

    const initialWeights = computeSignatureWeights(natalWeights, quizWeights);
    const wireGeo = buildWireMesh(initialWeights, 0, 1.0);
    const wireMat = new THREE.MeshStandardMaterial({ color: 0x4f6ef7, wireframe: true, transparent: true, opacity: 0.15 });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    signatureGroup.add(wireMesh);

    const solidGeo = buildWireMesh(initialWeights, 0, 0.95);
    const solidMat = new THREE.MeshStandardMaterial({ color: 0x050510, transparent: true, opacity: 0.8 });
    const solidMesh = new THREE.Mesh(solidGeo, solidMat);
    signatureGroup.add(solidMesh);

    const trailLines = buildTrails(initialWeights, 0, 1.0);
    trailLines.forEach(l => signatureGroup.add(l));

    sceneRef.current = {
      renderer, scene, camera, frameId: 0,
      signatureGroup, wireMesh, solidMesh, trailLines,
      weights: initialWeights, targetWeights: initialWeights,
      time: 0, mouseX: 0, mouseY: 0
    };

    const animate = (t: number) => {
      const s = sceneRef.current;
      if (!s) return;
      s.frameId = requestAnimationFrame(animate);
      s.time = t;

      // Smooth weight morphing
      for (let i = 0; i < s.weights.length; i++) {
        s.weights[i] += (s.targetWeights[i] - s.weights[i]) * 0.05;
      }

      s.signatureGroup.rotation.y += 0.002;
      s.signatureGroup.rotation.x += 0.001;

      if (Math.round(t / 16) % 3 === 0) {
        s.wireMesh!.geometry.dispose();
        s.wireMesh!.geometry = buildWireMesh(s.weights, t, 1.0);
        
        s.trailLines.forEach(l => { s.signatureGroup.remove(l); l.geometry.dispose(); });
        const newT = buildTrails(s.weights, t, 1.0);
        newT.forEach(l => s.signatureGroup.add(l));
        s.trailLines = newT;
      }

      renderer.render(scene, camera);
    };
    requestAnimationFrame(animate);

    onReady?.();

    return () => {
      if (sceneRef.current) cancelAnimationFrame(sceneRef.current.frameId);
      renderer.dispose();
      mountRef.current?.removeChild(renderer.domElement);
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (sceneRef.current) sceneRef.current.targetWeights = weightsArr;
  }, [weightsArr]);

  return <div ref={mountRef} style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }} />;
}

export function Cymantics3D(props: Cymantics3DProps) {
  return (
    <WebGLErrorBoundary fallback={<CssSignatureFallback dominantPlanet={props.dominantPlanet ?? null} />}>
      <Cymantics3DInner {...props} />
    </WebGLErrorBoundary>
  );
}

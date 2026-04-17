import { useEffect, useRef, useCallback, Component, ReactNode, useMemo } from "react";
import * as THREE from "three";
import { PLANETS, computeSignatureWeights, type Planet } from "./planetaryFrequencies";
import { buildSignatureGeometry, buildTrailGeometry, getPolePositions, type SignatureParams } from "./cymatics";

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
    wireMesh: THREE.Mesh;
    solidMesh: THREE.Mesh;
    trailMeshes: THREE.Mesh[];
    weights: number[];
    targetWeights: number[];
    time: number;
  } | null>(null);

  const solarRef = useRef(solarModulation);
  solarRef.current = solarModulation;

  const weightsArr = useMemo(() => computeSignatureWeights(natalWeights, quizWeights), [natalWeights, quizWeights]);

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
    
    // Wireframe displacement layer
    const wireGeo = buildSignatureGeometry({ weights: initialWeights, time: 0, resolution: 64, radius: 1.0 });
    const wireMat = new THREE.MeshStandardMaterial({ color: 0x4f6ef7, wireframe: true, transparent: true, opacity: 0.15 });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    signatureGroup.add(wireMesh);

    // Solid core layer
    const solidGeo = buildSignatureGeometry({ weights: initialWeights, time: 0, resolution: 64, radius: 0.95 });
    const solidMat = new THREE.MeshStandardMaterial({ color: 0x050510, transparent: true, opacity: 0.8 });
    const solidMesh = new THREE.Mesh(solidGeo, solidMat);
    signatureGroup.add(solidMesh);

    // Trail skeletons
    const trailGeos = buildTrailGeometry(1.0, initialWeights, 0);
    const trailMeshes = trailGeos.map((geo, i) => {
      const planet = PLANETS[i % PLANETS.length];
      const mat = new THREE.MeshStandardMaterial({ 
        color: planet.color, 
        transparent: true, 
        opacity: 0.4,
        emissive: planet.color,
        emissiveIntensity: 0.5
      });
      const mesh = new THREE.Mesh(geo, mat);
      signatureGroup.add(mesh);
      return mesh;
    });

    sceneRef.current = {
      renderer, scene, camera, frameId: 0,
      signatureGroup, wireMesh, solidMesh, trailMeshes,
      weights: initialWeights, targetWeights: initialWeights,
      time: 0
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

      // Throttle geometry updates for performance
      if (Math.round(t / 16) % 3 === 0) {
        const params: SignatureParams = { 
          weights: s.weights, 
          time: t, 
          resolution: 64, 
          radius: 1.0 
        };

        s.wireMesh.geometry.dispose();
        s.wireMesh.geometry = buildSignatureGeometry(params);
        
        s.solidMesh.geometry.dispose();
        s.solidMesh.geometry = buildSignatureGeometry({ ...params, radius: 0.95 });

        // Update trails
        s.trailMeshes.forEach(m => {
          s.signatureGroup.remove(m);
          m.geometry.dispose();
        });
        const newTrailGeos = buildTrailGeometry(1.0, s.weights, t);
        s.trailMeshes = newTrailGeos.map((geo, i) => {
          const planet = PLANETS[i % PLANETS.length];
          const mat = (s.trailMeshes[i]?.material as THREE.MeshStandardMaterial) || new THREE.MeshStandardMaterial({ 
            color: planet.color, transparent: true, opacity: 0.4 
          });
          const mesh = new THREE.Mesh(geo, mat);
          s.signatureGroup.add(mesh);
          return mesh;
        });
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

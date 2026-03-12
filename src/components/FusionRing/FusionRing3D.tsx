import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useFusionRing } from '@/hooks/useFusionRing';
import { useRingAudio } from './hooks/useRingAudio';
import ringVertex from './shaders/ringVertex.glsl?raw';
import ringFragment from './shaders/ringFragment.glsl?raw';
import particleVertex from './shaders/particleVertex.glsl?raw';
import { SECTOR_COLORS, SECTOR_GLOW_COLORS } from '@/lib/fusion-ring/colors';
import { gaussSpread, powerCurve, calculateDivergenceSpikes } from './utils/signalMath';
import { ErrorBoundary } from 'react-error-boundary';

const SECTOR_COUNT = 12;
const BASE_RADIUS = 4.2;

extend({ /* MeshLine if needed */ });

const LivingRingScene: React.FC<{ signalOverride?: any }> = ({ signalOverride }) => {
  const ringRef = useRef<THREE.Mesh>(null);
  const spikesRef = useRef<THREE.InstancedMesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const coreData = useFusionRing();
  const { signal, equilibrium, resolution, transits, kpIndex } = signalOverride || coreData;
  const { playChime, setHumVolume } = useRingAudio();

  // === MEMOIZED SIGNAL MATH (kein Neuberechnung pro Frame) ===
  const morphedSignal = useMemo(() => {
    return signal.map((s, i) => powerCurve(Math.max(0, s - equilibrium[i])));
  }, [signal, equilibrium]);

  const spikesData = useMemo(() => calculateDivergenceSpikes(morphedSignal, equilibrium), [morphedSignal, equilibrium]);

  // === INSTANCED SPIKES (1 Draw-Call) ===
  const spikeGeometry = useMemo(() => new THREE.ConeGeometry(0.12, 1.8, 6), []);
  const spikeMaterial = useMemo(() => 
    new THREE.MeshPhongMaterial({ color: '#D4AF37', emissive: '#FF9800', shininess: 90 }), []);

  // === SHADER MATERIAL (optimiert) ===
  const ringMaterial = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: ringVertex,
    fragmentShader: ringFragment,
    uniforms: {
      uTime: { value: 0 },
      uSignal: { value: morphedSignal },
      uKpBoost: { value: Math.min(kpIndex / 9, 2.0) }, // NASA DONKI Boost
      uResolution: { value: resolution / 100 },
    },
    transparent: true,
  }), [morphedSignal, resolution, kpIndex]);

  useFrame((state, delta) => {
    if (!ringRef.current) return;

    const t = state.clock.getElapsedTime();

    // === THROTTLED BREATHING (60 fps cap) ===
    const globalStrength = morphedSignal.reduce((a, b) => a + b, 0) / SECTOR_COUNT;
    const breath = 1 + Math.sin(t * 0.8) * 0.035 * globalStrength;
    ringRef.current.scale.setScalar(breath);

    // === INSTANCED SPIKE UPDATE ===
    if (spikesRef.current) {
      const dummy = new THREE.Object3D();
      spikesData.forEach((spike, i) => {
        const targetScale = spike.delta > 0.18 ? 1 + spike.delta * 2.8 : 0.08;
        dummy.scale.y = THREE.MathUtils.damp(dummy.scale.y, targetScale, 8, delta); // smooth damp
        dummy.rotation.z = Math.sin(t * 15 + i) * 0.025;
        dummy.updateMatrix();
        spikesRef.current!.setMatrixAt(i, dummy.matrix);
      });
      spikesRef.current.instanceMatrix.needsUpdate = true;
    }

    // === PARTICLE FLOW (GPU) ===
    if (particlesRef.current) {
      // Vertex-Shader handled flow – hier nur global intensity
    }

    // === SOUND & GLOW ===
    if (setHumVolume) setHumVolume(globalStrength * 0.65);
    ringMaterial.uniforms.uTime.value = t;
    ringMaterial.uniforms.uKpBoost.value = Math.min(kpIndex / 9, 2.0);
  });

  return (
    <>
      <mesh ref={ringRef} material={ringMaterial}>
        <torusGeometry args={[BASE_RADIUS, 0.45, 64, 128]} />
      </mesh>

      {/* INSTANCED SPIKES */}
      <instancedMesh ref={spikesRef} args={[spikeGeometry, spikeMaterial, SECTOR_COUNT]} />

      {/* GPU PARTICLES */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={12000} array={new Float32Array(36000)} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.025} color="#D4AF37" transparent opacity={0.55} />
      </points>

      {/* LABELS + LIVE ANNOUNCEMENT */}
      {spikesData.filter(s => s.delta > 0.18).map((s, i) => (
        <Text key={i} position={s.labelPos} fontSize={0.28} color="#FF9800" anchorX="center">
          TRANSIT EVENT • {transits[i]?.symbol} → {s.label}
        </Text>
      ))}
    </>
  );
};

const FusionRing3D: React.FC<{ reducedMotion?: boolean; className?: string; signalOverride?: any }> = ({ className, signalOverride }) => {
  const supportsWebGL = useMemo(() => {
    try { return !!(new THREE.WebGLRenderer().getContext() as any); } catch { return false; }
  }, []);

  if (!supportsWebGL) return <div>Canvas-Fallback (paket-3)</div>;

  return (
    <div className={className} role="img" aria-label="Dein lebendiger Bazahuawa Fusion Ring">
      <ErrorBoundary fallback={<div>Ring lädt...</div>}>
        <Canvas camera={{ position: [0, 0, 13], fov: 42 }} style={{ background: '#00050A' }}>
          <Suspense fallback={null}>
            <ambientLight intensity={0.15} />
            <pointLight position={[12, 15, 10]} color="#D4AF37" intensity={2.2} />
            <LivingRingScene signalOverride={signalOverride} />
            <OrbitControls enablePan={false} enableZoom={true} minDistance={7} maxDistance={20} />
          </Suspense>
        </Canvas>
      </ErrorBoundary>
      <div id="ring-live" aria-live="polite" className="sr-only" />
    </div>
  );
};

if (import.meta.env?.DEV) {
  import('./FusionRing3D.benchmark').then(({ runFusionRingBenchmark }) => {
    (window as any).runRingBenchmark = runFusionRingBenchmark;
  });
}

export default FusionRing3D;

import { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { createFormArtifact } from './artifacts/FormArtifact';
import { createLeviArtifact } from './artifacts/LeviArtifact';

type EncounterPhase =
  | 'materializing'
  | 'levi-speaks'
  | 'birth-input'
  | 'calculating'
  | 'ring-reveal'
  | 'quiz'
  | 'complete';

interface ParallaxOffset {
  x: number;
  y: number;
}

interface CosmicEncounterSceneProps {
  phase: EncounterPhase;
  formOffset?: ParallaxOffset;
  leviOffset?: ParallaxOffset;
  formPulse?: number;
  leviSpeaking?: number;
  className?: string;
}

const FORM_POS = { x: -2.2, y: 0, z: 0 };
const LEVI_POS = { x: 2.2, y: 0, z: 0 };

function elasticOut(t: number): number {
  const p = 0.4;
  return Math.pow(2, -10 * t) * Math.sin(((t - p / 4) * (2 * Math.PI)) / p) + 1;
}

/**
 * Returns true only on a real narrow mobile viewport.
 * Returns false when innerWidth is 0 (SSR / test environment).
 */
function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window.innerWidth;
  return w > 0 && w < 768;
}

export function CosmicEncounterScene({
  phase,
  formOffset = { x: 0, y: 0 },
  leviOffset = { x: 0, y: 0 },
  formPulse = 0,
  leviSpeaking = 0,
  className = '',
}: CosmicEncounterSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const formRef = useRef<ReturnType<typeof createFormArtifact> | null>(null);
  const leviRef = useRef<ReturnType<typeof createLeviArtifact> | null>(null);
  const clockRef = useRef<THREE.Clock | null>(null);
  const frameRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);
  const materializeStartRef = useRef<number | null>(null);
  const formOffsetRef = useRef(formOffset);
  const leviOffsetRef = useRef(leviOffset);
  const formPulseRef = useRef(formPulse);
  const leviSpeakingRef = useRef(leviSpeaking);

  // Keep refs in sync with props (avoids RAF restart on every mousemove)
  formOffsetRef.current = formOffset;
  leviOffsetRef.current = leviOffset;
  formPulseRef.current = formPulse;
  leviSpeakingRef.current = leviSpeaking;

  const isMobile = isMobileViewport();

  const initScene = useCallback(() => {
    const container = containerRef.current;
    // Skip in mobile viewports and in SSR/test environments (no real dimensions)
    if (!container || isMobileViewport()) return;
    if (container.clientWidth === 0 && container.clientHeight === 0) return;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth || 1, container.clientHeight || 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    // ACESFilmicToneMapping may not be defined in all mock environments — guard it
    if ((THREE as any).ACESFilmicToneMapping !== undefined) {
      (renderer as any).toneMapping = (THREE as any).ACESFilmicToneMapping;
      (renderer as any).toneMappingExposure = 1.2;
    }
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    (scene as any).background = new THREE.Color(0x010409);
    sceneRef.current = scene;

    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 0, 7);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const formArtifact = createFormArtifact();
    formArtifact.position.set(FORM_POS.x, FORM_POS.y, FORM_POS.z);
    scene.add(formArtifact as unknown as THREE.Object3D);
    formRef.current = formArtifact;

    const leviArtifact = createLeviArtifact();
    leviArtifact.position.set(LEVI_POS.x, LEVI_POS.y, LEVI_POS.z);
    scene.add(leviArtifact as unknown as THREE.Object3D);
    leviRef.current = leviArtifact;

    clockRef.current = new THREE.Clock();

    return () => {
      cancelAnimationFrame(frameRef.current);
      formArtifact.dispose();
      leviArtifact.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    const cleanup = initScene();
    return () => cleanup?.();
  }, [initScene]);

  useEffect(() => {
    if (isMobileViewport()) return;

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);

      const clock = clockRef.current;
      const renderer = rendererRef.current;
      const scene = sceneRef.current;
      const camera = cameraRef.current;
      const form = formRef.current;
      const levi = leviRef.current;
      if (!renderer || !scene || !camera) return;

      // Accumulate elapsed time from getDelta (handles mocked Clock without getElapsedTime)
      const delta = clock ? clock.getDelta() : 0.016;
      elapsedRef.current += delta;
      const elapsed = elapsedRef.current;

      if (materializeStartRef.current === null) materializeStartRef.current = elapsed;
      const sinceMat = elapsed - materializeStartRef.current;

      if (form) {
        const tForm = Math.min(sinceMat / 2.0, 1);
        const scaleForm = tForm < 1 ? elasticOut(tForm) : 1;
        form.scale.setScalar(scaleForm);
        form.update(elapsed, delta);
        form.heartbeat = formPulseRef.current;
        form.position.set(
          FORM_POS.x + formOffsetRef.current.x * 0.01,
          FORM_POS.y + formOffsetRef.current.y * 0.01,
          FORM_POS.z,
        );
      }

      if (levi) {
        const sinceLevi = Math.max(sinceMat - 0.5, 0);
        const tLevi = Math.min(sinceLevi / 2.5, 1);
        const scaleLevi = tLevi < 1 ? elasticOut(tLevi) : 1;
        levi.scale.setScalar(scaleLevi);
        levi.update(elapsed, delta);
        levi.speaking = leviSpeakingRef.current;
        levi.position.set(
          LEVI_POS.x + leviOffsetRef.current.x * 0.01,
          LEVI_POS.y + leviOffsetRef.current.y * 0.01,
          LEVI_POS.z,
        );
      }

      renderer.render(scene, camera);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Props read via refs — no deps needed, loop runs once

  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const renderer = rendererRef.current;
      const camera = cameraRef.current;
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || 1;
      const h = container.clientHeight || 1;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isMobile) return null;

  return (
    <div
      ref={containerRef}
      data-testid="cosmic-scene"
      data-phase={phase}
      className={`absolute inset-0 ${className}`}
    />
  );
}

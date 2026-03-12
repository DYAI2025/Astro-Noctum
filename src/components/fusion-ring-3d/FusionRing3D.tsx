import {
  Component,
  type ErrorInfo,
  type ReactNode,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useReducedMotion } from 'motion/react';

import { RingMesh } from './RingMesh';
import { DivergenceSpikes } from './DivergenceSpikes';
import { EnergyParticles } from './EnergyParticles';
import { EquilibriumLine } from './EquilibriumLine';
import { RingOverlays } from './RingOverlays';
import { FallbackCanvas2D } from './FallbackCanvas2D';
import { PostFX } from './PostFX';
import { GhostRings } from './GhostRings';
import { CameraRig, type CameraRigHandle } from './CameraRig';
import { ShockwaveRings, type ShockwaveRingsHandle } from './ShockwaveRings';
import { SpikeGlowTips } from './SpikeGlowTips';
import { NebulaBg } from './NebulaBg';
import { TestFieldOverlay } from './TestFieldOverlay';
import { TestControlPanel } from './TestControlPanel';
import type {
  DebugControlValues,
  DebugDisplayModes,
  DebugTriggerNode,
  FusionDebugEventType,
  FusionVisualState,
} from './testFieldTypes';

import { useFusionSignal } from '@/src/hooks/useFusionSignal';
import { useSpaceWeather } from '@/src/hooks/useSpaceWeather';
import { useRingAudio } from '@/src/hooks/useRingAudio';
import type { TransitEvent } from '@/src/lib/schemas/transit-state';

export type FusionRing3DLabels = {
  regionLabel: string;
  loading: string;
  reducedMotionHint: string;
  resolution: string;
  audioOn: string;
  audioOff: string;
  latestEvents: string;
  renderError: string;
  reload: string;
  eventAnnouncePrefix: string;
};

type FusionRing3DProps = {
  userId: string;
  isInteractive?: boolean;
  onSpikeClick?: (sector: number) => void;
  labels: FusionRing3DLabels;
};

type BoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
  onError?: () => void;
};

type BoundaryState = {
  hasError: boolean;
};

class CanvasBoundary extends Component<BoundaryProps, BoundaryState> {
  public state: BoundaryState = { hasError: false };

  public static getDerivedStateFromError(): BoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(_error: Error, _errorInfo: ErrorInfo): void {
    this.props.onError?.();
  }

  public render(): ReactNode {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

const isWebGLSupported = (): boolean => {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
};

type PerformanceGuardProps = {
  onLowPerformance: () => void;
};

const PerformanceGuard = ({ onLowPerformance }: PerformanceGuardProps) => {
  const slowFramesRef = useRef<number>(0);
  const triggeredRef = useRef<boolean>(false);

  useFrame((_, delta) => {
    if (triggeredRef.current) return;
    if (delta > 0.05) {
      slowFramesRef.current += 1;
    }
    if (slowFramesRef.current > 35) {
      triggeredRef.current = true;
      onLowPerformance();
    }
  });

  return null;
};

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const toUnit = (value: number): number => clamp01(value / 100);

const STATE_FORCES: Record<FusionVisualState, { charge: number; polarize: number; pair: number; settle: number }> = {
  IDLE: { charge: 0, polarize: 0, pair: 0, settle: 1 },
  PRIMED: { charge: 0.2, polarize: 0.1, pair: 0.05, settle: 0 },
  CHARGING: { charge: 1, polarize: 0.2, pair: 0.1, settle: 0 },
  POLARIZING: { charge: 0.45, polarize: 1, pair: 0.45, settle: 0 },
  PAIRING: { charge: 0.25, polarize: 0.8, pair: 1, settle: 0 },
  STABILIZING: { charge: 0.1, polarize: 0.3, pair: 0.65, settle: 1 },
};

const CONTRIBUTION_SECTORS = [1, 4, 7, 10];
const TRANSIT_SECTORS = [2, 5, 8, 11];

const createTriggerNode = (
  id: string,
  kind: DebugTriggerNode['kind'],
  sector: number,
  strength: number,
): DebugTriggerNode => ({
  id,
  kind,
  sector,
  strength,
  label: kind === 'contribution' ? 'Contribution' : 'Transit',
});

export const FusionRing3D = ({
  userId,
  isInteractive = true,
  onSpikeClick,
  labels,
}: FusionRing3DProps) => {
  const prefersReducedMotion = useReducedMotion();

  const [isLowEndDevice, setIsLowEndDevice] = useState<boolean>(false);
  const [forceFallback, setForceFallback] = useState<boolean>(false);
  const [isUserControlling, setIsUserControlling] = useState<boolean>(false);
  const [isTestPanelCollapsed, setIsTestPanelCollapsed] = useState<boolean>(false);
  const [visualState, setVisualState] = useState<FusionVisualState>('IDLE');
  const [activeEventType, setActiveEventType] = useState<FusionDebugEventType | null>(null);
  const [magnetPulseBoost, setMagnetPulseBoost] = useState<number>(0);
  const [triggerNodes, setTriggerNodes] = useState<DebugTriggerNode[]>([]);
  const [manualEvents, setManualEvents] = useState<TransitEvent[]>([]);
  const [sequenceSeed, setSequenceSeed] = useState<number>(0);

  const [controls, setControls] = useState<DebugControlValues>({
    contributionStrength: 72,
    transitStrength: 58,
    magnetFlow: 52,
    spaceDensity: 45,
    pairCoherence: 67,
  });

  const [displayModes, setDisplayModes] = useState<DebugDisplayModes>({
    showTriggerPoints: true,
    showFlowLines: true,
    showDensityMap: true,
    showPairingZones: true,
  });

  const { signalData, events, resolution, loading, error } = useFusionSignal(userId);
  const { kpIndex } = useSpaceWeather();

  const { playSpikeChime, toggleMute, isMuted } = useRingAudio(signalData);

  const cameraRigRef    = useRef<CameraRigHandle>(null);
  const shockwaveRef    = useRef<ShockwaveRingsHandle>(null);
  const sequenceTimersRef = useRef<number[]>([]);
  const magnetTimerRef = useRef<number | null>(null);

  const shouldFallback = !!prefersReducedMotion || isLowEndDevice || forceFallback || !!error;

  const clearSequenceTimers = useCallback(() => {
    for (const timer of sequenceTimersRef.current) {
      window.clearTimeout(timer);
    }
    sequenceTimersRef.current = [];
  }, []);

  const queueState = useCallback((next: FusionVisualState, delayMs: number) => {
    const timer = window.setTimeout(() => {
      setVisualState(next);
    }, delayMs);
    sequenceTimersRef.current.push(timer);
  }, []);

  const clearMagnetTimer = useCallback(() => {
    if (magnetTimerRef.current != null) {
      window.clearTimeout(magnetTimerRef.current);
      magnetTimerRef.current = null;
    }
  }, []);

  const normalizeControls = useMemo(() => ({
    contributionStrength: toUnit(controls.contributionStrength),
    transitStrength: toUnit(controls.transitStrength),
    magnetFlow: toUnit(controls.magnetFlow),
    spaceDensity: toUnit(controls.spaceDensity),
    pairCoherence: toUnit(controls.pairCoherence),
  }), [controls]);

  const runtimeForces = useMemo(() => {
    const stateForces = STATE_FORCES[visualState];
    const effectiveMagnetFlow = clamp01(
      normalizeControls.magnetFlow * 0.72 +
      stateForces.polarize * 0.35 +
      stateForces.pair * 0.32 +
      magnetPulseBoost * 0.4,
    );
    const effectiveSpaceDensity = clamp01(
      normalizeControls.spaceDensity * 0.65 +
      stateForces.charge * 0.25 +
      stateForces.pair * 0.4 +
      effectiveMagnetFlow * 0.2,
    );
    const effectivePairCoherence = clamp01(
      normalizeControls.pairCoherence * 0.66 +
      stateForces.pair * 0.45 +
      effectiveMagnetFlow * 0.24,
    );

    const pairDistance = 0.22 + (1 - effectivePairCoherence) * 0.88 + (1 - effectiveMagnetFlow) * 0.16;
    const dischargeFrequency = clamp01(
      normalizeControls.contributionStrength * 0.28 +
      normalizeControls.transitStrength * 0.24 +
      stateForces.pair * 0.34 +
      stateForces.polarize * 0.12,
    );
    const mergeBias = clamp01(effectivePairCoherence * 0.64 + effectiveMagnetFlow * 0.36);
    const debugTransitBoost = clamp01(
      normalizeControls.contributionStrength * stateForces.charge * 0.33 +
      normalizeControls.transitStrength * stateForces.polarize * 0.45 +
      effectiveMagnetFlow * 0.22 +
      magnetPulseBoost * 0.3,
    );

    return {
      effectiveMagnetFlow,
      effectiveSpaceDensity,
      effectivePairCoherence,
      pairDistance,
      dischargeFrequency,
      mergeBias,
      debugTransitBoost,
    };
  }, [magnetPulseBoost, normalizeControls, visualState]);

  const renderSignalData = useMemo(() => {
    if (!signalData) return null;

    const intensity = clamp01(signalData.transitIntensity * 0.68 + runtimeForces.debugTransitBoost * 0.32);
    return {
      ...signalData,
      transitIntensity: intensity,
    };
  }, [runtimeForces.debugTransitBoost, signalData]);

  const peakSector = useMemo(() => {
    if (!renderSignalData) return 0;
    const max = Math.max(...renderSignalData.targetSignals);
    return renderSignalData.targetSignals.indexOf(max);
  }, [renderSignalData]);

  const combinedEvents = useMemo(
    () => [...events, ...manualEvents].slice(-24),
    [events, manualEvents],
  );

  const appendManualEvents = useCallback((next: TransitEvent[]) => {
    if (next.length === 0) return;
    setManualEvents((current) => [...current, ...next].slice(-24));
  }, []);

  const triggerStatePath = useCallback((
    eventType: FusionDebugEventType,
    path: Array<{ state: FusionVisualState; afterMs: number }>,
    nextNodes: DebugTriggerNode[],
    nextManualEvents: TransitEvent[],
  ) => {
    clearSequenceTimers();
    setActiveEventType(eventType);
    setTriggerNodes(nextNodes);
    appendManualEvents(nextManualEvents);

    let offset = 0;
    for (const [index, step] of path.entries()) {
      if (index === 0 && step.afterMs === 0) {
        setVisualState(step.state);
        continue;
      }
      offset += step.afterMs;
      queueState(step.state, offset);
    }

    const cleanupTimer = window.setTimeout(() => {
      setActiveEventType(null);
      setTriggerNodes([]);
    }, offset + 1200);
    sequenceTimersRef.current.push(cleanupTimer);
  }, [appendManualEvents, clearSequenceTimers, queueState]);

  useEffect(() => {
    const lowEndByCores = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4;
    const lowEndByMemory =
      typeof (navigator as Navigator & { deviceMemory?: number }).deviceMemory === 'number' &&
      ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) <= 4;

    setIsLowEndDevice(lowEndByCores || lowEndByMemory || !isWebGLSupported());
  }, []);

  useEffect(() => {
    return () => {
      clearSequenceTimers();
      clearMagnetTimer();
    };
  }, [clearMagnetTimer, clearSequenceTimers]);

  const handleControlChange = useCallback((key: keyof DebugControlValues, value: number) => {
    setControls((current) => ({
      ...current,
      [key]: Math.max(0, Math.min(100, value)),
    }));
  }, []);

  const handleDisplayModeToggle = useCallback((key: keyof DebugDisplayModes) => {
    setDisplayModes((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }, []);

  const createManualEvent = useCallback((
    id: string,
    type: string,
    sector: number,
    delta: number,
    symbol: string,
    domain: string,
  ): TransitEvent => ({
    id,
    type,
    sector,
    delta: clamp01(delta),
    trigger_planet: 'Manual',
    trigger_symbol: symbol,
    sector_domain: domain,
    timestamp: Date.now(),
  }), []);

  const handleTriggerContribution = useCallback(() => {
    const idx = sequenceSeed % CONTRIBUTION_SECTORS.length;
    const sector = CONTRIBUTION_SECTORS[idx];
    const triggerStrength = toUnit(controls.contributionStrength);
    const node = createTriggerNode(`c-${Date.now()}`, 'contribution', sector, triggerStrength);
    const event = createManualEvent(
      `manual-c-${Date.now()}`,
      'manual_contribution',
      sector,
      0.2 + triggerStrength * 0.6,
      '✦',
      'Contribution',
    );

    triggerStatePath(
      'contribution',
      [
        { state: 'PRIMED', afterMs: 0 },
        { state: 'CHARGING', afterMs: 260 },
        { state: 'STABILIZING', afterMs: 1300 },
        { state: 'IDLE', afterMs: 1150 },
      ],
      [node],
      [event],
    );
    setSequenceSeed((current) => current + 1);
  }, [controls.contributionStrength, createManualEvent, sequenceSeed, triggerStatePath]);

  const handleTriggerTransit = useCallback(() => {
    const idx = sequenceSeed % TRANSIT_SECTORS.length;
    const sector = TRANSIT_SECTORS[idx];
    const triggerStrength = toUnit(controls.transitStrength);
    const node = createTriggerNode(`t-${Date.now()}`, 'transit', sector, triggerStrength);
    const event = createManualEvent(
      `manual-t-${Date.now()}`,
      'manual_transit',
      sector,
      0.2 + triggerStrength * 0.58,
      '⟳',
      'Transit',
    );

    triggerStatePath(
      'transit',
      [
        { state: 'PRIMED', afterMs: 0 },
        { state: 'POLARIZING', afterMs: 300 },
        { state: 'STABILIZING', afterMs: 1200 },
        { state: 'IDLE', afterMs: 1100 },
      ],
      [node],
      [event],
    );
    setSequenceSeed((current) => current + 1);
  }, [controls.transitStrength, createManualEvent, sequenceSeed, triggerStatePath]);

  const handleTriggerDual = useCallback(() => {
    const cIdx = sequenceSeed % CONTRIBUTION_SECTORS.length;
    const tIdx = sequenceSeed % TRANSIT_SECTORS.length;
    const contributionSector = CONTRIBUTION_SECTORS[cIdx];
    const transitSector = TRANSIT_SECTORS[tIdx];
    const contributionStrength = toUnit(controls.contributionStrength);
    const transitStrength = toUnit(controls.transitStrength);

    const nodes = [
      createTriggerNode(`dc-${Date.now()}`, 'contribution', contributionSector, contributionStrength),
      createTriggerNode(`dt-${Date.now()}`, 'transit', transitSector, transitStrength),
    ];

    const eventsForDual = [
      createManualEvent(
        `manual-dc-${Date.now()}`,
        'manual_dual_contribution',
        contributionSector,
        0.22 + contributionStrength * 0.58,
        '✦',
        'Contribution',
      ),
      createManualEvent(
        `manual-dt-${Date.now()}`,
        'manual_dual_transit',
        transitSector,
        0.22 + transitStrength * 0.58,
        '⟳',
        'Transit',
      ),
    ];

    triggerStatePath(
      'dual',
      [
        { state: 'PRIMED', afterMs: 0 },
        { state: 'CHARGING', afterMs: 280 },
        { state: 'POLARIZING', afterMs: 820 },
        { state: 'PAIRING', afterMs: 940 },
        { state: 'STABILIZING', afterMs: 1100 },
        { state: 'IDLE', afterMs: 1050 },
      ],
      nodes,
      eventsForDual,
    );
    setSequenceSeed((current) => current + 1);
  }, [controls.contributionStrength, controls.transitStrength, createManualEvent, sequenceSeed, triggerStatePath]);

  const handlePulseMagnetism = useCallback(() => {
    clearMagnetTimer();
    setMagnetPulseBoost(1);

    const idx = sequenceSeed % TRANSIT_SECTORS.length;
    const sector = TRANSIT_SECTORS[idx];
    const fallbackNodes = triggerNodes.length > 0
      ? triggerNodes
      : [createTriggerNode(`mp-${Date.now()}`, 'transit', sector, toUnit(controls.magnetFlow))];

    triggerStatePath(
      'magnet_pulse',
      [
        { state: 'POLARIZING', afterMs: 0 },
        { state: 'PAIRING', afterMs: 450 },
        { state: 'STABILIZING', afterMs: 950 },
        { state: 'IDLE', afterMs: 1050 },
      ],
      fallbackNodes,
      [
        createManualEvent(
          `manual-m-${Date.now()}`,
          'manual_magnet_pulse',
          sector,
          0.18 + toUnit(controls.magnetFlow) * 0.65,
          '⇄',
          'Magnet Flow',
        ),
      ],
    );

    magnetTimerRef.current = window.setTimeout(() => {
      setMagnetPulseBoost(0);
      magnetTimerRef.current = null;
    }, 2000);
    setSequenceSeed((current) => current + 1);
  }, [
    clearMagnetTimer,
    controls.magnetFlow,
    createManualEvent,
    sequenceSeed,
    triggerNodes,
    triggerStatePath,
  ]);

  const handleResetField = useCallback(() => {
    clearSequenceTimers();
    clearMagnetTimer();
    setVisualState('IDLE');
    setActiveEventType(null);
    setMagnetPulseBoost(0);
    setTriggerNodes([]);
    setManualEvents([]);
  }, [clearMagnetTimer, clearSequenceTimers]);

  const handleSpikeEruption = useCallback(
    (sector: number) => {
      if (!isMuted) {
        playSpikeChime(sector);
      }
      cameraRigRef.current?.triggerJolt();
      shockwaveRef.current?.addShockwave(sector);
      onSpikeClick?.(sector);
    },
    [isMuted, onSpikeClick, playSpikeChime],
  );

  const liveRegionText = useMemo(() => {
    return combinedEvents
      .slice(-3)
      .map((event) => {
        const roundedDelta = Math.round(event.delta * 100);
        return `${labels.eventAnnouncePrefix} S${event.sector}: ${event.trigger_symbol || '✦'} ${event.trigger_planet || ''} ${event.sector_domain || event.type} (${roundedDelta}%)`;
      })
      .join('. ');
  }, [combinedEvents, labels.eventAnnouncePrefix]);

  const activeSignalData = renderSignalData ?? signalData;

  if (loading && !activeSignalData) {
    return (
      <div className="mx-auto flex aspect-square w-full max-w-[560px] items-center justify-center rounded-3xl border border-white/10 bg-[#020509] text-sm text-white/70">
        {labels.loading}
      </div>
    );
  }

  if (!activeSignalData || shouldFallback) {
    return (
      <FallbackCanvas2D
        signalData={activeSignalData}
        resolution={resolution}
        error={error}
        onAudioToggle={toggleMute}
        isAudioEnabled={!isMuted}
        labels={{
          reducedMotionHint: labels.reducedMotionHint,
          resolution: labels.resolution,
          audioOn: labels.audioOn,
          audioOff: labels.audioOff,
          reload: labels.reload,
          renderError: labels.renderError,
        }}
      />
    );
  }

  return (
    <div
      className="relative mx-auto aspect-square w-full max-w-[760px] overflow-hidden rounded-3xl border border-white/10 bg-[#020509]"
      role="region"
      aria-label={labels.regionLabel}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key.toLowerCase() === 'm') {
          toggleMute();
        }
      }}
    >
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveRegionText}
      </div>

      <CanvasBoundary
        fallback={
          <FallbackCanvas2D
            signalData={activeSignalData}
            resolution={resolution}
            error={new Error(labels.renderError)}
            onAudioToggle={toggleMute}
            isAudioEnabled={!isMuted}
            labels={{
              reducedMotionHint: labels.reducedMotionHint,
              resolution: labels.resolution,
              audioOn: labels.audioOn,
              audioOff: labels.audioOff,
              reload: labels.reload,
              renderError: labels.renderError,
            }}
          />
        }
        onError={() => setForceFallback(true)}
      >
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 9], fov: 45 }}
          gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
        >
          <Suspense fallback={null}>
            <PerformanceGuard onLowPerformance={() => setForceFallback(true)} />

            <color attach="background" args={['#020509']} />

            {/* Background nebula — rendered first (lowest z) */}
            <NebulaBg transitIntensity={activeSignalData.transitIntensity} />

            <ambientLight intensity={0.5} />
            <pointLight position={[4, 6, 6]} intensity={0.9} color="#9ed7ff" />
            <pointLight position={[-6, -4, 4]} intensity={0.45} color="#ffc76d" />

            <CameraRig ref={cameraRigRef} peakSector={peakSector} />

            <GhostRings signalData={activeSignalData} reducedMotion={!!prefersReducedMotion} />

            <RingMesh
              signalData={activeSignalData}
              kpIndex={kpIndex}
              reducedMotion={!!prefersReducedMotion}
              pulseSeed={combinedEvents.length}
            />

            <EquilibriumLine thirtyDayAvg={activeSignalData.thirtyDayAvg} />
            <EnergyParticles transitIntensity={activeSignalData.transitIntensity} reducedMotion={!!prefersReducedMotion} />

            <DivergenceSpikes events={combinedEvents} onSpikeEruption={handleSpikeEruption} />
            <SpikeGlowTips events={combinedEvents} />
            <ShockwaveRings ref={shockwaveRef} />

            <TestFieldOverlay
              visualState={visualState}
              triggerNodes={triggerNodes}
              displayModes={displayModes}
              effectiveMagnetFlow={runtimeForces.effectiveMagnetFlow}
              effectiveSpaceDensity={runtimeForces.effectiveSpaceDensity}
              effectivePairCoherence={runtimeForces.effectivePairCoherence}
              pairDistance={runtimeForces.pairDistance}
              dischargeFrequency={runtimeForces.dischargeFrequency}
              mergeBias={runtimeForces.mergeBias}
            />

            <RingOverlays
              events={combinedEvents}
              resolution={resolution}
              isAudioEnabled={!isMuted}
              onAudioToggle={toggleMute}
              labels={{
                resolution: labels.resolution,
                audioOn: labels.audioOn,
                audioOff: labels.audioOff,
                latestEvents: labels.latestEvents,
              }}
            />

            <OrbitControls
              enabled={isInteractive}
              enablePan={false}
              enableZoom={false}
              minPolarAngle={Math.PI / 2.3}
              maxPolarAngle={Math.PI / 1.75}
              rotateSpeed={0.35}
              autoRotate={!isUserControlling}
              autoRotateSpeed={0.4}
              onStart={() => setIsUserControlling(true)}
              onEnd={() => setIsUserControlling(false)}
            />

            <PostFX />
          </Suspense>
        </Canvas>
      </CanvasBoundary>

      <TestControlPanel
        isCollapsed={isTestPanelCollapsed}
        visualState={visualState}
        activeEventType={activeEventType}
        controls={controls}
        displayModes={displayModes}
        runtime={{
          effectiveMagnetFlow: runtimeForces.effectiveMagnetFlow,
          effectiveSpaceDensity: runtimeForces.effectiveSpaceDensity,
          pairDistance: runtimeForces.pairDistance,
          dischargeFrequency: runtimeForces.dischargeFrequency,
        }}
        onToggleCollapsed={() => setIsTestPanelCollapsed((current) => !current)}
        onTriggerContribution={handleTriggerContribution}
        onTriggerTransit={handleTriggerTransit}
        onTriggerDual={handleTriggerDual}
        onPulseMagnetism={handlePulseMagnetism}
        onResetField={handleResetField}
        onControlChange={handleControlChange}
        onDisplayModeToggle={handleDisplayModeToggle}
      />
    </div>
  );
};

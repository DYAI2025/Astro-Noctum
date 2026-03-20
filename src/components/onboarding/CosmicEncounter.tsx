import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  lazy,
  Suspense,
} from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CosmicEncounterScene } from './CosmicEncounterScene';
import { CosmicEncounterMobile } from './CosmicEncounterMobile';
import { EncounterBirthForm } from './EncounterBirthForm';
import { LeviSpeechBubble } from './LeviSpeechBubble';
import { MyzeliumNetwork } from './MyzeliumNetwork';
import { useParallax } from './useParallax';
import { soulprintToNatalWeights } from '../fusion-ring-website/signatur-bridge';
import type { BootstrapResponse, SignatureDeltaResponse } from '../../lib/schemas/experience';

// Lazy-load heavy ring components
const FusionRingReveal = lazy(() => import('./FusionRingReveal'));
const SignatureRevealLazy = lazy(
  () => import('./SignatureReveal').then((m) => ({ default: m.SignatureReveal })),
);

// ── Phase definitions ────────────────────────────────────────────────

type EncounterPhase =
  | 'materializing'
  | 'levi-speaks'
  | 'birth-input'
  | 'calculating'
  | 'ring-reveal'
  | 'quiz'
  | 'complete';

// ── Levi speech texts (German) ───────────────────────────────────────

const LEVI_TEXTS = {
  greeting:
    'Willkommen, Reisender. Ich bin Levi, dein kosmischer Begleiter. Gemeinsam entdecken wir deine Signatur im Firmament.',
  formPrompt:
    'Teile mir deine Geburtsdaten mit, damit wir deine einzigartige kosmische Signatur berechnen koennen.',
  calculating: 'Die Sterne ordnen sich... Deine Signatur nimmt Form an.',
  reveal: 'Da ist sie. Deine kosmische Signatur.',
} as const;

// ── Props ────────────────────────────────────────────────────────────

interface CosmicEncounterProps {
  onSubmitBirth: (data: { date: string; tz: string; lon: number; lat: number }) => void;
  onComplete: (deltaData: SignatureDeltaResponse | null) => void;
  bootstrapData: BootstrapResponse | null;
  isLoading: boolean;
  ambientePause?: () => void;
  ambienteResume?: () => void;
}

// ── Fallback for Suspense ────────────────────────────────────────────

function RingFallback() {
  return (
    <div className="w-full h-full bg-black flex items-center justify-center">
      <div className="w-32 h-32 rounded-full border border-cyan-900/30 animate-pulse" />
    </div>
  );
}

// ── Mobile detection ─────────────────────────────────────────────────

function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false,
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isMobile;
}

// ── Component ────────────────────────────────────────────────────────

export function CosmicEncounter({
  onSubmitBirth,
  onComplete,
  bootstrapData,
  isLoading,
  ambientePause,
  ambienteResume,
}: CosmicEncounterProps) {
  const [phase, setPhase] = useState<EncounterPhase>('materializing');
  const [leviText, setLeviText] = useState('');
  const [leviVisible, setLeviVisible] = useState(false);
  const [formPulse, setFormPulse] = useState(0);
  const [leviSpeaking, setLeviSpeaking] = useState(0);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const isMobile = useIsMobile();
  const formParallax = useParallax(30);
  const leviParallax = useParallax(-50);

  // Compute natal weights when bootstrap data arrives
  const natalWeights = useMemo(() => {
    if (!bootstrapData?.soulprint_sectors) return undefined;
    return soulprintToNatalWeights(bootstrapData.soulprint_sectors);
  }, [bootstrapData]);

  // ── Phase 1: materializing → levi-speaks (3s auto-trigger) ────────

  useEffect(() => {
    if (phase !== 'materializing') return;
    const timer = setTimeout(() => {
      setPhase('levi-speaks');
      setLeviText(LEVI_TEXTS.greeting);
      setLeviVisible(true);
      setLeviSpeaking(1);
    }, 3000);
    return () => clearTimeout(timer);
  }, [phase]);

  // ── Phase 2: levi-speaks → birth-input ────────────────────────────

  const greetingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleGreetingComplete = useCallback(() => {
    // After greeting finishes, show form prompt then transition
    setLeviText(LEVI_TEXTS.formPrompt);
    setLeviSpeaking(0.5);

    greetingTimerRef.current = setTimeout(() => {
      if (phaseRef.current === 'levi-speaks') {
        setPhase('birth-input');
        setFormPulse(1);
        setLeviSpeaking(0);
      }
    }, 2500);
  }, []);

  // Cleanup greeting timer on unmount
  useEffect(() => {
    return () => {
      if (greetingTimerRef.current) clearTimeout(greetingTimerRef.current);
    };
  }, []);

  // ── Phase 3→4: birth-input → calculating ─────────────────────────

  const handleBirthSubmit = useCallback(
    (data: { date: string; tz: string; lon: number; lat: number }) => {
      setPhase('calculating');
      setLeviText(LEVI_TEXTS.calculating);
      setLeviVisible(true);
      setLeviSpeaking(0.7);
      setFormPulse(0);
      ambientePause?.();
      onSubmitBirth(data);
    },
    [onSubmitBirth, ambientePause],
  );

  // ── Phase 4→5: calculating → ring-reveal (when data arrives) ─────

  useEffect(() => {
    if (phase !== 'calculating') return;
    if (!bootstrapData || isLoading) return;

    const timer = setTimeout(() => {
      if (phaseRef.current === 'calculating') {
        setPhase('ring-reveal');
        setLeviText(LEVI_TEXTS.reveal);
        setLeviSpeaking(0.3);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [phase, bootstrapData, isLoading]);

  // ── Phase 5→6: ring-reveal → quiz ────────────────────────────────

  const handleRingRevealComplete = useCallback(() => {
    setPhase('quiz');
    setLeviVisible(false);
    setLeviSpeaking(0);
  }, []);

  // ── Phase 6→7: quiz → complete ───────────────────────────────────

  const handleQuizComplete = useCallback(
    (deltaData: SignatureDeltaResponse | null) => {
      setPhase('complete');
      ambienteResume?.();
      onComplete(deltaData);
    },
    [onComplete, ambienteResume],
  );

  // ── Myzelium anchors ──────────────────────────────────────────────

  const myzeliumActive =
    phase === 'levi-speaks' || phase === 'birth-input' || phase === 'calculating';
  const myzeliumIntensity = phase === 'calculating' ? 0.8 : phase === 'levi-speaks' ? 0.4 : 0.6;

  // ── Render ────────────────────────────────────────────────────────

  const SceneComponent = isMobile ? CosmicEncounterMobile : CosmicEncounterScene;

  const showPreRevealUI =
    phase === 'materializing' ||
    phase === 'levi-speaks' ||
    phase === 'birth-input' ||
    phase === 'calculating';

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Background scene (always present during pre-reveal phases) */}
      <AnimatePresence mode="wait">
        {showPreRevealUI && (
          <motion.div
            key="scene-layer"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 1.2 } }}
          >
            <SceneComponent
              phase={phase}
              formOffset={formParallax}
              leviOffset={leviParallax}
              formPulse={formPulse}
              leviSpeaking={leviSpeaking}
            />

            {/* Myzelium network overlay */}
            <MyzeliumNetwork
              leftAnchor={{ x: isMobile ? 50 : 30, y: 50 }}
              rightAnchor={{ x: isMobile ? 50 : 70, y: 50 }}
              active={myzeliumActive}
              intensity={myzeliumIntensity}
              className="absolute inset-0 pointer-events-none z-10"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Levi Speech Bubble */}
      <AnimatePresence>
        {leviVisible && phase !== 'ring-reveal' && phase !== 'quiz' && phase !== 'complete' && (
          <motion.div
            key="levi-bubble"
            className="absolute z-20"
            style={{
              top: isMobile ? '15%' : '25%',
              right: isMobile ? '5%' : '10%',
              maxWidth: isMobile ? '90%' : '380px',
              transform: `translate(${leviParallax.x * 0.3}px, ${leviParallax.y * 0.3}px)`,
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <LeviSpeechBubble
              text={leviText}
              visible={leviVisible}
              speed={40}
              onComplete={phase === 'levi-speaks' ? handleGreetingComplete : undefined}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Birth Form (phase: birth-input) */}
      <AnimatePresence>
        {(phase === 'birth-input' || phase === 'calculating') && (
          <motion.div
            key="birth-form"
            className="absolute z-30 flex items-center justify-center"
            style={{
              left: isMobile ? '5%' : '8%',
              top: isMobile ? '35%' : '20%',
              width: isMobile ? '90%' : '420px',
              transform: `translate(${formParallax.x * 0.5}px, ${formParallax.y * 0.5}px)`,
            }}
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{
              opacity: phase === 'calculating' ? 0.5 : 1,
              scale: 1,
              y: 0,
            }}
            exit={{ opacity: 0, scale: 0.95, y: -20, transition: { duration: 0.6 } }}
          >
            <EncounterBirthForm
              onSubmit={handleBirthSubmit}
              isLoading={phase === 'calculating'}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calculating spinner */}
      <AnimatePresence>
        {phase === 'calculating' && (
          <motion.div
            key="calculating-indicator"
            className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="w-16 h-16 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ring Reveal (phase: ring-reveal) */}
      <AnimatePresence>
        {phase === 'ring-reveal' && (
          <motion.div
            key="ring-reveal"
            className="absolute inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 1.5 } }}
            exit={{ opacity: 0 }}
          >
            <Suspense fallback={<RingFallback />}>
              <FusionRingReveal
                natalWeights={natalWeights}
                onComplete={handleRingRevealComplete}
                autoReveal
              />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SignatureReveal / Quiz (phase: quiz) */}
      <AnimatePresence>
        {phase === 'quiz' && bootstrapData && (
          <motion.div
            key="signature-reveal"
            className="absolute inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.8 } }}
            exit={{ opacity: 0 }}
          >
            <Suspense fallback={<RingFallback />}>
              <SignatureRevealLazy
                bootstrapData={bootstrapData}
                onComplete={handleQuizComplete}
              />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

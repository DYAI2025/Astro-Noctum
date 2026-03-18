import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FusionRingWebsiteCanvas } from '../fusion-ring-website/FusionRingWebsiteCanvas';
import FusionRingCanvasV2 from '../fusion-ring-website/FusionRingCanvasV2';
import { soulprintToNatalWeights, quizSectorsToQuizWeights } from '../fusion-ring-website/signatur-bridge';
import { signatureDelta } from '../../services/experience';
import { trackEvent } from '../../lib/analytics';
import { isFeatureEnabled } from '../../lib/feature-flags';
import type { BootstrapResponse, SignatureDeltaResponse } from '../../lib/schemas/experience';

// ── Quiz options (German UI) ─────────────────────────────────────────

const QUIZ_OPTIONS = [
  { keyword: 'expression', label: 'Ich druecke mich gerne kreativ aus' },
  { keyword: 'analytical', label: 'Ich analysiere gerne komplexe Zusammenhaenge' },
  { keyword: 'harmony', label: 'Harmonie in Beziehungen ist mir sehr wichtig' },
  { keyword: 'adventure', label: 'Ich suche staendig neue Erfahrungen' },
] as const;

// ── Props ────────────────────────────────────────────────────────────

interface Props {
  bootstrapData: BootstrapResponse;
  onComplete: (deltaData: SignatureDeltaResponse | null) => void;
}

// ── Component ────────────────────────────────────────────────────────

export function SignatureReveal({ bootstrapData, onComplete }: Props) {
  const { profile, soulprint_sectors, signature_blueprint } = bootstrapData;

  const [activeSectors, setActiveSectors] = useState<number[]>(soulprint_sectors);
  const useV2 = isFeatureEnabled('signature_engine_v2');
  const [natalWeights] = useState(() => soulprintToNatalWeights(soulprint_sectors));
  const [quizWeights, setQuizWeights] = useState<Record<string, number> | undefined>();
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasTrackedRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mountedRef = useRef(true);

  // Cleanup timeouts and track unmount
  useEffect(() => () => {
    mountedRef.current = false;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  // Track reveal on mount
  useEffect(() => {
    if (!hasTrackedRef.current) {
      trackEvent('signature_reveal_seen');
      hasTrackedRef.current = true;
    }
  }, []);

  // Handle quiz answer selection
  const handleQuizAnswer = useCallback(async (keyword: string) => {
    if (isAnimating || selectedKeyword) return;

    setSelectedKeyword(keyword);
    setIsAnimating(true);
    setError(null);

    try {
      const delta = await signatureDelta(
        soulprint_sectors,
        signature_blueprint,
        keyword,
      );

      trackEvent('signature_delta_applied', { keyword });

      // Animate: blend old sectors to new quiz_sectors over ~800ms
      // We set the new sectors and let the canvas interpolate visually
      setActiveSectors(delta.quiz_sectors);
      setQuizWeights(quizSectorsToQuizWeights(delta.quiz_sectors));

      // Wait 2s for the user to see the animation, then complete
      timeoutRef.current = setTimeout(() => {
        if (mountedRef.current) onComplete(delta);
      }, 2000);
    } catch (err) {
      console.error('[SignatureReveal] Delta failed:', err);
      setError('Etwas ist schiefgelaufen. Du kannst fortfahren.');
      setIsAnimating(false);
      setSelectedKeyword(null);

      // Allow fallthrough after a brief delay on error
      timeoutRef.current = setTimeout(() => {
        if (mountedRef.current) onComplete(null);
      }, 3000);
    }
  }, [isAnimating, selectedKeyword, soulprint_sectors, signature_blueprint, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="w-full max-w-lg mx-auto flex flex-col items-center gap-8"
    >
      {/* Ring visualization */}
      <motion.div
        className="relative w-56 h-56 sm:w-72 sm:h-72"
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
      >
        {useV2 ? (
          <FusionRingCanvasV2
            natalWeights={natalWeights}
            quizWeights={quizWeights}
            showUI={false}
            className="w-full h-full"
          />
        ) : (
          <FusionRingWebsiteCanvas
            soulProfile={activeSectors}
            className="w-full h-full"
          />
        )}
      </motion.div>

      {/* Profile summary */}
      <motion.div
        className="text-center space-y-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
      >
        <h2 className="font-serif text-2xl sm:text-3xl text-[#1E2A3A]">
          Deine Signatur
        </h2>
        <div className="flex flex-wrap justify-center gap-3 text-[10px] uppercase tracking-[0.2em] text-[#8B6914]/70">
          <span>{profile.sun_sign}</span>
          <span className="text-[#8B6914]/30">|</span>
          <span>{profile.moon_sign}</span>
          <span className="text-[#8B6914]/30">|</span>
          <span>Asz. {profile.ascendant_sign}</span>
          <span className="text-[#8B6914]/30">|</span>
          <span>{profile.day_master}</span>
        </div>
        <p className="text-xs text-[#1E2A3A]/40 mt-1">
          Harmonie-Index: {Math.round(profile.harmony_index * 100)}%
        </p>
      </motion.div>

      {/* Quiz question */}
      <motion.div
        className="w-full space-y-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.6 }}
      >
        <p className="text-center text-sm text-[#1E2A3A]/60 font-medium">
          Was beschreibt dich am besten?
        </p>

        <div className="grid grid-cols-1 gap-2.5">
          <AnimatePresence mode="wait">
            {QUIZ_OPTIONS.map((option, i) => {
              const isSelected = selectedKeyword === option.keyword;
              const isDisabled = selectedKeyword !== null && !isSelected;

              return (
                <motion.button
                  key={option.keyword}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{
                    opacity: isDisabled ? 0.35 : 1,
                    x: 0,
                    scale: isSelected ? 1.02 : 1,
                  }}
                  transition={{ delay: 1.2 + i * 0.1, duration: 0.4 }}
                  onClick={() => handleQuizAnswer(option.keyword)}
                  disabled={isAnimating || selectedKeyword !== null}
                  className={`
                    w-full px-5 py-3.5 rounded-xl text-left text-sm transition-all
                    border
                    ${isSelected
                      ? 'border-[#D4AF37]/50 bg-[#D4AF37]/10 text-[#8B6914]'
                      : 'border-[#8B6914]/15 bg-white/60 text-[#1E2A3A]/70 hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/05'
                    }
                    disabled:cursor-not-allowed
                  `}
                >
                  {option.label}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Error message */}
      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-amber-600 text-center"
        >
          {error}
        </motion.p>
      )}

      {/* Loading indicator during animation */}
      {isAnimating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2"
        >
          <div className="w-1 h-1 bg-[#8B6914] rounded-full animate-ping" />
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#8B6914]/50">
            Signatur wird berechnet...
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}

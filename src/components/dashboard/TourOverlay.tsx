import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { TourStep } from '@/src/hooks/useDashboardTour';

interface TourOverlayProps {
  step: TourStep;
  birthDate: string;
  birthCity: string;
  onNext: () => void;
  onSkip: () => void;
  onLeviStart?: () => void;
  /** Ref to the sentinel element this step refers to — popup positions near it */
  anchorRef?: React.RefObject<HTMLDivElement | null>;
}

const STEP_CONTENT: Record<
  Exclude<TourStep, 'done'>,
  (props: TourOverlayProps) => { text: string; buttons: React.ReactNode }
> = {
  0: ({ birthDate, birthCity, onNext }) => {
    const trimmedBirthDate = birthDate?.trim();
    const trimmedBirthCity = birthCity?.trim();
    const datePart = trimmedBirthDate ? ` am ${trimmedBirthDate}` : '';
    const cityPart = trimmedBirthCity ? ` in ${trimmedBirthCity}` : '';
    return {
      text: `Willkommen zum Himmel deiner Geburt${datePart}${cityPart}`,
      buttons: <GoldButton onClick={onNext}>OK</GoldButton>,
    };
  },
  1: ({ onNext }) => ({
    text: 'Schau dir deine Zeichen an. Klicke auf die Kacheln, um mehr darüber zu erfahren.',
    buttons: <GoldButton onClick={onNext}>OK</GoldButton>,
  }),
  2: ({ onNext, onLeviStart }) => ({
    text: 'Das ist Levi, dein persönlicher kosmischer Berater.\n\nDeine erste Sitzung — 10 Minuten gratis.',
    buttons: (
      <div className="flex gap-3">
        <GoldButton onClick={() => { onLeviStart?.(); onNext(); }}>JETZT SPRECHEN</GoldButton>
        <button
          onClick={onNext}
          className="px-5 py-2.5 rounded-lg text-sm font-medium text-gold/60 border border-gold/20 hover:border-gold/40 transition-colors"
        >
          SPÄTER
        </button>
      </div>
    ),
  }),
  3: ({ onNext }) => ({
    text: 'Oben findest du deine Signatur — dort verfeinerst du dein kosmisches Profil.\n\nScrolle weiter für dein Tageshoroskop und deinen Soul Blueprint.',
    buttons: <GoldButton onClick={onNext}>VERSTANDEN</GoldButton>,
  }),
};

function GoldButton({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="px-6 py-2.5 rounded-lg bg-gold/20 border border-gold/40 text-gold font-semibold text-sm hover:bg-gold/30 transition-colors"
    >
      {children}
    </button>
  );
}

export function TourOverlay(props: TourOverlayProps) {
  const { step, anchorRef } = props;
  const cardRef = useRef<HTMLDivElement>(null);

  // Lock body scroll while tour popup is active
  useEffect(() => {
    if (step === 'done') return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [step]);

  // Scroll the anchor into view when the step becomes visible
  useEffect(() => {
    if (step === 'done') return;
    const anchor = anchorRef?.current;
    if (anchor) {
      anchor.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [step, anchorRef]);

  if (step === 'done') return null;

  const { text, buttons } = STEP_CONTENT[step](props);

  // Step 0: centered overlay (Planetarium fills the screen)
  // Steps 1-3: positioned near their anchor — no blur, semi-transparent scrim
  const isCentered = step === 0;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        className={`fixed inset-0 z-[100] ${
          isCentered
            ? 'flex items-center justify-center bg-black/50'
            : 'bg-black/20'
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        // Prevent clicks on the scrim from doing anything (no dismiss)
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          ref={cardRef}
          className={`max-w-md mx-4 p-6 rounded-2xl border border-gold/20 bg-obsidian/95 shadow-2xl ${
            isCentered
              ? ''
              : 'absolute left-1/2 -translate-x-1/2'
          }`}
          style={
            // For non-centered steps, position the card near the anchor
            !isCentered && anchorRef?.current
              ? { top: anchorRef.current.getBoundingClientRect().top + window.scrollY + 16 }
              : !isCentered
                ? { top: '40%' }
                : undefined
          }
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          {/* Pointer arrow for anchored steps */}
          {!isCentered && (
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-obsidian/95 border-l border-t border-gold/20" />
          )}
          <p className="text-white/90 text-base leading-relaxed whitespace-pre-line mb-5">
            {text}
          </p>
          <div className="flex justify-end">{buttons}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

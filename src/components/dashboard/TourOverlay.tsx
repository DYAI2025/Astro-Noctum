import { AnimatePresence, motion } from 'motion/react';
import type { TourStep } from '@/src/hooks/useDashboardTour';

interface TourOverlayProps {
  step: TourStep;
  birthDate: string;
  birthCity: string;
  onNext: () => void;
  onSkip: () => void;
  onLeviStart?: () => void;
}

const STEP_CONTENT: Record<
  Exclude<TourStep, 'done'>,
  (props: TourOverlayProps) => { text: string; buttons: React.ReactNode }
> = {
  0: ({ birthDate, birthCity, onNext }) => ({
    text: `Willkommen zum Himmel deiner Geburt am ${birthDate} in ${birthCity}`,
    buttons: <GoldButton onClick={onNext}>OK</GoldButton>,
  }),
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
  const { step } = props;

  if (step === 'done') return null;

  const { text, buttons } = STEP_CONTENT[step](props);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm bg-black/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="glass-card max-w-md mx-4 p-6 rounded-2xl border border-gold/15 bg-obsidian/95 shadow-xl"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <p className="text-white/90 text-base leading-relaxed whitespace-pre-line mb-5">
            {text}
          </p>
          <div className="flex justify-end">{buttons}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

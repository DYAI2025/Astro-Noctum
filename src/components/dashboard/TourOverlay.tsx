import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { TourStep } from '@/src/hooks/useDashboardTour';
import { useLanguage } from '../../contexts/LanguageContext';

interface TourOverlayProps {
  step: TourStep;
  birthDate: string;
  birthCity: string;
  onNext: () => void;
  onSkip: () => void;
  /** Ref to the sentinel element this step refers to — popup positions near it */
  anchorRef?: React.RefObject<HTMLDivElement | null>;
}

/** Format ISO date string to long format using the provided month names array */
function formatBirthDate(raw: string, months: string[]): string {
  try {
    // Handle both "YYYY-MM-DD" and "YYYY-MM-DDThh:mm:ss" formats
    const datePart = raw.includes('T') ? raw.split('T')[0] : raw;
    const [y, m, d] = datePart.split('-').map(Number);
    if (!y || !m || !d) return raw;
    return `${d}. ${months[m - 1]} ${y}`;
  } catch {
    return raw;
  }
}

export function TourOverlay(props: TourOverlayProps) {
  const { step, birthDate, birthCity, anchorRef, onNext } = props;
  const { t } = useLanguage();

  const MONTHS = [
    t('tour.month.january'), t('tour.month.february'), t('tour.month.march'),
    t('tour.month.april'), t('tour.month.may'), t('tour.month.june'),
    t('tour.month.july'), t('tour.month.august'), t('tour.month.september'),
    t('tour.month.october'), t('tour.month.november'), t('tour.month.december'),
  ];

  // Scroll the anchor into view when the step becomes visible
  useEffect(() => {
    if (step === 'done') return;
    const anchor = anchorRef?.current;
    if (anchor) {
      anchor.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [step, anchorRef]);

  if (step === 'done') return null;

  let text: string;
  if (step === 0) {
    const formatted = formatBirthDate(birthDate, MONTHS);
    const city = birthCity?.trim();
    if (city) {
      text = t('tour.step0WithCity')
        .replace('{date}', formatted)
        .replace('{city}', city);
    } else {
      text = t('tour.step0NoCity').replace('{date}', formatted);
    }
  } else {
    text = t('tour.step1');
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
      >
        <motion.div
          className="pointer-events-auto max-w-lg w-[90vw] min-h-[30vh] mx-4 px-10 py-12 rounded-2xl border border-gold/20 bg-obsidian/95 shadow-2xl backdrop-blur-sm flex flex-col items-center justify-center gap-8"
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
        >
          <p className="font-serif text-xl md:text-2xl text-gold-deep/90 text-center leading-relaxed whitespace-pre-line">
            {text}
          </p>
          <button
            onClick={onNext}
            className="px-8 py-3 rounded-xl bg-gold/15 border border-gold/30 text-gold font-serif text-lg tracking-wide hover:bg-gold/25 hover:border-gold/50 transition-colors duration-300"
          >
            {t('tour.next')}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

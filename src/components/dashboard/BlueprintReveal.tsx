import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import BlueprintCard from './BlueprintCard';
import { useLanguage } from '../../contexts/LanguageContext';

const STORAGE_KEY = 'bazodiac_blueprint_seen';

interface BlueprintRevealProps {
  content: string;
  aspects?: string[];
  elements?: string[];
  onCtaClick?: () => void;
}

export function BlueprintReveal({ content, aspects, elements, onCtaClick }: BlueprintRevealProps) {
  const { lang } = useLanguage();
  const [revealed, setRevealed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return true; // if localStorage unavailable, skip teaser
    }
  });

  function handleReveal() {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignore storage errors
    }
    setRevealed(true);
  }

  // Null-safe: show skeleton when content is missing or empty
  if (!content || content.trim().length === 0) {
    return (
      <div className="animate-pulse bg-zinc-900/40 rounded-2xl h-[220px] border border-zinc-800" />
    );
  }

  return (
    <AnimatePresence mode="wait">
      {!revealed ? (
        // -- Teaser Card --
        <motion.div
          key="teaser"
          data-testid="blueprint-teaser"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.4, ease: 'easeIn' }}
          className="relative overflow-hidden rounded-[2rem] border border-[#D4AF37]/15 bg-[#0A0A14]/80 backdrop-blur-xl p-8 md:p-10 min-h-[220px] flex flex-col items-center justify-center text-center gap-6"
        >
          {/* Background glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-[#D4AF37]/10 via-transparent to-purple-500/10 rounded-[2rem] blur opacity-40 pointer-events-none" />

          <div className="relative space-y-3">
            <p className="text-[9px] uppercase tracking-[0.45em] text-[#D4AF37]/50">
              {lang === 'de' ? 'Kosmische Analyse' : 'Cosmic Analysis'}
            </p>
            <h3 className="font-serif text-2xl text-white/90">
              {lang === 'de' ? 'Dein Bazodiac Blueprint' : 'Your Bazodiac Blueprint'}
            </h3>
            <p className="text-sm text-white/40 max-w-xs leading-relaxed">
              {lang === 'de'
                ? 'Deine einzigartige kosmische Signatur. Bereit zur Enthüllung.'
                : 'Your unique cosmic signature. Ready to be revealed.'}
            </p>
          </div>

          <button
            onClick={handleReveal}
            className={[
              'relative font-serif text-sm uppercase tracking-[0.25em]',
              'px-8 py-3 rounded-full border border-[#D4AF37]/40',
              'text-[#D4AF37] hover:text-white hover:border-[#D4AF37]',
              'hover:bg-[#D4AF37]/10 transition-all duration-300',
            ].join(' ')}
          >
            {lang === 'de' ? 'Entdecken' : 'Reveal'}
          </button>
        </motion.div>
      ) : (
        // -- Blueprint Card (animated entrance on first reveal) --
        <motion.div
          key="blueprint"
          initial={{ opacity: 0, scale: 0.95, filter: 'blur(8px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        >
          <BlueprintCard
            content={content}
            aspects={aspects}
            elements={elements}
            onCtaClick={onCtaClick}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronDown } from 'lucide-react';
import { trackEvent } from '../../lib/analytics';
import { useLanguage } from '../../contexts/LanguageContext';
import type { VibesResponse } from '../../services/vibes';

// ── Types ────────────────────────────────────────────────────────────

interface VibesModalProps {
  data: VibesResponse;
  onClose: () => void;
}

// ── Component ────────────────────────────────────────────────────────

export function VibesModal({ data, onClose }: VibesModalProps) {
  const { t } = useLanguage();
  const [explainOpen, setExplainOpen] = useState(false);
  const hasTrackedRef = useRef(false);

  // Track open on mount
  useEffect(() => {
    if (!hasTrackedRef.current) {
      trackEvent('vibes_opened');
      hasTrackedRef.current = true;
    }
  }, []);

  const handleClose = () => {
    trackEvent('vibes_closed');
    onClose();
  };

  // Stable ref for Escape handler
  const handleCloseRef = useRef(handleClose);
  handleCloseRef.current = handleClose;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCloseRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleExplainToggle = () => {
    if (!explainOpen) {
      trackEvent('vibes_explain_opened');
    }
    setExplainOpen((prev) => !prev);
  };

  const whyLabel = t('dashboard.vibesModal.whyLabel');
  const signaturLabel = t('dashboard.vibesModal.signaturLabel');
  const transitLabel = t('dashboard.vibesModal.transitLabel');

  return (
      <motion.div
        key="vibes-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-obsidian/90 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal */}
        <motion.div
          key="vibes-card"
          className="relative z-10 w-full max-w-sm mx-4"
          initial={{ opacity: 0, scale: 0.93, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 16 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="glass-card rounded-2xl p-6 flex flex-col items-center gap-5 border border-gold/10">
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors"
              aria-label={t('dashboard.vibesModal.closeLabel')}
            >
              <X size={18} />
            </button>

            {/* Horizon label */}
            <p className="text-[9px] uppercase tracking-[0.4em] text-gold/50 mt-1">
              {data.horizon}
            </p>

            {/* Level 1: Kurzsignal — leading-normal (1.5) satisfies REQ-USA-mobile-first-readability */}
            {data.kurzsignal?.trim() ? (
              <p className="font-serif text-2xl sm:text-3xl text-center leading-normal text-gold max-w-[24ch]">
                {data.kurzsignal}
              </p>
            ) : (
              <p className="text-sm text-white/40 text-center italic">
                {t('dashboard.vibesModal.emptyContent')}
              </p>
            )}

            {/* Level 2: Treiber pills — text-sm (14px) satisfies ≥14px readability requirement */}
            <div className="flex flex-wrap justify-center gap-2">
              {data.treiber.map((tag) => (
                <span
                  key={tag}
                  className="bg-gold/10 text-gold/80 rounded-full px-3 py-1 text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Level 3: Explain toggle */}
            <button
              onClick={handleExplainToggle}
              className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors mt-1"
            >
              <span>{whyLabel}</span>
              <motion.span
                animate={{ rotate: explainOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown size={14} />
              </motion.span>
            </button>

            {/* Explain panel */}
            <AnimatePresence initial={false}>
              {explainOpen && (
                <motion.div
                  key="vibes-explain"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="w-full overflow-hidden"
                >
                  <div className="flex flex-col gap-3 pt-2 border-t border-gold/10">
                    {/* Main explanation */}
                    <p className="text-sm text-white/70 leading-relaxed">
                      {data.erklaerung}
                    </p>

                    {/* Signatur context */}
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gold/40 mb-0.5">
                        {signaturLabel}
                      </p>
                      <p className="text-xs text-white/55 leading-relaxed">
                        {data.explain.signatur_context}
                      </p>
                    </div>

                    {/* Transit context */}
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gold/40 mb-0.5">
                        {transitLabel}
                      </p>
                      <p className="text-xs text-white/55 leading-relaxed">
                        {data.explain.transit_context}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
  );
}

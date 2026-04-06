import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Clock, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { fetchVibes, type VibesResponse } from '../../services/vibes';
import { formatCooldown } from '../../lib/format-cooldown';
import { VibesModal } from './VibesModal';
import { PremiumGate } from '../PremiumGate';

// ── Types ────────────────────────────────────────────────────────────

interface VibesSectionProps {
  userId: string;
}

// ── Component ────────────────────────────────────────────────────────

export function VibesSection({ userId }: VibesSectionProps) {
  const { lang, t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vibesData, setVibesData] = useState<VibesResponse | null>(null);
  const [showModal, setShowModal] = useState(false);
  const fetchingRef = useRef(false);

  const handleFetch = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const data = await fetchVibes(userId);
      setVibesData(data);
      setShowModal(true);
    } catch (err) {
      console.error('[VibesSection] Fetch failed:', err);
      setError(t('vibesSection.fetchError'));
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [userId, lang, t]);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
  }, []);

  const isCooldown = vibesData?.cooldown?.active;
  const cooldownLabel = isCooldown
    ? `${t('vibesSection.cooldownPrefix')}${formatCooldown(vibesData.cooldown!.remaining_ms, lang)}`
    : null;
  const buttonLabel = t('vibesSection.buttonLabel');

  return (
    <>
      <PremiumGate teaser={t('vibesSection.premiumTeaser')}>
        <button
          onClick={handleFetch}
          disabled={loading}
          className="w-full max-w-sm group relative"
        >
          <div className="cosmic-tile p-4 flex items-center justify-between gap-4 group-hover:border-gold/30 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold group-hover:scale-110 transition-transform">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                ) : (
                  <Sparkles size={20} />
                )}
              </div>
              <div className="text-left">
                <p className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] opacity-60">
                  {t('vibesSection.sectionTitle')}
                </p>
                <p className="text-sm font-serif text-gold/90">
                  {buttonLabel}
                </p>
                {cooldownLabel && (
                  <p className="flex items-center gap-1 text-[9px] text-gold/40 mt-0.5">
                    <Clock size={8} />
                    <span>{cooldownLabel}</span>
                  </p>
                )}
              </div>
            </div>
            <ChevronRight size={16} className="text-gold/30 group-hover:text-gold/60 transition-colors" />
          </div>

          {/* Error message inline */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -bottom-6 left-0 right-0 text-center"
            >
              <p className="text-[10px] text-red-400/80">{error}</p>
            </motion.div>
          )}
        </button>
      </PremiumGate>

      {/* Modal */}
      <AnimatePresence>
        {showModal && vibesData && (
          <VibesModal data={vibesData} onClose={handleCloseModal} />
        )}
      </AnimatePresence>
    </>
  );
}

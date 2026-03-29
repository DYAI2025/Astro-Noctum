import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { fetchVibes, type VibesResponse } from '../../services/vibes';
import { VibesModal } from './VibesModal';

// ── Types ────────────────────────────────────────────────────────────

interface VibesSectionProps {
  userId: string;
}

// ── Component ────────────────────────────────────────────────────────

export function VibesSection({ userId }: VibesSectionProps) {
  const { lang } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vibesData, setVibesData] = useState<VibesResponse | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleFetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchVibes(userId);
      setVibesData(data);
      setShowModal(true);
    } catch (err) {
      console.error('[VibesSection] Fetch failed:', err);
      setError(
        lang === 'de'
          ? 'Vibe konnte nicht geladen werden. Versuche es erneut.'
          : 'Could not load vibe. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }, [userId, lang]);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
  }, []);

  const buttonLabel = lang === 'de' ? 'Vibe abrufen' : 'Get Vibe';

  return (
    <>
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={handleFetch}
          disabled={loading}
          className="relative bg-gold/10 text-gold rounded-xl px-6 py-3 hover:bg-gold/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
        >
          {loading ? (
            <>
              {/* Skeleton pulse */}
              <span className="inline-block w-4 h-4 rounded-full bg-gold/30 animate-pulse" />
              <span className="inline-block w-20 h-4 rounded bg-gold/20 animate-pulse" />
            </>
          ) : (
            <>
              <Sparkles size={16} className="opacity-70" />
              <span>{buttonLabel}</span>
            </>
          )}
        </button>

        {/* Error message */}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-red-400/80"
          >
            {error}
          </motion.p>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && vibesData && (
          <VibesModal data={vibesData} onClose={handleCloseModal} />
        )}
      </AnimatePresence>
    </>
  );
}

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Clock } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { fetchVibes, type VibesResponse } from '../../services/vibes';
import { VibesModal } from './VibesModal';

// ── Types ────────────────────────────────────────────────────────────

interface VibesSectionProps {
  userId: string;
}

// ── Helpers ──────────────────────────────────────────────────────────

function formatCooldown(ms: number, lang: string): string {
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const minutes = Math.ceil((ms % (60 * 60 * 1000)) / (60 * 1000));
  if (hours > 0) {
    return lang === 'de' ? `${hours}h ${minutes}min` : `${hours}h ${minutes}min`;
  }
  return lang === 'de' ? `${minutes} Min.` : `${minutes} min`;
}

// ── Component ────────────────────────────────────────────────────────

export function VibesSection({ userId }: VibesSectionProps) {
  const { lang } = useLanguage();
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
      setError(
        lang === 'de'
          ? 'Vibe konnte nicht geladen werden. Versuche es erneut.'
          : 'Could not load vibe. Please try again.',
      );
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [userId, lang]);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
  }, []);

  const isCooldown = vibesData?.cooldown?.active;
  const cooldownLabel = isCooldown
    ? lang === 'de'
      ? `Nächster Vibe in ${formatCooldown(vibesData.cooldown!.remaining_ms, lang)}`
      : `Next vibe in ${formatCooldown(vibesData.cooldown!.remaining_ms, lang)}`
    : null;
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

        {/* Cooldown indicator */}
        {cooldownLabel && (
          <p className="flex items-center gap-1 text-[10px] text-gold/40">
            <Clock size={10} />
            <span>{cooldownLabel}</span>
          </p>
        )}

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

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, PhoneOff, Minimize2, Maximize2, Lock } from 'lucide-react';
import { useLevi } from '../contexts/LeviContext';
import { useLanguage } from '../contexts/LanguageContext';

// ─────────────────────────────────────────────────────────────────────────────
// LeviFloatingWidget — Global floating voice agent
// Lives at App-level, outside React Router. Persists across all pages.
// Minimised: small pill in bottom-right. Expanded: full conversation panel.
// ─────────────────────────────────────────────────────────────────────────────

interface LeviFloatingWidgetProps {
  userId: string;
  sunSign: string;
  zodiacAnimal: string;
  dominantEl: string;
  onUpgrade: () => void;
}

export function LeviFloatingWidget({
  userId,
  sunSign,
  zodiacAnimal,
  dominantEl,
  onUpgrade,
}: LeviFloatingWidgetProps) {
  const { active, expanded, isPremium, startCall, endCall, toggleExpanded } = useLevi();
  const { t } = useLanguage();
  const widgetRef = useRef<HTMLDivElement>(null);

  const elevenLabsAgentId =
    import.meta.env.VITE_ELEVENLABS_AGENT_ID || 'agent_1801kje0zqc8e4b89swbt7wekawv';

  // Load ElevenLabs widget script once globally
  useEffect(() => {
    if (!document.querySelector('script[src="https://unpkg.com/@elevenlabs/convai-widget-embed"]')) {
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
      s.async = true;
      s.type = 'text/javascript';
      document.body.appendChild(s);
    }
  }, []);

  return (
    <div
      ref={widgetRef}
      className="fixed z-[99999] transition-all duration-300 ease-out"
      style={{
        bottom: expanded ? '24px' : '80px', // above mobile nav when minimised
        right: expanded ? '16px' : '16px',
      }}
    >
      <AnimatePresence mode="wait">
        {/* ── Expanded Panel ─────────────────────────────────────── */}
        {expanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-[320px] max-w-[calc(100vw-32px)] rounded-2xl overflow-hidden shadow-2xl border border-[#8B6914]/20"
            style={{
              background: 'linear-gradient(180deg, rgba(15,12,8,0.95) 0%, rgba(25,20,12,0.97) 100%)',
              backdropFilter: 'blur(24px)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#8B6914]/15">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full breathing ${
                  active
                    ? 'bg-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.75)]'
                    : 'bg-[#8B6914] shadow-[0_0_8px_rgba(139,105,20,0.55)]'
                }`} />
                <span className="text-xs font-medium text-[#D4AF37] tracking-wider uppercase">
                  Levi
                </span>
                <span className="text-[10px] text-white/40">
                  {active ? t('dashboard.levi.active') : t('dashboard.levi.ready')}
                </span>
              </div>
              <button
                onClick={toggleExpanded}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                aria-label="Minimise Levi"
              >
                <Minimize2 className="w-3.5 h-3.5 text-white/50" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 flex flex-col items-center gap-3">
              <p className="text-xs text-white/50 text-center leading-relaxed">
                {active ? t('dashboard.levi.activeDesc') : t('dashboard.levi.readyDesc')}
              </p>

              {isPremium ? (
                <button
                  onClick={active ? endCall : startCall}
                  className={`w-full py-2.5 px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                    active
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                      : 'bg-[#8B6914]/20 text-[#D4AF37] border border-[#8B6914]/30 hover:bg-[#8B6914]/30'
                  }`}
                >
                  {active
                    ? <><PhoneOff className="w-4 h-4" /> {t('dashboard.levi.hangUpBtn')}</>
                    : <><Phone className="w-4 h-4" /> {t('dashboard.levi.callBtn')}</>}
                </button>
              ) : (
                <button
                  onClick={onUpgrade}
                  className="w-full py-2.5 px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2 bg-gradient-to-r from-[#8B6914] to-[#D4AF37] text-white hover:brightness-110 transition-all"
                >
                  <Lock className="w-4 h-4" /> {t('dashboard.premium.cta')}
                </button>
              )}

              {/* ElevenLabs widget */}
              {isPremium && active && (
                <div data-levi-widget className="w-full flex justify-center mt-2">
                  <elevenlabs-convai
                    agent-id={elevenLabsAgentId}
                    dynamic-variables={JSON.stringify({
                      user_id: userId,
                      chart_context: `${sunSign} / ${zodiacAnimal} / ${dominantEl}`,
                    })}
                  />
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* ── Minimised Pill ─────────────────────────────────────── */
          <motion.button
            key="minimised"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={toggleExpanded}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg border transition-all ${
              active
                ? 'bg-emerald-900/80 border-emerald-500/30 hover:bg-emerald-900/90'
                : 'bg-[#1a1510]/80 border-[#8B6914]/25 hover:bg-[#1a1510]/90'
            }`}
            style={{ backdropFilter: 'blur(16px)' }}
            aria-label="Open Levi"
          >
            <div className={`w-2 h-2 rounded-full breathing ${
              active
                ? 'bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.75)]'
                : 'bg-[#8B6914] shadow-[0_0_6px_rgba(139,105,20,0.5)]'
            }`} />
            <span className="text-xs font-medium text-[#D4AF37] tracking-wider">
              Levi
            </span>
            {active && (
              <span className="text-[10px] text-emerald-400/70">
                {t('dashboard.levi.active')}
              </span>
            )}
            <Maximize2 className="w-3 h-3 text-white/40" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

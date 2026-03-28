import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, PhoneOff, Minimize2, Maximize2, Lock } from 'lucide-react';
import { useAgent } from '../contexts/AgentContext';
import { useLanguage } from '../contexts/LanguageContext';
import { AGENTS } from '@/packages/shared/src/agents/config';
import type { AgentId } from '@/packages/shared/src/agents/config';

// ─────────────────────────────────────────────────────────────────────────────
// AgentFloatingWidget — Global floating voice agent pill
// Lives at App-level, outside React Router. Persists across all pages.
// Minimised: small pill in bottom-right. Expanded: full conversation panel.
// ─────────────────────────────────────────────────────────────────────────────

interface AgentFloatingWidgetProps {
  userId: string;
  sunSign: string;
  zodiacAnimal: string;
  dominantEl: string;
  isPremium: boolean;
  onUpgrade: () => void;
  onStopAudio: () => void;
  onResumeAudio: () => void;
}

export function AgentFloatingWidget({
  userId,
  sunSign,
  zodiacAnimal,
  dominantEl,
  isPremium,
  onUpgrade,
  onStopAudio,
  onResumeAudio,
}: AgentFloatingWidgetProps) {
  const { agentStates, activeAgent, widgetExpanded, startAgent, stopAgent, setWidgetExpanded } =
    useAgent();
  const { t } = useLanguage();

  // Auto-expand when a call becomes active
  useEffect(() => {
    if (activeAgent !== null) setWidgetExpanded(true);
  }, [activeAgent, setWidgetExpanded]);

  // Load ElevenLabs widget script once globally
  useEffect(() => {
    if (
      !document.querySelector(
        'script[src="https://unpkg.com/@elevenlabs/convai-widget-embed"]',
      )
    ) {
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
      s.async = true;
      s.type = 'text/javascript';
      document.body.appendChild(s);
    }
  }, []);

  // Show the active agent's UI, defaulting to Levi when idle
  const displayId: AgentId = activeAgent ?? 'levi';
  const agent = AGENTS.find((a) => a.id === displayId)!;
  const isActive = activeAgent !== null && agentStates[activeAgent]?.active;
  const dotColor = isActive ? agent.statusColor.active : agent.statusColor.idle;
  const elevenLabsAgentId = import.meta.env[agent.envKey] as string | undefined;

  const handleCall = () => {
    onStopAudio();
    startAgent(displayId);
  };

  const handleHangUp = () => {
    if (activeAgent) stopAgent(activeAgent);
    onResumeAudio();
    setWidgetExpanded(false);
  };

  return (
    <div
      className="fixed z-[99999] transition-all duration-300 ease-out"
      style={{
        bottom: widgetExpanded ? '24px' : '80px',
        right: '16px',
      }}
    >
      <AnimatePresence mode="wait">
        {widgetExpanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-[320px] max-w-[calc(100vw-32px)] rounded-2xl overflow-visible shadow-2xl border"
            style={{
              borderColor: `${agent.accentColor}33`,
              background:
                'linear-gradient(180deg, rgba(15,12,8,0.95) 0%, rgba(25,20,12,0.97) 100%)',
              // backdrop-filter creates a stacking context that traps
              // the ElevenLabs popup z-index — disable it during a call
              ...(isActive ? {} : { backdropFilter: 'blur(24px)' }),
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: `${agent.accentColor}26` }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full breathing"
                  style={{
                    backgroundColor: dotColor,
                    boxShadow: `0 0 8px ${dotColor}CC`,
                  }}
                />
                <span className="text-xs font-medium text-[#D4AF37] tracking-wider uppercase">
                  {agent.name}
                </span>
                <span className="text-[10px] text-white/40">
                  {isActive ? t('dashboard.levi.active') : t('dashboard.levi.ready')}
                </span>
              </div>
              <button
                onClick={() => setWidgetExpanded(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                aria-label="Minimise"
              >
                <Minimize2 className="w-3.5 h-3.5 text-white/50" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 flex flex-col items-center gap-3">
              <p className="text-xs text-white/50 text-center leading-relaxed">
                {isActive ? t('dashboard.levi.activeDesc') : t('dashboard.levi.readyDesc')}
              </p>

              {isPremium ? (
                <button
                  onClick={isActive ? handleHangUp : handleCall}
                  className={`w-full py-2.5 px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                    isActive
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                      : ''
                  }`}
                  style={
                    isActive
                      ? undefined
                      : {
                          background: `${agent.accentColor}33`,
                          color: '#D4AF37',
                          border: `1px solid ${agent.accentColor}4D`,
                        }
                  }
                >
                  {isActive ? (
                    <>
                      <PhoneOff className="w-4 h-4" /> {t('dashboard.levi.hangUpBtn')}
                    </>
                  ) : (
                    <>
                      <Phone className="w-4 h-4" /> {agent.name} anrufen
                    </>
                  )}
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
              {isPremium && isActive && elevenLabsAgentId && (
                <div className="w-full flex justify-center mt-2">
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
          /* Minimised pill */
          <motion.button
            key="minimised"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={() => setWidgetExpanded(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg border transition-all"
            style={{
              background: isActive
                ? `${agent.statusColor.active}1A`
                : 'rgba(26,21,16,0.80)',
              borderColor: isActive
                ? `${agent.statusColor.active}4D`
                : `${agent.accentColor}40`,
              backdropFilter: 'blur(16px)',
            }}
            aria-label={`${agent.name} öffnen`}
          >
            <div
              className="w-2 h-2 rounded-full breathing"
              style={{
                backgroundColor: dotColor,
                boxShadow: `0 0 6px ${dotColor}80`,
              }}
            />
            <span className="text-xs font-medium text-[#D4AF37] tracking-wider">
              {agent.name}
            </span>
            {isActive && (
              <span className="text-[10px]" style={{ color: `${agent.statusColor.active}B3` }}>
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

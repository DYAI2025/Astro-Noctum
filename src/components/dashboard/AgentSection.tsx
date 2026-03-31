import { useEffect, useRef } from 'react';
import { Phone, PhoneOff, Lock } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAgent } from '../../contexts/AgentContext';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import type { AgentConfig } from '@/packages/shared/src/agents/config';

// ── Props ────────────────────────────────────────────────────────────────────

interface AgentSectionProps {
  agent: AgentConfig;
  isPremium: boolean;
  userId: string;
  onStopAudio: () => void;
  onResumeAudio: () => void;
  sunSign: string;
  zodiacAnimal: string;
  dominantEl: string;
}

// ── Component ────────────────────────────────────────────────────────────────

export function AgentSection({
  agent,
  isPremium,
  userId,
  onStopAudio,
  onResumeAudio,
  sunSign,
  zodiacAnimal,
  dominantEl,
}: AgentSectionProps) {
  const { lang, t } = useLanguage();
  const { agentStates, startAgent, stopAgent, setUpgrading } = useAgent();

  const state = agentStates[agent.id];
  const isActive = state.active;
  const isUpgrading = state.upgrading;

  const sectionRef = useRef<HTMLDivElement>(null);

  // Resolve the ElevenLabs agent ID from the env var key defined in config
  const elevenLabsAgentId = import.meta.env[agent.envKey] as string | undefined;
  const isAvailable = Boolean(elevenLabsAgentId);

  // ── Localized text helpers ─────────────────────────────────────────────

  const description = agent.description[lang === 'de' ? 'de' : 'en'];

  /** Try translation key first; fall back to hardcoded default when missing.
   *  t() returns the raw key string when no translation exists. */
  const tAgent = (suffix: string, fallback: string): string => {
    const key = `dashboard.agent.${agent.id}.${suffix}`;
    const val = t(key);
    return val === key ? fallback : val;
  };

  const badgeText = isActive
    ? tAgent('active', `${agent.name} — Im Gespräch`)
    : tAgent('ready', `${agent.name} — Bereit`);

  const activeDesc = tAgent(
    'activeDesc',
    `Ambient-Musik pausiert. Sprich mit ${agent.name} über dein Chart.`,
  );

  const callLabel = tAgent('callBtn', `${agent.name} anrufen`);
  const hangUpLabel = tAgent('hangUpBtn', 'Auflegen');
  const comingSoonLabel = (() => {
    const key = 'dashboard.agent.comingSoon';
    const val = t(key);
    return val === key ? 'Coming Soon' : val;
  })();

  // ── Load ElevenLabs widget script (once globally) ──────────────────────

  useEffect(() => {
    if (import.meta.env.MODE === 'test') return;
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

  // ── Handlers ───────────────────────────────────────────────────────────

  const handleCall = () => {
    onStopAudio();
    startAgent(agent.id);
    setTimeout(
      () =>
        sectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        }),
      100,
    );
  };

  const handleHangUp = () => {
    stopAgent(agent.id);
    onResumeAudio();
  };

  const handleUpgrade = async () => {
    setUpgrading(agent.id, true);
    try {
      const { authedFetch } = await import('@/src/lib/authedFetch');
      const res = await authedFetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
      else setUpgrading(agent.id, false);
    } catch {
      setUpgrading(agent.id, false);
    }
  };

  // ── Status dot colors (driven by agent config) ────────────────────────

  const dotColor = isActive ? agent.statusColor.active : agent.statusColor.idle;
  const dotShadow = `0 0 10px ${dotColor}`;

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div
      ref={sectionRef}
      className={`relative rounded-2xl p-6 sm:p-8 flex flex-col gap-5 overflow-visible ${
        isActive ? 'z-[99999]' : 'z-10'
      }`}
      style={{
        background: `linear-gradient(135deg, ${agent.gradientFrom} 0%, ${agent.gradientTo} 100%)`,
        border: `1px solid ${agent.accentColor}25`,
        boxShadow: `0 4px 24px ${agent.gradientFrom}40, inset 0 1px 0 ${agent.accentColor}10`,
      }}
    >
      {/* ── Decorative accent line ─────────────────────────────────── */}
      <div
        className="absolute top-0 left-6 right-6 h-[2px] rounded-full"
        style={{ background: `linear-gradient(90deg, transparent, ${agent.accentColor}40, transparent)` }}
      />

      {/* ── Header: status dot + agent name ────────────────────────── */}
      <div className="flex items-center gap-3">
        <div
          className="w-2.5 h-2.5 rounded-full shrink-0 breathing"
          style={{ backgroundColor: dotColor, boxShadow: dotShadow }}
        />
        <h3 className="font-serif text-xl text-white/90 tracking-wide">
          {agent.name}
        </h3>
        {isActive && (
          <Badge variant="success" className="ml-auto text-[8px]">LIVE</Badge>
        )}
      </div>

      {/* ── Description ────────────────────────────────────────────── */}
      <p className="text-sm text-white/55 leading-relaxed">
        {isActive ? activeDesc : description}
      </p>

      {/* ── CTA Button ───────────────────────────────────────────── */}
      {!isAvailable ? (
        <Badge variant="secondary" className="opacity-70 self-start">
          {comingSoonLabel}
        </Badge>
      ) : isPremium ? (
        <Button
          variant={isActive ? 'destructive' : 'outline'}
          className="w-full sm:w-auto sm:self-start"
          onClick={isActive ? handleHangUp : handleCall}
          style={!isActive ? { borderColor: `${agent.accentColor}40`, color: agent.accentColor } : undefined}
        >
          {isActive ? (
            <><PhoneOff className="w-4 h-4" /> {hangUpLabel}</>
          ) : (
            <><Phone className="w-4 h-4" /> {callLabel}</>
          )}
        </Button>
      ) : (
        <Button
          variant="premium"
          className="w-full sm:w-auto sm:self-start"
          onClick={handleUpgrade}
          disabled={isUpgrading}
        >
          {isUpgrading ? '...' : (
            <><Lock className="w-4 h-4" /> {t('dashboard.premium.cta')}</>
          )}
        </Button>
      )}

      {/* ElevenLabs widget lives only in AgentFloatingWidget (App-level)
         to avoid duplicate instances and z-index layering issues on mobile */}
    </div>
  );
}

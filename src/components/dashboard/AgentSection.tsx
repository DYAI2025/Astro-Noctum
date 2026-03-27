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

  // ── Load ElevenLabs widget script (once globally) ──────────────────────

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
      className={`morning-card p-5 flex flex-col items-center gap-4 max-w-xs mx-auto relative text-center ${
        isActive ? 'z-[99999]' : 'z-10'
      }`}
      style={{ overflow: 'visible' }}
    >
      {/* ── Badge (with inline status dot) + Description ─────────────── */}
      <div className="flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full shrink-0 breathing"
            style={{ backgroundColor: dotColor, boxShadow: dotShadow }}
          />
          <Badge variant={isActive ? 'success' : 'default'}>{badgeText}</Badge>
        </div>
        <p className="text-sm text-[#1E2A3A]/60 leading-snug">
          {isActive ? activeDesc : description}
        </p>
      </div>

      {/* ── CTA Button ───────────────────────────────────────────────── */}
      {!isAvailable ? (
        // Agent env var not configured — show "Coming Soon" badge
        <Badge variant="secondary" className="opacity-70">
          {t('dashboard.agent.comingSoon')}
        </Badge>
      ) : isPremium ? (
        <Button
          variant={isActive ? 'destructive' : 'outline'}
          className="w-full"
          onClick={isActive ? handleHangUp : handleCall}
        >
          {isActive ? (
            <>
              <PhoneOff className="w-4 h-4" /> {hangUpLabel}
            </>
          ) : (
            <>
              <Phone className="w-4 h-4" /> {callLabel}
            </>
          )}
        </Button>
      ) : (
        <Button
          variant="premium"
          className="w-full"
          onClick={handleUpgrade}
          disabled={isUpgrading}
        >
          {isUpgrading ? (
            '...'
          ) : (
            <>
              <Lock className="w-4 h-4" /> {t('dashboard.premium.cta')}
            </>
          )}
        </Button>
      )}

      {/* ── ElevenLabs widget (expands below when active) ────────────── */}
      {isPremium && isActive && elevenLabsAgentId && (
        <div
          data-agent-widget={agent.id}
          className="mt-6 relative z-50 w-full flex justify-center"
        >
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
  );
}

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

  // Script loaded globally in index.html — no lazy loading needed.

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
      className={`relative cosmic-tile p-6 flex flex-col gap-5 overflow-visible ${
        isActive ? 'z-[99999]' : 'z-10'
      }`}
      style={{
        background: `linear-gradient(135deg, var(--tile-bg) 0%, ${agent.accentColor}18 100%)`,
        borderColor: isActive ? agent.accentColor : `${agent.accentColor}30`,
        boxShadow: isActive ? `0 8px 32px ${agent.accentColor}25` : 'var(--tile-shadow)',
      }}
    >
      {/* ── Decorative accent line ─────────────────────────────────── */}
      <div
        className="absolute top-0 left-6 right-6 h-[2px] rounded-full opacity-30"
        style={{ background: `linear-gradient(90deg, transparent, ${agent.accentColor}, transparent)` }}
      />

      {/* ── Header: status dot + agent name ────────────────────────── */}
      <div className="flex items-center gap-3">
        <div
          className="w-2 h-2 rounded-full shrink-0 breathing"
          style={{ backgroundColor: dotColor, boxShadow: dotShadow }}
        />
        <h3 className="font-serif text-xl tracking-wide">
          {agent.name}
        </h3>
        {isActive && (
          <Badge variant="success" className="ml-auto text-[8px] font-sans">LIVE</Badge>
        )}
      </div>

      {/* ── Description ────────────────────────────────────────────── */}
      <p className="text-sm opacity-75 leading-relaxed font-sans">
        {isActive ? activeDesc : description}
      </p>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      {!isAvailable ? (
        <Badge variant="secondary" className="opacity-70 self-start font-sans">
          {comingSoonLabel}
        </Badge>
      ) : isPremium ? (
        <Button
          variant={isActive ? 'destructive' : 'outline'}
          className="w-full sm:w-auto sm:self-start font-sans"
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
          className="w-full sm:w-auto sm:self-start font-sans"
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

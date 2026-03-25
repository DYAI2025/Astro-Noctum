import { useEffect, useRef, useState } from "react";
import { Phone, PhoneOff, Lock } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

interface DashboardLeviSectionProps {
  isPremium: boolean;
  userId: string;
  onStopAudio: () => void;
  onResumeAudio: () => void;
  sunSign: string;
  zodiacAnimal: string;
  dominantEl: string;
}

export function DashboardLeviSection({
  isPremium,
  userId,
  onStopAudio,
  onResumeAudio,
  sunSign,
  zodiacAnimal,
  dominantEl,
}: DashboardLeviSectionProps) {
  const { t } = useLanguage();
  const elevenLabsAgentId =
    import.meta.env.VITE_ELEVENLABS_AGENT_ID || "agent_1801kje0zqc8e4b89swbt7wekawv";

  const [leviActive, setLeviActive] = useState(false);
  const [leviUpgrading, setLeviUpgrading] = useState(false);
  const leviSectionRef = useRef<HTMLDivElement>(null);

  const handleLeviUpgrade = async () => {
    setLeviUpgrading(true);
    try {
      const res = await (await import("@/src/lib/authedFetch")).authedFetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
      else setLeviUpgrading(false);
    } catch {
      setLeviUpgrading(false);
    }
  };

  // Load ElevenLabs widget
  useEffect(() => {
    if (!document.querySelector('script[src="https://unpkg.com/@elevenlabs/convai-widget-embed"]')) {
      const s = document.createElement("script");
      s.src = "https://unpkg.com/@elevenlabs/convai-widget-embed";
      s.async = true; s.type = "text/javascript";
      document.body.appendChild(s);
    }
  }, []);

  const handleCallLevi = () => {
    onStopAudio();
    setLeviActive(true);
    setTimeout(() => leviSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
  };
  const handleHangUp = () => { setLeviActive(false); onResumeAudio(); };

  return (
    <div ref={leviSectionRef} className="morning-card p-5 flex flex-col items-center gap-4 max-w-xs mx-auto relative z-10 text-center" style={{ overflow: 'visible' }}>
      {/* ── Badge (with inline status dot) + Description ───────── */}
      <div className="flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full shrink-0 breathing ${
            leviActive
              ? "bg-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.75)]"
              : "bg-[#8B6914] shadow-[0_0_8px_rgba(139,105,20,0.55)]"
          }`} />
          <Badge variant={leviActive ? "success" : "default"}>
            {leviActive ? t('dashboard.levi.active') : t('dashboard.levi.ready')}
          </Badge>
        </div>
        <p className="text-sm text-[#1E2A3A]/60 leading-snug">
          {leviActive ? t("dashboard.levi.activeDesc") : t("dashboard.levi.readyDesc")}
        </p>
      </div>

      {/* ── CTA Button ──────────────────────────────────────────── */}
      {isPremium ? (
        <Button
          variant={leviActive ? "destructive" : "outline"}
          className="w-full"
          onClick={leviActive ? handleHangUp : handleCallLevi}
        >
          {leviActive
            ? <><PhoneOff className="w-4 h-4" /> {t('dashboard.levi.hangUpBtn')}</>
            : <><Phone className="w-4 h-4" /> {t('dashboard.levi.callBtn')}</>}
        </Button>
      ) : (
        <Button variant="premium" className="w-full" onClick={handleLeviUpgrade} disabled={leviUpgrading}>
          {leviUpgrading ? '...' : <><Lock className="w-4 h-4" /> {t('dashboard.premium.cta')}</>}
        </Button>
      )}

      {/* ── ElevenLabs widget (expands below when active) ────────── */}
      {isPremium && leviActive && (
        <div data-levi-widget className="mt-6 relative z-[9999] w-full flex justify-center">
          <elevenlabs-convai
            agent-id={elevenLabsAgentId}
            dynamic-variables={JSON.stringify({
              user_id: userId,
              chart_context: `${sunSign} / ${zodiacAnimal} / ${dominantEl}`,
            })}
          >
          </elevenlabs-convai>
        </div>
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { Phone, PhoneOff, Lock } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";

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
    <div ref={leviSectionRef} className="morning-card p-5 sm:p-7 md:p-8 max-w-3xl mx-auto" style={{ backdropFilter: 'none', WebkitBackdropFilter: 'none', overflow: 'visible' }}>
      {/* ── Status + Action row ─────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center gap-5 sm:gap-6">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="relative mt-1.5 shrink-0">
            <div className={`w-2 h-2 rounded-full breathing ${
              leviActive
                ? "bg-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.75)]"
                : "bg-[#8B6914] shadow-[0_0_8px_rgba(139,105,20,0.55)]"
            }`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#8B6914] mb-1.5 font-semibold">
              {leviActive ? t("dashboard.levi.active") : t("dashboard.levi.ready")}
            </p>
            <p className="text-[11px] text-[#1E2A3A]/45 italic leading-relaxed">
              {leviActive ? t("dashboard.levi.activeDesc") : t("dashboard.levi.readyDesc")}
            </p>
          </div>
        </div>

        {isPremium ? (
          <button
            onClick={leviActive ? handleHangUp : handleCallLevi}
            className={`shrink-0 flex items-center justify-center gap-2 px-6 py-3 rounded-full text-[10px] uppercase tracking-[0.2em] font-semibold transition-all ${
              leviActive
                ? "bg-red-50 border border-red-300 text-red-600 hover:bg-red-100"
                : "bg-[#8B6914]/10 border border-[#8B6914]/30 text-[#8B6914] hover:bg-[#8B6914]/[0.18]"
            }`}
          >
            {leviActive
              ? <><PhoneOff className="w-4 h-4" /> {t("dashboard.levi.hangUpBtn")}</>
              : <><Phone className="w-4 h-4" /> {t("dashboard.levi.callBtn")}</>}
          </button>
        ) : (
          <button
            onClick={handleLeviUpgrade}
            disabled={leviUpgrading}
            className="shrink-0 flex items-center justify-center gap-2 px-6 py-3 rounded-full text-[10px] uppercase tracking-[0.2em] font-semibold bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 transition-all disabled:opacity-60 disabled:cursor-wait"
          >
            {leviUpgrading ? "..." : <><Lock className="w-4 h-4" /> {t("dashboard.premium.cta")}</>}
          </button>
        )}
      </div>

      {/* ── ElevenLabs widget (expands below when active) ────────── */}
      {isPremium && leviActive && (
        <div className="mt-6 relative z-[9999] w-full flex justify-center">
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

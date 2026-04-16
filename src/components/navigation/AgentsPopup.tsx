import { useEffect } from "react";
import { Phone, Lock } from "lucide-react";
import { useAgent } from "../../contexts/AgentContext";
import { AGENTS } from "@/packages/shared/src/agents/config";
import { UpgradeButton } from "../UpgradeButton";

interface AgentsPopupProps {
  position: "desktop" | "mobile";
  isPremium: boolean;
  lang: "de" | "en";
  t: (key: string) => string;
  onStopAudio: () => void;
  onClose: () => void;
}

const levi = AGENTS.find((a) => a.id === "levi")!;

export function AgentsPopup({
  position,
  isPremium,
  lang,
  t,
  onStopAudio,
  onClose,
}: AgentsPopupProps) {
  const { startAgent, setWidgetExpanded, agentStates } = useAgent();
  const leviActive = agentStates.levi.active;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleStartLevi = () => {
    onStopAudio();
    startAgent("levi");
    setWidgetExpanded(true);
    onClose();
  };

  const panelClass =
    position === "desktop"
      ? "absolute right-0 top-full mt-2 w-72 bg-[#00050A]/95 backdrop-blur-xl border border-[#D4AF37]/15 rounded-xl shadow-2xl z-50 py-3 px-4"
      : "absolute bottom-full right-0 mb-2 w-72 max-w-[calc(100vw-2rem)] bg-[#00050A]/95 backdrop-blur-xl border border-[#D4AF37]/15 rounded-2xl shadow-2xl z-50 py-3 px-4";

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      <div role="menu" className={panelClass}>
        <p className="text-[9px] uppercase tracking-widest text-[#D4AF37]/40 mb-3">
          {t("nav.astroAgents")}
        </p>

        <div
          className="rounded-xl border p-3"
          style={{ borderColor: `${levi.accentColor}33` }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: leviActive
                  ? levi.statusColor.active
                  : levi.statusColor.idle,
                boxShadow: leviActive
                  ? `0 0 6px ${levi.statusColor.active}80`
                  : undefined,
              }}
            />
            <span className="text-sm font-medium text-[#D4AF37] tracking-wider">
              {levi.name}
            </span>
          </div>

          <p className="text-xs text-white/50 leading-relaxed mb-3">
            {levi.description[lang]}
          </p>

          {isPremium ? (
            <button
              role="menuitem"
              onClick={leviActive ? () => { setWidgetExpanded(true); onClose(); } : handleStartLevi}
              className="w-full py-2 px-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all"
              style={{
                background: `${levi.accentColor}33`,
                color: "#D4AF37",
                border: `1px solid ${levi.accentColor}4D`,
              }}
            >
              <Phone className="w-3.5 h-3.5" />
              {leviActive
                ? (lang === "de" ? "Gespräch öffnen" : "Open conversation")
                : `${levi.name} ${lang === "de" ? "anrufen" : "call"}`}
            </button>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <UpgradeButton
                label={lang === "de" ? "Premium freischalten" : "Unlock Premium"}
                className="w-full py-2 px-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 bg-gradient-to-r from-[#8B6914] to-[#D4AF37] text-white hover:brightness-110 transition-all"
              />
              <p className="text-[10px] text-white/30 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                {t("dashboard.premium.cta")}
              </p>
            </div>
          )}
        </div>

        <p className="text-[10px] text-white/30 mt-3 leading-relaxed">
          {t("nav.astroAgentsIntro")}
        </p>
      </div>
    </>
  );
}

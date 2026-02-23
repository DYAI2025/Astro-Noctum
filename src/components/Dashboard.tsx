import { useEffect } from "react";
import { motion } from "motion/react";
import { Sun, Moon, Zap, ArrowLeft, RefreshCw, MessageCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface DashboardProps {
  interpretation: string;
  apiData: any;
  onReset: () => void;
  onRegenerate: () => void;
  isLoading: boolean;
}

export function Dashboard({
  interpretation,
  apiData,
  onReset,
  onRegenerate,
  isLoading,
}: DashboardProps) {
  useEffect(() => {
    // Load ElevenLabs widget script if not already loaded
    if (
      !document.querySelector(
        'script[src="https://unpkg.com/@elevenlabs/convai-widget-embed"]',
      )
    ) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/@elevenlabs/convai-widget-embed";
      script.async = true;
      script.type = "text/javascript";
      document.body.appendChild(script);
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full max-w-6xl mx-auto px-6"
    >
      <button
        onClick={onReset}
        className="flex items-center gap-2 text-white/60 hover:text-gold transition-colors mb-12 text-[10px] uppercase tracking-[0.3em]"
      >
        <ArrowLeft className="w-4 h-4" /> Start Over
      </button>

      <header className="mb-20 text-center md:text-left">
        <p className="text-gold/60 text-[9px] uppercase tracking-[0.5em] mb-4">Willkommen im Atlas</p>
        <h1 className="font-serif text-4xl md:text-6xl mb-8 leading-tight">Dein aktuelles Koordinatensystem.</h1>
        <div className="flex items-center justify-between">
          <p className="italic text-white/40 font-serif text-xl md:max-w-xl leading-relaxed">
            "Die Sterne erzwingen nichts, sie laden ein. Der Atlas zeigt den Weg, den du bereits gehst."
          </p>
          <button
            onClick={onRegenerate}
            disabled={isLoading}
            className="p-3 text-gold/60 hover:text-gold hover:bg-gold/10 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-gold/20"
            title="Regenerate Interpretation"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      <div className="grid md:grid-cols-3 gap-10 mb-20">
        <div className="glass-card p-10 flex flex-col justify-between min-h-[280px]">
          <div>
            <div className="flex items-center justify-between mb-6">
              <Sun className="text-gold w-5 h-5" />
              <span className="text-[8px] uppercase tracking-widest text-gold/40">Kern</span>
            </div>
            <h3 className="font-serif text-2xl mb-2">Sonnen-Signatur</h3>
            <p className="text-xs text-white/40 font-sans tracking-wide">Dein bewusster Wille.</p>
          </div>
          <div className="flex justify-between items-end border-t border-gold/5 pt-6">
            <span className="text-2xl font-light tracking-wide">{apiData.western?.zodiac_sign || "Calculated"}</span>
            <span className="text-gold/40 text-[9px] uppercase">Sun Sign</span>
          </div>
        </div>

        <div className="glass-card p-10 flex flex-col justify-between min-h-[280px]">
          <div>
            <div className="flex items-center justify-between mb-6">
              <Moon className="text-gold w-5 h-5" />
              <span className="text-[8px] uppercase tracking-widest text-gold/40">Instinkt</span>
            </div>
            <h3 className="font-serif text-2xl mb-2">Mond-Essenz</h3>
            <p className="text-xs text-white/40 font-sans tracking-wide">Dein emotionales Echo.</p>
          </div>
          <div className="flex justify-between items-end border-t border-gold/5 pt-6">
            <span className="text-2xl font-light tracking-wide">{apiData.western?.moon_sign || "Calculated"}</span>
            <span className="text-gold/40 text-[9px] uppercase">Moon Sign</span>
          </div>
        </div>

        <div className="glass-card p-10 flex flex-col justify-between min-h-[280px] bg-gold/[0.03] border-gold/20">
          <div>
            <div className="flex items-center justify-between mb-6">
              <Zap className="text-gold w-5 h-5" />
              <span className="text-[8px] uppercase tracking-widest text-gold/40">Vitalität</span>
            </div>
            <h3 className="font-serif text-2xl mb-2">Tages-Stamm</h3>
            <p className="text-xs text-white/40 font-sans tracking-wide">Deine BaZi-Grundfrequenz.</p>
          </div>
          <div className="flex justify-between items-end border-t border-gold/10 pt-6">
            <span className="text-2xl font-light tracking-wide">{apiData.bazi?.day_master || "Calculated"}</span>
            <span className="text-gold/60 text-[9px] uppercase">Day Master</span>
          </div>
        </div>
      </div>

      <div className="chart-grid">
        {/* Links: Astronomische Fakten */}
        <div className="space-y-10">
          <div className="flex items-end justify-between border-b border-gold/10 pb-6">
            <div>
              <p className="text-gold/60 text-[8px] uppercase tracking-[0.4em] mb-1">Astrometrische Ansicht</p>
              <h2 className="font-serif text-3xl">Präzise Koordinaten</h2>
            </div>
            <div className="text-[9px] font-mono text-white/30 mb-1 tracking-widest">ID: ATLAS_789_ALPHA</div>
          </div>

          {/* BaZi Stelen Section */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {apiData.bazi?.pillars && Object.entries(apiData.bazi.pillars).map(([key, val]: [string, any]) => (
              <div key={key} className="stele-card group cursor-default">
                <div className="text-[8px] uppercase tracking-[0.3em] text-gold/60 mb-6 group-hover:text-gold transition-colors">{key}</div>
                <div className="font-serif text-2xl mb-1 text-white/90">{val.stem}</div>
                <div className="text-[10px] text-white/30 uppercase tracking-widest">{val.branch}</div>
              </div>
            ))}
          </div>
          
          <div className="glass-card p-8">
            <h3 className="text-[10px] uppercase tracking-[0.3em] text-gold/60 mb-4">Dominant Element</h3>
            <div className="text-2xl font-serif text-white/90">{apiData.wuxing?.dominant_element || "Calculated"}</div>
          </div>
        </div>

        {/* Rechts: Narrative Deutung */}
        <div className="space-y-12 lg:pl-16 border-l border-gold/5">
          <div className="space-y-16">
            <section className="space-y-6">
              <div className="flex items-center gap-4 text-gold/60">
                <span className="h-[1px] w-12 bg-gold/20"></span>
                <span className="text-[9px] uppercase tracking-[0.4em]">KI-Synthese</span>
              </div>
              <h3 className="font-serif text-3xl text-white/90">Dein Cosmic Blueprint</h3>
              <div className="font-sans text-[13px] text-white/60 leading-relaxed space-y-6 prose prose-invert prose-gold max-w-none">
                <ReactMarkdown>{interpretation}</ReactMarkdown>
              </div>
            </section>
          </div>

          {/* AI Status Indicator & ElevenLabs */}
          <div className="p-8 border border-gold/10 rounded-2xl bg-gold/[0.02] flex flex-col gap-6">
            <div className="flex items-start gap-6">
              <div className="relative mt-1">
                <div className="w-2 h-2 rounded-full bg-gold breathing shadow-[0_0_10px_rgba(212,175,55,0.8)]"></div>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-gold/80 mb-2 font-semibold">Levi Bazi Aktiv</p>
                <p className="text-[11px] text-white/40 italic leading-relaxed">
                  Dein persönlicher astrologischer Agent ist bereit, tiefer in dein Chart einzutauchen.
                </p>
              </div>
            </div>
            <div className="relative z-20 w-full flex justify-center mt-4">
              {/* @ts-ignore */}
              <elevenlabs-convai
                agent-id="agent_9001kdhah7vrfh3rd05pakg8vppk"
                dynamic-variables={JSON.stringify({
                  chart_data: JSON.stringify(apiData),
                })}
              >
              {/* @ts-ignore */}
              </elevenlabs-convai>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

import { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sun, Moon, Zap, ArrowLeft, RefreshCw, ArrowUp, Phone, PhoneOff } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { BirthChartOrrery } from "./BirthChartOrrery";
import type { BirthData } from "../services/api";

interface DashboardProps {
  interpretation: string;
  apiData: any;
  onReset: () => void;
  onRegenerate: () => void;
  isLoading: boolean;
  apiIssues: { endpoint: string; message: string }[];
  onStopAudio: () => void;
  userId?: string;
  birthInput?: BirthData | null;
}

export function Dashboard({
  interpretation,
  apiData,
  onReset,
  onRegenerate,
  isLoading,
  apiIssues,
  onStopAudio,
  userId,
  birthInput,
}: DashboardProps) {
  const [leviActive, setLeviActive] = useState(false);
  const leviSectionRef = useRef<HTMLDivElement>(null);

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

  const handleCallLevi = () => {
    onStopAudio();
    setLeviActive(true);
    setTimeout(() => {
      leviSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  const handleHangUp = () => {
    setLeviActive(false);
  };

  const zodiacEmojis: Record<string, string> = {
    Rat: "🐀",
    Ox: "🐂",
    Tiger: "🐅",
    Rabbit: "🐇",
    Dragon: "🐉",
    Snake: "🐍",
    Horse: "🐎",
    Goat: "🐐",
    Monkey: "🐒",
    Rooster: "🐓",
    Dog: "🐕",
    Pig: "🐖",
  };

  const ascendantEmojis: Record<string, string> = {
    Aries: "♈",
    Taurus: "♉",
    Gemini: "♊",
    Cancer: "♋",
    Leo: "♌",
    Virgo: "♍",
    Libra: "♎",
    Scorpio: "♏",
    Sagittarius: "♐",
    Capricorn: "♑",
    Aquarius: "♒",
    Pisces: "♓",
  };

  const sunSign = apiData.western?.zodiac_sign || "";
  const sunEmoji = ascendantEmojis[sunSign] || "✨";

  const moonSign = apiData.western?.moon_sign || "";
  const moonEmoji = ascendantEmojis[moonSign] || "✨";

  const ascendantSign = apiData.western?.ascendant_sign || "";
  const ascendantEmoji = ascendantEmojis[ascendantSign] || "✨";

  const zodiacSign = apiData.bazi?.zodiac_sign || apiData.chinese?.zodiac || "";
  const zodiacEmoji = zodiacEmojis[zodiacSign] || "✨";

  const wuXingTraits: Record<string, string> = {
    Wood: "Wachstum, Flexibilität, Kreativität und Vision. Du bist wie ein Baum, der nach oben strebt.",
    Fire: "Leidenschaft, Dynamik, Ausdruck und Freude. Du bringst Licht und Wärme in deine Umgebung.",
    Earth: "Stabilität, Fürsorge, Zuverlässigkeit und Geduld. Du bist das Fundament, auf dem andere bauen.",
    Metal: "Struktur, Klarheit, Entschlossenheit und Fokus. Du schneidest durch Illusionen zur Wahrheit.",
    Water: "Weisheit, Anpassungsfähigkeit, Tiefe und Intuition. Du findest immer einen Weg, wie ein Fluss.",
    Holz: "Wachstum, Flexibilität, Kreativität und Vision. Du bist wie ein Baum, der nach oben strebt.",
    Feuer: "Leidenschaft, Dynamik, Ausdruck und Freude. Du bringst Licht und Wärme in deine Umgebung.",
    Erde: "Stabilität, Fürsorge, Zuverlässigkeit und Geduld. Du bist das Fundament, auf dem andere bauen.",
    Metall: "Struktur, Klarheit, Entschlossenheit und Fokus. Du schneidest durch Illusionen zur Wahrheit.",
    Wasser: "Weisheit, Anpassungsfähigkeit, Tiefe und Intuition. Du findest immer einen Weg, wie ein Fluss."
  };

  const dominantElement = apiData.wuxing?.dominant_element || "—";
  const elevenLabsAgentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID || "agent_1801kje0zqc8e4b89swbt7wekawv";
  const elementTrait = wuXingTraits[dominantElement] || "Deine elementare Natur formt deine Herangehensweise an das Leben.";

  // Parse birth date for the 3D orrery
  const birthDateObj = useMemo(() => {
    if (birthInput?.date) {
      return new Date(birthInput.date);
    }
    return new Date();
  }, [birthInput]);

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

      {apiIssues.length > 0 && (
        <div className="mb-8 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
          Einige Berechnungen konnten nicht live geladen werden. Es wurden teilweise Fallback-Daten genutzt:
          <ul className="mt-2 list-disc pl-4">
            {apiIssues.map((issue, index) => (
              <li key={index}>
                <span className="font-semibold">{issue.endpoint}</span>: {issue.message}
              </li>
            ))}
          </ul>
        </div>
      )}

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

      {/* 3D Solar System — Birth Chart Orrery */}
      <div className="mb-20">
        <BirthChartOrrery birthDate={birthDateObj} height="420px" />
      </div>

      {/* Western Astrology Section */}
      <div className="mb-20">
        <div className="flex items-end justify-between border-b border-gold/10 pb-6 mb-10">
          <div>
            <p className="text-gold/60 text-[8px] uppercase tracking-[0.4em] mb-1">Westliche Astrologie</p>
            <h2 className="font-serif text-3xl">Deine Sternzeichen</h2>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-10">
          <div className="glass-card p-10 flex flex-col justify-between min-h-[280px]">
            <div>
              <div className="flex items-center justify-between mb-6">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Sun className="text-gold w-5 h-5" />
                </motion.div>
                <span className="text-[8px] uppercase tracking-widest text-gold/40">Kern</span>
              </div>
              <h3 className="font-serif text-2xl mb-2">Sonnen-Signatur</h3>
              <p className="text-xs text-white/40 font-sans tracking-wide">Dein bewusster Wille.</p>
            </div>
            <div className="flex justify-between items-end border-t border-gold/5 pt-6">
              <span className="text-2xl font-light tracking-wide flex items-center gap-3">
                <span className="text-gold">{sunEmoji}</span> {sunSign}
              </span>
              <span className="text-gold/40 text-[9px] uppercase">Sun Sign</span>
            </div>
          </div>

          <div className="glass-card p-10 flex flex-col justify-between min-h-[280px]">
            <div>
              <div className="flex items-center justify-between mb-6">
                <motion.div
                  animate={{ rotate: [-10, 10, -10] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Moon className="text-gold w-5 h-5" />
                </motion.div>
                <span className="text-[8px] uppercase tracking-widest text-gold/40">Instinkt</span>
              </div>
              <h3 className="font-serif text-2xl mb-2">Mond-Essenz</h3>
              <p className="text-xs text-white/40 font-sans tracking-wide">Dein emotionales Echo.</p>
            </div>
            <div className="flex justify-between items-end border-t border-gold/5 pt-6">
              <span className="text-2xl font-light tracking-wide flex items-center gap-3">
                <span className="text-gold">{moonEmoji}</span> {moonSign}
              </span>
              <span className="text-gold/40 text-[9px] uppercase">Moon Sign</span>
            </div>
          </div>

          <div className="glass-card p-10 flex flex-col justify-between min-h-[280px]">
            <div>
              <div className="flex items-center justify-between mb-6">
                <motion.div
                  animate={{ scale: [1, 1.15, 1], rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ArrowUp className="text-gold w-5 h-5" />
                </motion.div>
                <span className="text-[8px] uppercase tracking-widest text-gold/40">Maske</span>
              </div>
              <h3 className="font-serif text-2xl mb-2">Aszendent</h3>
              <p className="text-xs text-white/40 font-sans tracking-wide">Dein erster Eindruck.</p>
            </div>
            <div className="flex justify-between items-end border-t border-gold/5 pt-6">
              <span className="text-2xl font-light tracking-wide flex items-center gap-3">
                <span className="text-gold">{ascendantEmoji}</span> {ascendantSign}
              </span>
              <span className="text-gold/40 text-[9px] uppercase">Ascendant</span>
            </div>
          </div>
        </div>
      </div>

      <div className="chart-grid">
        {/* Links: Astronomische Fakten */}
        <div className="space-y-12">
          <div className="flex items-end justify-between border-b border-gold/10 pb-6">
            <div>
              <p className="text-gold/60 text-[8px] uppercase tracking-[0.4em] mb-1">Chinesische Astrologie</p>
              <h2 className="font-serif text-3xl">BaZi & WuXing</h2>
            </div>
            <div className="text-[9px] font-mono text-white/30 mb-1 tracking-widest">ID: ATLAS_789_ALPHA</div>
          </div>

          {/* BaZi Highlights */}
          <div className="grid grid-cols-2 gap-6">
            <div className="glass-card p-8 bg-gold/[0.02] border-gold/10">
              <div className="flex items-center justify-between mb-4">
                <Zap className="text-gold w-4 h-4" />
                <span className="text-[8px] uppercase tracking-widest text-gold/40">Vitalität</span>
              </div>
              <h3 className="text-[10px] uppercase tracking-[0.3em] text-gold/60 mb-1">Tages-Stamm</h3>
              <div className="font-serif text-2xl text-white/90">{apiData.bazi?.day_master || "—"}</div>
            </div>
            <div className="glass-card p-8 bg-gold/[0.02] border-gold/10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gold text-lg">{zodiacEmoji}</span>
                <span className="text-[8px] uppercase tracking-widest text-gold/40">Tierkreis</span>
              </div>
              <h3 className="text-[10px] uppercase tracking-[0.3em] text-gold/60 mb-1">Jahres-Tier</h3>
              <div className="font-serif text-2xl text-white/90">{zodiacSign || "—"}</div>
            </div>
          </div>

          {/* BaZi Stelen Section */}
          <div>
            <h3 className="text-[10px] uppercase tracking-[0.3em] text-gold/60 mb-6">Die Vier Säulen (BaZi)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {apiData.bazi?.pillars && Object.entries(apiData.bazi.pillars).map(([key, val]: [string, any]) => (
                <div key={key} className="stele-card group cursor-default">
                  <div className="text-[8px] uppercase tracking-[0.3em] text-gold/60 mb-6 group-hover:text-gold transition-colors">{key}</div>
                  <div className="font-serif text-2xl mb-1 text-white/90">{val.stem}</div>
                  <div className="text-[10px] text-white/30 uppercase tracking-widest">{val.branch}</div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="glass-card p-8 bg-gold/[0.02] border-gold/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] uppercase tracking-[0.3em] text-gold/60">Dominantes Element (WuXing)</h3>
              <span className="text-[8px] uppercase tracking-widest text-gold/40">Essenz</span>
            </div>
            <div className="font-serif text-3xl text-white/90 mb-3">{dominantElement}</div>
            <p className="text-xs text-white/50 font-sans tracking-wide leading-relaxed">
              {elementTrait}
            </p>
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

          {/* Levi Call Tile */}
          <div ref={leviSectionRef} className="p-8 border border-gold/10 rounded-2xl bg-gold/[0.02] flex flex-col gap-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-6">
                <div className="relative mt-1">
                  <div className={`w-2 h-2 rounded-full ${leviActive ? "bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8)]" : "bg-gold shadow-[0_0_10px_rgba(212,175,55,0.8)]"} breathing`}></div>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-gold/80 mb-2 font-semibold">
                    {leviActive ? "Levi Bazi — Im Gespräch" : "Levi Bazi Bereit"}
                  </p>
                  <p className="text-[11px] text-white/40 italic leading-relaxed">
                    {leviActive
                      ? "Ambient-Musik pausiert. Sprich mit Levi über dein Chart."
                      : "Dein persönlicher astrologischer Agent ist bereit, tiefer in dein Chart einzutauchen."}
                  </p>
                </div>
              </div>
              <button
                onClick={leviActive ? handleHangUp : handleCallLevi}
                className={`flex items-center gap-2 px-5 py-3 rounded-full text-[10px] uppercase tracking-[0.2em] font-semibold transition-all ${
                  leviActive
                    ? "bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30"
                    : "bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 hover:border-gold/50"
                }`}
              >
                {leviActive ? (
                  <>
                    <PhoneOff className="w-4 h-4" /> Auflegen
                  </>
                ) : (
                  <>
                    <Phone className="w-4 h-4" /> Call Levi
                  </>
                )}
              </button>
            </div>
            <AnimatePresence>
              {leviActive && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="relative z-20 w-full flex justify-center overflow-hidden"
                >
                  {/* @ts-ignore */}
                  <elevenlabs-convai
                    agent-id={elevenLabsAgentId}
                    dynamic-variables={JSON.stringify({
                      user_id: userId || "",
                      chart_context: `${sunSign} / ${zodiacSign} / ${dominantElement}`,
                    })}
                  >
                  {/* @ts-ignore */}
                  </elevenlabs-convai>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

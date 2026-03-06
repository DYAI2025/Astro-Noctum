import { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sun, Moon, ArrowUp, ArrowLeft, RefreshCw, Zap, Phone, PhoneOff,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { BirthChartOrrery } from "./BirthChartOrrery";
import { ShareCard } from "./ShareCard";
import { PremiumGate } from "./PremiumGate";
import { usePremium } from "../hooks/usePremium";
import { useLanguage } from "../contexts/LanguageContext";
import { WUXING_ELEMENTS, getWuxingByKey } from "../lib/astro-data/wuxing";
import { getBranchByAnimal } from "../lib/astro-data/earthlyBranches";
import { getZodiacSign, getSignName } from "../lib/astro-data/zodiacSigns";
import { getConstellationForSign } from "../lib/astro-data/constellationFromSign";
import { usePlanetarium } from "../contexts/PlanetariumContext";
import { Tooltip } from "./Tooltip";

// ─────────────────────────────────────────────────────────────────────────────
// Static data
// ─────────────────────────────────────────────────────────────────────────────

const WESTERN_EMOJIS: Record<string, string> = {
  Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋",
  Leo: "♌", Virgo: "♍", Libra: "♎", Scorpio: "♏",
  Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓",
};

const ZODIAC_SIGNS_LIST = [
  "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
  "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces",
] as const;

function signFromIndex(idx: number | undefined | null): string {
  if (idx == null || idx < 0 || idx > 11) return "";
  return ZODIAC_SIGNS_LIST[idx];
}

const PILLAR_KEYS: Record<string, { label: string; desc: string }> = {
  year:  { label: "dashboard.pillars.year",  desc: "dashboard.pillars.yearDesc"  },
  month: { label: "dashboard.pillars.month", desc: "dashboard.pillars.monthDesc" },
  day:   { label: "dashboard.pillars.day",   desc: "dashboard.pillars.dayDesc"   },
  hour:  { label: "dashboard.pillars.hour",  desc: "dashboard.pillars.hourDesc"  },
};

// ── Western Astrological Houses ───────────────────────────────────────────

const ROMAN = ["","I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"] as const;

interface HouseMeaning {
  name:    { en: string; de: string };
  keyword: { en: string; de: string };
}

const HOUSE_MEANINGS: Record<number, HouseMeaning> = {
  1:  { name: { en: "Self",           de: "Selbst"        }, keyword: { en: "Identity & Appearance",               de: "Identität & Erscheinung"                } },
  2:  { name: { en: "Resources",      de: "Ressourcen"    }, keyword: { en: "Wealth, Possessions & Values",        de: "Besitz, Vermögen & Werte"               } },
  3:  { name: { en: "Mind",           de: "Geist"         }, keyword: { en: "Communication, Siblings & Travel",    de: "Kommunikation, Geschwister & Reisen"    } },
  4:  { name: { en: "Foundation",     de: "Fundament"     }, keyword: { en: "Home, Family & Roots",                de: "Heim, Familie & Wurzeln"                } },
  5:  { name: { en: "Creativity",     de: "Kreativität"   }, keyword: { en: "Pleasure, Romance & Expression",      de: "Freude, Romantik & Ausdruck"            } },
  6:  { name: { en: "Service",        de: "Dienst"        }, keyword: { en: "Health, Work & Daily Routine",        de: "Gesundheit, Arbeit & Alltag"            } },
  7:  { name: { en: "Partnership",    de: "Partnerschaft" }, keyword: { en: "Relationships & Contracts",           de: "Beziehungen & Verträge"                 } },
  8:  { name: { en: "Transformation", de: "Wandel"        }, keyword: { en: "Depth, Shared Power & Rebirth",       de: "Tiefe, gemeinsame Macht & Erneuerung"   } },
  9:  { name: { en: "Expansion",      de: "Horizont"      }, keyword: { en: "Philosophy, Travel & Higher Learning",de: "Philosophie, Weite & höheres Lernen"    } },
  10: { name: { en: "Career",         de: "Beruf"         }, keyword: { en: "Public Role, Status & Ambition",      de: "Öffentliche Rolle & Ambition"           } },
  11: { name: { en: "Community",      de: "Gemeinschaft"  }, keyword: { en: "Friendships, Groups & Ideals",        de: "Freundschaften, Gruppen & Ziele"        } },
  12: { name: { en: "Transcendence",  de: "Transzendenz"  }, keyword: { en: "Solitude, Karma & Hidden Matters",    de: "Einsamkeit, Karma & Verborgenes"        } },
};

function parseHouseNum(key: string): number | null {
  const n = parseInt(key.replace(/[^0-9]/g, ""), 10);
  return n >= 1 && n <= 12 ? n : null;
}

function resolveSign(val: any): string {
  if (typeof val === "string") return val;
  if (typeof val === "object" && val !== null) {
    if (val.sign && typeof val.sign === "string") return val.sign;
    const idx = val.zodiac_sign ?? val.sign_index ?? val.index;
    if (typeof idx === "number") return signFromIndex(idx);
  }
  return "";
}

// ── Animation helper ──────────────────────────────────────────────────────

function fadeIn(delay = 0) {
  return {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: "easeOut" as const, delay },
  };
}


// ─────────────────────────────────────────────────────────────────────────────
// Section sub-components
// ─────────────────────────────────────────────────────────────────────────────

function DualSectionHeader({
  leftLabel, leftTitle, rightLabel, rightTitle,
}: { leftLabel: string; leftTitle: string; rightLabel: string; rightTitle: string }) {
  return (
    <div className="grid grid-cols-2 gap-6 mb-8 max-md:grid-cols-1">
      <div className="border-b border-[#8B6914]/15 pb-4">
        <p className="text-[#8B6914]/55 text-[8px] uppercase tracking-[0.45em] mb-1">{leftLabel}</p>
        <h2 className="font-serif text-2xl text-[#1E2A3A]">{leftTitle}</h2>
      </div>
      <div className="border-b border-[#8B6914]/15 pb-4">
        <p className="text-[#8B6914]/55 text-[8px] uppercase tracking-[0.45em] mb-1">{rightLabel}</p>
        <h2 className="font-serif text-2xl text-[#1E2A3A]">{rightTitle}</h2>
      </div>
    </div>
  );
}

function SectionDivider({ label, title }: { label: string; title: string }) {
  return (
    <div className="border-b border-[#8B6914]/15 pb-4 mb-8">
      <p className="text-[#8B6914]/55 text-[8px] uppercase tracking-[0.45em] mb-1">{label}</p>
      <h2 className="font-serif text-2xl text-[#1E2A3A]">{title}</h2>
    </div>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <span className="text-[8px] uppercase tracking-widest text-[#8B6914]/45 font-sans">
      {text}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface DashboardProps {
  interpretation: string;
  apiData: any;
  userId: string;
  birthDate: string | null;
  onReset: () => void;
  onRegenerate: () => void;
  isLoading: boolean;
  apiIssues: { endpoint: string; message: string }[];
  onStopAudio: () => void;
  onResumeAudio: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────────────────────────

export function Dashboard({
  interpretation,
  apiData,
  userId,
  birthDate,
  onReset,
  onRegenerate,
  isLoading,
  apiIssues,
  onStopAudio,
  onResumeAudio,
}: DashboardProps) {
  const { lang, t } = useLanguage();
  const { isPremium } = usePremium();
  const { planetariumMode, setPlanetariumMode } = usePlanetarium();
  const [leviActive, setLeviActive] = useState(false);
  const leviSectionRef = useRef<HTMLDivElement>(null);

  // ── First-visit Birth Sky welcome ────────────────────────────────
  const FIRST_VISIT_KEY = "bazodiac-first-visit-done";
  const [showBirthSkyWelcome, setShowBirthSkyWelcome] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(FIRST_VISIT_KEY);
    if (!done) {
      // First visit: activate Planetarium, show welcome
      setPlanetariumMode(true);
      setShowBirthSkyWelcome(true);
      localStorage.setItem(FIRST_VISIT_KEY, "true");
      // Auto-dismiss after 12 seconds
      const timer = setTimeout(() => setShowBirthSkyWelcome(false), 12000);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // ── Data extraction ────────────────────────────────────────────────

  const sunSign       = apiData.western?.zodiac_sign      || "";
  const moonSign      = apiData.western?.moon_sign        || "";
  const ascendantSign = apiData.western?.ascendant_sign   || "";
  const zodiacAnimal  = apiData.bazi?.zodiac_sign         || apiData.chinese?.zodiac || "";
  const dayMaster     = apiData.bazi?.day_master          || "—";
  const monthStem     = apiData.bazi?.pillars?.month?.stem || "—";
  const dominantEl    = apiData.wuxing?.dominant_element  || "";

  // Localised sign names (FR-02: no English on DE page)
  const sunSignName  = getSignName(sunSign, lang);
  const moonSignName = getSignName(moonSign, lang);
  const ascSignName  = getSignName(ascendantSign, lang);

  const sunEmoji  = WESTERN_EMOJIS[sunSign]       || "✨";
  const moonEmoji = WESTERN_EMOJIS[moonSign]      || "✨";
  const ascEmoji  = WESTERN_EMOJIS[ascendantSign] || "✨";

  // Sign-specific descriptions (FR-03)
  const sunSignData  = useMemo(() => getZodiacSign(sunSign), [sunSign]);
  const moonSignData = useMemo(() => getZodiacSign(moonSign), [moonSign]);
  const ascSignData  = useMemo(() => getZodiacSign(ascendantSign), [ascendantSign]);

  const yearBranch     = useMemo(() => getBranchByAnimal(zodiacAnimal), [zodiacAnimal]);
  const yearAnimalName = yearBranch ? yearBranch.animal[lang] : zodiacAnimal;
  const dominantWuxing = useMemo(() => getWuxingByKey(dominantEl), [dominantEl]);

  // WuXing element counts + percentage fix (FR-06 Bug)
  const wuxingCounts: Record<string, number> = useMemo(
    () => apiData.wuxing?.elements || apiData.wuxing?.element_counts || {},
    [apiData.wuxing],
  );
  const hasWuxingData = useMemo(
    () => Object.values(wuxingCounts).some((v) => Number(v) > 0),
    [wuxingCounts],
  );
  // totalCount for correct % calculation (sum to 100%)
  const totalCount = useMemo(
    () => Object.values(wuxingCounts).reduce((sum, v) => sum + Number(v), 0),
    [wuxingCounts],
  );
  // maxCount for bar visual scaling (dominant always fills full bar)
  const maxCount = useMemo(
    () => Math.max(...Object.values(wuxingCounts).map(Number), 1),
    [wuxingCounts],
  );

  // Houses
  const houses: Record<string, any> = useMemo(
    () => apiData.western?.houses || {},
    [apiData.western],
  );
  const houseEntries = useMemo(
    () =>
      Object.entries(houses)
        .filter(([, v]) => v != null)
        .sort(([a], [b]) => (parseHouseNum(a) ?? 99) - (parseHouseNum(b) ?? 99)),
    [houses],
  );

  const orreryDate = useMemo(() => {
    if (!birthDate) return new Date();
    const d = new Date(birthDate);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [birthDate]);

  // Birth constellation for Planetarium Mode (FR-P04)
  const birthConstellationKey = useMemo(
    () => getConstellationForSign(sunSign)?.key,
    [sunSign],
  );

  const elevenLabsAgentId =
    import.meta.env.VITE_ELEVENLABS_AGENT_ID || "agent_1801kje0zqc8e4b89swbt7wekawv";

  // ── Interpretation split (free: first 2 paragraphs, premium: full) ──
  const interpretationParagraphs = useMemo(
    () => interpretation?.split("\n\n") || [],
    [interpretation],
  );
  const freeInterpretation = useMemo(
    () => interpretationParagraphs.slice(0, 2).join("\n\n"),
    [interpretationParagraphs],
  );
  const hasPremiumInterpretation = interpretationParagraphs.length > 2;

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full max-w-6xl mx-auto px-4 md:px-6"
    >
      {/* Back */}
      <button
        onClick={onReset}
        className="flex items-center gap-2 text-[#1E2A3A]/40 hover:text-[#8B6914] transition-colors mb-10 text-[10px] uppercase tracking-[0.3em]"
      >
        <ArrowLeft className="w-4 h-4" /> {t("dashboard.startOver")}
      </button>

      {/* Issues banner */}
      {apiIssues.length > 0 && (
        <div className="mb-8 rounded-xl border border-amber-400/40 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          {t("dashboard.fallbackNote")}
          <ul className="mt-2 list-disc pl-4 space-y-1">
            {apiIssues.map((issue, i) => (
              <li key={i}><span className="font-semibold">{issue.endpoint}</span>: {issue.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ═══ PAGE HEADER ═══════════════════════════════════════════════ */}
      <motion.header
        className="mb-12"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <p className="text-[#8B6914]/55 text-[9px] uppercase tracking-[0.5em] mb-3">
          {t("dashboard.welcome")}
        </p>
        <div className="flex items-start justify-between gap-4">
          {/* FR-01: Title updated via translation key */}
          <h1 className="font-serif text-4xl md:text-5xl leading-tight text-[#1E2A3A] max-w-xl">
            {t("dashboard.title")}
          </h1>
          <button
            onClick={onRegenerate}
            disabled={isLoading}
            className="mt-1 shrink-0 p-3 text-[#8B6914]/45 hover:text-[#8B6914] hover:bg-[#8B6914]/10 rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-[#8B6914]/20"
            title="Regenerate"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
        <p className="mt-4 italic text-[#1E2A3A]/38 font-serif text-base md:max-w-xl leading-relaxed">
          {t("dashboard.quote")}
        </p>
      </motion.header>

      {/* ═══ 3D ORRERY ════════════════════════════════════════════════ */}
      <motion.div className="mb-14" {...fadeIn(0.1)}>
        <BirthChartOrrery
          birthDate={orreryDate}
          height="460px"
          planetariumMode={planetariumMode}
          birthConstellation={birthConstellationKey}
          autoPlay={showBirthSkyWelcome}
        />

        {/* Birth Sky Welcome Banner */}
        <AnimatePresence>
          {showBirthSkyWelcome && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.8 }}
              className="relative -mt-20 mb-4 z-20 flex justify-center pointer-events-none"
            >
              <div className="bg-[#050a14]/80 backdrop-blur-xl border border-[#D4AF37]/30 rounded-2xl px-8 py-5 max-w-lg text-center shadow-[0_0_40px_rgba(212,175,55,0.08)]">
                <p className="text-[#D4AF37] text-[10px] uppercase tracking-[0.4em] mb-2">✦ {lang === "de" ? "Dein Geburtshimmel" : "Your Birth Sky"} ✦</p>
                <p className="text-white/80 text-sm leading-relaxed font-serif italic">
                  {(() => {
                    const d = orreryDate;
                    const locale = lang === "de" ? "de-DE" : "en-GB";
                    const dateStr = d.toLocaleDateString(locale, { day: "2-digit", month: "long", year: "numeric" });
                    const timeStr = d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
                    // Placeholder for place — would need to be passed from BirthForm
                    const tmpl = t("dashboard.birthSky.messageNoPlace");
                    return tmpl
                      .replace("{date}", dateStr)
                      .replace("{time}", timeStr);
                  })()}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ═══ PRIMARY GRID: Western (left) | BaZi/WuXing (right) ═══════ */}
      <motion.div className="mb-12" {...fadeIn(0.2)}>
        <DualSectionHeader
          leftLabel={t("dashboard.western.sectionLabel")}
          leftTitle={t("dashboard.western.sectionTitle")}
          rightLabel={t("dashboard.bazi.sectionLabel")}
          rightTitle={t("dashboard.bazi.sectionTitle")}
        />

        <div className="morning-grid-2">

          {/* ── LEFT — Western Signs ─────────────────────────────── */}
          <div className="flex flex-col gap-5">

            {/* Sun Sign — FR-03.1 / FR-P05: data-special for gold border in Planetarium */}
            <div className="morning-card p-7 flex flex-col justify-between" data-special="true">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
                  >
                    <Sun className="text-[#C8930A] w-5 h-5" />
                  </motion.div>
                  <Badge text={t("dashboard.western.sunLabel")} />
                </div>

                {/* Sign name as primary title */}
                <h3 className="font-serif text-2xl text-[#1E2A3A] leading-tight mb-0.5">
                  {sunSignName || "—"}
                </h3>
                <p className="text-[9px] uppercase tracking-[0.25em] text-[#8B6914]/50 mb-4">
                  {t("dashboard.western.sunTitle")}
                </p>

                {/* Sign-specific description */}
                <p className="text-xs text-[#1E2A3A]/55 leading-relaxed">
                  {sunSignData
                    ? sunSignData.sun[lang]
                    : t("dashboard.western.sunDesc")}
                </p>
              </div>
              <div className="flex justify-between items-center border-t border-[#8B6914]/10 pt-4 mt-5">
                <span className="text-2xl leading-none select-none text-[#C8930A]">{sunEmoji}</span>
                {sunSignData && (
                  <span className="text-[10px] text-[#1E2A3A]/35">
                    {sunSignData.element[lang]} · {sunSignData.ruler[lang]}
                  </span>
                )}
                <Badge text={t("dashboard.western.sunSignBadge")} />
              </div>
            </div>

            {/* Moon Sign — FR-03.2 */}
            <div className="morning-card p-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <motion.div
                    animate={{ rotate: [-12, 12, -12] }}
                    transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Moon className="text-[#1A6BB5] w-5 h-5" />
                  </motion.div>
                  <Badge text={t("dashboard.western.moonLabel")} />
                </div>

                <h3 className="font-serif text-2xl text-[#1E2A3A] leading-tight mb-0.5">
                  {moonSignName || "—"}
                </h3>
                <p className="text-[9px] uppercase tracking-[0.25em] text-[#8B6914]/50 mb-4">
                  {t("dashboard.western.moonTitle")}
                </p>

                <p className="text-xs text-[#1E2A3A]/55 leading-relaxed">
                  {moonSignData
                    ? moonSignData.moon[lang]
                    : t("dashboard.western.moonDesc")}
                </p>
              </div>
              <div className="flex justify-between items-center border-t border-[#8B6914]/10 pt-4 mt-5">
                <span className="text-2xl leading-none select-none text-[#1A6BB5]">{moonEmoji}</span>
                {moonSignData && (
                  <span className="text-[10px] text-[#1E2A3A]/35">
                    {moonSignData.element[lang]} · {moonSignData.ruler[lang]}
                  </span>
                )}
                <Badge text={t("dashboard.western.moonSignBadge")} />
              </div>
            </div>

            {/* Ascendant — FR-03.3 */}
            <div className="morning-card p-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <motion.div
                    animate={{ scale: [1, 1.15, 1], rotate: [0, 12, -12, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ArrowUp className="text-[#3D8B37] w-5 h-5" />
                  </motion.div>
                  <Badge text={t("dashboard.western.ascLabel")} />
                </div>

                <h3 className="font-serif text-2xl text-[#1E2A3A] leading-tight mb-0.5">
                  {ascSignName || "—"}
                </h3>
                <p className="text-[9px] uppercase tracking-[0.25em] text-[#8B6914]/50 mb-4">
                  {t("dashboard.western.ascTitle")}
                </p>

                <p className="text-xs text-[#1E2A3A]/55 leading-relaxed">
                  {ascSignData
                    ? ascSignData.asc[lang]
                    : t("dashboard.western.ascDesc")}
                </p>
              </div>
              <div className="flex justify-between items-center border-t border-[#8B6914]/10 pt-4 mt-5">
                <span className="text-2xl leading-none select-none text-[#3D8B37]">{ascEmoji}</span>
                {ascSignData && (
                  <span className="text-[10px] text-[#1E2A3A]/35">
                    {ascSignData.element[lang]} · {ascSignData.ruler[lang]}
                  </span>
                )}
                <Badge text={t("dashboard.western.ascBadge")} />
              </div>
            </div>
          </div>

          {/* ── RIGHT — BaZi / WuXing ───────────────────────────── */}
          <div className="flex flex-col gap-5">

            {/* Year Animal — FR-P05: data-special for gold border in Planetarium */}
            <div className="morning-card p-7 flex flex-col justify-between" data-special="true">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl leading-none">{yearBranch?.emoji || "✨"}</span>
                  <Badge text={t("dashboard.bazi.zodiacLabel")} />
                </div>
                <h3 className="font-serif text-2xl text-[#1E2A3A] mb-0.5">
                  {yearAnimalName || "—"}
                </h3>
                <p className="text-[9px] uppercase tracking-[0.25em] text-[#8B6914]/50 mb-4">
                  {t("dashboard.bazi.yearAnimalTitle")}
                </p>
                {yearBranch && (
                  <p className="text-xs text-[#1E2A3A]/55 leading-relaxed">
                    {yearBranch.description[lang].split(".")[0]}.
                  </p>
                )}
              </div>
              <div className="flex justify-between items-end border-t border-[#8B6914]/10 pt-4 mt-5">
                <div className="flex items-center gap-2">
                  {yearBranch && (
                    <span className="font-serif text-xl text-[#8B6914]">{yearBranch.chinese}</span>
                  )}
                  {yearBranch && (
                    <span className="text-[10px] text-[#1E2A3A]/35">
                      {yearBranch.branch} · {yearBranch.element}
                    </span>
                  )}
                </div>
                <Badge text={t("dashboard.bazi.yearAnimalBadge")} />
              </div>
            </div>

            {/* Dominant WuXing Element */}
            <div
              className="morning-card p-7 flex flex-col gap-4"
              style={dominantWuxing ? {
                borderLeftColor: dominantWuxing.color + "55",
                borderLeftWidth: "3px",
                borderLeftStyle: "solid",
              } : undefined}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg text-[#1E2A3A]">
                  {t("dashboard.bazi.dominantElementTitle")}
                </h3>
                <Badge text={t("dashboard.bazi.essenceLabel")} />
              </div>

              {dominantWuxing ? (
                <>
                  <div className="flex items-center gap-4">
                    <span className="text-5xl font-serif leading-none select-none" style={{ color: dominantWuxing.color }}>
                      {dominantWuxing.chinese}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xl font-serif text-[#1E2A3A]">{dominantWuxing.name[lang]}</div>
                      <div className="text-[11px] text-[#1E2A3A]/35 tracking-wide mt-0.5">{dominantWuxing.pinyin}</div>
                    </div>
                    <span className="text-2xl leading-none select-none shrink-0">{dominantWuxing.emoji}</span>
                  </div>
                  <p className="text-xs text-[#1E2A3A]/55 leading-relaxed">
                    {dominantWuxing.description[lang].split(".")[0]}.
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 text-[10px] text-[#1E2A3A]/35 pt-3 border-t border-[#8B6914]/10">
                    <span>↗ {dominantWuxing.direction[lang]}</span>
                    <span>◆ {dominantWuxing.season[lang]}</span>
                  </div>
                </>
              ) : (
                <div className="font-serif text-2xl text-[#1E2A3A]">{dominantEl || "—"}</div>
              )}
            </div>

            {/* Day Master */}
            <div className="morning-card p-6 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="text-[#8B6914] w-4 h-4 shrink-0" />
                  <h3 className="text-[10px] uppercase tracking-[0.3em] text-[#8B6914]/65">
                    {t("dashboard.bazi.dayMasterTitle")}
                  </h3>
                </div>
                <Badge text={t("dashboard.bazi.vitalityLabel")} />
              </div>
              <div className="font-serif text-2xl text-[#1E2A3A]">{dayMaster}</div>
              <p className="text-xs text-[#1E2A3A]/45 leading-relaxed">{t("dashboard.bazi.dayMasterDesc")}</p>
            </div>

            {/* Month Stem */}
            <div className="morning-card p-6 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] uppercase tracking-[0.3em] text-[#8B6914]/65">
                  {t("dashboard.bazi.monthStemTitle")}
                </h3>
                <Badge text={t("dashboard.bazi.monthStemBadge")} />
              </div>
              <div className="font-serif text-2xl text-[#1E2A3A]">{monthStem}</div>
              <p className="text-xs text-[#1E2A3A]/45 leading-relaxed">{t("dashboard.bazi.monthStemDesc")}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══ BAZI FOUR PILLARS (FR-05: Tooltips) — PREMIUM ══════════ */}
      {apiData.bazi?.pillars && (
        <PremiumGate teaser={t("dashboard.premium.teaserPillars")}>
          <motion.div className="mb-10" {...fadeIn(0.3)}>
            <SectionDivider label="BaZi 八字" title={t("dashboard.pillars.sectionTitle")} />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(apiData.bazi.pillars).map(([key, val]: [string, any]) => {
                const pk = PILLAR_KEYS[key];
                return (
                  // Wrapper is overflow-visible so tooltip escapes morning-stele's overflow:hidden
                  <div key={key} className="relative overflow-visible">
                    <Tooltip content={pk ? t(pk.desc) : ""} wide dark={planetariumMode}>
                      <div className="morning-stele group cursor-help w-full">
                        <div className="text-[8px] uppercase tracking-[0.3em] text-[#8B6914]/55 mb-5 group-hover:text-[#8B6914] transition-colors">
                          {pk ? t(pk.label) : key}
                        </div>
                        <div className="font-serif text-2xl mb-1 text-[#1E2A3A]">{val.stem || "—"}</div>
                        <div className="text-[10px] text-[#1E2A3A]/35 uppercase tracking-widest">{val.branch || ""}</div>
                        {val.animal && (
                          <div className="text-[9px] text-[#8B6914]/45 mt-1.5 tracking-wide">{val.animal}</div>
                        )}
                        {/* Subtle tooltip hint */}
                        <div className="mt-3 text-[8px] text-[#8B6914]/30 tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                          ↑ Info
                        </div>
                      </div>
                    </Tooltip>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </PremiumGate>
      )}

      {/* ═══ WUXING BALANCE (FR-06: % fix + hover tooltips) — PREMIUM ═ */}
      <PremiumGate teaser={t("dashboard.premium.teaserWuxing")}>
        <motion.div className="mb-10" {...fadeIn(0.35)}>
          <SectionDivider label="WuXing 五行" title={t("dashboard.wuxing.sectionTitle")} />
          <p className="text-xs text-[#1E2A3A]/45 mb-6 leading-relaxed max-w-2xl">
            {t("dashboard.wuxing.sectionDesc")}
          </p>

          <div className="morning-card p-6 md:p-8">
            <div className="space-y-4">
              {WUXING_ELEMENTS.map((el) => {
                const count  = Number(wuxingCounts[el.key] ?? wuxingCounts[el.name.de] ?? 0);
                // FR-06 Bug fix: true percentage of total (sums to 100%)
                const pctLabel = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
                // Bar visual: scaled to max so dominant bar is always prominent
                const pctBar   = hasWuxingData ? (count / maxCount) * 100 : 0;
                const isDom    = el.key === dominantEl || el.name.de === dominantEl;

                return (
                  <Tooltip key={el.key} content={el.description[lang]} wide dark={planetariumMode}>
                    <div className="flex items-center gap-4 cursor-help group">
                      {/* Identity */}
                      <div className="w-28 md:w-36 shrink-0 flex items-center gap-2.5">
                        <span className="text-2xl font-serif leading-none select-none" style={{ color: el.color }}>
                          {el.chinese}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-[#1E2A3A] truncate group-hover:text-[#1E2A3A]/80 transition-colors">
                            {el.name[lang]}
                          </div>
                          <div className="text-[10px] text-[#1E2A3A]/35">{el.pinyin}</div>
                        </div>
                      </div>

                      {/* Bar */}
                      <div className="flex-1 wuxing-bar-track">
                        {hasWuxingData ? (
                          <motion.div
                            className="wuxing-bar-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(pctBar, pctBar > 0 ? 2 : 0)}%` }}
                            transition={{ duration: 1.0, ease: "easeOut", delay: 0.2 }}
                            style={{ backgroundColor: el.color }}
                          />
                        ) : (
                          <div className="h-full rounded-full" style={{ backgroundColor: el.color + "20", width: "100%" }} />
                        )}
                      </div>

                      {/* Label: correct % of total (FR-06 fix) + dominant star */}
                      <div className="w-12 shrink-0 text-right flex items-center justify-end gap-1">
                        {hasWuxingData && pctLabel > 0 && (
                          <span className="text-[10px] text-[#1E2A3A]/45 font-mono">{pctLabel}%</span>
                        )}
                        {isDom && (
                          <span className="text-sm" style={{ color: el.color }}>★</span>
                        )}
                      </div>
                    </div>
                  </Tooltip>
                );
              })}
            </div>

            {!hasWuxingData && (
              <p className="mt-5 text-[10px] text-[#1E2A3A]/35 italic text-center">
                {lang === "de"
                  ? "Elementgewichtung wird bei Verfügbarkeit der API-Daten angezeigt. Hover für Details."
                  : "Element weighting shown when API data is available. Hover for details."}
              </p>
            )}
          </div>
        </motion.div>
      </PremiumGate>

      {/* ═══ WESTERN HOUSES (FR-07: personalised) — PREMIUM ════════ */}
      {houseEntries.length > 0 && (
        <PremiumGate teaser={t("dashboard.premium.teaserHouses")}>
        <motion.div className="mb-10" {...fadeIn(0.4)}>
          <SectionDivider
            label={t("dashboard.western.sectionLabel")}
            title={t("dashboard.houses.sectionTitle")}
          />
          <p className="text-xs text-[#1E2A3A]/45 mb-6 leading-relaxed max-w-2xl">
            {t("dashboard.houses.sectionDesc")}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {houseEntries.map(([houseKey, val]) => {
              const sign    = resolveSign(val);
              const emoji   = WESTERN_EMOJIS[sign] || "";
              const num     = parseHouseNum(houseKey);
              const roman   = num !== null ? ROMAN[num] : houseKey;
              const meaning = num !== null ? HOUSE_MEANINGS[num] : null;
              // FR-07: Localised sign name
              const signDisplay = sign ? getSignName(sign, lang) : "—";

              return (
                <div key={houseKey} className="morning-card p-5">
                  {/* House number + name */}
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="font-serif text-base text-[#8B6914] font-medium leading-none">
                      {roman}
                    </span>
                    {meaning && (
                      <span className="text-[10px] text-[#1E2A3A]/45 tracking-wide truncate">
                        {meaning.name[lang]}
                      </span>
                    )}
                  </div>

                  {/* Sign — localised */}
                  <div className="font-serif text-lg text-[#1E2A3A] flex items-center gap-2 mb-2">
                    <span className="text-[#8B6914]/80">{emoji}</span>
                    {signDisplay}
                  </div>

                  {/* FR-07: Personalised influence sentence */}
                  {meaning && sign && (
                    <p className="text-[10px] text-[#1E2A3A]/40 leading-relaxed">
                      {lang === "de"
                        ? `${signDisplay} prägt das Lebensfeld ${meaning.name.de}.`
                        : `${signDisplay} shapes your house of ${meaning.name.en}.`}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
        </PremiumGate>
      )}

      {/* ═══ INTERPRETATION + LEVI ═══════════════════════════════════ */}
      <motion.div
        className="grid md:grid-cols-3 gap-8 mb-16"
        {...fadeIn(0.45)}
      >
        {/* AI Interpretation — 2/3 width (FR-08: richer prompt in gemini.ts) */}
        <div className="morning-card p-8 md:col-span-2">
          <div className="flex items-center gap-4 mb-5">
            <span className="h-[1px] w-10 bg-[#8B6914]/20" />
            <span className="text-[9px] uppercase tracking-[0.4em] text-[#8B6914]/55">
              {t("dashboard.interpretation.sectionLabel")}
            </span>
          </div>
          <h3 className="font-serif text-2xl text-[#1E2A3A] mb-5">
            {t("dashboard.interpretation.sectionTitle")}
          </h3>

          {/* Free: first 2 paragraphs always visible */}
          <div className="
            text-[13px] text-[#1E2A3A]/60 leading-relaxed
            prose prose-sm max-w-none
            prose-headings:text-[#1E2A3A] prose-headings:font-serif
            prose-p:text-[#1E2A3A]/60 prose-strong:text-[#1E2A3A]/80
            prose-a:text-[#8B6914] prose-a:no-underline hover:prose-a:underline
            prose-hr:border-[#8B6914]/15
          ">
            <ReactMarkdown>{isPremium ? interpretation : freeInterpretation}</ReactMarkdown>
          </div>

          {/* Premium: remaining paragraphs gated */}
          {!isPremium && hasPremiumInterpretation && (
            <PremiumGate teaser={t("dashboard.premium.teaserInterpretation")}>
              <div className="
                text-[13px] text-[#1E2A3A]/60 leading-relaxed
                prose prose-sm max-w-none
                prose-headings:text-[#1E2A3A] prose-headings:font-serif
                prose-p:text-[#1E2A3A]/60 prose-strong:text-[#1E2A3A]/80
                prose-a:text-[#8B6914] prose-a:no-underline hover:prose-a:underline
                prose-hr:border-[#8B6914]/15
                mt-4
              ">
                <ReactMarkdown>{interpretationParagraphs.slice(2).join("\n\n")}</ReactMarkdown>
              </div>
            </PremiumGate>
          )}
        </div>

        {/* Levi — 1/3 width — PREMIUM */}
        <PremiumGate teaser={t("dashboard.premium.teaserLevi")}>
        <div ref={leviSectionRef} className="morning-card p-7 flex flex-col gap-6">
          <div className="flex items-start gap-4">
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

          <button
            onClick={leviActive ? handleHangUp : handleCallLevi}
            className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-full text-[10px] uppercase tracking-[0.2em] font-semibold transition-all ${
              leviActive
                ? "bg-red-50 border border-red-300 text-red-600 hover:bg-red-100"
                : "bg-[#8B6914]/10 border border-[#8B6914]/30 text-[#8B6914] hover:bg-[#8B6914]/[0.18]"
            }`}
          >
            {leviActive
              ? <><PhoneOff className="w-4 h-4" /> {t("dashboard.levi.hangUpBtn")}</>
              : <><Phone className="w-4 h-4" /> {t("dashboard.levi.callBtn")}</>}
          </button>

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
                    user_id: userId,
                    chart_context: `${sunSign} / ${zodiacAnimal} / ${dominantEl}`,
                  })}
                >
                {/* @ts-ignore */}
                </elevenlabs-convai>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        </PremiumGate>
      </motion.div>

      {/* ═══ SHARE CARD ═══════════════════════════════════════════════ */}
      <motion.div className="mb-16" {...fadeIn(0.5)}>
        <ShareCard
          sunSign={apiData?.western?.zodiac_sign || ''}
          moonSign={apiData?.western?.moon_sign || ''}
        />
      </motion.div>
    </motion.div>
  );
}

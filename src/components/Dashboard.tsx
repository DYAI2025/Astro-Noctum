import { useEffect, useRef, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowUp, ArrowLeft, RefreshCw, Phone, PhoneOff, Lock,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { BirthChartOrrery } from "./BirthChartOrrery";
import { ShareCard } from "./ShareCard";
import { PremiumGate } from "./PremiumGate";
import { usePremium } from "../hooks/usePremium";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { WUXING_ELEMENTS, getWuxingByKey, getWuxingName } from "../lib/astro-data/wuxing";
import { getBranchByAnimal } from "../lib/astro-data/earthlyBranches";
import { getCoinAsset } from "../lib/astro-data/coinAssets";
import { getZodiacSign, getSignName } from "../lib/astro-data/zodiacSigns";
import { getConstellationForSign } from "../lib/astro-data/constellationFromSign";
import { usePlanetarium } from "../contexts/PlanetariumContext";
import { Tooltip } from "./Tooltip";
import { LegalFooter } from "./LegalFooter";
import { BaZiFourPillars } from "./BaZiFourPillars";
import { BaZiInterpretation } from "./BaZiInterpretation";
import { getStemByCharacter } from "../lib/astro-data/heavenlyStems";
import type { ApiData } from "../types/bafe";
import type { TileTexts, HouseTexts } from "../types/interpretation";
import { ExpandableText } from "./ExpandableText";
import { getZodiacArt } from "../lib/astro-data/zodiacAssets";

// ─────────────────────────────────────────────────────────────────────────────
// Static data
// ─────────────────────────────────────────────────────────────────────────────

// ── Session-random bilingual quotes ──────────────────────────────────────
const BAZODIAC_QUOTES: { en: string; de: string }[] = [
  {
    en: "The stars compel nothing — they invite. The Atlas shows the path you are already on.",
    de: "Die Sterne erzwingen nichts, sie laden ein. Der Atlas zeigt den Weg, den du bereits gehst.",
  },
  {
    en: "As long as we don't examine the dynamics, they act like fate. But once we look, they become our flow.",
    de: "Solange wir die Dynamiken nicht betrachten, wirken sie wie Schicksal. Schauen wir aber hin, dann werden sie zu unserem Fluss.",
  },
  {
    en: "Your chart is not a verdict — it is a conversation between who you are and who you are becoming.",
    de: "Dein Chart ist kein Urteil — es ist ein Gespräch zwischen dem, wer du bist, und dem, wer du wirst.",
  },
  {
    en: "The cosmos doesn't define you. It reflects the possibilities you carry within.",
    de: "Der Kosmos definiert dich nicht. Er spiegelt die Möglichkeiten, die du in dir trägst.",
  },
  {
    en: "Between the constellations lies not distance, but resonance — just as between your elements.",
    de: "Zwischen den Sternbildern liegt keine Distanz, sondern Resonanz — genau wie zwischen deinen Elementen.",
  },
  {
    en: "What the sky held at your birth was not a plan, but a palette. You choose the colours.",
    de: "Was der Himmel bei deiner Geburt bereithielt, war kein Plan, sondern eine Palette. Du wählst die Farben.",
  },
  {
    en: "Your elements don't fight each other — they negotiate. Balance is not stillness, it is dance.",
    de: "Deine Elemente bekämpfen sich nicht — sie verhandeln. Balance ist nicht Stillstand, sondern Tanz.",
  },
  {
    en: "The pillar that feels weakest often carries the most untapped strength.",
    de: "Die Säule, die sich am schwächsten anfühlt, trägt oft die meiste ungenutzte Kraft.",
  },
  {
    en: "Awareness is the bridge between pattern and freedom. Your chart builds that bridge.",
    de: "Bewusstsein ist die Brücke zwischen Muster und Freiheit. Dein Chart baut diese Brücke.",
  },
  {
    en: "No two birth skies are alike — and that is precisely your power.",
    de: "Kein Geburtshimmel gleicht dem anderen — und genau das ist deine Kraft.",
  },
  {
    en: "The universe doesn't whisper instructions. It hums possibilities — listen closely.",
    de: "Das Universum flüstert keine Anweisungen. Es summt Möglichkeiten — hör genau hin.",
  },
  {
    en: "Your cosmic signature is not written in stone. It is written in light — always shifting, always yours.",
    de: "Deine kosmische Signatur ist nicht in Stein geschrieben. Sie ist in Licht geschrieben — immer in Bewegung, immer deine.",
  },
];

// Pick one quote per session (stable across re-renders)
const SESSION_QUOTE_INDEX = Math.floor(Math.random() * BAZODIAC_QUOTES.length);

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

type HouseValue = string | { sign?: string; zodiac_sign?: number; sign_index?: number; index?: number };

function resolveSign(val: HouseValue): string {
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
      <div className="border-b border-[#8B6914]/15 pb-3 sm:pb-4">
        <p className="text-[#8B6914]/55 text-[8px] uppercase tracking-[0.45em] mb-1">{leftLabel}</p>
        <h2 className="font-serif text-xl sm:text-2xl text-[#1E2A3A]">{leftTitle}</h2>
      </div>
      <div className="border-b border-[#8B6914]/15 pb-3 sm:pb-4">
        <p className="text-[#8B6914]/55 text-[8px] uppercase tracking-[0.45em] mb-1">{rightLabel}</p>
        <h2 className="font-serif text-xl sm:text-2xl text-[#1E2A3A]">{rightTitle}</h2>
      </div>
    </div>
  );
}

function SectionDivider({ label, title }: { label: string; title: string }) {
  return (
    <div className="border-b border-[#8B6914]/15 pb-3 sm:pb-4 mb-6 sm:mb-8">
      <p className="text-[#8B6914]/55 text-[8px] uppercase tracking-[0.45em] mb-1">{label}</p>
      <h2 className="font-serif text-xl sm:text-2xl text-[#1E2A3A]">{title}</h2>
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
  apiData: ApiData;
  userId: string;
  birthDate: string | null;
  onReset: () => void;
  onRegenerate: () => void;
  isLoading: boolean;
  apiIssues: { endpoint: string; message: string }[];
  onStopAudio: () => void;
  onResumeAudio: () => void;
  isFirstReading?: boolean;
  tileTexts?: TileTexts;
  houseTexts?: HouseTexts;
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
  isFirstReading = false,
  tileTexts,
  houseTexts,
}: DashboardProps) {
  const { lang, t } = useLanguage();
  const { isPremium } = usePremium();
  const { user } = useAuth();
  const { planetariumMode, setPlanetariumMode } = usePlanetarium();
  const [leviActive, setLeviActive] = useState(false);
  const [leviUpgrading, setLeviUpgrading] = useState(false);

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
  const leviSectionRef = useRef<HTMLDivElement>(null);

  // ── First-visit Birth Sky welcome ────────────────────────────────
  // Only show for genuinely new profiles (just completed onboarding),
  // not for returning users loading their profile from Supabase.
  const [showBirthSkyWelcome, setShowBirthSkyWelcome] = useState(false);

  useEffect(() => {
    if (isFirstReading) {
      setPlanetariumMode(true);
      setShowBirthSkyWelcome(true);
      const timer = setTimeout(() => setShowBirthSkyWelcome(false), 12000);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFirstReading]);

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
  const zodiacAnimal  = apiData.bazi?.zodiac_sign         || "";
  const dayMaster     = apiData.bazi?.day_master          || "—";
  const monthStem     = apiData.bazi?.pillars?.month?.stem || "—";

  const dayMasterStem = useMemo(() => getStemByCharacter(dayMaster), [dayMaster]);
  const monthStemData = useMemo(() => getStemByCharacter(monthStem), [monthStem]);
  const dominantEl    = apiData.wuxing?.dominant_element  || "";
  const yearElement   = apiData.bazi?.pillars?.year?.element || "";

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
  const yearCoinSrc    = useMemo(() => getCoinAsset(zodiacAnimal), [zodiacAnimal]);

  // WuXing element counts + percentage fix (FR-06 Bug)
  const wuxingCounts: Record<string, number> = useMemo(
    () => apiData.wuxing?.elements || (apiData.wuxing?.element_counts as Record<string, number> | undefined) || {},
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
  const houses: Record<string, HouseValue> = useMemo(
    () => (apiData.western?.houses as Record<string, HouseValue>) || {},
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

  // BaZi section computed data
  const wuxingBalance = useMemo(() => {
    const raw = apiData.wuxing?.elements || apiData.wuxing?.element_counts || {};
    const total: number = Object.values(raw).reduce<number>((sum, v) => sum + Number(v), 0);
    if (total === 0) return {};
    return Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [k, Number(v) / total])
    );
  }, [apiData.wuxing]);

  const yearAnimal = apiData.bazi?.zodiac_sign || "";
  const yearEl = apiData.bazi?.pillars?.year?.element || "";

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
        className="mb-12 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <p className="text-[#8B6914]/55 text-[9px] uppercase tracking-[0.5em] mb-3">
          {t("dashboard.welcome")}
        </p>
        <div className="flex items-center justify-center gap-4">
          <h1 className="font-serif text-3xl sm:text-[2.75rem] md:text-[3.5rem] leading-tight text-[#1E2A3A]">
            {t("dashboard.title")}
          </h1>
          <button
            onClick={onRegenerate}
            disabled={isLoading}
            className="shrink-0 p-2.5 text-[#8B6914]/45 hover:text-[#8B6914] hover:bg-[#8B6914]/10 rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-[#8B6914]/20"
            title="Regenerate"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
        <p className="mt-4 italic text-[#1E2A3A]/42 font-serif text-base leading-relaxed max-w-xl mx-auto">
          &ldquo;{BAZODIAC_QUOTES[SESSION_QUOTE_INDEX][lang]}&rdquo;
        </p>
      </motion.header>

      {/* ═══ 3D ORRERY ════════════════════════════════════════════════ */}
      <motion.div className="mb-14" {...fadeIn(0.1)}>
        <BirthChartOrrery
          birthDate={orreryDate}
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
            <div className="morning-card p-5 sm:p-7 flex flex-col justify-between" data-special="true">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl leading-none select-none text-[#C8930A]">{sunEmoji}</span>
                  <Badge text={t("dashboard.western.sunLabel")} />
                </div>

                {/* Sign name + decorative illustration */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="min-w-0">
                    <h3 className="font-serif text-xl sm:text-2xl text-[#1E2A3A] leading-tight mb-0.5">
                      {sunSignName || "—"}
                    </h3>
                    <p className="text-[9px] uppercase tracking-[0.25em] text-[#8B6914]/50">
                      {t("dashboard.western.sunTitle")}
                    </p>
                  </div>
                  {getZodiacArt(sunSign) && (
                    <img
                      src={getZodiacArt(sunSign)}
                      alt={sunSignName}
                      className="w-24 h-24 sm:w-28 sm:h-28 object-contain shrink-0 -mt-2"
                      loading="lazy"
                    />
                  )}
                </div>

                {/* Sign-specific description */}
                <p className="text-xs text-[#1E2A3A]/55 leading-relaxed">
                  {sunSignData
                    ? sunSignData.sun[lang]
                    : t("dashboard.western.sunDesc")}
                </p>
                <ExpandableText text={tileTexts?.sun} />
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
            <div className="morning-card p-5 sm:p-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl leading-none select-none text-[#1A6BB5]">{moonEmoji}</span>
                  <Badge text={t("dashboard.western.moonLabel")} />
                </div>

                {/* Sign name + decorative illustration */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="min-w-0">
                    <h3 className="font-serif text-xl sm:text-2xl text-[#1E2A3A] leading-tight mb-0.5">
                      {moonSignName || "—"}
                    </h3>
                    <p className="text-[9px] uppercase tracking-[0.25em] text-[#8B6914]/50">
                      {t("dashboard.western.moonTitle")}
                    </p>
                  </div>
                  {getZodiacArt(moonSign) && (
                    <img
                      src={getZodiacArt(moonSign)}
                      alt={moonSignName}
                      className="w-24 h-24 sm:w-28 sm:h-28 object-contain shrink-0 -mt-2"
                      loading="lazy"
                    />
                  )}
                </div>

                <p className="text-xs text-[#1E2A3A]/55 leading-relaxed">
                  {moonSignData
                    ? moonSignData.moon[lang]
                    : t("dashboard.western.moonDesc")}
                </p>
                <ExpandableText text={tileTexts?.moon} />
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
            <div className="morning-card p-5 sm:p-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl leading-none select-none text-[#3D8B37]">{ascEmoji}</span>
                  <Badge text={t("dashboard.western.ascLabel")} />
                </div>

                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="min-w-0">
                    <h3 className="font-serif text-xl sm:text-2xl text-[#1E2A3A] leading-tight mb-0.5">
                      {ascSignName || "—"}
                    </h3>
                    <p className="text-[9px] uppercase tracking-[0.25em] text-[#8B6914]/50">
                      {t("dashboard.western.ascTitle")}
                    </p>
                  </div>
                  {(() => { const art = getZodiacArt(ascendantSign); return art ? (
                    <img src={art} alt={ascSignName} className="w-24 h-24 sm:w-28 sm:h-28 object-contain shrink-0 -mt-2" loading="lazy" />
                  ) : null; })()}
                </div>

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
            <div className="morning-card p-5 sm:p-7 flex flex-col justify-between" data-special="true">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl font-serif leading-none select-none" style={{ color: yearBranch ? '#8B6914' : undefined }}>{yearBranch?.chinese || "✨"}</span>
                  <Badge text={t("dashboard.bazi.zodiacLabel")} />
                </div>
                <h3 className="font-serif text-xl sm:text-2xl text-[#1E2A3A] leading-tight mb-0.5">
                  {yearAnimalName || "—"}
                </h3>
                <p className="text-[9px] uppercase tracking-[0.25em] text-[#8B6914]/50 mb-4">
                  {yearElement && yearBranch
                    ? `${getWuxingName(yearElement, lang)}-${yearAnimalName} (${yearBranch.chinese})`
                    : t("dashboard.bazi.yearAnimalTitle")}
                </p>
                {yearCoinSrc && (
                  <div className="flex justify-center my-4">
                    <img
                      src={yearCoinSrc}
                      alt={yearAnimalName}
                      className="w-32 h-32 sm:w-40 sm:h-40 object-contain rounded-full"
                      loading="lazy"
                    />
                  </div>
                )}
                {yearBranch && (
                  <p className="text-xs text-[#1E2A3A]/55 leading-relaxed">
                    {yearBranch.description[lang]}
                  </p>
                )}
                <ExpandableText text={tileTexts?.yearAnimal} />
              </div>
              <div className="flex justify-between items-center border-t border-[#8B6914]/10 pt-4 mt-5">
                <div className="flex items-center gap-2">
                  {yearBranch && (
                    <span className="font-serif text-xl text-[#8B6914]">{yearBranch.chinese}</span>
                  )}
                  {yearBranch && (
                    <span className="text-[10px] text-[#1E2A3A]/35">
                      {getWuxingName(yearBranch.element, lang)} · {yearBranch.pinyin}
                    </span>
                  )}
                </div>
                <Badge text={t("dashboard.bazi.yearAnimalBadge")} />
              </div>
            </div>

            {/* Dominant WuXing Element */}
            <div
              className="morning-card p-5 sm:p-7 flex flex-col justify-between"
              style={dominantWuxing ? {
                borderLeftColor: dominantWuxing.color + "55",
                borderLeftWidth: "3px",
                borderLeftStyle: "solid",
              } : undefined}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl font-serif leading-none select-none" style={{ color: dominantWuxing?.color }}>{dominantWuxing?.chinese || "✨"}</span>
                  <Badge text={t("dashboard.bazi.essenceLabel")} />
                </div>
                <h3 className="font-serif text-xl sm:text-2xl text-[#1E2A3A] leading-tight mb-0.5">
                  {dominantWuxing ? dominantWuxing.name[lang] : (dominantEl || "—")}
                </h3>
                <p className="text-[9px] uppercase tracking-[0.25em] text-[#8B6914]/50 mb-4">
                  {t("dashboard.bazi.dominantElementTitle")}
                </p>
                {dominantWuxing && (
                  <p className="text-xs text-[#1E2A3A]/55 leading-relaxed">
                    {dominantWuxing.description[lang]}
                  </p>
                )}
                <ExpandableText text={tileTexts?.dominantWuXing} />
              </div>
              <div className="flex justify-between items-center border-t border-[#8B6914]/10 pt-4 mt-5">
                <div className="flex items-center gap-2">
                  {dominantWuxing && (
                    <span className="font-serif text-xl leading-none select-none" style={{ color: dominantWuxing.color }}>
                      {dominantWuxing.chinese}
                    </span>
                  )}
                  {dominantWuxing && (
                    <span className="text-[10px] text-[#1E2A3A]/35">
                      {dominantWuxing.pinyin} · {dominantWuxing.direction[lang]} · {dominantWuxing.season[lang]}
                    </span>
                  )}
                </div>
                <Badge text="WUXING" />
              </div>
            </div>

            {/* Day Master — enriched with Heavenly Stem data */}
            <div className="morning-card p-5 sm:p-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl font-serif leading-none select-none text-[#D4AF37]">{dayMaster}</span>
                  <Badge text={t("dashboard.bazi.vitalityLabel")} />
                </div>
                <h3 className="font-serif text-xl sm:text-2xl text-[#1E2A3A] leading-tight mb-0.5">
                  {dayMaster}{dayMasterStem ? ` ${dayMasterStem.pinyin}` : ""}
                </h3>
                <p className="text-[9px] uppercase tracking-[0.25em] text-[#8B6914]/50 mb-4">
                  {dayMasterStem
                    ? `${t("dashboard.bazi.dayMasterTitle")} — ${dayMasterStem.name[lang]}`
                    : t("dashboard.bazi.dayMasterTitle")}
                </p>
                <p className="text-xs text-[#1E2A3A]/55 leading-relaxed">
                  {dayMasterStem
                    ? dayMasterStem.dayMaster[lang]
                    : t("dashboard.bazi.dayMasterDesc")}
                </p>
                <ExpandableText text={tileTexts?.dayMaster} />
              </div>
              <div className="flex justify-between items-center border-t border-[#8B6914]/10 pt-4 mt-5">
                <div className="flex items-center gap-2">
                  <span className="font-serif text-xl text-[#8B6914]">{dayMaster}</span>
                  {dayMasterStem && (
                    <span className="text-[10px] text-[#1E2A3A]/35">
                      {dayMasterStem.element} · {dayMasterStem.yinYang === "yang" ? "Yang" : "Yin"} · {dayMasterStem.pinyin}
                    </span>
                  )}
                </div>
                <Badge text={lang === "de" ? "TAGESMEISTER" : "DAY MASTER"} />
              </div>
            </div>

            {/* Month Stem — enriched with Heavenly Stem data */}
            <div className="morning-card p-5 sm:p-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg leading-none select-none text-[#8B6914]">月</span>
                  <Badge text={t("dashboard.bazi.monthStemBadge")} />
                </div>
                <h3 className="font-serif text-xl sm:text-2xl text-[#1E2A3A] leading-tight mb-0.5">
                  {monthStem}{monthStemData ? ` ${monthStemData.pinyin}` : ""}
                </h3>
                <p className="text-[9px] uppercase tracking-[0.25em] text-[#8B6914]/50 mb-4">
                  {monthStemData
                    ? `${t("dashboard.bazi.monthStemTitle")} — ${monthStemData.name[lang]}`
                    : t("dashboard.bazi.monthStemTitle")}
                </p>
                <p className="text-xs text-[#1E2A3A]/55 leading-relaxed">
                  {monthStemData
                    ? monthStemData.monthStem[lang]
                    : t("dashboard.bazi.monthStemDesc")}
                </p>
              </div>
              <div className="flex justify-between items-center border-t border-[#8B6914]/10 pt-4 mt-5">
                <div className="flex items-center gap-2">
                  <span className="font-serif text-xl text-[#8B6914]">{monthStem}</span>
                  {monthStemData && (
                    <span className="text-[10px] text-[#1E2A3A]/35">
                      {monthStemData.element} · {monthStemData.yinYang === "yang" ? "Yang" : "Yin"} · {monthStemData.pinyin}
                    </span>
                  )}
                </div>
                <Badge text={lang === "de" ? "MONATSSTAMM" : "MONTH STEM"} />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══ BAZI & WUXING DEEP SECTION ═══════════════════════════════ */}
      <PremiumGate teaser={t("dashboard.premium.teaserPillars")}>
        <motion.div className="mb-12" {...fadeIn(0.3)}>
          {/* Block A: Header */}
          <SectionDivider
            label={lang === "de" ? "Chinesische Astrologie" : "Chinese Astrology"}
            title={lang === "de" ? "BaZi & WuXing — Vier Säulen des Schicksals" : "BaZi & WuXing — Four Pillars of Destiny"}
          />

          {/* Block B: Four Pillars */}
          {apiData.bazi?.pillars && (
            <div className="mb-10">
              <p className="text-[9px] uppercase tracking-[0.3em] text-[#8B6914]/50 mb-4">
                {lang === "de" ? "Die Vier Säulen" : "The Four Pillars"}
              </p>
              <BaZiFourPillars
                pillars={apiData.bazi.pillars}
                lang={lang}
                planetariumMode={planetariumMode}
              />
            </div>
          )}

          {/* Block C: Element Balance — Pentagon + Cycle side by side */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[9px] uppercase tracking-[0.3em] text-[#8B6914]/50">
                WuXing 五行
              </p>
              <Link
                to="/wu-xing"
                className="text-[9px] uppercase tracking-[0.2em] text-[#8B6914]/60 hover:text-[#8B6914] transition-colors flex items-center gap-1.5"
              >
                <span>{lang === 'de' ? 'Detailansicht' : 'Detailed View'}</span>
                <ArrowUp className="w-3 h-3 rotate-45" />
              </Link>
            </div>
            <p className="text-xs text-[#1E2A3A]/45 mb-6 leading-relaxed max-w-2xl">
              {t("dashboard.wuxing.sectionDesc")}
            </p>

            <div className="morning-card p-6 md:p-8">
              <div className="space-y-4">
                {WUXING_ELEMENTS.map((el) => {
                  const count = Number(wuxingCounts[el.key] ?? wuxingCounts[el.name.de] ?? 0);
                  const pctLabel = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
                  const pctBar = hasWuxingData ? (count / maxCount) * 100 : 0;
                  const isDom = el.key === dominantEl || el.name.de === dominantEl;
                  return (
                    <Tooltip key={el.key} content={el.description[lang]} wide dark={planetariumMode}>
                      <div className="flex items-center gap-2 sm:gap-4 cursor-help group">
                        <div className="w-24 sm:w-28 md:w-36 shrink-0 flex items-center gap-2 sm:gap-2.5">
                          <span className="text-2xl font-serif leading-none select-none" style={{ color: el.color }}>
                            {el.chinese}
                          </span>
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-[#1E2A3A] truncate">{el.name[lang]}</div>
                            <div className="text-[10px] text-[#1E2A3A]/35">{el.pinyin}</div>
                          </div>
                        </div>
                        <div className="flex-1 wuxing-bar-track">
                          {hasWuxingData ? (
                            <div
                              className="wuxing-bar-fill"
                              style={{ backgroundColor: el.color, width: `${Math.max(pctBar, pctBar > 0 ? 2 : 0)}%` }}
                            />
                          ) : (
                            <div className="h-full rounded-full" style={{ backgroundColor: el.color + "20", width: "100%" }} />
                          )}
                        </div>
                        <div className="w-12 shrink-0 text-right flex items-center justify-end gap-1">
                          {hasWuxingData && pctLabel > 0 && (
                            <span className="text-[10px] text-[#1E2A3A]/45 font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>{pctLabel}%</span>
                          )}
                          {isDom && <span className="text-sm" style={{ color: el.color }}>★</span>}
                        </div>
                      </div>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Block D: Interpretation */}
          <div className="morning-card p-6 md:p-8">
            <BaZiInterpretation
              animal={yearAnimal}
              element={yearEl}
              balance={wuxingBalance}
              lang={lang}
            />
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

              const houseText = num !== null ? houseTexts?.[String(num)] : undefined;
              const cardContent = (
                <>
                  {/* House number + name */}
                  <div className="flex items-baseline gap-1.5 sm:gap-2 mb-2 sm:mb-3 min-w-0">
                    <span className="font-serif text-base text-[#8B6914] font-medium leading-none shrink-0">
                      {roman}
                    </span>
                    {meaning && (
                      <span className="text-[9px] sm:text-[10px] text-[#1E2A3A]/45 tracking-wide truncate">
                        {meaning.name[lang]}
                      </span>
                    )}
                  </div>

                  {/* Sign — localised */}
                  <div className="font-serif text-base sm:text-lg text-[#1E2A3A] flex items-center gap-1.5 sm:gap-2 mb-2 min-w-0">
                    <span className="text-[#8B6914]/80 shrink-0">{emoji}</span>
                    <span className="truncate">{signDisplay}</span>
                  </div>

                  {/* FR-07: Personalised influence sentence */}
                  {meaning && sign && (
                    <p className="text-[9px] sm:text-[10px] text-[#1E2A3A]/40 leading-relaxed line-clamp-2">
                      {lang === "de"
                        ? `${signDisplay} prägt das Lebensfeld ${meaning.name.de}.`
                        : `${signDisplay} shapes your house of ${meaning.name.en}.`}
                    </p>
                  )}
                </>
              );

              return houseText ? (
                <Tooltip key={houseKey} content={houseText} wide>
                  <div className="morning-card p-4 sm:p-5 overflow-hidden cursor-help">
                    {cardContent}
                  </div>
                </Tooltip>
              ) : (
                <div key={houseKey} className="morning-card p-4 sm:p-5 overflow-hidden">
                  {cardContent}
                </div>
              );
            })}
          </div>
        </motion.div>
        </PremiumGate>
      )}

      {/* ═══ INTERPRETATION + LEVI ═══════════════════════════════════ */}
      <motion.div
        className="grid md:grid-cols-3 gap-5 sm:gap-8 mb-12 sm:mb-16"
        {...fadeIn(0.45)}
      >
        {/* AI Interpretation — 2/3 width (FR-08: richer prompt in gemini.ts) */}
        <div className="morning-card p-5 sm:p-8 md:col-span-2">
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

        {/* Levi — 1/3 width — visible teaser, interaction gated */}
        {/* morning-card with backdrop-filter disabled: blur() + border-radius creates a clipping stacking context that hides the ElevenLabs popup */}
        <div ref={leviSectionRef} className="morning-card p-5 sm:p-7 flex flex-col gap-5 sm:gap-6" style={{ backdropFilter: 'none', WebkitBackdropFilter: 'none', overflow: 'visible' }}>
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

          {isPremium ? (
            <>
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
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="relative z-[9999] w-full flex justify-center"
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
            </>
          ) : (
            <button
              onClick={handleLeviUpgrade}
              disabled={leviUpgrading}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-full text-[10px] uppercase tracking-[0.2em] font-semibold bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 transition-all disabled:opacity-60 disabled:cursor-wait"
            >
              {leviUpgrading ? "..." : <><Lock className="w-4 h-4" /> {t("dashboard.premium.cta")}</>}
            </button>
          )}
        </div>
      </motion.div>

      {/* ═══ SHARE CARD ═══════════════════════════════════════════════ */}
      <motion.div className="mb-16" {...fadeIn(0.5)}>
        <ShareCard
          sunSign={apiData?.western?.zodiac_sign || ''}
          moonSign={apiData?.western?.moon_sign || ''}
        />
      </motion.div>

      {/* ═══ LEGAL FOOTER ═══════════════════════════════════════════════ */}
      <LegalFooter lang={lang} />
    </motion.div>
  );
}

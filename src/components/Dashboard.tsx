import { useMemo } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft, RefreshCw,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ShareCard } from "./ShareCard";
import { PremiumGate } from "./PremiumGate";
import { usePremium } from "../hooks/usePremium";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { LegalFooter } from "./LegalFooter";
import type { ApiData } from "../types/bafe";
import type { TileTexts, HouseTexts } from "../types/interpretation";
import { DashboardLeviSection } from "./dashboard/DashboardLeviSection";
import { DashboardAstroSection } from "./dashboard/DashboardAstroSection";
import { SectionErrorBoundary } from "./dashboard/SectionErrorBoundary";

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

// ── Animation helper ──────────────────────────────────────────────────────

function fadeIn(delay = 0) {
  return {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: "easeOut" as const, delay },
  };
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

  // ── Data extraction (kept for Levi + ShareCard) ─────────────────────
  const sunSign       = apiData.western?.zodiac_sign      || "";
  const zodiacAnimal  = apiData.bazi?.zodiac_sign         || "";
  const dominantEl    = apiData.wuxing?.dominant_element   || "";

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

      {/* ═══ ASTRO SECTION (Orrery + Western + BaZi/WuXing + Houses) ═══ */}
      <SectionErrorBoundary name="Astro">
        <DashboardAstroSection
          apiData={apiData}
          birthDate={birthDate}
          isPremium={isPremium}
          isFirstReading={isFirstReading}
          tileTexts={tileTexts}
          houseTexts={houseTexts}
        />
      </SectionErrorBoundary>

      {/* ═══ INTERPRETATION + LEVI ═══════════════════════════════════ */}
      <motion.div
        className="grid md:grid-cols-3 gap-5 sm:gap-8 mb-12 sm:mb-16"
        {...fadeIn(0.45)}
      >
        {/* AI Interpretation — 2/3 width */}
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
        <SectionErrorBoundary name="Levi">
          <DashboardLeviSection
            isPremium={isPremium}
            userId={userId}
            onStopAudio={onStopAudio}
            onResumeAudio={onResumeAudio}
            sunSign={sunSign}
            zodiacAnimal={zodiacAnimal}
            dominantEl={dominantEl}
          />
        </SectionErrorBoundary>
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

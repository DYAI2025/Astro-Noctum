import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, RefreshCw,
} from "lucide-react";
import { ShareCard } from "./ShareCard";
import { usePremium } from "../hooks/usePremium";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { LegalFooter } from "./LegalFooter";
import { UpgradeButton } from "./UpgradeButton";
import { ManageSubscription } from "./ManageSubscription";
import { DailyHoroscopeModal } from "./dashboard/DailyHoroscopeModal";
import { useFirstRunDaily } from "../hooks/useFirstRunDaily";
import { supabase } from "../lib/supabase";
import type { ApiData } from "../types/bafe";
import type { TileTexts, HouseTexts } from "../types/interpretation";
import { DashboardAstroSection } from "./dashboard/DashboardAstroSection";
import { DashboardInterpretationSection } from "./dashboard/DashboardInterpretationSection";
import { SectionErrorBoundary } from "./dashboard/SectionErrorBoundary";
import { isFeatureEnabled } from "../lib/feature-flags";

import BlueprintCard from "./dashboard/BlueprintCard";
import { TourOverlay } from "./dashboard/TourOverlay";
import { useDashboardTour } from "@/src/hooks/useDashboardTour";
import { usePlanetarium } from "@/src/contexts/PlanetariumContext";

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

// Stable empty array to avoid referential instability in hooks
const EMPTY_SECTORS: number[] = [];

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

  // ── Dashboard tour ────────────────────────────────────────────
  const { tourStep, next: tourNext, skip: tourSkip } = useDashboardTour(userId);
  const { setPlanetariumMode } = usePlanetarium();

  useEffect(() => {
    if (tourStep === 0) setPlanetariumMode(true);
  }, [tourStep, setPlanetariumMode]);

  // ── Fetch profile data for daily modal + signature widget ───────────
  const [profileMeta, setProfileMeta] = useState<{
    birthInput: { date: string; time: string; tz: string; lat: number; lon: number } | null;
    soulprintSectors: number[] | null;
    quizSectors: number[];
  }>({ birthInput: null, soulprintSectors: null, quizSectors: EMPTY_SECTORS });

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from('astro_profiles')
        .select('birth_date, birth_time, iana_time_zone, birth_lat, birth_lng, soulprint_sectors')
        .eq('user_id', userId)
        .maybeSingle();

      if (cancelled || !data) return;

      const birthInput = (data.birth_date && data.birth_lat != null && data.birth_lng != null)
        ? {
            date: data.birth_date,
            time: data.birth_time || '12:00',
            tz: data.iana_time_zone || 'Europe/Berlin',
            lat: data.birth_lat,
            lon: data.birth_lng,
          }
        : null;

      const soulprint = Array.isArray(data.soulprint_sectors) && data.soulprint_sectors.length === 12
        ? data.soulprint_sectors as number[]
        : null;

      setProfileMeta({ birthInput: birthInput, soulprintSectors: soulprint, quizSectors: EMPTY_SECTORS });
    })();

    return () => { cancelled = true; };
  }, [userId]);

  // ── Feature flags ──────────────────────────────────────────────────
  const dailyEnabled = isFeatureEnabled('daily_modal_v1');

  // ── Daily horoscope modal ───────────────────────────────────────────
  const { dailyData, showModal, handleClose: handleDailyClose } = useFirstRunDaily(
    userId,
    profileMeta.birthInput,
    profileMeta.soulprintSectors,
    profileMeta.quizSectors,
  );

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
        className="flex items-center gap-2 text-ink/40 hover:text-gold-deep transition-colors mb-10 text-[10px] uppercase tracking-[0.3em]"
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
        className="mb-6 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <p className="text-gold-deep/55 text-[9px] uppercase tracking-[0.5em] mb-3">
          {t("dashboard.welcome")}
        </p>
        <div className="flex items-center justify-center gap-4">
          <h1 className="font-serif text-3xl sm:text-[2.75rem] md:text-[3.5rem] leading-tight text-ink">
            {t("dashboard.title")}
          </h1>
          <button
            onClick={onRegenerate}
            disabled={isLoading}
            className="shrink-0 p-2.5 text-gold-deep/45 hover:text-gold-deep hover:bg-gold-deep/10 rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-gold-deep/20"
            title="Regenerate"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
        
        <div className="mt-8 text-left">
          <SectionErrorBoundary name="BlueprintCard">
            <BlueprintCard
              title={lang === 'de' ? "Kosmischer Blueprint" : "Cosmic Blueprint"}
              content={interpretation.split('\n\n')[0] || ""} 
              onCtaClick={() => document.getElementById("interpretation-section")?.scrollIntoView({ behavior: "smooth" })}
            />
          </SectionErrorBoundary>
        </div>
      </motion.header>

      {/* Upgrade Banner for free users */}
      {!isPremium && (
        <motion.div
          className="mb-8 w-full max-w-6xl rounded-2xl border border-gold/25 bg-linear-to-r from-[#D4AF37]/05 to-transparent p-5 flex items-center justify-between gap-4"
          {...fadeIn(0.15)}
        >
          <div>
            <p className="text-sm font-medium text-ink">
              {lang === 'de' ? 'Schalte dein volles kosmisches Profil frei' : 'Unlock your full cosmic profile'}
            </p>
            <p className="text-xs text-ink/50 mt-1">
              {lang === 'de'
                ? 'Vier Säulen, Häuser-Analyse, Levi Bazi Sprachagent und mehr'
                : 'Four Pillars, Houses analysis, Levi Bazi voice agent and more'}
            </p>
          </div>
          <UpgradeButton />
        </motion.div>
      )}
      {isPremium && (
        <motion.div
          className="mb-8 flex justify-end"
          {...fadeIn(0.15)}
        >
          <ManageSubscription className="text-ink/45 hover:text-gold-deep" />
        </motion.div>
      )}

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

      <div id="interpretation-section" />

      {/* ═══ GESAMTANALYSE — full-width below Houses ═══════════════ */}
      <motion.div
        className="mb-12 sm:mb-16"
        {...fadeIn(0.45)}
      >
        <SectionErrorBoundary name="Interpretation">
          <DashboardInterpretationSection
            interpretation={interpretation}
            isPremium={isPremium}
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

      {/* ═══ DAILY HOROSCOPE MODAL ═══════════════════════════════════════ */}
      <AnimatePresence>
        {dailyEnabled && showModal && dailyData && (
          <DailyHoroscopeModal data={dailyData} onClose={handleDailyClose} />
        )}
      </AnimatePresence>

      {/* ═══ TOUR OVERLAY ══════════════════════════════════════════════════ */}
      <TourOverlay
        step={tourStep}
        birthDate={birthDate || ''}
        birthCity=""
        onNext={tourNext}
        onSkip={tourSkip}
      />
    </motion.div>
  );
}

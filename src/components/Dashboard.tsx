import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
} from "lucide-react";
import { ShareCard } from "./ShareCard";
import { usePremium } from "../hooks/usePremium";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { LegalFooter } from "./LegalFooter";
import { UpgradeButton } from "./UpgradeButton";
import { ManageSubscription } from "./ManageSubscription";
import { DayModeModal } from "./dashboard/DayModeModal";
import { useFirstRunDaily } from "../hooks/useFirstRunDaily";
import { supabase } from "../lib/supabase";
import type { ApiData } from "../types/bafe";
import type { TileTexts } from "../types/interpretation";
import { DashboardAstroSection } from "./dashboard/DashboardAstroSection";
import { DashboardInterpretationSection } from "./dashboard/DashboardInterpretationSection";
import { SectionErrorBoundary } from "./dashboard/SectionErrorBoundary";
import { DashboardLeviSection } from "./dashboard/DashboardLeviSection";
import { isFeatureEnabled } from "../lib/feature-flags";

import { Button } from "./ui/button";
import { Card } from "./ui/card";
import BlueprintCard from "./dashboard/BlueprintCard";
import MiniSignature from "./dashboard/MiniSignature";
import { soulprintToNatalWeights } from "./fusion-ring-website/signatur-bridge";
import InfluenceGauges from "./dashboard/InfluenceGauges";
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
  isLoading: boolean;
  apiIssues: { endpoint: string; message: string }[];
  onStopAudio: () => void;
  onResumeAudio: () => void;
  isFirstReading?: boolean;
  tileTexts?: TileTexts;
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
  isLoading,
  apiIssues,
  onStopAudio,
  onResumeAudio,
  isFirstReading = false,
  tileTexts,
}: DashboardProps) {
  const { lang, t } = useLanguage();
  const { isPremium } = usePremium();
  const { user } = useAuth();

  // ── Dashboard tour ────────────────────────────────────────────
  const { tourStep, next: tourNext, skip: tourSkip } = useDashboardTour(userId);
  const { setPlanetariumMode, planetariumMode } = usePlanetarium();
  const [tourPrevPlanetariumMode, setTourPrevPlanetariumMode] = useState<boolean | null>(null);

  // Scroll-triggered tour: step 1 only shows when astro section is visible
  const [scrollReached, setScrollReached] = useState<Set<number>>(new Set());
  const planetariumSentinelRef = useRef<HTMLDivElement>(null);
  const astroSentinelRef = useRef<HTMLDivElement>(null);
  const leviSentinelRef = useRef<HTMLDivElement>(null);
  const navHintsSentinelRef = useRef<HTMLDivElement>(null);

  // Map tour steps to their anchor refs
  const tourAnchorRef = tourStep === 0 ? planetariumSentinelRef
    : tourStep === 1 ? astroSentinelRef
    : undefined;

  // Step 0 is immediate; step 1 waits for scroll
  const isTourStepVisible = tourStep === 0 || tourStep === 'done'
    || (tourStep === 1 && scrollReached.has(1));

  useEffect(() => {
    if (tourStep !== 1) return;

    const sentinel = astroSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setScrollReached(prev => new Set(prev).add(1));
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [tourStep]);

  useEffect(() => {
    if (tourStep === 0) {
      setTourPrevPlanetariumMode((prev) => (prev === null ? planetariumMode ?? null : prev));
      setPlanetariumMode(true);
    } else if (tourPrevPlanetariumMode !== null) {
      setPlanetariumMode(tourPrevPlanetariumMode);
      setTourPrevPlanetariumMode(null);
    }
  }, [tourStep, planetariumMode, tourPrevPlanetariumMode, setPlanetariumMode]);

  // ── Fetch profile data for daily modal + tour ──────────────────────
  const [profileMeta, setProfileMeta] = useState<{
    birthInput: { date: string; time: string; tz: string; lat: number; lon: number } | null;
    soulprintSectors: number[] | null;
    quizSectors: number[];
    birthCity: string;
  }>({ birthInput: null, soulprintSectors: null, quizSectors: EMPTY_SECTORS, birthCity: '' });

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      const [profileRes, birthRes] = await Promise.all([
        supabase
          .from('astro_profiles')
          .select('birth_date, birth_time, iana_time_zone, birth_lat, birth_lng, soulprint_sectors')
          .eq('user_id', userId)
          .maybeSingle(),
        supabase
          .from('birth_data')
          .select('place_label')
          .eq('user_id', userId)
          .maybeSingle(),
      ]);

      const data = profileRes.data;
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

      setProfileMeta({
        birthInput,
        soulprintSectors: soulprint,
        quizSectors: EMPTY_SECTORS,
        birthCity: birthRes.data?.place_label || '',
      });
    })();

    return () => { cancelled = true; };
  }, [userId]);

  // ── Feature flags ──────────────────────────────────────────────────
  const dailyEnabled = isFeatureEnabled('daily_modal_v1');

  // ── Daily horoscope modal ───────────────────────────────────────────
  const { dailyData, dayHarmonic, showModal, handleClose: handleDailyClose } = useFirstRunDaily(
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
      {/* ── Tour sentinel: step 0 anchors at the planetarium (top of dashboard) ── */}
      <div ref={planetariumSentinelRef} className="h-px" aria-hidden="true" />

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
        className="flex items-start justify-between border-b border-[#D4AF37]/15 pb-6 mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        {/* Left: title + subtitle */}
        <div>
          <div className="w-8 h-px bg-[#D4AF37]/40 mb-4" />
          <p className="text-[#D4AF37]/50 text-[9px] uppercase tracking-[0.5em] mb-2">
            {t("dashboard.welcome")}
          </p>
          <h1 className="font-serif text-5xl sm:text-6xl leading-tight text-white">
            {t("dashboard.title")}
          </h1>
          {birthDate && (
            <p className="mt-1.5 text-xs text-white/35 tracking-wide">
              {lang === "de" ? "Geburtsdatum" : "Birth date"}{": "}
              <span className="text-white/55">{birthDate}</span>
            </p>
          )}
        </div>

        {/* Right: language toggle + profile actions */}
        <div className="flex shrink-0 items-center gap-3 pt-1">
        </div>
      </motion.header>

      {/* Upgrade Banner for free users */}
      {!isPremium && (
        <Card variant="gold" className="mb-8 w-full max-w-6xl p-5 flex items-center justify-between gap-4"
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
        </Card>
      )}


      {/* ── Tour sentinel: step 1 triggers when astro section scrolls into view ── */}
      <div ref={astroSentinelRef} className="h-px" aria-hidden="true" />

      {/* ═══ ASTRO SECTION (Orrery + Western + BaZi/WuXing + Houses) ═══ */}
      <SectionErrorBoundary name="Astro">
        <DashboardAstroSection
          apiData={apiData}
          birthDate={birthDate}
          isPremium={isPremium}
          isFirstReading={isFirstReading}
          tileTexts={tileTexts}
        />
      </SectionErrorBoundary>

      {/* ═══ SIGNATUR V3 — Bipolar Trail Mini Preview ═══════════════════ */}
      <motion.div className="mb-12 sm:mb-16" {...fadeIn(0.35)}>
        <SectionErrorBoundary name="MiniSignature">
          <MiniSignature
            natalWeights={profileMeta.soulprintSectors ? soulprintToNatalWeights(profileMeta.soulprintSectors) : undefined}
            quizWeights={profileMeta.quizSectors.length === 12 ? soulprintToNatalWeights(profileMeta.quizSectors) : undefined}
            dayHarmonic={dayHarmonic}
            onExpand={() => window.location.assign('/signatur')}
          />
        </SectionErrorBoundary>
      </motion.div>

      {/* ── Tour sentinel: step 2 triggers when Levi/interpretation area scrolls into view ── */}
      <div ref={leviSentinelRef} className="h-px" aria-hidden="true" />

      {/* ═══ LEVI BAZI — Voice Agent Section ═══════════════════════════ */}
      <motion.div className="mb-12 sm:mb-16" {...fadeIn(0.4)}>
        <SectionErrorBoundary name="Levi">
          <DashboardLeviSection
            isPremium={isPremium}
            userId={userId}
            onStopAudio={onStopAudio}
            onResumeAudio={onResumeAudio}
            sunSign={apiData?.western?.zodiac_sign || ''}
            zodiacAnimal={apiData?.bazi?.zodiac_sign || ''}
            dominantEl={apiData?.wuxing?.dominant_element || ''}
          />
        </SectionErrorBoundary>
      </motion.div>

      {/* ═══ INFLUENCE GAUGES ═══════════════════════════════════════════ */}
      <motion.div className="mb-10" {...fadeIn(0.42)}>
        <SectionErrorBoundary name="InfluenceGauges">
          <InfluenceGauges />
        </SectionErrorBoundary>
      </motion.div>

      {/* ═══ BLUEPRINT CARD ═════════════════════════════════════════════ */}
      <motion.div className="mb-10" {...fadeIn(0.45)}>
        <SectionErrorBoundary name="BlueprintCard">
          <BlueprintCard
            content={interpretation.split('\n\n').find(p => p.trim() && !p.startsWith('#')) || t('dashboard.blueprint.loading')}
            onCtaClick={() => document.getElementById("interpretation-section")?.scrollIntoView({ behavior: "smooth" })}
          />
        </SectionErrorBoundary>
      </motion.div>

      {/* ── Tour sentinel: step 3 anchors at the navigation hints area ── */}
      <div ref={navHintsSentinelRef} className="h-px" aria-hidden="true" />

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
          <DayModeModal data={dailyData} dayHarmonic={dayHarmonic} onClose={handleDailyClose} />
        )}
      </AnimatePresence>

      {/* ═══ TOUR OVERLAY (scroll-gated for step 1 only) ════════════════════ */}
      {isTourStepVisible && (
        <TourOverlay
          step={tourStep}
          birthDate={birthDate || ''}
          birthCity={profileMeta.birthCity}
          onNext={tourNext}
          onSkip={tourSkip}
          anchorRef={tourAnchorRef}
        />
      )}
    </motion.div>
  );
}

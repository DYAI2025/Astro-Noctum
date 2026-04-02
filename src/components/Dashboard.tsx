import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
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
import { AgentSection } from "./dashboard/AgentSection";
import { AGENTS } from "@/packages/shared/src/agents/config";
import { CosmicWeatherCard } from "./CosmicWeatherCard";
import { DashboardTagesEnergie } from "./dashboard/DashboardTagesEnergie";
import { useSpaceWeather } from "../hooks/useSpaceWeather";
import { isFeatureEnabled } from "../lib/feature-flags";
import { useDailyHoroscope } from "../hooks/useDailyHoroscope";
import { useFusionRingContext } from "../contexts/FusionRingContext";

import { Card } from "./ui/card";
import {
  toNatalWeightsOrUndefined,
  toDimensionWeightsOrUndefined,
} from "@/src/lib/signatur/weight-utils";
import { DashboardBigFour as DashboardBigFourCard } from "./dashboard/DashboardBigFour";
import MiniSignature from "./dashboard/MiniSignature";
import InfluenceGauges from "./dashboard/InfluenceGauges";
import { TourOverlay } from "./dashboard/TourOverlay";
import { useDashboardTour } from "@/src/hooks/useDashboardTour";
import { usePlanetarium } from "@/src/contexts/PlanetariumContext";
import { VibesSection } from "./dashboard/VibesSection";

// ─────────────────────────────────────────────────────────────────────────────
// Static data
// ─────────────────────────────────────────────────────────────────────────────

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
  const navigate = useNavigate();
  const { isPremium } = usePremium();
  const { user } = useAuth();
  const { events: quizEvents } = useFusionRingContext();

  // ── Parse birth year for horoscope ────────────────────────────
  const birthYear = birthDate ? new Date(birthDate).getFullYear() : null;

  // ── Daily horoscope (CosmicWeatherCard data) ─────────────────
  const { horoscope, loading: horoscopeLoading, error: horoscopeError, refresh: horoscopeRefresh } =
    useDailyHoroscope(userId, apiData, quizEvents, birthYear, lang);

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
  const [metaLoading, setMetaLoading] = useState(true);
  const [metaError, setMetaError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setMetaLoading(true);
    setMetaError(null);

    (async () => {
      try {
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

        if (cancelled) return;

        if (profileRes.error) throw profileRes.error;

        if (birthRes.error) {
          console.error('[Dashboard] Birth data fetch failed:', birthRes.error);
          if (!cancelled) {
            setMetaError(birthRes.error.message || 'Failed to load birth city');
          }
        }

        const data = profileRes.data;
        if (!data) {
          setMetaLoading(false);
          return;
        }

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
      } catch (err: unknown) {
        console.error('[Dashboard] Meta fetch failed:', err);
        const message = err instanceof Error ? err.message : 'Failed to load profile data';
        if (!cancelled) setMetaError(message);
      } finally {
        if (!cancelled) setMetaLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [userId]);

  // ── Feature flags ──────────────────────────────────────────────────
  const dailyEnabled = isFeatureEnabled('daily_modal_v1');

  // ── Space weather (für DashboardTagesEnergie Resonanz + Kosmoswetter) ──
  const spaceWeather = useSpaceWeather();

  // ── Daily horoscope modal ───────────────────────────────────────────
  // isDayModalOpen: on-demand via "vertiefen →" in DashboardTagesEnergie.
  // showModal (auto-open) deliberately not used for rendering — wireframe F3:
  // "Modal wird nicht mehr automatisch geöffnet".
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const { dailyData, dayHarmonic, handleClose: handleDailyClose } = useFirstRunDaily(
    userId,
    profileMeta.birthInput,
    profileMeta.soulprintSectors,
    profileMeta.quizSectors,
  );
  const natalWeights = useMemo(
    () => toNatalWeightsOrUndefined(profileMeta.soulprintSectors),
    [profileMeta.soulprintSectors],
  );

  // ── Memoised V3 dimension weights for MiniSignature ─────────────────
  const dimensionWeights = useMemo(
    () => toDimensionWeightsOrUndefined(profileMeta.soulprintSectors),
    [profileMeta.soulprintSectors],
  );

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full max-w-6xl mx-auto px-4 md:px-6 flex flex-col gap-20"
    >
      {/* ── Tour sentinel: step 0 anchors at the planetarium (top of dashboard) ── */}
      <div ref={planetariumSentinelRef} className="h-px" aria-hidden="true" />

      {/* Issues banner */}
      {(apiIssues.length > 0 || metaError) && (
        <div className="rounded-xl border border-amber-400/40 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          {metaError ? (
            <p className="flex items-center gap-2">
              <span className="font-semibold">Notice:</span> {metaError}
            </p>
          ) : (
            <>
              {t("dashboard.fallbackNote")}
              <ul className="mt-2 list-disc pl-4 space-y-1">
                {apiIssues.map((issue, i) => (
                  <li key={i}><span className="font-semibold">{issue.endpoint}</span>: {issue.message}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {/* ═══ PAGE HEADER ═══════════════════════════════════════════════ */}
      <motion.header
        className="flex items-start justify-between border-b border-[#D4AF37]/15 pb-6"
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
              {t("dashboard.birthDate")}{": "}
              <span className="text-white/55">{birthDate}</span>
            </p>
          )}
        </div>

        {/* Right: language toggle + profile actions */}
        <div className="flex shrink-0 items-center gap-3 pt-1">
        </div>
      </motion.header>

      {/* ═══ IDENTITY — Big Four + MiniSignature (F1+F2) ════════════════════ */}
      <motion.div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-start" {...fadeIn(0.05)}>
        <SectionErrorBoundary name="BigFour">
          <DashboardBigFourCard
            sunSign={apiData?.western?.zodiac_sign || ''}
            moonSign={apiData?.western?.moon_sign || ''}
            ascendant={apiData?.western?.ascendant_sign || ''}
            baziAnimal={apiData?.bazi?.zodiac_sign || ''}
          />
        </SectionErrorBoundary>

        <SectionErrorBoundary name="MiniSignature">
          <div className="w-[200px] md:w-[240px] mx-auto md:mx-0">
            <MiniSignature
              natalWeights={natalWeights}
              quizWeights={{}}
              dayHarmonic={dayHarmonic}
              onExpand={() => navigate('/signatur')}
            />
          </div>
        </SectionErrorBoundary>
      </motion.div>

      {/* ═══ TAGES-IMPULS — Hero-Sektion (immer vollständig sichtbar) ══════ */}
      <motion.div {...fadeIn(0.1)}>
        <SectionErrorBoundary name="TagesImpuls">
          {dailyData ? (
            <DashboardTagesEnergie
              daily={dailyData}
              dayHarmonic={dayHarmonic}
              spaceWeather={spaceWeather}
              onOpenDayModal={dailyEnabled ? () => setIsDayModalOpen(true) : undefined}
            />
          ) : (
            // Legacy fallback: CosmicWeatherCard while dailyData is not yet loaded
            <CosmicWeatherCard
              horoscope={horoscope}
              loading={horoscopeLoading}
              error={horoscopeError}
              onRefresh={horoscopeRefresh}
              lang={lang}
              isPremium={isPremium}
            />
          )}
        </SectionErrorBoundary>
      </motion.div>

      {/* ═══ SECTION 3: INFLUENCE GAUGES ═══════════════════════════════ */}
      <motion.div {...fadeIn(0.15)}>
        <SectionErrorBoundary name="InfluenceGauges">
          <InfluenceGauges
            weights={natalWeights}
          />
        </SectionErrorBoundary>
      </motion.div>

      {/* ── Tour sentinel: step 1 triggers when astro section scrolls into view ── */}
      <div ref={astroSentinelRef} className="h-px" aria-hidden="true" />

      {/* ═══ SECTION 7: KOSMISCHER BLUEPRINT (Accordion: Westlich/BaZi/Wu-Xing/Orrery) ═══ */}
      <SectionErrorBoundary name="Astro">
        <DashboardAstroSection
          apiData={apiData}
          birthDate={birthDate}
          isPremium={isPremium}
          isFirstReading={isFirstReading}
          tileTexts={tileTexts}
        />
      </SectionErrorBoundary>

      {/* ── Tour sentinel: step 2 triggers when Levi/interpretation area scrolls into view ── */}
      <div ref={leviSentinelRef} className="h-px" aria-hidden="true" />

      {/* ═══ VOICE AGENTS — Multi-Agent Section ═══════════════════════ */}
      <motion.div {...fadeIn(0.4)}>
        <SectionErrorBoundary name="Agents">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {AGENTS.map(agent => (
              <AgentSection
                key={agent.id}
                agent={agent}
                isPremium={isPremium}
                userId={userId}
                onStopAudio={onStopAudio}
                onResumeAudio={onResumeAudio}
                sunSign={apiData?.western?.zodiac_sign || ''}
                zodiacAnimal={apiData?.bazi?.zodiac_sign || ''}
                dominantEl={apiData?.wuxing?.dominant_element || ''}
              />
            ))}
          </div>
        </SectionErrorBoundary>
      </motion.div>

      {/* ═══ UPGRADE BANNER (freemium only, nach Agenten — F4) ════════════ */}
      {!isPremium && (
        <Card variant="gold" className="w-full max-w-6xl p-6 flex items-center justify-between gap-4"
          {...fadeIn(0.42)}
        >
          <div>
            <p className="text-sm font-medium text-ink">
              {t("dashboard.upgradeCard.title")}
            </p>
            <p className="text-xs text-ink/50 mt-1">
              {t("dashboard.upgradeCard.subtitle")}
            </p>
          </div>
          <UpgradeButton />
        </Card>
      )}

      {/* ── Tour sentinel: step 3 anchors at the navigation hints area ── */}
      <div ref={navHintsSentinelRef} className="h-px" aria-hidden="true" />

      <div id="interpretation-section" />

      {/* ═══ SECTION 8: KI-SYNTHESE (premium) ═════════════════════════ */}
      <motion.div
        {...fadeIn(0.35)}
      >
        <SectionErrorBoundary name="Interpretation">
          <DashboardInterpretationSection
            interpretation={interpretation}
            isPremium={isPremium}
          />
        </SectionErrorBoundary>
      </motion.div>

      {/* ═══ SECTION 9: SHARE CARD + FOOTER ═══════════════════════════ */}
      <motion.div {...fadeIn(0.4)}>
        <ShareCard
          sunSign={apiData?.western?.zodiac_sign || ''}
          moonSign={apiData?.western?.moon_sign || ''}
        />
      </motion.div>

      <LegalFooter lang={lang} />

      {/* ═══ DAILY HOROSCOPE MODAL ═══════════════════════════════════════ */}
      <AnimatePresence>
        {dailyEnabled && isDayModalOpen && dailyData && (
          <DayModeModal
            data={dailyData}
            dayHarmonic={dayHarmonic}
            onClose={() => {
              setIsDayModalOpen(false);
              handleDailyClose(); // marks daily_modal_seen_date in Supabase
            }}
          />
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

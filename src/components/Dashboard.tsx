import { useState, useEffect, useMemo, useRef, lazy, Suspense } from "react";
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
  syntheticSoulprintFromSign,
} from "@/src/lib/signatur/weight-utils";
import { DashboardBigFour as DashboardBigFourCard } from "./dashboard/DashboardBigFour";
// MiniSignature removed from dashboard grid — coherence-first layout.
import { CosmicInfluenceSection } from "./dashboard/CosmicInfluenceSection";
import { TourOverlay } from "./dashboard/TourOverlay";
import { MagnetsturmKarte } from "./dashboard/MagnetsturmKarte";
import { NatalSignaturStatic } from "./dashboard/NatalSignaturStatic";
import { useFusionSignal } from "../hooks/useFusionSignal";
import { useDashboardTour } from "@/src/hooks/useDashboardTour";
import { usePlanetarium } from "@/src/contexts/PlanetariumContext";
import { useDeviceLocation } from "@/src/hooks/useDeviceLocation";
import { VibesSection } from "./dashboard/VibesSection";
import { SkyModeToggle } from "./dashboard/SkyModeToggle";
import { getConstellationForSign } from "../lib/astro-data/constellationFromSign";
import { useCelestialOrrery } from "../hooks/useCelestialOrrery";
import { CITIES } from "../lib/astronomy/data";
import { DailyChartHero } from "./dashboard/DailyChartHero";
import { useActiveImpacts } from "../hooks/useActiveImpacts";

const BirthChartOrrery = lazy(() => import("./BirthChartOrrery").then(m => ({ default: m.BirthChartOrrery })));

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

  // ── Planetarium data ──────────────────────────────────────────────
  const orreryDate = useMemo(() => {
    if (!birthDate) return new Date();
    const d = new Date(birthDate);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [birthDate]);

  // Main Celestial hook — owned by Dashboard to sync all live sections (Pulse, Gauges, Orrery)
  const orreryHook = useCelestialOrrery(CITIES[0], orreryDate);
  const { simTime, currentDate, isPlaying, setIsPlaying } = orreryHook;

  // ── Dashboard tour ────────────────────────────────────────────
  const { tourStep, next: tourNext, skip: tourSkip } = useDashboardTour(userId);
  const { setPlanetariumMode, planetariumMode, skyMode } = usePlanetarium();
  const deviceLocation = useDeviceLocation(skyMode === 'current');
  const [tourPrevPlanetariumMode, setTourPrevPlanetariumMode] = useState<boolean | null>(null);

  // Scroll-triggered tour: step 1 only shows when astro section is visible
  const [scrollReached, setScrollReached] = useState<Set<number>>(new Set());
  const planetariumSentinelRef = useRef<HTMLDivElement>(null);
  const astroSentinelRef = useRef<HTMLDivElement>(null);
  const leviSentinelRef = useRef<HTMLDivElement>(null);
  const navHintsSentinelRef = useRef<HTMLDivElement>(null);

  // Map tour steps to their anchor refs (coherence-first layout)
  // Step 0: anchors at astro/planet section (now near top)
  // Step 1: anchors at levi/agents section (scrolls into view)
  const tourAnchorRef = tourStep === 0 ? astroSentinelRef
    : tourStep === 1 ? leviSentinelRef
    : undefined;

  // Step 0 is immediate; step 1 waits for scroll
  const isTourStepVisible = tourStep === 0 || tourStep === 'done'
    || (tourStep === 1 && scrollReached.has(1));

  useEffect(() => {
    if (tourStep !== 1) return;

    const sentinel = leviSentinelRef.current;
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

  const sunSign = apiData?.western?.zodiac_sign || '';
  const birthConstellationKey = useMemo(
    () => getConstellationForSign(sunSign)?.key,
    [sunSign],
  );

  // ── Feature flags ──────────────────────────────────────────────────
  const dailyEnabled = isFeatureEnabled('daily_modal_v1');

  // ── Space weather (für DashboardTagesEnergie Resonanz + Kosmoswetter) ──
  const spaceWeather = useSpaceWeather();

  // ── Transit signal — provides events[] for DailyChartHero ──
  const { events: transitEvents, loading: transitLoading } = useFusionSignal(userId);

  // ── Active Impacts — harmony_index + active planets from POST /api/impact/active ──
  const {
    harmonyIndex: impactHarmonyIndex,
    baseCoherence: impactBaseCoherence,
    positiveDailyDelta: impactPositiveDailyDelta,
    displayedCoherence: impactDisplayedCoherence,
    activePlanets: impactPlanets,
    loading: impactLoading,
  } = useActiveImpacts();

  // ── Daily horoscope modal ───────────────────────────────────────────
  // isDayModalOpen: on-demand via "vertiefen →" in DashboardTagesEnergie.
  // showModal (auto-open) deliberately not used for rendering - wireframe F3:
  // "Modal wird nicht mehr automatisch geöffnet".
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);

  // ── Effective soulprint: DB value or synthetic fallback from BAFE zodiac sign ──
  const effectiveSoulprint = useMemo(
    () => profileMeta.soulprintSectors
      ?? syntheticSoulprintFromSign(apiData?.western?.zodiac_sign || ''),
    [profileMeta.soulprintSectors, apiData?.western?.zodiac_sign],
  );

  const birthSign = apiData?.western?.zodiac_sign ?? null;

  const { dailyData, dayHarmonic, nightHarmonic, handleClose: handleDailyClose } = useFirstRunDaily(
    userId,
    profileMeta.birthInput,
    effectiveSoulprint,
    profileMeta.quizSectors,
    birthSign,
    skyMode === 'current' ? currentDate.toISOString().split('T')[0] : undefined
  );

  // Night-Pulse gate: weekends → all users; weekdays → Premium only.
  const activeDayHarmonic = useMemo(() => {
    if (!nightHarmonic) return dayHarmonic;
    const now = new Date();
    const hour = now.getHours();
    if (hour < 21 && hour >= 6) return dayHarmonic;
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    return (isWeekend || isPremium) ? nightHarmonic : dayHarmonic;
  }, [dayHarmonic, nightHarmonic, isPremium]);

  // natalWeights + dimensionWeights removed — MiniSignature no longer in dashboard grid.

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full max-w-6xl mx-auto px-4 md:px-6 flex flex-col gap-12"
    >
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
        {/* Left: brandmark + subtitle */}
        <div>
          <h1
            className="font-serif text-6xl sm:text-7xl leading-none tracking-tight"
            style={{ color: 'var(--color-gold)' }}
          >
            Bazodiac
          </h1>
          {/* Ornamental underline */}
          <div
            className="mt-2 mb-3 h-[2px] w-20 rounded-full"
            style={{ background: 'linear-gradient(90deg, var(--color-gold) 0%, transparent 100%)' }}
          />
          {birthDate && (
            <p className="text-xs tracking-wide" style={{ color: 'var(--tile-text-secondary)' }}>
              {t("dashboard.birthDate")}{":\u00a0"}
              <span style={{ color: 'var(--tile-text-secondary)' }}>{birthDate}</span>
            </p>
          )}
        </div>

        {/* Right: language toggle + profile actions */}
        <div className="flex shrink-0 items-center gap-3 pt-1">
        </div>
      </motion.header>

      {/* ═══ 1. DAILY CHART HERO (unified volatile hero — DEC-dashboard-volatile-first) ═══ */}
      <motion.div {...fadeIn(0.02)}>
        <SectionErrorBoundary name="DailyChartHero">
          <DailyChartHero
            loading={(metaLoading || transitLoading) && impactHarmonyIndex == null}
            baseCoherence={impactBaseCoherence}
            positiveDailyDelta={impactPositiveDailyDelta}
            displayedCoherence={impactDisplayedCoherence}
            spaceWeather={spaceWeather}
            activePlanets={impactPlanets}
            transitEvents={transitEvents}
            dayMode={dailyData?.fusion?.day_mode ?? 'pulse'}
          />
        </SectionErrorBoundary>
      </motion.div>

      {/* ── Tour sentinel: step 0 anchors at the planet section ── */}
      <div ref={astroSentinelRef} className="h-px" aria-hidden="true" />

      {/* ═══ 4. DAILY PULSE NARRATIVE (Tagesimpuls) ══════════════════ */}
      <motion.div {...fadeIn(0.10)}>
        <SectionErrorBoundary name="TagesImpuls">
          {dailyData ? (
            <DashboardTagesEnergie
              daily={dailyData}
              dayHarmonic={activeDayHarmonic}
              spaceWeather={spaceWeather}
              onOpenDayModal={dailyEnabled ? () => setIsDayModalOpen(true) : undefined}
              isPremium={isPremium}
            />
          ) : (
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

      {/* ═══ 5. VIBES ═════════════════════════════════════════════════ */}
      <motion.div {...fadeIn(0.12)}>
        <SectionErrorBoundary name="Vibes">
          <div className="flex justify-center md:justify-start">
            <VibesSection userId={userId} />
          </div>
        </SectionErrorBoundary>
      </motion.div>

      {/* ── Tour sentinel: step 1 triggers when agents scroll into view ── */}
      <div ref={leviSentinelRef} className="h-px" aria-hidden="true" />

      {/* ═══ 6. ASTRO AGENTS — interpretation bridge ═════════════════ */}
      <motion.div {...fadeIn(0.14)}>
        <SectionErrorBoundary name="Agents">
          <div className="cosmic-tile p-6 rounded-[2rem] space-y-5">
            <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-center" style={{ color: 'var(--tile-text-secondary)' }}>
              {t('dashboard.astroAgents')}
            </h2>
            <p className="text-[11px] text-center leading-relaxed" style={{ color: 'var(--tile-text-secondary)', opacity: 0.6 }}>
              {t('dashboard.astroAgentsIntro')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          </div>
        </SectionErrorBoundary>
      </motion.div>

      {/* ═══ 7. BLUEPRINT — collapsed natal accordion ════════════════ */}
      <SectionErrorBoundary name="NatalSignaturStatic">
        <NatalSignaturStatic>
          <DashboardAstroSection
            apiData={apiData}
            isPremium={isPremium}
            tileTexts={tileTexts}
          />
        </NatalSignaturStatic>
      </SectionErrorBoundary>

      {/* ═══ 8. STABLE NATAL VALUES — Identity Cards ════════════════ */}
      <motion.div {...fadeIn(0.18)}>
        <SectionErrorBoundary name="BigFour">
          <DashboardBigFourCard
            sunSign={apiData?.western?.zodiac_sign || ''}
            moonSign={apiData?.western?.moon_sign || ''}
            ascendant={apiData?.western?.ascendant_sign || ''}
            baziAnimal={apiData?.bazi?.zodiac_sign || ''}
            wuxingElement={apiData?.wuxing?.dominant_element || ''}
          />
        </SectionErrorBoundary>
      </motion.div>

      {/* ═══ 9. PLANETARIUM (Birth Chart Orrery) ═════════════════════ */}
      <div ref={planetariumSentinelRef} className="h-px" aria-hidden="true" />
      <motion.div className="-mx-4 md:-mx-6" {...fadeIn(0.20)}>
        <Suspense fallback={<div className="w-full aspect-[16/10] min-h-[360px] bg-[#0A0A14] rounded-2xl animate-pulse" />}>
          <BirthChartOrrery
            birthDate={orreryDate}
            planetariumMode={planetariumMode}
            birthConstellation={birthConstellationKey}
            autoPlay={isFirstReading}
            currentSky={skyMode === 'current'}
            observerLat={
              skyMode === 'current'
                ? (deviceLocation?.lat ?? profileMeta.birthInput?.lat)
                : profileMeta.birthInput?.lat
            }
            observerLon={
              skyMode === 'current'
                ? (deviceLocation?.lon ?? profileMeta.birthInput?.lon)
                : profileMeta.birthInput?.lon
            }
            orreryHook={orreryHook}
          />
        </Suspense>
      </motion.div>

      {/* ═══ SKY MODE TOGGLE ═══════════════════════════════════════════ */}
      {planetariumMode && (
        <motion.div className="-mt-8" {...fadeIn(0.22)}>
          <SkyModeToggle />
        </motion.div>
      )}

      {/* ═══ 10. COSMIC INFLUENCE DETAIL ═════════════════════════════ */}
      <motion.div {...fadeIn(0.24)}>
        <SectionErrorBoundary name="CosmicInfluence">
          <CosmicInfluenceSection spaceWeather={spaceWeather} />
        </SectionErrorBoundary>
      </motion.div>

      {/* ═══ 11. MAGNETSTURM (self-hides when Kp < 4) ════════════════ */}
      <motion.div {...fadeIn(0.26)}>
        <SectionErrorBoundary name="MagnetsturmKarte">
          <MagnetsturmKarte />
        </SectionErrorBoundary>
      </motion.div>

      {/* ═══ UPGRADE BANNER (freemium only) ══════════════════════════ */}
      {!isPremium && (
        <Card variant="gold" className="w-full max-w-6xl p-6 flex items-center justify-between gap-4"
          {...fadeIn(0.28)}
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

      {/* ═══ KI-SYNTHESE (premium) ═══════════════════════════════════ */}
      <motion.div {...fadeIn(0.30)}>
        <SectionErrorBoundary name="Interpretation">
          <DashboardInterpretationSection
            interpretation={interpretation}
            isPremium={isPremium}
          />
        </SectionErrorBoundary>
      </motion.div>

      {/* ═══ SHARE CARD + FOOTER ═════════════════════════════════════ */}
      <motion.div {...fadeIn(0.32)}>
        <ShareCard
          sunSign={apiData?.western?.zodiac_sign || ''}
          moonSign={apiData?.western?.moon_sign || ''}
        />
      </motion.div>

      <LegalFooter lang={lang} />

      {/* ═══ DAILY HOROSCOPE MODAL ═══════════════════════════════════ */}
      <AnimatePresence>
        {dailyEnabled && isDayModalOpen && dailyData && (
          <DayModeModal
            data={dailyData}
            dayHarmonic={activeDayHarmonic}
            onClose={() => {
              setIsDayModalOpen(false);
              handleDailyClose();
            }}
          />
        )}
      </AnimatePresence>

      {/* ═══ TOUR OVERLAY ════════════════════════════════════════════ */}
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

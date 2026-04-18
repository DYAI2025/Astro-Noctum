import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { useLanguage } from '@/src/contexts/LanguageContext';
import { useAppLayout } from '@/src/contexts/AppLayoutContext';
import { SignaturRenderer } from '@/src/components/signatur-renderer/SignaturRenderer';
import { usePlanetarium } from '@/src/contexts/PlanetariumContext';
import QuizOverlay from '@/src/components/QuizOverlay';
import { useQuizContribution } from '@/src/hooks/useQuizContribution';
import { useCompletedModules } from '@/src/hooks/useCompletedModules';
import { useQuizSuggestion } from '@/src/hooks/useQuizSuggestion';
import { usePremium } from '@/src/hooks/usePremium';
import { useSpaceWeather } from '@/src/hooks/useSpaceWeather';
import { useSignaturSignal } from '@/src/hooks/useSignaturSignal';
import { useDissonance } from '@/src/hooks/useDissonance';
import { useFirstRunDaily } from '@/src/hooks/useFirstRunDaily';
import { upsertDissonanceState } from '@/src/services/supabase';
import { ClusterSidebar } from '@/src/components/signatur/ClusterSidebar';
import { DissonanceValues } from '@/src/components/settings/DissonanceValues';
import { PremiumUpgradeModal } from '@/src/components/signatur/PremiumUpgradeModal';
import { ClusterPipeline } from '@/src/components/signatur/ClusterPipeline';
import {
  CLUSTER_REGISTRY,
  isClusterComplete,
  findClusterForModule,
} from '@/src/lib/fusion-ring/clusters';
import { toNatalWeightsOrUndefined, toQuizWeightsOrUndefined } from '@/src/lib/signatur/weight-utils';
import { baziToChladniParams } from '@/src/lib/cymatics/bazi-to-chladni';
import type { ContributionEvent } from '@/src/lib/lme/types';
import { eventToSectorSignals } from '@/src/lib/fusion-ring/test-signal';
import { useCoustoAudio } from '@/src/hooks/useCoustoAudio';
import { useCosmicResonance } from '@/src/hooks/useCosmicResonance';
import { useFluidityLevel } from '@/src/hooks/useFluidityLevel';
import { SpaceWeatherPanel } from '@/src/components/signatur/SpaceWeatherPanel';
import { TransitResonancePanels } from '@/src/components/signatur/TransitResonancePanels';
import { CymaticsFrequencyPanel } from '@/src/components/signatur-cymatics/CymaticsFrequencyPanel';
import { ChladniParamsBadge } from '@/src/components/signatur-cymatics/ChladniParamsBadge';

export default function SignaturPage() {
  const { t, lang } = useLanguage();
  const { userId, apiData } = useAppLayout();
  const { planetariumMode } = usePlanetarium();
  const { isPremium } = usePremium();
  const { completedModuleIds, addModule } = useCompletedModules();
  const { tier: fluidityTier } = useFluidityLevel(completedModuleIds);
  const suggestedModule = useQuizSuggestion(completedModuleIds);
  const quizContribution = useQuizContribution(completedModuleIds);
  const spaceWeather = useSpaceWeather();
  const { signalData, refresh: refreshSignal } = useSignaturSignal(userId);
  const { dayHarmonic, nightHarmonic } = useFirstRunDaily(userId, null, signalData?.baseSignals ?? null, [], null);

  // Night-Pulse gate: weekend (Sat/Sun) → all users; weekday → Premium only.
  const activeHarmonic = useMemo(() => {
    if (!nightHarmonic) return dayHarmonic;
    const now = new Date();
    const hour = now.getHours();
    if (hour < 21 && hour >= 6) return dayHarmonic; // daytime → always use day
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    const nightEligible = isWeekend || isPremium;
    return nightEligible ? nightHarmonic : dayHarmonic;
  }, [dayHarmonic, nightHarmonic, isPremium]);

  const [activeQuiz, setActiveQuiz] = useState<string | null>(null);
  const [justCompletedCluster, setJustCompletedCluster] = useState<string | null>(null);
  const [liveQuizWeights, setLiveQuizWeights] = useState<Record<string, number> | undefined>();
  const [liveQuizSectors, setLiveQuizSectors] = useState<number[] | null>(null);
  // Cleared when transit state refreshes — lets cumulative v3DimensionWeights take over as a second morph
  const pendingLiveWeightsClearRef = useRef(false);
  const [premiumCluster, setPremiumCluster] = useState<string | null>(null);
  const [ringEffect, setRingEffect] = useState<{ type: string; color?: string; timestamp: number; intensity?: number } | null>(null);

  // Auto-dismiss cluster completion overlay after 3s
  const clusterDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (justCompletedCluster) {
      if (clusterDismissRef.current) clearTimeout(clusterDismissRef.current);
      clusterDismissRef.current = setTimeout(() => setJustCompletedCluster(null), 3000);
    }
    return () => { if (clusterDismissRef.current) clearTimeout(clusterDismissRef.current); };
  }, [justCompletedCluster]);

  // When signalData refreshes after a quiz, clear liveQuizWeights so the cumulative
  // v3DimensionWeights take over and queue a second morph to the accurate final state.
  // This gives full-cluster completions a "deutliche Verschiebung" after the transit refresh.
  useEffect(() => {
    if (pendingLiveWeightsClearRef.current) {
      setLiveQuizWeights(undefined);
      pendingLiveWeightsClearRef.current = false;
    }
  }, [signalData?.baseSignals]);

  // Natal planet weights from birth chart soulprint
  const natalPlanetWeights = useMemo(
    () => toNatalWeightsOrUndefined(signalData?.baseSignals) ?? null,
    [signalData?.baseSignals],
  );

  // Current planet weights derived from the latest quiz sectors
  const currentPlanetWeights = useMemo(
    () => toNatalWeightsOrUndefined(liveQuizSectors) ?? null,
    [liveQuizSectors],
  );

  const wuxinBalance = useMemo(
    () => apiData?.wuxing?.elements ?? undefined,
    [apiData?.wuxing?.elements],
  );

  // Chladni params — derived deterministically from BaZi pillars + Wu-Xing weights.
  // undefined when birth data is unavailable → SignaturRenderer falls back to V3/V2/V1.
  const chladniParams = useMemo(() => {
    const pillars = apiData?.bazi?.pillars;
    const wuxingWeights = apiData?.wuxing?.elements;
    if (!pillars || !wuxingWeights) return undefined;
    const rawHarmony = apiData?.wuxing?.['harmony_index'];
    const harmonyIndex = Number.isFinite(rawHarmony as number) ? (rawHarmony as number) : 0.5;
    return baziToChladniParams(pillars, wuxingWeights, harmonyIndex);
  }, [apiData?.bazi?.pillars, apiData?.wuxing]);

  // Cousto audio — dimension weights drive oscillator gains
  const audioWeights = useMemo(
    () => liveQuizWeights ?? toQuizWeightsOrUndefined(signalData?.baseSignals),
    [liveQuizWeights, signalData?.baseSignals],
  );
  const { muted: audioMuted, toggleMute: toggleAudioMute, volume: audioVolume, setVolume: setAudioVolume } = useCoustoAudio(audioWeights);

  const { modulation: dissonanceModulation, dissonance } = useDissonance({
    natalWeights: natalPlanetWeights,
    currentWeights: currentPlanetWeights,
    previousWeights: null,
    wuxinBalance,
  });

  // Cosmic resonance — personalized space weather sensitivity
  const sunSign = apiData?.western?.zodiac_sign as string | undefined;
  const moonSign = apiData?.western?.moon_sign as string | undefined;
  const { profile: resonanceProfile } = useCosmicResonance({
    natalWeights: natalPlanetWeights,
    ringModulation: spaceWeather.ringModulation,
    sunSign,
    moonSign,
  });

  const handleQuizComplete = useCallback((event: ContributionEvent) => {
    quizContribution(event);
    const moduleId = event.source?.moduleId;
    if (moduleId) {
      addModule(moduleId);
      // Trigger immediate transit-state refresh so the ring updates within seconds
      setTimeout(refreshSignal, 500);

      // Check if this completion finishes a cluster
      const cluster = findClusterForModule(moduleId);
      if (cluster) {
        const updated = new Set([...completedModuleIds, moduleId]);
        if (isClusterComplete(cluster, updated)) {
          setJustCompletedCluster(cluster.id);
          setRingEffect({ type: 'burst', color: cluster.color, timestamp: Date.now(), intensity: cluster.significance });
        }
      }

      // Compute live quizWeights for immediate ring reactivity (first morph: quiz event weights).
      // pendingLiveWeightsClearRef ensures a second morph fires when transit state refreshes,
      // transitioning to the cumulative state — giving full-cluster completions their full shift.
      const sectors = eventToSectorSignals(event);
      if (sectors && sectors.length === 12) {
        const normalized = sectors.map(s => (s + 1) / 2);
        setLiveQuizWeights(toQuizWeightsOrUndefined(normalized));
        setLiveQuizSectors(normalized);
        pendingLiveWeightsClearRef.current = true;
      }

      // Persist dissonance snapshot — fire and forget
      if (userId && natalPlanetWeights && dissonance) {
        void upsertDissonanceState(
          userId,
          natalPlanetWeights,
          null,
          dissonance,
          completedModuleIds.size + 1,
        );
      }
    }
    // Do NOT close the overlay here — the quiz still shows its ResultScreen
    // as a reward/motivation step. The user closes it via the overlay's
    // close button, backdrop click, or Escape key.
  }, [quizContribution, completedModuleIds, addModule, userId, natalPlanetWeights, dissonance, refreshSignal]);

  const completedClusterDef = justCompletedCluster
    ? CLUSTER_REGISTRY.find(c => c.id === justCompletedCluster) ?? null
    : null;

  // Auto-trigger ring effect during severe space weather storms (G3+)
  useEffect(() => {
    if (spaceWeather.triggerEffect && spaceWeather.kpIndex >= 7) {
      setRingEffect({
        type: 'korona_eruption',
        color: spaceWeather.kpIndex >= 9 ? '#ef4444' : '#f97316',
        timestamp: Date.now(),
      });
    }
  }, [spaceWeather.triggerEffect, spaceWeather.kpIndex]);

  return (
    <div className={`relative min-h-screen w-full overflow-hidden ${
      planetariumMode ? 'bg-[#020509] text-white' : 'bg-transparent text-slate-800'
    }`}>
      {/* Radial gradient overlay — dark/Planetarium mode only */}
      {planetariumMode && (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,180,216,0.18),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(212,175,55,0.2),transparent_42%),radial-gradient(circle_at_center,rgba(255,255,255,0.03),transparent_65%)]" />
      )}

      <section className="relative mx-auto flex w-full max-w-[1400px] flex-col gap-8 px-4 pb-20 pt-10 md:px-10 md:pt-20">
        {/* Header */}
        <header className="flex items-center justify-between gap-4">
          <Link
            to="/"
            className={`inline-flex items-center gap-2 rounded-full border bg-black/40 transition hover:border-[#D4AF37]/60 hover:text-[#D4AF37] ${
              fluidityTier >= 1
                ? 'border-white/8 px-2 py-1 text-[10px] text-white/40'
                : 'border-white/15 px-3 py-1.5 text-xs text-white/70'
            } uppercase tracking-[0.2em]`}
            aria-label={t('signatur.back')}
          >
            <ArrowLeft className={fluidityTier >= 1 ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
            {fluidityTier >= 1 ? null : t('signatur.back')}
          </Link>

          <div className="flex items-center gap-3">
            {/* Cousto Audio controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleAudioMute}
                className="rounded-full border border-white/10 bg-black/45 p-1.5 text-white/60 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
                aria-label={audioMuted ? 'Unmute' : 'Mute'}
              >
                {audioMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              </button>
              {!audioMuted && (
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={audioVolume}
                  onChange={e => setAudioVolume(parseFloat(e.target.value))}
                  className="h-1 w-16 cursor-pointer appearance-none rounded-full bg-white/10 accent-[#D4AF37] [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#D4AF37]"
                  aria-label="Volume"
                />
              )}
            </div>
            <div className="rounded-full border border-white/10 bg-black/45 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-white/65">
              {t('signatur.badge')}
            </div>
          </div>
        </header>

        {/* Title */}
        <div className="max-w-3xl space-y-4">
          <h1 className="font-serif text-3xl leading-tight text-[#D4AF37] md:text-5xl">
            {t('signatur.title')}
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-white/75 md:text-base">
            {t('signatur.subtitle')}
          </p>
        </div>

        {/* Mobile CTA — visible only on small screens */}
        <Link
          to="/signatur/quizzes"
          className="flex items-center justify-center gap-2 rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-3 text-sm text-[#D4AF37] transition hover:bg-[#D4AF37]/20 md:hidden"
        >
          <Sparkles className="h-4 w-4" />
          {t('fuRing.discoverClusters')}
        </Link>

        {/* Main content: Sidebar + Pipeline Bridge + Ring + Weather Panel */}
        <div className="flex flex-col gap-6 md:flex-row">
          {/* Cluster Sidebar — hidden on mobile */}
          <div className="hidden shrink-0 md:block">
            <ClusterSidebar
              completedModuleIds={completedModuleIds}
              onStartQuiz={setActiveQuiz}
              isPremium={isPremium}
              lang={lang}
              suggestedModule={suggestedModule}
              onPremiumClick={setPremiumCluster}
            />
          </div>

          {/* Pipeline bridge — between sidebar and ring, desktop only */}
          <div className="hidden w-12 shrink-0 flex-col justify-center gap-1 md:flex">
            {CLUSTER_REGISTRY.map(cluster => (
              <ClusterPipeline
                key={cluster.id}
                clusterId={cluster.id}
                clusterColor={cluster.color}
                isComplete={
                  isClusterComplete(cluster, completedModuleIds) ||
                  justCompletedCluster === cluster.id
                }
                significance={cluster.significance}
              />
            ))}
          </div>

          {/* Ring — intuitive side */}
          <motion.div
            className="flex min-w-0 flex-1 flex-col gap-3"
            animate={fluidityTier >= 1 ? { scale: [1, 1.005, 1] } : undefined}
            transition={fluidityTier >= 1 ? { duration: 6, repeat: Infinity, ease: 'easeInOut' } : undefined}
          >
            <SignaturRenderer
              userId={userId}
              quizWeights={liveQuizWeights}
              effectTrigger={ringEffect}
              solarModulation={spaceWeather.ringModulation}
              dissonanceModulation={dissonanceModulation}
              externalDissonance={dissonance}
              dayHarmonic={activeHarmonic}
              planetariumMode={planetariumMode}
              chladniParams={chladniParams}
              labels={{
                regionLabel: t('signatur.a11y.regionLabel'),
                loading: t('signatur.loading'),
                reducedMotionHint: t('signatur.reducedMotionHint'),
                resolution: t('signatur.resolutionLabel'),
                audioOn: t('signatur.audioOn'),
                audioOff: t('signatur.audioOff'),
                latestEvents: t('signatur.latestEvents'),
                renderError: t('signatur.renderError'),
                reload: t('signatur.reload'),
                eventAnnouncePrefix: t('signatur.eventAnnouncePrefix'),
              }}
            />
            {chladniParams && (
              <ChladniParamsBadge
                params={chladniParams}
                planetariumMode={planetariumMode}
              />
            )}
          </motion.div>

          {/* Space Weather Panel — scientific side (desktop: right column, mobile: below ring) */}
          <div className="w-full shrink-0 md:w-64 lg:w-72">
            <SpaceWeatherPanel
              kpIndex={spaceWeather.kpIndex}
              gScale={spaceWeather.gScale}
              xrayFlux={spaceWeather.xrayFlux ?? null}
              xrayClass={spaceWeather.xrayClass ?? null}
              protonFlux={spaceWeather.protonFlux ?? null}
              f107={spaceWeather.f107 ?? null}
              solarCyclePhase={spaceWeather.solarCyclePhase ?? null}
              ringModulation={spaceWeather.ringModulation}
              solarPressure={spaceWeather.solarPressure}
              events={spaceWeather.events ?? []}
              alerts={spaceWeather.alerts ?? []}
              resonance={resonanceProfile}
              lastUpdate={spaceWeather.lastUpdate ? String(spaceWeather.lastUpdate) : null}
            />
          </div>
        </div>

        {/* Live transit resonance panels */}
        <TransitResonancePanels birthSign={sunSign} />

        {/* Cousto frequency panel — only when Cymatics engine is active */}
        {chladniParams && wuxinBalance && (
          <CymaticsFrequencyPanel
            wuxingWeights={wuxinBalance}
            dominantElement={chladniParams.dominantElement}
            planetariumMode={planetariumMode}
          />
        )}
      </section>

      {/* Quiz overlay */}
      <QuizOverlay
        quizId={activeQuiz}
        onComplete={handleQuizComplete}
        onClose={() => setActiveQuiz(null)}
      />

      {/* Cluster completion celebration overlay */}
      <AnimatePresence>
        {completedClusterDef && (
          <motion.div
            key={justCompletedCluster}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="rounded-2xl border border-[#D4AF37]/30 bg-black/80 backdrop-blur-xl px-8 py-6 text-center">
              <p className="text-3xl mb-2">{completedClusterDef.icon}</p>
              <p className="text-[#D4AF37] font-serif text-lg font-semibold">
                {completedClusterDef.name} {t('cluster.clusterCompleted')}
              </p>
              <p className="text-white/50 text-sm mt-1">
                {t('cluster.energyUpdated')}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium: Dissonance values panel */}
      {isPremium && dissonance && (
        <section className="relative mx-auto w-full max-w-xs px-4 pb-8 md:px-10">
          <DissonanceValues dissonance={dissonance} />
        </section>
      )}

      {premiumCluster && (
        <PremiumUpgradeModal
          clusterName={premiumCluster}
          onClose={() => setPremiumCluster(null)}
        />
      )}
    </div>
  );
}

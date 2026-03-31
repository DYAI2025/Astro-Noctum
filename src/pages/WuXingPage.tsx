import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Info } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAppLayout } from '../contexts/AppLayoutContext';
import { WuXingPentagon } from '../components/WuXingPentagon';
import { WuXingCycleWheel } from '../components/WuXingCycleWheel';
import { WUXING_ELEMENTS } from '../lib/astro-data/wuxing';
import { Tooltip } from '../components/Tooltip';
import { usePlanetarium } from '../contexts/PlanetariumContext';
import { PremiumGate } from '../components/PremiumGate';
import { ELEMENT_COLORS, ELEMENT_COLOR_FALLBACK } from '../lib/element-colors';

// ── Element Balance Bar Chart ─────────────────────────────────────────────────

function ElementBalanceChart({ elements }: { elements: Record<string, number> }) {
  const entries = Object.entries(elements).filter(([, v]) => Number(v) > 0);
  const total = entries.reduce((sum, [, v]) => sum + Number(v), 0);

  return (
    <div className="space-y-3" data-testid="element-balance-chart">
      {entries.map(([el, count]) => (
        <div key={el} className="flex items-center gap-3">
          <span className="w-16 font-serif text-sm" style={{ color: ELEMENT_COLORS[el] ?? ELEMENT_COLOR_FALLBACK }}>
            {el}
          </span>
          <div className="flex-1 h-2 bg-obsidian rounded-full overflow-hidden">
            <div
              className="h-2 rounded-full transition-all duration-700"
              style={{
                width: `${total > 0 ? (Number(count) / total) * 100 : 0}%`,
                background: ELEMENT_COLORS[el] ?? ELEMENT_COLOR_FALLBACK,
              }}
            />
          </div>
          <span className="text-xs w-4 tabular-nums" style={{ color: ELEMENT_COLORS[el] ?? ELEMENT_COLOR_FALLBACK, opacity: 0.6 }}>
            {count}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function WuXingPage() {
  const { lang, t } = useLanguage();
  const { apiData } = useAppLayout();
  const { planetariumMode } = usePlanetarium();

  const wuxingCounts: Record<string, number> = useMemo(
    () => apiData.wuxing?.elements || (apiData.wuxing?.element_counts as Record<string, number> | undefined) || {},
    [apiData.wuxing],
  );

  const dominantEl = apiData.wuxing?.dominant_element || "";
  
  const hasWuxingData = useMemo(
    () => Object.values(wuxingCounts).some((v) => Number(v) > 0),
    [wuxingCounts],
  );

  const totalCount = useMemo(
    () => Object.values(wuxingCounts).reduce((sum, v) => sum + Number(v), 0),
    [wuxingCounts],
  );

  const maxCount = useMemo(
    () => Math.max(...Object.values(wuxingCounts).map(Number), 1),
    [wuxingCounts],
  );

  const wuxingBalance = useMemo(() => {
    if (totalCount === 0) return {};
    return Object.fromEntries(
      Object.entries(wuxingCounts).map(([k, v]) => [k, Number(v) / totalCount])
    );
  }, [wuxingCounts, totalCount]);

  const fadeIn = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }
  };

  return (
    <div className="min-h-screen morning-bg pt-20 pb-20 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Navigation */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-[#1E2A3A]/40 hover:text-[#8B6914] transition-colors mb-10 text-[10px] uppercase tracking-[0.3em]"
        >
          <ArrowLeft className="w-4 h-4" /> {t("dashboard.startOver")}
        </Link>

        {/* Header */}
        <motion.header className="mb-12 text-center" {...fadeIn}>
          <p className="text-[#8B6914]/55 text-[9px] uppercase tracking-[0.5em] mb-3">
            WuXing 五行
          </p>
          <h1 className="font-serif text-3xl md:text-4xl text-[#1E2A3A] mb-4">
            {t('wuxing.balanceTitle')}
          </h1>
          <p className="text-xs text-[#1E2A3A]/45 max-w-2xl mx-auto leading-relaxed font-serif italic">
            {t("dashboard.wuxing.sectionDesc")}
          </p>
        </motion.header>

        {/* Empty state when BAFE data unavailable */}
        {!hasWuxingData && (
          <div className="morning-card p-10 text-center mb-12">
            <p className="text-sm text-[#1E2A3A]/50">
              {t('wuxing.dataUnavailable')}
            </p>
            <Link
              to="/"
              className="inline-block mt-4 text-sm text-[#8B6914] hover:underline"
            >
              {t('wuxing.backToDashboard')}
            </Link>
          </div>
        )}

        {/* Primary SVG Visualizations */}
        {hasWuxingData && (<><div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Pentagon View */}
          <motion.div 
            className="morning-card p-8 flex flex-col items-center"
            {...fadeIn}
            transition={{ ...fadeIn.transition, delay: 0.1 }}
          >
            <h3 className="text-[10px] uppercase tracking-[0.3em] text-[#8B6914]/60 mb-8">
              {t('wuxing.elementSignature')}
            </h3>
            <WuXingPentagon 
              balance={wuxingBalance} 
              lang={lang} 
              size={320} 
              planetariumMode={planetariumMode} 
            />
          </motion.div>

          {/* Cycle Wheel View */}
          <motion.div 
            className="morning-card p-8 flex flex-col items-center"
            {...fadeIn}
            transition={{ ...fadeIn.transition, delay: 0.2 }}
          >
            <h3 className="text-[10px] uppercase tracking-[0.3em] text-[#8B6914]/60 mb-8">
              {t('wuxing.interactionCycles')}
            </h3>
            <WuXingCycleWheel 
              balance={wuxingBalance} 
              lang={lang} 
              size={320} 
              planetariumMode={planetariumMode} 
            />
          </motion.div>
        </div>

        {/* Distribution List */}
        <motion.section 
          className="morning-card p-6 md:p-10 mb-12"
          {...fadeIn}
          transition={{ ...fadeIn.transition, delay: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-8">
            <Info className="w-4 h-4 text-[#8B6914]/40" />
            <h3 className="text-[10px] uppercase tracking-[0.3em] text-[#8B6914]/60">
              {t('wuxing.detailedDistribution')}
            </h3>
          </div>

          <div className="space-y-6">
            {WUXING_ELEMENTS.map((el) => {
              const count = Number(wuxingCounts[el.key] ?? wuxingCounts[el.name.de] ?? 0);
              const pctLabel = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
              const pctBar = hasWuxingData ? (count / maxCount) * 100 : 0;
              const isDom = el.key === dominantEl || el.name.de === dominantEl;
              
              return (
                <Tooltip key={el.key} content={el.description[lang]} wide dark={planetariumMode}>
                  <div className="flex flex-col gap-2 cursor-help group">
                    <div className="flex items-end justify-between px-1">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl font-serif leading-none select-none" style={{ color: el.color }}>
                          {el.chinese}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-[#1E2A3A] uppercase tracking-wider">{el.name[lang]}</span>
                          <span className="text-[10px] text-[#1E2A3A]/35 italic">{el.pinyin}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {isDom && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#8B6914]/10 text-[#8B6914] font-medium uppercase tracking-tighter">
                            {t("dashboard.wuxing.dominant")}
                          </span>
                        )}
                        <span className="text-lg font-mono text-[#1E2A3A]/60" style={{ fontVariantNumeric: 'tabular-nums' }}>{pctLabel}%</span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-[#1E2A3A]/04 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: el.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(pctBar, pctBar > 0 ? 1 : 0)}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                    </div>
                  </div>
                </Tooltip>
              );
            })}
          </div>
        </motion.section></>)}

        {/* ═══ PREMIUM — Elementbalance Extended Analysis ═══════════════ */}
        {hasWuxingData && (
          <motion.section
            className="mb-12"
            {...fadeIn}
            transition={{ ...fadeIn.transition, delay: 0.5 }}
          >
            <PremiumGate
              teaser={
                t('wuxing.premiumTeaser')
              }
            >
              <div className="glass-card p-6 md:p-10">
                <div className="flex items-center gap-3 mb-8">
                  <Info className="w-4 h-4 text-gold/40" />
                  <h3 className="text-[10px] uppercase tracking-[0.3em] text-gold/60 font-serif">
                    {t('wuxing.deepAnalysis')}
                  </h3>
                </div>

                {/* Bar chart */}
                <div className="mb-10">
                  <p className="text-xs font-serif italic text-gold/50 mb-6 leading-relaxed">
                    {t('wuxing.distributionDesc')}
                  </p>
                  <ElementBalanceChart elements={wuxingCounts} />
                </div>

                {/* Dominant element insights */}
                {dominantEl && (
                  <div className="border-t border-gold/10 pt-8">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-gold/40 mb-3">
                      {t('wuxing.dominantElement')}
                    </p>
                    <p className="font-serif text-2xl text-gold mb-3">
                      {dominantEl}
                    </p>
                    <p className="text-xs text-gold/50 leading-relaxed max-w-xl">
                      {t('wuxing.dominantDesc').replace('{element}', dominantEl)}
                    </p>
                  </div>
                )}

                {/* Balance assessment */}
                <div className="border-t border-gold/10 pt-8 mt-8">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-gold/40 mb-4">
                    {t('wuxing.balance')}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(() => {
                      const entries = Object.entries(wuxingCounts).filter(([, v]) => Number(v) > 0);
                      const avg = totalCount / Math.max(entries.length, 1);
                      const strong = entries.filter(([, v]) => Number(v) > avg).map(([k]) => k);
                      const weak = entries.filter(([, v]) => Number(v) < avg).map(([k]) => k);
                      return (
                        <>
                          {strong.length > 0 && (
                            <div className="glass-card p-4">
                              <p className="text-[10px] uppercase tracking-widest text-gold/40 mb-2">
                                {t('wuxing.strongPresence')}
                              </p>
                              <p className="font-serif text-gold/80 text-sm">{strong.join(' · ')}</p>
                            </div>
                          )}
                          {weak.length > 0 && (
                            <div className="glass-card p-4">
                              <p className="text-[10px] uppercase tracking-widest text-gold/40 mb-2">
                                {t('wuxing.toStrengthen')}
                              </p>
                              <p className="font-serif text-gold/80 text-sm">{weak.join(' · ')}</p>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Western Houses */}
                {Object.keys(apiData.houses ?? {}).length > 0 && (
                  <div className="border-t border-gold/10 pt-8 mt-8" data-testid="western-houses-section">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-gold/40 mb-6">
                      {t('dashboard.houses.sectionTitle')}
                    </p>
                    <p className="text-xs font-serif italic text-gold/40 mb-6 leading-relaxed">
                      {t('dashboard.houses.sectionDesc')}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {Object.entries(apiData.houses ?? {}).map(([houseNum, sign]) => (
                        <div key={houseNum} className="glass-card p-3 text-center">
                          <p className="text-[10px] uppercase tracking-widest text-gold/40 mb-1">
                            {t('dashboard.houses.housePrefix')} {houseNum}
                          </p>
                          <p className="font-serif text-gold/80 text-sm">{sign as string}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </PremiumGate>
          </motion.section>
        )}

        {/* Footer info */}
        <motion.div
          className="text-center text-[10px] text-[#1E2A3A]/30 uppercase tracking-[0.2em]"
          {...fadeIn}
          transition={{ ...fadeIn.transition, delay: 0.4 }}
        >
          {t('wuxing.copyright')}
        </motion.div>
      </div>
    </div>
  );
}

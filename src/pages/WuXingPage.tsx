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
            {lang === 'de' ? 'Das Gleichgewicht der Elemente' : 'The Balance of Elements'}
          </h1>
          <p className="text-xs text-[#1E2A3A]/45 max-w-2xl mx-auto leading-relaxed font-serif italic">
            {t("dashboard.wuxing.sectionDesc")}
          </p>
        </motion.header>

        {/* Primary SVG Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Pentagon View */}
          <motion.div 
            className="morning-card p-8 flex flex-col items-center"
            {...fadeIn}
            transition={{ ...fadeIn.transition, delay: 0.1 }}
          >
            <h3 className="text-[10px] uppercase tracking-[0.3em] text-[#8B6914]/60 mb-8">
              {lang === 'de' ? 'Element-Signatur' : 'Elemental Signature'}
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
              {lang === 'de' ? 'Interaktions-Zyklen' : 'Interaction Cycles'}
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
              {lang === 'de' ? 'Detaillierte Verteilung' : 'Detailed Distribution'}
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
        </motion.section>

        {/* Footer info */}
        <motion.div 
          className="text-center text-[10px] text-[#1E2A3A]/30 uppercase tracking-[0.2em]"
          {...fadeIn}
          transition={{ ...fadeIn.transition, delay: 0.4 }}
        >
          {lang === 'de' ? '© Astro-Noctum WuXing Analyse' : '© Astro-Noctum WuXing Analysis'}
        </motion.div>
      </div>
    </div>
  );
}

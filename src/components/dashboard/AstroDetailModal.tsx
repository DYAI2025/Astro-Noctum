// src/components/dashboard/AstroDetailModal.tsx
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getZodiacSign } from '../../lib/astro-data/zodiacSigns';
import { getStemByCharacter } from '../../lib/astro-data/heavenlyStems';
import { getWuxingByKey } from '../../lib/astro-data/wuxing';
import { getBranchByAnimal } from '../../lib/astro-data/earthlyBranches';
import { useLanguage } from '../../contexts/LanguageContext';
import { ZodiacIcon, WuXingIcon, BaZiAnimalIcon } from '../animated-icons/CosmicSymbols';
import { IconSun, IconOrbit } from '../animated-icons';
import { PLANETS } from '../cymantics/planetaryFrequencies';
import type { ApiData } from '../../types/bafe';
import type { TileTexts } from '../../types/interpretation';

export type AstroDetailId = 'western' | 'bazi' | 'wuxing';

interface AstroDetailModalProps {
  activeId: AstroDetailId | null;
  onClose: () => void;
  apiData: ApiData;
  tileTexts: TileTexts;
}

function SubRow({ label, value, description }: { label: string; value: string; description?: string }) {
  return (
    <div className="py-3 border-t border-[#D4AF37]/8">
      <div className="flex items-center justify-between gap-4 mb-1">
        <span className="text-[9px] uppercase tracking-[0.3em] text-[#D4AF37]/40 shrink-0">{label}</span>
        <span className="font-serif text-sm text-white/80 text-right">{value}</span>
      </div>
      {description && (
        <p className="text-xs text-white/50 leading-relaxed mt-1">{description}</p>
      )}
    </div>
  );
}

export function AstroDetailModal({ activeId, onClose, apiData, tileTexts }: AstroDetailModalProps) {
  const { lang, t } = useLanguage();

  const sunSignKey = apiData.western?.zodiac_sign || '';
  const moonSignKey = apiData.western?.moon_sign || '';
  const ascSignKey = apiData.western?.ascendant_sign || '';
  const sunData = getZodiacSign(sunSignKey);
  const moonData = getZodiacSign(moonSignKey);
  const ascData = getZodiacSign(ascSignKey);

  // BaZi pillar stem lookups
  const pillars = apiData.bazi?.pillars;
  const dayStem = getStemByCharacter(pillars?.day?.stem || '');
  const monthStem = getStemByCharacter(pillars?.month?.stem || '');
  const hourStem = getStemByCharacter(pillars?.hour?.stem || '');

  // BaZi year animal lookup
  const yearAnimal = getBranchByAnimal(apiData.bazi?.zodiac_sign || '');

  // WuXing element lookups
  const dominantEl = getWuxingByKey(apiData.wuxing?.dominant_element || '');
  const wuxingElements = apiData.wuxing?.elements || {};
  const sortedElements = Object.entries(wuxingElements).sort(([, a], [, b]) => b - a);

  type TileConfig = {
    title: string;
    icon: ReactNode;
    headline: string;
    description: string;
    subRows: Array<{ label: string; value: string; description?: string }>;
  };

  const configs: Record<AstroDetailId, TileConfig> = {
    western: {
      title: t('astroAccordion.sunSign'),
      icon: <IconSun className="w-10 h-10 text-gold" />,
      headline: sunData ? sunData.name[lang] : sunSignKey || '—',
      description: sunData?.sun[lang] || tileTexts.sun || '',
      subRows: [
        {
          label: t('astroAccordion.moonSign'),
          value: moonData ? moonData.name[lang] : moonSignKey || '—',
          description: moonData?.moon[lang] || tileTexts.moon || '',
        },
        {
          label: t('astroAccordion.ascendant'),
          value: ascData ? ascData.name[lang] : ascSignKey || '—',
          description: ascData?.asc[lang] || '',
        },
        {
          label: lang === 'de' ? 'Sonnenfrequenz' : 'Solar Frequency',
          value: `${PLANETS.find(p => p.name === 'Sun')?.baseFrequency.toFixed(2)} Hz`,
          description: lang === 'de' ? 'Der Klang des solaren Jahrestons.' : 'The frequency of the solar year.',
        },
      ],
    },
    bazi: {
      title: t('astroAccordion.yearAnimal'),
      icon: <IconOrbit className="w-10 h-10 text-gold" />,
      headline: yearAnimal
        ? yearAnimal.animal[lang]
        : apiData.bazi?.zodiac_sign || '—',
      description: yearAnimal?.description[lang] || tileTexts.yearAnimal || '',
      subRows: [
        {
          label: t('astroAccordion.dayMaster'),
          value: dayStem ? dayStem.name[lang] : (apiData.bazi?.day_master || '—'),
          description: dayStem?.dayMaster[lang] || tileTexts.dayMaster || '',
        },
        {
          label: t('astroAccordion.monthStem'),
          value: monthStem ? monthStem.name[lang] : (pillars?.month?.stem || '—'),
          description: monthStem?.monthStem[lang] || '',
        },
        {
          label: lang === 'de' ? 'Resonanzfrequenz (Jupiter)' : 'Resonance Frequency (Jupiter)',
          value: `${PLANETS.find(p => p.name === 'Jupiter')?.baseFrequency.toFixed(2)} Hz`,
          description: lang === 'de' ? 'Der Ton des Planeten Jupiter, Hüter der Zeit.' : 'The tone of Jupiter, keeper of time.',
        },
      ],
    },
    wuxing: {
      title: 'Wu Xing',
      icon: <WuXingIcon element={apiData.wuxing?.dominant_element || ''} className="w-10 h-10" />,
      headline: dominantEl ? dominantEl.name[lang] : (apiData.wuxing?.dominant_element || '—'),
      description: dominantEl?.description[lang] || tileTexts.dominantWuXing || '',
      subRows: sortedElements.length > 0
        ? Array.from(
            new Map(
              sortedElements.map(([elKey, pct]) => {
                const el = getWuxingByKey(elKey);
                const canonicalKey = el?.key ?? elKey;
                return [
                  canonicalKey,
                  {
                    label: el ? el.name[lang] : elKey,
                    value: `${Math.round(pct)}%`,
                    description: el?.description[lang] || '',
                  },
                ];
              }),
            ).values(),
          )
        : [
            { label: t('astroAccordion.dominantElement'), value: apiData.wuxing?.dominant_element || '—' },
          ],
    },
  };

  const config = activeId ? configs[activeId] : null;

  return (
    <AnimatePresence>
      {activeId && config && (
        <>
          {/* Backdrop */}
          <motion.div
            key="astro-detail-backdrop"
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Modal card */}
          <motion.div
            key="astro-detail-modal"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className="relative w-full max-w-sm bg-[#00050A]/95 border border-[#D4AF37]/20 rounded-2xl p-6 max-h-[80vh] overflow-y-auto pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/30 hover:text-white/70 transition-colors"
                aria-label="Schließen"
              >
                <X size={18} />
              </button>

              {/* Header */}
              <div className="mb-5 pr-8">
                <p className="text-[9px] uppercase tracking-[0.45em] text-[#D4AF37]/40 mb-1">
                  {config.title}
                </p>
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-12 h-12 flex items-center justify-center shrink-0">
                    {config.icon}
                  </div>
                  <h2 className="font-serif text-2xl text-white/90 leading-tight">{config.headline}</h2>
                </div>
                {config.description && (
                  <p className="text-sm text-white/55 leading-relaxed mt-2">{config.description}</p>
                )}
              </div>

              {/* Sub-rows */}
              <div>
                {config.subRows.map((row) => (
                  <SubRow
                    key={row.label}
                    label={row.label}
                    value={row.value}
                    description={row.description}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

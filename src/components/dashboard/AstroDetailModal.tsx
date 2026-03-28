// src/components/dashboard/AstroDetailModal.tsx
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getZodiacSign } from '../../lib/astro-data/zodiacSigns';
import { useLanguage } from '../../contexts/LanguageContext';
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

  type TileConfig = {
    title: string;
    icon: string;
    headline: string;
    description: string;
    subRows: Array<{ label: string; value: string; description?: string }>;
  };

  const configs: Record<AstroDetailId, TileConfig> = {
    western: {
      title: t('astroAccordion.sunSign'),
      icon: '☀️',
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
      ],
    },
    bazi: {
      title: 'BaZi',
      icon: '🏯',
      headline: apiData.bazi?.zodiac_sign || '—',
      description: tileTexts.dayMaster || '',
      subRows: [
        {
          label: t('astroAccordion.dayMaster'),
          value: apiData.bazi?.day_master || '—',
          description: tileTexts.dayMaster || '',
        },
        { label: t('astroAccordion.monthStem'), value: apiData.bazi?.pillars?.month?.stem || '—' },
        { label: t('astroAccordion.yearStem'),  value: apiData.bazi?.pillars?.year?.stem  || '—' },
        { label: t('astroAccordion.hourStem'),  value: apiData.bazi?.pillars?.hour?.stem  || '—' },
      ],
    },
    wuxing: {
      title: 'Wu Xing',
      icon: '🔥',
      headline: apiData.wuxing?.dominant_element || '—',
      description: tileTexts.dominantWuXing || '',
      subRows: [
        { label: t('astroAccordion.dominantElement'),  value: apiData.wuxing?.dominant_element || '—' },
        { label: t('astroAccordion.secondaryElement'), value: String((apiData.wuxing as Record<string, unknown>)?.['secondary_element'] ?? '—') },
        { label: t('astroAccordion.deficientElement'), value: String((apiData.wuxing as Record<string, unknown>)?.['deficient_element'] ?? '—') },
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
                <h2 className="font-serif text-2xl text-white/90">{config.headline}</h2>
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

import { useState } from 'react';
import { AstroAccordionTile } from './AstroAccordionTile';
import { useLanguage } from '@/src/contexts/LanguageContext';
import { getZodiacSign } from '@/src/lib/astro-data/zodiacSigns';
import type { ApiData } from '@/src/types/bafe';
import type { TileTexts } from '@/src/types/interpretation';

interface AstroAccordionProps {
  apiData: ApiData;
  tileTexts: TileTexts;
}

export function AstroAccordion({ apiData, tileTexts }: AstroAccordionProps) {
  const { lang, t } = useLanguage();
  const [openTile, setOpenTile] = useState<string | null>(null);

  const toggle = (id: string) => setOpenTile(prev => prev === id ? null : id);

  // Look up full zodiac descriptions for the user's signs
  const sunSignKey = apiData.western?.zodiac_sign || '';
  const moonSignKey = apiData.western?.moon_sign || '';
  const ascSignKey = apiData.western?.ascendant_sign || '';
  const sunData = getZodiacSign(sunSignKey);
  const moonData = getZodiacSign(moonSignKey);
  const ascData = getZodiacSign(ascSignKey);

  const tiles = [
    {
      id: 'western',
      icon: '☀️',
      title: t('astroAccordion.sunSign'),
      value: sunData ? sunData.name[lang] : sunSignKey || '—',
      description: sunData?.sun[lang] || tileTexts.sun || '',
      subTiles: [
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
    {
      id: 'bazi',
      icon: '🏯',
      title: 'BaZi',
      value: apiData.bazi?.zodiac_sign || '—',
      description: tileTexts.dayMaster || '',
      subTiles: [
        {
          label: t('astroAccordion.dayMaster'),
          value: apiData.bazi?.day_master || '—',
          description: tileTexts.dayMaster || '',
        },
        {
          label: t('astroAccordion.monthStem'),
          value: apiData.bazi?.pillars?.month?.stem || '—',
        },
        {
          label: t('astroAccordion.yearStem'),
          value: apiData.bazi?.pillars?.year?.stem || '—',
        },
        {
          label: t('astroAccordion.hourStem'),
          value: apiData.bazi?.pillars?.hour?.stem || '—',
        },
      ],
    },
    {
      id: 'wuxing',
      icon: '🔥',
      title: 'Wu Xing',
      value: apiData.wuxing?.dominant_element || '—',
      description: tileTexts.dominantWuXing || '',
      subTiles: [
        {
          label: t('astroAccordion.dominantElement'),
          value: apiData.wuxing?.dominant_element || '—',
        },
        {
          label: t('astroAccordion.secondaryElement'),
          value: String(apiData.wuxing?.['secondary_element' as keyof typeof apiData.wuxing] ?? '—'),
        },
        {
          label: t('astroAccordion.deficientElement'),
          value: String(apiData.wuxing?.['deficient_element' as keyof typeof apiData.wuxing] ?? '—'),
        },
      ],
    },
  ];

  return (
    <div className="space-y-3">
      {tiles.map((tile) => (
        <AstroAccordionTile
          key={tile.id}
          icon={tile.icon}
          title={tile.title}
          value={tile.value}
          description={tile.description}
          subTiles={tile.subTiles}
          isOpen={openTile === tile.id}
          onToggle={() => toggle(tile.id)}
        />
      ))}
    </div>
  );
}

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
  const { lang } = useLanguage();
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
      title: lang === 'de' ? 'Sonnenzeichen' : 'Sun Sign',
      value: sunData ? sunData.name[lang] : sunSignKey || '—',
      description: sunData?.sun[lang] || tileTexts.sun || '',
      subTiles: [
        {
          label: lang === 'de' ? 'Mondzeichen' : 'Moon Sign',
          value: moonData ? moonData.name[lang] : moonSignKey || '—',
          description: moonData?.moon[lang] || tileTexts.moon || '',
        },
        {
          label: lang === 'de' ? 'Aszendent' : 'Ascendant',
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
          label: lang === 'de' ? 'Tagesmeister' : 'Day Master',
          value: apiData.bazi?.day_master || '—',
          description: tileTexts.dayMaster || '',
        },
        {
          label: lang === 'de' ? 'Monatsstamm' : 'Month Stem',
          value: apiData.bazi?.pillars?.month?.stem || '—',
        },
        {
          label: lang === 'de' ? 'Jahresstamm' : 'Year Stem',
          value: apiData.bazi?.pillars?.year?.stem || '—',
        },
        {
          label: lang === 'de' ? 'Stundenstamm' : 'Hour Stem',
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
          label: lang === 'de' ? 'Dominantes Element' : 'Dominant Element',
          value: apiData.wuxing?.dominant_element || '—',
        },
        {
          label: lang === 'de' ? 'Sekundäres Element' : 'Secondary Element',
          value: String(apiData.wuxing?.['secondary_element' as keyof typeof apiData.wuxing] ?? '—'),
        },
        {
          label: lang === 'de' ? 'Mangel-Element' : 'Deficient Element',
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

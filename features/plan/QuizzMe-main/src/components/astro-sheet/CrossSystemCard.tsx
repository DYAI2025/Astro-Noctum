"use client";

import React from 'react';
import {
  Sparkles,
  ArrowLeftRight,
  Trees,
  Flame,
  Mountain,
  Shield,
  Waves,
  Sun,
  Moon,
  Star,
  Orbit,
  LucideIcon,
} from 'lucide-react';
import { FusionData, WuXing } from './model';

interface CrossSystemCardProps {
  fusion: FusionData | null;
  dayMasterElement?: WuXing;
  sunSign?: string;
  moonSign?: string;
  ascSign?: string;
}

const ELEMENT_ICONS: Record<WuXing, { icon: LucideIcon; color: string; colorLight: string }> = {
  Wood: { icon: Trees, color: '#22C55E', colorLight: '#DCFCE7' },
  Fire: { icon: Flame, color: '#EF4444', colorLight: '#FEE2E2' },
  Earth: { icon: Mountain, color: '#A16207', colorLight: '#FEF3C7' },
  Metal: { icon: Shield, color: '#6B7280', colorLight: '#F3F4F6' },
  Water: { icon: Waves, color: '#3B82F6', colorLight: '#DBEAFE' },
};

const ELEMENT_DE: Record<WuXing, string> = {
  Wood: 'Holz',
  Fire: 'Feuer',
  Earth: 'Erde',
  Metal: 'Metall',
  Water: 'Wasser',
};

// Map Western zodiac signs to their elements
const SIGN_ELEMENT_MAP: Record<string, WuXing> = {
  aries: 'Fire',
  leo: 'Fire',
  sagittarius: 'Fire',
  taurus: 'Earth',
  virgo: 'Earth',
  capricorn: 'Earth',
  gemini: 'Metal', // Air → Metal
  libra: 'Metal',
  aquarius: 'Metal',
  cancer: 'Water',
  scorpio: 'Water',
  pisces: 'Water',
};

const SIGN_DE: Record<string, string> = {
  aries: 'Widder',
  taurus: 'Stier',
  gemini: 'Zwillinge',
  cancer: 'Krebs',
  leo: 'Löwe',
  virgo: 'Jungfrau',
  libra: 'Waage',
  scorpio: 'Skorpion',
  sagittarius: 'Schütze',
  capricorn: 'Steinbock',
  aquarius: 'Wassermann',
  pisces: 'Fische',
};

const AlignmentBadge: React.FC<{
  westernLabel: string;
  westernSign: string;
  easternLabel: string;
  easternElement: WuXing;
  quality: 'harmony' | 'tension' | 'neutral';
  description?: string;
  icon: LucideIcon;
}> = ({ westernLabel, westernSign, easternLabel, easternElement, quality, description, icon: WesternIcon }) => {
  const elementConfig = ELEMENT_ICONS[easternElement];
  const ElementIcon = elementConfig.icon;

  const qualityStyles = {
    harmony: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      badge: 'bg-green-100 text-green-700',
      label: 'Harmonie',
    },
    tension: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      badge: 'bg-amber-100 text-amber-700',
      label: 'Spannung',
    },
    neutral: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      badge: 'bg-gray-100 text-gray-600',
      label: 'Neutral',
    },
  };

  const style = qualityStyles[quality];

  return (
    <div
      className={`p-5 rounded-2xl border ${style.bg} ${style.border} transition-all hover:shadow-md group`}
      data-testid={`alignment-${westernLabel.toLowerCase()}`}
    >
      <div className="flex items-center justify-between mb-4">
        <span className={`px-2 py-1 rounded-full text-[8px] mono font-bold uppercase tracking-wider ${style.badge}`}>
          {style.label}
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Western */}
        <div className="flex flex-col items-center p-3 bg-white rounded-xl border border-[#E6E0D8] shadow-sm">
          <WesternIcon size={18} className="text-[#C9A46A] mb-1" />
          <span className="mono text-[8px] text-[#A1A1AA] uppercase tracking-wider">{westernLabel}</span>
          <span className="text-[11px] font-bold text-[#0E1B33] uppercase">{westernSign}</span>
        </div>

        {/* Arrow */}
        <div className="flex-shrink-0">
          <ArrowLeftRight
            size={20}
            className={`${quality === 'harmony' ? 'text-green-500' : quality === 'tension' ? 'text-amber-500' : 'text-gray-400'}`}
          />
        </div>

        {/* Eastern */}
        <div className="flex flex-col items-center p-3 bg-white rounded-xl border border-[#E6E0D8] shadow-sm">
          <ElementIcon size={18} style={{ color: elementConfig.color }} className="mb-1" />
          <span className="mono text-[8px] text-[#A1A1AA] uppercase tracking-wider">{easternLabel}</span>
          <span className="text-[11px] font-bold text-[#0E1B33]">{ELEMENT_DE[easternElement]}</span>
        </div>
      </div>

      {description && (
        <p className="mt-4 text-[11px] text-[#5A6477] leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
};

const CrossSystemCard: React.FC<CrossSystemCardProps> = ({
  fusion,
  dayMasterElement,
  sunSign,
  moonSign,
  ascSign,
}) => {
  if (!fusion && !dayMasterElement) {
    return (
      <div className="bg-white rounded-[2rem] border border-[#E6E0D8] p-12 text-center" data-testid="cross-system-empty">
        <Orbit className="mx-auto mb-4 text-[#E6E0D8]" size={32} />
        <p className="mono text-[11px] text-[#A1A1AA] uppercase tracking-[0.3em]">
          Cross-System-Analyse nicht verfügbar
        </p>
      </div>
    );
  }

  // Extract resonances from fusion data
  const resonances = fusion?.resonances || [];

  // Build alignment data from resonances or fallback to props
  const alignments: Array<{
    westernLabel: string;
    westernSign: string;
    easternLabel: string;
    easternElement: WuXing;
    quality: 'harmony' | 'tension' | 'neutral';
    description?: string;
    icon: LucideIcon;
  }> = [];

  // Sun - Day Master alignment
  const sunResonance = resonances.find(r => r.type === 'Sun-DayMaster');
  if (sunResonance || (sunSign && dayMasterElement)) {
    const sign = sunSign || sunResonance?.western?.split(' ')[0]?.toLowerCase() || 'unknown';
    const element = dayMasterElement || (sunResonance?.eastern as WuXing) || 'Fire';
    alignments.push({
      westernLabel: 'Sonne',
      westernSign: SIGN_DE[sign] || sign,
      easternLabel: 'Tag-Meister',
      easternElement: element,
      quality: sunResonance?.quality || 'neutral',
      description: sunResonance?.description || `Deine Sonnen-Energie in ${SIGN_DE[sign] || sign} trifft auf dein ${ELEMENT_DE[element]}-Wesen.`,
      icon: Sun,
    });
  }

  // Moon - Hour Pillar alignment
  const moonResonance = resonances.find(r => r.type === 'Moon-HourPillar');
  if (moonResonance || moonSign) {
    const sign = moonSign || moonResonance?.western?.split(' ')[0]?.toLowerCase() || 'unknown';
    const element = (moonResonance?.eastern as WuXing) || SIGN_ELEMENT_MAP[sign] || 'Water';
    alignments.push({
      westernLabel: 'Mond',
      westernSign: SIGN_DE[sign] || sign,
      easternLabel: 'Stunden-Säule',
      easternElement: element,
      quality: moonResonance?.quality || 'neutral',
      description: moonResonance?.description || `Dein emotionales Mond-Ich resoniert mit der Stunden-Energie.`,
      icon: Moon,
    });
  }

  // Ascendant alignment (if available)
  if (ascSign) {
    const element = SIGN_ELEMENT_MAP[ascSign.toLowerCase()] || 'Earth';
    alignments.push({
      westernLabel: 'Aszendent',
      westernSign: SIGN_DE[ascSign.toLowerCase()] || ascSign,
      easternLabel: 'Äußeres Ich',
      easternElement: element,
      quality: 'neutral',
      description: `Dein aufsteigendes Zeichen prägt den ersten Eindruck deiner ${ELEMENT_DE[element]}-Ausstrahlung.`,
      icon: Star,
    });
  }

  // Add remaining resonances
  resonances.forEach(res => {
    if (res.type !== 'Sun-DayMaster' && res.type !== 'Moon-HourPillar') {
      const [planet] = res.type.split('-');
      alignments.push({
        westernLabel: planet,
        westernSign: res.western.split(' ')[0] || 'Unknown',
        easternLabel: res.type.split('-')[1] || 'Säule',
        easternElement: res.eastern as WuXing || 'Earth',
        quality: res.quality,
        description: res.description,
        icon: Orbit,
      });
    }
  });

  // Limit to 4 alignments for display
  const displayAlignments = alignments.slice(0, 4);

  return (
    <div
      className="bg-white rounded-[2rem] border border-[#E6E0D8] overflow-hidden shadow-xl"
      data-testid="cross-system-card"
    >
      {/* Header */}
      <div className="p-8 border-b border-[#E6E0D8] bg-gradient-to-r from-[#F6F3EE] to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-[#8F7AD1] to-[#C9A46A] rounded-2xl shadow-lg">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h3 className="serif text-2xl text-[#0E1B33] font-medium tracking-tight">
                Cross-System Alignment
              </h3>
              <p className="mono text-[9px] text-[#5A6477] uppercase tracking-widest mt-1">
                West-Ost Resonanz-Matrix
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#F6F3EE] rounded-full border border-[#E6E0D8]">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="mono text-[8px] text-[#5A6477] uppercase">Harmonie</span>
            </div>
            <div className="w-px h-4 bg-[#E6E0D8]" />
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="mono text-[8px] text-[#5A6477] uppercase">Spannung</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alignments Grid */}
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayAlignments.map((alignment, i) => (
            <AlignmentBadge key={i} {...alignment} />
          ))}
        </div>

        {displayAlignments.length === 0 && (
          <div className="text-center py-12">
            <Orbit className="mx-auto mb-4 text-[#E6E0D8]" size={48} />
            <p className="mono text-[11px] text-[#A1A1AA] uppercase tracking-[0.3em]">
              Keine Resonanzen berechnet
            </p>
            <p className="text-[12px] text-[#5A6477] mt-2">
              Vollständige Geburtsdaten erforderlich für Cross-System-Analyse.
            </p>
          </div>
        )}

        {/* Summary */}
        {displayAlignments.length > 0 && (
          <div className="mt-6 pt-6 border-t border-[#E6E0D8] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="mono text-[9px] text-[#5A6477] uppercase tracking-widest">
                {displayAlignments.filter(a => a.quality === 'harmony').length} Harmonien
              </span>
              <span className="text-[#E6E0D8]">•</span>
              <span className="mono text-[9px] text-[#5A6477] uppercase tracking-widest">
                {displayAlignments.filter(a => a.quality === 'tension').length} Spannungen
              </span>
            </div>
            <div className="mono text-[8px] text-[#A1A1AA] uppercase tracking-widest">
              Fusion Engine v2.0
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CrossSystemCard;

/**
 * DashboardBigFour — Identity Card Set (5 cards)
 *
 * Shows the user's 5 core cosmic identifiers:
 * Sun Sign, Moon Sign, Ascendant, Year Animal (BaZi), Wu-Xing Element
 *
 * Implements: REQ-F-dashboard-identity-cards
 */

import type { ReactNode } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { getWuxingByKey } from '../../lib/astro-data/wuxing';
import { ZodiacIcon, WuXingIcon, BaZiAnimalIcon } from '../animated-icons/CosmicSymbols';
import { IconMoon, IconOrbit } from '../animated-icons';

export interface DashboardBigFourProps {
  sunSign: string;
  moonSign: string;
  ascendant: string;
  baziAnimal: string;
  wuxingElement: string;
}

interface IdentityItem {
  icon: ReactNode;
  labelKey: string;
  value: string;
  /** Tailwind classes for icon wrapper (bg + text color) */
  colorClasses: string;
}

function wuxingColorClasses(element: string): string {
  const el = getWuxingByKey(element);
  if (!el) return 'bg-white/8 text-white/50';
  const map: Record<string, string> = {
    Wood:  'bg-[#3D8B37]/15 text-[#3D8B37]',
    Fire:  'bg-[#C53030]/15 text-[#C53030]',
    Earth: 'bg-[#D69E2E]/15 text-[#D69E2E]',
    Metal: 'bg-[#718096]/15 text-[#718096]',
    Water: 'bg-[#2B6CB0]/15 text-[#2B6CB0]',
  };
  return map[el.key] ?? 'bg-white/8 text-white/50';
}

export function DashboardBigFour({
  sunSign,
  moonSign,
  ascendant,
  baziAnimal,
  wuxingElement,
}: DashboardBigFourProps) {
  const { t } = useLanguage();

  const items: IdentityItem[] = [
    {
      icon: <ZodiacIcon sign={sunSign} className="w-5 h-5" />,
      labelKey: 'dashboard.bigFour.sunSign',
      value: sunSign,
      colorClasses: 'bg-[#D4AF37]/15 text-[#D4AF37]',
    },
    {
      icon: <IconMoon className="w-5 h-5" />,
      labelKey: 'dashboard.bigFour.moonSign',
      value: moonSign,
      colorClasses: 'bg-[#718096]/15 text-[#718096]',
    },
    {
      icon: <IconOrbit className="w-5 h-5" />,
      labelKey: 'dashboard.bigFour.ascendant',
      value: ascendant,
      colorClasses: 'bg-[#3D8B37]/15 text-[#3D8B37]',
    },
    {
      icon: <BaZiAnimalIcon animal={baziAnimal} className="w-5 h-5" />,
      labelKey: 'dashboard.bigFour.baziAnimal',
      value: baziAnimal,
      colorClasses: 'bg-[#D69E2E]/15 text-[#D69E2E]',
    },
    {
      icon: <WuXingIcon element={wuxingElement} className="w-5 h-5" showColor={false} />,
      labelKey: 'dashboard.bigFour.wuxingElement',
      value: wuxingElement,
      colorClasses: wuxingColorClasses(wuxingElement),
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      {items.map(({ icon, labelKey, value, colorClasses }) => (
        <div
          key={labelKey}
          className="cosmic-tile px-4 py-3 flex items-center gap-3"
        >
          <div
            className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses}`}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-[8px] font-sans uppercase tracking-[0.2em] opacity-65">
              {t(labelKey)}
            </p>
            <p className="text-sm font-serif truncate">
              {value || '—'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

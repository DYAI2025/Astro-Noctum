/**
 * DashboardBigFour — Identity Card Set (5 cards)
 *
 * Shows the user's 5 core cosmic identifiers:
 * Sun Sign, Moon Sign, Ascendant, Year Animal (BaZi), Wu-Xing Element
 *
 * Implements: REQ-F-dashboard-identity-cards
 */

import type { ReactNode } from 'react';
import { Sun, Moon, ArrowUp, Rabbit, Layers } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { getWuxingByKey } from '../../lib/astro-data/wuxing';

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
  // Map element key to design-system-v2 element colors via Tailwind arbitrary values
  // getWuxingByKey normalises German API aliases to English .key, so only
  // the English keys are ever looked up here. German variants are dead code.
  const map: Record<string, string> = {
    Wood:  'bg-[#3D8B37]/15 text-[#3D8B37]',
    Fire:  'bg-[#D63B0F]/15 text-[#D63B0F]',
    Earth: 'bg-[#FF9800]/15 text-[#FF9800]',
    Metal: 'bg-[#9E9E9E]/15 text-[#9E9E9E]',
    Water: 'bg-[#2196F3]/15 text-[#2196F3]',
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
      icon: <Sun className="w-4 h-4" />,
      labelKey: 'dashboard.bigFour.sunSign',
      value: sunSign,
      colorClasses: 'bg-[#D4AF37]/15 text-[#D4AF37]',
    },
    {
      icon: <Moon className="w-4 h-4" />,
      labelKey: 'dashboard.bigFour.moonSign',
      value: moonSign,
      colorClasses: 'bg-[#a0b4cc]/15 text-[#a0b4cc]',
    },
    {
      icon: <ArrowUp className="w-4 h-4" />,
      labelKey: 'dashboard.bigFour.ascendant',
      value: ascendant,
      colorClasses: 'bg-emerald-500/15 text-emerald-400',
    },
    {
      icon: <Rabbit className="w-4 h-4" />,
      labelKey: 'dashboard.bigFour.baziAnimal',
      value: baziAnimal,
      colorClasses: 'bg-amber-400/15 text-amber-400',
    },
    {
      icon: <Layers className="w-4 h-4" />,
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
          className="rounded-xl border border-white/8 bg-[#00050A]/60 px-4 py-3 flex items-center gap-3"
        >
          <div
            className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${colorClasses}`}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-[8px] uppercase tracking-[0.2em] text-white/35 font-sans">
              {t(labelKey)}
            </p>
            <p className="text-sm font-serif text-white/85 truncate">
              {value || '—'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

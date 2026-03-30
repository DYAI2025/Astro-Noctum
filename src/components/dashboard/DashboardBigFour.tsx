/**
 * DashboardBigFour — Identity Card
 *
 * Shows the user's 4 core cosmic identifiers:
 * ☀️ Sun Sign, 🌙 Moon Sign, ↑ Ascendant, 🐰 BaZi Animal
 *
 * Implements: docs/wireframes/dashboard-v2.md § F1
 */

import type { ReactNode } from 'react';
import { Sun, Moon, ArrowUp, Orbit } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export interface DashboardBigFourProps {
  sunSign: string;
  moonSign: string;
  ascendant: string;
  baziAnimal: string;
}

interface IdentityItem {
  icon: ReactNode;
  labelKey: string;
  value: string;
  color: string;
}

export function DashboardBigFour({ sunSign, moonSign, ascendant, baziAnimal }: DashboardBigFourProps) {
  const { t } = useLanguage();

  const items: IdentityItem[] = [
    { icon: <Sun className="w-4 h-4" />,      labelKey: 'dashboard.bigFour.sunSign',    value: sunSign,    color: '#D4AF37' },
    { icon: <Moon className="w-4 h-4" />,      labelKey: 'dashboard.bigFour.moonSign',   value: moonSign,   color: '#a0b4cc' },
    { icon: <ArrowUp className="w-4 h-4" />,   labelKey: 'dashboard.bigFour.ascendant',  value: ascendant,  color: '#4ade80' },
    { icon: <Orbit className="w-4 h-4" />,     labelKey: 'dashboard.bigFour.baziAnimal', value: baziAnimal, color: '#fbbf24' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map(({ icon, labelKey, value, color }) => (
        <div
          key={labelKey}
          className="rounded-xl border border-white/8 px-4 py-3 flex items-center gap-3"
          style={{ background: 'rgba(0,5,10,0.6)' }}
        >
          <div
            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `${color}15`, color }}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-[8px] font-mono uppercase tracking-[0.2em] text-white/35">
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

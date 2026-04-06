/**
 * DashboardBigFour — Identity Card Set (5 cards)
 *
 * Shows the user's 5 core cosmic identifiers:
 * Sun Sign, Moon Sign, Ascendant, Year Animal (BaZi), Wu-Xing Element
 *
 * Cards are arranged in a vertical left-aligned stack (DEC-identity-card-accordion).
 * Each card is clickable and expands downward with a contextual description (single-open).
 *
 * Implements: REQ-F-dashboard-identity-cards
 */

import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { WUXING_ELEMENTS, getWuxingByKey } from '../../lib/astro-data/wuxing';
import { ZODIAC_SIGNS_DATA } from '../../lib/astro-data/zodiacSigns';
import { EARTHLY_BRANCHES } from '../../lib/astro-data/earthlyBranches';
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
  id: string;
  icon: ReactNode;
  labelKey: string;
  value: string;
  /** Identity identifier for theme-aware CSS targeting */
  identityId: string;
  /** Contextual description resolved from astro-data for the user's specific sign */
  description: string;
}

type Lang = 'de' | 'en';

function getZodiacDesc(sign: string, context: 'sun' | 'moon' | 'asc', lang: Lang): string {
  if (!sign) return '';
  const entry = ZODIAC_SIGNS_DATA.find((s) => s.key === sign);
  return entry?.[context]?.[lang] ?? '';
}

function getAnimalDesc(animal: string, lang: Lang): string {
  if (!animal) return '';
  const entry = EARTHLY_BRANCHES.find(
    (b) => b.animal.en.toLowerCase() === animal.toLowerCase()
  );
  return entry?.description?.[lang] ?? '';
}

function getElementDesc(element: string, lang: Lang): string {
  if (!element) return '';
  const entry = WUXING_ELEMENTS.find(
    (e) => e.key.toLowerCase() === element.toLowerCase()
  );
  return entry?.description?.[lang] ?? '';
}

export function DashboardBigFour({
  sunSign,
  moonSign,
  ascendant,
  baziAnimal,
  wuxingElement,
}: DashboardBigFourProps) {
  const { t, lang } = useLanguage();
  const resolvedLang: Lang = lang === 'de' ? 'de' : 'en';
  const prefersReducedMotion = useReducedMotion();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const items: IdentityItem[] = [
    {
      id: 'sunSign',
      icon: <ZodiacIcon sign={sunSign} className="w-5 h-5" />,
      labelKey: 'dashboard.bigFour.sunSign',
      value: sunSign,
      identityId: 'sunSign',
      description: getZodiacDesc(sunSign, 'sun', resolvedLang),
    },
    {
      id: 'moonSign',
      icon: <IconMoon className="w-5 h-5" />,
      labelKey: 'dashboard.bigFour.moonSign',
      value: moonSign,
      identityId: 'moonSign',
      description: getZodiacDesc(moonSign, 'moon', resolvedLang),
    },
    {
      id: 'ascendant',
      icon: <IconOrbit className="w-5 h-5" />,
      labelKey: 'dashboard.bigFour.ascendant',
      value: ascendant,
      identityId: 'ascendant',
      description: getZodiacDesc(ascendant, 'asc', resolvedLang),
    },
    {
      id: 'baziAnimal',
      icon: <BaZiAnimalIcon animal={baziAnimal} className="w-5 h-5" />,
      labelKey: 'dashboard.bigFour.baziAnimal',
      value: baziAnimal,
      identityId: 'baziAnimal',
      description: getAnimalDesc(baziAnimal, resolvedLang),
    },
    {
      id: 'wuxingElement',
      icon: <WuXingIcon element={wuxingElement} className="w-5 h-5" showColor={false} />,
      labelKey: 'dashboard.bigFour.wuxingElement',
      value: wuxingElement,
      identityId: `wuxing-${wuxingElement}`,
      description: getElementDesc(wuxingElement, resolvedLang),
    },
  ];

  const handleToggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="flex flex-col gap-2">
      {items.map(({ id, icon, labelKey, value, identityId, description }) => {
        const isOpen = expandedId === id;
        const hasDescription = !!description;

        return (
          <div key={id} className="cosmic-tile overflow-hidden" data-identity-id={identityId}>
            {/* Card row — clickable if description exists */}
            <button
              className="w-full px-4 py-3 flex items-center gap-3 text-left"
              onClick={() => hasDescription && handleToggle(id)}
              aria-expanded={isOpen}
              aria-controls={`identity-desc-${id}`}
              disabled={!hasDescription}
            >
              <div
                className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center identity-icon-wrapper"
              >
                {icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[8px] font-sans uppercase tracking-[0.2em] opacity-65">
                  {t(labelKey)}
                </p>
                <p className="text-sm font-serif truncate">
                  {value || '—'}
                </p>
              </div>
              {hasDescription && (
                <motion.span
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }}
                  className="shrink-0 opacity-40"
                >
                  <ChevronDown size={14} />
                </motion.span>
              )}
            </button>

            {/* Accordion panel */}
            <AnimatePresence initial={false}>
              {isOpen && hasDescription && (
                <motion.div
                  id={`identity-desc-${id}`}
                  key={`desc-${id}`}
                  initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: 'easeOut' }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 pt-1 border-t" style={{ borderColor: 'var(--tile-border)' }}>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--tile-text-secondary)', opacity: 0.8 }}>
                      {description}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

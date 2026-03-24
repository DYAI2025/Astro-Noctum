import type { ComponentType, SVGProps } from 'react';
import {
  ZodiacAries, ZodiacTaurus, ZodiacGemini, ZodiacCancer,
  ZodiacLeo, ZodiacVirgo, ZodiacLibra, ZodiacScorpio,
  ZodiacSagittarius, ZodiacCapricorn, ZodiacAquarius, ZodiacPisces,
  IconLeaf, IconFlame, IconMountain, IconMetal, IconDroplet,
  IconStar,
} from './index';

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

// ── Zodiac Sign → Animated Icon ──────────────────────────────────────

const ZODIAC_ICON_MAP: Record<string, IconComponent> = {
  Aries: ZodiacAries,
  Taurus: ZodiacTaurus,
  Gemini: ZodiacGemini,
  Cancer: ZodiacCancer,
  Leo: ZodiacLeo,
  Virgo: ZodiacVirgo,
  Libra: ZodiacLibra,
  Scorpio: ZodiacScorpio,
  Sagittarius: ZodiacSagittarius,
  Capricorn: ZodiacCapricorn,
  Aquarius: ZodiacAquarius,
  Pisces: ZodiacPisces,
};

interface ZodiacIconProps {
  sign: string;
  className?: string;
}

export function ZodiacIcon({ sign, className = 'w-6 h-6' }: ZodiacIconProps) {
  const Icon = ZODIAC_ICON_MAP[sign];
  if (!Icon) return <IconStar className={className} />;
  return <Icon className={className} />;
}

// ── WuXing Element → Animated Icon ──────────────────────────────────

const ELEMENT_ICON_MAP: Record<string, { icon: IconComponent; color: string }> = {
  Wood:   { icon: IconLeaf,     color: '#3D8B37' },
  Fire:   { icon: IconFlame,    color: '#D63B0F' },
  Earth:  { icon: IconMountain, color: '#C49A2A' },
  Metal:  { icon: IconMetal,    color: '#8A8A8A' },
  Water:  { icon: IconDroplet,  color: '#2E6BB5' },
  // German aliases
  Holz:   { icon: IconLeaf,     color: '#3D8B37' },
  Feuer:  { icon: IconFlame,    color: '#D63B0F' },
  Erde:   { icon: IconMountain, color: '#C49A2A' },
  Metall: { icon: IconMetal,    color: '#8A8A8A' },
  Wasser: { icon: IconDroplet,  color: '#2E6BB5' },
};

// German name for each element key (English or German input → German label)
const ELEMENT_LABEL: Record<string, string> = {
  Wood: 'Holz', Fire: 'Feuer', Earth: 'Erde', Metal: 'Metall', Water: 'Wasser',
  Holz: 'Holz', Feuer: 'Feuer', Erde: 'Erde', Metall: 'Metall', Wasser: 'Wasser',
};

interface ElementIconProps {
  element: string;
  className?: string;
  showColor?: boolean;
}

export function WuXingIcon({ element, className = 'w-6 h-6', showColor = true }: ElementIconProps) {
  const entry = ELEMENT_ICON_MAP[element];
  if (!entry) return <IconStar className={className} />;
  const { icon: Icon, color } = entry;
  const label = ELEMENT_LABEL[element] ?? element;
  return (
    <Icon
      className={className}
      style={showColor ? { color } : undefined}
      aria-label={label}
      role="img"
    />
  );
}

// ── BaZi Animal → Chinese Character (SVG text) ──────────────────────
// No animated icon exists for all 12 animals, so we render the chinese
// character as a styled SVG for visual consistency with the icon set.

const ANIMAL_CHINESE: Record<string, string> = {
  Rat: '鼠', Ox: '牛', Tiger: '虎', Rabbit: '兔',
  Dragon: '龍', Snake: '蛇', Horse: '馬', Goat: '羊',
  Monkey: '猴', Rooster: '雞', Dog: '狗', Pig: '豬',
};

interface AnimalIconProps {
  animal: string;
  className?: string;
}

export function BaZiAnimalIcon({ animal, className = 'w-6 h-6' }: AnimalIconProps) {
  const char = ANIMAL_CHINESE[animal] || '?';
  return (
    <svg viewBox="0 0 24 24" className={className} aria-label={animal}>
      <text
        x="12" y="17"
        textAnchor="middle"
        fontSize="16"
        fontFamily="serif"
        fill="currentColor"
        fontWeight="400"
      >
        {char}
      </text>
    </svg>
  );
}

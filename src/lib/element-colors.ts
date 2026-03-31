/**
 * Centralized Wu-Xing element color map using Design System V2 CSS tokens.
 *
 * Usage:
 *   import { ELEMENT_COLORS } from '@/src/lib/element-colors';
 *   style={{ color: ELEMENT_COLORS.Wood }}
 *   style={{ color: ELEMENT_COLORS['Holz'] }}
 *
 * All values reference CSS custom properties from src/index.css @theme.
 */

export const ELEMENT_COLORS: Record<string, string> = {
  // English keys
  Wood:  'var(--color-element-wood)',
  Fire:  'var(--color-element-fire)',
  Earth: 'var(--color-element-earth)',
  Metal: 'var(--color-element-metal)',
  Water: 'var(--color-element-water)',
  // German keys
  Holz:   'var(--color-element-wood)',
  Feuer:  'var(--color-element-fire)',
  Erde:   'var(--color-element-earth)',
  Metall: 'var(--color-element-metal)',
  Wasser: 'var(--color-element-water)',
  // Lowercase keys (for flexible matching)
  wood:   'var(--color-element-wood)',
  fire:   'var(--color-element-fire)',
  earth:  'var(--color-element-earth)',
  metal:  'var(--color-element-metal)',
  water:  'var(--color-element-water)',
  holz:   'var(--color-element-wood)',
  feuer:  'var(--color-element-fire)',
  erde:   'var(--color-element-earth)',
  metall: 'var(--color-element-metal)',
  wasser: 'var(--color-element-water)',
};

/** Default fallback color when element is unknown */
export const ELEMENT_COLOR_FALLBACK = '#d4af37';

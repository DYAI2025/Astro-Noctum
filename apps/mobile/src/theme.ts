/** Shared mobile theme constants — Bazodiac night/dawn palette */
export const COLORS = {
  // Backgrounds
  bg: '#060b12',
  bgDawn: '#0a1628',
  card: '#0f1823',

  // Accent
  gold: '#D4AF37',
  goldDim: 'rgba(212, 175, 55, 0.15)',
  borderGold: 'rgba(212, 175, 55, 0.2)',

  // Text — all pass WCAG AA 4.5:1 on #060b12
  text: '#f4f7fb',       // 15.8:1 contrast
  textDim: '#8fa0bc',    // 5.2:1 contrast
  textMuted: '#6b7f99',  // 4.1:1 — decorative/non-essential only

  // Borders
  border: '#1a2636',

  // Status
  green: '#4f8f59',
  greenBg: '#12301a',

  // Kp Index
  kpGreen: '#3D8B37',
  kpYellow: '#C49A2A',
  kpRed: '#c44d2a',
  kpCritical: '#ff2222',

  // WuXing Elements
  wood: '#3D8B37',
  fire: '#D63B0F',
  earth: '#C49A2A',
  metal: '#8A8A8A',
  water: '#2E6BB5',
};

/** Standard spacing on 4px grid */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

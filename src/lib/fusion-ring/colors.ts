export type ElementColor = {
  base: string;      // Haupt-Farbe
  glow: string;      // Glow/Highlight
  hslH: number;      // HSL Hue für Interpolation
};

export const ELEMENT_COLORS: Record<string, ElementColor> = {
  wood:  { base: '#2E7D32', glow: '#66BB6A', hslH: 130 },
  fire:  { base: '#E65100', glow: '#FF9800', hslH: 25  },
  earth: { base: '#BF8C00', glow: '#FFD54F', hslH: 45  },
  metal: { base: '#78909C', glow: '#CFD8DC', hslH: 200 },
  water: { base: '#1565C0', glow: '#42A5F5', hslH: 210 },
};

/** Fixe Sektor-Farben (Base) — S4 bekommt Gold als Blend */
export const SECTOR_COLORS: string[] = [
  '#2E7D32', // S0  Holz (Widder)
  '#BF8C00', // S1  Erde (Stier)
  '#E65100', // S2  Feuer (Zwillinge)
  '#E65100', // S3  Feuer (Krebs)
  '#D4AF37', // S4  Feuer/Erde (Löwe) — Gold als Blend
  '#78909C', // S5  Metall (Jungfrau)
  '#78909C', // S6  Metall (Waage)
  '#1565C0', // S7  Wasser (Skorpion)
  '#1565C0', // S8  Wasser (Schütze)
  '#1565C0', // S9  Wasser (Steinbock)
  '#BF8C00', // S10 Erde (Wassermann)
  '#2E7D32', // S11 Holz (Fische)
];

/** Glow-Farben pro Sektor */
export const SECTOR_GLOW_COLORS: string[] = [
  '#66BB6A', '#FFD54F', '#FF9800', '#FF9800', '#FFD54F',
  '#CFD8DC', '#CFD8DC', '#42A5F5', '#42A5F5', '#42A5F5',
  '#FFD54F', '#66BB6A',
];

/**
 * Converts a hex color string to HSL values.
 * Accepts both '#RRGGBB' and 'RRGGBB' formats.
 * @returns [hue 0-360, saturation 0-100, lightness 0-100]
 */
function hexToHSL(hex: string): [number, number, number] {
  // Strip leading '#' if present
  const clean = hex.startsWith('#') ? hex.slice(1) : hex;

  // Parse hex pairs to 0-1 range
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  // Lightness
  const l = (max + min) / 2;

  // Achromatic (no saturation)
  if (delta === 0) {
    return [0, 0, l * 100];
  }

  // Saturation
  const s = l > 0.5
    ? delta / (2 - max - min)
    : delta / (max + min);

  // Hue
  let h: number;
  switch (max) {
    case r:
      h = ((g - b) / delta + (g < b ? 6 : 0)) * 60;
      break;
    case g:
      h = ((b - r) / delta + 2) * 60;
      break;
    default: // b
      h = ((r - g) / delta + 4) * 60;
      break;
  }

  return [h, s * 100, l * 100];
}

/** Pre-computed HSL values for SECTOR_COLORS (avoids 720 hex parses per frame). */
const SECTOR_COLORS_HSL: [number, number, number][] = SECTOR_COLORS.map(hexToHSL);

/**
 * HSL-Hue Interpolation zwischen zwei Sektoren.
 * t ∈ [0, 1] — Position innerhalb der 30°-Zone.
 */
export function lerpSectorColor(sectorLeft: number, sectorRight: number, t: number): string {
  const cLeft = SECTOR_COLORS[sectorLeft];
  const cRight = SECTOR_COLORS[sectorRight];

  if (cLeft === cRight) return cLeft;

  const [h1, s1, l1] = SECTOR_COLORS_HSL[sectorLeft];
  const [h2, s2, l2] = SECTOR_COLORS_HSL[sectorRight];

  let dh = h2 - h1;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;

  const h = (h1 + dh * t + 360) % 360;
  const s = s1 + (s2 - s1) * t;
  const l = l1 + (l2 - l1) * t;

  return `hsl(${h}, ${s}%, ${l}%)`;
}

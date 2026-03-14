/**
 * Signal formula:
 * 0.375 * Western + 0.375 * BaZi + 0.25 * Wu-Xing + 0.20 * QuizMarkers
 * Clamped to [-1, 1].
 */
export const calculateFusionSignal = (
  western: number,
  baZi: number,
  wuXing: number,
  quizMarkers: number,
): number => {
  const weighted =
    0.375 * western +
    0.375 * baZi +
    0.25 * wuXing +
    0.2 * quizMarkers;
  return Math.max(-1, Math.min(1, weighted));
};

/**
 * Gaussian spread with opposition pull at +6 sectors.
 */
export const applyGaussSpread = (
  signals: number[],
  sigma = 1.2,
  oppositionFactor = -0.15,
): number[] => {
  if (signals.length !== 12) return signals;

  return signals.map((value, i) => {
    const oppositionIndex = (i + 6) % 12;
    const oppositionInfluence = signals[oppositionIndex] * oppositionFactor;

    const left = signals[(i + 11) % 12] ?? value;
    const right = signals[(i + 1) % 12] ?? value;
    const neighborMean = (left + right) / 2;

    const gaussianBlend = Math.exp(-(1 * 1) / (2 * sigma * sigma));
    const spread = value + (neighborMean - value) * gaussianBlend * 0.2;

    return spread + oppositionInfluence;
  });
};

/**
 * Power curve for organic peaks.
 */
export const applyPowerCurve = (signal: number): number => {
  return Math.sign(signal) * Math.pow(Math.abs(signal), 1.5);
};

/**
 * Blend two hex colors with a glow-weighted alpha channel.
 */
export const interpolateSectorColor = (
  colorA: string,
  colorB: string,
  blend: number,
  glowIntensity: number,
): { r: number; g: number; b: number; a: number } => {
  const hexToRgb = (hex: string) => {
    const clean = hex.replace('#', '');
    if (clean.length !== 6) return { r: 0, g: 0, b: 0 };
    return {
      r: parseInt(clean.slice(0, 2), 16) / 255,
      g: parseInt(clean.slice(2, 4), 16) / 255,
      b: parseInt(clean.slice(4, 6), 16) / 255,
    };
  };

  const a = hexToRgb(colorA);
  const b = hexToRgb(colorB);

  const t = Math.max(0, Math.min(1, blend));
  const g = Math.max(0, Math.min(1, glowIntensity));

  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
    a: 0.3 + g * 0.7,
  };
};

export const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

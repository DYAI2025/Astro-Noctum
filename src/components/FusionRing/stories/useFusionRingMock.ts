export const useFusionRingMock = (profile: string) => {
  const base = Array.from({ length: 12 }, () => 0.3);
  if (profile === 'feuer') {
    base[0] = base[2] = base[3] = base[4] = 1.85;
  } else if (profile === 'wasser') {
    base[7] = base[8] = base[9] = 1.92;
  } else if (profile === 'erde') {
    base[1] = base[4] = base[10] = 1.65;
  } else if (profile === 'gemischt') {
    base[4] = 1.9; base[7] = 1.75; base[11] = 1.82;
  }
  return { signal: base, equilibrium: base.map(v => v * 0.6), resolution: 92, transits: Array.from({ length: 12 }, () => ({ symbol: '✨' })), kpIndex: 5 };
};

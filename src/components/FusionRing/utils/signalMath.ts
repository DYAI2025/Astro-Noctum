export const gaussSpread = (value: number, sigma: number = 1.2) => {
  return value * Math.exp(-(value * value) / (2 * sigma * sigma));
};

export const powerCurve = (value: number, power: number = 1.5) => {
  return Math.pow(Math.abs(value), power);
};

export interface Spike {
  sector: number;
  delta: number;
  position: [number, number, number];
  labelPos: [number, number, number];
  label: string;
  element: string;
}

export const calculateDivergenceSpikes = (signal: number[], equilibrium: number[]): Spike[] => {
  const spikes: Spike[] = [];
  for (let i = 0; i < signal.length; i++) {
    const delta = signal[i] - equilibrium[i];
    if (delta > 0.18) {
      const angle = (i * Math.PI) / 6; // 12 sectors
      const baseRadius = 4.2;
      const x = Math.cos(angle) * (baseRadius + delta * 2);
      const y = Math.sin(angle) * (baseRadius + delta * 2);
      spikes.push({
        sector: i,
        delta,
        position: [x, y, 0],
        labelPos: [x * 1.2, y * 1.2, 0],
        label: `Spike ${i}`,
        element: 'fire', // Simplified element picking
      });
    }
  }
  return spikes;
};

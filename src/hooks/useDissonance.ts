import { useMemo } from 'react';
import { computeDissonance, type DissonanceResult } from '../lib/fusion-ring/dissonance';
import { computeVisualModulation, type VisualModulation } from '../lib/fusion-ring/dissonance-visual';

interface UseDissonanceProps {
  natalWeights: Record<string, number> | null;
  currentWeights: Record<string, number> | null;
  previousWeights: Record<string, number> | null;
  wuxinBalance?: Record<string, number>;
  previousWuxinBalance?: Record<string, number>;
}

export interface DissonanceState {
  dissonance: DissonanceResult | null;
  modulation: VisualModulation | null;
}

export function useDissonance({
  natalWeights,
  currentWeights,
  previousWeights,
  wuxinBalance,
  previousWuxinBalance,
}: UseDissonanceProps): DissonanceState {
  return useMemo(() => {
    if (!natalWeights || !currentWeights) {
      return { dissonance: null, modulation: null };
    }
    const dissonance = computeDissonance(
      natalWeights,
      currentWeights,
      previousWeights,
      wuxinBalance ?? {},
      previousWuxinBalance,
    );
    const modulation = computeVisualModulation(dissonance);
    return { dissonance, modulation };
  }, [natalWeights, currentWeights, previousWeights, wuxinBalance, previousWuxinBalance]);
}

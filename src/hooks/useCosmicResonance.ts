/**
 * React hook: computes cosmic resonance profile from natal weights + space weather.
 *
 * Returns the user's personalized resonance profile and per-dimension solar
 * multipliers that can be fed into the V3 Signatur engine.
 */

import { useMemo } from 'react';
import {
  computeCosmicResonance,
  applyResonance,
  type ResonanceProfile,
} from '../lib/space-weather/cosmic-resonance';

export interface UseCosmicResonanceProps {
  /** 7 planet weights from soulprintToNatalWeights() */
  natalWeights: Record<string, number> | null;
  /** Raw ring modulation from useSpaceWeather (1.0–1.5) */
  ringModulation: number;
  /** Optional: sun sign for refined element weighting */
  sunSign?: string;
  /** Optional: moon sign */
  moonSign?: string;
  /** Optional: ascendant sign */
  ascSign?: string;
}

export interface CosmicResonanceState {
  /** The user's resonance profile (null if no natal data) */
  profile: ResonanceProfile | null;
  /** Per-dimension solar multipliers for V3 engine (null if no data) */
  dimensionMultipliers: Record<string, number> | null;
}

export function useCosmicResonance({
  natalWeights,
  ringModulation,
  sunSign,
  moonSign,
  ascSign,
}: UseCosmicResonanceProps): CosmicResonanceState {
  const profile = useMemo(() => {
    if (!natalWeights) return null;
    return computeCosmicResonance(natalWeights, sunSign, moonSign, ascSign);
  }, [natalWeights, sunSign, moonSign, ascSign]);

  const dimensionMultipliers = useMemo(() => {
    if (!profile) return null;
    return applyResonance(profile, ringModulation);
  }, [profile, ringModulation]);

  return { profile, dimensionMultipliers };
}

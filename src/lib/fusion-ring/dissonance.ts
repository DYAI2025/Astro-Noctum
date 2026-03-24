import { CONTROL_CYCLE, GENERATION_CYCLE } from '../astro-data/wuxing-cycles';
import { clamp } from '../../components/fusion-ring-website/bazodiac-engine';

// ─── Types ────────────────────────────────────────────────────────────────

export interface ElementalDissonance {
  /** 0–1 magnitude of elemental tension */
  magnitude: number;
  /** 'sheng' = generation cycle disrupted (organic), 'ke' = control cycle (crystalline), 'neutral' = no elemental tension */
  type: 'sheng' | 'ke' | 'neutral';
  /** Which elements are in tension [dominant, controller/feeder] */
  pair: [string, string] | null;
}

export interface DissonanceResult {
  /** 0–1: Distance between current weights and natal baseline */
  d_natal: number;
  /** 0–1: Distance between current weights and accumulated profile (0 if no history) */
  d_accumulated: number;
  /** Elemental tension with Sheng/Ke classification */
  d_elemental: ElementalDissonance;
  /** 0–1: Combined intensity score (for quick checks) */
  intensity: number;
}

// ─── Planet Weight Vector ─────────────────────────────────────────────────

type WeightVector = Record<string, number>;

const PLANET_IDS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];

/** Euclidean distance between two 7D weight vectors, normalized to [0, 1] */
function vectorDistance(a: WeightVector, b: WeightVector): number {
  let sumSq = 0;
  for (const id of PLANET_IDS) {
    const diff = (a[id] ?? 0.5) - (b[id] ?? 0.5);
    sumSq += diff * diff;
  }
  // Max possible distance: sqrt(7 * 1^2) ≈ 2.646
  return clamp(Math.sqrt(sumSq) / 2.646, 0, 1);
}

// ─── Elemental Dissonance ─────────────────────────────────────────────────

const ELEMENTS = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'];

function computeElementalDissonance(
  wuxinBefore?: Record<string, number>,
  wuxinAfter?: Record<string, number>,
): ElementalDissonance {
  if (!wuxinBefore || !wuxinAfter) {
    return { magnitude: 0, type: 'neutral', pair: null };
  }

  // Find biggest elemental shift
  let maxShiftElement = '';
  let maxShift = 0;
  for (const el of ELEMENTS) {
    const shift = Math.abs((wuxinAfter[el] ?? 0) - (wuxinBefore[el] ?? 0));
    if (shift > maxShift) {
      maxShift = shift;
      maxShiftElement = el;
    }
  }

  if (maxShift < 0.05) {
    return { magnitude: 0, type: 'neutral', pair: null };
  }

  // Check if the shift activates a Ke (control) relationship
  for (const edge of CONTROL_CYCLE) {
    const isController = edge.from === maxShiftElement;
    const isControlled = edge.to === maxShiftElement;
    if (isController || isControlled) {
      const otherEl = isController ? edge.to : edge.from;
      const otherVal = wuxinAfter[otherEl] ?? 0;
      const shiftVal = wuxinAfter[maxShiftElement] ?? 0;
      // Ke tension: both elements are active (> 0.3) and one is shifting
      if (otherVal > 0.3 && shiftVal > 0.3) {
        return {
          magnitude: clamp(maxShift * 1.5, 0, 1),
          type: 'ke',
          pair: [isController ? maxShiftElement : otherEl, isControlled ? maxShiftElement : otherEl],
        };
      }
    }
  }

  // Check Sheng (generation) cycle disruption
  for (const edge of GENERATION_CYCLE) {
    if (edge.from === maxShiftElement || edge.to === maxShiftElement) {
      return {
        magnitude: clamp(maxShift * 1.2, 0, 1),
        type: 'sheng',
        pair: [edge.from, edge.to],
      };
    }
  }

  return { magnitude: clamp(maxShift, 0, 1), type: 'neutral', pair: null };
}

// ─── Main Function ────────────────────────────────────────────────────────

/**
 * Compute three-layer dissonance between a user's profiles.
 *
 * @param natal       - Pure natal weights (from birth data, never changes)
 * @param current     - Current planet weights (after latest quiz modulation)
 * @param accumulated - Previous accumulated weights (before this quiz). Null for first quiz.
 * @param wuxinBefore - Wu-Xing element balance before quiz (optional)
 * @param wuxinAfter  - Wu-Xing element balance after quiz (optional)
 */
export function computeDissonance(
  natal: WeightVector,
  current: WeightVector,
  accumulated: WeightVector | null,
  wuxinBefore: Record<string, number>,
  wuxinAfter?: Record<string, number>,
): DissonanceResult {
  const d_natal = vectorDistance(natal, current);
  const d_accumulated = accumulated ? vectorDistance(accumulated, current) : 0;
  const d_elemental = computeElementalDissonance(wuxinBefore, wuxinAfter);

  // Combined intensity: weighted blend (natal baseline is most important)
  const intensity = clamp(
    d_natal * 0.4 + d_accumulated * 0.35 + d_elemental.magnitude * 0.25,
    0,
    1,
  );

  return { d_natal, d_accumulated, d_elemental, intensity };
}

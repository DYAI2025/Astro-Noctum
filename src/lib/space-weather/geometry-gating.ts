export type GeometryEventType = 'conjunction' | 'opposition' | 'equinox' | 'solstice' | 'trine' | 'square' | 'transit';

export interface GeometryEvent {
  type: GeometryEventType | string;
  planets?: string[];
  angleDeg?: number;
}

export interface DisturbanceContext {
  kp: number;
  hasCME: boolean;
  isJieqiTransition: boolean;
}

const SIGNIFICANT_GEOMETRY: Set<string> = new Set([
  'conjunction', 'opposition', 'equinox', 'solstice',
]);

/**
 * Gating function: only emit a Contribution Event when a geometry event
 * coincides with active solar disturbance or Jieqi transition.
 * Prevents event spam: a standard conjunction without solar context = no event.
 */
export function isSignificantGeometryEvent(
  event: GeometryEvent,
  context: DisturbanceContext,
): boolean {
  if (!SIGNIFICANT_GEOMETRY.has(event.type)) return false;
  return context.kp >= 5 || context.hasCME || context.isJieqiTransition;
}

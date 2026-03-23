/**
 * Simple feature flags with localStorage override support.
 * Override in browser console: localStorage.setItem('ff_signature_onboarding_v1', 'false')
 */

const FLAGS = {
  signature_onboarding_v1: true,
  daily_modal_v1: true,
  signature_engine_v2: true,
  sky_jieqi_banner: true,
  sky_flare_timeline: true,
  sky_aurora_layer: true,
  sky_geometry_gating: true,
  sky_neo_ribbon: false,
  sky_epoch_mood: false,
  sky_jpl_proxy: false,
  cosmic_encounter_v1: false,
} as const;

type FlagName = keyof typeof FLAGS;

/** Flags that are hard-disabled — localStorage cannot override these. */
const LOCKED_OFF: readonly FlagName[] = ['cosmic_encounter_v1'];

export function isFeatureEnabled(flag: FlagName): boolean {
  // Hard-disabled flags ignore localStorage overrides entirely
  if (LOCKED_OFF.includes(flag)) return false;
  if (typeof window === 'undefined') return FLAGS[flag];
  const override = localStorage.getItem(`ff_${flag}`);
  if (override !== null) return override === 'true';
  return FLAGS[flag];
}

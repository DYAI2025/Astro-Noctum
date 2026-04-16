/**
 * Mobile feature flags — mirrors web src/lib/feature-flags.ts defaults.
 *
 * All flags default to the same values as the web app. Override in dev/QA
 * by mutating MOBILE_FLAGS before the app renders (e.g., in a test harness).
 * In production, flags are static constants compiled into the bundle.
 */
export const MOBILE_FLAGS = {
  /**
   * Use the V2 spirograph engine (SignaturEngine / bazodiac-engine.ts).
   * When false, FuRingScreen falls back to SignaturCanvas (V1 torus ring).
   * Default: true — matches web `signature_engine_v2` flag default.
   */
  signature_engine_v2: true,
} as const;

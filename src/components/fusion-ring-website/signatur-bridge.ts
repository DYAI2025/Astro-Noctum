/**
 * Bridge: soulprint_sectors → natal weights / dimension weights / quiz weights.
 *
 * Canonical implementations live in @bazodiac/shared/signatur.
 * All functions are re-exported here so existing import paths (Dashboard.tsx,
 * FuRingPage.tsx, SignatureReveal.tsx, etc.) continue to work unchanged.
 *
 * Do NOT add local implementations here — change packages/shared/src/signatur/signatur-bridge.ts.
 */
export {
  soulprintToNatalWeights,
  quizSectorsToQuizWeights,
  soulprintToDimensionWeights,
  deriveWeightsFromApiData,
} from '@/packages/shared/src/signatur/signatur-bridge';

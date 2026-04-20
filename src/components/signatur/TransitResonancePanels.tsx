// ═══════════════════════════════════════════════════════════════════════════
// TRANSIT RESONANCE PANELS — signatur-page wrapper
//
// Thin adapter around the shared ActiveImpactsList (variant="full").
// The shared component (src/components/shared/ActiveImpactsList.tsx) holds
// the actual rendering logic so the Dashboard can mount the same schema
// in compact variant. See Phase 4 of
// docs/plans/2026-04-20-dashboard-signatur-gaps.md.
// ═══════════════════════════════════════════════════════════════════════════

import { ActiveImpactsList } from '../shared/ActiveImpactsList';

interface TransitResonancePanelsProps {
  /** Western zodiac sign name (e.g. "Aries") — needed for aspect computation */
  birthSign: string | undefined;
}

export function TransitResonancePanels({ birthSign }: TransitResonancePanelsProps) {
  return <ActiveImpactsList birthSign={birthSign} variant="full" />;
}

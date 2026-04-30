# US-dsg-shared-active-impacts-list: Dashboard und Signatur teilen dieselbe Planeten-Visualisierung

**Status**: Implemented

**Source**: [GOAL-dashboard-signatur-hygiene](../goals/GOAL-dashboard-signatur-hygiene.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## User Story

Als Bazodiac-Nutzer möchte ich die "Aktiven Einflüsse" auf Dashboard und Signatur-Seite im gleichen visuellen Schema sehen, damit ich nicht zwei unterschiedliche Sprachen für dasselbe astrologische Phänomen lernen muss und das Produkt kohärent wirkt.

## Acceptance Criteria

- [x] Shared Component `src/components/shared/ActiveImpactsList.tsx` existiert mit `variant="full"` (zeigt "Warum?"-Toggle) und `variant="compact"` (ohne Toggle)
- [x] `/signatur` nutzt `TransitResonancePanels` → delegiert 1:1 an `<ActiveImpactsList variant="full" />`; alle 23 Signatur-Regression-Tests grün
- [x] Dashboard nutzt `<ActiveImpactsList variant="compact" maxItems={4} />` unter dem Driver-Strip
- [x] `maxItems`-Cap begrenzt die Anzeige auf die stärksten N Planeten-Influences
- [x] Empty-State-Block wenn `birthSign` undefined oder keine Einflüsse verfügbar (kein stilles 0-Rendering)

## Related Artifacts

- Sprint: S-DASH-SIGNATUR-GAPS Phase 4 — `docs/plans/2026-04-20-dashboard-signatur-gaps.md` §Phase 4
- Sprint-Journal US: `docs/user-stories/2026-04-20/US-DSG-4-shared-active-impacts-list.md`
- Requirements: [REQ-F-active-planets-frontend](../requirements/REQ-F-active-planets-frontend.md)

# US-dsg-remove-tagesfeld-pill: Bedeutungslose "Tagesfeld"-Pille aus Driver-Strip entfernt

**Status**: Implemented

**Source**: [GOAL-dashboard-signatur-hygiene](../goals/GOAL-dashboard-signatur-hygiene.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## User Story

Als Bazodiac-Nutzer möchte ich im Driver-Strip nur noch aussagekräftige Kennzahlen sehen (Geomagnetik, Solardruck, Transit-Aktivität), damit ich nicht durch eine bedeutungslose "Tagesfeld Impuls/Spur"-Pille verwirrt werde, die dieselbe Information dupliziert, die ohnehin im Day-Impulse-Badge steht.

## Acceptance Criteria

- [x] Im `driver-strip` existiert kein Text `Tagesfeld` oder `Day field`
- [x] Der Driver-Strip enthält genau 3 Pillen: Geomagnetik + Solardruck + Transit-Aktivität
- [x] Mode-Information (`Tages-Impuls` / `Tages-Spur`) ist weiterhin im Day-Impulse-Badge sichtbar (separate Section, nicht Driver-Strip)

## Related Artifacts

- Sprint: S-DASH-SIGNATUR-GAPS Phase 2 — `docs/plans/2026-04-20-dashboard-signatur-gaps.md` §Phase 2
- Sprint-Journal US: `docs/user-stories/2026-04-20/US-DSG-2-remove-tagesfeld-pill.md`

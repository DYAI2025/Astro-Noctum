# US-dsg-tagesimpuls-centered-horoscope: Tagesimpuls als zentrierte Überschrift mit echtem Horoskop-Text

**Status**: Implemented

**Source**: [GOAL-dashboard-signatur-hygiene](../goals/GOAL-dashboard-signatur-hygiene.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## User Story

Als Bazodiac-Nutzer möchte ich unter dem Kohärenzring und den Einflüssen einen klar abgesetzten, mittig platzierten "Tagesimpuls" sehen mit einem echten, personalisierten Horoskop-Text, damit ich sofort erkenne, was der Tag für mich bedeutet — statt einem kleinen Pill-Badge + generischem transit-event `description_de`, das sich anfühlt wie ein Debug-Log.

## Acceptance Criteria

- [x] Ein `<h3>`-Element mit Text "Tagesimpuls" und Klassen `text-center font-serif text-2xl` existiert wenn `impulsText` vorhanden
- [x] Der Body zeigt `dailyData.fusion.synthesis || dailyData.fusion.summary` — nicht `transitEvent.description_de`
- [x] `data-testid="day-impulse-section"` bleibt stabil (Testid-Kontinuität)
- [x] Kein Rendering wenn `impulsText` leer oder undefined — keine Platzhalter, kein stiller Fallback
- [x] Alter transit-event-Body ist aus dem Tagesimpuls-Block entfernt
- [x] "vertiefen →" Button mit `data-testid="day-detail-trigger"` bleibt wenn `impulsText` vorhanden und `onOpenDayModal` gesetzt

## Related Artifacts

- Sprint: S-DASH-SIGNATUR-GAPS Phase 5 — `docs/plans/2026-04-20-dashboard-signatur-gaps.md` §Phase 5
- Sprint-Journal US: `docs/user-stories/2026-04-20/US-DSG-5-tagesimpuls-centered-horoscope.md`
- Data contract: `src/lib/schemas/experience.ts` — `DailyResponseSchema.fusion.synthesis`
- Requirements: [REQ-F-experience-daily-v2](../requirements/REQ-F-experience-daily-v2.md)

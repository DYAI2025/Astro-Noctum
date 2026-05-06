# US-dsg-dashboard-dead-code-cleanup: Dashboard auf Coherence-First reduziert

**Status**: Implemented

**Source**: [GOAL-dashboard-signatur-hygiene](../goals/GOAL-dashboard-signatur-hygiene.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## User Story

Als Bazodiac-Nutzer möchte ich beim Öffnen des Dashboards sofort meinen Kohärenz-Index und die tagesrelevanten Einflüsse sehen — ohne dass veraltete Sektionen (Vibes, BigFour-Einzelkarten, duplizierte Cosmic-Influence) meine Aufmerksamkeit von den wesentlichen Informationen ablenken.

## Acceptance Criteria

- [x] `VibesSection` + `VibesModal` aus Dashboard entfernt (−455 Zeilen, Phasen 6)
- [x] `BigFour` (freestanding Einzelkarten) entfernt → `IdentityPill`-Strip in `NatalSignaturStatic` gewandert (−304 netto, Phase 7)
- [x] Duplicate `CosmicInfluenceSection` unter Sky entfernt (−488 Zeilen, Phase 8)
- [x] Dashboard-Reihenfolge: `DailyChartHero` → `ActiveImpactsList compact` → `NatalSignaturStatic` mit IdentityPills → Signatur-Seite-Verweis
- [x] 1947/1948 Tests grün nach allen Cleanup-Phasen (1 pre-existing `vibes-perf.test.ts` unrelated 401-Shape-Check)

## Related Artifacts

- Sprint: S-DASH-SIGNATUR-GAPS Phasen 6–8 — `docs/sprint-S-DASH-SIGNATUR-GAPS-report.md`
- Commits: `a6f62ff` (VibesSection), `d1244fd` (BigFour), `8bfbed9` (CosmicInfluence)

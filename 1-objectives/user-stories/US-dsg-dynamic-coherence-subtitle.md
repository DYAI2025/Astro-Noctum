# US-dsg-dynamic-coherence-subtitle: Dynamischer Kohärenz-Untertitel zeigt Delta-Richtung

**Status**: Implemented

**Source**: [GOAL-dashboard-signatur-hygiene](../goals/GOAL-dashboard-signatur-hygiene.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## User Story

Als Bazodiac-Nutzer möchte ich, dass der Untertitel unter dem Kohärenzring ehrlich kommuniziert, ob mein Basiswert heute durch Transite angehoben, gedämpft oder unverändert ist, damit ich dem UI vertrauen kann und nicht bei negativer oder neutraler Tagesmodulation eine "erhöht"-Aussage lese, die der Datenlage widerspricht.

## Acceptance Criteria

- [x] Gegeben mein Basiswert ist 60 und `positive_daily_delta` ist +8 → Untertitel enthält `Basiswert 60` und `angehoben auf 68`
- [x] Gegeben `positive_daily_delta` ist negativ → Untertitel enthält `gedämpft`, keine Erhöhungsaussage
- [x] Gegeben `positive_daily_delta` ist 0 → Untertitel enthält `ohne spürbare kosmische Modulation`
- [x] Fließkomma-Werte werden auf ganze Zahlen gerundet im Untertitel angezeigt
- [x] EN-Pfad: `coherenceSubtitle(..., 'en')` gibt englische Varianten zurück (`elevated`, `dampened`, `without noticeable`)

## Related Artifacts

- Sprint: S-DASH-SIGNATUR-GAPS Phase 1 — `docs/plans/2026-04-20-dashboard-signatur-gaps.md` §Phase 1
- Sprint-Journal US: `docs/user-stories/2026-04-20/US-DSG-1-dynamic-coherence-subtitle.md` (Vollversion mit Gherkin, Verifikation, geänderte Dateien)
- Canonical text: `docs/KOHAERENZ_INDEX.md` §3.1–3.3

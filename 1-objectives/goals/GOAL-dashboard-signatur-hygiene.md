# GOAL-dashboard-signatur-hygiene: Dashboard & Signatur UI/UX-Hygiene

**Description**: Das Dashboard und die Signatur-Seite zeigen User-sichtbare Werte, Texte und Sektionen ohne Widerspruch zur zugrundeliegenden Datenlage. Duplizierte Blöcke werden entfernt oder zusammengeführt, "Derzeit nicht verfügbar"-States werden entweder durch echte Daten ersetzt oder durch bewusste "Daten nicht verfügbar"-Kommunikation ausgetauscht (nie durch stille 0-Werte). Verbotene UI-Lügen: Subtitel die eine Erhöhung behaupten wenn Delta negativ/0 ist, Pills die 0 zeigen ohne klar zu kommunizieren dass die Quelle fehlt, Sektionen die auf Feature-Flags hängen aber gerendert werden als wäre das Feature live. Sprint-Plan mit 12 Phasen: `docs/plans/2026-04-20-dashboard-signatur-gaps.md`. Handoff-Dokument: `docs/plans/2026-04-20-handoff-dashboard-signatur-gaps.md`.

**Status**: Approved

**Priority**: Must-have

**Source stakeholder**: [STK-product-owner](../stakeholders.md), [STK-end-user](../stakeholders.md)

## Success Criteria

- [ ] Kohärenzindex-Kachel zeigt: (a) dynamischen Subtitel der Delta-Richtung (erhöht/gedämpft/neutral) ehrlich kommuniziert, (b) Hover-Tooltip mit Kurz-Erklärung des Index, (c) Ring mit Basis + Delta-Segmenten korrekt gerendert.
- [ ] Driver-Pills zeigen entweder echte Werte (Kp, Solardruck, Transit-Aktivität) oder einen expliziten "—"-Placeholder mit Tooltip "Daten gerade nicht verfügbar" — nie stille 0-Werte wenn die Datenquelle fehlt.
- [ ] Keine bedeutungslosen Pills ("Tagesfeld Impuls") mehr im Driver-Strip.
- [ ] Planeten-Einflüsse erscheinen im Dashboard im gleichen visuellen Schema wie auf der Signatur-Seite ("Aktive Einflüsse"), über eine gemeinsame `ActiveImpactsList`-Komponente.
- [ ] "Tagesimpuls" erscheint als zentrierte grosse Überschrift, Body zeigt echten Text aus dem Daily-Horoscope-Endpoint (nicht nur ein transit-event `description_de`).
- [ ] Nicht-funktionale "Dein Vibe abrufen"-Sektion ist entfernt (Policy: was nicht sofort angeschlossen werden kann, kommt weg).
- [ ] Duplizierte Natal-Identitätskacheln (DashboardBigFour) sind innerhalb der NatalSignaturStatic-Sektion integriert, nicht mehr freistehend.
- [ ] Doppelte `CosmicInfluenceSection` unter dem Sternenhimmel ist entfernt (Tageseinflüsse leben oben im DailyChartHero).
- [ ] Space-Weather-Endpoint `/api/space-weather/extended` liefert entweder echte NASA/NOAA-Daten oder einen sichtbaren Defect-Report, kein silent fail-to-0.
- [ ] Pro Phase wird eine User-Story unter `docs/user-stories/2026-04-20/US-DSG-<n>-<slug>.md` mit Gherkin-AC + Verifikations-Evidence (typecheck / lint / visuell / API-check) dokumentiert.
- [ ] SDS-Dokumentation (`docs/docu/STRUCTURE.md`, `FRONTEND_INTERNALS.md`, `API_REFERENCE.md`) wird synchron zu Code-Änderungen gepflegt.

## Related Artifacts

- Sprint-Plan (Source of Truth): `docs/plans/2026-04-20-dashboard-signatur-gaps.md`
- Handoff-Dokument: `docs/plans/2026-04-20-handoff-dashboard-signatur-gaps.md`
- Master-Prompts: `docs/plans/2026-04-20-MASTER-PROMPTS-for-claude-code.md` (Prompt A)
- Product-Law-Reference: `docs/KOHAERENZ_INDEX.md` — kanonischer Text für Tooltip + Subtitel-Logik
- Abhängigkeit (muss diesem Goal voraus erfüllt sein): GOAL-quiz-signatur-coupling-v1 darf nicht parallel am Signatur-UI bauen — Reihenfolge explizit A → B.
- Related Goals: [GOAL-daily-chart-coherence-first](GOAL-daily-chart-coherence-first.md), [GOAL-signatur-realtime-consistency](GOAL-signatur-realtime-consistency.md), [GOAL-i18n-quiz-ux-integrity](GOAL-i18n-quiz-ux-integrity.md)
- User Stories: aufgebaut während Sprint, Ziel-Ort `docs/user-stories/2026-04-20/US-DSG-*.md` (Ausführungs-Journal, später in `1-objectives/user-stories/` migrierbar falls Formalisierung gewünscht)
- Requirements: _none yet_ — organische Ableitung aus Phasen, später per Post-Sprint-Gap-Analysis ins Scaffold zu heben

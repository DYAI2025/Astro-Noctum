# Iterativer Development Plan: AstroSheet Platform User Journey

**Basierend auf:** `docs/project/full_user_journey_through_the_astrosheet_platform_.md`  
**E2E Tests:** `e2e/user-journey.spec.ts`  
**Erstellt:** 2026-01-04

---

## Übersicht

Dieser Plan beschreibt die iterative Umsetzung der 5-Phasen-Architektur aus der User Journey Dokumentation. Jede Iteration ist in sich abgeschlossen und liefert testbaren Mehrwert.

---

## Sprint-Struktur

| Sprint | Phase | Fokus | Dauer |
|--------|-------|-------|-------|
| 1 | Phase 1 | Onboarding Flow Hardening | 1 Woche |
| 2 | Phase 2 | FusionEngine API Stabilisierung | 1 Woche |
| 3 | Phase 3 | Dashboard UX & Visualisierungen | 1.5 Wochen |
| 4 | Phase 4 | User Interactions (Sidebar, Quizzes) | 2 Wochen |
| 5 | Phase 5 | Engagement Features (Social, Premium) | 1.5 Wochen |
| 6 | QA | E2E Tests, Bugfixes, Performance | 1 Woche |

**Gesamt: ~8 Wochen**

---

## Sprint 1: Onboarding Flow Hardening (Phase 1)

### Ziele
- [ ] Präzisions-Messaging im Onboarding UI
- [ ] Birth Data Validation mit Echtzeit-Feedback
- [ ] DST Fold Handling (Ambiguous Time Picker)

### Tasks

| Task | Datei(en) | Aufwand | Abhängigkeiten |
|------|-----------|---------|----------------|
| 1.1 Precision Hints im Formular hinzufügen | `src/app/onboarding/astro/page.tsx` | 2h | - |
| 1.2 Validierungslogik für Geburtszeit | `src/lib/validation/birthTime.ts` | 4h | - |
| 1.3 DST Fold Modal implementieren | `src/components/ui/DstFoldModal.tsx` | 6h | 1.2 |
| 1.4 Location Autocomplete verbessern | `src/components/ui/CityAutocomplete.tsx` | 4h | - |
| 1.5 API Error Handling (AMBIGUOUS_LOCAL_TIME) | `src/app/api/astro-compute/route.ts` | 3h | 1.3 |

### Akzeptanzkriterien
- E2E Test `1.2 Birth data input validates precision requirements` passiert
- User sieht Hinweis "Ohne exakte Geburtszeit sinkt die Präzision um 10-15%"
- DST-Grenzfälle werden mit Modal abgefangen

### Deliverables
- Aktualisiertes Onboarding UI
- DST Fold Modal Component
- Unit Tests für Validation

---

## Sprint 2: FusionEngine API Stabilisierung (Phase 2)

### Ziele
- [ ] API Response Contract validieren
- [ ] FusionEngine Output Struktur standardisieren
- [ ] Fehlerhandling für Cosmic Engine

### Tasks

| Task | Datei(en) | Aufwand | Abhängigkeiten |
|------|-----------|---------|----------------|
| 2.1 Response Schema (Zod) definieren | `src/server/cosmicEngine/types.ts` | 3h | - |
| 2.2 FusionEngine Response Mapping | `src/server/cosmicEngine/engine.ts` | 4h | 2.1 |
| 2.3 Harmony Index Berechnung verifizieren | `src/server/cosmicEngine/fusion.ts` | 4h | - |
| 2.4 API Error Codes standardisieren | `src/app/api/astro-compute/route.ts` | 2h | - |
| 2.5 Integration Tests | `src/server/cosmicEngine/__tests__/` | 4h | 2.1-2.4 |

### Akzeptanzkriterien
- E2E Test `2.1 API returns Western zodiac and Ba Zi data` passiert
- Response enthält: `western`, `chinese`, `bazi`, `harmonyIndex`
- Keine `TODO` Placeholder in Response

### Deliverables
- Typisierte API Response
- Schema Validation
- Integration Test Suite

---

## Sprint 3: Dashboard UX & Visualisierungen (Phase 3)

### Ziele
- [ ] AstroSheet Dashboard vervollständigen
- [ ] Entfaltungsmatrix Visualisierung
- [ ] Instant Symbol Creator (FusionSign)
- [ ] Cross-System Compatibility Display

### Tasks

| Task | Datei(en) | Aufwand | Abhängigkeiten |
|------|-----------|---------|----------------|
| 3.1 Dashboard Layout Refactor | `src/components/astro-sheet/AstroSheet.tsx` | 6h | - |
| 3.2 Entfaltungsmatrix Component | `src/components/astro-sheet/EntfaltungsMatrix.tsx` | 8h | - |
| 3.3 FusionSign SVG Renderer verbessern | `src/components/astro-sheet/SigilPortrait.tsx` | 4h | - |
| 3.4 Cross-System Card Component | `src/components/astro-sheet/CrossSystemCard.tsx` | 4h | - |
| 3.5 Wu Xing Radar Chart | `src/components/charts/WuXingRadar.tsx` | 6h | - |
| 3.6 data-testid Attribute für E2E | Alle oben | 2h | 3.1-3.5 |

### Akzeptanzkriterien
- E2E Tests `3.1` bis `3.4` passieren
- Dashboard zeigt alle 4 Kernelemente: Name, Matrix, Symbol, Compatibility
- Responsive auf Mobile

### Deliverables
- Neue Dashboard Components
- Radar Chart Visualization
- Updated AstroSheet Layout

---

## Sprint 4: User Interactions (Phase 4)

### Ziele
- [ ] Sidebar Navigation implementieren
- [ ] Profile Section mit Ressourcen-Ansicht
- [ ] Quiz Flow Integration
- [ ] Skills Diagram Layer
- [ ] AI Agent Placeholder

### Tasks

| Task | Datei(en) | Aufwand | Abhängigkeiten |
|------|-----------|---------|----------------|
| 4.1 Sidebar Component mit Routing | `src/components/layout/Sidebar.tsx` | 8h | - |
| 4.2 Profile Page mit Psyche Stats | `src/app/profile/page.tsx` | 6h | - |
| 4.3 Quiz Overview Page | `src/app/(verticals)/quiz/page.tsx` | 4h | - |
| 4.4 Quiz Card Component (data-testid) | `src/components/quiz/QuizCard.tsx` | 3h | - |
| 4.5 Skills Diagram Component | `src/components/profile/SkillsDiagram.tsx` | 8h | - |
| 4.6 AI Agent Placeholder Page | `src/app/agents/page.tsx` | 4h | - |
| 4.7 Sidebar Integration in Layout | `src/app/(astro)/layout.tsx` | 4h | 4.1 |

### Akzeptanzkriterien
- E2E Tests `4.1` bis `4.5` passieren
- Sidebar zeigt: Dashboard, Profil, Quizzes, Agenten, Premium, Einstellungen
- Quiz-Completion aktualisiert Profile State

### Deliverables
- Sidebar Navigation System
- Profile Page mit Stats
- Skills Visualization
- Agent Placeholder

---

## Sprint 5: Engagement Features (Phase 5)

### Ziele
- [ ] Social Sharing mit Image Generation
- [ ] Premium Horoscope Section
- [ ] Next Quiz Recommendation
- [ ] Social Media Banner Generator

### Tasks

| Task | Datei(en) | Aufwand | Abhängigkeiten |
|------|-----------|---------|----------------|
| 5.1 Share Modal Component | `src/components/sharing/ShareModal.tsx` | 4h | - |
| 5.2 OG Image Generation API | `src/app/api/share/image/route.ts` | 8h | - |
| 5.3 Premium Horoscope Gating | `src/app/horoscope/page.tsx` | 4h | - |
| 5.4 Daily Horoscope Component | `src/components/horoscope/DailyHoroscope.tsx` | 6h | Transit API |
| 5.5 Next Quiz Recommendation Engine | `src/lib/recommendations/quizRecommender.ts` | 6h | - |
| 5.6 Social Media Banner Template | `src/components/sharing/SocialBanner.tsx` | 4h | - |

### Akzeptanzkriterien
- E2E Tests `5.1` bis `5.3` passieren
- Share generiert teilbares Bild
- Premium Gate zeigt Upgrade-CTA

### Deliverables
- Social Sharing System
- Premium Horoscope Feature
- Recommendation Engine

---

## Sprint 6: QA & Polish

### Ziele
- [ ] Alle E2E Tests grün
- [ ] Performance Optimization
- [ ] Accessibility Audit
- [ ] Bug Fixes

### Tasks

| Task | Aufwand |
|------|---------|
| 6.1 Playwright Setup in CI/CD | 4h |
| 6.2 Full E2E Suite Run | 4h |
| 6.3 Fix Failing Tests | 8h |
| 6.4 Lighthouse Audit | 2h |
| 6.5 WCAG AA Compliance Check | 4h |
| 6.6 Bug Triage & Fixes | 8h |

### Akzeptanzkriterien
- `npm run e2e` passiert zu 100%
- Lighthouse Performance Score > 80
- Keine A11y Violations (axe-core)

---

## Dependency Graph

```
Phase 1 (Onboarding)
    ↓
Phase 2 (FusionEngine)
    ↓
Phase 3 (Dashboard) ← Sidebar benötigt für Navigation
    ↓
Phase 4 (Interactions)
    ↓
Phase 5 (Engagement)
    ↓
QA Sprint
```

---

## Risiken & Mitigations

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| FusionEngine API instabil | Mittel | Hoch | Sprint 2 priorisieren, Mocks für Frontend |
| DST Fold UX komplex | Niedrig | Mittel | Einfaches Binary Modal |
| Social Image Gen Performance | Mittel | Mittel | Edge Caching, Vercel OG |
| Quiz State Management | Niedrig | Niedrig | Zustand already in use |

---

## Definition of Done

Jeder Sprint gilt als abgeschlossen wenn:
1. Unit Tests passieren (`npm run test`)
2. E2E Tests für Phase passieren (`npm run e2e`)
3. PR Review abgeschlossen
4. Dokumentation aktualisiert
5. Keine P0/P1 Bugs offen

---

## Nächste Schritte

1. **Sofort:** Playwright Setup vervollständigen
2. **Tag 1:** Sprint 1 Tasks starten
3. **Wöchentlich:** Sprint Review & Retrospektive

---

**Letzte Aktualisierung:** 2026-01-04  
**Verantwortlich:** Development Team  
**Review-Datum:** Nach Sprint 3

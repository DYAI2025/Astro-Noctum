# Bazodiac — Current Goal

## Sprint-Ziel: Cosmic Encounter Onboarding + Dashboard Levi-Layer

Das Cosmic Encounter Onboarding läuft nach dem implementierten 7-Phasen-Schema (materializing → levi-speaks → birth-input → calculating → ring-reveal → quiz → complete). Der Levi-Layer auf dem Dashboard (Form + Levi-Widget) funktioniert wie in `docs/plans/2026-03-19-cosmic-encounter-onboarding.md` beschrieben.

## Erfolgskriterien

- [ ] **Onboarding-Flow:** CosmicEncounter-Component rendert korrekt (Desktop: Three.js Scene, Mobile: CSS+Image Fallback)
- [ ] **Feature-Flag:** `cosmic_encounter_v1` ist aktiviert (default: false → true setzen für Testing)
- [ ] **Levi-Integration:** ElevenLabs Widget lädt im Levi-Layer des Dashboards
- [ ] **Parallax:** `useParallax` Hook funktioniert (Form folgt Maus +30px, Levi gegenläufig -50px)
- [ ] **State-Machine:** Alle 7 Phasen werden korrekt durchlaufen (phase state machine)
- [ ] **Ring-Reveal:** FusionRingCanvasV2 zeigt Signatur nach Berechnung
- [ ] **Quiz-Phase:** Quiz startet nach Ring-Reveal (signature_onboarding_v1)
- [ ] **Mobile-Fallback:** CosmicEncounterMobile rendert auf <768px Viewport

## Constraints

- ❌ **Keine Breaking Changes:** Bestehende BirthForm-Logik muss weiter funktionieren (Fallback)
- ❌ **Keine API-Änderungen:** Experience API (`/api/experience/bootstrap`) bleibt unverändert
- ❌ **Performance:** Three.js Scene darf 60fps nicht unterschreiten (Mobile: 30fps acceptable)
- ❌ **Bundle-Size:** Drei.js nur laden wenn `cosmic_encounter_v1` enabled (Lazy Loading)

## Timeline

**Start:** 20. März 2026  
**Ende:** 27. März 2026 (7 Tage)

## Abhängigkeiten

- ✅ **Implementiert:** CosmicEncounter Component
- ✅ **Implementiert:** CosmicEncounterScene (Three.js)
- ✅ **Implementiert:** CosmicEncounterMobile (CSS Fallback)
- ✅ **Implementiert:** useParallax Hook
- ✅ **Implementiert:** feature-flags.ts (`cosmic_encounter_v1`)
- ⏳ **Testing:** E2E-Tests (encounter-quiz-phase.test.tsx)
- ⏳ **Integration:** App.tsx Onboarding-Flow

## Nächste Schritte (Tasks)

1. **Testing:** Vitest E2E-Tests laufen lassen
2. **Integration:** App.tsx Onboarding-Flow verifizieren
3. **Performance:** Three.js Bundle-Size prüfen (Lazy Loading)
4. **Bug-Fixes:** Ausstehende Issues aus `docs/plans/2026-03-19-sprint03-remaining-gaps.md`

---

*DYAI2025 · Bazodiac Sprint Goal v1.0 — 20.03.2026*

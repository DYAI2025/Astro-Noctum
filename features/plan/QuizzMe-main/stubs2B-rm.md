# QuizzMe - Platzhalter & Stubs Inventar (Zu Entfernen)

**Erstellungsdatum:** 2026-01-04
**Status:** Vollständige Analyse aller TODO/FIXME/HACK/Placeholder Markierungen

⚠️ **WICHTIG:** Diese Datei listet alle temporären Implementierungen, Platzhalter und Stubs auf, die in zukünftigen Sprints durch echte Funktionalität ersetzt werden müssen.

---

## 1. KRITISCHE STUBS (High Priority - Blockiert Features)

### 1.1 Horoscope Daily Transits
**Datei:** `src/lib/astro/compute.ts:240`
**Markierung:** `TODO`
**Code:**
```typescript
export function calculateDailyTransits(): DailyTransit[] {
  // TODO: Implement full transit logic matching blueprint
  throw new Error("Not implemented");
}
```

**Abhängige Features:**
- `/verticals/horoscope/daily` (Daily Horoscope Page)
- Premium Tier: Transit Matrix
- Weekly Horoscope Generation

**Blueprint vorhanden:** `docs/plans/quizzme_horoscope_blueprint (2).md`

**Impact:** 🔴 **HIGH** - Horoscope Vertical nicht nutzbar
**Geplanter Sprint:** Phase 6
**Aufwand:** 5-7 Tage (Ephemeris Integration + Aspect Calculation)

---

### 1.2 DST Fold Handling (Onboarding)
**Datei:** `src/app/onboarding/astro/page.tsx:80`
**Markierung:** `TODO` (in Error Message)
**Code:**
```typescript
if (data.code === 'AMBIGUOUS_LOCAL_TIME') {
  setErrorMessage('DST Ambiguity detected (Implementation pending for Phase 3.2)');
}
```

**Problem:**
- Nutzer gibt Geburtszeit während "Fall Back" ein (z.B. 2:30 am)
- Zwei mögliche UTC-Zeiten (vor/nach Umstellung)
- Backend erkennt Ambiguität, aber kein UI für Auswahl

**Benötigte Implementierung:**
1. Fold-Dialog Modal
2. Zwei Optionen anzeigen (z.B. "2:30 am Standard Time" vs "2:30 am Daylight Time")
3. User wählt korrekte Fold
4. Re-submit mit `fold` Parameter

**Impact:** 🟡 **MEDIUM** - Betrifft ~2% der Nutzer (DST-Grenzfälle)
**Geplanter Sprint:** Phase 3.2
**Aufwand:** 2-3 Tage

---

### 1.3 E2E Playwright Tests
**Datei:** `e2e/character-sheet.spec.ts:10`
**Markierung:** Placeholder Comment
**Code:**
```typescript
/**
 * Note: This is a Playwright test placeholder.
 * Proper E2E tests require running dev server + real browser.
 */
```

**Problem:**
- Tests sind geschrieben, aber Playwright fehlt in Dependencies
- Keine CI/CD Integration
- Keine automatische Ausführung

**Benötigte Implementierung:**
1. `npm install -D @playwright/test`
2. `playwright.config.ts` konfigurieren
3. CI/CD Pipeline (GitHub Actions)
4. Screenshot Baselines

**Impact:** 🟡 **MEDIUM** - Test Coverage Gap
**Geplanter Sprint:** QA Phase
**Aufwand:** 3-4 Tage

---

## 2. FEATURE STUBS (Medium Priority - Designed, nicht implementiert)

### 2.1 Social Sharing
**Datei:** `docs/plans/feature-social-sharing.md`
**Status:** ✅ Feature designed, ❌ Nicht implementiert

**Fehlende Komponenten:**
- `src/components/quiz/ShareButton.tsx`
- `src/components/quiz/ShareModal.tsx`
- `src/lib/sharing/generateShareImage.ts`
- `src/app/api/share/image/route.ts`

**Benötigt:**
- Server-side Image Generation (Satori/resvg)
- Share Links für Plattformen (FB, Twitter, WhatsApp, etc.)
- Referral Parameter Tracking

**Impact:** 🟡 **MEDIUM** - Virales Wachstum fehlt
**Geplanter Sprint:** Phase 5
**Aufwand:** 2-3 Tage

---

### 2.2 Quiz Retake Warning
**Datei:** `docs/plans/feature-quiz-retake-warning.md`
**Status:** ✅ Feature designed, ❌ Nicht implementiert

**Fehlende Komponenten:**
- Modal Komponente für Warning
- Check in `QuizPageShell` ob Quiz bereits completed
- State Management für `completedQuizzes` Array

**Benötigt:**
```typescript
if (isQuizCompleted(quizId)) {
  showRetakeWarning({
    onConfirm: () => startQuiz(),
    onCancel: () => router.back()
  });
}
```

**Impact:** 🟢 **LOW** - UX Verbesserung, nicht kritisch
**Geplanter Sprint:** Phase 5
**Aufwand:** 1 Tag

---

### 2.3 Completed Quiz Status Stamps
**Datei:** `docs/plans/feature-completed-quiz-status.md`
**Status:** ✅ Feature designed, ❌ Nicht implementiert

**Fehlende Implementierung:**
- Grayscale Filter auf completed Quiz Cards
- "✓ Completed" Stamp Overlay
- Persistent Tracking in Profile State

**Benötigt:**
```typescript
// ProfileState
completedQuizzes: string[] = ["quiz.personality.v1", ...];

// Quiz Card Komponente
className={isCompleted ? "grayscale opacity-70" : ""}
{isCompleted && <CompletedStamp />}
```

**Impact:** 🟢 **LOW** - UX Enhancement
**Geplanter Sprint:** Phase 5
**Aufwand:** 1 Tag

---

## 3. MOCK DATA (Temporäre Daten - zu ersetzen)

### 3.1 Psyche Profile Mock
**Datei:** `src/test/mocks/psyche-profiles.ts`
**Markierung:** `Test Mock Data for Psyche Profiles`
**Verwendung:**
- `src/hooks/usePsycheProfile.ts:38` (Development Mode)
- Character Sheet Tests

**Problem:**
- Hook returned Mock Data statt echten Supabase Fetch
- Development Experience OK, aber Production Risk

**Benötigt:**
```typescript
// Aktuell:
const mockProfile = { ... };
return mockProfile;

// Ziel:
const { data } = await supabase.from('profiles').select('*').single();
return buildProfileSnapshot(data);
```

**Impact:** 🟢 **LOW** - Nur in Tests & Development
**Geplanter Sprint:** Cleanup Phase
**Aufwand:** 2 Stunden

---

### 3.2 Fallback Mock Data (AstroSheet)
**Datei:** `src/components/astro-sheet/IdentityBadges.tsx:321`
**Markierung:** `Fallback mock data when bazi is not available`
**Code:**
```typescript
// Fallback mock data when bazi is not available
const mockBazi = {
  element_balance: {
    Wood: 20, Fire: 15, Earth: 25, Metal: 30, Water: 10
  }
};
```

**Problem:**
- Wenn `bazi` nicht vorhanden, zeigt Mock Wu Xing Balance
- User sieht falsche Daten statt "Not Available" Message

**Benötigt:**
```typescript
if (!bazi) {
  return <BaZiNotAvailable message="Berechne dein BaZi im Onboarding" />;
}
```

**Impact:** 🟡 **MEDIUM** - User Confusion möglich
**Geplanter Sprint:** Phase 4 Cleanup
**Aufwand:** 1 Stunde

---

### 3.3 Quizzes & Agents Placeholder (AstroSheet)
**Datei:** `src/components/astro-sheet/AstroSheet.tsx:64`
**Markierung:** `Placeholder/Mock for now as per plan`
**Kommentar:**
```typescript
// 4. Quizzes & Agents (Placeholder/Mock for now as per plan)
// Will be implemented in future sprint
```

**Problem:**
- Sektion "Empfohlene Quizzes" zeigt nichts
- Personalisierte Empfehlungen nicht implementiert

**Benötigt:**
- Quiz Recommendation Engine
- Basierend auf BaZi/Western Profil
- Display Component

**Impact:** 🟢 **LOW** - Nice-to-have Feature
**Geplanter Sprint:** Phase 7
**Aufwand:** 3-4 Tage

---

## 4. DEPRECATED CODE (zu entfernen)

### 4.1 Deprecated Quiz Versions
**Datei:** `src/components/quizzes/quizzes new design/allQuizzes/DEPRECATED.md`
**Status:** ⚠️ **DEPRECATED** - Nicht verwenden

**Betroffene Dateien:**
```
- AuraColorsQuizDEPRECATED.tsx
- CharmeQuizDEPRECATED.tsx
- EQQuizDEPRECATED.tsx
- LoveLanguagesQuizDEPRECATED.tsx
```

**Replacement:**
- `src/components/quizzes/AuraColorsQuiz.tsx` (aktuell)
- etc.

**Problem:**
- Alte Versionen noch im Repo
- Verwirrung möglich
- Import-Fehler-Risiko

**Aktion:** 🔴 **DELETE** - Sicher entfernen, Replacements existieren
**Aufwand:** 10 Minuten

---

### 4.2 Old calculateBaZiLegacy Function
**Datei:** `src/server/cosmicEngine/bazi.ts:332`
**Markierung:** `@deprecated Use calculateBaZi(input: BaZiInput) instead`
**Code:**
```typescript
/**
 * @deprecated Use calculateBaZi(input: BaZiInput) instead
 */
export function calculateBaZiLegacy(birthDate: Date, ...) {
  // Old implementation
}
```

**Problem:**
- Legacy Funktion noch exportiert
- Könnte versehentlich verwendet werden
- API Drift Risk

**Aktion:** 🔴 **DELETE** - Nach Übergangsphase (2 Versionen)
**Aufwand:** 5 Minuten

---

### 4.3 Deprecated node-domexception
**Datei:** `package-lock.json:7001`
**Warning:** `Use your platform's native DOMException instead`

**Problem:**
- npm install zeigt deprecation warning
- Dependency von altem Paket

**Aktion:** 🟡 **UPDATE** - Dependencies aktualisieren
**Aufwand:** 30 Minuten (Regression Testing)

---

## 5. TEMPORARY WORKAROUNDS (HACK Markierungen)

### 5.1 Party Quiz Scoring Hack
**Datei:** `src/components/quizzes/PartyQuiz.tsx:33`
**Markierung:** `HACK`
**Kommentar:**
```typescript
// HACK: Scoring in data.ts vs internal result calculation
// Inconsistency between two scoring methods
```

**Problem:**
- Scoring logic duplikated (data.ts + Component)
- Könnte zu unterschiedlichen Ergebnissen führen

**Benötigt:**
- Unified Scoring in data.ts
- Component nur Präsentation

**Impact:** 🟡 **MEDIUM** - Data Integrity Risk
**Geplanter Sprint:** Quiz Refactor
**Aufwand:** 2 Stunden

---

### 5.2 Cosmic Engine Placeholder (Vendor)
**Datei:** `vendor/cosmic-engine-v3_5/src/cosmic-engine-enhanced.js:251-252`
**Markierung:** `TODO`
**Code:**
```javascript
// TODO: Import and use original engine functions
// For now, placeholder
```

**Problem:**
- Vendor Code enthält Placeholders
- Nicht alle Features aus original engine portiert

**Benötigt:**
- Vollständige Portierung oder
- Echte Vendor Dependency statt vendored copy

**Impact:** 🟢 **LOW** - Funktioniert aktuell mit Fallbacks
**Aktion:** 🟡 **REFACTOR** - Langfristige Wartbarkeit
**Aufwand:** 1 Woche (full port)

---

## 6. UI PLACEHOLDERS (Visuals fehlen)

### 6.1 Ornament SVG Placeholder
**Datei:** `src/components/ui/AlchemyCard.tsx:21`
**Markierung:** `simplified placeholder`
**Kommentar:**
```typescript
// Ornament SVG (Corner Flourish - simplified placeholder)
```

**Problem:**
- SVG ist generische Kurve, nicht finales Design
- Sollte durch Design-Asset ersetzt werden

**Benötigt:**
- Finales SVG aus Design Team
- Mehrere Varianten (corner-tl, corner-tr, etc.)

**Impact:** 🟢 **LOW** - Funktional OK, nicht pixel-perfect
**Geplanter Sprint:** Design Finalization
**Aufwand:** 1 Stunde (Asset Integration)

---

### 6.2 Profile Spine Ghost Book
**Datei:** `src/components/dashboard/ProfileSpine.tsx:58`
**Markierung:** `Placeholder Visuals (Ghost Book)`
**Kommentar:**
```typescript
{/* Placeholder Visuals (Ghost Book) */}
```

**Problem:**
- Leerer State zeigt generisches "Geister-Buch"
- Sollte personalisiertes Visual sein

**Benötigt:**
- Conditional Rendering basierend auf Completion %
- Dynamisches Visual (z.B. Buch füllt sich mit Seiten)

**Impact:** 🟢 **LOW** - UX Enhancement
**Geplanter Sprint:** Phase 6
**Aufwand:** 1 Tag

---

### 6.3 Relationship Section Placeholder
**Datei:** `src/components/character/sections/RelationshipSection.tsx:121`
**Markierung:** `Placeholder interactives`
**Kommentar:**
```typescript
{/* Placeholder interactives */}
```

**Problem:**
- Sektion "Beziehungen" zeigt Placeholder-Text
- Interaktive Features (Partner-Synastrie) fehlen

**Benötigt:**
- Synastrie Calculator
- Composite Chart Display
- User-Input für Partner-Geburtsdaten

**Impact:** 🟡 **MEDIUM** - Premium Feature
**Geplanter Sprint:** Phase 7 (Community Features)
**Aufwand:** 5-7 Tage

---

## 7. API/BACKEND PLACEHOLDERS

### 7.1 Implementation_API.md TODOs
**Datei:** `Implementation_API.md` (multiple lines)
**Markierungen:** 13x `TODO`

**Betroffene Bereiche:**
1. `engine.version.build: "git:TODO"` (mehrfach)
2. `inputFingerprint: "sha256:TODO"`
3. Timezone resolution TODO
4. DST ambiguity detection TODO
5. Ephemeris readiness checks TODO
6. Semantic input validation TODO

**Problem:**
- API Contract definiert, aber Implementierungsdetails fehlen
- Fingerprinting nicht implementiert
- Readiness Checks fehlen

**Impact:** 🟡 **MEDIUM** - API Spec Vollständigkeit
**Aktion:** 🟡 **IMPLEMENT** - Spec vervollständigen
**Aufwand:** 2-3 Tage

---

### 7.2 Calibrate Fixtures Placeholders
**Datei:** `vendor/cosmic-engine-v3_5/scripts/calibrate-fixtures.js:94-107`
**Markierung:** `longitude_placeholder` (deleted)
**Code:**
```javascript
delete fixture.expected.ascendant.longitude_placeholder;
delete fixture.expected.mc.longitude_placeholder;
delete fixture.expected.sun.longitude_placeholder;
delete fixture.expected.moon.longitude_placeholder;
```

**Problem:**
- Test Fixtures hatten Placeholder-Felder
- Script entfernt sie zur Laufzeit
- Sollten in Source Fixtures nicht existieren

**Aktion:** 🟢 **CLEANUP** - Fixtures bereinigen
**Aufwand:** 30 Minuten

---

## 8. REGISTRY ALLOWLIST (Legacy IDs)

### 8.1 Legacy Marker IDs
**Datei:** `scripts/registry-lint.allowlist.txt:10-12`
**Markierung:** `TODO: REMOVE BY PHASE 7 MIGRATION`
**Inhalt:**
```
# TODO: REMOVE BY PHASE 7 MIGRATION
# LEGACY MARKERS (Pre-Registry System)
# These legacy IDs are temporary bridges until quizzes are migrated to use
# the new registry-based marker system
```

**Betroffene Legacy IDs:**
- `quiz.ahnenstein.v1` (alt)
- `marker.old_format.*` (verschiedene)

**Problem:**
- Alte Quizzes verwenden noch Pre-Registry Marker
- Allowlist erlaubt temporär
- Langfristige Tech Debt

**Benötigt:**
- Quiz Migration zu neuen Marker IDs
- Allowlist Entries entfernen
- `npm run registry:lint` sollte 0 Warnungen zeigen

**Impact:** 🟡 **MEDIUM** - Tech Debt
**Geplanter Sprint:** Phase 7 Registry Migration
**Aufwand:** 2 Tage (alle Quizzes migrieren)

---

## 9. FORM PLACEHOLDERS (UI Text)

### 9.1 Input Placeholder Strings
**Dateien:** Mehrere Komponenten
**Markierung:** `placeholder="..."` Attribute

**Beispiele:**
- `placeholder="traveler@example.com"` (AuthForm)
- `placeholder="Enter your name"` (Onboarding)
- `placeholder="z.B. Luna, Max, Sternenwanderer..."` (Astro Onboarding V2 HTML)

**Problem:**
- Placeholder-Text nicht i18n-ready
- Hardcoded Deutsch
- Keine Lokalisierung

**Benötigt:**
- i18n System (next-intl oder react-i18next)
- Translation Keys
- Multi-Language Support

**Impact:** 🟢 **LOW** - Internationalisierung später
**Geplanter Sprint:** i18n Phase
**Aufwand:** 1 Woche (komplettes i18n Setup)

---

## 10. SKIPPED TESTS

### 10.1 SocialRoleQuiz Test
**Datei:** `src/components/quizzes/SocialRoleQuiz.test.tsx:27`
**Markierung:** `TODO: This test needs refactoring`
**Kommentar:**
```typescript
// TODO: This test needs refactoring - fake timers conflict with dynamic imports
test.skip('renders quiz correctly', () => { ... });
```

**Problem:**
- Test ist skipped wegen Fake Timer Konflikt
- Feature ist ungetestet
- Potential Regression Risk

**Benötigt:**
- Test refactoren ohne Fake Timers
- Oder dynamic imports mocken

**Impact:** 🟡 **MEDIUM** - Test Coverage Gap
**Aktion:** 🟡 **FIX** - Test aktivieren
**Aufwand:** 2 Stunden

---

## ZUSAMMENFASSUNG & PRIORISIERUNG

### 🔴 **KRITISCH (Blockiert Features)** - Sofort angehen:
1. **Horoscope Daily Transits** (`src/lib/astro/compute.ts:240`) - 5-7 Tage
2. **E2E Playwright Tests** (`e2e/`) - 3-4 Tage
3. **Deprecated Quiz Versions löschen** (`DEPRECATED.md`) - 10 Min

### 🟡 **WICHTIG (Feature Completion)** - Nächste Sprints:
4. **DST Fold Handling** (Onboarding) - 2-3 Tage
5. **Social Sharing** (Feature) - 2-3 Tage
6. **Party Quiz Scoring Hack** (Refactor) - 2 Std
7. **Registry Migration** (Phase 7) - 2 Tage
8. **API Implementation TODOs** - 2-3 Tage

### 🟢 **NIEDRIG (Cleanup & Polish)** - Spätere Phasen:
9. **Mock Data entfernen** (Development Hooks) - 2 Std
10. **UI Placeholders** (Ornaments, Visuals) - 1 Tag
11. **i18n Placeholders** (Multi-Language) - 1 Woche
12. **Deprecated Code** (Legacy Funktionen) - 1 Std
13. **Skipped Tests** (SocialRoleQuiz) - 2 Std

---

## AUFWANDS-KALKULATION

| Priorität | Tasks | Gesamt-Aufwand |
|-----------|-------|----------------|
| 🔴 KRITISCH | 3 | ~9 Tage |
| 🟡 WICHTIG | 5 | ~12 Tage |
| 🟢 NIEDRIG | 5 | ~10 Tage |
| **TOTAL** | **13** | **~31 Tage** |

---

## EMPFEHLUNG

**Nächste 2 Sprints (4 Wochen):**
1. **Sprint N+1:** Horoscope Transits + E2E Tests + Deprecated Cleanup (2 Wochen)
2. **Sprint N+2:** DST Handling + Social Sharing + Party Quiz Fix (2 Wochen)

**Danach:**
- Cleanup Phase: Mock Data, Registry Migration, i18n Prep

**Langfristig:**
- Phase 7: Community Features (Relationship Section, User Matching)

---

**Status:** 📋 Vollständiges Inventar erstellt
**Nächste Aktion:** Priorisierung mit Product Owner
**Letzte Aktualisierung:** 2026-01-04

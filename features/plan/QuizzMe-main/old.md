# QuizzMe - Überflüssige Dateien (Zu Prüfen/Entfernen)

**Erstellungsdatum:** 2026-01-04
**Status:** Inventar aller potenziell redundanten Dateien

⚠️ **WICHTIG:** Nichts wurde entfernt! Diese Liste dient nur der Identifikation. **Review mit Team erforderlich vor Löschung.**

---

## 1. DEPRECATED QUIZ VERSIONEN (Sicher zu löschen)

### 1.1 Deprecated Quiz Komponenten
**Verzeichnis:** `src/components/quizzes/quizzes new design/allQuizzes/`
**Dokumentiert in:** `DEPRECATED.md`

**Dateien:**
```
src/components/quizzes/quizzes new design/allQuizzes/DEPRECATED.md
```

**Beschreibung:**
- Alte Quiz-Versionen wurden durch neue ersetzt
- Replacement existiert in `src/components/quizzes/`
- Keine aktiven Imports mehr

**Status:** 🔴 **SICHER ZU LÖSCHEN**
**Aktion:** `rm -rf "src/components/quizzes/quizzes new design/"`
**Risiko:** Niedrig (Replacements existieren)

---

### 1.2 Duplicate DEPRECATED.md
**Dateien:**
```
1. docs/plans/new-quizzes-designed and ready/allQuizzes/DEPRECATED.md
2. src/components/quizzes/quizzes new design/allQuizzes/DEPRECATED.md
```

**Problem:** Doppelte Dokumentation

**Status:** 🟡 **MERGE & KONSOLIDIEREN**
**Aktion:** Eine Version behalten, andere löschen

---

## 2. MULTIPLE COPIES DESSELBEN DESIGNS (Redundant)

### 2.1 Duplicate Quiz JSON Files
**Verzeichnisse:**
```
1. src/components/quizzes/{quiz-name}/
2. docs/plans/new-quizzes-designed and ready/allQuizzes/
3. src/components/quizzes/quizzes new design/allQuizzes/
```

**Betroffene Files:**
- `social-role-quiz.json` (3 Kopien)
- `karriere-dna-test.json` (3 Kopien)
- `krafttier-quiz-v2.json` (3 Kopien)
- `aufmerksamkeit-quiz.json` (3 Kopien)
- `aura-farben-quiz.json` (2 Kopien)

**Problem:**
- Gleiche JSON Files in mehreren Verzeichnissen
- Versionierungs-Risiko (welche ist aktuell?)
- Sync-Probleme bei Updates

**Empfehlung:**
1. **Source of Truth:** `src/components/quizzes/{quiz-name}/data.ts` (TS/JSON)
2. **Archive:** `docs/plans/` (Design-Referenz, read-only)
3. **Delete:** `src/components/quizzes/quizzes new design/` (obsolet)

**Status:** 🟡 **KONSOLIDIEREN**
**Aktion:** Source of Truth definieren, Duplikate entfernen
**Risiko:** Mittel (sicherstellen dass korrekte Version behalten wird)

---

### 2.2 Duplicate HTML Previews
**Verzeichnisse:**
```
1. design-assets/
2. docs/plans/new-quizzes-designed and ready/
3. src/components/quizzes/quizzes new design/
```

**Betroffene Files:**
- `celebrity-soulmate-quiz-*.html` (mehrere Varianten)
- `love-languages-botanical.html`
- `karriere-dna-quizzme.html`
- `personality-quiz-pipeline.html`
- `social-role-quiz-v2.html`
- `astro-onboarding-v2.html`

**Problem:**
- HTML Preview Files für Design
- Nicht mehr benötigt nach Komponenten-Implementierung
- Veraltet (keine Updates seit Implementierung)

**Empfehlung:**
1. **Archive:** Move to `docs/design/archive/`
2. **Delete from:** `src/components/` (kein Production Code)

**Status:** 🟡 **ARCHIVIEREN**
**Risiko:** Niedrig (nur Design-Referenz)

---

## 3. DUPLICATE DESIGN DOKUMENTATION

### 3.1 Brand Design Docs (Multiple Copies)
**Dateien:**
```
1. docs/brand_design/brand-design-quizzme.md
2. docs/design/brand-design-quizzme.md
3. docs/brand_design/quizzme-design-system.md
```

**Problem:**
- Ähnliche Inhalte in verschiedenen Verzeichnissen
- Nicht klar welche aktuell ist

**Empfehlung:**
1. **Primary:** `docs/design/brand-design-quizzme.md`
2. **Archive:** `docs/brand_design/` (historisch)

**Status:** 🟢 **PRÜFEN & MERGE**
**Risiko:** Niedrig (nur Dokumentation)

---

### 3.2 Duplicate "Dos und Donts"
**Dateien:**
```
1. docs/brand_design/QuizzMe Dos und Donts.md
2. docs/project/QuizzMe Dos und Donts.md
```

**Problem:** Exakt gleicher Inhalt (vermutlich)

**Empfehlung:** Eine Version behalten, andere löschen

**Status:** 🟡 **DEDUPLIZIEREN**

---

### 3.3 Multiple Contribution Output Specs
**Dateien:**
```
1. docs/design/source_of_truth/superpowers_contribution_output_spec_v_1.md
2. docs/design/source_of_truth/superpowers_contribution_output_spec_v_1 (1).md
3. docs/design/source_of_truth/superpowers_contribution_output_spec_v_1 (2).md
4. docs/design/source_of_truth/superpowers_contribution_output_spec_v_1 (3).md
5. docs/specs/superpowers_contribution_output_spec_v_1.md
```

**Problem:**
- 5 Kopien desselben Specs (vermutlich)
- Versionierungs-Chaos
- Unklar welche aktuell ist

**Empfehlung:**
1. **Source of Truth:** `docs/specs/superpowers_contribution_output_spec_v_1.md`
2. **Delete:** Alle anderen Kopien

**Status:** 🔴 **KRITISCH - DEDUPLIZIEREN**
**Risiko:** Hoch (Spec-Drift möglich)

---

## 4. ALTE BUILD ARTIFACTS & PATCHES

### 4.1 refactor_patch.diff
**Datei:** `/refactor_patch.diff`
**Größe:** ~46,781 Zeilen (sehr groß!)

**Inhalt:** Vermutlich alter Refactoring Patch

**Problem:**
- Riesige Diff-Datei im Root
- Vermutlich bereits angewendet
- Keine Verwendung mehr

**Status:** 🟡 **PRÜFEN & ARCHIVIEREN**
**Aktion:** Wenn angewendet → Archive zu `docs/archive/patches/`
**Risiko:** Niedrig (falls bereits angewendet)

---

### 4.2 fix_environment.sh
**Datei:** `/fix_environment.sh`

**Inhalt:** Vermutlich Setup-Script

**Problem:**
- Temporärer Fix-Script
- Sollte in permanentes Setup integriert werden

**Empfehlung:**
- Inhalt prüfen
- In `package.json` scripts integrieren falls relevant
- Löschen falls obsolet

**Status:** 🟡 **PRÜFEN**

---

## 5. VENDOR REDUNDANZEN

### 5.1 Multiple AstroMirror PDFs
**Dateien:**
```
vendor/cosmic-engine-v3_5/AstroMirror_Partnership_Analysis.pdf
vendor/cosmic-engine-v3_5/Beispiel-Gold-Ergebnis.pdf
vendor/cosmic-engine-v3_5/astromirror_partnership_pdf.py
vendor/cosmic-engine-v3_5/astromirror_partnership_template.json
```

**Problem:**
- PDFs im Vendor Code
- Vermutlich alte Partnership-Dokumentation
- Nicht Teil des Codes

**Empfehlung:** Move to `docs/vendor/astromirror/` (historisch)

**Status:** 🟡 **ARCHIVIEREN**

---

### 5.2 Multiple Markdown Docs (Vendor)
**Dateien:**
```
vendor/cosmic-engine-v3_5/compare-services.md
vendor/cosmic-engine-v3_5/Aszendent-rechnen.md
vendor/cosmic-engine-v3_5/PRODUCTION_READY.md
vendor/cosmic-engine-v3_5/FAIL_CLOSED_PRODUCTION.md
```

**Problem:**
- Vendor-Dokumentation vermischt mit Code
- Sollte getrennt sein

**Empfehlung:** Move to `docs/vendor/cosmic-engine/`

**Status:** 🟢 **ORGANIZE**

---

## 6. DESIGN ASSETS CHAOS

### 6.1 Multiple Preview HTML Files
**Verzeichnis:** `design-assets/`

**Dateien:**
```
design-assets/simple-preview.html
design-assets/preview.html
design-assets/symbols-final-preview.html
design-assets/symbols-v2-preview.html
design-assets/quiz-icons-ethereal.html
```

**Problem:**
- Viele HTML Preview Files
- Unklar welche aktuell ist
- Vermutlich nicht mehr benötigt

**Empfehlung:**
- Prüfen ob aktiv verwendet
- Falls nicht → Archive oder Delete

**Status:** 🟡 **PRÜFEN**

---

### 6.2 design-assets vs public/assets
**Verzeichnisse:**
```
design-assets/
public/assets/
```

**Problem:**
- Zwei Asset-Verzeichnisse
- Unklar was wohin gehört

**Empfehlung:**
1. **Production Assets:** `public/assets/` (served)
2. **Design Work-in-Progress:** `design-assets/` (nicht served)

**Status:** 🟢 **CLARIFY STRUCTURE**

---

## 7. ALTE ENTWICKLUNGSAUFTRÄGE

### 7.1 entwicklungsauftrag_login_horoskop_onboarding_.md
**Datei:** `/entwicklungsauftrag_login_horoskop_onboarding_.md`

**Inhalt:** Vermutlich alter Feature-Auftrag

**Problem:**
- Im Root (sollte in docs/ sein)
- Vermutlich abgeschlossen

**Status:** 🟡 **ARCHIVIEREN**
**Aktion:** Move to `docs/archive/development-orders/`

---

### 7.2 Sprint1-4.md
**Datei:** `/Sprint1-4.md`

**Inhalt:** Sprint-Dokumentation

**Problem:** Im Root statt docs/

**Status:** 🟡 **ORGANIZE**
**Aktion:** Move to `docs/sprints/`

---

### 7.3 issues_GPT.md
**Datei:** `/issues_GPT.md`

**Inhalt:** Issue Tracking

**Problem:** Im Root statt docs/

**Status:** 🟡 **ORGANIZE**
**Aktion:** Move to `docs/issues/` oder GitHub Issues

---

## 8. CLUSTER-SYSTEM FILES (Ungeklärt)

### 8.1 Public Cluster Docs
**Verzeichnis:** `public/`

**Dateien:**
```
public/cluster-quizzes-blumenwesen-ahnenstein.md
public/cluster-schema-registry.md
public/cluster-quiz-blueprint.md
```

**Problem:**
- Markdown Files in `public/` (served als static assets)
- Sollten nicht public accessible sein
- Gehören zu docs/

**Empfehlung:** Move to `docs/clusters/`

**Status:** 🔴 **SICHERHEITSPROBLEM**
**Risiko:** Medium (internal docs exposed)
**Aktion:** SOFORT verschieben

---

## 9. TEST/MOCK REDUNDANZEN

### 9.1 Multiple Psyche Mock Files
**Dateien:**
```
src/test/mocks/psyche-profiles.ts
src/data/mocks/psyche.ts
```

**Problem:**
- Zwei Mock-Verzeichnisse
- Vermutlich duplikate Daten

**Empfehlung:**
1. **Tests:** `src/test/mocks/`
2. **Development:** `src/data/mocks/`

**Status:** 🟢 **PRÜFEN USAGE**

---

## 10. E2E TEST PLACEHOLDERS

### 10.1 Playwright Test Placeholder
**Datei:** `e2e/character-sheet.spec.ts`

**Problem:**
- Kommentar: "This is a Playwright test placeholder"
- Playwright nicht in Dependencies
- Tests laufen nicht

**Empfehlung:**
- **Entweder:** Implementieren (Playwright installieren)
- **Oder:** Löschen (bis Phase X)

**Status:** 🟡 **ENTSCHEIDUNG NÖTIG**

---

## 11. CLOUD ENGINE DOPPELTE STRUKTUR

### 11.1 cloud-engine Verzeichnis
**Verzeichnis:** `/cloud-engine/`

**Inhalt:**
```
cloud-engine/astro_precision/core/engine.py
cloud-engine/astro_precision/core/time.py
```

**Problem:**
- Minimal besetzt (nur 2 Files)
- Vendor Code bereits in `vendor/cosmic-engine-v3_5/`
- Redundant?

**Empfehlung:**
- Prüfen ob aktiv verwendet
- Falls Cloud API: Konsolidieren mit Vendor Code
- Falls obsolet: Löschen

**Status:** 🟡 **PRÜFEN**
**Risiko:** Mittel (könnte Production Cloud Engine sein)

---

## ZUSAMMENFASSUNG & EMPFEHLUNGEN

### 🔴 SOFORT HANDELN (Sicherheit/Kritisch):
1. **Public Cluster Docs** → `docs/` verschieben (Sicherheitsproblem)
2. **Contribution Output Spec Duplikate** → Konsolidieren (Spec-Drift)

### 🟡 KURZFRISTIG BEREINIGEN:
3. **DEPRECATED Quiz Versions** → Löschen (sicher)
4. **Duplicate JSON Files** → Source of Truth definieren
5. **HTML Previews** → Archivieren (nicht mehr benötigt)
6. **refactor_patch.diff** → Archivieren oder löschen
7. **Root Markdown Files** → In `docs/` organisieren
8. **Vendor PDFs/Docs** → In `docs/vendor/` verschieben

### 🟢 LANGFRISTIG STRUKTURIEREN:
9. **Design Assets** → Struktur klären (design-assets vs public/assets)
10. **Mock Files** → Konsolidieren (test vs data)
11. **Cloud Engine** → Verwendung prüfen
12. **E2E Tests** → Implementieren oder entfernen
13. **Brand Design Docs** → Merge & Deduplizieren

---

## AUFWANDS-SCHÄTZUNG

| Priorität | Aufgaben | Aufwand |
|-----------|----------|---------|
| 🔴 SOFORT | 2 | ~2 Stunden |
| 🟡 KURZFRISTIG | 6 | ~1 Tag |
| 🟢 LANGFRISTIG | 6 | ~2 Tage |
| **TOTAL** | **14** | **~3.5 Tage** |

---

## VORGESCHLAGENE STRUKTUR (Nach Cleanup)

```
QuizzMe/
├── src/                    # Source Code
│   ├── components/
│   ├── lib/
│   ├── server/
│   ├── test/              # Test Utilities & Mocks
│   └── data/              # Static Data
│
├── docs/                  # Alle Dokumentation
│   ├── specs/            # Technische Specs (Single Source of Truth)
│   ├── design/           # Design Dokumentation
│   ├── plans/            # Feature Plans & Roadmap
│   ├── implementation/   # Sprint Summaries
│   ├── qa/               # Testing Dokumentation
│   ├── vendor/           # Vendor-Dokumentation
│   ├── sprints/          # Sprint Docs
│   ├── issues/           # Issue Tracking
│   └── archive/          # Alte/Obsolete Docs
│
├── design-assets/        # Work-in-Progress Design Files (nicht served)
│
├── public/               # Production Static Assets (nur served files)
│   └── assets/
│
├── vendor/               # Vendored Dependencies (nur Code, keine Docs)
│
├── e2e/                  # E2E Tests (Playwright)
│
└── scripts/              # Build/Utility Scripts
```

---

## DATEI-ZÄHLUNG

**Analysierte Dateien:** 241 Files mit "deprecated/old/legacy" Markierungen
**Davon Node_Modules:** ~150 (ignorieren)
**Zu prüfende Projekt-Files:** ~91

**Breakdown:**
- DEPRECATED Quiz Files: ~10
- Duplicate Design Docs: ~15
- Vendor Redundanzen: ~8
- Root Organization Issues: ~10
- Design Assets Chaos: ~15
- Test/Mock Files: ~5
- Sonstige: ~28

---

## NÄCHSTE SCHRITTE

1. **Review Meeting** mit Team
2. **Priorisierung** der Cleanup-Aufgaben
3. **Backup** erstellen vor Löschungen
4. **Git Branch** für Cleanup (`cleanup/file-organization`)
5. **Schrittweise Bereinigung** (nicht alles auf einmal)
6. **Dokumentation** der Strukturierung

---

**Status:** 📋 Vollständiges Inventar erstellt
**Aktion:** ⚠️ **TEAM REVIEW ERFORDERLICH**
**Risiko:** Dokumentiert (siehe Risiko-Spalten)
**Letzte Aktualisierung:** 2026-01-04

⚠️ **WICHTIG:** Vor Löschungen immer:
1. Git Commit der aktuellen State
2. Team Approval einholen
3. Backup erstellen
4. Step-by-Step vorgehen

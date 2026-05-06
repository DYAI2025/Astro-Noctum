# Arbeitsauftrag für Claude Code — Home One-Page-Fokus (`/`)

> **Auftraggeber:** Ben (Product Owner / Projektmanager Bazodiac)
> **Erstellt von:** Cowork-Planner-Session (Opus 4.7), 2026-04-28
> **Spec (Source of Truth):** `docs/plans/2026-04-28-spec-home-onepage-fokus.md`
> **Memory-Anker:** `project_home_page_fokus.md` (Bens Entscheidung 2026-04-24)
> **Sprint-Typ:** Strategischer Fokus-Sprint — verwirft den 6-Wochen-Plan zugunsten EINER Seite
> **Reihenfolge:** **NACH** Dashboard-Gaps (Sprint A) und Quiz-Coupling Sprint 1 (Sprint B). Diese Seite konsumiert beide Vorgänger als Bausteine.
> **Ehrlicher Status:** Spec ist Draft — vor Implementierung sind 5 Lücken in Spec §11 zu klären

---

## 1. Dein Auftrag, Claude Code

Lies die Spec unter `docs/plans/2026-04-28-spec-home-onepage-fokus.md` als verbindliche Architektur-Grundlage. Sie destilliert eine strategische Memory-Entscheidung von Ben (2026-04-24): **eine Seite, eine Route `/`, gleichzeitig Landing + Anmeldung + Zuhause.**

Diese Seite ersetzt:
- den alten 7-Phasen-`cosmic_encounter_v1`-Onboarding-Flow (`REQ-F-cosmic-encounter-onboarding` wird obsolet)
- jegliche Idee einer separaten "Dashboard"-Route (Cookie-Login landet HIER)
- jegliche "Landing für Anonyme + Dashboard für Eingeloggte"-Trennung

**Du baust nicht alles auf einmal.** Phase 0 ist Verifikation + Lücken-Klärung. Erst danach Code.

---

## 2. Phase 0 — Verifikation & Lücken-Klärung (KEIN CODE)

Bevor irgendein Edit, mache:

1. **Verifiziere die Memory-Claims gegen den aktuellen Code:**
   - Existiert `day_mode: 'pulse' | 'trace'` wirklich in `PROMPT_MODULE_DAILY_HOROSCOPE.md`? Wo? Welche Felder?
   - Ist `cosmic_encounter_v1`-Flag noch aktiv? Was rendert es heute?
   - Welche Datei rendert aktuell `/`? (Vermutlich `src/pages/Home.tsx` oder `App.tsx`-Route — verifizieren!)
   - `FusionRingCanvasV2` — wo lebt sie, welche Props nimmt sie?
   - Gibt es bereits eine Anonym-Persistenz-Schicht (LocalStorage-Bridge)? Wenn ja, in welcher Form?

2. **Liste die 5 Lücken aus Spec §11 mit konkreten Klärungsfragen** — präsentiere sie an Ben in **strukturierter Form**:
   - Aphorismen-Sammlung: Liefermenge, Quelle, Format
   - Element-Szenen-Tokens: braucht Design-System-Layer vor Build
   - Anonym→Angemeldet-Migration: Datenmodell-Bridge
   - Wahl-Re-Setzen: Edge-Case-Mikrocopy
   - Tagespuls-Beispielsätze: braucht 2–3 echte Beispiele für Tonalitäts-Anker

3. **Risiko-Map:** Welche existierenden Routen/Components kollidieren mit dem Plan, eine Route `/` als Multi-Modus-Seite zu bauen? (Z.B. wenn `react-router` aktuell `/` als Splash hat und `/dashboard` als App-Home — dann muss die Migration explizit geplant sein.)

4. **HALT.** Liefere Phase-0-Report an Ben. Warte auf "go" und Antworten zu den 5 Lücken.

---

## 3. Phase-Plan (NACH Phase-0-Klärung, in dieser Reihenfolge)

### Phase 1 — Routing-Konsolidierung
- `/` wird die einzige App-Home. Cookie-Login redirectet hier.
- Alte `/dashboard`, falls vorhanden, wird Alias auf `/` (Server-Redirect oder Navigate-Component).
- `cosmic_encounter_v1`-Flag-Pfad: entweder explizit deaktiviert oder als Alias auf neue Seite gemappt — Ben-Entscheid.
- **Doku:** `STRUCTURE.md` aktualisieren, Routing-Diagramm in `FRONTEND_INTERNALS.md`.

### Phase 2 — User-Zustands-Ermittlung & Container
- Neuer `<HomePage>`-Container, der drei Zustände unterscheidet:
  - `anonymous-first-visit`
  - `anonymous-returning` (LocalStorage hat Ring-Daten)
  - `authenticated`
- Ein Hook `useHomeUserState()` als Single Source of Truth für diese Logik.
- Tests für alle drei Zustände + Übergänge.

### Phase 3 — Anonyme Persistenz-Bridge (LocalStorage)
- Datenformat: `{ name, birthDate, birthTime, birthPlace, computedRingData, savedAt, schemaVersion }`
- Schema-Version explizit, Migrationspfad bei Format-Änderung.
- Hook `useAnonymousProfile()` mit get/set/clear.
- Integration mit existierender BAFE-Pipeline für Ring-Berechnung.
- **Sicherheit:** keine PII über LocalStorage hinaus, kein Tracking ohne Opt-in.

### Phase 4 — Anmeldeformular mit organischem Wachstum
- Komponente `<OrganicBirthInput>` mit 5 Feldern in fester Reihenfolge (Spec §3).
- Visueller State-Machine: jeder Feld-Schritt löst eine Animations-Stufe aus (Punkt → Orbit → Phase-Marker → Szene → Zünden).
- Inline-Validierung (kein Modal, kein Toast).
- Mikrocopy unter Form: Privacy-Hinweis (Spec §3 letzter Satz).
- **Performance:** Animations-Frames müssen 60fps halten auf Mid-Range-Mobile.
- **A11y:** `prefers-reduced-motion: reduce` deaktiviert die Wachstums-Animation, lässt aber das Form funktional.

### Phase 5 — Element-Szenen-Varianten
- Voraussetzung: Design-Tokens für 5 Element-Varianten aus Phase-0-Klärung mit `frontend-design`/`design:design-system`.
- Komponente `<ElementScene element="fire|earth|wood|metal|water">`.
- Switching basiert auf BaZi-Day-Master nach erstem Submit.
- Fallback: neutraler Default vor Submit.

### Phase 6 — Tagespuls (Phase 1 des Rituals)
- Endpoint-Verifikation: existierender Daily-Horoscope-Endpoint kann den 3-Slot-Tagespuls liefern? Wenn nein, Backend-Fix nötig — eskalieren.
- Aphorismen-Sammlung initial in `packages/voice/aphorisms/` als kuratierte Markdown-Liste mit Front-Matter (`mode: pulse|trace|spannung`, `tone: …`).
- Gemini-Prompt-Modul für Slot 2+3 (Brücke + Impuls), Slot 1 immer aus kuratierter Sammlung.
- Verbotene-Worte-Filter (Liste in Spec §9): Post-Processing-Pass, der Output blockt, wenn ein verbotenes Wort drin ist (Skorpion, Trigon, Konjunktion, Tageswetter etc.). Bei Block: regenerieren oder Fallback auf rein kuratiert.

### Phase 7 — Wahl-Geste "Setzen"
- Komponente `<RatSetzen>` mit 6 Archetyp-Tiles (Sonne, Mond, Aszendent, Day-Master, Jahrestier, Wu-Xing-Element).
- Wording verbindlich: "Welcher deiner fünf möchte heute mit diesem Puls etwas tun?" + Tap-Hint "setzen".
- Daten: User-Profil liefert die 6 konkreten Werte. Falls einer fehlt (z.B. ohne Geburtszeit kein präziser Aszendent): Tile zeigt "—" mit Tooltip "Geburtszeit für präziseren Aszendenten ergänzen".
- Append-only: einmal gesetzt, fixiert für heute. Edge-Case-Mikrocopy aus Phase-0-Klärung.

### Phase 8 — Tagesdeutung (Phase 2 des Rituals)
- Endpoint/Funktion `generateTagesdeutung(tagespuls, gewählterArchetyp)`.
- Template: 3 Beziehungs-Modi (INTEGRATION / ABGRENZUNG / SEQUENZ) je nach `day_mode`.
- 50–90 Wörter, 3–4 Sätze. Verbotene-Worte-Filter wie in Phase 6.
- UI: ersetzt visuell den Puls oder klappt darunter auf — Ben-Entscheid in Phase-0.

### Phase 9 — Below-the-fold-Drill-Down
- Sektion `<DeeperLayers>` enthält die 5 Drill-Down-Layer aus Spec §8.
- Lazy-loaded, kein Performance-Hit bei initial render.
- Klar visuell getrennt vom Ritual-Block (z.B. divider + andere Hintergrund-Tonart).

### Phase 10 — Migration anonym → angemeldet
- User klickt "An mein Konto binden": LocalStorage-Daten werden via Supabase in den Account migriert.
- Konflikt-Behandlung: bestehender Account hat schon Ring? Dann Diff-Dialog "Behalten / Überschreiben / Beides anzeigen".
- Tests für alle Migrations-Pfade.

### Phase 11 — Verifikation & Regression
- Alle 5 Erfolgs-Kriterien aus Spec §10 als E2E-Tests.
- Visueller Regressions-Check (Screenshots) für 3 User-Zustände × 5 Element-Varianten.
- Performance-Audit: First-Contentful-Paint < 1.5s, Tagesdeutung-Round-Trip < 1.5s.

---

## 4. SDS-Pflege (VERBINDLICH bei jeder Phase)

1. **`docs/docu/STRUCTURE.md`** — Komponenten-Inventar
2. **`docs/docu/FRONTEND_INTERNALS.md`** — User-Zustands-Diagramm + Routing
3. **`docs/docu/API_REFERENCE.md`** — Daily-Horoscope-Endpoint, Tagesdeutung-Funktion, Persistenz-Schema
4. **NEU: `docs/docu/HOME_ONEPAGE_RITUAL.md`** — anlegen in Phase 1. Inhalt:
   - Mission der Seite
   - 3 User-Zustände + Übergänge
   - Tagespuls-Grammatik (3 Slots)
   - Tagesdeutung-Grammatik (3 Beziehungs-Modi)
   - Element-Sprachregelung-Tabelle (Spec §9)
   - Verbotene-Worte-Liste
   - Aphorismen-Sammlung-Schema
5. **`1-objectives/goals/GOAL-home-onepage-fokus.md`** — neues Goal, Status "Approved", referenziert Spec + Handoff
6. **REQ-F-cosmic-encounter-onboarding** — Status auf "Deprecated" setzen, Verweis auf neues Goal

---

## 5. User-Stories ableiten (VERBINDLICH pro Phase)

Pro Phase: Story unter `docs/user-stories/2026-04-28/US-HOME-<phase>-<slug>.md`

Beispiel für Phase 4:

```markdown
# US-HOME-4: Organisches Anmeldeformular

**Als** anonymer First-Time-User
**möchte ich** mein Geburtsdatum in ein Formular eingeben
**das mit jeder Eingabe organisch wächst**
**damit** ich erlebe, dass meine Daten direkt etwas erschaffen — nicht ein totes Submit-Button.

## Akzeptanzkriterien (Gherkin)
- Gegeben ein anonymer User auf `/`
- Wenn er den Namen eingibt
- Dann erscheint ein Punkt im Zentral-Element binnen 200ms
- Wenn er das Geburtsdatum eingibt
- Dann formt sich um den Punkt ein Orbit binnen 400ms
- ...

## Element-Szenen-Tests
- Day-Master = 甲 (Holz) → Holz-Szene wird gerendert
- ...

## A11y
- prefers-reduced-motion: reduce → keine Wachstums-Animation, Form bleibt funktional
- Tab-Navigation funktioniert in Feld-Reihenfolge
- Screen-Reader liest "Schritt 2 von 5: Geburtsdatum"

## Verifikation
- unit-test: src/components/__tests__/OrganicBirthInput.test.tsx
- e2e-test: tests/e2e/home-anonymous-first-visit.spec.ts
- visuell: Bens Review am YYYY-MM-DD
```

---

## 6. Codemoss-Guardrails (verbindlich)

- Vor jedem Edit re-lesen, nach jedem Edit re-lesen + verifizieren.
- Files > 300 LOC: Schritt-0-Cleanup zuerst.
- Verifikation vor "done": typecheck, lint, unit-tests, visueller Review.
- Verbotene Sprache ohne Beleg: "done", "fixed", "all good".
- Routing-Änderungen (Phase 1): kein Big-Bang. Erst neue Route bauen, dann Alias, dann alte deprecaten — in **drei separaten Commits**, jeweils verifiziert.
- Animations-Code: bei `prefers-reduced-motion: reduce` immer Fallback testen.

---

## 7. Was du in diesem Sprint NICHT tust

- Kein Premium-Paywall-Mechanismus (eigener Sprint).
- Keine Voice-Layer / Audio-Layer (eigener Sprint).
- Keine Quiz-Integration into the Wahl-Geste (Quizzes schärfen Slots, das ist späterer Sprint).
- Keine Couple-Signature / Matching-Features.
- Kein Marketing-Content-Block above-the-fold (die Seite ist Anmeldung, nicht Werbung — die Werbung kommt durch das Erlebnis selbst).
- Keine Morning-Mail-Integration (eigener Sprint, aber diese Seite ist Empfangsort des Mail-Klicks).

---

## 8. Eskalations-Anker (stoppe, frag Ben)

Stoppe und frag Ben, wenn:
- Phase-0-Verifikation zeigt, dass Memory-Claims (`day_mode`, BAFE-Pipeline, FusionRingCanvasV2) nicht mehr stimmen
- Eine der 5 Lücken aus Spec §11 nicht innerhalb von 30min Klärung-Roundtrip gelöst werden kann
- Animation-Performance unter 60fps fällt und kein Fix > 2h Aufwand
- Routing-Konsolidierung breaks anderen Code-Pfad, der nicht in der Spec stand
- Verbotene-Worte-Filter einen Tagespuls > 30% der Zeit blockt (dann ist Aphorismen-Sammlung oder Gemini-Prompt zu schwach — Editorial-Eingriff nötig)

---

## 9. Phase-Abschluss-Format

```markdown
### Phase <n>: <Titel> — [DONE / HALT]

**Geändert / Erstellt:**
- file1.tsx
- file2.ts

**SDS-Updates:**
- HOME_ONEPAGE_RITUAL.md: [was]
- STRUCTURE.md: [was]

**User-Story:**
- docs/user-stories/2026-04-28/US-HOME-<n>-<slug>.md

**Verifikation:**
- typecheck: passed
- lint: passed
- unit-tests: X/X passed
- e2e-tests: passed / pending
- visuell: <Screenshot oder "pending-Ben-Review">
- a11y: prefers-reduced-motion verifiziert / Tab-Nav verifiziert

**Spec-Adherence:**
- §<n>: ✓ / Abweichung mit Begründung

**Remaining risks:**
- [spezifisch]

**Confidence:** high / medium / low

**Nächste Phase:** bereit / HALT mit Frage: <Frage>
```

---

## 10. Kick-Off

```
Du bist Claude Code und arbeitest am Bazodiac-Projekt (Astro-Noctum).

Lies VOLLSTÄNDIG und in dieser Reihenfolge:
1. docs/plans/2026-04-28-handoff-home-onepage-fokus.md  (dein Arbeitsauftrag — dieses Dokument)
2. docs/plans/2026-04-28-spec-home-onepage-fokus.md     (die Spec, Source of Truth)
3. docs/KOHAERENZ_INDEX.md                             (Produkt-Gesetz für Tagespuls-Modulation)
4. 1-objectives/requirements/REQ-F-cosmic-encounter-onboarding.md (alter Flow — wird ersetzt)
5. 1-objectives/requirements/REQ-F-progressive-ui-fluidity.md (Fluidity-Mechanik)
6. 1-objectives/requirements/REQ-F-orbital-signatur-visualization.md (Ring)
7. 1-objectives/requirements/REQ-F-onboarding-display-name.md (Name-Slot)

Voraussetzung: Sprint Dashboard-Gaps und Sprint Quiz-Coupling Sprint 1 sind beide grün.
Falls nicht: STOP und frag Ben.

Starte mit PHASE 0 — KEIN CODE-CHANGE.
- Verifiziere alle Memory-Claims gegen den aktuellen Codestand
- Liste alle 5 Lücken aus Spec §11 mit konkreten Klärungsfragen
- Erstelle eine Risiko-Map für die Routing-Konsolidierung

Liefere den Phase-0-Report an Ben. Warte auf "go" und auf Antworten zu den Lücken.
Erst dann Phase 1.

Codemoss-Guardrails durchgehend. Verbotene Sprache ohne Verifikationsbeleg: "done", "fixed", "all good".
Reibung erlaubt — sag, wenn Spec und Code widersprechen.
```

---

## 11. Bens Erwartung

Ehrlich, sauber, schritt-für-schritt. Diese Seite ist das Produkt — wenn sie nicht trägt, trägt nichts. Reibung ist erlaubt. Reifung ist das Ziel. Wenn etwas in der Spec unklar ist: stopp, frag, repariere.

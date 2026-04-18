# Implementationsplan — V1/V2/V3 komplett entfernen, Cymatics-Signatur finalisieren

**Status:** Approved — Entscheidungen getroffen 2026-04-18 · **Zielagent:** Claude Code Opus 4.7
**Autor:** Claude (Cowork-Session) · **Owner:** Ben (PO)
**Letzte Aktualisierung:** 2026-04-18 (Ben-Entscheidungen zu Abschnitt 8 eingearbeitet, Phase I ergänzt · Review-Pass: Handoff-Phasenliste vervollständigt (→H→I), Reihenfolge strikt sequenziell geschärft)

---

## 0. North Star

Die einzige Signatur-Darstellung in der Bazodiac-App ist die **Cymatics-Engine**
(BaZi → Chladni-Parameter → `SignaturCymaticsCanvas` / `CymaticsFallback`) in
2D plus ein **gleichrangiger 3D-Ansichtsmodus** (Three.js-Sphäre mit Chladni-
Verschiebung, basierend auf dem reparierten Prototyp aus `Cymantics/`).

V1 (`FusionRingWebsiteCanvas`), V2 (`FusionRingCanvasV2`) und V3
(`SignaturV3Canvas`) werden — inklusive aller Feature-Flags, Utility-Funktionen,
Call-Sites, Tests und Canvas-Dateien — **aus Produktion und Codebase entfernt**.
Keine Fallback-Chain, keine Toggle-Pfade.

Zusätzlich wird die **Begrifflichkeit „Fusion Ring" aus der Syntax entfernt**
(Ben: *„Das Fusion Ring ist von der Syntax weg und aus. Es gibt keinen Fusion
Ring mehr."*). Komponentennamen, Hooks, Ordner, i18n-Keys, Kommentare und Types,
die „fusionRing" / „FusionRing" / „fusion-ring" enthalten, werden in einer
dedizierten Phase I zu „signatur" umbenannt.

**Definition of Done:**
- `grep -ri "V2\|V3\|FusionRingCanvas\|SignaturV3\|signature_engine_v2\|signature_engine_v3" src/` → 0 Treffer (außer in Changelog-Dokumenten).
- `grep -ri "fusionring\|fusion-ring\|fusion_ring" src/` → 0 Treffer.
- `npm run lint`, `npm run build`, `npm run test` grün.
- Auf allen drei Surfaces (Haupt-Signatur auf der Signatur-Page, Onboarding-Reveal,
  Dashboard-Mini) erscheint **ausschließlich** Cymatics — 2D als Default,
  3D per Toggle.
- Dashboard-Integration von `MiniSignature` (Cymatics-Mini) ist vorbereitet und
  bei Bedarf aktivierbar.

---

## 1. Ausgangslage (Stand 2026-04-18, Phase B abgeschlossen)

| Komponente / Flag | Zustand | Anmerkung |
|---|---|---|
| `src/components/fusion-ring-3d/FusionRing3D.tsx` | ✅ Cymatics-only | Phase B — typecheck grün |
| `src/lib/feature-flags.ts` — `signature_engine_cymatics` | ✅ `true` | bleibt (wird in Phase E zum Default ohne Flag) |
| `src/lib/feature-flags.ts` — `signature_engine_v3` | ⚠️ `true` | Wird in Phase E gelöscht |
| `src/lib/feature-flags.ts` — `signature_engine_v2` | ⚠️ `true` | Wird in Phase E gelöscht |
| `src/components/onboarding/SignatureReveal.tsx` | ❌ rendert V1/V2/V3 | Phase C1 |
| `src/components/onboarding/FusionRingReveal.tsx` | ❌ rendert V2 direkt | Phase C1 |
| `src/components/dashboard/MiniSignature.tsx` | ⚠️ rendert V3, **aber orphaned** (Dashboard.tsx:30 Kommentar bestätigt, dass sie aus Grid entfernt ist) | Phase C2 (löschen oder Cymatics-Mini) |
| `src/components/fusion-ring-website/FusionRingWebsiteCanvas.tsx` (V1, 1796 LOC) | ❌ lebendig | Phase F — Datei löschen |
| `src/components/fusion-ring-website/FusionRingCanvasV2.tsx` (V2, 1479 LOC) | ❌ lebendig | Phase F — Datei löschen |
| `src/components/signatur-v3/` (V3, 519 LOC Canvas + Engine-Module) | ❌ lebendig | Phase F — Ordner löschen |
| `src/lib/signatur/weight-utils.ts` (`toDimensionWeightsOrUndefined`, `toNatalWeightsOrUndefined`) | ⚠️ nur V2/V3-User | Phase F — löschen wenn keine externen Call-Sites |
| `src/components/fusion-ring-website/signatur-bridge.ts` | ⚠️ Kompat-Shim | Phase F — löschen |
| Tests: `signatur-reveal-v2`, `mobile-v2-parity`, `webgl-fallback`, `mini-signature-*`, `signatur-v3-performance`, `cluster-burst-trigger`, `fusion-ring-postprocess-degraded`, `signatur-theme-aware`, `cymatics-integration` (V-Chain-Teile), `feature-flags` (V2/V3-Teile) | ❌ | Phase D/G — löschen oder umschreiben |
| `Cymantics/` Prototyp (3D, Three.js) | ✅ compile-ready | Phase H (optional) — 3D-View |

---

## 2. Architektur-Zielbild (nach Abschluss)

```
┌──────────────────────────────────────────────────────────────┐
│  Daten: BaZi-Säulen + Wu-Xing-Gewichte + Harmonie-Index      │
│         │                                                     │
│         ▼                                                     │
│  src/lib/cymatics/bazi-to-chladni.ts                          │
│         │  ChladniParams { m, n, amplitude, timeScale,        │
│         │                  dominantElement, ... }             │
│         ▼                                                     │
│  src/components/signatur-cymatics/SignaturCymaticsCanvas.tsx  │
│         │  Canvas2D — primärer Renderer                       │
│         └─ onFailed? ─► CymaticsFallback.tsx (CSS/SVG)        │
│                                                               │
│  Optional (Phase H):                                          │
│  src/components/signatur-cymatics-3d/SignaturCymaticsCanvas3D │
│         │  Three.js SphereGeometry + Chladni-Verschiebung     │
│         └─ onFailed? ─► CymaticsFallback.tsx                  │
└──────────────────────────────────────────────────────────────┘

Call-Sites (alle drei rendern NUR Cymatics — kein V/Chain):
  • src/pages/FuRingPage.tsx           → FusionRing3D (bereits Cymatics-only)
  • src/components/onboarding/…        → SignatureReveal + FusionRingReveal (Phase C1)
  • src/components/dashboard/…         → MiniSignature (Phase C2; evtl. löschen)
```

Kein `isFeatureEnabled('signature_engine_*')` mehr in Render-Code. Der Flag
`signature_engine_cymatics` entfällt in Phase E, weil Cymatics nicht mehr
optional ist.

---

## 3. Rote Linien / Guardrails für den ausführenden Agenten

Diese Regeln stammen aus `codemoss-agent-guardrails` und sind bindend:

1. **Read-before-edit, read-after-edit.** Jede Datei vor und nach jeder Änderung lesen.
2. **Nicht mehr als 5 Dateien pro Phase.** Wenn eine Phase mehr Dateien berührt,
   wird sie in Teil-Phasen geteilt (C1a, C1b, …).
3. **Step 0 Cleanup** vor strukturellen Refactors auf Dateien >300 LOC: unused imports,
   dead props, Debug-Logs zuerst entfernen — getrennt committen.
4. **Kein „done" ohne Verification.** Nach jeder Phase: `npx tsc --noEmit`
   (Astro-Noctum-Root) und die Phase-spezifischen Tests. Completion-Sprache:
   *"geändert und verifiziert"* oder *"geändert, noch nicht verifiziert, offen: …"*.
5. **Kein Band-Aid bei Root-Cause.** Wenn ein Test auf ein entferntes V-Modul
   verweist, wird der Test umgeschrieben oder gelöscht — nicht das V-Modul
   „vorübergehend" belassen.
6. **Grep ist keine semantische Analyse.** Bei jedem Rename / Entfernen:
   direkte Calls, Typ-Referenzen, dynamische Imports, Barrel-Files, Tests,
   String-Literale mit dem Identifier getrennt suchen.
7. **Call-Site-Stabilität.** In Phase C bleiben Props auf Interfaces `@deprecated`,
   bis Phase E sie entfernt. So lässt sich jede Phase einzeln mergen.
8. **Commit pro Phase.** Jede Phase endet mit einem atomaren Commit, dessen
   Nachricht den Phase-Identifier (z. B. `refactor(signatur): phase C1 — migrate onboarding reveal to cymatics`) enthält.

---

## 4. Phasenplan

### Phase C1 — Onboarding-Reveal auf Cymatics migrieren, `FusionRingReveal` löschen
**Ziel:** Es gibt **genau eine** Reveal-Komponente — `SignatureReveal.tsx` — die
Cymatics rendert. `FusionRingReveal.tsx` wird in dieser Phase komplett entfernt
(Ben-Entscheidung zu Frage 2: *„Wir brauchen nur ein Signature Reveal. Das Fusion
Ring ist von der Syntax weg und aus."*).

**Dateien (≤ 5):**
1. `src/components/onboarding/SignatureReveal.tsx` (umbau)
2. `src/components/onboarding/FusionRingReveal.tsx` (löschen)
3. `src/components/onboarding/CosmicEncounter.tsx` (Import/Render-Zweig auf `FusionRingReveal` entfernen)
4. `src/lib/cymatics/bazi-to-chladni.ts` (evtl. erweitern für Preview-Helper)
5. `src/components/signatur-cymatics/CymaticsFallback.tsx` (Read-only)

**Vorgehen:**
1. **Read** alle 5 Dateien vollständig. `CosmicEncounter.tsx` hat beide Reveals als
   `lazy()`-Imports; Props-Flow verstehen (`natalWeights`, `quizWeights`, `revealProgress`).
2. **Morph-Animation (Ben-Entscheidung zu Frage 1: nice-to-have, nur wenn sauber):**
   - Primär: Option A — `natalWeightsToChladniPreview(weights, progress)` in
     `bazi-to-chladni.ts` ergänzen. Interpoliert zwischen neutralen
     ChladniParams (`m=3, n=3, amp=0.4`) und gewichts-abgeleiteten Params
     entlang `progress ∈ [0,1]`. Deterministisch.
   - **Abbruch-Kriterium:** Wenn die Morph-Animation nach einem ersten
     Implementierungsversuch visuell unruhig, springend oder performance-
     problematisch ist, **direkt auf Option B umschalten** — statisches
     `CymaticsFallback` während der Reveal-Animation, ohne Canvas. Ben
     explizit: *„Brauchst Du nicht, dass es gut funktioniert. Und sauber
     aussieht."* Lieber sauber-statisch als unsauber-dynamisch.
   - Die Entscheidung A↔B wird in einer **Zwischen-Review** mit Ben
     festgelegt, nicht im Alleingang. Kurzes Video/Screenshot reicht.
3. **Implementieren** (Reihenfolge):
   - `bazi-to-chladni.ts`: Helper `natalWeightsToChladniPreview(weights, progress)` ergänzen.
   - `SignatureReveal.tsx`: `isFeatureEnabled('signature_engine_v3/v2')`,
     `canRunV2()`, `useV3`/`useV2`, `toDimensionWeightsOrUndefined`,
     `toNatalWeightsOrUndefined`, die drei lazy imports — alle raus. Ein einziges
     `<Suspense><SignaturCymaticsCanvas params={previewParams} /></Suspense>`
     mit `previewParams = natalWeightsToChladniPreview(natalWeights, revealProgress)`.
     Wenn `natalWeights` fehlen oder Option B gewählt wird: `<CymaticsFallback />`.
   - `CosmicEncounter.tsx`: Den `lazy()`-Import für `FusionRingReveal` und den
     zugehörigen Render-Zweig (Line ~331) entfernen. Nur noch `SignatureRevealLazy`.
   - `FusionRingReveal.tsx` **löschen** (`rm`). Erst nachdem alle Referenzen weg sind.
4. **Read-after-edit** aller geänderten Dateien.

**Verification (Phase C1):**
- `npx tsc --noEmit` — erwartet: grün. Falls Fehler in `encounter-quiz-phase.test.tsx`
  auftauchen (Mock-Pfade für `FusionRingReveal`), Mock in der gleichen Phase
  anpassen — sonst bleibt der Test-Lauf kaputt.
- `npx vitest run src/__tests__/signatur-reveal-v2.test.tsx` — erwartet: rot
  (Test referenziert V2). In Phase D **löschen**, nicht reparieren.
- `grep -r "FusionRingReveal" src/` → 0 Treffer.
- Manuell starten (`npm run dev`), Onboarding durchlaufen, prüfen dass Reveal
  das Cymatics-Muster zeigt. Bei Option A: Morph-Animation flüssig?
  Bei Option B: statischer Fallback sauber?

**Risiken:** Morph-Animation sieht in Cymatics anders aus als in der V-Chain.
Das ist beabsichtigt, aber UX-Review durch Ben vor dem Commit einplanen.

---

### Phase C2 — MiniSignature auf Cymatics-Mini umbauen (Ben-Entscheidung: C2b)
**Ziel:** `MiniSignature.tsx` wird auf Cymatics umgestellt und für die
Dashboard-Re-Integration bereit gehalten.

**Kontext:** `Dashboard.tsx:30` Kommentar *"MiniSignature removed from dashboard grid —
coherence-first layout"* bestätigt, dass die Komponente aktuell nicht gerendert wird.
Ben hat entschieden: **erhalten** für spätere Dashboard-Integration — also Umbau
statt Löschung.

**Vorgehen:**
1. **Read** `MiniSignature.tsx`, `Dashboard.tsx` (für Props-Flow-Verständnis),
   `SignaturCymaticsCanvas.tsx`.
2. **Umbau:**
   - V3-Lazy-Import (`SignaturV3Canvas`) raus.
   - Props-Interface bereinigen: `natalWeights`, `quizWeights`, `dayHarmonic`,
     `externalDissonance`, `solarModulation` entfernen — stattdessen
     `chladniParams?: ChladniParams` als einzige Daten-Prop.
   - Pause-Toggle bleibt (UX-Wert), aber steuert jetzt den Cymatics-Canvas.
   - 200 × 200 px Darstellung, `planetariumMode` aus Prop.
3. **Tests umschreiben:**
   - `mini-signature-fallback.test.tsx` → prüft jetzt `CymaticsFallback`-Render
     bei `chladniParams === undefined`.
   - `mini-signature-pause.test.tsx` → prüft Pause-Toggle auf Cymatics-Canvas.
4. **Datei umbenennen:** `MiniSignature.tsx` bleibt als Name (generisch genug),
   aber interne Bezeichnung im Kommentar/Doku von „MiniSignature (V3)" →
   „MiniSignature (Cymatics)".

**Verification:** `npx tsc --noEmit` grün, beide Tests grün,
`grep -r "SignaturV3Canvas" src/components/dashboard/` → 0 Treffer.

---

### Phase D — Test-Landschaft aufräumen (erste Runde, nur V2/V3-spezifisch)
**Ziel:** Alle Tests, die ausschließlich V2/V3 abprüfen, löschen oder umschreiben.
Tests für Cymatics und generische Verhalten (Reduced-Motion, Fallback-States)
bleiben.

**Dateien (≤ 5 pro Teil-Phase — wenn mehr, splitten in D1/D2/…):**

Zu löschen:
- `src/__tests__/signatur-reveal-v2.test.tsx` (V2 spezifisch)
- `src/__tests__/mobile-v2-parity.test.ts` (V2 spezifisch)
- `src/__tests__/webgl-fallback.test.ts` (testet V1/V2-Chain-Fallback — obsolet)
- `src/__tests__/signatur-v3-performance.test.ts`
- `src/__tests__/cluster-burst-trigger.test.ts`
- `src/__tests__/fusion-ring-postprocess-degraded.test.ts`
- `src/__tests__/signatur-theme-aware.test.ts` (Palette-Tests für V1/V2)

Zu überarbeiten:
- `src/__tests__/cymatics-integration.test.tsx`: Alle `localStorage.setItem('ff_signature_engine_cymatics', …)`-
  Setups auf „Cymatics ist immer an" reduzieren.
- `src/__tests__/feature-flags.test.ts`: V2/V3-Tests raus, Cymatics-Test bleibt.
- `src/__tests__/FusionRing3D.test.tsx`: prüfen, dass keine V-Chain-Assertions mehr drin sind.
- `src/__tests__/mini-signature-*.test.tsx`: je nach C2-Entscheidung löschen oder umschreiben.
- `src/__tests__/encounter-quiz-phase.test.tsx`: Mock-Setup auf Cymatics umziehen.

**Vorgehen:**
1. Vor dem Löschen: `npx vitest run <datei>` lokal, Ist-Verhalten verstehen.
2. Löschen via `rm` (Cowork-Delete-Permission prüfen — `allow_cowork_file_delete`).
3. Umschreiben: ein Test pro Commit.

**Verification:** `npx vitest run` grün. `npx tsc --noEmit` grün.

---

### Phase E — Feature-Flags entfernen (alle drei Signatur-Engine-Flags)
**Ziel:** `signature_engine_v2`, `signature_engine_v3` **und** `signature_engine_cymatics`
aus `feature-flags.ts` entfernen (Ben-Entscheidung zu Frage 4 an Claude delegiert;
Empfehlung: **alle drei weg**, weil `CymaticsFallback` der automatische Notfallpfad
bei Canvas-Fehlern ist — ein zusätzlicher Kill-Switch-Flag brächte keinen neuen Nutzen,
kostet aber einen Render-Branch und Test-Verzweigungen).

**Dateien (≤ 3):**
1. `src/lib/feature-flags.ts`
2. `src/__tests__/feature-flags.test.ts`
3. Etwaige Rest-Call-Sites, die `isFeatureEnabled('signature_engine_cymatics')`
   verwenden (Stand 2026-04-18: `FuRingPage.tsx` Line 338 + 370 → hart verdrahten,
   weil Cymatics Default ist).

**Vorgehen:**
1. Grep: `grep -rn "signature_engine_" src/`
2. Alle Vorkommen durchgehen:
   - `v2`/`v3`: Call-Site existiert eh nicht mehr nach Phase C → Flag löschen.
   - `cymatics`: Condition durch `true` ersetzen, dann Branch aufräumen.
3. `CRITICAL_FLAGS`-Array in `feature-flags.ts` kürzen.
4. `validateCriticalFlags()` bleibt für andere Flags (`signature_onboarding_v1`,
   `daily_modal_v1`).

**Verification:** `npx tsc --noEmit` grün. `npx vitest run` grün.
`grep -r "signature_engine" src/` → keine Treffer.

---

### Phase F — V1/V2/V3-Komponenten-Dateien löschen
**Ziel:** Die 3794 LOC V-Chain-Code und Hilfsmodule sind weg.

**Zu löschende Dateien / Ordner:**
- `src/components/fusion-ring-website/` (ganzer Ordner — V1 + V2 + `signatur-bridge.ts`)
- `src/components/signatur-v3/` (ganzer Ordner — V3 Canvas + Bipolar-Engine + Support)
- `src/lib/signatur/weight-utils.ts` — **nur wenn** Grep keine andere Nutzung mehr zeigt
- ggf. weitere Support-Module: `src/lib/fusion-ring/dissonance.ts`,
  `src/lib/fusion-ring/dissonance-visual.ts`, `src/lib/fusion-ring/day-harmonic.ts`
  → **einzeln prüfen**, ob sie noch außerhalb der V-Chain genutzt werden
  (z. B. von Transit-Features). Wenn ja: bleiben, Import-Kette bereinigen.

**Vorgehen:**
1. Vor dem Löschen: `grep -rn "fusion-ring-website\|signatur-v3" src/` → darf nur
   Self-Referenzen innerhalb der zu löschenden Ordner zeigen.
2. Wenn externe Referenz gefunden: Plan **anhalten**, Dateien einzeln migrieren,
   dann zurückkehren.
3. Löschen: `rm -rf src/components/fusion-ring-website src/components/signatur-v3`.
4. Gleiche Prüfung für `weight-utils.ts` und Fusion-Ring-Support-Module.

**Verification:** `npx tsc --noEmit` grün. `npx vitest run` grün. `npm run build`
erfolgreich. Bundle-Size-Check: erwartete Reduktion ~ 60–80 KB gzip durch Three.js-
Entfall (falls V2 Three.js nutzte) oder ähnliche Größenordnung.

---

### Phase G — Tests-Aufräumen, zweite Runde
**Ziel:** Alles was nach Phase F noch an toten Test-Utilities / Mocks /
Snapshot-Files übrig ist, wird entfernt. Abdeckung für die neue Cymatics-Pfade
wird ergänzt.

**Neue Tests (falls nicht vorhanden):**
- `SignaturCymaticsCanvas` rendert ohne Crash bei definierten `ChladniParams`.
- `CymaticsFallback` rendert pro `dominantElement` (Water, Fire, Earth, Wood, Metal).
- Onboarding-Reveal: Morph-Animation setzt `revealProgress` korrekt voran.
- FusionRing3D: DEV-Panel zeigt Resolution + Kp.

**Verification:** `npx vitest run --coverage` — Coverage für
`src/components/signatur-cymatics/**` ≥ 70 %.

---

### Phase H — 3D-Ansichtsmodus aus Cymantics-Prototyp (Ben-Entscheidung: jetzt bauen)
**Ziel:** Den reparierten Prototyp aus `Cymantics/` als **gleichrangigen zweiten
Ansichtsmodus** in die App integrieren. 2D bleibt Default, 3D per Toggle auf
der Signatur-Page. Iterative Stabilisierung nach Erst-Integration.

**Ben-Entscheidung zu Frage 5:** *„jetzt bauen, ja, jetzt bauen, stabilisieren
machen wir iterativ."* → Phase H läuft regulär, nicht optional.

**Dateien (≤ 5):**
1. `Cymantics/SignatureCanvas.tsx` → `src/components/signatur-cymatics-3d/SignaturCymaticsCanvas3D.tsx` (kopieren + anpassen)
2. `Cymantics/cymatics.ts` → `src/components/signatur-cymatics-3d/cymatics.ts`
3. `Cymantics/planetaryFrequencies.ts` → `src/components/signatur-cymatics-3d/planetaryFrequencies.ts`
4. `src/pages/FuRingPage.tsx` (Toggle-Button + State-Gate; wird in Phase I
   sowieso umbenannt — hier nur minimal-invasiv editieren)
5. `src/components/fusion-ring-3d/FusionRing3D.tsx` (Prop `renderMode?: '2d' | '3d'`;
   wird in Phase I umbenannt zu `SignaturRenderer.tsx`)

**Mapping-Arbeit:** Der Prototyp nimmt eine `Date` und erzeugt `weights: number[]`.
Für die App-Integration muss die BaZi-Eingabe → `weights` gemappt werden (entweder
`ChladniParams` in `weights` übersetzen oder `computeSignatureWeights(birthdate)`
beibehalten und neben Cymatics-2D laufen lassen). Entscheidung: direkt BaZi →
Gewichte über ein neues `bazi-to-planet-weights.ts`.

**Verification:** typecheck + manuelles UX-Review. Performance-Budget:
3D-Render bei 60 fps auf Macbook-Pro, <45 fps auf mobil akzeptabel.

---

### Phase H — Mikro-Split (eingepflegt 2026-04-18, Session-H-Start)

**Stack-Entscheidung (transparent):**
- Repo hat bereits `three@0.175.0` + `@react-three/fiber@9.5.0` + `@react-three/drei@10.7.7`.
- Ben-Spec sagte „Three.js r128" (=v0.128, Legacy von 2021). **Wir nutzen die installierte v0.175** + R3F. Keine neue Dep, moderne API statt r128-Spec. Abweichung dokumentiert hier.
- R3F statt plain Three.js: idiomatischer in React 19, drei liefert Helpers (Sphere, Text, Line, Trails), keine Canvas-Lifecycle-Arbeit.

**Daten-Pipeline-Entscheidung (transparent):**
- `BootstrapResponseSchema` hat KEINE 10-Planet-Weights — nur `soulprint_sectors: number[12]`, `signature_blueprint.{visual, elements}`, `profile.harmony_index`.
- **Entscheidung:** Pure-Function-Adapter `soulprintToPlanetWeights(sectors: number[12]): Record<PlanetName, number>` via klassischer zodiakaler Rulership-Matrix (Aries→Mars, Taurus→Venus, Gemini→Mercury, Cancer→Moon, Leo→Sun, Virgo→Mercury, Libra→Venus, Scorpio→Mars/Pluto, Sagittarius→Jupiter, Capricorn→Saturn, Aquarius→Saturn/Uranus, Pisces→Jupiter/Neptune).
- Das ist **deterministische Derivation aus echten Bootstrap-Daten** — kein Mock, keine erfundenen Zahlen. Ben-Regel „nur echte Zahlen wo echte Zahlen sind" bleibt eingehalten.

**Mikro-Phasen (15–30 Min pro Commit, Time-Box + Hard-Abort wie bisher):**

| # | Scope | Files | Box / Abort |
|---|-------|-------|-------------|
| H1 | Planet-Tabelle (10 Cousto) + Rulership-Adapter + Unit-Tests | 2 new (`lib/signatur-3d/planets.ts`, `lib/signatur-3d/soulprint-to-planets.ts`) + 1 test | 20 / 30 |
| H2 | Chladni-Sphere-Math (displacement, pole positions, trail-paths) pure functions + Unit-Tests | 1 new (`lib/signatur-3d/sphere-chladni.ts`) + 1 test | 25 / 35 |
| H3 | R3F Sphere-Component, static (no animation, no trails) + Smoke-Test | 1 new (`components/signatur-3d/SignatureSphere3D.tsx`) + 1 test | 25 / 35 |
| H4 | Pole-Glyphen + Trails zwischen dominanten Polen (Tube-Curves) | edits to H3 component | 25 / 35 |
| H5 | Animation (rotation + standing-wave phase via useFrame) | edits to H3 component | 20 / 30 |
| H6 | 2D↔3D Toggle in `FusionRing3D.tsx` — beide mounted, CSS-visibility (kein Cymatics-Reset) | edit FusionRing3D + Integration-Test | 25 / 35 |
| H7 | Device-Mode-Check iPhone 14 (DevTools), pixel-ratio cap, perf-note für Ben (kein Commit wenn keine Fix nötig) | optional edit SignatureSphere3D | 15 / 25 |

**Ship-Kriterium:** Sphere rendert deterministisch mit echten Bootstrap-Daten, individuell pro User. Desktop + iPhone 14 simuliert via Chrome DevTools Device-Mode + Throttling. Hardware-Test später (Ben).

**Nicht in H-Scope:** Rename (Phase I), `src/lib/fusion-ring/` anfassen (Phase I5), MiniSignature-Dashboard-Re-Integration, neue BaZi-Berechnungen.

---

### Phase I — Rename „FusionRing" / „fusion-ring" → „Signatur" / „signatur"
**Ziel:** Die Begrifflichkeit „Fusion Ring" ist aus der Syntax verschwunden
(Ben: *„Das Fusion Ring ist von der Syntax weg und aus. Es gibt keinen Fusion
Ring mehr."*). Komponenten, Hooks, Ordner, Types, i18n-Keys und Kommentare
spiegeln die Cymatics-Realität wider.

**Scope-Kartierung (Grep-basiert, vor Start präzisieren):**

| Art | Alt | Neu |
|---|---|---|
| Komponenten-Ordner | `src/components/fusion-ring-3d/` | `src/components/signatur-renderer/` |
| Komponente | `FusionRing3D` | `SignaturRenderer` |
| Type | `FusionRing3DProps`, `FusionRing3DLabels` | `SignaturRendererProps`, `SignaturRendererLabels` |
| Hook | `useFusionSignal` | `useSignaturSignal` |
| Page | `FuRingPage.tsx` | `SignaturPage.tsx` (Route-Pfad ggf. anpassen) |
| Route | `/fu-ring`, `/fusion-ring` (falls vorhanden) | `/signatur` |
| i18n-Keys | `fusionRing.*`, `fusion_ring.*` | `signatur.*` (Migration in `de.json`, `en.json`) |
| Test-Dateien | `FusionRing3D.test.tsx` | `SignaturRenderer.test.tsx` |
| Kommentare / JSDoc | „Fusion Ring" | „Signatur" |
| Lib-Ordner | `src/lib/fusion-ring/` — **Vorsicht**, enthält `dissonance`, `day-harmonic` die evtl. weiter genutzt werden | Einzeln prüfen; nur umbenennen was zur Signatur gehört |

**Vorgehen (Teil-Phasen, weil >5 Dateien):**

**I1 — Komponenten-Rename:**
- `src/components/fusion-ring-3d/*` → `src/components/signatur-renderer/*`
- `FusionRing3D` → `SignaturRenderer` in allen Imports
- Typecheck nach jedem Rename-Step

**I2 — Page/Route-Rename:**
- `FuRingPage.tsx` → `SignaturPage.tsx`
- Router-Config anpassen (Datei je nach Stack — vermutlich `src/App.tsx` oder `src/router.tsx`)
- Redirect von alter Route auf neue Route für 30 Tage (SEO / Bookmark-Kompatibilität)

**I3 — Hook-Rename:**
- `useFusionSignal` → `useSignaturSignal`
- `src/hooks/useFusionSignal.ts` → `src/hooks/useSignaturSignal.ts`
- Alle Call-Sites aktualisieren

**I4 — i18n-Rename:**
- `public/locales/de.json`, `public/locales/en.json` (oder vergleichbarer Pfad)
- Keys `fusionRing.*` → `signatur.*`
- In allen `t('fusionRing...')`-Aufrufen umstellen
- **Vorsicht:** Diese Änderung kann bei unvollständiger Migration zu fehlenden
  Übersetzungs-Strings führen. Pro Locale separat verifizieren.

**I5 — Lib-Prüfung:**
- `src/lib/fusion-ring/` durchgehen. Jede Datei prüfen:
  - Wird sie von Cymatics-Code genutzt? → in `src/lib/signatur/` verschieben.
  - Wird sie nirgends mehr genutzt (war V2/V3-Support)? → in Phase F hätte sie
    schon fallen sollen; jetzt nachholen.
- Ordner `src/lib/fusion-ring/` soll am Ende leer sein und gelöscht werden.

**Verification pro Teil-Phase:**
- `npx tsc --noEmit` grün
- `npx vitest run` grün
- `grep -ri "fusionring\|fusion-ring\|fusion_ring\|FusionRing" src/` → 0 Treffer
  (nur Strings in Changelogs/Archive-MD sind OK)
- Manuelle Smoke-Tests: Onboarding, Signatur-Page, Dashboard, i18n-Switch DE/EN.

**Risiken:**
- i18n-Umstellung führt leicht zu fehlenden Keys → falls CI/Lint dies nicht
  fängt, manueller Durchgang pro UI-Ansicht.
- Route-Rename kann externe Links / Lesezeichen brechen → Redirect-Policy
  explizit mit Ben abstimmen, ob 30 Tage ausreichend sind.
- Der Ordner `src/lib/fusion-ring/` enthält `dissonance.ts`, `dissonance-visual.ts`,
  `day-harmonic.ts` — wenn diese in Sky-Features (Transit-Banner, Aurora-Layer)
  genutzt werden, **nicht** einfach verschieben, sondern kopieren + refactor.

---

## 5. Reihenfolge & Abhängigkeiten

```
C1 ──► C2 ──► D ──► E ──► F ──► G ──► H ──► I
              │     │     │     │     │     │
              │     │     │     │     │     └─ Rename, darf erst laufen,
              │     │     │     │     │         wenn V-Chain-Rest weg ist
              │     │     │     │     └─ 3D-Ansicht, benötigt stabilen
              │     │     │     │         Cymatics-Render in 2D
              │     │     │     └─ Test-Feintuning, blockiert durch F
              │     │     └─ Dateien löschen, blockiert durch E (Flags weg)
              │     └─ Flags weg, blockiert durch D (Tests weg)
              └─ Test-Stack säubern, blockiert durch C1+C2 (Call-Sites weg)
```

**Keine Parallelisierung.** Alle Phasen werden strikt sequenziell ausgeführt:
`C1 → C2 → D → E → F → G → H → I`. Gründe:

- Phasen C1 bis G berühren Shared-Utils (`weight-utils`, Feature-Flags) —
  parallele Arbeit erzeugt Kopplungs-Konflikte.
- Phase I (Rename) benötigt einen **stabilen Render-Pfad** aus H, weil der
  3D-Toggle-Code sonst in einer Datei landet, die in der gleichen Session
  umbenannt wird — das erzeugt unnötige Merge-Schmerzen und fehleranfällige
  Import-Paths.
- Review-Zyklus zwischen jeder Phase mit Ben: tägliche Freigabe, keine
  Batch-Reviews.

---

## 6. Rollback-Strategie

Jede Phase = ein atomarer Commit auf einem Feature-Branch (`refactor/remove-v123`).
Rollback pro Phase via `git revert <sha>`. Deployment erst nach Phase G erfolgreich
auf Staging. Staging-Freeze-Fenster: min. 48 h für UX-Review auf Onboarding.

**Kritische Rücksetzpunkte:**
- Nach C1: Onboarding auf Staging durchtesten. Wenn UX-Review scheitert → revert C1,
  alternative Reveal-Variante (Option B, nur `CymaticsFallback`) implementieren.
- Nach F: Visuelle Regression auf FuRingPage. Wenn Cymatics-Canvas nicht rendert
  (z. B. `chladniParams`-Lücke in bestimmten BaZi-Konstellationen) → revert F,
  Root-Cause in `bazi-to-chladni.ts` suchen, dann erneut F.

---

## 7. Akzeptanzkriterien (Abnahme durch Ben)

- [ ] `grep -ri "V2\|V3\|FusionRingCanvas\|SignaturV3\|signature_engine_v2\|signature_engine_v3\|signature_engine_cymatics" src/` liefert 0 Treffer (außer in Doku/Changelog).
- [ ] `grep -ri "fusionring\|fusion-ring\|fusion_ring\|FusionRing" src/` liefert 0 Treffer (außer in Doku/Changelog).
- [ ] Onboarding-Reveal zeigt Cymatics-Muster (kein V-Chain-Artefakt).
- [ ] Signatur-Page (ex-`FuRingPage`) zeigt auf allen getesteten BaZi-Kombinationen Cymatics oder CymaticsFallback — kein schwarzer Bildschirm, kein Flackern zu V-Chain.
- [ ] 3D-Toggle schaltet sauber zwischen 2D und 3D. Kein WebGL-Leak beim Umschalten, Performance: ≥ 60 fps auf Desktop, ≥ 30 fps auf Mobil.
- [ ] MiniSignature rendert Cymatics (wenn aktiviert) und hat keine V3-Imports mehr.
- [ ] `npm run build` erfolgreich, Bundle-Size reduziert gegenüber Baseline vor C1 (Erwartung: ≥ 60 KB gzip Reduktion durch V1/V2-Entfall).
- [ ] `npm run test` grün, Coverage für `signatur-cymatics/**` und `signatur-cymatics-3d/**` ≥ 70 %.
- [ ] Reduced-Motion, Dark-Theme (planetariumMode), Light-Theme alle geprüft auf 2D und 3D.
- [ ] i18n DE und EN: keine fehlenden Keys, alle Signatur-Strings im neuen `signatur.*`-Namespace.

---

## 8. Getroffene Entscheidungen (Ben, 2026-04-18)

1. **Morph-Animation im Onboarding-Reveal:** Nice-to-have, nicht Pflicht.
   Primär Option A (Cymatics-Morph), aber nur wenn sauber und flüssig.
   Bei visuellen Problemen **sofort** Option B (statisches `CymaticsFallback`).
   Zwischen-Review mit Screenshot/Video durch Ben vor Commit.
2. **`SignatureReveal` vs. `FusionRingReveal`:** Nur eine Reveal-Komponente.
   `FusionRingReveal.tsx` wird in Phase C1 gelöscht. Begründung Ben: *„Das
   Fusion Ring ist von der Syntax weg und aus. Es gibt keinen Fusion Ring mehr."*
   → löst zusätzlich Phase I (Rename) aus.
3. **MiniSignature (Phase C2):** C2b — auf Cymatics umbauen und für spätere
   Dashboard-Integration bereithalten. Nicht löschen.
4. **`signature_engine_cymatics`-Flag:** Entscheidung an Claude delegiert.
   **Wahl: Flag entfernen** (zusammen mit V2/V3-Flags in Phase E).
   Begründung: `CymaticsFallback` ist bereits der automatische Notfallpfad
   bei Canvas-Fehlern; ein separater Kill-Switch-Flag brächte keinen neuen
   Schutz, würde aber einen Render-Branch und Test-Verzweigungen schaffen.
   Einfachheit schlägt Vorsicht hier.
5. **Phase H (3D):** Jetzt bauen. Iterative Stabilisierung.
   Ben explizit: *„jetzt bauen, ja, jetzt bauen, stabilisieren machen wir iterativ."*

## 8.1 Zusatz-Entscheidung (abgeleitet)

Aus Antwort 2 ergibt sich, dass der Begriff „Fusion Ring" komplett aus der
Codebase verschwinden soll. Dies ist als **Phase I** im Plan ergänzt und folgt
nach Phase H, weil ein stabiler Render-Pfad (2D + 3D) vor dem großflächigen
Rename gegeben sein sollte.

---

## 9. Handoff für den ausführenden Agenten (Claude Code Opus 4.7)

**Session-Kickoff-Prompt (als Block kopierbar):**

> Du bist Claude Code Opus 4.7 und führst den Implementationsplan
> `SIGNATUR_V_REMOVAL_PLAN.md` im Astro-Noctum-Projekt aus.
>
> Repo-Root: `/Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum`
> Branch: `refactor/remove-v123`
>
> **Bindende Regeln:**
> 1. Folge dem `codemoss-agent-guardrails`-Skill: read-before-edit,
>    read-after-edit, max 5 Dateien pro Phase, kein „done" ohne
>    `npx tsc --noEmit` + Phase-Tests.
> 2. Arbeite Phase für Phase in dieser **sequenziellen** Reihenfolge:
>    C1 → C2 → D → E → F → G → H → I. Keine Parallelisierung. Warte auf
>    Bens Freigabe zwischen jeder Phase.
> 3. Bei Abweichung vom Plan (unerwartete Kopplung, verschollene Datei,
>    Test-Logik unklar): **stopp**, Bericht an Ben, Plan updaten — nicht
>    selbständig improvisieren.
> 4. Commits pro Phase, Nachricht: `refactor(signatur): phase <X> — <desc>`.
>
> **Startpunkt:** Phase C1. Lies zuerst Abschnitt 0 (North Star), 1, 2,
> 4 (Phase C1), 6 und 8 (Entscheidungen) des Plans. Die Entscheidungen
> sind bereits getroffen — nicht erneut hinterfragen.
>
> **Nicht-Ziele für diese Session:** keine neuen Features, keine
> Refactors außerhalb der V-Chain-Entfernung, keine Änderungen an
> `bazi-to-chladni.ts` außer der expliziten Erweiterung aus Phase C1
> (`natalWeightsToChladniPreview`).
>
> **Abbruchbedingungen:** Falls du bei Phase C1 Morph-Animation Option A
> zu einem unsauberen visuellen Ergebnis kommst, halte an und frage Ben
> nach Go für Option B (statisches Fallback). Falls in Phase F Module
> aus `src/lib/fusion-ring/` außerhalb der V-Chain genutzt werden, halte
> an und frage Ben, bevor du löschst.

---

## 10. Zeit-Schätzung (aktualisiert mit Ben-Entscheidungen)

| Phase | Aufwand (erfahrener Dev / mit Tests) |
|---|---|
| C1 (inkl. FusionRingReveal löschen) | 4–6 h |
| C2 (C2b — Cymatics-Mini) | 3–4 h |
| D | 3–4 h |
| E (alle drei Flags raus) | 1–2 h |
| F | 2–3 h |
| G | 3–5 h |
| H (3D-Ansicht, jetzt regulär) | 6–10 h |
| I (Rename FusionRing → Signatur, in 5 Teilphasen) | 5–8 h |
| **Summe** | **27–42 h** |

Realistisches Kalender-Fenster: **5–8 Arbeitstage** mit täglicher Review
durch Ben zwischen den Phasen.

---

## 11. Quellen im Repo (Stand 2026-04-18)

- `src/components/fusion-ring-3d/FusionRing3D.tsx` (Phase B Referenz-Implementierung)
- `src/components/signatur-cymatics/SignaturCymaticsCanvas.tsx`
- `src/components/signatur-cymatics/CymaticsFallback.tsx`
- `src/lib/cymatics/bazi-to-chladni.ts`
- `src/lib/feature-flags.ts`
- `Cymantics/SignatureCanvas.tsx` (Prototyp, Phase H)
- `Cymantics/cymatics.ts`
- `Cymantics/planetaryFrequencies.ts`

---

**Ende des Plans.** Vor Start: Abschnitt 8 mit Ben durchgehen.

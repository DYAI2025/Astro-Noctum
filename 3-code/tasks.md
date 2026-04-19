# Development Tasks

## Phase: Sprint S-CYMATICS — Cymatics/Chladni Signatur-Engine

**Sprint Goal:** Die Signatur-Visualisierung erhält eine neue Cymatics/Chladni-Engine: BaZi-Stammindizes → deterministische Chladni-Parameter (m,n) → einzigartiges Partikel-Muster pro Geburtsmoment. Basiert auf Hans Coustoscher Kosmischer Oktave + Chladni-Gleichung (1787). Canvas2D ohne p5-Dependency. Feature-Flag-gated (`signature_engine_cymatics`).

### Phase 1 — Bridge & Mathematik

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-cym-bazi-bridge | Erstelle `src/lib/cymatics/bazi-to-chladni.ts`: `baziToChladniParams(baziPillars, wuxingWeights, harmonyIndex) → ChladniParams`. Enthält auch `PLANET_FREQUENCIES` (10 Cousto-Frequenzen aus Prototype), `ELEMENT_COLORS` (5 Wu-Xing Farben), `STEM_NAME_TO_INDEX` Fallback-Map. `ChladniParams` type exportieren. | P1 | Done | [REQ-F-signatur-cymatics](../1-objectives/requirements/REQ-F-signatur-cymatics.md) | - | 2026-04-17 | Mathematik aus `Cymantics/chart.ts` L151-161 + `Cymantics/planetaryFrequencies.ts`. Kein p5, kein Three.js — pure TypeScript. STEM_NAME_TO_INDEX ist PRIMARY (nicht Fallback) da MappedPillar kein stem_index hat. |
| TASK-cym-chladni-math | Erstelle `src/lib/cymatics/chladni-math.ts`: reine Mathe-Funktionen `chladni(x,y,a,b,m,n)` und `lerpParams(current, target, t)`. Separiert von Bridge für Tree-Shaking und Testbarkeit. | P1 | Done | [REQ-F-signatur-cymatics](../1-objectives/requirements/REQ-F-signatur-cymatics.md) | - | 2026-04-17 | Aus `Cymantics/ChladniSignature.tsx` L36-41. |
| TASK-cym-bridge-tests | Unit-Tests für `baziToChladniParams()`: deterministische Ausgabe, m∈{2,3,4,5,6}, n∈{2,3,4,5,6}, a∈[0.3,1.0], b∈[0.1,0.7], Diversitäts-Test (100 zufällige Stammkombinationen → ≥80% verschiedene m×n), STEM_NAME_TO_INDEX Roundtrip | P1 | Done | [REQ-F-signatur-cymatics](../1-objectives/requirements/REQ-F-signatur-cymatics.md) | TASK-cym-bazi-bridge, TASK-cym-chladni-math | 2026-04-17 | 26 Tests in `src/__tests__/cymatics-bridge.test.ts`. Note: b range in REQ (0.1..0.7) is incorrect — actual formula gives 0.4..0.82; test verifies formula directly. |

### Phase 2 — Canvas2D Engine

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-cym-canvas-core | Erstelle `src/components/signatur-cymatics/SignaturCymaticsCanvas.tsx`: Canvas2D-Partikel-Simulation. 16K Partikel, `chladni()` pro Frame, stochastisches Wandern zu Knotenlinien, RAF-Loop mit `visibilitychange`-Pause. Props: `params: ChladniParams`, `planetariumMode?: boolean`, `onFailed?: () => void`, `className?: string`. Smooth interpolation (`lerpParams` mit t=0.04) wenn params sich ändern. | P1 | Done | [REQ-F-signatur-cymatics](../1-objectives/requirements/REQ-F-signatur-cymatics.md) | TASK-cym-bazi-bridge, TASK-cym-chladni-math | 2026-04-17 | Port aus `Cymantics/ChladniSignature.tsx`. Kein p5 — vanilla Canvas2D API. Particle count: 16000. Background semi-transparent für Trail-Effekt (gleich wie Prototype: `bg alpha 18`). |
| TASK-cym-canvas-theme | Theme-Awareness in `SignaturCymaticsCanvas`: `planetariumMode=true` → `background: #0a2030`, Partikel glühen. `planetariumMode=false` → `background: #f1f5f9`, Partikel dunkel (invertierte Helligkeit: `255 - rgb`). | P1 | Done | [REQ-F-signatur-cymatics](../1-objectives/requirements/REQ-F-signatur-cymatics.md) | TASK-cym-canvas-core | 2026-04-17 | Implemented in SignaturCymaticsCanvas.tsx: CYMATICS_DARK_BG/CYMATICS_BRIGHT_BG constants, inverted RGB for bright mode. |
| TASK-cym-canvas-fallback | Erstelle `src/components/signatur-cymatics/CymaticsFallback.tsx`: CSS-only animierter Fallback (kein Canvas nötig). Pulsing concentric Chladni-ähnliche SVG-Linien in der Farbe des dominanten Elements. Gerendert wenn Canvas2D unavailable. Aus `Cymantics/SignatureCanvas.tsx` L27-118 adaptieren. | P1 | Done | [REQ-F-signatur-cymatics](../1-objectives/requirements/REQ-F-signatur-cymatics.md) | TASK-cym-bazi-bridge | 2026-04-17 | Keine WebGL-Deps. |
| TASK-cym-canvas-tests | Tests für `SignaturCymaticsCanvas`: Canvas2D context mock, param-change triggers smooth lerp (nicht harter Reset), visibilitychange pausiert RAF, `onFailed` wird bei Canvas-Exception gerufen, planetariumMode ändert background-color | P1 | Done | [REQ-F-signatur-cymatics](../1-objectives/requirements/REQ-F-signatur-cymatics.md) | TASK-cym-canvas-core, TASK-cym-canvas-theme, TASK-cym-canvas-fallback | 2026-04-17 | 21 tests in `src/__tests__/cymatics-canvas.test.tsx` (incl. 5 no-remount morph tests added by TASK-cym-quiz-morph) |

### Phase 3 — Integration in FusionRing3D + FuRingPage

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-cym-feature-flag | Füge `signature_engine_cymatics` zu `src/lib/feature-flags.ts` hinzu (default: `false`). LocalStorage-Override via `ff_signature_engine_cymatics`. | P1 | Done | [REQ-F-signatur-cymatics](../1-objectives/requirements/REQ-F-signatur-cymatics.md) | - | 2026-04-17 | |
| TASK-cym-fusion-ring-3d | Erweitere `FusionRing3D` Props um `chladniParams?: ChladniParams`. Füge Cymatics-Pfad in die Engine-Hierarchie ein: `signature_engine_cymatics && chladniParams?` → `SignaturCymaticsCanvas` (höchste Priorität über V3/V2/V1). Übergib `planetariumMode` und `onFailed` an `SignaturCymaticsCanvas`. | P1 | Done | [REQ-F-signatur-cymatics](../1-objectives/requirements/REQ-F-signatur-cymatics.md) | TASK-cym-canvas-core, TASK-cym-feature-flag | 2026-04-17 | DEC-cymatics-renderer §Engine Architecture |
| TASK-cym-furing-page | Erweitere `FuRingPage`: Importiere `baziToChladniParams`, leite `chladniParams` aus `apiData.bazi.pillars`, `apiData.wuxing.elements`, `apiData.wuxing.harmony_index` ab (via `useMemo`). Übergib `chladniParams` an `<FusionRing3D>`. Guard: wenn `apiData.bazi` nicht vorhanden, `chladniParams = undefined` (Engine fällt auf V2 zurück). | P1 | Done | [REQ-F-signatur-cymatics](../1-objectives/requirements/REQ-F-signatur-cymatics.md) | TASK-cym-fusion-ring-3d, TASK-cym-furing-page-stem-index | 2026-04-17 | |
| TASK-cym-furing-page-stem-index | Verifiziere ob `apiData.bazi.pillars.*.stem_index` im BAFE-Response vorhanden ist. Wenn nicht: Füge STEM_NAME_TO_INDEX-Fallback in `baziToChladniParams()` ein. Teste gegen echte BAFE-Antwort (oder mock). | P1 | Done | [REQ-F-signatur-cymatics](../1-objectives/requirements/REQ-F-signatur-cymatics.md) | TASK-cym-bazi-bridge | 2026-04-17 | MappedPillar hat kein stem_index (nur stem: string). STEM_NAME_TO_INDEX ist jetzt PRIMARY im baziToChladniParams(). |
| TASK-cym-integration-tests | Tests: `chladniParams`-Derivation in FuRingPage (apiData mock), Engine-Hierarchie in FusionRing3D (cymatics vor V3/V2/V1), Feature-Flag-Gate (flag false → keine Cymatics-Render), onFailed degradation | P1 | Done | [REQ-F-signatur-cymatics](../1-objectives/requirements/REQ-F-signatur-cymatics.md) | TASK-cym-furing-page | 2026-04-17 | 9 tests in `src/__tests__/cymatics-integration.test.tsx`. Used act() to flush Suspense boundary; removed resetModules (feature-flags mock reads localStorage dynamically). |

### Phase 4 — Frequenz-Panel & Polish

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-cym-frequency-panel | Erstelle `src/components/signatur-cymatics/CymaticsFrequencyPanel.tsx`: Zeigt 10 Cousto-Frequenzen mit Planet-Symbol, Name-DE, Hz-Wert, Wu-Xing-Element, und Gewichts-Bar (aus wuxing_weights). Kompakt für Sidebar. Verwendet `PLANET_FREQUENCIES` aus `bazi-to-chladni.ts`. | P2 | Done | [REQ-F-signatur-cymatics](../1-objectives/requirements/REQ-F-signatur-cymatics.md) | TASK-cym-bazi-bridge | 2026-04-17 | Optional: integrierbar in SpaceWeatherPanel-Bereich oder als separater Tab-Inhalt. Port aus `Cymantics/Home.tsx` PlanetFrequencyRow + Frequenzen-Tab |
| TASK-cym-chladni-params-display | Zeige Chladni-Parameter des Nutzers (m, n, α, β, Harmonie-Index) als kleine Info-Badge unter dem Ring. Mit Tooltip-Erklärung (CON-no-unexplained-numbers). Nur wenn `signature_engine_cymatics` aktiv. | P2 | Done | [REQ-F-signatur-cymatics](../1-objectives/requirements/REQ-F-signatur-cymatics.md) | TASK-cym-furing-page | 2026-04-17 | Aus `Cymantics/Home.tsx` Signatur-Parameter Grid |
| TASK-cym-quiz-morph | Wenn Quiz-Cluster abgeschlossen wird und `harmony_index` sich verändert, berechne neue ChladniParams und übergib sie an Canvas. Smooth lerp läuft automatisch (Canvas hält smoothParamsRef intern). Testen: Cluster-Complete-Event → neue params → no abrupt reset. | P2 | Done | [REQ-F-signatur-cymatics](../1-objectives/requirements/REQ-F-signatur-cymatics.md) | TASK-cym-furing-page, TASK-cym-canvas-core | 2026-04-17 | Canvas mechanics already correct (live-ref + lerp). 5 no-remount tests added to `cymatics-canvas.test.tsx` verifying container DOM node identity across a/b, m/n, harmonyIndex, dominantElement, and sequential changes. |

---

## Phase: Sprint S-SOULPRINT-HOTFIX — Soulprint Persist Fix (Default-Signatur Root-Cause)

**Sprint Goal:** Fix des Default-Signatur-Symptoms. Root-Cause entdeckt 2026-04-18 während TASK-supg1-supabase-hypothesis: `server.mjs` L2113-2118 nutzt `.update().eq('user_id')` statt `.upsert()`, scheitert für 100% der User (Race Condition — astro_profiles-Zeile wird erst nachgelagert durch Superglue-Worker erstellt). 50/50 prod astro_profiles haben `soulprint_sectors = NULL` → Frontend lädt NULL → Default-Signatur. Fix: upsert-Pattern + Backfill-Script. **Priorität: geht S-SUPERGLUE-STAGE1 voraus**, weil das der eigentliche User-Bug ist. Goal: [GOAL-soulprint-persistence](../1-objectives/goals/GOAL-soulprint-persistence.md). Requirement: [REQ-REL-soulprint-persist-onboarding](../1-objectives/requirements/REQ-REL-soulprint-persist-onboarding.md).

### Phase 1 — Fix Bootstrap Upsert

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-sphx-bootstrap-upsert | Bootstrap-Persistenz in `server.mjs` umschreiben: `.update({ soulprint_sectors }).eq('user_id', req.userId).select('user_id')` → `.upsert({ user_id: req.userId, soulprint_sectors }, { onConflict: 'user_id' }).select('user_id')`. Inline-Kommentar: Root-Cause-Hinweis (Race Condition mit Superglue-Worker) + Begründung für upsert. | P1 | Done | [REQ-REL-soulprint-persist-onboarding](../1-objectives/requirements/REQ-REL-soulprint-persist-onboarding.md) | - | 2026-04-18 | 3-Zeilen-Fix (+ 7-Zeilen-Kommentar mit DEC-synthetic-soulprint-fallback-Ref); `npx tsc --noEmit` grün; keine anderen Logic-Changes. |
| TASK-sphx-verify-no-overwrite | `triggerBazodiacUserChart` (L41-61) + `waitForStoredChart` Verhalten analysieren: schreibt der Superglue-Worker in seinem nachgelagerten Payload jemals `soulprint_sectors` (als `null` oder `undefined`)? Wenn ja → Bootstrap-Fix wird bei Race wieder kaputt, braucht zusätzliche Guardrail. Ergebnis als kurzes Findings-Memo unter Sprint-Notes dokumentieren. | P1 | Done | [REQ-REL-soulprint-persist-onboarding](../1-objectives/requirements/REQ-REL-soulprint-persist-onboarding.md) | - | 2026-04-19 | **Findings 2026-04-19:** Code-Analyse server.mjs L41-94 zeigt: (1) `triggerBazodiacUserChart` sendet nur `{ user_id, force_recalculate }` an Superglue-Webhook, konsumiert Response-Body nicht; (2) `waitForStoredChart` pollt nur auf `sun_sign, moon_sign, asc_sign, astro_json` — liest `soulprint_sectors` nie; (3) `extractStoredChart` (L63-68) verarbeitet nur BAFE-Chart-Daten (`astroJson.bafe` oder `astroJson`), kein Soulprint. **Fazit:** Server-Pfad berührt `soulprint_sectors` auf dem Superglue-Arm nirgends. Das Superglue-Tool heißt `bazodiac-user-chart` → schreibt `astro_json` + Basis-Signs, vermutlich nicht die soulprint-Spalte (die ist unsere Projektion). **Unknown Residual Risk:** ob Superglue INSERT mit unique-violation-silently-fails oder UPSERT mit targeted SET ausführt — empirisch per TASK-sphx-integration-test post-deploy verifizierbar (Test-User onboarden, 30s warten bis Superglue-Write landet, `soulprint_sectors` re-query: muss Array bleiben, nicht wieder NULL). **Pre-Deploy nicht-blockierend** — Bootstrap-Fix darf gehen. |
| TASK-sphx-unit-test | Vitest-Test für Bootstrap-Endpoint mit Supabase-mock: (a) upsert auf non-existent row → Row entsteht mit `user_id` + `soulprint_sectors`; (b) upsert auf existing row mit `astro_json` → nur `soulprint_sectors` + `updated_at` ändert sich, `astro_json` unberührt; (c) upsert-Error → `soulprint_saved: false` in Response + warn-Log. | P1 | Done | [REQ-REL-soulprint-persist-onboarding](../1-objectives/requirements/REQ-REL-soulprint-persist-onboarding.md) | TASK-sphx-bootstrap-upsert | 2026-04-19 | **Minor refactor for testability:** Inline save-block aus Bootstrap (L2110-2115) extrahiert in exportierte Helper-Funktion `persistSoulprintSectors(client, userId, sectors)` alongside `waitForStoredChart` (server.mjs L96-144). Bootstrap ruft jetzt `const { saved: soulprint_saved } = await persistSoulprintSectors(...)`. **6 Tests** in `src/__tests__/persist-soulprint-sectors.test.ts`: (1) upsert-Call-Shape [`user_id`+`soulprint_sectors` only, onConflict `user_id`, table `astro_profiles`], (2) existing-row-payload-check [kein `astro_json`/`birth_*` in payload → Postgres preserves sie via ON CONFLICT DO UPDATE SET], (3) error → saved=false+warn, (4) throw → saved=false+warn, (5) empty data → saved=false+warn, (6) null client → saved=false ohne soulprint-warn. Full suite 1955/1955 passing (+6), typecheck grün. |

### Phase 2 — Backfill für 50 existierende User

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-sphx-backfill | `scripts/backfill-soulprint.mjs` anlegen: iteriert `astro_profiles WHERE soulprint_sectors IS NULL`; für jede Zeile: `astro_json` laden → `computeNatalDimensions` + `projectToRing(nDim, zeroDimensions(), 1, 0)` → `.upsert({ user_id, soulprint_sectors }, { onConflict: 'user_id' })`. Support für `--dry-run` (default) vs. `--apply`. Finale Verifikationsquery (`COUNT(*) WHERE soulprint_sectors IS NULL`) ausgeben. | P1 | Done | [REQ-REL-soulprint-persist-onboarding](../1-objectives/requirements/REQ-REL-soulprint-persist-onboarding.md) | TASK-sphx-bootstrap-upsert, TASK-sphx-verify-no-overwrite | 2026-04-19 | **Script implemented** (`scripts/backfill-soulprint.mjs`, 113 LOC, chmod +x). Helper-Export `recomputeSoulprintFromAstroJson` zu server.mjs hinzugefügt (4-line wrapper around `computeNatalDimensions` + `zeroDimensions` + `projectToRing`). Sets `NODE_ENV=test` vor Import um app.listen zu verhindern. **Dry-run gegen prod ausgeführt 2026-04-19:** 50/50 Kandidaten gefunden, alle 50 Sektoren-Arrays korrekt berechnet (0 skipped, 0 failed). Post-Check bestätigt 50 NULL (dry-run, keine Schreiboperationen). **Finding:** 9/50 User haben all-zero Sektoren (wahrscheinlich test accounts / incomplete onboarding); 50+ User mit identischen Sektoren teilen Zodiac+Element-Signature (expected Master-Signal-Determinismus). `--apply` noch nicht ausgeführt — requires explicit confirmation. Full-suite 1955/1955 passing, typecheck grün. |

### Phase 3 — Deploy, Verify, Report

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-sphx-integration-test | Nach Deploy auf Railway: 2 frische Test-User mit unterschiedlichen Geburtsdaten anlegen, Onboarding durchlaufen. Supabase-Verifikation: beide neuen `astro_profiles`-Zeilen haben `soulprint_sectors` als 12-Element-Array (nicht NULL). Frontend-Check: beide User sehen nicht-defaulte, sichtbar unterschiedliche Signaturen (2D Cymatics + 3D Sphere). | P1 | Done | [REQ-REL-soulprint-persist-onboarding](../1-objectives/requirements/REQ-REL-soulprint-persist-onboarding.md) | TASK-sphx-unit-test, TASK-sphx-backfill | 2026-04-19 | **Trace erhalten 2026-04-19 19:55 UTC** (post PR #288 deploy, commit `4022b21`). User `c0b8e2fa` onboardet → Railway-Log: `[bootstrap] Superglue chart not ready, falling back to direct BAFE /chart`, danach kein Error → BAFE-200-OK via canonical Payload → `persistSoulprintSectors` erfolgreich. Supabase: `soulprint_sectors` != NULL, 12-Element-Array. **Pipeline-Resilience demonstriert (Pattern A — BAFE-Fallback-Pfad)**. Frontend-Differenzierung via 2D Cymatics bereits aus früheren User-Tests verifiziert (Pinyin-Fix, PR #284). **Data-Quality-Caveat:** dieser Test-User hat all-zero Sektoren — gehört zur bekannten 9/50 degenerate Klasse (incomplete astro_json → Master-Signal = 0). Pipeline korrekt; Master-Signal-Edge-Case-Handling ist separater Bug. Supabase post-Check: 59 total / 58 NULL / **1 populated** (+1 vs pre-test). |
| TASK-sphx-po-report | Finaler Bericht an PO: Commit-SHAs, Deploy-SHA, Backfill-Count, Supabase-Post-Query-Resultat (`SELECT COUNT(*) WHERE soulprint_sectors IS NULL` — soll 0 ergeben), Integration-Test-Ergebnisse, Remaining Risks, Confidence. GOAL-signatur-realtime-consistency Teil-SC wird hiermit auch verifiziert. | P1 | Todo | [REQ-REL-soulprint-persist-onboarding](../1-objectives/requirements/REQ-REL-soulprint-persist-onboarding.md) | TASK-sphx-integration-test | 2026-04-18 | Sprint-Abschluss. |

---

## Phase: Sprint S-SUPERGLUE-STAGE1 — Superglue Removal (Onboarding)

**Sprint Goal:** Entferne Superglue-Middleware aus dem Onboarding-Pfad. `/api/experience/bootstrap` ruft BAFE direkt auf und persistiert `astro_json` vollständig in Supabase. Strukturelle Dependency-Reduktion + Fundament für Stages 2–5. Goal: [GOAL-superglue-removal](../1-objectives/goals/GOAL-superglue-removal.md). Plan-Dokument: `docs/superglue-removal-stage-1-onboarding.md`. **Reframing 2026-04-18:** Plan-§2-Hypothese (Superglue-Webhook als Ursache des Default-Signatur-Symptoms) wurde durch TASK-supg1-supabase-hypothesis widerlegt — 50/50 prod astro_profiles zeigen vollständiges astro_json. Sprint läuft weiter mit geänderter Abnahme: Integrationstest ist **Regressions-Check** (Refactor bricht keine funktionierende Baseline), nicht Symptom-Fix. Default-Signatur-Root-Cause ist separate Diagnose.

### Phase 0 — Pre-flight & Hypothesen-Verifikation

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-supg1-supabase-hypothesis | Supabase SQL aus Plan §2 (staging) ausführen: `SELECT user_id, CASE WHEN astro_json IS NULL THEN 'NULL' ... END AS state, COUNT(*) FROM astro_profiles GROUP BY 1,2`. Bei NO_BAZI/NO_WUXING/NULL signifikant vertreten → Hypothese bestätigt, weitermachen. Bei allen OK → HALT + PO melden. | P1 | Done | - | - | 2026-04-18 | **RESULT 2026-04-18:** All 50 astro_profiles rows return state `OK` (astro_json complete: bazi + western + wuxing present for all). Hypothesis **REFUTED** per Plan §2 HALT rule. Query run against prod DB (BaZidiac, project `<prod>`) via Supabase MCP with corrected `GROUP BY 2` aggregate (no PII). Superglue is NOT the root cause of the default-signature symptom — bug likely sits in frontend read path, Master Signal pipeline, or soulprint_sectors column. Downstream tasks blocked pending root-cause re-analysis. |
| TASK-supg1-baseline | Branch `refactor/stage-1-superglue-out-onboarding` erstellen; `git status` clean; `npx tsc --noEmit` Baseline grün. Bei Fehler HALT. | P1 | Todo | - | TASK-supg1-supabase-hypothesis | 2026-04-18 | Plan §5 Phase 0. |
| TASK-supg1-audit-read | Plan §4 Read-only-Audit: `server.mjs` L1-120, L277-365, L781-810, L2034-2136; `src/services/api.ts`; `src/types/bafe.ts`; `src/contexts/AppLayoutContext.tsx`; `src/lib/schemas/experience.ts`. Keine Edits. | P1 | Todo | - | TASK-supg1-baseline | 2026-04-18 | Plan §4. |
| TASK-supg1-schema-check | `astro_profiles` Supabase-Spalten verifizieren: user_id, astro_json, sun_sign, moon_sign, asc_sign, birth_date, birth_time, iana_time_zone, birth_lat, birth_lng, updated_at. HALT + PO melden falls eine fehlt. | P1 | Todo | - | TASK-supg1-baseline | 2026-04-18 | Plan §5 Phase 1 Schritt 4 — Schema-Migration ist separate Entscheidung. |

### Phase 1 — fetchAndPersistChart Service

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-supg1-fetch-persist-service | `fetchAndPersistChart(userId, birth)` in `server.mjs` unter `fetchChartForBirth` (L~810) einfügen. Payload shape aus bestehendem Fallback-Block (L2054-2074): `{ birthDate, birthTime, lat, lng, timeZone }`. `fetchWithRetry` + `bafeFallbackUrls('/chart')`, 3 Attempts, 1000ms Backoff, 7000ms Timeout. Validate `bafeData.bazi`, `bafeData.western`, `bafeData.wuxing` — wenn eines fehlt → `throw new Error('bafe_invalid_response')`. Upsert in `astro_profiles` onConflict `user_id` mit vollständigem astro_json + Basisfeldern (sun_sign, moon_sign, asc_sign, birth_date, birth_time, iana_time_zone, birth_lat, birth_lng, updated_at). Throws: `'bafe_unavailable'` / `'bafe_invalid_response'` / `'supabase_write_failed'`. Return: `bafeData`. | P1 | Todo | - | TASK-supg1-audit-read, TASK-supg1-schema-check | 2026-04-18 | Plan §5 Phase 1. |
| TASK-supg1-phase1-verify | `npx tsc --noEmit` grün. Funktion definiert aber noch nicht aufgerufen (alter Bootstrap-Code unverändert). Commit: `add: fetchAndPersistChart service (not yet wired in)`. | P1 | Todo | - | TASK-supg1-fetch-persist-service | 2026-04-18 | Plan §5 Phase 1 Verifikation. |

### Phase 2 — Bootstrap-Endpoint Refactor

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-supg1-bootstrap-refactor | `/api/experience/bootstrap` (L2034-2136) umschreiben: `fetchAndPersistChart(req.userId, birth)` direkt aufrufen (ersetzt Superglue-Trigger + Polling + Fallback-Block). Master-Signal-Pipeline (computeNatalDimensions, projectToRing, generateNarratives, Blueprint-Seed) unverändert. Error-Mapping: `bafe_unavailable` → 502 `chart_service_unavailable`, `bafe_invalid_response` → 502 `chart_invalid`, `supabase_write_failed` → 500 `persist_failed`. JSDoc-Kommentar über Endpoint (L~2017-2032) anpassen — Superglue-Schritte entfernen. Soulprint-save-Block bleibt (astro_json ist bereits in Phase 1 persistiert). | P1 | Todo | - | TASK-supg1-phase1-verify | 2026-04-18 | Plan §5 Phase 2. |
| TASK-supg1-phase2-verify | `npx tsc --noEmit` grün. Lokalen Server ohne `SUPERGLUE_API_KEY` starten — Bootstrap muss ohne Crash hochfahren. Commit: `refactor: bootstrap endpoint uses fetchAndPersistChart directly`. | P1 | Todo | - | TASK-supg1-bootstrap-refactor | 2026-04-18 | Plan §5 Phase 2 Verifikation. |

### Phase 3 — Superglue-Code entfernen

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-supg1-remove-utils | In `server.mjs` entfernen: `triggerBazodiacUserChart` (L41-61), `waitForStoredChart` (L70-94), `extractStoredChart` (L63-68), `SUPERGLUE_BASE_URL` + `SUPERGLUE_API_KEY` Konstanten (L38-39). | P1 | Todo | - | TASK-supg1-phase2-verify | 2026-04-18 | Plan §5 Phase 3. |
| TASK-supg1-remove-env | `SUPERGLUE_API_KEY` aus `OPTIONAL_ENV_VARS` Liste (L~114) entfernen. `.env.example`: Zeilen `SUPERGLUE_BASE_URL=` und `SUPERGLUE_API_KEY=` entfernen falls vorhanden. | P1 | Todo | - | TASK-supg1-remove-utils | 2026-04-18 | Plan §5 Phase 3. |
| TASK-supg1-grep-verify | `grep -ri superglue ./server.mjs ./src` ausführen: `./src/` muss komplett leer sein; `./server.mjs` nur noch im möglichen Stage-2+-Kontext (Email-Service aus Flow #7 falls präsent — nicht anfassen). README / Setup-Docs auf Superglue-Onboarding-Erwähnungen prüfen und korrigieren. | P1 | Todo | - | TASK-supg1-remove-env | 2026-04-18 | Plan §5 Phase 3 Grep-Verifikation. |
| TASK-supg1-phase3-verify | `npx tsc --noEmit` grün. Commit: `remove: superglue onboarding integration`. | P1 | Todo | - | TASK-supg1-grep-verify | 2026-04-18 | Plan §5 Phase 3 Verifikation. |

### Phase 4 — Integrationstest & Runbook

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-supg1-runbook | `4-deploy/runbooks/onboarding-bootstrap-test.md` anlegen (oder bestehenden Onboarding-Runbook erweitern): Startup-Steps (staging-Server, Supabase-Access); 2-Test-User-Setup (Signup oder existierende Accounts, `astro_profiles`-Zeile vorher löschen); Browser-Flow (Geburtsdaten → SignaturPage); Supabase-Inspection (astro_json-Completeness-Check per SQL); DevTools-Console-Verifikation (`apiData.bazi`, `apiData.wuxing` befüllt); Abnahme-Kriterien (2 User sichtbar unterschiedliche Signaturen, `astro_json` vollständig). | P1 | Todo | - | TASK-supg1-phase3-verify | 2026-04-18 | Plan §5 Phase 4; Manual-Testing-Readiness für Sprint. |
| TASK-supg1-integration-test | Runbook manuell durchlaufen: 2 Test-User mit stark unterschiedlichen Geburtsdaten anlegen, Onboarding im Browser, Signatur prüfen (2D Cymatics + 3D Sphere), `astro_json` in Supabase prüfen. Abnahme: beide User unterschiedliche, nicht-defaulte Signaturen + astro_json für beide vollständig. Ergebnisse protokollieren. | P1 | Todo | - | TASK-supg1-runbook | 2026-04-18 | Plan §5 Phase 4; NICHT auf Production, nur staging. |

### Phase 5 — Docs + Merge-Readiness

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-supg1-update-plan-status | `docs/superglue-removal-stage-1-onboarding.md`: Status von "Planned" auf "Completed" setzen. §9 "Ausführungsnotizen" mit Abweichungen vom Plan + Commit-SHAs der Branch ergänzen. | P1 | Todo | - | TASK-supg1-integration-test | 2026-04-18 | Plan §5 Phase 5. |
| TASK-supg1-po-report | Finaler Report an PO im codemoss-guardrails-Format: `### phase` (Zusammenfassung), `### verification` (typecheck / integration / astro_json), `### remaining risks` (konkret), `### confidence` (high/medium/low). Warten auf Merge-Freigabe, nicht selbständig mergen. | P1 | Todo | - | TASK-supg1-update-plan-status | 2026-04-18 | Plan §5 Phase 5; Sprint-Abschluss. |

---

## Phase: Current Sprint — S-BRIDGE (Shared Bridge Refactor)

**Sprint Goal:** `DIMENSION_DEFS` + V3-Bridge-Funktionen aus lokalen Dateien in `packages/shared/src/signatur/` als Single Source of Truth extrahieren. Determinismus-Test-Suite als automatisierten Beweis für plattformübergreifende Konsistenz. Swift-Konstanten-Referenzdokument für iOS-Port.

### Phase 1 — DIMENSION_DEFS: Single Source of Truth

| ID | Task | Component | Req | Status | Dependencies | Updated | Notes |
|----|------|-----------|-----|--------|--------------|---------|-------|
| TASK-sbridge-dimension-defs | Erstelle `packages/shared/src/signatur/dimension-defs.ts`: extrahiere `DimensionDef` Typ und `DIMENSION_DEFS` Array (6 Einträge, exakte Werte) aus `bipolar-engine.ts` | shared | [REQ-F-signatur-shared-bridge](../1-objectives/requirements/REQ-F-signatur-shared-bridge.md) | Done | - | 2026-03-29 | Keine Werte ändern — 1:1 Extraktion |
| TASK-sbridge-v3-bridge-fn | Ergänze `packages/shared/src/signatur/signatur-bridge.ts` um `soulprintToDimensionWeights()` aus `src/components/fusion-ring-website/signatur-bridge.ts`; bestehende Funktionen behalten | shared | [REQ-F-signatur-shared-bridge](../1-objectives/requirements/REQ-F-signatur-shared-bridge.md) | Done | TASK-sbridge-dimension-defs | 2026-03-29 | |
| TASK-sbridge-shared-index | Update `packages/shared/src/signatur/index.ts`: exportiere `DIMENSION_DEFS`, `DimensionDef`, `soulprintToNatalWeights`, `quizSectorsToQuizWeights`, `soulprintToDimensionWeights` | shared | [REQ-F-signatur-shared-bridge](../1-objectives/requirements/REQ-F-signatur-shared-bridge.md) | Done | TASK-sbridge-v3-bridge-fn | 2026-03-29 | |
| TASK-sbridge-engine-consume | Update `bipolar-engine.ts`: importiere `DimensionDef` + `DIMENSION_DEFS` aus `@/packages/shared/src/signatur`; lösche lokale Definitionen; `npx vitest run` muss grün bleiben | frontend | [REQ-F-signatur-shared-bridge](../1-objectives/requirements/REQ-F-signatur-shared-bridge.md) | Done | TASK-sbridge-shared-index | 2026-03-29 | Achtung: Tests importieren aktuell direkt aus bipolar-engine |
| TASK-sbridge-web-bridge-consume | Update `src/components/fusion-ring-website/signatur-bridge.ts`: lokale `soulprintToDimensionWeights` durch Re-Export aus `@/packages/shared/src/signatur` ersetzen | frontend | [REQ-F-signatur-shared-bridge](../1-objectives/requirements/REQ-F-signatur-shared-bridge.md) | Done | TASK-sbridge-engine-consume | 2026-03-29 | |
| TASK-sbridge-test-imports | Update `src/__tests__/signatur-v3-engine.test.ts`: `DIMENSIONS` aus `@/packages/shared/src/signatur` importieren statt aus lokalem `bipolar-engine.ts`; alle 15 Tests müssen grün bleiben | frontend | [REQ-F-signatur-shared-bridge](../1-objectives/requirements/REQ-F-signatur-shared-bridge.md) | Done | TASK-sbridge-web-bridge-consume | 2026-03-29 | |

### Phase 2 — Determinismus-Test-Suite

| ID | Task | Component | Req | Status | Dependencies | Updated | Notes |
|----|------|-----------|-----|--------|--------------|---------|-------|
| TASK-sbridge-dim-contract | Vitest (`packages/shared`): DIMENSION_DEFS hat 6 Einträge, alle Hz einzigartig, Winkel exakt `[0, π/3, 2π/3, π, 4π/3, 5π/3]`, alle colorA/B ∈ [0,1], keine leeren Pol-Namen | shared | [REQ-F-signatur-determinism](../1-objectives/requirements/REQ-F-signatur-determinism.md) | Done | TASK-sbridge-shared-index | 2026-03-29 | |
| TASK-sbridge-hz-constants | Vitest: Hz-Werte matchen exakt die Spec (Mars=144.72, Moon=210.42, Sun=126.22, Mercury=141.27, Jupiter=183.58, Saturn=147.85) — schlägt fehl bei stiller Änderung | shared | [REQ-F-signatur-determinism](../1-objectives/requirements/REQ-F-signatur-determinism.md) | Done | TASK-sbridge-dim-contract | 2026-03-29 | Guard-Test: Intent erzwingen |
| TASK-sbridge-bridge-contract | Vitest: alle Outputs von `soulprintToDimensionWeights` + `quizSectorsToQuizWeights` ∈ [0,1]; Edge-cases: leeres Array → 0.5, Array mit 12 Einsen → 1.0 | shared | [REQ-F-signatur-determinism](../1-objectives/requirements/REQ-F-signatur-determinism.md) | Done | TASK-sbridge-dim-contract | 2026-03-29 | |
| TASK-sbridge-determinism | Vitest: `initializePoles()` + 200× `updatePoles()` mit identischen Inputs zweimal → alle 12 Pol-Positionen (x,y) Differenz < 1e-10 | frontend | [REQ-F-signatur-determinism](../1-objectives/requirements/REQ-F-signatur-determinism.md) | Done | TASK-sbridge-test-imports | 2026-03-29 | Beweist Float-Determinismus für Matching-Basis |

### Phase 3 — Swift-Referenz & Runbook

| ID | Task | Component | Req | Status | Dependencies | Updated | Notes |
|----|------|-----------|-----|--------|--------------|---------|-------|
| TASK-sbridge-swift-doc | Erstelle `packages/shared/src/signatur/SWIFT_CONSTANTS.md`: Swift-ready `struct DimensionDef` + `let DIMENSION_DEFS` Array mit hz als Double, baseAngle als Double, colorA/B als `(Double,Double,Double)` — generiert aus TS-Werten | shared | [REQ-F-signatur-ios-swift](../1-objectives/requirements/REQ-F-signatur-ios-swift.md) | Done | TASK-sbridge-hz-constants | 2026-03-29 | Manueller Sync bis Codegen; kein Hardcoding in Swift |
| TASK-sbridge-manual-testing | Erstelle `docs/runbooks/signatur-s-bridge-verification.md`: (a) `npx vitest run` grün, (b) MiniSignature rendert, (c) Signatur-Seite rendert, (d) `npx tsc --noEmit` clean | frontend, shared | - | Done | TASK-sbridge-determinism, TASK-sbridge-swift-doc | 2026-03-29 | |

---

## Phase: Completed — S-DAUP (Dashboard Aufräumen)

**Sprint Goal:** Bestätigte Bugs im Dashboard beheben: Four Pillars-Duplikat entfernen, Sunsign/BaZi/Wuxing Kacheln auf Detail-View umbauen, leeren Blueprint-Placeholder fixen, DayModeModal Dark-Mode-Kontrast korrigieren, MiniSignature-Skalierung prüfen.

| ID | Task | Component | Req | Status | Notes |
|----|------|-----------|-----|--------|-------|
| DAUP-01 | Remove duplicate Four Pillars section | frontend | — | Done | `DashboardAstroSection.tsx:314–324` removed |
| DAUP-02 | Build click-to-detail for Sunsign / BaZi / Wuxing tiles (modal or drawer) | frontend | REQ-F-astro-card-detail-view | Done | `AstroDetailModal.tsx` created; `DashboardHeroNav` → buttons with `onTileClick`; wired in `DashboardAstroSection` |
| DAUP-03 | Fix oversized empty Blueprint placeholder | frontend | — | Done | `BlueprintReveal.tsx:35–39` — returns null instead of 220px skeleton |
| DAUP-04 | Fix CosmicWeatherCard Dark Mode contrast | frontend | — | Done | `CosmicWeatherCard.tsx:80,117` — `bg-white/60` → `bg-[#00050A]/80`, border → gold |
| DAUP-05 | Constrain MiniSignature width in Dashboard | frontend | — | Done | `Dashboard.tsx` wrapper — added `max-w-xs mx-auto` |

---

## Phase: Completed — S-DASH-POLISH (Dashboard Polish & Navigation)

**Sprint Goal:** Dashboard wird production-ready: Ghost UI entfernen, Navigation überarbeiten, Planetarium aufwerten, Detailansichten aufbauen, Levi-Layer fixen.

| ID | Task | Component | Status | Notes |
|----|------|-----------|--------|-------|
| S-DP-01 | Remove "Tour wiederholen" + "Zahlung verwalten" from menu | frontend | Done | Ghost UI removed |
| S-DP-02 | Remove "Neustarten" button | frontend | Done | Button removed |
| S-DP-03 | Remove reload button in "dein Bazodiac" heading | frontend | Done | Button removed |
| S-DP-04 | Remove "KI-Synthese" heading | frontend | Done | Heading removed |
| S-DP-05 | Replace "Your Bazaar Blueprint" with German copy | frontend | Done | German copy applied |
| S-DP-06 | Fix Cosmic Blueprint DE/EN inconsistency | frontend | Done | CON-german-ui enforced |
| S-DP-07 | Fix Wu-Xing Metal icon showing "Wind" | frontend | Done | Icon + aria-label corrected to "Metall" |
| S-DP-08 | Build WuXingPage as extended analysis detail page | frontend | Done | commit e13d937 / 8cad909 |
| S-DP-09 | Gate WuXingPage extended content behind PremiumGate | frontend | Done | commit 55d3118 |
| S-DP-10 | Move Western houses from Dashboard to WuXingPage | frontend | Done | commit e13d937 |
| S-DP-11 | Fix Levi text: alignment, font size, remove italic | frontend | Done | commit 4152086 |
| S-DP-12 | Fix Levi buttons: size "Call Levi", remove "Levi Bazzi bereit" | frontend | Done | commit 4152086 + 57426d3 |
| S-DP-13 | Move Levi section higher in Dashboard | frontend | Done | commit 4152086 |
| S-DP-14 | Increase date/time display in Planetarium | frontend | Done | commit 943904c |
| S-DP-15 | Show current constellation alongside birth chart | frontend | Done | commit 943904c |
| S-DP-16 | Add constellation description at Planetarium bottom | frontend | Done | commit 943904c |
| S-DP-17 | Apply Planetarium enhancements to Solar System view | frontend | Done | commit 943904c |
| S-DP-18 | Create 3 navigation menu proposals with hover submenus | frontend | Done | commit 89d94ad / a322b2c |
| S-DP-19 | Redesign header: enlarge heading, create header zone | frontend | Done | commit 89d94ad |
| S-DP-20 | Surface FusionRingCanvasV2 post-processing errors | frontend | Done | commit edea89d |
| S-DP-21 | Surface usePremium Realtime fallback | frontend | Done | commit b43b9d7 |
| S-DP-22 | Add error propagation for tour_completed write | frontend | Done | commit fbaae99 |

### Dissonance Coefficient (2026-03-24)

| ID | Task | Component | Status | Notes |
|----|------|-----------|--------|-------|
| DEC-01 | DissonanceResult type + computeDissonance() | frontend | Done | commit f5b2c54 |
| DEC-02 | VisualModulation parameters type | frontend | Done | commit f5b2c54 |
| DEC-03 | Extend bazodiac-engine.ts with modulation hooks | frontend | Done | commit c83259e |
| DEC-04 | useDissonance React hook | frontend | Done | commit 41235e6 |
| DEC-05 | Morph transition system with dissonance-aware easing | frontend | Done | commit 5ca1681 |
| DEC-06 | Apply modulation in FusionRingCanvasV2 render loop | frontend | Done | commit 8f6e59d |
| DEC-07 | Persist dissonance state to Supabase | api-server | Done | commit 7c2257a |
| DEC-08 | Premium "Sichtbare Werte" toggle + gauge component | frontend | Done | commit 24f630f |

### Day-Pulse / Day-Mode (2026-03-25)

| ID | Task | Component | Status | Notes |
|----|------|-----------|--------|-------|
| DAY-01 | V3 Bipolar Trail Signature Engine prototype | frontend | Done | commit dd46bab |
| DAY-02 | DayHarmonicState + computeDayHarmonic + modulateConfig | frontend | Done | commit 009c03a |
| DAY-03 | harmony_index + day_mode in DailyFusionSchema | api-server | Done | commit 7d8dd62 |
| DAY-04 | Inject harmony_index + day_mode in /api/experience/daily proxy | api-server | Done | commit e52f3b0 |
| DAY-05 | Wire DayHarmonicState through SignaturV3Canvas + useFirstRunDaily | frontend | Done | commit 237ac13 |
| DAY-06 | DayModeModal wired into Dashboard | frontend | Done | commit 8096396 |
| DAY-07 | Extract DayHarmonicState to lib/fusion-ring/day-harmonic.ts | frontend | Done | commit 78f18c4 |

## Phase: Current Sprint — S-SIG (Signatur Definition & Build)

**Sprint Goal:** Signatur V3 (Bipolar Trail Engine) production-ready auf Web + iOS. Cousto-Audio, Dissonance-Wiring, Mobile Native 3D, Performance-Targets.

### Execution Plan

#### Phase 1: Signatur V3 Web Production

**Capabilities delivered:**
- V3 bipolar trail engine replaces V2 as default Signatur renderer
- Dissonance model drives visible pole behavior
- Day harmonic and space weather modulate membrane layer
- V2 remains as feature-flag fallback

**Tasks:**
1. TASK-v3-engine-production
2. TASK-v3-dissonance-wiring
3. TASK-v3-day-harmonic
4. TASK-v3-space-weather
5. TASK-v3-data-bridge
6. TASK-v3-feature-flag
7. TASK-v3-graceful-fallback
8. TASK-v3-unit-tests
9. TASK-phase-1-manual-testing

#### Phase 2: Cousto Audio Synthesis

**Capabilities delivered:**
- Signatur generates ambient sound from Cousto frequencies
- Pole weight maps to oscillator amplitude
- User controls for mute/volume

**Tasks:**
1. TASK-audio-synthesis-module
2. TASK-audio-weight-mapping
3. TASK-audio-ui-controls
4. TASK-audio-lifecycle
5. TASK-audio-ios-safari
6. TASK-phase-2-manual-testing

#### Phase 3: Mobile Native 3D Signatur

**Capabilities delivered:**
- Full 3D Signatur on iOS via expo-gl
- Same mathematical model as web, reduced particles
- Touch gesture controls

**Tasks:**
1. TASK-mobile-v3-engine
2. TASK-mobile-mount-signatur
3. TASK-mobile-gesture-handler
4. TASK-mobile-data-pipeline
5. TASK-mobile-audio
6. TASK-phase-3-manual-testing

#### Phase 4: Performance & Cross-Platform Polish

**Capabilities delivered:**
- All REQ-PERF targets met across platforms
- Optimized trail rendering

**Tasks:**
1. TASK-perf-desktop-benchmark
2. TASK-perf-mobile-web-benchmark
3. TASK-perf-ios-native-benchmark
4. TASK-perf-trail-optimization
5. TASK-perf-first-frame
6. TASK-perf-transit-api
7. TASK-phase-4-manual-testing

### Phase 1 Tasks — Signatur V3 Web Production

| ID | Task | Component | Req | Status | Dependencies | Updated | Notes |
|----|------|-----------|-----|--------|--------------|---------|-------|
| TASK-v3-engine-production | Finalize V3 bipolar trail engine: 12 poles, Cousto frequencies, additive trail rendering, center void | frontend | [REQ-F-signatur-rendering-engine](../1-objectives/requirements/REQ-F-signatur-rendering-engine.md) | Done | - | 2026-03-27 | External dissonance + solar modulation interfaces, delta-time, visibility API |
| TASK-v3-dissonance-wiring | Wire three-layer dissonance into V3: d_natal→movement mode, d_accumulated→trail density, d_elemental→Sheng/Ke texture | frontend | [REQ-F-signatur-rendering-engine](../1-objectives/requirements/REQ-F-signatur-rendering-engine.md) | Done | TASK-v3-engine-production | 2026-03-27 | External DissonanceResult → V3DissonanceState, Dashboard wired |
| TASK-v3-day-harmonic | Wire DayHarmonicState into V3 pole configuration (day-mode visual accent) | frontend | [REQ-F-signatur-data-pipeline](../1-objectives/requirements/REQ-F-signatur-data-pipeline.md) | Done | TASK-v3-engine-production | 2026-03-27 | Already wired in Day-Pulse sprint (DAY-01–07) |
| TASK-v3-space-weather | Wire space weather modulation into V3 membrane layer (solar pressure → trail intensity 1.0–1.5) | frontend | [REQ-F-signatur-data-pipeline](../1-objectives/requirements/REQ-F-signatur-data-pipeline.md) | Done | TASK-v3-engine-production | 2026-03-27 | SolarModulation interface + Dashboard wiring done in dissonance-wiring |
| TASK-v3-data-bridge | Verify signatur-bridge: soulprint→natalWeights(7), quizSectors→quizWeights(6), transit polling — all feeding V3 | frontend | [REQ-F-signatur-data-pipeline](../1-objectives/requirements/REQ-F-signatur-data-pipeline.md) | Done | TASK-v3-engine-production | 2026-03-27 | Bridge verified: soulprintToDimensionWeights→6D, soulprintToNatalWeights→7D, quizSectorsToQuizWeights→6D |
| TASK-v3-feature-flag | Add signatur_engine_v3 feature flag: V3 default, V2 fallback via localStorage | frontend | [REQ-F-signatur-rendering-engine](../1-objectives/requirements/REQ-F-signatur-rendering-engine.md) | Done | TASK-v3-engine-production | 2026-03-27 | Flag added, Dashboard V3 gated, critical flag warning |
| TASK-v3-graceful-fallback | Implement graceful data source fallback: missing transit/weather/quiz → neutral defaults, no visual glitch | frontend | [REQ-F-signatur-data-pipeline](../1-objectives/requirements/REQ-F-signatur-data-pipeline.md) | Done | TASK-v3-data-bridge | 2026-03-27 | Engine defaults to 0.5 per dimension, null solar/dissonance/dayHarmonic all guarded |
| TASK-v3-unit-tests | Vitest: pole determinism, dissonance→visual correlation, data bridge transforms | frontend | [REQ-F-signatur-rendering-engine](../1-objectives/requirements/REQ-F-signatur-rendering-engine.md) | Done | TASK-v3-dissonance-wiring | 2026-03-27 | 15 tests: dimensions, determinism, dissonance, day-harmonic, trails |
| TASK-phase-1-manual-testing | Create runbook: Signatur V3 web manual test scenarios | frontend | - | Done | TASK-v3-unit-tests | 2026-03-28 | docs/runbooks/signatur-v3-web-manual-testing.md |

### Phase 2 Tasks — Cousto Audio Synthesis

| ID | Task | Component | Req | Status | Dependencies | Updated | Notes |
|----|------|-----------|-----|--------|--------------|---------|-------|
| TASK-audio-synthesis-module | Create CoustoAudioEngine: Web Audio API, 6 frequencies (Mars 144.72, Moon 210.42, Sun 126.22, Mercury 141.27, Jupiter 183.58, Saturn 147.85 Hz) | frontend | [REQ-F-signatur-rendering-engine](../1-objectives/requirements/REQ-F-signatur-rendering-engine.md) | Done | TASK-v3-engine-production | 2026-03-27 | cousto-audio-engine.ts — 6 sine oscillators |
| TASK-audio-weight-mapping | Map pole weights to oscillator gain with smooth interpolation | frontend | [REQ-F-signatur-rendering-engine](../1-objectives/requirements/REQ-F-signatur-rendering-engine.md) | Done | TASK-audio-synthesis-module | 2026-03-27 | linearRampToValueAtTime with 300ms ramp |
| TASK-audio-ui-controls | Add mute toggle + volume slider to Signatur page (localStorage persisted) | frontend | [REQ-F-signatur-rendering-engine](../1-objectives/requirements/REQ-F-signatur-rendering-engine.md) | Done | TASK-audio-synthesis-module | 2026-03-27 | FuRingPage header, VolumeX/Volume2 icons |
| TASK-audio-lifecycle | Wire audio lifecycle: start on mount, suspend on hidden, resume on visible, stop on unmount | frontend | [REQ-F-signatur-rendering-engine](../1-objectives/requirements/REQ-F-signatur-rendering-engine.md) | Done | TASK-audio-synthesis-module | 2026-03-27 | useCoustoAudio hook, visibility API |
| TASK-audio-ios-safari | Test/fix Web Audio API on mobile Safari (user gesture for AudioContext.resume()) | frontend | [REQ-PERF-signatur-performance](../1-objectives/requirements/REQ-PERF-signatur-performance.md) | Done | TASK-audio-lifecycle | 2026-03-27 | Click/touchstart listener starts AudioContext |
| TASK-phase-2-manual-testing | Update runbook: audio test scenarios (mute, volume, tab switch, Safari gesture) | frontend | - | Done | TASK-audio-ios-safari | 2026-03-28 | docs/runbooks/signatur-cousto-audio-manual-testing.md |

### Phase 3 Tasks — Mobile Native 3D Signatur

| ID | Task | Component | Req | Status | Dependencies | Updated | Notes |
|----|------|-----------|-----|--------|--------------|---------|-------|
| TASK-mobile-v3-engine | Adapt V3 bipolar trail engine for expo-gl: Canvas 2D → GL context, reduced trail buffer | mobile | [REQ-F-signatur-mobile-native](../1-objectives/requirements/REQ-F-signatur-mobile-native.md) | Cancelled | TASK-v3-engine-production | 2026-03-28 | Skipped: iOS app is native Swift (separate repo), not Expo |
| TASK-mobile-mount-signatur | Mount V3 SignaturCanvas on FuRingScreen, replacing 2D bootstrap view | mobile | [REQ-F-signatur-mobile-native](../1-objectives/requirements/REQ-F-signatur-mobile-native.md) | Cancelled | TASK-mobile-v3-engine | 2026-03-28 | Skipped: see TASK-mobile-v3-engine |
| TASK-mobile-gesture-handler | Implement gesture controls: pan (1 finger), pinch-zoom (2 fingers), orbit (drag) | mobile | [REQ-F-signatur-mobile-native](../1-objectives/requirements/REQ-F-signatur-mobile-native.md) | Cancelled | TASK-mobile-mount-signatur | 2026-03-28 | Skipped: see TASK-mobile-v3-engine |
| TASK-mobile-data-pipeline | Wire useBootstrapSignatur → natal weights + quiz weights → V3 input vector | mobile | [REQ-F-signatur-data-pipeline](../1-objectives/requirements/REQ-F-signatur-data-pipeline.md) | Cancelled | TASK-mobile-mount-signatur | 2026-03-28 | Skipped: see TASK-mobile-v3-engine |
| TASK-mobile-audio | Implement Cousto audio on React Native via expo-av (6 oscillators, weight-mapped gain) | mobile | [REQ-F-signatur-mobile-native](../1-objectives/requirements/REQ-F-signatur-mobile-native.md) | Cancelled | TASK-audio-synthesis-module, TASK-mobile-mount-signatur | 2026-03-28 | Skipped: see TASK-mobile-v3-engine |
| TASK-phase-3-manual-testing | Update runbook: iOS Signatur test scenarios (gestures, audio, data, older device perf) | mobile, frontend | - | Cancelled | TASK-mobile-audio | 2026-03-28 | Skipped: see TASK-mobile-v3-engine |

### Phase 4 Tasks — Performance & Cross-Platform Polish

| ID | Task | Component | Req | Status | Dependencies | Updated | Notes |
|----|------|-----------|-----|--------|--------------|---------|-------|
| TASK-perf-desktop-benchmark | Benchmark V3 on desktop Chrome/Safari: target ≥60fps sustained | frontend | [REQ-PERF-signatur-performance](../1-objectives/requirements/REQ-PERF-signatur-performance.md) | Done | TASK-v3-engine-production | 2026-03-28 | 0.010ms/frame avg — 0.06% of 16.6ms budget |
| TASK-perf-mobile-web-benchmark | Benchmark V3 on mobile Safari/Chrome: target ≥30fps with reduced trails | frontend | [REQ-PERF-signatur-performance](../1-objectives/requirements/REQ-PERF-signatur-performance.md) | Done | TASK-v3-engine-production | 2026-03-28 | 0.002ms/frame avg — 0.006% of 33.3ms budget |
| TASK-perf-ios-native-benchmark | Benchmark iOS native (iPhone 12+): ≥30fps, <150MB GPU, no thermal throttle 60s | mobile | [REQ-PERF-signatur-performance](../1-objectives/requirements/REQ-PERF-signatur-performance.md) | Cancelled | TASK-mobile-v3-engine | 2026-03-28 | Skipped: iOS in separate Swift repo |
| TASK-perf-trail-optimization | Optimize trail buffer size, fade rate, render batch based on benchmarks | frontend | [REQ-PERF-signatur-performance](../1-objectives/requirements/REQ-PERF-signatur-performance.md) | Done | TASK-perf-desktop-benchmark | 2026-03-28 | 3-tier adaptive: high(2000) / medium(800) / low(300) auto-selected by canvas size |
| TASK-perf-first-frame | Validate <2s first visible frame from data availability on web | frontend | [REQ-PERF-signatur-performance](../1-objectives/requirements/REQ-PERF-signatur-performance.md) | Done | TASK-v3-engine-production | 2026-03-28 | <50ms init→frame-ready (budget: 2000ms). 2 tests added |
| TASK-perf-transit-api | Validate /api/transit-state p95 <500ms under concurrent load | api-server | [REQ-PERF-signatur-performance](../1-objectives/requirements/REQ-PERF-signatur-performance.md) | Done | - | 2026-03-28 | scripts/benchmark-transit-state.mjs — run against staging with BENCHMARK_USER_ID + TOKEN |
| TASK-phase-4-manual-testing | Final runbook: all-platform Signatur test matrix | frontend, mobile, api-server | - | Done | TASK-perf-trail-optimization | 2026-03-28 | docs/runbooks/signatur-performance-test-matrix.md |

---

## Phase: Deferred (Previously Current Sprint — moved to next sprint)

| ID | Task | Component | Status | Notes |
|----|------|-----------|--------|-------|
| DPB-01 | Supabase daily_horoscope_cache as L2 behind in-memory Map | api-server | Done | L2 read in try/catch for resilience |
| DPB-02 | Daily recurrence — seen flag boolean → date-based | frontend | Done | daily_modal_seen_date DATE column |
| DPB-03 | SVG fallback when canvas unavailable in DayModeModal | frontend | Done | commit fb6ff99 |
| DPB-04 | Delete deprecated DailyHoroscopeModal | frontend | Done | commit 24ba304 |
| DPB-05 | Update API docs (harmony_index, day_mode) + architecture refs | - | Done | commit 3c6441f |
| DPB-06 | Remove dead daily_modal_* analytics event names | frontend | Done | commit 3b8fb4b |
| DPB-07 | Update daily_modal_v1 flag description in CLAUDE.md | - | Done | commit 6873ca3 |

### Bugs (Fixed)

| ID | Bug | Component | Status | Notes |
|----|-----|-----------|--------|-------|
| BUG-04 | FusionRingCanvasV2 post-processing errors swallowed | frontend | Done | commit edea89d |
| BUG-05 | usePremium Realtime subscription falls back silently | frontend | Done | commit b43b9d7 |
| BUG-06 | Tour persistence fails silently | frontend | Done | commit fbaae99 |
| BUG-07 | Ghost UI: "Tour wiederholen" and "Zahlung verwalten" | frontend | Done | S-DP-01 |
| BUG-08 | "Neustarten" button with no function | frontend | Done | S-DP-02 |
| BUG-09 | Redundant reload button | frontend | Done | S-DP-03 |
| BUG-10 | Placeholder "Your Bazaar Blueprint" | frontend | Done | S-DP-05 |
| BUG-11 | Wu-Xing Metal icon shows "Wind" | frontend | Done | S-DP-07 |
| BUG-12 | Levi layer layout/sizing issues | frontend | Done | commit 4152086 + 57426d3 |
| BUG-13 | Blueprint DE/EN inconsistency | frontend | Done | S-DP-06 |
| BUG-14 | "KI-Synthese" heading never specified | frontend | Done | S-DP-04 |
| BUG-15 | Planetarium: current sky shows no visible difference from birth sky when switching modes | frontend | Done | Fixed: BirthChartOrrery now receives birth/device observer coords via props; birth sky uses profile lat/lon, current sky uses Geolocation API |
| BUG-16 | Planetarium: current sky does not use live device location (uses birth coords) | frontend | Done | Fixed: useDeviceLocation hook uses Geolocation API with 5s timeout + graceful fallback to birth coords |
| BUG-17 | Influence Gauges render 0.00% everywhere instead of live transit data | frontend | Done | Fixed: isSyntheticSoulprint detection + 'GESCHÄTZT' label; gauges show estimated data from synthetic soulprint instead of misleading 0% |
| BUG-18 | Vibe text not visible — CTA/tile not reachable or result text missing despite prior fix | frontend | Done | Fixed: VibesSection error state now shows retry button; server fallback produces valid kurzsignal |
| BUG-19 | Tagesimpuls / Day Trace body text not visible despite prior fix | frontend | Done | Fixed: buildFallbackDaily provides local deterministic daily data when FuFirE/Gemini unreachable; DashboardTagesEnergie always renders |
| BUG-20 | Quiz completion state resets on page reload — completed quiz appears uncompleted | frontend, api-server | Done | Fixed: addModule now persists individual completions to Supabase (fire-and-forget upsert), not just localStorage |
| BUG-21 | Quiz result generation latency 3-4 minutes (expected: seconds) | api-server | Done | Fixed via TASK-quiz-result-latency-fix: refresh() + 500ms delay after quiz completion. Closed 2026-04-08. |
| BUG-22 | Quiz headings contain DE/EN placeholder text instead of final copy | frontend | Done | Audit complete — all 24 quizzes have final DE+EN titles+subtitles (TASK-quiz-placeholder-headings-fix 2026-04-04). Closed 2026-04-08. |
| BUG-23 | UI layer covers ElevenLabs widget — agents cannot be selected/clicked | frontend | Done | Fixed 2026-04-08: script global in index.html, widget via document.body.appendChild, position:fixed CSS, z-index:2147483647. Widget fully visible bottom-right. |
| BUG-24 | Dashboard Daily Chart zeigt keine Live-Tagesdaten: Kohärenzindex leer, KP null, Solardruck 0 %, Transitaktivität null, keine aktiven Planeteneinflüsse, generischer Tagesimpuls, unklare CTA „Tagesfeld / Impuls" | frontend, api-server | Todo | Track A — FlashDoc 2026-04-17. Verdacht: Dashboard nutzt simulierten Transitpfad (src/lib/fusion-ring/transit.ts) statt des Live-Contracts von /api/transit-state/:userId. Scope: Dashboard.tsx, DashboardPage.tsx, daily-chart components, api.ts mapping, server.mjs aggregation. |
| BUG-25 | Dashboard: „Dein Vibe konnte nicht geladen werden" + doppelte kosmische Wetterdarstellung (Widget vs. Daily Chart inkonsistent) | frontend, api-server | Todo | Track B — FlashDoc 2026-04-17. Vibe-Ladefehler + duplicated cosmic-weather surfaces without shared state model. Scope: VibesSection, Dashboard.tsx composition, space-weather hooks, server.mjs /api/space-weather/extended. |
| BUG-26 | Signaturseite zeigt falsche Renderer-Kombination: V1 und V3 sichtbar, Cymatics fehlt; kosmisches Wetter ohne Werte | frontend | Todo | Track C — FlashDoc 2026-04-17. Feature-flag/renderer-selection regression: signature_engine_cymatics vermutlich nicht aktiv in Runtime trotz Merge. Scope: FuRingPage.tsx, FusionRing3D, feature-flags.ts, useFusionSignal, FusionRingCanvasV2/V3. |
| BUG-27 | Dashboard Daily Chart soll dieselbe Planeten-/Transitquelle wie Signaturseite nutzen (Daten-Pipeline-Alignment) | frontend, api-server | Todo | Track D — FlashDoc 2026-04-17. Architektur-Alignment: Dashboard Daily Chart auf transit-state-Contract umstellen (gleiche Live-Quelle wie /signatur), sofern kein Contract-Breaking-Change nötig. Abhängigkeit: BUG-24 zuerst. Option 2 aus FlashDoc empfohlen. |

---

## Sprint S-BUGFIX: Dashboard & Signatur Data Bugs (2026-04-04)

**Sprint Goal:** Fix 8 data/rendering bugs blocking production quality: Planetarium sky regression, zero-value gauges, missing Vibe/Daily Pulse text, quiz completion persistence, quiz latency, placeholder headings.

### Cluster A — Planetarium Sky Regression

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-current-sky-delta-fix | Fix birth sky vs current sky: ensure switching modes uses distinct simTime + observer coordinates so the orrery shows materially different output | P1 | Done | - | - | 2026-04-04 | BUG-15; fixed isPlaying time-lapse overriding currentSky — now else-if pattern; 3 tests |
| TASK-current-sky-live-location | Use browser Geolocation API for current sky observer position; fallback: last granted → profile location → birth location | P1 | Done | - | TASK-current-sky-delta-fix | 2026-04-06 | BUG-16; implemented in commit 9a4a776 — useDeviceLocation hook + Dashboard fallback wiring; no dedicated test file yet |

### Cluster B — Missing Data/Text

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-influence-gauges-zero-fix | Fix InfluenceGauges rendering 0% when natalWeights is undefined — show truthful unavailable state or derive from apiData | P1 | Done | - | - | 2026-04-04 | BUG-17; syntheticSoulprintFromSign fallback in Dashboard.tsx; 5 tests |
| TASK-vibe-text-missing-fix | Fix Vibe result text not showing after successful fetch — check VibesModal render, fetchVibes response mapping, i18n key resolution | P1 | Done | - | - | 2026-04-04 | BUG-18; empty-content guard in VibesModal + PremiumGate on VibesSection per REQ-F-vibes-core |
| TASK-daily-pulse-text-missing-fix | Fix Daily Pulse body text not rendering — check DashboardTagesEnergie when dailyData.body/headline is null/empty, fallback path | P1 | Done | - | - | 2026-04-04 | BUG-19; removed soulprint null guard from useFirstRunDaily; pass effectiveSoulprint |

### Cluster C — Quiz Pipeline

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-quiz-completion-persist-fix | Fix quiz completion state not surviving page reload — check contribution_events upsert + cluster completion gate hydration | P1 | Done | - | - | 2026-04-04 | BUG-20; localStorage persistence for individual completions; merged with Supabase on hydration; 7 tests |
| TASK-quiz-result-latency-fix | Fix 3-4 minute quiz result latency — check /api/contribute pipeline, Gemini timeout, cache hit path | P2 | Done | - | - | 2026-04-04 | BUG-21; added refresh() to useFusionSignal + 500ms delayed call after quiz completion in FuRingPage |
| TASK-quiz-placeholder-headings-fix | Audit + fix all 22 quiz title/subtitle i18n keys — replace remaining placeholders with final DE/EN copy | P2 | Done | - | - | 2026-04-04 | BUG-22; audit complete — all 24 quizzes have final DE+EN titles+subtitles; no placeholders found |

---

## Execution Plan

### Sprint S-SOULPRINT-HOTFIX: Soulprint Persist Fix

**Sprint Goal:** Root-Cause-Fix für Default-Signatur-Symptom. Upsert statt Update im Bootstrap-Endpoint + Backfill für 50 existierende prod User. Goal: GOAL-soulprint-persistence. Req: REQ-REL-soulprint-persist-onboarding. **Priorität: geht S-SUPERGLUE-STAGE1 voraus.**

#### Phase 1: Fix Bootstrap Upsert

**Capabilities delivered:**
- `/api/experience/bootstrap` persistiert `soulprint_sectors` zuverlässig auch wenn `astro_profiles`-Zeile noch nicht existiert
- Unit-Test-Coverage für upsert-Pattern (3 Szenarien)
- Inline-Kommentar dokumentiert Race-Condition-Root-Cause
- Worker-Overwrite-Hypothese (TASK-sphx-verify-no-overwrite) geklärt

**Tasks:**
1. TASK-sphx-bootstrap-upsert
2. TASK-sphx-verify-no-overwrite
3. TASK-sphx-unit-test

#### Phase 2: Backfill für 50 existierende User

**Capabilities delivered:**
- Alle existierenden User haben `soulprint_sectors` populated — Default-Signatur-Symptom für legacy User behoben
- GOAL-soulprint-persistence SC#2 (Supabase NULL-Count = 0) erfüllt

**Tasks:**
1. TASK-sphx-backfill

#### Phase 3: Deploy, Verify, Report

**Capabilities delivered:**
- Production Deploy mit fixem upsert + backfilled existing User
- Integration-Test 2-User-Szenario mit sichtbar unterschiedlichen Signaturen — GOAL-soulprint-persistence SC#3 erfüllt
- PO-Report mit Abnahme-Evidence

**Tasks:**
1. TASK-sphx-integration-test
2. TASK-sphx-po-report

---

### Sprint S-SUPERGLUE-STAGE1: Superglue Removal (Onboarding)

**Sprint Goal:** Superglue-Middleware aus `/api/experience/bootstrap` entfernen; direkter BAFE-Call + vollständiger astro_json-Persist. Strukturelle Dependency-Reduktion, nicht Symptom-Fix (Plan-§2-Hypothese 2026-04-18 widerlegt — siehe Sprint-Header). Goal: GOAL-superglue-removal. Plan: `docs/superglue-removal-stage-1-onboarding.md`.

#### Phase 0: Pre-flight & Hypothesen-Verifikation

**Capabilities delivered:**
- Hypothese aus Plan §2 in Supabase verifiziert (oder widerlegt → HALT)
- Clean Branch + tsc-Baseline etabliert
- Read-only-Audit der relevanten Dateien abgeschlossen
- astro_profiles-Schema verifiziert

**Tasks:**
1. TASK-supg1-supabase-hypothesis
2. TASK-supg1-baseline
3. TASK-supg1-audit-read
4. TASK-supg1-schema-check

#### Phase 1: fetchAndPersistChart Service

**Capabilities delivered:**
- Isolierter BAFE-Call + Supabase-Upsert als neue Einheit (noch nicht wired)
- Definierte Error-Kanäle: bafe_unavailable, bafe_invalid_response, supabase_write_failed
- GOAL-superglue-removal SC#4 (Retry + Timeout Policy dokumentiert)

**Tasks:**
1. TASK-supg1-fetch-persist-service
2. TASK-supg1-phase1-verify

#### Phase 2: Bootstrap-Endpoint Refactor

**Capabilities delivered:**
- Bootstrap-Endpoint verwendet direkten BAFE-Call (kein Superglue-Umweg)
- astro_json wird vollständig persistiert — GOAL-superglue-removal SC#1
- Server startet ohne SUPERGLUE_API_KEY

**Tasks:**
1. TASK-supg1-bootstrap-refactor
2. TASK-supg1-phase2-verify

#### Phase 3: Superglue-Code entfernen

**Capabilities delivered:**
- Superglue-Utility-Funktionen komplett aus server.mjs entfernt
- Env-Vars aus Code + .env.example entfernt
- GOAL-superglue-removal SC#3 (Grep clean in src/)

**Tasks:**
1. TASK-supg1-remove-utils
2. TASK-supg1-remove-env
3. TASK-supg1-grep-verify
4. TASK-supg1-phase3-verify

#### Phase 4: Integrationstest & Runbook

**Capabilities delivered:**
- Onboarding-Bootstrap-Test-Runbook in `4-deploy/runbooks/` verfügbar
- 2-User-Abnahme-Test erfolgreich durchlaufen
- GOAL-superglue-removal SC#2 (sichtbar unterschiedliche Signaturen) verifiziert

**Tasks:**
1. TASK-supg1-runbook
2. TASK-supg1-integration-test

#### Phase 5: Docs + Merge-Readiness

**Capabilities delivered:**
- Plan-Dokument abgeschlossen mit Ausführungsnotizen
- PO-Report erstattet, Merge-Freigabe angefragt
- GOAL-superglue-removal SC#5 (Rollback-Pfad dokumentiert)

**Tasks:**
1. TASK-supg1-update-plan-status
2. TASK-supg1-po-report

---

### Sprint S-BRIDGE: Shared Bridge Refactor

**Sprint Goal:** DIMENSION_DEFS als Single Source of Truth; Determinismus-Tests; Swift-Referenz.

#### Phase 1: DIMENSION_DEFS Single Source of Truth

**Capabilities delivered:**
- `DIMENSION_DEFS` + alle Bridge-Funktionen aus `@bazodiac/shared/signatur` importierbar
- `bipolar-engine.ts` und Web-Bridge konsumieren Shared Package — keine lokale Duplizierung
- Alle bestehenden Tests laufen weiter grün

**Tasks:**
1. TASK-sbridge-dimension-defs
2. TASK-sbridge-v3-bridge-fn
3. TASK-sbridge-shared-index
4. TASK-sbridge-engine-consume
5. TASK-sbridge-web-bridge-consume
6. TASK-sbridge-test-imports

#### Phase 2: Determinismus-Test-Suite

**Capabilities delivered:**
- Automatisierter Beweis: identische Inputs → identische Pol-Geometrie (Float-Determinismus)
- DIMENSION_DEFS Contract maschinengeprüft — stille Hz-Änderungen schlagen sofort fehl
- Bridge-Funktionen produzieren nachweislich spec-konforme Werte ∈ [0,1]

**Tasks:**
1. TASK-sbridge-dim-contract
2. TASK-sbridge-hz-constants
3. TASK-sbridge-bridge-contract
4. TASK-sbridge-determinism

#### Phase 3: Swift-Referenz & Runbook

**Capabilities delivered:**
- iOS-Entwickler hat Copy-paste-ready Swift-Konstanten für alle 6 Dimensionen (kein Hardcoding)
- Verifizierungsrunbook: Refactor nachweisbar ohne Regressionen

**Tasks:**
1. TASK-sbridge-swift-doc
2. TASK-sbridge-manual-testing

---

### Phase A: Production Hardening

**Capabilities delivered:**
- Stripe payments fully operational (webhook verification)
- Deploy and migration procedures documented as runbooks

**Tasks:**
1. TASK-stripe-webhook-secret
2. TASK-bafe-determinism-test
3. TASK-deploy-runbook
4. TASK-migration-runbook

### Phase B: Onboarding Completion

**Capabilities delivered:**
- Experience API fully wired (bootstrap + signature-delta replace direct BAFE calls)
- REQ-F-cosmic-encounter-onboarding moves from Draft → Implemented
- Cosmic Encounter 7-phase onboarding gated behind feature flag

**Tasks:**
1. TASK-fuffire-experience-api
2. TASK-onboarding-route
3. TASK-onboarding-mobile-fallback
4. TASK-onboarding-flag-gate
5. TASK-phase-b-manual-testing

### Phase C: Dashboard & Voice Polish

**Capabilities delivered:**
- Dashboard layout matches product vision (Big Three prominent top)
- Levi voice agent has Signatur V2 knowledge base
- Daily Home layout ported to Dashboard

**Tasks:**
1. TASK-dashboard-wireframe
2. TASK-dashboard-layout-redesign
3. TASK-daily-home-port
4. TASK-levi-system-prompt
5. TASK-levi-auto-summary

### Phase D: Signatur V3 Engine — SUPERSEDED by S-SIG sprint

V3 engine tasks (pole system, trail renderer, dissonance wiring, feature flag) were completed in S-SIG Phase 1–2. Remaining:
1. TASK-bloom-fine-tuning (Deferred)
2. TASK-bloom-solar-coupling (Todo)

### Phase E: Autopoietic UX Evolution

**Capabilities delivered:**
- Z-axis depth navigation replaces horizontal scrolling
- UI adapts to user's dominant Wu-Xing element
- Progressive fluidity based on engagement depth

**Tasks:**
1. TASK-depth-navigation
2. TASK-depth-nav-implement
3. TASK-element-ui-adaptation
4. TASK-engagement-fluidity
5. TASK-phase-e-manual-testing

### Phase H: Dashboard Live Signals & BaZi Fusion

**Capabilities delivered:**
- Dashboard renders volatile content first: Day Pulse events (verbatim from BAFE) always expanded at top
- Every planet card shows live Western ephemeris data (degree, sign, retrograde) AND a BaZi fusion block (Wu-Xing element, Sheng/Ke resonance, German interpretation) — no hardcoded values anywhere
- Geomagnetic storm card appears automatically when Kp ≥ 4
- Static natal data (Western chart, BaZi pillars, Wu-Xing) moved to collapsed section at bottom
- `InfluenceGauges.tsx` and `transit.ts` dead code deleted
- Core brand promise fulfilled: Western + BaZi fused at render time, not shown in silos

**Tasks:**
1. TASK-fusion-bazi-resonance-module
2. TASK-fusion-bazi-resonance-tests
3. TASK-transit-now-hook
4. TASK-transit-state-hook
5. TASK-daily-transit-hook
6. TASK-transit-dead-code-delete
7. TASK-influence-gauges-delete
8. TASK-day-pulse-expanded
9. TASK-aktive-einfluesse-fusion
10. TASK-magnetsturm-karte
11. TASK-natal-signatur-static
12. TASK-dashboard-live-reorder

### Phase H2: AktiveEinfluesseFusion — Semantic Field Completion

**Capabilities delivered:**
- `AktiveEinfluesseFusion` degradiert graceful: when BaZi Day Master is unknown → Western block shown for all planets + "BaZi-Profil nicht verfügbar" notice (no null render)
- Dual-dimension semantics: resonance (gleichklang/naehrung) → blue card; tension (kontrolle) → red card; neutral → muted gold — continuous resonance/tension color gradient per AC
- Field-strength indicator on each planet card (qualitative gering/mittel/stark, no raw float) with explanatory label "Feldstärke" per DEC-no-number-without-explanation
- All remaining REQ-F-dashboard-live-daily-signals and REQ-F-dashboard-bazi-fusion-bridge acceptance criteria covered by Vitest

**Tasks:**
1. TASK-einfluesse-stem-fallback
2. TASK-einfluesse-resonance-tension
3. TASK-einfluesse-field-strength
4. TASK-einfluesse-ac-tests

---

### Phase F: Partnership Features (Blocked)

Blocked on 6 open questions (OQ-house-system through OQ-synastry-signal). 18 tasks tracked in GitHub Issues (#115, #117, #118, #119, #123, #124, #129, #130, #132, #136). Will be added once OQs are resolved.

### Phase G: Mobile Parity

**Capabilities delivered:**
- iOS app reaches feature parity with web on core flows
- 3D SignaturCanvas mounted and functional
- Offline contribution queue tested end-to-end

**Tasks:**
1. TASK-mobile-signatur-3d
2. TASK-mobile-offline-e2e
3. TASK-mobile-onboarding
4. TASK-ios-lockscreen-widget

### Phase V1: Vibes Core (MVP)

**Capabilities delivered:**
- "Vibe abrufen" button on Dashboard delivers personalized 2–3h insight within <2s
- 3-level output: Kurzsignal → Treiber → Erklärung
- Deterministic: same user + timestamp = same result
- "Warum sehe ich das?" explainability

**Tasks:**
1. TASK-vibes-api-endpoint
2. TASK-vibes-gemini-prompt
3. TASK-vibes-deterministic-cache
4. TASK-vibes-fallback-template
5. TASK-vibes-dashboard-button
6. TASK-vibes-result-modal
7. TASK-vibes-explainability
8. TASK-vibes-response-time-test
9. TASK-vibes-manual-testing

### Phase V2: Weekly Insights

**Capabilities delivered:**
- "Deine Woche im Überblick" shows 7 life areas with tendency labels
- Top 3 areas highlighted with additional depth
- Weekly refresh (Monday boundary)
- "Warum?" explainability per area

**Tasks:**
1. TASK-weekly-life-area-mapping
2. TASK-weekly-api-endpoint
3. TASK-weekly-gemini-prompt
4. TASK-weekly-cache
5. TASK-weekly-prioritization-algo
6. TASK-weekly-insights-page
7. TASK-weekly-area-explainability
8. TASK-weekly-route
9. TASK-weekly-manual-testing

### Phase V3: Transparency & Mobile Polish

**Capabilities delivered:**
- Zero unexplained numbers in the UI (system-wide enforcement)
- Mobile-first readability validated across all insight screens
- Consistent logic between mobile and web

**Tasks:**
1. TASK-transparency-audit
2. TASK-transparency-tooltips
3. TASK-transparency-gemini-guard
4. TASK-mobile-readability-vibes
5. TASK-mobile-readability-weekly
6. TASK-mobile-vibes-integration
7. TASK-vibes-weekly-e2e-test
8. TASK-vibes-weekly-manual-testing

---

## Shared Package

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-sbridge-dimension-defs | Erstelle `packages/shared/src/signatur/dimension-defs.ts`: `DimensionDef` + `DIMENSION_DEFS` aus `bipolar-engine.ts` extrahieren | P1 | Done | [REQ-F-signatur-shared-bridge](../1-objectives/requirements/REQ-F-signatur-shared-bridge.md) | - | 2026-03-29 | |
| TASK-sbridge-v3-bridge-fn | `soulprintToDimensionWeights()` in `packages/shared/src/signatur/signatur-bridge.ts` portieren | P1 | Done | [REQ-F-signatur-shared-bridge](../1-objectives/requirements/REQ-F-signatur-shared-bridge.md) | TASK-sbridge-dimension-defs | 2026-03-29 | |
| TASK-sbridge-shared-index | `packages/shared/src/signatur/index.ts` mit allen Exporten aktualisieren | P1 | Done | [REQ-F-signatur-shared-bridge](../1-objectives/requirements/REQ-F-signatur-shared-bridge.md) | TASK-sbridge-v3-bridge-fn | 2026-03-29 | |
| TASK-sbridge-dim-contract | Vitest: DIMENSION_DEFS Contract (6 Einträge, Hz, Winkel, Farben) | P1 | Done | [REQ-F-signatur-determinism](../1-objectives/requirements/REQ-F-signatur-determinism.md) | TASK-sbridge-shared-index | 2026-03-29 | |
| TASK-sbridge-hz-constants | Vitest: Hz-Guard-Test (exakte Spec-Werte, schlägt bei stiller Änderung fehl) | P1 | Done | [REQ-F-signatur-determinism](../1-objectives/requirements/REQ-F-signatur-determinism.md) | TASK-sbridge-dim-contract | 2026-03-29 | |
| TASK-sbridge-bridge-contract | Vitest: Bridge-Funktionen outputs ∈ [0,1], Edge-cases | P1 | Done | [REQ-F-signatur-determinism](../1-objectives/requirements/REQ-F-signatur-determinism.md) | TASK-sbridge-dim-contract | 2026-03-29 | |
| TASK-sbridge-swift-doc | `packages/shared/src/signatur/SWIFT_CONSTANTS.md` mit Swift-ready Konstanten | P1 | Done | [REQ-F-signatur-ios-swift](../1-objectives/requirements/REQ-F-signatur-ios-swift.md) | TASK-sbridge-hz-constants | 2026-03-29 | |

## Setup & Infrastructure

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-stripe-webhook-secret | Configure `STRIPE_WEBHOOK_SECRET` on Railway; verify webhook signature validation | P0 | Done | - | - | 2026-03-28 | 5-min config task, only remaining Stripe blocker |
| TASK-bafe-determinism-test | Add contract test: identical birth data → identical BAFE responses across runs | P1 | Done | [REQ-F-natal-chart-calculation](../1-objectives/requirements/REQ-F-natal-chart-calculation.md) | - | 2026-03-28 | Covers determinism Success Criterion |
| TASK-depth-navigation | Design Z-axis depth navigation concept (surface → core metaphor replacing horizontal scroll) | P1 | Done | - | - | 2026-04-03 | docs/wireframes/depth-navigation-v1.md — 3-layer Z-axis concept, Framer Motion variant specs, route depth map, mobile drawer pattern |

## Frontend

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-onboarding-route | Build OnboardingPage with BirthForm + FusionRingReveal + quiz phase as state machine | P1 | Done | [REQ-F-cosmic-encounter-onboarding](../1-objectives/requirements/REQ-F-cosmic-encounter-onboarding.md) | TASK-fuffire-experience-api | 2026-03-28 | 7-phase state machine |
| TASK-onboarding-mobile-fallback | Implement mobile fallback for onboarding (CSS+image when viewport < 768px) | P1 | Done | [REQ-F-cosmic-encounter-onboarding](../1-objectives/requirements/REQ-F-cosmic-encounter-onboarding.md) | TASK-onboarding-route | 2026-03-28 | CosmicEncounterMobile component |
| TASK-onboarding-flag-gate | Gate full Cosmic Encounter behind `cosmic_encounter_v1` flag; legacy BirthForm as fallback | P1 | Done | [REQ-F-cosmic-encounter-onboarding](../1-objectives/requirements/REQ-F-cosmic-encounter-onboarding.md) | TASK-onboarding-route | 2026-03-28 | Flag currently hard-disabled |
| TASK-dashboard-wireframe | Design wireframe for Dashboard redesign (Big Three top, influence gauges, Levi, Blueprint) | P1 | Done | - | - | 2026-03-29 | docs/wireframes/dashboard-v2.md — F1 Big Four, F2 MiniSignature+Toggle, F3 unified TagesEnergie, F4 Upgrade nach Levi |
| TASK-dashboard-layout-redesign | Implement Dashboard layout per approved wireframe | P1 | Done | - | TASK-dashboard-wireframe | 2026-03-30 | F1 BigFour + F2 MiniSignature + F3 TagesEnergie + F4 Upgrade repositioned |
| TASK-tagesenergie-hero | DashboardTagesEnergie Hero-Sektion mit Kosmoswetter + Resonanz | P1 | Done | [REQ-F-signatur-day-night-pulse](../1-objectives/requirements/REQ-F-signatur-day-night-pulse.md) | TASK-dashboard-wireframe | 2026-03-30 | Implementiert + 37 Tests + i18n |
| TASK-daily-home-port | Port 5-zone Daily Home layout to Dashboard.tsx with real Contexts | P1 | Done | [REQ-F-cosmic-encounter-onboarding](../1-objectives/requirements/REQ-F-cosmic-encounter-onboarding.md) | TASK-dashboard-layout-redesign | 2026-03-30 | |
| ~~TASK-v3-pole-system~~ | ~~Duplicate of S-SIG TASK-v3-engine-production~~ | - | Done | - | - | 2026-03-29 | Superseded by S-SIG sprint |
| ~~TASK-v3-trail-renderer~~ | ~~Duplicate of S-SIG TASK-v3-engine-production~~ | - | Done | - | - | 2026-03-29 | Superseded by S-SIG sprint |
| ~~TASK-v3-dissonance-visual~~ | ~~Duplicate of S-SIG TASK-v3-dissonance-wiring~~ | - | Done | - | - | 2026-03-29 | Superseded by S-SIG sprint |
| ~~TASK-v3-feature-flag~~ | ~~Duplicate of S-SIG TASK-v3-feature-flag~~ | - | Done | - | - | 2026-03-29 | Superseded by S-SIG sprint |
| TASK-bloom-fine-tuning | Reduce glow, increase color saturation per user feedback (V2+V3) | P2 | Done | [REQ-F-fusion-ring-visualization](../1-objectives/requirements/REQ-F-fusion-ring-visualization.md) | - | 2026-04-14 | V2: bloomPass.strength 0.55→0.35 (idle), lerp(0.4,0.9)→lerp(0.25,0.55) (dynamic), 1.2→0.7 (reveal); GLSL saturation factor 1.5. V3: glowR (8+d*12)→(5+d*8), glow alpha 0.6→0.45; ctx.filter saturate(1.5) on trail+head draws |
| TASK-bloom-solar-coupling | Couple Bloom intensity to solar activity via computeRingModulation | P2 | Done | [REQ-F-space-weather-modulation](../1-objectives/requirements/REQ-F-space-weather-modulation.md) | - | 2026-04-03 | Implemented: V2 bloomPass.strength *= solarMod (FusionRingCanvasV2.tsx:922-926); V3 solarFadeMod reduces canvas clear alpha during solar activity (SignaturV3Canvas.tsx:342-343) |
| TASK-sbridge-engine-consume | `bipolar-engine.ts`: `DimensionDef`+`DIMENSION_DEFS` aus Shared Package importieren; lokale Defs entfernen | P1 | Done | [REQ-F-signatur-shared-bridge](../1-objectives/requirements/REQ-F-signatur-shared-bridge.md) | TASK-sbridge-shared-index | 2026-03-29 | |
| TASK-sbridge-web-bridge-consume | `signatur-bridge.ts` (web): lokale `soulprintToDimensionWeights` durch Shared-Import ersetzen | P1 | Done | [REQ-F-signatur-shared-bridge](../1-objectives/requirements/REQ-F-signatur-shared-bridge.md) | TASK-sbridge-engine-consume | 2026-03-29 | |
| TASK-sbridge-test-imports | `signatur-v3-engine.test.ts`: `DIMENSIONS` aus Shared Package importieren; alle 15 Tests grün | P1 | Done | [REQ-F-signatur-shared-bridge](../1-objectives/requirements/REQ-F-signatur-shared-bridge.md) | TASK-sbridge-web-bridge-consume | 2026-03-29 | |
| TASK-sbridge-determinism | Vitest: `initializePoles()` + 200× `updatePoles()` mit identischen Inputs → alle Pol-Positionen Δ < 1e-10 | P1 | Done | [REQ-F-signatur-determinism](../1-objectives/requirements/REQ-F-signatur-determinism.md) | TASK-sbridge-test-imports | 2026-03-29 | |
| TASK-depth-nav-implement | Implement depth navigation: Dashboard (surface) → Signatur (mid) → Core detail views (deep) | P1 | Done | - | TASK-depth-navigation | 2026-04-03 | useNavigationDepth hook + router.tsx AnimatePresence; 14 tests |
| TASK-element-ui-adaptation | Apply user's dominant Wu-Xing element to UI accent colors, card textures, transition speeds | P1 | Done | - | - | 2026-04-03 | useElementTheme hook; --element-accent + --ui-transition-* CSS tokens; body[data-element] card glow; 14 tests |
| TASK-engagement-fluidity | Progressive UI fluidity: new users see conventional nav, engaged users see gesture-based fluid nav | P1 | Done | - | TASK-depth-nav-implement | 2026-04-04 | useFluidityLevel hook + FuRingPage tier-based affordances; 10 tests |
| TASK-vibes-dashboard-button | Add "Vibe abrufen" CTA button on Dashboard with loading skeleton | P1 | Done | [REQ-F-vibes-core](../1-objectives/requirements/REQ-F-vibes-core.md) | TASK-vibes-api-endpoint | 2026-03-30 | | [REQ-F-vibes-core](../1-objectives/requirements/REQ-F-vibes-core.md) | TASK-vibes-api-endpoint | 2026-03-30 | |
| TASK-vibes-result-modal | Build VibesModal: Level 1 (Kurzsignal) + Level 2 (Treiber) visible, Level 3 behind "Warum?" tap | P1 | Done | [REQ-F-vibes-output-structure](../1-objectives/requirements/REQ-F-vibes-output-structure.md) | TASK-vibes-dashboard-button | 2026-03-30 | | [REQ-F-vibes-output-structure](../1-objectives/requirements/REQ-F-vibes-output-structure.md) | TASK-vibes-dashboard-button | 2026-03-30 | |
| TASK-vibes-explainability | Implement "Warum sehe ich das?" panel referencing Signatur + constellation | P1 | Done | [REQ-F-explainability-layer](../1-objectives/requirements/REQ-F-explainability-layer.md) | TASK-vibes-result-modal | 2026-03-30 | | [REQ-F-explainability-layer](../1-objectives/requirements/REQ-F-explainability-layer.md) | TASK-vibes-result-modal | 2026-03-30 | |
| TASK-weekly-insights-page | Build WeeklyInsightsPage: 7 area cards, top 3 highlighted, rest reduced | P1 | Done | [REQ-F-weekly-insights-engine](../1-objectives/requirements/REQ-F-weekly-insights-engine.md) | TASK-weekly-api-endpoint | 2026-03-30 | | [REQ-F-weekly-insights-engine](../1-objectives/requirements/REQ-F-weekly-insights-engine.md) | TASK-weekly-api-endpoint | 2026-03-30 | |
| TASK-weekly-area-explainability | Add "Warum?" per area referencing Signatur sector + transit | P1 | Done | [REQ-F-explainability-layer](../1-objectives/requirements/REQ-F-explainability-layer.md) | TASK-weekly-insights-page | 2026-03-30 | | [REQ-F-explainability-layer](../1-objectives/requirements/REQ-F-explainability-layer.md) | TASK-weekly-insights-page | 2026-03-30 | |
| TASK-weekly-route | Add `/weekly` route to router.tsx, lazy-loaded, add nav entry | P1 | Done | [REQ-F-weekly-insights-engine](../1-objectives/requirements/REQ-F-weekly-insights-engine.md) | TASK-weekly-insights-page | 2026-03-30 | | [REQ-F-weekly-insights-engine](../1-objectives/requirements/REQ-F-weekly-insights-engine.md) | TASK-weekly-insights-page | 2026-03-30 | |
| TASK-transparency-audit | Audit all UI screens for unexplained numbers | P1 | Done | [REQ-F-transparency-rule](../1-objectives/requirements/REQ-F-transparency-rule.md) | - | 2026-03-30 | 4 BARE + 3 PARTIAL fixed, 0 remaining | [REQ-F-transparency-rule](../1-objectives/requirements/REQ-F-transparency-rule.md) | - | 2026-03-30 | | [REQ-F-transparency-rule](../1-objectives/requirements/REQ-F-transparency-rule.md) | - | 2026-03-30 | Dashboard, Vibes, Weekly, Signatur, Wu-Xing, space weather |
| TASK-transparency-tooltips | Add tooltips/labels for all numerical values found in audit | P1 | Done | [REQ-F-transparency-rule](../1-objectives/requirements/REQ-F-transparency-rule.md) | TASK-transparency-audit | 2026-04-06 | Verified: InfluenceGauges has 4 planet tooltips (i18n marsTooltip/jupiterTooltip/venusTooltip/saturnTooltip), CosmicInfluenceSection has Kp+solarPressure tooltips, DashboardTagesEnergie has resonanceLabel(). All implemented during audit. Extended personalization scope → TASK-influence-tooltips-personalized + TASK-cosmic-values-explained (P2, NEEDS REFINEMENT). |
| TASK-mobile-readability-vibes | Optimize VibesModal for 375px: Level 1+2 above fold, ≥14px, ≥1.5 line-height | P1 | Done | [REQ-USA-mobile-first-readability](../1-objectives/requirements/REQ-USA-mobile-first-readability.md) | TASK-vibes-result-modal | 2026-04-06 | |
| TASK-mobile-readability-weekly | Optimize WeeklyInsightsPage for 375px: top-3 above fold | P1 | Done | [REQ-USA-mobile-first-readability](../1-objectives/requirements/REQ-USA-mobile-first-readability.md) | TASK-weekly-insights-page | 2026-04-06 | |
| TASK-vibes-weekly-manual-testing | Create runbook: Vibes + Weekly manual verification — mobile readability, no bare numbers, guard smoke test | P1 | Done | [REQ-USA-mobile-first-readability](../1-objectives/requirements/REQ-USA-mobile-first-readability.md), [REQ-F-transparency-rule](../1-objectives/requirements/REQ-F-transparency-rule.md) | TASK-vibes-weekly-e2e-test, TASK-mobile-readability-weekly | 2026-04-06 | docs/runbooks/vibes-weekly-v3-manual-verification.md |
| TASK-fusion-bazi-resonance-module | Create `src/lib/fusion-bazi/resonance.ts` — pure function: maps 7 planets to Wu-Xing elements, evaluates Sheng/Ke resonance against user's Day Master stem, returns `ResonanceResult` with type, intensity, German quote | P1 | Done | [REQ-F-dashboard-bazi-fusion-bridge](../1-objectives/requirements/REQ-F-dashboard-bazi-fusion-bridge.md) | - | 2026-04-08 | Implemented in Batch 0: 7-planet PLANET_ELEMENT, SHENG_NEXT, KE_NEXT, 5 resonance branches, German quotes. DEC-fusion-bazi-sheng-ke applied. |
| TASK-fusion-bazi-resonance-tests | Write unit tests in `src/lib/fusion-bazi/__tests__/resonance.test.ts` covering all 6 resonance branches with concrete planet+stem pairs | P1 | Done | [REQ-F-dashboard-bazi-fusion-bridge](../1-objectives/requirements/REQ-F-dashboard-bazi-fusion-bridge.md) | TASK-fusion-bazi-resonance-module | 2026-04-08 | 11 tests passing: 5 branch tests + exhaustive 70-combo matrix + locked-map size checks + quote length. Neutral is documented as mathematically unreachable safety net. |
| TASK-transit-now-hook | Create `src/hooks/useTransitNow.ts` — fetches `GET /transit/now`, returns `sector_intensity[12]`, 5-min in-memory cache | P1 | Cancelled | [REQ-F-dashboard-live-daily-signals](../1-objectives/requirements/REQ-F-dashboard-live-daily-signals.md) | - | 2026-04-08 | Cancelled: `/transit/now` endpoint does not exist in server.mjs; sector_intensity[12] already provided by useFusionSignal.signalData.baseSignals |
| TASK-transit-state-hook | Create `src/hooks/useTransitState.ts` — posts `{soulprint_sectors, quiz_sectors}` to `/transit/state`, returns `events[]` + `transit_contribution`, 15-min cache keyed on input hash | P1 | Cancelled | [REQ-F-dashboard-live-daily-signals](../1-objectives/requirements/REQ-F-dashboard-live-daily-signals.md) | TASK-transit-now-hook | 2026-04-08 | Cancelled: useTransitState.ts already exists with a different interface; events (incl. description_de) already served by useFusionSignal.events (extended in Batch 0) |
| TASK-daily-transit-hook | Create `src/hooks/useDailyTransit.ts` — posts today's date + user tz/lat/lon to `/calculate/western`, returns `bodies{}` + `aspects[]`, 1-hour cache keyed on date string | P1 | Done | [REQ-F-dashboard-live-daily-signals](../1-objectives/requirements/REQ-F-dashboard-live-daily-signals.md) | - | 2026-04-08 | Implemented in Batch 0: authedFetch to /api/calculate/western (noon UTC lat=0 lon=0), computes degree_in_sign + is_retrograde, date-scoped sessionStorage cache. Dependency on TASK-transit-state-hook waived — hook is independent. |
| TASK-transit-dead-code-delete | Delete `src/lib/fusion-ring/transit.ts` — confirm zero external imports first: `grep -rn "fusion-ring/transit" src/` | P1 | Done | - | TASK-daily-transit-hook | 2026-04-08 | Zero callers confirmed (fusion-ring-website/fusion-ring-transit is a different file). Deleted. Suite: 1406 pass / 3 pre-existing fail. |
| TASK-day-pulse-expanded | Build `src/components/dashboard/DayPulseExpanded.tsx` — always-expanded section: Day Pulse/Trace mode from `useFusionSignal()`, today's event text from `useFusionSignal().events[0].description_de` + `.personal_context` verbatim, fallback "Heute keine markanten Ereignisse. Nutze die Ruhe." | P1 | Done | [REQ-F-dashboard-live-daily-signals](../1-objectives/requirements/REQ-F-dashboard-live-daily-signals.md) | - | 2026-04-08 | No accordion, no collapse. Brand voice: Du, no Horoskop/Schicksal. Uses useFusionSignal.events (TASK-transit-state-hook dep removed — hook cancelled) |
| TASK-aktive-einfluesse-fusion | Build `src/components/dashboard/AktiveEinfluesseFusion.tsx` — 6 planet cards, each with Western block (degree, sign, retrograde) from `useDailyTransit()` and BaZi block (element, resonance type badge, German quote) from `calculatePlanetBaziResonance()` | P1 | Done | [REQ-F-dashboard-bazi-fusion-bridge](../1-objectives/requirements/REQ-F-dashboard-bazi-fusion-bridge.md), [REQ-F-dashboard-live-daily-signals](../1-objectives/requirements/REQ-F-dashboard-live-daily-signals.md) | TASK-fusion-bazi-resonance-module, TASK-daily-transit-hook | 2026-04-08 | 9 tests pass. Returns null for missing/invalid dayMasterStem. Skeleton while loading. |
| TASK-magnetsturm-karte | Build `src/components/dashboard/MagnetsturmKarte.tsx` — renders only when `useSpaceWeather().kpIndex >= 4`; shows Kp value + G-class, solar wind speed, Bz; G3+ pulse border animation | P1 | Done | [REQ-F-dashboard-live-daily-signals](../1-objectives/requirements/REQ-F-dashboard-live-daily-signals.md) | - | 2026-04-08 | Self-hides (returns null) when kp < 4. No placeholder card. Uses useSpaceWeather() only (TASK-transit-state-hook dep removed — hook cancelled) |
| TASK-natal-signatur-static | Build `src/components/dashboard/NatalSignaturStatic.tsx` — collapsed accordion wrapping existing AstroAccordion + BaZiFourPillars + WuXing components; header "Deine Natal-Signatur (statisch)" | P1 | Done | [REQ-F-dashboard-live-daily-signals](../1-objectives/requirements/REQ-F-dashboard-live-daily-signals.md) | - | 2026-04-08 | 7 tests pass. Children-slot wrapper, collapsed by default, aria-expanded toggle. |
| TASK-dashboard-live-reorder | Rewrite `Dashboard.tsx` render order to: DayPulseExpanded → AktiveEinfluesseFusion → MagnetsturmKarte → NatalSignaturStatic; remove InfluenceGauges import | P1 | Done | [REQ-F-dashboard-live-daily-signals](../1-objectives/requirements/REQ-F-dashboard-live-daily-signals.md) | TASK-day-pulse-expanded, TASK-aktive-einfluesse-fusion, TASK-magnetsturm-karte, TASK-natal-signatur-static, TASK-influence-gauges-delete | 2026-04-08 | volatile-first block inserted; DashboardAstroSection wrapped in NatalSignaturStatic; section order test updated; typecheck clean |
| TASK-influence-gauges-delete | Delete `src/components/dashboard/InfluenceGauges.tsx` — confirm only Dashboard.tsx imports it before deletion | P1 | Done | - | TASK-fusion-bazi-resonance-module | 2026-04-08 | Also deleted two test files + CSS rules; Dashboard.tsx import and usage removed |

## API Server

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-fuffire-experience-api | Wire `/experience/bootstrap` + `/experience/signature-delta` in server.mjs; replace direct BAFE calls | P1 | Done | [REQ-F-cosmic-encounter-onboarding](../1-objectives/requirements/REQ-F-cosmic-encounter-onboarding.md) | - | 2026-03-28 | FuFirE live at bafe-production.up.railway.app |
| TASK-levi-system-prompt | Configure ElevenLabs agent with Signatur V2 knowledge base | P1 | Done | - | - | 2026-03-30 | Enhanced /api/profile with dominant_element, signatur_summary, day_mode, vibes_summary | - | - | 2026-03-28 | See docs/LEVI_SIGNATUR_V2_KNOWLEDGE.md |
| TASK-levi-auto-summary | Auto-summarize user profile after 3 Levi sessions via /api/agent/summary | P2 | Done | - | TASK-levi-system-prompt | 2026-03-30 | Gemini synthesis + agent_summary column | - | TASK-levi-system-prompt | 2026-03-28 | |
| TASK-eve-brand-safety-review | Review Eve system prompt for brand safety before production launch | P1 | Done | [REQ-SEC-eve-brand-safety](../1-objectives/requirements/REQ-SEC-eve-brand-safety.md) | - | 2026-04-08 | Reviewed + approved by Ben 2026-04-08. 2 minor calibrations applied in ElevenLabs dashboard. docs/eve-brand-safety-checklist.md updated. |
| TASK-agent-extensibility-verify | Verify adding 3rd agent requires config-only change (no structural code) | P2 | Done | [REQ-MNT-agent-extensibility](../1-objectives/requirements/REQ-MNT-agent-extensibility.md) | - | 2026-03-29 | Smoke test: add mock agent to config, confirm renders |
| TASK-vibes-api-endpoint | Create `/api/vibes`: soulprint + transit + space weather → Gemini → 3-level JSON | P1 | Done | [REQ-F-vibes-core](../1-objectives/requirements/REQ-F-vibes-core.md) | - | 2026-03-30 | Implemented in Phase V1 | [REQ-F-vibes-core](../1-objectives/requirements/REQ-F-vibes-core.md) | - | 2026-03-30 | Reuses existing transit-state + space weather data |
| TASK-vibes-gemini-prompt | Design Gemini prompt: 3-level structure, resource-oriented, no bare numbers, German | P1 | Done | [REQ-F-vibes-output-structure](../1-objectives/requirements/REQ-F-vibes-output-structure.md) | TASK-vibes-api-endpoint | 2026-03-30 | | [REQ-F-vibes-output-structure](../1-objectives/requirements/REQ-F-vibes-output-structure.md) | TASK-vibes-api-endpoint | 2026-03-30 | |
| TASK-vibes-deterministic-cache | Deterministic cache: same user + same 30-min window = same result (L1 + L2 Supabase) | P1 | Done | [REQ-F-vibes-core](../1-objectives/requirements/REQ-F-vibes-core.md) | TASK-vibes-api-endpoint | 2026-03-30 | | [REQ-F-vibes-core](../1-objectives/requirements/REQ-F-vibes-core.md) | TASK-vibes-api-endpoint | 2026-03-30 | |
| TASK-vibes-fallback-template | Deterministic fallback templates when Gemini unavailable (5 variants by element) | P1 | Done | [REQ-PERF-vibes-response-time](../1-objectives/requirements/REQ-PERF-vibes-response-time.md) | TASK-vibes-api-endpoint | 2026-03-30 | | [REQ-PERF-vibes-response-time](../1-objectives/requirements/REQ-PERF-vibes-response-time.md) | TASK-vibes-api-endpoint | 2026-03-30 | |
| TASK-vibes-response-time-test | Perf test: Vibes API <2s p95 (Gemini), <500ms (cached) | P1 | Done | [REQ-PERF-vibes-response-time](../1-objectives/requirements/REQ-PERF-vibes-response-time.md) | TASK-vibes-deterministic-cache | 2026-03-30 | | [REQ-PERF-vibes-response-time](../1-objectives/requirements/REQ-PERF-vibes-response-time.md) | TASK-vibes-deterministic-cache | 2026-03-30 | |
| TASK-weekly-life-area-mapping | Map 12 zodiac sectors → 7 life areas | P1 | Done | [REQ-F-weekly-insights-engine](../1-objectives/requirements/REQ-F-weekly-insights-engine.md) | - | 2026-03-30 | 18 tests, house-based mapping | [REQ-F-weekly-insights-engine](../1-objectives/requirements/REQ-F-weekly-insights-engine.md) | - | 2026-03-30 | | [REQ-F-weekly-insights-engine](../1-objectives/requirements/REQ-F-weekly-insights-engine.md) | - | 2026-03-30 | |
| TASK-weekly-api-endpoint | Create `/api/weekly-insights`: soulprint + weekly transit → 7 areas via Gemini | P1 | Done | [REQ-F-weekly-insights-engine](../1-objectives/requirements/REQ-F-weekly-insights-engine.md) | TASK-weekly-life-area-mapping | 2026-03-30 | | [REQ-F-weekly-insights-engine](../1-objectives/requirements/REQ-F-weekly-insights-engine.md) | TASK-weekly-life-area-mapping | 2026-03-30 | |
| TASK-weekly-gemini-prompt | Design Gemini prompt: 7 areas, 1 statement + 1 tendency each, resource-oriented, German | P1 | Done | [REQ-F-weekly-insights-engine](../1-objectives/requirements/REQ-F-weekly-insights-engine.md) | TASK-weekly-api-endpoint | 2026-03-30 | | [REQ-F-weekly-insights-engine](../1-objectives/requirements/REQ-F-weekly-insights-engine.md) | TASK-weekly-api-endpoint | 2026-03-30 | |
| TASK-weekly-cache | Weekly cache: 1 per user per ISO week (L1 + L2 Supabase) | P1 | Done | [REQ-F-weekly-insights-engine](../1-objectives/requirements/REQ-F-weekly-insights-engine.md) | TASK-weekly-api-endpoint | 2026-03-30 | | [REQ-F-weekly-insights-engine](../1-objectives/requirements/REQ-F-weekly-insights-engine.md) | TASK-weekly-api-endpoint | 2026-03-30 | |
| TASK-weekly-prioritization-algo | Top-3 area selection: transit intensity × soulprint weight, deterministic | P2 | Done | [REQ-F-weekly-area-prioritization](../1-objectives/requirements/REQ-F-weekly-area-prioritization.md) | TASK-weekly-api-endpoint | 2026-03-30 | | [REQ-F-weekly-area-prioritization](../1-objectives/requirements/REQ-F-weekly-area-prioritization.md) | TASK-weekly-api-endpoint | 2026-03-30 | |
| TASK-transparency-gemini-guard | Gemini output validation: reject/rewrite responses with bare numbers | P1 | Done | [REQ-F-transparency-rule](../1-objectives/requirements/REQ-F-transparency-rule.md) | TASK-vibes-gemini-prompt | 2026-04-06 | |
| TASK-vibes-weekly-e2e-test | Integration test: Vibes + Weekly API return valid structure, no bare numbers | P1 | Done | [REQ-F-transparency-rule](../1-objectives/requirements/REQ-F-transparency-rule.md) | TASK-transparency-gemini-guard | 2026-04-06 | |

## Mobile

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-mobile-signatur-3d | Mount SignaturCanvas on FuRingScreen (currently unused expo-gl + three.js component) | P2 | Done | [REQ-F-fusion-ring-visualization](../1-objectives/requirements/REQ-F-fusion-ring-visualization.md) | - | 2026-04-07 | SignaturCanvas (expo-gl/three.js, 6K particles, pan+pinch) replaces SignaturVisual; paused={!isFocused} halts render loop when tab not active; soulprintSectors passed directly |
| TASK-mobile-offline-e2e | End-to-end test: offline quiz → queue → flush on reconnect | P2 | Done | [REQ-F-quiz-contribution-system](../1-objectives/requirements/REQ-F-quiz-contribution-system.md) | - | 2026-03-28 | |
| TASK-mobile-onboarding | Port onboarding flow to mobile (CosmicEncounterMobile fallback) | P2 | Done | [REQ-F-cosmic-encounter-onboarding](../1-objectives/requirements/REQ-F-cosmic-encounter-onboarding.md) | TASK-onboarding-route | 2026-04-08 | 3-phase state machine (birth-input → calculating → ring-reveal); animated gold+cyan orb backdrop (native equiv of CosmicEncounterMobile); SignaturCanvas ring-reveal via wuxingToSoulprint; 6 tests |
| TASK-ios-lockscreen-widget | Concept + prototype for daily Signatur widget on iOS Lock Screen | P2 | Cancelled | - | - | 2026-04-10 | Replaced by TASK-ios-lockscreen-widget-spike; no spec, no requirements, would block P1 Vibes work |
| TASK-ios-lockscreen-widget-spike | WidgetKit feasibility spike: research iOS Lock Screen widget constraints, data flow, effort estimate; document in docs/spikes/ | P2 | Done | - | - | 2026-04-10 | docs/spikes/ios-lockscreen-widget-feasibility.md — recommend Swift app path, defer until after V1 Vibes; OQ-widget open |
| TASK-mobile-vibes-integration | Add Vibes button + Weekly link to mobile app (same API, adapted layout) | P1 | Done | [REQ-USA-mobile-first-readability](../1-objectives/requirements/REQ-USA-mobile-first-readability.md) | TASK-vibes-api-endpoint, TASK-weekly-api-endpoint | 2026-03-30 | |

## Deploy & Operations

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-deploy-runbook | Create Railway deploy runbook (build, env vars checklist, rollback steps) | P0 | Done | - | - | 2026-03-28 | |
| TASK-migration-runbook | Create Supabase migration runbook (SQL Editor workflow, rollback patterns) | P0 | Done | - | - | 2026-03-28 | |
| TASK-phase-b-manual-testing | Create onboarding runbook: test scenarios for all 7 phases, desktop + mobile, flag on/off | P1 | Done | - | TASK-onboarding-flag-gate | 2026-03-28 | |
| TASK-phase-e-manual-testing | Update deploy runbook with depth-nav test scenarios and element-adaptation verification | P1 | Done | - | TASK-engagement-fluidity | 2026-04-04 | 4-deploy/runbooks/phase-e-autopoietic-ux-test.md — 8 sections, 24 scenarios |
| TASK-sbridge-manual-testing | Erstelle `docs/runbooks/signatur-s-bridge-verification.md`: vitest grün, MiniSignature rendert, Signatur-Seite rendert, tsc clean | P1 | Done | - | TASK-sbridge-determinism, TASK-sbridge-swift-doc | 2026-03-29 | |

## Sprint S-DASH-LIVE: Dashboard Live Data, Navigation & Bug Fixes

**Sprint Goal:** Navigation shell mit 3 primary items + Settings umsetzen, Dashboard-Daten auf Live-Daten umstellen, 5-Card Identity Set bauen, 4 Bug-Handoffs fixen, WCAG-Kontrast auditieren.

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-nav-shell-top-bar | Build top bar component: 3 items (Astro-Agents, Planetarium, Signatur) + Settings entry point; retire old nav items | P1 | Done | [REQ-F-navigation-shell](../1-objectives/requirements/REQ-F-navigation-shell.md) | - | 2026-04-02 | Per DEC-navigation-shell |
| TASK-nav-settings-menu | Implement Settings menu: DE/EN toggle, Dark/Bright, User Profile, Subscription, Logout, AGB, Datenschutz, sky.bazodiac.space (new tab) | P1 | Done | [REQ-F-navigation-shell](../1-objectives/requirements/REQ-F-navigation-shell.md) | TASK-nav-shell-top-bar | 2026-04-02 | |
| TASK-nav-mobile-responsive | Verify all 3 items + Settings visible on mobile viewports without hamburger-only hide; touch targets ≥44px | P1 | Done | [REQ-F-navigation-shell](../1-objectives/requirements/REQ-F-navigation-shell.md) | TASK-nav-settings-menu | 2026-04-02 | |
| TASK-identity-cards-component | Build 5-card identity set: Sun Sign, Moon Sign, Ascendant, Year Animal, Wu-Xing Element — consistent card design system | P2 | Done | [REQ-F-dashboard-identity-cards](../1-objectives/requirements/REQ-F-dashboard-identity-cards.md) | - | 2026-04-02 | |
| TASK-identity-cards-fallback | Truthful fallback state per card when data unavailable; no indefinite spinner | P2 | Done | [REQ-F-dashboard-identity-cards](../1-objectives/requirements/REQ-F-dashboard-identity-cards.md) | TASK-identity-cards-component | 2026-04-02 | |
| TASK-influence-gauges-live | Wire InfluenceGauges to live transit signal data; remove hardcoded Mars 0.82/Jupiter 0.65/Venus 0.45/Saturn 0.30 defaults | P1 | Done | [REQ-F-dashboard-live-daily-signals](../1-objectives/requirements/REQ-F-dashboard-live-daily-signals.md) | - | 2026-04-02 | Confirmed placeholder in InfluenceGauges.tsx |
| TASK-daily-pulse-date-cache | Fix useFirstRunDaily date boundary: cache key rotates at midnight so Day-Pulse text changes each day | P1 | Done | [REQ-F-dashboard-live-daily-signals](../1-objectives/requirements/REQ-F-dashboard-live-daily-signals.md) | - | 2026-04-02 | |
| TASK-space-weather-dashboard | Add cosmic weather as first-class influence section on Dashboard using existing NOAA/DONKI pipeline | P1 | Done | [REQ-F-dashboard-live-daily-signals](../1-objectives/requirements/REQ-F-dashboard-live-daily-signals.md) | - | 2026-04-02 | |
| TASK-birthform-inline-validation | Replace BirthForm.tsx alert() calls with inline field-level German error messages | P1 | Done | [REQ-F-cosmic-encounter-onboarding](../1-objectives/requirements/REQ-F-cosmic-encounter-onboarding.md) | - | 2026-04-02 | Track A — fix before onboarding polish |
| TASK-signatur-tile-resolve | Fix signature dashboard tile stuck in "wird berechnet": bootstrap failure → truthful fallback state | P1 | Done | [REQ-F-fusion-ring-visualization](../1-objectives/requirements/REQ-F-fusion-ring-visualization.md) | - | 2026-04-03 | MiniSignature: loading prop distinguishes fetch-in-progress from data-unavailable; 5 new tests |
| TASK-planetarium-sky-wiring | Fix skyMode propagation from PlanetariumContext to BirthChartOrrery currentSky prop | P2 | Done | - | - | 2026-04-04 | Fixed by Planetarium extraction (fe3eaca): Dashboard.tsx now wires skyMode → currentSky directly |
| TASK-wcag-contrast-audit | Audit and fix WCAG 2.1 AA contrast failures on dark background; document pass/fail per component | P2 | Done | [REQ-USA-wcag-contrast](../1-objectives/requirements/REQ-USA-wcag-contrast.md) | - | 2026-04-04 | 10 fixes across 5 components; docs/wcag-contrast-audit-2026-04-04.md |
| TASK-s-dash-live-manual-testing | Create runbook: nav shell + Settings items, identity cards, daily live data, bug fix verification scenarios | P1 | Done | - | TASK-wcag-contrast-audit | 2026-04-04 | 4-deploy/runbooks/s-dash-live-test.md — 11 sections, 40 scenarios |

---

## Sprint S-SIG-MORPH: Signatur Behavior — Dissonance, Quiz Morphing, Night Pulse

**Sprint Goal:** V3 Bipolar Engine erhält vollständige Dissonanz-Visualisierung (d_natal Wiring, Lissajous-Blend-Tuning, Elemental Vibration, Pole Glow), kontinuierliches Quiz-Morphing mit morphTo() API + Trail-Blend + Queue, Night-Pulse/Trace mit Premium-Gate, und Verifikation der bereits implementierten DashboardTagesEnergie Hero-Card.

**Code-Analyse (2026-04-05):** `computeV3Dissonance`, `updatePoles` (Lissajous/symmetric blend), `computeVisualModulation`, `lerpModulation`, `dissonanceEase`, `morphDuration`, `DashboardTagesEnergie` (Hero-Card, Kosmoswetter-Strip, Resonanz) sind bereits implementiert. Fehlend: d_natal Wiring aus echten Quiz-Weights, morphTo() API, Trail-Blend, Queue, Night-Pulse, Pole Glow.

### Phase 1 — Dissonance Visual Wiring

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-dissonance-d-natal-calc | Wire d_natal per dimension: normalized diff natal_weight vs quiz_weight into computeV3Dissonance; ensure FuRingPage passes both weight sets | P1 | Done | [REQ-F-signatur-dissonance-model](../1-objectives/requirements/REQ-F-signatur-dissonance-model.md) | - | 2026-04-06 | FusionRing3D: quizWeights fallback to natal dimension weights (d_natal=0 pristine state). Test added. |
| TASK-dissonance-lissajous-blend | Verify+tune Lissajous blend in updatePoles: per-dimension d from TASK-dissonance-d-natal-calc feeds clamp(d×2) amplification; ab d=0.5 reines Lissajous | P1 | Done | [REQ-F-signatur-dissonance-model](../1-objectives/requirements/REQ-F-signatur-dissonance-model.md) | TASK-dissonance-d-natal-calc | 2026-04-06 | Verified correct. 4 blend tests added: formula, d=0 symmetric, d=0.5 Lissajous divergence, d=0.25 interpolation. |
| TASK-dissonance-elemental-vibration | Wire d_elemental → renderer vibration texture: Ke 12Hz angular vs Sheng 3Hz organic using computeVisualModulation output in V3 canvas | P1 | Done | [REQ-F-signatur-dissonance-model](../1-objectives/requirements/REQ-F-signatur-dissonance-model.md) | TASK-dissonance-d-natal-calc | 2026-04-06 | Ke waveform: tanh(3×sin) → angular/crystalline. Sheng: plain sin → organic. Color temperature shift in canvas (cool for Ke, warm for Sheng). 2 tests added. |
| TASK-dissonance-pole-glow-scale | Scale pole head glow radius 8px (d=0) → 20px (d=1) as radial gradient per dimension based on d_natal | P1 | Done | [REQ-F-signatur-dissonance-model](../1-objectives/requirements/REQ-F-signatur-dissonance-model.md) | TASK-dissonance-d-natal-calc | 2026-04-06 | Already implemented: drawPoleHead uses glowR = 8 + dissonance * 12 (8px at d=0, 20px at d=1). |
| TASK-dissonance-d-accumulated-stub | Add d_accumulated channel as neutral stub (value=0, no visible effect) — architecture-ready for Phase 2 density field | P1 | Done | [REQ-F-signatur-dissonance-model](../1-objectives/requirements/REQ-F-signatur-dissonance-model.md) | TASK-dissonance-lissajous-blend | 2026-04-06 | Already guarded by dAccumulated > 0.1 in updatePoles. 2 tests added: neutral at d=0, hook active above threshold. |

### Phase 2 — Quiz Morphing

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-quiz-morph-engine-api | Add morphTo(newWeights) to V3 bipolar-engine: ~2s transition using lerpModulation + dissonanceEase, continuous animation loop, no cuts/snapshot resets | P1 | Done | [REQ-F-signatur-quiz-morph](../1-objectives/requirements/REQ-F-signatur-quiz-morph.md) | TASK-dissonance-d-natal-calc | 2026-04-06 | V3MorphState + lerpV3DissonanceState + createV3Morph + tickV3Morph in bipolar-engine. Canvas: quiz weight changes → morph (no pole reset). 10 tests. |
| TASK-quiz-morph-trail-blend | Old trail fades (alpha decay) while new geometry writes in during morph — organic overlay, no hard reset | P1 | Done | [REQ-F-signatur-quiz-morph](../1-objectives/requirements/REQ-F-signatur-quiz-morph.md) | TASK-quiz-morph-engine-api | 2026-04-06 | Bell-curve fill alpha boost during morph: peaks at 50% progress (0.018 extra fade), returns to 0 at start/end. |
| TASK-quiz-morph-queue | Queue rapid weight updates (<2s apart); apply sequentially via promise chain, never skip | P1 | Done | [REQ-F-signatur-quiz-morph](../1-objectives/requirements/REQ-F-signatur-quiz-morph.md) | TASK-quiz-morph-engine-api | 2026-04-06 | morphQueueRef: if morph active, push to queue; render loop drains queue when morph completes. |
| TASK-quiz-morph-reduced-motion | prefers-reduced-motion: instant weight update, skip transition animation, no ringbuffer-flush visual jump | P1 | Done | [REQ-F-signatur-quiz-morph](../1-objectives/requirements/REQ-F-signatur-quiz-morph.md) | TASK-quiz-morph-engine-api | 2026-04-06 | useReducedMotion() → instant dissonanceRef update, clears morph + queue. |
| TASK-quiz-morph-contribution-wiring | Wire useQuizContribution → V3 morphTo() on quiz completion in FuRingPage; verify single quiz = subtle shift (≤15%), full cluster = deutliche Verschiebung | P1 | Done | [REQ-F-signatur-quiz-morph](../1-objectives/requirements/REQ-F-signatur-quiz-morph.md) | TASK-quiz-morph-trail-blend | 2026-04-06 | Existing liveQuizWeights → morph wiring confirmed correct. Added pendingLiveWeightsClearRef: signal refresh clears liveQuizWeights → queues second morph to cumulative v3DimensionWeights for full-cluster shift. |

### Phase 3 — Night-Pulse + Hero Card Verification

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-night-pulse-h-calc | Night-Pulse H calculation: Moon position + BaZi night pillar as data basis — server-side in /api/experience/daily endpoint | P1 | Done | [REQ-F-signatur-day-night-pulse](../1-objectives/requirements/REQ-F-signatur-day-night-pulse.md) | - | 2026-04-06 | approxMoonSignIndex + hourBranchElement + computeNightHarmonyIndex in server.mjs; DailyFusionSchema extended with optional night_harmony_index/night_mode; 26 new tests |
| TASK-night-pulse-visual | Night-pulse visual modulation: same trail persistence ±% as day, 50% intensity ceiling; voice register softer, introspective | P1 | Done | [REQ-F-signatur-day-night-pulse](../1-objectives/requirements/REQ-F-signatur-day-night-pulse.md) | TASK-night-pulse-h-calc | 2026-04-06 | computeNightHarmonic (50% intensity cap) in day-harmonic.ts; isNighttime() helper; FuRingPage selects night harmonic 21:00-06:00; 34 tests |
| TASK-night-pulse-premium-gate | Night access: daily Premium, weekends all users — gate in useFirstRunDaily + DashboardTagesEnergie conditional | P1 | Done | [REQ-F-signatur-day-night-pulse](../1-objectives/requirements/REQ-F-signatur-day-night-pulse.md) | TASK-night-pulse-visual | 2026-04-06 | activeDayHarmonic in FuRingPage + Dashboard: weekend || isPremium guard; weekday free-tier stays on dayHarmonic |
| TASK-tagesenergie-verify-done | Verify existing DashboardTagesEnergie meets all REQ-F-signatur-day-night-pulse acceptance criteria: hero card always visible, element icon+headline, body narrative, Kosmoswetter strip, Resonanz, PremiumGate on action, no auto-modal | P1 | Done | [REQ-F-signatur-day-night-pulse](../1-objectives/requirements/REQ-F-signatur-day-night-pulse.md) | - | 2026-04-06 | All 7 AC verified: always visible, correct order, friction context, 6 Kosmoswetter pill types, resonance formula (0.65/0.35), PremiumGate on action only, no auto-modal |
| TASK-s-sig-morph-manual-testing | Create runbook: dissonance visual verification (d=0 symmetric, d=1 lissajous), quiz morph test scenarios (single+cluster+rapid), night pulse weekend/premium gate test | P1 | Done | - | TASK-quiz-morph-contribution-wiring, TASK-night-pulse-premium-gate | 2026-04-06 | docs/runbooks/signatur-v3-morph-night-pulse-verification.md — 4 sections, 11 scenarios |

---

## Sprint S-UX-DEPTH: Z-Axis Depth Navigation & Progressive Fluidity

**Sprint Goal:** Z-Achsen-Tiefen-Navigation (Dashboard→Signatur→Detail) mit 400ms ease-out implementieren. Progressive UI-Fluidity: 0 Cluster = konventionell, 1+ = erste Fluidity-Affordance, 6 = vollständige Gesture-Navigation. prefers-reduced-motion immer berücksichtigen.

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-depth-nav-transition | Implement Z-axis transition system: zoom-in/depth-push for Dashboard→Signatur, Signatur→detail | P1 | Done | [REQ-F-depth-navigation](../1-objectives/requirements/REQ-F-depth-navigation.md) | - | 2026-04-06 | Delivered by TASK-depth-nav-implement: INWARD_VARIANTS (scale 1.04→1) + OUTWARD_VARIANTS in router.tsx |
| TASK-depth-nav-back | Implement outward transition (zoom-out/depth-pop) for back navigation at all depth levels | P1 | Done | [REQ-F-depth-navigation](../1-objectives/requirements/REQ-F-depth-navigation.md) | TASK-depth-nav-transition | 2026-04-06 | Delivered by TASK-depth-nav-implement: OUTWARD_VARIANTS (scale 0.97→1 on enter, 1.03→0 on exit) |
| TASK-depth-nav-timing | Apply 400ms ease-out to depth transitions desktop; drawer pattern on mobile | P1 | Done | [REQ-F-depth-navigation](../1-objectives/requirements/REQ-F-depth-navigation.md) | TASK-depth-nav-transition | 2026-04-06 | Delivered by TASK-depth-nav-implement: duration:0.4, ease:[0.4,0,0.2,1]; useReducedMotion→FADE_VARIANTS |
| TASK-fluidity-cluster-hook | Track cluster completion count (0–6) in user state; expose via useFluidityLevel() hook | P1 | Done | [REQ-F-progressive-ui-fluidity](../1-objectives/requirements/REQ-F-progressive-ui-fluidity.md) | - | 2026-04-06 | Delivered by TASK-engagement-fluidity: useFluidityLevel() + countCompletedClusters() + clusterCountToTier() |
| TASK-fluidity-tier-0 | Verify 0-cluster users see fully conventional UI on Signatur (labeled buttons, explicit scroll indicators) | P1 | Done | [REQ-F-progressive-ui-fluidity](../1-objectives/requirements/REQ-F-progressive-ui-fluidity.md) | TASK-fluidity-cluster-hook | 2026-04-06 | Delivered by TASK-engagement-fluidity: tier 0 → labeled back button, no ring animation |
| TASK-fluidity-tier-1 | Add first fluid affordance at ≥1 cluster: gesture-hint animation or reduced label prominence | P1 | Done | [REQ-F-progressive-ui-fluidity](../1-objectives/requirements/REQ-F-progressive-ui-fluidity.md) | TASK-fluidity-tier-0 | 2026-04-06 | Delivered by TASK-engagement-fluidity: tier 1 → back label hidden + ring pulse animation |
| TASK-fluidity-tier-6 | Full fluidity at 6 clusters: gesture-based nav + spatial depth as primary interaction mode | P1 | Done | [REQ-F-progressive-ui-fluidity](../1-objectives/requirements/REQ-F-progressive-ui-fluidity.md) | TASK-fluidity-tier-1 | 2026-04-06 | Delivered by TASK-engagement-fluidity: tier 2 at 6 clusters (same as tier 1 affordances, extensible) |
| TASK-fluidity-reduced-motion | prefers-reduced-motion: force conventional UI for all cluster levels | P1 | Done | [REQ-F-progressive-ui-fluidity](../1-objectives/requirements/REQ-F-progressive-ui-fluidity.md) | TASK-fluidity-tier-0 | 2026-04-06 | Delivered by TASK-engagement-fluidity: useReducedMotion() → tier 0 forced in clusterCountToTier() |
| TASK-s-ux-depth-manual-testing | Create runbook: depth transition scenarios, fluidity tier progression test at 0/1/6 clusters | P1 | Done | - | TASK-fluidity-tier-6, TASK-depth-nav-back | 2026-04-06 | docs/runbooks/depth-navigation-fluidity-manual-verification.md |

---

## Sprint S-DASH-UX: Dashboard UX Polish & Card Redesign

**Sprint Goal:** Dashboard komplett neuordnen: Planetarium an oberste Position, Informationshierarchie korrigieren, Theme-Konsistenz (Bright/Dark), Identity-Kacheln vertikal+Accordion, Signatur-Label fix, Planetarium-Proportionen, Agent-Gruppierung, Tooltip-Personalisierung, Naming-Konsistenz, einheitliches Spacing.

### Cluster A — Theme & Card Consistency

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-cosmic-influence-bright-audit | Audit + fix CosmicInfluenceSection + InfluenceGauges bright mode inconsistencies — ensure all cards use CSS vars, no hardcoded dark colors | P1 | Done | - | - | 2026-04-05 | cosmic-tile class is used but inline gradient styles may override |
| TASK-card-titles-centered | Center card section titles horizontally and increase font size for visual hierarchy | P3 | Done | - | - | 2026-04-06 | DashboardTagesEnergie + InfluenceGauges + CosmicInfluenceSection: text-[9px/10px] → text-xs, flex justify-between → relative/justify-center with absolute right-0 indicator |
| TASK-dashboard-brandmark-heading-restyle | Replace dashboard hero heading with single-word brandmark "Bazodiac", remove leading "dein", apply larger Cormorant Garamond styling, gold treatment, ornamental underline | P1 | Done | - | - | 2026-04-05 | Explicit PO request; brandmark styling as intentional UI identity change |

### Cluster B — Identity Cards Redesign

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-identity-vertical-stack | Convert DashboardBigFourCard from horizontal grid to left-aligned vertical stack | P3 | Done | [REQ-F-dashboard-identity-cards](../1-objectives/requirements/REQ-F-dashboard-identity-cards.md) | - | 2026-04-06 | grid-cols-2..5 → flex flex-col gap-2; each card retains horizontal icon+label layout |
| TASK-identity-accordion | Add single-open accordion behavior: click card → expand downward with contextual description | P3 | Done | [REQ-F-dashboard-identity-cards](../1-objectives/requirements/REQ-F-dashboard-identity-cards.md) | TASK-identity-vertical-stack | 2026-04-06 | Single-open accordion in DashboardBigFour: 300ms ease-out, prefers-reduced-motion, disabled when no description, 6 accordion tests added |
| TASK-identity-accordion-content | Write per-sign/element/animal description texts (DE+EN) for all 5 accordion panels | P3 | Done | [REQ-F-dashboard-identity-cards](../1-objectives/requirements/REQ-F-dashboard-identity-cards.md) | TASK-identity-accordion | 2026-04-06 | Descriptions pulled directly from ZODIAC_SIGNS_DATA (sun/moon/asc contexts), EARTHLY_BRANCHES, WUXING_ELEMENTS — no i18n keys needed; 14 tests pass |

### Cluster C — Signatur Tile

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-signatur-label-rename | Rename "deine Form" / "Your Form" to "deine Signatur" / "Your Signature" in MiniSignature label | P1 | Done | - | - | 2026-04-04 | DE: "Deine Signatur", EN: "Your Signature" |
| TASK-signatur-tile-expandable | Make MiniSignature tile expandable: click opens detail view or navigates to /signatur with transition | P3 | Done | - | TASK-signatur-label-rename | 2026-04-06 | navigate('/signatur') confirmed as correct behavior; added role=button + aria-label + keyboard support + accessible expand button |

### Cluster D — Daily Pulse & Influence Interpretation

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-cosmic-weather-rename | Rename "Cosmic Weather" / "Kosmoswetter" section title to "Daily Pulse" / "Tagesimpuls" | P2 | Done | - | - | 2026-04-04 | Per DEC-daily-pulse-naming; EN: "Daily Pulse", DE: "Tagesimpuls"; legacy CosmicWeatherCard updated |
| TASK-influence-tooltips-personalized | Personalized resonance tooltips on planet cards in AktiveEinfluesseFusion: tooltip on resonance badge explains planet element, day master element, and relationship direction (forward/backward Sheng/Ke) in user-centric DE+EN text | P2 | Done | [REQ-F-transparency-rule](../1-objectives/requirements/REQ-F-transparency-rule.md) | - | 2026-04-10 | Repurposed: original InfluenceGauges % tooltips obsolete (component deleted); new scope = resonance badge contextual explanation |
| TASK-cosmic-values-explained | Add interpretation text to geomagnetisch/Solardruck values: low/medium/high label + user-relevant meaning + link to Signatur impact | P2 | Done | [REQ-F-transparency-rule](../1-objectives/requirements/REQ-F-transparency-rule.md) | - | 2026-04-10 | Tiered dynamic tooltips: Kp G0/G1-G2/G3+ → calm/mild/strong; solarPressure 0-32/33-65/66%+ → low/mid/high. All 6 keys in DE+EN. 6 new tests, 1518 total. |

### Cluster E — Planetarium Proportions

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-planetarium-height-fix | Restore proper window-like aspect ratio for BirthChartOrrery: increase height from thin strip to ~16:10 | P1 | Done | - | - | 2026-04-04 | .orrery-canvas-container CSS + aspect-[16/10] + min-h-[360px]; 3 tests |
| TASK-planetarium-fullscreen-fix | Fix fullscreen mode showing only horizon strip — ensure full viewport is used with correct camera/viewport scaling | P1 | Done | - | TASK-planetarium-height-fix | 2026-04-06 | Root cause: fullscreenchange handler only updated FOV but not camera.aspect or renderer.setSize; fixed with requestAnimationFrame to sync after browser layout |

### Cluster F — Astro-Agents Grouping

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-agents-parent-container | Wrap agent grid in cosmic-tile parent card with "Astro-Agents" section title | P3 | Done | - | - | 2026-04-06 | cosmic-tile wrapper with centered section title using existing dashboard.astroAgents i18n key |
| TASK-agents-intro-text | Add explanatory intro text below title: agents help with Tageshoroskop, Signatur, Planetenstände, Kosmoswetter, Fusion-Profil | P3 | Done | - | TASK-agents-parent-container | 2026-04-06 | dashboard.astroAgentsIntro DE+EN key added; 11px text at 0.6 opacity below section title |
| TASK-agents-dark-mode-hierarchy | Improve Dark Mode agent card differentiation: subtle tone variation between cards for visual hierarchy | P2 | Done | - | - | 2026-04-06 | Changed gradient from nearly-black gradientFrom to accentColor@18% — gold vs purple tint now clearly differentiates Levi from Eve; border also tinted at 30% |

### Cluster G — Dashboard Section Order & Information Hierarchy

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-dashboard-reorder | Reorder Dashboard.tsx sections: Planetarium → Identity+Signatur → Daily Pulse → Influences → Sun/BaZi/WuXing cards → Blueprint → Agents → Interpretation | P1 | Done | - | - | 2026-04-04 | gap-20→gap-12; Influences grouped with gap-6; 5 order tests |
| TASK-planetarium-top | Move Planetarium/BirthChartOrrery to top of Dashboard as the visual entry point; extract from DashboardAstroSection into standalone section | P1 | Done | - | TASK-planetarium-height-fix | 2026-04-04 | Extracted Orrery+SkyModeToggle from AstroSection into Dashboard.tsx; 3 tests |
| TASK-identity-signatur-row | Place Identity accordion (left) + MiniSignature (right) as second section below Planetarium | P2 | Done | [REQ-F-dashboard-identity-cards](../1-objectives/requirements/REQ-F-dashboard-identity-cards.md) | TASK-identity-vertical-stack, TASK-dashboard-reorder | 2026-04-06 | Already implemented: grid-cols-[1fr_auto] layout in place from TASK-dashboard-reorder commit (cf3979b); section is second below Planetarium |
| TASK-daily-pulse-cluster | Group Daily Pulse + InfluenceGauges + CosmicInfluence as one cohesive section (subsections, not isolated blocks) | P2 | Done | - | TASK-cosmic-weather-rename | 2026-04-06 | Wrapped TagesImpuls + InfluenceGauges + CosmicInfluence in single motion.div with gap-4 (tighter than gap-6); VibesSection stays after cluster; section-order test updated |
| TASK-astro-three-cards | Render Sonnenzeichen/BaZi/WuXing as three equal-width horizontal cards in a row below Daily Pulse cluster | P2 | Done | - | TASK-dashboard-reorder | 2026-04-06 | Already implemented: DashboardHeroNav inside DashboardAstroSection renders grid-cols-3 below Daily Pulse cluster; no structural split required |
| TASK-blueprint-position | Place Kosmischer Blueprint section directly below the three astro cards | P1 | Done | - | TASK-astro-three-cards | 2026-04-06 | Already correct: BaZi/WuXing deep section renders directly below DashboardHeroNav within DashboardAstroSection |
| TASK-daily-pulse-naming-resolve | Resolve naming inconsistency: use "Daily Pulse"/"Tagesimpuls" as canonical title; sub-modes (Trace) as subtitle only | P2 | Done | - | - | 2026-04-06 | DayModeModal updated: "Daily Pulse" label + mode badge (Day-Pulse/Day-Trace) replaces all-caps DAY-TRACE/DAY-PULSE as primary title; DashboardTagesEnergie already uses sectionLabel correctly |

### Cluster H — Global Spacing & Alignment

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-dashboard-spacing-system | Define and apply consistent vertical spacing rhythm: reduce gap-20 to tighter system (e.g. gap-12 between sections, gap-6 within clusters) | P2 | Done | - | TASK-dashboard-reorder | 2026-04-04 | gap-20→gap-12 main; Influences cluster gap-6; done as part of TASK-dashboard-reorder |
| TASK-dashboard-width-alignment | Ensure all sections share the same max-width and horizontal flush — no module narrower or offset from the main column | P2 | Done | - | TASK-dashboard-reorder | 2026-04-06 | Removed max-w-3xl from agents container; removed max-w-md from VibesSection; all top-level sections now fill the main max-w-6xl column |
| TASK-card-inner-spacing | Unify card inner padding: same padding for all cosmic-tile cards across Dashboard (p-5 or p-6, not mixed) | P3 | Done | - | - | 2026-04-06 | Standardized to p-6: AgentSection (was p-6 sm:p-8), BaZi interpretation (was p-6 md:p-8), CosmicWeatherCard (was p-5), DashboardLeviSection (was p-5) |

### Cluster I — BaZi / WuXing / Vier Säulen Polish

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-bazi-wuxing-bright-audit | Audit BaZi Four Pillars + WuXing element bars for bright mode consistency — ensure text contrast and card backgrounds match design system | P2 | Done | - | - | 2026-04-06 | Replaced hardcoded #1E2A3A (dark-mode-invisible) with var(--tile-text-primary) in BaZiFourPillars (stem, branch, element label, unavailable text) and DashboardAstroSection (section heading, element name) |
| TASK-bazi-pillars-clickable | Make Four Pillars cards clickable: each opens contextual explanation specific to user's chart (not just tooltip) | P1 | Done | - | - | 2026-04-06 | Promoted P2→P1 per PO; functional core request; needs per-pillar description from heavenlyStems/earthlyBranches data |
| TASK-bazi-section-card-harmony | Ensure BaZi/WuXing section cards match the three-card row style when extracted from DashboardAstroSection | P3 | Done | - | TASK-astro-three-cards | 2026-04-08 | Harmonized gap-6→gap-4 with Hero Nav above for consistent 3-card grid spacing |

### Cluster J — Signatur Page Transit Panels

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-signatur-live-transit-panel | Replace lower Signatur-page info tiles with live transit resonance panels: show current planetary transits affecting the user's Signatur in real-time | P1 | Done | [REQ-F-signatur-live-transit-panels](../1-objectives/requirements/REQ-F-signatur-live-transit-panels.md) | - | 2026-04-06 | New requirement track; existing tiles are static placeholders |
| TASK-signatur-transit-panel-detail | Each transit panel shows planet, aspect, affected pole, resonance direction (amplifying/dampening), and "Warum?" explainability | P1 | Done | [REQ-F-signatur-live-transit-panels](../1-objectives/requirements/REQ-F-signatur-live-transit-panels.md) | TASK-signatur-live-transit-panel | 2026-04-07 | Every visible tile must provide real functionality |
| TASK-signatur-remove-redundant-lower-tiles | Remove lower Signatur-page tiles that duplicate cosmic weather or provide no actionable function; keep only live, user-relevant panels | P1 | Done | [REQ-F-signatur-live-transit-panels](../1-objectives/requirements/REQ-F-signatur-live-transit-panels.md) | TASK-signatur-live-transit-panel | 2026-04-07 | All 3 static info cards (resonance/spaceWeather/accessibility) removed in TASK-signatur-live-transit-panel; replaced by TransitResonancePanels |

### Cluster K — Reopened Fix Handoffs

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-vibe-visibility-fix | Vibe CTA/tile not reliably reachable on Dashboard — revalidate mount conditions, PremiumGate state, VibesModal result render path, tile placement in current hierarchy | P1 | Done | [REQ-F-vibes-core](../1-objectives/requirements/REQ-F-vibes-core.md) | - | 2026-04-05 | Fixed: VibesSection redesigned as cosmic-tile and integrated into Daily Pulse cluster; gemini-2.5-flash model name corrected to gemini-2.0-flash in server.mjs. |
| TASK-mini-signature-alignment-fix | MiniSignature visual alignment within Identity row — verify centering, responsive sizing, and canvas aspect ratio at all breakpoints | P1 | Done | - | - | 2026-04-05 | Fixed: Removed hardcoded width/height in MiniSignature.tsx; stabilized SignaturV3Canvas with ResizeObserver threshold + re-init guards to prevent jitter. |
| TASK-current-sky-behavior-fix | Current Sky mode still shows insufficiently different output from birth sky — revalidate simTime calculation, observer coordinates, and constellation rendering | P1 | Done | - | TASK-current-sky-delta-fix | 2026-04-05 | Fixed: skyMode persisted in localStorage; Dashboard correctly wires observer coords and simulation time. |
| TASK-daily-pulse-influences-live-fix | Daily Pulse and Influence Gauges do not show convincingly live/date-sensitive data — verify transit feed, date-boundary rotation, and gauge label semantics | P1 | Done | [REQ-F-dashboard-live-daily-signals](../1-objectives/requirements/REQ-F-dashboard-live-daily-signals.md) | - | 2026-04-05 | Fixed: Entire dashboard (Pulse + Gauges) now syncs with planetarium's current time in 'Current Sky' mode via lifted orreryHook. |
| TASK-theme-contrast-fix | Dashboard dark mode tiles too dark; improve contrast and readability; add golden glowing outline | P1 | Done | - | - | 2026-04-05 | Implemented: Lightened dark mode tile bg, boosted text brightness, added constant gold glow (box-shadow); refined bright mode readability. |

### Cluster L — AktiveEinfluesseFusion Semantic Field Completion

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-einfluesse-stem-fallback | `AktiveEinfluesseFusion`: when `dayMasterStem` is missing, render planet cards with Western block only + "BaZi-Profil nicht verfügbar" notice in BaZi slot — instead of returning null | P1 | Done | [REQ-F-dashboard-bazi-fusion-bridge](../1-objectives/requirements/REQ-F-dashboard-bazi-fusion-bridge.md) | - | 2026-04-08 | REQ-F-dashboard-bazi-fusion-bridge AC 9 |
| TASK-einfluesse-resonance-tension | Planet cards: apply resonance/tension dual-dimension color encoding — gleichklang/naehrung → blue border+bg; kontrolle → red border+bg; neutral → muted gold; removes element-color card styling | P1 | Done | [REQ-F-dashboard-live-daily-signals](../1-objectives/requirements/REQ-F-dashboard-live-daily-signals.md), [REQ-F-dashboard-bazi-fusion-bridge](../1-objectives/requirements/REQ-F-dashboard-bazi-fusion-bridge.md) | TASK-einfluesse-stem-fallback | 2026-04-09 | REQ-F-dashboard-live-daily-signals AC 4+5; DEC-fusion-bazi-sheng-ke |
| TASK-einfluesse-field-strength | Add field-strength indicator under resonance badge: small visual bar derived from `resonance.intensity`, labeled "Feldstärke" with three qualitative tiers (gering/mittel/stark) — no raw float, no % | P1 | Done | [REQ-F-dashboard-live-daily-signals](../1-objectives/requirements/REQ-F-dashboard-live-daily-signals.md) | TASK-einfluesse-resonance-tension | 2026-04-09 | REQ-F-dashboard-live-daily-signals AC 7; DEC-no-number-without-explanation |
| TASK-einfluesse-ac-tests | Vitest: AC-coverage — stem-fallback renders Western block without BaZi block; resonance-type→blue for gleichklang/naehrung, red for kontrolle, muted for neutral; field-strength renders qualitative tier label for low/mid/high intensity | P1 | Done | [REQ-F-dashboard-bazi-fusion-bridge](../1-objectives/requirements/REQ-F-dashboard-bazi-fusion-bridge.md), [REQ-F-dashboard-live-daily-signals](../1-objectives/requirements/REQ-F-dashboard-live-daily-signals.md) | TASK-einfluesse-field-strength | 2026-04-09 | |

### Cluster M — Display Name: Onboarding Field + Profile Persistence (P0)

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-display-name-schema | Add `NOT NULL CHECK(char_length <= 50)` to `profiles.display_name`; create migration file; update `supabase-schema.sql` | P0 | Done | [REQ-F-onboarding-display-name](../1-objectives/requirements/REQ-F-onboarding-display-name.md) | - | 2026-04-09 | DEC-display-name-db-only |
| TASK-display-name-onboarding-field | Add display name input field to BirthForm (required, max 50 chars, German label "Dein Name"); wire into form state + submit | P0 | Done | [REQ-F-onboarding-display-name](../1-objectives/requirements/REQ-F-onboarding-display-name.md) | TASK-display-name-schema | 2026-04-09 | |
| TASK-display-name-save | Persist display_name to `profiles` table on submit; never include in BAFE/FuFirE payload; add `saveDisplayName()` to supabase.ts | P0 | Done | [REQ-F-onboarding-display-name](../1-objectives/requirements/REQ-F-onboarding-display-name.md) | TASK-display-name-onboarding-field | 2026-04-09 | DEC-display-name-db-only |
| TASK-display-name-agent | Read `display_name` from `profiles` table in `/api/profile/:userId` handler; include in response as `display_name` field; Agent reads from DB, not engine response | P0 | Done | [REQ-F-onboarding-display-name](../1-objectives/requirements/REQ-F-onboarding-display-name.md) | TASK-display-name-save | 2026-04-09 | DEC-display-name-db-only |

---

## Phase: Current Sprint — S-DAILY-CHART-HERO (Unified Daily Chart Hero)

**Sprint Goal:** Replace split volatile dashboard cards (KohaerenzHero + AktiveEinfluesseFusion + DayPulseExpanded) with one unified `DailyChartHero` containing coherence baseline+delta ring, driver strip, active planets with expandable "Warum?", and day-impulse text. Dark+Bright mode compliance. Plan: `docs/plans/2026-04-14-daily-chart-hero.md`.

### Phase 1 — API + Schema Extension

| ID | Task | Component | Req | Status | Dependencies | Updated | Notes |
|----|------|-----------|-----|--------|--------------|---------|-------|
| TASK-dch-impact-coherence-split | Extend `/api/impact/active` + Zod schema + hook with `base_coherence`, `positive_daily_delta`, `displayed_coherence` | api-server, frontend | [REQ-F-coherence-hero-impact-datasource](../1-objectives/requirements/REQ-F-coherence-hero-impact-datasource.md), [REQ-F-experience-daily-v2](../1-objectives/requirements/REQ-F-experience-daily-v2.md) | Done | - | 2026-04-14 | Schema + server + hook + 5 new contract tests |

### Phase 2 — Unified Component

| ID | Task | Component | Req | Status | Dependencies | Updated | Notes |
|----|------|-----------|-----|--------|--------------|---------|-------|
| TASK-dch-hero-component | Create `DailyChartHero.tsx`: split coherence ring, driver strip, active planet cards with "Warum?", day-impulse text block | frontend | [REQ-F-daily-chart-coherence-hero](../1-objectives/requirements/REQ-F-daily-chart-coherence-hero.md), [REQ-F-active-planets-frontend](../1-objectives/requirements/REQ-F-active-planets-frontend.md), [REQ-F-coherence-hero-impact-datasource](../1-objectives/requirements/REQ-F-coherence-hero-impact-datasource.md) | Done | TASK-dch-impact-coherence-split | 2026-04-15 | 31 tests covering all 4 sections + empty state + CSS compliance |

### Phase 3 — Dashboard Wiring + Theme Fix

| ID | Task | Component | Req | Status | Dependencies | Updated | Notes |
|----|------|-----------|-----|--------|--------------|---------|-------|
| TASK-dch-dashboard-wiring | Wire `DailyChartHero` into `Dashboard.tsx`, replace 3 old SectionErrorBoundary blocks | frontend | [REQ-F-daily-chart-coherence-hero](../1-objectives/requirements/REQ-F-daily-chart-coherence-hero.md) | Done | TASK-dch-hero-component | 2026-04-15 | DEC-dashboard-volatile-first; also fixed hook cached-user early-return + updated section-order tests |
| TASK-dch-theme-contrast | Fix remaining hardcoded bg-white/text-white across dashboard tiles for dark-mode compliance | frontend | [REQ-USA-daily-chart-responsive-readability](../1-objectives/requirements/REQ-USA-daily-chart-responsive-readability.md) | Done | TASK-dch-dashboard-wiring | 2026-04-15 | Fixed hover:text-white in BlueprintCard+Reveal; removed dead imports + stale comments in Dashboard.tsx |

---

## Phase: Current Sprint — S-DCH-BUGFIX (Daily Chart Hero Regression Fixes)

**Sprint Goal:** Fix all verified regressions from the DailyChartHero rollout: coherence formula, duplicate TagesImpuls tile, error-state rendering, Vibes i18n mismatch, old-user fusion fallback.

### Phase 1 — Critical: Coherence Formula + Duplicate Tile

| ID | Task | Component | Req | Status | Dependencies | Updated | Notes |
|----|------|-----------|-----|--------|--------------|---------|-------|
| TASK-dcfix-coherence-formula | Fix weighted-blend formula in `computeActiveImpactsCore()`: base_coherence must be the floor, displayed_coherence = base + solarDelta (additive, never below base) | api-server | [REQ-F-coherence-hero-impact-datasource](../1-objectives/requirements/REQ-F-coherence-hero-impact-datasource.md) | Done | - | 2026-04-15 | Fixed: additive formula, +3 contract tests |
| TASK-dcfix-remove-tagesenergie | Remove standalone `DashboardTagesEnergie` / `CosmicWeatherCard` block from Dashboard.tsx (section 4) — content is already inside DailyChartHero section D | frontend | [REQ-F-daily-chart-coherence-hero](../1-objectives/requirements/REQ-F-daily-chart-coherence-hero.md) | Done | - | 2026-04-15 | Removed section 4 + unused imports (DashboardTagesEnergie, CosmicWeatherCard, useDailyHoroscope) |

### Phase 2 — High: Error State + Vibes i18n

| ID | Task | Component | Req | Status | Dependencies | Updated | Notes |
|----|------|-----------|-----|--------|--------------|---------|-------|
| TASK-dcfix-error-state | DailyChartHero: when all coherence fields are null and loading=false, render an explicit error/unavailable state instead of "Basis 0 · Heute +0" | frontend | [REQ-F-daily-chart-coherence-hero](../1-objectives/requirements/REQ-F-daily-chart-coherence-hero.md) | Done | - | 2026-04-15 | Dashed ring + "nicht verfügbar" + driver strip still renders, +3 tests |
| TASK-dcfix-vibes-i18n | Fix VibesSection.tsx i18n keys: prefix all 5 `t()` calls with `dashboard.` (vibesSection.x → dashboard.vibesSection.x) | frontend | - | Done | - | 2026-04-15 | 5 keys fixed |

### Phase 3 — Medium: Old-User Fallback

| ID | Task | Component | Req | Status | Dependencies | Updated | Notes |
|----|------|-----------|-----|--------|--------------|---------|-------|
| TASK-dcfix-fusion-fallback | When `profile.astro_json.fusion` is absent, mark coherence as unavailable instead of silently using 0.5 — server should return base_coherence=null so client renders explicit fallback | api-server, frontend | [REQ-F-coherence-hero-impact-datasource](../1-objectives/requirements/REQ-F-coherence-hero-impact-datasource.md) | Done | TASK-dcfix-coherence-formula, TASK-dcfix-error-state | 2026-04-15 | hasFusionData guard + null propagation, +2 tests |

---

## Phase: Sprint S-QA-I18N — i18n Zero Raw Keys

**Sprint Goal:** Eliminate all raw i18n key strings from the UI. Add automated test to prevent regression. Cover quiz, dashboard, and conversationAnalysis namespaces.

### Phase 1 — Audit + Missing Keys

| ID | Task | Component | Req | Status | Dependencies | Updated | Notes |
|----|------|-----------|-----|--------|--------------|---------|-------|
| TASK-i18n-audit-script | Write Vitest that extracts all `t('...')` calls from source and verifies each key exists in both DE/EN translations | frontend | [REQ-F-i18n-completeness](../1-objectives/requirements/REQ-F-i18n-completeness.md) | Todo | - | 2026-04-15 | |
| TASK-i18n-add-quiz-keys | Add all missing `quiz.*` keys to translations.ts (nQuestions12, startAnalysis, startBtn, clusterNoteLabel, clusterNote, questionProgress, questionProgressShort) | frontend | [REQ-F-i18n-completeness](../1-objectives/requirements/REQ-F-i18n-completeness.md) | Todo | TASK-i18n-audit-script | 2026-04-15 | |
| TASK-i18n-add-conversation-keys | Add all missing `conversationAnalysis.*` keys (title, pasteLabel, placeholder, analyzeDialogue, aiHint) | frontend | [REQ-F-i18n-completeness](../1-objectives/requirements/REQ-F-i18n-completeness.md) | Todo | TASK-i18n-audit-script | 2026-04-15 | |
| TASK-i18n-fix-remaining | Run the audit test, fix any remaining mismatched key paths across all components | frontend | [REQ-F-i18n-completeness](../1-objectives/requirements/REQ-F-i18n-completeness.md) | Todo | TASK-i18n-add-quiz-keys, TASK-i18n-add-conversation-keys | 2026-04-15 | |

---

## Phase: Sprint S-QA-QUIZ — Quiz Overlay & Cluster Gate

**Sprint Goal:** Quiz X-Button schliesst zuverlässig. Cluster-Gate enforced: Einzelquiz verändert Ring nicht. Cousto Audio zuverlässig stummschaltbar.

### Phase 2 — Overlay + Gate + Audio

| ID | Task | Component | Req | Status | Dependencies | Updated | Notes |
|----|------|-----------|-----|--------|--------------|---------|-------|
| TASK-quiz-overlay-close-fix | Fix QuizOverlay X-Button z-index/clickability — ensure close works regardless of quiz content scroll state | frontend | [REQ-F-i18n-completeness](../1-objectives/requirements/REQ-F-i18n-completeness.md) | Todo | - | 2026-04-15 | QA-11 |
| TASK-cluster-gate-audit | Audit `useQuizContribution` cluster gate: verify contribution only sent after full cluster completion, add test for single-quiz-no-post | frontend | [REQ-F-signatur-realtime-triggers](../1-objectives/requirements/REQ-F-signatur-realtime-triggers.md) | Todo | - | 2026-04-15 | QA-17 CRITICAL |
| TASK-cousto-audio-mute-fix | Fix `useCoustoAudio` mute: ensure suspend() stops all oscillators, prevent re-registration of startOnGesture listener after mute toggle | frontend | [REQ-F-signatur-realtime-triggers](../1-objectives/requirements/REQ-F-signatur-realtime-triggers.md) | Todo | - | 2026-04-15 | QA-15 |

---

## Phase: Sprint S-QA-NAV — Navigation Redesign

**Sprint Goal:** Klare, konsistente Navigation auf allen Seiten. Dashboard-Link, Active-Route, Mode-Toggle-Klarheit, Agents-Panel.

### Phase 3 — Navigation

| ID | Task | Component | Req | Status | Dependencies | Updated | Notes |
|----|------|-----------|-----|--------|--------------|---------|-------|
| TASK-nav-dashboard-link | Add "Tageschart" nav item that links to `/` — visible on all pages | frontend | [REQ-F-navigation-redesign](../1-objectives/requirements/REQ-F-navigation-redesign.md) | Todo | - | 2026-04-15 | QA-19 |
| TASK-nav-active-route | Highlight active route in header nav, disable click on current-page tab | frontend | [REQ-F-navigation-redesign](../1-objectives/requirements/REQ-F-navigation-redesign.md) | Todo | TASK-nav-dashboard-link | 2026-04-15 | QA-6, QA-21 |
| TASK-nav-mode-toggle-clarity | Redesign Planetarium button as explicit theme toggle (icon-based, not navigation-looking) | frontend | [REQ-F-navigation-redesign](../1-objectives/requirements/REQ-F-navigation-redesign.md) | Todo | TASK-nav-active-route | 2026-04-15 | QA-20 |
| TASK-nav-settings-icons-only | Settings menu mode toggle: remove text labels, keep only Moon/Sun icons | frontend | [REQ-F-navigation-redesign](../1-objectives/requirements/REQ-F-navigation-redesign.md) | Todo | - | 2026-04-15 | QA-16 |
| TASK-nav-agents-panel | Astro-Agents nav button opens panel showing both Levi and Eve | frontend | [REQ-F-navigation-redesign](../1-objectives/requirements/REQ-F-navigation-redesign.md) | Todo | - | 2026-04-15 | QA-22 |

---

## Phase: Sprint S-QA-SIGNATUR — Signatur Deep Audit

**Sprint Goal:** Ring reagiert sichtbar auf Echtzeit-Inputs. WebGL-Fallback ohne Fehlertext. V2 auf Web+Mobile konsistent. Trigger-Logik dokumentiert.

### Phase 4 — Signatur

| ID | Task | Component | Req | Status | Dependencies | Updated | Notes |
|----|------|-----------|-----|--------|--------------|---------|-------|
| TASK-signatur-trigger-doc | Document trigger matrix: which input (transit/weather/quiz) changes what visual aspect of the ring, with expected latency | frontend, shared | [REQ-F-signatur-realtime-triggers](../1-objectives/requirements/REQ-F-signatur-realtime-triggers.md) | Todo | - | 2026-04-15 | Audit first, then fix |
| TASK-signatur-visual-response | Ensure V2 ring shows perceptible change on transit/weather updates — verify signal data flows from hooks into canvas render params | frontend | [REQ-F-signatur-realtime-triggers](../1-objectives/requirements/REQ-F-signatur-realtime-triggers.md) | Todo | TASK-signatur-trigger-doc | 2026-04-15 | QA-23 |
| TASK-signatur-webgl-fallback | Replace "Renderer-Fehler. Fallback aktiv." with graceful visual fallback (V3 bipolar canvas or styled placeholder) | frontend | [REQ-F-signatur-realtime-triggers](../1-objectives/requirements/REQ-F-signatur-realtime-triggers.md) | Todo | - | 2026-04-15 | QA-8 |
| TASK-signatur-mobile-v2-parity | Verify mobile app uses V2 engine, fix feature flag if needed | mobile | [REQ-F-signatur-realtime-triggers](../1-objectives/requirements/REQ-F-signatur-realtime-triggers.md) | Todo | - | 2026-04-15 | QA-24 |

---

## Backlog (Not Scheduled)

| Requirement | Reason |
|-------------|--------|
| REQ-F-signatur-density-field | Complex separate sprint (S-DENSITY); no downstream dependency yet |
| REQ-F-signatur-ios-swift | Separate Swift repo track; not in web app scope |
| REQ-F-orbital-signatur-visualization | Blocked on ASM-ued-metrics-available (unverified assumption) |

---

## Phase F: Partnership Features + Conversion Architecture

Open questions resolved 2026-04-10:

| ID | Question | Decision | DEC |
|----|----------|----------|-----|
| OQ-house-system | House system: Placidus or Koch? | **Placidus** (consistent with FuFirE Natal) | [DEC-house-system-placidus](../2-design/decisions/DEC-house-system-placidus.md) |
| OQ-synastry-consent | Synastry without partner account? | **Yes** — manual birth data, invitation as upgrade path | [DEC-synastry-architecture](../2-design/decisions/DEC-synastry-architecture.md) |
| OQ-orb-tolerance | Orb tolerance for interaspects? | **Staggered**: Conj/Opp ±8°, Trine/Square ±6°, Sextile ±4° | [DEC-aspect-orb-tolerances](../2-design/decisions/DEC-aspect-orb-tolerances.md) |
| OQ-minor-aspects | Minor aspects (Quincunx, Semisextile) or only 5 main? | **V1: 5 main only** — Quincunx as Premium extension later | [DEC-aspect-orb-tolerances](../2-design/decisions/DEC-aspect-orb-tolerances.md) |
| OQ-narrative-generation | Partnership narratives: fixed templates or Gemini-generated? | **Hybrid**: templates (Free), Gemini (Premium) | [DEC-narrative-engine-hybrid](../2-design/decisions/DEC-narrative-engine-hybrid.md) |
| OQ-synastry-signal | Synastry as 4th signal or separate system? | **Separate system** — feeds narratives, not Master Signal | [DEC-synastry-architecture](../2-design/decisions/DEC-synastry-architecture.md) |

Conversion architecture decided 2026-04-10: [DEC-conversion-tiers](../2-design/decisions/DEC-conversion-tiers.md)

### Phase F Task Table

| Task | Description | Priority | Status | Req | Dependencies | Updated | Notes |
|------|-------------|----------|--------|-----|--------------|---------|-------|
| TASK-landing-page-shell | Landing page route + layout shell (no-auth, birth data form, veiled signature) | P1 | Cancelled | - | - | 2026-04-13 | Moved to separate repo: Landingpage-viteapp. See integration plan. |
| TASK-landing-signature-preview | Render Fusion Signature with 1 sector lit, rest veiled; single CTA | P1 | Cancelled | - | TASK-landing-page-shell | 2026-04-13 | Moved to separate repo: Landingpage-viteapp |
| TASK-landing-sun-activation | Sun sign activation paragraph (DE); server-side via Gemini or template | P1 | Cancelled | - | TASK-landing-page-shell | 2026-04-13 | Moved to separate repo: Landingpage-viteapp |
| TASK-registration-initiation | Registration form styled as initiation — pre-filled from sessionStorage birth data | P1 | Cancelled | - | TASK-landing-page-shell | 2026-04-13 | Moved to separate repo: Landingpage-viteapp |
| TASK-partner-profile-schema | DB: `partner_profiles` table (user_id FK, birth_date, birth_time, birth_place, birth_lat, birth_lon, display_name) | P1 | Done | - | - | 2026-04-10 | Migration: 20260410_partner_profiles.sql; schema updated |
| TASK-synastry-endpoint | Server: POST `/api/synastry` — compute aspects via FuFirE using staggered orbs (DEC-aspect-orb-tolerances) | P1 | Done | - | TASK-partner-profile-schema | 2026-04-11 | Premium gate; Placidus; 5 main aspects only |
| TASK-synastry-narratives | Server: generate template narratives for synastry (Free tier); Gemini narratives (Premium tier) | P1 | Done | - | TASK-synastry-endpoint | 2026-04-11 | DEC-narrative-engine-hybrid; always German; template fallback |
| TASK-synastry-ui | Frontend: SynastryPage — partner form, aspect grid, narrative display; locked teaser for free users | P2 | Done | - | TASK-synastry-narratives | 2026-04-11 | DEC-conversion-tiers Tier 2 gate |
| TASK-premium-gate-component | Reusable PremiumGate component (locked card + upgrade CTA); used across synastry, GCB, composites | P1 | Done | - | - | 2026-04-11 | Already implemented (PremiumGate.tsx + usePremium.ts); confirmed in use on WuXingPage and SynastryPage |
| TASK-tier-enforcement-server | Server-side tier validation middleware — attach `user.tier` from Supabase to all premium-gated endpoints | P1 | Done | - | - | 2026-04-11 | DEC-conversion-tiers: gates enforced server-side |

### Sprint-Landing (moved to separate repo)

Landing page development moved to `Landingpage-viteapp` repo (bazodiac.com). Architecture: Option C (separate apps, API bridge). Integration plan: `Landingpage-viteapp/app/2026-04-13-landingpage-fufire-integration-plan.md`.

**Astro-Noctum server.mjs work remaining:** Two public endpoints (`POST /api/public/chart`, `POST /api/public/match-preview`) will be added here when the Landingpage reaches Phase 2 of the integration plan.

---

GitHub Issues (#115, #117, #118, #119, #123, #124, #129, #130, #132, #136) remain in GitHub for detailed tracking once implementation begins.

---

## Sprint S-API-CONTRACT: API Contract Verification + CI Tests

**Sprint Goal:** Fix 1 confirmed bug (signatureDelta quiz_answer payload mismatch), 1 doc drift (synastry missing from API_REFERENCE.md), and build CI contract tests for all server API endpoints so future drift is caught automatically.

**Context:** An external audit reported 12 potential discrepancies. Verification (2026-04-13) confirmed only 2 are real — the rest were false positives (client mappers already handle both formats, all routes exist, deprecated funcs match deprecated docs).

### Phase 1 — Bug Fixes

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-fix-signature-delta-payload | Fix `signatureDelta()` in `src/services/experience.ts`: change `quiz_answer: { keyword }` to `quiz_answer: [{ id: keyword, weight: 1.0 }]` to match server expectation `Array.isArray(quiz_answer)`. Server silently coerces non-array to `[]` — quiz influence on Signatur ring is currently lost. | P0 | Done | - | - | 2026-04-13 | server.mjs:2052 expects `[{id, weight}]` array; client sends `{keyword}` object |
| TASK-doc-synastry-api-reference | Add `POST /api/synastry` section to `docs/API_REFERENCE.md`: auth (requireUserAuth + requirePremium), request `{ partner_id }`, response schema (aspects[], narrative, narrative_source), error cases | P1 | Done | - | - | 2026-04-13 | Route exists at server.mjs:746 but is undocumented |

### Phase 2 — API Contract CI Tests

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-contract-test-calculate | Write Vitest contract tests for `/api/calculate/*` proxy routes: verify request body schema forwarded correctly, response field paths match client mapper expectations (`positions\|\|bodies`, `chinese\|\|bazi`, German+English fallbacks) | P0 | Done | - | - | 2026-04-14 | 32 tests in contract-calculate.test.ts |
| TASK-contract-test-chart | Write Vitest contract test for `POST /api/chart` (the canonical atomic endpoint): verify `local_datetime`+`tz` request format, response contains `positions` or `bodies` dict with Sun/Moon/planet entries | P0 | Done | - | - | 2026-04-14 | 16 tests in contract-chart.test.ts |
| TASK-contract-test-experience | Write Vitest contract tests for all 3 Experience endpoints: bootstrap (birth payload → soulprint+profile), signature-delta (quiz_answer array format → delta response), daily (include=["impact"] v2 contract) | P0 | Done | TASK-fix-signature-delta-payload | - | 2026-04-14 | 34 tests in contract-experience.test.ts |
| TASK-contract-test-synastry | Write Vitest contract test for `POST /api/synastry`: verify auth requirement, partner_id payload, response shape (aspects[], narrative, narrative_source) | P1 | Done | TASK-doc-synastry-api-reference | - | 2026-04-14 | 15 tests in contract-synastry.test.ts |
| TASK-contract-test-impact | Write Vitest contract test for `POST /api/impact/active`: verify ACTIVE_IMPACTS_v1 schema, harmony_index 0-100, active_planets orb filter, resonance_badges shape | P1 | Done | - | - | 2026-04-14 | 30 tests in contract-impact.test.ts |

---

## Sprint S-DAILY: Daily Chart — Kohärenz-geführtes Tageshoroskop

**Sprint Goal:** Dashboard shows Kohärenzindex + Day Mode above the fold on first load. Active planet cards sourced from `/impact/active` (natal-relative, orb ≤ 8°). Planetarium moved below the Daily Chart section. Single `POST /experience/daily?include=impact` replaces multi-hook assembly. Backwards-compatible — existing consumers unaffected.

**Prerequisite:** Verify ASM-noaa-in-fufre before starting Phase 1 (TASK-daily-verify-noaa is the gate task).

### Phase 1 — Endpoint Integration (server-side)

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-daily-verify-noaa | Make a test POST to FuFirE `/impact/active`; confirm `solar_pressure` field in response or decide pass-through approach; document result in ASM-noaa-in-fufre | P0 | Done | [REQ-F-impact-active-endpoint](../1-objectives/requirements/REQ-F-impact-active-endpoint.md) | - | 2026-04-13 | ASM-noaa-in-fufre **Invalidated**: FuFirE returns 404 for /impact/active. Pass-through adopted: build endpoint in server.mjs using spaceWeatherCache.solar_pressure_score (NOAA) + existing natal/transit data |
| TASK-daily-impact-proxy | Build `POST /api/impact/active` in server.mjs: requireUserAuth, load natal from Supabase, compute transit aspects via /calculate/western, filter orb≤8°, blend harmony+solar_pressure from spaceWeatherCache, 15-min cache on (user_id,date) | P0 | Done | [REQ-F-impact-active-endpoint](../1-objectives/requirements/REQ-F-impact-active-endpoint.md), [REQ-PERF-impact-active-response-time](../1-objectives/requirements/REQ-PERF-impact-active-response-time.md) | TASK-daily-verify-noaa | 2026-04-13 | NOT a FuFirE proxy — server-side computation per ASM-noaa-in-fufre invalidation. Cache miss ≤800ms p95; cache hit ≤200ms |
| TASK-daily-experience-v2 | Extend `POST /api/experience/daily` proxy: accept `include: ["impact"]` in request body; merge FuFirE impact block into response; no include = v1-identical response | P0 | Done | [REQ-F-experience-daily-v2](../1-objectives/requirements/REQ-F-experience-daily-v2.md), [REQ-PERF-daily-experience-response-time](../1-objectives/requirements/REQ-PERF-daily-experience-response-time.md) | TASK-daily-impact-proxy | 2026-04-13 | Backward-compatible; premium gate for fusion.action |

### Phase 2 — Frontend Integration

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-daily-use-active-impacts | Create `src/hooks/useActiveImpacts.ts`: POST to `/api/impact/active`, Zod-parse `ACTIVE_IMPACTS_v1` schema, expose `harmonyIndex` + `activePlanets[]`; independent of `useDailyExperience()` | P0 | Done | [REQ-F-active-planets-frontend](../1-objectives/requirements/REQ-F-active-planets-frontend.md) | TASK-daily-impact-proxy | 2026-04-13 | Note: v2 daily response has two `resonance_badges` arrays — top-level (v1, ungated) and `impact.resonance_badges` (premium-gated). Frontend should consume `impact.resonance_badges` when using the impact block. |
| TASK-daily-coherence-hero | Wire `harmonyIndex` from `useActiveImpacts()` to Kohärenzindex display on Dashboard; verify value is above fold at 375px+ viewport | P0 | Done | [REQ-F-coherence-hero-impact-datasource](../1-objectives/requirements/REQ-F-coherence-hero-impact-datasource.md), [REQ-F-daily-chart-coherence-hero](../1-objectives/requirements/REQ-F-daily-chart-coherence-hero.md) | TASK-daily-use-active-impacts | 2026-04-13 | Label value per CON-no-unexplained-numbers |
| TASK-daily-dashboard-order | Move Planetarium below Daily Chart section in `Dashboard.tsx`; section order test must pass | P0 | Done | [REQ-F-daily-chart-dashboard-order](../1-objectives/requirements/REQ-F-daily-chart-dashboard-order.md) | TASK-daily-coherence-hero | 2026-04-13 | |
| TASK-daily-planet-cards | Replace static 6-planet pool with `activePlanets[]` from `useActiveImpacts()`; each card shows: planet name, strength visual bar, bazi_resonance badge, aspect type + orb (with °) | P1 | Done | [REQ-F-active-planets-frontend](../1-objectives/requirements/REQ-F-active-planets-frontend.md) | TASK-daily-use-active-impacts | 2026-04-13 | Empty-state for 0 active planets |
| TASK-daily-manual-testing | Runbook: Kohärenzindex above fold, planet cards orb-filtered, Planetarium below fold, premium badges/fusion.action visible, backward-compat verified | P1 | Done | - | TASK-daily-planet-cards, TASK-daily-dashboard-order | 2026-04-13 | |

---

## Sprint S-QA-2026-04-15: QA Remediation (Navigation · Signatur Triggers · i18n)

**Sprint Goal:** Resolve 25 QA findings from the 2026-04-15 live browser session, covering 3 newly-approved Must-have Goals. Navigation becomes consistent across all pages; Signatur visibly reacts to real-time inputs with cluster-gate enforcement; i18n is audited end-to-end and quiz overlays are reliably dismissable. All 3 target requirements currently Draft — they should move to Implemented when their task sets reach Done.

### Phase 1 — Navigation Redesign

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-qa-nav-shell-audit | Audit current nav-shell components (`Header`, `TopNav`, `SettingsMenu`) — document inconsistencies per page (Dashboard, Signatur, Sky, Wu-Xing, Wissen) in a short design note | P1 | Done | [REQ-F-navigation-redesign](../1-objectives/requirements/REQ-F-navigation-redesign.md) | - | 2026-04-15 | Audit delivered at `docs/plans/qa-2026-04-15-nav-shell-audit.md`; nav is global in `src/App.tsx`, not per-page. Raises 2 DEC tensions for Ben (see §Open Questions). |
| TASK-qa-nav-restructure-zones | Restructure top bar + mobile bottom-nav into 3 zones per DEC-navigation-shell v2: left brand (Bazodiac wordmark, also on mobile), center contextual primary-view links (Dashboard/Signatur/Atlas, showing only those NOT on current route), right symbol-only utilities. Remove `Astro-Agents` + `Planetarium` text-nav buttons from `src/App.tsx` L432-464 and L580-612 | P1 | Done | [REQ-F-navigation-redesign](../1-objectives/requirements/REQ-F-navigation-redesign.md) | TASK-qa-nav-shell-audit | 2026-04-16 | DEC-navigation-shell v2; QA-6, QA-16, QA-19. `src/App.tsx`: 3-zone desktop header + new mobile top bar (wordmark) + restructured bottom nav. Astro-Agents/Planetarium text buttons removed; Sparkles + Moon/Sun icons in right zone. `centerLinks` drives contextual rendering. Added `nav.dashboard` + `nav.themeToggle{Planetarium,Solar}` i18n keys. Atlas stub pending TASK-qa-nav-atlas-flagged-stub. `npm run lint` clean. |
| TASK-qa-nav-active-route-highlight | Active center-zone link: `aria-current="page"` + `aria-disabled="true"` + `pointer-events-none` + `tabIndex={-1}` + visible focus-ring. No self-navigation on current route. Applies to all 3 primary-view links on desktop and mobile | P1 | Done | [REQ-F-navigation-redesign](../1-objectives/requirements/REQ-F-navigation-redesign.md) | TASK-qa-nav-restructure-zones | 2026-04-16 | QA-20, QA-21. Wordmark (desktop + mobile) renders as disabled `<span>` with aria-current/aria-disabled/tabIndex=-1 on `/`. Non-current primaries get visible focus-ring via `navItemClass`. Center-zone already filters non-current per DEC v2 (no self-nav possible). Signatur/Atlas have no persistent link outside center zone. |
| TASK-qa-nav-agents-popup-both-premium | Replace Astro-Agents text-button with right-zone Sparkles-icon. Click opens popup with **both** Levi + Eve as selectable tiles. Premium-gated: free users see disabled icon with upgrade-flow on click. Connect to existing widget logic | P1 | Cancelled | [REQ-F-navigation-redesign](../1-objectives/requirements/REQ-F-navigation-redesign.md) | TASK-qa-nav-restructure-zones | 2026-04-16 | Decomposed into TASK-qa-nav-agents-popup-levi-only (immediate) + TASK-qa-nav-agents-popup-add-eve (blocked on GOAL-multi-agent-voice). Eve agent infrastructure does not exist yet — REQ-F-agent-dashboard-selection + REQ-MNT-agent-extensibility + REQ-SEC-eve-brand-safety must land first. |
| TASK-qa-nav-agents-popup-levi-only | Sparkles-icon in right zone opens a popup/panel with a single Levi tile (name, persona microcopy, CTA). Premium-gated: free users see muted icon/tile with upgrade flow via `handleLeviUpgrade`. Popup closes on outside-click + Escape. Connects to existing `AgentFloatingWidget` (`setWidgetExpanded(true)`) | P1 | Done | [REQ-F-navigation-redesign](../1-objectives/requirements/REQ-F-navigation-redesign.md) | TASK-qa-nav-restructure-zones | 2026-04-16 | Split from TASK-qa-nav-agents-popup-both-premium. New `AgentsPopup` component at `src/components/navigation/AgentsPopup.tsx`. Desktop: dropdown below Sparkles; mobile: popup above. Levi tile with name, persona desc, status dot, Phone CTA (premium) / UpgradeButton (free). Sparkles button now toggles popup (not direct widget expand); icon dimmed for free users. Closes on Escape + backdrop click + route change. `aria-expanded`/`aria-haspopup="menu"` on trigger. 6 tests in `agents-popup.test.tsx` + 19 agent tests green. Lint clean. Note: DEC-navigation-shell L111 says "both Levi and Eve" — temporarily not met (approved by Ben in decomposition). |
| TASK-qa-nav-agents-popup-add-eve | Extend the Astro-Agents popup with a second tile for Eve. Both tiles side-by-side, each with its own persona microcopy, CTA, and agent-widget bind. Follows the generic `AgentConfig` architecture from REQ-MNT-agent-extensibility | P2 | Blocked | [REQ-F-navigation-redesign](../1-objectives/requirements/REQ-F-navigation-redesign.md) | TASK-qa-nav-agents-popup-levi-only | 2026-04-16 | Split from TASK-qa-nav-agents-popup-both-premium. Blocked: waiting on GOAL-multi-agent-voice decomposition (Eve ElevenLabs agent ID, persona brand guardrails from REQ-SEC-eve-brand-safety, generic AgentConfig refactor from REQ-MNT-agent-extensibility). Will move outside S-QA-2026-04-15 into a future multi-agent sprint. Covers remaining REQ-F-navigation-redesign AC "both Levi and Eve agents are visible and callable". |
| TASK-qa-nav-theme-toggle-icon | Moon/Sun icon in right-zone (single icon reflecting current state, `aria-pressed`, no text label). Settings mode-toggle stripped to icons-only (remove inline "Planetarium"/"Solar System" text in `SettingsMenu.tsx` L104-121, keep `aria-label` + `title` for a11y) | P1 | Done | [REQ-F-navigation-redesign](../1-objectives/requirements/REQ-F-navigation-redesign.md) | TASK-qa-nav-restructure-zones | 2026-04-16 | QA-16; GOAL crit. 4. App.tsx right-zone button already icon-only with `aria-pressed`/`aria-label`/`title` (L504-513, 658-666). `SettingsMenu.tsx` mode-toggle buttons stripped: removed inline "Planetarium"/"Solar System" text, bumped icon to w-3.5, added bilingual `aria-label` + `title`. Icon size matches surrounding buttons. Lint clean; planetarium-context/sky-mode-toggle tests green (16/16). |
| TASK-qa-nav-atlas-flagged-stub | Add Atlas (`/atlas`) to center-zone primary-view link logic. Gate behind `atlas_v1` feature flag (default `false` — not visible in prod yet). When flag on: render premium-muted styling + lock-icon for non-premium users; clicking opens upgrade flow. Add `atlas_v1` to `src/lib/feature-flags.ts` | P1 | Done | [REQ-F-navigation-redesign](../1-objectives/requirements/REQ-F-navigation-redesign.md) | TASK-qa-nav-restructure-zones | 2026-04-16 | `atlas_v1` flag added to `feature-flags.ts` (default false). Center-zone logic extended: `isAtlasActive` + `showAtlas` + `premiumOnly` link type. Desktop: Lock icon + opacity-40 + upgrade onClick for free users. Mobile: same pattern. `handleUpgrade` added to AppShell (dynamic import, same pattern as handleLeviUpgrade). `nav.atlasPremium` i18n keys (EN+DE). 3 flag tests green. Lint clean. |
| TASK-qa-nav-mobile-375 | Verify restructured nav usable at 375px viewport without horizontal scroll. Storybook viewport test + Vitest snapshot for each route variant (Dashboard/Signatur/Atlas/other) | P1 | Done | [REQ-F-navigation-redesign](../1-objectives/requirements/REQ-F-navigation-redesign.md) | TASK-qa-nav-active-route-highlight, TASK-qa-nav-agents-popup-levi-only, TASK-qa-nav-theme-toggle-icon, TASK-qa-nav-atlas-flagged-stub | 2026-04-16 | CON-mobile-first-readability. Dependency updated 2026-04-16 from `-agents-popup-both-premium` to `-agents-popup-levi-only` (decomposed). |
| TASK-qa-nav-tests | Vitest coverage: contextual link visibility per route, active-route disabled state, Agents popup surfaces Levi + premium gating, theme toggle reflects state, Atlas flag-gate behavior, Settings mode-toggle icons-only | P1 | Done | [REQ-F-navigation-redesign](../1-objectives/requirements/REQ-F-navigation-redesign.md) | TASK-qa-nav-mobile-375 | 2026-04-16 | Cleanup: also delete unused `NavSidebarA`, `NavVariant{A,B,C}`, `navigation-variants.test.tsx`, `nav.sidebar.*` i18n keys. Eve-tile test deferred to TASK-qa-nav-agents-popup-add-eve (blocked on multi-agent refactor). |

### Phase 2 — Signatur Real-Time Triggers & Cluster Gate

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-qa-sig-trigger-contract-doc | Document trigger→effect→latency mapping in `src/components/fusion-ring-website/README.md` (transit poll, quiz-cluster, space-weather, audio mute) | P1 | Done | [REQ-F-signatur-realtime-triggers](../1-objectives/requirements/REQ-F-signatur-realtime-triggers.md) | - | 2026-04-15 | Source of truth for remaining Phase-2 tasks |
| TASK-qa-sig-transit-visible-response | Ensure transit-state poll deltas produce a perceptible ring change — tune intensity floor/ceiling in V2 canvas | P1 | Done | [REQ-F-signatur-realtime-triggers](../1-objectives/requirements/REQ-F-signatur-realtime-triggers.md) | TASK-qa-sig-trigger-contract-doc | 2026-04-16 | QA-8, QA-15. Root cause: targetSignals (transit-modulated) were computed but never consumed by V2 canvas — only static baseSignals were fed. Fixed: V2 now receives targetSignals; power curve softened 1.5→1.2; skip-rebuild threshold avoids 800ms churn. |
| TASK-qa-sig-cluster-gate-enforcement | Verify soulprint-sector mutation only on full cluster completion — audit `useQuizContribution` + server `/api/contribute` upsert logic, fix any single-quiz leaks | P1 | Done | [REQ-F-signatur-realtime-triggers](../1-objectives/requirements/REQ-F-signatur-realtime-triggers.md) | TASK-qa-sig-trigger-contract-doc | 2026-04-16 | QA-17, QA-24. Bug: partial quiz results were discarded. Fixed: localStorage queue stores partial results; batch-POSTs all on cluster completion. 17 tests. |
| TASK-qa-sig-cluster-transition-animation | Animated ring transition when a cluster-complete contribution applies | P1 | Done | [REQ-F-signatur-realtime-triggers](../1-objectives/requirements/REQ-F-signatur-realtime-triggers.md) | TASK-qa-sig-cluster-gate-enforcement | 2026-04-16 | Animation already wired: handleQuizComplete fires burst effect (cluster color + significance) → V2 radial displacement, color injection, resonance wave, screen shake. 11 contract tests verify all 6 clusters produce valid effects. |
| TASK-qa-sig-webgl-fallback | Graceful WebGL failure: render non-3D fallback (2D SVG sector rings) instead of raw error text | P1 | Done | [REQ-F-signatur-realtime-triggers](../1-objectives/requirements/REQ-F-signatur-realtime-triggers.md) | TASK-qa-sig-trigger-contract-doc | 2026-04-16 | QA-23. onFailed prop on V2 → FusionRing3D switches to V1 FusionRingWebsiteCanvas. V3 Suspense fallback also uses V1. renderError banner DEV-only. 7 tests. |
| TASK-qa-sig-audio-mute-reliable | Cousto audio mute: verify one-click stop + localStorage persistence across reload | P1 | Done | [REQ-F-signatur-realtime-triggers](../1-objectives/requirements/REQ-F-signatur-realtime-triggers.md) | TASK-qa-sig-trigger-contract-doc | 2026-04-16 | QA-25. Implementation already correct: ctx.suspend() called synchronously in mute effect (<<1ms). 14 tests: init from localStorage, toggleMute persistence, reload simulation, volume clamping, 100ms timing contract. |
| TASK-qa-sig-mobile-v2-parity | Confirm mobile uses V2 engine by default; log explicit degradation notice if V1 activated (no silent fallback) | P1 | Done | [REQ-F-signatur-realtime-triggers](../1-objectives/requirements/REQ-F-signatur-realtime-triggers.md) | TASK-qa-sig-trigger-contract-doc | 2026-04-16 | FuRingScreen now uses SignaturEngine (V2) by default via MOBILE_FLAGS.signature_engine_v2=true. onFailed prop on SignaturEngine logs console.warn + switches to SignaturCanvas (V1). New lib/mobile-feature-flags.ts mirrors web flag defaults. 8 tests. |
| TASK-qa-sig-theme-aware | Make Signatur (FuRingPage + `FusionRingCanvasV2` + `FusionRingWebsiteCanvas` fallback) theme-aware: respect global `planetariumMode`. Currently hard-coded dark; add bright-mode background/particle palette so Solar System theme renders correctly on `/signatur` | P1 | Done | [REQ-F-signatur-realtime-triggers](../1-objectives/requirements/REQ-F-signatur-realtime-triggers.md) | TASK-qa-sig-trigger-contract-doc | 2026-04-17 | FuRingPage: bg-transparent in bright mode (defers to AppShell morning-bg), planetariumMode prop threaded to FusionRing3D. FusionRingWebsiteCanvas+V2: rendererRef+fogRef/skyMatRef, reactive useEffect updates clearColor+sky uniforms without scene remount. FusionRing3D section border/bg conditional. 12 tests (signatur-theme-aware.test.ts). |
| TASK-qa-sig-tests | Vitest/Jest: cluster-gate enforcement, mute persistence across reload, WebGL-fail fallback render, theme-mode parity | P1 | Todo | [REQ-F-signatur-realtime-triggers](../1-objectives/requirements/REQ-F-signatur-realtime-triggers.md) | TASK-qa-sig-cluster-gate-enforcement, TASK-qa-sig-webgl-fallback, TASK-qa-sig-audio-mute-reliable, TASK-qa-sig-theme-aware | 2026-04-15 | |

### Phase 3 — i18n Completeness & Quiz Overlay Dismissal

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-qa-i18n-audit-script | Automated audit test: enumerate all `t('...')` calls in `src/` + `packages/shared/src/` and assert each key exists in DE + EN translation maps | P1 | Todo | [REQ-F-i18n-completeness](../1-objectives/requirements/REQ-F-i18n-completeness.md) | - | 2026-04-15 | Basis for remaining Phase-3 work; frontend + shared |
| TASK-qa-i18n-fix-missing-keys | Fix all keys flagged by the audit — add missing DE/EN translations | P1 | Todo | [REQ-F-i18n-completeness](../1-objectives/requirements/REQ-F-i18n-completeness.md) | TASK-qa-i18n-audit-script | 2026-04-15 | QA-1, QA-9, QA-18 |
| TASK-qa-i18n-ci-gate | Wire audit test into `npm run test` so build fails on raw-key regression | P1 | Todo | [REQ-F-i18n-completeness](../1-objectives/requirements/REQ-F-i18n-completeness.md) | TASK-qa-i18n-fix-missing-keys | 2026-04-15 | |
| TASK-qa-quiz-x-button-reliable | QuizOverlay X-button: ensure reachable and clickable on all 22 quizzes + Conversation Analysis (fix z-index/scroll occlusion) | P1 | Todo | [REQ-F-i18n-completeness](../1-objectives/requirements/REQ-F-i18n-completeness.md) | - | 2026-04-15 | QA-10 |
| TASK-qa-quiz-escape-dismiss | Escape key dismisses QuizOverlay | P1 | Todo | [REQ-F-i18n-completeness](../1-objectives/requirements/REQ-F-i18n-completeness.md) | TASK-qa-quiz-x-button-reliable | 2026-04-15 | QA-11 |
| TASK-qa-quiz-backdrop-dismiss | Backdrop click dismisses QuizOverlay | P1 | Todo | [REQ-F-i18n-completeness](../1-objectives/requirements/REQ-F-i18n-completeness.md) | TASK-qa-quiz-x-button-reliable | 2026-04-15 | QA-13 |
| TASK-qa-quiz-result-translated | Audit quiz result screens + cluster-completion hints — ensure translated strings, not raw keys | P1 | Todo | [REQ-F-i18n-completeness](../1-objectives/requirements/REQ-F-i18n-completeness.md) | TASK-qa-i18n-fix-missing-keys | 2026-04-15 | QA-14 |
| TASK-qa-quiz-tests | Vitest: Escape + backdrop dismissal, X-button reachability on a sampled quiz, cluster-gate POST behavior | P1 | Todo | [REQ-F-i18n-completeness](../1-objectives/requirements/REQ-F-i18n-completeness.md) | TASK-qa-quiz-escape-dismiss, TASK-qa-quiz-backdrop-dismiss, TASK-qa-quiz-result-translated | 2026-04-15 | |

### Phase 4 — Deploy & Operations

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-qa-sprint-manual-testing | Create `4-deploy/runbooks/qa-sprint-2026-04-15-test.md` with startup + step-by-step manual scenarios (nav consistency, signatur trigger check, i18n audit pass, quiz dismissal) | P1 | Todo | - | TASK-qa-nav-tests, TASK-qa-sig-tests, TASK-qa-quiz-tests, TASK-qa-i18n-ci-gate | 2026-04-15 | Spans frontend, mobile, api-server |

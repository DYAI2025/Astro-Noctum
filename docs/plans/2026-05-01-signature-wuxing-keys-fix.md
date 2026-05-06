# Plan: Signatur-Crash-Fix — Wuxing DE/EN-Key-Drift

**Erstellt:** 2026-05-01
**Status:** Plan-Review — noch nicht in Umsetzung
**Strategie:** Nachhaltig (Alles-in-einem, kein Hotfix-First)
**Geschätzte Gesamtdauer:** 2.0–2.5 h netto, mit Puffer 3 h

---

## 1. Diagnose (eine Zeile)

`apiData.wuxing.elements` kann via Superglue→Supabase→`parseAstroProfileJson` mit nur deutschen Keys (`Holz`/`Feuer`/...) ankommen. `baziToChladniParams` castet den Top-Key blind als `WuxingElement`. Der Renderer crasht in `buildWuxingMaterial`, weil `MATERIAL_PROPS['Holz'] === undefined`.

## 2. Strategische Entscheidung

Defense-in-Depth über vier Schichten — keine einzige Schicht reicht, alle vier zusammen machen das Symptom strukturell unmöglich:

1. **Boundary** (`parseAstroProfileJson`) heilt persistierte Daten beim Hydrieren.
2. **Domain** (`baziToChladniParams`, `sectorsToTarget`) validiert vor Cast.
3. **Renderer** (`buildWuxingMaterial`, `SignatureSphere3D`) klemmt + warnt.
4. **Tests** sichern jede Schicht ab.

## 3. Übergeordnete Steuerungs-Prinzipien

### 3.1 Mikro-Phasen mit Verifikations-Gate
Jede Phase ist ≤30 Min, hat einen klaren Verifikations-Schritt, und produziert einen atomaren Commit. Keine Phase startet, bevor die vorige verifiziert grün ist.

### 3.2 Re-Read-Disziplin
- Vor jedem Edit: Datei neu lesen (kein Verlass auf Memory aus früherem Read).
- Nach jedem Edit: Datei neu lesen, um zu prüfen, dass der Patch wirklich gelandet ist.
- Pro Datei max. 3 Edits ohne Verifikations-Read.

### 3.3 TDD wo sinnvoll
Boundary, Domain und Renderer-Klammer bekommen Tests **vor** Implementierung (RED-GREEN). Das zwingt die Spec in den Test, nicht in meinen Kopf.

### 3.4 Scope-Klammer
Alle Defekte, die ich **außerhalb des direkten Crash-Pfads** entdecke, gehen in einen **Defects-Log** am Ende dieses Plans — NICHT in den Fix. Wir vermeiden, dass der PR explodiert.

### 3.5 Atomare Commits
Pro Phase ein Commit. Bei Rollback: phasenweise revertibar. Commit-Message-Pattern:
```
fix(wuxing): <phase> — <kurz-was>
```

## 4. HALT-Trigger (wann ich aufhöre und dich informiere)

Ich höre auf, melde mich, und mache **nicht** alleine weiter, wenn:

| ID | Bedingung | Reaktion |
|----|-----------|----------|
| **H1** | Baseline (Phase 0) ist nicht grün — typecheck oder Tests rot vor Beginn | Plan stoppt. Wir müssen den Status quo erst klären. |
| **H2** | Eine Phase überschreitet Time-Box um >50% | "Reibung im System". Ich melde mich mit Ursachenvermutung, du entscheidest. |
| **H3** | Ein vorher-grüner Test wird durch meine Änderung rot | Unbekannte Wechselwirkung. Diff zeigen, du entscheidest. |
| **H4** | typecheck/lint nach einer Phase rot und nicht in 5 Min lösbar | HALT. Diff + Fehler an dich. |
| **H5** | Eine Annahme aus der Diagnose stellt sich als falsch heraus (z.B. Phase A heilt nichts, weil DE-Daten gar nicht da sind) | HALT. Plan muss re-evaluiert werden. |
| **H6** | Ich entdecke einen weiteren, **unverwandten** Bug | Notieren im Defects-Log unten, NICHT mitfixen. |
| **H7** | An irgendeiner Stelle Konfidenz <80% in eine Code-Änderung | HALT statt blind ändern. |
| **H8** | npm run build scheitert | HALT. Build-Output an dich. |
| **H9** | Ein Subprozess (npm install, test) hängt >2 Min | Cancel + Status melden. |

## 5. Berichts-Punkte (wann ich proaktiv melde)

| ID | Wann | Inhalt |
|----|------|--------|
| **R1** | Nach Phase 0 | "Baseline grün, Branch erstellt, starte Phase 1." |
| **R2** | Nach Phase 4 (Domain-Logik fertig) | Zwischen-Status mit Test-Output. Du kannst hier abbrechen oder weitermachen lassen. |
| **R3** | Nach Phase 7 | Final-Report: Diff-Zusammenfassung, alle Verifikations-Outputs, Smoke-Test-Anleitung. |
| **R4** | Bei jedem HALT-Trigger | Sofortige Meldung, kein "ich versuch's noch kurz". |

## 6. Pre-Flight Checklist (Phase 0)

**Time-Box: 5 Min**

```bash
cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum

# 1. Sauberer Working Tree?
git status

# 2. Auf welchem Branch?
git branch --show-current

# 3. Baseline grün?
npm run typecheck
npm run lint
npm test
```

**Aktion:**
- Wenn working tree dirty → mit dir klären (stash? commit?).
- Wenn baseline rot → **HALT (H1)**, nicht weitermachen.
- Wenn alles grün → neuer Branch:
  ```bash
  git checkout -b fix/wuxing-element-normalization
  ```

**Verifikations-Gate:** baseline grün + Branch sauber + zeige dir den Status (R1).

## 7. Phasen-Plan im Detail

### Phase 1 — Test-First: Boundary-Normalisierung
**Time-Box: 20 Min**
**Files:** Neue Test-Datei `src/types/__tests__/bafe.test.ts` (existiert evtl. schon — falls ja, ergänzen).

**Was:**
Tests für `parseAstroProfileJson` schreiben, die:
- DE-only `wuxing.elements` als Input geben
- erwarten, dass der Output **beide** Sprachsets enthält (EN-Spiegel ergänzt, DE-Original erhalten)
- erwarten, dass `dominant_element` auf EN normalisiert ist
- Edge-Cases: `wuxing` ist `null`, `wuxing.elements` ist `null`, ist `{}`, hat Whitespace-Keys

**Verifikations-Gate:**
```bash
npm test -- bafe
```
Neue Tests sollten **rot** sein (RED). Wenn sie versehentlich grün sind, ist mein Test falsch oder der Bug existiert nicht — **HALT (H5)**.

**Commit:** `test(bafe): add wuxing-element normalization expectations (RED)`

### Phase 2 — Implementierung: Boundary-Normalisierung
**Time-Box: 20 Min**
**Files:**
- Neue Util: `src/lib/wuxing/normalize-elements.ts` (zentral, wiederverwendbar — auch von Phase 4 genutzt)
- Edit: `src/types/bafe.ts` `parseAstroProfileJson` (~Zeile 230)

**Was:**
Util `normalizeWuxingElements(input)`:
- nimmt `Record<string, unknown>` oder `null`/`undefined`
- mappt DE→EN (`Holz→Wood`, `Feuer→Fire`, `Erde→Earth`, `Metall→Metal`, `Wasser→Wasser`→`Water`)
- ergänzt EN-Spiegel ohne DE-Originale zu zerstören
- ignoriert unbekannte Keys, ignoriert nicht-numerische Werte
- gibt sauberes `Record<string, number>` zurück

`parseAstroProfileJson` ruft Util auf für `wuxing.elements` und normalisiert `wuxing.dominant_element` über DE→EN-Map.

**Pre-Edit-Check (Pflicht):** Grep alle Konsumenten von `apiData.wuxing.elements`, um sicherzugehen, dass das Hinzufügen der EN-Spiegel niemanden bricht. Liste:
```bash
grep -rn 'wuxing\?\.elements\|wuxing\.elements' src/
```
Ergebnis dokumentieren, prüfen ob jemand DE-Keys hart liest und auf deren Abwesenheit verlässt.

**Verifikations-Gate:**
- Phase-1-Tests sollten **grün** werden (GREEN).
- `npm run typecheck` grün.
- `npm test` (gesamt) grün.

**Commit:** `fix(bafe): normalize wuxing.elements to canonical EN keys at parse boundary`

### Phase 3 — Test-First: Domain-Logik (`baziToChladniParams`)
**Time-Box: 15 Min**
**Files:** `src/lib/cymatics/__tests__/bazi-to-chladni.test.ts` (existiert wahrscheinlich, ergänzen).

**Was:**
Tests:
- `baziToChladniParams` mit DE-only `wuxingWeights` → `dominantElement` ist eine valide `WuxingElement` (nicht `'Holz'`)
- mit gemischten EN/DE Keys → EN gewinnt
- mit leerem `{}` → fällt auf `'Water'`
- mit `null`/`undefined` als Input → fällt auf `'Water'` (kein Crash)
- mit Whitespace-Key (`' Wood '`) → wird normalisiert zu `'Wood'`
- mit komplett unbekannten Keys (`'Plasma'`) → fällt auf `'Water'`

**Verifikations-Gate:** Tests rot → RED bestätigt.

**Commit:** `test(bazi-to-chladni): add element-key drift cases (RED)`

### Phase 4 — Implementierung: Domain-Logik härten
**Time-Box: 15 Min**
**Files:**
- `src/lib/cymatics/bazi-to-chladni.ts` Zeilen ~125–127 + ~223–225
- nutzt Util aus Phase 2

**Was:**
- In `baziToChladniParams`: vor Sort `Object.entries` filtern → nur normalisierte EN-Keys behalten, dann sortieren.
- In `sectorsToTarget`: gleicher Pattern (auch wenn aktuell sicher, Konsistenz).
- Output explizit gegen 5er-Whitelist validieren, sonst `'Water'`.
- Guard: wenn `wuxingWeights` nicht-Objekt → `'Water'`.

**Verifikations-Gate:**
- Phase-3-Tests grün.
- typecheck grün.
- vollständige Test-Suite grün.

**Commit:** `fix(bazi-to-chladni): validate dominantElement output against canonical set`

**Berichts-Punkt R2:** Zwischen-Bericht an dich. Stand: 2 von 4 Schichten + Tests grün. Du kannst hier auf Pause.

### Phase 5 — Test-First: Renderer-Klammer
**Time-Box: 10 Min**
**Files:** `src/lib/signatur-3d/__tests__/wuxing-material.test.ts` (existiert).

**Was:**
Tests:
- `buildWuxingMaterial({ element: 'Holz' as any })` → kein Throw, Material wird gebaut, intern als `'Water'` behandelt
- `mat.userData.updateElement('Holz' as any)` → kein Throw
- (optional) Spy auf `console.warn` → einmalige Warnung

**Verifikations-Gate:** Tests rot → RED bestätigt.

**Commit:** `test(wuxing-material): assert unknown element falls back to Water (RED)`

### Phase 6 — Implementierung: Renderer-Klammer
**Time-Box: 15 Min**
**Files:**
- `src/lib/signatur-3d/wuxing-material.ts` (`buildWuxingMaterial`, `updateElement`)
- `src/components/signatur-3d/SignatureSphere3D.tsx` (Prop-Validierung am Eingang oder kurz vor Pass-Through an `AnimatedScene`)

**Was:**
- `buildWuxingMaterial`: wenn `element` nicht in `MATERIAL_PROPS` → `console.warn('[wuxing-material] Unknown element X, falling back to Water')` (einmal pro Session via Set), dann `element = 'Water'`.
- `updateElement`: gleicher Schutz.
- `SignatureSphere3D`: am Eingang `dominantElement` validieren — wenn ungültig, intern auf `'Water'` setzen vor Weitergabe an `AnimatedScene`. Default-Param-Trick reicht nicht (greift nur bei `undefined`).

**Verifikations-Gate:**
- Phase-5-Tests grün.
- alle Tests grün.
- typecheck grün.
- lint grün.

**Commit:** `fix(signatur-3d): clamp unknown wuxing elements to Water in renderer`

### Phase 7 — End-to-End-Verifikation
**Time-Box: 15 Min**

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Alle vier müssen grün sein. Wenn build fehlschlägt → **HALT (H8)**.

**Manueller Smoke-Plan (für dich nach Deploy):**
1. bazodiac.space/signatur öffnen.
2. Hard-Reload (Cmd+Shift+R).
3. Console öffnen — kein `TypeError: Cannot read properties of undefined (reading 'specStrength')`.
4. Sphere wird gerendert und animiert.
5. Wenn `console.warn` mit `[wuxing-material] Unknown element ...` auftaucht → das ist **erwünscht** und zeigt, dass die Klammer greift; bedeutet aber, dass die Boundary-Heilung (Phase 1+2) für **deinen** Account die alten Daten noch nicht ersetzt hat. Workaround dann: Profil neu erzeugen lassen, oder Supabase-Row für deinen User-Account mal durchsehen.

### Phase 8 — Commit-Hygiene & PR
**Time-Box: 10 Min**

- `git log` Review: 6 Commits in sinnvoller Reihenfolge.
- Optional: `git rebase -i` falls Reihenfolge oder Squashing nötig.
- Push auf Branch.
- PR-Beschreibung aus diesem Plan + Verifikations-Outputs.
- Verlinkung auf diese Plan-Datei.

## 8. Rollback-Strategie

- **Pro Phase ein Commit** → einzelne Phase via `git revert <sha>` zurückrollbar.
- **Branch ist isoliert** (`fix/wuxing-element-normalization`) — kein direkter Push auf main.
- **Falls Bundle-Build scheitert**: Revert auf vorherigen Phase-Commit, Diagnose, neuer Versuch.
- **Falls nach Deploy weitere Crashes auftauchen**: PR mergen rückgängig machen via Revert-PR (kein Force-Push). Boundary-Heilung lassen, Domain-Härtung lassen, nur die problematische Schicht reverten.

## 9. Risiken & wie der Plan damit umgeht

| Risiko | Wie der Plan abdeckt |
|--------|---------------------|
| Diagnose ist falsch (DE-Keys sind nicht die Wurzel) | Defense-in-Depth wirkt unabhängig — Renderer-Klammer fängt jeden Müll-String ab. Plus HALT-Trigger H5. |
| Andere Konsumenten von `wuxing.elements` brechen | Pre-Edit-Grep in Phase 2; EN-Spiegel sind additiv, DE bleibt erhalten. |
| Tests sind unvollständig | TDD-Reihenfolge: Spec wird **vor** Code in Tests fixiert. Test-Liste ist konkret. |
| Bundle weicht von Source ab | Phase 7 baut lokal; Smoke-Test post-deploy. |
| Time-Box-Sprünge | HALT H2 zwingt mich zur Meldung statt stiller Verschleppung. |
| Scope-Creep | Defects-Log unten + H6. |
| Konflikt mit anderen offenen Branches | Phase 0 prüft `git status`; saubere Basis ist Voraussetzung. |
| Memory-Drift im Plan-Vollzug | R-Berichte zwingen mich zu strukturierten Zwischenstands-Meldungen. |

## 10. Definition of Done

Alle Punkte müssen abgehakt sein, bevor ich "fertig" sage:

- [ ] 4 Code-Schichten geändert (Boundary, Domain, Renderer, plus Util)
- [ ] 3 Test-Dateien ergänzt (Boundary, Domain, Renderer)
- [ ] `npm run typecheck` grün
- [ ] `npm run lint` grün
- [ ] `npm test` grün — inkl. der neuen Tests
- [ ] `npm run build` erfolgreich
- [ ] 6 atomare Commits in sinnvoller Reihenfolge
- [ ] Visueller Smoke-Test auf bazodiac.space/signatur ohne Crash (von dir bestätigt)
- [ ] Memory-Update: bestehende Memory `project_wuxing_german_keys_supabase.md` ergänzen mit "validierter Fix"
- [ ] PR aufgesetzt mit Verlinkung auf diesen Plan

## 11. Was ich von dir brauche, BEVOR ich Phase 0 starte

1. **Freigabe des Plans** als Ganzes — oder konkrete Änderungswünsche.
2. **Branch-Convention bestätigen** — Branch-Name `fix/wuxing-element-normalization`, ok? Oder anderes Pattern?
3. **PR-Strategie** — direkt Push auf Origin und PR aufmachen, oder erst lokal abwarten und du reviewst lokal?
4. **Auto-Memory-Update am Ende** — soll ich die existierende Wuxing-Memory ergänzen, oder eine neue Validation-Memory anlegen?

## 12. Was ich NICHT tue (Scope-Klammer)

Diese Dinge sind **nicht** Teil dieses Plans, auch wenn sie verwandt sind:

- Tageshoroskop 502 (`/api/experience/daily`) — separater Backend-Bug, anderer Pfad, anderer Plan.
- Tightening von `MappedWuxing.elements` zu einem strikten typed Map — Type-Refactor mit größerer Reichweite, eigener Plan.
- Superglue-Worker entweder abschalten oder so umbauen, dass er auf `mapChartToApiResults` durchläuft — strategische Entscheidung, separate Memory `project_superglue_removal_pending.md`.
- CSP-`worklet-src`-Warnungen — Browser-Noise, kein Bug.
- Investigation, ob noch andere Stellen `as WuxingElement` ohne Validierung casten — Defects-Log Eintrag.

## 13. Defects-Log (wird live gepflegt)

Hier landen Funde aus den Phasen, die NICHT in diesen PR gehen, aber dokumentiert werden müssen:

- (leer beim Plan-Start)

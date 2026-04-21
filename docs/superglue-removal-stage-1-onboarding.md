# Superglue Removal — Stage 1: Onboarding Pfad

**Status:** Planned
**Erstellt:** 2026-04-18
**Ausführender Agent:** Claude Code Opus 4.7
**Auftraggeber:** Ben Poersch (PO Bazodiac)
**Scope-Dauer-Schätzung:** 4–6 Stunden echte Arbeit, über mehrere Mikro-Phasen

---

## 1. Kontext

Bazodiac ist aktuell mit **Superglue** als Orchestration-Middleware verdrahtet. Superglue betreibt 9 Tool-Flows (Chart-Berechnung, Daily-Transit, Cosmic-Weather, Kohärenz-Index, ElevenLabs-Context, Conversation-Save, Deep-Reading-PDF, Stock-Alert, Hubspot-Demo). Seit der Integration häufen sich laut PO-Bericht Fehler in User-sichtbaren Kernpfaden — insbesondere die Signatur-Ansicht (2D Cymatics + 3D Sphere) zeigt Default-Fallback statt user-spezifischer Darstellung, auch nach einem erfolgreichen Deploy der Client-seitigen Planet-Weights-Entkoppelung am 2026-04-18.

**Langfristiges Ziel:** Die 6 user-sichtbaren Core-Flows (Onboarding, Daily-Transit, Kohärenz-Index, ElevenLabs-Context, Conversation-Save, Cosmic-Weather-Cache) zurück ins eigene Backend holen, Superglue als Dependency für Core-UX entfernen. Superglue bleibt ggf. für Deep-Reading-PDF (#7) und Legacy-Demos (#8, #9) erhalten, bis diese unabhängig migriert werden.

**Stage 1 (dieser Plan)** kümmert sich ausschließlich um den Onboarding-Pfad (Tool #1 `bazodiac-user-chart`). Das ist die wichtigste Schnittstelle, weil davon abhängt, ob neu registrierte User überhaupt ein vollständiges Astro-Profil bekommen — und damit, ob sie eine user-spezifische Signatur sehen.

---

## 2. Root-Cause-Hypothese (vorab-Beweis)

Die aktuelle Bootstrap-Logik in `server.mjs` (Zeilen 2034–2136) sieht so aus:

1. Superglue-Webhook triggern (`triggerBazodiacUserChart`) — wartet auf Response.
2. Polling auf `astro_profiles.astro_json` (8× 750ms = max 6 Sekunden) bis Superglue-Worker fertig geschrieben hat.
3. Falls Polling fehlschlägt: **Fallback** auf direkten BAFE `/chart`-Call.
4. Soulprint-Sektoren berechnen und in `astro_profiles.soulprint_sectors` schreiben.

**Kritischer Bug, sehr wahrscheinlich die Ursache der Default-Signatur:**

- Wenn **Fall 3 greift** (direkter BAFE-Call), schreibt der Server **NIE** das `astro_json` nach Supabase zurück. Er setzt nur `soulprint_sectors`. Das heißt: `astro_profiles.astro_json` bleibt leer oder unvollständig.
- Im Frontend (`SignaturPage.tsx`) liest `apiData.bazi` und `apiData.wuxing` aus genau diesem `astro_json`. Wenn es leer ist → `chladniParams === undefined` → 2D zeigt Fallback → `planetWeights === NEUTRAL_BAZI_WEIGHTS` → 3D zeigt Default-Sphere.
- Im Normalbetrieb schreibt der Superglue-Worker `astro_json`; wenn er ausfällt oder Timeout hat, greift der Fallback — und genau dann bricht die Pipeline.

**Das bedeutet:** Das Symptom "alle User sehen Default" ist konsistent damit, dass der Superglue-Worker intermittierend langsam oder ausgefallen ist, sodass der Fallback-Pfad greift und dabei das `astro_json` nicht persistiert.

**Verifikationsschritt vor dem Refactor (nicht-optional):** Claude Code soll vor Beginn dieses Plans in Supabase SQL Editor folgende Query ausführen (oder vom PO ausführen lassen):

```sql
SELECT
  user_id,
  CASE WHEN astro_json IS NULL THEN 'NULL'
       WHEN astro_json::text = '{}' THEN 'EMPTY'
       WHEN (astro_json->>'bazi') IS NULL THEN 'NO_BAZI'
       WHEN (astro_json->>'western') IS NULL THEN 'NO_WESTERN'
       WHEN (astro_json->>'wuxing') IS NULL THEN 'NO_WUXING'
       ELSE 'OK'
  END AS state,
  COUNT(*) AS n
FROM astro_profiles
GROUP BY 1, 2
ORDER BY n DESC;
```

Wenn **NO_BAZI / NO_WUXING / NULL** deutlich vertreten sind: Hypothese bestätigt, Stage 1 löst direkt das Symptom. Wenn alle **OK** sind: Hypothese widerlegt, bitte STOP und melden — der Bug sitzt dann im Frontend-Lesepfad, nicht in Superglue.

---

## 3. Scope & Non-Goals

**In Scope:**

- `/api/experience/bootstrap` Endpoint (server.mjs Zeilen 2034–2136) umbauen.
- Direkter, synchroner FuFirE `/chart`-Call als **Haupt-Pfad**.
- Vollständiges Persistieren von `astro_json` inkl. allen Subfields (bazi, western, wuxing, fusion) nach Supabase.
- Sicherstellen, dass `astro_profiles`-Zeile angelegt wird, falls sie noch nicht existiert (Upsert statt Update).
- Entfernen der Superglue-Utility-Funktionen (`triggerBazodiacUserChart`, `waitForStoredChart`, `extractStoredChart`) UND der Env-Vars (`SUPERGLUE_BASE_URL`, `SUPERGLUE_API_KEY`).
- Integrationstest mit einem frisch angelegten Test-User.

**Out of Scope (für spätere Stages):**

- Daily-Transit-Flow (#2)
- Cosmic-Weather-Cache (#3)
- Kohärenz-Index (#4)
- ElevenLabs-Context + Conversation-Save (#5, #6)
- Deep-Reading-PDF (#7) — bleibt auf Superglue, bis separat migriert.
- Legacy-Demos (#8, #9)

**Explizit NICHT in Scope:** Client-seitige Änderungen. Der Refactor ist rein server-seitig. Falls beim Testen erkennbar wird, dass der Client angepasst werden muss, bitte HALT und PO konsultieren.

---

## 4. Vorab-Audit (Read-Only — bitte vor jedem Edit abschließen)

Bitte die folgenden Dateien in voller Länge lesen, nicht nur gesampled:

1. `/Astro-Noctum/server.mjs` — komplett, aber fokussiert auf:
   - Zeilen 1–120 (imports, retries, Superglue utilities, waitForStoredChart)
   - Zeilen 277–365 (BAFE-URL-Setup, bafeDirectHeaders)
   - Zeilen 781–810 (fetchChartForBirth Implementation — der bestehende direkte BAFE-Call für Synastry)
   - Zeilen 2034–2136 (Bootstrap-Endpoint)
2. `/Astro-Noctum/src/services/api.ts` — welche Shape das Frontend an `/api/experience/bootstrap` sendet und erwartet.
3. `/Astro-Noctum/src/types/bafe.ts` — Typ `ApiData` (inkl. `MappedBazi`, `MappedWuxing`) — welche Struktur das Frontend aus `astro_json` liest.
4. `/Astro-Noctum/src/contexts/AppLayoutContext.tsx` — wie `apiData` im Frontend bereitgestellt wird.
5. `/Astro-Noctum/src/lib/schemas/experience.ts` — falls vorhanden, für `BootstrapResponse` Typ.

**Nicht ändern, nur lesen.** Ziel: sicherstellen, dass der neue Code exakt die gleiche Shape produziert, die das Frontend bereits erwartet.

---

## 5. Mikro-Phasen (Codemoss-Agent-Guardrails)

**Operative Regel für alle Phasen:**

- Vor jedem Edit: Datei frisch lesen.
- Nach jedem Edit: Datei frisch lesen und prüfen.
- Keine Platzhalter, keine erfundenen Feldnamen. Alles muss im tatsächlichen Code oder der Supabase-Schema-Realität verankert sein.
- Maximal 3 Edits pro Datei ohne Re-Read.
- Nach jeder Phase: Verifikation laufen lassen, bevor die nächste startet.

### Phase 0 — Baseline & Backup (15 min)

1. `git status` prüfen — Working Directory muss clean sein.
2. Neuen Branch erstellen: `git checkout -b refactor/stage-1-superglue-out-onboarding`.
3. `npx tsc --noEmit` laufen lassen — Baseline muss grün sein. Wenn nicht: HALT, Fehler erst reparieren oder PO konsultieren.

**Verifikation Phase 0:** Branch exists, tsc grün. Commit nichts.

### Phase 1 — Neuen `fetchAndPersistChart`-Service extrahieren (60–90 min)

Ziel: Eine einzige Funktion, die (a) BAFE `/chart` aufruft, (b) die Response validiert, (c) in `astro_profiles` als Upsert schreibt.

**Platzierung:** direkt in `server.mjs` unterhalb der vorhandenen `fetchChartForBirth` Funktion (ca. Zeile 810), **oder** — wenn der PO ein dediziertes Module bevorzugt — als neues Modul `/Astro-Noctum/lib/onboarding/fetchAndPersistChart.mjs` und Import in server.mjs. Default ist inline in server.mjs wegen minimaler Scope-Ausweitung.

Signatur:

```js
/**
 * Ruft FuFirE /chart auf und persistiert das vollständige Chart nach Supabase.
 * Einziger serverseitiger Pfad zur Chart-Erzeugung im Onboarding — ersetzt
 * den Superglue-Webhook + Polling.
 *
 * @param {string} userId
 * @param {{ date: string, time: string, lat: number, lon: number, tz: string }} birth
 * @returns {Promise<object>} bafeData — vollständiges Chart-Objekt aus BAFE,
 *   identisch zur Struktur, die Superglue vorher in astro_json schrieb.
 * @throws Error mit message 'bafe_unavailable' | 'bafe_invalid_response' | 'supabase_write_failed'
 */
async function fetchAndPersistChart(userId, birth) { ... }
```

Implementierungsschritte:

1. **Payload-Shape abgleichen** mit dem bestehenden Fallback-Block (server.mjs Zeilen 2054–2074). Payload: `{ birthDate, birthTime, lat, lng, timeZone }`. Das ist **nicht** die Shape, die `fetchChartForBirth` (Zeile 781) benutzt — der hat andere Feldnamen für `/chart`. Bitte beim Refactor **die Shape benutzen, die heute im Fallback funktioniert**, weil wir wissen dass BAFE die akzeptiert. Optional: Konsistenz mit `fetchChartForBirth` anschließend aufräumen (nicht in dieser Phase).
2. **Retry-Logik:** Nutze die vorhandene `fetchWithRetry` (server.mjs Zeile ~10) oder `bafeFallbackUrls('/chart')` Pattern. 3 Attempts, 1000ms Backoff. Timeout 7000ms pro Versuch.
3. **Validation nach Response:** Prüfe, dass `bafeData.bazi`, `bafeData.western`, `bafeData.wuxing` existieren. Wenn eines fehlt → `throw new Error('bafe_invalid_response')`. Kein stilles Weitermachen.
4. **Supabase Upsert** (nicht Update):
   ```js
   await supabaseServer
     .from('astro_profiles')
     .upsert(
       {
         user_id: userId,
         astro_json: bafeData,
         sun_sign: bafeData.western?.zodiac_sign ?? null,
         moon_sign: bafeData.western?.moon_sign ?? null,
         asc_sign: bafeData.western?.ascendant_sign ?? null,
         birth_date: birth.date,
         birth_time: birth.time ?? null,
         iana_time_zone: birth.tz,
         birth_lat: birth.lat,
         birth_lng: birth.lon,
         updated_at: new Date().toISOString(),
       },
       { onConflict: 'user_id' }
     );
   ```
   **Wichtig:** Prüfe vorab per Supabase Schema (list_tables), ob `astro_profiles` bereits alle diese Spalten hat. Falls nicht: HALT und PO melden — Schema-Migration ist separate Entscheidung.
5. Wenn Upsert-Error: `throw new Error('supabase_write_failed')`. Lokales Logging mit `console.error('[fetchAndPersistChart] supabase upsert failed', error)`.
6. Return: das vollständige `bafeData`-Objekt (damit der Caller die Dimension-Projektion weitermachen kann, ohne den DB-Roundtrip).

**Verifikation Phase 1:**
- `npx tsc --noEmit` grün.
- Funktion ist definiert, aber noch nicht aufgerufen (alter Bootstrap-Code unverändert).
- Commit: `git commit -m "add: fetchAndPersistChart service (not yet wired in)"`.

### Phase 2 — Bootstrap-Endpoint umschreiben (45–60 min)

Ziel: Den Bootstrap-Endpoint so umbauen, dass er `fetchAndPersistChart` direkt aufruft, ohne Superglue-Umweg.

Vor dem Edit bitte Zeilen 2034–2136 erneut lesen.

Neuer Bootstrap-Flow:

```js
app.post('/api/experience/bootstrap', requireUserAuth, async (req, res) => {
  try {
    const { birth } = req.body;
    if (!birth) return res.status(400).json({ error: 'Missing birth data' });

    // 1. Chart direkt berechnen und persistieren.
    let bafeData;
    try {
      bafeData = await fetchAndPersistChart(req.userId, birth);
    } catch (err) {
      console.error('[experience/bootstrap] chart fetch/persist failed:', err?.message);
      if (err?.message === 'bafe_unavailable') {
        return res.status(502).json({ error: 'chart_service_unavailable' });
      }
      if (err?.message === 'bafe_invalid_response') {
        return res.status(502).json({ error: 'chart_invalid' });
      }
      if (err?.message === 'supabase_write_failed') {
        return res.status(500).json({ error: 'persist_failed' });
      }
      throw err;
    }

    // 2. Master Signal (N + G) — unverändert
    const birthYear = parseInt(birth.date.substring(0, 4), 10);
    const nDim = computeNatalDimensions(bafeData);
    const qDim = zeroDimensions();
    const gcbDim = computeGCBDimensions(birthYear);

    // 3. Projection — unverändert
    const soulprintSectors = projectToRing(nDim, qDim, 1, 0);
    const narratives = generateNarratives(nDim, qDim, gcbDim, req.query.lang === 'en' ? 'en' : 'de');

    // 4. Blueprint — unverändert
    const signatureSeed = crypto.createHash('sha256')
      .update(req.userId + Date.now().toString())
      .digest('hex')
      .substring(0, 16);

    const profileData = {
      sun_sign: bafeData.western?.zodiac_sign || "Unknown",
      moon_sign: bafeData.western?.moon_sign || "Unknown",
      ascendant_sign: bafeData.western?.ascendant_sign || "Unknown",
      day_master: bafeData.bazi?.day_master || "Unknown",
      harmony_index: bafeData.fusion?.harmony_index || 0.8,
    };

    const responsePayload = {
      profile: profileData,
      soulprint_sectors: soulprintSectors,
      narratives,
      signature_blueprint: {
        seed: signatureSeed,
        visual: { symmetry: 0.5, curvature: 0.5, angularity: 0.5, density: 0.5, contrast: 0.5, orbit_count: 5 },
      },
      meta: { engine_version: "master_signal_v1_js", generated_at: new Date().toISOString() },
    };

    // 5. Soulprint save — unverändert (astro_json ist bereits in Phase 1 persistiert)
    let soulprint_saved = false;
    if (supabaseServer) {
      try {
        const { data, error } = await supabaseServer
          .from('astro_profiles')
          .update({ soulprint_sectors: soulprintSectors })
          .eq('user_id', req.userId)
          .select('user_id');
        if (error) {
          console.warn('[bootstrap] soulprint save failed', error.message);
        } else if (Array.isArray(data) && data.length > 0) {
          soulprint_saved = true;
        } else {
          console.warn('[bootstrap] soulprint save affected 0 rows for user_id', req.userId);
        }
      } catch (err) {
        console.warn('[bootstrap] soulprint save threw', err);
      }
    }

    res.status(200).json({ ...responsePayload, soulprint_saved });
  } catch (err) {
    console.error('[experience/bootstrap] Error:', err.message);
    res.status(502).json({ error: 'experience_unavailable' });
  }
});
```

**Nicht vergessen:** Den JSDoc-Kommentar über dem Endpoint (Zeilen ~2017–2032) anpassen — die Schritte 1–7 dort beschreiben heute den Superglue-Flow.

**Verifikation Phase 2:**
- `npx tsc --noEmit` grün.
- Lokaler Start (`npm run server` oder Projekt-Pendant) — Bootstrap muss ohne Crash hochfahren auch ohne `SUPERGLUE_API_KEY` gesetzt (Superglue-Code wird noch nicht aufgerufen, ist aber noch vorhanden).
- Commit: `git commit -m "refactor: bootstrap endpoint uses fetchAndPersistChart directly"`.

### Phase 3 — Superglue-Code entfernen (30 min)

Cleanup-first-Disziplin: erst den jetzt toten Code raus, bevor irgendwas committed wird.

Reihenfolge der Entfernung (in server.mjs):

1. `triggerBazodiacUserChart` Funktion (Zeilen 41–61).
2. `waitForStoredChart` Funktion (Zeilen 70–94).
3. `extractStoredChart` Funktion (Zeilen 63–68).
4. `SUPERGLUE_BASE_URL` und `SUPERGLUE_API_KEY` Konstanten (Zeilen 38–39).
5. `SUPERGLUE_API_KEY` aus `OPTIONAL_ENV_VARS` Liste entfernen (Zeile 114).

In `.env.example` (falls vorhanden): `SUPERGLUE_BASE_URL=` und `SUPERGLUE_API_KEY=` Zeilen entfernen.

In `README.md` / Setup-Docs: jede Erwähnung von Superglue für Onboarding entfernen oder korrigieren. Grep für `superglue` und `SUPERGLUE` im gesamten Repo laufen lassen, kritisch prüfen.

**Verifikation Phase 3:**
- `grep -ri superglue ./server.mjs ./src` darf im `src`-Tree komplett leer sein. In server.mjs nur noch im möglichen "Stage 2+"-Kontext (z.B. Email-Service aus Flow #7, falls überhaupt präsent — bitte nicht anfassen).
- `npx tsc --noEmit` grün.
- Commit: `git commit -m "remove: superglue onboarding integration"`.

### Phase 4 — Integrationstest (45 min)

**Pre-Requirement:** Supabase-Testumgebung oder Staging-DB. Bitte **nicht** auf Production testen.

1. Neuen Test-User per Signup anlegen (oder existierenden Test-Account nutzen, `astro_profiles`-Zeile vorher löschen).
2. Onboarding-Flow im Browser durchlaufen: Geburtsdaten eingeben, bis zur SignaturPage.
3. In Supabase prüfen: `astro_profiles.astro_json` für diesen User muss jetzt alle Felder enthalten (`bazi.pillars`, `wuxing.elements`, `western.zodiac_sign`, etc.).
4. SignaturPage im Browser:
   - 2D Cymatics: muss user-spezifisch aussehen (nicht der flache Default).
   - 3D Sphere: muss user-spezifisch aussehen.
   - Browser-DevTools Console: `console.log(apiData)` (falls DEV-Logs aktiv) — prüfen dass `apiData.bazi` und `apiData.wuxing` befüllt sind.
5. Zweiten Test-User mit stark unterschiedlichen Geburtsdaten anlegen. Vergleiche die Signatur zwischen beiden Usern: sie müssen sichtbar unterschiedlich aussehen.

**Abnahme-Kriterium:** Beide Test-User sehen unterschiedliche, nicht-defaulte Signaturen. `astro_profiles.astro_json` ist für beide User vollständig befüllt.

### Phase 5 — Dokumentation & Merge-Readiness (30 min)

1. Diese Datei (`docs/superglue-removal-stage-1-onboarding.md`) nachführen: Status von "Planned" auf "Completed". Unter `## Ausführungsnotizen` kurz festhalten, was vom Plan abgewichen wurde, falls etwas.
2. Commit-Historie auf den Branch prüfen — jeder Commit sollte eine klare, isolierte Änderung sein.
3. Dem PO einen finalen Report im codemoss-guardrails-Format zurückspielen:

```
### phase
[Zusammenfassung]

### verification
- typecheck: passed
- integration test (2 test users): passed
- Supabase astro_json: populated

### remaining risks
- [konkret auflisten]

### confidence
[high/medium/low]
```

4. Warten auf Merge-Freigabe vom PO. Nicht selbständig mergen.

---

## 6. Rollback-Plan

Falls Phase 4 (Integrationstest) Probleme zeigt:

1. Keine Hotfixes auf der Branch machen. Zurück zum Plan, Root Cause analysieren.
2. Bei unfixbarem Verhalten: `git checkout main`, Branch verwerfen, PO konsultieren.
3. Falls Stage 1 bereits merged ist und in Production Fehler auftreten:
   - Revert-Commit: `git revert <merge-commit-sha>` als Hotfix.
   - Superglue-Env-Vars müssen dann wieder gesetzt werden (waren vor dem Refactor aktiv).
   - Revert deployen.

---

## 7. Wichtige Warnungen an den ausführenden Agent

- **Nicht zusätzliche Flows anfassen.** Daily-Transit, Kohärenz-Index, Space-Weather, ElevenLabs-Context, Conversation-Save, Deep-Reading-PDF sind **alle** noch auf Superglue. Bitte nicht aus Eile oder Ordnungsdrang "gleich mit weg machen". Das ist Stage 2+.
- **Nicht das Frontend anfassen.** Wenn etwas im Frontend aus Typ- oder Shape-Gründen anders sein sollte: STOP und PO konsultieren.
- **Nicht Tests erfinden.** Wenn keine Test-Infrastruktur vorhanden ist: der Integrationstest in Phase 4 ist manuell + Supabase-Inspektion. Kein Unit-Test-Framework drumrumbauen.
- **Eiserne Grundregel des PO:** Keine Platzhalter, nur echte Werte. Wenn eine Spalte, ein Feldname, ein Pfad unklar ist — erst auditieren, dann schreiben.
- **HALT-Disziplin:** Bei jedem unerwarteten Befund, der die Annahmen dieses Plans bricht — abbrechen, melden. Nicht improvisieren.

---

## 8. Stage 2+ Preview (nicht in diesem Plan umsetzen)

Nach erfolgreichem Abschluss von Stage 1 sollten in dieser Reihenfolge folgende Flows migriert werden:

- **Stage 2:** `bazodiac-daily-transit` (#2) + `bazodiac-cosmic-weather` (#3) — beide Cache-Flows, können als Server-Endpoints oder Cron-Jobs neu gebaut werden.
- **Stage 3:** `bazodiac-kohaerenz-index` (#4) — reines Supabase-intern, einfachste Migration.
- **Stage 4:** `bazodiac-elevenlabs-context` (#5) + `bazodiac-save-conversation` (#6) — Agent-Flows.
- **Stage 5 (optional):** `bazodiac-generate-deep-reading` (#7) — mit Abstand teuerste Migration (LLM-Fallback-Kette mit 4 Providern, PDF-Gen, Email). Nur anfassen wenn Superglue als Dependency komplett entfernt werden soll.
- **Legacy-Cleanup:** `stock-email-alert` (#8), `demo-hubspot-contacts` (#9) — vermutlich entfernbar, PO-Entscheidung.

Jede Stage bekommt einen eigenen Plan in `docs/superglue-removal-stage-N-<name>.md`.

---

## 9. Ausführungsnotizen (vom Agent nachzutragen)

_Leer bis zur Ausführung._

---

**Ende des Plans. Dieser Plan ist ausführungsbereit. Start mit Phase 0.**

# Analyse: Tageshoroskop & Signatur Debugging (Stand 2026-05-01)

## 1) API-Call-Map nach Feature

### A. Tageshoroskop (Daily)

Primärer Flow:
1. `useFirstRunDaily()` wird im Dashboard aufgerufen.
2. Der Hook ruft `fetchDailyExperience()` auf.
3. `fetchDailyExperience()` sendet `POST /api/experience/daily`.
4. `dailyData.fusion.synthesis || dailyData.fusion.summary` wird als Impuls-Text im Hero/Modal gerendert.

Relevante Endpunkte:
- `POST /api/experience/daily`

Relevante Call-Sites:
- `src/hooks/useFirstRunDaily.ts`
- `src/services/experience.ts`
- `src/components/Dashboard.tsx`
- `src/components/dashboard/DailyChartHero.tsx`
- `src/components/dashboard/DashboardTagesEnergie.tsx`

### B. Signatur

Signatur-Flow ist aktuell verteilt:
- Onboarding berechnet Grundlagen über Experience-Bootstrap.
- Signature-Delta wird über Quiz/Interaktion nachgeschoben.
- Renderer selbst ist entkoppelt und fällt auf lokale/neutral states zurück.

Relevante Endpunkte:
- `POST /api/experience/bootstrap`
- `POST /api/experience/signature-delta`
- indirekt signaturnahe Tageskopplung: `POST /api/experience/daily`

Relevante Call-Sites:
- `src/services/experience.ts`
- `src/App.tsx` (Bootstrap-Anstoß)
- `src/components/signatur-renderer/SignaturRenderer.tsx`
- `src/pages/SignaturPage.tsx`

### C. Planeten (Transit-Bodies)

Transit-Positionsdaten für Tages-/Impact-Karten:
- `useDailyTransit()` ruft `POST /api/calculate/western` mit `date=<heute 12:00:00 UTC>, lat=0, lon=0`.

Relevante Endpunkte:
- `POST /api/calculate/western`

Relevante Call-Sites:
- `src/hooks/useDailyTransit.ts`
- `src/components/dashboard/AktiveEinfluesseFusion.tsx`

### D. Active Planets

Explizit aus Impact-Endpoint:
- `useActiveImpacts()` ruft `POST /api/impact/active`.
- Ergebnis enthält `active_planets[]`.

Relevante Endpunkte:
- `POST /api/impact/active`

Relevante Call-Sites:
- `src/hooks/useActiveImpacts.ts`
- `src/components/Dashboard.tsx`
- `src/components/dashboard/KohaerenzHero.tsx`
- `src/components/dashboard/AktiveEinfluesseFusion.tsx` (optional konsumiert)

### E. Active (Kohärenz / Resonanz allgemein)

Ebenso `POST /api/impact/active`, da dort:
- `harmony_index`
- `base_coherence`
- `positive_daily_delta`
- `displayed_coherence`
- `resonance_badges`

für aktive Tagesresonanz geliefert werden.

---

## 2) Warum im Tageshoroskop weiterhin Platzhalter sichtbar sein können

### Beobachtung 1: Expliziter Local Fallback mit generischem Text

`useFirstRunDaily()` setzt bei jedem Fehler bewusst `buildFallbackDaily()` und rendert damit standardisierte Texte. Das ist funktional robust, kann aber UX-seitig wie „Platzhalter“ wirken.

Risiko:
- Netzwerk-/Auth-/Schema-Fehler werden in der Oberfläche nicht als Fehlerstatus, sondern als „gültiger“ Tagesimpuls gezeigt.
- Dadurch bleibt ein API-Problem lange unentdeckt.

### Beobachtung 2: Früher Return bei fehlendem `birthData` ist nur temporär, Retry-Sperre ist kritischer

`useFirstRunDaily()` beendet den Effekt sofort, wenn `!birthData`. Das verhindert den Daily-Call aber nicht zwangsläufig dauerhaft: sobald `birthData` später von `null` auf einen gültigen Wert hydratisiert wird, läuft der Effekt wegen der Dependency erneut und kann den Call dann doch noch auslösen.

Der relevantere „kein Retry“-Fall ist daher nicht der frühe Return selbst, sondern eine mögliche Sperrwirkung von `lastFetchedDateRef`, falls dieses Ref bereits vor dem eigentlichen Fetch auf `targetDate` gesetzt wird. Scheitert der Fetch anschließend, kann ein weiterer Versuch für dasselbe `targetDate` bis zu einem Remount oder Parameterwechsel ausbleiben.

Risiko:
- Ein temporär fehlendes `birthData` verzögert den Call nur.
- Ein fehlgeschlagener Fetch kann dagegen für denselben Tag effektiv „festklemmen“, wenn `lastFetchedDateRef` den Retry unterdrückt.

### Beobachtung 3: Cache maskiert Backend-Probleme

Es gibt Tages-Cache (`localStorage`) im Daily-Flow. Bei veralteten/fehlerhaften Cache-Inhalten wird kein frischer Call gemacht.

Risiko:
- „Platzhaltertexte“ wirken persistent, obwohl Backend inzwischen korrekt liefert.

### Beobachtung 4: Mehrere Datenquellen für „tägliche“ Inhalte

Parallele Hooks/Flows:
- `useFirstRunDaily()` (`/api/experience/daily`)
- `useActiveImpacts()` (`/api/impact/active`)
- `useDailyTransit()` (`/api/calculate/western`)

Risiko:
- Inkonsistente States im selben Render-Zyklus (z. B. Kohärenz vorhanden, Impuls nicht vorhanden).
- Nutzer interpretiert das als „Bug im Tageshoroskop“, obwohl Quelle B ok und Quelle A fallback ist.

---

## 3) Mögliche Überlagerungen alter Features / Garbage Code

1. **Legacy-Schutzpfade in Signatur-Bereich**
   - `SignaturRenderer` enthält mehrere deprecated Props und Fallback-Logik.
   - Auch wenn V1/V2/V3 entfernt wurden, deutet die API/Form auf Altlast-Kompatibilität hin.

2. **Doppelte Zuständigkeit für „aktive Einflüsse“**
   - Historisch wurden active planets teils API-basiert, teils clientseitig aus `birthSign` abgeleitet.
   - Der Kommentarstand zeigt Migrationen; solche Zwischenzustände erzeugen leicht Ghost-UI/uneinheitliche Daten.

3. **Fallback-First statt Error-First bei Daily**
   - Lokaler Fallback ersetzt echte Fehler fast vollständig.
   - Das schützt UX, erschwert aber Debugging und kann lange „Pseudo-Daten“ konservieren.

---

## 4) Refactoring-/Cleanup-Vorschlag (robust & nachvollziehbar)

## Zielbild
Ein **einziger orchestrierter Daily-Read-Model-Flow** für Dashboard/Signatur-nahe Tagesdaten:
- orchestriert: `daily + impact + transit`
- einheitlicher Status: `fresh | stale-cache | fallback | error`
- einheitlicher status: `fresh | stale-cache | fallback | error`
- zentrale telemetry/debug IDs

## Konkreter Plan

1. **Neuen Aggregator-Hook einführen**
   - `useDailyExperienceBundle()`
   - kapselt intern die drei Calls (`/experience/daily`, `/impact/active`, `/calculate/western`) plus Cache.
   - liefert ein gemeinsames Objekt mit klaren Source-Flags pro Feld.

2. **Fallback sichtbar machen (nicht still substituieren)**
   - In `useFirstRunDaily`/Nachfolger ein Feld `source: 'api' | 'cache' | 'fallback'` zurückgeben.
   - UI zeigt bei fallback eine dezente „Daten aktuell nicht live“-Hinweiszeile.

3. **Hard-Guard für Pflichtdaten + diagnostisches Logging**
   - Wenn `birthData` fehlt: `status = missing_profile_input` statt still nichts tun.
   - Dev-Log mit korreliertem Request-Tag (`dailyReqId`).

4. **Cache-Invalidierung vereinheitlichen**
   - Alle daily-relevanten Caches (daily/impact/transit) mit gemeinsamer Tages-Key-Strategie und versioniertem Prefix.
   - Bei Schema-Änderung durch Version-Bump harte Entwertung.

5. **Altlasten im SignaturRenderer abbauen**
   - deprecated Props in 1-2 Releases entfernen.
   - striktere Prop-Typen (`required` wo nötig) und klare „no silent fallback“-Pfadtrennung.

6. **Contract-Tests erweitern**
   - E2E-Testfall „Daily endpoint 500 → UI zeigt fallback-banner + telemetry event“.
   - Testfall „birthData missing → kein API-Call + sichtbarer Status“.
   - Testfall „cache stale → refetch wird garantiert ausgelöst“.

---

## 5) Kritische Selbstprüfung der Analyse

Mögliche blinde Flecken:
1. **Backend liefert tatsächlich Platzhalter**
   - Dann ist Frontend korrekt und Problem liegt in Prompt/Template-Fallback serverseitig.

2. **Locale-Mismatch**
   - `locale` (`de-DE`) wird übergeben; Backend könnte bei unbekannter Locale auf generische Texte fallen.

3. **Auth-Race beim initialen Mount**
   - `authedFetch` könnte kurzzeitig ohne gültiges Token laufen und Fehler triggern; danach bleibt fallback im Cache.

4. **Schema-Parsing rejectet valide, aber erweiterte Response**
   - `DailyResponseSchema.parse()` wirft Exception -> Fallback greift, obwohl Nutzdaten da wären.

5. **Feature-Flag/Konditionslogik**
   - Tagesimpuls wird nur gerendert, wenn `impulsText.trim().length > 0`; fehlende Feldzuweisung kann wie Platzhalterfehler aussehen.

---

## 6) Besserer Weg zur Fehleraufdeckung (operativ)

Empfohlene Debug-Strategie in 3 Schritten:

1. **Network Truth herstellen**
   - In DevTools je Session exakt protokollieren:
     - ob `POST /api/experience/daily` feuert,
     - Payload (`birth`, `target_date`, `locale`, `soulprint_sectors`),
     - Response-Felder `fusion.synthesis`, `fusion.summary`, `meta.engine_version`.

2. **UI-State parallel loggen**
   - Einmalige Debug-Ausgabe im Hook:
     - Quelle (`api/cache/fallback`),
     - Grund für Fallback (HTTP, Parse, Auth, Missing Input),
     - cache hit/miss.

3. **Gezielte Fault Injection**
   - Daily-Endpoint absichtlich 500 simulieren, dann Auth-401, dann Schema-Drift.
   - Erwartete UI-Reaktion festschreiben und testen.

Damit wird schnell unterscheidbar, ob der „Platzhalter“-Effekt aus
- echten Backend-Texten,
- lokalem Fallback,
- oder Render-/State-Verkettung entsteht.

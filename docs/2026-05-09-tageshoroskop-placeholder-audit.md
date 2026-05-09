# Tageshoroskop / Onboarding Placeholder & BAFE-Wiring Audit

**Datum:** 2026-05-09
**Auditor:** Claude (auf Basis der BAFE API Reference vom 2026-05-08, abgelegt im Waitinglist-Repo unter `2-design/external-context/bafe-api-reference.md`)
**Auftrag:** 100%-korrekte Verdrahtung mit FuFirE/BAFE für Geburtstagsberechnung (Datum, Zeit, Ort) → echte Sun/Moon/Asc/BaZi-Animal/Day-Master/WuXing-Dominant. Anti-Placeholder-Sweep: keine Defaults, keine generischen Texte, keine stillen Fallbacks. Jeder Fehler muss mit Error-Code sichtbar werden.

**Status:** Audit unvollständig — siehe "Noch nicht auditiert" am Ende. Keine Code-Änderungen vorgenommen. Nur Befundbericht.

---

## CRITICAL Findings

### CRIT-1: Default-Placeholder im BirthForm-State

**Datei:** `src/components/BirthForm.tsx`

**Zeilen:** 69, 70, 72

```
69:  const [date, setDate] = useState("1990-01-01");
70:  const [time, setTime] = useState("12:00");
72:  const [coordinates, setCoordinates] = useState("52.520000, 13.405000");
```

**Problem:** Wenn der User das Datum/Zeit/Ort-Eingabefeld nicht aktiv ändert, werden Default-Werte (Berlin, 1. Januar 1990, 12:00 Uhr) an BAFE gesendet. Dies ist genau der Placeholder-Modus, der laut User-Vorgabe niemals existieren darf.

**Fix:** Initialisieren mit `""` (oder `null` wo TypeScript es zulässt). Required-Validation muss feuern, wenn das Feld leer ist. Submit-Button bleibt disabled, solange ein Pflichtfeld leer ist. Niemals plausible Default-Werte als initial state.

**Severity:** CRITICAL — direkte Anti-Placeholder-Verletzung.

---

### CRIT-2: Datum-Eingabe-Format YYYY-MM-DD statt DD-MM-YYYY mit hart eingebauten Bindestrichen

**Datei:** `src/components/BirthForm.tsx`

**Zeile:** 258-265

```
<input
  type="date"
  required
  max={today}
  value={date}
  onChange={(e) => { setDate(e.target.value); setErrors((e2) => ({ ...e2, date: "" })); }}
  className={errors.date ? inputErrorCls : inputCls}
/>
```

**Problem:** Native HTML5 `<input type="date">` rendert das Datum browser-locale-abhängig (in Chrome/Safari oft DD/MM/YYYY auf DE-Locale, MM/DD/YYYY auf en-US-Locale, YYYY-MM-DD im Wertfeld). Der interne `value` ist immer ISO `YYYY-MM-DD`. Der User möchte ein hart eingebautes DD-MM-YYYY-Format mit fest gerenderten "-" Separatoren — ein masked text input, kein native date picker.

**Fix:** Ersetzen durch maskiertes Text-Eingabefeld:
- Zeichenmaske: `DD-MM-YYYY` (z.B. via `react-text-mask`, `cleave.js`, oder selbstgeschriebenem `onChange`-Handler).
- "-" Zeichen sind visuell **fest gerendert** und vom Cursor übersprungen.
- Validation parst DD-MM-YYYY zurück nach ISO `YYYY-MM-DD` für die BAFE-Anfrage (BAFE erwartet ISO im `date` Feld per BAFE API Reference, Sektion 1.6).

**Severity:** CRITICAL — Format-Verletzung der User-Vorgabe.

---

### CRIT-3: Zeit-Eingabe nutzt native `<input type="time">`

**Datei:** `src/components/BirthForm.tsx`

**Zeile:** 288-296

```
<input
  type="time"
  required={!timeUnknown}
  disabled={timeUnknown}
  value={time}
  onChange={(e) => setTime(e.target.value)}
  className={`${inputCls} disabled:opacity-40 disabled:cursor-not-allowed`}
/>
```

**Problem:** Native HTML5 `<input type="time">`. Auf den meisten Browsern rendert dies HH:MM mit ":" als Trenner — aber der konkrete Render ist locale- und browser-spezifisch (manche zeigen 12-Stunden-Format mit AM/PM). User möchte einen hart eingebauten ":" Separator wie beim Datum — also auch hier maskiertes Text-Feld.

**Fix:** Ersetzen durch maskiertes Text-Eingabefeld `HH:MM` mit fest gerendertem ":" Trenner. 24-Stunden-Format hard-coded. Cursor springt über den ":". Bei `timeUnknown` Checkbox: Feld leeren und disablen, NIE auf "12:00" defaulten (Anti-Placeholder).

**Severity:** CRITICAL — Format-Verletzung; auch CRIT-1 verwandt (Default "12:00" beim Submit-ohne-Eingabe).

---

### CRIT-4: BAFE-Ziel-URL ist Railway, nicht Fly.io

**Dateien:**

- `.env.example:5` — `VITE_BAFE_BASE_URL="https://bafe-production.up.railway.app"`
- `server.mjs:401-403`, `1507-1508`, `1858-1859` — Fallback `https://bafe-production.up.railway.app`
- `server.mjs:298` (CSP) — Whitelist enthält **beide**: `https://bafe-production.up.railway.app` UND `https://bafe.vercel.app`
- `vite.config.ts:22, 28` — Vite-Proxy-Default `https://bafe-production.up.railway.app`

**Problem:** Laut der vom User gelieferten BAFE API Reference (`2-design/external-context/bafe-api-reference.md` im Waitinglist-Repo, Stand 2026-05-08):

| Komponente | Production | Fallback |
|---|---|---|
| Web App (`bazodiac.space`) + Mobile | **`https://bafe-2u0e2a.fly.dev`** (Fly.io) | – |
| Signatur-App (legacy) | `https://bafe-production.up.railway.app` (Railway) | – |

Astro-Noctum ist die **Web-App** (per CLAUDE.md). Die korrekte Production-URL für Astro-Noctum ist **Fly.io**, nicht Railway. Aktuell zielen aber alle Defaults auf Railway. Das bedeutet entweder:

- (a) Astro-Noctum spricht versehentlich die Signatur-App-Fallback-URL an, wenn keine env override gesetzt ist;
- (b) Diese Konfiguration ist historisch und Railway hat tatsächlich noch funktionierende Endpunkte, die der eigentlichen Production-Engine auf Fly.io entsprechen — in dem Fall lebt das System auf einer "veralteten Quelle der Wahrheit".

In beiden Fällen verstößt das gegen die User-Vorgabe "100%ig korrekte Verdrahtung mit der FuFirE API".

**Fix:**

1. Entscheiden: Fly.io oder Railway als Production-Ziel? (Diese Frage ist auch im Waitinglist-Plan unter `TASK-resolve-fufire-url-ambiguity` getrackt — Antwort von `STK-upstream-provider-maintainers` einholen.)
2. `VITE_BAFE_BASE_URL` Default und alle drei `server.mjs`-Fallbacks aktualisieren.
3. CSP-Whitelist auf den **einen** korrekten Host reduzieren (Wildcard ist verboten per BAFE API Reference Sektion 6).
4. Production-Smoke-Test: `GET ${BAFE_BASE_URL}/health` muss 200 + Engine-Version liefern.

**Severity:** CRITICAL — falsche Verdrahtung mit Production-API.

---

### CRIT-5: `/chart` Endpoint existiert vermutlich nicht auf der Live-BAFE-Engine

**Dateien:**

- `src/services/api.ts:538` — `calculateAll()` POST `${BASE_URL}/chart` → `/api/chart`
- `server.mjs:690-691` — `app.post("/api/chart", ..., proxyToBafeWithFallback(bafeFallbackUrls("/chart"), ...))`
- `server.mjs:894-911` — internal helper that POSTs `${BAFE_BASE_URL}/chart`
- `server.mjs:2272` — `experience/bootstrap` ruft `${BAFE_BASE_URL}/chart` als Fallback
- `server.mjs:2749` — `experience/daily` ruft `${BAFE_BASE_URL}/chart` als Fallback

**Problem:** Die BAFE API Reference (`bafe-2u0e2a.fly.dev`-Snapshot vom 2026-05-08) listet **alle** vorhandenen Endpoints in Sektion 1:

- 1.1 Info/Health: `/health`, `/ready`, `/build`, `/`, `/api`, `/info/wuxing-mapping`
- 1.2 BaZi: `/bazi`, `/v1/bazi`
- 1.3 Western: `/western`, `/v1/western`
- 1.4 Fusion: `/fusion`, `/v1/fusion`
- 1.5 Transit: `/transit/now`, `/transit/timeline`, `/transit/state`, `/transit/narrative` (jeweils auch unter `/v1/`)
- 1.6 Experience: `/experience/bootstrap`, `/experience/signature-delta`, `/experience/daily` (jeweils auch unter `/v1/`)
- 1.7 Impact: `/impact/...`
- 1.8 Validation: `/validate`
- 1.9 Superglue: `/api/calculate/{endpoint}`, `/v1/calculate/{endpoint}` (Proxy für `bazi/western/wuxing/fusion/tst`)

**`/chart` ist NICHT in der Liste.** Die Astro-Noctum-Codebase sendet aber alle Onboarding-Berechnungen an `/chart`. Das Astro-Noctum CLAUDE.md behauptet zwar `"routes at /calculate/{...} and /chart"` — das ist konsistent mit der Railway-Engine, aber widersprüchlich zur Fly.io-Engine.

Mögliche Erklärungen:

- Die alte Vercel-/Railway-BAFE-Version hatte `/chart` als atomaren "alle-in-einem"-Endpoint (BaZi + Western + Fusion + Wu-Xing in einem Call); diese wurde in der Fly.io-Engine durch `/v1/fusion` (oder das Experience-Layer) ersetzt.
- Der Code wartet auf eine Migration, die noch nicht stattgefunden hat.

**Fix:**

1. Verifizieren: ruft `curl -s ${BAFE_BASE_URL}/chart` einen sinnvollen Body, oder 404? Wenn 404, ist die Production-Engine nicht erreichbar.
2. Wenn `/chart` weg ist: `calculateAll()` migrieren auf entweder `/v1/fusion` (atomar BaZi + Western + Wu-Xing in einem Call) oder `/v1/experience/bootstrap` (komplettes Profil mit Soulprint).
3. Schema-Mapping in `mapChartToApiResults` (api.ts:406-519) muss neu geschrieben werden gegen den `/v1/fusion`- oder `/v1/experience/bootstrap`-Response-Shape, dokumentiert in BAFE API Reference Sektion 1.4 / 1.6.

**Severity:** CRITICAL — Onboarding könnte aktuell nur funktionieren, weil Railway-Legacy weiterläuft, nicht weil es korrekt auf die dokumentierte Production-Engine zielt.

---

### CRIT-6: Stilles Fallback auf leere Daten bei API-Fehler

**Datei:** `src/services/api.ts:24-37, 558`

**Beleg:** CLAUDE.md (Astro-Noctum, Architecture-Sektion):

> "Each endpoint has independent fallback to empty data on failure."
> "BAFE API cannot always be reached from local/CI environments (`ENETUNREACH`). The app is designed to degrade gracefully — failed endpoints return empty data and the Dashboard shows '—'."

Plus `api.ts:558` returnt `{...mapped, issues: []}` — die `issues: ApiIssue[]`-Schnittstelle (Zeilen 24-27) wird nie befüllt. Bei einem fehlschlagenden Endpoint hat das UI keine Möglichkeit, den Fehler zu erkennen — es sieht nur "leer aussehende" Daten.

**Problem:** Das ist genau die "silent fallback / generic placeholder"-Antwort, die der User explizit verboten hat. Statt "—" muss eine sichtbare Fehlermeldung erscheinen mit Code (z.B. `FUFIRE_UNAVAILABLE`, `CHART_ENDPOINT_404`) und kurzer Erklärung.

**Fix:**

1. `calculateAll()` muss auf API-Fehler **werfen** (ApiError mit code+status), nicht stumm leere Daten zurückgeben.
2. Dashboard-Component muss den geworfenen Fehler abfangen und ein **Error-Card** rendern: "Couldn't reach the chart engine — code: `FUFIRE_UNAVAILABLE`. The team has been notified. Try again in a moment." (Sprache DE+EN per i18n.)
3. `issues: ApiIssue[]` entweder ausbauen zur partial-success-Anzeige (wenn 4 von 5 Endpoints OK sind, zeige die 4 + Banner für den 5.) oder löschen.
4. Niemals "—" als Wert für ein leeres Feld rendern, wenn ein API-Aufruf fehlgeschlagen ist — immer expliziter Error-State.

**Severity:** CRITICAL — direkte Anti-Placeholder-Verletzung.

---

### CRIT-7: Hardcoded German Fallback Text in Gemini-Interpretation

**Datei:** `src/services/gemini.ts` (nicht direkt gelesen — Befund aus Astro-Noctum CLAUDE.md)

**Beleg:** CLAUDE.md:

> "`src/services/gemini.ts` | Gemini Flash integration for horoscope text generation (model: `gemini-3-flash-preview`, 15s timeout)"
> "Gemini API: Text generation via `@google/genai` SDK. Falls back to hardcoded German text if API unavailable."

**Problem:** "Hardcoded German fallback text" ist exakt das, was der User verboten hat: "KEINE generieschen Texte, die keinen Ursprung in echten userdaten oder events haben". Wenn Gemini ausfällt, soll der User eine Fehlermeldung sehen, keine generische Aphorismen-Schablone.

**Fix:**

1. Fallback-Text-Block in `gemini.ts` löschen.
2. Bei API-Fehler: ApiError mit code `GEMINI_UNAVAILABLE` werfen.
3. UI rendert: "AI interpretation is currently unavailable (code: GEMINI_UNAVAILABLE). Please retry in a moment."
4. Optional: Retry-Button im UI.

**Severity:** CRITICAL — direkte Anti-Placeholder-Verletzung.

---

## IMPORTANT Findings

### IMP-1: `issues: ApiIssue[]` ist Dead Code

**Datei:** `src/services/api.ts:24-37, 558`

```
24:  export interface ApiIssue {
25:    endpoint: "bazi" | "western" | "fusion" | "wuxing" | "tst";
26:    message: string;
27:  }
...
35:    issues: ApiIssue[];
...
558:  return { ...mapped, issues: [] };
```

**Problem:** Das Feld wird typisiert, aber nie befüllt. Vermutlich Überbleibsel einer früheren partial-success-Logik, die mit der `/chart`-Migration verloren ging.

**Fix:** Im Zuge von CRIT-6 entweder reaktivieren (jeden Sub-Mapping-Fehler in `mapChartToApiResults` als Issue erfassen) oder löschen.

---

### IMP-2: BAFE-Response-Mapping mit vielen Legacy-Fallbacks

**Datei:** `src/services/api.ts:108-141, 406-519`

`signFromBody` (Zeile 108-118) probiert 6 verschiedene Keys (`sign_index`, `sign_name`, `zodiac_sign`, `sign`, `longitude_deg`, `longitude`). `resolveDominantElement` (Zeile 125-141) probiert 3 Keys (`dominant_element`, `dominant_bazi`, `dominant_planet`). Pillar-Mapping (Zeile 263-268, 420-425) akzeptiert deutsch UND englisch.

**Problem:** Defensive Programmierung gegen einen instabilen Upstream — verständlich, aber jeder Fallback-Pfad birgt Risiko, dass falsche Werte still gerendert werden, wenn das Upstream-Schema sich erneut ändert. Beispiel: BAFE ändert `wu_xing_vector` auf `wuxing_vector` (ohne Underscore) → fällt durch alle Fallbacks und liefert `0` für alle Elemente, ohne dass der User es merkt.

**Fix:**

1. Strict-Mode gegen die in der BAFE API Reference dokumentierte aktuelle Schema-Form. Legacy-Pfade entfernen.
2. Wenn ein Pflichtfeld fehlt (z.B. `wuxing.from_planets`), throw ApiError mit code `BAFE_SCHEMA_MISMATCH`.
3. Logging des unbekannten Schemas in einen Sentry-Channel oder Server-Log, damit Schema-Drift schnell sichtbar wird.

---

### IMP-3: Coordinate-Placeholder-Text auf manuellem Coords-Feld

**Datei:** `src/components/BirthForm.tsx:447`

```
<input
  type="text"
  value={coordinates}
  ...
  placeholder="52.520000, 13.405000"
/>
```

**Problem:** Der HTML-`placeholder`-Text suggeriert konkrete Berlin-Koordinaten. Auch wenn das nur ein visueller Hint ist (nicht der tatsächliche `value`), kombiniert mit CRIT-1 (`coordinates`-State defaulted auf dieselben Berlin-Koordinaten) ist das doppelt unsauber.

**Fix:** Generischen Format-Hint verwenden, z.B. `"latitude, longitude"` oder `"e.g. 52.5200, 13.4050"`. Plus CRIT-1 fixen.

---

## Audit-Erweiterung 2026-05-09 (Welle 1 + 2 — Display, Wiring, Onboarding-Alt-Form, Mobile, Debug-Doc-Cross-Check)

Drei zusätzliche Audit-Pässe hinter dem initialen Bericht, dispatched als Sub-Agents. Konsolidierte Befunde unten — File:Line-Präzision durchweg verifiziert. Severity-Codes nutzen Bereichs-Suffixe (DSP=Display, WIR=Wiring, ONB=Onboarding, MOB=Mobile) zur Klar-Trennung von den initialen CRIT-1..7.

### Display-Side (Welle 1)

**CRIT-DSP-1: Synthetic Soulprint-Fallback ohne UI-Awareness** — `src/components/Dashboard.tsx:281-285`. `effectiveSoulprint` ersetzt fehlendes `astro_profiles.soulprint_sectors` stumm durch `syntheticSoulprintFromSign(zodiac_sign)` — jeder Widder-User bekommt denselben "Soulprint". Der `isFallback`-Indicator (Z. 389) feuert nur für tagesabhängiges payload, nicht für synthetischen Soulprint. **Fix:** Throw `SOULPRINT_MISSING`, render `coherence-unavailable`-Branch (Z. 280-299 von DailyChartHero existiert bereits) bis Backfill durch.

**CRIT-DSP-2: Empty-String-Fallbacks für Natal-Daten an alle Display-Widgets** — `Dashboard.tsx:419-422, 432-436, 507-509`. `apiData?.western?.zodiac_sign || ''`, `apiData?.bazi?.zodiac_sign || ''`, `apiData?.wuxing?.dominant_element || ''` etc. propagieren `""` an `NatalSignaturStatic`, `AgentSection`, `ShareCard`. Jede BAFE-Mapping-Failure (api.ts liefert `undefined` aus `signFromBody`-Chain) wird zu leerem Chip ohne Error. **Fix:** Bei `null/undefined` jeweils Error-Card mit Code (`BIRTHDATA_INCOMPLETE`, `BAFE_WESTERN_UNAVAILABLE`).

**CRIT-DSP-3: Coherence Ring zeigt rohe `0` bei missing data** — `dashboard/DailyChartHero.tsx:238-240`. `displayedCoherence ?? (baseCoherence ?? 0)` und `delta = positiveDailyDelta ?? 0` — partial-null-Fall (one of two missing) führt zu silently `delta=0` statt `IMPACT_DELTA_UNAVAILABLE`. "Today +0" subtitle (Z. 191-192, 351-352) ist generisch. **Fix:** Explizites Null-Handling, dashed delta-arc + Error-Subtext.

**CRIT-DSP-4: BaZi-Pillar-Placeholder "—" und leere Strings** — `BaZiFourPillars.tsx:118-123, 142, 147`. `{pillar.stem || "—"}` und `{pillar.branch || ""}`. Plus `{t("dashboard.bazi.birthTimeNotProvided")}` — User sieht "—" identisch ob (a) keine Geburtszeit angegeben (legitim) oder (b) BAFE bazi-endpoint failed (silent). **Fix:** Branch nach Cause: `BAZI_UNAVAILABLE` vs `BAZI_PILLAR_INCOMPLETE`. `|| "—"` raus.

**IMP-DSP-1**: `BaZiInterpretation.tsx:26` — `if (!interpretation) return null` versteckt Component bei missing animal/element. **Fix:** Render `BAZI_INTERPRETATION_UNAVAILABLE`.

**IMP-DSP-2**: `BirthChartOrrery.tsx:169` — defaulted auf `CITIES[0]` (Berlin) statt expliziten observerLat/Lon. NYC-User sieht Berlin-Himmel.

**IMP-DSP-3**: `BirthChartOrrery.tsx:54-57` — `ZODIAC_NAMES_DE` hardcoded für alle Locales (Z. 1109 rendert DE-Namen auch bei `lang === 'en'`).

**MIN-DSP-1**: `BirthChartOrrery.tsx:1115-1129` — WebGL-Fail-Fallback ohne Error-Code.

### BAFE-Wiring + Fallbacks (Welle 1)

**CRIT-WIR-1: `gemini.ts:43-47` confirmed** — Hardcoded German + EN "Cosmic Profile"-Fallback wenn Gemini fehlt. `console.warn` swallow Z. 38. Direkter Anti-Placeholder-Verstoß. **Fix:** Throw `INTERPRETATION_UNAVAILABLE` mit originating error class; UI rendert Error-Card.

**CRIT-WIR-2: `useFirstRunDaily.ts:77-110, 211-217` — `buildFallbackDaily()`** synthesiert deterministisches Fake-Tageshoroskop aus Date-Hash auf jeden Error. `engine_version: 'v1-local-fallback'`-Tag wird nur als low-contrast (opacity 0.4) "↻ Heute nicht verfügbar — generischer Inhalt" gerendert — User sieht Fake-Content fast unmerkbar. **Fix:** Upstream HTTP status (502, timeout) als `DAILY_UNAVAILABLE`/`DAILY_TIMEOUT` surfaces; harter Error-Tile mit Retry; `buildFallbackDaily` löschen oder auf empty-shape + Banner reduzieren.

**CRIT-WIR-3: `server.mjs:1771-1825, 2876-2886` — `buildDailyFallbackPayload`** liefert HTTP 200 mit hardcodiertem German prose ("Heute entsteht Zug in deinem Alltag…") wenn Gemini-Text leer/unparseable. Cache-Poisoning-Guard auf Z. 2905 ist einzige Sicherheit. **Fix:** HTTP 502 `{error: 'GEMINI_PARSE_FAILED', upstream_status}`; nie canned prose als AI-generiert servieren.

**CRIT-WIR-4: `server.mjs:2723-2725, 2891-2893` — `harmony_index = 0.45`-Magic-Number** wenn BAFE-Feld fehlt. Treibt komplette Coherence-Ring + driver-strip + day_mode-Klassifikation downstream. **Fix:** Throw `HARMONY_INDEX_MISSING` 502.

**CRIT-WIR-5: `experience.ts:13, 31, 64`** — Throws plain `Error("Bootstrap failed: 502")` ohne Code/Upstream-Metadata/RequestID. Caller `useFirstRunDaily.ts:209-218` fängt alles und fallt zu canned content. Partial-success-cases nicht unterscheidbar. **Fix:** `class ExperienceApiError extends Error { code, status, requestId }` mit 429→`RATE_LIMITED`, ZodError→`SCHEMA_MISMATCH`.

**CRIT-WIR-6: `server.mjs:2749-2759` confirmed — `/chart` ist Legacy** + `bafeRes.ok ? await bafeRes.json() : {}` (Z. 2776-ish). Empty-Object-Fallback füttert Gemini-Prompt mit `{}` → halluzinierter Content, 0 Error-Surface. Bootstrap (Z. 2272) gleiche Path-Bug. **Fix:** `/v1/fusion` oder `/v1/experience/bootstrap`; bei 404 → `BAFE_ENDPOINT_MISSING`. Nie `{}` substituieren.

**CRIT-WIR-7: `server.mjs:482-486 — `bafeDirectHeaders`** setzt `X-API-Key` nur bei vorhandenem env, validiert nichts gegen `^ff_pro_`-Tier, captures keine `X-Request-ID`. **Fix:** Boot-Validation `BAFE_API_KEY ~ /^ff_pro_/`; capture + log `X-Request-ID` jedes Response, forward als Header.

**IMP-WIR-1**: `server.mjs:400-405` — Default URL `bafe-production.up.railway.app` (per CLAUDE.md sogar `bafe.vercel.app` — beide falsch). Reference: `bafe-2u0e2a.fly.dev`.

**IMP-WIR-2**: `server.mjs:1535-1546` `/api/transit-state` — `?? 0.35`, `?? sectors`, `?? []` Multi-Key-Schema-Fallbacks verstecken Drift.

**IMP-WIR-3**: `server.mjs:2421-2425` `/signature-delta` — `signature_blueprint || { seed: "delta_fallback", visual: 0.5-allover }`. **Fix:** Require + 400 if missing.

**IMP-WIR-4**: `server.mjs:2356-2360` `/bootstrap` — `bafeData.western?.zodiac_sign || "Unknown"` etc + `harmony_index || 0.8` shipped. **Fix:** Throw 502 wenn missing.

**IMP-WIR-5**: `server.mjs:2876-2886` — empty Gemini → fallback (CRIT-WIR-3 Detail).

**IMP-WIR-6**: Onboarding partial-success — bootstrap OK + daily fail → ring real, content fake; user denkt beide echt.

**MIN-WIR-1**: `console.warn` als Telemetrie überall — keine structured logs, keine request correlation.

**MIN-WIR-2**: `server.mjs:1542` — 30-day avg fallback equals current soulprint → delta = 0 by construction.

### Onboarding-Alt-Form + Geocoding (Welle 2)

**CRIT-ONB-1: `EncounterBirthForm.tsx:19-23`** — selbe Defaults wie BirthForm: `'1990-01-01'`, `'12:00'`, `'Europe/Berlin'`. `canSubmit` prüft nur `coords && date`, nicht "User-hat-Werte-berührt". `progress`-Memo erkennt's, blockt Submit aber nicht. **Fix:** `''`-Init; `canSubmit` mit `date !== '' && time !== '' && coords`.

**CRIT-ONB-2: `EncounterBirthForm.tsx:78-83`** — `<input type="date">` (native picker, ISO-value, locale-abhängiges Display). User will DD-MM-YYYY mit hart eingebauten "-". **Fix:** `cleave.js`-style masked input.

**CRIT-ONB-3: `EncounterBirthForm.tsx:90-96`** — `<input type="time">` (native, locale-abhängig 12h/24h). User will HH:MM mit hart eingebautem ":". **Fix:** masked input `99:99`, 24h hart codiert.

**CRIT-ONB-4: `LocationMap.tsx:60-62`** — `defaultCenter = [52.52, 13.405]` Berlin wenn ohne `center`-Prop gemounted. User klickt → Berlin-nahe Coords ohne aktive Wahl an BAFE. **Fix:** Welt-Zoom 2 starten oder Click vor erstem Zoom blocken.

**CRIT-ONB-5: `PlaceAutocomplete.tsx:64-68`** — Nominatim-Catch-Block schluckt Fehler stumm (`setSuggestions([])`); User sieht "kein Treffer" statt "API down". **Fix:** Error-State-Banner `NOMINATIM_UNAVAILABLE`.

**CRIT-ONB-6: `LocationMap.tsx:24-26`** — Reverse-Geocode-Fail → `null` ohne Code. Map-Click setzt Coords ohne Place-Name. **Fix:** `{ name: null, error: 'NOMINATIM_REVERSE_FAIL' }`, UI render-Hinweis.

**CRIT-ONB-7: `services/timezone.ts:11, 19, 24-26`** — Drei Failure-Klassen (no-API-key, status≠OK, network-throw) kollabieren auf identisches `null`. `EncounterBirthForm.tsx:40-41` `if (detected) setTz(detected)` → bei `null` bleibt Default `Europe/Berlin`. `.env.example:16` zeigt `VITE_GOOGLE_PLACES_API_KEY=""` — also returnt `fetchTimezone` in dev/staging vermutlich **immer** null → tz **immer** Berlin-Default. **Fix:** Throw mit `TZ_NO_API_KEY`, `TZ_STATUS_<X>`, `TZ_NETWORK_FAIL`. Submit blocken bis tz aufgelöst.

**IMP-ONB-1**: `EncounterBirthForm.tsx:50, 70` — `canSubmit` prüft `coords` aber nicht `placeName`. **Fix:** `&& placeName !== ''`.

**IMP-ONB-2**: `services/nominatim.ts` vs `PlaceAutocomplete.tsx`-internal `search` — zwei divergente Suchimplementierungen (length<3 vs <2, addressdetails 0 vs 1). **Fix:** Konsolidieren.

**MIN-ONB-1**: `LocationMap.tsx:66` — `zoom: center ? 10 : 6` — zoom 6 ist nicht weltweit sondern Mittel-Europa.

### Mobile (Welle 2)

**CRIT-MOB-1: `apps/mobile/src/screens/OnboardingScreen.tsx:117-124`** — schlimmster Fund. Defaults: `"1990-01-01"`, `"12:00"`, `placeName=""`, `lat="52.520000"`, `lon="13.405000"`, `tz="Europe/Berlin"`. User drückt Submit ohne irgendetwas zu ändern → vollständige Berlin-1990-Daten an BAFE. `submit()` (Z. 166-235) hat keine "values-touched"-Prüfung. **Fix:** Alle States `""`-init, `MISSING_FIELD_<name>`-Codes.

**CRIT-MOB-2: `OnboardingScreen.tsx:97-99, 293-302`** — Format ist YYYY-MM-DD (ISO) + Label sagt "JJJJ-MM-TT". Free-text `TextInput` ohne Maske. **Fix:** `react-native-masked-text` `99-99-9999` mit hart-"-".

**CRIT-MOB-3: `OnboardingScreen.tsx:101-103, 305-314`** — Free-text Time mit Regex `/^\d{2}:\d{2}$/` Validation; ":" nicht hart eingebaut. **Fix:** masked `99:99`.

**CRIT-MOB-4: `OnboardingScreen.tsx:205`** — `const normalizedTime = timeUnknown ? "12:00" : time` — beim "Uhrzeit unbekannt"-Klick wird stumm "12:00" an BAFE gesendet. Direkter Placeholder-Verstoß. **Fix:** BAFE-Bootstrap-API mit `time_unknown`-Flag aufrufen; nicht Mid-Day-Fake.

**CRIT-MOB-5: `OnboardingScreen.tsx:150-158`** — `timeapi.io`-Failure → tz bleibt auf `"Europe/Berlin"` ohne sichtbaren Error. Kommentar "user can edit manually" ist stille Annahme. **Fix:** Throw `TZ_RESOLVE_FAIL`, Banner, Submit blocken.

**CRIT-MOB-6: `OnboardingScreen.tsx:140-144, 159-161`** — Place-Lookup-Network-Fail in outer-catch → generisches "Suche fehlgeschlagen" mit `err.message`, kein Code. User unterscheidet nicht 429 vs 5xx vs Parse-Fail. **Fix:** Structured `{code: NOMINATIM_<x>, status, message}`.

**CRIT-MOB-7: `OnboardingScreen.tsx:334`** — `placeholder="Berlin, Deutschland"`. Suggestiver Placeholder mit konkretem Ortsnamen. **Fix:** Generischer `"z.B. Stadt, Land"` oder leer.

**IMP-MOB-1**: `OnboardingScreen.tsx:351-371` — Lat/Lon als manuell editierbare Free-Text-Inputs. Inkonsistenz: Web hat keine sichtbaren, Mobile zeigt sie offen. User kann inkonsistente lat/lon vs placeName eingeben.

**IMP-MOB-2**: `OnboardingScreen.tsx:128-164` — kein Live-Autocomplete-Dropdown wie Web; nur "Lookup"-Button mit `limit=1`. **Fix:** FlatList mit Nominatim-Live-Suggestions, debounced.

**IMP-MOB-3**: Kein Map-Picker auf Mobile (Web hat `LocationMap.tsx`).

**MIN-MOB-1: `OnboardingScreen.tsx:215-217`** — Hardcoded German fallback in submit (`"Dein kosmisches Profil wurde berechnet…"`). Selbe CRIT-7-Verletzung im Mobile-Pfad. **Fix:** Throw `GEMINI_UNAVAILABLE`.

### Debug-Doc-Cross-Check (2026-05-01)

**Identified 2026-05-01:** (a) `useFirstRunDaily()` setzt bei jedem Fehler stumm `buildFallbackDaily()`; (b) `lastFetchedDateRef` kann Retry für denselben Tag dauerhaft blockieren; (c) localStorage-Cache maskiert Backend-Probleme; (d) drei parallele Hooks (`useFirstRunDaily`, `useActiveImpacts`, `useDailyTransit`) erzeugen inkonsistente Render-States; (e) deprecated `SignaturRenderer`-Props, doppelte active-planets-Logik, fallback-first-Pattern.

**Fixed since:** HOTFIX-B (`785589f`) — `experience/daily` weigert Server-Side-Fallback-Payloads zu cachen (Beobachtung c partial). TASK-D2 (`cc3d48e`) — sichtbarer Fallback-Indikator auf DailyChartHero (Beobachtung a UI-seitig). TASK-D4 (`469fe8d`), TASK-4.1/4.2 (`f4d38da`/`d9f85a9`), HOTFIX-A (`40d3901`) — verwandte Doku/3D-Fixes.

**Still open:** Beobachtung a (per UI-Indicator gemildert, nicht per Aggregator-Hook), b (`lastFetchedDateRef`-Retry-Lock — kein Commit), d (Multi-Source-Inkonsistenz, kein `useDailyExperienceBundle()`-Aggregator), Garbage Code (deprecated SignaturRenderer-Props, doppelte active-planets-Logik), Locale-Mismatch, Auth-Race, Schema-Parsing-Reject — alle aus "kritische Selbstprüfung" weiter unverifiziert.

**Root-Cause-Hypothese:** Fallback-First-Pattern statt Error-First — exakt das, was die Welle-1-Findings CRIT-WIR-1..7 + CRIT-DSP-1..4 belegen.

### Bezug zum Astro-Noctum CLAUDE.md

CLAUDE.md selbst dokumentiert die Anti-Pattern explizit unter "Known Issues":

> "BAFE API cannot always be reached from local/CI environments. The app is designed to degrade gracefully — failed endpoints return empty data and the Dashboard shows '—'."

Plus Default `bafe.vercel.app` (CLAUDE.md) vs `bafe-production.up.railway.app` (`.env.example`/`server.mjs`) vs `bafe-2u0e2a.fly.dev` (User-Reference) — drei verschiedene "Wahrheiten". CLAUDE.md ist out-of-sync mit Code.

---

## Konsolidiertes Befund-Cluster

Die ~25 CRIT-Findings clustern thematisch:

**Cluster A — Default-Placeholder-State (hartcodiert in `useState`)**: BirthForm, EncounterBirthForm, OnboardingScreen, LocationMap. Alle Felder müssen leer initialisieren + Submit-Block bis User-Eingabe.

**Cluster B — Format-Verletzungen (Date/Time-Inputs)**: Web 2× (BirthForm, EncounterBirthForm) + Mobile 1× (OnboardingScreen). Native HTML5 + Free-Text statt masked DD-MM-YYYY/HH:MM.

**Cluster C — BAFE-URL + Endpoint-Verdrahtung**: `.env.example`, `server.mjs`, `vite.config.ts` zeigen alle auf Railway statt Fly.io. `/chart`-Endpoint inexistent. CLAUDE.md selbst out-of-sync.

**Cluster D — Silent Fallbacks (Hardcoded Defaults statt Errors)**: `gemini.ts`, `useFirstRunDaily`, `server.mjs:buildDailyFallbackPayload`, `harmony_index = 0.45`, bootstrap "Unknown"-strings, `signature-delta` blueprint default, `transit-state ?? 0.35`, `timezone.ts` returns null silently, Nominatim catch-block silent, `LocationMap` reverse-geocode silent.

**Cluster E — Display-Side `|| ''` und `?? 0`**: Dashboard, DailyChartHero, BaZiFourPillars, BaZiInterpretation, BirthChartOrrery — Default-leer-Strings statt Error-Codes.

**Cluster F — Synthetic Soulprint bei NULL DB**: Dashboard `syntheticSoulprintFromSign` plus die 8 deliberately-preserved-all-zero-rows aus dem 2026-04-19-Backfill (laut CLAUDE.md).

**Cluster G — Error-Envelope fehlt**: `experience.ts`-plain-Errors, console.warn statt structured logging, kein `X-Request-ID`-Capture/-Forward.

---

## Empfohlener Sprint-Plan

| Sprint | Cluster | Priorität | Files | Begründung |
|---|---|---|---|---|
| **S-1: BAFE-URL + Endpoint-Migration** | C | P0 (Blocker) | `.env.example`, `server.mjs`, `vite.config.ts`, `services/api.ts`, `services/experience.ts`, CLAUDE.md | Bevor andere Wiring-Fixes Sinn machen, müssen URL + `/chart` → `/v1/fusion`/`/v1/experience/*` migriert sein. |
| **S-2: Birthform-Inputs (Web+Mobile parity)** | A + B | P1 | `BirthForm.tsx`, `EncounterBirthForm.tsx`, `OnboardingScreen.tsx` (mobile), `LocationMap.tsx` | DD-MM-YYYY + HH:MM masked inputs, kein Default-State. User-explizit gefordert. |
| **S-3: Fail-Loud Backend** | D + G | P1 | `gemini.ts`, `useFirstRunDaily.ts`, `server.mjs` (buildDailyFallbackPayload, harmony_index, bootstrap, signature-delta, transit-state), `experience.ts`, `timezone.ts`, `nominatim.ts`, `PlaceAutocomplete.tsx` | Alle silent fallbacks → Error-Codes. ApiError-Class einführen. structured logging. |
| **S-4: Fail-Loud Frontend + Synthetic-Soulprint-Closure** | E + F | P1 (nach S-3) | `Dashboard.tsx`, `DailyChartHero.tsx`, `BaZiFourPillars.tsx`, `BaZiInterpretation.tsx`, `BirthChartOrrery.tsx` | Display rendert Error-Cards bei Code, nie `|| ''` / `?? 0`. Synthetic-Soulprint raus. |
| **S-5: Mobile-Parity-Catchup** | A/B/D auf Mobile | P2 | `apps/mobile/src/screens/OnboardingScreen.tsx`, mobile experience-lib | Mobile spiegelt Web-Anti-Patterns 1:1. Nach Web-Fix die gleichen Patterns übertragen. |
| **S-6: Open-Loop-Threads aus 2026-05-01** | various | P2 | `useFirstRunDaily.ts`, `useActiveImpacts`, `useDailyTransit`, deprecated `SignaturRenderer` | Aggregator-Hook `useDailyExperienceBundle()`, Retry-Lock-Fix, Garbage-Code-Removal. |

Empfehlung: S-1 → S-3 → S-2 → S-4 → S-5 → S-6. (S-1 muss zuerst weil ohne BAFE-Endpoint-Wahrheit alle anderen Wiring-Fixes raten.) S-2 nach S-3, weil Birthform-Submit-Blocker auf Error-Envelope ankommt. S-4 nach S-3 weil Display-side Codes erst surfacen kann was Backend wirklich wirft.

Pro Sprint: dedizierter Implementation-Plan in `docs/plans/`, ausgeführt via Subagent-Driven-Development. Test-Suite-Baseline pro Sprint absichern.

---

## Noch nicht auditiert (next session)

Diese Dateien gehören zur Onboarding/Display-Pipeline, wurden aber im aktuellen Audit-Pass aus Zeit/Kontextgründen nicht im Detail gelesen:

Mit der Welle-1+2-Erweiterung (siehe oben) ist der Großteil abgedeckt. Verbleibend offen:

| Datei | Erwartete Befundklasse |
|---|---|
| `src/hooks/useFirstRunDaily.ts` | Voll-Lese — CRIT-WIR-2 dokumentiert nur die `buildFallbackDaily`-Stelle; das `lastFetchedDateRef`-Retry-Lock aus 2026-05-01 ist nicht verifiziert |
| `src/__tests__/birthform-validation.test.tsx`, `EncounterBirthForm.test.tsx`, `nominatim.test.ts`, `experience-daily-v2.test.ts`, `contract-experience.test.ts`, `daily-chart-hero.impuls.test.tsx`, `onboarding-experience.test.ts` | Test-Coverage gegen Anti-Placeholder-Anforderungen — decken die Tests die geforderten Error-Codes + Format-Validierungen ab? |
| `apps/mobile/src/lib/reading.ts` + `apps/mobile/src/lib/profile.ts` | Mobile BAFE-Wiring analog zu `src/services/api.ts` — vermutlich gleiche Endpoint-/Mapping-Probleme |
| `apps/mobile/src/components/SignaturCanvas.tsx` | Mobile-Signatur — fallback-render? |
| `packages/shared/src/quizzes/scoring.ts` + `signatur/bazodiac-engine.ts` | Shared-Math: defaults bei missing inputs? |
| `src/components/onboarding/SignatureReveal.tsx` | Reveal-Phase nach Bootstrap — render-side Placeholders? |
| `src/components/dashboard/DayModeModal.tsx` + `DashboardInterpretationSection` (referenced) | Day-Pulse-Modal + Interpretation-Section — mögliche Display-Side-Placeholders |
| `src/services/api.ts` `signFromBody`-Chain | Bereits oberflächlich gegrep't, aber die 6-Key-Fallback-Kette (CRIT-IMP-2 in Welle 0) braucht Strict-Mode-Reduction-Plan |

---

## Empfohlenes nächstes Vorgehen

1. **CRIT-4 + CRIT-5 zuerst klären:** ist `/chart` auf `bafe-2u0e2a.fly.dev` erreichbar oder 404? Welche Production-URL ist die Wahrheit? Diese Frage blockiert alle anderen Wiring-Fixes.
2. **CRIT-1, CRIT-2, CRIT-3 gemeinsam fixen:** Birthform-Eingabefelder neu mit masked text inputs, kein Default-State, harte Format-Erzwingung.
3. **CRIT-6 + CRIT-7 als Single Sprint:** Fail-loud-Pattern überall einführen — keine stillen Fallbacks, keine generischen Texte.
4. **Vollständigen Audit fortsetzen:** Restliche Dateien aus "Noch nicht auditiert" lesen und Findings in dieses Dokument anhängen.

Vorschlag: Pro CRIT eine separate Plan-Datei in `docs/plans/`, dann Subagent-Driven-Development pro Plan. Anti-Placeholder-Audit ist groß genug für 3-4 separate PRs.

---

## Anhang: Was wurde in diesem Audit-Pass gelesen

**Welle 0 (orchestrator-direkt):**
- `src/components/BirthForm.tsx` (498 Zeilen, vollständig)
- `src/services/api.ts` (560 Zeilen, vollständig)
- `server.mjs` (gegrep't auf BAFE-URL- und Endpoint-Pfade — Zeilen 81, 298, 401-403, 479, 677, 690-691, 894-911, 1507-1508, 1858-1859, 2230, 2272, 2388, 2497, 2568, 2714, 2749, 4569-4588, 4620, 5060)
- `vite.config.ts` (Proxy-Sektion, Zeilen 18-72)
- `.env.example` (BAFE-Sektion, Zeilen 4-44)
- `CLAUDE.md` (Astro-Noctum, vollständig — als Architektur-Referenz)

**Welle 1 (Display + Wiring sub-agent):**
- `src/components/Dashboard.tsx` (vollständig)
- `src/components/dashboard/DailyChartHero.tsx` (vollständig)
- `src/components/BaZiFourPillars.tsx` (vollständig)
- `src/components/BaZiInterpretation.tsx` (vollständig)
- `src/components/BirthChartOrrery.tsx` (1229 Zeilen, fokussiert auf Fallback/Placeholder-Regionen)
- `src/services/experience.ts` (vollständig)
- `src/services/gemini.ts` (vollständig)
- `server.mjs` Zeilen 2200-2900 (Experience-API-Proxy + Helpers — vollständig)
- Auxiliary: `src/hooks/useFirstRunDaily.ts`, `src/lib/authedFetch.ts`, `server.mjs:1771-1825 (buildDailyFallbackPayload)`, `server.mjs:480-486 (bafeDirectHeaders)`, `server.mjs:1535-1546 (transit-state schema fallbacks)`

**Welle 2 (Onboarding + Mobile + Debug-Doc sub-agent):**
- `src/components/onboarding/EncounterBirthForm.tsx` (118 Zeilen, vollständig)
- `src/components/PlaceAutocomplete.tsx` (134 Zeilen, vollständig)
- `src/components/LocationMap.tsx` (141 Zeilen, vollständig)
- `src/services/nominatim.ts` (28 Zeilen, vollständig)
- `src/services/timezone.ts` (28 Zeilen, vollständig)
- `apps/mobile/src/screens/OnboardingScreen.tsx` (602 Zeilen, vollständig)
- `apps/mobile/src/lib/experience.ts` (40 Zeilen, vollständig)
- `apps/mobile/src/screens/DashboardScreen.tsx` (gegrep't auf Default-State-Patterns — sauber)
- `docs/tageshoroskop-signatur-debug-analyse-2026-05-01.md` (227 Zeilen, vollständig — als Cross-Reference)

Die BAFE API Reference (Snapshot vom 2026-05-08) wurde als externe Wahrheit-Quelle herangezogen. Sie liegt im Waitinglist-Repo unter `2-design/external-context/bafe-api-reference.md`.

**Total Findings:** ~25 CRIT + ~15 IMP + ~5 MIN über Welle 0+1+2 zusammen.

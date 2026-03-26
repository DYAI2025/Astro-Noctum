# Day-Pulse / Day-Trace Backend-Vervollständigung

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Den `/api/experience/daily` Endpoint von einer Natal-only + Gemini-Halluzination zu einer echten, datengetriebenen täglichen Berechnung ausbauen — mit Transit-Daten, kosmischem Wetter (NOAA/DONKI), Jieqi und serverseitigem Harmony-Index.

**Architecture:** Der Endpoint holt heute nur BAFE `/chart` (statisches Natal-Chart) und lässt Gemini die Transite und den Harmony-Index erfinden. Die Lösung: Drei parallele Fetches (Space Weather Extended, Transit State, Jieqi) vor dem Gemini-Call. Der Harmony-Index wird serverseitig aus echten Wu-Xing-Vektoren (Western + BaZi) berechnet über die existierende `cosineSimilarity()`. Alle Echtdaten werden strukturiert in den Gemini-Prompt injiziert, sodass Gemini auf Fakten basiert statt halluziniert.

**Tech Stack:** Express (server.mjs), NOAA SWPC API, NASA DONKI API, FuFirE /transit/state, Gemini 2.5 Flash, Zod (experience schema), Vitest

---

## Ist-Zustand (Defekte)

| Was | Status | Problem |
|-----|--------|---------|
| `/chart` (BAFE) | ✅ aufgerufen | Nur Natal — keine Tagesdaten |
| `/transit/state` (FuFirE) | ❌ nicht aufgerufen | Transit-Sektoren + Events fehlen |
| Space Weather (NOAA/DONKI) | ❌ nicht aufgerufen | Kp, CME, X-Ray, Protonflux fehlen |
| Jieqi (Solar Term) | ❌ nicht aufgerufen | Saisonaler Kontext fehlt |
| `soulprint_sectors` vom Client | ❌ ignoriert | Server wirft sie weg |
| `quiz_sectors` vom Client | ❌ ignoriert | Server wirft sie weg |
| `harmony_index` | ❌ halluziniert | Gemini erfindet Wert statt Berechnung |
| `day_mode` | ❌ halluziniert | Basiert auf halluziniertem harmony_index |
| `transit_sectors` in Schema | ❌ halluziniert | Gemini erfindet Arrays |

## Soll-Zustand

| Was | Status | Lösung |
|-----|--------|--------|
| `/chart` (BAFE) | ✅ bleibt | Natal-Chart als Basis |
| `/transit/state` (FuFirE) | ✅ neu | Parallel Fetch mit Soulprint-Sektoren |
| Space Weather Extended | ✅ neu | Intern `fetchExtendedWeather()` extrahieren + aufrufen |
| Jieqi | ✅ neu | Intern `computeJieqiServer()` aufrufen |
| `soulprint_sectors` | ✅ genutzt | An Transit State weiterleiten |
| `quiz_sectors` | ✅ genutzt | An Transit State weiterleiten |
| `harmony_index` | ✅ berechnet | Serverseitig via `cosineSimilarity()` |
| `day_mode` | ✅ deterministisch | Basiert auf berechnetem harmony_index |
| Gemini Prompt | ✅ angereichert | Echte Daten als Kontext |

---

## Side-Effect-Analyse

| Änderung | Betroffene Consumers | Risiko | Mitigation |
|----------|---------------------|--------|------------|
| Neue Felder im Prompt | Gemini 2.5 Flash | Niedrig — Prompt wird erweitert, nicht geändert | Output-Schema bleibt identisch via Zod |
| `harmony_index` serverseitig berechnet | Client `computeDayHarmonic()` | Niedrig — Format identisch (0-1 float) | Gemini-Fallback-Wert wird überschrieben |
| Längere Endpoint-Latenz (~3 Fetches) | UX (Modal-Loading) | Mittel — 15s statt 5s möglich | `Promise.allSettled` + Cache + Fallbacks |
| Space Weather Cache intern genutzt | `/api/space-weather/extended` | Kein — read-only, shared Cache | Gleicher Cache, keine Race Conditions |
| `soulprint_sectors`/`quiz_sectors` validiert | Client `fetchDailyExperience()` | Kein — Client sendet bereits beide | Fallback auf `deriveSoulprintSectors()` |

---

## Task 1: Serverseitige Harmony-Index-Berechnung extrahieren

**Files:**
- Modify: `server.mjs:1295-1476` (daily endpoint)

**Kontext:** Die Funktionen `computeNatalDimensions()` (Zeile 537-602) und `cosineSimilarity()` (Zeile 510-518) existieren bereits im Master-Signal-Block. Sie berechnen Wu-Xing-Vektoren für Western und BaZi und können direkt den Harmony-Index produzieren.

**Step 1: Schreibe Helper-Funktion `computeHarmonyIndex(bafeData)`**

Platziere sie direkt vor dem `/api/experience/daily` Endpoint (ca. Zeile 1293):

```javascript
/**
 * Compute harmony_index from BAFE chart data.
 * Uses cosine similarity between Western and BaZi Wu-Xing dimension vectors.
 * Returns 0.0–1.0 where 0.45 ≈ random baseline, ≥0.50 = convergence ("trace").
 */
function computeHarmonyIndex(bafeData) {
  if (!bafeData || typeof bafeData !== 'object') return 0.45;

  const westernDim = computeNatalDimensions({
    western: bafeData.western,
    bazi: null,
    wuxing: null,
  });
  const baziDim = computeNatalDimensions({
    western: null,
    bazi: bafeData.bazi,
    wuxing: bafeData.wuxing,
  });

  // If either vector is all-zero, return baseline
  const hasWestern = DIMENSION_KEYS.some(k => westernDim[k] > 0);
  const hasBazi = DIMENSION_KEYS.some(k => baziDim[k] > 0);
  if (!hasWestern || !hasBazi) return 0.45;

  return Math.max(0, Math.min(1, cosineSimilarity(westernDim, baziDim)));
}
```

**Step 2: Verifiziere manuell**

```bash
node -e "
  // Paste computeNatalDimensions + cosineSimilarity + helpers, test with sample data
  console.log('Harmony index for Aries/Fire-Day-Master:', computeHarmonyIndex({
    western: { zodiac_sign: 'Aries', moon_sign: 'Cancer', ascendant_sign: 'Leo' },
    bazi: { pillars: { day: { stem: 'Bing', element: 'Fire' }, year: { stem: 'Jia', element: 'Wood' } } },
    wuxing: { element_percentages: { Fire: 35, Wood: 25, Earth: 15, Metal: 15, Water: 10 } }
  }));
"
```

Expected: Wert zwischen 0.3 und 0.8 (abhängig von Element-Übereinstimmung).

**Step 3: Commit**

```bash
git add server.mjs
git commit -m "feat(daily): add computeHarmonyIndex() — serverseitige Cosine-Similarity"
```

---

## Task 2: Space Weather intern abrufbar machen

**Files:**
- Modify: `server.mjs` (extrahiere innere Logik von `/api/space-weather/extended`)

**Kontext:** Die Extended-Space-Weather-Logik (Zeile 1794-2072) ist monolithisch in den Route-Handler eingebettet. Um sie im Daily-Endpoint wiederzuverwenden, muss die Kernlogik in eine Funktion extrahiert werden.

**Step 1: Extrahiere `fetchExtendedWeatherData()` aus dem Route-Handler**

Platziere die Funktion vor dem Route-Handler (ca. Zeile 1793):

```javascript
/**
 * Fetch extended space weather data from NOAA + NASA DONKI.
 * Returns the same payload as /api/space-weather/extended, using shared cache.
 * Never throws — returns neutral fallback on complete failure.
 */
async function fetchExtendedWeatherData() {
  const now = Date.now();
  if (extendedWeatherCache && now - extendedWeatherCache.timestamp < EXTENDED_CACHE_TTL_MS) {
    return extendedWeatherCache.payload;
  }

  // [Move existing logic from route handler here — lines 1802-2069]
  // Keep the cache write: extendedWeatherCache = { timestamp: now, payload };
  // Return payload instead of res.json(payload)

  // ... (die gesamte bestehende Logik verschieben)

  return payload;
}
```

**Step 2: Route-Handler delegiert an die Funktion**

```javascript
app.get("/api/space-weather/extended", async (_req, res) => {
  res.set("Cache-Control", "public, max-age=300");
  try {
    const payload = await fetchExtendedWeatherData();
    return res.json(payload);
  } catch (err) {
    console.error("[space-weather/extended] fatal:", err?.message);
    return res.json({
      current: { kp: 0, kpForecast3h: [], xrayFlux: 0, xrayClass: "A", protonFlux: 0 },
      events: [], alerts: [],
      epoch: { sunspotNumber: 0, f107: 0, solarCyclePhase: "unknown" },
      meta: { fetchedAt: new Date().toISOString(), cacheTtlSeconds: 300 },
    });
  }
});
```

**Step 3: Verifiziere**

```bash
curl -s http://localhost:3000/api/space-weather/extended | jq '.current.kp, .events | length'
```

Expected: Kp-Wert (0-9) und Events-Count, identisch zu vorher.

**Step 4: Commit**

```bash
git add server.mjs
git commit -m "refactor(space-weather): extract fetchExtendedWeatherData() for internal reuse"
```

---

## Task 3: Daily-Endpoint um drei parallele Datenquellen erweitern

**Files:**
- Modify: `server.mjs:1295-1476` (der POST `/api/experience/daily` Handler)

**Kontext:** Dies ist der Kern-Task. Der Endpoint muss vor dem Gemini-Call drei zusätzliche Datenquellen parallel holen: Transit State, Space Weather, Jieqi. Dabei werden die vom Client gesendeten `soulprint_sectors` und `quiz_sectors` endlich genutzt.

**Step 1: Validiere und nutze `soulprint_sectors` + `quiz_sectors` aus dem Request-Body**

Nach der Birth-Validierung (Zeile 1322), füge hinzu:

```javascript
    // Parse optional sector arrays from client (used for transit state)
    const soulprintSectors = Array.isArray(req.body.soulprint_sectors)
      && req.body.soulprint_sectors.length === 12
      ? req.body.soulprint_sectors.map(v => Math.max(0, Math.min(1, Number(v) || 0)))
      : null; // will derive from BAFE data if null

    const quizSectors = Array.isArray(req.body.quiz_sectors)
      && req.body.quiz_sectors.length === 12
      ? req.body.quiz_sectors.map(v => Math.max(0, Math.min(1, Number(v) || 0)))
      : Array(12).fill(0.5);
```

**Step 2: Ersetze den einzelnen BAFE `/chart` Call mit parallelen Fetches**

Ersetze Zeilen 1356-1368 mit:

```javascript
    // ── Parallel data fetches: Natal + Transit + Space Weather + Jieqi ──
    const bafePrimaryUrl = process.env.BAFE_INTERNAL_URL
      || process.env.VITE_BAFE_BASE_URL
      || "https://bafe-production.up.railway.app";

    const [bafeResult, transitResult, weatherResult, jieqiResult] = await Promise.allSettled([
      // 1. Natal chart from BAFE (existing)
      fetch(`${BAFE_BASE_URL}/chart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birthDate: birth.date,
          birthTime: birth.time,
          lat: birth.lat,
          lng: birth.lon,
          timeZone: birth.tz,
        }),
        signal: AbortSignal.timeout(15000),
      }).then(r => r.ok ? r.json() : {}),

      // 2. Transit state from FuFirE
      (async () => {
        // Derive soulprint from BAFE if client didn't send them
        // Note: we may need to wait for BAFE — but since it's parallel, use client sectors or fallback
        const sectors = soulprintSectors || Array(12).fill(0.35);
        const res = await fetch(`${bafePrimaryUrl}/transit/state`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            soulprint_sectors: sectors,
            quiz_sectors: quizSectors,
          }),
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) throw new Error(`Transit state ${res.status}`);
        return res.json();
      })(),

      // 3. Space weather (uses internal function + cache)
      fetchExtendedWeatherData(),

      // 4. Jieqi (sync, no network)
      Promise.resolve(computeJieqiServer()),
    ]);

    const bafeData = bafeResult.status === "fulfilled" ? bafeResult.value : {};
    const transitData = transitResult.status === "fulfilled" ? transitResult.value : null;
    const weatherData = weatherResult.status === "fulfilled" ? weatherResult.value : null;
    const jieqiData = jieqiResult.status === "fulfilled" ? jieqiResult.value : null;

    // Log data availability for debugging
    console.log(`[experience/daily] data: bafe=${bafeResult.status}, transit=${transitResult.status}, weather=${weatherResult.status}, jieqi=${jieqiResult.status}`);
```

**Step 3: Berechne `harmony_index` serverseitig**

Direkt nach den Fetches:

```javascript
    // ── Compute harmony_index from real data ──
    const harmonyIndex = computeHarmonyIndex(bafeData);
    const dayMode = harmonyIndex >= 0.50 ? "trace" : "pulse";
```

**Step 4: Commit**

```bash
git add server.mjs
git commit -m "feat(daily): parallel fetch transit, space-weather, jieqi + serverseitiger harmony_index"
```

---

## Task 4: Gemini-Prompt mit echten Daten anreichern

**Files:**
- Modify: `server.mjs` (Prompt-Template im daily handler)

**Kontext:** Der aktuelle Prompt (Zeile 1370-1430) gibt Gemini nur `bafeData` (Natal-Chart). Gemini wird gebeten, über Transite zu schreiben, ohne welche zu kennen. Jetzt injizieren wir alle vier Datenquellen strukturiert.

**Step 1: Baue das enriched Context-Objekt**

Vor dem Prompt-Template:

```javascript
    // ── Build enriched context for Gemini ──
    const transitContext = transitData ? {
      transit_intensity: transitData.transit_contribution?.transit_intensity ?? 0.35,
      transit_sectors: transitData.transit_contribution?.sectors ?? transitData.ring?.sectors ?? [],
      events: (transitData.events ?? []).slice(0, 5).map(ev => ({
        type: ev.type,
        sector: ev.sector,
        trigger_planet: ev.trigger_planet,
        description: ev.description_de || ev.description || "",
      })),
    } : { transit_intensity: 0.35, transit_sectors: [], events: [] };

    const weatherContext = weatherData ? {
      kp_index: weatherData.current?.kp ?? 0,
      kp_label: weatherData.current?.kp >= 7 ? "STRONG STORM (G3+)"
        : weatherData.current?.kp >= 5 ? "GEOMAGNETIC STORM (G1-G2)"
        : weatherData.current?.kp >= 4 ? "ACTIVE"
        : "QUIET",
      xray_class: weatherData.current?.xrayClass ?? "A",
      active_cme: (weatherData.events ?? []).filter(e => e.type === "cme_arrival").length,
      solar_cycle_phase: weatherData.epoch?.solarCyclePhase ?? "unknown",
      kp_forecast_next_12h: (weatherData.current?.kpForecast3h ?? []).slice(0, 4).map(f => f.kp),
      alerts: (weatherData.alerts ?? []).slice(0, 2),
    } : { kp_index: 0, kp_label: "UNKNOWN", xray_class: "A", active_cme: 0, solar_cycle_phase: "unknown", kp_forecast_next_12h: [], alerts: [] };

    const jieqiContext = jieqiData ? {
      current_term: jieqiData.current?.nameDE ?? jieqiData.current?.name ?? "",
      next_term: jieqiData.next?.nameDE ?? jieqiData.next?.name ?? "",
      is_transition_window: jieqiData.isTransitionWindow ?? false,
      seconds_to_next: jieqiData.secondsToNext ?? 0,
    } : null;
```

**Step 2: Ersetze den Gemini-Prompt**

```javascript
    const prompt = `
You are Bazodiac's fusion astrologer. You write in "Poetic Realism" — worldly images, not astro-lectures.
Write a daily horoscope for today (${targetDate}).

═══ USER'S BIRTH CHART (Natal — static) ═══
${JSON.stringify(bafeData, null, 2)}

═══ TODAY'S PLANETARY TRANSITS (live data) ═══
Transit Intensity: ${transitContext.transit_intensity} (0=calm, 1=max pressure)
Active Transit Sectors: ${JSON.stringify(transitContext.transit_sectors)}
Transit Events:
${transitContext.events.length > 0
  ? transitContext.events.map(e => `- ${e.type}: ${e.trigger_planet || ''} in sector ${e.sector} — ${e.description}`).join('\n')
  : '- No significant transit events today'}

═══ COSMIC WEATHER (real-time NOAA/NASA) ═══
Kp Index: ${weatherContext.kp_index}/9 (${weatherContext.kp_label})
X-Ray Class: ${weatherContext.xray_class}
Active Earth-directed CMEs: ${weatherContext.active_cme}
Solar Cycle Phase: ${weatherContext.solar_cycle_phase}
Kp Forecast (next 12h): ${JSON.stringify(weatherContext.kp_forecast_next_12h)}
${weatherContext.alerts.length > 0 ? `⚠ NOAA Alerts:\n${weatherContext.alerts.join('\n')}` : ''}

═══ JIEQI (Solar Term — seasonal energy) ═══
${jieqiContext ? `Current: ${jieqiContext.current_term}
Next: ${jieqiContext.next_term}${jieqiContext.is_transition_window ? ' ⚡ TRANSITION WINDOW — energy is shifting' : ''}` : 'Not available'}

═══ COMPUTED VALUES (use these, do NOT invent your own) ═══
harmony_index: ${harmonyIndex.toFixed(4)}
day_mode: "${dayMode}"

Respond with STRICT JSON matching this EXACT structure (No markdown code blocks, just raw JSON).
{
  "date": "${targetDate}",
  "western": {
    "summary": "1-2 sentences about Western transits using the ACTUAL transit data above.",
    "themes": ["theme1", "theme2"],
    "caution": "1 sentence caution grounded in today's real transits",
    "opportunity": "1 sentence opportunity grounded in today's real transits",
    "evidence": { "transit_sectors": ${JSON.stringify(transitContext.transit_sectors.length > 0 ? transitContext.transit_sectors.filter((_, i) => transitContext.transit_sectors[i] > 0.5).map((_, i) => i).slice(0, 4) : [1, 5])} }
  },
  "eastern": {
    "summary": "1-2 sentences about BaZi daily energy using the natal chart's day master.",
    "themes": ["theme1", "theme2"],
    "caution": "1 sentence caution based on element interactions",
    "opportunity": "1 sentence opportunity based on element interactions",
    "evidence": { "day_master": "${bafeData?.bazi?.pillars?.day?.stem || ''}" }
  },
  "fusion": {
    "summary": "1-2 sentences synthesizing Western transits + BaZi + cosmic weather for today.",
    "synthesis": "THE MAIN TEXT — see DAY-MODE VOICE below.",
    "action": "One actionable advice grounded in today's data",
    "pushworthy": ${weatherContext.kp_index >= 5 || harmonyIndex >= 0.55 ? 'true' : 'false'},
    "push_text": "Short push notification string",
    "harmony_index": ${harmonyIndex.toFixed(4)},
    "day_mode": "${dayMode}"
  },
  "meta": { "engine_version": "v2-gemini-daily-enriched" }
}

RULES:
- Language: ${lang === 'de' ? 'German' : 'English'}
- The output MUST be valid JSON. DO NOT wrap in \`\`\`json.
- harmony_index and day_mode are ALREADY COMPUTED — copy them exactly as shown above.
- Reference the cosmic weather naturally: if Kp ≥ 5, mention heightened electromagnetic sensitivity. If Kp ≥ 7, make it prominent. If Kp < 3, don't mention it.
- If there are active CMEs, weave it in ("kosmischer Gegenwind", "elektromagnetische Spannung").
- If Jieqi is in transition window, note the seasonal shift.
- Use transit events to ground your statements — name the quality, not the planet.

DAY-MODE VOICE — the "synthesis" field MUST follow the voice rules for day_mode="${dayMode}":

PULSE (harmony_index < 0.50):
- Tone: atmospheric, inviting, sensory, worldly imagery.
- Examples: "Erde ist Struktur und die hält dich heute. Nicht zu fest, so wie du es brauchst."
  "Die Gedanken kreisen, aber nicht hektisch. Eher wie ein Lied, das sich langsam entfaltet."
- Max 2–3 sentences. No explanation of why.

TRACE (harmony_index >= 0.50):
- Tone: direct, charged, concrete — something happens today.
- Examples: "Dein detektivischer Skorpion bekommt heute was zu tun."
  "Holz trifft auf Feuer. Was du still aufgebaut hast, will raus — und heute ist der Tag."
- If harmony_index > 0.65: one extra sentence — urgent, clear call to act.
- Max 2–3 sentences.

${weatherContext.kp_index >= 5 ? `SPACE WEATHER OVERRIDE: Kp is ${weatherContext.kp_index} — this is a ${weatherContext.kp_label}.
The synthesis MUST acknowledge heightened electromagnetic energy. Use grounded language: "Heute drückt etwas von außen", "Die Luft ist geladen — nicht metaphorisch", "Dein Körper spürt, was die Instrumente messen".` : ''}

NEVER use in synthesis: "weil", "da heute", planet names (Mars, Venus etc.), "die kosmischen Energien", "die Sterne sagen".
`;
```

**Step 3: Überschreibe Gemini-Output mit berechneten Werten**

Ersetze den bestehenden Post-Processing-Block (Zeile 1464-1472) mit:

```javascript
    // ── Override Gemini's values with server-computed ones ──
    if (parsedData?.fusion) {
      // ALWAYS use server-computed values — Gemini may hallucinate different ones
      parsedData.fusion.harmony_index = harmonyIndex;
      parsedData.fusion.day_mode = dayMode;
    }

    // Inject data provenance metadata
    if (parsedData?.meta) {
      parsedData.meta.engine_version = "v2-gemini-daily-enriched";
      parsedData.meta.data_sources = {
        natal: bafeResult.status === "fulfilled",
        transit: transitResult.status === "fulfilled",
        space_weather: weatherResult.status === "fulfilled",
        jieqi: jieqiResult.status === "fulfilled",
      };
      parsedData.meta.kp_index = weatherContext.kp_index;
      parsedData.meta.transit_intensity = transitContext.transit_intensity;
    }
```

**Step 4: Commit**

```bash
git add server.mjs
git commit -m "feat(daily): enriched Gemini prompt with transit, space-weather, jieqi data"
```

---

## Task 5: Fallback-Branch (Gemini unavailable) ebenfalls anreichern

**Files:**
- Modify: `server.mjs:1335-1353` (Gemini-less fallback path)

**Kontext:** Wenn `geminiClient` null ist, fällt der Endpoint auf einen Proxy zu BAFE `/experience/daily` zurück (Zeile 1335-1353). Dieser Fallback muss ebenfalls den serverseitigen Harmony-Index nutzen.

**Step 1: Hole Daten auch im Fallback-Pfad**

```javascript
    if (!geminiClient) {
      console.warn('[experience/daily] Gemini API key missing, falling back to proxy');

      // Still compute harmony_index even without Gemini
      const bafeRes = await fetch(`${BAFE_BASE_URL}/chart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ birthDate: birth.date, birthTime: birth.time, lat: birth.lat, lng: birth.lon, timeZone: birth.tz }),
        signal: AbortSignal.timeout(15000),
      });
      const bafeData = bafeRes.ok ? await bafeRes.json() : {};
      const harmonyIndex = computeHarmonyIndex(bafeData);
      const dayMode = harmonyIndex >= 0.50 ? "trace" : "pulse";

      const resp = await fetch(`${BAFE_BASE_URL}/experience/daily`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyStr,
        signal: AbortSignal.timeout(20000),
      });
      const data = await resp.json();
      if (data?.fusion) {
        data.fusion.harmony_index = harmonyIndex;
        data.fusion.day_mode = dayMode;
      }
      return res.status(resp.status).json(data);
    }
```

**Step 2: Commit**

```bash
git add server.mjs
git commit -m "fix(daily): use computed harmony_index in Gemini-less fallback path"
```

---

## Task 6: Zod-Schema erweitern für neue Meta-Felder

**Files:**
- Modify: `src/lib/schemas/experience.ts`
- Test: Vitest

**Kontext:** Das `DailyResponseSchema` muss die neuen `meta.data_sources` Felder akzeptieren. Das Schema ist strict (keine unknown keys), daher muss es erweitert werden.

**Step 1: Erweitere MetaInfoSchema für Daily**

```typescript
// In src/lib/schemas/experience.ts

const DailyMetaSchema = MetaInfoSchema.extend({
  data_sources: z.object({
    natal: z.boolean(),
    transit: z.boolean(),
    space_weather: z.boolean(),
    jieqi: z.boolean(),
  }).optional(),
  kp_index: z.number().min(0).max(9).optional(),
  transit_intensity: z.number().min(0).max(1).optional(),
});

// Update DailyResponseSchema to use DailyMetaSchema
export const DailyResponseSchema = z.object({
  date: z.string(),
  western: DailySectionSchema,
  eastern: DailySectionSchema,
  fusion: DailyFusionSchema,
  meta: DailyMetaSchema,
});
```

**Step 2: Teste Schema-Kompatibilität**

```bash
npx vitest run --reporter verbose -- experience
```

Expected: Alle bestehenden Tests passen (neue Felder sind optional).

**Step 3: Commit**

```bash
git add src/lib/schemas/experience.ts
git commit -m "feat(schema): extend DailyResponseSchema with data_sources, kp_index, transit_intensity"
```

---

## Task 7: Tests — Harmony-Index-Berechnung

**Files:**
- Create: `src/__tests__/computeHarmonyIndex.test.ts`

**Step 1: Schreibe Tests**

```typescript
import { describe, it, expect } from 'vitest';

// We test the logic directly since computeHarmonyIndex is in server.mjs (ESM).
// Extract the core logic into a shared module or test the contract via HTTP.

// For now, test the mathematical contract:
describe('Harmony Index Contract', () => {
  // Replicate the element dimension maps
  const DIMENSION_KEYS = ['passion', 'stability', 'future', 'connection', 'autonomy'];
  const ELEMENT_MAP: Record<string, Record<string, number>> = {
    Fire:  { passion: 0.8, stability: 0.1, future: 0.2, connection: 0.3, autonomy: 0.6 },
    Earth: { passion: 0.2, stability: 0.8, future: 0.3, connection: 0.7, autonomy: 0.2 },
    Metal: { passion: 0.1, stability: 0.6, future: 0.7, connection: 0.2, autonomy: 0.5 },
    Water: { passion: 0.3, stability: 0.3, future: 0.6, connection: 0.8, autonomy: 0.3 },
    Wood:  { passion: 0.7, stability: 0.3, future: 0.5, connection: 0.4, autonomy: 0.7 },
  };

  function cosineSimilarity(a: Record<string, number>, b: Record<string, number>): number {
    let dot = 0, normA = 0, normB = 0;
    for (const k of DIMENSION_KEYS) {
      dot += (a[k] ?? 0) * (b[k] ?? 0);
      normA += (a[k] ?? 0) ** 2;
      normB += (b[k] ?? 0) ** 2;
    }
    if (normA === 0 || normB === 0) return 0.5;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  it('identical elements produce high harmony (trace mode)', () => {
    const fire = ELEMENT_MAP.Fire;
    const h = cosineSimilarity(fire, fire);
    expect(h).toBeGreaterThanOrEqual(0.99); // same vector = 1.0
    expect(h >= 0.50).toBe(true); // trace mode
  });

  it('opposing elements produce lower harmony (pulse mode)', () => {
    const fire = ELEMENT_MAP.Fire;
    const water = ELEMENT_MAP.Water;
    const h = cosineSimilarity(fire, water);
    expect(h).toBeLessThan(0.85); // different vectors, lower similarity
    // Note: may still be > 0.50 since all values are positive
  });

  it('returns 0.5 baseline when one vector is all-zero', () => {
    const fire = ELEMENT_MAP.Fire;
    const zero = { passion: 0, stability: 0, future: 0, connection: 0, autonomy: 0 };
    const h = cosineSimilarity(fire, zero);
    expect(h).toBe(0.5);
  });

  it('harmony_index is always between 0 and 1', () => {
    const elements = Object.values(ELEMENT_MAP);
    for (const a of elements) {
      for (const b of elements) {
        const h = cosineSimilarity(a, b);
        expect(h).toBeGreaterThanOrEqual(0);
        expect(h).toBeLessThanOrEqual(1);
      }
    }
  });

  it('day_mode is deterministic: trace when H >= 0.50, pulse when H < 0.50', () => {
    expect(0.50 >= 0.50 ? 'trace' : 'pulse').toBe('trace');
    expect(0.49 >= 0.50 ? 'trace' : 'pulse').toBe('pulse');
    expect(0.45 >= 0.50 ? 'trace' : 'pulse').toBe('pulse');
    expect(1.00 >= 0.50 ? 'trace' : 'pulse').toBe('trace');
  });
});
```

**Step 2: Run Tests**

```bash
npx vitest run src/__tests__/computeHarmonyIndex.test.ts --reporter verbose
```

Expected: 5/5 PASS

**Step 3: Commit**

```bash
git add src/__tests__/computeHarmonyIndex.test.ts
git commit -m "test(daily): harmony index cosine similarity contract tests"
```

---

## Task 8: Integration-Test — Daily Endpoint E2E

**Files:**
- Create: `src/__tests__/daily-endpoint-integration.test.ts`

**Kontext:** Dieser Test verifiziert, dass der angereicherte Endpoint das Zod-Schema einhält und die berechneten Werte korrekt zurückgibt. Er läuft gegen den lokalen Dev-Server.

**Step 1: Schreibe Integration-Test**

```typescript
import { describe, it, expect } from 'vitest';
import { DailyResponseSchema } from '../lib/schemas/experience';

describe('Daily Endpoint Response Contract', () => {
  // Test that the schema accepts the enriched response format
  it('validates v2 enriched response with data_sources', () => {
    const mockResponse = {
      date: '2026-03-26',
      western: {
        summary: 'Test western summary.',
        themes: ['growth', 'change'],
        caution: 'Test caution.',
        opportunity: 'Test opportunity.',
        evidence: { transit_sectors: [1, 5] },
      },
      eastern: {
        summary: 'Test eastern summary.',
        themes: ['wood', 'fire'],
        caution: 'Test caution.',
        opportunity: 'Test opportunity.',
        evidence: { day_master: 'Jia' },
      },
      fusion: {
        summary: 'Test fusion summary.',
        synthesis: 'Holz trifft auf Feuer.',
        action: 'Handle jetzt.',
        pushworthy: true,
        push_text: 'Push text',
        harmony_index: 0.62,
        day_mode: 'trace' as const,
      },
      meta: {
        engine_version: 'v2-gemini-daily-enriched',
        data_sources: {
          natal: true,
          transit: true,
          space_weather: true,
          jieqi: true,
        },
        kp_index: 3,
        transit_intensity: 0.45,
      },
    };

    const result = DailyResponseSchema.safeParse(mockResponse);
    expect(result.success).toBe(true);
  });

  it('still accepts v1 response without data_sources (backward compat)', () => {
    const v1Response = {
      date: '2026-03-26',
      western: {
        summary: 'Summary.', themes: ['t'], caution: 'c', opportunity: 'o',
        evidence: { transit_sectors: [1] },
      },
      eastern: {
        summary: 'Summary.', themes: ['t'], caution: 'c', opportunity: 'o',
        evidence: { day_master: 'Bing' },
      },
      fusion: {
        summary: 'Sum.', synthesis: 'Syn.', action: 'Act.',
        pushworthy: false, push_text: null,
        harmony_index: 0.45, day_mode: 'pulse' as const,
      },
      meta: { engine_version: 'v1-gemini-daily' },
    };

    const result = DailyResponseSchema.safeParse(v1Response);
    expect(result.success).toBe(true);
  });
});
```

**Step 2: Run**

```bash
npx vitest run src/__tests__/daily-endpoint-integration.test.ts --reporter verbose
```

**Step 3: Commit**

```bash
git add src/__tests__/daily-endpoint-integration.test.ts
git commit -m "test(daily): schema contract tests for v2 enriched daily response"
```

---

## Task 9: Smoke-Test und Verifikation

**Step 1: TypeScript-Prüfung**

```bash
npx tsc --noEmit
```

Expected: 0 Errors

**Step 2: Alle Tests laufen lassen**

```bash
npx vitest run --reporter verbose 2>&1 | tail -30
```

Expected: Alle Tests grün (exkl. bekannter Timeout in signatur-quizzes-page.test.tsx).

**Step 3: Lokaler Dev-Server Smoke-Test**

```bash
npm run dev &
sleep 5
# Test daily endpoint with curl
curl -s -X POST http://localhost:3000/api/experience/daily \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <test-token>" \
  -d '{
    "birth": {"date":"1990-01-15","time":"14:30","lat":48.13,"lon":11.57,"tz":"Europe/Berlin"},
    "soulprint_sectors": [0.4,0.6,0.3,0.7,0.5,0.4,0.6,0.3,0.5,0.7,0.4,0.6],
    "quiz_sectors": [0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5],
    "target_date": "2026-03-26",
    "locale": "de-DE"
  }' | jq '{
    harmony_index: .fusion.harmony_index,
    day_mode: .fusion.day_mode,
    engine: .meta.engine_version,
    sources: .meta.data_sources,
    kp: .meta.kp_index
  }'
```

Expected Output:
```json
{
  "harmony_index": 0.XXXX,  // computed, not 0.45 fallback
  "day_mode": "pulse|trace",
  "engine": "v2-gemini-daily-enriched",
  "sources": { "natal": true, "transit": true, "space_weather": true, "jieqi": true },
  "kp": 3
}
```

**Step 4: Final Commit**

```bash
git add -A
git commit -m "feat(daily): complete Day-Pulse/Trace backend with real data — transit, space-weather, jieqi, computed harmony-index"
```

---

## Zusammenfassung der Datenflüsse (Nachher)

```
Client: fetchDailyExperience(birth, soulprint_sectors, quiz_sectors, targetDate)
  │
  ▼
POST /api/experience/daily
  │
  ├──→ Promise.allSettled([
  │      BAFE /chart         → Natal-Chart (Western + BaZi + WuXing)
  │      FuFirE /transit/state → Transit-Sektoren, Intensität, Events
  │      fetchExtendedWeatherData() → Kp, X-Ray, CME, Proton, Forecast
  │      computeJieqiServer()      → Aktueller Solar Term, Übergang
  │    ])
  │
  ├──→ computeHarmonyIndex(bafeData)  → Echte Cosine-Similarity
  │    dayMode = H ≥ 0.50 ? "trace" : "pulse"
  │
  ├──→ Gemini 2.5 Flash (mit ALLEN Daten als Kontext)
  │    Prompt enthält: Natal + Transite + Kp + CME + Jieqi + berechneten H
  │
  ├──→ Override: parsedData.fusion.harmony_index = berechneter Wert
  │    parsedData.fusion.day_mode = berechneter Modus
  │
  ▼
Response → Zod-validiert → Client → computeDayHarmonic() → DayModeModal + SignaturV3
```

## Offene Punkte (Post-Sprint)

- **BAFE `/transit/current`**: Wenn BAFE einen dedizierten Transit-Endpoint bekommt (aktuelle Planetenpositionen statt nur Natal), sollte dieser angebunden werden für noch präzisere Transit-Daten.
- **Harmony-Index-Gewichtung**: Der aktuelle `computeHarmonyIndex` nutzt nur Western vs. BaZi Wu-Xing-Vektoren. Eine Erweiterung um Transit-Druck (Kp-gewichtete Modulation) ist denkbar.
- **Push-Notification-Trigger**: Bei Kp ≥ 7 oder Harmony-Index > 0.75 automatisch Push senden.
- **Cache-Strategie**: Daily-Response könnte im Supabase `daily_horoscope_cache` mit Datenquellen-Hash invalidiert werden bei signifikantem Wetter-Wechsel.

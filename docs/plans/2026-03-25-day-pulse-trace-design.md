# Day-Pulse / Day-Trace — Design Document

> Ersetzt das bisherige "Tageshoroskop" (DailyHoroscopeModal) vollständig.
> Branch: `feature/fusion-ring-integration-v3`

**Datum:** 2026-03-25
**Status:** Approved
**Entscheider:** Ben Pörsch

---

## 1. Konzept

Das Daily-Feature zeigt dem User täglich **einen** Modus — entweder **Day-Pulse** oder **Day-Trace**. Nie beides gleichzeitig.

| Modus | Trigger | Bedeutung |
|-------|---------|-----------|
| **Day-Pulse** | H < 0.50 | Symmetrische Pol-Bewegung. Dominantes Element gibt den Takt. Ruhige Zeit — der User kann sich anlehnen. |
| **Day-Trace** | H ≥ 0.50 | West- und Ost-Vektoren konvergieren unerwartet. Etwas passiert heute wirklich. Der User soll aufmerksam sein. |

**Mathematische Basis:**
FuFirE berechnet den Harmony Index `H` als Kosinus-Ähnlichkeit zwischen den normierten Wu-Xing-Vektoren aus Western und BaZi. Erwartungswert bei Zufall: H ≈ 0.45. Schwellwert 10% über Zufall: **H ≥ 0.50 = Trace**.

`intensity = |H - 0.45| / 0.55` — normiert auf [0, 1], misst wie weit der Tag vom Zufall entfernt ist.

---

## 2. Ton & Sprache

**Nicht:** "Merkur steht heute im Quadrat zu Saturn, was bedeutet..."
**Nicht:** "Die kosmischen Energien fließen besonders stark..."

**Ja — Poetic Realism:**
- Weltlich, sensorisch, einladend oder aufgeladen
- Resonanz wird durch Alltagsbilder ausgedrückt
- Kein Fachvokabular im sichtbaren Text
- Kein "weil". Kein Erklären. Nur: was ist heute, wie fühlt es sich an, was tue ich damit.

**Pulse-Beispiele:**
- "Wenn du heute eine Parkbank siehst, die frei ist, setz dich. Vielleicht auch wenn dort schon jemand sitzt. Vielleicht weiß er was, was du gern wüsstest."
- "Erde trägt heute. Rhythmus ist da — du kannst dich anlehnen."

**Trace-Beispiele:**
- "Dein detektivischer Skorpion bekommt heute was zu tun. Du schaust genau hin."
- "Dein Temperament des Schützen könnte am frühen Nachmittag positiv eingesetzt werden."
- Falls NASA-Daten signifikanten Magnetstorm zeigen: ein Satz extra — aber nur dann.

**Länge:** Max. 2–3 Sätze. Kein langer Block.

---

## 3. Data Layer

### 3.1 Schema-Erweiterung (`src/lib/schemas/experience.ts`)

`DailyFusionSchema` bekommt zwei neue Felder:

```ts
const DailyFusionSchema = z.object({
  summary: z.string(),
  synthesis: z.string(),
  action: z.string(),
  pushworthy: z.boolean(),
  push_text: z.string().optional().nullable(),
  // NEU:
  harmony_index: z.number().min(0).max(1),
  day_mode: z.enum(['pulse', 'trace']),
});
```

### 3.2 DayHarmonicState Interface

```ts
export interface DayHarmonicState {
  harmonyIndex: number;   // 0–1, H aus DailyFusion
  mode: 'pulse' | 'trace';
  intensity: number;      // |H - 0.45| / 0.55, normiert [0,1]
}
```

Lebt in `src/components/signatur-v3/bipolar-engine.ts`.

### 3.3 Server-Berechnung (`server.mjs`)

Beim Proxying von `/api/experience/daily`: falls FuFirE `harmony_index` liefert aber kein `day_mode`, berechnet der Server:
```js
day_mode: harmony_index >= 0.50 ? 'trace' : 'pulse'
```

`H` wird im UI **nicht angezeigt** — reine interne Logik.

---

## 4. V3 Engine (bipolar-engine.ts)

`DayHarmonicState` wird als eigener Parameter in `tickEngine` übergeben — orthogonal zu `DissonanceState`. Beide Signale addieren sich, überschreiben sich nicht.

```ts
export function tickEngine(
  state: EngineState,
  dissonance: DissonanceState,
  dayHarmonic: DayHarmonicState,
  dt: number,
): EngineState
```

**Pulse-Modus:**
- Alle Pole auf symmetrischem Orbit (Default)
- `trailPersistence` leicht erhöht: `base + intensity * 0.12`
- Canvas-Clear-Geschwindigkeit reduziert → ruhige, verdichtete Trails

**Trace-Modus:**
- 2–3 Dimensions-Paare werden als "crossing" markiert (initial: die zwei stärksten Natal-Dimensionen)
- Für crossing-Dimensionen: Lissajous-Blend-Faktor `+= intensity * 0.6` (geclampt auf 1.0)
- Mikro-Vibration an Kreuzungspunkten, Frequenz ∝ intensity
- `trailPersistence` leicht gesenkt → Trails brennen sich ein, verblassen aber auch schneller

---

## 5. DayModeModal (ersetzt DailyHoroscopeModal)

**Neues File:** `src/components/dashboard/DayModeModal.tsx`
**Deprecated:** `DailyHoroscopeModal.tsx` bleibt bis Tests migriert sind.

### Layout

```
╔══════════════════════════════╗
║                              ║
║   DAY-TRACE                  ║  ← Eigenname, groß, Gold
║   25. März                   ║  ← klein darunter
║                              ║
║   [Canvas 120×120px]         ║  ← statisches V3-Trail-Snapshot
║                              ║    Trace: Kreuzungslinien
║   "Dein detektivischer       ║    Pulse: ruhige konz. Kreise
║    Skorpion bekommt heute    ║
║    was zu tun.               ║
║    Du schaust genau hin."    ║  ← max. 2–3 Sätze
║                              ║
╚══════════════════════════════╝
```

**Canvas-Fallback:** Falls V3 noch nicht gemergt → SVG-Icon als Platzhalter (kein Blocker).

**LLM-Prompt Differenzierung:**
- Pulse: atmosphärisch, einladend, sensorisch, Alltagsbilder, Resonanz ohne Fachbegriffe
- Trace: direkt, konkret, aufgeladen, etwas passiert — keine Erklärung des Warum
- Magnetstorm-Integration: wenn Space-Weather-Daten Sturm mittlerer bis hoher Kategorie zeigen, ein Satz extra

---

## 6. Betroffene Files

| File | Änderung |
|------|----------|
| `src/lib/schemas/experience.ts` | `harmony_index` + `day_mode` in DailyFusionSchema |
| `src/components/signatur-v3/bipolar-engine.ts` | `DayHarmonicState` Interface + `tickEngine` Signatur |
| `src/components/signatur-v3/SignaturV3Canvas.tsx` | `dayHarmonic` Prop weitergeben |
| `src/components/dashboard/DayModeModal.tsx` | Neue Komponente (ersetzt DailyHoroscopeModal) |
| `src/lib/horoscope/llm-layer.ts` | Mode-aware Prompt-Logik |
| `src/lib/horoscope/horoscope-service.ts` | `day_mode` in Horoscope-Output |
| `src/hooks/useFirstRunDaily.ts` | `DayHarmonicState` aus Response ableiten |
| `src/components/Dashboard.tsx` | Import DayModeModal statt DailyHoroscopeModal |
| `server.mjs` | `day_mode` Berechnung beim Daily-Proxy |

---

## 7. Out of Scope (bewusst ausgelassen)

- H-Wert im UI anzeigen → nein
- Drei-Tab-Design (Westlich/BaZi/Fusion) → komplett entfernt
- Erklärungen warum welche Planeten was tun → nie
- Historischer Verlauf (gestern, letzte Woche) → separates Feature

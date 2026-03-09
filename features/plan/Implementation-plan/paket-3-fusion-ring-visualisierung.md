# PAKET 3 — Fusion Ring Visualisierung (Bazahuawa)

> **Repo:** `DYAI2025/Astro-Noctum` (Vite + React 19 + TypeScript)
> **Spezifikation:** Bazodiac Fusion Ring Signal Logic Specification v1.0
> **Voraussetzung:** Paket 1 (Signal Engine) + Paket 2 (Quiz + Hook) abgeschlossen.
> **Eingangsdaten:** `FusionRingSignal` aus `useFusionRing()` Hook (Paket 2)

---

## Kontext

Die mathematische Engine (Paket 1) liefert `FusionRingSignal.sectors: number[12]`. Die Quiz-Integration (Paket 2) liefert den `useFusionRing` Hook der dieses Signal reaktiv updatet. Jetzt wird die visuelle Darstellung gebaut: Ein 12-Sektor Radialdiagramm mit Element-Farben, Power-Curve, Glow, und organischer Form.

Das hier ist der **Bazahuawa-Ring** — das zentrale visuelle Element von Bazodiac. Die Anforderungen an visuelle Qualität sind hoch. Der Ring muss auf den ersten Blick "persönlich" wirken, nicht generisch.

---

## Bestehende Architektur

- **3D Orrery** existiert bereits (`BirthChartOrrery.tsx`, Three.js). Der Fusion Ring ersetzt das Orrery NICHT — er ist ein zusätzliches Element.
- **Canvas/SVG:** Freie Wahl. Canvas empfohlen wegen Glow/Blur-Effekten (SVG shadowBlur ist limitiert).
- **Styling-Kontext:** Obsidian Background (`#00050A`), Gold Akzente (`#D4AF37`)
- **Responsive:** Dashboard ist ein scrollbarer Container. Der Ring muss bei 280px–480px Breite funktionieren.

---

## Tasks

### Task 3.1 — Element-Farb-System

Erstelle `src/lib/fusion-ring/colors.ts`:

```typescript
export type ElementColor = {
  base: string;      // Haupt-Farbe
  glow: string;      // Glow/Highlight
  hslH: number;      // HSL Hue für Interpolation
};

export const ELEMENT_COLORS: Record<string, ElementColor> = {
  wood:  { base: '#2E7D32', glow: '#66BB6A', hslH: 130 },
  fire:  { base: '#E65100', glow: '#FF9800', hslH: 25  },
  earth: { base: '#BF8C00', glow: '#FFD54F', hslH: 45  },
  metal: { base: '#78909C', glow: '#CFD8DC', hslH: 200 },
  water: { base: '#1565C0', glow: '#42A5F5', hslH: 210 },
};

/** Fixe Sektor-Farben (Base) — S4 bekommt Gold als Blend */
export const SECTOR_COLORS: string[] = [
  '#2E7D32', // S0  Holz (Widder)
  '#BF8C00', // S1  Erde (Stier)
  '#E65100', // S2  Feuer (Zwillinge)
  '#E65100', // S3  Feuer (Krebs)
  '#D4AF37', // S4  Feuer/Erde (Löwe) — Gold als Blend
  '#78909C', // S5  Metall (Jungfrau)
  '#78909C', // S6  Metall (Waage)
  '#1565C0', // S7  Wasser (Skorpion)
  '#1565C0', // S8  Wasser (Schütze)
  '#1565C0', // S9  Wasser (Steinbock)
  '#BF8C00', // S10 Erde (Wassermann)
  '#2E7D32', // S11 Holz (Fische)
];

/** Glow-Farben pro Sektor */
export const SECTOR_GLOW_COLORS: string[] = [
  '#66BB6A', '#FFD54F', '#FF9800', '#FF9800', '#FFD54F',
  '#CFD8DC', '#CFD8DC', '#42A5F5', '#42A5F5', '#42A5F5',
  '#FFD54F', '#66BB6A',
];

/**
 * HSL-Hue Interpolation zwischen zwei Sektoren.
 * t ∈ [0, 1] — Position innerhalb der 30°-Zone.
 */
export function lerpSectorColor(sectorLeft: number, sectorRight: number, t: number): string {
  const cLeft = SECTOR_COLORS[sectorLeft];
  const cRight = SECTOR_COLORS[sectorRight];

  // Wenn gleiche Farbe: kein Lerp nötig
  if (cLeft === cRight) return cLeft;

  // Hex → RGB → HSL Lerp → zurück
  const [h1, s1, l1] = hexToHSL(cLeft);
  const [h2, s2, l2] = hexToHSL(cRight);

  // Shortest-path Hue Interpolation
  let dh = h2 - h1;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;

  const h = (h1 + dh * t + 360) % 360;
  const s = s1 + (s2 - s1) * t;
  const l = l1 + (l2 - l1) * t;

  return `hsl(${h}, ${s}%, ${l}%)`;
}

// Hex → HSL Hilfsfunktion implementieren
function hexToHSL(hex: string): [number, number, number] {
  // Standard hex→rgb→hsl Konvertierung
  // ... (implementieren)
}
```

### Task 3.2 — FusionRing Canvas-Komponente

Erstelle `src/components/FusionRing.tsx`:

```typescript
import { useRef, useEffect, useMemo } from 'react';
import type { FusionRingSignal } from '@/src/lib/fusion-ring';
import { SECTOR_COUNT, SECTORS } from '@/src/lib/fusion-ring/constants';
import { powerCurve } from '@/src/lib/fusion-ring/math';
import { SECTOR_COLORS, SECTOR_GLOW_COLORS, lerpSectorColor } from '@/src/lib/fusion-ring/colors';

interface FusionRingProps {
  signal: FusionRingSignal;
  size?: number;           // px, default 360
  showLabels?: boolean;    // Zeichen-Symbole anzeigen
  animated?: boolean;      // Smooth transitions bei Signal-Änderung
  className?: string;
}

const ZODIAC_SYMBOLS = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
```

**Rendering-Algorithmus (im `useEffect` mit Canvas 2D Context):**

1. **Hintergrund:** Clear mit transparent (Container hat Obsidian-Background)

2. **Basis-Ring zeichnen:** Dünner Kreis (1px, `rgba(212, 175, 55, 0.15)`) als Referenzlinie

3. **Signal → Radiale Abweichung:**
   ```
   Für jeden Sektor s (0-11):
     sig = signal.sectors[s]
     power = sign(sig) · |sig|^1.5
     deviation = power >= 0
       ? power * (radius * 0.60)   // max outward
       : power * (radius * 0.25)   // max inward
     r(s) = baseRadius + deviation
   ```

4. **Interpolation zwischen Sektoren:** Nicht 12 harte Punkte, sondern eine Bézier-Spline-Kurve durch die 12 Radien. Das erzeugt die organische Form.

   ```
   Für N=360 Punkte (1 pro Grad):
     angle = i * (2π / 360)
     sectorIdx = floor(angle / (2π/12))
     nextIdx = (sectorIdx + 1) % 12
     t = (angle - sectorIdx * 30°) / 30°
     r = lerp(r(sectorIdx), r(nextIdx), smoothstep(t))
     x = cx + r * cos(angle)
     y = cy + r * sin(angle)
   ```

5. **Farbiger Fill:** Jeder Punkt auf dem Ring bekommt die interpolierte Element-Farbe:
   ```
   color(angle) = lerpSectorColor(sectorLeft, sectorRight, t)
   ```

6. **Glow-Effekt:** Für Peak-Sektoren (Top 3):
   ```
   ctx.shadowColor = SECTOR_GLOW_COLORS[peakSector]
   ctx.shadowBlur = |signal.sectors[peakSector]| * 40
   glow_alpha = 0.1 + |signal| * 0.6
   ```

7. **Zeichen-Symbole:** Am äußeren Rand, je 30° versetzt, in Gold (`#D4AF37`), Font: Sora 12px

8. **Profil-Auflösung** (optional): Kleiner Text unten: "Auflösung: 33%" in gedämpftem Gold

### Task 3.3 — Animation System

Wenn `animated={true}`:

- Bei Signal-Änderung: Smooth Transition der Radien über 800ms (ease-in-out)
- `requestAnimationFrame` Loop der den aktuellen Zustand interpoliert
- Alter Zustand → Neuer Zustand mit Lerp pro Frame

```typescript
const animatedRadii = useRef<number[]>(new Array(12).fill(baseRadius));
const targetRadii = useRef<number[]>(new Array(12).fill(baseRadius));

// Bei Signal-Update: targetRadii setzen
// Im rAF Loop: animatedRadii → targetRadii mit dampingFactor 0.08
```

### Task 3.4 — Responsive Sizing

- Container: `aspect-ratio: 1/1`, `max-width: 480px`, `width: 100%`
- Canvas wird mit `devicePixelRatio` skaliert (Retina-Support)
- Mindestgröße: 280px (Mobile)
- Label-Größe skaliert mit Radius (min 10px, max 14px)

### Task 3.5 — Integration in Dashboard

Erweitere `src/components/Dashboard.tsx`:

**Position:** Zwischen der Gemini-Interpretation und dem Quiz-Bereich (aus Paket 2).

```tsx
{signal && (
  <div className="flex flex-col items-center gap-4 py-8">
    <h2 className="font-serif text-xl text-gold">Dein Bazahuawa</h2>
    <FusionRing
      signal={signal}
      size={360}
      showLabels={true}
      animated={true}
    />
    {signal.resolution < 100 && (
      <p className="text-sm text-gold/50">
        Auflösung: {signal.resolution}% — Absolviere weitere Tests
      </p>
    )}
  </div>
)}
```

**Visueller Kontext:**
- Centered im Dashboard-Flow
- Obsidian-Background (erbt vom Dashboard)
- Gold-Überschrift in Cormorant Garamond
- Unterhalb: Auflösungs-Hinweis als Retention-Hook

### Task 3.6 — Muster-Archetypen Validierung

Nach der Implementierung visuell verifizieren gegen die Spec:

**Feuer-Profil** (Löwe/Widder, Yang-Feuer):
- Starke Peaks bei S0, S2–S4
- Warme Gold/Orange-Töne dominieren
- Gegenüber (S6–S9) leichte Einbuchtungen
- Form: wie eine Flamme

**Wasser-Profil** (Skorpion/Fische):
- Peaks bei S7–S9 und S11
- Tiefblaue Töne
- Wellenförmig, nicht spitz
- Gegenüber (S1–S4) subtile Spannung

**Erde-Profil** (Stier/Steinbock):
- Verteilte Peaks bei S1, S4, S10 — Dreiecks-Muster
- Bernstein/Gold-Töne
- Stabil, symmetrisch

**Gemischt** (Sonne Löwe, Mond Fische, Asz Skorpion):
- Drei klar getrennte Peaks bei S4, S7, S11
- Farbmix: Gold + Blau + Grün
- Erkennbar als "komplex" aber kohärent

→ Screenshots der 4 Profile als Validierung beifügen.

---

## Dateistruktur (Ergebnis dieses Pakets)

```
src/
├── lib/
│   └── fusion-ring/
│       └── colors.ts                   ← Element-Farben, HSL-Interpolation
├── components/
│   └── FusionRing.tsx                  ← Canvas-basierte Ring-Visualisierung
```

Plus Änderungen an:
- `src/components/Dashboard.tsx` (FusionRing einbinden)

---

## Technische Constraints

- **Kein Chart-Library.** Kein recharts, kein d3, kein Chart.js. Reines Canvas 2D API. Die Kontrolle über Glow, Farb-Interpolation und Bézier-Splines erfordert direkten Canvas-Zugriff.
- **Kein WebGL/Three.js** für den Ring. Das 3D Orrery (`BirthChartOrrery.tsx`) bleibt separat und nutzt Three.js. Der Ring ist 2D Canvas.
- **Performance:** Ein einziger Canvas, keine DOM-Elemente pro Sektor. `requestAnimationFrame` nur wenn animiert, sonst statisches Rendering.
- **Accessibility:** `aria-label` auf dem Canvas mit textueller Beschreibung der Peak-Sektoren.

---

## Akzeptanzkriterien

1. Ring rendert korrekt bei 280px, 360px und 480px Breite
2. Element-Farben korrekt: Feuer-Sektoren orange, Wasser-Sektoren blau, etc.
3. Farb-Interpolation: Fließender Übergang zwischen benachbarten Elementen, kein hartes Umschalten
4. Power-Curve sichtbar: Starke Sektoren brechen dramatisch aus, schwache sind subtil
5. Opposition-Einbuchtungen: Visuell erkennbar gegenüber von Peaks
6. Glow-Effekt: Peak-Sektoren leuchten, schwache sind fast unsichtbar
7. Gauss-Glocke visuell bestätigt: Kein isolierter Spike, sondern organischer Peak mit Nachbar-Einfluss
8. Animated Transition: Signal-Änderung (Quiz abgeschlossen) → Ring morpht smooth in 800ms
9. Auflösungs-Anzeige: "Auflösung: 33%" korrekt basierend auf completed/total Tests
10. Feuer-Profil sieht aus "wie eine Flamme", Wasser-Profil "fließt" — subjektiv aber wichtig.
11. **Bestehende App** unverändert funktional

---

## Nicht im Scope

- Kein interaktives Hover/Click auf Sektoren (später möglich)
- Keine Vergleichsansicht (zwei Ringe nebeneinander)
- Kein Export/Share des Rings als Bild (kann später kommen)
- Keine Änderung am 3D Orrery
- Kein Dark/Light Mode Toggle (Obsidian ist fix)

# Signatur V3 — Vision

> Was die Signatur ist, wie sie funktioniert, wohin sie führt. Dieses Dokument ist die Single Source of Truth für alle Entscheidungen rund um die Signatur. Keine V2-Referenzen. V3 ist die Signatur.

**Letzte Aktualisierung:** 2026-03-29
**Verantwortlich:** Ben Pörsch (Product), Claude (Architecture)

---

## I. Was die Signatur ist

Die Signatur ist kein Bild. Sie ist ein lebendiges kymatisches System.

12 Punkte bewegen sich nach physikalischen Gesetzen durch einen kreisförmigen Raum. Die Spuren, die sie dabei hinterlassen, *sind* die Signatur. Die Form emergiert aus dem Verhalten — nicht aus statischer Berechnung, nicht aus Dekoration, nicht aus Zufall.

Das Prinzip ist Cymatics: Kennst du den Ton, kennst du die Geometrie. Siehst du die Geometrie, könntest du theoretisch den Ton rekonstruieren. Die Abbildung von Input zu Bild ist kohärent, rekursiv und selbstreferenzierend. Jedes Detail der Signatur hat einen Grund, der in den Daten des Users liegt.

Die Signatur ist die visuelle Darstellung der Frequenz eines Menschen.

---

## II. Anatomie: 6 Dimensionen → 12 Pole

Jede der 6 Quiz-Dimensionen wird in zwei gegensätzliche Pole aufgespalten. Die Pole sind 180° gegenüber auf dem Kreis platziert, die Dimensionen im 60°-Abstand — wie Tierkreiszeichen.

| Dimension | Pol A | Pol B | Winkel | Cousto Hz | Planet |
|-----------|-------|-------|--------|-----------|--------|
| Assertion | Durchsetzung | Hingabe | 0° | 144.72 | Mars |
| Empathy | Einfühlung | Abgrenzung | 60° | 210.42 | Mond |
| Creativity | Schöpfung | Struktur | 120° | 126.22 | Sonne |
| Logic | Analyse | Synthese | 180° | 141.27 | Merkur |
| Intuition | Ahnung | Evidenz | 240° | 183.58 | Jupiter |
| Discipline | Ordnung | Freiheit | 300° | 147.85 | Saturn |

Die 12 Pole sind das visuelle Äquivalent der 12 Tierkreiszeichen — sie spannen den Raum auf, in dem sich die Signatur entfaltet.

Jeder Pol hat drei Kern-Parameter, die aus echten Daten abgeleitet sind:

**Radius** — bestimmt vom Natal-Gewicht der Dimension. Stärkere Natal-Prägung = größerer Orbit. Pol B wird zusätzlich durch den Quiz-Wert moduliert (0.7–1.3×). Das heißt: Die Quiz-Erfahrung verändert die Geometrie des Gegenübers.

**Geschwindigkeit** — abgeleitet von der Cousto-Frequenz des zugehörigen Planeten über logarithmische Normalisierung. Mond (210.42 Hz) bewegt sich schneller als Sonne (126.22 Hz). Das folgt Hans Coustos kosmischer Oktave — planetare Umlaufzeiten, oktaviert in den hörbaren Bereich.

**Farbe** — 12 planetarisch kodierte Farben. Mars-Rot `(1.0, 0.15, 0.12)`, Mond-Violett `(0.68, 0.55, 1.0)`, Sonnen-Gold `(1.0, 0.72, 0.12)`, Merkur-Cyan `(0.20, 0.95, 1.0)`, Jupiter-Gelb `(1.0, 0.88, 0.0)`, Saturn-Stahlblau `(0.38, 0.52, 0.72)`. Plus ihre Gegenpole. Wo Trails sich überlagern, addieren sich die Farben — emergente Leuchtmuster.

---

## III. Datenfluss: Vom Geburtsdatum zur Bewegung

```
Geburtsdaten
  → FuFirE /experience/bootstrap
    → soulprint_sectors[12]
      → soulprintToNatalWeights()   → 7 Planeten-Gewichte → 6 Natal-Dimensionen [0,1]
      → soulprintToDimensionWeights() → 6 Natal-Dimensionen direkt

Quiz-Completion
  → ContributionEvent
    → eventToSectorSignals()       → 12-Sektor-Gewichte
      → quizSectorsToQuizWeights() → 6 Quiz-Dimensionen [0,1]

V3 Engine Input:
  natal: Map<dimension_id, weight>    // 6 Werte [0,1]
  quiz:  Map<dimension_id, weight>    // 6 Werte [0,1]
  dayHarmonic?: DayHarmonicState      // Pulse oder Trace
  solar?: SolarModulation             // Sonnenwind
  external?: DissonanceResult         // 3-Schichten-Modell
```

**True-North-Prinzip:** Quiz-Modulation darf maximal 50% vom Natal-Gewicht abweichen. Die Signatur wird durch Quizzes nuancierter, aber sie wird nie jemand anderes. Das ist keine technische Constraint — das ist eine Haltung: Dein Natal ist dein Grundton. Was du entdeckst, sind Obertöne.

**Bridge-Architektur:** Die bestehende Pipeline ist plattformübergreifend identisch. `signatur-bridge.ts` (Web) und `SignaturV3Engine.swift` (iOS) konsumieren denselben 13-dimensionalen Input. Die Mathematik ist 1:1 portiert. Gleiche Gewichte erzeugen dieselbe Signatur — auf jedem Gerät.

---

## IV. Das Bewegungsgesetz

Das Bewegungsverhalten der Pole kodiert den Dissonanz-Zustand jeder Dimension. Es gibt keine binären Zustände — nur einen kontinuierlichen Gradienten zwischen Harmonie und Spannung.

### Konsonanz (d → 0)

Beide Pole einer Dimension bewegen sich symmetrisch um den Mittelpunkt. Saubere, kreisförmige Bahnen. Die Spuren überlagern sich, die Form verdichtet sich, wird "mehr sie selbst". Das ist der Zustand, wenn Quiz-Antworten das Natal-Profil bestätigen.

### Dissonanz (d → 1)

Pole bewegen sich gegenläufig *durch* den Mittelpunkt. Lissajous-artige Kreuzungen mit dimensionsspezifischen Frequenz-Ratios. Die Spuren divergieren, die Form öffnet sich, neue Geometrie arbeitet sich ein. Das passiert, wenn ein Wasser-dominierter User im Quiz starke Feuer-Tendenzen zeigt.

### Blend

Der Übergang ist kontinuierlich:

```
position = lerp(symmetric_orbit, lissajous_pattern, clamp(d × 2, 0, 1))
```

Die Verstärkung durch `× 2` sorgt dafür, dass schon kleine Dissonanzen sichtbar werden. Ab d = 0.5 ist man in reinem Lissajous-Modus. Das ist Absicht: Die Signatur soll empfindlich sein.

### Vibrations-Textur

Hohe Dissonanz (d > 0.1) erzeugt Mikro-Oszillation senkrecht zur Bewegungsrichtung. Die Textur der Vibration ist elementar kodiert:

- **Ke-Dissonanz** (Wasser↔Feuer, destruktiver Zyklus): Hochfrequent (12 Hz), kristallin, kantig
- **Sheng-Dissonanz** (unterbrochener Erzeugungszyklus): Niederfrequent (3 Hz), organisch, fließend

Die elementare Qualität wird als Skalar dargestellt: -1 (Ke) über 0 (neutral) bis +1 (Sheng). Das gibt der Spannung eine Farbe — nicht alle Konflikte fühlen sich gleich an.

---

## V. Das Drei-Schichten-Dissonanz-Modell

Drei unabhängige Dissonanz-Quellen mappen auf drei verschiedene visuelle Kanäle. Die Musik-Analogie ist absichtlich — sie trägt.

| Schicht | Metrik | Visueller Kanal | Musik |
|---------|--------|----------------|-------|
| **Natal Baseline** | `d_natal` | Bewegungsmodus (symmetrisch ↔ Lissajous) | Grundton |
| **Akkumulierte Quizzes** | `d_accumulated` | Micro-Jitter, Trail-Komplexität | Obertöne |
| **Wu-Xing Elemente** | `d_elemental` | Vibrations-Textur (kristallin vs. organisch) | Timbre |

**Natal Baseline** ist das Fundament. Die per-Dimension Abweichung zwischen Natal- und Quiz-Gewichten. Das sieht man sofort: Ist die Signatur symmetrisch oder gekreuzt?

**Akkumulierte Quizzes** (Phase 2) bauen über Zeit Komplexität auf. Der `d_accumulated`-Wert erzeugt Micro-Jitter (7–12 Hz), der die Trail-Muster verdichtet. Je mehr Quizzes, desto feinere Textur.

**Wu-Xing Elemente** geben der Dissonanz ihren Charakter. Ke ist Schnitt, Sheng ist Fluss. Der User sieht nicht den Wert — er spürt den Unterschied zwischen einer kantigen und einer fließenden Spannung.

---

## VI. Trail = Signatur

Kein Partikel-System, keine vorberechnete Geometrie. Die Form entsteht dort, wo die meisten Spuren überlagern.

### Rendering

Canvas 2D mit additiver Blendung (`globalCompositeOperation: 'lighter'`). Wo Spuren verschiedener Pole sich überlagern, addiert sich die Helligkeit. Das produziert emergente Leuchtmuster, die kein einzelner Pol allein erzeugen könnte.

Jeder Frame legt einen halbtransparenten Hintergrund über die Leinwand (`rgba(8, 5, 15, α)`). Die Fade-Rate `α` wird durch die globale Dissonanz moduliert: Mehr Spannung = schnellerer Clear = die Signatur "atmet" unruhiger. Bei Sonnensturm reduziert sich die Fade-Rate leicht — mehr Energie, hellere Trails.

### Trail-Persistenz

Jeder Pol speichert Positionen in einem `Float32Array`-Ringpuffer (x,y-Paare). Die Persistenz-Rate bestimmt, wie lange Spuren sichtbar bleiben. Höhere Persistenz = dichtere, langlebigere Form. Niedrigere Persistenz = flüchtigere, atmende Form.

### Adaptive Qualität

| Tier | Canvas ≥ | Trail-Punkte | Persistenz | Ziel-FPS |
|------|----------|-------------|------------|----------|
| High | 400px | 2.000 | 0.85 | 60 (Desktop) |
| Medium | 250px | 800 | 0.82 | 45 |
| Low | < 250px | 300 | 0.78 | 30 (Mobile) |

Die Tier-Auswahl ist automatisch. Die Engine misst die Canvas-Größe und wählt den passenden Tier. Kein User muss Settings anfassen.

### Rendering-Pipeline (pro Frame)

1. Semi-transparenter Hintergrund (Fade, dissonanz-moduliert)
2. 6 Dimensionsachsen als nahezu unsichtbare Hilfslinien (3% Opacity)
3. 12 Trails: Vollspur (0.5px, 15% Opacity) + frische 80 Segmente (1px, 40% Opacity) — alles in additiver Blendung
4. 12 Pol-Köpfe als Radial-Gradients. Glow-Radius skaliert mit Dissonanz: 8px (konsonant) bis 20px (dissonant)
5. Zentrum-Singularität: Schwarzes Loch mit violettem Halo (`rgba(20, 15, 30, 0.4)`)

### Frame-Rate-Unabhängigkeit

Delta-Time-basiertes Update. Die Animation sieht bei 30 fps gleich aus wie bei 144 fps. Bei Tab-Wechsel pausiert die Engine (`visibilitychange`), bei Rückkehr setzt sie nahtlos fort — kein Sprung, kein Reset.

---

## VII. Day-Pulse & Day-Trace

Die Signatur lebt nicht im Vakuum. Sie reagiert auf den Tag.

### Harmony Index H

FuFirE berechnet H als Kosinus-Ähnlichkeit zwischen normierten Wu-Xing-Vektoren aus Western und BaZi:

```
H = cos(θ) = v̂_west · v̂_bazi
```

Erwartungswert bei Zufall: H ≈ 0.45. Alles darüber ist Signal. Die Intensität wird normiert: `intensity = |H - 0.45| / 0.55` → [0, 1].

### Day-Pulse (H < 0.50) — Jeden Tag

Der Grundrhythmus. Welches Element den Tag trägt. In der Signatur äußert sich das als erhöhte Trail-Persistenz (+12% × Intensität). Die Spuren kondensieren, die Signatur wirkt ruhiger, dichter, in sich ruhend.

Voice: `[Element] ist [Funktion] → [was es heute für DICH tut] → [Einladung]`

"Erde trägt heute. Rhythmus ist da — du kannst dich anlehnen."

### Day-Trace (H ≥ 0.50) — An ~30–35% der Tage

Die Spur. Ost und West zeigen unabhängig voneinander auf denselben Punkt. Das ist statistisch bemerkenswert. In der Signatur wird es sichtbar: Die Pole mit den höchsten Cousto-Frequenzen (Mond 0.81, Jupiter 0.67 nach Log-Normalisierung) werden durch erhöhten Lissajous-Blend intensiviert. Ihre Trails kreuzen sich deutlicher. Zusätzlich erzeugt die Trace Crossing-Vibration (6–14 Hz) an den Kreuzungspunkten.

Die Trail-Persistenz sinkt leicht (-6% × Intensität) — Traces brennen sich ein und verblassen schneller. Die Signatur atmet an Trace-Tagen aktiver.

Voice: `[Element-Reibung als Situation] → [was du erleben könntest] → [Ermutigung]`

"Dein Wachstum trifft heute auf Sichtbarkeit. Was du still aufgebaut hast, will raus."

Signal-Stärke: H 0.50–0.65 = "speak" (deutlich, ruhig). H > 0.65 = "call" (klar, dringend).

### Night-Pulse / Night-Trace

Gleiches Prinzip, andere Datenbasis (Mond-Position, BaZi-Nacht-Pillar). Verfügbar: Wochenende (alle User) + Premium (jeden Tag). Voice-Shift: Weicher, introspektiver, weniger handlungsorientiert.

### Visuelle Integration

An Trace-Tagen zeigt die Signatur einen Transit-Overlay:

1. Identifiziere die zwei Reibungs-Elemente (z.B. Holz→Feuer)
2. Finde die zugehörigen Dimensions-Pole
3. Verstärke deren Bewegungsradius und Trail-Helligkeit temporär
4. Die intensivere Kreuzung ihrer Trails erzeugt die sichtbare "Spur des Tages"

Der User sieht nicht nur den Text — er sieht die Day-Trace in seiner Signatur.

---

## VIII. Space Weather — Die Membran

Echtzeit-Sonnenwind-Daten (NOAA/DONKI Kp-Index) modulieren die äußere Schicht der Signatur. Das ist keine Spielerei — geomagnetische Aktivität hat messbare biologische Korrelate. Die Signatur zeigt sie.

**`ringModulation`** (1.0–1.5): Expandiert alle Pol-Radien. Bei solarem Sturm dehnt sich die Signatur aus, sie atmet größer. Die Expansion ist gewichtet durch die individuelle Resonanz jeder Dimension — nicht jede Achse reagiert gleich auf den Sturm.

**`dimensionMultipliers`**: Personalisierte kosmische Resonanz. Abgeleitet aus dem Natal-Profil. Ein Mars-geprägter User reagiert auf Solar-Events anders als ein Saturn-geprägter.

**G3+ Stürme** (Kp ≥ 7): Hochfrequente Pulsation (20 Hz) auf allen Achsen, skaliert pro Dimension. Die Signatur zittert sichtbar. Das passiert vielleicht 5–10 Mal pro Jahr — und wenn es passiert, soll es sich anfühlen.

---

## IX. Quiz-Completion: Morphing

Wenn ein User ein Quiz abschließt, verändert sich die Signatur sichtbar. Die Veränderung muss zwei Bedingungen erfüllen:

**Proportional:** Ein einzelnes kleines Quiz erzeugt eine subtile Verschiebung. Ein ganzer Cluster-Abschluss eine deutliche. Der User soll den Zusammenhang zwischen Handlung und Wirkung spüren — ohne Erklärung.

**Kontinuierlich:** Keine Cuts, keine Snapshots. Die neue Geometrie morpht sich über ~2 Sekunden in die bestehende Signatur ein. Die Pole verändern ihren Radius, ihre Geschwindigkeit, ihren Lissajous-Blend graduell. Die Trails der alten Form verblassen, während die neue Form sich einschreibt.

Das ist die Self-Fulfilling-Prophecy-Mechanik: Der User beantwortet Fragen über sich. Die Signatur verändert sich. Er sieht die Veränderung. Er denkt darüber nach, was sich verändert hat. Diese Reflexion ist das Produkt.

---

## X. Density Field

Das Density Field ist die numerische Repräsentation der visuellen Form. Ein 128×128-Raster, das zeigt, wo die Signatur am dichtesten ist — wo die meisten Trails überlagern.

### Berechnung

Für jeden Trail-Punkt jedes Pols: Mappe die Position auf Grid-Koordinaten. Addiere einen Freshness-gewichteten Wert (neuere Punkte zählen mehr). Das Ergebnis ist ein Heatmap-artiges Feld mit `maxDensity` als Normalisierungsbasis.

```ts
interface DensityField {
  grid: Float32Array;   // 128 × 128 = 16.384 Zellen
  width: number;
  height: number;
  maxDensity: number;
}
```

### Warum das wichtig ist

Das Density Field löst die Signatur von der Visualisierung. Es ist eine Datenstruktur, die verglichen, subtrahiert, überlagert und quantifiziert werden kann. Damit wird die Signatur zum Informationsträger — nicht nur zum Bild.

---

## XI. Plattform-Architektur

### Web (TypeScript / React)

| Datei | Verantwortung |
|-------|--------------|
| `bipolar-engine.ts` | Reine Mathematik. Pole, Dimensionen, Dissonanz, Bewegungsgesetz. Kein DOM, kein React. |
| `SignaturV3Canvas.tsx` | React-Komponente. Canvas 2D Renderer, `requestAnimationFrame`-Loop, DPR-Handling, Visibility-Pause. |
| `signatur-bridge.ts` | Daten-Bridge. `soulprintToNatalWeights()`, `quizSectorsToQuizWeights()`, `soulprintToDimensionWeights()`. |

### iOS (Swift / SwiftUI)

| Datei | Verantwortung |
|-------|--------------|
| `SignaturV3Engine.swift` | 1:1 Port der Engine-Mathematik nach Swift. |
| `SignaturV3View.swift` | SwiftUI View. Metal/Core Graphics Rendering. |

### Shared

`packages/shared/src/signatur/` — Export-Hub für Bridge-Funktionen, die beide Plattformen konsumieren.

### Datenbank

| Tabelle | Inhalt |
|---------|--------|
| `user_signature_state` | `signature_blueprint_json`, `soulprint_sectors`, `quiz_sectors`, `signature_version` |
| `daily_horoscope_cache` | Cached Day-Pulse/Trace mit `engine_version` und `signature_version` Keys |
| `astro_profiles` | `soulprint_sectors` JSONB Spalte |

### Backend (FuFirE)

FuFirE berechnet den Harmony Index, die Wu-Xing-Vektoren, die Fusion-Analyse. Es liefert die Daten, die V3 konsumiert. Es weiß nichts von der Visualisierung. Das ist die richtige Grenze.

---

## XII. UI-Oberflächen

### SignaturQuizzesPage — Die Hauptbühne

Vollbild-Signatur mit Quiz-Cluster-Sidebar. Hier lebt die Signatur in ihrer vollen Größe und Auflösung (High Tier). Premium-Gates für fortgeschrittene Quizzes.

### MiniSignature — Das Dashboard-Widget

240×240px. Lazy-loaded `SignaturV3Canvas` im Low/Medium-Tier. Der erste Touchpoint — muss schnell laden und sofort als "meine Signatur" erkennbar sein.

### SignatureReveal — Onboarding

Erste Begegnung. 2-Sekunden Morph-Animation. Die Signatur entsteht vor den Augen des Users aus dem Nichts. Ehrfürchtig, still, bedeutungsvoll (Brand Voice: Dial Up Wärme + Präzision, Dial Down alles andere).

### SpaceWeatherPanel

Zeigt die aktuelle Solar-Modulation. Kontext für den User: Warum atmet meine Signatur heute anders? Nicht als Erklärung, sondern als Beobachtung.

---

## XIII. Performance

| Metrik | Ziel | Mechanismus |
|--------|------|-------------|
| Desktop 60 fps | < 1ms Engine + < 3ms Render pro Frame | Delta-Time, `Float32Array`-Ringpuffer |
| Mobile 30 fps | < 2ms Engine + < 5ms Render pro Frame | Adaptive Tier-Selection, reduzierte Trail-Länge |
| First Frame | < 2 Sekunden | Bootstrap-Daten gecached, Engine-Init synchron |
| API Response | < 500ms | FuFirE-Proxy mit 15s Timeout, Caching |
| Memory | Kein Wachstum über Zeit | Ringpuffer mit fester Größe, kein `push()` |
| Quiz-Morph | < 2s sichtbare Reaktion | Gewicht-Update triggert sofortige Dissonanz-Neuberechnung |
| Tab-Wechsel | Kein Sprung bei Rückkehr | `visibilitychange` pausiert/resumed, `lastFrameRef` Reset |

---

## XIV. Determinismus

Dieselben Input-Werte erzeugen dieselbe Signatur-Form. Nach ausreichender Trail-Akkumulation (~10 Sekunden) ist die emergente Geometrie visuell identisch bei zwei unabhängigen Runs. Das ist kein Nice-to-Have — es ist eine Grundvoraussetzung für Matching, Vergleich und Vertrauen.

Der einzige Nicht-Determinismus liegt in der Lissajous-Frequenz-Ratio, die über `hash01(dim.hz, 3)` berechnet wird — aber dieser Hash ist deterministisch relativ zur Dimension. Gleiche Dimension = gleicher Ratio = gleiche Form. Immer.

---

## XV. Wohin die Signatur führt

### Jetzt (Phase 1)

Die Signatur lebt, atmet, reagiert auf Quizzes und den Tag. Der User nimmt sie als "seine" wahr, ohne die Mechanik zu verstehen. Konsonanz erzeugt erkennbar andere Formen als Dissonanz. Day-Pulse und Day-Trace sind visuell unterscheidbar. Performance ist stabil.

### Nächste Schritte (Phase 2)

**Volle Drei-Schichten-Dissonanz.** `d_accumulated` wird aktiv. Jedes Quiz hinterlässt eine Textur-Spur. Die Signatur wird über Wochen und Monate feiner, detaillierter, persönlicher.

**Bijektive Präzision.** Die Signatur-Geometrie soll den Input-Vektor rekonstruieren können. Wenn du die Form siehst, könntest du die Gewichte ableiten. Das ist mathematisch anspruchsvoll — aber es ist das Cymatics-Versprechen: Ton = Geometrie = Ton.

**Density Field als Datenprodukt.** Das 128×128-Raster wird persistiert. Es ist die Basis für alles, was mit Vergleich zu tun hat.

### Vision (Phase 3)

**Dual-Ring.** Zwei Signaturen übereinander. Die emergente Mischform zeigt die Beziehungsdynamik. Wo sich die Density Fields überlagern: Resonanz. Wo Lücken klaffen: Wachstumsfelder. Kein Fragebogen-Match — gemessene Frequenz-Kompatibilität.

**Matching/Dating.** Density-Field-Vergleich als numerisches Kompatibilitätsmaß. Nicht "ihr seid zu 87% kompatibel" — sondern: "Eure Signaturen teilen die Kreativitäts-Achse und unterscheiden sich in Assertion. Das macht euch ergänzend — nicht identisch."

**Teambuilding.** Die Kohärenzsignatur als Ablösung von Belbin und 9Levels. Ein Team von 5 Leuten erzeugt 5 Density Fields. Die Überlagerung zeigt: Wo liegt die kollektive Stärke? Wo die blinden Flecken? Welche Dimension fehlt?

**Audio-Layer.** Cousto-Frequenzen sind nicht nur Berechnungsgrundlage — sie sind hörbar. Die Signatur könnte klingen. Konsonante Dimensionen erzeugen harmonische Intervalle, dissonante erzeugen Schwebungen. Das Cymatics-Prinzip wird vollständig: sichtbar UND hörbar.

---

## XVI. Referenzen

| Dokument | Inhalt |
|----------|--------|
| [`SIGNATUR_V3_ARCHITECTURE.md`](SIGNATUR_V3_ARCHITECTURE.md) | Technische Spezifikation der Engine |
| [`API_EXPERIENCE.md`](API_EXPERIENCE.md) | Experience API (Bootstrap, Daily, Signature-Delta) |
| [`QUIZZES_AND_SIGNATURE.md`](QUIZZES_AND_SIGNATURE.md) | Quiz-Pipeline und Contribution-System |
| [`BRANDVOICE.md`](../BRANDVOICE.md) | Brand Voice: Präzise, Warm ohne Weich, Souverän, Prozess nicht Urteil |
| `bipolar-engine.ts` | Engine-Implementation |
| `SignaturV3Canvas.tsx` | Canvas-Renderer |
| `signatur-bridge.ts` | Daten-Bridge (Soulprint → Gewichte) |

---

*Die Signatur ist der Ort, an dem Astronomie, Psychologie und Mathematik aufhören, getrennte Disziplinen zu sein. Sie ist Bazodiac in seiner reinsten Form.*

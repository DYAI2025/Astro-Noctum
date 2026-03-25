# Signatur V3 — Bipolar Trail Architecture

> Technische und konzeptionelle Dokumentation des V3 Signatur-Systems. Zielgruppe: Entwickler, die am Signatur-Renderer arbeiten, und Product Owner, die Entscheidungen über die visuelle Identität von Bazodiac treffen.

**Branch:** `prototype/signatur-v3-bipolar-trails`
**Status:** Prototype (aktiv)
**Letzte Aktualisierung:** 2026-03-25

---

## 1. Warum V3

V2 erzeugt ~28.000 statische Partikel entlang vorberechneter Spirograph-Kurven. Das Ergebnis ist visuell beeindruckend, hat aber fundamentale Limitierungen, die der Produktvision widersprechen:

Die Signatur soll die visuelle Darstellung der "Frequenz" eines Users sein — wie ein Chladni-Muster, das durch einen Ton geformt wird. In V2 ist die Signatur aber ein Snapshot, kein lebendiges System. Partikel bewegen sich nicht; sie werden platziert. Die Animation ist dekorativ, nicht informativ. Der User kann die Bewegung nicht "lesen".

V3 löst das durch einen fundamentalen Paradigmenwechsel: Statt Partikel zu platzieren, bewegen sich 12 Punkte (Pole) kontinuierlich und zeichnen dabei Spuren. Die akkumulierten Spuren SIND die Signatur. Die Form emergiert aus dem Verhalten, nicht aus statischer Berechnung.

Das Cymatics-Prinzip: Wenn man den Ton kennt, kennt man die Geometrie. Wenn man die Geometrie sieht, könnte man theoretisch den Ton rekonstruieren. Die Abbildung Input → Visual ist kohärent, rekursiv und selbstreferenzierend.

---

## 2. Kernkonzept: 6 Dimensionen → 12 Pole

Jede der 6 Quiz-Dimensionen wird in zwei gegensätzliche Pole aufgespalten. Die Pole sind 180° gegenüber auf dem Kreis platziert, die Dimensionen im 60°-Abstand (wie Tierkreiszeichen).

| Dimension | Pol A | Pol B | Winkel | Frequenz |
|-----------|-------|-------|--------|----------|
| Assertion | Durchsetzung | Hingabe | 0° | Mars 144.72 Hz |
| Empathy | Einfühlung | Abgrenzung | 60° | Mond 210.42 Hz |
| Creativity | Schöpfung | Struktur | 120° | Sonne 126.22 Hz |
| Logic | Analyse | Synthese | 180° | Merkur 141.27 Hz |
| Intuition | Ahnung | Evidenz | 240° | Jupiter 183.58 Hz |
| Discipline | Ordnung | Freiheit | 300° | Saturn 147.85 Hz |

Jeder Pol hat eine Farbe (abgeleitet vom zugehörigen Planeten), eine Geschwindigkeit (abgeleitet von der Cousto-Frequenz), und einen Radius (abgeleitet vom Natal-Gewicht der Dimension).

Die 12 Pole sind das visuelle Äquivalent der 12 Tierkreiszeichen — sie spannen den Raum auf, in dem sich die Signatur entfaltet.

---

## 3. Bewegungsgesetz

Das Bewegungsverhalten der Pole kodiert den Dissonanz-Zustand der jeweiligen Dimension. Es gibt keine binären Zustände, nur einen kontinuierlichen Gradienten.

### Konsonanz (Quiz ≈ Natal)

Beide Pole einer Dimension bewegen sich symmetrisch um den Mittelpunkt. Saubere, kreisförmige Bahnen. Die Spuren überlagern sich → die Form verdichtet sich, wird "mehr sie selbst". Das ist der Normalzustand einer Dimension, deren Quiz-Antworten das Natal-Profil bestätigen.

### Dissonanz (Quiz ≠ Natal)

Pole bewegen sich gegenläufig DURCH den Mittelpunkt. Lissajous-artige Kreuzungen. Die Spuren divergieren → die Form öffnet sich, zeigt Spannung, neue Geometrie arbeitet sich ein. Das passiert, wenn ein Wasser-dominierter User in einem Quiz starke Feuer-Tendenzen zeigt.

### Blend-Mechanik

Der Übergang zwischen beiden Modi ist kontinuierlich. Für jede Dimension wird ein Dissonanz-Wert `d` berechnet (Betrag der Abweichung Quiz vs. Natal). Dieser Wert blendet linear zwischen symmetrischer Orbit-Bewegung und Lissajous-Muster:

```
position = lerp(symmetric_orbit, lissajous_pattern, clamp(d * 2, 0, 1))
```

Zusätzlich erzeugt hohe Dissonanz Mikro-Vibration senkrecht zur Bewegungsrichtung. Die Frequenz der Vibration wird vom elementaren Dissonanz-Typ bestimmt: Ke-Dissonanz (Wasser↔Feuer) = hochfrequent, kantig. Sheng-Dissonanz (Holz→Feuer unterbrochen) = niederfrequent, organisch.

---

## 4. Trail = Signatur

Die akkumulierten Spuren der 12 Pole SIND die Signatur. Kein Partikel-System, keine vorberechnete Geometrie — die Form entsteht dort, wo die meisten Spuren überlagern.

### Rendering-Prinzip

Canvas 2D mit additiver Blendung (`globalCompositeOperation: 'lighter'`). Wo Spuren verschiedener Pole sich überlagern, addiert sich die Helligkeit → emergente Leuchtmuster. Jeder Frame legt einen halbtransparenten Hintergrund über die Leinwand → ältere Spuren verblassen natürlich, neuere sind heller.

### Trail-Persistenz

Jeder Pol speichert bis zu 3.000 Positionen (konfigurierbar). Die Persistenz-Rate bestimmt, wie lange Spuren sichtbar bleiben. Höhere Persistenz = dichtere, langlebigere Form. Niedrigere Persistenz = flüchtigere, atmende Form.

Die Fade-Geschwindigkeit des Hintergrunds wird durch die globale Dissonanz moduliert: Mehr Dissonanz = schnellerer Clear = die Signatur "atmet" unruhiger.

### Density Field (Phase 2)

Für spätere Features (Matching, Teambuilding) kann aus den Trail-Daten ein Density-Field berechnet werden — ein 2D-Raster das zeigt, wo die Signatur am dichtesten ist. Dieses Feld ist die numerische Repräsentation der visuellen Form und ermöglicht den Vergleich zweier Signaturen.

---

## 5. Dissonanz-Modell

Referenz: [`DEC-dissonance-model`](../2-design/decisions/DEC-dissonance-model.md)

Die drei Dissonanz-Schichten mappen auf drei visuelle Parameter-Domänen:

| Schicht | Metrik | Visueller Kanal | Musikanalog |
|---------|--------|----------------|-------------|
| Natal Baseline | `d_natal` | Bewegungsmodus (symmetrisch ↔ Lissajous) | Grundton |
| Akkumulierte Quizzes | `d_accumulated` | Trail-Persistenz und -Dichte (Phase 2) | Obertöne |
| Wu-Xing Elemente | `d_elemental` | Vibrations-Textur (Sheng=organisch, Ke=kristallin) | Timbre |

### Phase 1 (jetzt)

Natal Baseline ist primär. Element-Level Dissonanz wird grob erkannt. Akkumulierte Quiz-History ist architektonisch vorbereitet aber noch nicht aktiv. Ästhetik hat Vorrang vor mathematischer Präzision.

### Phase 2 (später)

Volle Drei-Schichten-Berechnung. Bijektive Präzision, bei der die Signatur-Geometrie theoretisch den Input-Vektor rekonstruieren kann. Basis für Dating/Matching/Teambuilding.

---

## 6. Integration: Day-Pulse und Day-Trace

Referenz: [`day-pulse-trace` Skill](../../.claude/skills/day-pulse-trace/SKILL.md)

Die V3-Signatur ist direkt an das Day-Pulse/Day-Trace System angebunden. Beide basieren auf derselben Berechnung: dem Harmony Index (Kohärenzindex) aus FuFirE.

### Täglicher Kohärenzindex

FuFirE berechnet den Harmony Index H als Kosinus-Ähnlichkeit zwischen den normierten Wu-Xing-Vektoren aus Western und BaZi (Referenz: [`05_harmony_index.md`](../../FuFirE/docs/fusion/05_harmony_index.md)):

```
H = cos(θ) = v̂_west · v̂_bazi
```

Der Erwartungswert für zwei unabhängige 5D-Vektoren auf dem positiven Simplex liegt bei H ≈ 0.45. Die Day-Trace-Schwelle liegt bei H ≥ 0.50 (10% über Zufallswert).

### Day-Pulse (H < 0.50) — Jeden Tag

Der Grundrhythmus. Welches Element den Tag trägt. In der V3-Signatur äußert sich das als normales Bewegungsmuster — die Pole der dominanten Dimension sind leicht aktiver/heller, aber die Gesamtform bleibt stabil.

Voice-Formel: `[Element] ist [Funktion] → [was es heute für DICH tut] → [Einladung]`

Beispiel: "Erde ist Struktur und die hält dich heute. Nicht zu fest, so wie du es brauchst. Lass dich ein auf das Gewohnte und Vertraute."

### Day-Trace (H ≥ 0.50) — An ~30-35% der Tage

Die Spur. Erscheint nur, wenn Ost und West unabhängig voneinander auf denselben Punkt zeigen. In der V3-Signatur wird das sichtbar: Die Pole der am Reibungspaar beteiligten Dimensionen bewegen sich intensiver, ihre Trails kreuzen sich deutlicher. Die "Trace" ist buchstäblich eine dichtere Spur im Signatur-Bild.

Voice-Formel: `[Element-Reibung als Situation] → [was du erleben könntest] → [Ermutigung]`

Beispiel: "Dein Wachstum trifft heute auf Sichtbarkeit. Was du still aufgebaut hast, will raus. Das ist keine Störung — das ist der Moment, für den du bereit bist."

Signal-Stärke: H 0.50–0.65 = "speak" (deutlich, ruhig). H > 0.65 = "call" (klar, dringend).

### Night-Trace / Night-Pulse

Gleiches Prinzip, andere Datenbasis (Mond-Position, BaZi-Nacht-Pillar). Verfügbar: Wochenende (alle User) + Premium (jeden Tag). Voice-Shift: Weicher, introspektiver, weniger handlungsorientiert.

### Visuelle Integration in V3

An Trace-Tagen könnte die V3-Signatur einen sichtbaren Transit-Overlay erhalten:

```
Transit-Overlay:
  1. Identifiziere die zwei Reibungs-Elemente (z.B. Holz→Feuer)
  2. Finde die zugehörigen Dimensions-Pole (Creativity Pol A = Schöpfung/Sonne, Assertion Pol A = Durchsetzung/Mars)
  3. Verstärke deren Bewegungsradius und Trail-Helligkeit temporär
  4. Die intensivere Kreuzung ihrer Trails erzeugt die sichtbare "Spur des Tages"
```

Der User sieht nicht nur den Text, er sieht die Day-Trace in seiner Signatur.

---

## 7. Input-Vektor und Datenfluss

V3 konsumiert denselben 13-dimensionalen Input wie V2. Die bestehende Pipeline bleibt unverändert:

```
Geburtsdaten
  → FuFirE /experience/bootstrap
    → soulprint_sectors[12]
      → soulprintToNatalWeights() → 7 Planet-Weights
      → quizSectorsToQuizWeights() → 6 Quiz-Dimensions

Quiz-Completion
  → ContributionEvent → eventToSectorSignals() → 12-sector weights
    → quizSectorsToQuizWeights() → 6 Quiz-Dimensions

V3 Engine Input:
  natal: Map<dimension_id, weight>     // 6 Werte [0,1]
  quiz:  Map<dimension_id, weight>     // 6 Werte [0,1]

V3 Engine Output:
  12 PoleState objects mit Position, Trail, Speed
  DissonanceState mit d_natal, d_accumulated, d_elemental
  DensityField (Phase 2)
```

### Bridge: 7 Planeten → 6 Dimensionen

Die bestehende `quizSectorsToQuizWeights()` Funktion in `signatur-bridge.ts` mappt 12-Sektor-Daten auf 6 Dimensionen. Für die Natal-Seite wird `soulprintToNatalWeights()` auf 7 Planeten gemappt, dann über die QUIZ_MATRIX auf 6 Dimensionen projiziert.

V3 kann alternativ die 6 Dimensionen direkt aus den 12 Sektoren ableiten (Assertion←Aries[0], Empathy←Cancer[3], Creativity←Leo[4], Logic←Virgo[5], Intuition←Sagittarius[8], Discipline←Capricorn[9]).

---

## 8. Vergleich V2 vs. V3

| Aspekt | V2 (Partikel-Spirograph) | V3 (Bipolar Trails) |
|--------|--------------------------|---------------------|
| Rendering | ~28K vorberechnete Partikel, Three.js | 12 bewegte Punkte, Canvas 2D |
| Bewegung | Dekorativ (Bloom-Effekt) | Information-tragend (Dissonanz kodiert) |
| Form-Entstehung | Vorberechnet (Spirograph-Geometrie) | Emergent (Trail-Akkumulation) |
| Dissonanz | Nicht sichtbar | Kern-Mechanik (symmetrisch ↔ Lissajous) |
| Performance | Schwer pro Änderung (~60ms) | Leicht pro Frame (~2ms) |
| Informationsdichte | Hoch (28K Partikel = viele Details) | Niedriger (12 Pole), aber wachsend |
| Day-Trace Integration | Nicht vorgesehen | Natürliche Erweiterung |
| Matching (Phase 2) | Density-Vergleich schwierig | Density-Field direkt ableitbar |
| Immer lebendig | Nein (Snapshot) | Ja (kontinuierliche Bewegung) |

### Was V2 besser kann

Detailreichheit. 28K Partikel erzeugen eine visuelle Komplexität, die V3 mit 12 Punkten nicht erreichen kann. Die Spirograph-Geometrie ist mathematisch tiefgründig (Cousto-Frequenzen → Lobenzahl → Fraktal-Tiers).

### Was V3 besser kann

Kohärenz, Performance, Erweiterbarkeit, und — entscheidend — das Prinzip "Bewegung IST Information". V3 ist pragmatischer, intuitiver verständlich, und immer in Bewegung. Es ist langfristig der bessere Träger für die Bazodiac-Vision.

---

## 9. Was wir erhoffen

### Kurzfristig (Prototyp)

Dass die bipolare Trail-Mechanik visuell funktioniert: Konsonanz erzeugt erkennbar andere Formen als Dissonanz. Dass der User die Signatur als "lebendig" wahrnimmt, ohne die Mechanik zu verstehen. Dass die Performance auf Mobile-Geräten stabil bei 30+ fps liegt.

### Mittelfristig (Integration)

Dass Day-Pulse und Day-Trace sich visuell in der Signatur zeigen. Dass Quiz-Completion eine spürbare, proportionale Veränderung erzeugt. Dass die Self-Fulfilling-Prophecy-Dynamik funktioniert: Der User liest morgens seine Day-Trace, sieht die entsprechende Bewegung in seiner Signatur, und geht aufmerksamer durch den Tag.

### Langfristig (Vision)

Dass Signaturen als Informationsträger für Matching, Dating und Teambuilding dienen können. Dass zwei Signaturen visuell verglichen werden können (Dual-Ring). Dass die Kohärenzsignatur Belbin und 9Levels als Teambuilding-Tool ablösen kann — nicht durch Fragebögen, sondern durch gemessene Frequenz-Kompatibilität.

---

## 10. Wie wir testen

### Visueller Test (Prototyp-Phase)

Die standalone `demo.html` (unter `src/components/signatur-v3/demo.html`) ermöglicht sofortiges visuelles Testing:

**Test 1 — Konsonanz vs. Dissonanz.** Slider für Natal und Quiz auf identische Werte setzen (Preset "Konsonant"). Die Signatur sollte symmetrische, saubere Bahnen zeigen. Dann Quiz-Werte invertieren (Preset "Dissonant"). Die Bahnen sollten sich sichtbar kreuzen, die Form sollte unruhiger werden. Der Unterschied muss ohne Erklärung erkennbar sein.

**Test 2 — Elementare Typen.** Preset "Feuer-Typ": Assertion und Creativity hoch. Die Signatur sollte energisch, weiträumig, schnell sein. Preset "Wasser-Typ": Empathy und Intuition hoch. Die Signatur sollte tiefer, enger, langsamer sein. Die "Persönlichkeit" muss sich visuell unterscheiden.

**Test 3 — Extremfall.** Preset "Extrem": Alle Natal-Werte maximal, alle Quiz-Werte minimal. Maximale Dissonanz auf allen Achsen gleichzeitig. Die Signatur muss visuell spannungsreich, aber nicht chaotisch sein. Kein Partikel-Chaos, sondern strukturierte Spannung.

**Test 4 — Performance.** 60fps auf Desktop-Chrome, 30fps auf mobilem Safari. Gemessen über 60 Sekunden mit Chrome DevTools Performance Tab. Trail-Länge von 3000 darf nicht zu Memory-Leaks führen.

### Integrations-Test (nach Einbindung in App)

**Test 5 — Quiz-Completion Morphing.** User schließt ein Quiz ab. Die Signatur muss sich innerhalb von 2 Sekunden sichtbar verändern. Die Veränderung muss proportional zur Bedeutsamkeit sein (kleines Quiz = subtile Änderung, Cluster-Completion = deutliche Änderung).

**Test 6 — Day-Trace Overlay.** An einem Trace-Tag (H ≥ 0.50) müssen die betroffenen Dimensions-Pole sichtbar intensiver sein als an einem Pulse-Tag. Der Overlay muss sich nach 24h automatisch zurücksetzen.

**Test 7 — Determinismus.** Dieselben Input-Werte müssen dieselbe Signatur-Form erzeugen (nach ausreichender Trail-Akkumulation). Die Form nach 10 Sekunden muss visuell identisch sein bei zwei unabhängigen Runs mit identischem Input.

### User-Test (nach Deployment)

**Test 8 — Blind-Vergleich.** 10 Test-Users bekommen zwei Signaturen gezeigt (eine konsonant, eine dissonant) ohne Erklärung. Frage: "Welche wirkt ruhiger?" Mindestens 7/10 sollten die konsonante wählen.

**Test 9 — Day-Trace Engagement.** A/B-Test: Gruppe A bekommt Day-Pulse/Trace nur als Text. Gruppe B bekommt Text + visuelle Signatur-Veränderung. Messung: Öffnungsrate am Folgetag, Verweildauer auf dem Dashboard. Hypothese: Gruppe B hat 20%+ höhere Retention.

---

## 11. Dateistruktur

```
src/components/signatur-v3/
├── bipolar-engine.ts        # Engine: Pole, Dimensionen, Dissonanz, Bewegungsgesetz
├── SignaturV3Canvas.tsx      # React-Komponente (Canvas 2D Renderer)
└── demo.html                # Standalone interaktive Demo

2-design/decisions/
├── DEC-dissonance-model.md          # Drei-Schichten Dissonanz-Architektur
└── DEC-signatur-v3-bipolar-trails.md # V3 Engine Architektur-Entscheidung
```

---

## 12. Referenzen

| Dokument | Inhalt |
|----------|--------|
| [`DEC-dissonance-model`](../2-design/decisions/DEC-dissonance-model.md) | Drei-Schichten Dissonanz-Modell (Natal/Akkumuliert/Elemental) |
| [`DEC-signatur-v3-bipolar-trails`](../2-design/decisions/DEC-signatur-v3-bipolar-trails.md) | V3 Engine Architektur-Entscheidung mit V2-Vergleich |
| [`QUIZZES_AND_SIGNATURE.md`](QUIZZES_AND_SIGNATURE.md) | Quiz-Pipeline, Mapping, V2-Engine Dokumentation |
| [`05_harmony_index.md`](../../FuFirE/docs/fusion/05_harmony_index.md) | Harmony Index Mathematik und Deutungsraum |
| [`day-pulse-trace` Skill](../../.claude/skills/day-pulse-trace/SKILL.md) | Voice-Regeln für Day-Pulse und Day-Trace Texte |
| [`BRANDVOICE.md`](../BRANDVOICE.md) | Brand Voice: Präzise, Warm ohne Weich, Souverän, Prozess nicht Urteil |
| [`API_EXPERIENCE.md`](API_EXPERIENCE.md) | Experience API (Bootstrap, Daily, Signature-Delta) |
| [`FEATURE_SPRINTS.md`](../../Sprints/FEATURE_SPRINTS.md) | Sprint-Planung S08–S12 |

---

*Erstellt: 2026-03-25 | Branch: `prototype/signatur-v3-bipolar-trails`*

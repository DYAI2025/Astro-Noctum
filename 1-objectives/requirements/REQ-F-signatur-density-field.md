# REQ-F-signatur-density-field: Signatur Density Field (Phase 2)

**Type**: Functional

**Status**: Draft

**Priority**: Should-have

**Source**: [GOAL-signatur-phase2-density](../goals/GOAL-signatur-phase2-density.md), [GOAL-signatur-phase3-matching](../goals/GOAL-signatur-phase3-matching.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## Description

Das Density Field ist die numerische Repräsentation der visuellen Signatur. Ein 128×128 Float-Raster zeigt, wo die meisten Trails überlagern — ein Heatmap-artiges Feld. Das löst die Signatur von der Visualisierung: Sie wird eine Datenstruktur, die verglichen, subtrahiert, überlagert und quantifiziert werden kann. Damit wird die Signatur zum Informationsträger — nicht nur zum Bild. Schlüssel für Matching, Bijektivität und Team-Analyse.

```ts
interface DensityField {
  grid: Float32Array; // 128 × 128 = 16.384 Zellen
  width: 128;
  height: 128;
  maxDensity: number; // Normalisierungsbasis
}
```

## Acceptance Criteria

### Berechnung

- Given ein laufender V3-Render-Run mit mind. 2.000 Frames, when Density Field berechnet, then enthält jede Zelle die akkumulierte Trail-Intensität normiert auf [0,1]
- Given Trail-Punkt eines Pols bei Position (x,y), when auf Grid gemappt, then wird ein freshness-gewichteter Wert addiert (neuere Punkte zählen mehr als alte)
- Given `maxDensity`, when verwendet, then normalisiert er das gesamte Grid auf [0,1] — keine absolute Helligkeits-Abhängigkeit von Laufzeit

### Vergleich & Matching

- Given zwei Density Fields, when per Kosinus-Ähnlichkeit verglichen, then ergibt sich ein Kompatibilitätsscore `c ∈ [0,1]` als Flachvektor-Produkt der normierten 128×128-Grids
- Given Ensemble von N Density Fields (N ≤ 12), when verglichen, then liefert eine N×N Kompatibilitätsmatrix mit allen paarweisen Scores

### Bijektivität

- Given ein Density Field einer vollständig konvergierten Signatur (~10s Laufzeit), when Input-Vektor rekonstruiert, then liegt der Fehler über alle 6 Dimensionen < 5% (Phase 2 Ziel)

### Persistenz

- Given berechnetes Density Field, when persistiert, then wird es in `user_signature_state.signature_blueprint_json` gespeichert
- Given `signature_version` Feld, when Engine-Version wechselt, then werden alte Density Fields invalidiert und bei nächstem Render neu berechnet

### Dual-Ring (Phase 3 Vorbereitung)

- Given zwei Density Fields zweier User, when überlagert, then zeigt die Differenz-Karte: Überlappungs-Zellen = Resonanz, Lücken = Wachstumsfelder
- Given Überlagerung, when gerendert, then ist der Dual-Ring das visuelle Ergebnis der summierten Density Fields (additive Blendung)

## Related Artifacts

- Requirements: [REQ-F-signatur-rendering-engine](REQ-F-signatur-rendering-engine.md)
- Requirements: [REQ-F-signatur-determinism](REQ-F-signatur-determinism.md)
- Requirements: [REQ-F-signatur-dissonance-model](REQ-F-signatur-dissonance-model.md)

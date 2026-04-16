# DEC-cymatics-renderer: Cymatics Engine — Renderer und BaZi→Chladni Mapping

**Status**: Accepted

**Date**: 2026-04-17

**Applies to**: `src/components/signatur-cymatics/`, `src/lib/cymatics/`, `src/components/fusion-ring-3d/FusionRing3D.tsx`

## Context

Die `Cymantics/` Prototyp-Verzeichnis enthält zwei Renderer:

1. **`ChladniSignature.tsx`** — 2D Partikel-Simulation (p5.js), 16K Partikel, Chladni-Gleichung auf Einheitsquadrat
2. **`SignatureCanvas.tsx`** — 3D Sphäre (Three.js), Chladni-Displacement auf Kugeloberfläche + geodätische Trail-Linien

Beide demonstrieren denselben mathematischen Kern (`cymatics.ts`: `chladniDisplacement` für 3D; `ChladniSignature.tsx`: 2D `chladni(x,y,a,b,m,n)` für Partikel).

## Decision

**Primäre Engine: Canvas2D Partikel-Simulation** (port der 2D p5.js-Version, ohne p5-Dependency).

**Begründung:**
1. **Differenzierung**: V1 und V2 sind bereits 3D Three.js-Szenen. Die 2D-Chladni-Simulation ist visuell und konzeptionell anders — Partikel kristallisieren zu Mustern, nicht Partikel umkreisen eine Kugel. Das ist die überzeugendere Metapher für "Schwingungsmuster".
2. **Keine neue Three.js-Szene**: Eine dritte Three.js-Szene auf derselben Seite erzeugt GPU-Wettbewerb mit dem bestehenden V2/V1 Canvas. Canvas2D hat keinen GPU-Overhead-Konflikt.
3. **Kein p5.js**: p5.js (~900KB) wird nicht als Produktions-Dependency hinzugefügt. Canvas2D + RAF repliziert den mathematischen Kern vollständig.
4. **Morphing**: Der Partikel-Ansatz erlaubt sanftes Morphing durch Smooth-Interpolation der m,n,a,b Parameter — kein Geometry-Rebuild nötig.
5. **Fallback**: Canvas2D ist in jedem Browser verfügbar; kein WebGL-Check nötig. CSS/SVG-Fallback trotzdem als Rückfallebene.

**3D Sphäre**: Nicht als Haupt-Engine. Die `SignatureCanvas.tsx`-Geometrie (`cymatics.ts: buildSignatureGeometry`) bleibt referenziert, kann aber als optionale V4.5-Erweiterung später integriert werden (z.B. als "Erweiterte Ansicht" für Premium).

## BaZi → Chladni Parameter Mapping

```
numeric_signature = (year.stem_index * 1000 + month.stem_index * 100
                  + day.stem_index * 10 + hour.stem_index) % 360

m = 2 + (numeric_signature % 5)                     → range 2..6
n = 2 + (floor(numeric_signature * 7 / 5) % 5)      → range 2..6
a = 0.3 + harmony_index * 0.7                        → range 0.30..1.00
b = 1.0 - a * 0.6                                    → range 0.10..0.70
```

**Warum diese Formel:**
- `m × n` produziert 25 mögliche Kombinationen (5×5). Durch die unterschiedlichen Modulare (`%5` vs `%5` mit `*7/5` Verzerrung) sind m und n für reale Geburtsmomente weitgehend unkorreliert → höhere Diversität der Muster.
- Der Faktor 7/5 ist irrational-nah (1.4), was Clustering vermeidet ohne die Ganzzahlikeit zu verletzen.
- `numeric_signature % 360` bildet auf 0..359 ab — genug Auflösung für die 25 m×n-Kombinationen.

**stem_index Verfügbarkeit**: Wenn `bazi.pillars.*.stem_index` nicht im BAFE-Response ist, wird er aus dem Stammnamen deriviert:
```typescript
const STEM_INDEX: Record<string, number> = {
  '甲':0,'乙':1,'丙':2,'丁':3,'戊':4,'己':5,'庚':6,'辛':7,'壬':8,'癸':9
};
```

## Engine Architecture

```
FusionRing3D
  ├── isFeatureEnabled('signature_engine_cymatics') && chladniParams?
  │     → SignaturCymaticsCanvas (new)
  ├── isFeatureEnabled('signature_engine_v3') && v3DimensionWeights?
  │     → SignaturV3Canvas (existing)
  ├── isFeatureEnabled('signature_engine_v2') && !v2Failed?
  │     → FusionRingCanvasV2 (existing)
  └── default
        → FusionRingWebsiteCanvas (V1, existing)
```

Cymatics hat die **höchste Priorität** wenn enabled, da es explizit als neue Haupt-Engine gedacht ist.

## File Structure

```
src/
  lib/cymatics/
    bazi-to-chladni.ts      # ChladniParams derivation + Cousto frequency data
    chladni-math.ts         # Pure math: chladni(), ELEMENT_COLORS, PLANET_FREQUENCIES
  components/signatur-cymatics/
    SignaturCymaticsCanvas.tsx   # Canvas2D particle simulation component
    CymaticsFallback.tsx         # CSS/SVG static fallback
    CymaticsFrequencyPanel.tsx   # Cousto frequency display panel
```

## Consequences

- `p5` wird NICHT als Dependency hinzugefügt.
- `signature_engine_cymatics` Feature-Flag (default: `false`, localStorage-overridable). Für Rollout kann es für Premium-User auf `true` defaulten.
- `FusionRing3D` Props: `chladniParams?: ChladniParams` — neues optionales Prop, FuRingPage berechnet es aus `apiData`.
- Bestehende V1/V2/V3 Engines bleiben unverändert.
- BAFE-Response-Feld `bazi.pillars.*.stem_index` muss verifiziert werden — falls nicht vorhanden, Mapping über Stem-Name.

# REQ-F-signatur-rendering-engine: Signatur V3 Bipolar Trail Engine

**Type**: Functional

**Status**: Implemented

**Priority**: Must-have

**Source**: [GOAL-fusion-astrology](../goals/GOAL-fusion-astrology.md), [GOAL-autopoietic-ux](../goals/GOAL-autopoietic-ux.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## Description

Die Signatur V3 ist ein lebendiges kymatisches System. 12 Pole (6 Dimensionen × Pol A/B) bewegen sich nach Cousto-Frequenz-abgeleiteten Geschwindigkeiten durch einen kreisförmigen Canvas-Raum. Ihre akkumulierten Spuren — `Float32Array`-Ringpuffer mit additiver Blendung — **sind** die Signatur. Keine Vorberechnungen, keine Partikel-Sprites, kein Three.js. Die Form emergiert aus dem Verhalten.

Implementierung: `bipolar-engine.ts` (reine Mathematik, kein DOM) + `SignaturV3Canvas.tsx` (Canvas 2D, `requestAnimationFrame`-Loop, Delta-Time, Visibility-API-Pause).

## Acceptance Criteria

### Pole & Dimensionen

- Given 6 Input-Dimensionen [0,1], when die Engine initialisiert, then werden 12 `PoleState`-Objekte erstellt — je 2 pro Dimension, 180° gegenüber auf dem Kreis
- Given die 6 Dimensionen, when Pol-Winkel zugewiesen, then gilt: Assertion 0°, Empathy 60°, Creativity 120°, Logic 180°, Intuition 240°, Discipline 300° — Pol B jeweils +180°
- Given Pol-Geschwindigkeit, when berechnet, then gilt `baseSpeed = 0.003 + logNorm(hz) * 0.008`; Mond (210.42 Hz) bewegt sich schneller als Sonne (126.22 Hz)
- Given Pol-Radius, when aus Natal-Gewicht abgeleitet, then skaliert Pol A mit Natal-Gewicht; Pol B zusätzlich durch Quiz-Wert moduliert (0.7–1.3×)
- Given Pol-Farben, when 12 Pole gerendert, then gilt: Mars-Rot `(1.0, 0.15, 0.12)`, Mond-Violett `(0.68, 0.55, 1.0)`, Sonnen-Gold `(1.0, 0.72, 0.12)`, Merkur-Cyan `(0.20, 0.95, 1.0)`, Jupiter-Gelb `(1.0, 0.88, 0.0)`, Saturn-Stahlblau `(0.38, 0.52, 0.72)` plus ihre Gegenpole

### Trail-System

- Given `globalCompositeOperation: 'lighter'`, when Trails verschiedener Pole überlagern, then addiert sich die Helligkeit — emergente Leuchtmuster ohne explizite Berechnung
- Given ein Pol, when er sich bewegt, then werden Positionen in einem `Float32Array`-Ringpuffer (x,y-Paare) gespeichert — kein `push()`, kein Heap-Wachstum
- Given die Fade-Geschwindigkeit, when bestimmt, then gilt: `rgba(8, 5, 15, α)` als Hintergrund-Overlay pro Frame; α wird durch globale Dissonanz moduliert — mehr Dissonanz = schnellerer Clear = unruhigeres Atmen
- Given Sonnensturm (`ringModulation > 1.0`), when aktiv, then reduziert sich die Fade-Rate leicht (mehr Energie = hellere Trails)

### Adaptive Qualitäts-Tiers

- Given Canvas-Größe ≥ 400px, when gerendert, then `maxTrailLength = 2000`, `trailPersistence = 0.85`, Ziel 60fps (Desktop)
- Given Canvas-Größe 250–399px, when gerendert, then `maxTrailLength = 800`, `trailPersistence = 0.82`, Ziel 45fps
- Given Canvas-Größe < 250px, when gerendert, then `maxTrailLength = 300`, `trailPersistence = 0.78`, Ziel 30fps (Mobile)
- Given Canvas-Größe wechselt (Resize), when erkannt, then wechselt Tier automatisch ohne Neustart der Engine

### Rendering-Pipeline (pro Frame)

1. Semi-transparenter Hintergrund (Fade, dissonanz-moduliert)
2. 6 Dimensionsachsen als nahezu unsichtbare Hilfslinien (3% Opacity)
3. 12 Trails: Vollspur 0.5px/15% Opacity (alt) + frische 80 Segmente 1px/40% Opacity — additive Blendung
4. 12 Pol-Köpfe als Radial-Gradients: Glow-Radius 8px (konsonant) → 20px (dissonant)
5. Zentrum-Singularität: schwarzes Loch mit violettem Halo `rgba(20, 15, 30, 0.4)`

### Frame-Rate & Lifecycle

- Given Delta-Time-basiertes Update, when die Engine bei 30fps und 144fps läuft, then ist die Animations-Geometrie visuell identisch
- Given Tab-Wechsel (`visibilitychange`), when Tab versteckt, then pausiert die Engine; bei Rückkehr nahtlose Fortsetzung ohne Sprung oder Reset

## Related Constraints

- [CON-dark-luxury-aesthetic](../constraints/CON-dark-luxury-aesthetic.md) — Canvas rendert gegen OLED-Schwarz; additive Blendung erzeugt die Gold/Biolumineszenz-Ästhetik organisch

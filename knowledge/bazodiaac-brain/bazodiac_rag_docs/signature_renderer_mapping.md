# Signature Renderer Mapping

Status: TO_BE_ADDED_FROM_CODE

## Zweck

Dieses Dokument beschreibt spaeter, wie semantische Signatur-Events im Frontend dargestellt werden.

## Wichtige Regel fuer Agenten

Agenten erfinden keine Renderer-Details. Sie sagen nicht, dass ein Event als Partikel, Fraktal, Trail, Farbe oder bestimmte Form erscheint, solange der Renderer das nicht vorgibt.

## Semantische Inputs

```json
{
  "semantic_change": "stabilization|tension|countermovement|compression|release|jump|recalibration|day_pulse|fusion_explanation|none",
  "linked_planet": "mars",
  "linked_anchor": "conflict_boundary_mode",
  "duration": "session|short_term|persistent",
  "visual_priority": "low|medium|high"
}
```

## Noch zu definieren

- Visualisierung von `stabilization`
- Visualisierung von `tension`
- Visualisierung von `release`
- Visualisierung von `recalibration`
- Darstellung von Day-Pulse-Events vs Deep-Dive-Events
- Persistenzregeln
- Prioritaetsregeln

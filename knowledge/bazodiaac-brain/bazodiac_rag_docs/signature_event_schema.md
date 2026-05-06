# Signature Event Schema

## Zweck

Signatur-Events beschreiben semantische Veraenderungen, die der Renderer spaeter darstellen kann.

## Grundregel

Agenten beschreiben keine konkreten Renderer-Details. Keine Behauptungen ueber Farben, Partikel, Fraktale, Trails oder Formen, solange der Renderer das nicht vorgibt.

## Konzept

```text
Base Signature = Grundstruktur
Seven Anchors = Grundnarrativ
Deviation Events = Bewegung
Signature Surface = sichtbare Entwicklung
```

## Semantische Events

- bestaetigte Hypothese: `stabilization`
- Anreicherung: feinere Struktur
- Abweichung: `tension` oder `countermovement`
- bestaetigte Abweichung: staerkerer Gegenmarker
- Ersetzung: `recalibration`
- Ergaenzung: neue Verbindung / zweite Schicht
- verworfene Abweichung: Verblassen
- Planetenschieberegler-Bewegung: Bewegung entlang planetarer Polachse

## Beispielobjekt

```json
{
  "linked_planet": "mars",
  "anchor_key": "conflict_boundary_mode",
  "hypothesis_id": "uuid-or-null",
  "deviation_type": "integration",
  "deviation_intensity": 0.44,
  "semantic_change": "release",
  "duration": "short_term",
  "visual_priority": "medium",
  "evidence_summary": "Mehr Klarheit im Grenzmodus."
}
```

## Dauer

- `session`
- `short_term`
- `persistent`

## Prioritaet

- `low`
- `medium`
- `high`

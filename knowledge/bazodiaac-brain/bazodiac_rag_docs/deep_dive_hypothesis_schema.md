# Deep Dive Hypothesis Schema

## Zweck

Dieses Dokument definiert die sieben Angelpunkte, Hypothesenlogik, Verdichtungswerte und Abweichungsregeln.

## Sieben Angelpunkte

1. Selbstbild (`self_image`)
2. Schutzstrategie (`protection_strategy`)
3. Beziehungsmodus (`relationship_mode`)
4. Konflikt- und Grenzmodus (`conflict_boundary_mode`)
5. Deutungsmuster (`interpretation_pattern`)
6. Entwicklungssehnsucht (`development_longing`)
7. Schatten-/Abweichungspunkt (`shadow_deviation_point`)

## Grundregel

Die sieben initialen Hypothesen bleiben als Ursprungsschicht gespeichert. Sie werden nicht vorschnell geloescht oder ueberschrieben.

## Statuswerte

- `initial`
- `active`
- `candidate`
- `strengthened`
- `promoted`
- `superseded`
- `deprecated`
- `archived`
- `recalibrating`

## Maturity

- `raw`
- `developing`
- `stable`
- `complex`
- `recalibrating`

## Metriken

- `confirmation_count`
- `user_confirmation_count`
- `indirect_confirmation_count`
- `contradiction_count`
- `relevant_session_count`
- `robustness_score`

## Robustheit

Vereinfachte Formel:

```text
robustness_score = confirmation_count + user_confirmation_bonus - contradiction_count
```

Modusgewichtung:

- Deep Dive, direkte Nutzerbestaetigung: +2
- Deep Dive, indirekte Bestaetigung: +1
- Free Mode, klare spontane Bestaetigung: +1
- Free Mode, schwache Beobachtung: +0.5 oder nur Notiz
- Day Pulse: 0
- Fusion: 0
- klare Nutzerablehnung: -2
- starke Gegenbeobachtung: -1

## Abweichungslogik

Eine neue Beobachtung wird zuerst als moegliche Anreicherung geprueft:

- Trigger
- Ausnahme
- Schutzfunktion
- Eskalationsform
- Submuster
- reifere Variante
- Kontextvariante

Nur wenn sie deutlich gegen die aktive Hypothese spricht, wird sie als konkurrierende Abweichung gespeichert.

## Ersetzungsregel

Eine konkurrierende Hypothese darf eine aktive Hypothese nur ersetzen, wenn:

- sie in mehreren relevanten Gespraechen bestaetigt wurde,
- ihr Verdichtungsgrad mindestens dem der aktiven Hypothese entspricht,
- oder die aktive Hypothese durch klare Widersprueche/Nutzerablehnung in `recalibrating` gefallen ist.

## Interne Sprache

Agenten duerfen vor Nutzern nicht sagen:

- "Ich stelle die Hypothese auf..."
- "Meine Hypothese ist..."
- "Diese Hypothese erhaertet sich..."

Erlaubt:

- "Eine moegliche Lesart waere..."
- "Ich wuerde das vorsichtig pruefen..."
- "Welche Version ist naeher an deiner/Ihrer Erfahrung?"

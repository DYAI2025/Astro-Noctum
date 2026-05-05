# Planet Slider Model

## Zweck

Platzhalter-/Spezifikationsdokument fuer planetare Schieberegler.

## Grundidee

Jeder astrologische Archetyp/Planet besitzt im Bazodiac-Modell:

- einen natalen Basiswert,
- einen dynamischen aktuellen Wert,
- einen linken Pol,
- einen rechten Pol,
- individuelle Chart-Eigenschaften,
- Korrelationen zu Deep-Dive-Hypothesen.

## Erwartetes Datenmodell

```json
{
  "planet_id": "mars",
  "planet_display_name": "Mars",
  "natal_slider": {
    "base_value": 0.0,
    "left_pole": "TO_BE_ADDED_FROM_CODE",
    "right_pole": "TO_BE_ADDED_FROM_CODE",
    "source": "natal_chart"
  },
  "dynamic_slider": {
    "current_value": 0.0,
    "last_updated_session": "session_id",
    "change_reason": "string",
    "confidence": 0.0
  },
  "natal_interpretation": {
    "summary": "string",
    "properties": [],
    "influences": []
  },
  "correlated_hypotheses": []
}
```

## Noch nachzureichen

- Wertebereich bestaetigen, vermutlich 0..1.
- Bedeutung linker Pol.
- Bedeutung rechter Pol.
- Neutralwert.
- Berechnung aus Natal-Chart.
- Update-Regel durch Gespraeche.
- Maximale Verschiebung pro Gespraech.
- Rueckkehrlogik zum Basiswert.
- Temporär vs. persistent.

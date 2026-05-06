# Planet Slider Update Rules

Status: DRAFT + TO_BE_ADDED_FROM_CODE

## Zweck

Regeln, wann Gespraeche den dynamischen Planet-Slider veraendern duerfen.

## Grundregel

Der Natal-Basiswert bleibt Referenz. Gespraeche koennen nur den dynamischen aktuellen Wert beeinflussen.

## Erlaubte Update-Quellen

- Deep Dive mit klarer Nutzerantwort.
- Free Mode mit klarer spontaner Nutzerbestaetigung.
- Wiederholte konkrete Beispiele.
- Explizite Nutzerkorrektur.

## Nicht erlaubte Quellen

- Day Pulse allein.
- Fusion-Deutung allein.
- Stille.
- Lachen.
- "ja ja".
- reine Chartdaten.

## Erwartetes Update-Objekt

```json
{
  "planet_id": "mars",
  "slider_delta": 0.03,
  "direction": "toward_left_pole|toward_right_pole|stable",
  "change_reason": "string",
  "confidence": 0.0
}
```

## Noch nachzureichen

- Maximaler delta pro Session.
- Schwellenwerte.
- Persistenzregel.
- Rueckkehr zum Basiswert.

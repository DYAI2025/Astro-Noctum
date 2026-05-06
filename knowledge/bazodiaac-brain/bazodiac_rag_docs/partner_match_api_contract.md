# API Contract: get_partner_match / match_synastry

## Zweck

Partnerschafts-, Synastry- und Kompatibilitaetsanalyse.

## Eingabedaten

Pflicht:

```json
{
  "user_id": "string",
  "partner_birth_date": "YYYY-MM-DD",
  "partner_birth_place": "City, Country",
  "partner_time_known": true,
  "agent_type": "eve|levi"
}
```

Optional:

```json
{
  "partner_birth_time": "HH:MM"
}
```

## Bei unbekannter Geburtszeit

Agent sagt:

"Ohne Geburtszeit fehlen Aszendent und Stundensaeule. Die Analyse geht trotzdem, ist aber weniger scharf."

## Erwartete Antwortfelder

TO_BE_ADDED_FROM_CODE.

Erwartete konzeptionelle Felder:

```json
{
  "western_compatibility": {},
  "eastern_compatibility": {},
  "fusion_match": {
    "resonance_anchors": [],
    "friction_points": [],
    "growth_edges": []
  },
  "wuxing_comparison": {},
  "bazi_pillar_comparison": {}
}
```

## Deutungsregeln

- Keine Trennungs-/Zusammenbleib-Empfehlung.
- Keine Seelenverwandtenbehauptung.
- Keine Zukunftsprognose.
- Muster, Reibung, Ressourcen, Wachstumskanten.
- Jede Aussage mit Datenanker.

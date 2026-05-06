# Supabase Narrative Memory Schema

## Zweck

Uebersicht der geplanten Supabase-Tabellen fuer Eve/Levi Narrative Memory.

## Tabellen

- `eve_narrative_profiles`: ein Memory-Profil pro User.
- `eve_sessions`: gespeicherte Sessions mit Summary, Topics, Mode.
- `eve_anchors`: sieben Angelpunkte pro User.
- `eve_hypotheses`: aktive, initiale, ersetzte und archivierte Hypothesen.
- `eve_hypothesis_events`: Verlauf von Bestaetigungen, Widerspruechen, Anreicherungen.
- `eve_deviation_candidates`: konkurrierende oder ergaenzende Abweichungen.
- `eve_planet_states`: planetare Slider-/Natal-Kontexte pro User.
- `eve_signature_events`: semantische Events fuer Signaturbewegung.
- `eve_follow_up_hooks`: naechste Gespraechsanschluesse.
- `eve_mode_history`: optionales Routing-/Modus-Audit.

## Tool-Erweiterung

`save_conversation_eve` bzw. `save_conversation_summary` sollte um folgende Felder erweitert werden:

```json
{
  "mode": "deep_dive|free|day_pulse|fusion|partner_match|unknown",
  "active_planet": "string",
  "memory_update_json": "{}"
}
```

## Verarbeitung

Backend soll:

1. Narrative Profile upserten.
2. Session speichern.
3. Anchors initialisieren.
4. `memory_update_json` parsen.
5. Hypothesenupdates verarbeiten.
6. Abweichungen verarbeiten.
7. Planet States updaten.
8. Signature Events speichern.
9. Follow-up-Hooks speichern.

## RLS

TO_BE_ADDED:

- User darf eigene Daten lesen/loeschen.
- Agent/Service Role darf schreiben.
- Admin darf debuggen.

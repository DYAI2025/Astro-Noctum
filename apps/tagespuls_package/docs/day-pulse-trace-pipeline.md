# Pipeline: Tagespuls / Day Pulse-Trace

## Ziel

Ein User bekommt morgens einen kurzen Tagespuls. Erst wenn der User eine Figur aus dem Rat der sechs setzt, entsteht die Tagesdeutung.

## End-to-End-Flow

```text
1. nightly/early trigger
2. cosmic weather snapshot
3. user astro profile
4. fusion day vector
5. mode + intensity
6. aphorism selection
7. LLM Slot 2/3
8. store DailyPulse
9. client shows Phase 1
10. user selects archetype
11. LLM Phase 2
12. store DailyInterpretation
13. client renders Phase 2
```

## Schritt 1: Kosmisches Wetter

Quelle: `sky.bazodiac.space` oder interner `cosmic_weather_snapshots`-Service.

Beispieldaten:

```json
{
  "date": "2026-04-30",
  "moon_phase": "waxing",
  "jieqi": "gu yu",
  "solar_flux_f107": 115.2,
  "kp_index": 2.3,
  "transit_vector_wuxing": {"wood": 0.2, "fire": 0.1, "earth": 0.3, "metal": 0.1, "water": 0.3}
}
```

## Schritt 2: User-Profil

Noetig:

- `user_id`
- westliche Hauptfiguren: Sonne, Mond, Aszendent
- BaZi: Day-Master, Jahrestier, dominantes Wu-Xing-Element
- gespeicherter Wu-Xing-Basisvektor
- Sprache/Locale

## Schritt 3: Mode-Bestimmung

Der Engine-Layer berechnet `H` und `intensity`. Das LLM bekommt nur das Ergebnis, nicht die Aufgabe, selbst zu rechnen.

## Schritt 4: Aphorismus-Selektion

Der Production-Layer liest `packages/voice/data/aphorisms.json` und selektiert deterministisch.

Wichtig:

- gbrain/Obsidian ist nicht im Live-Request-Pfad.
- gbrain ist Kuration und Recherche.
- Production ist JSON/DB/Cache.

## Schritt 5: Tagespuls erzeugen

LLM-Prompt enthaelt:

- Aphorismus-Text
- Modus
- Intensitaet
- Sprache
- harte Slot-Regeln

Output:

```json
{
  "aphorism_id": "aph-0007",
  "slot_1": "Was du heute aus Angst verschiebst, wird morgen aus Gewohnheit liegen bleiben.",
  "slot_2": "Eine kleine Entscheidung reicht heute, wenn sie wirklich von dir kommt.",
  "slot_3": "Beginne dort, wo du sonst nach Erlaubnis suchst."
}
```

## Schritt 6: Wahl-Moment

Client zeigt die sechs Figuren als Tap-Optionen. Ohne Tap wird keine Phase 2 erzeugt.

## Schritt 7: Tagesdeutung erzeugen

LLM bekommt:

- `daily_pulse_id`
- gewaehlte Figur
- Modus
- Rest-Rat, nur fuer pulse/spannung
- Voice-Regeln

## Fehlerfaelle

| Fehler | Verhalten |
|---|---|
| kein approved Aphorismus | fallback auf internen neutralen, nicht-literarischen Satz mit `fallback=true` |
| LLM verletzt Wortzahl | verwerfen und neu generieren, maximal 2 Versuche |
| User waehlt nicht | Phase 1 bleibt final |
| gbrain nicht erreichbar | kein Live-Problem, weil nicht im Request-Pfad |
| Space-Weather fehlt | verwende letzten Snapshot, markiere `weather_stale=true` |

## Abbruchbedingungen

- keine Engine-Daten fuer User
- keine valide Locale
- kein legal nutzbarer Aphorismus-Pool

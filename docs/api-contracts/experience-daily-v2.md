# API Contract: POST /experience/daily (v2)

> **Schema**: `DAILY_EXPERIENCE_v2`  
> **Zweck**: Liefert das komplette tägliche Erlebnispaket — Narrativ + Daily Chart.  
> Kombiniert Western/Eastern/Fusion-Interpretation mit den Daten aus `/impact/active`.  
> Dies ist der **Dashboard-Hauptendpunkt**: ein Aufruf, alles was der User braucht.  
> 
> **Beziehung zu `/impact/active`**:  
> `/experience/daily` ruft intern `/impact/active` auf und fügt die LLM-generierten  
> Narrative (fusion.synthesis, western.summary, eastern.summary) hinzu.  
> Der `impact`-Block in der Response ist identisch mit der `/impact/active` Response.

---

## Request

```jsonc
POST /api/experience/daily
Content-Type: application/json
Authorization: Bearer <token>

{
  "birth": {
    "date": "1995-03-15",
    "time": "14:30:00",
    "tz": "Europe/Berlin",
    "lat": 52.52,
    "lon": 13.405
  },
  "soulprint_sectors": [0.12, 0.08, 0.15, 0.09, 0.14, 0.07, 0.11, 0.06, 0.05, 0.04, 0.03, 0.06],
  "quiz_sectors": [0.10, 0.15, 0.08, 0.09, 0.11, 0.07, 0.10, 0.08, 0.06, 0.05, 0.04, 0.07],
  "target_date": "2026-04-12",
  "locale": "de-DE",
  "birth_sign": "pisces",           // optional, für westliche Tages-Interpretation
  "include": ["impact"]             // optional, default: [] — wenn gesetzt, wird impact-Block eingebettet
}
```

### Was ist neu gegenüber v1
- `include: ["impact"]` — optionaler Parameter. Wenn gesetzt, wird der vollständige `/impact/active`-Datensatz als `impact`-Block in die Response eingebettet. Spart einen zweiten API-Call.
- `birth_sign` bleibt optional wie in v1

### Backwards Compatibility
- Ohne `include` ist die Response identisch mit der bestehenden v1 Response
- Alle bestehenden Felder bleiben erhalten: `western`, `eastern`, `fusion`, `resonance_badges`, `space_weather_score`, `top_sector`
- `impact` ist ein neues optionales Top-Level-Feld

---

## Response

```jsonc
{
  "date": "2026-04-12",

  // ═══ WESTERN INTERPRETATION ════════════════════════════════════════
  // LLM-generierte westliche Tagesdeutung
  "western": {
    "summary": "Der Tag steht unter dem Zeichen starker Mars-Energie...",
    "themes": ["Durchsetzungskraft", "Direktheit"],
    "caution": "Impulsive Entscheidungen könnten heute zu Konflikten führen.",
    "opportunity": "Guter Tag für körperliche Aktivität und klare Kommunikation.",
    "evidence": {
      "transit_sectors": [4, 2],
      "natal_focus": ["mars", "jupiter"],
      "day_master": "jia",
      "daily_pillar": { "stem": "jia", "branch": "yin" },
      "relation_to_day_master": "Holz-Tag nährt Feuer-Mars"
    }
  },

  // ═══ EASTERN INTERPRETATION ════════════════════════════════════════
  // LLM-generierte östliche Tagesdeutung (BaZi)
  "eastern": {
    "summary": "Der Holz-Tagesmeister Jia steht heute in Resonanz mit...",
    "themes": ["Wachstum", "Aufbruch"],
    "caution": "Zu viel Holz-Energie kann zu Sturheit führen.",
    "opportunity": "Holz nährt dein Feuer — idealer Tag für kreative Projekte.",
    "evidence": {
      "day_master": "jia",
      "daily_pillar": { "stem": "jia", "branch": "yin" },
      "relation_to_day_master": "Jia Holz in Yin-Zweig"
    }
  },

  // ═══ FUSION — Zusammenführung aller Systeme ════════════════════════
  // LLM-generiert: verbindet Western + Eastern + Impacts zu einem Narrativ
  "fusion": {
    "summary": "Starke Mars-Konjunktion trifft auf Holz-Tagesmeister.",
    "synthesis": "Heute spürst du eine klare Vorwärtsenergie. Mars aktiviert dein natales Feuer, während der Holz-Tagesmeister Jia das zusätzlich nährt. Eine seltene Kombination, die Klarheit und Entschlossenheit fördert.",
    "action": "Nutze die nächsten Stunden für Entscheidungen, die du vor dir hergeschoben hast.",
    "pushworthy": true,
    "push_text": "Mars-Konjunktion aktiv — dein Tag für klare Entscheidungen.",
    "harmony_index": 0.72,          // Kohärenzindex (identisch mit impact.harmony_index)
    "day_mode": "pulse",
    "night_harmony_index": 0.58,
    "night_mode": "pulse"
  },

  // ═══ RESONANZ-BADGES ═══════════════════════════════════════════════
  // Identisch mit impact.resonance_badges — hier für Backwards Compatibility
  "resonance_badges": [
    {
      "type": "transit",
      "label": "Mars Konjunktion",
      "sublabel": "natal Mars",
      "intensity": "hoch",
      "color": "#EF4444"
    },
    {
      "type": "space_weather",
      "label": "Geomagnetisch aktiv",
      "intensity": "mittel",
      "color": "#F59E0B"
    }
  ],

  "space_weather_score": 0.35,
  "top_sector": { "sign": "leo", "value": 0.91 },

  // ═══ IMPACT — eingebettet wenn include: ["impact"] ═════════════════
  // Vollständige /impact/active Response, eingebettet um zweiten Call zu sparen.
  // Nur vorhanden wenn Request "include": ["impact"] enthält.
  "impact": {
    "harmony_index": 0.72,
    "day_mode": "pulse",
    "intensity": 0.49,
    "night_harmony_index": 0.58,
    "night_mode": "pulse",

    "active_planets": [
      {
        "planet": "mars",
        "aspect": "conjunction",
        "orb": 2.4,
        "strength": "high",
        "is_retrograde": false,
        "natal_position": { "longitude": 132.45, "sign": "leo", "degree_in_sign": 12.45 },
        "transit_position": { "longitude": 134.85, "sign": "leo", "degree_in_sign": 14.85 },
        "sector": 4,
        "weight": 0.91,
        "bazi_resonance": {
          "element": "Feuer",
          "type": "gleichklang",
          "intensity": "stark"
        }
      },
      {
        "planet": "jupiter",
        "aspect": "conjunction",
        "orb": 2.3,
        "strength": "medium",
        "is_retrograde": false,
        "natal_position": { "longitude": 78.10, "sign": "gemini", "degree_in_sign": 18.10 },
        "transit_position": { "longitude": 80.40, "sign": "gemini", "degree_in_sign": 20.40 },
        "sector": 2,
        "weight": 0.77,
        "bazi_resonance": {
          "element": "Holz",
          "type": "naehrung",
          "intensity": "mittel"
        }
      }
    ],
    "active_planet_count": 2,

    "space_weather": {
      "kp_index": 3,
      "solar_pressure": 0.42,
      "xray_class": "C",
      "g_scale": "G0",
      "proton_flux": 1.2,
      "f107": 142.5,
      "events": [
        {
          "type": "geomagnetic_storm",
          "severity": "minor",
          "signature_weight": 0.15,
          "started_at": "2026-04-12T03:00:00Z",
          "expires_at": "2026-04-12T18:00:00Z",
          "description": "Leichter geomagnetischer Sturm durch koronales Loch"
        }
      ]
    },
    "space_weather_score": 0.35,

    "day_master": "jia",
    "day_master_element": "Holz",

    "evidence": {
      "resonance_score": 0.60,
      "resonance_formula": "harmony_index * 0.65 + solar_pressure * 0.35",
      "max_orb_used": 8.0,
      "aspects_considered": ["conjunction", "opposition", "trine", "square", "sextile"],
      "natal_chart_source": "computed",
      "transit_source": "computed",
      "space_weather_source": "noaa_v2"
    }
  },

  // ═══ META ══════════════════════════════════════════════════════════
  "meta": {
    "engine_version": "fufire-2.1",
    "generated_at": "2026-04-12T19:20:00Z"
  }
}
```

---

## Regeln

### Fusion Synthesis — Brand Voice
- `fusion.synthesis` ist der Haupttext den der User liest. Er muss sich aus den echten Werten ableiten.
- **Pflicht: Explizite Planetenreferenz.** `synthesis` muss die aktiven Planeten beim Namen nennen und ihre Wirkung aus `active_planets[]` ableiten. Keine abstrakten Zusammenfassungen ohne Planetenbezug. Beispiel: "Mars und Jupiter sind heute aktiv — Mars aktiviert dein natales Feuer (Konjunktion, orb 2.4°), Jupiter öffnet Wachstum durch Nährung deines Holz-Elements."
- **Erlaubt**: Sätze die auf konkrete Daten zeigen. "Mars aktiviert dein natales Feuer" → weil Mars conjunction natal Mars.
- **Verboten**: Leere Motivation. "Du bist voller Drive" ohne Bezug zu einem Wert.
- **Nachvollziehbarkeit**: Jede Aussage in synthesis/summary muss auf ein Feld in `impact` oder `evidence` rückführbar sein.
- **Adjektive mit Rückhalt**: "Stark" nur wenn strength=high. "Intensiv" nur wenn intensity > 0.7. Kein Schmücken ohne Datenbasis.

### Beziehung zwischen den Endpoints
```
┌──────────────────────┐     ┌────────────────────────────────┐
│  POST /impact/active │     │  POST /experience/daily        │
│                      │     │                                │
│  Daten-Layer:        │────▶│  Narrativ-Layer:               │
│  • Kohärenzindex     │     │  • western.summary (LLM)       │
│  • active_planets[]  │     │  • eastern.summary (LLM)       │
│  • space_weather     │     │  • fusion.synthesis (LLM)      │
│  • resonance_badges  │     │  • fusion.action (LLM)         │
│  • evidence          │     │                                │
│                      │     │  + eingebetteter impact-Block   │
└──────────────────────┘     └────────────────────────────────┘
```

- `/impact/active` = reine Daten, keine LLM-Texte, schnell, cacheable
- `/experience/daily` = Daten + LLM-Narrativ, langsamer, personalisiert
- Frontend kann beide separat oder nur `/experience/daily?include=impact` aufrufen

### Backwards Compatibility
- Bestehende Felder in DailyResponse bleiben alle erhalten:
  - `date`, `western`, `eastern`, `fusion`, `meta` → unverändert
  - `resonance_badges` → unverändert (auch in impact gespiegelt)
  - `space_weather_score` → unverändert (auch in impact gespiegelt)
  - `top_sector` → unverändert
- Neues Feld: `impact` (optional, nur bei include=["impact"])
- Bestehender Frontend-Code bricht nicht

### Error Responses
Identisch mit `/impact/active`. Bei `partial: true` werden Narrative trotzdem geliefert,
aber `impact.space_weather` kann default-Werte enthalten.

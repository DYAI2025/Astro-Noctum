# API Contract: POST /impact/active

> **Schema**: `ACTIVE_IMPACTS_v1`  
> **Zweck**: Liefert alle persönlich relevanten Einflüsse für einen User an einem bestimmten Tag.  
> Dies ist das **Daily Chart** — die Gesamtansicht aller aktiven Werte, die der User auf den ersten Blick sieht:  
> Kohärenzindex, aktive Planeten (relativ zum Natal Chart), kosmisches Wetter, Resonanz-Badges.  
> **Keine Interpretation hier** — nur nachvollziehbare Daten. Narrative kommen über `/experience/daily`.

---

## Request

```jsonc
POST /api/impact/active
Content-Type: application/json
Authorization: Bearer <token>

{
  "birth": {
    "date": "1995-03-15",           // ISO date
    "time": "14:30:00",             // HH:mm:ss, default "12:00:00"
    "tz": "Europe/Berlin",          // IANA timezone
    "lat": 52.52,                   // birth latitude
    "lon": 13.405                   // birth longitude
  },
  "soulprint_sectors": [0.12, 0.08, 0.15, 0.09, 0.14, 0.07, 0.11, 0.06, 0.05, 0.04, 0.03, 0.06],
  // 12 sectors, each 0–1, sum ≈ 1.0
  "quiz_sectors": [0.10, 0.15, 0.08, 0.09, 0.11, 0.07, 0.10, 0.08, 0.06, 0.05, 0.04, 0.07],
  // 12 sectors from Fusion Ring quiz, same format
  "target_date": "2026-04-12",     // ISO date, which day to compute
  "locale": "de-DE"                // "de-DE" | "en-US"
}
```

### Required fields
- `birth.date`, `birth.lat`, `birth.lon` — Ort ist **Pflicht**. Ohne Ort kein Natal Chart, ohne Natal Chart kein Daily Chart.
- `soulprint_sectors` (array of 12 numbers)
- `target_date`

### Optional fields
- `birth.time` → default `"12:00:00"` — Bei fehlender Uhrzeit wird 12:00 Mittag verwendet. Mond- und Aszendent-Berechnung wird ungenauer, aber das Chart ist vollständig. Frontend zeigt Hinweis: "Geburtszeit unbekannt — Mond- und Aszendent-Werte sind Näherungen."
- `birth.tz` → default `"Europe/Berlin"`
- `quiz_sectors` → default all zeros
- `locale` → default `"de-DE"`

### Invariante
Jeder User hat ein vollständiges Natal Chart. Es gibt keinen Fallback-Case ohne Chart. Wenn `birth.lat`/`birth.lon` fehlen → 400 Error, nicht stille Degradation.

---

## Response

```jsonc
{
  "schema": "ACTIVE_IMPACTS_v1",
  "date": "2026-04-12",

  // ═══ 1. KOHÄRENZINDEX ══════════════════════════════════════════════
  // Intern "harmony_index". Nach außen immer "Kohärenzindex".
  // Cosinus-Ähnlichkeit zwischen täglichem Wu-Xing-Vektor und Soulprint.
  "harmony_index": 0.72,           // number 0–1
  "day_mode": "pulse",             // "pulse" (≥ 0.50) | "trace" (< 0.50)
  "intensity": 0.49,               // |harmony - 0.45| / 0.55, normalized 0–1
  "night_harmony_index": 0.58,     // optional, for premium night-pulse (21–06h)
  "night_mode": "pulse",           // optional

  // ═══ 2. AKTIVE PLANETEN ════════════════════════════════════════════
  // Nur Planeten mit engem Aspekt (orb ≤ max_orb) zum Natal Chart.
  // Pool: moon, mercury, venus, mars, jupiter, saturn
  "active_planets": [
    {
      "planet": "mars",
      "aspect": "conjunction",     // conjunction | opposition | trine | square | sextile
      "orb": 2.4,                  // Grad-Abweichung vom exakten Aspekt
      "strength": "high",          // high (orb < 3) | medium (3–5) | low (5–8)
      "is_retrograde": false,

      // Positionen — für Nachvollziehbarkeit, nicht für User-Anzeige
      "natal_position": {
        "longitude": 132.45,
        "sign": "leo",
        "degree_in_sign": 12.45
      },
      "transit_position": {
        "longitude": 134.85,
        "sign": "leo",
        "degree_in_sign": 14.85
      },

      // Soulprint-Sektor (0–11) den dieser Transit beeinflusst
      "sector": 4,

      // Gewicht im Gesamtscore (0–1), abgeleitet aus orb + aspect-typ
      "weight": 0.91,

      // Wu-Xing Resonanz relativ zum Day Master
      "bazi_resonance": {
        "element": "Feuer",         // Holz | Feuer | Erde | Metall | Wasser
        "type": "gleichklang",      // gleichklang | naehrung | kontrolle | neutral
        "intensity": "stark"        // gering | mittel | stark
      }
    },
    {
      "planet": "jupiter",
      "aspect": "conjunction",
      "orb": 2.3,
      "strength": "medium",
      "is_retrograde": false,
      "natal_position": {
        "longitude": 78.10,
        "sign": "gemini",
        "degree_in_sign": 18.10
      },
      "transit_position": {
        "longitude": 80.40,
        "sign": "gemini",
        "degree_in_sign": 20.40
      },
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

  // ═══ 3. KOSMISCHES WETTER ══════════════════════════════════════════
  "space_weather": {
    "kp_index": 3,                  // 0–9, geomagnetische Aktivität
    "solar_pressure": 0.42,         // 0–1, computeSolarPressureScore(kp, xrayFlux, protonFlux)
    "xray_class": "C",              // A | B | C | M | X
    "g_scale": "G0",                // G0–G5 (NOAA Sturm-Skala)
    "proton_flux": 1.2,             // Protonen-Flux
    "f107": 142.5,                  // Solar Flux F10.7
    "events": [
      {
        "type": "geomagnetic_storm", // cme_arrival | flare | geomagnetic_storm | sep | hss
        "severity": "minor",
        "signature_weight": 0.15,   // Gewicht für Signatur-Modulation
        "started_at": "2026-04-12T03:00:00Z",
        "expires_at": "2026-04-12T18:00:00Z",
        "description": "Leichter geomagnetischer Sturm durch koronales Loch"
      }
    ]
  },
  "space_weather_score": 0.35,     // 0–1, Composite-Score aus allen Wetterdaten

  // ═══ 4. RESONANZ-BADGES ════════════════════════════════════════════
  // Visuelle Marker für das Dashboard. Jeder Badge zeigt eine aktive Resonanz.
  "resonance_badges": [
    {
      "type": "transit",            // transit | space_weather | sektor
      "label": "Mars Konjunktion",
      "sublabel": "natal Mars",     // optional
      "intensity": "hoch",          // hoch | mittel | niedrig
      "color": "#EF4444"            // hex, für Darstellung
    },
    {
      "type": "space_weather",
      "label": "Geomagnetisch aktiv",
      "intensity": "mittel",
      "color": "#F59E0B"
    }
  ],

  // ═══ 5. TAGESKONTEXT ═══════════════════════════════════════════════
  "top_sector": {                   // optional — stärkster Soulprint-Sektor des Tages
    "sign": "leo",
    "value": 0.91
  },

  "day_master": "jia",             // Tagesmeister (BaZi Himmelsstamm)
  "day_master_element": "Holz",    // Wu-Xing Element des Tagesmeisters

  // ═══ 6. EVIDENCE (Nachvollziehbarkeit) ═════════════════════════════
  // Jeder Wert muss rückverfolgbar sein. Keine Magic Numbers.
  "evidence": {
    "resonance_score": 0.60,
    "resonance_formula": "harmony_index * 0.65 + solar_pressure * 0.35",
    "resonance_weights": {              // Konfigurierbar, nicht hardcoded
      "harmony": 0.65,
      "solar_pressure": 0.35
    },
    "max_orb_used": 8.0,
    "aspects_considered": ["conjunction", "opposition", "trine", "square", "sextile"],
    "natal_chart_source": "computed",   // computed | cached
    "transit_source": "computed",        // computed | cached
    "space_weather_source": "noaa_v2"   // noaa_v1 | noaa_v2
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

### Aktive Planeten
- Pool ist **moon, mercury, venus, mars, jupiter, saturn** (Sonne/Uranus/Neptun/Pluto nicht im MVP)
- Ein Planet ist "aktiv" wenn mindestens ein Aspekt mit orb ≤ `max_orb` (default 8°) zum Natal Chart existiert
- Bei mehreren Aspekten für denselben Planeten: engsten nehmen
- `strength` Klassifizierung: `high` = orb < 3°, `medium` = 3–5°, `low` = 5–8°
- `weight` = `(1 - orb/max_orb) * aspect_weight`, wobei aspect_weight: conjunction=1.0, opposition=0.8, trine=0.7, square=0.6, sextile=0.5

### BaZi Resonanz
- `element`: abgeleitet aus Planet → Element Mapping (Mars→Feuer, Jupiter→Holz, Saturn→Erde, Venus→Metall, Mercury→Wasser, Moon→Wasser)
- `type`: Wu-Xing Zyklusvergleich zwischen Planeten-Element und Day-Master-Element
  - gleichklang = selbes Element
  - naehrung = Planet nährt Day Master (Erzeugungszyklus)
  - kontrolle = Planet kontrolliert Day Master (Kontrollzyklus)
  - neutral = kein direkter Zyklus
- `intensity`: basiert auf `weight` des Aspekts — stark (≥0.7), mittel (0.4–0.7), gering (<0.4)

### Kohärenzindex
- Wird auch in `/experience/daily` unter `fusion.harmony_index` geliefert
- Redundanz ist gewollt — `/impact/active` ist die Single Source für das Daily Chart
- Berechnung: Cosinus-Ähnlichkeit zwischen täglichem Wu-Xing-Transitvektor und Soulprint-Vektor

### Kein `feeling`-Feld
- Keine vorgenerierten Interpretationstexte in dieser Response
- Die narrative Deutung gehört in `/experience/daily` (LLM-Layer)
- Das Frontend leitet Anzeige-Sätze aus den strukturierten Werten ab:
  - `planet` + `strength` + `bazi_resonance.type` + `bazi_resonance.element`
  - Beispiel: Mars, high, gleichklang, Feuer → "Deine Mars-Energie ist heute stark — Feuer-Gleichklang"

---

## Error Responses

```jsonc
// 400 — Validation
{ "error": "INVALID_REQUEST", "message": "birth.date is required", "field": "birth.date" }

// 401 — Auth
{ "error": "UNAUTHORIZED", "message": "Invalid or expired token" }

// 422 — Computation failed
{ "error": "COMPUTATION_FAILED", "message": "Natal chart computation failed", "detail": "..." }

// 503 — Upstream unavailable
{ "error": "UPSTREAM_UNAVAILABLE", "message": "Space weather data temporarily unavailable", "partial": true }
// Bei partial=true: Response wird trotzdem geliefert, aber space_weather ist leer/default
```

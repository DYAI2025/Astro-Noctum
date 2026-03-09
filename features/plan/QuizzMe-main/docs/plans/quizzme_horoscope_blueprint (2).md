# QuizzMe Horoskop-System — Vollständiger Implementation Blueprint

---

## Architektur-Übersicht

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         QUIZZME HOROSCOPE ENGINE                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────────┐ │
│  │   USER PROFILE  │───▶│  ASTRO CALCULATOR│───▶│   HOROSCOPE GENERATOR      │ │
│  │                 │    │                 │    │                             │ │
│  │ • birth_date    │    │ • Ephemeris     │    │ • Transit-Deutungen         │ │
│  │ • birth_time    │    │ • Houses        │    │ • Persönlichkeits-Profile   │ │
│  │ • birth_place   │    │ • Aspects       │    │ • Liebes-Interpretationen   │ │
│  │ • tier (free/   │    │ • Transits      │    │ • Wochen-Synthesen          │ │
│  │   premium)      │    │                 │    │                             │ │
│  └─────────────────┘    └─────────────────┘    └─────────────────────────────┘ │
│           │                     │                           │                   │
│           ▼                     ▼                           ▼                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        CONTENT DELIVERY LAYER                           │   │
│  │                                                                         │   │
│  │   FREEMIUM                          │   PREMIUM                         │   │
│  │   ─────────                         │   ─────────                       │   │
│  │   ✓ Tägliches Sonnenzeichen-        │   ✓ Alles aus Freemium           │   │
│  │     Horoskop (Transit → Sonne)      │   ✓ Vollständige Transit-Matrix   │   │
│  │   ✓ Wöchentliche Übersicht          │   ✓ Persönliches Liebeshoroskop   │   │
│  │   ✓ Aktuelle Planetenpositionen     │   ✓ Aszendent-Deutungen           │   │
│  │   ✓ Mondphase                       │   ✓ Planetenstunden               │   │
│  │                                     │   ✓ Geburtshoroskop-Analyse       │   │
│  │                                     │   ✓ Langfristige Transite         │   │
│  │                                     │   ✓ Mundane Aspekte               │   │
│  └─────────────────────────────────────┴───────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Datenmodell

### 1.1 User Birth Profile

```json
{
  "user_birth_profile": {
    "user_id": "uuid",
    "birth_date": "1980-06-24",
    "birth_time": "15:20:00",
    "birth_time_known": true,
    "birth_location": {
      "city": "Hannover",
      "country": "DE",
      "latitude": 52.3759,
      "longitude": 9.7320,
      "timezone": "Europe/Berlin",
      "utc_offset_birth": 2
    },
    "subscription_tier": "premium|freemium"
  }
}
```

### 1.2 Natal Chart (Radix)

```json
{
  "natal_chart": {
    "user_id": "uuid",
    "calculated_at": "ISO-8601",
    "julian_date": 2444420.14583,
    
    "planets": {
      "sun": {
        "longitude": 92.847,
        "sign": "cancer",
        "degree_in_sign": 2.847,
        "house": 9,
        "retrograde": false,
        "display": "2°50' Krebs"
      },
      "moon": { /* ... */ },
      "mercury": { /* ... */ },
      "venus": { /* ... */ },
      "mars": { /* ... */ },
      "jupiter": { /* ... */ },
      "saturn": { /* ... */ },
      "uranus": { /* ... */ },
      "neptune": { /* ... */ },
      "pluto": { /* ... */ },
      "north_node": { /* ... */ },
      "chiron": { /* ... */ },
      "lilith": { /* ... */ }
    },
    
    "angles": {
      "ascendant": {
        "longitude": 235.412,
        "sign": "scorpio",
        "degree_in_sign": 25.412,
        "display": "25°24' Skorpion"
      },
      "mc": {
        "longitude": 152.873,
        "sign": "virgo", 
        "degree_in_sign": 2.873,
        "display": "2°52' Jungfrau"
      },
      "ic": { /* automatisch MC + 180° */ },
      "descendant": { /* automatisch ASC + 180° */ }
    },
    
    "houses": {
      "system": "placidus",
      "cusps": [235.412, 265.3, 295.1, 332.873, 8.5, 38.2, 55.412, 85.3, 115.1, 152.873, 188.5, 218.2]
    },
    
    "aspects": [
      {
        "planet1": "sun",
        "planet2": "moon",
        "aspect": "trine",
        "orb": 2.34,
        "applying": true,
        "strength": "strong"
      }
    ],
    
    "sun_sign": "cancer",
    "moon_sign": "pisces",
    "rising_sign": "scorpio"
  }
}
```

### 1.3 Daily Transit Data

```json
{
  "daily_transits": {
    "date": "2025-12-23",
    "user_id": "uuid",
    
    "current_planets": {
      "sun": { "longitude": 271.5, "sign": "capricorn", "degree": "1°30'" },
      "moon": { "longitude": 156.2, "sign": "virgo", "degree": "6°12'" },
      "mercury": { /* ... */ },
      "venus": { /* ... */ },
      "mars": { /* ... */ },
      "jupiter": { "longitude": 72.3, "sign": "gemini", "degree": "12°18'", "retrograde": true },
      "saturn": { /* ... */ },
      "uranus": { /* ... */ },
      "neptune": { /* ... */ },
      "pluto": { /* ... */ }
    },
    
    "active_transits": [
      {
        "transit_planet": "jupiter",
        "natal_planet": "uranus",
        "aspect": "trine",
        "orb": 0.85,
        "exact_date": "2025-12-28",
        "period": {
          "start": "2025-09-15",
          "end": "2026-05-30"
        },
        "importance": 3,
        "category": "long_term",
        "is_retrograde_transit": true
      },
      {
        "transit_planet": "moon",
        "natal_planet": "sun",
        "aspect": "sextile",
        "orb": 1.2,
        "exact_date": "2025-12-23T14:30:00",
        "period": {
          "start": "2025-12-23T08:00:00",
          "end": "2025-12-23T20:00:00"
        },
        "importance": 1,
        "category": "short_term"
      }
    ],
    
    "selected_transit": {
      "transit_id": "jupiter_trine_uranus_2025",
      "headline": "Selbstverwirklichung",
      "importance_stars": 3
    },
    
    "moon_phase": {
      "phase": "waning_crescent",
      "illumination": 0.12,
      "phase_name": "Abnehmender Mond",
      "next_new_moon": "2025-12-30T22:27:00Z"
    },
    
    "planetary_day": "mars",
    "planetary_hour_current": "jupiter"
  }
}
```

---

## 2. Astronomische Berechnungsformeln

### 2.1 Julian Date Conversion

```python
def gregorian_to_julian_date(year: int, month: int, day: float) -> float:
    """
    Konvertiert Gregorianisches Datum zu Julianischem Datum.
    Tag kann Dezimalstellen für Uhrzeit enthalten (z.B. 24.5 = 24. Mittag)
    
    Formel nach Meeus, Astronomical Algorithms, 2nd ed.
    """
    if month <= 2:
        year -= 1
        month += 12
    
    A = int(year / 100)
    B = 2 - A + int(A / 4)
    
    JD = int(365.25 * (year + 4716)) + int(30.6001 * (month + 1)) + day + B - 1524.5
    
    return JD
```

### 2.2 Sternzeit-Berechnung (GMST)

```python
import math

def calculate_gmst(julian_date: float) -> float:
    """
    Berechnet Greenwich Mean Sidereal Time in Stunden.
    
    Formel: IAU 1982 Expression
    """
    # Julianische Jahrhunderte seit J2000.0
    T = (julian_date - 2451545.0) / 36525.0
    
    # GMST um 0h UT in Sekunden
    gmst_seconds = (
        24110.54841 +
        8640184.812866 * T +
        0.093104 * T**2 -
        6.2e-6 * T**3
    )
    
    # Konvertiere zu Stunden und normalisiere auf 0-24
    gmst_hours = (gmst_seconds / 3600.0) % 24.0
    
    return gmst_hours


def calculate_local_sidereal_time(gmst: float, longitude: float, ut_hours: float) -> float:
    """
    Berechnet Local Sidereal Time.
    
    Args:
        gmst: Greenwich Mean Sidereal Time um 0h UT (Stunden)
        longitude: Geographische Länge (Grad, positiv = Ost)
        ut_hours: Universal Time als Dezimalstunden
    
    Returns:
        Local Sidereal Time in Grad (0-360)
    """
    # Sternzeit-Fortschritt: 1 Sonnenstunde = 1.00273790935 Sternzeitstunden
    sidereal_rate = 1.00273790935
    
    # LST in Stunden
    lst_hours = gmst + (ut_hours * sidereal_rate) + (longitude / 15.0)
    
    # Normalisiere auf 0-24
    lst_hours = lst_hours % 24.0
    
    # Konvertiere zu Grad
    lst_degrees = lst_hours * 15.0
    
    return lst_degrees
```

### 2.3 Aszendent-Berechnung

```python
def calculate_ascendant(lst_degrees: float, latitude: float, obliquity: float = 23.4397) -> float:
    """
    Berechnet den Aszendenten.
    
    Formel der sphärischen Trigonometrie:
    tan(ASC) = -cos(LST) / (sin(ε) * tan(φ) + cos(ε) * sin(LST))
    
    Args:
        lst_degrees: Local Sidereal Time in Grad
        latitude: Geographische Breite in Grad
        obliquity: Schiefe der Ekliptik in Grad (ε)
    
    Returns:
        Aszendent in ekliptikaler Länge (Grad)
    """
    # Konvertiere zu Radiant
    lst_rad = math.radians(lst_degrees)
    lat_rad = math.radians(latitude)
    obl_rad = math.radians(obliquity)
    
    # Berechne Aszendent
    y = -math.cos(lst_rad)
    x = math.sin(obl_rad) * math.tan(lat_rad) + math.cos(obl_rad) * math.sin(lst_rad)
    
    asc_rad = math.atan2(y, x)
    asc_degrees = math.degrees(asc_rad)
    
    # Normalisiere auf 0-360°
    if asc_degrees < 0:
        asc_degrees += 360
    
    return asc_degrees


def calculate_mc(lst_degrees: float, obliquity: float = 23.4397) -> float:
    """
    Berechnet das Medium Coeli (MC).
    
    Formel:
    tan(MC) = tan(LST) / cos(ε)
    
    MC ist jener Punkt der Ekliptik, der zum gegebenen Zeitpunkt 
    am höchsten über dem Horizont kulminiert.
    """
    lst_rad = math.radians(lst_degrees)
    obl_rad = math.radians(obliquity)
    
    mc_rad = math.atan(math.tan(lst_rad) / math.cos(obl_rad))
    mc_degrees = math.degrees(mc_rad)
    
    # Quadrantenkorrektur: MC muss im gleichen Halbkreis wie LST liegen
    if lst_degrees >= 0 and lst_degrees < 180:
        if mc_degrees < 0:
            mc_degrees += 180
    else:  # lst_degrees >= 180
        if mc_degrees >= 0:
            mc_degrees += 180
        else:
            mc_degrees += 360
    
    return mc_degrees % 360
```

### 2.4 Häusersystem: Placidus

```python
def calculate_placidus_houses(mc: float, asc: float, latitude: float, obliquity: float = 23.4397) -> list:
    """
    Berechnet die Häuserspitzen nach Placidus.
    
    Placidus teilt die Zeit, die ein Grad der Ekliptik benötigt, 
    um vom Horizont zum Meridian zu wandern, in drei gleiche Teile.
    
    Dies erfordert iterative Berechnung für Häuser 2, 3, 11, 12.
    
    Returns:
        Liste mit 12 Häuserspitzen in Grad (Index 0 = Haus 1 = ASC)
    """
    cusps = [0.0] * 12
    
    # Haus 1 = ASC, Haus 10 = MC
    cusps[0] = asc
    cusps[9] = mc
    
    # Haus 4 = IC (gegenüber MC)
    cusps[3] = (mc + 180) % 360
    
    # Haus 7 = Deszendent (gegenüber ASC)
    cusps[6] = (asc + 180) % 360
    
    lat_rad = math.radians(latitude)
    obl_rad = math.radians(obliquity)
    
    # Iterative Berechnung für Häuser 11, 12, 2, 3
    for house_index, fraction in [(10, 1/3), (11, 2/3), (1, 1/3), (2, 2/3)]:
        # Semi-arc Berechnung
        # Dies ist eine vereinfachte Näherung - vollständige Placidus 
        # erfordert Newton-Raphson-Iteration
        
        ra_mc = cusps[9]  # Vereinfachung: MC ≈ RAMC für diese Näherung
        
        if house_index in [10, 11]:
            # Häuser 11, 12 (zwischen MC und ASC)
            target_ra = ra_mc + fraction * 90
        else:
            # Häuser 2, 3 (zwischen ASC und IC)
            target_ra = cusps[0] + fraction * 90
        
        target_ra = target_ra % 360
        
        # Konvertiere RA zu ekliptikaler Länge (vereinfacht)
        cusps[house_index] = _ra_to_ecliptic_longitude(target_ra, obl_rad)
    
    # Häuser 5, 6, 8, 9 sind gegenüber von 11, 12, 2, 3
    cusps[4] = (cusps[10] + 180) % 360
    cusps[5] = (cusps[11] + 180) % 360
    cusps[7] = (cusps[1] + 180) % 360
    cusps[8] = (cusps[2] + 180) % 360
    
    return cusps


def _ra_to_ecliptic_longitude(ra: float, obliquity_rad: float) -> float:
    """Hilfsfunktion: Konvertiert Rektaszension zu ekliptikaler Länge."""
    ra_rad = math.radians(ra)
    
    lon_rad = math.atan2(
        math.sin(ra_rad) * math.cos(obliquity_rad),
        math.cos(ra_rad)
    )
    
    return math.degrees(lon_rad) % 360
```

### 2.5 Aspekt-Berechnung

```python
ASPECTS = {
    "conjunction": {"angle": 0, "orb_major": 10, "orb_minor": 6, "symbol": "☌"},
    "opposition": {"angle": 180, "orb_major": 10, "orb_minor": 6, "symbol": "☍"},
    "trine": {"angle": 120, "orb_major": 8, "orb_minor": 5, "symbol": "△"},
    "square": {"angle": 90, "orb_major": 8, "orb_minor": 5, "symbol": "□"},
    "sextile": {"angle": 60, "orb_major": 6, "orb_minor": 4, "symbol": "⚹"},
    "quincunx": {"angle": 150, "orb_major": 3, "orb_minor": 2, "symbol": "⚻"},
    "semisextile": {"angle": 30, "orb_major": 2, "orb_minor": 1, "symbol": "⚺"},
    "semisquare": {"angle": 45, "orb_major": 2, "orb_minor": 1, "symbol": "∠"},
    "sesquiquadrate": {"angle": 135, "orb_major": 2, "orb_minor": 1, "symbol": "⚼"}
}

# Major planets get larger orbs
MAJOR_PLANETS = {"sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn"}


def calculate_aspect(planet1_lon: float, planet2_lon: float, 
                     planet1_name: str, planet2_name: str) -> dict | None:
    """
    Prüft ob zwei Planeten einen Aspekt bilden.
    
    Args:
        planet1_lon: Ekliptikale Länge des ersten Planeten
        planet2_lon: Ekliptikale Länge des zweiten Planeten
        planet1_name: Name des ersten Planeten
        planet2_name: Name des zweiten Planeten
    
    Returns:
        Aspekt-Dictionary oder None wenn kein Aspekt
    """
    # Berechne kürzeste Distanz
    diff = abs(planet1_lon - planet2_lon)
    if diff > 180:
        diff = 360 - diff
    
    # Bestimme Orb-Kategorie
    is_major_pair = planet1_name in MAJOR_PLANETS and planet2_name in MAJOR_PLANETS
    orb_key = "orb_major" if is_major_pair else "orb_minor"
    
    for aspect_name, aspect_data in ASPECTS.items():
        orb = aspect_data[orb_key]
        angle = aspect_data["angle"]
        
        deviation = abs(diff - angle)
        
        if deviation <= orb:
            # Aspekt gefunden
            # Berechne ob der Aspekt sich annähert oder entfernt
            # (vereinfacht - echte Berechnung benötigt Geschwindigkeiten)
            
            return {
                "aspect": aspect_name,
                "angle": angle,
                "orb": round(deviation, 2),
                "symbol": aspect_data["symbol"],
                "is_applying": deviation < orb / 2,  # Näherung
                "strength": _calculate_aspect_strength(deviation, orb)
            }
    
    return None


def _calculate_aspect_strength(deviation: float, max_orb: float) -> str:
    """Berechnet die Stärke eines Aspekts basierend auf dem Orbis."""
    ratio = deviation / max_orb
    if ratio < 0.3:
        return "strong"
    elif ratio < 0.7:
        return "medium"
    else:
        return "weak"
```

### 2.6 Transit-Berechnung

```python
def find_active_transits(natal_chart: dict, current_planets: dict, 
                         date: str, importance_threshold: int = 1) -> list:
    """
    Findet alle aktiven Transite zwischen aktuellen Planetenpositionen 
    und Geburtshoroskop.
    
    Args:
        natal_chart: Geburtshoroskop-Daten
        current_planets: Aktuelle Planetenpositionen
        date: Aktuelles Datum (ISO-Format)
        importance_threshold: Minimale Wichtigkeit (1-3)
    
    Returns:
        Liste sortierter Transite nach Wichtigkeit
    """
    TRANSIT_IMPORTANCE = {
        # Äußere Planeten transitieren langsam = wichtiger für Langzeit-Themen
        ("jupiter", "sun"): 3,
        ("jupiter", "moon"): 2,
        ("jupiter", "ascendant"): 3,
        ("saturn", "sun"): 3,
        ("saturn", "moon"): 3,
        ("saturn", "ascendant"): 3,
        ("uranus", "sun"): 3,
        ("uranus", "moon"): 3,
        ("neptune", "sun"): 3,
        ("pluto", "sun"): 3,
        
        # Innere Planeten = kurzfristige Auslöser
        ("sun", "sun"): 1,
        ("sun", "moon"): 1,
        ("moon", "sun"): 1,
        ("moon", "moon"): 1,
        ("mercury", "mercury"): 1,
        ("venus", "venus"): 2,
        ("mars", "mars"): 2,
    }
    
    transits = []
    
    # Transit-Planeten: Alle außer Mond (der für Minutenwechsel zu schnell ist)
    transit_planets = ["sun", "mercury", "venus", "mars", "jupiter", 
                       "saturn", "uranus", "neptune", "pluto"]
    
    # Natal-Punkte: Planeten + Winkel
    natal_points = list(natal_chart["planets"].keys()) + ["ascendant", "mc"]
    
    for t_planet in transit_planets:
        t_lon = current_planets[t_planet]["longitude"]
        t_retrograde = current_planets[t_planet].get("retrograde", False)
        
        for n_point in natal_points:
            if n_point in natal_chart["planets"]:
                n_lon = natal_chart["planets"][n_point]["longitude"]
            elif n_point in natal_chart["angles"]:
                n_lon = natal_chart["angles"][n_point]["longitude"]
            else:
                continue
            
            aspect = calculate_aspect(t_lon, n_lon, t_planet, n_point)
            
            if aspect:
                importance = TRANSIT_IMPORTANCE.get(
                    (t_planet, n_point), 
                    TRANSIT_IMPORTANCE.get((t_planet, "sun"), 1)
                )
                
                if importance >= importance_threshold:
                    transits.append({
                        "transit_planet": t_planet,
                        "natal_point": n_point,
                        "aspect": aspect["aspect"],
                        "orb": aspect["orb"],
                        "strength": aspect["strength"],
                        "importance": importance,
                        "is_retrograde": t_retrograde,
                        "category": "long_term" if t_planet in ["jupiter", "saturn", "uranus", "neptune", "pluto"] else "short_term"
                    })
    
    # Sortiere nach Wichtigkeit (absteigend), dann nach Orbis (aufsteigend)
    transits.sort(key=lambda x: (-x["importance"], x["orb"]))
    
    return transits
```

---

## 3. Content-Generierung

### 3.1 Deutungs-Datenbank-Schema

```json
{
  "transit_interpretations": {
    "jupiter_trine_uranus": {
      "id": "jupiter_trine_uranus",
      "title": "Selbstverwirklichung",
      "importance": 3,
      "category": "growth_opportunity",
      
      "general_text": {
        "intro": "Während vieler Monate gültig: Unter diesem Einfluss sind Sie ganz stark von dem Bedürfnis motiviert, sich zu verwirklichen und etwas zu tun, das von der normalen Routine völlig abweicht.",
        "body": "Sie möchten eine neue Art von Freiheit erlangen und bislang unbekannte Dimensionen des Lebens entdecken. Vielleicht suchen Sie nach innerer Wahrheit auf metaphysischem oder philosophischem Wege.",
        "advice": "Wenn so etwas auf Sie zukommt, müssen Sie Ihren Vorteil daraus ziehen! Es handelt sich um einen jener seltenen Augenblicke, in denen Sie nicht zögern dürfen, ehe Sie handeln.",
        "keywords": ["Innovation", "Freiheit", "Glück", "Durchbruch", "Erkenntnis"]
      },
      
      "love_text": {
        "intro": "In der Liebe zeigt sich dieser Transit als plötzliche Begegnung oder als überraschende Wendung in einer bestehenden Beziehung.",
        "body": "Sie ziehen Partner an, die unkonventionell sind und Ihren Horizont erweitern. Bestehende Beziehungen bekommen frischen Wind.",
        "advice": "Lassen Sie sich auf das Unerwartete ein. Die interessantesten Verbindungen entstehen jetzt nicht durch Planung, sondern durch Offenheit."
      },
      
      "retrograde_modifier": "Da Jupiter rückläufig ist, handelt es sich um eine Phase der inneren Verarbeitung. Die beschriebenen Chancen zeigen sich weniger im Außen als in Ihrer Innenwelt.",
      
      "house_modifiers": {
        "1": "Diese Energie manifestiert sich besonders in Ihrer persönlichen Ausstrahlung und Ihrem Auftreten.",
        "7": "Partnerschaften und enge Beziehungen werden zur Bühne dieser Entwicklung.",
        "10": "Ihre Karriere und öffentliche Rolle stehen im Fokus dieser Transformation."
      }
    }
  }
}
```

### 3.2 Template-Engine für Personalisierung

```python
from typing import Optional
from datetime import date


def generate_daily_horoscope(
    natal_chart: dict,
    transits: list,
    user_tier: str,
    target_date: date
) -> dict:
    """
    Generiert das personalisierte Tageshoroskop.
    
    Freemium: Nur der wichtigste Transit zur Sonne
    Premium: Alle relevanten Transite + Häuser + Liebeshoroskop
    """
    
    # Wähle den prominentesten Transit
    primary_transit = transits[0] if transits else None
    
    output = {
        "date": target_date.isoformat(),
        "user_name": natal_chart.get("user_name", ""),
        "sun_sign": natal_chart["sun_sign"],
        "moon_sign": natal_chart.get("moon_sign"),
        "rising_sign": natal_chart.get("rising_sign"),
    }
    
    # === FREEMIUM CONTENT ===
    output["freemium"] = {
        "daily_horoscope": {
            "headline": "Ihr Tagesimpuls",
            "transit_display": _format_transit_display(primary_transit),
            "text": _get_transit_text(primary_transit, "general"),
            "importance_stars": primary_transit["importance"] if primary_transit else 0,
            "period": _calculate_transit_period(primary_transit)
        },
        "current_planets": _format_current_planets_simple(),
        "moon_phase": _get_moon_phase(target_date)
    }
    
    # === PREMIUM CONTENT ===
    if user_tier == "premium":
        output["premium"] = {
            "love_horoscope": {
                "headline": "Liebe & Beziehung",
                "text": _get_transit_text(primary_transit, "love"),
                "additional_transits": [
                    _format_love_transit(t) for t in transits 
                    if _is_love_relevant(t)
                ][:3]  # Max 3 zusätzliche Love-Transite
            },
            
            "all_transits": [
                {
                    "transit_display": _format_transit_display(t),
                    "headline": INTERPRETATIONS[_get_transit_key(t)]["title"],
                    "summary": _get_transit_text(t, "general")[:200] + "...",
                    "importance": t["importance"],
                    "period": _calculate_transit_period(t)
                }
                for t in transits[:10]
            ],
            
            "long_term_themes": [
                _format_long_term_transit(t) 
                for t in transits 
                if t["category"] == "long_term"
            ],
            
            "planetary_hours": _calculate_planetary_hours(
                target_date, 
                natal_chart["birth_location"]
            ),
            
            "ascendant_transit": _get_ascendant_transit(transits),
            
            "house_focus": _determine_house_focus(transits, natal_chart)
        }
    
    return output


def _format_transit_display(transit: dict) -> str:
    """Formatiert einen Transit für die Anzeige."""
    if not transit:
        return ""
    
    PLANET_SYMBOLS = {
        "sun": "☉", "moon": "☽", "mercury": "☿", "venus": "♀", 
        "mars": "♂", "jupiter": "♃", "saturn": "♄",
        "uranus": "♅", "neptune": "♆", "pluto": "♇",
        "ascendant": "AC", "mc": "MC"
    }
    
    ASPECT_SYMBOLS = {
        "conjunction": "☌", "opposition": "☍", "trine": "△",
        "square": "□", "sextile": "⚹", "quincunx": "⚻"
    }
    
    t_symbol = PLANET_SYMBOLS.get(transit["transit_planet"], "?")
    n_symbol = PLANET_SYMBOLS.get(transit["natal_point"], "?")
    a_symbol = ASPECT_SYMBOLS.get(transit["aspect"], "?")
    
    retro = "℞" if transit.get("is_retrograde") else ""
    
    return f"{t_symbol}{retro} {a_symbol} {n_symbol}"


def _is_love_relevant(transit: dict) -> bool:
    """Prüft ob ein Transit für das Liebeshoroskop relevant ist."""
    love_planets = {"venus", "mars", "moon"}
    love_houses = {5, 7, 8}  # Liebe, Partnerschaft, Intimität
    
    return (
        transit["transit_planet"] in love_planets or
        transit["natal_point"] in love_planets or
        transit.get("natal_house") in love_houses
    )
```

---

## 4. Freemium vs Premium Feature-Matrix

| Feature | Freemium | Premium |
|---------|----------|---------|
| **Tägliches Horoskop** | ✓ Haupttransit (Sonne) | ✓ Alle aktiven Transite |
| **Wochenhoroskop** | ✓ Sonntags (vereinfacht) | ✓ Detailliert mit allen Planeten |
| **Liebeshoroskop** | ✗ | ✓ Täglich |
| **Aszendent-Deutung** | ✗ (nur Anzeige) | ✓ Volle Deutung |
| **Mondphase** | ✓ Anzeige | ✓ + Persönliche Bedeutung |
| **Aktuelle Planeten** | ✓ Positionen | ✓ + Transite zu Radix |
| **Langfristige Themen** | ✗ | ✓ Alle (Jupiter-Pluto) |
| **Planetenstunden** | ✗ | ✓ Für jeden Tag |
| **Geburtshoroskop** | ✓ Basis (Zeichen) | ✓ Vollanalyse |
| **Häuser** | ✗ | ✓ Alle 12 mit Bedeutung |
| **Mundan-Aspekte** | ✗ | ✓ Weltgeschehen |
| **Historische Ansicht** | 3 Tage | 5 Jahre |
| **PDF-Export** | ✗ | ✓ |
| **Werbefrei** | ✗ | ✓ |

---

## 5. API-Endpunkte

```yaml
# QuizzMe Horoscope API Specification

base_url: /api/v1/horoscope

endpoints:

  # --- USER PROFILE ---
  
  POST /profile:
    description: "Erstellt/aktualisiert Geburtsdaten"
    request:
      birth_date: string (YYYY-MM-DD)
      birth_time: string (HH:MM) | null
      birth_location: 
        city: string
        country: string (ISO 3166-1 alpha-2)
    response:
      natal_chart: NatalChart
      
  GET /profile:
    description: "Ruft Geburtsprofil ab"
    response:
      user_birth_profile: UserBirthProfile
      natal_chart: NatalChart

  # --- DAILY HOROSCOPE ---
  
  GET /daily:
    description: "Tageshoroskop für heute"
    query_params:
      date: string (YYYY-MM-DD) | default: today
    response:
      freemium: DailyHoroscopeFreemium
      premium: DailyHoroscopePremium | null  # null wenn User != premium

  GET /daily/love:
    description: "Liebeshoroskop (Premium)"
    requires: premium_subscription
    response:
      love_horoscope: LoveHoroscope

  # --- WEEKLY HOROSCOPE ---
  
  GET /weekly:
    description: "Wochenhoroskop (Sonntags generiert)"
    query_params:
      week_start: string (YYYY-MM-DD) | default: current_week
    response:
      week_overview: WeeklyHoroscope
      daily_highlights: DailyHighlight[]

  # --- CURRENT SKY ---
  
  GET /planets/current:
    description: "Aktuelle Planetenpositionen"
    response:
      planets: CurrentPlanets
      moon_phase: MoonPhase
      retrograde_planets: string[]

  GET /planets/birth:
    description: "Planetenpositionen bei Geburt"
    response:
      planets: BirthPlanets
      houses: Houses
      aspects: Aspect[]

  # --- TRANSITS ---
  
  GET /transits/active:
    description: "Alle aktiven Transite"
    requires: premium_subscription
    query_params:
      category: "short_term" | "long_term" | "all"
      min_importance: 1 | 2 | 3
    response:
      transits: Transit[]
      long_term_themes: LongTermTheme[]

  # --- PLANETARY HOURS (Premium) ---
  
  GET /planetary-hours:
    description: "Planetenstunden für einen Tag"
    requires: premium_subscription
    query_params:
      date: string (YYYY-MM-DD) | default: today
    response:
      planetary_day: PlanetaryDay
      hours: PlanetaryHour[]
      sunrise: datetime
      sunset: datetime
```

---

## 6. UI/UX Flow-Konzept

### 6.1 Onboarding Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                     QUIZZME HOROSCOPE                            │
│                                                                  │
│          🌟 Entdecke dein persönliches Sternenbild              │
│                                                                  │
│    ┌────────────────────────────────────────────────────────┐   │
│    │                                                        │   │
│    │     Wann wurdest du geboren?                          │   │
│    │                                                        │   │
│    │     ┌─────────────────────────────────────────────┐   │   │
│    │     │  📅  24. Juni 1980                          │   │   │
│    │     └─────────────────────────────────────────────┘   │   │
│    │                                                        │   │
│    │     Um wie viel Uhr? (optional, aber wichtig!)        │   │
│    │                                                        │   │
│    │     ┌─────────────────────────────────────────────┐   │   │
│    │     │  🕐  15:20                                  │   │   │
│    │     └─────────────────────────────────────────────┘   │   │
│    │                                                        │   │
│    │     💡 Mit Uhrzeit: Aszendent & Häuser-Analyse        │   │
│    │        Ohne: Nur Sonnenzeichen-Horoskop               │   │
│    │                                                        │   │
│    │     Wo wurdest du geboren?                            │   │
│    │                                                        │   │
│    │     ┌─────────────────────────────────────────────┐   │   │
│    │     │  📍  Hannover, Deutschland                  │   │   │
│    │     └─────────────────────────────────────────────┘   │   │
│    │                                                        │   │
│    │              ┌─────────────────────────┐              │   │
│    │              │  ✨ HOROSKOP BERECHNEN  │              │   │
│    │              └─────────────────────────┘              │   │
│    │                                                        │   │
│    └────────────────────────────────────────────────────────┘   │
│                                                                  │
│    ⚠️ Disclaimer: Astrologie dient der Unterhaltung und         │
│    Selbstreflexion, nicht der Vorhersage oder Beratung.         │
└──────────────────────────────────────────────────────────────────┘
```

### 6.2 Daily Horoscope View (Freemium)

```
┌──────────────────────────────────────────────────────────────────┐
│  ← Zurück                    Heute                    Morgen →   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│     DEIN TAGESHOROSKOP                                          │
│     Dienstag, 23. Dezember 2025                                 │
│                                                                  │
│     ┌────────────────────────────────────────────────────────┐  │
│     │                                                        │  │
│     │  ♋ Krebs                           ***                │  │
│     │  Aszendent: ♏ Skorpion                                │  │
│     │                                                        │  │
│     │  ─────────────────────────────────────────────────     │  │
│     │                                                        │  │
│     │  ✨ SELBSTVERWIRKLICHUNG                              │  │
│     │                                                        │  │
│     │  ♃℞ △ ♅                                               │  │
│     │  Jupiter (rückläufig) Trigon Uranus                   │  │
│     │                                                        │  │
│     │  Du bist ganz stark von dem Bedürfnis motiviert,      │  │
│     │  dich zu verwirklichen und etwas zu tun, das von      │  │
│     │  der normalen Routine völlig abweicht...              │  │
│     │                                                        │  │
│     │  ⏱️ Gültig: Sep 2025 – Mai 2026                        │  │
│     │                                                        │  │
│     └────────────────────────────────────────────────────────┘  │
│                                                                  │
│     ┌────────────────────────────────────────────────────────┐  │
│     │  🌙 MONDPHASE                                         │  │
│     │                                                        │  │
│     │  ◐ Abnehmender Mond in Jungfrau                       │  │
│     │  Nächster Neumond: 30. Dezember                       │  │
│     └────────────────────────────────────────────────────────┘  │
│                                                                  │
│     ┌────────────────────────────────────────────────────────┐  │
│     │  🔮 PREMIUM FREISCHALTEN                         🔒   │  │
│     │                                                        │  │
│     │  • Liebeshoroskop                                     │  │
│     │  • Alle aktiven Transite                              │  │
│     │  • Planetenstunden                                    │  │
│     │  • Vollständige Geburtsanalyse                        │  │
│     │                                                        │  │
│     │         [ Premium aktivieren - 4,99€/Monat ]          │  │
│     └────────────────────────────────────────────────────────┘  │
│                                                                  │
│     ┌────────────────────────────────────────────────────────┐  │
│     │  🪐 AKTUELLE PLANETENPOSITIONEN                       │  │
│     │                                                        │  │
│     │  ☉ Sonne       1°30' Steinbock                        │  │
│     │  ☽ Mond        6°12' Jungfrau                         │  │
│     │  ☿ Merkur     15°45' Steinbock                        │  │
│     │  ♀ Venus       8°22' Wassermann                       │  │
│     │  ♂ Mars       12°18' Krebs ℞                          │  │
│     │  ♃ Jupiter    12°18' Zwillinge ℞                      │  │
│     │  ♄ Saturn     14°05' Fische                           │  │
│     │  ♅ Uranus     23°41' Stier ℞                          │  │
│     │  ♆ Neptun     27°58' Fische                           │  │
│     │  ♇ Pluto       2°16' Wassermann                       │  │
│     │                                                        │  │
│     └────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 6.3 Premium View Extensions

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│     ❤️ LIEBESHOROSKOP                                           │
│                                                                  │
│     ┌────────────────────────────────────────────────────────┐  │
│     │                                                        │  │
│     │  ♃℞ △ ♅ — In der Liebe                               │  │
│     │                                                        │  │
│     │  Dieser Transit zeigt sich als plötzliche Begegnung   │  │
│     │  oder als überraschende Wendung in einer bestehenden  │  │
│     │  Beziehung. Du ziehst Partner an, die unkonventionell │  │
│     │  sind und deinen Horizont erweitern.                  │  │
│     │                                                        │  │
│     │  ─────────────────────────────────────────────────     │  │
│     │                                                        │  │
│     │  WEITERE LIEBES-ASPEKTE HEUTE:                        │  │
│     │                                                        │  │
│     │  ♀ ⚹ ☽ natal — Ausgehen!                              │  │
│     │  Venus Sextil Natal-Mond                              │  │
│     │  Unkomplizierte Kontakte stehen im Vordergrund.       │  │
│     │                                                        │  │
│     └────────────────────────────────────────────────────────┘  │
│                                                                  │
│     ⏰ PLANETENSTUNDEN                                          │
│     Dienstag = Tag des Mars ♂                                   │
│                                                                  │
│     ┌────────────────────────────────────────────────────────┐  │
│     │                                                        │  │
│     │  ☉ Sonnenaufgang: 08:29                               │  │
│     │  ☉ Sonnenuntergang: 16:10                             │  │
│     │                                                        │  │
│     │  TAGESSTUNDEN (je ~38 Min):                           │  │
│     │  08:29 ♂ Mars       ← Beginn des Planetentages        │  │
│     │  09:07 ☉ Sonne                                        │  │
│     │  09:45 ♀ Venus                                        │  │
│     │  10:23 ☿ Merkur                                       │  │
│     │  11:01 ☽ Mond                                         │  │
│     │  11:39 ♄ Saturn                                       │  │
│     │  12:17 ♃ Jupiter    ← JETZT (gut für Expansion)       │  │
│     │  12:55 ♂ Mars                                         │  │
│     │  ...                                                   │  │
│     │                                                        │  │
│     └────────────────────────────────────────────────────────┘  │
│                                                                  │
│     📊 LANGFRISTIGE THEMEN                                      │
│                                                                  │
│     ┌────────────────────────────────────────────────────────┐  │
│     │                                                        │  │
│     │  "Geschenke" — Jupiter □ Aszendent                    │  │
│     │  Sep 2025 – Mai 2026                                  │  │
│     │                                                        │  │
│     │  "Voneinander lernen" — Chiron ☍ Aszendent            │  │
│     │  Mai 2024 – Feb 2026                                  │  │
│     │                                                        │  │
│     │  "Neue Horizonte" — Jupiter im 9. Haus                │  │
│     │  Mai 2025 – Jul 2026                                  │  │
│     │                                                        │  │
│     │           [ Alle anzeigen → ]                         │  │
│     │                                                        │  │
│     └────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 7. Weekly Horoscope Generation

### 7.1 Algorithmus für Wochenhoroskop

```python
from datetime import date, timedelta
from typing import List, Dict


def generate_weekly_horoscope(
    natal_chart: dict,
    week_start: date,  # Immer Sonntag
    user_tier: str
) -> dict:
    """
    Generiert das Wochenhoroskop.
    
    Wird jeden Sonntag für die kommende Woche generiert.
    """
    
    week_end = week_start + timedelta(days=6)
    
    # Sammle alle Transite der Woche
    all_transits = []
    daily_highlights = {}
    
    for day_offset in range(7):
        current_day = week_start + timedelta(days=day_offset)
        day_name = current_day.strftime("%A")
        
        day_planets = calculate_planets_for_date(current_day)
        day_transits = find_active_transits(natal_chart, day_planets, current_day)
        
        all_transits.extend(day_transits)
        
        # Wähle den wichtigsten Transit des Tages
        if day_transits:
            daily_highlights[day_name] = {
                "date": current_day.isoformat(),
                "primary_transit": day_transits[0],
                "headline": get_transit_headline(day_transits[0]),
                "brief": get_transit_brief(day_transits[0])
            }
    
    # Identifiziere die dominanten Themen der Woche
    week_themes = _extract_week_themes(all_transits)
    
    # Wichtigste Tage der Woche
    key_days = _identify_key_days(daily_highlights)
    
    # Mondphasen der Woche
    moon_events = _get_moon_events(week_start, week_end)
    
    output = {
        "week_start": week_start.isoformat(),
        "week_end": week_end.isoformat(),
        "generated_at": datetime.now().isoformat(),
        
        "freemium": {
            "week_overview": {
                "headline": week_themes[0]["title"] if week_themes else "Deine Woche",
                "summary": _generate_week_summary(week_themes, natal_chart),
                "dominant_planet": week_themes[0]["planet"] if week_themes else None
            },
            "key_day": key_days[0] if key_days else None,
            "moon_events": moon_events
        }
    }
    
    if user_tier == "premium":
        output["premium"] = {
            "daily_breakdown": daily_highlights,
            "all_themes": week_themes,
            "key_days": key_days,
            "love_week": _generate_love_week_summary(all_transits, natal_chart),
            "career_week": _generate_career_week_summary(all_transits, natal_chart),
            "best_days_for": {
                "important_decisions": _find_best_days(all_transits, "decisions"),
                "social_activities": _find_best_days(all_transits, "social"),
                "rest_recovery": _find_best_days(all_transits, "rest"),
                "starting_new_projects": _find_best_days(all_transits, "initiation")
            }
        }
    
    return output


def _extract_week_themes(transits: List[dict]) -> List[dict]:
    """
    Extrahiert die dominanten Themen der Woche aus allen Transiten.
    """
    # Gruppiere nach Transit-Kombination
    theme_counts = {}
    
    for transit in transits:
        key = f"{transit['transit_planet']}_{transit['aspect']}_{transit['natal_point']}"
        
        if key not in theme_counts:
            theme_counts[key] = {
                "key": key,
                "transit_planet": transit["transit_planet"],
                "aspect": transit["aspect"],
                "natal_point": transit["natal_point"],
                "count": 0,
                "max_importance": 0,
                "title": get_transit_headline(transit)
            }
        
        theme_counts[key]["count"] += 1
        theme_counts[key]["max_importance"] = max(
            theme_counts[key]["max_importance"],
            transit["importance"]
        )
    
    # Sortiere nach Wichtigkeit * Häufigkeit
    themes = list(theme_counts.values())
    themes.sort(key=lambda x: -(x["max_importance"] * x["count"]))
    
    return themes[:5]  # Top 5 Themen


def _identify_key_days(daily_highlights: dict) -> List[dict]:
    """
    Identifiziert die wichtigsten Tage der Woche.
    """
    days = []
    
    for day_name, highlight in daily_highlights.items():
        transit = highlight["primary_transit"]
        
        days.append({
            "day": day_name,
            "date": highlight["date"],
            "score": transit["importance"] * (1 / (transit["orb"] + 0.1)),
            "headline": highlight["headline"],
            "type": _classify_day_type(transit)
        })
    
    days.sort(key=lambda x: -x["score"])
    return days


def _classify_day_type(transit: dict) -> str:
    """Klassifiziert den Charakter eines Tages."""
    
    aspect = transit["aspect"]
    planet = transit["transit_planet"]
    
    if aspect in ["trine", "sextile"]:
        if planet in ["venus", "jupiter"]:
            return "opportunity"
        elif planet in ["mars"]:
            return "action"
        else:
            return "flow"
    elif aspect in ["square", "opposition"]:
        if planet in ["saturn"]:
            return "challenge"
        elif planet in ["mars", "pluto"]:
            return "intensity"
        else:
            return "tension"
    elif aspect == "conjunction":
        return "activation"
    
    return "neutral"
```

---

## 8. Geburtshoroskop-Analyse (Premium)

```python
def generate_birth_chart_analysis(natal_chart: dict) -> dict:
    """
    Generiert eine umfassende Geburtshoroskop-Analyse.
    
    Dies ist ein einmaliges Premium-Feature beim Onboarding.
    """
    
    analysis = {
        "overview": {
            "sun_sign": {
                "sign": natal_chart["sun_sign"],
                "degree": natal_chart["planets"]["sun"]["degree_in_sign"],
                "house": natal_chart["planets"]["sun"]["house"],
                "interpretation": SIGN_INTERPRETATIONS[natal_chart["sun_sign"]]["core"],
                "house_flavor": f"Mit der Sonne im {natal_chart['planets']['sun']['house']}. Haus..."
            },
            "moon_sign": {
                "sign": natal_chart["moon_sign"],
                "degree": natal_chart["planets"]["moon"]["degree_in_sign"],
                "house": natal_chart["planets"]["moon"]["house"],
                "interpretation": MOON_SIGN_INTERPRETATIONS[natal_chart["moon_sign"]]["emotional"],
                "needs": MOON_SIGN_INTERPRETATIONS[natal_chart["moon_sign"]]["needs"]
            },
            "rising_sign": {
                "sign": natal_chart["rising_sign"],
                "degree": natal_chart["angles"]["ascendant"]["degree_in_sign"],
                "interpretation": RISING_SIGN_INTERPRETATIONS[natal_chart["rising_sign"]]["mask"],
                "first_impression": RISING_SIGN_INTERPRETATIONS[natal_chart["rising_sign"]]["appearance"]
            }
        },
        
        "big_three_synthesis": _synthesize_big_three(
            natal_chart["sun_sign"],
            natal_chart["moon_sign"],
            natal_chart["rising_sign"]
        ),
        
        "planetary_positions": [
            {
                "planet": planet,
                "sign": data["sign"],
                "house": data["house"],
                "retrograde": data.get("retrograde", False),
                "interpretation": PLANET_IN_SIGN[planet][data["sign"]],
                "house_meaning": PLANET_IN_HOUSE[planet][data["house"]]
            }
            for planet, data in natal_chart["planets"].items()
        ],
        
        "major_aspects": [
            {
                "aspect_display": f"{asp['planet1']} {asp['symbol']} {asp['planet2']}",
                "interpretation": ASPECT_INTERPRETATIONS[asp['planet1']][asp['aspect']][asp['planet2']],
                "orb": asp["orb"],
                "strength": asp["strength"]
            }
            for asp in natal_chart["aspects"]
            if asp["strength"] in ["strong", "medium"]
        ],
        
        "house_emphasis": _analyze_house_emphasis(natal_chart),
        
        "element_balance": _calculate_element_balance(natal_chart),
        
        "modality_balance": _calculate_modality_balance(natal_chart),
        
        "signature_sign": _determine_signature_sign(natal_chart)
    }
    
    return analysis


def _synthesize_big_three(sun: str, moon: str, rising: str) -> str:
    """
    Erstellt eine Synthese aus Sonne, Mond und Aszendent.
    
    Dies ist der Kern-Text des Persönlichkeitshoroskops.
    """
    
    # Element-Kombinationen
    elements = {
        "aries": "fire", "leo": "fire", "sagittarius": "fire",
        "taurus": "earth", "virgo": "earth", "capricorn": "earth",
        "gemini": "air", "libra": "air", "aquarius": "air",
        "cancer": "water", "scorpio": "water", "pisces": "water"
    }
    
    sun_element = elements[sun]
    moon_element = elements[moon]
    rising_element = elements[rising]
    
    element_combo = sorted([sun_element, moon_element, rising_element])
    
    # Synthese-Templates basierend auf Element-Kombinationen
    synthesis_templates = {
        ("fire", "fire", "fire"): """
Du bist durch und durch ein Feuerwesen: impulsiv, leidenschaftlich und voller 
Tatendrang. Deine Herausforderung liegt darin, deine enorme Energie zu 
fokussieren, ohne auszubrennen.
""",
        ("earth", "water", "fire"): """
In dir verbinden sich Gegensätze zu einer kraftvollen Mischung: Das Feuer deines 
Auftretens wird von erdiger Beständigkeit gestützt und von emotionaler Tiefe 
genährt. Du kannst Visionen in Realität verwandeln.
""",
        # ... weitere Kombinationen
    }
    
    base_synthesis = synthesis_templates.get(
        tuple(element_combo),
        _generate_generic_synthesis(sun, moon, rising)
    )
    
    return base_synthesis.strip()


def _calculate_element_balance(natal_chart: dict) -> dict:
    """
    Berechnet die Verteilung der Elemente im Horoskop.
    """
    element_points = {"fire": 0, "earth": 0, "air": 0, "water": 0}
    
    ELEMENT_MAP = {
        "aries": "fire", "leo": "fire", "sagittarius": "fire",
        "taurus": "earth", "virgo": "earth", "capricorn": "earth",
        "gemini": "air", "libra": "air", "aquarius": "air",
        "cancer": "water", "scorpio": "water", "pisces": "water"
    }
    
    # Gewichtung: Persönliche Planeten zählen mehr
    PLANET_WEIGHTS = {
        "sun": 4, "moon": 4, "ascendant": 3,
        "mercury": 2, "venus": 2, "mars": 2,
        "jupiter": 1, "saturn": 1,
        "uranus": 0.5, "neptune": 0.5, "pluto": 0.5
    }
    
    for planet, data in natal_chart["planets"].items():
        sign = data["sign"]
        element = ELEMENT_MAP.get(sign)
        weight = PLANET_WEIGHTS.get(planet, 1)
        
        if element:
            element_points[element] += weight
    
    # Füge Aszendent hinzu
    asc_sign = natal_chart["angles"]["ascendant"]["sign"]
    element_points[ELEMENT_MAP[asc_sign]] += PLANET_WEIGHTS["ascendant"]
    
    total = sum(element_points.values())
    
    return {
        element: {
            "points": points,
            "percentage": round(points / total * 100, 1),
            "interpretation": _interpret_element_level(element, points / total)
        }
        for element, points in element_points.items()
    }


def _interpret_element_level(element: str, ratio: float) -> str:
    """Interpretiert die Stärke eines Elements."""
    
    interpretations = {
        "fire": {
            "high": "Starke Willenskraft, Enthusiasmus und Selbstvertrauen.",
            "low": "Möglicherweise Schwierigkeiten mit Selbstbehauptung oder Motivation."
        },
        "earth": {
            "high": "Praktische Veranlagung, Ausdauer und Zuverlässigkeit.",
            "low": "Könnte von mehr Struktur und Bodenhaftung profitieren."
        },
        "air": {
            "high": "Intellektuelle Stärke, Kommunikationstalent und Objektivität.",
            "low": "Emotionale Intelligenz könnte stärker entwickelt sein als rationales Denken."
        },
        "water": {
            "high": "Tiefe Intuition, emotionale Sensibilität und Empathie.",
            "low": "Emotionaler Zugang könnte weiterentwickelt werden."
        }
    }
    
    level = "high" if ratio > 0.35 else "low" if ratio < 0.15 else "balanced"
    
    if level == "balanced":
        return "Ausgewogene Präsenz dieses Elements."
    
    return interpretations[element][level]
```

---

## 9. Notification & Scheduling System

```python
from datetime import datetime, time
from typing import Optional
import asyncio


class HoroscopeScheduler:
    """
    Verwaltet die Generierung und Zustellung von Horoskopen.
    """
    
    def __init__(self, user_preferences: dict):
        self.delivery_time = user_preferences.get("delivery_time", time(7, 0))
        self.timezone = user_preferences.get("timezone", "Europe/Berlin")
        self.notifications_enabled = user_preferences.get("notifications", True)
    
    async def schedule_daily_horoscope(self, user_id: str):
        """
        Plant die tägliche Horoskop-Generierung und -Zustellung.
        """
        while True:
            now = datetime.now(self.timezone)
            target_time = datetime.combine(now.date(), self.delivery_time)
            
            if now >= target_time:
                # Heute schon vorbei, plane für morgen
                target_time += timedelta(days=1)
            
            wait_seconds = (target_time - now).total_seconds()
            await asyncio.sleep(wait_seconds)
            
            # Generiere und sende Horoskop
            await self._generate_and_deliver(user_id, target_time.date())
    
    async def _generate_and_deliver(self, user_id: str, date: date):
        """
        Generiert das Horoskop und sendet Notification.
        """
        # Lade User-Daten
        user_profile = await get_user_profile(user_id)
        natal_chart = await get_natal_chart(user_id)
        
        # Berechne Planeten für heute
        current_planets = calculate_planets_for_date(date)
        
        # Finde Transite
        transits = find_active_transits(natal_chart, current_planets, date)
        
        # Generiere Horoskop
        horoscope = generate_daily_horoscope(
            natal_chart,
            transits,
            user_profile["subscription_tier"],
            date
        )
        
        # Speichere
        await save_daily_horoscope(user_id, date, horoscope)
        
        # Sende Notification
        if self.notifications_enabled:
            await send_horoscope_notification(user_id, horoscope)
    
    async def schedule_weekly_horoscope(self, user_id: str):
        """
        Plant die wöchentliche Horoskop-Generierung (Sonntags).
        """
        while True:
            now = datetime.now(self.timezone)
            
            # Finde nächsten Sonntag
            days_until_sunday = (6 - now.weekday()) % 7
            if days_until_sunday == 0 and now.time() >= time(6, 0):
                days_until_sunday = 7
            
            next_sunday = now.date() + timedelta(days=days_until_sunday)
            target_time = datetime.combine(next_sunday, time(6, 0))
            
            wait_seconds = (target_time - now).total_seconds()
            await asyncio.sleep(wait_seconds)
            
            # Generiere Wochenhoroskop
            await self._generate_weekly(user_id, next_sunday)


class NotificationContent:
    """
    Generiert Notification-Texte für verschiedene Ereignisse.
    """
    
    @staticmethod
    def daily_horoscope(horoscope: dict) -> dict:
        """Erstellt Push-Notification für Tageshoroskop."""
        
        primary_transit = horoscope["freemium"]["daily_horoscope"]
        stars = "⭐" * primary_transit["importance_stars"]
        
        return {
            "title": f"Dein Tag: {primary_transit['headline']} {stars}",
            "body": primary_transit["text"][:100] + "...",
            "action_url": "/horoscope/daily",
            "image": _get_transit_image(primary_transit)
        }
    
    @staticmethod
    def weekly_horoscope(horoscope: dict) -> dict:
        """Erstellt Push-Notification für Wochenhoroskop."""
        
        return {
            "title": "🌟 Dein Wochenhoroskop ist da!",
            "body": horoscope["freemium"]["week_overview"]["summary"][:100] + "...",
            "action_url": "/horoscope/weekly"
        }
    
    @staticmethod
    def special_transit(transit: dict) -> dict:
        """Benachrichtigung für besondere Transite (z.B. exakte Aspekte)."""
        
        return {
            "title": f"✨ Besonderer Moment: {transit['headline']}",
            "body": f"Heute um {transit['exact_time']} ist {transit['description']} exakt.",
            "action_url": f"/horoscope/transit/{transit['id']}"
        }
```

---

## 10. Technische Implementierung

### 10.1 Ephemeris-Integration

```python
# Option 1: Swiss Ephemeris (via pyswisseph)
import swisseph as swe

class SwissEphemerisCalculator:
    """
    Wrapper für Swiss Ephemeris - der Goldstandard für Astro-Software.
    """
    
    def __init__(self, ephemeris_path: str = "/usr/share/swisseph/ephe"):
        swe.set_ephe_path(ephemeris_path)
    
    def calculate_planet_position(self, julian_date: float, planet_id: int) -> dict:
        """
        Berechnet die Position eines Planeten.
        
        Planet IDs:
        0 = Sonne, 1 = Mond, 2 = Merkur, 3 = Venus, 4 = Mars,
        5 = Jupiter, 6 = Saturn, 7 = Uranus, 8 = Neptun, 9 = Pluto
        """
        
        # Berechne Position (ekliptikal, geozentr.)
        result, ret_flag = swe.calc_ut(julian_date, planet_id)
        
        longitude = result[0]
        latitude = result[1]
        distance = result[2]
        speed = result[3]  # Grad pro Tag
        
        # Rückläufig wenn Geschwindigkeit negativ
        is_retrograde = speed < 0
        
        # Bestimme Zeichen
        sign_index = int(longitude / 30)
        degree_in_sign = longitude % 30
        
        signs = [
            "aries", "taurus", "gemini", "cancer", "leo", "virgo",
            "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"
        ]
        
        return {
            "longitude": longitude,
            "latitude": latitude,
            "distance_au": distance,
            "speed": speed,
            "retrograde": is_retrograde,
            "sign": signs[sign_index],
            "degree_in_sign": degree_in_sign,
            "display": f"{int(degree_in_sign)}°{int((degree_in_sign % 1) * 60):02d}' {signs[sign_index].capitalize()}"
        }
    
    def calculate_houses(self, julian_date: float, latitude: float, 
                        longitude: float, house_system: str = 'P') -> dict:
        """
        Berechnet Häuser.
        
        House Systems:
        'P' = Placidus, 'K' = Koch, 'R' = Regiomontanus,
        'C' = Campanus, 'E' = Equal, 'W' = Whole Sign
        """
        
        cusps, ascmc = swe.houses(julian_date, latitude, longitude, 
                                  house_system.encode())
        
        return {
            "cusps": list(cusps),  # 12 Häuserspitzen
            "ascendant": ascmc[0],
            "mc": ascmc[1],
            "armc": ascmc[2],  # Right Ascension of MC
            "vertex": ascmc[3],
            "equatorial_ascendant": ascmc[4],
            "co_ascendant_koch": ascmc[5],
            "co_ascendant_munkasey": ascmc[6],
            "polar_ascendant": ascmc[7]
        }


# Option 2: Flatlib (Pure Python, einfacher zu deployen)
from flatlib.datetime import Datetime
from flatlib.geopos import GeoPos
from flatlib.chart import Chart
from flatlib import const

class FlatlibCalculator:
    """
    Alternative: Flatlib für Python-only Deployments.
    """
    
    def calculate_chart(self, birth_date: str, birth_time: str,
                       latitude: float, longitude: float, 
                       timezone: str) -> Chart:
        """
        Erstellt ein komplettes Horoskop.
        """
        
        date = Datetime(birth_date, birth_time, timezone)
        pos = GeoPos(latitude, longitude)
        
        chart = Chart(date, pos, IDs=const.LIST_OBJECTS)
        
        return chart
    
    def get_planet_data(self, chart: Chart) -> dict:
        """Extrahiert alle Planetendaten."""
        
        planets = {}
        
        for planet_id in const.LIST_OBJECTS:
            obj = chart.get(planet_id)
            
            planets[planet_id.lower()] = {
                "longitude": obj.lon,
                "sign": obj.sign,
                "degree_in_sign": obj.signlon,
                "retrograde": obj.movement() == const.RETROGRADE,
                "house": self._find_house(chart, obj.lon)
            }
        
        return planets
```

### 10.2 Caching-Strategie

```python
from functools import lru_cache
from datetime import date, timedelta
import redis


class HoroscopeCache:
    """
    Multi-Level Caching für Horoskop-Daten.
    
    Level 1: In-Memory (LRU) für Hot Data
    Level 2: Redis für Cross-Instance Sharing
    Level 3: Database für Persistenz
    """
    
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.NATAL_CHART_TTL = 86400 * 365  # 1 Jahr
        self.DAILY_HOROSCOPE_TTL = 86400 * 7  # 1 Woche
        self.CURRENT_PLANETS_TTL = 3600  # 1 Stunde
    
    @lru_cache(maxsize=10000)
    def get_natal_chart_cached(self, user_id: str) -> dict | None:
        """
        Level 1 Cache für Geburtshoroskope.
        
        Geburtshoroskope ändern sich nie (außer bei Profil-Update),
        daher aggressives Caching.
        """
        # Prüfe Redis
        cached = self.redis.get(f"natal:{user_id}")
        if cached:
            return json.loads(cached)
        
        return None
    
    def cache_natal_chart(self, user_id: str, chart: dict):
        """Speichert Geburtshoroskop in allen Cache-Levels."""
        
        # Redis
        self.redis.setex(
            f"natal:{user_id}",
            self.NATAL_CHART_TTL,
            json.dumps(chart)
        )
        
        # LRU Cache invalidieren und neu setzen
        self.get_natal_chart_cached.cache_clear()
    
    def get_daily_horoscope(self, user_id: str, target_date: date) -> dict | None:
        """Holt Tageshoroskop aus Cache."""
        
        key = f"daily:{user_id}:{target_date.isoformat()}"
        cached = self.redis.get(key)
        
        if cached:
            return json.loads(cached)
        
        return None
    
    def cache_daily_horoscope(self, user_id: str, target_date: date, 
                              horoscope: dict):
        """Speichert Tageshoroskop."""
        
        key = f"daily:{user_id}:{target_date.isoformat()}"
        self.redis.setex(key, self.DAILY_HOROSCOPE_TTL, json.dumps(horoscope))
    
    @lru_cache(maxsize=1)
    def get_current_planets_cached(self, date_hour: str) -> dict:
        """
        Cache für aktuelle Planetenpositionen.
        
        Nur auf Stundenbasis gecached, da sich Mond schnell bewegt.
        """
        return self._calculate_current_planets(date_hour)
    
    def _calculate_current_planets(self, date_hour: str) -> dict:
        """Berechnet aktuelle Planetenpositionen."""
        
        # Parse date_hour (Format: "2025-12-23T14")
        dt = datetime.fromisoformat(date_hour + ":00:00")
        jd = gregorian_to_julian_date(dt.year, dt.month, dt.day + dt.hour/24)
        
        calculator = SwissEphemerisCalculator()
        
        planets = {}
        for planet_id, planet_name in enumerate(PLANET_NAMES):
            planets[planet_name] = calculator.calculate_planet_position(jd, planet_id)
        
        return planets
```

---

## 11. Disclaimer & Ethik

```python
DISCLAIMER_DE = """
⚠️ WICHTIGER HINWEIS

Das QuizzMe Horoskop dient ausschließlich der Unterhaltung und Selbstreflexion. 

Es handelt sich um ein auf historischen Traditionen basierendes Symbolsystem, 
das KEINE wissenschaftliche Grundlage hat und KEINE echte Vorhersagekraft besitzt.

• Verwenden Sie dieses Horoskop NICHT als Grundlage für wichtige Lebensentscheidungen.
• Suchen Sie bei gesundheitlichen, rechtlichen oder finanziellen Fragen 
  qualifizierte Fachleute auf.
• Die Positionen der Himmelskörper haben keinen nachweisbaren Einfluss auf 
  menschliches Verhalten oder Schicksal.

Astrologie ist Kulturgeschichte, nicht Wissenschaft.
"""

DISCLAIMER_SHORT = "Zur Unterhaltung. Keine Lebensberatung."


def inject_disclaimer(horoscope: dict, prominence: str = "footer") -> dict:
    """
    Fügt Disclaimer zu jedem Horoskop hinzu.
    
    Args:
        prominence: "footer" (klein), "banner" (mittel), "modal" (beim ersten Aufruf)
    """
    
    horoscope["disclaimer"] = {
        "text": DISCLAIMER_SHORT if prominence == "footer" else DISCLAIMER_DE,
        "prominence": prominence,
        "show_modal_first_time": prominence == "modal"
    }
    
    return horoscope
```

---

## 12. Deployment & Skalierung

```yaml
# docker-compose.yml für QuizzMe Horoscope Service

version: '3.8'

services:
  horoscope-api:
    build: ./horoscope-service
    ports:
      - "8080:8080"
    environment:
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=postgresql://...
      - EPHEMERIS_PATH=/app/ephemeris
    volumes:
      - ./ephemeris:/app/ephemeris:ro
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
    depends_on:
      - redis
      - postgres
  
  horoscope-worker:
    build: ./horoscope-service
    command: python -m celery -A tasks worker
    environment:
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=postgresql://...
    deploy:
      replicas: 2
  
  horoscope-scheduler:
    build: ./horoscope-service
    command: python -m celery -A tasks beat
    environment:
      - REDIS_URL=redis://redis:6379
  
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
  
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=quizzme_horoscope
      - POSTGRES_USER=horoscope
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  redis_data:
  postgres_data:
```

---

## 13. Roadmap & Feature-Expansion

### Phase 1: MVP (Monat 1-2)
- [x] Geburtsdaten-Eingabe + Validierung
- [x] Radix-Berechnung (Placidus)
- [x] Tägliches Sonnenzeichen-Horoskop
- [x] Aktuelle Planetenpositionen
- [x] Mondphase

### Phase 2: Premium (Monat 3-4)
- [ ] Vollständige Transit-Matrix
- [ ] Liebeshoroskop
- [ ] Planetenstunden
- [ ] Wochenhoroskop
- [ ] Push-Notifications

### Phase 3: Deep Astro (Monat 5-6)
- [ ] Geburtshoroskop-Vollanalyse
- [ ] Aspekt-Deutungen
- [ ] Häuser-Deutungen
- [ ] Element/Modalitäts-Balance
- [ ] PDF-Export

### Phase 4: Social & Compatibility (Monat 7+)
- [ ] Partner-Synastrie
- [ ] Composite Charts
- [ ] Astro-Matching mit anderen Nutzern
- [ ] Teilen auf Social Media

---

*Blueprint Version 1.0 — QuizzMe Horoscope Engine*
*Erstellt für echte astronomische Berechnungen mit westlicher tropischer Astrologie*

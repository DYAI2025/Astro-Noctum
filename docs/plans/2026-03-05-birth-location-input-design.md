# Birth Location Input — Design

**Date:** 2026-03-05
**Status:** Approved

## Problem

Step 2 of the BirthForm (birth location) needs better UX. Currently the fallback without Google Places API key shows a raw coordinate text field, which is unusable for normal users. Even with the API key, the experience can be improved with an optional map view.

## Design

### Two Input Modes

1. **Default — City Search with Autocomplete**
   - Text field where user types a city name
   - Google Places Autocomplete shows matching suggestions in a dropdown
   - User clicks a suggestion → coordinates, place name, and timezone are filled automatically
   - No map visible by default

2. **Optional — Google Maps Click**
   - Button "Auf Google Maps auswählen" below the text field
   - Clicking it reveals an embedded Google Map (~250px height)
   - User clicks on the map → marker is placed, coordinates are set
   - Reverse-geocoding fills the place name
   - Clicking the button again or selecting a city in the text field hides the map

### Layout

```
┌─────────────────────────────────────────────┐
│  Wo bist du geboren?                        │
│                                             │
│  [ 🔍  Geburtsort suchen...            ]    │  ← PlaceAutocomplete
│     ┌──────────────────────────────┐        │
│     │ Berlin, Deutschland          │        │  ← Dropdown suggestions
│     │ Berlin, MD, USA              │        │
│     └──────────────────────────────┘        │
│                                             │
│  📍 Berlin, Deutschland                     │  ← Selected place
│     52.520, 13.405                          │  ← Coordinates (small, read-only)
│                                             │
│  [ 🗺️  Auf Google Maps auswählen ]          │  ← Toggle button for map
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │         Google Map (hidden default) │    │  ← Only visible after button click
│  │            📍 (Marker)              │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  Zeitzone: Europe/Berlin                    │  ← Auto-detected, still editable
│                                             │
│  [ Zurück ]  [ Chart berechnen ]            │
└─────────────────────────────────────────────┘
```

### Components

| Component | Change |
|-----------|--------|
| `PlaceAutocomplete.tsx` | Stays as-is. Already handles city search + autocomplete. |
| **NEW** `LocationMap.tsx` | Google Maps JS API embed. Click handler, marker, reverse-geocoding. |
| `BirthForm.tsx` | Step 2 integrates `LocationMap` behind a toggle. Coordinates field becomes read-only display. Timezone auto-filled from Google Time Zone API. |

### Data Flow

**City Search:**
```
User types "Berlin"
  → PlaceAutocomplete → Google Places API
  → onSelect({ name, lat, lon })
  → BirthForm sets coordinates, placeName
  → Google Time Zone API → sets timezone
```

**Map Click:**
```
User clicks "Auf Google Maps auswählen"
  → Map appears (animated)
User clicks location on map
  → LocationMap onClick(lat, lon)
  → Google Geocoding API (reverse) → sets placeName
  → Google Time Zone API → sets timezone
  → BirthForm sets coordinates
```

### Timezone Auto-Detection

Use Google Time Zone API: `https://maps.googleapis.com/maps/api/timezone/json?location=LAT,LNG&timestamp=UNIX&key=KEY`

- Returns exact IANA timezone for any coordinates
- API Key is already available
- Fallback: timezone field remains manually editable if API call fails

### Error Handling

- Google Maps script fails to load → map toggle button hidden, text search still works
- Reverse-geocode fails → coordinates set, no place name shown
- Time Zone API fails → timezone field stays manual (current behavior)
- No API key at all → fallback to current coordinate text input (unchanged)

### What We're NOT Doing

- No Leaflet/OpenStreetMap alternative (Google key is paid and available)
- No offline city database
- No redesign of Step 1 (date/time)
- `place` field not added to `onSubmit` type (would require changes to `BirthData` interface and Supabase persistence — separate task)

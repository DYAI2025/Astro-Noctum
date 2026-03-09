# Birth Location Input UX Improvement — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the raw coordinate fallback in Step 2 of BirthForm with a city search autocomplete (always visible) and an optional embedded Google Map (toggled on demand), plus auto-detect timezone from selected coordinates.

**Architecture:** The existing `PlaceAutocomplete` component and `loadGoogleMaps()` singleton stay as-is. A new `LocationMap` component wraps Google Maps JS API for the embedded map with click-to-select. A new `fetchTimezone()` utility calls the Google Time Zone API to auto-fill the timezone field. `BirthForm.tsx` Step 2 is rewritten to combine both input modes and remove the raw coordinate text input.

**Tech Stack:** React 19, Google Maps JS API (already loaded by PlaceAutocomplete), Google Time Zone API, Google Geocoding API (reverse), Framer Motion, Tailwind CSS v4.

**No test suite exists.** Verification is `npx tsc --noEmit` (type-check) + manual browser testing.

---

## Task 1: Create `fetchTimezone` utility

**Files:**
- Create: `src/services/timezone.ts`

**Step 1: Create the timezone utility**

```typescript
const API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || "";

/**
 * Fetch IANA timezone for given coordinates via Google Time Zone API.
 * Returns null on failure (caller should keep manual tz as fallback).
 */
export async function fetchTimezone(
  lat: number,
  lon: number,
): Promise<string | null> {
  if (!API_KEY) return null;

  const timestamp = Math.floor(Date.now() / 1000);
  const url = `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lon}&timestamp=${timestamp}&key=${API_KEY}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    // data.timeZoneId is the IANA timezone, e.g. "Europe/Berlin"
    if (data.status === "OK" && data.timeZoneId) {
      return data.timeZoneId;
    }
    return null;
  } catch {
    return null;
  }
}
```

**Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/services/timezone.ts
git commit -m "feat: add fetchTimezone utility for Google Time Zone API"
```

---

## Task 2: Create `LocationMap` component

**Files:**
- Create: `src/components/LocationMap.tsx`
- Read (reference): `src/components/PlaceAutocomplete.tsx` — reuse `loadGoogleMaps()`

**Step 1: Create the LocationMap component**

This component renders an embedded Google Map. When the user clicks on the map, it calls `onLocationSelect` with the lat/lon. It also performs reverse geocoding to get a place name.

```typescript
import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";

// Re-use the loadGoogleMaps singleton from PlaceAutocomplete
// We import the function indirectly — Google Maps JS is already loaded
// when PlaceAutocomplete mounts. LocationMap just needs window.google.maps.

interface LocationMapProps {
  /** Called when user clicks the map */
  onLocationSelect: (location: {
    lat: number;
    lon: number;
    name: string | null;
  }) => void;
  /** Center the map on these coords (e.g. after PlaceAutocomplete selects) */
  center?: { lat: number; lon: number };
  /** Whether the map is visible */
  visible: boolean;
  /** Google Maps API key for reverse geocoding */
  apiKey: string;
}

export function LocationMap({
  onLocationSelect,
  center,
  visible,
  apiKey,
}: LocationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!visible || !mapContainerRef.current || mapRef.current) return;

    const google = (window as any).google;
    if (!google?.maps) return;

    const defaultCenter = center || { lat: 52.52, lon: 13.405 };

    const map = new google.maps.Map(mapContainerRef.current, {
      center: { lat: defaultCenter.lat, lng: defaultCenter.lon },
      zoom: 6,
      disableDefaultUI: true,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        { featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#1E2A3A" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#e8e4d8" }] },
        { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#f5f2eb" }] },
      ],
    });

    mapRef.current = map;
    setMapReady(true);

    // Click handler
    map.addListener("click", async (e: any) => {
      const lat = e.latLng.lat();
      const lon = e.latLng.lng();

      // Place/move marker
      if (markerRef.current) {
        markerRef.current.setPosition(e.latLng);
      } else {
        markerRef.current = new google.maps.Marker({
          position: e.latLng,
          map,
        });
      }

      // Reverse geocode
      let name: string | null = null;
      try {
        const geocoder = new google.maps.Geocoder();
        const result = await geocoder.geocode({ location: e.latLng });
        if (result.results?.[0]) {
          name = result.results[0].formatted_address;
        }
      } catch {
        // Reverse geocode failed — that's fine, we still have coords
      }

      onLocationSelect({ lat, lon, name });
    });
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update center when PlaceAutocomplete selects a city
  useEffect(() => {
    if (!mapRef.current || !center) return;
    const google = (window as any).google;
    const latLng = new google.maps.LatLng(center.lat, center.lon);
    mapRef.current.panTo(latLng);
    mapRef.current.setZoom(10);

    if (markerRef.current) {
      markerRef.current.setPosition(latLng);
    } else {
      markerRef.current = new google.maps.Marker({
        position: latLng,
        map: mapRef.current,
      });
    }
  }, [center?.lat, center?.lon]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 250 }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="overflow-hidden rounded-lg border border-[#8B6914]/15"
        >
          <div
            ref={mapContainerRef}
            className="w-full h-[250px]"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

**Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/LocationMap.tsx
git commit -m "feat: add LocationMap component with click-to-select and reverse geocoding"
```

---

## Task 3: Add i18n keys for map toggle

**Files:**
- Modify: `src/i18n/translations.ts`

**Step 1: Add new translation keys**

Find the English `form` section and add after the existing keys (near `findOnMaps`):

```typescript
// Add to English form section:
mapToggleOpen: "Select on Google Maps",
mapToggleClose: "Hide map",

// Add to German form section:
mapToggleOpen: "Auf Google Maps auswählen",
mapToggleClose: "Karte ausblenden",
```

**Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/i18n/translations.ts
git commit -m "feat: add i18n keys for map toggle button"
```

---

## Task 4: Rewrite BirthForm Step 2

**Files:**
- Modify: `src/components/BirthForm.tsx`

This is the main task. Replace the entire Step 2 section with the new layout:
1. PlaceAutocomplete (always visible when API key exists)
2. Selected place display (name + coords, read-only)
3. Map toggle button
4. LocationMap (hidden by default, revealed on toggle)
5. Timezone field (auto-filled, still editable)

**Step 1: Add imports**

At the top of `BirthForm.tsx`, add:

```typescript
import { LocationMap } from "./LocationMap";
import { fetchTimezone } from "../services/timezone";
import { Map } from "lucide-react";
```

Remove `ExternalLink` from the existing lucide import if it's no longer used elsewhere.

**Step 2: Add state for map visibility**

Inside the `BirthForm` component, after the existing state declarations (line ~50), add:

```typescript
const [showMap, setShowMap] = useState(false);
const [mapCenter, setMapCenter] = useState<{ lat: number; lon: number } | undefined>(undefined);
```

**Step 3: Add timezone auto-detect helper**

Inside the component, add a callback that auto-detects timezone when coordinates change:

```typescript
const autoDetectTimezone = useCallback(async (lat: number, lon: number) => {
  const detectedTz = await fetchTimezone(lat, lon);
  if (detectedTz) setTz(detectedTz);
}, []);
```

**Step 4: Update the PlaceAutocomplete onSelect handler**

Change the existing `onSelect` callback in the PlaceAutocomplete to also:
- Set map center (so map pans to selected city if open)
- Auto-detect timezone
- Close the map (city selected, no need for map)

```typescript
onSelect={({ name, lat, lon }) => {
  setPlaceName(name);
  setCoordinates(`${lat.toFixed(6)}, ${lon.toFixed(6)}`);
  setMapCenter({ lat, lon });
  setShowMap(false);
  autoDetectTimezone(lat, lon);
}}
```

**Step 5: Replace the entire Step 2 JSX**

Replace the Step 2 section (`{step === 2 && (...)}`) with the new layout. The key changes:
- Always show `PlaceAutocomplete` when API key is present (no change here)
- Below PlaceAutocomplete: show selected place name + coords read-only
- Map toggle button with `Map` lucide icon
- `LocationMap` component (animated show/hide)
- Timezone field stays but gets auto-filled
- Fallback: if no API key, keep the manual coordinate input unchanged

The full replacement for the Step 2 block (lines 208–302 in current file):

```tsx
{step === 2 && (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-8"
  >
    <h2 className="font-serif text-3xl leading-snug text-[#1a2434]">
      {t("form.step2Title")}
    </h2>

    <div className="space-y-5">
      {placesAvailable ? (
        <>
          {/* City search autocomplete */}
          <div className="space-y-2">
            <label className="text-[8px] uppercase tracking-widest text-[#1E2A3A]/50">
              {t("form.placeLabel")}
            </label>
            <PlaceAutocomplete
              onSelect={({ name, lat, lon }) => {
                setPlaceName(name);
                setCoordinates(`${lat.toFixed(6)}, ${lon.toFixed(6)}`);
                setMapCenter({ lat, lon });
                setShowMap(false);
                autoDetectTimezone(lat, lon);
              }}
              placeholder={t("form.placePlaceholder")}
              className={inputCls}
            />
          </div>

          {/* Selected place display */}
          {placeName && (
            <div className="flex items-center gap-2 text-[10px] text-[#1E2A3A]/45">
              <MapPin className="w-3 h-3 text-[#8B6914]/50 shrink-0" />
              <span>{placeName}</span>
              <span className="text-[#1E2A3A]/25 ml-1">{coordinates}</span>
            </div>
          )}

          {/* Map toggle button */}
          <button
            type="button"
            onClick={() => setShowMap((v) => !v)}
            className="flex items-center gap-2 text-[9px] uppercase tracking-[0.2em] text-[#8B6914]/60 hover:text-[#8B6914] transition-colors py-2"
          >
            <Map className="w-3.5 h-3.5" />
            {showMap ? t("form.mapToggleClose") : t("form.mapToggleOpen")}
          </button>

          {/* Embedded Google Map */}
          <LocationMap
            visible={showMap}
            center={mapCenter}
            apiKey={import.meta.env.VITE_GOOGLE_PLACES_API_KEY || ""}
            onLocationSelect={({ lat, lon, name }) => {
              setCoordinates(`${lat.toFixed(6)}, ${lon.toFixed(6)}`);
              if (name) setPlaceName(name);
              autoDetectTimezone(lat, lon);
            }}
          />
        </>
      ) : (
        /* Fallback: manual coordinate input (no API key) */
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[8px] uppercase tracking-widest text-[#1E2A3A]/50">
              {t("form.coordLabel")}
            </label>
            <a
              href="https://www.google.com/maps"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[8px] uppercase tracking-widest text-[#8B6914]/60 hover:text-[#8B6914] transition-colors flex items-center gap-1"
            >
              {t("form.findOnMaps")} <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <input
            type="text"
            required
            value={coordinates}
            onChange={(e) => setCoordinates(e.target.value)}
            className={inputCls}
            placeholder="52.399553, 13.061038"
            pattern="^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$"
            title={t("form.coordTitle")}
          />
        </div>
      )}

      {/* Timezone (auto-detected, still editable) */}
      <div className="space-y-2">
        <label className="text-[8px] uppercase tracking-widest text-[#1E2A3A]/50">
          {t("form.timezoneLabel")}
        </label>
        <input
          type="text"
          required
          value={tz}
          onChange={(e) => setTz(e.target.value)}
          className={inputCls}
          placeholder="Europe/Berlin"
        />
      </div>
    </div>

    <div className="flex gap-4">
      <button
        type="button"
        onClick={() => setStep(1)}
        className="w-full md:w-auto px-8 py-4 border border-[#1E2A3A]/15 text-[#1E2A3A]/55 text-[10px] uppercase tracking-[0.3em] hover:bg-[#1E2A3A]/05 transition-colors rounded"
      >
        {t("form.backBtn")}
      </button>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full md:w-auto px-12 py-4 border border-[#8B6914]/30 text-[#8B6914] text-[10px] uppercase tracking-[0.3em] hover:bg-[#8B6914]/08 transition-colors disabled:opacity-50 rounded"
      >
        {t("form.submitBtn")}
      </button>
    </div>
  </motion.div>
)}
```

**Step 6: Add `useCallback` to imports**

Update the React import at the top of BirthForm.tsx:

```typescript
import { useState, useMemo, useCallback } from "react";
```

**Step 7: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 8: Commit**

```bash
git add src/components/BirthForm.tsx
git commit -m "feat: rewrite BirthForm Step 2 — city search + optional map + auto timezone"
```

---

## Task 5: Export `loadGoogleMaps` from PlaceAutocomplete

**Files:**
- Modify: `src/components/PlaceAutocomplete.tsx`

The `LocationMap` component relies on `window.google.maps` being loaded. Currently `loadGoogleMaps()` is called internally by `PlaceAutocomplete` on mount. Since `PlaceAutocomplete` always mounts before `LocationMap` (it's higher in the DOM), the script is already loaded when LocationMap renders. However, for robustness, export `loadGoogleMaps` so LocationMap can call it as a safety check.

**Step 1: Export the function**

Change line 21 from:
```typescript
function loadGoogleMaps(): Promise<void> {
```
to:
```typescript
export function loadGoogleMaps(): Promise<void> {
```

**Step 2: Update LocationMap to use it**

In `LocationMap.tsx`, add an import and call `loadGoogleMaps()` before initializing the map:

```typescript
import { loadGoogleMaps } from "./PlaceAutocomplete";
```

And in the `useEffect` that initializes the map, wrap it:

```typescript
useEffect(() => {
  if (!visible || !mapContainerRef.current || mapRef.current) return;

  loadGoogleMaps().then(() => {
    const google = (window as any).google;
    if (!google?.maps) return;
    // ... rest of map initialization
  });
}, [visible]);
```

**Step 3: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/components/PlaceAutocomplete.tsx src/components/LocationMap.tsx
git commit -m "feat: export loadGoogleMaps for shared use, LocationMap calls it"
```

---

## Task 6: Manual browser verification

**No automated tests exist in this project.** Verify manually:

**Step 1: Start dev server**

```bash
npm run dev
```

**Step 2: Test city search flow**

1. Register/login
2. Fill Step 1 (date/time), click "Weiter"
3. In Step 2, type "Berlin" in the search field
4. Verify: dropdown suggestions appear
5. Click "Berlin, Deutschland"
6. Verify: place name + coords displayed, timezone auto-filled to "Europe/Berlin"

**Step 3: Test map toggle**

1. Click "Auf Google Maps auswählen"
2. Verify: map appears with smooth animation
3. Click somewhere on the map (e.g. Paris)
4. Verify: marker placed, coords updated, place name updated via reverse geocode, timezone auto-updated
5. Click "Karte ausblenden"
6. Verify: map hides with smooth animation

**Step 4: Test fallback (no API key)**

1. Temporarily remove `VITE_GOOGLE_PLACES_API_KEY` from `.env.local`
2. Restart dev server
3. Verify: Step 2 shows manual coordinate input with "Auf Google Maps finden" link (old fallback)
4. Restore the API key

**Step 5: Test form submission**

1. Select a city, verify timezone is auto-filled
2. Click "Chart berechnen"
3. Verify: form submits successfully, Dashboard loads

**Step 6: Final commit**

If any fixes were needed during testing, commit them:

```bash
git add -A
git commit -m "fix: polish birth location UX after manual testing"
```

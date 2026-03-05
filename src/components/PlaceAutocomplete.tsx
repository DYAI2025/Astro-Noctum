import { useState, useRef, useEffect, useCallback } from "react";

interface Place {
  name: string;
  lat: number;
  lon: number;
}

interface PlaceAutocompleteProps {
  onSelect: (place: Place) => void;
  placeholder?: string;
  className?: string;
}

const API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || "";

// Load Google Maps script once
let scriptLoaded = false;
let scriptPromise: Promise<void> | null = null;

export function loadGoogleMaps(): Promise<void> {
  if (scriptLoaded) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    if ((window as any).google?.maps?.places) {
      scriptLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places&language=de`;
    script.async = true;
    script.onload = () => {
      scriptLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error("Google Maps script failed to load"));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export function PlaceAutocomplete({
  onSelect,
  placeholder = "Geburtsort suchen...",
  className = "",
}: PlaceAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [value, setValue] = useState("");

  useEffect(() => {
    if (!API_KEY) return;

    loadGoogleMaps()
      .then(() => setReady(true))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!ready || !inputRef.current || autocompleteRef.current) return;

    const google = (window as any).google;
    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      types: ["(cities)"],
      fields: ["geometry", "name", "formatted_address"],
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (place?.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lon = place.geometry.location.lng();
        const name = place.formatted_address || place.name || "";
        setValue(name);
        onSelect({ name, lat, lon });
      }
    });

    autocompleteRef.current = autocomplete;
  }, [ready, onSelect]);

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
      className={className}
      autoComplete="off"
    />
  );
}

/** Check if Google Places API key is configured. */
export function hasPlacesApiKey(): boolean {
  return !!API_KEY;
}

import React, { useCallback } from "react";

type LocationMapProps = {
  /**
   * Called when a location has been reverse-geocoded.
   * `placeName` is the human-readable address returned by Nominatim.
   */
  onLocationResolved?: (placeName: string, lat: number, lon: number) => void;
};

const NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse";

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: lat.toString(),
    lon: lon.toString(),
  });

  // IMPORTANT:
  // Do NOT set a `User-Agent` header here. Browsers forbid setting it
  // and doing so would cause `fetch` to throw.
  const response = await fetch(`${NOMINATIM_REVERSE_URL}?${params.toString()}`, {
    method: "GET",
    headers: {
      // Safe headers only; omit `User-Agent` in browser code.
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Reverse geocoding failed with status ${response.status}`);
  }

  const data: { display_name?: string } = await response.json();
  return data.display_name ?? "";
}

const LocationMap: React.FC<LocationMapProps> = ({ onLocationResolved }) => {
  const handleClick = useCallback(
    async (event: React.MouseEvent<HTMLDivElement>) => {
      // In a real implementation, derive lat/lon from the click position
      // and the map's current bounds/zoom. Here we use placeholder values.
      const lat = 0;
      const lon = 0;

      if (!onLocationResolved) {
        return;
      }

      try {
        const placeName = await reverseGeocode(lat, lon);
        onLocationResolved(placeName, lat, lon);
      } catch (error) {
        // Swallow or log the error depending on your error-handling strategy.
        // console.error("Reverse geocoding error:", error);
      }
    },
    [onLocationResolved]
  );

  // Placeholder element to capture clicks. Replace with your actual map component.
  return (
    <div
      style={{ width: "100%", height: "100%", cursor: "pointer" }}
      onClick={handleClick}
    />
  );
};

export default LocationMap;
import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { Map, Marker } from "leaflet";

interface LocationMapProps {
  onLocationSelect: (location: {
    lat: number;
    lon: number;
    name: string | null;
  }) => void;
  center?: { lat: number; lon: number };
  visible: boolean;
}

async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=de`;
    const res = await fetch(url, { headers: { "User-Agent": "Bazodiac/1.0" } });
    const data = await res.json();
    const a = data.address || {};
    const city = a.city || a.town || a.village || a.county || "";
    const country = a.country || "";
    return city && country ? `${city}, ${country}` : (data.display_name || null);
  } catch {
    return null;
  }
}

export function LocationMap({ onLocationSelect, center, visible }: LocationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const [leafletReady, setLeafletReady] = useState(false);

  // Lazy-load Leaflet CSS + module
  useEffect(() => {
    if (!visible || leafletReady) return;

    // Inject Leaflet CSS once
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    setLeafletReady(true);
  }, [visible, leafletReady]);

  // Init map
  useEffect(() => {
    if (!leafletReady || !visible || !mapContainerRef.current || mapRef.current) return;

    let map: Map;

    import("leaflet").then((L) => {
      if (!mapContainerRef.current || mapRef.current) return;

      const defaultCenter: [number, number] = center
        ? [center.lat, center.lon]
        : [52.52, 13.405];

      map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: center ? 10 : 6,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      // Dark overlay to match app aesthetic
      const style = mapContainerRef.current.style;
      style.filter = "brightness(0.85) saturate(0.7) hue-rotate(180deg) invert(1) hue-rotate(180deg)";

      mapRef.current = map;

      if (center) {
        const marker = L.marker(defaultCenter).addTo(map);
        markerRef.current = marker;
      }

      map.on("click", async (e) => {
        const { lat, lng: lon } = e.latlng;

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lon]);
        } else {
          markerRef.current = L.marker([lat, lon]).addTo(map);
        }

        const name = await reverseGeocode(lat, lon);
        onLocationSelect({ lat, lon, name });
      });
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [leafletReady, visible]); // eslint-disable-line react-hooks/exhaustive-deps — map/marker refs excluded; Leaflet manages its own lifecycle

  // Pan to new center when PlaceAutocomplete selects a city
  useEffect(() => {
    if (!mapRef.current || !center) return;

    import("leaflet").then((L) => {
      if (!mapRef.current) return;
      mapRef.current.setView([center.lat, center.lon], 10, { animate: true });

      if (markerRef.current) {
        markerRef.current.setLatLng([center.lat, center.lon]);
      } else {
        markerRef.current = L.marker([center.lat, center.lon]).addTo(mapRef.current!);
      }
    });
  }, [center?.lat, center?.lon]); // eslint-disable-line react-hooks/exhaustive-deps — mapRef excluded; intentional one-way lat/lon sync

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
          <div ref={mapContainerRef} className="w-full h-[250px]" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { loadGoogleMaps } from "./PlaceAutocomplete";

interface LocationMapProps {
  onLocationSelect: (location: {
    lat: number;
    lon: number;
    name: string | null;
  }) => void;
  center?: { lat: number; lon: number };
  visible: boolean;
}

export function LocationMap({
  onLocationSelect,
  center,
  visible,
}: LocationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [_mapReady, setMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!visible || !mapContainerRef.current || mapRef.current) return;

    loadGoogleMaps().then(() => {
      const google = (window as any).google;
      if (!google?.maps || !mapContainerRef.current) return;

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

      map.addListener("click", async (e: any) => {
        const lat = e.latLng.lat();
        const lon = e.latLng.lng();

        if (markerRef.current) {
          markerRef.current.setPosition(e.latLng);
        } else {
          markerRef.current = new google.maps.Marker({
            position: e.latLng,
            map,
          });
        }

        let name: string | null = null;
        try {
          const geocoder = new google.maps.Geocoder();
          const result = await geocoder.geocode({ location: e.latLng });
          if (result.results?.[0]) {
            name = result.results[0].formatted_address;
          }
        } catch {
          // Reverse geocode failed — coords still work
        }

        onLocationSelect({ lat, lon, name });
      });
    });
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update center when PlaceAutocomplete selects a city
  useEffect(() => {
    if (!mapRef.current || !center) return;
    const google = (window as any).google;
    if (!google?.maps) return;
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

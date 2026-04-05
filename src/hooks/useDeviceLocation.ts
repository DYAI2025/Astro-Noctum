import { useState, useEffect } from 'react';

interface DeviceLocation {
  lat: number;
  lon: number;
}

/**
 * Requests device geolocation once on mount.
 * Returns null while loading or if permission denied.
 * Falls back gracefully — never blocks rendering.
 */
export function useDeviceLocation(): DeviceLocation | null {
  const [location, setLocation] = useState<DeviceLocation | null>(null);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator?.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      (err) => {
        console.warn('[useDeviceLocation] Permission denied or error:', err.message);
        // Stays null — caller uses fallback
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
    );
  }, []);

  return location;
}

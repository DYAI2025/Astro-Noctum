import { useState, useEffect } from 'react';

interface DeviceLocation {
  lat: number;
  lon: number;
}

/**
 * Requests device geolocation only when `enabled` is true.
 * Returns null while loading, if permission denied, or if disabled.
 * Falls back gracefully — never blocks rendering.
 *
 * @param enabled — Only request geolocation when true (e.g. skyMode === 'current').
 *   This prevents unwanted browser permission prompts on every Dashboard mount.
 */
export function useDeviceLocation(enabled: boolean): DeviceLocation | null {
  const [location, setLocation] = useState<DeviceLocation | null>(null);

  useEffect(() => {
    if (!enabled) return;
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
  }, [enabled]);

  return location;
}

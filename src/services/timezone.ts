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
    if (data.status === "OK" && data.timeZoneId) {
      return data.timeZoneId;
    }
    return null;
  } catch {
    return null;
  }
}

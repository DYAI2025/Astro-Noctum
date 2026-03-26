export interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

/**
 * Search for places using OpenStreetMap Nominatim (free, no API key).
 * Rate limit: 1 req/sec (enforced by Nominatim usage policy).
 */
export async function searchNominatim(query: string): Promise<NominatimResult[]> {
  if (!query || query.length < 3) return [];

  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '5',
    addressdetails: '0',
  });

  const resp = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { 'User-Agent': 'Bazodiac/1.0 (https://bazodiac.space)' },
  });

  if (!resp.ok) return [];
  return resp.json();
}

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

/** @deprecated No longer used — kept for type compat */
export function loadGoogleMaps(): Promise<void> {
  return Promise.resolve();
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    country?: string;
  };
}

function getShortName(result: NominatimResult): string {
  const a = result.address;
  const city = a?.city || a?.town || a?.village || a?.county || "";
  const country = a?.country || "";
  return city && country ? `${city}, ${country}` : result.display_name;
}

export function PlaceAutocomplete({
  onSelect,
  placeholder = "Geburtsort suchen...",
  className = "",
}: PlaceAutocompleteProps) {
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (query: string) => {
    if (query.length < 2) { setSuggestions([]); setOpen(false); return; }

    setLoading(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&addressdetails=1&featuretype=city&accept-language=de`;
      const res = await fetch(url, {
        headers: { "Accept-Language": "de", "User-Agent": "Bazodiac/1.0" },
      });
      const data: NominatimResult[] = await res.json();
      setSuggestions(data);
      setOpen(data.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setValue(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(q), 350);
  };

  const handleSelect = (result: NominatimResult) => {
    const name = getShortName(result);
    setValue(name);
    setSuggestions([]);
    setOpen(false);
    onSelect({ name, lat: parseFloat(result.lat), lon: parseFloat(result.lon) });
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
        </div>
      )}
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-xl border border-white/10 bg-[#0a0c14] shadow-xl overflow-hidden">
          {suggestions.map((s, i) => (
            <li
              key={i}
              onMouseDown={() => handleSelect(s)}
              className="px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 cursor-pointer truncate"
            >
              {getShortName(s)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Always available — no API key needed (uses OpenStreetMap Nominatim). */
export function hasPlacesApiKey(): boolean {
  return true;
}

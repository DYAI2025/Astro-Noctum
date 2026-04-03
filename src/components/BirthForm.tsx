import { useState, useMemo, useCallback, useRef } from "react";
import { motion } from "motion/react";
import { Info, MapPin, Map } from "lucide-react";
import { PlaceAutocomplete, hasPlacesApiKey } from "./PlaceAutocomplete";
import { LocationMap } from "./LocationMap";
import { fetchTimezone } from "../services/timezone";
import { useLanguage } from "../contexts/LanguageContext";
import { searchNominatim, type NominatimResult } from "../services/nominatim";

/** Detect whether DST is active for a given date + IANA timezone. */
function isDst(dateStr: string, tz: string): boolean | null {
  if (!dateStr || !tz) return null;
  try {
    const jan = new Date(`${dateStr.slice(0, 4)}-01-15T12:00:00`);
    const jul = new Date(`${dateStr.slice(0, 4)}-07-15T12:00:00`);
    const target = new Date(`${dateStr}T12:00:00`);

    const offsetOf = (d: Date) => {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        timeZoneName: "longOffset",
      }).formatToParts(d);
      const tzPart = parts.find((p) => p.type === "timeZoneName")?.value || "";
      const m = tzPart.match(/GMT([+-]\d{2}):?(\d{2})?/);
      if (!m) return 0;
      return parseInt(m[1]) * 60 + parseInt(m[2] || "0") * (m[1].startsWith("-") ? -1 : 1);
    };

    const janOff = offsetOf(jan);
    const julOff = offsetOf(jul);
    const targetOff = offsetOf(target);
    const standardOff = Math.min(janOff, julOff);
    return targetOff > standardOff;
  } catch {
    return null;
  }
}

interface BirthFormProps {
  onSubmit: (data: { date: string; tz: string; lon: number; lat: number }) => void;
  isLoading: boolean;
}

/** Detect user's local timezone from the browser. Falls back to null if unavailable. */
function detectBrowserTimezone(): string | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && tz.includes("/")) return tz;
    return null;
  } catch {
    return null;
  }
}

export function BirthForm({ onSubmit, isLoading }: BirthFormProps) {
  const { t } = useLanguage();
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [date, setDate] = useState("1990-01-01");
  const [time, setTime] = useState("12:00");
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [coordinates, setCoordinates] = useState("52.520000, 13.405000");
  const [tz, setTz] = useState(() => detectBrowserTimezone() ?? "Europe/Berlin");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [placeName, setPlaceName] = useState("");
  const [showMap, setShowMap] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lon: number } | undefined>(undefined);
  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] = useState<NominatimResult[]>([]);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const placesAvailable = useMemo(() => hasPlacesApiKey(), []);
  const today = new Date().toISOString().split('T')[0];

  const autoDetectTimezone = useCallback(async (lat: number, lon: number) => {
    const detectedTz = await fetchTimezone(lat, lon);
    if (detectedTz) setTz(detectedTz);
  }, []);

  const handleLocationSearch = useCallback((query: string) => {
    setLocationQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (query.length < 3) { setLocationResults([]); return; }

    searchTimeoutRef.current = setTimeout(async () => {
      setSearchingLocation(true);
      const results = await searchNominatim(query);
      setLocationResults(results);
      setSearchingLocation(false);
    }, 500); // 500ms debounce to respect Nominatim rate limit
  }, []);

  const handleLocationSelect = useCallback((result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    setCoordinates(`${lat.toFixed(6)}, ${lon.toFixed(6)}`);
    setPlaceName(result.display_name);
    setLocationQuery(result.display_name);
    setLocationResults([]);
    autoDetectTimezone(lat, lon);
  }, [autoDetectTimezone]);

  const dstInfo = useMemo(() => {
    if (!date) return null;
    const year = parseInt(date.slice(0, 4));
    if (year < 1980) return null;
    const dst = isDst(date, tz);
    if (dst === null) return null;
    return dst
      ? { label: "MESZ (Sommerzeit)", offset: "UTC+2" }
      : { label: "MEZ (Winterzeit)", offset: "UTC+1" };
  }, [date, tz]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const newErrors: Record<string, string> = {};

    // ISO YYYY-MM-DD strings: lexicographic order matches chronological order
    if (date > today) {
      newErrors.date = t("form.futureDate");
    }

    const [latStr, lonStr] = coordinates.split(",").map((s) => s.trim());
    const parsedLat = parseFloat(latStr);
    const parsedLon = parseFloat(lonStr);

    if (!coordinates || isNaN(parsedLat) || isNaN(parsedLon)) {
      newErrors.coordinates = t("form.validCoords");
    } else if (parsedLat < -90 || parsedLat > 90 || parsedLon < -180 || parsedLon > 180) {
      newErrors.coordinates = t("form.coordsRange");
    }

    try {
      Intl.DateTimeFormat(undefined, { timeZone: tz });
    } catch {
      newErrors.tz = t("form.invalidTz");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      if (newErrors.date) setStep(1);
      return;
    }

    setErrors({});
    setSubmitting(true);
    onSubmit({ date: `${date}T${time}:00`, tz, lat: parsedLat, lon: parsedLon });
  };

  // ── Loading state ─────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-12">
        <div className="relative w-64 h-1 bg-[#1E2A3A]/10 rounded-full overflow-hidden">
          <div className="absolute inset-0 morning-skeleton" />
        </div>
        <div className="text-center space-y-4">
          <p className="font-serif text-xl italic text-[#1E2A3A]/70 animate-pulse">
            {t("form.loadingMsg")}
          </p>
          <p className="font-sans text-[9px] uppercase tracking-[0.4em] text-[#8B6914]/60">
            {t("form.loadingTag")}
          </p>
        </div>
        <div className="w-48 h-[1px] bg-[#8B6914]/15" />
      </div>
    );
  }

  // ── Shared input styles ───────────────────────────────────────────────

  const inputCls =
    "w-full bg-white/60 border border-[#8B6914]/15 p-4 rounded-lg focus:outline-none focus:border-[#8B6914]/40 text-sm text-[#1E2A3A] placeholder:text-[#1E2A3A]/35 transition";

  const inputErrorCls = "w-full bg-white/60 border border-red-400/50 p-4 rounded-lg focus:outline-none text-sm text-[#1E2A3A] transition";

  const showError = (field: string) => errors[field]
    ? <p className="mt-1.5 text-[11px] text-red-500">{errors[field]}</p>
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl mx-auto px-6 py-12 w-full"
    >
      {/* ── Step Indicator ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] uppercase tracking-[0.25em] ${step === 1 ? "text-[#8B6914]" : "text-[#1E2A3A]/30"}`}>
            {t("form.step1Label") || "Geburtsdatum"}
          </span>
          <div className={`w-6 h-px ${step === 1 ? "bg-[#8B6914]/30" : "bg-[#8B6914]"}`} />
          <span className={`text-[10px] uppercase tracking-[0.25em] ${step === 2 ? "text-[#8B6914]" : "text-[#1E2A3A]/30"}`}>
            {t("form.step2Label") || "Geburtsort"}
          </span>
        </div>
        <span className="ml-auto text-[9px] uppercase tracking-[0.2em] text-[#1E2A3A]/30">
          {step}/2
        </span>
      </div>

      <form onSubmit={handleSubmit}>

        {/* ── Step 1: Date & Time ──────────────────────────────────── */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-10"
          >
            <h2 className="font-serif text-3xl leading-snug text-[#1a2434]">
              {t("form.step1Title")}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[8px] uppercase tracking-widest text-[#1E2A3A]/50">
                  {t("form.dateLabel")}
                </label>
                <input
                  type="date"
                  required
                  max={today}
                  value={date}
                  onChange={(e) => { setDate(e.target.value); setErrors((e2) => ({ ...e2, date: "" })); }}
                  className={errors.date ? inputErrorCls : inputCls}
                />
                {showError("date")}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[8px] uppercase tracking-widest text-[#1E2A3A]/50">
                    {t("form.timeLabel")}
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={timeUnknown}
                      onChange={(e) => {
                        setTimeUnknown(e.target.checked);
                        if (e.target.checked) setTime("12:00");
                      }}
                      className="accent-[#8B6914] w-3 h-3"
                    />
                    <span className="text-[8px] uppercase tracking-widest text-[#1E2A3A]/40">
                      {t("form.timeUnknown")}
                    </span>
                  </label>
                </div>
                <input
                  type="time"
                  required={!timeUnknown}
                  disabled={timeUnknown}
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className={`${inputCls} disabled:opacity-40 disabled:cursor-not-allowed`}
                />
              </div>
            </div>

            {dstInfo && (
              <div className="flex items-start gap-2 px-4 py-3 bg-[#8B6914]/06 border border-[#8B6914]/15 rounded-lg">
                <Info className="w-3.5 h-3.5 text-[#8B6914]/60 mt-0.5 shrink-0" />
                <p className="text-[10px] text-[#1E2A3A]/55 leading-relaxed">
                  {t("form.dstNote")
                    .replace("{{label}}", dstInfo.label)
                    .replace("{{offset}}", dstInfo.offset)}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                const stepErrors: Record<string, string> = {};
                if (!date) stepErrors.date = t("form.invalidDate");
                if (Object.keys(stepErrors).length > 0) { setErrors(stepErrors); return; }
                if (!time && !timeUnknown) {
                  const ok = window.confirm(t("form.noTime"));
                  if (ok) { setTime("12:00"); setTimeUnknown(true); setErrors({}); setStep(2); }
                  return;
                }
                setErrors({});
                setStep(2);
              }}
              className="w-full md:w-auto px-12 py-4 border border-[#8B6914]/30 text-[#8B6914] text-[10px] uppercase tracking-[0.3em] hover:bg-[#8B6914]/08 transition-colors rounded"
            >
              {t("form.nextBtn")}
            </button>
          </motion.div>
        )}

        {/* ── Step 2: Location ─────────────────────────────────────── */}
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
                    onLocationSelect={({ lat, lon, name }) => {
                      setCoordinates(`${lat.toFixed(6)}, ${lon.toFixed(6)}`);
                      if (name) setPlaceName(name);
                      autoDetectTimezone(lat, lon);
                    }}
                  />
                </>
              ) : (
                /* Fallback: Nominatim search + collapsible manual coordinate input */
                <>
                  <div className="space-y-2">
                    <label className="text-[8px] uppercase tracking-widest text-[#1E2A3A]/50">
                      {t("form.locationLabel") || "Geburtsort"}
                    </label>
                    <div className="relative">
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B6914]/40" />
                        <input
                          type="text"
                          value={locationQuery}
                          onChange={(e) => handleLocationSearch(e.target.value)}
                          placeholder={t("form.locationPlaceholder") || "Stadt oder Ort eingeben..."}
                          className={`${inputCls} pl-10`}
                        />
                        {searchingLocation && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 border border-[#8B6914]/40 border-t-transparent rounded-full animate-spin" />
                        )}
                      </div>
                      {locationResults.length > 0 && (
                        <div className="absolute z-20 w-full mt-1 bg-white border border-[#8B6914]/15 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {locationResults.map((result, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleLocationSelect(result)}
                              className="w-full text-left px-4 py-3 text-sm text-[#1E2A3A] hover:bg-[#8B6914]/5 transition-colors border-b border-[#8B6914]/5 last:border-0"
                            >
                              {result.display_name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {placeName && (
                      <p className="text-xs text-[#8B6914]/60 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {placeName}
                      </p>
                    )}
                  </div>
                  <details className="text-xs text-[#1E2A3A]/40">
                    <summary className="cursor-pointer hover:text-[#1E2A3A]/60 transition-colors">
                      {t("form.manualCoords") || "Koordinaten manuell eingeben"}
                    </summary>
                    <div className="mt-2">
                      <input
                        type="text"
                        value={coordinates}
                        onChange={(e) => { setCoordinates(e.target.value); setErrors((e2) => ({ ...e2, coordinates: "" })); }}
                        className={errors.coordinates ? inputErrorCls : inputCls}
                        placeholder="52.520000, 13.405000"
                      />
                      {showError("coordinates")}
                    </div>
                  </details>
                </>
              )}

              {/* Coords error (shown above timezone when the manual input details are collapsed) */}
              {errors.coordinates && (
                <p className="text-xs text-red-500">{errors.coordinates}</p>
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
                  onChange={(e) => { setTz(e.target.value); setErrors((e2) => ({ ...e2, tz: "" })); }}
                  className={errors.tz ? inputErrorCls : inputCls}
                  placeholder="Europe/Berlin"
                />
                {showError("tz")}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => { setErrors({}); setStep(1); }}
                className="w-full md:w-auto px-8 py-4 border border-[#1E2A3A]/15 text-[#1E2A3A]/55 text-[10px] uppercase tracking-[0.3em] hover:bg-[#1E2A3A]/05 transition-colors rounded"
              >
                {t("form.backBtn")}
              </button>
              <button
                type="submit"
                disabled={isLoading || submitting}
                className="w-full md:w-auto px-12 py-4 border border-[#8B6914]/30 text-[#8B6914] text-[10px] uppercase tracking-[0.3em] hover:bg-[#8B6914]/08 transition-colors disabled:opacity-50 rounded"
              >
                {t("form.submitBtn")}
              </button>
            </div>
          </motion.div>
        )}
      </form>
    </motion.div>
  );
}

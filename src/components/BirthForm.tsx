import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { ExternalLink, Info, MapPin } from "lucide-react";
import { PlaceAutocomplete, hasPlacesApiKey } from "./PlaceAutocomplete";

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
  onSubmit: (data: {
    date: string;
    tz: string;
    lon: number;
    lat: number;
  }) => void;
  isLoading: boolean;
}

export function BirthForm({ onSubmit, isLoading }: BirthFormProps) {
  const [step, setStep] = useState(1);
  const [date, setDate] = useState("1990-01-01");
  const [time, setTime] = useState("12:00");
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [coordinates, setCoordinates] = useState("52.520000, 13.405000");
  const [tz, setTz] = useState("Europe/Berlin");
  const [placeName, setPlaceName] = useState("");
  const placesAvailable = useMemo(() => hasPlacesApiKey(), []);

  // DST detection for births >= 1980
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
    
    const [latStr, lonStr] = coordinates.split(',').map(s => s.trim());
    const parsedLat = parseFloat(latStr);
    const parsedLon = parseFloat(lonStr);

    if (isNaN(parsedLat) || isNaN(parsedLon)) {
      alert("Bitte gib gültige Koordinaten im Format 'Breitengrad, Längengrad' ein (z.B. 52.399553, 13.061038).");
      return;
    }

    if (parsedLat < -90 || parsedLat > 90 || parsedLon < -180 || parsedLon > 180) {
      alert("Koordinaten außerhalb des gültigen Bereichs. Breitengrad: -90 bis 90, Längengrad: -180 bis 180.");
      return;
    }

    try {
      Intl.DateTimeFormat(undefined, { timeZone: tz });
    } catch {
      alert("Ungültige Zeitzone. Bitte nutze eine IANA-Zeitzone wie Europe/Berlin.");
      return;
    }

    onSubmit({
      date: `${date}T${time}:00`,
      tz,
      lat: parsedLat,
      lon: parsedLon,
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-12">
        <div className="relative w-64 h-1 bg-white/5 rounded-full overflow-hidden">
          <div className="absolute inset-0 skeleton-dust"></div>
        </div>
        <div className="text-center space-y-4">
          <p className="font-serif text-xl italic text-white/80 animate-pulse">Levi & Victoria synchronisieren die Ephemeriden...</p>
          <p className="font-sans text-[9px] uppercase tracking-[0.4em] text-gold/60">Berechne planetare Vektoren</p>
        </div>
        <div className="w-48 h-[1px] bg-gold/10"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl mx-auto px-6 py-12 w-full"
    >
      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-12"
          >
            <h2 className="font-serif text-3xl leading-snug">Wann hat dein Licht die Erdatmosphäre erreicht?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[8px] uppercase tracking-widest text-white/40">Datum</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-ash/40 border border-gold/10 p-4 rounded focus:outline-none focus:border-gold/40 text-sm text-white/80"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[8px] uppercase tracking-widest text-white/40">Zeitpunkt (Lokal)</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={timeUnknown}
                      onChange={(e) => {
                        setTimeUnknown(e.target.checked);
                        if (e.target.checked) setTime("12:00");
                      }}
                      className="accent-gold w-3 h-3"
                    />
                    <span className="text-[8px] uppercase tracking-widest text-white/40">Unbekannt (12:00)</span>
                  </label>
                </div>
                <input
                  type="time"
                  required={!timeUnknown}
                  disabled={timeUnknown}
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-ash/40 border border-gold/10 p-4 rounded focus:outline-none focus:border-gold/40 text-sm text-white/80 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {dstInfo && (
              <div className="flex items-start gap-2 px-4 py-3 bg-gold/5 border border-gold/10 rounded-lg">
                <Info className="w-3.5 h-3.5 text-gold/60 mt-0.5 shrink-0" />
                <p className="text-[10px] text-white/50 leading-relaxed">
                  Am gewählten Datum gilt <span className="text-gold/80 font-medium">{dstInfo.label}</span> ({dstInfo.offset}).
                  Gib deine Geburtszeit so ein, wie sie auf der Uhr stand.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                if (!date) {
                  alert("Bitte gib ein gültiges Datum ein.");
                  return;
                }
                if (!time && !timeUnknown) {
                  const useDefault = window.confirm("Du hast keine Uhrzeit angegeben. Sollen wir 12:00 Uhr als Standard verwenden?");
                  if (useDefault) {
                    setTime("12:00");
                    setTimeUnknown(true);
                    setStep(2);
                  }
                  return;
                }
                setStep(2);
              }}
              className="w-full md:w-auto px-12 py-4 border border-gold/30 text-gold text-[10px] uppercase tracking-[0.3em] hover:bg-gold/5 transition-colors"
            >
              Weiter
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-12"
          >
            <h2 className="font-serif text-3xl leading-snug">
              {placesAvailable ? "Wo begann deine Reise?" : "Unter welchen Koordinaten begann deine Reise?"}
            </h2>

            <div className="space-y-6">
              {placesAvailable ? (
                <>
                  <div className="space-y-2">
                    <label className="text-[8px] uppercase tracking-widest text-white/40">Geburtsort</label>
                    <PlaceAutocomplete
                      onSelect={({ name, lat, lon }) => {
                        setPlaceName(name);
                        setCoordinates(`${lat.toFixed(6)}, ${lon.toFixed(6)}`);
                        // Attempt timezone detection from coordinates using Intl
                        // (best-effort: defaults stay if detection fails)
                      }}
                      placeholder="Stadt suchen..."
                      className="w-full bg-ash/40 border border-gold/10 p-4 rounded focus:outline-none focus:border-gold/40 text-sm text-white/80"
                    />
                  </div>
                  {placeName && (
                    <div className="flex items-center gap-2 text-[10px] text-white/40">
                      <MapPin className="w-3 h-3 text-gold/50" />
                      <span>{coordinates}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[8px] uppercase tracking-widest text-white/40">Koordinaten (Lat, Lon)</label>
                    <a
                      href="https://www.google.com/maps"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[8px] uppercase tracking-widest text-gold/60 hover:text-gold transition-colors flex items-center gap-1"
                    >
                      Auf Google Maps finden <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <input
                    type="text"
                    required
                    value={coordinates}
                    onChange={(e) => setCoordinates(e.target.value)}
                    className="w-full bg-ash/40 border border-gold/10 p-4 rounded focus:outline-none focus:border-gold/40 text-sm text-white/80"
                    placeholder="52.399553, 13.061038"
                    pattern="^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$"
                    title="Format: Breitengrad, Längengrad (z.B. 52.399553, 13.061038)"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[8px] uppercase tracking-widest text-white/40">Zeitzone</label>
                <input
                  type="text"
                  required
                  value={tz}
                  onChange={(e) => setTz(e.target.value)}
                  className="w-full bg-ash/40 border border-gold/10 p-4 rounded focus:outline-none focus:border-gold/40 text-sm text-white/80"
                  placeholder="Europe/Berlin"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full md:w-auto px-8 py-4 border border-white/10 text-white/60 text-[10px] uppercase tracking-[0.3em] hover:bg-white/5 transition-colors"
              >
                Zurück
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full md:w-auto px-12 py-4 border border-gold/30 text-gold text-[10px] uppercase tracking-[0.3em] hover:bg-gold/5 transition-colors disabled:opacity-50"
              >
                Signatur berechnen
              </button>
            </div>
          </motion.div>
        )}
      </form>
    </motion.div>
  );
}

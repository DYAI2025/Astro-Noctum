import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { ExternalLink, Info, MapPin } from "lucide-react";
import { PlaceAutocomplete, hasPlacesApiKey } from "./PlaceAutocomplete";
import { useLanguage } from "../contexts/LanguageContext";

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

export function BirthForm({ onSubmit, isLoading }: BirthFormProps) {
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [date, setDate] = useState("1990-01-01");
  const [time, setTime] = useState("12:00");
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [coordinates, setCoordinates] = useState("52.520000, 13.405000");
  const [tz, setTz] = useState("Europe/Berlin");
  const [placeName, setPlaceName] = useState("");
  const placesAvailable = useMemo(() => hasPlacesApiKey(), []);

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

    const [latStr, lonStr] = coordinates.split(",").map((s) => s.trim());
    const parsedLat = parseFloat(latStr);
    const parsedLon = parseFloat(lonStr);

    if (isNaN(parsedLat) || isNaN(parsedLon)) {
      alert(t("form.validCoords"));
      return;
    }
    if (parsedLat < -90 || parsedLat > 90 || parsedLon < -180 || parsedLon > 180) {
      alert(t("form.coordsRange"));
      return;
    }
    try {
      Intl.DateTimeFormat(undefined, { timeZone: tz });
    } catch {
      alert(t("form.invalidTz"));
      return;
    }

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl mx-auto px-6 py-12 w-full"
    >
      <form onSubmit={handleSubmit}>

        {/* ── Step 1: Date & Time ──────────────────────────────────── */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-10"
          >
            <h2 className="font-serif text-3xl leading-snug text-[#1E2A3A]">
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
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputCls}
                />
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
                if (!date) { alert(t("form.invalidDate")); return; }
                if (!time && !timeUnknown) {
                  const ok = window.confirm(t("form.noTime"));
                  if (ok) { setTime("12:00"); setTimeUnknown(true); setStep(2); }
                  return;
                }
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
            className="space-y-10"
          >
            <h2 className="font-serif text-3xl leading-snug text-[#1E2A3A]">
              {placesAvailable ? t("form.step2Title") : t("form.step2TitleCoords")}
            </h2>

            <div className="space-y-6">
              {placesAvailable ? (
                <>
                  <div className="space-y-2">
                    <label className="text-[8px] uppercase tracking-widest text-[#1E2A3A]/50">
                      {t("form.placeLabel")}
                    </label>
                    <PlaceAutocomplete
                      onSelect={({ name, lat, lon }) => {
                        setPlaceName(name);
                        setCoordinates(`${lat.toFixed(6)}, ${lon.toFixed(6)}`);
                      }}
                      placeholder={t("form.placePlaceholder")}
                      className={inputCls}
                    />
                  </div>
                  {placeName && (
                    <div className="flex items-center gap-2 text-[10px] text-[#1E2A3A]/45">
                      <MapPin className="w-3 h-3 text-[#8B6914]/50" />
                      <span>{coordinates}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[8px] uppercase tracking-widest text-[#1E2A3A]/50">
                      {t("form.coordLabel")}
                    </label>
                    <a
                      href="https://www.google.com/maps"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[8px] uppercase tracking-widest text-[#8B6914]/60 hover:text-[#8B6914] transition-colors flex items-center gap-1"
                    >
                      {t("form.findOnMaps")} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <input
                    type="text"
                    required
                    value={coordinates}
                    onChange={(e) => setCoordinates(e.target.value)}
                    className={inputCls}
                    placeholder="52.399553, 13.061038"
                    pattern="^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$"
                    title={t("form.coordTitle")}
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[8px] uppercase tracking-widest text-[#1E2A3A]/50">
                  {t("form.timezoneLabel")}
                </label>
                <input
                  type="text"
                  required
                  value={tz}
                  onChange={(e) => setTz(e.target.value)}
                  className={inputCls}
                  placeholder="Europe/Berlin"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full md:w-auto px-8 py-4 border border-[#1E2A3A]/15 text-[#1E2A3A]/55 text-[10px] uppercase tracking-[0.3em] hover:bg-[#1E2A3A]/05 transition-colors rounded"
              >
                {t("form.backBtn")}
              </button>
              <button
                type="submit"
                disabled={isLoading}
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

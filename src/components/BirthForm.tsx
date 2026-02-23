import { useState } from "react";
import { motion } from "motion/react";

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
  const [lat, setLat] = useState("52.52");
  const [lon, setLon] = useState("13.405");
  const [tz, setTz] = useState("Europe/Berlin");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      date: `${date}T${time}:00`,
      tz,
      lat: parseFloat(lat),
      lon: parseFloat(lon),
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
                <label className="text-[8px] uppercase tracking-widest text-white/40">Zeitpunkt (Lokal)</label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-ash/40 border border-gold/10 p-4 rounded focus:outline-none focus:border-gold/40 text-sm text-white/80"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setStep(2)}
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
            <h2 className="font-serif text-3xl leading-snug">Unter welchen Koordinaten begann deine Reise?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[8px] uppercase tracking-widest text-white/40">Breitengrad (Latitude)</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  className="w-full bg-ash/40 border border-gold/10 p-4 rounded focus:outline-none focus:border-gold/40 text-sm text-white/80"
                  placeholder="52.52"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[8px] uppercase tracking-widest text-white/40">Längengrad (Longitude)</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={lon}
                  onChange={(e) => setLon(e.target.value)}
                  className="w-full bg-ash/40 border border-gold/10 p-4 rounded focus:outline-none focus:border-gold/40 text-sm text-white/80"
                  placeholder="13.405"
                />
              </div>
            </div>

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

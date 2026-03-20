import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion } from 'motion/react';
import { PlaceAutocomplete } from '../PlaceAutocomplete';
import { fetchTimezone } from '../../services/timezone';

interface EncounterBirthFormProps {
  onSubmit: (data: { date: string; tz: string; lon: number; lat: number }) => void;
  isLoading: boolean;
  onProgress?: (progress: number) => void;
  className?: string;
}

export function EncounterBirthForm({
  onSubmit,
  isLoading,
  onProgress,
  className = '',
}: EncounterBirthFormProps) {
  const [date, setDate] = useState('1990-01-01');
  const [time, setTime] = useState('12:00');
  const [placeName, setPlaceName] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [tz, setTz] = useState('Europe/Berlin');

  const progress = useMemo(() => {
    let filled = 0;
    if (date && date !== '1990-01-01') filled++;
    if (time && time !== '12:00') filled++;
    if (coords) filled++;
    return filled / 3;
  }, [date, time, coords]);

  useEffect(() => {
    onProgress?.(progress);
  }, [progress, onProgress]);

  const handlePlaceSelect = useCallback(async (place: { name: string; lat: number; lon: number }) => {
    setPlaceName(place.name);
    setCoords({ lat: place.lat, lon: place.lon });
    const detected = await fetchTimezone(place.lat, place.lon);
    if (detected) setTz(detected);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!coords) return;
    onSubmit({ date: `${date}T${time}:00`, tz, lon: coords.lon, lat: coords.lat });
  }, [date, time, coords, tz, onSubmit]);

  const canSubmit = Boolean(coords) && Boolean(date) && !isLoading;

  return (
    <motion.form
      data-testid="encounter-form"
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className={`w-full max-w-md mx-auto p-6 rounded-2xl bg-white/[0.02] backdrop-blur-lg border border-[#D4AF37]/[0.08] shadow-[0_0_40px_rgba(212,175,55,0.04)] space-y-5 ${className}`}
    >
      <div data-testid="encounter-place">
        <label className="block font-serif text-xs uppercase tracking-[0.3em] text-[#D4AF37]/50 mb-2">
          Geburtsort
        </label>
        <PlaceAutocomplete
          onSelect={handlePlaceSelect}
          placeholder="Stadt eingeben..."
          className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-[#D4AF37]/[0.1] text-white/80 font-sans text-sm placeholder:text-white/20 focus:border-[#D4AF37]/30 focus:outline-none transition-colors"
        />
        {placeName && <p className="mt-1 text-[10px] text-[#D4AF37]/40 font-sans">{placeName}</p>}
      </div>

      <div>
        <label className="block font-serif text-xs uppercase tracking-[0.3em] text-[#D4AF37]/50 mb-2">
          Geburtsdatum
        </label>
        <input
          data-testid="encounter-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-[#D4AF37]/[0.1] text-white/80 font-sans text-sm focus:border-[#D4AF37]/30 focus:outline-none transition-colors"
        />
      </div>

      <div>
        <label className="block font-serif text-xs uppercase tracking-[0.3em] text-[#D4AF37]/50 mb-2">
          Geburtszeit
        </label>
        <input
          data-testid="encounter-time"
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-[#D4AF37]/[0.1] text-white/80 font-sans text-sm focus:border-[#D4AF37]/30 focus:outline-none transition-colors"
        />
      </div>

      <motion.button
        data-testid="encounter-submit"
        type="submit"
        disabled={!canSubmit}
        whileHover={canSubmit ? { scale: 1.02 } : {}}
        whileTap={canSubmit ? { scale: 0.98 } : {}}
        className={`w-full py-3.5 rounded-xl font-sans text-sm tracking-[0.15em] uppercase border transition-all duration-500 ${canSubmit ? 'border-[#D4AF37]/30 text-[#D4AF37] bg-[#D4AF37]/[0.06] hover:bg-[#D4AF37]/[0.12] hover:border-[#D4AF37]/50 cursor-pointer' : 'border-white/5 text-white/20 bg-transparent cursor-not-allowed'}`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-1 h-1 bg-[#D4AF37] rounded-full animate-ping" />
            Berechne...
          </span>
        ) : (
          'Signatur berechnen'
        )}
      </motion.button>
    </motion.form>
  );
}

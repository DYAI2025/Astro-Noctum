
import React, { useState } from 'react';
import { Calendar, Clock, MapPin, User, Sparkles, Loader2, Search, CheckCircle2, CalendarDays } from 'lucide-react';

interface HoroscopeInputProps {
  onCalculate: (data: any) => void;
}

const HoroscopeInput: React.FC<HoroscopeInputProps> = ({ onCalculate }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    year: '',
    date: '',
    time: '',
    timeUnknown: false,
    location: '',
  });

  // Generate a range of years for the BaZi-specific dropdown
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 121 }, (_, i) => (currentYear - i).toString());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      onCalculate(formData);
      setTimeout(() => setSuccess(false), 3000);
    }, 2500);
  };

  return (
    <div className="max-w-4xl mx-auto premium-card p-14 relative group">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
        <div>
          <div className="flex items-center gap-4 mb-3">
             <div className="w-1.5 h-1.5 rounded-full bg-[#C9A46A]" />
             <span className="mono text-[11px] text-[#5A6477] font-bold tracking-[0.6em] uppercase">Calibration_Input</span>
          </div>
          <h2 className="serif text-5xl text-[#0E1B33] font-light">Horoskop-Konfiguration</h2>
        </div>
        <div className="px-6 py-2 border border-[#E6E0D8] rounded-full mono text-[9px] text-[#5A6477] font-bold uppercase tracking-widest bg-[#F6F3EE]">
           System: Ready
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Profile Name */}
        <div className="space-y-4">
          <label className="flex items-center gap-3 mono text-[11px] text-[#0E1B33] uppercase font-extrabold tracking-widest ml-1">
            <User size={14} /> Profilname
          </label>
          <input
            type="text"
            placeholder="Name eintragen..."
            className="w-full bg-[#F6F3EE] border border-[#E6E0D8] rounded-2xl px-6 py-5 text-[#0E1B33] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#C9A46A] transition-all"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        {/* Birth Place */}
        <div className="space-y-4">
          <label className="flex items-center gap-3 mono text-[11px] text-[#0E1B33] uppercase font-extrabold tracking-widest ml-1">
            <MapPin size={14} /> Geburtsort
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Stadt suchen..."
              className="w-full bg-[#F6F3EE] border border-[#E6E0D8] rounded-2xl px-6 py-5 pl-14 text-[#0E1B33] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#C9A46A] transition-all"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
            />
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#A1A1AA]" size={16} />
          </div>
        </div>

        {/* Birth Year Dropdown (Mandatory for BaZi) */}
        <div className="space-y-4">
          <label className="flex items-center gap-3 mono text-[11px] text-[#0E1B33] uppercase font-extrabold tracking-widest ml-1">
            <CalendarDays size={14} /> Geburtsjahr <span className="text-[#C9A46A] text-[8px] tracking-tight">(BAZI_REQ)</span>
          </label>
          <select
            className="w-full bg-[#F6F3EE] border border-[#E6E0D8] rounded-2xl px-6 py-5 text-[#0E1B33] focus:outline-none focus:border-[#C9A46A] transition-all appearance-none cursor-pointer"
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
            required
          >
            <option value="" disabled>Jahr wählen...</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Birth Date (Day/Month) */}
        <div className="space-y-4">
          <label className="flex items-center gap-3 mono text-[11px] text-[#0E1B33] uppercase font-extrabold tracking-widest ml-1">
            <Calendar size={14} /> Tag & Monat
          </label>
          <input
            type="date"
            className="w-full bg-[#F6F3EE] border border-[#E6E0D8] rounded-2xl px-6 py-5 text-[#0E1B33] focus:outline-none focus:border-[#C9A46A] transition-all [color-scheme:light]"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>

        {/* Birth Time */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="flex items-center gap-3 mono text-[11px] text-[#0E1B33] uppercase font-extrabold tracking-widest">
              <Clock size={14} /> Geburtszeit
            </label>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, timeUnknown: !formData.timeUnknown })}
              className={`text-[10px] mono uppercase tracking-widest font-bold transition-colors ${formData.timeUnknown ? 'text-[#C9A46A]' : 'text-[#A1A1AA] hover:text-[#0E1B33]'}`}
            >
              {formData.timeUnknown ? '[X] Unbekannt' : '[ ] Unbekannt'}
            </button>
          </div>
          <input
            type="time"
            disabled={formData.timeUnknown}
            className={`w-full bg-[#F6F3EE] border border-[#E6E0D8] rounded-2xl px-6 py-5 text-[#0E1B33] focus:outline-none transition-all [color-scheme:light] ${formData.timeUnknown ? 'opacity-30 cursor-not-allowed' : 'focus:border-[#C9A46A]'}`}
            value={formData.timeUnknown ? '12:00' : formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            required={!formData.timeUnknown}
          />
        </div>

        {/* Action Button */}
        <div className="md:col-span-2 pt-10">
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-6 rounded-3xl text-[12px] font-extrabold uppercase tracking-[0.5em] transition-all flex items-center justify-center gap-4
              ${loading 
                ? 'bg-[#E6E0D8] text-[#5A6477] cursor-wait' 
                : success 
                  ? 'bg-[#7AA7A1] text-white shadow-xl shadow-[#7AA7A1]/20' 
                  : 'bg-[#0E1B33] text-white hover:bg-[#8F7AD1] hover:shadow-2xl hover:shadow-[#0E1B33]/30'}`}
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : success ? (
              <CheckCircle2 size={18} />
            ) : (
              <Sparkles size={18} />
            )}
            {loading ? 'CALIBRATING...' : success ? 'CALCULATION_COMPLETE' : 'Horoskop berechnen'}
          </button>
          <p className="mt-6 text-center mono text-[9px] text-[#A1A1AA] uppercase tracking-[0.4em]">
            Precision: Enhanced • Engine: Swiss_Ephemeris_v10
          </p>
        </div>
      </form>
    </div>
  );
};

export default HoroscopeInput;

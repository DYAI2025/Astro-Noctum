'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, Info, AlertCircle } from 'lucide-react';
import { MAJOR_CITIES, PlaceOption } from '@/lib/places';
import { upsertProfile } from '@/lib/astroProfiles';
import { createClient } from '@/lib/supabase/client';
import DstFoldModal from '@/components/onboarding/DstFoldModal';

export default function OnboardingPage() {
    const router = useRouter();
    // Intentionally create the Supabase client only once for this component.
    // The client manages authentication state internally, so we do not need
    // to recreate it in response to auth changes.
    const supabase = useMemo(() => createClient(), []);
    const [loading, setLoading] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [errorCode, setErrorCode] = useState<string | null>(null);

    const [showDstModal, setShowDstModal] = useState(false);
    const [selectedFold, setSelectedFold] = useState<number | null>(null);

    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [selectedPlace, setSelectedPlace] = useState<PlaceOption | null>(null);
    const [name, setName] = useState('');

    const [timeBlurred, setTimeBlurred] = useState(false);

    const canSubmit = Boolean(date && time && selectedPlace && name);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.replace('/login');
                return;
            }

            setAuthChecked(true);
        };

        checkAuth();
    }, [router, supabase]);

    const runFlow = async (foldOverride?: number | null) => {
        if (!canSubmit || !selectedPlace) return;
        setErrorMessage(null);
        setErrorCode(null);
        setLoading(true);

        try {
            await upsertProfile({
                username: name,
                birth_date: date,
                birth_time: time,
                birth_place_name: selectedPlace.name,
                birth_place_country: selectedPlace.country,
                birth_lat: selectedPlace.lat,
                birth_lng: selectedPlace.lng,
                iana_time_zone: selectedPlace.tz,
                fold: foldOverride ?? selectedFold,
            });

            const res = await fetch('/api/astro-compute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ force: true })
            });

            const data = await res.json();

            if (res.status === 401) {
                router.replace('/login');
                setLoading(false);
                return;
            }

            if (!res.ok) {
                setErrorCode(data.code || null);

                if (data.code === 'AMBIGUOUS_LOCAL_TIME') {
                    setShowDstModal(true);
                    setLoading(false);
                    return;
                }

                if (data.code === 'NONEXISTENT_LOCAL_TIME') {
                    setErrorMessage('Diese Uhrzeit existiert nicht (DST-Lücke). Bitte wähle eine andere Zeit.');
                } else {
                    setErrorMessage(data.error || 'Berechnung fehlgeschlagen');
                }
                setLoading(false);
                return;
            }

            setLoading(false);
            router.push('/astrosheet');

        } catch (err: unknown) {
            console.error('Onboarding failed:', err);
            const msg = err instanceof Error ? err.message : 'Unbekannter Fehler';
            setErrorMessage(msg);
            setLoading(false);
        }
    };

    const handleDstSelect = async (fold: 0 | 1) => {
        setSelectedFold(fold);
        setShowDstModal(false);
        await runFlow(fold);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await runFlow();
    };

    const formatDisplayDate = (dateStr: string) => {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-');
        return `${d}.${m}.${y}`;
    };

    if (!authChecked) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-[#F6F3EE] text-[#0E1B33]">
                <Loader2 className="animate-spin text-[#C9A46A]" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#F6F3EE] text-[#0E1B33]">
           <div className="w-full max-w-lg p-12 bg-white border border-[#E6E0D8] shadow-xl rounded-3xl">
              <div className="text-center mb-12">
                 <h1 className="serif text-4xl mb-2">Origin Point</h1>
                 <p className="mono text-[10px] uppercase tracking-widest text-[#5A6477]">
                    Calibration Sequence
                 </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                 <div className="space-y-3">
                    <label htmlFor="name-input" className="mono text-[10px] uppercase tracking-widest font-bold">Callsign</label>
                    <input
                       id="name-input"
                       type="text"
                       value={name}
                       onChange={(e) => setName(e.target.value)}
                       placeholder="Enter your name"
                       required
                       className="w-full p-4 bg-[#F6F3EE] rounded-xl border-none focus:ring-1 focus:ring-[#C9A46A] transition-all"
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                        <label htmlFor="date-input" className="mono text-[10px] uppercase tracking-widest font-bold">Date</label>
                        <input
                           id="date-input"
                           title="Birth Date"
                           type="date"
                           value={date}
                           onChange={(e) => setDate(e.target.value)}
                           required
                           className="w-full p-4 bg-[#F6F3EE] rounded-xl border-none focus:ring-1 focus:ring-[#C9A46A] transition-all"
                        />
                    </div>
                    <div className="space-y-3">
                        <label htmlFor="time-input" className="mono text-[10px] uppercase tracking-widest font-bold flex items-center gap-2">
                            Time
                            <span className="text-[#C9A46A]">*</span>
                        </label>
                        <input
                           id="time-input"
                           title="Birth Time"
                           type="time"
                           value={time}
                           onChange={(e) => setTime(e.target.value)}
                           onBlur={() => setTimeBlurred(true)}
                           required
                           className="w-full p-4 bg-[#F6F3EE] rounded-xl border-none focus:ring-1 focus:ring-[#C9A46A] transition-all"
                        />
                    </div>
                 </div>

                 <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl" data-testid="precision-hint">
                    <Info className="text-amber-600 mt-0.5 flex-shrink-0" size={16} />
                    <div className="text-[12px] text-amber-800 leading-relaxed">
                        <strong>Präzision ist entscheidend:</strong> Ohne exakte Geburtszeit sinkt die Genauigkeit
                        deines Horoskops um 10-15%. Ascendent und Häuser können nur mit genauer Uhrzeit berechnet werden.
                        {!time && timeBlurred && (
                            <span className="block mt-2 text-amber-700 font-medium">
                                → Bitte gib deine Geburtszeit ein (Format: HH:MM)
                            </span>
                        )}
                    </div>
                 </div>

                 <div className="space-y-3">
                    <label htmlFor="place-select" className="mono text-[10px] uppercase tracking-widest font-bold">Location</label>
                    <select
                       id="place-select"
                       title="Birth Place"
                       value={selectedPlace?.name || ''}
                       onChange={(e) => {
                           const place = MAJOR_CITIES.find(p => p.name === e.target.value);
                           setSelectedPlace(place || null);
                       }}
                       required
                       className="w-full p-4 bg-[#F6F3EE] rounded-xl border-none focus:ring-1 focus:ring-[#C9A46A] transition-all"
                    >
                       <option value="">Select major city...</option>
                       {MAJOR_CITIES.map(c => (
                           <option key={c.name} value={c.name}>{c.name}, {c.country}</option>
                       ))}
                    </select>
                    <p className="text-[10px] text-[#A1A1AA] text-right">
                       *MVP: Validated Major Cities Only
                    </p>
                 </div>

                 {selectedPlace && (
                    <div className="flex items-start gap-3 p-4 bg-[#F6F3EE] border border-[#E6E0D8] rounded-xl">
                        <AlertCircle className="text-[#7AA7A1] mt-0.5 flex-shrink-0" size={16} />
                        <div className="text-[11px] text-[#5A6477] leading-relaxed">
                            <strong>Längengrad-Korrektur aktiv:</strong> Die Berechnung berücksichtigt die
                            exakte Position von {selectedPlace.name} ({Math.abs(selectedPlace.lat).toFixed(2)}°{selectedPlace.lat >= 0 ? 'N' : 'S'}, {Math.abs(selectedPlace.lng).toFixed(2)}°{selectedPlace.lng >= 0 ? 'E' : 'W'})
                            für maximale Präzision bei Aszendent und Häusern.
                        </div>
                    </div>
                 )}

                 <button
                    type="submit"
                    disabled={!canSubmit || loading}
                    className="w-full py-5 bg-[#0E1B33] text-white rounded-xl font-bold uppercase tracking-widest hover:bg-[#1a2c4e] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
                 >
                    {loading ? <Loader2 className="animate-spin" /> : <>Initialize <ArrowRight size={16}/></>}
                 </button>

                 {errorMessage && (
                    <div className="p-4 border border-red-200 bg-red-50 text-red-800 rounded-xl flex flex-col gap-3">
                        <p className="mono text-[12px]">{errorMessage}</p>
                        {errorCode === 'NONEXISTENT_LOCAL_TIME' && (
                            <p className="text-[11px] text-red-600">
                                Tipp: Während der Zeitumstellung im Frühjahr existieren bestimmte Uhrzeiten nicht.
                                Wähle eine Zeit vor oder nach der Umstellung.
                            </p>
                        )}
                        <div className="flex gap-3 flex-wrap">
                            <button
                                type="button"
                                disabled={!canSubmit || loading}
                                onClick={() => runFlow()}
                                className="px-4 py-3 bg-[#0E1B33] text-white rounded-lg text-[12px] font-bold uppercase tracking-[0.2em] hover:bg-[#1a2c4e] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Erneut versuchen
                            </button>
                            <button
                                type="button"
                                onClick={() => router.push('/login')}
                                className="px-4 py-3 border border-[#E6E0D8] rounded-lg text-[12px] font-bold uppercase tracking-[0.2em] hover:border-[#0E1B33]"
                            >
                                Zur Login-Seite
                            </button>
                        </div>
                    </div>
                 )}
              </form>
           </div>

           <DstFoldModal
               isOpen={showDstModal}
               onClose={() => setShowDstModal(false)}
               onSelect={handleDstSelect}
               time={time}
               date={formatDisplayDate(date)}
           />
        </div>
    );
}

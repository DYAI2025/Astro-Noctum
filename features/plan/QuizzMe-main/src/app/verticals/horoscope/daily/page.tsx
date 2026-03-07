"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getSnapshotClient } from "@/lib/api";
import { calculateDailyTransits, calculateEnergyPeaks, getDayQuality } from "@/lib/astro/compute";
import { getInterpretation } from "@/lib/astro/interpretations";

export default function DailyHoroscopePage() {
    const router = useRouter();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getSnapshotClient().then((result) => {
            setProfile(result.snapshot);
            setLoading(false);
        });
    }, []);

    const horoscopeData = useMemo(() => {
        if (!profile?.astro?.western?.sunSign) return null;

        // Calculate transits using the natal sun sign from profile
        const natalChart = {
            western: {
                sunSign: profile.astro.western.sunSign
            }
        };

        const transits = calculateDailyTransits(natalChart, new Date());
        const energyPeaks = calculateEnergyPeaks(transits);
        const dayQuality = getDayQuality(transits);

        // Get interpretation for active transits
        const primaryTransit = transits.activeTransits[0];
        const interpretation = primaryTransit
            ? getInterpretation(primaryTransit.key)
            : getInterpretation('default');

        return {
            transits,
            energyPeaks,
            dayQuality,
            interpretation
        };
    }, [profile]);

    if (loading) {
        return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading your stars...</div>;
    }

    if (!profile?.astro?.western?.sunSign) {
        return (
            <div className="min-h-screen bg-slate-950 text-white p-8 flex flex-col items-center justify-center">
                <h1 className="text-2xl mb-4">Astralprofil nicht gefunden</h1>
                <button
                    onClick={() => router.push("/onboarding/astro")}
                    className="bg-indigo-600 px-6 py-2 rounded-lg"
                >
                    Profil erstellen
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
            {/* Header */}
            <div className="relative h-48 bg-gradient-to-b from-indigo-900 to-slate-950 overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[url('/assets/stars-bg.png')]"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-950 to-transparent">
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-purple-400">
                        Ihr Tageshoroskop
                    </h1>
                    <p className="text-slate-400">
                        Für {profile.identity?.displayName || "Sie"} • {new Date().toLocaleDateString('de-DE')}
                    </p>
                </div>
            </div>

            <div className="max-w-md mx-auto px-4 -mt-8 relative z-10 space-y-6">

                {/* Day Quality Badge */}
                {horoscopeData && (
                    <div className="flex justify-center">
                        <div
                            className="px-6 py-3 rounded-full border text-sm font-bold"
                            style={{
                                backgroundColor: `${horoscopeData.dayQuality.color}20`,
                                borderColor: horoscopeData.dayQuality.color,
                                color: horoscopeData.dayQuality.color
                            }}
                        >
                            Tagesqualität: {horoscopeData.dayQuality.label} ({horoscopeData.dayQuality.score}%)
                        </div>
                    </div>
                )}

                {/* Main Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="text-4xl">☀</div>
                        <div>
                            <h2 className="text-xl font-bold">
                                {horoscopeData?.interpretation.title || "Kosmische Schwingungen"}
                            </h2>
                            <p className="text-sm text-indigo-400">Transit-Einfluss</p>
                        </div>
                    </div>

                    <div className="prose prose-invert">
                        <p>
                            {horoscopeData?.interpretation.text || "Die Planetenkonstellationen wirken subtil auf Sie ein."}
                        </p>
                    </div>

                    {/* Keywords */}
                    {horoscopeData?.interpretation.keywords && (
                        <div className="flex flex-wrap gap-2 mt-4">
                            {horoscopeData.interpretation.keywords.map((keyword: string) => (
                                <span
                                    key={keyword}
                                    className="px-3 py-1 bg-indigo-900/50 border border-indigo-700/50 rounded-full text-xs text-indigo-300"
                                >
                                    {keyword}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Moon Phase & Element */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                        <div className="text-sm text-slate-400 mb-1">Mondphase</div>
                        <div className="text-lg font-medium">
                            {horoscopeData?.transits.moonPhase.label || "Unbekannt"}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                            {Math.round((horoscopeData?.transits.moonPhase.illumination || 0) * 100)}% beleuchtet
                        </div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                        <div className="text-sm text-slate-400 mb-1">Aktive Transits</div>
                        <div className="text-lg font-medium">
                            {horoscopeData?.transits.activeTransits.length || 0}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                            kosmische Einflüsse
                        </div>
                    </div>
                </div>

                {/* Energy Peaks */}
                {horoscopeData?.energyPeaks && (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <h3 className="text-lg font-bold mb-4">Energie-Peaks heute</h3>
                        <div className="space-y-3">
                            {horoscopeData.energyPeaks.map((peak: any, index: number) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 rounded-lg"
                                    style={{
                                        backgroundColor: peak.type === 'high' ? 'rgba(34, 197, 94, 0.1)' :
                                            peak.type === 'low' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(100, 116, 139, 0.1)'
                                    }}
                                >
                                    <div>
                                        <div className="font-medium text-sm">{peak.time}</div>
                                        <div className="text-xs text-slate-400">{peak.description}</div>
                                    </div>
                                    <div
                                        className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                                            peak.type === 'high' ? 'bg-green-900/50 text-green-400' :
                                            peak.type === 'low' ? 'bg-red-900/50 text-red-400' :
                                            'bg-slate-700/50 text-slate-400'
                                        }`}
                                    >
                                        {peak.type === 'high' ? 'Hoch' : peak.type === 'low' ? 'Niedrig' : 'Mittel'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}


import React from 'react';
import { ProfileSnapshot } from '@/lib/lme/types';
import { Target, Zap, Brain, Eye, Shield } from 'lucide-react';

interface SkillsRadarSectionProps {
    snapshot: ProfileSnapshot;
}

// Config for the radar axes
const RADAR_AXES = [
    { id: 'trait.skills.logic', label: 'LOGIC', angle: -90, icon: Brain },          // Top
    { id: 'trait.skills.creativity', label: 'CREATIVITY', angle: -18, icon: Zap },  // Top Right
    { id: 'trait.skills.social', label: 'SOCIAL', angle: 54, icon: Eye },           // Bottom Right
    { id: 'trait.skills.focus', label: 'FOCUS', angle: 126, icon: Target },         // Bottom Left
    { id: 'trait.skills.resilience', label: 'RESILIENCE', angle: 198, icon: Shield },// Top Left
];

export function SkillsRadarSection({ snapshot }: SkillsRadarSectionProps) {
    // 1. Get Data (Fallback to 30 if missing to show the chart shape)
    const getScore = (id: string) => {
        const trait = snapshot.traits[id];
        return trait ? trait.score : 30; // Default base value for visualization if empty
    };

    const scores = RADAR_AXES.map(axis => getScore(axis.id));

    // 2. Calculate Polygon Points
    // Center is 150, 150. Radius is 100.
    const CX = 150;
    const CY = 150;
    const RADIUS = 100;

    const points = RADAR_AXES.map((axis, i) => {
        const score = scores[i];
        const normalized = score / 100; // 0..1
        const r = normalized * RADIUS;
        const rad = (axis.angle * Math.PI) / 180;
        const x = CX + r * Math.cos(rad);
        const y = CY + r * Math.sin(rad);
        return `${x},${y}`;
    }).join(' ');

    // 3. System vs Story (Block H Part 2)
    const sysVsStory = snapshot.traits['trait.cognition.system_vs_story']?.score ?? 50;

    return (
        <section className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/5 shadow-xl relative overflow-hidden flex flex-col items-center">

            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.05),transparent_50%)] pointer-events-none" />

            <div className="w-full flex justify-between items-center mb-6 relative z-10">
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <Brain size={18} />
                    </span>
                    Skills Matrix
                </h2>
                <div className="px-3 py-1 bg-emerald-950/50 border border-emerald-500/30 rounded text-xs text-emerald-400 font-mono tracking-wider">
                    Lvl. {Math.floor(Object.values(snapshot.traits).length / 5) + 1}
                </div>
            </div>

            {/* Radar Chart Container */}
            <div className="relative w-[300px] h-[300px] mb-8 group cursor-crosshair">

                {/* SVG Chart */}
                <svg width="300" height="300" viewBox="0 0 300 300" className="overflow-visible">
                    <defs>
                        <filter id="glow-emerald" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                        <radialGradient id="radar-fill" cx="0.5" cy="0.5" r="0.5">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0.1" />
                        </radialGradient>
                    </defs>

                    {/* Grid Levels (20%, 40%, 60%, 80%, 100%) */}
                    {[0.2, 0.4, 0.6, 0.8, 1.0].map((scale, i) => (
                        <polygon
                            key={i}
                            points={RADAR_AXES.map(axis => {
                                const r = RADIUS * scale;
                                const rad = (axis.angle * Math.PI) / 180;
                                return `${CX + r * Math.cos(rad)},${CY + r * Math.sin(rad)}`;
                            }).join(' ')}
                            fill="none"
                            stroke="#334155" // Slate-700
                            strokeWidth="1"
                            strokeOpacity={i === 4 ? 0.5 : 0.2}
                            strokeDasharray={i === 4 ? "0" : "4 2"}
                        />
                    ))}

                    {/* Axis Lines */}
                    {RADAR_AXES.map((axis, i) => {
                        const rad = (axis.angle * Math.PI) / 180;
                        const x = CX + RADIUS * Math.cos(rad);
                        const y = CY + RADIUS * Math.sin(rad);
                        return (
                            <line
                                key={i}
                                x1={CX} y1={CY}
                                x2={x} y2={y}
                                stroke="#334155"
                                strokeWidth="1"
                                strokeOpacity="0.3"
                            />
                        );
                    })}

                    {/* Data Polygon */}
                    <polygon
                        points={points}
                        fill="url(#radar-fill)"
                        stroke="#34d399" // Emerald-400
                        strokeWidth="2"
                        filter="url(#glow-emerald)"
                        className="transition-all duration-1000 ease-out"
                    />

                    {/* Data Points (Vertices) */}
                    {RADAR_AXES.map((axis, i) => {
                        const score = scores[i];
                        const normalized = score / 100;
                        const r = normalized * RADIUS;
                        const rad = (axis.angle * Math.PI) / 180;
                        const x = CX + r * Math.cos(rad);
                        const y = CY + r * Math.sin(rad);
                        return (
                            <g key={i} className="group/point">
                                <circle cx={x} cy={y} r="3" fill="#10b981" className="shadow-lg" />
                                <circle cx={x} cy={y} r="8" fill="transparent" stroke="transparent" /> {/* Hit area */}
                            </g>
                        );
                    })}
                </svg>

                {/* Labels (HTML Absolute positioned for easier styling/icons) */}
                {RADAR_AXES.map((axis, i) => {
                    // Position calculations for labels (push them out a bit further than radius 100)
                    const LABEL_RADIUS = 135;
                    const rad = (axis.angle * Math.PI) / 180;
                    // Adjust center to top-left of the box
                    // We need to center the label div around the point
                    const left = CX + LABEL_RADIUS * Math.cos(rad);
                    const top = CY + LABEL_RADIUS * Math.sin(rad);

                    return (
                        <div
                            key={axis.id}
                            className="absolute flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                            style={{ left: `${left}px`, top: `${top}px` }}
                        >
                            <axis.icon size={16} className={`mb-1 ${scores[i] > 70 ? 'text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]' : 'text-slate-500'}`} />
                            <span className={`text-[10px] uppercase font-bold tracking-widest ${scores[i] > 70 ? 'text-emerald-100' : 'text-slate-500'}`}>
                                {axis.label}
                            </span>
                            <span className="text-[9px] font-mono text-emerald-500/80 mt-[2px]">
                                {scores[i]}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Slider: System vs Story */}
            <div className="w-full mt-4 bg-slate-800/40 rounded-xl p-4 border border-white/5">
                <div className="flex justify-between text-xs text-slate-400 uppercase tracking-wider mb-2 font-bold">
                    <span>System Thinking</span>
                    <span>Story Thinking</span>
                </div>
                <div className="relative h-2 bg-slate-700/50 rounded-full overflow-hidden">
                    <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-500/50 z-0" />
                    <div
                        className="absolute top-0 bottom-0 bg-emerald-500/50 transition-all duration-700"
                        style={{
                            left: sysVsStory < 50 ? `${sysVsStory}%` : '50%',
                            right: sysVsStory > 50 ? `${100 - sysVsStory}%` : '50%'
                        }}
                    />
                    <div
                        className="absolute top-1/2 -ml-1.5 w-3 h-3 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.8)] z-10 transition-all duration-700"
                        style={{ left: `${sysVsStory}%`, marginTop: '-6px' }}
                    />
                </div>
            </div>

        </section>
    );
}

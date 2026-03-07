
import React from 'react';
import Link from 'next/link';
import { PlayCircle, Star, BookOpen } from 'lucide-react';

export function VerticalNav() {
    return (
        <section className="mt-12 mb-20">
            <div className="flex items-center justify-between mb-8 px-4">
                <h3 className="text-lg font-bold text-white">Entdecke mehr</h3>
                <span className="text-xs text-slate-500 uppercase tracking-widest">Verticals</span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-2">
                {/* Tiles */}
                <Link href="/verticals/quiz" className="block group">
                    <div className="bg-slate-800/50 hover:bg-slate-800 transition-colors rounded-2xl p-6 border border-white/5 h-full flex flex-col justify-between">
                        <div className="mb-4 text-purple-400">
                            <PlayCircle size={32} />
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-1">Quizzes</h4>
                            <p className="text-slate-500 text-xs leading-relaxed">Persönlichkeit, Liebe & Archetypen.</p>
                        </div>
                    </div>
                </Link>

                <Link href="/verticals/horoscope" className="block group">
                    <div className="bg-slate-800/50 hover:bg-slate-800 transition-colors rounded-2xl p-6 border border-white/5 h-full flex flex-col justify-between">
                        <div className="mb-4 text-amber-400">
                            <Star size={32} />
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-1">Horoscope</h4>
                            <p className="text-slate-500 text-xs leading-relaxed">Sterne, Zeichen & Destiny.</p>
                        </div>
                    </div>
                </Link>

                <Link href="/verticals/rituals" className="block group opacity-50 cursor-not-allowed">
                    <div className="bg-slate-900/30 rounded-2xl p-6 border border-white/5 h-full flex flex-col justify-between grayscale">
                        <div className="mb-4 text-slate-600">
                            <BookOpen size={32} />
                        </div>
                        <div>
                            <h4 className="text-slate-500 font-bold mb-1">Rituals</h4>
                            <p className="text-slate-600 text-xs leading-relaxed">Bald verfügbar.</p>
                        </div>
                    </div>
                </Link>

            </div>
        </section>
    );
}

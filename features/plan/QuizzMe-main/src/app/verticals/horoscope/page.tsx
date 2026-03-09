"use client";

import { AlchemyBackground } from "@/components/ui/AlchemyBackground";
import { QuizSymbol } from "@/components/ui/QuizSymbol";

export default function HoroscopeLandingPage() {
    return (
        <AlchemyBackground
            withStars
            withBotanicals
            backgroundImage="/assets/images/backgrounds/horoscope-bg.png"
        >
            <div className="min-h-screen p-8 text-white font-serif">
                <div className="max-w-4xl mx-auto">
                    <header className="text-center mb-16 pt-8">
                        <h1
                            className="text-4xl md:text-5xl font-bold mb-4 tracking-wide"
                            style={{
                                fontFamily: 'var(--font-serif)',
                                color: 'var(--alchemy-gold-primary)',
                                filter: 'drop-shadow(0 0 10px rgba(210, 169, 90, 0.3))'
                            }}
                        >
                            Horoscope & Destiny
                        </h1>
                        <p
                            className="italic text-lg"
                            style={{ color: 'var(--alchemy-gold-muted)' }}
                        >
                            The stars are just the beginning.
                        </p>
                    </header>

                    {/* Featured Access */}
                    <div className="mb-16">
                        <a
                            href="/quiz/destiny"
                            className="block w-full p-8 rounded-2xl border transition-all group text-center backdrop-blur-sm relative overflow-hidden"
                            style={{
                                background: 'rgba(210, 169, 90, 0.08)',
                                borderColor: 'rgba(210, 169, 90, 0.3)',
                            }}
                        >
                            {/* Subtle gold glow behind the card */}
                            <div
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ background: 'rgba(210, 169, 90, 0.05)' }}
                            />

                            <div className="relative z-10 flex flex-col items-center">
                                <div className="mb-6">
                                    <QuizSymbol variant="destiny" size="large" />
                                </div>
                                <h2
                                    className="text-2xl font-bold mb-2"
                                    style={{ fontFamily: 'var(--font-serif)', color: 'var(--alchemy-gold-primary)' }}
                                >
                                    Destiny Check
                                </h2>
                                <p
                                    className="max-w-lg mx-auto mb-6"
                                    style={{ color: 'var(--alchemy-gold-muted)' }}
                                >
                                    Bist du zu Höherem bestimmt? Mache den Test und entdecke dein wahres Potenzial jenseits der Sterne.
                                </p>
                                <div
                                    className="inline-block px-8 py-3 rounded-full border text-sm group-hover:bg-[rgba(210,169,90,0.1)] transition-all font-sans uppercase tracking-wider"
                                    style={{
                                        borderColor: 'rgba(210, 169, 90, 0.5)',
                                        color: 'var(--alchemy-gold-muted)',
                                    }}
                                >
                                    Jetzt starten
                                </div>
                            </div>
                        </a>
                    </div>

                    <h3
                        className="text-center text-xs uppercase tracking-widest mb-8 font-sans"
                        style={{ color: 'var(--alchemy-gold-muted)' }}
                    >
                        Daily Insights
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'].map(sign => (
                            <a
                                href={`/verticals/horoscope/${sign.toLowerCase()}`}
                                key={sign}
                                className="aspect-square flex flex-col items-center justify-center p-4 rounded-xl border text-center cursor-pointer transition-all group backdrop-blur-sm"
                                style={{
                                    background: 'rgba(210, 169, 90, 0.05)',
                                    borderColor: 'rgba(255, 255, 255, 0.05)',
                                }}
                            >
                                <span
                                    className="text-3xl mb-3 opacity-50 group-hover:opacity-100 transition-opacity filter drop-shadow-lg"
                                    style={{ color: 'var(--alchemy-gold-primary)' }}
                                >
                                    ✨
                                </span>
                                <span
                                    className="font-medium uppercase text-xs tracking-wider transition-colors"
                                    style={{ color: 'var(--alchemy-text-light-muted)' }}
                                >
                                    {sign}
                                </span>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </AlchemyBackground>
    )
}

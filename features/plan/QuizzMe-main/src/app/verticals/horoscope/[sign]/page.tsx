import Link from 'next/link';

export function generateStaticParams() {
    const signs = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
    return signs.map((sign) => ({
        sign: sign,
    }))
}

export default async function HoroscopeSignPage({ params }: { params: Promise<{ sign: string }> }) {
    const { sign } = await params
    const capitalizedSign = sign.charAt(0).toUpperCase() + sign.slice(1);

    // Placeholder data - in a real app this would come from an API or database
    const horoscopeText = `The stars align for ${capitalizedSign} today. Focus on your inner strength and listen to your intuition. A surprise encounter may bring new opportunities.`;

    return (
        <div className="min-h-screen p-8 bg-slate-950 text-white font-serif flex flex-col items-center">
            <div className="max-w-2xl w-full">
                <Link href="/verticals/horoscope" className="text-amber-500/50 hover:text-amber-400 mb-8 block transition-colors">← Back to Stars</Link>

                <header className="text-center mb-12">
                    <div className="text-6xl mb-4 opacity-80">✨</div>
                    <h1 className="text-5xl font-bold mb-2 text-amber-100">{capitalizedSign}</h1>
                    <p className="text-amber-200/60 uppercase tracking-widest text-sm">Daily Horoscope</p>
                </header>

                <div className="bg-slate-900/50 border border-amber-500/20 p-8 rounded-2xl mb-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-32 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                    <p className="text-xl leading-relaxed text-amber-100/90 relative z-10">
                        {horoscopeText}
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-slate-900 rounded-xl border border-white/5">
                        <div className="text-amber-500/50 text-xs uppercase mb-1">Love</div>
                        <div className="text-amber-100 font-bold">85%</div>
                    </div>
                    <div className="p-4 bg-slate-900 rounded-xl border border-white/5">
                        <div className="text-amber-500/50 text-xs uppercase mb-1">Career</div>
                        <div className="text-amber-100 font-bold">92%</div>
                    </div>
                    <div className="p-4 bg-slate-900 rounded-xl border border-white/5">
                        <div className="text-amber-500/50 text-xs uppercase mb-1">Health</div>
                        <div className="text-amber-100 font-bold">78%</div>
                    </div>
                </div>
            </div>
        </div>
    )
}

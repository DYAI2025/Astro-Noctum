import { useEffect, useState } from 'react';
import { useJieqi } from '@/src/hooks/useJieqi';
import type { SpaceWeatherState } from '@/src/hooks/useSpaceWeather';

interface JieqiBannerProps {
  weather: SpaceWeatherState;
}

function formatCountdown(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}T ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function JieqiBanner({ weather }: JieqiBannerProps) {
  const { jieqi, loading } = useJieqi();
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    if (!jieqi) return;
    const tick = () => {
      const now = Date.now();
      const target = new Date(jieqi.nextTransitionAt).getTime();
      const remaining = Math.max(0, Math.floor((target - now) / 1000));
      setCountdown(formatCountdown(remaining));
    };
    tick();
    const interval = setInterval(tick, 60_000);
    return () => clearInterval(interval);
  }, [jieqi]);

  if (loading || !jieqi) return null;

  const isBazodiacMoment =
    jieqi.isTransitionWindow &&
    (weather.kpIndex >= 5 || weather.events.some(e => e.type === 'cme_arrival'));

  return (
    <div className={`
      rounded-xl border p-5 transition-all duration-500
      ${isBazodiacMoment
        ? 'border-gold/60 bg-gradient-to-r from-gold/10 via-obsidian to-gold/10 shadow-[0_0_30px_rgba(212,175,55,0.15)]'
        : 'border-white/10 bg-white/[0.03]'
      }
    `}>
      {isBazodiacMoment && (
        <div className="text-xs font-bold text-gold uppercase tracking-widest mb-2 animate-pulse">
          Bazodiac-Moment
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-white/40 uppercase tracking-wider">Aktueller Jieqi</div>
          <div className="text-lg font-serif text-white mt-1">{jieqi.current.nameDE}</div>
          <div className="text-xs text-white/30 mt-0.5">{jieqi.current.name}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-white/40 uppercase tracking-wider">Naechster Uebergang</div>
          <div className="text-lg font-mono text-gold mt-1">{countdown}</div>
          <div className="text-xs text-white/30 mt-0.5">{jieqi.next.nameDE}</div>
        </div>
      </div>
      {weather.kpIndex > 0 && (
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-3">
          <div className={`
            w-2 h-2 rounded-full
            ${weather.kpIndex >= 5 ? 'bg-red-500 animate-pulse' : weather.kpIndex >= 3 ? 'bg-amber-400' : 'bg-green-400'}
          `} />
          <span className="text-xs text-white/50">
            <span title="Kp-Index (0–9): Maß für geomagnetische Aktivität. Ab Kp 5 = Magnetsturm.">{weather.gScale} — Kp {weather.kpIndex.toFixed(1)}</span>
            {weather.xrayClass !== 'A' && ` | ${weather.xrayClass}-class`}
          </span>
        </div>
      )}
    </div>
  );
}

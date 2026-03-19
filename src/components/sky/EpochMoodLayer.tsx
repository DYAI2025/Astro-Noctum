import type { SpaceWeatherState } from '@/src/hooks/useSpaceWeather';

interface EpochMoodLayerProps {
  weather: SpaceWeatherState;
}

const PHASE_LABELS: Record<string, string> = {
  minimum: 'Solar-Minimum',
  ascending: 'Aufstiegsphase',
  maximum: 'Solar-Maximum',
  descending: 'Abstiegsphase',
};

const PHASE_COLORS: Record<string, string> = {
  minimum: 'from-blue-900/10 to-indigo-900/5',
  ascending: 'from-amber-900/10 to-orange-900/5',
  maximum: 'from-red-900/10 to-orange-900/5',
  descending: 'from-purple-900/10 to-blue-900/5',
};

export function EpochMoodLayer({ weather }: EpochMoodLayerProps) {
  const phase = weather.solarCyclePhase || 'ascending';
  const label = PHASE_LABELS[phase] || phase;
  const gradient = PHASE_COLORS[phase] || PHASE_COLORS.ascending;

  return (
    <div className={`rounded-xl border border-white/5 bg-gradient-to-r ${gradient} p-4`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-white/30">Sonnenzyklusphase</div>
          <div className="text-sm text-white/60 mt-1">{label}</div>
        </div>
        <div className="text-right">
          {weather.f107 > 0 && (
            <div className="text-xs text-white/30">
              F10.7: {weather.f107.toFixed(0)} SFU
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

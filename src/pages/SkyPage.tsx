import { useSpaceWeather } from '@/src/hooks/useSpaceWeather';
import { JieqiBanner } from '@/src/components/sky/JieqiBanner';
import { FlareTimeline } from '@/src/components/sky/FlareTimeline';
import { AuroraLayer } from '@/src/components/sky/AuroraLayer';
import { EpochMoodLayer } from '@/src/components/sky/EpochMoodLayer';
import { NeoRibbon } from '@/src/components/sky/NeoRibbon';
import { isFeatureEnabled } from '@/src/lib/feature-flags';

export default function SkyPage() {
  const weather = useSpaceWeather();

  return (
    <div className="min-h-screen bg-obsidian text-white">
      <header className="px-6 py-4 border-b border-white/10">
        <h1 className="font-serif text-2xl text-gold">sky.bazodiac.space</h1>
        <p className="text-sm text-white/40 mt-1">Dein persoenlicher Kosmos-Monitor</p>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {isFeatureEnabled('sky_jieqi_banner') && <JieqiBanner weather={weather} />}
        {isFeatureEnabled('sky_flare_timeline') && <FlareTimeline />}
        {isFeatureEnabled('sky_aurora_layer') && <AuroraLayer />}
        {isFeatureEnabled('sky_epoch_mood') && <EpochMoodLayer weather={weather} />}
        {isFeatureEnabled('sky_neo_ribbon') && <NeoRibbon />}
        {/* Components will be mounted here by subsequent tasks */}
      </main>
    </div>
  );
}

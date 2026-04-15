import type { ResonanceBadge } from '../../lib/schemas/experience';
import { Lock } from 'lucide-react';

interface ResonanzSnapshotProps {
  badges: ResonanceBadge[];
  isPremium: boolean;
}

export function ResonanzSnapshot({ badges, isPremium }: ResonanzSnapshotProps) {
  if (badges.length === 0) return null;

  return (
    <div className="flex gap-2 flex-wrap mt-2" aria-label="Resonanz-Übersicht">
      {badges.map((badge) => (
        <div
          key={badge.type}
          data-testid={`resonanz-badge-${badge.type}`}
          className={`relative flex flex-col gap-0.5 px-3 py-2 rounded-xl border text-xs transition-colors select-none ${
            !isPremium ? 'opacity-60' : ''
          }`}
          style={{
            borderColor: `${badge.color}33`,
            background: `${badge.color}0D`,
          }}
        >
          {!isPremium && (
            <div className="absolute inset-0 rounded-xl flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
              <Lock className="w-3 h-3 text-white/60" aria-hidden="true" />
            </div>
          )}
          <span className="font-medium text-white/80 leading-tight">{badge.label}</span>
          {badge.sublabel && (
            <span className="text-[10px] text-white/40">{badge.sublabel}</span>
          )}
        </div>
      ))}
    </div>
  );
}

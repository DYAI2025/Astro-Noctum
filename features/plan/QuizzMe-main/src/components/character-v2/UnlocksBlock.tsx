"use client";

/**
 * Unlocks Block Component (Block K)
 *
 * Displays earned achievements/unlocks with:
 * - Grid of unlock badges
 * - Unlock count summary
 * - Empty state if no unlocks
 *
 * Pure component - takes snapshot data as props.
 */

import type { Unlock } from "@/lib/lme/types";

type UnlocksBlockProps = {
  unlocks: Record<string, Unlock>;
};

// Level colors
const LEVEL_COLORS: Record<number, string> = {
  1: "bg-slate-600 border-slate-500",
  2: "bg-indigo-600 border-indigo-500",
  3: "bg-amber-500 border-amber-400",
};

const LEVEL_LABELS: Record<number, string> = {
  1: "Bronze",
  2: "Silber",
  3: "Gold",
};

export function UnlocksBlock({ unlocks }: UnlocksBlockProps) {
  // Filter to only unlocked items
  const unlockedItems = Object.values(unlocks).filter((u) => u.unlocked);

  if (unlockedItems.length === 0) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🏆</span>
          <h3 className="text-lg font-semibold text-slate-200">
            Errungenschaften
          </h3>
        </div>

        {/* Empty State */}
        <div className="text-center py-6">
          <div className="text-4xl mb-3 opacity-40">🎯</div>
          <p className="text-slate-400 mb-2">
            Noch keine Errungenschaften freigeschaltet.
          </p>
          <p className="text-sm text-slate-500">
            Mache mehr Quizze um Errungenschaften zu verdienen!
          </p>
        </div>
      </div>
    );
  }

  // Group by level
  const byLevel: Record<number, Unlock[]> = { 1: [], 2: [], 3: [] };
  for (const unlock of unlockedItems) {
    const level = unlock.level ?? 1;
    if (!byLevel[level]) byLevel[level] = [];
    byLevel[level].push(unlock);
  }

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏆</span>
          <h3 className="text-lg font-semibold text-slate-200">
            Errungenschaften
          </h3>
        </div>
        <span className="text-sm text-amber-400 font-medium">
          {unlockedItems.length} freigeschaltet
        </span>
      </div>

      {/* Unlock Grid by Level */}
      <div className="space-y-4">
        {[3, 2, 1].map((level) => {
          const levelUnlocks = byLevel[level] || [];
          if (levelUnlocks.length === 0) return null;

          return (
            <div key={level}>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                {LEVEL_LABELS[level]} ({levelUnlocks.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {levelUnlocks.map((unlock) => (
                  <div
                    key={unlock.id}
                    className={`px-3 py-1.5 rounded-full border ${LEVEL_COLORS[level]} text-white text-sm`}
                    title={unlock.sourceRef ?? unlock.id}
                  >
                    {formatUnlockId(unlock.id)}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Helper to format unlock ID into readable label
function formatUnlockId(id: string): string {
  // unlock.quiz.personality.completed -> Personality Completed
  const parts = id.replace("unlock.", "").split(".");
  return parts
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

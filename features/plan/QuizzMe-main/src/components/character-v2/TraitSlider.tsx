"use client";

/**
 * Trait Slider Component
 *
 * Displays a single trait with:
 * - Label with optional low/high labels
 * - Visual slider bar (1-100)
 * - Score display
 *
 * Pure component - no state or data fetching.
 */

import type { TraitScore } from "@/lib/lme/types";
import type { TraitDefinition } from "@/lib/registry/traits";

type TraitSliderProps = {
  definition: TraitDefinition;
  score: TraitScore;
  compact?: boolean;
};

export function TraitSlider({
  definition,
  score,
  compact = false,
}: TraitSliderProps) {
  const value = score.score;
  const percentage = Math.min(100, Math.max(0, value));

  // Color based on value ranges
  const getBarColor = (val: number): string => {
    if (val <= 25) return "bg-blue-500";
    if (val <= 50) return "bg-emerald-500";
    if (val <= 75) return "bg-amber-500";
    return "bg-rose-500";
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-400 w-24 truncate">
          {definition.label_de}
        </span>
        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${getBarColor(value)} transition-all duration-300`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm font-medium text-slate-300 w-8 text-right">
          {value}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {/* Label Row */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-200">
          {definition.label_de}
        </span>
        <span className="text-sm font-bold text-slate-100">{value}</span>
      </div>

      {/* Slider Bar */}
      <div className="relative">
        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${getBarColor(value)} transition-all duration-500 ease-out`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Low/High Labels */}
      {(definition.lowLabel || definition.highLabel) && (
        <div className="flex justify-between text-xs text-slate-500">
          <span>{definition.lowLabel ?? ""}</span>
          <span>{definition.highLabel ?? ""}</span>
        </div>
      )}
    </div>
  );
}

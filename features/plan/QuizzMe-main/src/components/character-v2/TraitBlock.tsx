"use client";

/**
 * Trait Block Component
 *
 * Displays a block of traits from a category:
 * - Shows trait sliders if enough data present
 * - Shows empty state CTA if insufficient data
 *
 * Pure component - takes snapshot data as props.
 */

import Link from "next/link";
import type { TraitScore } from "@/lib/lme/types";
import { TRAITS_BY_CATEGORY, type TraitDefinition } from "@/lib/registry/traits";
import type { BlockConfig } from "./block-config";
import { TraitSlider } from "./TraitSlider";

type TraitBlockProps = {
  config: BlockConfig;
  traits: Record<string, TraitScore>;
  compact?: boolean;
};

// Icons mapping (simple unicode icons for now)
const ICONS: Record<string, string> = {
  compass: "🧭",
  users: "👥",
  heart: "❤️",
  sun: "☀️",
  star: "⭐",
  brain: "🧠",
  "heart-handshake": "🤝",
  sparkles: "✨",
  trophy: "🏆",
};

export function TraitBlock({ config, traits, compact = false }: TraitBlockProps) {
  // Get all trait definitions for this block's categories
  const blockTraits: TraitDefinition[] = config.categories.flatMap(
    (cat) => TRAITS_BY_CATEGORY[cat] || []
  );

  // Filter to only traits we have scores for
  const presentTraits = blockTraits.filter((t) => traits[t.id]);
  const hasEnoughData = presentTraits.length >= config.minTraitsRequired;

  const icon = config.icon ? ICONS[config.icon] : "📊";

  if (!hasEnoughData) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">{icon}</span>
          <h3 className="text-lg font-semibold text-slate-200">
            {config.label_de}
          </h3>
        </div>

        {/* Empty State */}
        <div className="text-center py-6">
          <div className="text-4xl mb-3 opacity-40">🔮</div>
          <p className="text-slate-400 mb-4">
            Noch nicht genügend Daten für diesen Bereich.
          </p>
          {config.quizRoute && (
            <Link
              href={config.quizRoute}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
            >
              <span>Quiz starten</span>
              <span>→</span>
            </Link>
          )}
        </div>

        {/* Progress hint */}
        {presentTraits.length > 0 && (
          <div className="text-xs text-slate-500 text-center mt-2">
            {presentTraits.length} / {config.minTraitsRequired} Traits vorhanden
          </div>
        )}
      </div>
    );
  }

  // Has enough data - render trait sliders
  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <h3 className="text-lg font-semibold text-slate-200">
            {config.label_de}
          </h3>
        </div>
        <span className="text-sm text-slate-500">
          {presentTraits.length} Traits
        </span>
      </div>

      {/* Trait Sliders */}
      <div className={compact ? "space-y-2" : "space-y-4"}>
        {presentTraits.map((def) => (
          <TraitSlider
            key={def.id}
            definition={def}
            score={traits[def.id]}
            compact={compact}
          />
        ))}
      </div>

      {/* Expand link if more traits possible */}
      {presentTraits.length < blockTraits.length && config.quizRoute && (
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <Link
            href={config.quizRoute}
            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            + Mehr Traits entdecken
          </Link>
        </div>
      )}
    </div>
  );
}

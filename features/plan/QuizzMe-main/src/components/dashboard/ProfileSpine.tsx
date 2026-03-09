
import React from 'react';
import Link from 'next/link';
import { CharacterHeader, TraitBlock, UnlocksBlock, BLOCKS } from '@/components/character-v2';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { ProfileSnapshot } from '@/lib/lme/types'; // Assuming this import exists or similar

interface ProfileSpineProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  snapshot: any; // Using any for now to avoid deep type imports issues, should be ProfileSnapshot
  showIntro?: boolean;
}

/**
 * ProfileSpine ("The Book of Self")
 * 
 * The main content column of the dashboard. 
 * Displays the character header and trait blocks in a structured "spine" layout.
 */
export function ProfileSpine({ snapshot, showIntro = false }: ProfileSpineProps) {
  // Filter blocks
  const traitBlocks = BLOCKS.filter((b) => b.id !== "block.unlocks");

  // Check if user has astro data
  const hasAstroData = !!snapshot?.astro?.western?.sunSign;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-4">
      {/* Astro Onboarding Prompt - only if no astro data */}
      {!hasAstroData && (
        <div className="rounded-xl p-8 bg-gradient-to-r from-indigo-900/60 to-purple-900/40 border border-indigo-500/30 backdrop-blur-md mb-8 text-center">
          <div className="text-5xl mb-4">✨</div>
          <h2 className="text-2xl font-serif text-white mb-2">Entdecke dein Sternzeichen</h2>
          <p className="text-slate-300 mb-6">Starte deine Reise und finde heraus, was die Sterne über dich verraten.</p>
          <Link
            href="/onboarding/astro"
            className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-6 py-3 rounded-lg transition-all font-medium shadow-lg shadow-indigo-500/25"
          >
            Jetzt starten
          </Link>
        </div>
      )}

      {/* Intro Banner for New Users (legacy, kept for backwards compatibility) */}
      {showIntro && hasAstroData && (
        <div className="rounded-xl p-8 bg-gradient-to-r from-indigo-900/40 to-neutral-900/40 border border-indigo-500/30 backdrop-blur-md mb-8">
          <h2 className="text-2xl font-serif text-white mb-2">Willkommen am Altar</h2>
          <p className="text-slate-300 mb-4">Dein Buch des Selbst ist noch leer. Fülle es mit Leben.</p>
          <a href="/verticals/quiz" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors inline-block">
            Erstes Quiz starten
          </a>
        </div>
      )}

      {/* Basic Skeleton or Empty State if no snapshot */}
      {!snapshot ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-30 pointer-events-none filter grayscale">
          {/* Placeholder Visuals (Ghost Book) */}
          <div className="h-64 bg-neutral-800/50 rounded-2xl border border-dashed border-white/10 flex items-center justify-center">
            <span className="text-4xl opacity-20">?</span>
          </div>
          <div className="h-64 bg-neutral-800/50 rounded-2xl border border-dashed border-white/10 flex items-center justify-center">
            <span className="text-4xl opacity-20">?</span>
          </div>
        </div>
      ) : (
        <>
          {/* Mystic Header Container */}
          <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/5 bg-neutral-900/50 backdrop-blur-sm relative group">
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent opacity-50 group-hover:opacity-70 transition-opacity duration-1000"></div>
            <CharacterHeader snapshot={snapshot} />
          </div>

          {/* Pulsating CTA Button - "Vertiefe deine Persönlichkeit" */}
          {hasAstroData && (
            <div className="flex justify-center">
              <Link
                href="/verticals/quiz"
                className="relative inline-flex items-center gap-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white px-8 py-4 rounded-xl transition-all font-medium text-lg shadow-lg shadow-amber-500/25 group"
              >
                {/* Pulsating ring effect */}
                <span className="absolute inset-0 rounded-xl bg-amber-500/50 animate-ping opacity-20"></span>
                <span className="relative flex items-center gap-3">
                  <span className="text-2xl">🔥</span>
                  <span>Vertiefe deine Persönlichkeit</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </span>
              </Link>
            </div>
          )}

          {/* Trait Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {traitBlocks.map((block) => (
              <TraitBlock
                key={block.id}
                config={block}
                traits={snapshot.traits}
              />
            ))}

            {/* Unlocks spanning full width */}
            <div className="md:col-span-2">
              <UnlocksBlock unlocks={snapshot.unlocks} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

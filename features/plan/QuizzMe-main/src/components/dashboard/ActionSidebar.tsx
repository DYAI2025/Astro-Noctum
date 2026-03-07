
import React from 'react';
import { ActionTile } from './ActionTile';

interface ActionSidebarProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  snapshot: any;
}

/**
 * ActionSidebar ("The Artifacts")
 * 
 * Context-aware sidebar that recommends next steps (Quizzes/Horoscopes).
 */
export function ActionSidebar({ snapshot }: ActionSidebarProps) {
  
  // Logic to determine recommendations
  const hasNoArchetype = !snapshot?.psyche?.archetypeMix?.[0];
  const hasNoElement = !snapshot?.traits?.['trait.astro.element']; // Example check
  
  return (
    <div className="space-y-6 animate-in fade-in duration-700 delay-300 slide-in-from-right-4">
      
      {/* 1. Astrologie Category */}
      <div className="space-y-2">
        <h4 className="text-xs uppercase tracking-widest text-emerald-500/80 font-medium pl-1">Astrologie</h4>
        <ActionTile 
          title="Horoskop"
          subtitle="Tagesbotschaften & Sternzeichen"
          href="/verticals/horoscope"
          variant="mystic"
          icon={<span className="text-xl">✨</span>}
          backgroundImageSrc="/assets/dashboard/astrology.png"
          className="h-32 flex flex-col justify-end"
        />
      </div>

      {/* 2. Persönlichkeit Category */}
      <div className="space-y-2">
        <h4 className="text-xs uppercase tracking-widest text-amber-500/80 font-medium pl-1">Persönlichkeit</h4>
        <ActionTile 
          title="Entwicklung"
          subtitle="Erkennen wer du wirklich bist"
          href="/verticals/quiz"
          variant="gold"
          icon={<span className="text-xl">🔥</span>}
          backgroundImageSrc="/assets/dashboard/personality.png"
          className="h-32 flex flex-col justify-end"
        />
      </div>

      {/* 3. Community / Share - Opens share modal */}
      <div className="space-y-2 pt-4 border-t border-white/5">
         <ActionTile
          title="Profil Teilen"
          subtitle="Zeige anderen deine wahre Natur."
          href="/astrosheet?share=true"
          variant="neutral"
          icon={<span className="text-xl">🔗</span>}
          className="opacity-70 hover:opacity-100"
        />
      </div>

    </div>
  );
}

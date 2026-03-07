
"use client";

import React, { useEffect, useState } from 'react';
import { CosmicBackground } from "@/components/ui/CosmicBackground";
import { HeaderSection } from "@/components/character/sections/HeaderSection";
import { PersonalitySection } from "@/components/character/sections/PersonalitySection";
import { ValuesSection } from "@/components/character/sections/ValuesSection";
import { RelationshipSection } from "@/components/character/sections/RelationshipSection";
import { SkillsRadarSection } from "@/components/character/sections/SkillsRadarSection";
import { VerticalNav } from "@/components/character/sections/VerticalNav";
import { ProfileSnapshot } from '@/lib/lme/types';
import { getProfileSnapshot } from '@/lib/lme/storage-full';

export default function CharacterSheetPage() {
  const [snapshot, setSnapshot] = useState<ProfileSnapshot | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const data = getProfileSnapshot();
    setSnapshot(data);
  }, []);

  if (!mounted || !snapshot) {
    return (
      <div className="min-h-screen bg-[#0f0e17] flex items-center justify-center">
        <div className="animate-pulse text-purple-500 font-mono text-sm">INITIALIZING PSYCHE...</div>
      </div>
    );
  }

  return (
    <CosmicBackground animated>
      <main className="min-h-screen font-sans text-white pb-24">
        {/* 1. Header (Identity & Core) */}
        <HeaderSection snapshot={snapshot} />

        <div className="max-w-6xl mx-auto px-4 sm:px-6">

          {/* Grid Layout for Cards */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">

            {/* Left Col (Main Data) */}
            <div className="md:col-span-8 space-y-8">

              {/* Block D: Personality */}
              <PersonalitySection snapshot={snapshot} />

              {/* Block C: Values & Motivation */}
              <ValuesSection snapshot={snapshot} />

              {/* Block E: Relationships */}
              <RelationshipSection snapshot={snapshot} />

            </div>

            {/* Right Col (Sidebar / Meta) */}
            <div className="md:col-span-4 space-y-8">

              {/* Unlocks / Badges (Mini Preview) */}
              <div className="bg-slate-900/60 backdrop-blur rounded-3xl p-6 border border-white/5">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Achievements</h3>
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="aspect-square bg-white/5 rounded-lg border border-white/5 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-slate-700"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Block H: Skills Radar */}
              <SkillsRadarSection snapshot={snapshot} />

            </div>
          </div>

          {/* Navigation to Verticals */}
          <VerticalNav />

          {/* Footer / Debug Info */}
          <div className="text-center text-slate-600 text-xs mt-12 mb-8 font-mono">
            PROFILE_ID: {snapshot.meta.lastUpdatedAt ? 'SYNCED' : 'LOCAL'} <br />
            V1.0.1
          </div>

        </div>
      </main>
    </CosmicBackground>
  );
}

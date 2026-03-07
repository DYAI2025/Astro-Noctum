"use client";

import React from "react";

/**
 * Character Header (Block A)
 *
 * Shows:
 * - Zodiac wheel with highlighted sun sign
 * - Top archetype
 * - Completion bar
 * - Unlocks row
 */

import Link from "next/link";
import { ProfileSnapshot } from "@/lib/lme/types";
import { ZodiacShield } from "./ZodiacShield";
import { SIGN_ELEMENT } from "@/lib/astro";

type CharacterHeaderProps = {
  snapshot: ProfileSnapshot;
};

export function CharacterHeader({ snapshot }: CharacterHeaderProps) {
  const sunSign = snapshot.astro?.western?.sunSign;
  const chineseAnimal = snapshot.astro?.chinese?.animal;
  // const primaryArchetype = snapshot.psyche?.archetypeMix?.[0]; // Unused
  const completion = snapshot.meta?.completion?.percent ?? 0;
  const unlockCount = snapshot.meta?.completion?.unlockCount ?? 0;

  return (
    <header className="pt-8 pb-6 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Top Row: Zodiac + Identity */}
        <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
          {/* Zodiac Shield (Wappen) - 300% larger */}
          <div className="flex-shrink-0">
            <ZodiacShield sign={sunSign} size={420} className="-my-12" />
          </div>

          {/* Identity Info */}
          <div className="text-center md:text-left flex-1 space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-100">
              Character Sheet
            </h1>

            {sunSign && (
              <div className="text-lg">
                <span className="text-indigo-400 capitalize font-bold">{sunSign}</span>
                {chineseAnimal && <span className="text-slate-500"> / {chineseAnimal}</span>}
              </div>
            )}

            {/* Extended Astro Details */}
            {snapshot.astro?.western && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-300">
                {snapshot.astro.western.ascendant && (
                  <span>
                    <span className="text-slate-500">ASC:</span> <span className="capitalize">{snapshot.astro.western.ascendant}</span>
                  </span>
                )}
                {snapshot.astro.western.moonSign && (
                  <span>
                    <span className="text-slate-500">Moon:</span> <span className="capitalize">{snapshot.astro.western.moonSign}</span>
                  </span>
                )}
                {/* Element derived from Sun Sign primarily for now, or Mix */}
                {sunSign && (
                  <span>
                    <span className="text-slate-500">Element:</span> <span className="capitalize">{SIGN_ELEMENT[sunSign]}</span>
                  </span>
                )}
              </div>
            )}

            {sunSign && (
              <div className="pt-2">
              <div className="pt-2">
                <Link
                  href="/verticals/horoscope/daily"
                  className="inline-flex items-center gap-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-full text-sm transition-colors"
                >
                  <span>🔮</span>
                  <span>Zum Tageshoroskop</span>
                </Link>
              </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex-shrink-0 text-center">
            <div className="bg-slate-800/50 rounded-lg px-6 py-4">
              <div className="text-3xl font-bold text-indigo-400">{completion}%</div>
              <div className="text-sm text-slate-400">Complete</div>
            </div>
          </div>
        </div>

        {/* Completion Bar */}
        <div className="bg-slate-800 rounded-full h-3 overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-500"
            style={{ width: `${completion}%` }} // Dynamic width is acceptable here as it varies per user
          />
        </div>

        {/* Unlocks Row */}
        {unlockCount > 0 && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="text-amber-400">
              {unlockCount} unlock{unlockCount !== 1 ? "s" : ""}
            </span>
            earned
          </div>
        )}
      </div>
    </header>
  );
}

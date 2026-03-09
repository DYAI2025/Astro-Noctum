"use client";

import React from "react";
import Image from "next/image";

interface ZodiacShieldProps {
  sign?: string | null; // e.g. "widder", "aries"
  size?: number;
  className?: string;
}

// Mapping of German/English sign names to asset IDs (1-12)
// 1=Aries, 2=Taurus, 3=Gemini, 4=Cancer, 5=Leo, 6=Virgo, 
// 7=Libra, 8=Scorpio, 9=Sagittarius, 10=Capricorn, 11=Aquarius, 12=Pisces
const SIGN_TO_ID: Record<string, number> = {
  widder: 1, aries: 1,
  stier: 2, taurus: 2,
  zwillinge: 3, gemini: 3,
  krebs: 4, cancer: 4,
  löwe: 5, leo: 5,
  jungfrau: 6, virgo: 6,
  waage: 7, libra: 7,
  skorpion: 8, scorpio: 8,
  schütze: 9, sagittarius: 9,
  steinbock: 10, capricorn: 10,
  wassermann: 11, aquarius: 11,
  fische: 12, pisces: 12,
};

export function ZodiacShield({ sign, size = 120, className = "" }: ZodiacShieldProps) {
  // Determine asset ID. Default to 1 (Aries) for the placeholder shape if unknown.
  const normalizedSign = sign?.toLowerCase() || "";
  const assetId = SIGN_TO_ID[normalizedSign] || 1;
  const isUnlocked = !!SIGN_TO_ID[normalizedSign];

  const wrapperStyle = { width: size, height: size };

  return (
    <div 
      className={`relative flex items-center justify-center ${className}`}
      style={wrapperStyle}
    >
      {/* 
        Container for the shield.
        If unlocked: distinct colorful shield.
        If locked: grayed out shield (using opacity and grayscale).
      */}
      <div className={`
        relative w-full h-full transition-all duration-700
        ${isUnlocked ? 'filter-none opacity-100 scale-100' : 'grayscale opacity-30 scale-95'}
      `}>
        <Image
          src={`/assets/shields/${assetId}.png`}
          alt={isUnlocked ? `Wappen von ${sign}` : "Versiegeltes Wappen"}
          fill
          className="object-contain drop-shadow-2xl"
          priority
        />
        {/* Optional: Add a lock icon overlay if strictly locked, 
            but user asked specifically for "grayed out" same shape. 
            So simpler is better. 
        */}
      </div>
    </div>
  );
}

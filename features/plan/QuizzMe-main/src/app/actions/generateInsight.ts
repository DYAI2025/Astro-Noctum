"use server";

import { GoogleGenAI } from "@google/genai";

interface InsightInput {
  sunSign: string;
  moonSign: string;
  ascSign: string;
  tierkreis: string;
  monatstier: string;
  element: string;
}

/**
 * Server Action: Generate AI-powered insight from astro configuration
 * Securely uses GOOGLE_AI_API_KEY from server environment
 */
export async function generateAstroInsight(input: InsightInput): Promise<string> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    console.warn("[generateAstroInsight] GOOGLE_AI_API_KEY not configured");
    return "KI-Analyse momentan nicht verfügbar. Bitte später erneut versuchen.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Du bist ein Experte für Astrologie (westlich) und BaZi (chinesisch). Analysiere diese Konfiguration:
    Westlich: Sonne ${input.sunSign}, Mond ${input.moonSign}, AC ${input.ascSign}.
    BaZi: Tierkreis ${input.tierkreis}, Monatstier ${input.monatstier}, Element ${input.element}.
    Erstelle eine tiefgründige, poetische und präzise 'Quanten-Synergie-Analyse' (ca. 60 Wörter) in Deutsch.
    Konzentriere dich auf die Schnittmenge der beiden Systeme. Was bedeutet diese Kombination für das innere Potenzial?
    Verwende einen modernen, retro-futuristischen Ton.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    if (response.text) {
      return response.text.trim();
    }

    return "Analyse konnte nicht generiert werden.";
  } catch (error) {
    console.error("[generateAstroInsight] Error:", error);
    return "Ein Fehler ist bei der Analyse aufgetreten.";
  }
}

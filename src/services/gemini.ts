import { generateTemplateInterpretation } from "./interpretation-templates";
import type { InterpretationResponse } from "../types/interpretation";

function fallbackResponse(text: string): InterpretationResponse {
  return { interpretation: text, tiles: {}, houses: {} };
}

export async function generateInterpretation(data: unknown, lang: string = "en"): Promise<InterpretationResponse> {
  const templateText = generateTemplateInterpretation(data, lang);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 22000);

    const response = await fetch("/api/interpret", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data, lang }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`Server responded ${response.status}`);
    const json = await response.json();

    if (json.interpretation) {
      return {
        interpretation: json.interpretation,
        tiles: json.tiles || {},
        houses: json.houses || {},
      };
    }

    if (json.text) {
      return fallbackResponse(json.text);
    }
  } catch (err) {
    console.warn("Gemini server proxy failed, using template fallback:", err);
  }

  if (templateText) return fallbackResponse(templateText);

  const fallbackMsg = lang === "de"
    ? "## Dein Bazodiac Fusion-Blueprint\n\nDein kosmisches Profil wird berechnet. Die vollständige Interpretation basierend auf deinen Geburtsdaten wird in Kürze verfügbar sein."
    : "## Your Bazodiac Fusion Blueprint\n\nYour cosmic profile is being calculated. The full interpretation based on your birth data will be available shortly.";

  return fallbackResponse(fallbackMsg);
}

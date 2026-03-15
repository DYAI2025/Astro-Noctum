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
    ? "## Dein kosmisches Profil\n\nDie KI-gestützte Interpretation ist derzeit nicht verfügbar. Deine astrologischen Daten wurden erfolgreich berechnet \u2014 die Karten oben zeigen dein vollständiges Profil. Die ausführliche Analyse wird automatisch generiert, sobald der Dienst wieder erreichbar ist."
    : "## Your Cosmic Profile\n\nThe AI-powered interpretation is currently unavailable. Your astrological data has been calculated successfully \u2014 the cards above show your complete profile. The detailed analysis will be generated automatically once the service is available again.";

  return fallbackResponse(fallbackMsg);
}

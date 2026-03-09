import { generateTemplateInterpretation } from "./interpretation-templates";

/**
 * Generates an AI-powered horoscope interpretation.
 * Calls the server-side /api/interpret endpoint — Gemini API key is NEVER in the browser bundle.
 * Falls back to template-based interpretation if server is unavailable.
 */
export async function generateInterpretation(data: unknown, lang: string = "en"): Promise<string> {
  // Template fallback (always available, no API call needed)
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
    const json = await response.json() as { text?: string };
    if (json.text) return json.text;
  } catch (err) {
    console.warn("Gemini server proxy failed, using template fallback:", err);
  }

  if (templateText) return templateText;

  return lang === "de"
    ? "## Dein Bazodiac Fusion-Blueprint\n\nDein kosmisches Profil wird berechnet. Die vollständige Interpretation basierend auf deinen Geburtsdaten wird in Kürze verfügbar sein."
    : "## Your Bazodiac Fusion Blueprint\n\nYour cosmic profile is being calculated. The full interpretation based on your birth data will be available shortly.";
}

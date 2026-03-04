import { GoogleGenAI } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// ── Fallback texts (shown when API is unavailable) ─────────────────────────

const FALLBACK_EN = `
**Your Bazodiac Blueprint**

Your cosmic signature weaves together two ancient wisdom traditions into a single, living portrait.

In the Western sky, your **Sun Sign** lights the stage of your conscious will — the qualities you lead with when you are most fully yourself. Your **Moon Sign** tells a quieter story: the emotional weather you carry privately, the way you instinctively comfort yourself and others. Your **Ascendant** is the first chapter others read in you, the face that meets the world before words have had a chance to translate your depths.

In the Chinese cosmological system, your **Year Animal** carries the ancestral imprint of the era you were born into — a collective current that shapes your social instincts and relationship to authority and tradition. Your **Day Stem** is the elemental heartbeat of your personal identity, the quality that persists beneath every role you play. And your **dominant WuXing element** reveals the energetic signature that runs through all four pillars of your BaZi — the invisible thread connecting every layer of your being.

The synthesis of these two systems points toward both your natural gifts and the areas where conscious cultivation brings the greatest return. The elements in relative balance in your chart are not weaknesses but invitations — doorways to parts of yourself still waiting to be explored.

This blueprint does not predict. It illuminates. The path, as always, is yours.
`.trim();

const FALLBACK_DE = `
**Dein Bazodiac-System**

Deine kosmische Signatur verbindet zwei jahrtausendealte Weisheitstraditionen zu einem einzigen, lebendigen Portrait.

Am westlichen Himmel beleuchtet dein **Sonnenzeichen** die Bühne deines bewussten Willens — jene Qualitäten, die du zeigst, wenn du am vollständigsten du selbst bist. Dein **Mondzeichen** erzählt eine stillere Geschichte: das emotionale Klima, das du im Inneren trägst, die Art, wie du dich instinktiv selbst und andere tröstest. Dein **Aszendent** ist das erste Kapitel, das andere in dir lesen — das Gesicht, das der Welt begegnet, bevor Worte deine Tiefe übersetzen können.

Im chinesischen Kosmologiesystem trägt dein **Jahrestier** den Ahnenabdruck der Epoche, in die du hineingeboren wurdest — eine kollektive Strömung, die deine sozialen Instinkte und dein Verhältnis zu Autorität und Tradition prägt. Dein **Tagesstamm** ist der elementare Herzschlag deiner persönlichen Identität, jene Qualität, die unter jeder Rolle bestehen bleibt, die du einnimmst. Und dein **dominantes WuXing-Element** offenbart die energetische Signatur, die sich durch alle vier Säulen deines BaZi zieht — den unsichtbaren Faden, der jede Schicht deines Wesens verbindet.

Die Synthese dieser beiden Systeme zeigt sowohl deine natürlichen Gaben als auch jene Bereiche, in denen bewusste Pflege den größten Ertrag bringt. Die Elemente, die in deinem Chart relativ im Gleichgewicht sind, sind keine Schwächen, sondern Einladungen — Türen zu Teilen deiner selbst, die darauf warten, entdeckt zu werden.

Dieser Blueprint sagt nicht vorher. Er beleuchtet. Der Weg ist, wie immer, deiner.
`.trim();

// ── Prompt builder ─────────────────────────────────────────────────────────

function buildPrompt(data: unknown): string {
  return `
You are Levi Bazi, a master astrological synthesis agent combining Western astrology and Chinese BaZi / WuXing cosmology.

A user has submitted their birth data. The BAFE API has returned the following calculated chart:

${JSON.stringify(data, null, 2)}

Write their personal **Cosmic Blueprint** — a rich, layered interpretation that synthesises ALL of the following:

1. **Sun Sign** (conscious will, core identity, life force expression)
2. **Moon Sign** (emotional landscape, subconscious needs, inner world)
3. **Ascendant** (outer presentation, first impression, the face given to the world)
4. **BaZi Year Animal** (ancestral energy, societal imprinting, relationship to collective)
5. **BaZi Day Stem** (Rì Zhù — elemental core identity, personal vitality)
6. **BaZi Month Stem** (Yuè Zhù — career climate, formative social environment)
7. **Dominant WuXing Element** (primary elemental force threading through all four pillars)
8. **WuXing Balance** (how the five elements are distributed — where there is richness and where cultivation is invited)

Structure the response as follows:
- Open with a bold title: "**Your Bazodiac Blueprint**"
- Write 4–5 substantial paragraphs (each 3–5 sentences)
- Paragraph 1: The Western triad (Sun, Moon, Ascendant) and how they interact
- Paragraph 2: The BaZi pillars and Day Stem — the Chinese identity
- Paragraph 3: The dominant WuXing element and what it means energetically
- Paragraph 4: The cross-system synthesis — how East and West echo, amplify or create productive tension
- Paragraph 5: A forward-looking statement — what this blueprint invites the person to embody or cultivate

**Tone:** Poetic but precise. Warm, intelligent and deeply specific — not generic horoscope language.
**Language:** Detect from the data context. If bazi data uses German terms (Stamm, Zweig, Tier), write in **German**. Otherwise write in **English**.
**Format:** Markdown (bold, paragraphs). **No bullet points.**
**Length:** 350–450 words.
Write directly to the user using "you" / "du" and address them personally.
`.trim();
}

// ── Main export ────────────────────────────────────────────────────────────

/**
 * @param data   The full BAFE API results
 * @param lang   The user's current language preference ("en" | "de")
 */
export async function generateInterpretation(data: unknown, lang: string = "en") {
  const isGerman = lang === "de";
  const fallback = isGerman ? FALLBACK_DE : FALLBACK_EN;

  if (!ai) {
    console.warn("Missing VITE_GEMINI_API_KEY. Using fallback interpretation.");
    return fallback;
  }

  try {
    const response = (await Promise.race([
      ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: buildPrompt(data),
        config: { temperature: 0.75 },
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Gemini API timeout")), 20000),
      ),
    ])) as { text?: string };

    return response.text?.trim() ?? fallback;
  } catch (error) {
    console.warn("Gemini API failed or timed out, using fallback:", error);
    return fallback;
  }
}

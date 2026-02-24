import { GoogleGenAI } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function generateInterpretation(data: unknown) {
  const prompt = `
You are Levi Bazi, an expert astrological AI agent. I have calculated the Western astrology, Chinese BaZi, and Wu-Xing (Five Elements) for a user using the BAFE API.
Here is the data:
${JSON.stringify(data, null, 2)}

Please write a plausible, insightful, and beautifully written astrological horoscope for the user's dashboard.
Focus on the fusion of their Western signs (Sun, Moon, Ascendant) and their Chinese BaZi elements.
Specifically, include detailed insights about their Chinese Zodiac animal and their dominant Wu Xing element, explaining how these interact with their Western traits to form their unique cosmic blueprint.
Provide actionable advice or a plausible horoscope reading based on these combined influences.
Keep it under 250 words. Write it directly to the user (e.g., "Your cosmic blueprint reveals...").
`;

  if (!ai) {
    console.warn("Missing VITE_GEMINI_API_KEY. Using fallback interpretation.");
    return "Dein kosmisches Blueprint offenbart eine faszinierende Mischung aus westlicher und östlicher Astrologie. Deine Sonnen-Signatur verleiht dir einen starken Willen, während dein Mond-Echo deine emotionale Tiefe prägt. Dein Aszendent zeigt, wie du der Welt begegnest. Im chinesischen System bringt dein Jahrestier besondere Eigenschaften mit sich, die von deinem dominanten Element verstärkt werden. Diese einzigartige Kombination macht dich zu dem, was du bist. Nutze diese Energien, um deinen Weg mit Klarheit und Zuversicht zu gehen.";
  }

  try {
    const response = (await Promise.race([
      ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          temperature: 0.7,
        },
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Gemini API timeout")), 15000),
      ),
    ])) as { text?: string };

    return response.text ?? "";
  } catch (error) {
    console.warn("Gemini API failed or timed out, using fallback interpretation:", error);
    return "Dein kosmisches Blueprint offenbart eine faszinierende Mischung aus westlicher und östlicher Astrologie. Deine Sonnen-Signatur verleiht dir einen starken Willen, während dein Mond-Echo deine emotionale Tiefe prägt. Dein Aszendent zeigt, wie du der Welt begegnest. Im chinesischen System bringt dein Jahrestier besondere Eigenschaften mit sich, die von deinem dominanten Element verstärkt werden. Diese einzigartige Kombination macht dich zu dem, was du bist. Nutze diese Energien, um deinen Weg mit Klarheit und Zuversicht zu gehen.";
  }
}

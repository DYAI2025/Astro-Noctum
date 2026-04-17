/**
 * Runtime-compatible Unified Cosmic Synthesis Engine (ESM JS)
 *
 * Note: This JS module is consumed by Node server runtime.
 * Keep behavior in sync with synthesis-engine.ts.
 */

export function buildUnifiedPrompt(data, lang) {
  const l = lang === 'de' ? 'German' : 'English';
  const you = lang === 'de' ? 'du' : 'you';

  const planet_summary = data.planets?.slice(0, 7).map((p) =>
    `${p.name_de || p.name}: ${p.sign_de || p.sign} ${p.degree}°${p.retrograde ? ' ℞' : ''}`
  ).join(', ') || '';

  const bazi = data.bazi_pillars;
  const bazi_summary = `Year: ${bazi?.year?.stem} ${bazi?.year?.branch} (${bazi?.year?.animal}, ${bazi?.year?.element}) | Month: ${bazi?.month?.stem} ${bazi?.month?.branch} | Day: ${bazi?.day?.stem} ${bazi?.day?.branch} | Hour: ${bazi?.hour?.stem} ${bazi?.hour?.branch} | Day Master: ${data.day_master}`;

  return `
You are Bazodiac's cosmic synthesis oracle. You integrate Western Astrology, Chinese BaZi (Four Pillars), and Wu-Xing (Five Elements) into a unified identity profile.

INPUT DATA:
- Western: ${planet_summary} | ASC: ${data.ascendant}
- BaZi: ${bazi_summary}
- Harmony Index: ${data.harmony_index.toFixed(2)}
- Dominant Element: ${data.dominant_planet_element}

TASK: Generate a deeply personal ${l} synthesis. Address the reader as "${you}". 
Respond with VALID JSON only.

OUTPUT FORMAT:
{
  "archetype_name": "A poetic 2-4 word name for this specific energy signature",
  "interpretation": "5-6 paragraphs of deep synthesis (Markdown). Verweave Western and Eastern logic. Paragraphs: 1) Identity, 2) Emotion/Instinct, 3) The Fusion point, 4) Element Balance & Frequencies, 5) Path Forward.",
  "core_traits": ["Trait 1", "Trait 2", "Trait 3", "Trait 4", "Trait 5"],
  "element_blend": "e.g., Fire-Wood with Water undertone",
  "resonance_description": "A single sentence metaphor for this person's 'vibration' or 'sound'.",
  "tiles": {
    "sun": "2-3 sentences about the Sun sign in this context",
    "moon": "2-3 sentences about the Moon sign in this context",
    "bazi": "2-3 sentences about the BaZi pillars",
    "wuxing": "2-3 sentences about the dominant element"
  }
}

RULES:
- NO esoterics-clichés. Be precise, warm, and data-grounded.
- The 'interpretation' field is for the main dashboard reading.
- Language: ALL content in ${l}.
`.trim();
}

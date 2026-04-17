import { Hono } from "hono";

const synthesize = new Hono();

const ELEMENT_DE: Record<string, string> = {
  Wood: "Holz", Fire: "Feuer", Earth: "Erde", Metal: "Metall", Water: "Wasser"
};

synthesize.post("/api/synthesize", async (c) => {
  try {
    const body = await c.req.json() as any;
    const { chartData } = body;
    if (!chartData) return c.json({ error: "Missing chartData" }, 400);

    const {
      sun_sign_de, moon_sign_de, ascendant,
      planets, bazi_pillars, day_master,
      wuxing_from_planets, wuxing_from_bazi, harmony_index,
      dominant_planet_element, dominant_bazi_element,
    } = chartData;

    const dom_elem_de = ELEMENT_DE[dominant_planet_element] || dominant_planet_element;
    const dom_bazi_de = ELEMENT_DE[dominant_bazi_element] || dominant_bazi_element;

    const planet_summary = planets?.slice(0, 7).map((p: any) =>
      `${p.name_de}: ${p.sign_de} ${p.degree}°${p.retrograde ? " ℞" : ""}`
    ).join(", ") || "";

    const bazi_summary = `Jahr: ${bazi_pillars?.year?.stem} ${bazi_pillars?.year?.branch} (${bazi_pillars?.year?.animal}, ${bazi_pillars?.year?.element}) | Monat: ${bazi_pillars?.month?.stem} ${bazi_pillars?.month?.branch} | Tag: ${bazi_pillars?.day?.stem} ${bazi_pillars?.day?.branch} | Stunde: ${bazi_pillars?.hour?.stem} ${bazi_pillars?.hour?.branch} | Day Master: ${day_master}`;

    const wx_planet_str = Object.entries(wuxing_from_planets || {})
      .map(([k, v]) => `${ELEMENT_DE[k] || k}: ${(v as number).toFixed(2)}`).join(", ");
    const wx_bazi_str = Object.entries(wuxing_from_bazi || {})
      .map(([k, v]) => `${ELEMENT_DE[k] || k}: ${(v as number).toFixed(2)}`).join(", ");

    const prompt = `Du bist ein kosmischer Synthese-Orakel. Du erhältst das vollständige westliche Geburtshoroskop und die chinesischen BaZi-Vier-Säulen einer Person. Synthesiere beide Systeme zu einem Signatur-Profil.

WESTLICHE ASTROLOGIE:
${planet_summary} | ASC: ${ascendant}

BAZI VIER SÄULEN:
${bazi_summary}

WU-XING ELEMENTE (Planeten): ${wx_planet_str}
WU-XING ELEMENTE (BaZi): ${wx_bazi_str}
Harmonie-Index: ${harmony_index.toFixed(2)}
Dominantes Planeten-Element: ${dom_elem_de}
Dominantes BaZi-Element: ${dom_bazi_de}

Liefere auf Deutsch:
1. archetype_name: poetischer Archetypus-Name (2-4 Wörter, einzigartig)
2. synthesis_reading: 3 Absätze, die beide Systeme verweben — präzise, warm, keine Esoterik-Phrasen. Absätze durch doppeltes Newline trennen.
3. core_traits: 5 Kern-Qualitäten (kurze Phrasen, keine Labels)
4. element_blend: z.B. "Feuer-Holz mit Wasser-Unterton"
5. resonance_description: 1 Satz als Klang/Schwingung-Metapher

Antworte NUR mit validem JSON, keine Markdown-Fences. Keys: archetype_name, synthesis_reading, core_traits (Array 5 Strings), element_blend, resonance_description.`;

    const openrouterKey = c.env?.OPENROUTER_API_KEY;

    if (!openrouterKey) {
      // Deterministic fallback — no AI key available
      return c.json({
        ok: true,
        archetype_name: `${dom_elem_de}-${dom_bazi_de} Resonanz`,
        synthesis_reading: `Deine Signatur vereint westliche Astrologie mit den Vier Säulen des BaZi. Mit Sonne in ${sun_sign_de} und Mond in ${moon_sign_de} entsteht ein Muster aus ${dom_elem_de}-Energie — nach innen konzentriert, nach außen spürbar.\n\nDein Day Master ${day_master} ist der unveränderliche Kern, um den sich alle anderen Säulen organisieren. Diese innere Grundnatur formt, wie du Situationen verarbeitest — nicht als Schicksal, sondern als Tendenz.\n\nDer Harmonie-Index von ${(harmony_index * 100).toFixed(0)}% zeigt eine ${harmony_index > 0.5 ? "ausgeglichene und integrative" : "spannungsreiche und transformative"} elementare Zusammensetzung. Diese Spannung ist kein Mangel — sie ist die Quelle deiner Beweglichkeit.`,
        core_traits: [
          `${dom_elem_de}-Energie als Grundschwingung`,
          `${sun_sign_de} als solarer Ausdruck`,
          `${ascendant} als äußere Resonanzform`,
          `Day Master ${day_master} als innerer Gravitationspunkt`,
          `${harmony_index > 0.5 ? "Integrative Balance" : "Transformative Spannung"} als strukturierendes Muster`
        ],
        element_blend: `${dom_elem_de}-${dom_bazi_de}`,
        resonance_description: `Eine ${dom_elem_de}-dominierte Schwingung mit ${dom_bazi_de}-Unterton — ${dom_elem_de === "Wasser" ? "tief fließend, mit der Fähigkeit jede Form anzunehmen" : dom_elem_de === "Feuer" ? "leuchtend und aufsteigend, mit transformativer Intensität" : dom_elem_de === "Holz" ? "verzweigend und vital, mit organischer Expansionskraft" : dom_elem_de === "Metall" ? "klar und präzise, mit kristalliner Schärfe" : "geerdet und beständig, mit kristalliner Substanz"}.`,
        using_fallback: true,
      });
    }

    // OpenRouter API — supports many models, Claude included
    const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openrouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://bazodiac.com",
        "X-Title": "Bazodiac Cosmic Signature",
      },
      body: JSON.stringify({
        model: "anthropic/claude-3.5-haiku",
        max_tokens: 1400,
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content: "Du bist ein Meister westlicher Astrologie und chinesischer Metaphysik. Antworte immer nur mit validem JSON, keine Markdown-Fences, kein Code-Block."
          },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      throw new Error(`OpenRouter API error ${aiRes.status}: ${errText}`);
    }

    const aiData = await aiRes.json() as any;
    const raw = aiData.choices?.[0]?.message?.content || "{}";

    let parsed: any = {};
    try {
      const clean = raw.replace(/^```(?:json)?\s*/m, "").replace(/```\s*$/m, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      // Try extracting JSON from the response
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        try { parsed = JSON.parse(match[0]); } catch {}
      }
    }

    return c.json({ ok: true, ...parsed });
  } catch (err: any) {
    console.error("Synthesize error:", err);
    return c.json({ error: err.message }, 500);
  }
});

export default synthesize;

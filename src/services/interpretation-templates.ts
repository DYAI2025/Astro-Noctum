// ── Template-based interpretation engine ─────────────────────────────────────
// Generates personalized readings from BAFE data without needing Gemini API.
// Each paragraph cross-references at least two systems (Western, BaZi, Wu-Xing).

type Lang = "de" | "en";
type I18n = Record<Lang, string>;

// ── Western Sun Sign Descriptions ────────────────────────────────────────────

const SUN_SIGNS: Record<string, I18n> = {
  Aries: {
    de: "Als Widder trägst du das Feuer des Neubeginns in dir. Dein Drang, voranzugehen und Pionierarbeit zu leisten, ist nicht bloß Temperament — es ist kosmischer Auftrag.",
    en: "As an Aries, you carry the fire of new beginnings within you. Your drive to forge ahead and pioneer isn't mere temperament — it's a cosmic mandate.",
  },
  Taurus: {
    de: "Als Stier bist du die Verkörperung von Beständigkeit und sinnlicher Tiefe. Deine Verbindung zur Erde schenkt dir eine Ruhe, die andere in deiner Nähe sofort spüren.",
    en: "As a Taurus, you embody steadfastness and sensual depth. Your connection to the earth gives you a calm that others immediately feel in your presence.",
  },
  Gemini: {
    de: "Als Zwilling bist du der kosmische Bote — dein Geist tanzt zwischen Welten, Ideen und Perspektiven. Diese Vielseitigkeit ist deine größte Stärke.",
    en: "As a Gemini, you are the cosmic messenger — your mind dances between worlds, ideas, and perspectives. This versatility is your greatest strength.",
  },
  Cancer: {
    de: "Als Krebs trägst du die Mondenergie tief in deinem Wesen. Deine emotionale Intelligenz ist ein Geschenk, das Räume des Vertrauens erschafft.",
    en: "As a Cancer, you carry lunar energy deep within your being. Your emotional intelligence is a gift that creates spaces of trust.",
  },
  Leo: {
    de: "Als Löwe strahlst du die Kraft der Sonne aus. Dein natürliches Charisma zieht Menschen in deinen Orbit — nicht aus Eitelkeit, sondern aus purer Lebensfreude.",
    en: "As a Leo, you radiate the power of the sun. Your natural charisma draws people into your orbit — not from vanity, but from pure joie de vivre.",
  },
  Virgo: {
    de: "Als Jungfrau besitzt du den schärfsten analytischen Blick des Tierkreises. Deine Fähigkeit, Muster zu erkennen und Ordnung zu schaffen, ist wahre kosmische Alchemie.",
    en: "As a Virgo, you possess the sharpest analytical eye in the zodiac. Your ability to recognize patterns and create order is true cosmic alchemy.",
  },
  Libra: {
    de: "Als Waage suchst du die Balance in allem — Beziehungen, Ästhetik, Gerechtigkeit. Diese Suche nach Harmonie macht dich zu einem natürlichen Diplomaten des Kosmos.",
    en: "As a Libra, you seek balance in everything — relationships, aesthetics, justice. This quest for harmony makes you a natural diplomat of the cosmos.",
  },
  Scorpio: {
    de: "Als Skorpion kennst du die Tiefe wie kein anderes Zeichen. Deine Intensität ist nicht Schwäche, sondern die Fähigkeit, unter die Oberfläche zu blicken und Wahrheit zu finden.",
    en: "As a Scorpio, you know depth like no other sign. Your intensity isn't weakness — it's the ability to look beneath the surface and find truth.",
  },
  Sagittarius: {
    de: "Als Schütze bist du der ewige Suchende — nach Wahrheit, Abenteuer und dem größeren Bild. Dein Optimismus ist ansteckend und dein Horizont grenzenlos.",
    en: "As a Sagittarius, you are the eternal seeker — of truth, adventure, and the bigger picture. Your optimism is contagious and your horizon limitless.",
  },
  Capricorn: {
    de: "Als Steinbock trägst du die Weisheit der Berge in dir. Deine Ausdauer und dein strategischer Geist ermöglichen es dir, Gipfel zu erreichen, die andere nur von fern bewundern.",
    en: "As a Capricorn, you carry the wisdom of mountains within you. Your endurance and strategic mind enable you to reach peaks that others only admire from afar.",
  },
  Aquarius: {
    de: "Als Wassermann bist du der Visionär des Tierkreises. Dein unkonventioneller Geist sieht die Zukunft, bevor sie eintrifft — und hat den Mut, sie mitzugestalten.",
    en: "As an Aquarius, you are the visionary of the zodiac. Your unconventional mind sees the future before it arrives — and has the courage to help shape it.",
  },
  Pisces: {
    de: "Als Fische bist du das empfindsamste Zeichen des Tierkreises. Deine Intuition ist ein sechster Sinn, der Welten wahrnimmt, die anderen verborgen bleiben.",
    en: "As a Pisces, you are the most sensitive sign in the zodiac. Your intuition is a sixth sense that perceives worlds hidden from others.",
  },
};

// ── Moon Sign Emotional Templates ────────────────────────────────────────────

const MOON_SIGNS: Record<string, I18n> = {
  Aries: {
    de: "Dein Mond im Widder verleiht deinen Emotionen eine feurige Spontaneität — du fühlst schnell, intensiv und direkt.",
    en: "Your Moon in Aries gives your emotions a fiery spontaneity — you feel quickly, intensely, and directly.",
  },
  Taurus: {
    de: "Dein Mond im Stier schenkt dir emotionale Tiefe und Beständigkeit — du brauchst Sicherheit, um dich wirklich zu öffnen.",
    en: "Your Moon in Taurus gives you emotional depth and steadiness — you need security to truly open up.",
  },
  Gemini: {
    de: "Dein Mond in den Zwillingen macht deine Gefühle fließend und neugierig — du verarbeitest Emotionen durch Worte und Gespräche.",
    en: "Your Moon in Gemini makes your feelings fluid and curious — you process emotions through words and conversation.",
  },
  Cancer: {
    de: "Dein Mond im Krebs ist in seinem Heimatzeichen — deine emotionale Welt ist unermesslich tief, nährend und empfänglich.",
    en: "Your Moon in Cancer is in its home sign — your emotional world is immeasurably deep, nurturing, and receptive.",
  },
  Leo: {
    de: "Dein Mond im Löwen braucht Wärme und Anerkennung — du liebst großherzig und drückst Gefühle dramatisch und ehrlich aus.",
    en: "Your Moon in Leo needs warmth and recognition — you love generously and express feelings dramatically and honestly.",
  },
  Virgo: {
    de: "Dein Mond in der Jungfrau verarbeitet Gefühle durch Analyse — du sorgst dich um andere, indem du praktische Hilfe anbietest.",
    en: "Your Moon in Virgo processes feelings through analysis — you care for others by offering practical help.",
  },
  Libra: {
    de: "Dein Mond in der Waage sucht emotionale Harmonie — Beziehungen sind der Spiegel, in dem du dich selbst erkennst.",
    en: "Your Moon in Libra seeks emotional harmony — relationships are the mirror in which you recognize yourself.",
  },
  Scorpio: {
    de: "Dein Mond im Skorpion verleiht deinen Emotionen eine transformative Kraft — du fühlst mit einer Intensität, die Berge versetzt.",
    en: "Your Moon in Scorpio gives your emotions a transformative power — you feel with an intensity that moves mountains.",
  },
  Sagittarius: {
    de: "Dein Mond im Schützen braucht Freiheit und Weite — Emotionen sind für dich Abenteuer, die es zu erforschen gilt.",
    en: "Your Moon in Sagittarius needs freedom and space — emotions are adventures to be explored for you.",
  },
  Capricorn: {
    de: "Dein Mond im Steinbock gibt deinen Gefühlen Struktur — du zeigst Liebe durch Verantwortung und langfristige Treue.",
    en: "Your Moon in Capricorn gives your feelings structure — you show love through responsibility and long-term loyalty.",
  },
  Aquarius: {
    de: "Dein Mond im Wassermann verbindet Gefühle mit Idealen — du liebst die Menschheit und brauchst geistige Freiheit in Beziehungen.",
    en: "Your Moon in Aquarius connects feelings with ideals — you love humanity and need intellectual freedom in relationships.",
  },
  Pisces: {
    de: "Dein Mond in den Fischen macht dich zu einem emotionalen Schwamm — du nimmst die Gefühle anderer auf wie ein Ozean.",
    en: "Your Moon in Pisces makes you an emotional sponge — you absorb others' feelings like an ocean.",
  },
};

// ── Chinese Zodiac Animal Templates ──────────────────────────────────────────

const ANIMALS: Record<string, I18n> = {
  Rat:     { de: "Die Ratte im BaZi steht für Scharfsinn und Anpassungsfähigkeit. Du navigierst durchs Leben mit einer intuitiven Cleverness.", en: "The Rat in BaZi stands for shrewdness and adaptability. You navigate life with intuitive cleverness." },
  Ox:      { de: "Der Büffel im BaZi verkörpert Stärke und Ausdauer. Deine Beharrlichkeit führt dich zuverlässig zum Ziel.", en: "The Ox in BaZi embodies strength and endurance. Your persistence reliably leads you to your goals." },
  Tiger:   { de: "Der Tiger im BaZi steht für Mut und Leidenschaft. Du gehst Herausforderungen mit natürlicher Autorität an.", en: "The Tiger in BaZi stands for courage and passion. You face challenges with natural authority." },
  Rabbit:  { de: "Der Hase im BaZi verkörpert Diplomatie und Feinsinn. Deine Eleganz und dein Gespür für Harmonie sind bemerkenswert.", en: "The Rabbit in BaZi embodies diplomacy and refinement. Your elegance and sense of harmony are remarkable." },
  Dragon:  { de: "Der Drache im BaZi steht für Größe und Charisma. Du trägst eine Energie in dir, die Räume füllt und Menschen inspiriert.", en: "The Dragon in BaZi stands for greatness and charisma. You carry an energy that fills rooms and inspires people." },
  Snake:   { de: "Die Schlange im BaZi verkörpert Weisheit und Intuition. Dein analytischer Geist erkennt verborgene Zusammenhänge.", en: "The Snake in BaZi embodies wisdom and intuition. Your analytical mind recognizes hidden connections." },
  Horse:   { de: "Das Pferd im BaZi steht für Freiheit und Energie. Dein Temperament treibt dich voran — Stillstand ist dir fremd.", en: "The Horse in BaZi stands for freedom and energy. Your temperament drives you forward — stagnation is foreign to you." },
  Goat:    { de: "Die Ziege im BaZi verkörpert Kreativität und Sanftmut. Deine künstlerische Seele sieht Schönheit, wo andere sie übersehen.", en: "The Goat in BaZi embodies creativity and gentleness. Your artistic soul sees beauty where others overlook it." },
  Monkey:  { de: "Der Affe im BaZi steht für Intelligenz und Einfallsreichtum. Dein schneller Geist findet Lösungen, die niemand erwartet.", en: "The Monkey in BaZi stands for intelligence and resourcefulness. Your quick mind finds solutions no one expects." },
  Rooster: { de: "Der Hahn im BaZi verkörpert Ehrgeiz und Perfektion. Dein Auge für Details und dein Fleiß bringen dich weit.", en: "The Rooster in BaZi embodies ambition and perfection. Your eye for detail and diligence take you far." },
  Dog:     { de: "Der Hund im BaZi steht für Loyalität und Gerechtigkeit. Dein moralischer Kompass ist stark und unbestechlich.", en: "The Dog in BaZi stands for loyalty and justice. Your moral compass is strong and incorruptible." },
  Pig:     { de: "Das Schwein im BaZi verkörpert Großzügigkeit und Aufrichtigkeit. Dein warmes Herz und deine Ehrlichkeit schaffen Vertrauen.", en: "The Pig in BaZi embodies generosity and sincerity. Your warm heart and honesty create trust." },
};

// ── Wu-Xing Element Descriptions ─────────────────────────────────────────────

const ELEMENTS: Record<string, I18n> = {
  Wood: {
    de: "Holz als dein dominantes Element steht für Wachstum, Kreativität und Aufbruch. Du strebst nach Expansion und neuen Horizonten — wie ein Baum, der unaufhaltsam dem Licht entgegenwächst.",
    en: "Wood as your dominant element stands for growth, creativity, and new beginnings. You strive for expansion and new horizons — like a tree growing unstoppably toward the light.",
  },
  Holz: {
    de: "Holz als dein dominantes Element steht für Wachstum, Kreativität und Aufbruch. Du strebst nach Expansion und neuen Horizonten — wie ein Baum, der unaufhaltsam dem Licht entgegenwächst.",
    en: "Wood as your dominant element stands for growth, creativity, and new beginnings. You strive for expansion and new horizons — like a tree growing unstoppably toward the light.",
  },
  Fire: {
    de: "Feuer als dein dominantes Element steht für Leidenschaft, Transformation und Ausstrahlung. Du entzündest Begeisterung in anderen und trägst ein inneres Leuchten, das nicht zu übersehen ist.",
    en: "Fire as your dominant element stands for passion, transformation, and radiance. You ignite enthusiasm in others and carry an inner glow that cannot be overlooked.",
  },
  Feuer: {
    de: "Feuer als dein dominantes Element steht für Leidenschaft, Transformation und Ausstrahlung. Du entzündest Begeisterung in anderen und trägst ein inneres Leuchten, das nicht zu übersehen ist.",
    en: "Fire as your dominant element stands for passion, transformation, and radiance. You ignite enthusiasm in others and carry an inner glow that cannot be overlooked.",
  },
  Earth: {
    de: "Erde als dein dominantes Element steht für Stabilität, Fürsorge und Verwurzelung. Du bist der ruhende Pol, der anderen Halt gibt — zuverlässig und tief verankert.",
    en: "Earth as your dominant element stands for stability, nurture, and rootedness. You are the calm center that gives others support — reliable and deeply anchored.",
  },
  Erde: {
    de: "Erde als dein dominantes Element steht für Stabilität, Fürsorge und Verwurzelung. Du bist der ruhende Pol, der anderen Halt gibt — zuverlässig und tief verankert.",
    en: "Earth as your dominant element stands for stability, nurture, and rootedness. You are the calm center that gives others support — reliable and deeply anchored.",
  },
  Metal: {
    de: "Metall als dein dominantes Element steht für Klarheit, Struktur und Entschlossenheit. Du schneidest durch Nebel und findest den Kern — präzise, glänzend und unbestechlich.",
    en: "Metal as your dominant element stands for clarity, structure, and determination. You cut through fog and find the core — precise, brilliant, and incorruptible.",
  },
  Metall: {
    de: "Metall als dein dominantes Element steht für Klarheit, Struktur und Entschlossenheit. Du schneidest durch Nebel und findest den Kern — präzise, glänzend und unbestechlich.",
    en: "Metal as your dominant element stands for clarity, structure, and determination. You cut through fog and find the core — precise, brilliant, and incorruptible.",
  },
  Water: {
    de: "Wasser als dein dominantes Element steht für Weisheit, Anpassungsfähigkeit und Tiefe. Du fließt um Hindernisse herum und findest immer deinen Weg — still, aber unaufhaltsam.",
    en: "Water as your dominant element stands for wisdom, adaptability, and depth. You flow around obstacles and always find your way — quiet but unstoppable.",
  },
  Wasser: {
    de: "Wasser als dein dominantes Element steht für Weisheit, Anpassungsfähigkeit und Tiefe. Du fließt um Hindernisse herum und findest immer deinen Weg — still, aber unaufhaltsam.",
    en: "Water as your dominant element stands for wisdom, adaptability, and depth. You flow around obstacles and always find your way — quiet but unstoppable.",
  },
};

// ── Wu-Xing Balance Recommendations ──────────────────────────────────────────

const ELEMENT_ADVICE: Record<string, I18n> = {
  Wood: {
    de: "Stärke dein Holz-Element durch Zeit in der Natur, kreative Projekte und Bewegung. Vermeide Stagnation — dein Wesen braucht Wachstum.",
    en: "Strengthen your Wood element through time in nature, creative projects, and movement. Avoid stagnation — your being needs growth.",
  },
  Fire: {
    de: "Nähre dein Feuer-Element durch inspirierende Begegnungen und Ausdruck deiner Leidenschaft. Achte auf Balance — zu viel Feuer kann ausbrennen.",
    en: "Nourish your Fire element through inspiring encounters and expressing your passion. Mind the balance — too much fire can burn out.",
  },
  Earth: {
    de: "Pflege dein Erde-Element durch Routinen, gesunde Ernährung und die Pflege deines Zuhauses. Du gibst am besten, wenn du selbst geerdet bist.",
    en: "Nurture your Earth element through routines, healthy eating, and caring for your home. You give best when you yourself are grounded.",
  },
  Metal: {
    de: "Schärfe dein Metall-Element durch Ordnung, klare Kommunikation und bewusstes Loslassen. Deine Stärke liegt in Präzision und Klarheit.",
    en: "Sharpen your Metal element through order, clear communication, and conscious letting go. Your strength lies in precision and clarity.",
  },
  Water: {
    de: "Vertiefe dein Wasser-Element durch Meditation, Tagebuch-Schreiben und Zeit der Stille. Deine Weisheit entfaltet sich in der Ruhe.",
    en: "Deepen your Water element through meditation, journaling, and quiet time. Your wisdom unfolds in stillness.",
  },
};

// Normalize element key to English for advice lookup
function normalizeElement(el: string): string {
  const map: Record<string, string> = {
    Holz: "Wood", Feuer: "Fire", Erde: "Earth", Metall: "Metal", Wasser: "Water",
    Wood: "Wood", Fire: "Fire", Earth: "Earth", Metal: "Metal", Water: "Water",
  };
  return map[el] || el;
}

// ── Element balance analysis ─────────────────────────────────────────────────

function analyzeBalance(
  elements: Record<string, number>,
  lang: Lang,
): string {
  const enKeys = ["Wood", "Fire", "Earth", "Metal", "Water"];
  const deNames: Record<string, string> = { Wood: "Holz", Fire: "Feuer", Earth: "Erde", Metal: "Metall", Water: "Wasser" };

  const counts: { name: string; deName: string; count: number }[] = enKeys.map((k) => ({
    name: k,
    deName: deNames[k],
    count: elements[k] ?? elements[deNames[k]] ?? 0,
  }));

  counts.sort((a, b) => b.count - a.count);
  const strongest = counts[0];
  const weakest = counts[counts.length - 1];

  if (lang === "de") {
    return `In deiner Wu-Xing-Balance ist ${strongest.deName} mit ${strongest.count} Punkten am stärksten ausgeprägt, während ${weakest.deName} (${weakest.count}) am wenigsten vertreten ist. Dieses Ungleichgewicht zeigt, wo du bewusst gegensteuern kannst.`;
  }
  return `In your Wu-Xing balance, ${strongest.name} is strongest with ${strongest.count} points, while ${weakest.name} (${weakest.count}) is least present. This imbalance shows where you can consciously counterbalance.`;
}

// ── Fusion paragraph (cross-system) ──────────────────────────────────────────

function buildFusionParagraph(
  sunSign: string,
  animal: string,
  dominant: string,
  lang: Lang,
): string {
  const domEN = normalizeElement(dominant);

  if (lang === "de") {
    return `Hier zeigt sich die Magie der Fusion: Dein westliches Sonnenzeichen ${sunSign} trifft auf die Energie des chinesischen ${animal}, während ${dominant} als dein dominantes Element den Grundton setzt. Diese Dreiklang-Kombination ist einzigartig — sie enthüllt ein Muster, das weder westliche Astrologie noch BaZi allein erkennen könnten. Die Verschmelzung zeigt, dass deine äußere Erscheinung (${sunSign}), dein innerer Lebensweg (${animal}) und deine elementare Essenz (${dominant}) zusammen ein Bild ergeben, das tiefer geht als jedes einzelne System. Nur in der Fusion wird sichtbar, wie diese drei Kräfte einander verstärken und wo sie sich gegenseitig ausbalancieren.`;
  }
  return `Here's where the fusion magic reveals itself: Your Western Sun sign ${sunSign} meets the energy of the Chinese ${animal}, while ${domEN} as your dominant element sets the fundamental tone. This triad combination is unique — it reveals a pattern that neither Western astrology nor BaZi alone could detect. The fusion shows that your outer expression (${sunSign}), your inner life path (${animal}), and your elemental essence (${domEN}) together paint a picture deeper than any single system. Only in fusion does it become visible how these three forces amplify each other and where they create balance.`;
}

// ── Path forward (closing paragraph) ─────────────────────────────────────────

function buildClosing(
  sunSign: string,
  animal: string,
  dominant: string,
  lang: Lang,
): string {
  if (lang === "de") {
    return `Dein kosmisches Profil als ${sunSign} mit der Seele eines ${animal} und der Essenz von ${dominant} ist eine Einladung: Lebe die Schnittmenge deiner drei Systeme bewusst. Wo sich westliche Astrologie, BaZi und Wu-Xing überschneiden, liegt dein größtes Potenzial. Die Sterne haben dir eine einzigartige Signatur geschenkt — eine, die nur du trägst und die darauf wartet, gelebt zu werden.`;
  }
  return `Your cosmic profile as a ${sunSign} with the soul of a ${animal} and the essence of ${normalizeElement(dominant)} is an invitation: consciously live the intersection of your three systems. Where Western astrology, BaZi, and Wu-Xing overlap lies your greatest potential. The stars have given you a unique signature — one that only you carry and that awaits to be lived.`;
}

// ── Main template builder ────────────────────────────────────────────────────

interface TemplateData {
  western?: { zodiac_sign?: string; moon_sign?: string; ascendant_sign?: string };
  bazi?: { day_master?: string; zodiac_sign?: string };
  wuxing?: { dominant_element?: string; elements?: Record<string, number> };
  [key: string]: unknown;
}

export function generateTemplateInterpretation(data: unknown, lang: string = "en"): string {
  const l: Lang = lang === "de" ? "de" : "en";
  const d = data as TemplateData;

  const sunSign = d.western?.zodiac_sign || "";
  const moonSign = d.western?.moon_sign || "";
  const ascendant = d.western?.ascendant_sign || "";
  const dayMaster = d.bazi?.day_master || "";
  const animal = d.bazi?.zodiac_sign || "";
  const dominant = d.wuxing?.dominant_element || "";
  const elements = d.wuxing?.elements || {};

  const paragraphs: string[] = [];

  // §1 — Cosmic Identity (Western Sun + BaZi)
  const sunDesc = SUN_SIGNS[sunSign]?.[l] || "";
  const animalDesc = ANIMALS[animal]?.[l] || "";
  if (sunDesc || animalDesc) {
    const bridge = l === "de"
      ? `${dayMaster ? `Dein BaZi-Tagesmeister ${dayMaster} verstärkt diesen kosmischen Fingerabdruck.` : ""}`
      : `${dayMaster ? `Your BaZi Day Master ${dayMaster} amplifies this cosmic fingerprint.` : ""}`;
    paragraphs.push(
      l === "de" ? "## Deine kosmische Identität" : "## Your Cosmic Identity",
      "",
      [sunDesc, animalDesc, bridge].filter(Boolean).join(" "),
    );
  }

  // §2 — Emotional Depths (Moon + BaZi + Wu-Xing)
  const moonDesc = MOON_SIGNS[moonSign]?.[l] || "";
  if (moonDesc) {
    const elementColor = dominant && ELEMENTS[dominant]
      ? (l === "de"
          ? `Die ${dominant}-Energie deines Wu-Xing-Profils färbt diese emotionale Landschaft zusätzlich ein.`
          : `The ${normalizeElement(dominant)} energy of your Wu-Xing profile adds another layer to this emotional landscape.`)
      : "";
    paragraphs.push(
      "",
      l === "de" ? "## Emotionale Tiefe" : "## Emotional Depths",
      "",
      [moonDesc, elementColor].filter(Boolean).join(" "),
    );
  }

  // §3 — Fusion Revelation
  if (sunSign && animal && dominant) {
    paragraphs.push(
      "",
      l === "de" ? "## Die Fusion-Enthüllung" : "## The Fusion Revelation",
      "",
      buildFusionParagraph(sunSign, animal, dominant, l),
    );
  }

  // §4 — Wu-Xing Balance
  const elementDesc = ELEMENTS[dominant]?.[l] || "";
  const domNorm = normalizeElement(dominant);
  const advice = ELEMENT_ADVICE[domNorm]?.[l] || "";
  if (elementDesc || Object.keys(elements).length > 0) {
    const balance = Object.keys(elements).length > 0 ? analyzeBalance(elements, l) : "";
    const ascendantNote = ascendant
      ? (l === "de"
          ? `Dein Aszendent ${ascendant} bildet die Brücke zwischen deinem Wu-Xing-Profil und deiner äußeren Wirkung auf die Welt.`
          : `Your Ascendant ${ascendant} forms the bridge between your Wu-Xing profile and your outer impact on the world.`)
      : "";
    paragraphs.push(
      "",
      l === "de" ? "## Wu-Xing Balance" : "## Wu-Xing Balance",
      "",
      [elementDesc, balance, ascendantNote, advice].filter(Boolean).join(" "),
    );
  }

  // §5 — Path Forward
  if (sunSign || animal || dominant) {
    paragraphs.push(
      "",
      l === "de" ? "## Dein Weg" : "## Your Path Forward",
      "",
      buildClosing(sunSign, animal, dominant, l),
    );
  }

  // If we have no data at all, return empty to let the static fallback handle it
  if (paragraphs.length === 0) return "";

  return paragraphs.join("\n");
}

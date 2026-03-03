// ── WuXing 五行 — Five Elements Data ──────────────────────────────────────
//
// How to add a new element or update content:
//   1. Add or edit an entry in WUXING_ELEMENTS.
//   2. Supply both `description.en` and `description.de` (2–4 sentences each).
//   3. The `key` field must match the English element name returned by the
//      BaZi/WuXing API (case-sensitive: "Wood", "Fire", "Earth", "Metal", "Water").
//      German API aliases (Holz, Feuer, Erde, Metall, Wasser) are covered by
//      getWuxingByKey().

export interface WuxingElement {
  /** English element name — matches API response */
  key: string;
  /** Chinese character */
  chinese: string;
  /** Pinyin transcription */
  pinyin: string;
  /** Localised names */
  name: { en: string; de: string };
  /** 2–4 sentence description per language */
  description: { en: string; de: string };
  /** Hex colour for visual indicators */
  color: string;
  /** Emoji icon */
  emoji: string;
  /** Associated direction (traditional cosmology) */
  direction: { en: string; de: string };
  /** Associated season */
  season: { en: string; de: string };
}

export const WUXING_ELEMENTS: WuxingElement[] = [
  {
    key: "Wood",
    chinese: "木",
    pinyin: "Mù",
    name: { en: "Wood", de: "Holz" },
    description: {
      en: "Wood embodies growth, flexibility and creative vision. Like a tree reaching skyward, Wood energy drives expansion, renewal and the pursuit of long-term goals. It governs the liver and gallbladder in traditional Chinese medicine, linking body and mind through the capacity to plan and adapt. Those strongly influenced by Wood thrive when they can break new ground and bring ideas to life.",
      de: "Holz verkörpert Wachstum, Flexibilität und kreative Vision. Wie ein Baum, der nach oben strebt, treibt Holz-Energie Ausdehnung, Erneuerung und die Verfolgung langfristiger Ziele an. In der traditionellen chinesischen Medizin regiert es Leber und Gallenblase und verbindet Körper und Geist durch die Fähigkeit zu planen und sich anzupassen. Menschen mit starkem Holz-Einfluss gedeihen, wenn sie Neuland betreten und Ideen zum Leben erwecken können.",
    },
    color: "#3D8B37",
    emoji: "🌿",
    direction: { en: "East", de: "Osten" },
    season: { en: "Spring", de: "Frühling" },
  },
  {
    key: "Fire",
    chinese: "火",
    pinyin: "Huǒ",
    name: { en: "Fire", de: "Feuer" },
    description: {
      en: "Fire represents passion, transformation and radiant self-expression. It brings warmth, enthusiasm and the light of clarity to everything it touches. Fire energy drives joyful communication, sharp intuition and the power to inspire those around you. In Chinese medicine it governs the heart and small intestine, reflecting its role in bringing warmth and discernment into the flow of life.",
      de: "Feuer steht für Leidenschaft, Wandel und strahlende Ausdruckskraft. Es bringt Wärme, Begeisterung und das Licht der Klarheit in alles, was es berührt. Feuer-Energie treibt freudvolle Kommunikation, scharfe Intuition und die Kraft an, die Menschen in der Umgebung zu inspirieren. In der chinesischen Medizin regiert es Herz und Dünndarm und spiegelt seine Rolle wider, Wärme und Unterscheidungsvermögen in den Lebensfluss zu bringen.",
    },
    color: "#D63B0F",
    emoji: "🔥",
    direction: { en: "South", de: "Süden" },
    season: { en: "Summer", de: "Sommer" },
  },
  {
    key: "Earth",
    chinese: "土",
    pinyin: "Tǔ",
    name: { en: "Earth", de: "Erde" },
    description: {
      en: "Earth stands for stability, nourishment and reliable groundedness. It is the central mediating force that harmonises all other elements, providing a steady foundation for growth and change. Earth energy fosters care, patience and the gift of nurturing others through difficulty. In the body it governs the spleen and stomach, reflecting its role in transforming experience into sustenance.",
      de: "Erde steht für Stabilität, Fürsorge und verlässliche Verwurzelung. Sie ist die zentrale vermittelnde Kraft, die alle anderen Elemente harmonisiert und eine beständige Grundlage für Wachstum und Wandel bietet. Erde-Energie fördert Fürsorge, Geduld und die Gabe, anderen in schwierigen Zeiten eine Stütze zu sein. Im Körper regiert sie Milz und Magen und spiegelt ihre Rolle wider, Erfahrungen in Nahrung umzuwandeln.",
    },
    color: "#C8930A",
    emoji: "🌍",
    direction: { en: "Centre", de: "Mitte" },
    season: { en: "Late Summer", de: "Spätsommer" },
  },
  {
    key: "Metal",
    chinese: "金",
    pinyin: "Jīn",
    name: { en: "Metal", de: "Metall" },
    description: {
      en: "Metal embodies structure, clarity and decisive, refining strength. It cuts through confusion to reveal the essential, distilling experience into wisdom. Metal energy confers discipline, precision and the courage to stand firm in one's convictions. Governing the lungs and large intestine in Chinese medicine, it is associated with the capacity to let go of what no longer serves.",
      de: "Metall verkörpert Struktur, Klarheit und entschlossene, läuternde Stärke. Es schneidet durch Verwirrung und legt das Wesentliche frei, destilliert Erfahrung zu Weisheit. Metall-Energie verleiht Disziplin, Präzision und den Mut, zu den eigenen Überzeugungen zu stehen. In der chinesischen Medizin regiert es Lunge und Dickdarm und steht für die Fähigkeit, loszulassen, was nicht mehr dient.",
    },
    color: "#7A7A8C",
    emoji: "⚙️",
    direction: { en: "West", de: "Westen" },
    season: { en: "Autumn", de: "Herbst" },
  },
  {
    key: "Water",
    chinese: "水",
    pinyin: "Shuǐ",
    name: { en: "Water", de: "Wasser" },
    description: {
      en: "Water symbolises wisdom, adaptability and profound intuition. Like a river that always finds its way around obstacles, Water energy explores the hidden depths of experience and nourishes reflection. It carries the seed of potential — the quiet power that waits beneath the surface before bursting into spring. In Chinese medicine it governs the kidneys and bladder, the reservoirs of our deepest ancestral energy.",
      de: "Wasser symbolisiert Weisheit, Anpassungsfähigkeit und tiefe Intuition. Wie ein Fluss, der immer einen Weg um Hindernisse findet, erkundet Wasser-Energie die verborgenen Tiefen der Erfahrung und nährt Selbstbetrachtung. Es trägt den Keim des Potenzials — die stille Kraft, die unter der Oberfläche wartet, bevor sie im Frühling aufbricht. In der chinesischen Medizin regiert es Nieren und Blase, die Speicher unserer tiefsten Ahnen-Energie.",
    },
    color: "#1A6BB5",
    emoji: "💧",
    direction: { en: "North", de: "Norden" },
    season: { en: "Winter", de: "Winter" },
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────

/** Look up a WuXing element by its English or German name (API-agnostic). */
export function getWuxingByKey(key: string): WuxingElement | undefined {
  if (!key) return undefined;
  const lower = key.toLowerCase();
  return WUXING_ELEMENTS.find(
    (el) =>
      el.key.toLowerCase() === lower ||
      el.name.en.toLowerCase() === lower ||
      el.name.de.toLowerCase() === lower,
  );
}

/** Get element name in the requested language. */
export function getWuxingName(key: string, lang: "en" | "de"): string {
  const el = getWuxingByKey(key);
  return el ? el.name[lang] : key;
}

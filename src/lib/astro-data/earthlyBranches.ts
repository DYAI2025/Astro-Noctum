// ── Earthly Branches 地支 (Dìzhī) ─────────────────────────────────────────
//
// The 12 Earthly Branches are a core component of BaZi (Four Pillars) astrology.
// Each branch corresponds to one of the 12 Chinese zodiac animals and is
// associated with a specific WuXing element, Yin/Yang polarity and month.
//
// How to update content:
//   1. Find the entry by `animal.en` or `branch`.
//   2. Edit the `description.en` and/or `description.de` fields (2–4 sentences).
//   3. The `key` field must match the English animal name returned by the API.

export interface EarthlyBranch {
  /** 1-based index within the cycle (Rat = 1, Ox = 2, … Pig = 12) */
  index: number;
  /** Pinyin of the branch character */
  branch: string;
  /** Chinese character */
  chinese: string;
  /** Pinyin of the animal */
  pinyin: string;
  /** Localised animal names */
  animal: { en: string; de: string };
  /** 2–4 sentence description per language */
  description: { en: string; de: string };
  /** Emoji representation */
  emoji: string;
  /** Associated WuXing element key (English) */
  element: string;
  /** Yin/Yang polarity */
  yinYang: "yin" | "yang";
  /** Traditional Chinese lunar month (approximate) */
  lunarMonth: number;
}

export const EARTHLY_BRANCHES: EarthlyBranch[] = [
  {
    index: 1,
    branch: "Zǐ",
    chinese: "子",
    pinyin: "Zǐ",
    animal: { en: "Rat", de: "Ratte" },
    description: {
      en: "The Rat (Zǐ 子) opens the twelve-branch cycle as a symbol of new beginnings and keen intelligence. Governed by Water energy, Rats perceive patterns and opportunities that others easily overlook. Their adaptability and quick thinking make them resourceful in any environment. At their best, Rats channel their restless curiosity into inventive solutions that benefit everyone around them.",
      de: "Die Ratte (Zǐ 子) eröffnet den Zwölf-Zweige-Zyklus als Symbol für Neubeginn und scharfe Intelligenz. Von Wasser-Energie regiert, erkennen Ratten Muster und Chancen, die andere leicht übersehen. Ihre Anpassungsfähigkeit und ihr schnelles Denken machen sie in jeder Umgebung einfallsreich. Im besten Fall kanalisieren Ratten ihre ruhelose Neugier in kreative Lösungen, von denen alle profitieren.",
    },
    emoji: "🐀",
    element: "Water",
    yinYang: "yang",
    lunarMonth: 11,
  },
  {
    index: 2,
    branch: "Chǒu",
    chinese: "丑",
    pinyin: "Chǒu",
    animal: { en: "Ox", de: "Büffel" },
    description: {
      en: "The Ox (Chǒu 丑) is a symbol of diligence, reliability and patient perseverance. Rooted in Earth energy, those born under this branch possess great inner strength and a methodical approach to life's challenges. They build lasting foundations through consistent effort, earning trust through their quiet dependability. The Ox rarely seeks the spotlight but always delivers on its promises.",
      de: "Der Büffel (Chǒu 丑) ist ein Symbol für Fleiß, Verlässlichkeit und geduldige Beharrlichkeit. In der Erde-Energie verwurzelt, besitzen Menschen dieses Zweiges große innere Stärke und eine methodische Herangehensweise an die Herausforderungen des Lebens. Sie bauen durch beständige Arbeit dauerhafte Grundlagen auf und gewinnen Vertrauen durch ihre stille Zuverlässigkeit. Der Büffel sucht selten das Rampenlicht, hält aber immer, was er verspricht.",
    },
    emoji: "🐂",
    element: "Earth",
    yinYang: "yin",
    lunarMonth: 12,
  },
  {
    index: 3,
    branch: "Yín",
    chinese: "寅",
    pinyin: "Yín",
    animal: { en: "Tiger", de: "Tiger" },
    description: {
      en: "The Tiger (Yín 寅) radiates courage, vitality and bold leadership. Fired by Wood energy, Tigers act with fierce independence and an instinctive drive to protect the vulnerable. Their magnetic energy draws followers naturally, though their intensity can be as challenging as it is inspiring. When Tigers learn patience alongside their natural bravery, they become genuinely transformative leaders.",
      de: "Der Tiger (Yín 寅) strahlt Mut, Vitalität und entschlossene Führungsstärke aus. Von Holz-Energie angetrieben, handeln Tiger mit ausgeprägter Unabhängigkeit und einem instinktiven Drang, Schwächere zu schützen. Ihre magnetische Energie zieht Gefolgsleute auf natürliche Weise an, obwohl ihre Intensität genauso herausfordernd wie inspirierend sein kann. Wenn Tiger Geduld neben ihrer natürlichen Tapferkeit erlernen, werden sie zu wahrhaft transformativen Führungspersönlichkeiten.",
    },
    emoji: "🐅",
    element: "Wood",
    yinYang: "yang",
    lunarMonth: 1,
  },
  {
    index: 4,
    branch: "Mǎo",
    chinese: "卯",
    pinyin: "Mǎo",
    animal: { en: "Rabbit", de: "Hase" },
    description: {
      en: "The Rabbit (Mǎo 卯) embodies grace, diplomacy and a refined eye for beauty. Connected to Wood energy, Rabbits navigate life with elegance, cultivating harmony in all their relationships. Their calm exterior conceals a perceptive and strategic mind that works quietly towards its goals. Rabbits are gifted peace-makers who can resolve conflicts through tact and genuine empathy.",
      de: "Der Hase (Mǎo 卯) verkörpert Anmut, Diplomatie und einen verfeinerten Sinn für Schönheit. Mit Holz-Energie verbunden, navigieren Hasen das Leben mit Eleganz und pflegen Harmonie in all ihren Beziehungen. Ihre ruhige Oberfläche verbirgt einen aufmerksamen und strategischen Geist, der still auf seine Ziele hinarbeitet. Hasen sind begabte Friedensstifter, die Konflikte durch Takt und echtes Einfühlungsvermögen lösen können.",
    },
    emoji: "🐇",
    element: "Wood",
    yinYang: "yin",
    lunarMonth: 2,
  },
  {
    index: 5,
    branch: "Chén",
    chinese: "辰",
    pinyin: "Chén",
    animal: { en: "Dragon", de: "Drache" },
    description: {
      en: "The Dragon (Chén 辰) is the most auspicious sign in the Chinese zodiac, radiating power, ambition and mythical grandeur. Earth energy grounds the Dragon's fiery nature, giving vision a solid foundation from which to act. Dragons are natural innovators who can channel immense creative potential into lasting achievements. Their presence commands attention, and their boldness often opens doors others dare not approach.",
      de: "Der Drache (Chén 辰) ist das günstigste Zeichen im chinesischen Tierkreis und strahlt Macht, Ehrgeiz und mythische Größe aus. Erde-Energie erdet die feurige Natur des Drachen und gibt der Vision eine solide Grundlage zum Handeln. Drachen sind geborene Innovatoren, die enormes kreatives Potenzial in bleibende Leistungen umwandeln können. Ihre Gegenwart erregt Aufmerksamkeit, und ihre Kühnheit öffnet oft Türen, an die sich andere nicht trauen.",
    },
    emoji: "🐉",
    element: "Earth",
    yinYang: "yang",
    lunarMonth: 3,
  },
  {
    index: 6,
    branch: "Sì",
    chinese: "巳",
    pinyin: "Sì",
    animal: { en: "Snake", de: "Schlange" },
    description: {
      en: "The Snake (Sì 巳) is associated with wisdom, intuition and subtle refinement. Linked to Fire energy, Snakes possess a penetrating insight into human nature and a natural elegance in all they do. They think deeply before acting, making each decision precise and purposeful. The Snake's quiet intensity and philosophical depth make them some of the most compelling minds in any room.",
      de: "Die Schlange (Sì 巳) ist mit Weisheit, Intuition und subtiler Verfeinerung verbunden. Mit Feuer-Energie verknüpft, besitzen Schlangen ein durchdringendes Verständnis der menschlichen Natur und eine natürliche Eleganz in allem, was sie tun. Sie denken gründlich nach, bevor sie handeln, und machen jede Entscheidung präzise und zielgerichtet. Die stille Intensität und philosophische Tiefe der Schlange machen sie zu einigen der überzeugendsten Geister in jedem Raum.",
    },
    emoji: "🐍",
    element: "Fire",
    yinYang: "yin",
    lunarMonth: 4,
  },
  {
    index: 7,
    branch: "Wǔ",
    chinese: "午",
    pinyin: "Wǔ",
    animal: { en: "Horse", de: "Pferd" },
    description: {
      en: "The Horse (Wǔ 午) embodies freedom, enthusiasm and restless vitality. Governed by Fire energy at its peak, Horses are spirited communicators with an infectious energy that draws others naturally. They thrive when given space to explore — mentally, creatively and physically. The Horse's greatest power lies in its ability to inspire momentum and carry others forward on the strength of its enthusiasm.",
      de: "Das Pferd (Wǔ 午) verkörpert Freiheit, Begeisterung und rastlose Lebendigkeit. Von der Feuer-Energie in ihrem Höhepunkt regiert, sind Pferde lebhafte Kommunikatoren mit einer ansteckenden Energie, die andere auf natürliche Weise anzieht. Sie gedeihen, wenn sie Raum zum Erkunden erhalten — mental, kreativ und körperlich. Die größte Stärke des Pferdes liegt in seiner Fähigkeit, Schwung zu inspirieren und andere auf der Kraft seiner Begeisterung voranzutragen.",
    },
    emoji: "🐎",
    element: "Fire",
    yinYang: "yang",
    lunarMonth: 5,
  },
  {
    index: 8,
    branch: "Wèi",
    chinese: "未",
    pinyin: "Wèi",
    animal: { en: "Goat", de: "Ziege" },
    description: {
      en: "The Goat (Wèi 未) is a symbol of creativity, empathy and tranquil inner strength. Nurtured by Earth energy, Goats have a natural artistic sensibility and a gentle, caring spirit. They seek beauty and harmony in their surroundings and have an uncanny ability to sense the emotional needs of those close to them. When Goats trust their own quiet knowing, they create spaces of remarkable warmth and inspiration.",
      de: "Die Ziege (Wèi 未) ist ein Symbol für Kreativität, Einfühlungsvermögen und stille innere Stärke. Von Erde-Energie genährt, haben Ziegen eine natürliche künstlerische Feinfühligkeit und einen sanften, fürsorglichen Geist. Sie suchen Schönheit und Harmonie in ihrer Umgebung und haben eine außergewöhnliche Fähigkeit, die emotionalen Bedürfnisse der Menschen in ihrer Nähe zu spüren. Wenn Ziegen ihrem eigenen stillen Wissen vertrauen, schaffen sie Räume von bemerkenswerter Wärme und Inspiration.",
    },
    emoji: "🐐",
    element: "Earth",
    yinYang: "yin",
    lunarMonth: 6,
  },
  {
    index: 9,
    branch: "Shēn",
    chinese: "申",
    pinyin: "Shēn",
    animal: { en: "Monkey", de: "Affe" },
    description: {
      en: "The Monkey (Shēn 申) stands for ingenuity, wit and versatile adaptability. Connected to Metal energy, Monkeys are natural problem-solvers whose playful curiosity keeps them perpetually ahead of the curve. Their quick minds and social charm make them compelling in any environment, turning challenges into opportunities with apparent ease. The Monkey's gift is the ability to see novel connections where others see only complexity.",
      de: "Der Affe (Shēn 申) steht für Einfallsreichtum, Witz und vielseitige Anpassungsfähigkeit. Mit Metall-Energie verbunden, sind Affen geborene Problemlöser, deren spielerische Neugier sie dauerhaft einen Schritt voraus hält. Ihr schneller Verstand und ihre soziale Ausstrahlung machen sie in jedem Umfeld überzeugend und verwandeln Herausforderungen scheinbar mühelos in Chancen. Die Gabe des Affen ist die Fähigkeit, neuartige Verbindungen zu sehen, wo andere nur Komplexität sehen.",
    },
    emoji: "🐒",
    element: "Metal",
    yinYang: "yang",
    lunarMonth: 7,
  },
  {
    index: 10,
    branch: "Yǒu",
    chinese: "酉",
    pinyin: "Yǒu",
    animal: { en: "Rooster", de: "Hahn" },
    description: {
      en: "The Rooster (Yǒu 酉) embodies precision, confidence and candid honesty. Aligned with Metal energy, Roosters have a keen eye for detail and a strong sense of duty that drives them toward excellence. They are diligent and hardworking, with a directness that others may find challenging but ultimately come to trust. The Rooster's greatest virtue is the courage to speak truth clearly, even when silence would be easier.",
      de: "Der Hahn (Yǒu 酉) verkörpert Präzision, Selbstvertrauen und offene Aufrichtigkeit. In Einklang mit Metall-Energie haben Hähne ein scharfes Auge für Details und ein ausgeprägtes Pflichtbewusstsein, das sie zur Exzellenz antreibt. Sie sind fleißig und arbeitsam, mit einer Direktheit, die andere herausfordernd finden mögen, der sie aber letztendlich vertrauen. Die größte Tugend des Hahns ist der Mut, die Wahrheit klar auszusprechen, auch wenn Schweigen einfacher wäre.",
    },
    emoji: "🐓",
    element: "Metal",
    yinYang: "yin",
    lunarMonth: 8,
  },
  {
    index: 11,
    branch: "Xū",
    chinese: "戌",
    pinyin: "Xū",
    animal: { en: "Dog", de: "Hund" },
    description: {
      en: "The Dog (Xū 戌) is a symbol of loyalty, justice and unwavering integrity. Rooted in Earth energy, Dogs are devoted companions who uphold truth and stand firmly for those they care about. Their honesty and deep sense of fairness make them universally trusted, though they can struggle when they encounter injustice in the world. At their finest, Dogs remind us that steadfast loyalty and moral courage are among the greatest gifts one person can offer another.",
      de: "Der Hund (Xū 戌) ist ein Symbol für Treue, Gerechtigkeit und unerschütterliche Integrität. In Erde-Energie verwurzelt, sind Hunde hingebungsvolle Gefährten, die die Wahrheit hochhalten und fest für diejenigen eintreten, die ihnen wichtig sind. Ihre Aufrichtigkeit und ihr tiefes Gerechtigkeitsgefühl machen sie allgemein vertrauenswürdig, obwohl sie kämpfen können, wenn sie Ungerechtigkeit in der Welt begegnen. In ihrer besten Form erinnern Hunde uns daran, dass beständige Treue und moralischer Mut zu den größten Gaben gehören, die ein Mensch einem anderen anbieten kann.",
    },
    emoji: "🐕",
    element: "Earth",
    yinYang: "yang",
    lunarMonth: 9,
  },
  {
    index: 12,
    branch: "Hài",
    chinese: "亥",
    pinyin: "Hài",
    animal: { en: "Pig", de: "Schwein" },
    description: {
      en: "The Pig (Hài 亥) represents generosity, sincerity and a wholehearted enjoyment of life's pleasures. Guided by Water energy, Pigs are compassionate and magnanimous spirits who bring joy and abundance wherever they go. Their trust in the fundamental goodness of the world is both their most endearing quality and the vulnerability they must learn to protect. When Pigs combine their natural warmth with healthy discernment, they become a source of genuine abundance for all around them.",
      de: "Das Schwein (Hài 亥) steht für Großzügigkeit, Aufrichtigkeit und das uneingeschränkte Genießen der Freuden des Lebens. Von Wasser-Energie geleitet, sind Schweine mitfühlende und großherzige Wesen, die Freude und Fülle überall dorthin bringen, wo sie erscheinen. Ihr Vertrauen in die grundlegende Güte der Welt ist sowohl ihre liebenswerteste Eigenschaft als auch die Verletzlichkeit, die sie lernen müssen zu schützen. Wenn Schweine ihre natürliche Wärme mit gesundem Unterscheidungsvermögen verbinden, werden sie zu einer Quelle echter Fülle für alle um sie herum.",
    },
    emoji: "🐖",
    element: "Water",
    yinYang: "yin",
    lunarMonth: 10,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────

/** Find a branch by the English or German animal name returned by the API. */
export function getBranchByAnimal(animalName: string): EarthlyBranch | undefined {
  if (!animalName) return undefined;
  const lower = animalName.toLowerCase();
  return EARTHLY_BRANCHES.find(
    (b) => b.animal.en.toLowerCase() === lower || b.animal.de.toLowerCase() === lower,
  );
}

/** Find a branch by its 1-based index. */
export function getBranchByIndex(index: number): EarthlyBranch | undefined {
  return EARTHLY_BRANCHES.find((b) => b.index === index);
}

/** Get animal name in the requested language. */
export function getAnimalName(animalNameEn: string, lang: "en" | "de"): string {
  const branch = getBranchByAnimal(animalNameEn);
  return branch ? branch.animal[lang] : animalNameEn;
}

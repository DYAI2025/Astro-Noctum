// ── Heavenly Stems 天干 (Tiāngān) ────────────────────────────────────────────
//
// The 10 Heavenly Stems form the core of BaZi identity.
// The Day Stem is the "Day Master" (日主 Rìzhǔ) — the truest expression
// of a person's elemental nature. The Month Stem reveals how career
// energy and social drive manifest in the life path.
//
// Each stem has two bilingual description contexts:
//   dayMaster  → personality, elemental identity, inner nature
//   monthStem  → career drive, social tendencies, life season

export interface HeavenlyStem {
  /** Chinese character */
  chinese: string;
  /** Romanised pronunciation */
  pinyin: string;
  /** WuXing element key (English) */
  element: string;
  /** Yin/Yang polarity */
  yinYang: "yin" | "yang";
  /** Localised stem name */
  name: { en: string; de: string };
  /** 3–5 sentence Day Master interpretation */
  dayMaster: { en: string; de: string };
  /** 2–4 sentence Month Stem interpretation */
  monthStem: { en: string; de: string };
}

export const HEAVENLY_STEMS: HeavenlyStem[] = [
  {
    chinese: "甲", pinyin: "Jiǎ", element: "Wood", yinYang: "yang",
    name: { en: "Jiǎ Wood (Yang)", de: "Jiǎ Holz (Yang)" },
    dayMaster: {
      en: "Jiǎ 甲 is the towering tree — you stand tall with a clear sense of purpose and an unwavering drive to grow upward. Your elemental identity is one of ambition, leadership, and principled directness. Like an ancient oak, you are difficult to bend once your roots take hold. You inspire others simply by persisting, and your natural authority comes not from force but from visible integrity. Challenges only strengthen you; pressure shapes you into something more enduring.",
      de: "Jiǎ 甲 ist der aufragende Baum — du stehst aufrecht mit einem klaren Sinn für Bestimmung und einem unerschütterlichen Drang zum Wachstum. Deine elementare Identität ist die von Ambition, Führung und prinzipientreuer Direktheit. Wie eine alte Eiche bist du schwer zu biegen, sobald deine Wurzeln gefasst haben. Du inspirierst andere allein durch deine Beharrlichkeit, und deine natürliche Autorität kommt nicht aus Kraft, sondern aus sichtbarer Integrität. Herausforderungen stärken dich nur; Druck formt dich zu etwas Dauerhafterem.",
    },
    monthStem: {
      en: "Jiǎ in your month pillar signals a career path driven by vision and structural ambition. You are drawn to leadership roles where you can build frameworks, set direction, and grow organisations from the ground up. Your social energy is expansive — you naturally take charge.",
      de: "Jiǎ in deiner Monatssäule signalisiert einen Karriereweg, der von Vision und struktureller Ambition angetrieben wird. Du wirst von Führungsrollen angezogen, in denen du Rahmenwerke aufbauen, Richtungen vorgeben und Organisationen von Grund auf wachsen lassen kannst. Deine soziale Energie ist expansiv — du übernimmst natürlich die Führung.",
    },
  },
  {
    chinese: "乙", pinyin: "Yǐ", element: "Wood", yinYang: "yin",
    name: { en: "Yǐ Wood (Yin)", de: "Yǐ Holz (Yin)" },
    dayMaster: {
      en: "Yǐ 乙 is the vine — flexible, resilient, and quietly unstoppable. Where Jiǎ grows straight upward, you grow around obstacles, finding the path of least resistance without ever giving up. Your elemental identity is one of gentle persistence and adaptive intelligence. You thrive in collaboration, bending with others rather than breaking against them. Your greatest strength is that no one sees you coming until you have already arrived.",
      de: "Yǐ 乙 ist die Ranke — flexibel, belastbar und still unaufhaltsam. Wo Jiǎ geradeaus nach oben wächst, wächst du um Hindernisse herum und findest den Weg des geringsten Widerstands, ohne jemals aufzugeben. Deine elementare Identität ist die von sanfter Beharrlichkeit und adaptiver Intelligenz. Du blühst in der Zusammenarbeit auf und biegst dich mit anderen, statt an ihnen zu zerbrechen. Deine größte Stärke ist, dass niemand dich kommen sieht, bis du bereits angekommen bist.",
    },
    monthStem: {
      en: "Yǐ in your month pillar shapes your career through diplomacy and creative problem-solving. You excel in roles requiring negotiation, artistic sensitivity, and the ability to connect disparate people. Your social approach is warm and disarming, making you a natural networker.",
      de: "Yǐ in deiner Monatssäule formt deine Karriere durch Diplomatie und kreative Problemlösung. Du glänzt in Rollen, die Verhandlungsgeschick, künstlerische Sensibilität und die Fähigkeit erfordern, unterschiedliche Menschen zu verbinden. Dein sozialer Ansatz ist warm und entwaffnend, was dich zu einem natürlichen Netzwerker macht.",
    },
  },
  {
    chinese: "丙", pinyin: "Bǐng", element: "Fire", yinYang: "yang",
    name: { en: "Bǐng Fire (Yang)", de: "Bǐng Feuer (Yang)" },
    dayMaster: {
      en: "Bǐng 丙 is the sun itself — radiant, generous, and impossible to ignore. Your elemental identity is warmth made visible: you illuminate every room you enter and give energy to everyone around you without asking for anything in return. Your personality is bright, optimistic, and magnanimous. You struggle in environments that demand you dim your light, because suppressing your nature goes against your fundamental architecture. When you shine fully, others flourish in your glow.",
      de: "Bǐng 丙 ist die Sonne selbst — strahlend, großzügig und unmöglich zu übersehen. Deine elementare Identität ist sichtbar gewordene Wärme: du erhellst jeden Raum, den du betrittst, und gibst jedem Energie, ohne etwas dafür zu verlangen. Deine Persönlichkeit ist hell, optimistisch und großmütig. Du tust dich schwer in Umgebungen, die verlangen, dass du dein Licht dimmst, weil die Unterdrückung deiner Natur gegen deine fundamentale Architektur geht. Wenn du voll strahlst, gedeihen andere in deinem Glanz.",
    },
    monthStem: {
      en: "Bǐng in your month pillar fuels a career that thrives on visibility, enthusiasm, and public-facing energy. You are drawn to roles where you can inspire, perform, or lead from the front. Your social presence is magnetic and naturally commanding.",
      de: "Bǐng in deiner Monatssäule befeuert eine Karriere, die von Sichtbarkeit, Enthusiasmus und öffentlicher Energie lebt. Du wirst von Rollen angezogen, in denen du inspirieren, auftreten oder von vorne führen kannst. Deine soziale Präsenz ist magnetisch und natürlich befehlend.",
    },
  },
  {
    chinese: "丁", pinyin: "Dīng", element: "Fire", yinYang: "yin",
    name: { en: "Dīng Fire (Yin)", de: "Dīng Feuer (Yin)" },
    dayMaster: {
      en: "Dīng 丁 is the candle flame — intimate, perceptive, and quietly transformative. While Bǐng blazes outward, your fire burns inward with intense focus and emotional depth. You are the keeper of inner light, seeing what others miss in the darkness. Your intuition is exceptionally sharp, and you process the world through feeling as much as thinking. You transform others not through grand gestures but through quiet presence and emotional truth.",
      de: "Dīng 丁 ist die Kerzenflamme — intim, wahrnehmend und still transformativ. Während Bǐng nach außen lodert, brennt dein Feuer nach innen mit intensivem Fokus und emotionaler Tiefe. Du bist der Hüter des inneren Lichts, der sieht, was andere in der Dunkelheit übersehen. Deine Intuition ist außergewöhnlich scharf, und du verarbeitest die Welt durch Fühlen genauso wie durch Denken. Du transformierst andere nicht durch große Gesten, sondern durch stille Präsenz und emotionale Wahrheit.",
    },
    monthStem: {
      en: "Dīng in your month pillar guides your career through insight, creativity, and emotional intelligence. You excel in roles requiring depth — counselling, writing, research, or any field where seeing beneath the surface is the real skill. Your social influence works through trust and intimacy rather than volume.",
      de: "Dīng in deiner Monatssäule leitet deine Karriere durch Einsicht, Kreativität und emotionale Intelligenz. Du glänzt in Rollen, die Tiefe erfordern — Beratung, Schreiben, Forschung oder jedes Feld, in dem das Sehen unter der Oberfläche die eigentliche Fähigkeit ist. Dein sozialer Einfluss wirkt durch Vertrauen und Intimität statt durch Lautstärke.",
    },
  },
  {
    chinese: "戊", pinyin: "Wù", element: "Earth", yinYang: "yang",
    name: { en: "Wù Earth (Yang)", de: "Wù Erde (Yang)" },
    dayMaster: {
      en: "Wù 戊 is the mountain — immovable, dependable, and commanding through sheer presence. Your elemental identity is stability itself. In the landscape of the ten Heavenly Stems, you are the foundation upon which everything else is built.\n\nIn your relationships and daily life, this translates into a grounding force that others instinctively rely on. You are the person who stays calm when chaos erupts, the one whose word carries weight precisely because you never give it lightly. Trust forms around you like sediment — slowly, but in layers that endure.\n\nYour stabilising gifts are patience, honesty, and an unshakeable sense of duty. You build trust over years and hold it for a lifetime. When you commit, your commitment becomes a landmark that others navigate by.\n\nIn shadow, the mountain becomes the wall. Stubbornness, emotional rigidity, and resistance to necessary change are your risks. You may cling to positions, relationships, or habits long after they have stopped serving you — mistaking endurance for wisdom.\n\nYour growth lies in learning to move without losing your centre. A mountain that can shift — even slightly — reshapes the entire landscape. When you allow flexibility into your foundation, your stability transforms from a defence into an invitation.",
      de: "Wù 戊 ist der Berg — unbeweglich, verlässlich und befehlend durch pure Präsenz. Deine elementare Identität ist Stabilität selbst. In der Landschaft der zehn Himmelsstämme bist du das Fundament, auf dem alles andere errichtet wird.\n\nIn deinen Beziehungen und im Alltag zeigt sich das als erdende Kraft, auf die sich andere instinktiv verlassen. Du bist die Person, die ruhig bleibt, wenn Chaos ausbricht — diejenige, deren Wort Gewicht trägt, gerade weil du es nie leichtfertig gibst. Vertrauen bildet sich um dich wie Sediment — langsam, aber in Schichten, die Bestand haben.\n\nDeine stabilisierenden Gaben sind Geduld, Ehrlichkeit und ein unerschütterliches Pflichtbewusstsein. Du baust Vertrauen über Jahre auf und hältst es ein Leben lang. Wenn du dich verpflichtest, wird deine Verpflichtung zu einem Orientierungspunkt, an dem sich andere ausrichten.\n\nIm Schatten wird der Berg zur Mauer. Sturheit, emotionale Rigidität und Widerstand gegen notwendigen Wandel sind deine Risiken. Du klammerst dich möglicherweise an Positionen, Beziehungen oder Gewohnheiten, lange nachdem sie dir nicht mehr dienen — und verwechselst Ausdauer mit Weisheit.\n\nDein Wachstum liegt darin, dich bewegen zu lernen, ohne deine Mitte zu verlieren. Ein Berg, der sich verschiebt — selbst leicht — formt die gesamte Landschaft neu. Wenn du Flexibilität in dein Fundament einlässt, verwandelt sich deine Stabilität von einer Verteidigung in eine Einladung.",
    },
    monthStem: {
      en: "Wù in your month pillar gives your career a foundation-building quality. You are drawn to roles requiring endurance, trustworthiness, and long-term commitment — management, property, finance, or anything where reliability is the currency.\n\nYour professional reputation grows slowly but becomes unshakeable. Others seek you out not for flash or innovation, but for the certainty that what you build will last. Your challenge at work is delegation: the mountain tries to carry everything alone. Your growth comes from trusting others to share the weight.",
      de: "Wù in deiner Monatssäule verleiht deiner Karriere eine fundamentbauende Qualität. Du wirst von Rollen angezogen, die Ausdauer, Vertrauenswürdigkeit und langfristiges Engagement erfordern — Management, Immobilien, Finanzen oder alles, wo Zuverlässigkeit die Währung ist.\n\nDein beruflicher Ruf wächst langsam, wird aber unerschütterlich. Andere suchen dich nicht wegen Glanz oder Innovation, sondern wegen der Gewissheit, dass das, was du aufbaust, Bestand haben wird. Deine Herausforderung im Beruf ist Delegation: Der Berg versucht, alles allein zu tragen. Dein Wachstum entsteht, wenn du anderen vertraust, die Last mitzutragen.",
    },
  },
  {
    chinese: "己", pinyin: "Jǐ", element: "Earth", yinYang: "yin",
    name: { en: "Jǐ Earth (Yin)", de: "Jǐ Erde (Yin)" },
    dayMaster: {
      en: "Jǐ 己 is the fertile soil — nurturing, absorptive, and quietly essential. Where Wù is the mountain that dominates the landscape, you are the garden that makes it liveable. Your elemental identity is one of receptivity and transformation: you take in what life gives you and turn it into something nourishing. Empathetic and adaptable, you are often the emotional anchor in your relationships. Your power lies in your ability to hold space for others without losing yourself.",
      de: "Jǐ 己 ist der fruchtbare Boden — nährend, aufnahmefähig und still unverzichtbar. Wo Wù der Berg ist, der die Landschaft dominiert, bist du der Garten, der sie bewohnbar macht. Deine elementare Identität ist die der Empfänglichkeit und Transformation: du nimmst auf, was das Leben dir gibt, und verwandelst es in etwas Nährendes. Empathisch und anpassungsfähig bist du oft der emotionale Anker in deinen Beziehungen. Deine Kraft liegt in deiner Fähigkeit, Raum für andere zu halten, ohne dich selbst zu verlieren.",
    },
    monthStem: {
      en: "Jǐ in your month pillar shapes a career through service, care, and practical wisdom. You thrive in roles where nurturing others — whether through education, healthcare, hospitality, or community-building — creates tangible results. Your social style is inclusive and supportive.",
      de: "Jǐ in deiner Monatssäule formt eine Karriere durch Service, Fürsorge und praktische Weisheit. Du blühst auf in Rollen, in denen die Fürsorge für andere — sei es durch Bildung, Gesundheitswesen, Gastfreundschaft oder Gemeinschaftsaufbau — greifbare Ergebnisse schafft. Dein sozialer Stil ist inklusiv und unterstützend.",
    },
  },
  {
    chinese: "庚", pinyin: "Gēng", element: "Metal", yinYang: "yang",
    name: { en: "Gēng Metal (Yang)", de: "Gēng Metall (Yang)" },
    dayMaster: {
      en: "Gēng 庚 is the forged blade — decisive, principled, and unyielding in matters of justice. Your elemental identity is one of moral clarity and structural strength. You cut through ambiguity with precision, and your sense of right and wrong is deeply felt, not just intellectually held. Loyal and disciplined, you expect the same standards from others that you demand of yourself. Your challenge is rigidity — but when properly tempered, you become the most reliable instrument in any situation.",
      de: "Gēng 庚 ist die geschmiedete Klinge — entscheidungsfreudig, prinzipientreu und unnachgiebig in Fragen der Gerechtigkeit. Deine elementare Identität ist die der moralischen Klarheit und strukturellen Stärke. Du schneidest mit Präzision durch Mehrdeutigkeit, und dein Gefühl für Richtig und Falsch ist tief empfunden, nicht nur intellektuell gehalten. Loyal und diszipliniert erwartest du von anderen die gleichen Standards, die du von dir selbst verlangst. Deine Herausforderung ist Starrheit — aber richtig gehärtet wirst du zum verlässlichsten Instrument in jeder Situation.",
    },
    monthStem: {
      en: "Gēng in your month pillar drives a career through discipline, excellence, and a relentless pursuit of quality. You thrive in structured environments — law, engineering, military, finance — where precision matters. Your social authority comes from competence, not charm.",
      de: "Gēng in deiner Monatssäule treibt eine Karriere durch Disziplin, Exzellenz und ein unermüdliches Streben nach Qualität an. Du blühst in strukturierten Umgebungen auf — Recht, Ingenieurwesen, Militär, Finanzen — wo Präzision zählt. Deine soziale Autorität kommt aus Kompetenz, nicht aus Charme.",
    },
  },
  {
    chinese: "辛", pinyin: "Xīn", element: "Metal", yinYang: "yin",
    name: { en: "Xīn Metal (Yin)", de: "Xīn Metall (Yin)" },
    dayMaster: {
      en: "Xīn 辛 is the polished jewel — refined, sensitive, and exacting in matters of beauty and truth. While Gēng cuts with force, you cut with precision and elegance. Your elemental identity is one of aesthetic discernment and quiet perfectionism. You see imperfections that others gloss over, and your inner critic is both your greatest tool and your heaviest burden. At your best, you transform raw experience into something luminous — a standard others aspire to.",
      de: "Xīn 辛 ist der polierte Edelstein — raffiniert, sensibel und anspruchsvoll in Sachen Schönheit und Wahrheit. Während Gēng mit Kraft schneidet, schneidest du mit Präzision und Eleganz. Deine elementare Identität ist die des ästhetischen Unterscheidungsvermögens und stillen Perfektionismus. Du siehst Unvollkommenheiten, die andere übersehen, und dein innerer Kritiker ist zugleich dein größtes Werkzeug und deine schwerste Last. Im besten Fall verwandelst du rohe Erfahrung in etwas Leuchtendes — einen Standard, dem andere nacheifern.",
    },
    monthStem: {
      en: "Xīn in your month pillar guides your career through refinement, aesthetics, and attention to detail. You are drawn to creative industries, design, jewellery, finance, or any field where quality over quantity defines success. Your social energy is understated but deeply respected.",
      de: "Xīn in deiner Monatssäule leitet deine Karriere durch Verfeinerung, Ästhetik und Liebe zum Detail. Du wirst von kreativen Branchen, Design, Schmuck, Finanzen oder jedem Feld angezogen, in dem Qualität über Quantität den Erfolg definiert. Deine soziale Energie ist zurückhaltend, aber zutiefst respektiert.",
    },
  },
  {
    chinese: "壬", pinyin: "Rén", element: "Water", yinYang: "yang",
    name: { en: "Rén Water (Yang)", de: "Rén Wasser (Yang)" },
    dayMaster: {
      en: "Rén 壬 is the ocean — vast, deep, and governed by currents invisible to the surface. Your elemental identity is one of expansive thinking and philosophical depth. Among the ten Heavenly Stems, you hold the most boundless energy: the power to connect disparate worlds.\n\nIn daily life, this manifests as intellectual restlessness and emotional range. Ideas, people, and perspectives flow through you in ways that can be overwhelming but are never shallow. You are drawn to the horizon — to whatever lies beyond the known — and your conversations often leave others with more questions than answers, which is exactly your gift.\n\nYour stabilising qualities are vision, adaptability, and the ability to see connections that span entire systems. Where others see isolated facts, you see currents. Your intuition operates at the level of patterns, not details, which makes you a natural strategist and synthesiser.\n\nIn shadow, the ocean becomes the flood. Scattered focus, emotional overwhelm, and an inability to commit to a single direction are your risks. You may start ten projects and finish none, or absorb others' emotions until you lose track of your own. Depth without containment becomes chaos.\n\nYour growth lies in learning to channel without constricting. A river is no less powerful than the ocean — but it moves with purpose. When you give your vast energy a deliberate direction, you become the force that reshapes the landscape.",
      de: "Rén 壬 ist der Ozean — weit, tief und von Strömungen regiert, die an der Oberfläche unsichtbar sind. Deine elementare Identität ist die des expansiven Denkens und der philosophischen Tiefe. Unter den zehn Himmelsstämmen trägst du die grenzenloseste Energie: die Kraft, verschiedene Welten zu verbinden.\n\nIm Alltag zeigt sich das als intellektuelle Rastlosigkeit und emotionale Bandbreite. Ideen, Menschen und Perspektiven fließen durch dich auf Weisen, die überwältigend sein können, aber niemals oberflächlich. Du wirst vom Horizont angezogen — von allem, was jenseits des Bekannten liegt — und deine Gespräche hinterlassen bei anderen oft mehr Fragen als Antworten, was genau deine Gabe ist.\n\nDeine stabilisierenden Qualitäten sind Vision, Anpassungsfähigkeit und die Fähigkeit, Verbindungen zu erkennen, die ganze Systeme umspannen. Wo andere isolierte Fakten sehen, siehst du Strömungen. Deine Intuition operiert auf der Ebene von Mustern, nicht von Details, was dich zu einem natürlichen Strategen und Synthesizer macht.\n\nIm Schatten wird der Ozean zur Flut. Verstreuter Fokus, emotionale Überwältigung und die Unfähigkeit, sich auf eine einzige Richtung festzulegen, sind deine Risiken. Du beginnst möglicherweise zehn Projekte und beendest keines, oder absorbierst die Emotionen anderer, bis du den Überblick über deine eigenen verlierst. Tiefe ohne Begrenzung wird zum Chaos.\n\nDein Wachstum liegt darin, zu kanalisieren, ohne einzuengen. Ein Fluss ist nicht weniger kraftvoll als der Ozean — aber er bewegt sich mit Absicht. Wenn du deiner weiten Energie eine bewusste Richtung gibst, wirst du die Kraft, die die Landschaft neu formt.",
    },
    monthStem: {
      en: "Rén in your month pillar shapes a career through exploration, strategy, and broad vision. You thrive in roles that demand big-picture thinking — consulting, academia, travel, diplomacy, or entrepreneurship.\n\nYour social energy is expansive, gathering diverse people into your orbit. Colleagues value your ability to see around corners and synthesise information from unlikely sources. Your professional challenge is focus: the ocean resists being channelled. Your growth comes from choosing depth over breadth in the projects that truly matter.",
      de: "Rén in deiner Monatssäule formt eine Karriere durch Erkundung, Strategie und weite Vision. Du blühst in Rollen auf, die Weitblick erfordern — Beratung, Akademia, Reisen, Diplomatie oder Unternehmertum.\n\nDeine soziale Energie ist expansiv und sammelt verschiedene Menschen in deinem Orbit. Kollegen schätzen deine Fähigkeit, um Ecken zu denken und Informationen aus unerwarteten Quellen zu synthetisieren. Deine berufliche Herausforderung ist Fokus: Der Ozean wehrt sich dagegen, kanalisiert zu werden. Dein Wachstum entsteht, wenn du bei den Projekten, die wirklich zählen, Tiefe über Breite wählst.",
    },
  },
  {
    chinese: "癸", pinyin: "Guǐ", element: "Water", yinYang: "yin",
    name: { en: "Guǐ Water (Yin)", de: "Guǐ Wasser (Yin)" },
    dayMaster: {
      en: "Guǐ 癸 is the morning dew — gentle, mysterious, and profoundly intuitive. Where Rén is the ocean's force, you are its whisper: subtle, nourishing, and present in ways that escape casual observation. Your elemental identity is one of deep empathy and spiritual sensitivity. You absorb the emotional frequencies of every room you enter, processing them into insight that others cannot access. Your power is quiet but transformative — like rain that changes a landscape overnight without anyone hearing it fall.",
      de: "Guǐ 癸 ist der Morgentau — sanft, geheimnisvoll und zutiefst intuitiv. Wo Rén die Kraft des Ozeans ist, bist du sein Flüstern: subtil, nährend und auf Weisen präsent, die der beiläufigen Beobachtung entgehen. Deine elementare Identität ist die tiefer Empathie und spiritueller Sensibilität. Du absorbierst die emotionalen Frequenzen jedes Raums, den du betrittst, und verarbeitest sie zu Einsicht, die anderen nicht zugänglich ist. Deine Kraft ist still, aber transformativ — wie Regen, der eine Landschaft über Nacht verändert, ohne dass jemand ihn fallen hört.",
    },
    monthStem: {
      en: "Guǐ in your month pillar shapes a career through intuition, healing, and behind-the-scenes influence. You are drawn to roles in therapy, spiritual guidance, research, or creative writing — anywhere that depth of feeling is an asset. Your social influence is subtle but deeply felt by those close to you.",
      de: "Guǐ in deiner Monatssäule formt eine Karriere durch Intuition, Heilung und Einfluss hinter den Kulissen. Du wirst von Rollen in Therapie, spiritueller Führung, Forschung oder kreativem Schreiben angezogen — überall, wo Tiefe des Fühlens ein Vorteil ist. Dein sozialer Einfluss ist subtil, wird aber von den dir Nahestehenden zutiefst gespürt.",
    },
  },
];

/**
 * Look up a Heavenly Stem by its Chinese character.
 * This is the format returned by BAFE (e.g. "甲", "乙", etc.).
 */
export function getStemByCharacter(char: string): HeavenlyStem | undefined {
  return HEAVENLY_STEMS.find((s) => s.chinese === char);
}

/**
 * Look up by Pinyin (case-insensitive first-letter match).
 * E.g. "Jia" → Jiǎ, "bing" → Bǐng
 */
export function getStemByPinyin(pinyin: string): HeavenlyStem | undefined {
  const lower = pinyin.toLowerCase().replace(/[ǎǐīēùǐ]/g, (c) => {
    const map: Record<string, string> = { 'ǎ': 'a', 'ǐ': 'i', 'ī': 'i', 'ē': 'e', 'ù': 'u' };
    return map[c] ?? c;
  });
  return HEAVENLY_STEMS.find((s) => s.pinyin.toLowerCase().replace(/[ǎǐīēùǐ]/g, (c) => {
    const map: Record<string, string> = { 'ǎ': 'a', 'ǐ': 'i', 'ī': 'i', 'ē': 'e', 'ù': 'u' };
    return map[c] ?? c;
  }) === lower);
}

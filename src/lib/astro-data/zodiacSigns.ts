// ── Western Zodiac Sign Data ───────────────────────────────────────────────
//
// Each sign provides three bilingual (EN/DE) description contexts:
//   sun  → conscious will, core identity
//   moon → emotions, instincts, subconscious needs
//   asc  → outer mask, first impression, how others perceive you
//
// Descriptions are 2 sentences each — concise enough for card display.

export interface ZodiacSign {
  /** English API key (matches BAFE response) */
  key: string;
  /** Localised name */
  name: { en: string; de: string };
  /** Unicode astrological symbol */
  emoji: string;
  /** Western classical element */
  element: { en: string; de: string };
  /** Ruling planet(s) */
  ruler: { en: string; de: string };
  /** Sun sign context description */
  sun:  { en: string; de: string };
  /** Moon sign context description */
  moon: { en: string; de: string };
  /** Ascendant context description */
  asc:  { en: string; de: string };
}

export const ZODIAC_SIGNS_DATA: ZodiacSign[] = [
  {
    key: "Aries", name: { en: "Aries", de: "Widder" }, emoji: "♈",
    element: { en: "Fire", de: "Feuer" }, ruler: { en: "Mars", de: "Mars" },
    sun: {
      en: "Your Sun in Aries places the pioneer's fire at the heart of who you are — you are energised by initiative, fresh starts and the thrill of forging a new path. Bold, direct and fiercely independent, your conscious will burns brightest when you are moving forward on your own terms.",
      de: "Deine Sonne im Widder stellt das Feuer des Pioniers in den Kern deiner Identität — du wirst von Initiative, Neuanfängen und dem Reiz des Wegebauens energetisiert. Mutig, direkt und leidenschaftlich unabhängig leuchtet dein bewusster Wille am hellsten, wenn du deine eigenen Regeln setzt.",
    },
    moon: {
      en: "Your Moon in Aries gives you emotions that arrive with immediate, honest force — you feel before you think, and your instinctive reactions are passionate and refreshingly unfiltered. Your emotional core needs space to assert itself; restriction breeds restlessness.",
      de: "Dein Mond im Widder gibt dir Gefühle, die mit sofortiger, ehrlicher Kraft ankommen — du fühlst bevor du denkst, und deine instinktiven Reaktionen sind leidenschaftlich und erfrischend unverfälscht. Dein emotionaler Kern braucht Raum zur Selbstbehauptung; Einschränkung erzeugt Unruhe.",
    },
    asc: {
      en: "An Aries Ascendant means the world reads you as bold, direct and ready for action before you have spoken a single word. Your first impression is that of someone who leads, initiates and is unlikely to wait for permission.",
      de: "Ein Widder-Aszendent bedeutet, dass die Welt dich als mutig, direkt und handlungsbereit liest, noch bevor du ein Wort gesagt hast. Dein erster Eindruck ist der von jemandem, der führt, initiiert und es wahrscheinlich nicht nötig hat, auf Erlaubnis zu warten.",
    },
  },
  {
    key: "Taurus", name: { en: "Taurus", de: "Stier" }, emoji: "♉",
    element: { en: "Earth", de: "Erde" }, ruler: { en: "Venus", de: "Venus" },
    sun: {
      en: "Your Sun in Taurus grounds your identity in the sensory, the beautiful and the enduring — you are driven by a deep need to build lasting value and find pleasure in the tangible world. Patient, reliable and deeply intentional, your will moves slowly but with the unstoppable force of the earth itself.",
      de: "Deine Sonne im Stier verankert deine Identität im Sinnlichen, Schönen und Dauerhaften — du wirst von einem tiefen Bedürfnis nach bleibenden Werten und sinnlichem Erleben angetrieben. Geduldig, zuverlässig und zutiefst absichtsvoll bewegt sich dein Wille langsam, aber mit der unaufhaltsamen Kraft der Erde.",
    },
    moon: {
      en: "Your Moon in Taurus seeks emotional security through constancy, comfort and the familiar rhythms of daily life. Your deepest instinct is to nourish and be nourished; you feel most at ease when your physical environment is stable and beautiful.",
      de: "Dein Mond im Stier sucht emotionale Sicherheit durch Beständigkeit, Komfort und die vertrauten Rhythmen des Alltags. Dein tiefster Instinkt ist zu sorgen und versorgt zu werden; du fühlst dich am wohlsten, wenn deine physische Umgebung stabil und schön ist.",
    },
    asc: {
      en: "A Taurus Ascendant gives you a composed, unhurried presence that others immediately read as reliable, warm and aesthetically attuned. Your first impression is of someone grounded and sensual — someone who notices the beauty in every room they enter.",
      de: "Ein Stier-Aszendent verleiht dir eine ruhige, ungehastete Präsenz, die andere sofort als zuverlässig, warm und ästhetisch feinfühlig wahrnehmen. Dein erster Eindruck ist der von jemandem Geerdeten und Sinnlichen, der die Schönheit in jedem Raum bemerkt.",
    },
  },
  {
    key: "Gemini", name: { en: "Gemini", de: "Zwillinge" }, emoji: "♊",
    element: { en: "Air", de: "Luft" }, ruler: { en: "Mercury", de: "Merkur" },
    sun: {
      en: "Your Sun in Gemini makes your conscious identity a place of perpetual curiosity — you are energised by ideas, conversation and the endless pleasure of connecting disparate things. Versatile and quick-witted, your will finds its highest expression in learning, communicating and bridging worlds.",
      de: "Deine Sonne in den Zwillingen macht deine bewusste Identität zu einem Ort unaufhörlicher Neugier — du wirst von Ideen, Gesprächen und der Freude am Verbinden ungleicher Dinge energetisiert. Vielseitig und schlagfertig findet dein Wille seinen höchsten Ausdruck im Lernen, Kommunizieren und Brückenbauen zwischen Welten.",
    },
    moon: {
      en: "Your Moon in Gemini means your emotions are as quick and changeable as your thoughts — you process feelings by talking them through, and you need intellectual stimulation as much as emotional comfort. Your inner world is lively, curious and rarely content to stay in one feeling for too long.",
      de: "Dein Mond in den Zwillingen bedeutet, dass deine Gefühle so schnell und wandelbar sind wie deine Gedanken — du verarbeitest sie im Gespräch und brauchst geistige Anregung genauso wie emotionalen Komfort. Deine innere Welt ist lebendig und neugierig und selten bereit, zu lange in einem Gefühl zu verweilen.",
    },
    asc: {
      en: "A Gemini Ascendant makes you appear lively, articulate and intellectually engaged at first glance — you project a quick, versatile energy that draws others in with its warmth and wit. Your first impression is of someone perpetually curious, ready for conversation and brimming with ideas.",
      de: "Ein Zwillinge-Aszendent lässt dich auf den ersten Blick lebendig, redegewandt und intellektuell engagiert erscheinen — du projizierst eine schnelle, vielseitige Energie, die andere mit Wärme und Witz anzieht. Dein erster Eindruck ist der von jemandem, der ständig neugierig, gesprächsbereit und voller Ideen ist.",
    },
  },
  {
    key: "Cancer", name: { en: "Cancer", de: "Krebs" }, emoji: "♋",
    element: { en: "Water", de: "Wasser" }, ruler: { en: "Moon", de: "Mond" },
    sun: {
      en: "Your Sun in Cancer roots your conscious will in feeling, memory and the deep need to nurture and be nurtured. Guided by intuition over logic, your core identity is built around home, family and emotional bonds — and your gift is an empathy so finely tuned it can read a room without a single word.",
      de: "Deine Sonne im Krebs verwurzelt deinen bewussten Willen in Gefühl, Erinnerung und dem tiefen Bedürfnis zu sorgen und versorgt zu werden. Von Intuition statt Logik geleitet, ist deine Kernidentität um Heim, Familie und emotionale Bindungen aufgebaut — und deine Gabe ist eine Empathie, die so fein abgestimmt ist, dass sie einen Raum ohne ein einziges Wort liest.",
    },
    moon: {
      en: "Your Moon in Cancer is in its home — emotions run deep, long and loyally here, and your instinctive responses are rooted in the need to protect and to belong. You carry the impressions of your past with remarkable sensitivity; your emotional nourishment comes through genuine closeness and care.",
      de: "Dein Mond im Krebs ist in seinem Zuhause — Emotionen fließen hier tief, lang und loyal, und deine instinktiven Reaktionen sind im Bedürfnis nach Schutz und Zugehörigkeit verwurzelt. Du trägst die Eindrücke deiner Vergangenheit mit bemerkenswerter Sensibilität; deine emotionale Nahrung kommt durch echte Nähe und Fürsorge.",
    },
    asc: {
      en: "A Cancer Ascendant wraps your first impression in warmth, protectiveness and an immediate empathy that makes others feel seen. You enter rooms gently but leave a lasting impression — people sense your depth and find themselves trusting you with things they rarely share.",
      de: "Ein Krebs-Aszendent hüllt deinen ersten Eindruck in Wärme, Beschützertum und eine unmittelbare Empathie, die andere sich gesehen fühlen lässt. Du betrittst Räume sanft, hinterlässt aber einen bleibenden Eindruck — Menschen spüren deine Tiefe und vertrauen dir Dinge an, die sie selten teilen.",
    },
  },
  {
    key: "Leo", name: { en: "Leo", de: "Löwe" }, emoji: "♌",
    element: { en: "Fire", de: "Feuer" }, ruler: { en: "Sun", de: "Sonne" },
    sun: {
      en: "Your Sun in Leo is the solar fire at full blaze — you are here to create, lead and radiate, and your core identity is inseparable from the need to express yourself fully and be genuinely seen. Generous, warm and magnetically alive, you bring light into every room and inspire others simply by being authentically yourself.",
      de: "Deine Sonne im Löwen ist das Sonnenfeuer in voller Glut — du bist hier, um zu erschaffen, zu führen und zu strahlen, und deine Kernidentität ist untrennbar vom Bedürfnis, dich vollständig auszudrücken und wirklich gesehen zu werden. Großzügig, warm und magnetisch lebendig bringst du Licht in jeden Raum und inspirierst andere allein dadurch, dass du authentisch du selbst bist.",
    },
    moon: {
      en: "Your Moon in Leo needs to feel genuinely celebrated and appreciated — your emotional wellbeing is tied to recognition and the freedom to express yourself with drama and colour. At your best you give the warmth you need freely; your challenge is trusting that love doesn't diminish when the spotlight shifts.",
      de: "Dein Mond im Löwen muss sich wirklich gefeiert und gewürdigt fühlen — dein emotionales Wohlbefinden ist an Anerkennung und die Freiheit geknüpft, dich mit Dramatik und Farbe ausdrücken zu können. In deiner besten Form gibst du die Wärme, die du brauchst, freigiebig; die Herausforderung liegt darin zu vertrauen, dass Liebe nicht schwindet, wenn der Scheinwerfer wandert.",
    },
    asc: {
      en: "A Leo Ascendant means you enter every space like a main character — warm, self-assured and unmistakably present. Others sense your confidence and generosity immediately; your first impression is of someone magnetic who is genuinely invested in making everyone around them shine.",
      de: "Ein Löwen-Aszendent bedeutet, dass du jeden Raum wie eine Hauptfigur betrittst — warm, selbstsicher und unverkennbar präsent. Andere spüren deine Zuversicht und Großzügigkeit sofort; dein erster Eindruck ist der von jemandem Magnetischem, dem daran liegt, alle um sich herum zum Strahlen zu bringen.",
    },
  },
  {
    key: "Virgo", name: { en: "Virgo", de: "Jungfrau" }, emoji: "♍",
    element: { en: "Earth", de: "Erde" }, ruler: { en: "Mercury", de: "Merkur" },
    sun: {
      en: "Your Sun in Virgo focuses your conscious will on the art of discernment — you are energised by solving, refining and bringing order to what is complex. Analytical, precise and devoted to improvement, your core identity finds meaning in the mastery of craft and the quiet satisfaction of making things work better.",
      de: "Deine Sonne in der Jungfrau richtet deinen bewussten Willen auf die Kunst der Unterscheidung — du wirst durch Lösen, Verfeinern und das Ordnen des Komplexen energetisiert. Analytisch, präzise und der Verbesserung verpflichtet, findet deine Kernidentität Bedeutung in der Meisterschaft des Handwerks und der stillen Befriedigung, Dinge besser zu machen.",
    },
    moon: {
      en: "Your Moon in Virgo processes emotions through analysis — you make sense of what you feel by examining it carefully, often channelling emotional energy into helpfulness and practical care. Your deepest need is to be of genuine service and to exist in an environment of order and quiet discernment.",
      de: "Dein Mond in der Jungfrau verarbeitet Gefühle durch Analyse — du machst Sinn aus dem, was du fühlst, indem du es sorgfältig untersuchst und emotionale Energie oft in Hilfsbereitschaft und praktische Fürsorge umlenkst. Dein tiefstes Bedürfnis ist es, von echtem Nutzen zu sein und in einer Umgebung von Ordnung und Unterscheidungsvermögen zu leben.",
    },
    asc: {
      en: "A Virgo Ascendant presents you as precise, composed and quietly observant — your first impression is of someone thoughtful, capable and attentive to detail. Others sense your discernment immediately and instinctively trust you with things that require care.",
      de: "Ein Jungfrau-Aszendent präsentiert dich als präzise, gefasst und ruhig beobachtend — dein erster Eindruck ist der von jemandem Nachdenklichem, Fähigem und auffällig aufmerksam gegenüber Details. Andere spüren dein Unterscheidungsvermögen sofort und vertrauen dir instinktiv Dinge an, die Sorgfalt erfordern.",
    },
  },
  {
    key: "Libra", name: { en: "Libra", de: "Waage" }, emoji: "♎",
    element: { en: "Air", de: "Luft" }, ruler: { en: "Venus", de: "Venus" },
    sun: {
      en: "Your Sun in Libra places harmony, fairness and the art of human connection at the core of your identity — you are energised by collaboration, beauty and the pleasure of finding perfect balance between opposing forces. Graceful and diplomatic, your will finds its fullest expression when everyone in the room feels seen.",
      de: "Deine Sonne in der Waage stellt Harmonie, Fairness und die Kunst der menschlichen Verbindung in den Kern deiner Identität — du wirst durch Zusammenarbeit, Schönheit und die Freude am Finden von Gleichgewicht energetisiert. Anmutig und diplomatisch findet dein Wille seinen vollsten Ausdruck, wenn sich jeder im Raum gesehen fühlt.",
    },
    moon: {
      en: "Your Moon in Libra needs harmony to feel emotionally at ease — your inner world is sensitive to imbalance and discord, and your instinct is always to restore equilibrium. You feel most yourself when your relationships are reciprocal, your environment beautiful and you are not being asked to choose too soon.",
      de: "Dein Mond in der Waage braucht Harmonie, um sich emotional wohl zu fühlen — deine innere Welt ist empfindlich gegenüber Ungleichgewicht, und dein Instinkt ist es immer, das Gleichgewicht wiederherzustellen. Du fühlst dich am meisten du selbst, wenn deine Beziehungen gegenseitig und deine Umgebung schön ist.",
    },
    asc: {
      en: "A Libra Ascendant gives you a graceful, charming first impression that immediately puts others at ease — you enter relationships as a diplomat and aesthete with an innate sense for creating comfortable, beautiful social spaces. Others perceive you as balanced, considerate and visually refined.",
      de: "Ein Waage-Aszendent verleiht dir einen anmutigen, charmanten ersten Eindruck, der andere sofort beruhigt — du trittst Beziehungen als Diplomat und Ästhet ein, mit einem angeborenen Gespür für angenehme, schöne soziale Räume. Andere nehmen dich als ausgeglichen, rücksichtsvoll und visuell verfeinert wahr.",
    },
  },
  {
    key: "Scorpio", name: { en: "Scorpio", de: "Skorpion" }, emoji: "♏",
    element: { en: "Water", de: "Wasser" }, ruler: { en: "Pluto & Mars", de: "Pluto & Mars" },
    sun: {
      en: "Your Sun in Scorpio drives your conscious will into depths that others fear to explore — you are energised by transformation, intensity and the pursuit of hidden truth. Magnetic, perceptive and unafraid of the shadow, your core identity is forged in the alchemical fire of crisis, loss and profound renewal.",
      de: "Deine Sonne im Skorpion treibt deinen bewussten Willen in Tiefen, die andere zu erkunden fürchten — du wirst durch Transformation, Intensität und die Suche nach verborgener Wahrheit energetisiert. Magnetisch, hellsichtig und dem Schatten gegenüber furchtlos wird deine Kernidentität im alchemistischen Feuer von Krise, Verlust und tiefgreifender Erneuerung geschmiedet.",
    },
    moon: {
      en: "Your Moon in Scorpio feels with volcanic intensity — nothing is shallow in your emotional world, and your instinct is always to go deeper and forge bonds that are real rather than merely pleasant. Your emotional need is for trust so absolute it allows complete vulnerability.",
      de: "Dein Mond im Skorpion fühlt mit vulkanischer Intensität — nichts ist flach in deiner Gefühlswelt, und dein Instinkt ist es immer, tiefer zu gehen und Bindungen zu schmieden, die real sind, nicht nur angenehm. Dein emotionales Bedürfnis ist nach einem Vertrauen, das so absolut ist, dass es vollständige Verwundbarkeit ermöglicht.",
    },
    asc: {
      en: "A Scorpio Ascendant projects an aura of quiet intensity — you enter a room and people immediately sense a depth and power that is magnetic and slightly mysterious. Your first impression is penetrating and memorable; others are drawn to uncover the layers beneath your composed exterior.",
      de: "Ein Skorpion-Aszendent strahlt eine Aura ruhiger Intensität aus — du betrittst einen Raum und Menschen spüren sofort eine Tiefe und Kraft, die magnetisch und leicht geheimnisvoll ist. Dein erster Eindruck ist durchdringend und unvergesslich; andere fühlen sich davon angezogen, die Schichten unter deiner ruhigen Außenseite aufzudecken.",
    },
  },
  {
    key: "Sagittarius", name: { en: "Sagittarius", de: "Schütze" }, emoji: "♐",
    element: { en: "Fire", de: "Feuer" }, ruler: { en: "Jupiter", de: "Jupiter" },
    sun: {
      en: "Your Sun in Sagittarius anchors your conscious will in the search for meaning, freedom and the ever-expanding horizon. Ruled by Jupiter, your core identity is that of the philosopher-explorer — energised by travel, learning and the conviction that life is a story worth living as broadly as possible.",
      de: "Deine Sonne im Schützen verankert deinen bewussten Willen in der Suche nach Bedeutung, Freiheit und dem stets erweiternden Horizont. Von Jupiter regiert, ist deine Kernidentität die des Philosophen-Entdeckers — energetisiert durch Reisen, Lernen und die Überzeugung, dass das Leben eine Geschichte ist, die so weit wie möglich gelebt werden soll.",
    },
    moon: {
      en: "Your Moon in Sagittarius needs freedom above all else — emotionally you thrive when there is open space, honest conversation and room for adventure. Your instincts are optimistic and forward-looking; you feel best when growing and following the pull of genuine enthusiasm rather than obligation.",
      de: "Dein Mond im Schützen braucht vor allem Freiheit — emotional gedeiht du, wenn es offenen Raum, ehrliche Gespräche und Platz für Abenteuer gibt. Deine Instinkte sind optimistisch und zukunftsgerichtet; du fühlst dich am besten, wenn du wächst und dem Zug echter Begeisterung statt Verpflichtung folgst.",
    },
    asc: {
      en: "A Sagittarius Ascendant gives you an open, enthusiastic first impression — you enter the world with the energy of someone who genuinely believes things will work out and loves to laugh in the meantime. Others read you as adventurous, honest and wonderfully unencumbered by pretence.",
      de: "Ein Schützen-Aszendent gibt dir einen offenen, enthusiastischen ersten Eindruck — du betrittst die Welt mit der Energie von jemandem, der wirklich glaubt, dass sich die Dinge fügen werden. Andere lesen dich als abenteuerlustig, ehrlich und wunderbar unbelastet von Verstellung.",
    },
  },
  {
    key: "Capricorn", name: { en: "Capricorn", de: "Steinbock" }, emoji: "♑",
    element: { en: "Earth", de: "Erde" }, ruler: { en: "Saturn", de: "Saturn" },
    sun: {
      en: "Your Sun in Capricorn focuses your conscious will on the long climb toward mastery — you are energised by structure, discipline and the satisfaction of building something that lasts. Patient and quietly ambitious, your core identity is defined by the willingness to do the difficult work that others avoid.",
      de: "Deine Sonne im Steinbock richtet deinen bewussten Willen auf den langen Aufstieg zur Meisterschaft — du wirst durch Struktur, Disziplin und die Befriedigung des Aufbaus von Dauerhaftem energetisiert. Geduldig und still ehrgeizig wird deine Kernidentität durch die Bereitschaft definiert, die schwierige Arbeit zu tun, die andere meiden.",
    },
    moon: {
      en: "Your Moon in Capricorn keeps emotions under careful management — you feel deeply but rarely show it, channelling emotional energy into achievement and responsibility. Your inner world craves security built through effort; you feel most whole when moving purposefully toward a meaningful goal.",
      de: "Dein Mond im Steinbock hält Emotionen unter sorgfältiger Kontrolle — du fühlst tief, zeigst es aber selten und lenkst emotionale Energie in Leistung und Verantwortung. Deine innere Welt sehnt sich nach durch Mühe aufgebauter Sicherheit; du fühlst dich am ganzheitlichsten, wenn du zielgerichtet auf ein bedeutungsvolles Ziel zubewegst.",
    },
    asc: {
      en: "A Capricorn Ascendant gives you a composed, authoritative first impression — others read you as capable, reliable and quietly serious before you have established anything by word or deed. You project competence and understated ambition, and people instinctively trust you with responsibility.",
      de: "Ein Steinbock-Aszendent gibt dir einen gefassten, autoritativen ersten Eindruck — andere lesen dich als kompetent, zuverlässig und ruhig ernst, bevor du durch Wort oder Tat irgendetwas bewiesen hast. Du projizierst Kompetenz und dezenten Ehrgeiz, und Menschen vertrauen dir instinktiv mit Verantwortung.",
    },
  },
  {
    key: "Aquarius", name: { en: "Aquarius", de: "Wassermann" }, emoji: "♒",
    element: { en: "Air", de: "Luft" }, ruler: { en: "Uranus", de: "Uranus" },
    sun: {
      en: "Your Sun in Aquarius places your core identity in the realm of vision, originality and the future — you are energised by ideas that overturn convention and by the collective possibility of something better. Independent and humanitarian, your will finds its purpose in contributing to something larger than the self.",
      de: "Deine Sonne im Wassermann stellt deine Kernidentität in den Bereich von Vision, Originalität und Zukunft — du wirst durch Ideen, die Konventionen umstürzen, und die kollektive Möglichkeit von etwas Besserem energetisiert. Unabhängig und humanitär findet dein Wille seinen Zweck darin, zu etwas Größerem als dem Selbst beizutragen.",
    },
    moon: {
      en: "Your Moon in Aquarius needs emotional freedom and intellectual companionship — you process feelings most comfortably through ideas and shared vision rather than pure emotional immersion. Your deepest need is a community of minds where you can be completely, eccentrically yourself.",
      de: "Dein Mond im Wassermann braucht emotionale Freiheit und intellektuelle Kameradschaft — du verarbeitest Gefühle am angenehmsten durch Ideen und gemeinsame Vision statt durch reines Eintauchen in Emotionen. Dein tiefstes Bedürfnis ist eine Gemeinschaft von Geistern, wo du vollständig, exzentrisch du selbst sein kannst.",
    },
    asc: {
      en: "An Aquarius Ascendant gives you an intriguing, unconventional first impression — others sense immediately that they are in the presence of someone who thinks differently and refuses to be entirely ordinary. You project originality, openness and an air of friendly but refreshingly unfiltered honesty.",
      de: "Ein Wassermann-Aszendent gibt dir einen faszinierenden, unkonventionellen ersten Eindruck — andere spüren sofort, dass sie sich bei jemandem befinden, der anders denkt und sich weigert, völlig gewöhnlich zu sein. Du projizierst Originalität, Offenheit und eine Luft freundlicher, aber erfrischend unverstellter Ehrlichkeit.",
    },
  },
  {
    key: "Pisces", name: { en: "Pisces", de: "Fische" }, emoji: "♓",
    element: { en: "Water", de: "Wasser" }, ruler: { en: "Neptune", de: "Neptun" },
    sun: {
      en: "Your Sun in Pisces immerses your conscious will in the oceanic realm of imagination, empathy and spiritual longing — you are energised by creativity, compassion and the search for something that transcends the merely material. Intuitive and profoundly sensitive, your core identity is inseparable from the invisible currents that flow between souls.",
      de: "Deine Sonne in den Fischen taucht deinen bewussten Willen in den ozeanischen Bereich von Fantasie, Empathie und spiritueller Sehnsucht — du wirst durch Kreativität, Mitgefühl und die Suche nach etwas jenseits des bloß Materiellen energetisiert. Intuitiv und zutiefst sensibel ist deine Kernidentität untrennbar von den unsichtbaren Strömungen zwischen Seelen.",
    },
    moon: {
      en: "Your Moon in Pisces feels without borders — empathy flows freely and you absorb the emotional atmosphere of any space with remarkable sensitivity. Your inner world is rich with imagery and spiritual resonance; your deepest need is for a sanctuary where your boundless feeling is cherished, not overwhelming.",
      de: "Dein Mond in den Fischen fühlt ohne Grenzen — Empathie fließt frei und du saugst die emotionale Atmosphäre jedes Raums mit bemerkenswerter Sensibilität auf. Deine innere Welt ist reich an Bildern und spiritueller Resonanz; dein tiefstes Bedürfnis ist ein Heiligtum, wo dein grenzenloses Gefühl geschätzt, nicht überwältigend wird.",
    },
    asc: {
      en: "A Pisces Ascendant gives you a soft, ethereal first impression — others perceive you as gentle, empathic and somehow not entirely of this world. You enter spaces with a dreamlike quality that makes people want to share their inner lives with you, sensing you will listen without judgement.",
      de: "Ein Fische-Aszendent gibt dir einen sanften, ätherischen ersten Eindruck — andere nehmen dich als sanft, empathisch und irgendwie nicht ganz von dieser Welt wahr. Du betrittst Räume mit einer traumhaften Qualität, die Menschen dazu bringt, ihr inneres Leben mit dir zu teilen, spürend dass du ohne Urteil zuhörst.",
    },
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────

/** Look up sign data by English API key. */
export function getZodiacSign(key: string): ZodiacSign | undefined {
  if (!key) return undefined;
  return ZODIAC_SIGNS_DATA.find(
    (s) => s.key.toLowerCase() === key.toLowerCase(),
  );
}

/** Localised sign name (Aries → Widder on DE, Aries on EN). */
export function getSignName(apiKey: string, lang: "en" | "de"): string {
  const sign = getZodiacSign(apiKey);
  return sign ? sign.name[lang] : apiKey;
}

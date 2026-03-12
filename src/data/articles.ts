/**
 * Bazodiac — Kosmisches Wissen
 * 6 SEO-Artikel für die Zielgruppe: Menschen, die sich für das Universum,
 * Weltraumwetter, Quantenphysik und kosmische Geheimnisse interessieren.
 *
 * Bilder: NASA Public Domain — bitte lokal speichern unter public/images/artikel/
 * NASA Image Library: https://images.nasa.gov
 */

export interface Article {
  slug: string;
  category: string;
  categoryEn: string;
  readingTime: number; // Minuten
  title: string;
  subtitle: string;
  excerpt: string;
  /** Relativer Pfad z. B. /images/artikel/weltraumwetter.jpg
   *  NASA-Quelle im Kommentar angegeben */
  image: string;
  imageAlt: string;
  /** NASA Original URL for attribution / local download */
  imageCredit: string;
  imageCreditUrl: string;
  /** SEO: Komma-getrennt */
  keywords: string;
  /** Structured sections for full article rendering */
  sections: ArticleSection[];
  /** Link to product after article */
  ctaText: string;
  ctaHref: string;
}

export interface ArticleSection {
  type: 'h2' | 'h3' | 'p' | 'quote' | 'list' | 'highlight';
  content: string;
  items?: string[]; // für 'list'
}

export const ARTICLES: Article[] = [
  {
    slug: 'weltraumwetter',
    category: 'Kosmophysik',
    categoryEn: 'Space Physics',
    readingTime: 8,
    title: 'Weltraumwetter: Wenn die Sonne dein Leben neu schreibt',
    subtitle: 'Sonneneruptionen, geomagnetische Stürme und warum dein Körper die kosmischen Gezeiten spürt',
    excerpt:
      'Was Raumfahrtbehörden als größte Gefahr für moderne Infrastruktur einstufen, ist dasselbe, was antike Kulturen in ihren Sterndeutungen erfassten: Die Sonne ist kein passiver Stern. Sie ist ein lebendiges, pulsendes System — und wir stehen in ihrer Reichweite.',
    image: '/images/artikel/weltraumwetter.jpg',
    // NASA: Solar Dynamics Observatory — SDO/AIA — Public Domain
    // https://images.nasa.gov/details/GSFC_20171208_Archive_e002130
    imageAlt: 'Sonnenkorona mit massiver Sonneneruption — aufgenommen vom NASA Solar Dynamics Observatory',
    imageCredit: 'NASA / SDO / AIA',
    imageCreditUrl: 'https://images.nasa.gov/details/GSFC_20171208_Archive_e002130',
    keywords: 'Weltraumwetter, Sonneneruption, Sonnenwind, geomagnetischer Sturm, Kp-Index, Schumann Resonanz, Carrington Event, Nordlichter',
    ctaText: 'Dein kosmisches Resonanzprofil berechnen',
    ctaHref: '/fu-ring',
    sections: [
      {
        type: 'p',
        content:
          'Am 1. September 1859 beobachtete der britische Astronom Richard Carrington etwas Ungewöhnliches auf der Sonnenoberfläche: einen intensiven weißen Lichtblitz, der nur wenige Minuten andauerte. 17 Stunden später erreichte eine Welle unsichtbarer Energie die Erde. Telegraphenmasten schlugen Funken, Papier fing Feuer — und überall auf der Welt sahen Menschen Polarlichter bis nach Kuba und Australien. Es war das stärkste dokumentierte Weltraumwetterereignis der Geschichte: der Carrington-Event.',
      },
      {
        type: 'h2',
        content: 'Was ist Weltraumwetter?',
      },
      {
        type: 'p',
        content:
          'Weltraumwetter bezeichnet den Einfluss von Sonnenaktivität, kosmischer Strahlung und dem solaren Windstrom auf die Erde und ihre unmittelbare Umgebung. Die Sonne sendet kontinuierlich geladene Teilchen aus — Protonen, Elektronen, Alphateilchen — mit Geschwindigkeiten von 400 bis 800 Kilometern pro Sekunde. Dieser sogenannte Sonnenwind interagiert mit dem Magnetfeld der Erde und erzeugt dabei ein komplexes dynamisches System.',
      },
      {
        type: 'p',
        content:
          'Wenn die Sonne besonders aktiv ist — und sie folgt dabei einem Zyklus von etwa 11 Jahren — entstehen Sonneneruptionen (Solar Flares) und koronale Massenauswürfe (Coronal Mass Ejections, CMEs). Diese Ereignisse schleudern Milliarden von Tonnen magnetisiertem Plasma in den Weltraum. Trifft ein solcher CME die Erde, kann es zu geomagnetischen Stürmen kommen.',
      },
      {
        type: 'h2',
        content: 'Der Kp-Index: Wie Wissenschaftler Weltraumwetter messen',
      },
      {
        type: 'p',
        content:
          'Der Kp-Index ist die globale Kennzahl für geomagnetische Aktivität, entwickelt von Julius Bartels in den 1930er-Jahren. Er reicht von 0 (absolut ruhig) bis 9 (extreme geomagnetische Störung). Ab Kp 5 sprechen Wissenschaftler von einem geomagnetischen Sturm. Ab Kp 8 warnen Raumfahrtbehörden vor Schäden an Satelliten, Stromnetzen und Kommunikationssystemen.',
      },
      {
        type: 'quote',
        content:
          '„Ein Kp-9-Ereignis heute — vergleichbar dem Carrington-Event — würde nach Schätzungen der US National Academy of Sciences Schäden in Höhe von bis zu 2 Billionen Dollar verursachen und große Teile der westlichen Infrastruktur für Monate lahmlegen." — National Academy of Sciences, 2008',
      },
      {
        type: 'h2',
        content: 'Weltraumwetter und der menschliche Körper',
      },
      {
        type: 'p',
        content:
          'Hier wird es faszinierend: Es gibt zunehmend wissenschaftliche Hinweise, dass geomagnetische Stürme nicht nur Satelliten beeinflussen — sondern auch biologische Systeme. Das menschliche Herz-Kreislauf-System reagiert messbar auf Veränderungen im Erdmagnetfeld. Studien des HeartMath Institute (Californien) haben gezeigt, dass während geomagnetischer Aktivität Herzrhythmusstörungen, Blutdruckschwankungen und psychische Unruhe statistisch häufiger auftreten.',
      },
      {
        type: 'p',
        content:
          'Besonders bemerkenswert ist der Zusammenhang mit der Schumann-Resonanz — den elektromagnetischen Eigenfrequenzen der Erde, die durch Blitzentladungen in der Atmosphäre angeregt werden. Die Grundfrequenz der Schumann-Resonanz beträgt etwa 7,83 Hz und liegt damit im Bereich menschlicher Theta-Gehirnwellen. Wenn geomagnetische Stürme diese Resonanzfrequenz modulieren, wird das globale elektromagnetische Umfeld verändert.',
      },
      {
        type: 'h2',
        content: 'Der 11-Jahres-Zyklus und historische Muster',
      },
      {
        type: 'p',
        content:
          'Die Sonne durchläuft einen Aktivitätszyklus von etwa 11 Jahren, gemessen an der Anzahl der Sonnenflecken. Seit 1755 nummerieren Wissenschaftler diese Zyklen. Wir befinden uns aktuell in Zyklus 25, der nach Modellen der NASA ein besonders aktives Sonnensonnmaximum zwischen 2025 und 2026 verspricht. Die zunehmende Zahl von X-Klasse-Sonneneruptionen in den vergangenen Monaten ist ein Vorbote.',
      },
      {
        type: 'highlight',
        content:
          'Im Mai 2024 traf ein G5-Sturm — die stärkste Kategorie — die Erde. Polarlichter waren in Deutschland, Frankreich und sogar Teilen Nordafrikas sichtbar. Es war das stärkste Weltraumwetterereignis seit fast zwei Jahrzehnten.',
      },
      {
        type: 'h2',
        content: 'Was antike Systeme wussten — und moderne Wissenschaft bestätigt',
      },
      {
        type: 'p',
        content:
          'Antike Zivilisationen in China, Mesopotamien und Ägypten beobachteten akribisch die Bewegungen von Himmelskörpern und dokumentierten ihre Wechselwirkungen mit irdischen Ereignissen — Kriegen, Ernten, dem Schicksal von Herrschern. Was damals als mythologisches Denken abgetan wurde, hat heute einen wissenschaftlichen Namen: Weltraumwetter.',
      },
      {
        type: 'p',
        content:
          'Das chinesische BaZi-System, das in Bazodiac in seine moderne Synthese eingeflossen ist, erfasst die kosmischen Energien zum Geburtszeitpunkt — also den präzisen Moment, an dem ein Mensch zum ersten Mal dem erdmagnetischen Feld und dem Sonnenwind ausgesetzt ist. Das Prägenale dieser ersten Exposition auf biologische Systeme ist ein aktives Forschungsfeld der Chronobiologie.',
      },
      {
        type: 'p',
        content:
          'Wenn du dein kosmisches Resonanzprofil bei Bazodiac berechnest, verarbeitest du genau diese astronomischen Daten: die reale Planetenposition, die Sonnenaktivität und die energetischen Muster deiner Geburtsmoments — synthetisiert durch westliche Astrologie, BaZi und Wu-Xing-Elemente.',
      },
    ],
  },

  {
    slug: 'dunkle-materie',
    category: 'Kosmologie',
    categoryEn: 'Cosmology',
    readingTime: 7,
    title: 'Das unsichtbare Universum: 95% des Kosmos sind verborgen',
    subtitle: 'Was Dunkle Materie und Dunkle Energie uns über die Grenzen unseres Wissens lehren',
    excerpt:
      'Alles, was wir sehen können — Sterne, Galaxien, Nebel, Planeten — macht gerade einmal 5% des Universums aus. Der Rest ist dunkel, unsichtbar und noch immer ein fundamentales Rätsel der modernen Physik.',
    image: '/images/artikel/dunkle-materie.jpg',
    // NASA/ESA Hubble: Bullet Cluster (1E 0657-56) — Public Domain
    // https://chandra.harvard.edu/photo/2006/1e0657/
    imageAlt: 'Der Bullet Cluster — Kollision zweier Galaxienhaufen, sichtbarer Beweis für Dunkle Materie',
    imageCredit: 'NASA / CXC / M.Weiss',
    imageCreditUrl: 'https://chandra.harvard.edu/photo/2006/1e0657/',
    keywords: 'Dunkle Materie, Dunkle Energie, Universum, Galaxienrotation, kosmisches Netz, Bullet Cluster, Fritz Zwicky',
    ctaText: 'Das verborgene Profil deines Geburtsmoments entdecken',
    ctaHref: '/fu-ring',
    sections: [
      {
        type: 'p',
        content:
          'Es war 1933, als der Schweizer Astrophysiker Fritz Zwicky etwas Unmögliches berechnete: Die Galaxien im Coma-Cluster bewegten sich viel zu schnell. Nach der Newtonschen Mechanik und der sichtbaren Masse des Clusters hätten sie längst auseinandergeflogen sein müssen. Zwicky schloss auf eine unsichtbare, nicht leuchtende Materie — er nannte sie dunkle Materie. Die Wissenschaft ignorierte ihn für Jahrzehnte.',
      },
      {
        type: 'h2',
        content: 'Der Beweis, der alles veränderte',
      },
      {
        type: 'p',
        content:
          'In den 1970er-Jahren entdeckte die Astronomin Vera Rubin dasselbe Problem bei einzelnen Spiralgalaxien: Die Rotationskurven stimmten nicht. Sterne am Rand von Galaxien sollten sich langsamer bewegen als solche im Zentrum — tun sie aber nicht. Etwas Unsichtbares hält sie auf Kurs. Heute ist Dunkle Materie einer der am besten belegten, und gleichzeitig am schlechtesten verstandenen Bestandteile des Universums.',
      },
      {
        type: 'highlight',
        content:
          'Aktuelle Messungen: Das Universum besteht zu ~68% aus Dunkler Energie, ~27% aus Dunkler Materie und nur ~5% aus gewöhnlicher Materie. Alles, was wir je gesehen, berührt oder gemessen haben, ist der kleinste Teil des Ganzen.',
      },
      {
        type: 'h2',
        content: 'Was ist Dunkle Materie wirklich?',
      },
      {
        type: 'p',
        content:
          'Die ehrliche Antwort: Wir wissen es nicht. Dunkle Materie interagiert nicht mit elektromagnetischer Strahlung — sie sendet kein Licht aus, reflektiert keines und absorbiert keines. Wir können sie nur über ihre Gravitationswirkung nachweisen. Kandidaten für ihre Zusammensetzung umfassen hypothetische Teilchen wie WIMPs (Weakly Interacting Massive Particles), Axionen oder sterile Neutrinos — keines davon wurde bislang direkt beobachtet.',
      },
      {
        type: 'p',
        content:
          'Der bislang überzeugendste indirekte Beweis ist der Bullet Cluster (1E 0657-56): Zwei Galaxienhaufen, die kollidiert sind. Die normale Materie (Gase, Sterne) wurde durch den Aufprall verlangsamt und agglomeriert in der Mitte. Aber Gravitationslinsen-Analysen zeigen, dass die Masse der Haufen weit über die Kollisionszone hinaus verteilt ist — exakt dort, wo die Dunkle Materie sein sollte, wenn sie kaum mit normaler Materie interagiert.',
      },
      {
        type: 'h2',
        content: 'Dunkle Energie: Die noch größere Frage',
      },
      {
        type: 'p',
        content:
          'Wenn Dunkle Materie schon rätselhaft ist, ist Dunkle Energie geradezu philosophisch erschütternd. Sie macht 68% des Universums aus und ist verantwortlich für die beschleunigte Expansion des Universums. 1998 entdeckten zwei unabhängige Forschergruppen durch die Beobachtung von Typ-Ia-Supernovae, dass das Universum nicht nur expandiert — sondern diese Expansion sich beschleunigt. Was auch immer Dunkle Energie ist, sie wirkt dem Gravitationsschluß entgegen und treibt alles auseinander.',
      },
      {
        type: 'quote',
        content:
          '„Das Universum hat nicht die Pflicht, uns verständlich zu sein." — Carl Sagan',
      },
      {
        type: 'h2',
        content: 'Das kosmische Netz und die Struktur des Universums',
      },
      {
        type: 'p',
        content:
          'Dunkle Materie ist nicht gleichmäßig verteilt. Computersimulationen — wie das Millennium-Projekt oder IllustrisTNG — zeigen, dass sie ein kosmisches Netz bildet: Filamente aus Dunkler Materie, an deren Kreuzungspunkten sich Galaxienhaufen formen. Normale Materie fließt entlang dieser unsichtbaren Gerüste. Das sichtbare Universum ist sozusagen die leuchtende Tinte auf einem unsichtbaren Schriftzug.',
      },
      {
        type: 'p',
        content:
          'Diese Erkenntnis verändert fundamental unser Bild von Struktur und Ordnung im Kosmos. Das Universum hat eine Topologie, eine Architektur — aber der größte Teil dieser Architektur bleibt uns verborgen. Was bedeutet das für unser Verständnis von kosmischen Einflüssen auf irdisches Leben? Diese Frage beschäftigt sowohl Physiker als auch Forscher in Bereichen von der Chronobiologie bis hin zur astrologischen Tradition.',
      },
    ],
  },

  {
    slug: 'simulation-theorie',
    category: 'Quantenphysik',
    categoryEn: 'Quantum Physics',
    readingTime: 9,
    title: 'Leben wir in einer Simulation? Was Physiker wirklich denken',
    subtitle: 'Von Nick Bostroms Argument bis zur Holographischen Theorie: Die wissenschaftliche Debatte über die Natur der Realität',
    excerpt:
      'Es ist nicht länger Science-Fiction: Einige der prominentesten Physiker und Philosophen der Welt halten es für möglich — vielleicht sogar wahrscheinlich — dass unsere Realität eine Simulation ist. Die Argumente sind stärker, als die meisten Menschen denken.',
    image: '/images/artikel/simulation-theorie.jpg',
    // NASA: Cosmic Microwave Background (Planck Mission) — Public Domain
    // https://www.esa.int/ESA_Multimedia/Images/2013/03/Planck_CMB
    imageAlt: 'Kosmischer Mikrowellenhintergrund — die "Pixelstruktur" des frühen Universums, aufgenommen von der ESA Planck-Mission',
    imageCredit: 'ESA / Planck Collaboration',
    imageCreditUrl: 'https://www.esa.int/ESA_Multimedia/Images/2013/03/Planck_CMB',
    keywords: 'Simulation Theorie, Bostrom Argument, Holographisches Universum, digitale Physik, Quantenmechanik, Realität, Matrix, Bewusstsein',
    ctaText: 'Den Code deines Geburtsmoments entschlüsseln',
    ctaHref: '/fu-ring',
    sections: [
      {
        type: 'p',
        content:
          'Im Jahr 2003 veröffentlichte der Oxforder Philosoph Nick Bostrom ein Argument, das die Akademia seitdem nicht losgelassen hat: das Simulationsargument. Vereinfacht lautet es: Wenn technologisch fortgeschrittene Zivilisationen in der Lage sind, vollständige Bewusstseinssimulationen zu erschaffen, und wenn es viele solcher Simulationen gibt, dann ist es statistisch wahrscheinlicher, dass wir in einer Simulation leben als in der "Basis-Realität". Ein von drei Szenarien muss wahr sein.',
      },
      {
        type: 'h2',
        content: 'Die drei Thesen Bostroms',
      },
      {
        type: 'list',
        content: 'Mindestens eine der drei Thesen ist wahr:',
        items: [
          'Alle technologisch fortgeschrittenen Zivilisationen sterben aus, bevor sie die Kapazität für Bewusstseinssimulationen erreichen.',
          'Fortgeschrittene Zivilisationen haben kein Interesse daran, Simulationen ihrer Vorfahren zu erschaffen.',
          'Wir leben mit hoher Wahrscheinlichkeit in einer Computersimulation.',
        ],
      },
      {
        type: 'p',
        content:
          'Was viele überrascht: Bostrom selbst bevorzugt keine der drei Thesen explizit. Er stellt das logische Framework auf und überlässt die Schlussfolgerung dem Leser. Aber prominente Denker wie Elon Musk haben sich klar positioniert: "Die Chancen, dass wir in der Basis-Realität leben, sind eins zu Milliarden."',
      },
      {
        type: 'h2',
        content: 'Das Feinabstimmungsproblem und die Grenzen physikalischer Konstanten',
      },
      {
        type: 'p',
        content:
          'Was die Simulation-Hypothese wissenschaftlich interessant macht, ist das sogenannte Feinabstimmungsproblem: Die fundamentalen physikalischen Konstanten des Universums — die Gravitationskonstante, die Stärke der elektromagnetischen Kraft, die Masse des Elektrons — sind mit erschreckender Präzision auf die Entstehung von Materie, Sternen und Leben abgestimmt. Würde die Gravitationskonstante um 0,0001% größer sein, hätte das Universum sofort nach dem Big Bang kollabiert.',
      },
      {
        type: 'p',
        content:
          'Für viele Physiker deutet diese mathematisch unmögliche Präzision darauf hin, dass entweder ein "Multiversum" aus unzähligen zufälligen Universen existiert (von dem wir das einzige bewohnbare sind), oder dass die Konstanten gezielt gesetzt wurden — wie in einer Simulation, in der der Programmierer die Parameter definiert.',
      },
      {
        type: 'h2',
        content: 'Die Holographische Theorie: Das Universum als 2D-Projektion',
      },
      {
        type: 'p',
        content:
          '1997 formulierte der Physiker Juan Maldacena die sogenannte AdS/CFT-Korrespondenz — eine der wichtigsten Entdeckungen der theoretischen Physik der letzten 30 Jahre. Sie besagt, dass eine mathematische Äquivalenz zwischen einer Gravitationstheorie in einem dreidimensionalen Raum und einer Quantenfeldtheorie auf dessen zweidimensionaler Grenzfläche besteht. Im Klartext: Das Universum könnte sich wie ein Hologramm verhalten — alle Information könnte auf einer 2D-Oberfläche kodiert sein.',
      },
      {
        type: 'highlight',
        content:
          'Stephen Hawking beschäftigte sich bis zu seinem Tod mit dieser Theorie. Sein letztes veröffentlichtes Paper (2018) befasst sich mit den Implikationen der holographischen Theorie für die Messung des kosmischen Hintergrunds — und was das für die Frage nach dem "Ende" des Universums bedeutet.',
      },
      {
        type: 'h2',
        content: 'Digitale Physik: Das Universum als Computer',
      },
      {
        type: 'p',
        content:
          'Der Pionier der digitalen Physik, Edward Fredkin, argumentierte bereits in den 1980ern, dass das Universum auf der tiefsten Ebene eine Art zellulärer Automat ist — ein System aus diskreten Informationseinheiten, das nach einfachen Regeln läuft. Der Physiker Max Tegmark geht noch weiter: In seiner "Mathematical Universe Hypothesis" behauptet er, dass die Realität nicht nur durch Mathematik beschrieben wird — sie ist Mathematik.',
      },
      {
        type: 'p',
        content:
          'Ein verblüffendes Argument für die digitale Natur der Realität kommt aus der Quantenmechanik: Die Planck-Länge (1,6 × 10⁻³⁵ Meter) ist die kleinste sinnvoll messbare Länge im Universum. Darunter verliert der Begriff "Raum" seine Bedeutung. Ist das die "Auflösung" der Simulation? Die Pixelgröße der Realität?',
      },
      {
        type: 'h2',
        content: 'Was bedeutet das für Astrologie und kosmische Systeme?',
      },
      {
        type: 'p',
        content:
          'Wenn das Universum tatsächlich informationsbasiert ist — wenn Muster, Frequenzen und mathematische Strukturen das Substrat der Realität sind — dann erhalten Systeme wie Astrologie und BaZi eine völlig neue epistemische Dimension. Sie wären dann nicht "Aberglaube", sondern frühe menschliche Versuche, die Regeln des zugrundeliegenden Systems zu lesen. Dein Geburtsmoment kodiert in einem informationsbasierten Universum präzise Muster: Planetenpositionen, kosmische Energiedichten, elektromagnetische Feldkonfigurationen. Bazodiac liest diese Muster mit astronomischer Präzision.',
      },
    ],
  },

  {
    slug: 'ungeloeste-geheimnisse',
    category: 'Kosmische Mysterien',
    categoryEn: 'Cosmic Mysteries',
    readingTime: 10,
    title: '5 Geheimnisse des Universums, die Physiker noch nicht lösen konnten',
    subtitle: 'Von Signalen aus dem All bis zu den fundamentalen Brüchen in unserer Physik — hier sind die Rätsel, die alles in Frage stellen',
    excerpt:
      'Die Wissenschaft hat erstaunliche Dinge enthüllt: den Urknall, schwarze Löcher, Gravitationswellen. Aber je mehr wir entdecken, desto tiefer die Rätsel. Diese fünf Geheimnisse liegen im Herzen der modernen Physik — und ihre Antworten würden alles verändern.',
    image: '/images/artikel/kosmische-mysterien.jpg',
    // NASA: Hubble Ultra Deep Field — Public Domain
    // https://hubblesite.org/contents/media/images/2014/27/3392-Image.html
    imageAlt: 'Hubble Ultra Deep Field — tausende Galaxien in einem winzigen Ausschnitt des Himmels, jede mit Milliarden von Sternen',
    imageCredit: 'NASA / ESA / Hubble Heritage Team',
    imageCreditUrl: 'https://hubblesite.org/contents/media/images/2014/27/3392-Image.html',
    keywords: 'Ungelöste Geheimnisse Universum, WOW Signal, Fast Radio Bursts, Antimaterie, Galaxienrotation, Quantengravitation, Physik Rätsel',
    ctaText: 'Kosmische Muster in deinem Geburtsmoment entdecken',
    ctaHref: '/fu-ring',
    sections: [
      {
        type: 'p',
        content:
          'Richard Feynman sagte einmal: "Wenn du glaubst, Quantenmechanik zu verstehen, hast du sie nicht verstanden." Das gilt für das gesamte Universum. Je präziser wir messen, desto deutlicher werden die Anomalien. Hier sind fünf der fundamentalsten.',
      },
      {
        type: 'h2',
        content: '1. Das WOW!-Signal — ein Ruf aus dem All?',
      },
      {
        type: 'p',
        content:
          'Am 15. August 1977 empfing das Big Ear Radio-Teleskop der Ohio State University ein Signal, das so außergewöhnlich war, dass der Astronom Jerry Ehman es mit "WOW!" am Rand des Ausdrucks kommentierte. Das Signal dauerte 72 Sekunden, hatte die exakt erwartete Frequenz, auf der Weltraumzivilisationen nach interstellaren Kommunikationsstandards senden würden (1420 MHz, die Wasserstoff-Frequenz) — und wurde seitdem nie wieder empfangen.',
      },
      {
        type: 'p',
        content:
          'Über 200 Versuche, das Signal zu reproduzieren, schlugen fehl. 2016 schlug ein Wissenschaftler vor, es könnte von Kometen stammen — die Hypothese wurde von der Community weitgehend abgelehnt. Das WOW!-Signal bleibt das stärkste kandidatenhafte SETI-Signal aller Zeiten und eines der ungelösten Rätsel der Radioastronomie.',
      },
      {
        type: 'h2',
        content: '2. Fast Radio Bursts — millisekurze Blitze aus Milliarden Lichtjahren Entfernung',
      },
      {
        type: 'p',
        content:
          'Seit 2007 entdecken Astronomen sogenannte Fast Radio Bursts (FRBs): extrem intensive Radiowellenblitze, die nur Millisekunden dauern, aber dabei mehr Energie freisetzen als die Sonne in Tagen oder Wochen. Die meisten kommen aus anderen Galaxien, Milliarden von Lichtjahren entfernt. Einige wiederholen sich, die meisten nicht. Ihre Ursache ist unbekannt.',
      },
      {
        type: 'p',
        content:
          'Magnetare (extrem magnetisierte Neutronensterne) sind die wahrscheinlichste Erklärung für zumindest einige FRBs. Aber einige Eigenschaften bestimmter FRBs passen nicht in dieses Bild. 2020 wurde erstmals ein FRB innerhalb der Milchstraße entdeckt — von einem bekannten Magnetar. Das ist ein Fortschritt. Die fundamentale Frage bleibt: Was erzeugt die energiereichsten dieser Ereignisse?',
      },
      {
        type: 'h2',
        content: '3. Warum gibt es mehr Materie als Antimaterie?',
      },
      {
        type: 'p',
        content:
          'Nach unserem besten Verständnis des Urknalls sollten beim Entstehen des Universums gleiche Mengen Materie und Antimaterie erzeugt worden sein. Wenn Materie auf Antimaterie trifft, vernichten sie sich gegenseitig in einem Energieblitz. Ein Universum aus gleichen Teilen hätte sich also sofort ausgelöscht.',
      },
      {
        type: 'p',
        content:
          'Stattdessen existieren wir. Das bedeutet: Es gab eine minimale Asymmetrie — auf eine Milliarde Antimaterie-Teilchen existierte eine Milliarde-plus-eins Materieteilchen. Aus diesem kleinen Überschuss besteht alles. Aber woher kommt diese Asymmetrie? Das Standardmodell der Teilchenphysik kann sie nicht vollständig erklären. Es ist einer der fundamentalsten offenen Punkte der modernen Physik.',
      },
      {
        type: 'h2',
        content: '4. Das Hubble-Spannungsproblem: Das Universum expandiert zu schnell',
      },
      {
        type: 'p',
        content:
          'Die Hubble-Konstante misst, wie schnell das Universum expandiert. Problem: Je nachdem, wie man sie misst, bekommt man unterschiedliche Werte. Messungen basierend auf der kosmischen Hintergrundstrahlung (früher Kosmos) ergeben einen anderen Wert als Messungen von nahen Cepheiden-Sternen (heutiger Kosmos). Die Diskrepanz liegt bei etwa 8–9% und ist größer als die Messunsicherheiten erlauben.',
      },
      {
        type: 'highlight',
        content:
          'Die "Hubble-Spannung" könnte auf neue Physik jenseits des Standardmodells hinweisen — möglicherweise eine veränderte Rolle der Dunklen Energie im frühen Universum, oder völlig unbekannte Phänomene.',
      },
      {
        type: 'h2',
        content: '5. Das Information-Paradoxon Schwarzer Löcher',
      },
      {
        type: 'p',
        content:
          'Stephen Hawking entdeckte 1974, dass schwarze Löcher langsam Strahlung emittieren (heute "Hawking-Strahlung" genannt) und letztlich verdampfen. Das Problem: Wenn ein schwarzes Loch verdampft, was passiert dann mit den Informationen über alles, was jemals in es hineingefallen ist? Quantenmechanik verbietet den Verlust von Information. Allgemeine Relativitätstheorie scheint ihn zu erfordern.',
      },
      {
        type: 'p',
        content:
          'Diese Kollision zweier fundamentaler Theorien — Quantenmechanik und Allgemeine Relativitätstheorie — ist das tiefste Problem der theoretischen Physik. Eine vollständige Quantengravitationstheorie, die beide versöhnt, existiert noch nicht. Kandidaten sind Stringtheorie, Loop-Quantengravitation und andere Ansätze — aber kein Konsens. Hawking rang bis zu seinem Tod mit diesem Problem.',
      },
    ],
  },

  {
    slug: 'quantenverschraenkung',
    category: 'Quantenphysik',
    categoryEn: 'Quantum Physics',
    readingTime: 7,
    title: 'Quantenverschränkung: Warum der Kosmos keine Distanz kennt',
    subtitle: 'Das "spukhafte Fernwirken" Einsteins ist real — und verändert unser Verständnis von Raum, Zeit und Verbindung',
    excerpt:
      'Einstein nannte es "spukhafte Fernwirkung" und glaubte, es könne nicht existieren. Das Experiment bewies, dass er falsch lag. Quantenverschränkung ist eine der seltsamsten bestätigten Tatsachen der Physik — und könnte die Grundlage für eine neue Theorie des Kosmos sein.',
    image: '/images/artikel/quantenverschraenkung.jpg',
    // NASA: Illustration quantum entanglement — Public Domain
    // https://www.nasa.gov/missions/analog/quantum-entanglement-illustration/
    imageAlt: 'Abstrakte Darstellung verschränkter Quantenteilchen und ihre nicht-lokalen Korrelationen',
    imageCredit: 'NASA / JPL-Caltech',
    imageCreditUrl: 'https://www.jpl.nasa.gov/',
    keywords: 'Quantenverschränkung, Nichtlokalität, Bells Theorem, EPR Paradoxon, Quantenmechanik, Bewusstsein, Alain Aspect, Quantenkorrelation',
    ctaText: 'Deine kosmische Resonanzstruktur berechnen',
    ctaHref: '/fu-ring',
    sections: [
      {
        type: 'p',
        content:
          '1935 veröffentlichten Albert Einstein, Boris Podolsky und Nathan Rosen ein Gedankenexperiment, das als EPR-Paradoxon in die Geschichte einging. Sie fragten: Wenn zwei Teilchen miteinander wechselwirken und dann getrennt werden, können Messungen an einem Teilchen sofort die Eigenschaften des anderen beeinflussen — unabhängig von der Entfernung? Einstein hielt das für einen Fehler in der Quantenmechanik, nicht für eine physikalische Realität.',
      },
      {
        type: 'h2',
        content: 'Bells Theorem und das Ende des lokalen Realismus',
      },
      {
        type: 'p',
        content:
          '1964 bewies der Physiker John Bell mathematisch, dass Einsteins Intuition falsch sein musste: Wenn lokaler Realismus gilt (also wenn Objekte unabhängig von Beobachtung definierte Eigenschaften haben), dann müssen bestimmte statistische Korrelationen eine obere Grenze haben. Quantenmechanik sagte voraus, dass diese Grenze verletzt wird. Das ist das Bell-Theorem.',
      },
      {
        type: 'p',
        content:
          '1972 führte Stuart Freedman das erste Experiment durch, das Bells Ungleichungen testete. 1982 führte Alain Aspect in Paris präzisere Experimente durch und bestätigte die Verletzung der Bell-Ungleichungen eindeutig. 2022 erhielten Aspect, John Clauser und Anton Zeilinger den Nobelpreis für Physik genau für diese Arbeiten. Das Urteil der Natur war eindeutig: Lokaler Realismus ist falsch.',
      },
      {
        type: 'quote',
        content:
          '„Das Universum ist nicht lokal realistisch. Entweder hat die Realität keine definiten Eigenschaften vor der Messung, oder es gibt Einflüsse, die sich schneller als Licht ausbreiten. Oder beides." — Alain Aspect, Nobelpreis-Vortrag 2022',
      },
      {
        type: 'h2',
        content: 'Was Quantenverschränkung wirklich bedeutet',
      },
      {
        type: 'p',
        content:
          'Wenn zwei Teilchen verschränkt sind, bilden sie ungeachtet ihrer räumlichen Trennung ein gemeinsames Quantensystem. Misst man den Spin eines Teilchens und findet "up", weiß man sofort, dass das andere "down" hat — egal ob das andere Teilchen auf dem Mond oder in einer anderen Galaxie ist. Diese Korrelation ist instantan und nicht durch Signalübertragung erklärbar.',
      },
      {
        type: 'p',
        content:
          'Wichtig: Information im klassischen Sinne kann nicht schneller als Licht übertragen werden — die Messergebnisse sind lokal zufällig, und erst durch den Vergleich (der nicht schneller als Licht erfolgen kann) wird die Korrelation sichtbar. Aber die Verschränkung selbst existiert als reales, nicht-lokales Merkmal des Quantensystems.',
      },
      {
        type: 'h2',
        content: 'Das kosmische Netz der Verschränkung',
      },
      {
        type: 'p',
        content:
          'Ein faszinanter Aspekt: Verschränkung ist kein Laborexot. Im frühen Universum, kurz nach dem Urknall, interagierten Teilchen in extrem engem Kontakt miteinander. Theoretisch könnten Teilchen, die heute Milliarden von Lichtjahren entfernt sind, in einem kosmologischen Sinne noch immer korreliert sein — als Echo der Urknall-Verschränkung. Einige Forscher spekulieren, dass das kosmische Netz der Galaxien und die Struktur des Universums durch ursprüngliche Quantenkorrelationen mitgeformt wurden.',
      },
      {
        type: 'h2',
        content: 'Verschränkung, Bewusstsein und das Wu-Xing-Prinzip',
      },
      {
        type: 'p',
        content:
          'Die Frage, ob Quantenprozesse im Gehirn eine Rolle bei Bewusstsein spielen, bleibt wissenschaftlich kontrovers (Penrose-Hameroff-Hypothese). Aber unabhängig davon ist die philosophische Konsequenz der Quantenverschränkung klar: Die Vorstellung von strengem Determinismus und vollständiger Lokalität — die Idee, dass jedes Ding ein abgeschlossenes, isoliertes Ding ist — ist physikalisch falsch.',
      },
      {
        type: 'p',
        content:
          'Das Wu-Xing-System (Fünf Elemente) im chinesischen Denken beschreibt die Realität nicht als Sammlung von Objekten, sondern als ein dynamisches Netz von Beziehungen und Wechselwirkungen. Holz nährt Feuer, Feuer erzeugt Erde — die Elemente sind fundamental relational. Diese Ontologie steht, zumindest metaphorisch, in erstaunlicher Resonanz mit der nicht-lokalen Natur der Quantenwelt.',
      },
    ],
  },

  {
    slug: 'kosmische-frequenz',
    category: 'Kosmische Resonanz',
    categoryEn: 'Cosmic Resonance',
    readingTime: 8,
    title: 'Die Frequenz des Kosmos: Wie das Universum mit uns kommuniziert',
    subtitle: 'Schumann-Resonanz, Planetenschwingungen und die elektromagnetische Sprache des Sonnensystems',
    excerpt:
      'Das Universum ist nicht still. Es vibriert, pulsiert und sendet kontinuierlich Informationen — in Frequenzen, die unsere Messgeräte erst seit wenigen Jahrzehnten erfassen können. Was antike Systeme als kosmische Musik beschrieben, hat heute eine Physik.',
    image: '/images/artikel/kosmische-frequenz.jpg',
    // NASA: Aurora Borealis from ISS — Public Domain
    // https://images.nasa.gov/details/iss030e005927
    imageAlt: 'Polarlicht (Aurora Borealis) über der Erde, aufgenommen von der Internationalen Raumstation — sichtbares Zeichen der elektromagnetischen Verbindung zwischen Sonne und Erde',
    imageCredit: 'NASA / ISS Expedition 30',
    imageCreditUrl: 'https://images.nasa.gov/details/iss030e005927',
    keywords: 'Schumann Resonanz, kosmische Frequenz, Planetenschwingungen, 432 Hz, elektromagnetisches Feld, Sonnenwind, Bioresonanz, kosmische Strahlung',
    ctaText: 'Die Frequenz deines Geburtsmoments analysieren',
    ctaHref: '/fu-ring',
    sections: [
      {
        type: 'p',
        content:
          'Pythagoras lehrte, das Universum sei Zahl — und Zahl sei Klang. Die Planeten, so glaubten die antiken Griechen, erzeugen in ihrer Bewegung eine "Harmonia mundi", eine Weltenharmonie. Johannes Kepler widmete sein Werk "Harmonices Mundi" (1619) der mathematischen Analyse der Planetenbewegungen als Ausdrücke musikalischer Verhältnisse. Heute würden wir sagen: Er suchte nach Frequenzen.',
      },
      {
        type: 'h2',
        content: 'Die Schumann-Resonanz: Die Eigenfrequenz der Erde',
      },
      {
        type: 'p',
        content:
          '1952 formulierte der Physiker Winfried Otto Schumann eine Vorhersage: Der Raum zwischen der Erdoberfläche und der Ionosphäre wirkt wie ein Resonator für elektromagnetische Wellen. Blitze, die weltweit etwa 100 Mal pro Sekunde einschlagen, regen diesen Resonator an. Die Grundfrequenz berechnete er zu 7,83 Hz — heute bekannt als "Schumann-Resonanz".',
      },
      {
        type: 'p',
        content:
          'Was Schumann nicht vorhersagte: Diese 7,83 Hz liegen exakt im Bereich der Theta-Wellen des menschlichen Gehirns (4–8 Hz), die mit Meditation, Traumzuständen und kreativen Zuständen assoziiert sind. Ist das Zufall? Die Schumann-Resonanz schwankt und wird durch geomagnetische Aktivität moduliert. In jüngerer Zeit haben Forscher des NASA Goddard Space Flight Centers gezeigt, dass intensivere geomagnetische Stürme die Schumann-Resonanz deutlich verändern.',
      },
      {
        type: 'highlight',
        content:
          'HeartMath Institute-Studien: Das Herzfeld des Menschen (elektrisches und magnetisches) ist messbar synchronisiert mit der Schumann-Resonanz-Variation. In Phasen erhöhter kosmischer Aktivität zeigen kollektive Stimmungsmesswerte statistisch signifikante Abweichungen.',
      },
      {
        type: 'h2',
        content: 'Planetare Frequenzen: Wenn Astronomie zur Musik wird',
      },
      {
        type: 'p',
        content:
          'Jeder Planet in unserem Sonnensystem hat eine Umlaufzeit — und jede Umlaufzeit korrespondiert, wenn auf hörbare Frequenzen transponiert, zu einem Ton. Dieses Konzept der "Planetentöne" wurde von dem Schweizer Musikforscher Hans Cousto in seinem Buch "Die kosmische Oktave" (1984) formalisiert. Cousto berechnete die Grundfrequenz der Erde (ein "Jahr" transponiert) zu 136,1 Hz — die sogenannte "Om-Frequenz", die in indischen spirituellen Traditionen seit Jahrtausenden verwendet wird.',
      },
      {
        type: 'p',
        content:
          'Solche Übereinstimmungen zwischen empirisch bestimmten physikalischen Frequenzen und traditional verwendeten Frequenzen in globalen Kulturen sind schwer als reine Zufälle abzutun. Sie deuten auf eine tiefe Intuition dieser Kulturen hin, die kosmischen Rhythmen zu erfassen — lange bevor die technischen Mittel zur direkten Messung vorhanden waren.',
      },
      {
        type: 'h2',
        content: 'Kosmische Strahlung und biologische Systeme',
      },
      {
        type: 'p',
        content:
          'Die Erde wird kontinuierlich von kosmischer Strahlung bombardiert — hochenergetischen Teilchen, die aus dem Sonnensystem, der Milchstraße und extragalaktischen Quellen stammen. Diese Strahlung interagiert mit der Atmosphäre und erzeugt Muonen und andere Sekundärteilchen, die bis auf Meereshöhe durchdringen. Jede Sekunde durchfliegen etwa 10.000 kosmische Muonen jeden Quadratmeter der Erdoberfläche.',
      },
      {
        type: 'p',
        content:
          'Forschung zeigt, dass kosmische Strahlung die Wolkenbildung beeinflusst — über einen Mechanismus, den der dänische Physiker Henrik Svensmark als "kosmische Wolkensynthese" bezeichnet. Das Klimasystem der Erde ist also mittelbar von der galaktischen Umgebung beeinflusst. Der Kosmos formt unser Wetter — nicht nur "Weltraumwetter", sondern das irdische Klima.',
      },
      {
        type: 'h2',
        content: 'BaZi und Wu-Xing als kosmisches Frequenzmodell',
      },
      {
        type: 'p',
        content:
          'Das chinesische BaZi-System (Vier Säulen des Schicksals) und das Wu-Xing-Modell (Fünf Elemente) beschreiben die Energie des Geburtsmoments als Resonanzmuster: Welche Elemente dominieren, in welcher Interaktion stehen sie, wie verändern sie sich über Lebenszyklen. Das ist strukturell analog zur modernen Beschreibung eines komplexen Systems durch seine dominanten Frequenzen und deren Wechselwirkungen.',
      },
      {
        type: 'p',
        content:
          'Bazodiac synthetisiert diese antike Frequenzsprache mit moderner Astronomie: Reale Planetenpositionen zum Geburtsmoment, westliche Astrologie-Winkel, BaZi-Pillars und Wu-Xing-Bilanz werden durch KI-Systeme zu einem integrierten Profil verknüpft. Das ist kein Widerspruch zwischen Wissenschaft und Tradition — es ist die Übersetzung einer in die andere.',
      },
    ],
  },
];

export function getArticleBySlug(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}

export function getFeaturedArticles(count = 3): Article[] {
  return ARTICLES.slice(0, count);
}

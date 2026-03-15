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
    ctaHref: '/signatur',
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
    ctaHref: '/signatur',
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
    ctaHref: '/signatur',
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
    ctaHref: '/signatur',
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
    ctaHref: '/signatur',
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
    ctaHref: '/signatur',
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
  {
    slug: 'bazi-wuxing-energetische-landkarte',
    category: 'Chinesische Metaphysik',
    categoryEn: 'Chinese Metaphysics',
    readingTime: 7,
    title: 'BaZi & WuXing: Deine energetische Landkarte',
    subtitle: 'Chinesische Astrologie vs. BaZi Schicksalsanalyse — Ein tiefer Einblick in deine kosmische DNA',
    excerpt:
      'BaZi und WuXing sind keine Wahrsagerei, sondern jahrtausendealte Systeme zur Analyse deiner einzigartigen energetischen Prägung bei der Geburt. Ein kosmischer Bauplan, der dir hilft, Talente, Potenziale und deinen Lebensweg zu verstehen.',
    image: '/images/artikel/bazi-wuxing.jpg',
    imageAlt: 'Chinesische Kalligraphie der Fünf Elemente — Holz, Feuer, Erde, Metall, Wasser',
    imageCredit: 'Bazodiac',
    imageCreditUrl: 'https://bazodiac.space',
    keywords: 'BaZi, Schicksalsanalyse, Vier Säulen des Schicksals, chinesische Astrologie, Tagesmeister, Fünf Elemente, WuXing, energetisches Profil, Selbsterkenntnis, Lebensweg, Glückszyklen, Geburtsdatum, Tierkreiszeichen',
    ctaText: 'Dein BaZi-Profil jetzt berechnen',
    ctaHref: '/signatur',
    sections: [
      {
        type: 'p',
        content:
          'Willkommen in der faszinierenden Welt der chinesischen Metaphysik! BaZi (Acht Zeichen) und WuXing (Fünf Wandlungsphasen) sind keine Wahrsagerei, sondern jahrtausendealte Systeme zur Analyse deiner einzigartigen energetischen Prägung bei der Geburt. Betrachte es als eine Art kosmischen Bauplan oder eine Landkarte, die dir hilft, deine Talente, Potenziale und deinen Lebensweg besser zu verstehen.',
      },
      {
        type: 'h2',
        content: '1. Was ist BaZi?',
      },
      {
        type: 'p',
        content:
          'BaZi wird oft als „Vier Säulen des Schicksals" bezeichnet. Warum? Weil es auf deinem Geburtsjahr, -monat, -tag und deiner Geburtsstunde basiert. Jede dieser vier Einheiten bildet eine „Säule". Jede Säule besteht wiederum aus zwei Zeichen: einem Himmelsstamm (der äußeren, sichtbaren Energie) und einem Erdzweig (der inneren, verborgenen Energie, die oft durch ein Tier repräsentiert wird). Zusammen ergeben das 4×2=8 Zeichen – daher der Name BaZi (八字), was wörtlich „Acht Zeichen" bedeutet.',
      },
      {
        type: 'h2',
        content: '2. WuXing: Die Fünf Wandlungsphasen',
      },
      {
        type: 'p',
        content:
          'WuXing ist das fundamentale Konzept, das allem in der chinesischen Metaphysik zugrunde liegt. Es beschreibt, wie Energie (Qi) fließt und sich wandelt. Es geht nicht um statische Substanzen, sondern um Dynamiken und Prozesse: Holz nährt Feuer, Feuer erzeugt Erde, Erde trägt Metall, Metall formt Wasser, Wasser nährt Holz. Dieser ewige Kreislauf spiegelt sich in deinem Geburtsmoment wider.',
      },
      {
        type: 'h2',
        content: '3. Die 12 Tiere (Erdzweige)',
      },
      {
        type: 'p',
        content:
          'Die 12 Tiere des chinesischen Tierkreises sind viel mehr als nur Jahreszeichen. Sie sind die Erdzweige im BaZi-Chart und repräsentieren die innere Dynamik, verborgene Talente, emotionale Muster und deine Beziehung zur Umwelt (Familie, Gesellschaft, Partner, Kinder). Jedes Tier ist einem bestimmten Element und einer Yin/Yang-Polarität zugeordnet.',
      },
      {
        type: 'h2',
        content: '4. Die 10 Himmelsstämme: Die sichtbare Oberfläche',
      },
      {
        type: 'p',
        content:
          'Die Himmelsstämme repräsentieren die äußere, bewusste Seite deiner Persönlichkeit – wie du denkst, Entscheidungen triffst, kommunizierst und auf andere wirkst. Sie sind die Kombination aus den 5 Elementen und ihrer Yin/Yang-Form.',
      },
      {
        type: 'h2',
        content: '5. Der Tagesmeister: Dein kosmisches „Ich"',
      },
      {
        type: 'highlight',
        content:
          'Dies ist der wichtigste Punkt in deinem gesamten BaZi-Chart! Der Himmelsstamm deiner Tagessäule ist dein Tagesmeister (Day Master). Er repräsentiert dich selbst in deiner reinsten Essenz – dein Kern-Ich, deine grundlegendste Natur und Identität.',
      },
      {
        type: 'p',
        content:
          'Alle anderen Elemente und Tiere in deinem Chart werden in Bezug auf deinen Tagesmeister analysiert. Ist er stark oder schwach? Welche Elemente nähren ihn, welche kontrollieren ihn? Die Antwort darauf zeigt, welche Lebensbereiche, Berufe, Farben oder Umgebungen dir Kraft geben und welche dich fordern. Deinen Tagesmeister zu kennen, ist der erste Schritt zur Selbsterkenntnis und bewussten Lebensgestaltung.',
      },
      {
        type: 'h2',
        content: 'BaZi: Mehr als nur ein Horoskop',
      },
      {
        type: 'p',
        content:
          'In der westlichen Welt wird „Chinesische Astrologie" oft synonym mit dem Tierkreiszeichen des Geburtsjahres verwendet. Doch das ist nur die Spitze des Eisbergs. Das eigentliche, tiefgründige System zur Analyse des menschlichen Schicksals und Potenzials ist die BaZi Schicksalsanalyse — die Vier Säulen des Schicksals.',
      },
      {
        type: 'p',
        content:
          'Während sich die populäre Astrologie auf das Jahr beschränkt, berücksichtigt BaZi den exakten Moment deiner Geburt: Jahr, Monat, Tag und Stunde. Aus diesen vier Datenpunkten wird ein komplexes Chart aus acht Zeichen erstellt, das ein präzises energetisches Profil deiner Persönlichkeit, deiner Talente, Stärken, Schwächen und deines Lebenswegs liefert.',
      },
      {
        type: 'h3',
        content: 'Welche Potenziale liegen in dir?',
      },
      {
        type: 'list',
        content: 'BaZi offenbart auf drei Ebenen:',
        items: [
          'Wer bist du wirklich? — Der Tagesmeister im BaZi ist dein Kern-Ich. Seine Stärke und Beziehung zu den anderen Elementen definiert deine grundlegendste Natur.',
          'Welche Potenziale liegen in dir? — Die Kombination der Fünf Elemente (WuXing) und der 12 Tiere offenbart verborgene Talente, emotionale Muster und wie du mit deiner Umwelt interagierst.',
          'Wann sind gute Zeiten für Veränderungen? — Durch die Analyse der Glückszyklen (10-Jahres-Zyklen) und Jahresenergien erkennst du, wann du Rückenwind für Karriere, Partnerschaft oder Gesundheit hast.',
        ],
      },
      {
        type: 'quote',
        content:
          'Vermeide die Vereinfachung der populären Astrologie. Tauche ein in die Tiefe deiner kosmischen DNA mit einer fundierten BaZi Schicksalsanalyse.',
      },
    ],
  },
  {
    slug: 'wu-xing-fuenf-wandlungsphasen',
    category: 'Chinesische Metaphysik',
    categoryEn: 'Chinese Metaphysics',
    readingTime: 10,
    title: 'Die Fünf Wandlungsphasen (Wu Xing)',
    subtitle: 'Holz, Feuer, Erde, Metall, Wasser — dynamische Energievektoren statt statischer Elemente',
    excerpt:
      'Das Konzept der Wu Xing (五行), im Westen oft als „Fünf Elemente" übersetzt, bildet das fundamentale Gerüst der chinesischen Metaphysik. Es handelt sich nicht um statische Materialien, sondern um dynamische Wandlungsphasen, die sich in einem ständigen Zustand der Metamorphose befinden.',
    image: '/images/artikel/bazi-wuxing.jpg',
    imageAlt: 'Die Fünf Wandlungsphasen — Holz, Feuer, Erde, Metall, Wasser im kosmischen Kreislauf',
    imageCredit: 'Bazodiac',
    imageCreditUrl: 'https://bazodiac.space',
    keywords: 'Wu Xing, Fünf Elemente, Wandlungsphasen, Holz, Feuer, Erde, Metall, Wasser, Qi, Hervorbringungszyklus, Kontrollzyklus, chinesische Metaphysik, BaZi, Persönlichkeitsanalyse',
    ctaText: 'Deine Wu-Xing-Balance entdecken',
    ctaHref: '/wu-xing',
    sections: [
      {
        type: 'p',
        content:
          'Das Konzept der Wu Xing (五行), im Westen oft als „Fünf Elemente" übersetzt, bildet das fundamentale Gerüst der chinesischen Metaphysik. In der professionellen Praxis wird betont, dass es sich hierbei nicht um statische Materialien handelt, sondern um dynamische Wandlungsphasen oder energetische Vektoren, die sich in einem ständigen Zustand der Metamorphose befinden. Das chinesische Wort Xing bedeutet wörtlich „Gehen" oder „Durchgang" und beschreibt den Fluss und Wandel von Energie (Qi).',
      },
      {
        type: 'h2',
        content: '1. Die fünf Wandlungsphasen und ihre Qualitäten',
      },
      {
        type: 'p',
        content: 'Jede Phase repräsentiert spezifische Charakterzüge und energetische Zustände:',
      },
      {
        type: 'h3',
        content: 'Holz (Mù)',
      },
      {
        type: 'p',
        content:
          'Steht für Wachstum, Kreativität, Vision und Flexibilität. Es ist die Energie der Expansion — wie ein junger Baum, der sich unaufhaltsam dem Licht entgegenstreckt.',
      },
      {
        type: 'h3',
        content: 'Feuer (Huǒ)',
      },
      {
        type: 'p',
        content:
          'Repräsentiert Leidenschaft, Dynamik, Transformation und Charisma. Es ist die Phase der maximalen Aktivität — strahlend, anziehend und transformierend.',
      },
      {
        type: 'h3',
        content: 'Erde (Tǔ)',
      },
      {
        type: 'p',
        content:
          'Symbolisiert Stabilität, Fürsorge, Geduld und Vermittlung. Sie dient als nährender Boden und Zentrum des Ausgleichs — der ruhende Pol im ewigen Wandel.',
      },
      {
        type: 'h3',
        content: 'Metall (Jīn)',
      },
      {
        type: 'p',
        content:
          'Steht für Präzision, Disziplin, Klarheit und Entschlossenheit. Es ist die Energie der Verdichtung und Struktur — scharf, klar und fokussiert.',
      },
      {
        type: 'h3',
        content: 'Wasser (Shuǐ)',
      },
      {
        type: 'p',
        content:
          'Repräsentiert Intuition, Anpassung, Tiefe und Weisheit. Es steht für das Fließen und die Ruhe — tiefgründig, anpassungsfähig und weise.',
      },
      {
        type: 'h2',
        content: '2. Die Dynamik der Interaktion: Die zwei Hauptzyklen',
      },
      {
        type: 'p',
        content:
          'Die Phasen existieren nicht isoliert, sondern interagieren über zwei fundamentale Mechanismen miteinander:',
      },
      {
        type: 'h3',
        content: 'Der Hervorbringungszyklus (Sheng): Das Prinzip der Nährung',
      },
      {
        type: 'p',
        content:
          'Dieser harmonische Fluss beschreibt, wie ein Element das nächste stärkt und unterstützt. In der Tradition wird dies mit dem Bild „Die Mutter nährt das Kind" beschrieben.',
      },
      {
        type: 'list',
        content: 'Der Kreislauf der Nährung:',
        items: [
          'Wasser lässt Holz wachsen (Regen nährt den Baum)',
          'Holz dient als Brennstoff für das Feuer',
          'Feuer hinterlässt Asche, die zu Erde wird',
          'In der Erde entstehen Erze (Metall)',
          'An Metall kondensiert Feuchtigkeit zu Wasser',
        ],
      },
      {
        type: 'h3',
        content: 'Der Kontrollzyklus (Ke): Das Prinzip der Regulation',
      },
      {
        type: 'p',
        content:
          'Dieser Zyklus ist notwendig, um Übermaß zu verhindern und Form zu geben. Er fungiert als Korrektiv und wird metaphorisch als „Der Großvater zügelt den Enkel" bezeichnet.',
      },
      {
        type: 'list',
        content: 'Der Kreislauf der Kontrolle:',
        items: [
          'Wasser löscht Feuer (Kühlung)',
          'Feuer schmilzt Metall (Formbarkeit)',
          'Metall schneidet Holz (Beschneiden von Wildwuchs)',
          'Holz durchdringt die Erde (Wurzeln lockern den Boden)',
          'Erde dämmt das Wasser (Kontrolle des Flusses)',
        ],
      },
      {
        type: 'h2',
        content: '3. Bedeutung für die Persönlichkeitsanalyse',
      },
      {
        type: 'p',
        content:
          'In Systemen wie BaZi wird die individuelle Balance dieser Elemente zum Zeitpunkt der Geburt analysiert. Das Ziel ist es, ein energetisches Gleichgewicht herzustellen.',
      },
      {
        type: 'list',
        content: 'Typische Ungleichgewichte:',
        items: [
          'Zu viel Nährung kann zu Stagnation oder Trägheit („Verwöhnung") führen',
          'Zu viel Kontrolle erzeugt Druck, Stress und Instabilität',
          'Spannungen entstehen oft, wenn ein dominantes Element nicht ausreichend reguliert wird (z. B. führt starkes Metall ohne kontrollierendes Feuer zu emotionaler Kälte)',
        ],
      },
      {
        type: 'highlight',
        content:
          'Innerhalb der Bazodiac-App fließt die WuXing-Verteilung mit einer Gewichtung von 20 % in die Masterformel deines Signaturs ein. So wird sichtbar, welche energetischen Phasen in dir besonders stark resonieren und wo das tägliche „Energiewetter" dich besonders trifft.',
      },
    ],
  },
  {
    slug: 'faq-bazi-wuxing',
    category: 'Chinesische Metaphysik',
    categoryEn: 'Chinese Metaphysics',
    readingTime: 6,
    title: 'FAQ: BaZi, WuXing und dein kosmischer Fingerabdruck',
    subtitle: 'Die wichtigsten Fragen und Antworten zu deiner energetischen Grundausstattung',
    excerpt:
      'Was ist BaZi? Wie unterscheidet es sich von der westlichen Astrologie? Und warum ist die Geburtsstunde so wichtig? Hier findest du Antworten auf die häufigsten Fragen rund um deine kosmische DNA.',
    image: '/images/artikel/bazi-wuxing.jpg',
    imageAlt: 'FAQ — BaZi und WuXing Fragen und Antworten zur chinesischen Metaphysik',
    imageCredit: 'Bazodiac',
    imageCreditUrl: 'https://bazodiac.space',
    keywords: 'BaZi FAQ, WuXing Fragen, Vier Säulen des Schicksals, Tagesmeister, Signatur, chinesische Astrologie Unterschied, Geburtsstunde BaZi, Wahrsagerei, Selbsterkenntnis',
    ctaText: 'Dein kosmisches Profil entdecken',
    ctaHref: '/signatur',
    sections: [
      {
        type: 'h3',
        content: '1. Was ist BaZi eigentlich?',
      },
      {
        type: 'p',
        content:
          'BaZi (八字), auch bekannt als die „Vier Säulen des Schicksals", ist ein jahrtausendealtes chinesisches System zur Persönlichkeitsanalyse. Statt nur dein Geburtsjahr zu betrachten, nutzt BaZi dein exaktes Geburtsdatum und die Uhrzeit, um eine Matrix aus acht Zeichen zu erstellen. Diese Zeichen beschreiben deine energetische Grundausstattung – sozusagen deine „kosmische DNA".',
      },
      {
        type: 'h3',
        content: '2. Wie unterscheidet sich BaZi von der westlichen Astrologie?',
      },
      {
        type: 'p',
        content:
          'Während die westliche Astrologie auf der geometrischen Position der Planeten am Himmel basiert, ist BaZi ein energetisch-klimatologisches Modell. Es nutzt das solare Jahr und die 24 Solartermine, um die „Temperatur" und Qualität der Energie (Qi) zu messen, die zum Zeitpunkt deiner Geburt herrschte. In Bazodiac werden beide Welten im Signatur vereint, um ein vollständiges Bild zu ergeben.',
      },
      {
        type: 'h3',
        content: '3. Was bedeuten die „Vier Säulen"?',
      },
      {
        type: 'p',
        content: 'Dein Chart besteht aus vier vertikalen Einheiten, die jeweils einen Lebensaspekt repräsentieren:',
      },
      {
        type: 'list',
        content: '',
        items: [
          'Jahr: Dein äußeres Auftreten und deine Rolle in der Gesellschaft',
          'Monat: Deine Karriere, Ambitionen und die mittlere Lebensphase',
          'Tag: Dein inneres Selbst – hier findet sich der wichtige Tagesmeister',
          'Stunde: Dein verborgenes Selbst, Träume und das Unterbewusstsein',
        ],
      },
      {
        type: 'h3',
        content: '4. Wer oder was ist der „Tagesmeister"?',
      },
      {
        type: 'p',
        content:
          'Der Tagesmeister ist das Herzstück deines BaZi-Charts. Er wird durch das Element bestimmt, das an deinem Geburtstag im „Himmelsstamm" steht. Er repräsentiert dich selbst in deiner reinsten Form. Alle anderen Zeichen im Chart werden in Bezug auf den Tagesmeister gedeutet: Nähren sie dich, fordern sie dich heraus oder kontrollieren sie dich?',
      },
      {
        type: 'h3',
        content: '5. Was hat WuXing mit meinem Charakter zu tun?',
      },
      {
        type: 'p',
        content:
          'WuXing beschreibt die Fünf Wandlungsphasen (Holz, Feuer, Erde, Metall, Wasser). In der BaZi-Analyse schauen wir uns die Balance dieser Elemente an. Ein Übermaß an Feuer kann beispielsweise für große Leidenschaft, aber auch für Impulsivität stehen, während ein starkes Metall-Element Präzision und Disziplin fördert. Das Ziel ist es, Spannungen zu erkennen und einen Ausgleich zu finden.',
      },
      {
        type: 'h3',
        content: '6. Wie kombiniert Bazodiac BaZi mit meinem westlichen Horoskop?',
      },
      {
        type: 'highlight',
        content:
          'Das ist die Besonderheit von Bazodiac: Die App nutzt eine Masterformel, die deine BaZi-Daten (30%), dein westliches Sternzeichen (30%), die WuXing-Elemente (20%) und deine Ergebnisse aus den Persönlichkeits-Quizzes (20%) zu einem einzigen Signal verschmilzt. Das Ergebnis ist der Signatur – eine lebendige Visualisierung deiner Identität, die sich mit den täglichen Planetentransiten verändert.',
      },
      {
        type: 'h3',
        content: '7. Warum ist meine Geburtsstunde so wichtig?',
      },
      {
        type: 'p',
        content:
          'Ohne die Geburtsstunde fehlt die vierte Säule (die Stundensäule). Diese Säule liefert wertvolle Informationen über deine tiefsten Wünsche und dein verborgenes Potenzial. Während das BaZi-Chart auch ohne Stunde zu etwa 75% interpretierbar bleibt, ist die exakte Zeit für eine vollständige Analyse und die Berechnung bestimmter Sektoren im Signatur unerlässlich.',
      },
      {
        type: 'h3',
        content: '8. Ist BaZi Wahrsagerei oder Schicksalsglaube?',
      },
      {
        type: 'p',
        content:
          'Nein. Bazodiac versteht BaZi als ein Instrument zur Selbsterkenntnis. Es zeigt dir deine Resonanzflächen auf – also die Bereiche, in denen du besonders sensibel oder stark auf äußere Einflüsse (wie das „Energiewetter") reagierst. Es geht nicht darum, was passieren muss, sondern darum, wie du deine Anlagen optimal nutzt, um dein Leben selbstbestimmt zu gestalten.',
      },
      {
        type: 'quote',
        content:
          'Möchtest du mehr über die einzelnen Tiere oder die Berechnungslogik erfahren? Lies unseren ausführlichen Artikel über die Fünf Wandlungsphasen oder entdecke dein persönliches BaZi-Profil im Signatur.',
      },
    ],
  },
  {
    slug: 'chinesische-astrologie-vs-bazi',
    category: 'Chinesische Metaphysik',
    categoryEn: 'Chinese Metaphysics',
    readingTime: 8,
    title: 'Chinesische Astrologie vs. BaZi Schicksalsanalyse',
    subtitle: 'Ein tiefer Einblick in deine kosmische DNA — warum „Ich bin ein Tiger" nur die Oberfläche ist',
    excerpt:
      'In der westlichen Welt wird „Chinesische Astrologie" oft synonym mit dem Tierkreiszeichen des Geburtsjahres verwendet. Doch das ist nur die Spitze des Eisbergs. Das eigentliche System zur Analyse des menschlichen Potenzials ist die BaZi Schicksalsanalyse.',
    image: '/images/artikel/bazi-wuxing.jpg',
    imageAlt: 'BaZi Schicksalsanalyse — die Vier Säulen des Schicksals und deine kosmische DNA',
    imageCredit: 'Bazodiac',
    imageCreditUrl: 'https://bazodiac.space',
    keywords: 'chinesische Astrologie, BaZi Schicksalsanalyse, Vier Säulen des Schicksals, Tagesmeister, kosmische DNA, Tierkreiszeichen, Glückszyklen, energetisches Profil, WuXing, Geburtsdatum',
    ctaText: 'Deine kosmische DNA entschlüsseln',
    ctaHref: '/signatur',
    sections: [
      {
        type: 'p',
        content:
          'In der westlichen Welt wird der Begriff „Chinesische Astrologie" oft synonym mit dem Tierkreiszeichen des Geburtsjahres verwendet. Man sagt: „Ich bin ein Tiger" oder „Ich bin ein Drache". Doch das ist nur die Spitze des Eisbergs. Das eigentliche, tiefgründige System zur Analyse des menschlichen Schicksals und Potenzials ist die BaZi Schicksalsanalyse, auch bekannt als die Vier Säulen des Schicksals.',
      },
      {
        type: 'p',
        content:
          'Während sich die populäre Astrologie auf das Jahr beschränkt, berücksichtigt BaZi den exakten Moment deiner Geburt: Jahr, Monat, Tag und Stunde. Aus diesen vier Datenpunkten wird ein komplexes Chart aus acht Zeichen (Himmelsstämme und Erdzweige) erstellt, das ein präzises energetisches Profil deiner Persönlichkeit, deiner Talente, Stärken, Schwächen und deines Lebenswegs liefert.',
      },
      {
        type: 'h2',
        content: 'BaZi: Mehr als nur ein Horoskop',
      },
      {
        type: 'p',
        content:
          'BaZi ist kein System zur Wahrsagerei, das feste Zukunftsprognosen macht. Es ist ein Werkzeug zur Selbsterkenntnis und bewussten Lebensgestaltung. Es zeigt die energetischen Rhythmen und Zyklen deines Lebens auf.',
      },
      {
        type: 'h3',
        content: 'Wer bist du wirklich?',
      },
      {
        type: 'p',
        content:
          'Der Tagesmeister im BaZi ist dein Kern-Ich. Seine Stärke und Beziehung zu den anderen Elementen in deinem Chart definiert deine grundlegendste Natur.',
      },
      {
        type: 'h3',
        content: 'Welche Potenziale liegen in dir?',
      },
      {
        type: 'p',
        content:
          'Die Kombination der Fünf Elemente (WuXing: Holz, Feuer, Erde, Metall, Wasser) und der 12 Tiere in deinem Chart offenbart verborgene Talente, emotionale Muster und wie du mit deiner Umwelt interagierst.',
      },
      {
        type: 'h3',
        content: 'Wann sind gute Zeiten für Veränderungen?',
      },
      {
        type: 'p',
        content:
          'Durch die Analyse der Glückszyklen (10-Jahres-Zyklen) und Jahresenergien kannst du erkennen, wann du Rückenwind für Karriere, Partnerschaft oder Gesundheit hast und wann Vorsicht geboten ist.',
      },
      {
        type: 'h2',
        content: 'Warum eine professionelle BaZi-Analyse wichtig ist',
      },
      {
        type: 'p',
        content:
          'Ein einfacher Online-Rechner kann dir die Zeichen deines Charts nennen, aber nicht deren tiefe Bedeutung und Wechselwirkungen interpretieren. Eine professionelle Analyse hilft dir:',
      },
      {
        type: 'list',
        content: '',
        items: [
          'Deine Berufung zu finden: Welche Berufe entsprechen deinen energetischen Stärken?',
          'Beziehungen besser zu verstehen: Wie passen du und dein Partner, deine Familie oder Kollegen energetisch zusammen?',
          'Die Gesundheit zu fördern: Welche energetischen Ungleichgewichte könnten sich physisch manifestieren?',
        ],
      },
      {
        type: 'quote',
        content:
          'Vermeide die Vereinfachung der populären Astrologie. Tauche ein in die Tiefe deiner kosmischen DNA mit einer fundierten BaZi Schicksalsanalyse.',
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

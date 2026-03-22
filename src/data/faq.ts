export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqSection {
  title: string;
  items: FaqItem[];
}

export const FAQ_SECTIONS: FaqSection[] = [
  {
    title: 'BaZi, WuXing und dein kosmischer Fingerabdruck',
    items: [
      {
        question: 'Was ist BaZi eigentlich?',
        answer: 'BaZi (八字), auch bekannt als die „Vier Säulen des Schicksals", ist ein jahrtausendealtes chinesisches System zur Persönlichkeitsanalyse. Statt nur dein Geburtsjahr zu betrachten, nutzt BaZi dein exaktes Geburtsdatum und die Uhrzeit, um eine Matrix aus acht Zeichen zu erstellen. Diese Zeichen beschreiben deine energetische Grundausstattung – sozusagen deine „kosmische DNA".',
      },
      {
        question: 'Wie unterscheidet sich BaZi von der westlichen Astrologie?',
        answer: 'Während die westliche Astrologie auf der geometrischen Position der Planeten am Himmel basiert, ist BaZi ein energetisch-klimatologisches Modell. Es nutzt das solare Jahr und die 24 Solartermine, um die „Temperatur" und Qualität der Energie (Qi) zu messen, die zum Zeitpunkt deiner Geburt herrschte. In Bazodiac werden beide Welten im Fusion Ring vereint, um ein vollständiges Bild zu ergeben.',
      },
      {
        question: 'Was bedeuten die „Vier Säulen"?',
        answer: 'Dein Chart besteht aus vier vertikalen Einheiten, die jeweils einen Lebensaspekt repräsentieren:\n\nJahr: Dein äußeres Auftreten und deine Rolle in der Gesellschaft.\nMonat: Deine Karriere, Ambitionen und die mittlere Lebensphase.\nTag: Dein inneres Selbst – hier findet sich der wichtige Tagesmeister.\nStunde: Dein verborgenes Selbst, Träume und das Unterbewusstsein.',
      },
      {
        question: 'Wer oder was ist der „Tagesmeister"?',
        answer: 'Der Tagesmeister ist das Herzstück deines BaZi-Charts. Er wird durch das Element bestimmt, das an deinem Geburtstag im „Himmelsstamm" steht. Er repräsentiert dich selbst in deiner reinsten Form. Alle anderen Zeichen im Chart werden in Bezug auf den Tagesmeister gedeutet: Nähren sie dich, fordern sie dich heraus oder kontrollieren sie dich?',
      },
      {
        question: 'Was hat WuXing mit meinem Charakter zu tun?',
        answer: 'WuXing beschreibt die Fünf Wandlungsphasen (Holz, Feuer, Erde, Metall, Wasser). In der BaZi-Analyse schauen wir uns die Balance dieser Elemente an. Ein Übermaß an Feuer kann beispielsweise für große Leidenschaft, aber auch für Impulsivität stehen, während ein starkes Metall-Element Präzision und Disziplin fördert. Das Ziel ist es, Spannungen zu erkennen und einen Ausgleich zu finden.',
      },
      {
        question: 'Wie kombiniert Bazodiac BaZi mit meinem westlichen Horoskop?',
        answer: 'Das ist die Besonderheit von Bazodiac: Die App nutzt eine Masterformel, die deine BaZi-Daten (30%), dein westliches Sternzeichen (30%), die WuXing-Elemente (20%) und deine Ergebnisse aus den Persönlichkeits-Quizzes (20%) zu einem einzigen Signal verschmilzt. Das Ergebnis ist der Fusion Ring – eine lebendige Visualisierung deiner Identität, die sich mit den täglichen Planetentransiten verändert.',
      },
      {
        question: 'Warum ist meine Geburtsstunde so wichtig?',
        answer: 'Ohne die Geburtsstunde fehlt die vierte Säule (die Stundensäule). Diese Säule liefert wertvolle Informationen über deine tiefsten Wünsche und dein verborgenes Potenzial. Während das BaZi-Chart auch ohne Stunde zu etwa 75% interpretierbar bleibt, ist die exakte Zeit für eine vollständige Analyse und die Berechnung bestimmter Sektoren im Fusion Ring unerlässlich.',
      },
      {
        question: 'Ist BaZi Wahrsagerei oder Schicksalsglaube?',
        answer: 'Nein. Bazodiac versteht BaZi als ein Instrument zur Selbsterkenntnis. Es zeigt dir deine Resonanzflächen auf – also die Bereiche, in denen du besonders sensibel oder stark auf äußere Einflüsse reagierst. Es geht nicht darum, was passieren muss, sondern darum, wie du deine Anlagen optimal nutzt, um dein Leben selbstbestimmt zu gestalten.',
      },
    ],
  },
  {
    title: 'Die Fünf Wandlungsphasen (WuXing)',
    items: [
      {
        question: 'Was sind die fünf Wandlungsphasen?',
        answer: 'Das Konzept der Wu Xing (五行), im Westen oft als „Fünf Elemente" übersetzt, bildet das fundamentale Gerüst der chinesischen Metaphysik. Es handelt sich nicht um statische Materialien, sondern um dynamische Wandlungsphasen oder energetische Vektoren, die sich in einem ständigen Zustand der Metamorphose befinden.',
      },
      {
        question: 'Welche Qualitäten haben die einzelnen Phasen?',
        answer: 'Holz (Mù): Wachstum, Kreativität, Vision und Flexibilität – die Energie der Expansion.\nFeuer (Huǒ): Leidenschaft, Dynamik, Transformation und Charisma – die Phase der maximalen Aktivität.\nErde (Tǔ): Stabilität, Fürsorge, Geduld und Vermittlung – der nährende Boden und Zentrum des Ausgleichs.\nMetall (Jīn): Präzision, Disziplin, Klarheit und Entschlossenheit – die Energie der Verdichtung und Struktur.\nWasser (Shuǐ): Intuition, Anpassung, Tiefe und Weisheit – das Fließen und die Ruhe.',
      },
      {
        question: 'Wie interagieren die Phasen miteinander?',
        answer: 'Die Phasen existieren nicht isoliert, sondern interagieren über zwei fundamentale Mechanismen: Den Hervorbringungszyklus (Sheng), der beschreibt wie ein Element das nächste stärkt und unterstützt (z.B. Wasser lässt Holz wachsen), und den Kontrollzyklus (Ke), der beschreibt wie ein Element ein anderes in Schach hält (z.B. Wasser löscht Feuer).',
      },
    ],
  },
  {
    title: 'Dein BaZi-Chart verstehen',
    items: [
      {
        question: 'Was sind die 12 Tiere im BaZi?',
        answer: 'Die 12 Tiere des chinesischen Tierkreises sind viel mehr als nur Jahreszeichen. Sie sind die Erdzweige im BaZi-Chart und repräsentieren die innere Dynamik, verborgene Talente, emotionale Muster und deine Beziehung zur Umwelt. Jedes Tier ist einem bestimmten Element und einer Yin/Yang-Polarität zugeordnet.',
      },
      {
        question: 'Was sind die 10 Himmelsstämme?',
        answer: 'Die Himmelsstämme repräsentieren die äußere, bewusste Seite deiner Persönlichkeit – wie du denkst, Entscheidungen triffst, kommunizierst und auf andere wirkst. Sie sind die Kombination aus den 5 Elementen und ihrer Yin/Yang-Form.',
      },
      {
        question: 'Was ist der Tagesmeister und warum ist er so wichtig?',
        answer: 'Der Himmelsstamm deiner Tagessäule ist dein Tagesmeister (Day Master). Er repräsentiert dich selbst in deiner reinsten Essenz – dein Kern-Ich, deine grundlegendste Natur und Identität. Alle anderen Elemente und Tiere in deinem Chart werden in Bezug auf deinen Tagesmeister analysiert. Deinen Tagesmeister zu kennen ist der erste Schritt zur Selbsterkenntnis und bewussten Lebensgestaltung.',
      },
    ],
  },
];

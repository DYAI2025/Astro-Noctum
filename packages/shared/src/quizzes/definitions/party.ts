import type { QuizDefinition } from '../schema';

export const partyQuiz: QuizDefinition = {
  id: 'quiz.party_need.v1',
  title: 'Your Party Need',
  titleDe: 'Dein Party-Bed\u00fcrfnis',
  subtitle: 'How much party is really in you?',
  subtitleDe: 'Wie viel Feier steckt wirklich in dir?',
  emoji: '\ud83c\udf89',
  accentColor: '#D4AF37',
  scoringModel: 'profile-driven',
  questions: [
    {
      id: 'q1',
      text: 'Freitagabend, 19:30 Uhr. Dein Handy vibriert: \u201eHey, wir sind spontan am Fluss \u2013 kommst du?\u201c Du hattest eigentlich Netflix eingeplant.',
      options: [
        { id: 'q1_a', text: '\u201eBin schon im Pyjama \u2013 n\u00e4chstes Mal!\u201c \ud83d\udecb\ufe0f', profileId: 'cozy_guardian' },
        { id: 'q1_b', text: '\u201eWer kommt noch? Und wie laut wird\u2019s?\u201c \ud83e\udd14', profileId: 'planner' },
        { id: 'q1_c', text: '\u201eGib mir 10 Minuten!\u201c \ud83c\udfc3', profileId: 'salon_connaisseur' },
        { id: 'q1_d', text: '\u201eIch bring die Boxen mit!\u201c \ud83d\udd0a', profileId: 'night_surfer' },
      ],
    },
    {
      id: 'q2',
      text: 'Dein perfekter Samstag sieht so aus: Keine Verpflichtungen. 24 Stunden f\u00fcr dich.',
      options: [
        { id: 'q2_a', text: 'Buch, Tee, vielleicht ein langer Spaziergang allein \ud83c\udf3f', profileId: 'cozy_guardian' },
        { id: 'q2_b', text: 'Brunch mit 2-3 engen Freunden, dann chillen \ud83e\udd50', profileId: 'salon_connaisseur' },
        { id: 'q2_c', text: 'Tags\u00fcber Flohmarkt, abends Hausparty \ud83c\udf88', profileId: 'planner' },
        { id: 'q2_d', text: 'Dayparty \u2192 Dinner \u2192 Club bis Sunrise \ud83d\udcab', profileId: 'night_surfer' },
      ],
    },
    {
      id: 'q3',
      text: 'Die Einladung landet in deinem Postfach: \u201eGro\u00dfe Geburtstagsparty \u2013 80 Leute, DJ, Open Bar.\u201c',
      options: [
        { id: 'q3_a', text: 'Innerliches \u201eUff\u201c \u2013 klingt anstrengend \ud83d\ude05', profileId: 'cozy_guardian' },
        { id: 'q3_b', text: '\u201eKomm ich kurz vorbei, sage Happy Birthday\u201c \u23f1\ufe0f', profileId: 'planner' },
        { id: 'q3_c', text: '\u201eIch freu mich \u2013 aber Fluchtplan hab ich\u201c \ud83d\udeaa', profileId: 'salon_connaisseur' },
        { id: 'q3_d', text: '\u201eJA! Wann? Wo? Was zieh ich an?!\u201c \ud83c\udf89', profileId: 'night_surfer' },
      ],
    },
    {
      id: 'q4',
      text: 'Du kommst von einer 3-Stunden-Party nach Hause: Es ist 23 Uhr. Wie f\u00fchlst du dich?',
      options: [
        { id: 'q4_a', text: 'Leer. Brauch mindestens 2 Tage Social-Detox \ud83d\ude2e\u200d\ud83d\udca8', profileId: 'cozy_guardian' },
        { id: 'q4_b', text: 'Zufrieden, aber genug f\u00fcr heute \u2713', profileId: 'salon_connaisseur' },
        { id: 'q4_c', text: 'Energetisiert \u2013 war cool, aber jetzt Ruhe \ud83d\ude0c', profileId: 'planner' },
        { id: 'q4_d', text: 'Hyped! Warte, wo geht\u2019s weiter hin? \ud83d\udd25', profileId: 'night_surfer' },
      ],
    },
    {
      id: 'q5',
      text: 'Die Lautst\u00e4rke-Frage: Deine ideale Abend-Atmosph\u00e4re klingt wie...',
      options: [
        { id: 'q5_a', text: 'Stille oder sanfter Regen auf dem Fensterbrett \ud83c\udf27\ufe0f', profileId: 'cozy_guardian' },
        { id: 'q5_b', text: 'Gespr\u00e4che \u00fcber ged\u00e4mpfter Hintergrundmusik \ud83c\udfb5', profileId: 'salon_connaisseur' },
        { id: 'q5_c', text: 'Lebhafter Mix \u2013 Gel\u00e4chter, Musik, Gl\u00e4serklirren \ud83e\udd42', profileId: 'planner' },
        { id: 'q5_d', text: 'Bass, der den Brustkorb vibrieren l\u00e4sst \ud83c\udfa7', profileId: 'night_surfer' },
      ],
    },
    {
      id: 'q6',
      text: 'Die Wahrheits-Check-Frage: Wenn du ehrlich bist \u2013 spontane Einladungen machen dich...',
      options: [
        { id: 'q6_a', text: '...eher gestresst als begeistert \ud83d\ude2c', profileId: 'cozy_guardian' },
        { id: 'q6_b', text: '...kommt drauf an wer fragt und was geplant ist \ud83e\uddd0', profileId: 'planner' },
        { id: 'q6_c', text: '...oft gl\u00fccklicher als genervt \ud83d\ude0a', profileId: 'salon_connaisseur' },
        { id: 'q6_d', text: '...immer ein kleiner Dopamin-Kick! \ud83d\ude80', profileId: 'night_surfer' },
      ],
    },
  ],
  profiles: [
    {
      id: 'cozy_guardian',
      title: 'Der Cozy-H\u00fcter',
      emoji: '\ud83d\udecb\ufe0f',
      color: '#5B4A3F',
      description: 'Du hast verstanden, was viele erst mit 40 kapieren: Das beste Party-Outfit ist ein guter Pyjama. W\u00e4hrend andere FOMO sp\u00fcren, kennst du die Magie eines Abends ohne Zeitdruck, ohne Smalltalk, ohne das Gef\u00fchl, irgendwo sein zu m\u00fcssen.',
    },
    {
      id: 'salon_connaisseur',
      title: 'Der Salon-Connaisseur',
      emoji: '\ud83c\udf77',
      color: '#8B0000',
      description: 'Du suchst Intensit\u00e4t, aber in der richtigen Dosierung. Eine Flasche Wein, drei Freunde und ein Gespr\u00e4ch bis 3 Uhr nachts \u2013 DAS ist dein Konzert. Du brauchst Tiefe, nicht Breite.',
    },
    {
      id: 'planner',
      title: 'Der Planer',
      emoji: '\ud83d\udcc5',
      color: '#2E86AB',
      description: 'Du bist kein Partymuffel \u2013 du bist ein Event-Stratege. Du liebst soziale Erlebnisse, aber zu deinen Bedingungen: geplant, kalkulierbar, mit klarem Anfang und Ende.',
    },
    {
      id: 'night_surfer',
      title: 'Der Nacht-Surfer',
      emoji: '\ud83c\udf0a',
      color: '#FF6B35',
      description: 'W\u00e4hrend andere Batterien aufladen, l\u00e4dst du dich an Menschen auf. Jede Einladung ist eine Chance, jede Party ein potenzielles Abenteuer. Du sammelst Erlebnisse wie andere B\u00fccher.',
    },
  ],
  resultMapping: {
    markerId: 'quiz.party_need.v1',
    profileToTraits: {},
  },
};

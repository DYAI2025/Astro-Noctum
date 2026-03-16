import type { QuizDefinition } from '../schema';

export const careerDnaQuiz: QuizDefinition = {
  id: 'quiz.career_dna.v2',
  title: 'Career DNA',
  titleDe: 'Karriere DNA',
  subtitle: 'Decode your professional success code.',
  subtitleDe: 'Entschl\u00fcssele deinen beruflichen Erfolgs-Code.',
  emoji: '\uD83E\uDDEC',
  accentColor: '#D4AF37',
  scoringModel: 'categorical',
  dimensions: ['visionaer', 'architekt', 'katalysator', 'navigator', 'mentor', 'waechter'],

  questions: [
    {
      id: 'cd1',
      context: 'Montagmorgen, 09:00 Uhr. Dein idealer Start?',
      text: 'Wie legst du los?',
      options: [
        { id: 'cd1a', text: 'Team-Call um alle zu motivieren', scores: { katalysator: 5, mentor: 3 } },
        { id: 'cd1b', text: 'Deep Work an einem komplexen Problem', scores: { architekt: 5, navigator: 3 } },
        { id: 'cd1c', text: 'Brainstorming f\u00fcr neue Ideen', scores: { visionaer: 5, katalysator: 3 } },
        { id: 'cd1d', text: 'Emails checken und Woche strukturieren', scores: { waechter: 5, navigator: 2 } },
      ],
    },
    {
      id: 'cd2',
      context: 'Ein Projekt droht zu scheitern...',
      text: 'Deine Rettungsma\u00dfnahme?',
      options: [
        { id: 'cd2a', text: 'Ich analysiere die Fehlerursache', scores: { navigator: 5, architekt: 3 } },
        { id: 'cd2b', text: 'Ich improvisiere eine v\u00f6llig neue L\u00f6sung', scores: { visionaer: 5, katalysator: 2 } },
        { id: 'cd2c', text: 'Ich baue das Team wieder auf', scores: { mentor: 5, katalysator: 3 } },
        { id: 'cd2d', text: 'Ich sichere, was noch zu retten ist', scores: { waechter: 5, navigator: 3 } },
      ],
    },
    {
      id: 'cd3',
      context: 'Was motiviert dich am meisten?',
      text: 'Dein Antrieb?',
      options: [
        { id: 'cd3a', text: 'Anderen beim Wachsen helfen', scores: { mentor: 5, waechter: 2 } },
        { id: 'cd3b', text: 'Etwas Einzigartiges erschaffen', scores: { visionaer: 5, architekt: 3 } },
        { id: 'cd3c', text: 'Perfekte Systeme bauen', scores: { architekt: 5, navigator: 4 } },
        { id: 'cd3d', text: 'Chaos in Ordnung verwandeln', scores: { waechter: 5, navigator: 3 } },
      ],
    },
    {
      id: 'cd4',
      context: 'Dein Albtraum-Job w\u00e4re...',
      text: 'Was kannst du gar nicht?',
      options: [
        { id: 'cd4a', text: 'Einsam in einer Datenzelle sitzen', scores: { katalysator: 5, mentor: 4 } },
        { id: 'cd4b', text: 'Jeden Tag exakt das Gleiche tun', scores: { visionaer: 5, architekt: 2 } },
        { id: 'cd4c', text: 'Ohne Plan ins Risiko springen', scores: { waechter: 5, navigator: 4 } },
        { id: 'cd4d', text: 'Oberfl\u00e4chlicher Smalltalk den ganzen Tag', scores: { architekt: 5, navigator: 3 } },
      ],
    },
    {
      id: 'cd5',
      context: 'Feedback-Gespr\u00e4ch. Was willst du h\u00f6ren?',
      text: 'Dein liebstes Lob?',
      options: [
        { id: 'cd5a', text: 'Du hast eine geniale Vision!', scores: { visionaer: 5, katalysator: 2 } },
        { id: 'cd5b', text: 'Auf dich ist immer Verlass.', scores: { waechter: 5, mentor: 2 } },
        { id: 'cd5c', text: 'Das ist technisch brillant gel\u00f6st.', scores: { architekt: 5, navigator: 3 } },
        { id: 'cd5d', text: 'Du hast das Team zusammengehalten.', scores: { mentor: 5, katalysator: 3 } },
      ],
    },
    {
      id: 'cd6',
      context: 'Du musst pr\u00e4sentieren...',
      text: 'Wie machst du das?',
      options: [
        { id: 'cd6a', text: 'Mit Leidenschaft und gro\u00dfen Bildern', scores: { visionaer: 5, katalysator: 4 } },
        { id: 'cd6b', text: 'Mit Fakten, Daten und Logik', scores: { navigator: 5, architekt: 4 } },
        { id: 'cd6c', text: 'Interaktiv im Dialog mit dem Raum', scores: { katalysator: 5, mentor: 3 } },
        { id: 'cd6d', text: 'Gut vorbereitet mit Handout f\u00fcr alle', scores: { waechter: 5, navigator: 2 } },
      ],
    },
    {
      id: 'cd7',
      context: 'Ein Kollege bittet um Hilfe...',
      text: 'Deine Reaktion?',
      options: [
        { id: 'cd7a', text: 'Ich zeige ihm, wie er es selbst l\u00f6st', scores: { mentor: 5, architekt: 2 } },
        { id: 'cd7b', text: 'Ich \u00fcbernehme es kurz, geht schneller', scores: { visionaer: 3, katalysator: 2 } },
        { id: 'cd7c', text: 'Ich pr\u00fcfe erst meine eigene Deadline', scores: { waechter: 5, navigator: 3 } },
        { id: 'cd7d', text: 'Ich vernetze ihn mit einem Experten', scores: { katalysator: 5, navigator: 2 } },
      ],
    },
    {
      id: 'cd8',
      context: 'Innovation vs. Tradition?',
      text: 'Wo stehst du?',
      options: [
        { id: 'cd8a', text: 'Alles neu macht der Mai!', scores: { visionaer: 5, architekt: 3 } },
        { id: 'cd8b', text: 'Bew\u00e4hrtes sch\u00fctzen und optimieren', scores: { waechter: 5, navigator: 4 } },
        { id: 'cd8c', text: 'Br\u00fccke zwischen Alt und Neu bauen', scores: { katalysator: 5, mentor: 3 } },
        { id: 'cd8d', text: 'Wahrheit liegt in der Analyse', scores: { navigator: 5, architekt: 4 } },
      ],
    },
    {
      id: 'cd9',
      context: 'Dein Schreibtisch (oder Desktop)...',
      text: 'Wie sieht es aus?',
      options: [
        { id: 'cd9a', text: 'Kreatives Chaos', scores: { visionaer: 5, katalysator: 3 } },
        { id: 'cd9b', text: 'Minimalistisch und clean', scores: { architekt: 5, navigator: 4 } },
        { id: 'cd9c', text: 'Alles hat seinen festen Platz', scores: { waechter: 5, navigator: 3 } },
        { id: 'cd9d', text: 'Fotos von Freunden und Inspirationen', scores: { mentor: 5, katalysator: 2 } },
      ],
    },
    {
      id: 'cd10',
      context: 'Wenn du Chef w\u00e4rst...',
      text: 'Dein F\u00fchrungsstil?',
      options: [
        { id: 'cd10a', text: 'Inspirierend und vorausgehend', scores: { visionaer: 5, katalysator: 4 } },
        { id: 'cd10b', text: 'Strategisch und kontrolliert', scores: { navigator: 5, waechter: 3 } },
        { id: 'cd10c', text: 'F\u00f6rdernd und empatisch', scores: { mentor: 5, katalysator: 3 } },
        { id: 'cd10d', text: 'Kompetenz-basiert und sachlich', scores: { architekt: 5, navigator: 2 } },
      ],
    },
    {
      id: 'cd11',
      context: 'Risiko-Check',
      text: 'Wie viel wagst du?',
      options: [
        { id: 'cd11a', text: 'Alles auf eine Karte!', scores: { visionaer: 5, katalysator: 2 } },
        { id: 'cd11b', text: 'Kalkuliertes Risiko nach Analyse', scores: { navigator: 5, architekt: 4 } },
        { id: 'cd11c', text: 'Sicherheit geht vor', scores: { waechter: 5, mentor: 2 } },
        { id: 'cd11d', text: 'Nur wenn das Team mitzieht', scores: { mentor: 5, katalysator: 3 } },
      ],
    },
    {
      id: 'cd12',
      context: 'Wof\u00fcr willst du erinnert werden?',
      text: 'Dein Verm\u00e4chtnis?',
      options: [
        { id: 'cd12a', text: 'Ich habe die Branche revolutioniert', scores: { visionaer: 5, architekt: 3 } },
        { id: 'cd12b', text: 'Ich habe Menschen gepr\u00e4gt', scores: { mentor: 5, katalysator: 3 } },
        { id: 'cd12c', text: 'Ich habe ein stabiles Fundament gebaut', scores: { waechter: 5, navigator: 3 } },
        { id: 'cd12d', text: 'Ich habe komplexe Probleme gel\u00f6st', scores: { architekt: 5, navigator: 4 } },
      ],
    },
  ],

  profiles: [
    {
      id: 'visionaer',
      title: 'Der Vision\u00e4r',
      emoji: '\uD83D\uDE80',
      color: '#D4AF37',
      description: 'Du bist der Motor f\u00fcr Ver\u00e4nderung. \'Das haben wir immer so gemacht\' ist f\u00fcr dich eine Kriegserkl\u00e4rung. Du brauchst Freiraum, gro\u00dfe Ziele und die Erlaubnis, Regeln zu brechen.',
    },
    {
      id: 'architekt',
      title: 'Der Architekt',
      emoji: '\uD83C\uDFD7\uFE0F',
      color: '#8FB8A8',
      description: 'Du liebst komplexe Probleme. Wo andere Chaos sehen, siehst du Strukturen. Du arbeitest gerne tief konzentriert und lieferst Ergebnisse von h\u00f6chster Qualit\u00e4t.',
    },
    {
      id: 'katalysator',
      title: 'Der Katalysator',
      emoji: '\u26A1',
      color: '#E8C878',
      description: 'Du bist der Funke. Allein deine Anwesenheit ver\u00e4ndert die Dynamik im Raum. Du bist exzellent im Netzwerken, Verkaufen und \u00dcberzeugen.',
    },
    {
      id: 'navigator',
      title: 'Der Navigator',
      emoji: '\uD83E\uDDED',
      color: '#5B8A9A',
      description: 'Du bist der Stratege im Hintergrund. Du triffst keine impulsiven Entscheidungen, sondern basierst alles auf Daten und Fakten.',
    },
    {
      id: 'mentor',
      title: 'Der Mentor',
      emoji: '\uD83C\uDF31',
      color: '#6CA192',
      description: 'Dein Erfolg misst sich am Erfolg der anderen. Du bist ein nat\u00fcrlicher Coach und Leader, der nicht durch Macht, sondern durch Vertrauen f\u00fchrt.',
    },
    {
      id: 'waechter',
      title: 'Der W\u00e4chter',
      emoji: '\uD83C\uDFF0',
      color: '#7BA8B8',
      description: 'Ohne dich w\u00fcrde alles zusammenbrechen. Du bist derjenige, der die Details pr\u00fcft, die Risiken sieht und f\u00fcr Stabilit\u00e4t sorgt.',
    },
  ],

  resultMapping: {
    markerId: 'quiz.career_dna.v2',
    profileToTraits: {},
  },
};

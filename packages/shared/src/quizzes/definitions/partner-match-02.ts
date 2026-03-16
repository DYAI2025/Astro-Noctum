import type { QuizDefinition } from '../schema';

export const partnerMatch02Quiz: QuizDefinition = {
  id: 'partner-match-02',
  title: 'Everyday Fit & Quirks',
  titleDe: 'Alltag & Eigenarten',
  subtitle: 'Not every fitting person looks fitting at first glance. This format looks for resonance, not boxes.',
  subtitleDe: 'Nicht jeder passende Mensch sieht auf den ersten Blick passend aus. Dieses Format sucht nach Resonanz, nicht nach Schubladen.',
  emoji: '💕',
  accentColor: '#9B3A6A',
  scoringModel: 'categorical',
  dimensions: ['passion', 'stability', 'future'],
  seriesId: 'partner-match',
  seriesOrder: 2,
  questions: [
    { id: 'q01', text: 'Sonntagmorgen — wie sollte er idealerweise aussehen, wenn ihr zusammen seid?', options: [
      { id: 'A', text: 'Unser Ritual: Kaffee, Zeitung oder Podcast, langsam wach werden — immer gleich, immer schön.', scores: { passion: -0.08, stability: 0.34, future: 0.02 }, profileId: 'ritual_keeper' },
      { id: 'B', text: 'Spontan schauen, was sich ergibt — manchmal Markt, manchmal Sofa, manchmal beides.', scores: { passion: 0.02, stability: 0.18, future: 0.14 }, profileId: 'easy_cozy' },
      { id: 'C', text: 'Produktiv starten — Aufgaben erledigen, danach verdient entspannen.', scores: { passion: -0.02, stability: 0.28, future: 0.06 }, profileId: 'reliable_teammate' },
      { id: 'D', text: 'Chaotisch und schön — jeder macht irgendwas, irgendwann treffen wir uns in der Mitte.', scores: { passion: 0.14, stability: -0.20, future: 0.16 }, profileId: 'easy_cozy' },
    ]},
    { id: 'q02', text: 'Dein Partner hat eine liebenswerte Macke, die dich anfangs irritiert. Wie gehst du damit um?', options: [
      { id: 'A', text: 'Ich gewöhne mich daran — kleine Macken werden mit der Zeit zu liebgewonnenen Zeichen.', scores: { passion: -0.08, stability: 0.34, future: 0.02 }, profileId: 'ritual_keeper' },
      { id: 'B', text: 'Ich finde es schnell charmant — jede Eigenart macht den Menschen einzigartig.', scores: { passion: 0.02, stability: 0.18, future: 0.14 }, profileId: 'easy_cozy' },
      { id: 'C', text: 'Ich spreche es ruhig an — nicht als Problem, sondern als Frage, wie wir es lösen.', scores: { passion: -0.02, stability: 0.28, future: 0.06 }, profileId: 'reliable_teammate' },
      { id: 'D', text: 'Ich lasse es einfach sein — Chaos hat seinen eigenen Reiz, wenn man sich mag.', scores: { passion: 0.14, stability: -0.20, future: 0.16 }, profileId: 'easy_cozy' },
    ]},
    { id: 'q03', text: 'Wie wichtig ist euch gemeinsame Ordnung? Haushalt, Aufgaben, Verlässlichkeit im Kleinen?', options: [
      { id: 'A', text: 'Sehr wichtig — geteilte Routinen schaffen Vertrauen und ein gemeinsames Zuhause.', scores: { passion: -0.08, stability: 0.34, future: 0.02 }, profileId: 'ritual_keeper' },
      { id: 'B', text: 'Mittel wichtig — Ordnung ist schön, aber Flexibilität ist mir lieber als Perfektion.', scores: { passion: 0.02, stability: 0.18, future: 0.14 }, profileId: 'easy_cozy' },
      { id: 'C', text: 'Sehr wichtig — ich bin verlässlich und erwarte das auch vom anderen.', scores: { passion: -0.02, stability: 0.28, future: 0.06 }, profileId: 'reliable_teammate' },
      { id: 'D', text: 'Nicht so wichtig — wir finden unseren Rhythmus, auch wenn er ungewöhnlich aussieht.', scores: { passion: 0.14, stability: -0.20, future: 0.16 }, profileId: 'easy_cozy' },
    ]},
    { id: 'q04', text: 'Dein Partner vergisst etwas, das dir wichtig war — zum zweiten Mal. Wie reagierst du?', options: [
      { id: 'A', text: 'Ich sage es ruhig und klar — und erkläre, warum es mir wichtig ist.', scores: { passion: -0.08, stability: 0.34, future: 0.02 }, profileId: 'ritual_keeper' },
      { id: 'B', text: 'Ich schaue, ob es ein Muster ist — manchmal vergisst man einfach Dinge.', scores: { passion: 0.02, stability: 0.18, future: 0.14 }, profileId: 'easy_cozy' },
      { id: 'C', text: 'Ich suche eine konkrete Lösung — gemeinsamer Kalender, Erinnerungen, was auch immer hilft.', scores: { passion: -0.02, stability: 0.28, future: 0.06 }, profileId: 'reliable_teammate' },
      { id: 'D', text: 'Ich lache es weg — Perfektion ist nicht das Ziel, wir sind beide Menschen.', scores: { passion: 0.14, stability: -0.20, future: 0.16 }, profileId: 'easy_cozy' },
    ]},
    { id: 'q05', text: 'Welche Art von gemeinsamen Abenden macht dich am glücklichsten?', options: [
      { id: 'A', text: 'Unser Lieblingsessen, die Lieblingsserie, die wir beide kennen — das vertraute Ritual.', scores: { passion: -0.08, stability: 0.34, future: 0.02 }, profileId: 'ritual_keeper' },
      { id: 'B', text: 'Einfach nebeneinander sein — jeder macht sein Ding, aber in der gleichen Energie.', scores: { passion: 0.02, stability: 0.18, future: 0.14 }, profileId: 'easy_cozy' },
      { id: 'C', text: 'Etwas Erledigtes zusammen feiern — auch kleine Fortschritte verdienen Anerkennung.', scores: { passion: -0.02, stability: 0.28, future: 0.06 }, profileId: 'reliable_teammate' },
      { id: 'D', text: 'Spontan das tun, worauf gerade Lust ist — kein Plan, nur Stimmung.', scores: { passion: 0.14, stability: -0.20, future: 0.16 }, profileId: 'easy_cozy' },
    ]},
    { id: 'q06', text: 'Ihr habt unterschiedliche Vorstellungen von Ordnung zu Hause. Wie findet ihr euren Weg?', options: [
      { id: 'A', text: 'Wir sprechen über gemeinsame Standards und halten uns beide daran.', scores: { passion: -0.08, stability: 0.34, future: 0.02 }, profileId: 'ritual_keeper' },
      { id: 'B', text: 'Wir akzeptieren unsere Unterschiede und finden einen guten Mittelweg.', scores: { passion: 0.02, stability: 0.18, future: 0.14 }, profileId: 'easy_cozy' },
      { id: 'C', text: 'Wir teilen klar auf, wer was macht — keine Verhandlungen, nur klare Zuständigkeiten.', scores: { passion: -0.02, stability: 0.28, future: 0.06 }, profileId: 'reliable_teammate' },
      { id: 'D', text: 'Manchmal ist es ordentlich, manchmal nicht — wir stören uns gegenseitig nicht.', scores: { passion: 0.14, stability: -0.20, future: 0.16 }, profileId: 'easy_cozy' },
    ]},
    { id: 'q07', text: 'Dein Partner braucht spontan Hilfe mit etwas, für das du eigentlich keine Zeit hast. Was passiert?', options: [
      { id: 'A', text: 'Ich mache es — für die Menschen, die ich liebe, reorganisiere ich meine Pläne.', scores: { passion: -0.08, stability: 0.34, future: 0.02 }, profileId: 'ritual_keeper' },
      { id: 'B', text: 'Ich schau, was möglich ist — meistens findet sich ein Weg.', scores: { passion: 0.02, stability: 0.18, future: 0.14 }, profileId: 'easy_cozy' },
      { id: 'C', text: 'Ich helfe und plane gleichzeitig, was dadurch für mich verschoben werden muss.', scores: { passion: -0.02, stability: 0.28, future: 0.06 }, profileId: 'reliable_teammate' },
      { id: 'D', text: 'Wir improvisieren gemeinsam — das Chaos gehört dazu.', scores: { passion: 0.14, stability: -0.20, future: 0.16 }, profileId: 'easy_cozy' },
    ]},
    { id: 'q08', text: 'Was bedeutet Verlässlichkeit in einer Beziehung für dich konkret?', options: [
      { id: 'A', text: 'Geteilte Rituale, die wir einhalten — das gibt mir Sicherheit und Heimgefühl.', scores: { passion: -0.08, stability: 0.34, future: 0.02 }, profileId: 'ritual_keeper' },
      { id: 'B', text: 'Dass wir uns wohl miteinander fühlen — nicht jeder Tag muss perfekt geplant sein.', scores: { passion: 0.02, stability: 0.18, future: 0.14 }, profileId: 'easy_cozy' },
      { id: 'C', text: 'Versprechen werden gehalten — was man sagt, das meint man auch so.', scores: { passion: -0.02, stability: 0.28, future: 0.06 }, profileId: 'reliable_teammate' },
      { id: 'D', text: 'Dass man sich finden kann, auch wenn der Alltag chaotisch ist.', scores: { passion: 0.14, stability: -0.20, future: 0.16 }, profileId: 'easy_cozy' },
    ]},
    { id: 'q09', text: 'Wie zeigst du kleine Fürsorge im Alltag? Was tust du, ohne dass es verlangt wird?', options: [
      { id: 'A', text: 'Ich erinnere mich an die Kleinigkeiten — welcher Tee, welche Playlist, welches Ritual.', scores: { passion: -0.08, stability: 0.34, future: 0.02 }, profileId: 'ritual_keeper' },
      { id: 'B', text: 'Ich bin einfach da — präsent, entspannt, ohne Agenda.', scores: { passion: 0.02, stability: 0.18, future: 0.14 }, profileId: 'easy_cozy' },
      { id: 'C', text: 'Ich erledige Dinge, bevor sie zum Problem werden — praktische Liebe.', scores: { passion: -0.02, stability: 0.28, future: 0.06 }, profileId: 'reliable_teammate' },
      { id: 'D', text: 'Ich überrasche spontan — eine unerwartete Geste, ein Moment, eine Idee.', scores: { passion: 0.14, stability: -0.20, future: 0.16 }, profileId: 'easy_cozy' },
    ]},
  ],
  profiles: [
    { id: 'ritual_keeper', title: 'Ritual-Hüter', emoji: '🏠', color: '#8B6914', description: 'Du schaffst Heimat aus Gewohnheit — und das ist eine der schönsten Formen von Liebe.', priority: 1 },
    { id: 'easy_cozy', title: 'Leichte Gemütlichkeit', emoji: '☕', color: '#9B3A6A', description: 'Du machst aus jedem Moment ein Zuhause — ohne Aufwand, einfach durch dein Sein.', priority: 2 },
    { id: 'reliable_teammate', title: 'Verlässlicher Teamplayer', emoji: '🤝', color: '#4A6741', description: 'Du zeigst Liebe durch Taten — und dein Partner weiß, dass er sich immer auf dich verlassen kann.', priority: 3 },
  ],
  resultMapping: {
    markerId: 'quiz.partner_match_02.v1',
    profileToTraits: {
      ritual_keeper: { 'marker.emotion.anchor': 1.0, 'marker.love.togetherness': 0.8, 'marker.social.acts_of_service': 0.6 },
      easy_cozy: { 'marker.love.togetherness': 1.0, 'marker.emotion.anchor': 0.7, 'marker.freedom.growth': 0.5 },
      reliable_teammate: { 'marker.social.acts_of_service': 1.0, 'marker.emotion.anchor': 0.85, 'marker.values.achievement': 0.7 },
    },
  },
};

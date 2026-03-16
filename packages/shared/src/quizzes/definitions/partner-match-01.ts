import type { QuizDefinition } from '../schema';

export const partnerMatch01Quiz: QuizDefinition = {
  id: 'partner-match-01',
  title: 'Chemistry & Expression',
  titleDe: 'Chemie & Ausdruck',
  subtitle: 'Not every fitting person looks fitting at first glance. This format looks for resonance, not boxes.',
  subtitleDe: 'Nicht jeder passende Mensch sieht auf den ersten Blick passend aus. Dieses Format sucht nach Resonanz, nicht nach Schubladen.',
  emoji: '💕',
  accentColor: '#9B3A6A',
  scoringModel: 'categorical',
  dimensions: ['passion', 'stability', 'future'],
  seriesId: 'partner-match',
  seriesOrder: 1,
  questions: [
    { id: 'q01', text: 'Du triffst jemanden auf einer Party und spürst sofort eine merkwürdige Anziehung. Was passiert als nächstes?', options: [
      { id: 'A', text: 'Ich gehe direkt hin und sage, was ich denke — klar, direkt, ohne Umwege.', scores: { passion: 0.35, stability: 0.0, future: -0.1 }, profileId: 'spark_seeker' },
      { id: 'B', text: 'Ich nähere mich langsam, höre erst zu — echte Verbindung braucht Zeit.', scores: { passion: 0.18, stability: 0.16, future: -0.04 }, profileId: 'soft_magnet' },
      { id: 'C', text: 'Ich fange an zu necken und zu flirten — leicht, verspielt, mit einem Augenzwinkern.', scores: { passion: 0.24, stability: -0.06, future: 0.1 }, profileId: 'playful_current' },
      { id: 'D', text: 'Ich beobachte aus sicherer Entfernung — ich brauche erst Sicherheit, bevor ich mich öffne.', scores: { passion: -0.18, stability: 0.22, future: 0.08 }, profileId: 'soft_magnet' },
    ]},
    { id: 'q02', text: 'Ein Date läuft gut. Wie zeigst du deine Zuneigung am liebsten?', options: [
      { id: 'A', text: 'Körperliche Nähe — Berührungen, Blicke, der Raum zwischen uns schrumpft.', scores: { passion: 0.35, stability: 0.0, future: -0.1 }, profileId: 'spark_seeker' },
      { id: 'B', text: 'Tiefe Aufmerksamkeit — ich merke mir Details und frage nach.', scores: { passion: 0.18, stability: 0.16, future: -0.04 }, profileId: 'soft_magnet' },
      { id: 'C', text: 'Humor und Leichtigkeit — Lachen ist mein Weg, um zu sagen: Ich mag dich.', scores: { passion: 0.24, stability: -0.06, future: 0.1 }, profileId: 'playful_current' },
      { id: 'D', text: 'Ich halte mich zurück — zu viel zu früh fühlt sich für mich falsch an.', scores: { passion: -0.18, stability: 0.22, future: 0.08 }, profileId: 'soft_magnet' },
    ]},
    { id: 'q03', text: 'Welches Flirt-Tempo fühlt sich für dich am stimmigsten an?', options: [
      { id: 'A', text: 'Sofort Feuer — wenn der Funke überspringt, dann sofort und ohne Zögern.', scores: { passion: 0.35, stability: 0.0, future: -0.1 }, profileId: 'spark_seeker' },
      { id: 'B', text: 'Sanft wachsen — ich liebe das langsame Aufblühen, Schicht für Schicht.', scores: { passion: 0.18, stability: 0.16, future: -0.04 }, profileId: 'soft_magnet' },
      { id: 'C', text: 'Spielerisch tanzen — wir kreisen umeinander, mit Witz und Leichtigkeit.', scores: { passion: 0.24, stability: -0.06, future: 0.1 }, profileId: 'playful_current' },
      { id: 'D', text: 'Behutsam abtasten — ich brauche Zeit, um zu spüren, ob es wirklich passt.', scores: { passion: -0.18, stability: 0.22, future: 0.08 }, profileId: 'soft_magnet' },
    ]},
    { id: 'q04', text: 'Ihr habt euren ersten kleinen Streit. Wie löst du die Spannung am liebsten?', options: [
      { id: 'A', text: 'Klares Gespräch, sofort — ich will es direkt ansprechen und dann loslassen.', scores: { passion: 0.35, stability: 0.0, future: -0.1 }, profileId: 'spark_seeker' },
      { id: 'B', text: 'Eine Umarmung sagt mehr als Worte — ich nähere mich körperlich, um wieder weich zu werden.', scores: { passion: 0.18, stability: 0.16, future: -0.04 }, profileId: 'soft_magnet' },
      { id: 'C', text: 'Einen Witz machen — Humor ist mein Ventil, um die Schwere zu nehmen.', scores: { passion: 0.24, stability: -0.06, future: 0.1 }, profileId: 'playful_current' },
      { id: 'D', text: 'Etwas Raum lassen — ich verarbeite Dinge lieber erst für mich.', scores: { passion: -0.18, stability: 0.22, future: 0.08 }, profileId: 'soft_magnet' },
    ]},
    { id: 'q05', text: 'Dein Gegenüber schreibt dir mitten im Arbeitstag eine lange Nachricht über seine Gefühle. Wie reagierst du?', options: [
      { id: 'A', text: 'Ich antworte sofort und direkt — ich will keine Distanz entstehen lassen.', scores: { passion: 0.35, stability: 0.0, future: -0.1 }, profileId: 'spark_seeker' },
      { id: 'B', text: 'Ich nehme mir nach der Arbeit Zeit für eine echte, durchdachte Antwort.', scores: { passion: 0.18, stability: 0.16, future: -0.04 }, profileId: 'soft_magnet' },
      { id: 'C', text: 'Ich schicke ein Emoji und einen kurzen Witz — und kündige ein richtiges Gespräch an.', scores: { passion: 0.24, stability: -0.06, future: 0.1 }, profileId: 'playful_current' },
      { id: 'D', text: 'Ich lese es, brauche aber Zeit, bevor ich weiß, was ich darauf sagen will.', scores: { passion: -0.18, stability: 0.22, future: 0.08 }, profileId: 'soft_magnet' },
    ]},
    { id: 'q06', text: 'Wie stellst du dir euer erstes Treffen vor? Was soll die Energie des Abends sein?', options: [
      { id: 'A', text: 'Intensiv und unvergesslich — ich will spüren, ob da echte Spannung ist.', scores: { passion: 0.35, stability: 0.0, future: -0.1 }, profileId: 'spark_seeker' },
      { id: 'B', text: 'Warm und entspannt — ein gutes Gespräch, bei dem wir beide auftauen.', scores: { passion: 0.18, stability: 0.16, future: -0.04 }, profileId: 'soft_magnet' },
      { id: 'C', text: 'Lebendig und lustig — wir lachen viel, es soll sich leicht und frei anfühlen.', scores: { passion: 0.24, stability: -0.06, future: 0.1 }, profileId: 'playful_current' },
      { id: 'D', text: 'Ruhig und unverbindlich — kein Druck, einfach schauen, ob wir uns wohl miteinander fühlen.', scores: { passion: -0.18, stability: 0.22, future: 0.08 }, profileId: 'soft_magnet' },
    ]},
    { id: 'q07', text: 'Was ist dir bei gegenseitiger Anziehung wichtiger — der Funke oder das Wohlgefühl?', options: [
      { id: 'A', text: 'Der Funke — ohne Knistern bringt mich nichts weiter.', scores: { passion: 0.35, stability: 0.0, future: -0.1 }, profileId: 'spark_seeker' },
      { id: 'B', text: 'Das Wohlgefühl — Vertrautheit und Wärme sind die Basis für alles andere.', scores: { passion: 0.18, stability: 0.16, future: -0.04 }, profileId: 'soft_magnet' },
      { id: 'C', text: 'Beides, aber der Funke darf auch ein Lächeln sein — Leichtigkeit zündet auch.', scores: { passion: 0.24, stability: -0.06, future: 0.1 }, profileId: 'playful_current' },
      { id: 'D', text: 'Keine Ahnung — ich muss erst Sicherheit spüren, bevor ich weiß, was ich fühle.', scores: { passion: -0.18, stability: 0.22, future: 0.08 }, profileId: 'soft_magnet' },
    ]},
    { id: 'q08', text: 'Ihr verbringt einen ganzen Tag zusammen. Welcher Moment bleibt dir am stärksten?', options: [
      { id: 'A', text: 'Der Moment, in dem wir uns angeschaut haben und beide wussten, dass da etwas ist.', scores: { passion: 0.35, stability: 0.0, future: -0.1 }, profileId: 'spark_seeker' },
      { id: 'B', text: 'Das ruhige Gespräch abends, bei dem wir uns wirklich gezeigt haben.', scores: { passion: 0.18, stability: 0.16, future: -0.04 }, profileId: 'soft_magnet' },
      { id: 'C', text: 'Das Lachen über irgendeinen dummen Witz, bei dem wir nicht mehr aufgehört haben.', scores: { passion: 0.24, stability: -0.06, future: 0.1 }, profileId: 'playful_current' },
      { id: 'D', text: 'Das Schweigen, das sich nicht unangenehm angefühlt hat — endlich jemand, bei dem ich atmen kann.', scores: { passion: -0.18, stability: 0.22, future: 0.08 }, profileId: 'soft_magnet' },
    ]},
    { id: 'q09', text: 'Ihr seid eine Woche getrennt. Wie gehst du mit der Sehnsucht um?', options: [
      { id: 'A', text: 'Ich halte die Spannung bewusst hoch — die Sehnsucht treibt mich an.', scores: { passion: 0.35, stability: 0.0, future: -0.1 }, profileId: 'spark_seeker' },
      { id: 'B', text: 'Ich schreibe lange Nachrichten — Worte überbrücken die Distanz für mich.', scores: { passion: 0.18, stability: 0.16, future: -0.04 }, profileId: 'soft_magnet' },
      { id: 'C', text: 'Ich schicke lustige Memes und überrasche sie mit einem unerwarteten Anruf.', scores: { passion: 0.24, stability: -0.06, future: 0.1 }, profileId: 'playful_current' },
      { id: 'D', text: 'Ich gönne mir Raum für mich selbst — Sehnsucht ist schön, aber ich brauche auch Stille.', scores: { passion: -0.18, stability: 0.22, future: 0.08 }, profileId: 'soft_magnet' },
    ]},
  ],
  profiles: [
    { id: 'spark_seeker', title: 'Funken-Sucher', emoji: '⚡', color: '#E85555', description: 'Du brauchst das Knistern — und das ist kein Mangel, das ist deine Sprache.', priority: 1 },
    { id: 'soft_magnet', title: 'Sanfter Magnet', emoji: '🧲', color: '#9B3A6A', description: 'Du ziehst an, indem du da bist — kein Lärm, keine Show, nur echte Präsenz.', priority: 2 },
    { id: 'playful_current', title: 'Verspielter Strom', emoji: '🌊', color: '#C45B8F', description: 'Du flirtest mit dem Leben selbst — und die richtigen Menschen spüren das sofort.', priority: 3 },
  ],
  resultMapping: {
    markerId: 'quiz.partner_match_01.v1',
    profileToTraits: {
      spark_seeker: { 'marker.love.passionate': 1.0, 'marker.love.physical_touch': 0.8, 'marker.creative.expression': 0.6 },
      soft_magnet: { 'marker.emotion.anchor': 1.0, 'marker.love.togetherness': 0.8, 'marker.eq.empathy': 0.7 },
      playful_current: { 'marker.creative.expression': 1.0, 'marker.social.extroversion': 0.8, 'marker.freedom.growth': 0.6 },
    },
  },
};

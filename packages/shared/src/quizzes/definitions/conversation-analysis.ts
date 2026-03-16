import type { QuizDefinition } from '../schema';

/**
 * ConversationAnalysisQuiz is NOT a traditional quiz with questions/options.
 * It is an AI-powered text-input quiz where users paste a dialogue and the
 * server analyzes it. This definition serves as metadata/registration only.
 *
 * The actual scoring happens server-side via `/api/analyze/conversation`.
 * The client uses `conversationAnalysisToEvent()` from quiz-to-event.ts.
 */
export const conversationAnalysisQuiz: QuizDefinition = {
  id: 'conversation-analysis',
  title: 'Conversation Analysis',
  titleDe: 'Gesprächs-Analyse',
  subtitle: 'AI-powered dialogue analysis for partner resonance',
  subtitleDe: 'Die KI trennt automatisch zwischen dir und deinem Partner und erkennt semantische Muster.',
  emoji: '💬',
  accentColor: '#9B3A6A',
  scoringModel: 'profile-driven',
  seriesId: 'partner-match',
  seriesOrder: 4,
  questions: [],
  profiles: [
    {
      id: 'high_resonance',
      title: 'Hohe Resonanz',
      emoji: '✨',
      color: '#9B3A6A',
      description: 'Eure Kommunikation zeigt starke emotionale Synchronisation und gegenseitiges Verständnis.',
      minScore: 0.7,
      priority: 1,
    },
    {
      id: 'moderate_resonance',
      title: 'Moderate Resonanz',
      emoji: '🔄',
      color: '#C45B8F',
      description: 'Es gibt gute Ansätze der Verbindung mit Raum für tiefere Synchronisation.',
      minScore: 0.4,
      priority: 2,
    },
    {
      id: 'developing_resonance',
      title: 'Wachsende Resonanz',
      emoji: '🌱',
      color: '#6CA192',
      description: 'Eure Kommunikationsmuster entwickeln sich — Bewusstsein ist der erste Schritt.',
      minScore: 0,
      priority: 3,
    },
  ],
  resultMapping: {
    markerId: 'partner_convo',
    profileToTraits: {
      high_resonance: { 'marker.love.togetherness': 1.0, 'marker.eq.empathy': 0.9 },
      moderate_resonance: { 'marker.love.togetherness': 0.6, 'marker.eq.empathy': 0.5 },
      developing_resonance: { 'marker.love.togetherness': 0.3, 'marker.eq.empathy': 0.3 },
    },
  },
};

import { describe, it, expect } from 'vitest';
import { scoreQuiz } from '../../packages/shared/src/quizzes/scoring';
import type { QuizDefinition } from '../../packages/shared/src/quizzes/schema';

const profileDrivenQuiz: QuizDefinition = {
  id: 'test-profile',
  title: 'Test', titleDe: 'Test',
  subtitle: '', subtitleDe: '',
  emoji: '', accentColor: '',
  scoringModel: 'profile-driven',
  questions: [
    { id: 'q1', text: 'Q1', options: [
      { id: 'a', text: 'A', profileId: 'wolf' },
      { id: 'b', text: 'B', profileId: 'eagle' },
    ]},
    { id: 'q2', text: 'Q2', options: [
      { id: 'a', text: 'A', profileId: 'wolf' },
      { id: 'b', text: 'B', profileId: 'eagle' },
    ]},
    { id: 'q3', text: 'Q3', options: [
      { id: 'a', text: 'A', profileId: 'wolf' },
      { id: 'b', text: 'B', profileId: 'eagle' },
    ]},
  ],
  profiles: [
    { id: 'wolf', title: 'Wolf', emoji: '🐺', color: '#fff', description: 'Wolf desc' },
    { id: 'eagle', title: 'Eagle', emoji: '🦅', color: '#fff', description: 'Eagle desc' },
  ],
  resultMapping: { markerId: 'krafttier', profileToTraits: {} },
};

const multiDimQuiz: QuizDefinition = {
  id: 'test-multi',
  title: 'Test', titleDe: 'Test',
  subtitle: '', subtitleDe: '',
  emoji: '', accentColor: '',
  scoringModel: 'multi-dimension',
  dimensions: ['warmth', 'logic'],
  questions: [
    { id: 'q1', text: 'Q1', options: [
      { id: 'a', text: 'A', scores: { warmth: 3, logic: 1 } },
      { id: 'b', text: 'B', scores: { warmth: 1, logic: 3 } },
    ]},
    { id: 'q2', text: 'Q2', options: [
      { id: 'a', text: 'A', scores: { warmth: 2, logic: 0 } },
      { id: 'b', text: 'B', scores: { warmth: 0, logic: 2 } },
    ]},
  ],
  profiles: [
    { id: 'empath', title: 'Empath', emoji: '💗', color: '#f0a', description: '', thresholds: { warmth: 4 }, priority: 1 },
    { id: 'analyst', title: 'Analyst', emoji: '🧠', color: '#0af', description: '', thresholds: { logic: 4 }, priority: 2 },
    { id: 'balanced', title: 'Balanced', emoji: '⚖️', color: '#aaa', description: '', priority: 99 },
  ],
  resultMapping: { markerId: 'personality', profileToTraits: {} },
};

const categoricalQuiz: QuizDefinition = {
  id: 'test-categorical',
  title: 'Test', titleDe: 'Test',
  subtitle: '', subtitleDe: '',
  emoji: '', accentColor: '',
  scoringModel: 'categorical',
  questions: [
    { id: 'q1', text: 'Q1', options: [
      { id: 'a', text: 'A', scores: { fire: 3 } },
      { id: 'b', text: 'B', scores: { water: 3 } },
    ]},
    { id: 'q2', text: 'Q2', options: [
      { id: 'a', text: 'A', scores: { fire: 2 } },
      { id: 'b', text: 'B', scores: { water: 2 } },
    ]},
  ],
  profiles: [
    { id: 'fire-type', title: 'Fire', emoji: '🔥', color: '#f00', description: '', thresholds: { fire: 4 }, priority: 1 },
    { id: 'water-type', title: 'Water', emoji: '💧', color: '#00f', description: '', thresholds: { water: 4 }, priority: 2 },
    { id: 'neutral', title: 'Neutral', emoji: '⚡', color: '#999', description: '', priority: 99 },
  ],
  resultMapping: { markerId: 'element', profileToTraits: {} },
};

describe('scoreQuiz', () => {
  describe('profile-driven', () => {
    it('scores by majority vote', () => {
      const result = scoreQuiz(profileDrivenQuiz, { q1: 'a', q2: 'a', q3: 'b' });
      expect(result.profileId).toBe('wolf');
      expect(result.profile.title).toBe('Wolf');
    });

    it('returns vote counts as dimensionScores', () => {
      const result = scoreQuiz(profileDrivenQuiz, { q1: 'a', q2: 'b', q3: 'b' });
      expect(result.dimensionScores).toEqual({ wolf: 1, eagle: 2 });
      expect(result.profileId).toBe('eagle');
    });

    it('handles unanimous vote', () => {
      const result = scoreQuiz(profileDrivenQuiz, { q1: 'a', q2: 'a', q3: 'a' });
      expect(result.profileId).toBe('wolf');
      expect(result.dimensionScores.wolf).toBe(3);
    });
  });

  describe('multi-dimension', () => {
    it('matches profile by dimension thresholds', () => {
      const result = scoreQuiz(multiDimQuiz, { q1: 'a', q2: 'a' });
      expect(result.profileId).toBe('empath');
      expect(result.dimensionScores).toEqual({ warmth: 5, logic: 1 });
    });

    it('matches second profile when first doesnt meet threshold', () => {
      const result = scoreQuiz(multiDimQuiz, { q1: 'b', q2: 'b' });
      expect(result.profileId).toBe('analyst');
      expect(result.dimensionScores).toEqual({ warmth: 1, logic: 5 });
    });

    it('falls back to lowest priority when no thresholds match', () => {
      // Only answer q1 with warmth=3, logic=1 — neither meets threshold of 4
      const result = scoreQuiz(multiDimQuiz, { q1: 'a' });
      expect(result.profileId).toBe('balanced');
    });

    it('respects priority order', () => {
      // Both warmth and logic could meet thresholds — empath has higher priority
      const bothHigh: QuizDefinition = {
        ...multiDimQuiz,
        questions: [
          { id: 'q1', text: 'Q1', options: [
            { id: 'a', text: 'A', scores: { warmth: 5, logic: 5 } },
          ]},
        ],
      };
      const result = scoreQuiz(bothHigh, { q1: 'a' });
      expect(result.profileId).toBe('empath');
    });
  });

  describe('categorical', () => {
    it('matches category with highest score', () => {
      const result = scoreQuiz(categoricalQuiz, { q1: 'a', q2: 'a' });
      expect(result.profileId).toBe('fire-type');
    });

    it('preserves answer record', () => {
      const result = scoreQuiz(categoricalQuiz, { q1: 'b', q2: 'b' });
      expect(result.answers).toEqual({ q1: 'b', q2: 'b' });
      expect(result.quizId).toBe('test-categorical');
    });
  });
});

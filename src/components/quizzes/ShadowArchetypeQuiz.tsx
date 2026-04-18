import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { ContributionEvent } from '@/src/lib/lme/types';
import { shadowArchetypeToEvent } from '@/src/lib/signatur/quiz-to-event';
import { shadowArchetypeQuiz } from '@/packages/shared/src/quizzes/definitions/shadow-archetype';
import { scoreQuiz } from '@/packages/shared/src/quizzes/scoring';
import { useLanguage } from '../../contexts/LanguageContext';

interface Props {
  onComplete: (event: ContributionEvent) => void;
  onClose: () => void;
}

type Screen = 'intro' | 'quiz' | 'result';

const quiz = shadowArchetypeQuiz;

export default function ShadowArchetypeQuiz({ onComplete, onClose }: Props) {
  const { lang } = useLanguage();
  const [screen, setScreen] = useState<Screen>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ profileId: string; scores: Record<string, number> } | null>(null);

  const questions = quiz.questions;
  const total = questions.length;

  const handleAnswer = useCallback((questionId: string, optionId: string) => {
    const next = { ...answers, [questionId]: optionId };
    setAnswers(next);

    if (currentQ < total - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      const scored = scoreQuiz(quiz, next);
      setResult({ profileId: scored.profileId, scores: scored.dimensionScores });
      setScreen('result');
    }
  }, [answers, currentQ, total]);

  const handleFinish = useCallback(() => {
    if (!result) return;
    const event = shadowArchetypeToEvent(result.scores, result.profileId);
    onComplete(event);
  }, [result, onComplete]);

  // Profile display data
  const PROFILES: Record<string, { title: string; titleDe: string; icon: string; desc: string; descDe: string }> = {
    destroyer: {
      title: 'The Destroyer', titleDe: 'Der Zerstörer', icon: '🔥',
      desc: 'You carry a quiet fire — a refusal to accept what feels false.',
      descDe: 'Du trägst ein stilles Feuer in dir — eine Weigerung, zu akzeptieren, was sich falsch anfühlt.',
    },
    orphan: {
      title: 'The Orphan', titleDe: 'Das Waisenkind', icon: '🌊',
      desc: 'Beneath your composure lives a deep longing to be truly seen.',
      descDe: 'Unter deiner Fassung lebt eine tiefe Sehnsucht, wirklich gesehen zu werden.',
    },
    tyrant: {
      title: 'The Tyrant', titleDe: 'Der Tyrann', icon: '👑',
      desc: 'Your need for control masks a vulnerability you rarely show.',
      descDe: 'Dein Bedürfnis nach Kontrolle verbirgt eine Verletzlichkeit, die du selten zeigst.',
    },
    trickster: {
      title: 'The Trickster', titleDe: 'Der Trickster', icon: '🎭',
      desc: 'You use charm and chaos as armor — beneath it is someone who fears being pinned down.',
      descDe: 'Du nutzt Charme und Chaos als Rüstung — darunter steckt jemand, der Angst hat, festgenagelt zu werden.',
    },
  };

  if (screen === 'intro') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/90 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-4 max-w-md rounded-2xl border border-gold/10 bg-[#0D0F14] p-8 text-center"
        >
          <div className="mb-4 text-4xl">🔥</div>
          <h2 className="mb-2 font-serif text-2xl text-gold">
            {lang === 'de' ? quiz.titleDe : quiz.title}
          </h2>
          <p className="mb-6 text-sm text-gold/60">
            {lang === 'de' ? quiz.subtitleDe : quiz.subtitle}
          </p>
          <p className="mb-6 text-xs text-gold/40">
            {lang === 'de' ? `${total} Szenarien · ca. 4 Min.` : `${total} scenarios · ~4 min`}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gold/20 px-4 py-2 text-sm text-gold/60 hover:bg-gold/5"
            >
              {lang === 'de' ? 'Zurück' : 'Back'}
            </button>
            <button
              type="button"
              onClick={() => setScreen('quiz')}
              className="rounded-lg bg-gold/10 px-6 py-2 text-sm font-medium text-gold hover:bg-gold/20"
            >
              {lang === 'de' ? 'Starten' : 'Start'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (screen === 'quiz') {
    const q = questions[currentQ];
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/90 backdrop-blur-sm">
        <motion.div
          key={q.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="mx-4 max-w-lg rounded-2xl border border-gold/10 bg-[#0D0F14] p-6"
        >
          {/* Progress */}
          <div className="mb-4 flex items-center justify-between text-xs text-gold/40">
            <span>{currentQ + 1} / {total}</span>
            <button type="button" onClick={onClose} className="hover:text-gold/60">✕</button>
          </div>
          <div className="mb-4 h-0.5 rounded bg-gold/10">
            <div className="h-full rounded bg-gold/40 transition-all" style={{ width: `${((currentQ + 1) / total) * 100}%` }} />
          </div>

          {/* Scenario */}
          {q.context && (
            <p className="mb-3 text-sm italic text-gold/50">{q.context}</p>
          )}

          {/* Prompt */}
          <h3 className="mb-5 font-serif text-lg text-gold">{q.text}</h3>

          {/* Options */}
          <div className="space-y-3">
            {q.options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleAnswer(q.id, opt.id)}
                className="w-full rounded-xl border border-gold/10 bg-gold/5 p-4 text-left text-sm text-gold/80 transition-all hover:border-gold/30 hover:bg-gold/10"
              >
                {opt.text}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // Result screen
  const profile = result ? PROFILES[result.profileId] : null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/90 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-4 max-w-md rounded-2xl border border-gold/10 bg-[#0D0F14] p-8 text-center"
      >
        <div className="mb-4 text-5xl">{profile?.icon ?? '🔮'}</div>
        <h2 className="mb-2 font-serif text-2xl text-gold">
          {lang === 'de' ? profile?.titleDe : profile?.title}
        </h2>
        <p className="mb-6 text-sm text-gold/60">
          {lang === 'de' ? profile?.descDe : profile?.desc}
        </p>

        <button
          type="button"
          onClick={handleFinish}
          className="rounded-lg bg-gold/10 px-6 py-2 text-sm font-medium text-gold hover:bg-gold/20"
        >
          {lang === 'de' ? 'Weiter' : 'Continue'}
        </button>
      </motion.div>
    </div>
  );
}

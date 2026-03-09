'use client';

import React, { useState } from 'react';
import {
  questions,
  quizMeta,
  calculateProfile,
  type DimensionScores
} from './blumenwesen/data';
import { contributeClient as contribute } from '@/lib/api';
import { useClusterProgress } from '@/lib/stores/useClusterProgress';
import { AlchemyButton, AlchemyLinkButton } from '@/components/ui/AlchemyButton';
import { ValidationProfile } from './types';

export function BlumenwesenQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState<DimensionScores>({ licht: 0, wurzeln: 0, rhythmus: 0, wasser: 0 });
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<ValidationProfile | null>(null);
  const [started, setStarted] = useState(false);
  const [microWin, setMicroWin] = useState<string | null>(null);
  
  const { completeQuiz } = useClusterProgress();

  const handleAnswer = (option: typeof questions[0]['options'][0]) => {
    // Accumulate scores
    const newScores = { ...scores };
    if (option.scores) {
      Object.entries(option.scores).forEach(([key, value]) => {
        const k = key as keyof DimensionScores;
        newScores[k] = (newScores[k] || 0) + (value as number);
      });
    }
    setScores(newScores);

    // Micro-win feedback
    const wins = ["Wurzeln schlagen...", "Knospen bilden...", "Licht suchen...", "Wachsen...", "Erblühen..."];
    // eslint-disable-next-line
    setMicroWin(wins[Math.floor(Math.random() * wins.length)]);
    setTimeout(() => setMicroWin(null), 800);

    if (currentQuestion < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
      }, 300);
    } else {
      setTimeout(() => {
        const finalResult = calculateProfile(newScores);
        setResult(finalResult);
        setShowResult(true);
        
        // Mark as completed in Cluster Store
        // We assume "cluster.naturkind.v1" is the cluster ID for this quiz
        completeQuiz("cluster.naturkind.v1", quizMeta.id, finalResult.id, finalResult.title);

        // Emit standard contribution event
        void contribute({
          specVersion: "sp.contribution.v1",
          eventId: crypto.randomUUID(),
          occurredAt: new Date().toISOString(),
          source: {
            vertical: "quiz",
            moduleId: quizMeta.id,
            domain: window.location.hostname,
            locale: "de-DE"
          },
          payload: {
            markers: finalResult.markers || [],
            fields: [
              { id: 'field.flower.type', value: finalResult.title, kind: 'text' },
              { id: 'field.flower.description', value: finalResult.tagline, kind: 'text' }
            ],
            summary: {
              title: finalResult.title,
              bullets: [finalResult.tagline],
              resultId: finalResult.id
            }
          }
        });

      }, 500);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setScores({ licht: 0, wurzeln: 0, rhythmus: 0, wasser: 0 });
    setShowResult(false);
    setResult(null);
    setStarted(false);
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const currentQ = questions[currentQuestion];

  if (!started) {
    return (
      <div className="min-h-[600px] flex items-center justify-center rounded-3xl p-6 relative overflow-hidden bg-gradient-to-br from-[#1A3C2F] to-[#0D1F18]">
        <div className="relative z-10 max-w-lg w-full text-center text-[#E0E8E3]">
          <div className="text-6xl mb-6 animate-pulse">🌸</div>
          <h1 className="text-4xl md:text-5xl font-serif font-medium mb-4 text-[#A8D5BA]">
            {quizMeta.title}
          </h1>
          <p className="text-lg mb-8 leading-relaxed opacity-90 max-w-md mx-auto">
            {quizMeta.subtitle}
          </p>
          <AlchemyButton onClick={() => setStarted(true)}>
            Zum Garten
          </AlchemyButton>
        </div>
      </div>
    );
  }

  if (showResult && result) {
    return (
      <div className="min-h-[600px] rounded-3xl overflow-hidden bg-gradient-to-br from-[#1A3C2F] to-[#0D1F18] p-6 flex flex-col items-center justify-center">
        <div className="bg-[#2D5A4C]/30 backdrop-blur-md rounded-3xl p-8 max-w-md w-full border border-[#A8D5BA]/20 shadow-2xl">
          <div className="text-center mb-6">
            <div className="text-sm font-semibold uppercase tracking-widest text-[#A8D5BA] mb-2">Dein Blumenwesen</div>
            <div className="text-6xl mb-4 p-4 bg-white/5 rounded-full inline-block">{result.emoji || "🌸"}</div>
            <h1 className="text-3xl font-serif font-medium text-white mb-2">{result.title}</h1>
            <p className="text-[#E0E8E3] italic mb-4">{result.tagline}</p>
          </div>
          
          <div className="space-y-4 mb-8">
            {result.stats.map((stat, i) => (
              <div key={i} className="flex justify-between items-center text-sm text-[#E0E8E3]/80 border-b border-white/10 pb-2">
                <span>{stat.label}</span>
                <span className="font-semibold text-[#A8D5BA]">{stat.value}</span>
              </div>
            ))}
          </div>

          <p className="text-sm leading-relaxed text-[#E0E8E3] mb-8 bg-black/20 p-4 rounded-xl">
            {result.description}
          </p>

          <div className="flex flex-col gap-3">
            <AlchemyLinkButton href="/verticals/quiz" variant="primary">
              Zurück zur Übersicht
            </AlchemyLinkButton>
            <button onClick={resetQuiz} className="text-[#A8D5BA] text-sm hover:underline py-2">
              Test wiederholen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[600px] p-4 rounded-3xl bg-[#1A3C2F]">
      {microWin && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 text-[#A8D5BA] text-2xl font-serif animate-bounce">
          {microWin}
        </div>
      )}
      
      <div className="bg-[#E0E8E3] rounded-3xl p-6 min-h-[500px] flex flex-col shadow-xl">
        <div className="mb-6">
          <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-[#2D5A4C] mb-2">
            <span>Frage {currentQuestion + 1} / {questions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1 bg-[#C0D0C8] rounded-full overflow-hidden">
            <div className="h-full bg-[#2D5A4C] transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <h2 className="text-xl md:text-2xl font-serif font-medium text-[#1A3C2F] mb-2 leading-snug">
            {currentQ.text}
          </h2>
          {currentQ.context && (
            <p className="text-[#2D5A4C]/70 italic mb-8">{currentQ.context}</p>
          )}

          <div className="space-y-3">
            {currentQ.options.map(option => (
              <button
                key={option.id}
                onClick={() => handleAnswer(option)}
                className="w-full text-left p-4 rounded-xl border border-[#C0D0C8] hover:border-[#2D5A4C] hover:bg-[#F0F5F2] transition-all text-[#2D5A4C] font-medium group"
              >
                <div className="flex items-center justify-between">
                  <span>{option.text}</span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#2D5A4C]">➜</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

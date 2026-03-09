'use client';

import React, { useState } from 'react';
import {
  questions,
  quizMeta,
  calculateProfile,
  type DimensionScores
} from './energiestein/data';
import { contributeClient as contribute } from '@/lib/api';
import { useClusterProgress } from '@/lib/stores/useClusterProgress';
import { AlchemyButton, AlchemyLinkButton } from '@/components/ui/AlchemyButton';
import { ValidationProfile } from './types';

export function EnergiesteinQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState<DimensionScores>({ clarity: 0, energy: 0, focus: 0 });
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
        const keyStr = key as keyof DimensionScores;
        newScores[keyStr] = (newScores[keyStr] || 0) + (value as number);
      });
    }
    setScores(newScores);

    // Stone/Mineral themed feedbacks
    const wins = ["Kristallisiert...", "Schwingung erhöht...", "Verdichtet...", "Resonanz gefunden...", "Energie fließt..."];
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

        // Mark completion
        // NOTE: We are replacing "quiz.ahnenstein.v1" concept with "quiz.energiestein.v1"
        // in the cluster logic.
        completeQuiz("cluster.naturkind.v1", quizMeta.id, finalResult.id, finalResult.title);

        // Emit contribution
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
              { id: 'field.stone.type', value: finalResult.title, kind: 'text' },
              { id: 'field.stone.description', value: finalResult.tagline, kind: 'text' }
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
    setScores({ clarity: 0, energy: 0, focus: 0 });
    setShowResult(false);
    setResult(null);
    setStarted(false);
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const currentQ = questions[currentQuestion];

  if (!started) {
    return (
      <div className="min-h-[600px] flex items-center justify-center rounded-3xl p-6 relative overflow-hidden bg-gradient-to-br from-[#0D3B2E] to-[#1A5F4A]">
        {/* Crystal Glow Background Effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#C9A962]/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative z-10 max-w-lg w-full text-center text-[#FAF8F5]">
          <div className="mb-8 flex justify-center">
             <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="animate-pulse">
                <path d="M60 10 L95 45 L80 110 L40 110 L25 45 Z" fill="#C9A962" fillOpacity="0.3"/>
                <path d="M60 10 L95 45 L60 100 Z" fill="#C9A962" fillOpacity="0.5"/>
                <path d="M60 10 L25 45 L60 100 Z" fill="#C9A962" fillOpacity="0.7"/>
                <path d="M60 10 L95 45 M60 10 L25 45 M25 45 L60 100 M95 45 L60 100 M25 45 L40 110 M95 45 L80 110 M40 110 L80 110" 
                      stroke="#C9A962" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-serif font-medium mb-4 text-[#C9A962]">
            {quizMeta.title}
          </h1>
          <p className="text-lg mb-8 leading-relaxed opacity-90 max-w-md mx-auto text-[#E8D5A3]">
            {quizMeta.subtitle}
          </p>
          <AlchemyButton onClick={() => setStarted(true)}>
            Stein enthüllen
          </AlchemyButton>
        </div>
      </div>
    );
  }

  if (showResult && result) {
    return (
      <div className="min-h-[600px] rounded-3xl overflow-hidden bg-gradient-to-br from-[#0D3B2E] to-[#1A5F4A] p-6 flex flex-col items-center justify-center">
        <div className="bg-[#1A5F4A]/90 backdrop-blur-md rounded-3xl p-8 max-w-md w-full border border-[#C9A962]/30 shadow-2xl relative overflow-hidden">
          
          {/* Top Border Effect */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C9A962] via-[#E8D5A3] to-[#C9A962]"></div>

          <div className="text-center mb-6">
            <div className="text-xs font-semibold uppercase tracking-widest text-[#E8D5A3] mb-2">Dein Energiestein</div>
            <div className="text-6xl mb-4 p-4 bg-white/5 rounded-full inline-block">{result.emoji || "💎"}</div>
            <h1 className="text-3xl font-serif font-medium text-[#C9A962] mb-2">{result.title}</h1>
            <p className="text-[#E8D5A3] italic mb-4">{result.tagline}</p>
          </div>
          
          <div className="space-y-4 mb-8">
            {result.stats.map((stat, i) => (
              <div key={i} className="flex justify-between items-center text-sm text-[#FAF8F5]/80 border-b border-[#C9A962]/10 pb-2">
                <span className="uppercase tracking-wider text-[10px] text-[#E8D5A3]">{stat.label}</span>
                <span className="font-semibold text-[#C9A962] font-serif text-lg">{stat.value}{typeof stat.value === 'number' ? '%' : ''}</span>
              </div>
            ))}
          </div>

          <p className="text-sm leading-relaxed text-[#FAF8F5] mb-8 bg-black/20 p-4 rounded-xl">
            {result.description}
          </p>

          <div className="flex flex-col gap-3">
            <AlchemyLinkButton href="/verticals/quiz" variant="primary">
              Zurück zur Übersicht
            </AlchemyLinkButton>
            <button onClick={resetQuiz} className="text-[#E8D5A3] text-sm hover:underline py-2">
              Test wiederholen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[600px] p-4 rounded-3xl bg-[#0D3B2E]">
      {microWin && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 text-[#C9A962] text-2xl font-serif animate-bounce drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
          {microWin}
        </div>
      )}
      
      <div className="bg-[#FAF8F5] rounded-3xl p-6 min-h-[500px] flex flex-col shadow-xl">
        <div className="mb-6">
          <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-[#0D3B2E] mb-2">
            <span>Frage {currentQuestion + 1} / {questions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1 bg-[#E8D5A3]/50 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#C9A962] to-[#E8D5A3] transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <h2 className="text-xl md:text-2xl font-serif font-medium text-[#0D3B2E] mb-8 leading-snug text-center">
            {currentQ.text}
          </h2>

          <div className="space-y-3">
            {currentQ.options.map(option => (
              <button
                key={option.id}
                onClick={() => handleAnswer(option)}
                className="w-full text-left p-4 rounded-xl border border-[#C9A962]/20 hover:border-[#C9A962] hover:bg-[#C9A962]/10 transition-all text-[#0D3B2E] font-medium group"
              >
                <div className="flex items-center justify-between">
                    <span>{option.text}</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#C9A962]">➜</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

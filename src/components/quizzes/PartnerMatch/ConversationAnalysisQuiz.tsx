import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Users, Sparkles, Loader2, MessageSquare } from 'lucide-react';
import { useLanguage } from '@/src/contexts/LanguageContext';
import { conversationAnalysisToEvent } from '@/src/lib/fusion-ring/quiz-to-event';

interface ConversationAnalysisQuizProps {
  onComplete: (event: ContributionEvent) => void;
  onClose: () => void;
}

interface DialogueLine {
  speaker: 'Person A' | 'Person B';
  text: string;
}

interface AnalysisResult {
  lines: DialogueLine[];
  markersA: Marker[];
  markersB: Marker[];
  resonance: number; // 0..1
  summary: string;
}

export default function ConversationAnalysisQuiz({ onComplete, onClose }: ConversationAnalysisQuizProps) {
  const { lang } = useLanguage();
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!text.trim() || text.length < 20) {
      setError(lang === 'de' ? 'Bitte gib einen längeren Dialog ein (min. 20 Zeichen).' : 'Please enter a longer dialogue (min. 20 chars).');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang }),
      });

      if (!response.ok) throw new Error('Analysis failed');

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setError(lang === 'de' ? 'Analyse fehlgeschlagen. Bitte versuche es später erneut.' : 'Analysis failed. Please try again later.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFinish = () => {
    if (!result) return;

    const event = conversationAnalysisToEvent(
      result.markersA,
      result.markersB,
      result.resonance,
      result.summary,
      lang === 'de' ? 'de-DE' : 'en-US'
    );

    onComplete(event);
  };

  return (
    <div className="flex flex-col h-full bg-[#050A18] text-white p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="font-serif text-2xl mb-1 flex items-center gap-2">
            <MessageSquare className="w-6 h-4 text-[#9B3A6A]" />
            {lang === 'de' ? 'Gesprächs-Analyse' : 'Conversation Analysis'}
          </h2>
          <p className="text-xs text-white/40 uppercase tracking-widest">
            Partner Match — AI Integration
          </p>
        </div>
        <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
          ✕
        </button>
      </div>

      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <label className="block text-[10px] uppercase tracking-widest text-[#9B3A6A] mb-4 font-bold">
                {lang === 'de' ? 'Dialog kopieren & einfügen' : 'Paste Dialogue Here'}
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={lang === 'de' 
                  ? "Person A: Hallo!\nPerson B: Hi, wie geht's?\n..." 
                  : "Person A: Hello!\nPerson B: Hi, how are you?\n..."
                }
                className="w-full h-64 bg-transparent border-none focus:ring-0 text-sm leading-relaxed placeholder:text-white/20 resize-none"
              />
            </div>

            {error && (
              <p className="text-red-400 text-xs italic">{error}</p>
            )}

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !text.trim()}
              className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
              style={{
                background: 'linear-gradient(to right, #9B3A6A, #C45B8F)',
                boxShadow: '0 4px 20px rgba(155, 58, 106, 0.3)',
                opacity: isAnalyzing || !text.trim() ? 0.5 : 1
              }}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {lang === 'de' ? 'Sprecher werden getrennt...' : 'Separating Speakers...'}
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  {lang === 'de' ? 'Dialog analysieren' : 'Analyze Dialogue'}
                </>
              )}
            </button>

            <p className="text-[10px] text-white/30 text-center italic">
              {lang === 'de' 
                ? 'Die KI trennt automatisch zwischen dir und deinem Partner und erkennt semantische Muster.'
                : 'AI will automatically separate you and your partner and detect semantic patterns.'}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            {/* Resonance Score */}
            <div className="text-center py-4">
              <div className="relative inline-block">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64" cy="64" r="60"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="4"
                    fill="none"
                  />
                  <motion.circle
                    cx="64" cy="64" r="60"
                    stroke="#9B3A6A"
                    strokeWidth="4"
                    strokeDasharray="377"
                    initial={{ strokeDashoffset: 377 }}
                    animate={{ strokeDashoffset: 377 * (1 - result.resonance) }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-serif">{Math.round(result.resonance * 100)}%</span>
                  <span className="text-[8px] uppercase tracking-tighter opacity-50">Resonance</span>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white/5 border border-[#9B3A6A]/20 rounded-xl p-5">
              <p className="text-sm italic leading-relaxed text-white/90">
                "{result.summary}"
              </p>
            </div>

            {/* Dialogue View */}
            <div className="space-y-4">
              <h3 className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
                {lang === 'de' ? 'Erkannter Dialogverlauf' : 'Detected Dialogue Flow'}
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {result.lines.map((line, i) => (
                  <div key={i} className={`flex gap-3 ${line.speaker === 'Person B' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${line.speaker === 'Person B' ? 'bg-[#9B3A6A]/20' : 'bg-white/10'}`}>
                      {line.speaker === 'Person B' ? <Users className="w-4 h-4 text-[#9B3A6A]" /> : <User className="w-4 h-4" />}
                    </div>
                    <div className={`p-3 rounded-2xl text-xs max-w-[80%] ${line.speaker === 'Person B' ? 'bg-[#9B3A6A]/10 rounded-tr-none text-right' : 'bg-white/5 rounded-tl-none'}`}>
                      <p>{line.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleFinish}
              className="w-full py-4 rounded-xl font-bold bg-white text-[#050A18] hover:bg-white/90 transition-all"
            >
              {lang === 'de' ? 'Ergebnis übernehmen' : 'Apply Results'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

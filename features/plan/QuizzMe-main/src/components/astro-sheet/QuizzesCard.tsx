
import React from 'react';
import { CheckCircle, Play, ChevronRight, GraduationCap } from 'lucide-react';
import { QuizItem } from './types';
import { trackQuizEvent } from "@/lib/analytics/supabase";

interface QuizzesCardProps { quizzes: QuizItem[]; }

const QuizzesCard: React.FC<QuizzesCardProps> = ({ quizzes }) => {
  return (
    <div className="premium-card p-10 h-full flex flex-col">
      <div className="flex items-center gap-4 mb-10 border-b border-[#E6E0D8] pb-8">
        <div className="p-3 bg-[#F6F3EE] rounded-xl">
           <GraduationCap size={20} className="text-[#0E1B33]" />
        </div>
        <div>
          <h3 className="text-[11px] uppercase tracking-[0.4em] font-extrabold text-[#5A6477]">Nächste Schritte</h3>
          <div className="text-[9px] mono text-[#A1A1AA] mt-1">Focus: Development</div>
        </div>
      </div>

      <div className="space-y-10 flex-grow">
        {quizzes.map((quiz) => (
          <div key={quiz.id} className="relative group">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${quiz.status === 'completed' ? 'bg-[#7AA7A1]/10 text-[#7AA7A1]' : 'bg-[#C9A46A]/10 text-[#C9A46A] group-hover:bg-[#C9A46A] group-hover:text-white'}`}>
                  {quiz.status === 'completed' ? <CheckCircle size={16} /> : <Play size={14} fill="currentColor" />}
                </div>
                <span className="text-sm font-bold text-[#0E1B33] tracking-tight">{quiz.title}</span>
              </div>
              <span className="mono text-[10px] font-extrabold text-[#7AA7A1] uppercase tracking-widest">
                {quiz.status === 'completed' ? 'Done' : `${quiz.progress}%`}
              </span>
            </div>
            
            {quiz.recommendation && (
              <div className="pl-14">
                <p className="text-[12px] text-[#5A6477] italic leading-relaxed mb-6 font-light">
                  Analysten-Tipp: Schärfe deine <span className="text-[#0E1B33] font-bold underline decoration-[#C9A46A]/30">{quiz.recommendation}</span> für präzisere Ergebnisse.
                </p>
                <button
                  className="flex items-center justify-center gap-4 w-full py-4 bg-[#F6F3EE] hover:bg-[#0E1B33] hover:text-white rounded-2xl text-[10px] font-extrabold uppercase tracking-[0.3em] transition-all group/btn shadow-sm"
                  onClick={() => trackQuizEvent({ event: "quiz_cta_click", quizId: quiz.id, metadata: { title: quiz.title } })}
                >
                  Quiz fortsetzen
                  <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
            
            <div className="mt-8 h-[1px] w-full bg-[#E6E0D8]/40 last:hidden" />
          </div>
        ))}
      </div>

      <div className="mt-10 p-6 bg-[#F6F3EE] rounded-2xl border border-[#E6E0D8]/60 text-center">
         <p className="mono text-[9px] text-[#A1A1AA] uppercase tracking-[0.2em] font-bold">
            Neue Quizzes in 14:23h
         </p>
      </div>
    </div>
  );
};

export default QuizzesCard;

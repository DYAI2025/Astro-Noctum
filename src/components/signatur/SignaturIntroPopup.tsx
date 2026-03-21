import { motion } from 'motion/react';

const QUIZ_OPTIONS = [
  { keyword: 'expression', label: 'Ich drücke mich gerne kreativ aus' },
  { keyword: 'analytical', label: 'Ich analysiere gerne komplexe Zusammenhänge' },
  { keyword: 'harmony', label: 'Harmonie in Beziehungen ist mir sehr wichtig' },
  { keyword: 'adventure', label: 'Ich suche ständig neue Erfahrungen' },
] as const;

interface Props {
  onAnswer: (keyword: string) => void;
}

export function SignaturIntroPopup({ onAnswer }: Props) {
  return (
    <div
      data-testid="intro-backdrop"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-none"
      onKeyDown={(e) => { if (e.key === 'Escape') e.preventDefault(); }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="signatur-intro-heading"
        className="mx-6 max-w-md w-full rounded-2xl border border-gold/15 bg-obsidian/95 p-8 shadow-2xl pointer-events-auto"
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <h2 id="signatur-intro-heading" className="font-serif text-lg text-ink/90 mb-6 text-center">
          Was beschreibt dich am besten?
        </h2>

        <div className="space-y-3">
          {QUIZ_OPTIONS.map((opt) => (
            <button
              key={opt.keyword}
              onClick={() => onAnswer(opt.keyword)}
              className="w-full text-left px-5 py-4 rounded-xl border border-gold/10 bg-white/3 text-sm text-ink/70 hover:border-gold/30 hover:bg-gold/5 transition-all"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

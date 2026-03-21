import { motion } from 'motion/react';

interface Props {
  onDismiss: () => void;
}

export function SignaturExplainPopup({ onDismiss }: Props) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <motion.div
        className="mx-6 max-w-md w-full rounded-2xl border border-gold/15 bg-obsidian/95 p-8 shadow-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <p className="text-sm text-ink/80 leading-relaxed">
          Hier verfeinerst du deine grundlegenden Signaturenergien. Durch das
          Lösen dieser Fragen verfeinerst du deine Signatur und hast Zugriff auf
          tiefere Informationen deiner fundamentalen kosmischen Systeme.
        </p>

        <button
          onClick={onDismiss}
          className="mt-8 w-full px-6 py-2.5 border border-gold/25 text-gold text-[10px] uppercase tracking-[0.25em] rounded-lg hover:bg-gold/10 transition-colors"
        >
          VERSTANDEN
        </button>
      </motion.div>
    </div>
  );
}

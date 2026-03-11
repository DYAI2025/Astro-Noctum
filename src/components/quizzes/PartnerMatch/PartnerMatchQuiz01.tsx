import type { ContributionEvent } from '@/src/lib/lme/types';

export default function PartnerMatchQuiz01({ onClose }: { onComplete: (e: ContributionEvent) => void; onClose: () => void }) {
  return (
    <div className="text-gold p-8">
      Partner Match — Chemie &amp; Ausdruck (Coming Soon)
      <button onClick={onClose} className="block mt-4 text-sm text-gold/60">Close</button>
    </div>
  );
}

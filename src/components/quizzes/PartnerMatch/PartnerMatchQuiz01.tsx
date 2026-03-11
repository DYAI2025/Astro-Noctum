import type { ContributionEvent } from '@/src/lib/lme/types';
import PartnerMatchSeriesQuiz from './PartnerMatchSeriesQuiz';

export default function PartnerMatchQuiz01({ onComplete, onClose }: { onComplete: (e: ContributionEvent) => void; onClose: () => void }) {
  return <PartnerMatchSeriesQuiz onComplete={onComplete} onClose={onClose} quizIndex={1} />;
}

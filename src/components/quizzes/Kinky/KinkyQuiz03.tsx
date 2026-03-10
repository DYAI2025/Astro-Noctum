import type { ContributionEvent } from '@/src/lib/lme/types';
import KinkySeriesQuiz from './KinkySeriesQuiz';

export default function KinkyQuiz03({ onComplete, onClose }: { onComplete: (e: ContributionEvent) => void; onClose: () => void }) {
  return <KinkySeriesQuiz onComplete={onComplete} onClose={onClose} quizIndex={3} />;
}

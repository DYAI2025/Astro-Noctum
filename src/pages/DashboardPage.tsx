import { Dashboard } from '../components/Dashboard';
import { useFusionRingContext } from '../contexts/FusionRingContext';
import { useAppLayout } from '../contexts/AppLayoutContext';

export default function DashboardPage() {
  const layout = useAppLayout();
  const { signal, addQuizResult, completedModules } = useFusionRingContext();
  return (
    <Dashboard
      {...layout}
      fusionSignal={signal}
      onQuizComplete={addQuizResult}
      completedModules={completedModules}
    />
  );
}

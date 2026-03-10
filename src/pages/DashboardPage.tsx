import { Dashboard } from '../components/Dashboard';
import { useAppLayout } from '../contexts/AppLayoutContext';

export default function DashboardPage() {
  const layout = useAppLayout();
  return (
    <Dashboard
      {...layout}
    />
  );
}

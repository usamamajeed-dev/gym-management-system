import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';

export default function Placeholder() {
  return (
    <Screen>
      <EmptyState icon="clock-outline" title="Gym timings" message="Coming soon." />
    </Screen>
  );
}

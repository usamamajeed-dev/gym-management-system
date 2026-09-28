import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';

export default function Placeholder() {
  return (
    <Screen>
      <EmptyState icon="clock-outline" title="Registration received" message="Coming soon." />
    </Screen>
  );
}

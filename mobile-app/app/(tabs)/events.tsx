import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';

export default function Placeholder() {
  return (
    <Screen>
      <EmptyState icon="calendar-blank-outline" title="Events" message="Coming soon." />
    </Screen>
  );
}

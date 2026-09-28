import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';

export default function Placeholder() {
  return (
    <Screen>
      <EmptyState icon="shield-check-outline" title="Policies" message="Coming soon." />
    </Screen>
  );
}

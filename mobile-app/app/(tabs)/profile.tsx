import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';

export default function Placeholder() {
  return (
    <Screen>
      <EmptyState icon="account-circle-outline" title="Profile" message="Coming soon." />
    </Screen>
  );
}

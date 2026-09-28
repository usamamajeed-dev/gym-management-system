import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';

export default function Placeholder() {
  return (
    <Screen>
      <EmptyState icon="account-plus-outline" title="Register" message="Coming soon." />
    </Screen>
  );
}

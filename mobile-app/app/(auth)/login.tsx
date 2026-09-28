import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';

export default function Placeholder() {
  return (
    <Screen>
      <EmptyState icon="login" title="Log in" message="Coming soon." />
    </Screen>
  );
}

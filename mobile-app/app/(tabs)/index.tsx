import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';

export default function Placeholder() {
  return (
    <Screen>
      <EmptyState icon="home-outline" title="Home" message="Coming soon." />
    </Screen>
  );
}

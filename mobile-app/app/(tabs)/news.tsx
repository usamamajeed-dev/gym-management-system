import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';

export default function Placeholder() {
  return (
    <Screen>
      <EmptyState icon="newspaper-variant-outline" title="News" message="Coming soon." />
    </Screen>
  );
}

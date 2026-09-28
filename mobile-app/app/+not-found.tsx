import { Link, Stack } from 'expo-router';
import { Button } from 'react-native-paper';

import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';

export default function NotFound() {
  return (
    <Screen>
      <Stack.Screen options={{ title: 'Not found' }} />
      <EmptyState icon="map-marker-question-outline" title="Page not found" message="This screen doesn't exist.">
        <Link href="/" asChild>
          <Button mode="contained">Go home</Button>
        </Link>
      </EmptyState>
    </Screen>
  );
}

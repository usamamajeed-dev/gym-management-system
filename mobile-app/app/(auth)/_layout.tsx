import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/auth/AuthContext';
import { useAppTheme } from '@/theme/paperTheme';

/** Login, registration and the pending screen. Signed-in members go straight to the tabs. */
export default function AuthLayout() {
  const { status } = useAuth();
  const { app } = useAppTheme();

  if (status === 'signedIn') {
    return <Redirect href="/(tabs)" />;
  }

  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: app.background } }} />;
}

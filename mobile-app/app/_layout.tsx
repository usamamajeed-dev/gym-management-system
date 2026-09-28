import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/auth/AuthContext';
import { bindAppFocus, createQueryClient } from '@/auth/queryClient';
import { fontAssets, fonts } from '@/theme/fonts';
import { darkTheme, lightTheme, useAppTheme } from '@/theme/paperTheme';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? darkTheme : lightTheme;
  const [queryClient] = useState(createQueryClient);

  const [fontsLoaded, fontError] = useFonts(fontAssets);

  useEffect(() => bindAppFocus(), []);

  // The native splash stays up until fonts are ready (or failed: fall back to system fonts).
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider queryClient={queryClient}>
            <StatusBar style={theme.dark ? 'light' : 'dark'} />
            <RootNavigator />
          </AuthProvider>
        </QueryClientProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { status } = useAuth();
  const { app } = useAppTheme();

  // Keep the native splash up until we know whether the member is signed in.
  useEffect(() => {
    if (status !== 'loading') {
      void SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [status]);

  if (status === 'loading') {
    return null;
  }

  const signedIn = status === 'signedIn';

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: app.surface },
        headerTintColor: app.text,
        headerTitleStyle: { fontFamily: fonts.bold },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: app.background },
      }}
    >
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="timings" options={{ title: 'Gym timings' }} />
        <Stack.Screen name="policies" options={{ title: 'Policies' }} />
        <Stack.Screen name="events/[id]" options={{ title: 'Event' }} />
        <Stack.Screen name="contents/[id]" options={{ title: '' }} />
      </Stack.Protected>
    </Stack>
  );
}

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { ComponentProps } from 'react';
import { Platform } from 'react-native';

import { useAuth } from '@/auth/AuthContext';
import { fonts } from '@/theme/fonts';
import { useAppTheme } from '@/theme/paperTheme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const TABS: { name: string; title: string; icon: IconName; iconActive: IconName }[] = [
  { name: 'index', title: 'Home', icon: 'home-outline', iconActive: 'home' },
  { name: 'events', title: 'Events', icon: 'calendar-blank-outline', iconActive: 'calendar-blank' },
  { name: 'news', title: 'News', icon: 'newspaper-variant-outline', iconActive: 'newspaper-variant' },
  { name: 'profile', title: 'Profile', icon: 'account-circle-outline', iconActive: 'account-circle' },
];

/** Bottom tabs for signed-in members. Signed-out members are sent to login. */
export default function TabsLayout() {
  const { status } = useAuth();
  const { app } = useAppTheme();

  if (status !== 'signedIn') {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: app.surface },
        headerTitleStyle: { fontFamily: fonts.bold, color: app.text },
        headerShadowVisible: false,
        tabBarActiveTintColor: app.primary,
        tabBarInactiveTintColor: app.textFaint,
        tabBarLabelStyle: { fontSize: 11.5, fontFamily: fonts.semibold },
        tabBarStyle: {
          backgroundColor: app.surface,
          borderTopColor: app.border,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
        },
        sceneStyle: { backgroundColor: app.background },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            headerShown: tab.name !== 'index',
            tabBarIcon: ({ color, focused, size }) => (
              <MaterialCommunityIcons name={focused ? tab.iconActive : tab.icon} color={color} size={size} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

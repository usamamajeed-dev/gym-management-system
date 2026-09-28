import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/theme/paperTheme';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

type Step = {
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
  text: string;
  state: 'done' | 'current' | 'next';
};

/** Shown after registering: explains that an admin has to approve the membership first. */
export default function PendingScreen() {
  const { app } = useAppTheme();
  const { message, email } = useLocalSearchParams<{ message?: string; email?: string }>();

  const steps: Step[] = [
    { icon: 'check', title: 'Registration submitted', text: 'We have your details.', state: 'done' },
    {
      icon: 'account-search-outline',
      title: 'Admin review',
      text: 'The gym checks and approves new members.',
      state: 'current',
    },
    { icon: 'login', title: 'Log in to the app', text: "You'll get an email once you're approved.", state: 'next' },
  ];

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: app.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.illustration}>
          <View style={[styles.ringOuter, { backgroundColor: app.primarySoft }]}>
            <View style={[styles.ringInner, { backgroundColor: app.primary }]}>
              <MaterialCommunityIcons name="clock-check-outline" size={44} color="#FFFFFF" />
            </View>
          </View>
          <View style={[styles.badge, { backgroundColor: app.accent }]}>
            <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
          </View>
        </View>

        <Text style={[typography.title, styles.center, { color: app.text }]}>Registration received</Text>
        <Text style={[typography.body, styles.center, styles.message, { color: app.textMuted }]}>
          {message ?? 'You can log in once an admin approves your membership.'}
        </Text>
        {email ? (
          <View style={[styles.email, { backgroundColor: app.surface, borderColor: app.border }]}>
            <MaterialCommunityIcons name="email-outline" size={18} color={app.primary} />
            <Text style={[typography.label, { color: app.text }]} numberOfLines={1}>
              {email}
            </Text>
          </View>
        ) : null}

        <View style={[styles.steps, { backgroundColor: app.surface, borderColor: app.border }]}>
          {steps.map((step, index) => {
            const color = step.state === 'done' ? app.success : step.state === 'current' ? app.accent : app.textFaint;
            const soft =
              step.state === 'done' ? app.successSoft : step.state === 'current' ? app.accentSoft : app.neutralSoft;
            return (
              <View key={step.title} style={styles.step}>
                <View style={styles.stepRail}>
                  <View style={[styles.stepIcon, { backgroundColor: soft }]}>
                    <MaterialCommunityIcons name={step.icon} size={18} color={color} />
                  </View>
                  {index < steps.length - 1 ? (
                    <View style={[styles.stepLine, { backgroundColor: app.border }]} />
                  ) : null}
                </View>
                <View style={styles.stepText}>
                  <Text style={[typography.subheading, { color: app.text }]}>{step.title}</Text>
                  <Text style={[typography.bodySmall, { color: app.textMuted }]}>{step.text}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <Button
          mode="contained"
          onPress={() => router.replace('/login')}
          style={styles.button}
          contentStyle={styles.buttonContent}
          icon="arrow-left"
        >
          Back to login
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.xxl },
  illustration: { alignSelf: 'center', marginBottom: spacing.xxl },
  ringOuter: { width: 128, height: 128, borderRadius: 64, alignItems: 'center', justifyContent: 'center' },
  ringInner: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    right: 6,
    bottom: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  center: { textAlign: 'center' },
  message: { marginTop: spacing.sm },
  email: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    maxWidth: '100%',
  },
  steps: {
    marginTop: spacing.xxl,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  step: { flexDirection: 'row', gap: spacing.md },
  stepRail: { alignItems: 'center' },
  stepIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  stepLine: { width: 2, flex: 1, minHeight: 18, marginVertical: 4 },
  stepText: { flex: 1, paddingTop: 7, paddingBottom: spacing.md, gap: 2 },
  button: { marginTop: spacing.xxl, borderRadius: radius.md },
  buttonContent: { height: 50 },
});

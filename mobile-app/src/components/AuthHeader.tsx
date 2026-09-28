import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '../theme/paperTheme';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { BrandMark } from './BrandMark';

/** Gradient header for the auth screens: logo, title and a short line of copy. */
export function AuthHeader({ title, subtitle }: { title: string; subtitle: string }) {
  const { app } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={app.hero}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.hero, { paddingTop: insets.top + spacing.xxl }]}
    >
      <View style={styles.glow} />
      <View style={styles.brandRow}>
        <BrandMark size={44} />
        <Text style={styles.brandName}>Gym Member</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: 56,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    right: -70,
    bottom: -90,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(249, 115, 22, 0.28)',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xxl },
  brandName: { ...typography.heading, color: '#FFFFFF' },
  title: { ...typography.display, color: '#FFFFFF' },
  subtitle: { ...typography.body, color: '#C7D2FE', marginTop: spacing.xs },
});

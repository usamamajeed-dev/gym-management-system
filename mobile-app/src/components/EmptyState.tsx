import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ComponentProps, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../theme/paperTheme';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  message?: string;
  children?: ReactNode;
  compact?: boolean;
}

/** Friendly placeholder for empty lists, with optional actions. */
export function EmptyState({ icon = 'inbox-outline', title, message, children, compact }: EmptyStateProps) {
  const { app } = useAppTheme();

  return (
    <View style={[styles.state, compact && styles.compact]}>
      <View style={[styles.iconWrap, { backgroundColor: app.primarySoft }]}>
        <MaterialCommunityIcons name={icon} size={26} color={app.primary} />
      </View>
      <Text style={[typography.heading, { color: app.text, textAlign: 'center' }]}>{title}</Text>
      {message ? <Text style={[typography.bodySmall, styles.message, { color: app.textMuted }]}>{message}</Text> : null}
      {children}
    </View>
  );
}

export const stateStyles = StyleSheet.create({
  state: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: spacing.xxl,
    gap: spacing.sm,
  },
  compact: { paddingVertical: spacing.xxl },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  message: { textAlign: 'center', maxWidth: 300 },
});

const styles = stateStyles;

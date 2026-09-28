import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { PASSWORD_RULES } from '../auth/registerSchema';
import { useAppTheme } from '../theme/paperTheme';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

/** Ticks off each password rule as the member types. */
export function PasswordChecklist({ password }: { password: string }) {
  const { app } = useAppTheme();

  return (
    <View style={styles.list} accessibilityLabel="Password requirements">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(password);
        return (
          <View key={rule.key} style={styles.item}>
            <MaterialCommunityIcons
              name={ok ? 'check-circle' : 'circle-outline'}
              size={16}
              color={ok ? app.success : app.textFaint}
            />
            <Text style={[typography.caption, { color: ok ? app.success : app.textMuted }]}>{rule.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: spacing.lg,
    rowGap: 6,
    marginBottom: spacing.md,
    paddingHorizontal: 4,
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: '45%' },
});

import { StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-paper';

import { useAppTheme } from '../theme/paperTheme';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

/** Section title with an optional "See all" action. */
export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const { app } = useAppTheme();

  return (
    <View style={styles.row}>
      <Text style={[typography.heading, { color: app.text }]}>{title}</Text>
      {action && onAction ? (
        <Button compact mode="text" onPress={onAction} icon="chevron-right" contentStyle={styles.action}>
          {action}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
  },
  action: { flexDirection: 'row-reverse' },
});

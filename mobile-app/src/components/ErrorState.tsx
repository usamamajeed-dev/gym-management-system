import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-paper';

import { useAppTheme } from '../theme/paperTheme';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { stateStyles } from './EmptyState';

/** Error with a retry button. */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { app } = useAppTheme();

  return (
    <View style={stateStyles.state}>
      <View style={[stateStyles.iconWrap, { backgroundColor: app.dangerSoft }]}>
        <MaterialCommunityIcons name="cloud-off-outline" size={26} color={app.danger} />
      </View>
      <Text style={[typography.heading, { color: app.text, textAlign: 'center' }]}>Something went wrong</Text>
      <Text style={[typography.bodySmall, stateStyles.message, { color: app.textMuted }]}>{message}</Text>
      {onRetry ? (
        <Button mode="contained" onPress={onRetry} style={styles.button} icon="refresh">
          Try again
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  button: { marginTop: spacing.md, borderRadius: radius.md },
});

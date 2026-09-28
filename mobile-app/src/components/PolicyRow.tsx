import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { ContentListItem } from '../api/types';
import { useAppTheme } from '../theme/paperTheme';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { formatDate } from '../utils/dates';
import { Card } from './Card';

/** Compact policy row: icon, title and last update. */
export function PolicyRow({ item, onPress }: { item: ContentListItem; onPress: () => void }) {
  const { app } = useAppTheme();
  const archived = item.status === 'archived';

  return (
    <Card onPress={onPress} accessibilityLabel={item.title}>
      <View style={styles.row}>
        <View style={[styles.icon, { backgroundColor: archived ? app.neutralSoft : app.accentSoft }]}>
          <MaterialCommunityIcons
            name={archived ? 'archive-outline' : 'shield-check-outline'}
            size={22}
            color={archived ? app.textMuted : app.accent}
          />
        </View>
        <View style={styles.body}>
          <Text style={[typography.subheading, { color: app.text }]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={[typography.caption, { color: app.textMuted }]}>
            {archived && item.archived_at
              ? `Archived ${formatDate(item.archived_at, 'd MMM yyyy')}`
              : `Updated ${formatDate(item.published_at ?? item.created_at, 'd MMM yyyy')}`}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color={app.textFaint} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  icon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 2 },
});

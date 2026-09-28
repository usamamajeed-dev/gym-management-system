import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { ContentListItem } from '../api/types';
import { useAppTheme } from '../theme/paperTheme';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { formatDate } from '../utils/dates';
import { Card } from './Card';

/** News/policy summary: thumbnail (or type icon), title, excerpt and date. */
export function ContentCard({ item, onPress }: { item: ContentListItem; onPress?: () => void }) {
  const { app } = useAppTheme();
  const isPolicy = item.type === 'policy';

  return (
    <Card onPress={onPress} accessibilityLabel={item.title}>
      <View style={styles.row}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.thumb} contentFit="cover" transition={150} />
        ) : (
          <View
            style={[styles.thumb, styles.placeholder, { backgroundColor: isPolicy ? app.accentSoft : app.primarySoft }]}
          >
            <MaterialCommunityIcons
              name={isPolicy ? 'shield-check-outline' : 'newspaper-variant-outline'}
              size={26}
              color={isPolicy ? app.accent : app.primary}
            />
          </View>
        )}
        <View style={styles.body}>
          <Text style={[typography.subheading, { color: app.text }]} numberOfLines={2}>
            {item.title}
          </Text>
          {item.excerpt ? (
            <Text style={[typography.bodySmall, { color: app.textMuted }]} numberOfLines={2}>
              {item.excerpt}
            </Text>
          ) : null}
          <View style={styles.footer}>
            <Text style={[typography.caption, { color: app.textFaint }]}>
              {item.published_at ? formatDate(item.published_at, 'd MMM yyyy') : ''}
            </Text>
            {item.status === 'archived' ? (
              <View style={[styles.tag, { backgroundColor: app.neutralSoft }]}>
                <MaterialCommunityIcons name="archive-outline" size={12} color={app.textMuted} />
                <Text style={[typography.caption, { color: app.textMuted }]}>Archived</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md, padding: spacing.md },
  thumb: { width: 84, height: 84, borderRadius: radius.md },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 4 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 'auto' },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
});

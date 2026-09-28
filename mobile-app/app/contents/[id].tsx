import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-paper';

import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { HtmlBody } from '@/components/HtmlBody';
import { LoadingState } from '@/components/LoadingState';
import { StatusBanner } from '@/components/StatusBanner';
import { useContent } from '@/hooks/useContents';
import { useRefresh } from '@/hooks/useRefresh';
import { useAppTheme } from '@/theme/paperTheme';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { formatDate } from '@/utils/dates';
import { toApiError } from '@/utils/errors';

export default function ContentDetailScreen() {
  const { app } = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useContent(Number(id));
  const { refreshing, onRefresh } = useRefresh(query.refetch);

  if (query.isPending) {
    return (
      <View style={[styles.root, styles.padded, { backgroundColor: app.background }]}>
        <LoadingState rows={2} />
      </View>
    );
  }

  if (query.isError) {
    const error = toApiError(query.error);
    return (
      <View style={[styles.root, styles.center, { backgroundColor: app.background }]}>
        {error.status === 404 ? (
          <EmptyState
            icon="file-remove-outline"
            title="No longer available"
            message="This item was removed or is not published any more."
          >
            <Button mode="contained" onPress={() => router.back()} style={styles.back} icon="arrow-left">
              Back
            </Button>
          </EmptyState>
        ) : (
          <ErrorState message={error.message} onRetry={() => query.refetch()} />
        )}
      </View>
    );
  }

  const content = query.data;
  const isPolicy = content.type === 'policy';
  const noun = isPolicy ? 'policy' : 'news item';

  return (
    <ScrollView
      style={{ backgroundColor: app.background }}
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={app.primary} />}
    >
      <Stack.Screen options={{ title: isPolicy ? 'Policy' : 'News' }} />

      {content.image_url ? (
        <Image
          source={{ uri: content.image_url }}
          style={styles.hero}
          contentFit="cover"
          transition={200}
          accessibilityLabel={content.title}
        />
      ) : null}

      <View style={styles.body}>
        {content.status === 'archived' ? (
          <StatusBanner tone="warning" message={`This ${noun} has been archived and may be out of date.`} />
        ) : null}

        <View style={styles.meta}>
          <View style={[styles.typePill, { backgroundColor: isPolicy ? app.accentSoft : app.primarySoft }]}>
            <MaterialCommunityIcons
              name={isPolicy ? 'shield-check-outline' : 'newspaper-variant-outline'}
              size={14}
              color={isPolicy ? app.accent : app.primary}
            />
            <Text style={[typography.caption, { color: isPolicy ? app.accent : app.primary }]}>
              {isPolicy ? 'Policy' : 'News'}
            </Text>
          </View>
          {content.published_at ? (
            <Text style={[typography.caption, { color: app.textMuted }]}>
              {formatDate(content.published_at, 'd MMMM yyyy')}
            </Text>
          ) : null}
        </View>

        <Text style={[typography.title, { color: app.text }]}>{content.title}</Text>
        {content.excerpt ? (
          <Text style={[typography.body, styles.excerpt, { color: app.textMuted }]}>{content.excerpt}</Text>
        ) : null}

        <View style={[styles.divider, { backgroundColor: app.border }]} />
        <HtmlBody html={content.body} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  padded: { padding: spacing.lg },
  center: { justifyContent: 'center' },
  back: { marginTop: spacing.lg, borderRadius: radius.md },
  scroll: { paddingBottom: spacing.xxxl },
  hero: { width: '100%', aspectRatio: 16 / 9 },
  body: { padding: spacing.lg, gap: spacing.md },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  excerpt: { marginTop: -spacing.xs },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: spacing.xs },
});

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ComponentProps } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-paper';

import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { useEvent } from '@/hooks/useEvents';
import { useRefresh } from '@/hooks/useRefresh';
import { useAppTheme } from '@/theme/paperTheme';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { formatDate, formatRange } from '@/utils/dates';
import { toApiError } from '@/utils/errors';
import { isFinished } from '@/utils/events';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export default function EventDetailScreen() {
  const { app } = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useEvent(Number(id));
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
            icon="calendar-remove-outline"
            title="This event is no longer available"
            message="It may have been cancelled or unpublished by the gym."
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

  const event = query.data;
  const color = event.event_type?.color ?? app.primary;
  const finished = isFinished(event);

  return (
    <ScrollView
      style={{ backgroundColor: app.background }}
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={app.primary} />}
    >
      <Stack.Screen options={{ title: event.event_type?.title ?? 'Event' }} />

      {event.image_url ? (
        <Image
          source={{ uri: event.image_url }}
          style={styles.hero}
          contentFit="cover"
          transition={200}
          accessibilityLabel={event.title}
        />
      ) : (
        <LinearGradient
          colors={[color, app.hero[1]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, styles.heroFallback]}
        >
          <MaterialCommunityIcons name="calendar-star" size={56} color="rgba(255,255,255,0.9)" />
        </LinearGradient>
      )}

      <View style={styles.body}>
        <View style={styles.badges}>
          {event.event_type ? (
            <View style={[styles.badge, { backgroundColor: color + '1F' }]}>
              <View style={[styles.dot, { backgroundColor: color }]} />
              <Text style={[typography.label, { color }]}>{event.event_type.title}</Text>
            </View>
          ) : null}
          {finished ? (
            <View style={[styles.badge, { backgroundColor: app.neutralSoft }]}>
              <Text style={[typography.label, { color: app.textMuted }]}>Finished</Text>
            </View>
          ) : null}
        </View>

        <Text style={[typography.title, { color: app.text }]}>{event.title}</Text>

        <Card style={styles.info}>
          <InfoRow icon="calendar-month-outline" label="Date" value={formatDate(event.starts_at, 'EEEE d MMMM yyyy')} />
          <InfoRow icon="clock-outline" label="Time" value={formatRange(event.starts_at, event.ends_at)} />
          {event.location ? <InfoRow icon="map-marker-outline" label="Location" value={event.location} /> : null}
          {event.capacity ? (
            <InfoRow icon="account-group-outline" label="Capacity" value={`${event.capacity} people`} last />
          ) : null}
        </Card>

        {event.description ? (
          <View style={styles.about}>
            <Text style={[typography.overline, { color: app.textFaint }]}>About this event</Text>
            <Text style={[typography.body, { color: app.textSecondary }]}>{event.description}</Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

function InfoRow({ icon, label, value, last }: { icon: IconName; label: string; value: string; last?: boolean }) {
  const { app } = useAppTheme();
  return (
    <View style={[styles.row, !last && { borderBottomColor: app.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
      <View style={[styles.rowIcon, { backgroundColor: app.primarySoft }]}>
        <MaterialCommunityIcons name={icon} size={18} color={app.primary} />
      </View>
      <View style={styles.rowText}>
        <Text style={[typography.caption, { color: app.textMuted }]}>{label}</Text>
        <Text style={[typography.subheading, { color: app.text }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  padded: { padding: spacing.lg },
  center: { justifyContent: 'center' },
  back: { marginTop: spacing.lg, borderRadius: radius.md },
  scroll: { paddingBottom: spacing.xxxl },
  hero: { width: '100%', aspectRatio: 16 / 9 },
  heroFallback: { alignItems: 'center', justifyContent: 'center' },
  body: { padding: spacing.lg, gap: spacing.md },
  badges: { flexDirection: 'row', gap: spacing.sm },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  info: { paddingHorizontal: spacing.lg, marginTop: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  rowIcon: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, gap: 1 },
  about: { gap: spacing.sm, marginTop: spacing.sm },
});

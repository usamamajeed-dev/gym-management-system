import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { GymEvent } from '../api/types';
import { useAppTheme } from '../theme/paperTheme';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { formatDate, formatRange } from '../utils/dates';
import { Card } from './Card';

interface EventCardProps {
  event: GymEvent;
  onPress?: () => void;
  /** Past events render muted with a "Finished" label. */
  finished?: boolean;
  /** Hide the date block when the list is already grouped by day. */
  showDate?: boolean;
}

/** Event summary: type colour stripe, date block, title, time range and location. */
export function EventCard({ event, onPress, finished = false, showDate = true }: EventCardProps) {
  const { app } = useAppTheme();
  const color = event.event_type?.color ?? app.primary;

  return (
    <Card onPress={onPress} accessibilityLabel={`${event.title}, ${formatDate(event.starts_at)}`} style={styles.card}>
      <View style={[styles.stripe, { backgroundColor: color }]} />
      <View style={[styles.row, finished && styles.finished]}>
        {showDate ? (
          <View style={[styles.date, { backgroundColor: color + '1F' }]}>
            <Text style={[styles.day, { color }]}>{formatDate(event.starts_at, 'd')}</Text>
            <Text style={[styles.month, { color }]}>{formatDate(event.starts_at, 'MMM')}</Text>
          </View>
        ) : null}
        <View style={styles.body}>
          <View style={styles.badges}>
            {event.event_type ? (
              <View style={[styles.badge, { backgroundColor: color + '1F' }]}>
                <View style={[styles.dot, { backgroundColor: color }]} />
                <Text style={[typography.caption, { color }]}>{event.event_type.title}</Text>
              </View>
            ) : null}
            {finished ? (
              <View style={[styles.badge, { backgroundColor: app.neutralSoft }]}>
                <Text style={[typography.caption, { color: app.textMuted }]}>Finished</Text>
              </View>
            ) : null}
          </View>
          <Text style={[typography.subheading, { color: app.text }]} numberOfLines={2}>
            {event.title}
          </Text>
          <View style={styles.meta}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={app.textMuted} />
            <Text style={[typography.bodySmall, { color: app.textMuted }]}>
              {showDate ? `${formatDate(event.starts_at, 'EEE')} · ` : ''}
              {formatRange(event.starts_at, event.ends_at)}
            </Text>
          </View>
          {event.location ? (
            <View style={styles.meta}>
              <MaterialCommunityIcons name="map-marker-outline" size={14} color={app.textMuted} />
              <Text style={[typography.bodySmall, { color: app.textMuted }]} numberOfLines={1}>
                {event.location}
              </Text>
            </View>
          ) : null}
        </View>
        {onPress ? <MaterialCommunityIcons name="chevron-right" size={22} color={app.textFaint} /> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden' },
  stripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, paddingLeft: spacing.lg },
  finished: { opacity: 0.55 },
  date: { width: 50, height: 56, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  day: { ...typography.heading, fontSize: 19, lineHeight: 22 },
  month: { ...typography.overline, fontSize: 10.5 },
  body: { flex: 1, gap: 3 },
  badges: { flexDirection: 'row', gap: spacing.xs, marginBottom: 2 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
});

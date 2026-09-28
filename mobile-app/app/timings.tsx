import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { Screen } from '@/components/Screen';
import { TimingRow } from '@/components/TimingRow';
import { useGymTimings } from '@/hooks/useGymTimings';
import { useRefresh } from '@/hooks/useRefresh';
import { useAppTheme } from '@/theme/paperTheme';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { toApiError } from '@/utils/errors';

export default function TimingsScreen() {
  const { app } = useAppTheme();
  const query = useGymTimings();
  const { refreshing, onRefresh } = useRefresh(query.refetch);

  if (query.isPending) {
    return (
      <Screen>
        <LoadingState rows={5} />
      </Screen>
    );
  }

  if (query.isError) {
    return (
      <Screen onRefresh={onRefresh} refreshing={refreshing}>
        <ErrorState message={toApiError(query.error).message} onRetry={() => query.refetch()} />
      </Screen>
    );
  }

  const { timings, today_day_of_week, is_open_now, timezone } = query.data;

  return (
    <Screen onRefresh={onRefresh} refreshing={refreshing}>
      <Card style={styles.header}>
        <View style={[styles.icon, { backgroundColor: is_open_now ? app.successSoft : app.neutralSoft }]}>
          <MaterialCommunityIcons
            name={is_open_now ? 'door-open' : 'door-closed'}
            size={26}
            color={is_open_now ? app.success : app.textMuted}
          />
        </View>
        <View style={styles.flex}>
          <View style={[styles.chip, { backgroundColor: is_open_now ? app.successSoft : app.neutralSoft }]}>
            <View style={[styles.dot, { backgroundColor: is_open_now ? app.success : app.textFaint }]} />
            <Text style={[typography.label, { color: is_open_now ? app.success : app.textMuted }]}>
              {is_open_now ? 'Open now' : 'Closed now'}
            </Text>
          </View>
          <View style={styles.tz}>
            <MaterialCommunityIcons name="earth" size={14} color={app.textMuted} />
            <Text style={[typography.caption, { color: app.textMuted }]}>Times shown in {timezone}</Text>
          </View>
        </View>
      </Card>

      <Text style={[typography.overline, styles.section, { color: app.textFaint }]}>This week</Text>
      <Card style={styles.list}>
        {timings.map((timing) => (
          <TimingRow key={timing.day_of_week} timing={timing} isToday={timing.day_of_week === today_day_of_week} />
        ))}
      </Card>
      <Text style={[typography.caption, styles.note, { color: app.textFaint }]}>
        Hours can change on public holidays. Pull down to refresh.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 6 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  icon: { width: 52, height: 52, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  tz: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  section: { marginTop: spacing.xxl, marginBottom: spacing.sm, marginLeft: spacing.xs },
  list: { padding: spacing.xs, gap: 2 },
  note: { textAlign: 'center', marginTop: spacing.lg },
});

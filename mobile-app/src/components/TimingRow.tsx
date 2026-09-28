import { StyleSheet, Text, View } from 'react-native';

import { GymTiming } from '../api/types';
import { useAppTheme } from '../theme/paperTheme';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

/** One weekday's opening hours. Today is highlighted; closed days are muted. */
export function TimingRow({ timing, isToday }: { timing: GymTiming; isToday: boolean }) {
  const { app } = useAppTheme();
  const closed = timing.is_closed || !timing.opens_at || !timing.closes_at;

  return (
    <View
      testID={`timing-${timing.day_of_week}`}
      accessibilityLabel={`${timing.day_name}${isToday ? ', today' : ''}: ${closed ? 'closed' : `${timing.opens_at} to ${timing.closes_at}`}`}
      style={[styles.row, isToday && { backgroundColor: app.primarySoft, borderColor: app.primary + '40' }]}
    >
      <View style={styles.day}>
        <Text style={[typography.subheading, { color: closed ? app.textFaint : app.text }]}>{timing.day_name}</Text>
        {isToday ? (
          <View style={[styles.today, { backgroundColor: app.primary }]}>
            <Text style={[typography.caption, styles.todayText]}>Today</Text>
          </View>
        ) : null}
      </View>
      {closed ? (
        <Text style={[typography.label, { color: app.textFaint }]}>Closed</Text>
      ) : (
        <Text style={[typography.label, { color: isToday ? app.primary : app.textSecondary }]}>
          {timing.opens_at} – {timing.closes_at}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  day: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  today: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill },
  todayText: { color: '#FFFFFF' },
});

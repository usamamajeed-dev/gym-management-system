import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, SectionList, StyleSheet, Text, View } from 'react-native';

import { EventTypeOption } from '@/api/types';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { EventCard } from '@/components/EventCard';
import { LoadingState } from '@/components/LoadingState';
import { useEvents } from '@/hooks/useEvents';
import { useRefresh } from '@/hooks/useRefresh';
import { useAppTheme } from '@/theme/paperTheme';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { gymDayKey } from '@/utils/dates';
import { toApiError } from '@/utils/errors';
import { groupEventsByDay, isFinished, monthDiff, monthTitle, shiftMonth } from '@/utils/events';

/** How far members can browse from the current month. */
const MAX_OFFSET = 2;

export default function EventsScreen() {
  const { app } = useAppTheme();
  // The first response tells us the current month in gym time.
  const [currentMonth, setCurrentMonth] = useState<string | null>(null);
  const [month, setMonth] = useState<string | undefined>(undefined);
  const [typeFilter, setTypeFilter] = useState<number | null>(null);

  const query = useEvents(month);
  const { refreshing, onRefresh } = useRefresh(query.refetch);

  const shownMonth = query.data?.month ?? month ?? currentMonth;
  if (!currentMonth && !month && query.data?.month) {
    setCurrentMonth(query.data.month);
  }
  const offset = currentMonth && shownMonth ? monthDiff(currentMonth, shownMonth) : 0;

  const types = useMemo(() => {
    const map = new Map<number, EventTypeOption>();
    for (const e of query.data?.events ?? []) if (e.event_type) map.set(e.event_type.value, e.event_type);
    return [...map.values()].sort((a, b) => a.title.localeCompare(b.title));
  }, [query.data]);

  const sections = useMemo(() => {
    const events = (query.data?.events ?? []).filter((e) => typeFilter === null || e.event_type?.value === typeFilter);
    return groupEventsByDay(events);
  }, [query.data, typeFilter]);

  const todayKey = gymDayKey(new Date().toISOString());

  const go = (delta: number) => {
    if (!shownMonth) return;
    setTypeFilter(null);
    setMonth(shiftMonth(shownMonth, delta));
  };

  const header = (
    <View>
      <Card style={styles.monthCard}>
        <MonthButton
          icon="chevron-left"
          disabled={!shownMonth || offset <= -MAX_OFFSET}
          onPress={() => go(-1)}
          label="Previous month"
        />
        <View style={styles.monthCenter}>
          <Text style={[typography.overline, { color: app.textFaint }]}>
            {offset === 0 ? 'This month' : offset < 0 ? 'Past month' : 'Coming up'}
          </Text>
          <Text style={[typography.heading, { color: app.text }]}>{shownMonth ? monthTitle(shownMonth) : ' '}</Text>
        </View>
        <MonthButton
          icon="chevron-right"
          disabled={!shownMonth || offset >= MAX_OFFSET}
          onPress={() => go(1)}
          label="Next month"
        />
      </Card>

      {offset !== 0 && currentMonth ? (
        <Pressable
          onPress={() => {
            setTypeFilter(null);
            setMonth(undefined);
          }}
          style={[styles.backPill, { backgroundColor: app.primarySoft }]}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="calendar-today" size={15} color={app.primary} />
          <Text style={[typography.label, { color: app.primary }]}>Back to this month</Text>
        </Pressable>
      ) : null}

      {types.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label="All" active={typeFilter === null} onPress={() => setTypeFilter(null)} />
          {types.map((t) => (
            <Chip
              key={t.value}
              label={t.title}
              color={t.color}
              active={typeFilter === t.value}
              onPress={() => setTypeFilter(typeFilter === t.value ? null : t.value)}
            />
          ))}
        </ScrollView>
      ) : null}
    </View>
  );

  if (query.isPending) {
    return (
      <View style={[styles.root, styles.padded, { backgroundColor: app.background }]}>
        <LoadingState rows={4} />
      </View>
    );
  }

  if (query.isError && !query.data) {
    return (
      <View style={[styles.root, styles.padded, { backgroundColor: app.background }]}>
        <ErrorState message={toApiError(query.error).message} onRetry={() => query.refetch()} />
      </View>
    );
  }

  return (
    <SectionList
      style={{ backgroundColor: app.background }}
      contentContainerStyle={styles.padded}
      sections={sections}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={header}
      stickySectionHeadersEnabled={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={app.primary} colors={[app.primary]} />
      }
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Text style={[typography.subheading, { color: app.text }]}>{section.title}</Text>
          {section.key === todayKey ? (
            <View style={[styles.todayPill, { backgroundColor: app.accent }]}>
              <Text style={[typography.caption, styles.todayText]}>Today</Text>
            </View>
          ) : null}
        </View>
      )}
      renderItem={({ item }) => (
        <View style={styles.item}>
          <EventCard
            event={item}
            showDate={false}
            finished={isFinished(item)}
            onPress={() => router.push(`/events/${item.id}`)}
          />
        </View>
      )}
      ListEmptyComponent={
        <Card>
          <EmptyState
            icon="calendar-blank-outline"
            title={`No events scheduled for ${shownMonth ? monthTitle(shownMonth) : 'this month'}`}
            message={
              typeFilter !== null
                ? 'Try another type, or show all events.'
                : 'Check back soon — new events are added regularly.'
            }
          />
        </Card>
      }
    />
  );
}

function MonthButton({
  icon,
  disabled,
  onPress,
  label,
}: {
  icon: 'chevron-left' | 'chevron-right';
  disabled: boolean;
  onPress: () => void;
  label: string;
}) {
  const { app } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.monthButton, { backgroundColor: app.surfaceMuted, opacity: disabled ? 0.35 : 1 }]}
    >
      <MaterialCommunityIcons name={icon} size={24} color={app.text} />
    </Pressable>
  );
}

function Chip({
  label,
  active,
  onPress,
  color,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  color?: string;
}) {
  const { app } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[
        styles.chip,
        { borderColor: active ? app.primary : app.border, backgroundColor: active ? app.primary : app.surface },
      ]}
    >
      {color ? <View style={[styles.chipDot, { backgroundColor: active ? '#FFFFFF' : color }]} /> : null}
      <Text style={[typography.label, { color: active ? '#FFFFFF' : app.textSecondary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  padded: { padding: spacing.lg, paddingBottom: spacing.xxxl, flexGrow: 1 },
  monthCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.sm },
  monthCenter: { flex: 1, alignItems: 'center' },
  monthButton: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  chips: { gap: spacing.sm, paddingTop: spacing.lg, paddingBottom: spacing.xs },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  todayPill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill },
  todayText: { color: '#FFFFFF' },
  item: { marginBottom: spacing.md },
});

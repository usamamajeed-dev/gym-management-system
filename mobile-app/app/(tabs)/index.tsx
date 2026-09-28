import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ComponentProps } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Dashboard } from '@/api/types';
import { Card } from '@/components/Card';
import { ContentCard } from '@/components/ContentCard';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { EventCard } from '@/components/EventCard';
import { LoadingState } from '@/components/LoadingState';
import { SectionHeader } from '@/components/SectionHeader';
import { useDashboard } from '@/hooks/useDashboard';
import { useRefresh } from '@/hooks/useRefresh';
import { useAppTheme } from '@/theme/paperTheme';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { toApiError } from '@/utils/errors';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

function greeting(): string {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '')).toUpperCase();
}

export default function HomeScreen() {
  const { app } = useAppTheme();
  const insets = useSafeAreaInsets();
  const query = useDashboard();
  const { refreshing, onRefresh } = useRefresh(query.refetch);

  return (
    <ScrollView
      style={{ backgroundColor: app.background }}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#FFFFFF"
          colors={[app.primary]}
          progressViewOffset={insets.top}
        />
      }
    >
      <LinearGradient
        colors={app.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + spacing.xl }]}
      >
        <View style={styles.glow} />
        {query.data ? <HeroContent data={query.data} /> : <View style={styles.heroPlaceholder} />}
      </LinearGradient>

      <View style={styles.body}>
        {query.isPending ? (
          <LoadingState rows={4} />
        ) : query.isError ? (
          <Card style={styles.errorCard}>
            <ErrorState message={toApiError(query.error).message} onRetry={() => query.refetch()} />
          </Card>
        ) : (
          <DashboardBody data={query.data} />
        )}
      </View>
    </ScrollView>
  );
}

function HeroContent({ data }: { data: Dashboard }) {
  const first = data.member.name.split(' ')[0];

  return (
    <>
      <View style={styles.heroTop}>
        <View style={styles.flex}>
          <Text style={styles.greeting}>{greeting()},</Text>
          <Text style={styles.name} numberOfLines={1}>
            Hi, {first}
          </Text>
          <View style={styles.gymRow}>
            <MaterialCommunityIcons name="map-marker-radius-outline" size={15} color="#C7D2FE" />
            <Text style={styles.gymName}>{data.gym.name}</Text>
          </View>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(data.member.name)}</Text>
        </View>
      </View>

      <View style={styles.memberCard}>
        <View>
          <Text style={styles.memberLabel}>Membership no.</Text>
          <Text style={styles.memberNumber}>{data.member.membership_number ?? '—'}</Text>
        </View>
        <View style={styles.activePill}>
          <View style={styles.activeDot} />
          <Text style={styles.activeText}>Active member</Text>
        </View>
      </View>
    </>
  );
}

export function DashboardBody({ data }: { data: Dashboard }) {
  const { app } = useAppTheme();
  const today = data.today_timing;
  const closedToday = !today || today.is_closed;

  return (
    <View>
      <Card onPress={() => router.push('/timings')} accessibilityLabel="Gym opening hours" style={styles.statusCard}>
        <View style={styles.statusRow}>
          <View style={[styles.statusIcon, { backgroundColor: data.is_open_now ? app.successSoft : app.neutralSoft }]}>
            <MaterialCommunityIcons
              name={data.is_open_now ? 'door-open' : 'door-closed'}
              size={26}
              color={data.is_open_now ? app.success : app.textMuted}
            />
          </View>
          <View style={styles.flex}>
            <View
              style={[styles.statusChip, { backgroundColor: data.is_open_now ? app.successSoft : app.neutralSoft }]}
            >
              <View style={[styles.statusDot, { backgroundColor: data.is_open_now ? app.success : app.textFaint }]} />
              <Text style={[typography.label, { color: data.is_open_now ? app.success : app.textMuted }]}>
                {data.is_open_now ? 'Open now' : 'Closed now'}
              </Text>
            </View>
            <Text style={[typography.heading, styles.hours, { color: app.text }]}>
              {closedToday ? 'Closed today' : `${today.opens_at} – ${today.closes_at}`}
            </Text>
            <Text style={[typography.caption, { color: app.textMuted }]}>Today · tap for the full week</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={app.textFaint} />
        </View>
      </Card>

      <View style={styles.stats}>
        <Stat
          icon="calendar-month-outline"
          value={data.counts.events_this_month}
          label="Events this month"
          tone="primary"
        />
        <Stat icon="shield-check-outline" value={data.counts.policies} label="Gym policies" tone="accent" />
      </View>

      <SectionHeader title="Upcoming events" action="See all" onAction={() => router.push('/(tabs)/events')} />
      {data.upcoming_events.length === 0 ? (
        <Card>
          <EmptyState
            compact
            icon="calendar-blank-outline"
            title="No upcoming events"
            message="New classes and events will show up here."
          />
        </Card>
      ) : (
        <View style={styles.list}>
          {data.upcoming_events.map((event) => (
            <EventCard key={event.id} event={event} onPress={() => router.push(`/events/${event.id}`)} />
          ))}
        </View>
      )}

      <SectionHeader title="Latest news" action="See all" onAction={() => router.push('/(tabs)/news')} />
      {data.latest_news.length === 0 ? (
        <Card>
          <EmptyState
            compact
            icon="newspaper-variant-outline"
            title="No news yet"
            message="Updates from the gym will appear here."
          />
        </Card>
      ) : (
        <View style={styles.list}>
          {data.latest_news.map((item) => (
            <ContentCard key={item.id} item={item} onPress={() => router.push(`/contents/${item.id}`)} />
          ))}
        </View>
      )}

      <SectionHeader title="Quick links" />
      <View style={styles.links}>
        <QuickLink
          icon="clock-outline"
          title="Gym timings"
          subtitle="Weekly hours"
          onPress={() => router.push('/timings')}
        />
        <QuickLink
          icon="shield-check-outline"
          title="Policies"
          subtitle="Rules & terms"
          onPress={() => router.push('/policies')}
        />
      </View>
    </View>
  );
}

function Stat({
  icon,
  value,
  label,
  tone,
}: {
  icon: IconName;
  value: number;
  label: string;
  tone: 'primary' | 'accent';
}) {
  const { app } = useAppTheme();
  const color = tone === 'primary' ? app.primary : app.accent;
  const soft = tone === 'primary' ? app.primarySoft : app.accentSoft;

  return (
    <Card style={styles.stat}>
      <View style={[styles.statIcon, { backgroundColor: soft }]}>
        <MaterialCommunityIcons name={icon} size={20} color={color} />
      </View>
      <Text style={[typography.title, { color: app.text }]}>{value}</Text>
      <Text style={[typography.caption, { color: app.textMuted }]}>{label}</Text>
    </Card>
  );
}

function QuickLink({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const { app } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [styles.link, pressed && styles.pressed]}
    >
      <Card style={styles.linkCard}>
        <View style={[styles.statIcon, { backgroundColor: app.primarySoft }]}>
          <MaterialCommunityIcons name={icon} size={20} color={app.primary} />
        </View>
        <Text style={[typography.subheading, { color: app.text }]}>{title}</Text>
        <Text style={[typography.caption, { color: app.textMuted }]}>{subtitle}</Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: spacing.xxxl },
  hero: { paddingHorizontal: spacing.xl, paddingBottom: 64, overflow: 'hidden' },
  heroPlaceholder: { height: 150 },
  glow: {
    position: 'absolute',
    right: -90,
    top: -110,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(249, 115, 22, 0.22)',
  },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  greeting: { ...typography.bodySmall, color: '#C7D2FE' },
  name: { ...typography.display, color: '#FFFFFF', marginTop: 2 },
  gymRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.xs },
  gymName: { ...typography.label, color: '#C7D2FE' },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarText: { ...typography.subheading, color: '#FFFFFF' },
  memberCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  memberLabel: { ...typography.caption, color: '#C7D2FE' },
  memberNumber: { ...typography.heading, color: '#FFFFFF', letterSpacing: 0.5, marginTop: 2 },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(52, 211, 153, 0.18)',
  },
  activeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#34D399' },
  activeText: { ...typography.caption, color: '#D1FAE5' },
  body: { marginTop: -40, paddingHorizontal: spacing.lg },
  errorCard: { paddingVertical: spacing.md },
  statusCard: { padding: spacing.lg },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  statusIcon: { width: 56, height: 56, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  hours: { marginTop: 6 },
  stats: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  stat: { flex: 1, padding: spacing.lg, gap: 2 },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  list: { gap: spacing.md },
  links: { flexDirection: 'row', gap: spacing.md },
  link: { flex: 1 },
  linkCard: { padding: spacing.lg, gap: 2 },
  pressed: { opacity: 0.85 },
});

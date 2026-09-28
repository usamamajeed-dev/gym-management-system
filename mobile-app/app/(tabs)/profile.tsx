import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { ComponentProps, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Dialog, Portal } from 'react-native-paper';

import { Member } from '@/api/types';
import { useAuth } from '@/auth/AuthContext';
import { Card } from '@/components/Card';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { useProfile } from '@/hooks/useProfile';
import { useRefresh } from '@/hooks/useRefresh';
import { useAppTheme } from '@/theme/paperTheme';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { formatDate, formatPlainDate } from '@/utils/dates';
import { toApiError } from '@/utils/errors';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const GENDERS: Record<string, string> = { male: 'Male', female: 'Female', other: 'Other' };

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '')).toUpperCase();
}

export default function ProfileScreen() {
  const { app } = useAppTheme();
  const { logout, member: sessionMember } = useAuth();
  const query = useProfile();
  const { refreshing, onRefresh } = useRefresh(query.refetch);
  const [confirming, setConfirming] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const member = query.data ?? sessionMember;

  const signOut = async () => {
    setSigningOut(true);
    await logout();
  };

  return (
    <>
      <ScrollView
        style={{ backgroundColor: app.background }}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={app.primary}
            colors={[app.primary]}
          />
        }
      >
        {!member && query.isPending ? (
          <LoadingState rows={3} />
        ) : !member ? (
          <ErrorState message={toApiError(query.error).message} onRetry={() => query.refetch()} />
        ) : (
          <ProfileBody member={member} onSignOut={() => setConfirming(true)} />
        )}

        <Text style={[typography.caption, styles.version, { color: app.textFaint }]}>
          Gym Member · version {Constants.expoConfig?.version ?? '1.0.0'}
        </Text>
      </ScrollView>

      <Portal>
        <Dialog
          visible={confirming}
          onDismiss={() => setConfirming(false)}
          style={[styles.dialog, { backgroundColor: app.surface }]}
        >
          <Dialog.Icon icon="logout" color={app.danger} />
          <Dialog.Title style={[typography.heading, styles.center, { color: app.text }]}>Sign out?</Dialog.Title>
          <Dialog.Content>
            <Text style={[typography.body, styles.center, { color: app.textMuted }]}>
              {"You'll need your email and password to log in again."}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirming(false)} disabled={signingOut}>
              Cancel
            </Button>
            <Button
              mode="contained"
              buttonColor={app.danger}
              onPress={signOut}
              loading={signingOut}
              disabled={signingOut}
              style={styles.dialogButton}
            >
              Sign out
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

export function ProfileBody({ member, onSignOut }: { member: Member; onSignOut: () => void }) {
  const { app } = useAppTheme();
  const active = member.status === 'approved' && member.is_active;

  const details: { icon: IconName; label: string; value: string | null }[] = [
    { icon: 'phone-outline', label: 'Phone', value: member.phone },
    {
      icon: 'cake-variant-outline',
      label: 'Date of birth',
      value: member.date_of_birth ? formatPlainDate(member.date_of_birth) : null,
    },
    { icon: 'gender-male-female', label: 'Gender', value: member.gender ? GENDERS[member.gender] : null },
    { icon: 'home-outline', label: 'Address', value: member.address },
    { icon: 'card-account-phone-outline', label: 'Emergency contact', value: member.emergency_contact_name },
    { icon: 'phone-alert-outline', label: 'Emergency phone', value: member.emergency_contact_phone },
  ];

  return (
    <View>
      <View style={styles.identity}>
        <View style={[styles.avatar, { backgroundColor: app.primarySoft, borderColor: app.surface }]}>
          <Text style={[typography.title, { color: app.primary }]}>{initials(member.name)}</Text>
        </View>
        <Text style={[typography.title, styles.center, { color: app.text }]}>{member.name}</Text>
        <Text style={[typography.bodySmall, styles.center, { color: app.textMuted }]}>{member.email}</Text>
      </View>

      <Card style={styles.membership}>
        <View style={styles.membershipRow}>
          <View style={styles.flex}>
            <Text style={[typography.caption, { color: app.textMuted }]}>Membership number</Text>
            <Text style={[typography.heading, styles.number, { color: app.text }]}>
              {member.membership_number ?? '—'}
            </Text>
          </View>
          <View style={[styles.chip, { backgroundColor: active ? app.successSoft : app.neutralSoft }]}>
            <View style={[styles.dot, { backgroundColor: active ? app.success : app.textFaint }]} />
            <Text style={[typography.caption, { color: active ? app.success : app.textMuted }]}>
              {active ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
        <View style={[styles.divider, { backgroundColor: app.border }]} />
        <View style={styles.since}>
          <MaterialCommunityIcons name="calendar-check-outline" size={16} color={app.textMuted} />
          <Text style={[typography.bodySmall, { color: app.textMuted }]}>
            Member since {member.approved_at ? formatDate(member.approved_at, 'd MMMM yyyy') : '—'}
          </Text>
        </View>
      </Card>

      <Text style={[typography.overline, styles.section, { color: app.textFaint }]}>Personal details</Text>
      <Card>
        {details.map((row, i) => (
          <View
            key={row.label}
            style={[
              styles.detail,
              i < details.length - 1 && { borderBottomColor: app.border, borderBottomWidth: StyleSheet.hairlineWidth },
            ]}
          >
            <MaterialCommunityIcons name={row.icon} size={20} color={app.textFaint} />
            <Text style={[typography.bodySmall, styles.detailLabel, { color: app.textMuted }]}>{row.label}</Text>
            <Text
              testID={`detail-${row.label}`}
              style={[typography.label, styles.detailValue, { color: row.value ? app.text : app.textFaint }]}
              numberOfLines={2}
            >
              {row.value || '—'}
            </Text>
          </View>
        ))}
      </Card>
      <Text style={[typography.caption, styles.note, { color: app.textFaint }]}>
        Contact the gym to update your details.
      </Text>

      <Text style={[typography.overline, styles.section, { color: app.textFaint }]}>Gym</Text>
      <Card>
        <LinkRow icon="shield-check-outline" label="Gym policies" onPress={() => router.push('/policies')} />
        <LinkRow icon="clock-outline" label="Gym timings" onPress={() => router.push('/timings')} last />
      </Card>

      <Button
        mode="outlined"
        icon="logout"
        onPress={onSignOut}
        textColor={app.danger}
        style={[styles.logout, { borderColor: app.danger + '55' }]}
        contentStyle={styles.logoutContent}
      >
        Sign out
      </Button>
    </View>
  );
}

function LinkRow({
  icon,
  label,
  onPress,
  last,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  last?: boolean;
}) {
  const { app } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.link,
        !last && { borderBottomColor: app.border, borderBottomWidth: StyleSheet.hairlineWidth },
        pressed && { opacity: 0.7 },
      ]}
    >
      <View style={[styles.linkIcon, { backgroundColor: app.primarySoft }]}>
        <MaterialCommunityIcons name={icon} size={20} color={app.primary} />
      </View>
      <Text style={[typography.subheading, styles.flex, { color: app.text }]}>{label}</Text>
      <MaterialCommunityIcons name="chevron-right" size={22} color={app.textFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  identity: { alignItems: 'center', gap: 2, marginTop: spacing.sm, marginBottom: spacing.xl },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    marginBottom: spacing.sm,
  },
  membership: { padding: spacing.lg },
  membershipRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  number: { letterSpacing: 0.5, marginTop: 2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: spacing.md },
  since: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  section: { marginTop: spacing.xxl, marginBottom: spacing.sm, marginLeft: spacing.xs },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
  },
  detailLabel: { width: 118 },
  detailValue: { flex: 1, textAlign: 'right' },
  note: { textAlign: 'center', marginTop: spacing.sm },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  linkIcon: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  logout: { marginTop: spacing.xxl, borderRadius: radius.md },
  logoutContent: { height: 50 },
  version: { textAlign: 'center', marginTop: spacing.xl },
  dialog: { borderRadius: radius.xl },
  dialogButton: { borderRadius: radius.md, paddingHorizontal: spacing.sm },
});

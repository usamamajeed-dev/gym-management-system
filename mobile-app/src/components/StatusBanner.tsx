import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../theme/paperTheme';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { IconName } from './EmptyState';

export type BannerTone = 'info' | 'warning' | 'danger' | 'success';

const BANNER_ICONS: Record<BannerTone, IconName> = {
  info: 'information',
  warning: 'clock-alert',
  danger: 'alert-circle',
  success: 'check-circle',
};

/** Coloured notice: login refusals, archived content, session messages. */
export function StatusBanner({ tone, title, message }: { tone: BannerTone; title?: string; message: string }) {
  const { app } = useAppTheme();
  const colors = {
    info: { fg: app.info, bg: app.infoSoft },
    warning: { fg: app.warning, bg: app.warningSoft },
    danger: { fg: app.danger, bg: app.dangerSoft },
    success: { fg: app.success, bg: app.successSoft },
  }[tone];

  return (
    <View
      style={[styles.banner, { backgroundColor: colors.bg, borderColor: colors.fg + '33' }]}
      accessibilityRole="alert"
    >
      <MaterialCommunityIcons name={BANNER_ICONS[tone]} size={20} color={colors.fg} style={styles.bannerIcon} />
      <View style={styles.bannerText}>
        {title ? <Text style={[typography.subheading, { color: colors.fg }]}>{title}</Text> : null}
        <Text style={[typography.bodySmall, { color: colors.fg }]}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  bannerIcon: { marginTop: 1 },
  bannerText: { flex: 1, gap: 2 },
});

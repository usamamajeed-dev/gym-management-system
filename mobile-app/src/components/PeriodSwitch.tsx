import { StyleSheet } from 'react-native';
import { SegmentedButtons } from 'react-native-paper';

import { ContentPeriod } from '../api/types';
import { useAppTheme } from '../theme/paperTheme';

/** "Latest / Older" (news) or "Current / Older" (policies) switch. */
export function PeriodSwitch({
  value,
  onChange,
  currentLabel,
}: {
  value: ContentPeriod;
  onChange: (v: ContentPeriod) => void;
  currentLabel: string;
}) {
  const { app } = useAppTheme();

  return (
    <SegmentedButtons
      theme={{ colors: { secondaryContainer: app.primarySoft, onSecondaryContainer: app.primary } }}
      value={value}
      onValueChange={(v) => onChange(v as ContentPeriod)}
      style={styles.switch}
      buttons={[
        { value: 'current', label: currentLabel, icon: 'star-four-points-outline' },
        { value: 'archive', label: 'Older', icon: 'archive-outline' },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  switch: { marginBottom: 2 },
});

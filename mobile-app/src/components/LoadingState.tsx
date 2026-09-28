import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';

import { useAppTheme } from '../theme/paperTheme';
import { radius, spacing } from '../theme/spacing';

/** Shimmering placeholder block. */
export function Skeleton({
  height = 16,
  width = '100%',
  style,
}: {
  height?: number;
  width?: ViewStyle['width'];
  style?: ViewStyle;
}) {
  const { app } = useAppTheme();
  const [opacity] = useState(() => new Animated.Value(0.55));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.55, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[{ height, width, borderRadius: radius.md, backgroundColor: app.neutralSoft, opacity }, style]}
    />
  );
}

/** Skeleton cards shown on first load. */
export function LoadingState({ rows = 3 }: { rows?: number }) {
  return (
    <View style={styles.loading} accessibilityLabel="Loading" accessibilityRole="progressbar">
      <Skeleton height={120} style={{ borderRadius: radius.lg }} />
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} height={76} style={{ borderRadius: radius.lg }} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { gap: spacing.md },
});

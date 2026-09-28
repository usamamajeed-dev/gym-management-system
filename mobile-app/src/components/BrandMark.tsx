import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { brand } from '../theme/colors';

/** The app logo: a dumbbell on an indigo tile with the orange accent dot. */
export function BrandMark({ size = 48 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size }} accessibilityLabel="Gym logo" accessibilityRole="image">
      <LinearGradient
        colors={['#6366F1', brand.primaryStrong]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.tile, { borderRadius: size * 0.3 }]}
      >
        <MaterialCommunityIcons name="dumbbell" size={size * 0.56} color="#FFFFFF" />
      </LinearGradient>
      <View
        style={[
          styles.dot,
          { width: size * 0.18, height: size * 0.18, borderRadius: size, top: size * 0.12, right: size * 0.12 },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', backgroundColor: brand.accent },
});

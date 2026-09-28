import { render } from '@testing-library/react-native';
import { ReactElement } from 'react';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { lightTheme } from './theme/paperTheme';

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

/** Renders with the providers every screen expects (safe area + Paper theme). */
export function renderWithProviders(ui: ReactElement) {
  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <PaperProvider theme={lightTheme}>{ui}</PaperProvider>
    </SafeAreaProvider>,
  );
}

import { configureFonts, MD3DarkTheme, MD3LightTheme, MD3Theme, useTheme } from 'react-native-paper';

import { AppColors, brand, darkColors, lightColors } from './colors';
import { fonts } from './fonts';

/** Paper components use Inter; labels and titles use the heavier cuts. */
const paperFonts = configureFonts({
  config: {
    ...Object.fromEntries(
      Object.entries(MD3LightTheme.fonts).map(([variant, style]) => [
        variant,
        {
          ...style,
          fontFamily: /label|title/i.test(variant)
            ? fonts.semibold
            : /headline|display/i.test(variant)
              ? fonts.bold
              : fonts.regular,
          fontWeight: undefined,
        },
      ]),
    ),
  },
});

export type AppTheme = MD3Theme & { app: AppColors; dark: boolean };

function build(base: MD3Theme, app: AppColors, dark: boolean): AppTheme {
  return {
    ...base,
    dark,
    roundness: 3,
    fonts: paperFonts,
    colors: {
      ...base.colors,
      primary: app.primary,
      onPrimary: '#FFFFFF',
      primaryContainer: app.primarySoft,
      onPrimaryContainer: dark ? '#E0E7FF' : brand.primaryStrong,
      secondary: app.accent,
      onSecondary: '#FFFFFF',
      secondaryContainer: app.accentSoft,
      onSecondaryContainer: dark ? '#FFEDD5' : brand.accentStrong,
      tertiary: app.accent,
      background: app.background,
      surface: app.surface,
      surfaceVariant: app.surfaceMuted,
      onSurface: app.text,
      onSurfaceVariant: app.textMuted,
      outline: app.border,
      outlineVariant: app.border,
      error: app.danger,
      errorContainer: app.dangerSoft,
      elevation: {
        ...base.colors.elevation,
        level1: app.surface,
        level2: app.surface,
        level3: app.surface,
      },
    },
    app,
  };
}

export const lightTheme = build(MD3LightTheme, lightColors, false);
export const darkTheme = build(MD3DarkTheme, darkColors, true);

/** Paper's theme plus the app's own colour tokens under `theme.app`. */
export const useAppTheme = () => useTheme<AppTheme>();

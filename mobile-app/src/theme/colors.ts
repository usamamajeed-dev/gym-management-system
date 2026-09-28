/** Brand palette shared with the admin portal: indigo primary, orange accent, slate neutrals. */
export const brand = {
  primary: '#4F46E5',
  primaryStrong: '#4338CA',
  primarySoft: '#EEF2FF',
  accent: '#F97316',
  accentStrong: '#EA580C',
  accentSoft: '#FFF7ED',
  navy: '#0B1120',
} as const;

export interface AppColors {
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textFaint: string;
  primary: string;
  primarySoft: string;
  accent: string;
  accentSoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  info: string;
  infoSoft: string;
  neutralSoft: string;
  hero: [string, string];
}

export const lightColors: AppColors = {
  background: '#F4F6FB',
  surface: '#FFFFFF',
  surfaceMuted: '#F8FAFC',
  border: '#E6E9F2',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  textFaint: '#94A3B8',
  primary: brand.primary,
  primarySoft: brand.primarySoft,
  accent: brand.accent,
  accentSoft: brand.accentSoft,
  success: '#059669',
  successSoft: '#ECFDF5',
  warning: '#B45309',
  warningSoft: '#FFFBEB',
  danger: '#DC2626',
  dangerSoft: '#FEF2F2',
  info: '#0369A1',
  infoSoft: '#F0F9FF',
  neutralSoft: '#F1F5F9',
  hero: ['#4F46E5', '#312E81'],
};

export const darkColors: AppColors = {
  background: '#0B1120',
  surface: '#131B2E',
  surfaceMuted: '#1A2338',
  border: '#243049',
  text: '#F1F5F9',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  textFaint: '#64748B',
  primary: '#818CF8',
  primarySoft: 'rgba(129, 140, 248, 0.16)',
  accent: '#FB923C',
  accentSoft: 'rgba(251, 146, 60, 0.16)',
  success: '#34D399',
  successSoft: 'rgba(52, 211, 153, 0.14)',
  warning: '#FBBF24',
  warningSoft: 'rgba(251, 191, 36, 0.14)',
  danger: '#F87171',
  dangerSoft: 'rgba(248, 113, 113, 0.14)',
  info: '#38BDF8',
  infoSoft: 'rgba(56, 189, 248, 0.14)',
  neutralSoft: 'rgba(148, 163, 184, 0.14)',
  hero: ['#4338CA', '#1E1B4B'],
};

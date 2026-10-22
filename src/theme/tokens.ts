export const lightTheme = {
  dark: false,
  colors: {
    background: '#F8F7FF',
    surface: '#FFFFFF',
    text: '#111827',
    muted: '#6B7280',
    border: '#E5E7EB',
    accent: '#615FFF',
    accentText: '#FFFFFF',
    accentSoft: '#EEF0FF',
    danger: '#BE123C',
    dangerText: '#FFFFFF',
    warning: '#92400E',
    warningBg: '#FEF3C7',
    overlay: 'rgba(17, 24, 39, 0.45)',
    skeleton: '#E5E7EB',
  },
  space: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radius: { sm: 8, md: 12, lg: 20 },
  font: { title: 28, heading: 20, body: 16, small: 13 },
} as const;

export const darkTheme = {
  dark: true,
  colors: {
    background: '#111827',
    surface: '#1F2937',
    text: '#F9FAFB',
    muted: '#9CA3AF',
    border: '#374151',
    accent: '#818CF8',
    accentText: '#111827',
    accentSoft: '#312E81',
    danger: '#FB7185',
    dangerText: '#111827',
    warning: '#FCD34D',
    warningBg: '#451A03',
    overlay: 'rgba(0, 0, 0, 0.62)',
    skeleton: '#374151',
  },
  space: lightTheme.space,
  radius: lightTheme.radius,
  font: lightTheme.font,
} as const;

export type Theme = {
  dark: boolean;
  colors: { [Key in keyof typeof lightTheme.colors]: string };
  space: typeof lightTheme.space;
  radius: typeof lightTheme.radius;
  font: typeof lightTheme.font;
};

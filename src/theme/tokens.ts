export const lightTheme = {
  dark: false,
  colors: {
    background: '#F3F0E8',
    surface: '#FFFCF7',
    text: '#1A1814',
    muted: '#6F6A62',
    border: '#E4DDD2',
    accent: '#0F6E6B',
    accentText: '#F7FFFE',
    danger: '#9F2D2D',
    dangerText: '#FFFFFF',
    warning: '#8A5A00',
    warningBg: '#F4E2B8',
    overlay: 'rgba(26, 24, 20, 0.45)',
    skeleton: '#E7E0D4',
  },
  space: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radius: { sm: 8, md: 12, lg: 20 },
  font: { title: 28, heading: 20, body: 16, small: 13 },
} as const;

export const darkTheme = {
  dark: true,
  colors: {
    background: '#12110F',
    surface: '#1C1B19',
    text: '#F5F1EA',
    muted: '#A8A29E',
    border: '#34302A',
    accent: '#3DDBD4',
    accentText: '#06211F',
    danger: '#F0A0A0',
    dangerText: '#2A0C0C',
    warning: '#E7C27A',
    warningBg: '#3A2E14',
    overlay: 'rgba(0, 0, 0, 0.55)',
    skeleton: '#2A2825',
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

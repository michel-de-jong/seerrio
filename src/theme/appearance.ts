import { darkTheme, lightTheme, type Theme } from './tokens';

export const appearances = ['system', 'light', 'dark'] as const;

export type Appearance = (typeof appearances)[number];

export const defaultAppearance: Appearance = 'dark';

export function isAppearance(value: string | null | undefined): value is Appearance {
  return value === 'system' || value === 'light' || value === 'dark';
}

export function resolveTheme(appearance: Appearance, systemScheme: string | null | undefined): Theme {
  switch (appearance) {
    case 'light':
      return lightTheme;
    case 'dark':
      return darkTheme;
    case 'system':
      return systemScheme === 'dark' ? darkTheme : lightTheme;
    default: {
      const unreachable: never = appearance;
      return unreachable;
    }
  }
}

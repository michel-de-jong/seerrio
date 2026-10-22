import { defaultAppearance, resolveTheme } from './appearance';
import { darkTheme, lightTheme } from './tokens';

describe('resolveTheme', () => {
  it('follows the system scheme until the user chooses a theme', () => {
    expect(resolveTheme('system', 'light')).toBe(lightTheme);
    expect(resolveTheme('system', 'dark')).toBe(darkTheme);
    expect(resolveTheme('system', null)).toBe(lightTheme);
  });

  it('defaults to dark like the Seerr web interface', () => {
    expect(resolveTheme(defaultAppearance, 'light')).toBe(darkTheme);
  });

  it('keeps an explicit choice independent of the system scheme', () => {
    expect(resolveTheme('dark', 'light')).toBe(darkTheme);
    expect(resolveTheme('light', 'dark')).toBe(lightTheme);
  });
});

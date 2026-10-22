import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform, useColorScheme } from 'react-native';

import { isAppearance, resolveTheme, type Appearance } from './appearance';
import type { Theme } from './tokens';

const appearanceKey = 'seerr.appearance';

type AppearanceContextValue = {
  appearance: Appearance;
  setAppearance: (appearance: Appearance) => void;
};

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [appearance, setAppearanceState] = useState<Appearance>('system');

  useEffect(() => {
    if (Platform.OS === 'web') return;
    let cancelled = false;
    void SecureStore.getItemAsync(appearanceKey).then((value) => {
      if (!cancelled && isAppearance(value)) setAppearanceState(value);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setAppearance = useCallback((value: Appearance) => {
    setAppearanceState(value);
    if (Platform.OS === 'web') return;
    void SecureStore.setItemAsync(appearanceKey, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  }, []);

  const value = useMemo(() => ({ appearance, setAppearance }), [appearance, setAppearance]);
  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance(): AppearanceContextValue {
  const value = useContext(AppearanceContext);
  if (!value) throw new Error('useAppearance must be used within AppearanceProvider');
  return value;
}

export function useTheme(): Theme {
  const systemScheme = useColorScheme();
  const appearance = useContext(AppearanceContext)?.appearance ?? 'system';
  return resolveTheme(appearance, systemScheme);
}

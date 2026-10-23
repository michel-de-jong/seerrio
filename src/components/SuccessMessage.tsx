import { useEffect } from 'react';
import { AccessibilityInfo, Platform, Text } from 'react-native';

import { useTheme } from '../theme/useTheme';

/** Confirms that an action finished, placed directly under the control that triggered it. */
export function SuccessMessage({ message }: { message: string | null | false | undefined }) {
  const theme = useTheme();

  useEffect(() => {
    if (message && Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(message);
  }, [message]);

  if (!message) return null;
  return (
    <Text accessibilityLiveRegion="polite" style={{ color: theme.colors.accent, fontWeight: '600' }}>
      {message}
    </Text>
  );
}

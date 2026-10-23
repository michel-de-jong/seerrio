import { Text } from 'react-native';

import { en } from '../i18n/en';
import { useTheme } from '../theme/useTheme';

/** Explains why a new-password form cannot be submitted yet. */
export function PasswordHints({ password, confirmation }: { password: string; confirmation: string }) {
  const theme = useTheme();
  const hint =
    password.length > 0 && password.length < 8
      ? en.password.tooShort
      : confirmation.length > 0 && password !== confirmation
        ? en.password.mismatch
        : null;
  if (!hint) return null;
  return (
    <Text accessibilityLiveRegion="polite" style={{ color: theme.colors.danger }}>
      {hint}
    </Text>
  );
}

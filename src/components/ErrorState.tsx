import { StyleSheet, Text, View } from 'react-native';

import { presentError } from '../lib/presentError';
import { en } from '../i18n/en';
import { useTheme } from '../theme/useTheme';
import { Button } from './Button';

type Props = {
  error: unknown;
  onRetry: () => void;
};

export function ErrorState({ error, onRetry }: Props) {
  const theme = useTheme();
  return (
    <View style={styles.wrap} accessibilityRole="alert">
      <Text style={[styles.message, { color: theme.colors.text }]}>{presentError(error, 'load')}</Text>
      <Button label={en.actions.retry} onPress={onRetry} variant="secondary" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
  },
});

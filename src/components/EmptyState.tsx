import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme/useTheme';

type Props = {
  message: string;
};

export function EmptyState({ message }: Props) {
  const theme = useTheme();
  return (
    <View style={styles.wrap}>
      <Text style={[styles.message, { color: theme.colors.muted }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
  },
});

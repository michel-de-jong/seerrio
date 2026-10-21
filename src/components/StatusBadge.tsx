import { StyleSheet, Text, View } from 'react-native';

import { statusColors, statusLabel, type DisplayStatus } from '../lib/status';

type Props = {
  status: DisplayStatus;
};

export function StatusBadge({ status }: Props) {
  const colors = statusColors(status);
  const label = statusLabel(status);
  return (
    <View style={[styles.badge, { backgroundColor: colors.background }]} accessibilityLabel={label}>
      <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});

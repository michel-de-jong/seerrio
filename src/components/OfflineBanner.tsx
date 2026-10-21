import { StyleSheet, Text, View } from 'react-native';

import { en } from '../i18n/en';
import { useOnline } from '../lib/useOnline';
import { useTheme } from '../theme/useTheme';

export function OfflineBanner() {
  const online = useOnline();
  const theme = useTheme();
  if (online) return null;
  return (
    <View accessibilityRole="alert" style={[styles.banner, { backgroundColor: theme.colors.warningBg }]}>
      <Text style={[styles.text, { color: theme.colors.warning }]}>{en.offline.banner}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  text: {
    fontSize: 13,
    lineHeight: 18,
  },
});

import { useEffect } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, Text, View } from 'react-native';

import { presentError, type ErrorContext } from '../lib/presentError';
import { useTheme } from '../theme/useTheme';

type Props = {
  error?: unknown;
  message?: string | null;
  context?: ErrorContext;
};

/** Inline failure for an action, placed directly under the control that triggered it. */
export function ErrorMessage({ error, message, context = 'action' }: Props) {
  const theme = useTheme();
  const text = message ?? (error ? presentError(error, context) : null);

  useEffect(() => {
    if (text && Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(text);
  }, [text]);

  if (!text) return null;
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[
        styles.wrap,
        { borderColor: theme.colors.danger, backgroundColor: theme.colors.surface, borderRadius: theme.radius.sm },
      ]}
    >
      <Text style={[styles.text, { color: theme.colors.danger }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  text: {
    fontSize: 15,
    lineHeight: 21,
  },
});

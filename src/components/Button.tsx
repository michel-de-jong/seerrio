import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '../theme/useTheme';

type Variant = 'primary' | 'secondary' | 'danger';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
  accessibilityLabel?: string;
};

export function Button({ label, onPress, disabled = false, loading = false, variant = 'primary', accessibilityLabel }: Props) {
  const theme = useTheme();
  const inactive = disabled || loading;
  const colors = buttonColors(variant, theme.colors, theme.dark);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colors.background, borderColor: colors.border, opacity: inactive ? 0.5 : pressed ? 0.85 : 1 },
      ]}
    >
      {loading ? <ActivityIndicator color={colors.text} /> : <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
    </Pressable>
  );
}

function buttonColors(
  variant: Variant,
  colors: { accent: string; accentText: string; surface: string; text: string; border: string; danger: string; dangerText: string },
  dark: boolean,
): { background: string; text: string; border: string } {
  switch (variant) {
    case 'primary':
      return { background: colors.accent, text: colors.accentText, border: colors.accent };
    case 'secondary':
      return { background: dark ? colors.surface : colors.surface, text: colors.text, border: colors.border };
    case 'danger':
      return { background: colors.danger, text: colors.dangerText, border: colors.danger };
    default: {
      const unreachable: never = variant;
      return unreachable;
    }
  }
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
});

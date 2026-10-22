import { Pressable, Text, View } from 'react-native';

import { useTheme } from '../theme/useTheme';

type Props = {
  label: string;
  detail?: string;
  selected: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  onPress: () => void;
};

export function SeasonChoice({ label, detail, selected, disabled = false, accessibilityLabel, onPress }: Props) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel ?? (detail ? `${label}, ${detail}` : label)}
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 64,
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.space.md,
        padding: theme.space.md,
        borderWidth: 1,
        borderRadius: theme.radius.md,
        borderColor: selected ? theme.colors.accent : theme.colors.border,
        backgroundColor: selected ? theme.colors.accentSoft : theme.colors.surface,
        opacity: disabled ? 0.55 : pressed ? 0.8 : 1,
      })}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 7,
          borderWidth: 2,
          alignItems: 'center',
          justifyContent: 'center',
          borderColor: selected ? theme.colors.accent : theme.colors.muted,
          backgroundColor: selected ? theme.colors.accent : 'transparent',
        }}
      >
        {selected ? <Text style={{ color: theme.colors.accentText, fontSize: 14, fontWeight: '800' }}>✓</Text> : null}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: theme.colors.text, fontSize: theme.font.body, fontWeight: '600' }}>{label}</Text>
        {detail ? <Text style={{ color: theme.colors.muted, fontSize: theme.font.small }}>{detail}</Text> : null}
      </View>
    </Pressable>
  );
}

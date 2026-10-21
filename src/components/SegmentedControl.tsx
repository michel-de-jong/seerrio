import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { useTheme } from '../theme/useTheme';

type Option<T extends string> = {
  value: T;
  label: string;
};

type Props<T extends string> = {
  label: string;
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({ label, options, value, onChange }: Props<T>) {
  const theme = useTheme();
  return (
    <ScrollView
      horizontal
      accessibilityRole="tablist"
      accessibilityLabel={label}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            onPress={() => onChange(option.value)}
            style={[
              styles.chip,
              {
                backgroundColor: selected ? theme.colors.accent : theme.colors.surface,
                borderColor: selected ? theme.colors.accent : theme.colors.border,
              },
            ]}
          >
            <Text style={{ color: selected ? theme.colors.accentText : theme.colors.text, fontWeight: '600' }}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
});

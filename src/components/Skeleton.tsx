import { StyleSheet, View } from 'react-native';

import { useTheme } from '../theme/useTheme';

type Props = {
  width: number;
  height: number;
};

export function Skeleton({ width, height }: Props) {
  const theme = useTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.block, { width, height, backgroundColor: theme.colors.skeleton, borderRadius: theme.radius.sm }]}
    />
  );
}

const styles = StyleSheet.create({
  block: {},
});

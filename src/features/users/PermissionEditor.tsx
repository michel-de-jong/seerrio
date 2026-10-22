import { Switch, Text, View } from 'react-native';

import { en } from '../../i18n/en';
import { configurablePermissions, togglePermission } from '../../lib/permissions';
import { useTheme } from '../../theme/useTheme';

type Props = {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  canToggle?: (bit: number) => boolean;
};

export function PermissionEditor({ value, onChange, disabled = false, canToggle = () => true }: Props) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.space.sm }}>
      {configurablePermissions.map(({ bit, key }) => {
        const label = en.userAdmin.permissions[key];
        return (
          <View key={bit} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: theme.space.sm }}>
            <Text style={{ flex: 1, color: theme.colors.text }}>{label}</Text>
            <Switch
              accessibilityLabel={label}
              disabled={disabled || !canToggle(bit)}
              value={(value & bit) === bit}
              onValueChange={(enabled) => onChange(togglePermission(value, bit, enabled))}
            />
          </View>
        );
      })}
    </View>
  );
}

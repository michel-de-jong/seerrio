import { Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';

import { useSession } from '@/auth/AuthProvider';
import { Button } from '@/components/Button';
import { ErrorState } from '@/components/ErrorState';
import { OfflineBanner } from '@/components/OfflineBanner';
import { Skeleton } from '@/components/Skeleton';
import { useChangePassword, usePasswordStatus } from '@/features/profile/hooks';
import { en } from '@/i18n/en';
import { presentError } from '@/lib/presentError';
import { useTheme } from '@/theme/useTheme';

export default function PasswordScreen() {
  const { session } = useSession();
  const userId = session.status === 'signedIn' ? session.user.id : 0;
  const query = usePasswordStatus(userId);
  const theme = useTheme();
  if (query.isLoading) return <View style={{ padding: theme.space.md }}><Skeleton width={280} height={200} /></View>;
  if (query.error || query.data == null) return <ErrorState error={query.error ?? new Error('Missing password status')} onRetry={() => void query.refetch()} />;
  return <PasswordForm userId={userId} hasPassword={query.data} />;
}

function PasswordForm({ userId, hasPassword }: { userId: number; hasPassword: boolean }) {
  const theme = useTheme();
  const mutation = useChangePassword(userId);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const valid =
    (!hasPassword || currentPassword.length > 0) &&
    newPassword.length >= 8 &&
    newPassword === confirmation;

  const submit = () => {
    mutation.mutate(
      { ...(hasPassword ? { currentPassword } : {}), newPassword },
      {
        onSuccess: () => {
          setCurrentPassword('');
          setNewPassword('');
          setConfirmation('');
        },
      },
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: en.profile.password }} />
      <OfflineBanner />
      <View style={{ padding: theme.space.md, gap: theme.space.md }}>
        <Text style={{ color: theme.colors.muted }}>{en.password.intro}</Text>
        {hasPassword ? (
          <PasswordInput
            label={en.password.current}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            autoComplete="current-password"
          />
        ) : null}
        <PasswordInput label={en.password.new} value={newPassword} onChangeText={setNewPassword} autoComplete="new-password" />
        <PasswordInput label={en.password.confirm} value={confirmation} onChangeText={setConfirmation} autoComplete="new-password" />
        {confirmation && newPassword !== confirmation ? <Text style={{ color: theme.colors.danger }}>{en.password.mismatch}</Text> : null}
        <Button
          label={en.password.change}
          loading={mutation.isPending}
          disabled={!valid}
          onPress={() =>
            Alert.alert(en.password.confirmTitle, en.password.confirmBody, [
              { text: en.actions.cancel, style: 'cancel' },
              { text: en.password.change, onPress: submit },
            ])
          }
        />
        {mutation.isSuccess ? <Text accessibilityRole="alert" style={{ color: theme.colors.accent }}>{en.password.changed}</Text> : null}
        {mutation.error ? <Text accessibilityRole="alert" style={{ color: theme.colors.danger }}>{presentError(mutation.error)}</Text> : null}
      </View>
    </KeyboardAvoidingView>
  );
}

function PasswordInput({
  label,
  value,
  onChangeText,
  autoComplete,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  autoComplete: 'current-password' | 'new-password';
}) {
  const theme = useTheme();
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ color: theme.colors.text }}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        secureTextEntry
        textContentType={autoComplete === 'current-password' ? 'password' : 'newPassword'}
        autoComplete={autoComplete}
        value={value}
        onChangeText={onChangeText}
        style={{ color: theme.colors.text, backgroundColor: theme.colors.surface, padding: 12, borderRadius: theme.radius.sm }}
      />
    </View>
  );
}

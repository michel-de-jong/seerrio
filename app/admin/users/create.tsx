import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';

import { useSession } from '@/auth/AuthProvider';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorMessage } from '@/components/ErrorMessage';
import { OfflineBanner } from '@/components/OfflineBanner';
import { PasswordHints } from '@/components/PasswordHints';
import { useCreateUser } from '@/features/users/hooks';
import { en } from '@/i18n/en';
import { canManageUsers } from '@/lib/permissions';
import { useTheme } from '@/theme/useTheme';

export default function CreateUserScreen() {
  const { session } = useSession();
  if (session.status !== 'signedIn' || !canManageUsers(session.user.permissions)) {
    return <EmptyState message={en.errors.forbidden} />;
  }
  return <CreateUserForm />;
}

function CreateUserForm() {
  const theme = useTheme();
  const mutation = useCreateUser();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const valid = email.trim().length > 0 && password.length >= 8 && password === confirmation;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: en.userAdmin.create }} />
      <OfflineBanner />
      <View style={{ padding: theme.space.md, gap: theme.space.md }}>
        <Field label={en.signIn.emailLabel} value={email} onChangeText={setEmail} />
        <Field label={en.profileSettings.displayName} value={username} onChangeText={setUsername} />
        <Field label={en.password.new} value={password} onChangeText={setPassword} secure />
        <Field label={en.password.confirm} value={confirmation} onChangeText={setConfirmation} secure />
        <PasswordHints password={password} confirmation={confirmation} />
        <Text style={{ color: theme.colors.muted }}>{en.userAdmin.createHint}</Text>
        <Button
          label={en.userAdmin.create}
          loading={mutation.isPending}
          disabled={!valid}
          onPress={() =>
            mutation.mutate(
              { email: email.trim(), username: username.trim() || undefined, password },
              {
                onSuccess: (user) => {
                  setPassword('');
                  setConfirmation('');
                  router.replace({ pathname: '/admin/users/[id]', params: { id: String(user.id) } });
                },
              },
            )
          }
        />
        <ErrorMessage error={mutation.error} />
      </View>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  secure = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  secure?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ color: theme.colors.text }}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secure}
        textContentType={secure ? 'newPassword' : label === en.signIn.emailLabel ? 'emailAddress' : 'name'}
        autoComplete={secure ? 'new-password' : label === en.signIn.emailLabel ? 'email' : 'name'}
        autoCapitalize={label === en.signIn.emailLabel ? 'none' : 'words'}
        style={{ color: theme.colors.text, backgroundColor: theme.colors.surface, padding: 12, borderRadius: theme.radius.sm }}
      />
    </View>
  );
}

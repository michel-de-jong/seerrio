import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, View } from 'react-native';

import type { UserMainSettings } from '@/api/types';
import { useSession } from '@/auth/AuthProvider';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { OfflineBanner } from '@/components/OfflineBanner';
import { Skeleton } from '@/components/Skeleton';
import { useChangePassword, useUpdateUserMainSettings, useUserMainSettings } from '@/features/profile/hooks';
import { PermissionEditor } from '@/features/users/PermissionEditor';
import { useDeleteUser, useUpdateUserPermissions, useUser, useUserPermissions } from '@/features/users/hooks';
import { en } from '@/i18n/en';
import { parseRouteId } from '@/lib/format';
import { canManageUsers, Permission } from '@/lib/permissions';
import { presentError } from '@/lib/presentError';
import { useTheme } from '@/theme/useTheme';

export default function UserDetailsScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = parseRouteId(params.id);
  const { session } = useSession();
  if (id == null || session.status !== 'signedIn' || !canManageUsers(session.user.permissions)) {
    return <EmptyState message={en.errors.forbidden} />;
  }
  return <UserDetails id={id} currentUserId={session.user.id} currentPermissions={session.user.permissions} />;
}

function UserDetails({
  id,
  currentUserId,
  currentPermissions,
}: {
  id: number;
  currentUserId: number;
  currentPermissions: number;
}) {
  const theme = useTheme();
  const user = useUser(id);
  const settings = useUserMainSettings(id);
  const permissions = useUserPermissions(id);
  if (user.isLoading || settings.isLoading || permissions.isLoading) {
    return <View style={{ padding: theme.space.md }}><Skeleton width={280} height={300} /></View>;
  }
  const error = user.error ?? settings.error ?? permissions.error;
  if (error || !user.data || !settings.data || permissions.data == null) {
    return <ErrorState error={error ?? new Error('Missing user')} onRetry={() => void Promise.all([user.refetch(), settings.refetch(), permissions.refetch()])} />;
  }
  return (
    <UserForm
      id={id}
      currentUserId={currentUserId}
      currentPermissions={currentPermissions}
      initial={settings.data}
      initialPermissions={permissions.data}
      name={user.data.displayName || user.data.email}
    />
  );
}

function UserForm({
  id,
  currentUserId,
  currentPermissions,
  initial,
  initialPermissions,
  name,
}: {
  id: number;
  currentUserId: number;
  currentPermissions: number;
  initial: UserMainSettings;
  initialPermissions: number;
  name: string;
}) {
  const theme = useTheme();
  const updateSettings = useUpdateUserMainSettings(id);
  const updatePermissions = useUpdateUserPermissions(id);
  const remove = useDeleteUser();
  const changePassword = useChangePassword(id);
  const [username, setUsername] = useState(initial.username ?? '');
  const [email, setEmail] = useState(initial.email ?? '');
  const [movieLimit, setMovieLimit] = useState(stringNumber(initial.movieQuotaLimit));
  const [movieDays, setMovieDays] = useState(stringNumber(initial.movieQuotaDays));
  const [tvLimit, setTvLimit] = useState(stringNumber(initial.tvQuotaLimit));
  const [tvDays, setTvDays] = useState(stringNumber(initial.tvQuotaDays));
  const [permissionValue, setPermissionValue] = useState(initialPermissions);
  const [newPassword, setNewPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const canEditPermissions = id !== 1 && id !== currentUserId;
  const canDelete = id !== 1 && id !== currentUserId;
  const isAdmin = (currentPermissions & Permission.ADMIN) === Permission.ADMIN;
  const quotaValues = [movieLimit, movieDays, tvLimit, tvDays].map(optionalNonNegativeInteger);
  const quotasValid = quotaValues.every((value) => value !== null);
  const mutationError = updateSettings.error ?? updatePermissions.error ?? remove.error ?? changePassword.error;

  const saveSettings = () => {
    if (!quotasValid) return;
    updateSettings.mutate({
      ...initial,
      username: username.trim(),
      email: email.trim(),
      movieQuotaLimit: quotaValues[0] ?? undefined,
      movieQuotaDays: quotaValues[1] ?? undefined,
      tvQuotaLimit: quotaValues[2] ?? undefined,
      tvQuotaDays: quotaValues[3] ?? undefined,
    });
  };

  return (
    <ScrollView contentContainerStyle={{ padding: theme.space.md, paddingBottom: theme.space.xl, gap: theme.space.md }}>
      <Stack.Screen options={{ title: name }} />
      <OfflineBanner />
      <Text accessibilityRole="header" style={{ color: theme.colors.text, fontSize: theme.font.title, fontWeight: '700' }}>{name}</Text>
      <Field label={en.profileSettings.displayName} value={username} onChangeText={setUsername} />
      <Field label={en.signIn.emailLabel} value={email} onChangeText={setEmail} />
      <Text accessibilityRole="header" style={{ color: theme.colors.text, fontSize: theme.font.heading, fontWeight: '700' }}>{en.userAdmin.quotas}</Text>
      <Field label={en.userAdmin.movieLimit} value={movieLimit} onChangeText={setMovieLimit} numeric />
      <Field label={en.userAdmin.movieDays} value={movieDays} onChangeText={setMovieDays} numeric />
      <Field label={en.userAdmin.tvLimit} value={tvLimit} onChangeText={setTvLimit} numeric />
      <Field label={en.userAdmin.tvDays} value={tvDays} onChangeText={setTvDays} numeric />
      <Button label={en.userAdmin.saveAccount} loading={updateSettings.isPending} disabled={!email.trim() || !quotasValid} onPress={saveSettings} />

      <Text accessibilityRole="header" style={{ color: theme.colors.text, fontSize: theme.font.heading, fontWeight: '700' }}>{en.userAdmin.permissionTitle}</Text>
      {!canEditPermissions ? <Text style={{ color: theme.colors.muted }}>{en.userAdmin.protectedPermissions}</Text> : null}
      <PermissionEditor
        value={permissionValue}
        onChange={setPermissionValue}
        disabled={!canEditPermissions}
        canToggle={(bit) => isAdmin || (currentPermissions & bit) === bit}
      />
      <Button
        label={en.userAdmin.savePermissions}
        loading={updatePermissions.isPending}
        disabled={!canEditPermissions || permissionValue === initialPermissions}
        onPress={() =>
          confirm(en.userAdmin.permissionsTitle, en.userAdmin.permissionsBody, en.actions.save, () =>
            updatePermissions.mutate(permissionValue),
          )
        }
      />

      {id !== currentUserId ? (
        <View style={{ gap: theme.space.sm }}>
          <Text accessibilityRole="header" style={{ color: theme.colors.text, fontSize: theme.font.heading, fontWeight: '700' }}>{en.userAdmin.setPassword}</Text>
          <Field label={en.password.new} value={newPassword} onChangeText={setNewPassword} secure />
          <Field label={en.password.confirm} value={passwordConfirmation} onChangeText={setPasswordConfirmation} secure />
          <Button
            label={en.userAdmin.setPassword}
            loading={changePassword.isPending}
            disabled={newPassword.length < 8 || newPassword !== passwordConfirmation}
            onPress={() =>
              confirm(en.userAdmin.passwordTitle, en.userAdmin.passwordBody, en.userAdmin.setPassword, () =>
                changePassword.mutate(
                  { newPassword },
                  { onSuccess: () => { setNewPassword(''); setPasswordConfirmation(''); } },
                ),
              )
            }
          />
        </View>
      ) : null}

      {canDelete ? (
        <Button
          label={en.userAdmin.deleteUser}
          variant="danger"
          loading={remove.isPending}
          onPress={() =>
            confirm(en.userAdmin.deleteTitle, en.userAdmin.deleteBody(name), en.userAdmin.deleteUser, () =>
              remove.mutate(id, { onSuccess: () => router.back() }),
            )
          }
        />
      ) : null}
      {mutationError ? <Text accessibilityRole="alert" style={{ color: theme.colors.danger }}>{presentError(mutationError)}</Text> : null}
    </ScrollView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  numeric = false,
  secure = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  numeric?: boolean;
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
        keyboardType={numeric ? 'number-pad' : 'default'}
        secureTextEntry={secure}
        autoComplete={secure ? 'new-password' : 'off'}
        style={{ color: theme.colors.text, backgroundColor: theme.colors.surface, padding: 12, borderRadius: theme.radius.sm }}
      />
    </View>
  );
}

function optionalNonNegativeInteger(value: string): number | undefined | null {
  if (!value.trim()) return undefined;
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function stringNumber(value: number | undefined): string {
  return value == null ? '' : String(value);
}

function confirm(title: string, body: string, action: string, onPress: () => void): void {
  Alert.alert(title, body, [
    { text: en.actions.cancel, style: 'cancel' },
    { text: action, style: 'destructive', onPress },
  ]);
}

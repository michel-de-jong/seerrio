import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text } from 'react-native';

import { useSession } from '@/auth/AuthProvider';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { OfflineBanner } from '@/components/OfflineBanner';
import { PermissionEditor } from '@/features/users/PermissionEditor';
import { useBatchUpdateUserPermissions } from '@/features/users/hooks';
import { en } from '@/i18n/en';
import { canManageUsers, Permission } from '@/lib/permissions';
import { presentError } from '@/lib/presentError';
import { useTheme } from '@/theme/useTheme';

export default function BatchUsersScreen() {
  const params = useLocalSearchParams<{ ids?: string }>();
  const { session } = useSession();
  if (session.status !== 'signedIn' || !canManageUsers(session.user.permissions)) {
    return <EmptyState message={en.errors.forbidden} />;
  }
  const ids = parseIds(params.ids).filter((id) => id !== 1 && id !== session.user.id);
  if (ids.length === 0) return <EmptyState message={en.userAdmin.noBatchUsers} />;
  return <BatchForm ids={ids} currentPermissions={session.user.permissions} />;
}

function BatchForm({ ids, currentPermissions }: { ids: number[]; currentPermissions: number }) {
  const theme = useTheme();
  const mutation = useBatchUpdateUserPermissions();
  const [permissions, setPermissions] = useState(0);
  const isAdmin = (currentPermissions & Permission.ADMIN) === Permission.ADMIN;
  return (
    <ScrollView contentContainerStyle={{ padding: theme.space.md, paddingBottom: theme.space.xl, gap: theme.space.md }}>
      <Stack.Screen options={{ title: en.userAdmin.batch(ids.length) }} />
      <OfflineBanner />
      <Text style={{ color: theme.colors.warning }}>{en.userAdmin.batchWarning(ids.length)}</Text>
      <PermissionEditor
        value={permissions}
        onChange={setPermissions}
        canToggle={(bit) => isAdmin || (currentPermissions & bit) === bit}
      />
      <Button
        label={en.userAdmin.applyBatch}
        loading={mutation.isPending}
        onPress={() =>
          Alert.alert(en.userAdmin.batchTitle, en.userAdmin.batchBody(ids.length), [
            { text: en.actions.cancel, style: 'cancel' },
            {
              text: en.userAdmin.applyBatch,
              style: 'destructive',
              onPress: () => mutation.mutate({ ids, permissions }, { onSuccess: () => router.back() }),
            },
          ])
        }
      />
      {mutation.error ? <Text accessibilityRole="alert" style={{ color: theme.colors.danger }}>{presentError(mutation.error)}</Text> : null}
    </ScrollView>
  );
}

function parseIds(value: string | undefined): number[] {
  if (!value) return [];
  return [...new Set(value.split(',').flatMap((item) => {
    if (!/^[1-9]\d*$/.test(item)) return [];
    const id = Number(item);
    return Number.isSafeInteger(id) ? [id] : [];
  }))];
}

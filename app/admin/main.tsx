import { Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Switch, Text, TextInput, View } from 'react-native';

import type { AdminMainSettings } from '@/api/types';
import { useSession } from '@/auth/AuthProvider';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { OfflineBanner } from '@/components/OfflineBanner';
import { Skeleton } from '@/components/Skeleton';
import { useAdminMainSettings, useUpdateAdminMainSettings } from '@/features/admin/hooks';
import { PermissionEditor } from '@/features/users/PermissionEditor';
import { ErrorMessage } from '@/components/ErrorMessage';
import { SuccessMessage } from '@/components/SuccessMessage';
import { en } from '@/i18n/en';
import { canManageSettings, hasPermission, Permission } from '@/lib/permissions';
import { useTheme } from '@/theme/useTheme';

export default function MainSettingsScreen() {
  const { session } = useSession();
  if (session.status !== 'signedIn' || !canManageSettings(session.user.permissions)) {
    return <EmptyState message={en.errors.forbidden} />;
  }
  return <MainSettings isAdmin={hasPermission(session.user.permissions, Permission.ADMIN)} />;
}

function MainSettings({ isAdmin }: { isAdmin: boolean }) {
  const query = useAdminMainSettings();
  const theme = useTheme();
  if (query.isLoading) return <View style={{ padding: theme.space.md }}><Skeleton width={280} height={300} /></View>;
  if (query.error || !query.data) return <ErrorState error={query.error ?? new Error('Missing settings')} onRetry={() => void query.refetch()} />;
  return <MainForm initial={query.data} isAdmin={isAdmin} />;
}

function MainForm({ initial, isAdmin }: { initial: AdminMainSettings; isAdmin: boolean }) {
  const theme = useTheme();
  const mutation = useUpdateAdminMainSettings();
  const [settings, setSettings] = useState(initial);
  const textFields = [
    { key: 'applicationTitle' as const, label: en.serverAdmin.applicationTitle },
    { key: 'applicationUrl' as const, label: en.serverAdmin.applicationUrl },
    { key: 'appLanguage' as const, label: en.serverAdmin.appLanguage },
  ];
  const toggles = [
    { key: 'hideAvailable' as const, label: en.serverAdmin.hideAvailable },
    { key: 'hideRequested' as const, label: en.serverAdmin.hideRequested },
    { key: 'partialRequestsEnabled' as const, label: en.serverAdmin.partialRequests },
    { key: 'localLogin' as const, label: en.serverAdmin.localLogin },
    { key: 'enableSpecialEpisodes' as const, label: en.serverAdmin.specialEpisodes },
    { key: 'versionCheck' as const, label: en.serverAdmin.versionCheck },
  ];

  const save = () => {
    const perform = () => mutation.mutate(settings);
    if (initial.localLogin !== false && settings.localLogin === false) {
      Alert.alert(en.serverAdmin.localLoginTitle, en.serverAdmin.localLoginBody, [
        { text: en.actions.cancel, style: 'cancel' },
        { text: en.actions.save, style: 'destructive', onPress: perform },
      ]);
      return;
    }
    perform();
  };

  return (
    <ScrollView contentContainerStyle={{ padding: theme.space.md, paddingBottom: theme.space.xl, gap: theme.space.md }}>
      <Stack.Screen options={{ title: en.serverAdmin.main }} />
      <OfflineBanner />
      {textFields.map((field) => (
        <View key={field.key} style={{ gap: 4 }}>
          <Text style={{ color: theme.colors.text }}>{field.label}</Text>
          <TextInput
            accessibilityLabel={field.label}
            value={settings[field.key] ?? ''}
            onChangeText={(value) => setSettings((current) => ({ ...current, [field.key]: value }))}
            autoCapitalize="none"
            style={{ color: theme.colors.text, backgroundColor: theme.colors.surface, padding: 12, borderRadius: theme.radius.sm }}
          />
        </View>
      ))}
      {toggles.map((toggle) => (
        <View key={toggle.key} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ flex: 1, color: theme.colors.text }}>{toggle.label}</Text>
          <Switch
            accessibilityLabel={toggle.label}
            value={settings[toggle.key] ?? false}
            onValueChange={(value) => setSettings((current) => ({ ...current, [toggle.key]: value }))}
          />
        </View>
      ))}
      <Text accessibilityRole="header" style={{ color: theme.colors.text, fontSize: theme.font.heading, fontWeight: '700' }}>{en.serverAdmin.defaultPermissions}</Text>
      <PermissionEditor
        value={settings.defaultPermissions ?? 0}
        onChange={(value) => setSettings((current) => ({ ...current, defaultPermissions: value }))}
        disabled={!isAdmin}
      />
      {!isAdmin ? <Text style={{ color: theme.colors.muted }}>{en.serverAdmin.adminOnlyDefaults}</Text> : null}
      <Button label={en.actions.save} loading={mutation.isPending} onPress={save} />
      <SuccessMessage message={mutation.isSuccess && en.profileSettings.saved} />
      <ErrorMessage error={mutation.error} />
    </ScrollView>
  );
}

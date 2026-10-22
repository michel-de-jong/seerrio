import { router, Stack } from 'expo-router';
import { ScrollView, Text } from 'react-native';

import { useSession } from '@/auth/AuthProvider';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { en } from '@/i18n/en';
import { canManageBlocklist, canManageSettings, canViewBlocklist, hasPermission, Permission } from '@/lib/permissions';
import { useTheme } from '@/theme/useTheme';

export default function ServerAdminScreen() {
  const { session } = useSession();
  const theme = useTheme();
  if (session.status !== 'signedIn') return <EmptyState message={en.errors.forbidden} />;
  const permissions = session.user.permissions;
  const settings = canManageSettings(permissions);
  const admin = hasPermission(permissions, Permission.ADMIN);
  const blocklist = canViewBlocklist(permissions);
  if (!settings && !admin && !blocklist) return <EmptyState message={en.errors.forbidden} />;

  return (
    <ScrollView contentContainerStyle={{ padding: theme.space.md, gap: theme.space.sm }}>
      <Stack.Screen options={{ title: en.profile.serverAdministration }} />
      <Text style={{ color: theme.colors.muted }}>{en.serverAdmin.intro}</Text>
      {settings ? <Button label={en.serverAdmin.main} onPress={() => router.push('/admin/main')} /> : null}
      {settings ? <Button label={en.serverAdmin.network} variant="secondary" onPress={() => router.push('/admin/network')} /> : null}
      {blocklist ? <Button label={en.serverAdmin.blocklist} variant="secondary" onPress={() => router.push('/admin/blocklist')} /> : null}
      {admin ? <Button label={en.serverAdmin.sliders} variant="secondary" onPress={() => router.push('/admin/sliders')} /> : null}
      {admin ? <Button label={en.serverAdmin.overrideRules} variant="secondary" onPress={() => router.push('/admin/override-rules')} /> : null}
      {settings ? <Button label={en.serverAdmin.services} variant="secondary" onPress={() => router.push('/admin/services')} /> : null}
      {settings ? <Button label={en.serverAdmin.jobs} variant="secondary" onPress={() => router.push('/admin/jobs')} /> : null}
      {settings ? <Button label={en.serverAdmin.caches} variant="secondary" onPress={() => router.push('/admin/caches')} /> : null}
      {!canManageBlocklist(permissions) && blocklist ? <Text style={{ color: theme.colors.muted }}>{en.serverAdmin.blocklistReadOnly}</Text> : null}
    </ScrollView>
  );
}

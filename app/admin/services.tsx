import { Stack } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { useSession } from '@/auth/AuthProvider';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { OfflineBanner } from '@/components/OfflineBanner';
import { Skeleton } from '@/components/Skeleton';
import { useServices } from '@/features/admin/hooks';
import { en } from '@/i18n/en';
import { canManageSettings } from '@/lib/permissions';
import { useTheme } from '@/theme/useTheme';

export default function ServicesScreen() {
  const { session } = useSession();
  if (session.status !== 'signedIn' || !canManageSettings(session.user.permissions)) {
    return <EmptyState message={en.errors.forbidden} />;
  }
  return <Services />;
}

function Services() {
  const theme = useTheme();
  const query = useServices();
  if (query.isLoading) return <View style={{ padding: theme.space.md }}><Skeleton width={280} height={200} /></View>;
  if (query.error || !query.data) return <ErrorState error={query.error ?? new Error('Missing services')} onRetry={() => void query.refetch()} />;
  return (
    <ScrollView contentContainerStyle={{ padding: theme.space.md, gap: theme.space.md }}>
      <Stack.Screen options={{ title: en.serverAdmin.services }} />
      <OfflineBanner />
      <Text style={{ color: theme.colors.muted }}>{en.serverAdmin.servicesReadOnly}</Text>
      {query.data.length === 0 ? <EmptyState message={en.serverAdmin.servicesEmpty} /> : null}
      {query.data.map((service) => (
        <View key={`${service.kind}-${service.id}`} style={{ padding: theme.space.md, borderRadius: theme.radius.md, backgroundColor: theme.colors.surface, gap: 4 }}>
          <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{service.name}</Text>
          <Text style={{ color: theme.colors.muted }}>{service.kind === 'radarr' ? 'Radarr' : 'Sonarr'} · {service.is4k ? en.media.quality4k : en.media.qualityHd}</Text>
          <Text style={{ color: theme.colors.muted }}>{service.syncEnabled ? en.serverAdmin.syncEnabled : en.serverAdmin.syncDisabled}</Text>
          {service.isDefault ? <Text style={{ color: theme.colors.accent }}>{en.serverAdmin.defaultService}</Text> : null}
          {service.preventSearch ? <Text style={{ color: theme.colors.warning }}>{en.serverAdmin.searchPrevented}</Text> : null}
        </View>
      ))}
    </ScrollView>
  );
}

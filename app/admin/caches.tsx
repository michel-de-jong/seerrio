import { Stack } from 'expo-router';
import { Alert, ScrollView, Text, View } from 'react-native';

import { useSession } from '@/auth/AuthProvider';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { OfflineBanner } from '@/components/OfflineBanner';
import { Skeleton } from '@/components/Skeleton';
import { useCacheSummary, useFlushCache } from '@/features/admin/hooks';
import { en } from '@/i18n/en';
import { canManageSettings } from '@/lib/permissions';
import { presentError } from '@/lib/presentError';
import { useTheme } from '@/theme/useTheme';

export default function CachesScreen() {
  const { session } = useSession();
  if (session.status !== 'signedIn' || !canManageSettings(session.user.permissions)) {
    return <EmptyState message={en.errors.forbidden} />;
  }
  return <Caches />;
}

function Caches() {
  const theme = useTheme();
  const query = useCacheSummary();
  const flush = useFlushCache();
  if (query.isLoading) return <View style={{ padding: theme.space.md }}><Skeleton width={280} height={240} /></View>;
  if (query.error || !query.data) return <ErrorState error={query.error ?? new Error('Missing caches')} onRetry={() => void query.refetch()} />;
  const data = query.data;
  return (
    <ScrollView contentContainerStyle={{ padding: theme.space.md, paddingBottom: theme.space.xl, gap: theme.space.md }}>
      <Stack.Screen options={{ title: en.serverAdmin.caches }} />
      <OfflineBanner />
      <View style={{ padding: theme.space.md, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, gap: 4 }}>
        <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{en.serverAdmin.imageCache}</Text>
        <Text style={{ color: theme.colors.muted }}>{en.serverAdmin.tmdbImages(data.imageCache.tmdbCount, data.imageCache.tmdbSize)}</Text>
        <Text style={{ color: theme.colors.muted }}>{en.serverAdmin.avatarImages(data.imageCache.avatarCount, data.imageCache.avatarSize)}</Text>
      </View>
      {data.dns ? (
        <View style={{ padding: theme.space.md, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, gap: 4 }}>
          <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{en.serverAdmin.dnsCache}</Text>
          <Text style={{ color: theme.colors.muted }}>{en.serverAdmin.cacheStats(data.dns.hits, data.dns.misses, data.dns.size)}</Text>
        </View>
      ) : null}
      {data.apiCaches.map((cache) => (
        <View key={cache.id} style={{ padding: theme.space.md, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, gap: theme.space.sm }}>
          <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{cache.name}</Text>
          <Text style={{ color: theme.colors.muted }}>{en.serverAdmin.cacheStats(cache.hits, cache.misses, cache.keys)}</Text>
          <Button
            label={en.serverAdmin.flushCache}
            variant="danger"
            loading={flush.isPending}
            onPress={() =>
              Alert.alert(en.serverAdmin.flushTitle, en.serverAdmin.flushBody(cache.name), [
                { text: en.actions.cancel, style: 'cancel' },
                { text: en.serverAdmin.flushCache, style: 'destructive', onPress: () => flush.mutate(cache.id) },
              ])
            }
          />
        </View>
      ))}
      {flush.error ? <Text accessibilityRole="alert" style={{ color: theme.colors.danger }}>{presentError(flush.error)}</Text> : null}
    </ScrollView>
  );
}

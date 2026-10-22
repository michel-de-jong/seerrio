import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Pressable, Text, TextInput, View } from 'react-native';

import type { BlocklistItem } from '@/api/types';
import { useSession } from '@/auth/AuthProvider';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { OfflineBanner } from '@/components/OfflineBanner';
import { Skeleton } from '@/components/Skeleton';
import { useBlocklist, useRemoveBlocklistItem } from '@/features/admin/hooks';
import { useDebouncedValue } from '@/features/search/hooks';
import { en } from '@/i18n/en';
import { canManageBlocklist, canViewBlocklist } from '@/lib/permissions';
import { presentError } from '@/lib/presentError';
import { useTheme } from '@/theme/useTheme';

export default function BlocklistScreen() {
  const { session } = useSession();
  if (session.status !== 'signedIn' || !canViewBlocklist(session.user.permissions)) {
    return <EmptyState message={en.errors.forbidden} />;
  }
  return <Blocklist canManage={canManageBlocklist(session.user.permissions)} />;
}

function Blocklist({ canManage }: { canManage: boolean }) {
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const query = useBlocklist(useDebouncedValue(search.trim(), 300));
  const remove = useRemoveBlocklistItem();
  const items = query.data?.pages.flatMap((page) => page.results) ?? [];
  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: en.serverAdmin.blocklist }} />
      <OfflineBanner />
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        refreshing={query.isRefetching && !query.isFetchingNextPage}
        onRefresh={() => void query.refetch()}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
        }}
        ListHeaderComponent={
          <TextInput
            accessibilityLabel={en.serverAdmin.searchBlocklist}
            placeholder={en.serverAdmin.searchBlocklist}
            placeholderTextColor={theme.colors.muted}
            value={search}
            onChangeText={setSearch}
            style={{ color: theme.colors.text, backgroundColor: theme.colors.surface, padding: 12, borderRadius: theme.radius.sm, marginBottom: theme.space.md }}
          />
        }
        ListEmptyComponent={
          query.isLoading ? <Skeleton width={280} height={120} /> :
          query.error ? <ErrorState error={query.error} onRetry={() => void query.refetch()} /> :
          <EmptyState message={en.serverAdmin.blocklistEmpty} />
        }
        contentContainerStyle={{ padding: theme.space.md, gap: theme.space.sm, flexGrow: 1 }}
        renderItem={({ item }) => (
          <BlocklistRow
            item={item}
            canManage={canManage}
            removing={remove.isPending}
            onRemove={() =>
              Alert.alert(en.serverAdmin.unblockTitle, en.serverAdmin.unblockBody(item.title), [
                { text: en.actions.cancel, style: 'cancel' },
                {
                  text: en.serverAdmin.unblock,
                  style: 'destructive',
                  onPress: () => remove.mutate({ tmdbId: item.tmdbId, mediaType: item.mediaType }),
                },
              ])
            }
          />
        )}
        ListFooterComponent={remove.error ? <Text accessibilityRole="alert" style={{ color: theme.colors.danger }}>{presentError(remove.error)}</Text> : null}
      />
    </View>
  );
}

function BlocklistRow({ item, canManage, removing, onRemove }: { item: BlocklistItem; canManage: boolean; removing: boolean; onRemove: () => void }) {
  const theme = useTheme();
  return (
    <View style={{ padding: theme.space.md, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, gap: theme.space.sm }}>
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          item.mediaType === 'movie'
            ? router.push({ pathname: '/movie/[id]', params: { id: String(item.tmdbId) } })
            : router.push({ pathname: '/tv/[id]', params: { id: String(item.tmdbId) } })
        }
      >
        <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{item.title}</Text>
        <Text style={{ color: theme.colors.muted }}>{item.mediaType === 'movie' ? en.media.movie : en.media.series}</Text>
      </Pressable>
      {canManage ? <Button label={en.serverAdmin.unblock} variant="danger" loading={removing} onPress={onRemove} /> : null}
    </View>
  );
}

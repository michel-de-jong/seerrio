import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';

import type { SeerrUser } from '@/api/types';
import { useSession } from '@/auth/AuthProvider';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { OfflineBanner } from '@/components/OfflineBanner';
import { Skeleton } from '@/components/Skeleton';
import { useDebouncedValue } from '@/features/search/hooks';
import { useUsers } from '@/features/users/hooks';
import { en } from '@/i18n/en';
import { canManageUsers } from '@/lib/permissions';
import { useTheme } from '@/theme/useTheme';

export default function UsersScreen() {
  const { session } = useSession();
  if (session.status !== 'signedIn' || !canManageUsers(session.user.permissions)) {
    return <EmptyState message={en.errors.forbidden} />;
  }
  return <UsersList currentUserId={session.user.id} />;
}

function UsersList({ currentUserId }: { currentUserId: number }) {
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  const query = useUsers(useDebouncedValue(search.trim(), 300));
  const users = query.data?.pages.flatMap((page) => page.results) ?? [];

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: en.profile.userAdministration }} />
      <OfflineBanner />
      <FlatList
        data={users}
        keyExtractor={(user) => String(user.id)}
        refreshing={query.isRefetching && !query.isFetchingNextPage}
        onRefresh={() => void query.refetch()}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
        }}
        ListHeaderComponent={
          <View style={{ gap: theme.space.sm, marginBottom: theme.space.md }}>
            <TextInput
              accessibilityLabel={en.userAdmin.search}
              placeholder={en.userAdmin.search}
              placeholderTextColor={theme.colors.muted}
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              style={{ color: theme.colors.text, backgroundColor: theme.colors.surface, padding: 12, borderRadius: theme.radius.sm }}
            />
            <Button label={en.userAdmin.create} onPress={() => router.push('/admin/users/create')} />
            {selected.length > 0 ? (
              <Button
                label={en.userAdmin.batch(selected.length)}
                variant="secondary"
                onPress={() =>
                  router.push({ pathname: '/admin/users/batch', params: { ids: selected.join(',') } })
                }
              />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          query.isLoading ? (
            <View style={{ gap: theme.space.sm }}><Skeleton width={280} height={72} /><Skeleton width={280} height={72} /></View>
          ) : query.error ? (
            <ErrorState error={query.error} onRetry={() => void query.refetch()} />
          ) : (
            <EmptyState message={en.userAdmin.empty} />
          )
        }
        contentContainerStyle={{ padding: theme.space.md, gap: theme.space.sm, flexGrow: 1 }}
        renderItem={({ item }) => (
          <UserRow
            user={item}
            selected={selected.includes(item.id)}
            selectable={item.id !== 1 && item.id !== currentUserId}
            onSelect={() =>
              setSelected((current) =>
                current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id],
              )
            }
          />
        )}
      />
    </View>
  );
}

function UserRow({
  user,
  selected,
  selectable,
  onSelect,
}: {
  user: SeerrUser;
  selected: boolean;
  selectable: boolean;
  onSelect: () => void;
}) {
  const theme = useTheme();
  const name = user.displayName || user.email;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.sm, padding: theme.space.md, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md }}>
      {selectable ? (
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: selected }}
          accessibilityLabel={en.userAdmin.select(name)}
          onPress={onSelect}
          style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ color: theme.colors.accent, fontSize: 20 }}>{selected ? '✓' : '○'}</Text>
        </Pressable>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={en.userAdmin.open(name)}
        onPress={() => router.push({ pathname: '/admin/users/[id]', params: { id: String(user.id) } })}
        style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.7 : 1 })}
      >
        <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{name}</Text>
        <Text style={{ color: theme.colors.muted }}>{user.email}</Text>
      </Pressable>
    </View>
  );
}

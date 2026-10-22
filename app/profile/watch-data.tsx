import { router, Stack } from 'expo-router';
import { FlatList, Pressable, Text, View } from 'react-native';

import type { MediaType } from '@/api/types';
import { useSession } from '@/auth/AuthProvider';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { OfflineBanner } from '@/components/OfflineBanner';
import { Skeleton } from '@/components/Skeleton';
import { useMediaDetails } from '@/features/media/hooks';
import { useWatchData } from '@/features/profile/hooks';
import { en } from '@/i18n/en';
import { useTheme } from '@/theme/useTheme';

export default function WatchDataScreen() {
  const { session } = useSession();
  const userId = session.status === 'signedIn' ? session.user.id : 0;
  const query = useWatchData(userId);
  const theme = useTheme();
  if (query.isLoading) return <View style={{ padding: theme.space.md }}><Skeleton width={280} height={200} /></View>;
  if (query.error || !query.data) return <ErrorState error={query.error ?? new Error('Missing watch data')} onRetry={() => void query.refetch()} />;
  return (
    <>
      <Stack.Screen options={{ title: en.profile.watchHistory }} />
      <OfflineBanner />
      <FlatList
        data={query.data.recentlyWatched}
        keyExtractor={(item) => String(item.id)}
        refreshing={query.isRefetching}
        onRefresh={() => void query.refetch()}
        ListHeaderComponent={
          <Text accessibilityRole="header" style={{ color: theme.colors.text, fontSize: theme.font.heading, fontWeight: '700', marginBottom: theme.space.md }}>
            {en.watchData.playCount(query.data.playCount)}
          </Text>
        }
        ListEmptyComponent={<EmptyState message={en.watchData.empty} />}
        contentContainerStyle={{ padding: theme.space.md, gap: theme.space.sm, flexGrow: 1 }}
        renderItem={({ item }) => <WatchedRow mediaType={item.mediaType} tmdbId={item.tmdbId} />}
      />
    </>
  );
}

function WatchedRow({ mediaType, tmdbId }: { mediaType: MediaType; tmdbId: number }) {
  const theme = useTheme();
  const query = useMediaDetails(mediaType, tmdbId);
  const title = query.data ? ('title' in query.data ? query.data.title : query.data.name) : en.media.untitled;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={en.media.openTitle(title)}
      onPress={() =>
        mediaType === 'movie'
          ? router.push({ pathname: '/movie/[id]', params: { id: String(tmdbId) } })
          : router.push({ pathname: '/tv/[id]', params: { id: String(tmdbId) } })
      }
      style={({ pressed }) => ({
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.md,
        padding: theme.space.md,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{query.isLoading ? en.media.untitled : title}</Text>
    </Pressable>
  );
}

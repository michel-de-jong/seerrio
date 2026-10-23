import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { MediaGrid } from '@/components/MediaGrid';
import { useCollection } from '@/features/media/hooks';
import { en } from '@/i18n/en';
import { parseRouteId } from '@/lib/format';
import { posterUrl } from '@/lib/tmdb';
import { useTheme } from '@/theme/useTheme';

export default function CollectionScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = parseRouteId(params.id);
  if (id == null) return <EmptyState message={en.errors.invalidLink} />;
  return <Collection id={id} />;
}

function Collection({ id }: { id: number }) {
  const theme = useTheme();
  const query = useCollection(id);
  if (query.error) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  const collection = query.data;
  const backdrop = posterUrl(collection?.backdropPath, 'w780');

  return (
    <MediaGrid
      items={collection?.parts ?? []}
      isLoading={query.isLoading}
      isRefreshing={query.isRefetching}
      error={query.error}
      empty={en.media.emptyCollection}
      onRefresh={() => void query.refetch()}
      onRetry={() => void query.refetch()}
      onEndReached={() => undefined}
      header={
        collection ? (
          <View style={{ gap: theme.space.md }}>
            <Stack.Screen options={{ title: collection.name }} />
            {backdrop ? <Image source={{ uri: backdrop }} style={{ width: '100%', height: 180 }} contentFit="cover" /> : null}
            <Text accessibilityRole="header" style={{ color: theme.colors.text, fontSize: theme.font.heading, fontWeight: '700' }}>
              {collection.name}
            </Text>
            {collection.overview ? <Text style={{ color: theme.colors.text, lineHeight: 22 }}>{collection.overview}</Text> : null}
            <Text accessibilityRole="header" style={{ color: theme.colors.text, fontSize: theme.font.heading, fontWeight: '700' }}>
              {en.media.collectionTitles}
            </Text>
          </View>
        ) : undefined
      }
    />
  );
}

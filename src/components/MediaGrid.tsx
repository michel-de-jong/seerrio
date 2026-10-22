import { router } from 'expo-router';
import { type ReactNode } from 'react';
import { FlatList, useWindowDimensions, View } from 'react-native';

import type { MediaItem, MediaType } from '../api/types';
import { assertNever } from '../api/assertNever';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { OfflineBanner } from './OfflineBanner';
import { PosterCard } from './PosterCard';
import { Skeleton } from './Skeleton';
import { useTheme } from '../theme/useTheme';

type Props = {
  items: MediaItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: unknown;
  empty: string;
  header?: ReactNode;
  onRefresh: () => void;
  onEndReached: () => void;
  onRetry: () => void;
};

export function MediaGrid({ items, isLoading, isRefreshing, error, empty, header, onRefresh, onEndReached, onRetry }: Props) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const itemWidth = (width - theme.space.md * 2 - theme.space.sm) / 2;

  if (isLoading && items.length === 0) {
    return (
      <View style={{ padding: theme.space.md, gap: theme.space.md }}>
        <OfflineBanner />
        {header}
        <View style={{ flexDirection: 'row', gap: theme.space.sm }}>
          <Skeleton width={itemWidth} height={itemWidth * 1.5} />
          <Skeleton width={itemWidth} height={itemWidth * 1.5} />
        </View>
      </View>
    );
  }

  if (error && items.length === 0) {
    return (
      <View style={{ flex: 1 }}>
        <OfflineBanner />
        {header}
        <ErrorState error={error} onRetry={onRetry} />
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => `${item.mediaType}-${item.id}`}
      numColumns={2}
      refreshing={isRefreshing}
      onRefresh={onRefresh}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      ListHeaderComponent={
        <>
          <OfflineBanner />
          {header ? <View style={{ marginBottom: theme.space.md }}>{header}</View> : null}
        </>
      }
      ListEmptyComponent={<EmptyState message={empty} />}
      columnWrapperStyle={items.length > 0 ? { gap: theme.space.sm } : undefined}
      contentContainerStyle={{ padding: theme.space.md, gap: theme.space.md, flexGrow: 1 }}
      renderItem={({ item }) => (
        <PosterCard item={item} width={itemWidth} onPress={() => openMedia(item.mediaType, item.id)} />
      )}
    />
  );
}

function openMedia(mediaType: MediaType, id: number): void {
  switch (mediaType) {
    case 'movie':
      router.push({ pathname: '/movie/[id]', params: { id: String(id) } });
      return;
    case 'tv':
      router.push({ pathname: '/tv/[id]', params: { id: String(id) } });
      return;
    default:
      assertNever(mediaType);
  }
}

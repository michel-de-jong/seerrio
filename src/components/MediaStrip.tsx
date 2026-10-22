import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { assertNever } from '../api/assertNever';
import type { MediaItem, MediaType } from '../api/types';
import { en } from '../i18n/en';
import { useTheme } from '../theme/useTheme';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { PosterCard } from './PosterCard';
import { Skeleton } from './Skeleton';

type Props = {
  title: string;
  items: MediaItem[];
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
};

export function MediaStrip({ title, items, isLoading, error, onRetry }: Props) {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.space.sm }}>
      <Text accessibilityRole="header" style={{ color: theme.colors.text, fontSize: theme.font.heading, fontWeight: '700' }}>
        {title}
      </Text>
      {isLoading ? (
        <View style={{ flexDirection: 'row', gap: theme.space.sm }}>
          <Skeleton width={112} height={168} />
          <Skeleton width={112} height={168} />
        </View>
      ) : error ? (
        <ErrorState error={error} onRetry={onRetry} />
      ) : items.length === 0 ? (
        <EmptyState message={en.media.noRelated} />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: theme.space.sm }}>
          {items.map((item) => (
            <PosterCard
              key={`${item.mediaType}-${item.id}`}
              item={item}
              width={112}
              onPress={() => openMedia(item.mediaType, item.id)}
            />
          ))}
        </ScrollView>
      )}
    </View>
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

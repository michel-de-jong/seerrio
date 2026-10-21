import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { MediaItem } from '../api/types';
import { en } from '../i18n/en';
import { mediaTitle, mediaYear } from '../lib/format';
import { mediaDisplayStatus } from '../lib/status';
import { posterUrl } from '../lib/tmdb';
import { useTheme } from '../theme/useTheme';
import { StatusBadge } from './StatusBadge';

type Props = {
  item: MediaItem;
  width: number;
  onPress: () => void;
};

export function PosterCard({ item, width, onPress }: Props) {
  const theme = useTheme();
  const title = mediaTitle(item);
  const year = mediaYear(item);
  const uri = posterUrl(item.posterPath, 'w185');
  const height = width * 1.5;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={en.media.openTitle(title)}
      onPress={onPress}
      style={({ pressed }) => [styles.card, { width, opacity: pressed ? 0.85 : 1 }]}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width, height, borderRadius: theme.radius.md }} contentFit="cover" />
      ) : (
        <View style={[styles.fallback, { width, height, backgroundColor: theme.colors.skeleton, borderRadius: theme.radius.md }]}>
          <Text style={{ color: theme.colors.muted }}>{title.slice(0, 1)}</Text>
        </View>
      )}
      <Text numberOfLines={2} style={[styles.title, { color: theme.colors.text }]}>
        {title}
      </Text>
      <View style={styles.meta}>
        {year ? <Text style={{ color: theme.colors.muted, fontSize: theme.font.small }}>{year}</Text> : null}
        {item.mediaInfo?.status != null ? <StatusBadge status={mediaDisplayStatus(item.mediaInfo.status)} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 6,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  meta: {
    gap: 6,
  },
});

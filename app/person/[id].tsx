import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { MediaGrid } from '@/components/MediaGrid';
import { usePerson } from '@/features/media/hooks';
import { en } from '@/i18n/en';
import { parseRouteId } from '@/lib/format';
import { posterUrl } from '@/lib/tmdb';
import { useTheme } from '@/theme/useTheme';

export default function PersonScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = parseRouteId(params.id);
  if (id == null) return <EmptyState message={en.errors.invalidLink} />;
  return <Person id={id} />;
}

function Person({ id }: { id: number }) {
  const theme = useTheme();
  const query = usePerson(id);
  if (query.error) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  const person = query.data;
  const image = posterUrl(person?.profilePath, 'w342');

  return (
    <MediaGrid
      items={person?.credits ?? []}
      isLoading={query.isLoading}
      isRefreshing={query.isRefetching}
      error={query.error}
      empty={en.media.noCredits}
      onRefresh={() => void query.refetch()}
      onRetry={() => void query.refetch()}
      onEndReached={() => undefined}
      header={
        person ? (
          <View style={{ gap: theme.space.md }}>
            <Stack.Screen options={{ title: person.name }} />
            <View style={{ flexDirection: 'row', gap: theme.space.md }}>
              {image ? (
                <Image
                  source={{ uri: image }}
                  accessibilityLabel={person.name}
                  style={{ width: 96, height: 144, borderRadius: theme.radius.md }}
                  contentFit="cover"
                />
              ) : null}
              <View style={{ flex: 1, gap: theme.space.sm }}>
                <Text accessibilityRole="header" style={{ color: theme.colors.text, fontSize: theme.font.heading, fontWeight: '700' }}>
                  {person.name}
                </Text>
                {person.knownForDepartment ? <Text style={{ color: theme.colors.muted }}>{person.knownForDepartment}</Text> : null}
                {person.placeOfBirth ? <Text style={{ color: theme.colors.muted }}>{person.placeOfBirth}</Text> : null}
              </View>
            </View>
            {person.biography ? <Text style={{ color: theme.colors.text, lineHeight: 22 }}>{person.biography}</Text> : null}
            <Text accessibilityRole="header" style={{ color: theme.colors.text, fontSize: theme.font.heading, fontWeight: '700' }}>
              {en.media.credits}
            </Text>
          </View>
        ) : undefined
      }
    />
  );
}

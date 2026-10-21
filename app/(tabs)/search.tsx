import { useState } from 'react';
import { View } from 'react-native';

import { MediaGrid } from '@/components/MediaGrid';
import { TextField } from '@/components/TextField';
import { useDebouncedValue, useSearch } from '@/features/search/hooks';
import { en } from '@/i18n/en';
import { useTheme } from '@/theme/useTheme';

export default function SearchScreen() {
  const theme = useTheme();
  const [text, setText] = useState('');
  const queryText = useDebouncedValue(text, 300);
  const query = useSearch(queryText);
  const items = query.data?.pages.flatMap((page) => page.results) ?? [];
  const waiting = queryText.trim().length === 0;
  return (
    <MediaGrid
      items={waiting ? [] : items}
      isLoading={!waiting && query.isLoading}
      isRefreshing={!waiting && query.isRefetching && !query.isFetchingNextPage}
      error={waiting ? null : query.error}
      empty={waiting ? en.search.prompt : en.search.empty}
      onRefresh={() => {
        if (!waiting) void query.refetch();
      }}
      onRetry={() => {
        void query.refetch();
      }}
      onEndReached={() => {
        if (!waiting && query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
      }}
      header={
        <View style={{ marginBottom: theme.space.sm }}>
          <TextField
            label={en.search.label}
            value={text}
            onChangeText={setText}
            placeholder={en.search.placeholder}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            clearButtonMode="while-editing"
            returnKeyType="search"
          />
        </View>
      }
    />
  );
}

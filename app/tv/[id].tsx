import { useLocalSearchParams } from 'expo-router';

import { EmptyState } from '@/components/EmptyState';
import { DetailsView } from '@/features/media/DetailsView';
import { en } from '@/i18n/en';
import { parseRouteId } from '@/lib/format';

export default function TvScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = parseRouteId(params.id);
  if (id == null) return <EmptyState message={en.errors.generic} />;
  return <DetailsView mediaType="tv" id={id} />;
}

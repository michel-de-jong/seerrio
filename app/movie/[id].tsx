import { useLocalSearchParams } from 'expo-router';

import { DetailsView } from '@/features/media/DetailsView';
import { EmptyState } from '@/components/EmptyState';
import { parseRouteId } from '@/lib/format';
import { en } from '@/i18n/en';

export default function MovieScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = parseRouteId(params.id);
  if (id == null) return <EmptyState message={en.errors.generic} />;
  return <DetailsView mediaType="movie" id={id} />;
}

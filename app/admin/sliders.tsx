import { Stack } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Switch, Text, View } from 'react-native';

import type { DiscoverSlider } from '@/api/types';
import { useSession } from '@/auth/AuthProvider';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { OfflineBanner } from '@/components/OfflineBanner';
import { Skeleton } from '@/components/Skeleton';
import { useDiscoverSliders, useUpdateDiscoverSliders } from '@/features/admin/hooks';
import { ErrorMessage } from '@/components/ErrorMessage';
import { en } from '@/i18n/en';
import { hasPermission, Permission } from '@/lib/permissions';
import { useTheme } from '@/theme/useTheme';

export default function SlidersScreen() {
  const { session } = useSession();
  if (session.status !== 'signedIn' || !hasPermission(session.user.permissions, Permission.ADMIN)) {
    return <EmptyState message={en.errors.forbidden} />;
  }
  return <Sliders />;
}

function Sliders() {
  const query = useDiscoverSliders();
  const theme = useTheme();
  if (query.isLoading) return <View style={{ padding: theme.space.md }}><Skeleton width={280} height={260} /></View>;
  if (query.error || !query.data) return <ErrorState error={query.error ?? new Error('Missing sliders')} onRetry={() => void query.refetch()} />;
  return <SliderEditor initial={query.data} />;
}

function SliderEditor({ initial }: { initial: DiscoverSlider[] }) {
  const theme = useTheme();
  const mutation = useUpdateDiscoverSliders();
  const [sliders, setSliders] = useState(initial);
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= sliders.length) return;
    setSliders((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };
  return (
    <ScrollView contentContainerStyle={{ padding: theme.space.md, paddingBottom: theme.space.xl, gap: theme.space.md }}>
      <Stack.Screen options={{ title: en.serverAdmin.sliders }} />
      <OfflineBanner />
      {sliders.length === 0 ? <EmptyState message={en.serverAdmin.slidersEmpty} /> : null}
      {sliders.map((slider, index) => (
        <View key={slider.id} style={{ padding: theme.space.md, borderRadius: theme.radius.md, backgroundColor: theme.colors.surface, gap: theme.space.sm }}>
          <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{slider.title || en.serverAdmin.builtInSlider(slider.type)}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: theme.colors.text }}>{en.serverAdmin.enabled}</Text>
            <Switch
              accessibilityLabel={en.serverAdmin.sliderEnabled(slider.title || String(slider.type))}
              value={slider.enabled}
              onValueChange={(enabled) =>
                setSliders((current) => current.map((item) => item.id === slider.id ? { ...item, enabled } : item))
              }
            />
          </View>
          <View style={{ flexDirection: 'row', gap: theme.space.sm }}>
            <Button label={en.serverAdmin.moveUp} variant="secondary" disabled={index === 0} onPress={() => move(index, -1)} />
            <Button label={en.serverAdmin.moveDown} variant="secondary" disabled={index === sliders.length - 1} onPress={() => move(index, 1)} />
          </View>
        </View>
      ))}
      <Button label={en.actions.save} loading={mutation.isPending} onPress={() => mutation.mutate(sliders)} />
      <ErrorMessage error={mutation.error} />
    </ScrollView>
  );
}

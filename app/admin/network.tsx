import { Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Switch, Text, TextInput, View } from 'react-native';

import type { AdminNetworkSettings } from '@/api/types';
import { useSession } from '@/auth/AuthProvider';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { OfflineBanner } from '@/components/OfflineBanner';
import { Skeleton } from '@/components/Skeleton';
import { useAdminNetworkSettings, useUpdateAdminNetworkSettings } from '@/features/admin/hooks';
import { en } from '@/i18n/en';
import { canManageSettings } from '@/lib/permissions';
import { presentError } from '@/lib/presentError';
import { useTheme } from '@/theme/useTheme';

export default function NetworkSettingsScreen() {
  const { session } = useSession();
  if (session.status !== 'signedIn' || !canManageSettings(session.user.permissions)) {
    return <EmptyState message={en.errors.forbidden} />;
  }
  return <NetworkSettings />;
}

function NetworkSettings() {
  const query = useAdminNetworkSettings();
  const theme = useTheme();
  if (query.isLoading) return <View style={{ padding: theme.space.md }}><Skeleton width={280} height={240} /></View>;
  if (query.error || !query.data) return <ErrorState error={query.error ?? new Error('Missing settings')} onRetry={() => void query.refetch()} />;
  return <NetworkForm initial={query.data} />;
}

function NetworkForm({ initial }: { initial: AdminNetworkSettings }) {
  const theme = useTheme();
  const mutation = useUpdateAdminNetworkSettings();
  const [csrfProtection, setCsrfProtection] = useState(initial.csrfProtection);
  const [forceIpv4First, setForceIpv4First] = useState(initial.forceIpv4First);
  const [dnsCacheEnabled, setDnsCacheEnabled] = useState(initial.dnsCacheEnabled);
  const [minTtl, setMinTtl] = useState(initial.dnsForceMinTtl == null ? '' : String(initial.dnsForceMinTtl));
  const [maxTtl, setMaxTtl] = useState(initial.dnsForceMaxTtl == null ? '' : String(initial.dnsForceMaxTtl));
  const parsedMin = integer(minTtl);
  const parsedMax = integer(maxTtl);
  const valid = parsedMin !== null && parsedMax !== null;
  const save = () => {
    const perform = () =>
      mutation.mutate({
        ...initial,
        csrfProtection,
        forceIpv4First,
        dnsCacheEnabled,
        dnsForceMinTtl: parsedMin ?? undefined,
        dnsForceMaxTtl: parsedMax ?? undefined,
      });
    if (initial.csrfProtection && !csrfProtection) {
      Alert.alert(en.serverAdmin.csrfTitle, en.serverAdmin.csrfBody, [
        { text: en.actions.cancel, style: 'cancel' },
        { text: en.actions.save, style: 'destructive', onPress: perform },
      ]);
      return;
    }
    perform();
  };

  return (
    <ScrollView contentContainerStyle={{ padding: theme.space.md, paddingBottom: theme.space.xl, gap: theme.space.md }}>
      <Stack.Screen options={{ title: en.serverAdmin.network }} />
      <OfflineBanner />
      <Toggle label={en.serverAdmin.csrf} value={csrfProtection} onValueChange={setCsrfProtection} />
      <Toggle label={en.serverAdmin.ipv4} value={forceIpv4First} onValueChange={setForceIpv4First} />
      <Toggle label={en.serverAdmin.dnsCache} value={dnsCacheEnabled} onValueChange={setDnsCacheEnabled} />
      <Field label={en.serverAdmin.dnsMinTtl} value={minTtl} onChangeText={setMinTtl} />
      <Field label={en.serverAdmin.dnsMaxTtl} value={maxTtl} onChangeText={setMaxTtl} />
      <Text style={{ color: theme.colors.muted }}>{en.serverAdmin.trustProxy(initial.trustProxy)}</Text>
      <Text style={{ color: theme.colors.muted }}>{en.serverAdmin.proxyExcluded}</Text>
      <Button label={en.actions.save} loading={mutation.isPending} disabled={!valid} onPress={save} />
      {mutation.error ? <Text accessibilityRole="alert" style={{ color: theme.colors.danger }}>{presentError(mutation.error)}</Text> : null}
    </ScrollView>
  );
}

function Toggle({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (value: boolean) => void }) {
  const theme = useTheme();
  return <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Text style={{ flex: 1, color: theme.colors.text }}>{label}</Text><Switch accessibilityLabel={label} value={value} onValueChange={onValueChange} /></View>;
}

function Field({ label, value, onChangeText }: { label: string; value: string; onChangeText: (value: string) => void }) {
  const theme = useTheme();
  return <View style={{ gap: 4 }}><Text style={{ color: theme.colors.text }}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} keyboardType="numbers-and-punctuation" style={{ color: theme.colors.text, backgroundColor: theme.colors.surface, padding: 12, borderRadius: theme.radius.sm }} /></View>;
}

function integer(value: string): number | undefined | null {
  if (!value.trim()) return undefined;
  if (!/^-?\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';

import type { OverrideRule } from '@/api/types';
import { useSession } from '@/auth/AuthProvider';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { OfflineBanner } from '@/components/OfflineBanner';
import { Skeleton } from '@/components/Skeleton';
import { useOverrideRules, useSaveOverrideRule } from '@/features/admin/hooks';
import { en } from '@/i18n/en';
import { parseRouteId } from '@/lib/format';
import { hasPermission, Permission } from '@/lib/permissions';
import { presentError } from '@/lib/presentError';
import { useTheme } from '@/theme/useTheme';

export default function OverrideRuleScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id ? parseRouteId(params.id) : null;
  const { session } = useSession();
  if (session.status !== 'signedIn' || !hasPermission(session.user.permissions, Permission.ADMIN)) {
    return <EmptyState message={en.errors.forbidden} />;
  }
  return <RuleLoader id={id} />;
}

function RuleLoader({ id }: { id: number | null }) {
  const query = useOverrideRules();
  const theme = useTheme();
  if (id == null) return <RuleForm initial={{}} />;
  if (query.isLoading) return <View style={{ padding: theme.space.md }}><Skeleton width={280} height={260} /></View>;
  if (query.error) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  const rule = query.data?.find((item) => item.id === id);
  if (!rule) return <EmptyState message={en.serverAdmin.ruleMissing} />;
  return <RuleForm initial={rule} />;
}

function RuleForm({ initial }: { initial: OverrideRule | Omit<OverrideRule, 'id'> }) {
  const theme = useTheme();
  const mutation = useSaveOverrideRule();
  const [users, setUsers] = useState(initial.users ?? '');
  const [genre, setGenre] = useState(initial.genre ?? '');
  const [language, setLanguage] = useState(initial.language ?? '');
  const [keywords, setKeywords] = useState(initial.keywords ?? '');
  const [profileId, setProfileId] = useState(numberText(initial.profileId));
  const [rootFolder, setRootFolder] = useState(initial.rootFolder ?? '');
  const [tags, setTags] = useState(initial.tags ?? '');
  const [radarrServiceId, setRadarrServiceId] = useState(numberText(initial.radarrServiceId));
  const [sonarrServiceId, setSonarrServiceId] = useState(numberText(initial.sonarrServiceId));
  const numericValues = [profileId, radarrServiceId, sonarrServiceId].map(optionalPositiveInteger);
  const valid = numericValues.every((value) => value !== null);
  const fields = [
    { label: en.serverAdmin.ruleUsers, value: users, onChangeText: setUsers },
    { label: en.serverAdmin.ruleGenre, value: genre, onChangeText: setGenre },
    { label: en.serverAdmin.ruleLanguage, value: language, onChangeText: setLanguage },
    { label: en.serverAdmin.ruleKeywords, value: keywords, onChangeText: setKeywords },
    { label: en.serverAdmin.ruleProfile, value: profileId, onChangeText: setProfileId, numeric: true },
    { label: en.serverAdmin.ruleRootFolder, value: rootFolder, onChangeText: setRootFolder },
    { label: en.serverAdmin.ruleTags, value: tags, onChangeText: setTags },
    { label: en.serverAdmin.ruleRadarr, value: radarrServiceId, onChangeText: setRadarrServiceId, numeric: true },
    { label: en.serverAdmin.ruleSonarr, value: sonarrServiceId, onChangeText: setSonarrServiceId, numeric: true },
  ];
  const save = () => {
    if (!valid) return;
    const body = {
      ...('id' in initial ? { id: initial.id } : {}),
      ...optionalString('users', users),
      ...optionalString('genre', genre),
      ...optionalString('language', language),
      ...optionalString('keywords', keywords),
      ...(typeof numericValues[0] === 'number' ? { profileId: numericValues[0] } : {}),
      ...optionalString('rootFolder', rootFolder),
      ...optionalString('tags', tags),
      ...(typeof numericValues[1] === 'number' ? { radarrServiceId: numericValues[1] } : {}),
      ...(typeof numericValues[2] === 'number' ? { sonarrServiceId: numericValues[2] } : {}),
    };
    mutation.mutate(body, { onSuccess: () => router.back() });
  };
  return (
    <ScrollView contentContainerStyle={{ padding: theme.space.md, paddingBottom: theme.space.xl, gap: theme.space.md }}>
      <Stack.Screen options={{ title: 'id' in initial ? en.serverAdmin.editRule : en.serverAdmin.addRule }} />
      <OfflineBanner />
      <Text style={{ color: theme.colors.muted }}>{en.serverAdmin.ruleHint}</Text>
      {fields.map((field) => (
        <View key={field.label} style={{ gap: 4 }}>
          <Text style={{ color: theme.colors.text }}>{field.label}</Text>
          <TextInput
            accessibilityLabel={field.label}
            value={field.value}
            onChangeText={field.onChangeText}
            keyboardType={field.numeric ? 'number-pad' : 'default'}
            autoCapitalize="none"
            style={{ color: theme.colors.text, backgroundColor: theme.colors.surface, padding: 12, borderRadius: theme.radius.sm }}
          />
        </View>
      ))}
      <Button label={en.actions.save} loading={mutation.isPending} disabled={!valid} onPress={save} />
      {mutation.error ? <Text accessibilityRole="alert" style={{ color: theme.colors.danger }}>{presentError(mutation.error)}</Text> : null}
    </ScrollView>
  );
}

function optionalString(key: string, value: string): Record<string, string> {
  return value.trim() ? { [key]: value.trim() } : {};
}

function optionalPositiveInteger(value: string): number | undefined | null {
  if (!value.trim()) return undefined;
  if (!/^[1-9]\d*$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function numberText(value: number | undefined): string {
  return value == null ? '' : String(value);
}

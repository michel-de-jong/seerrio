import { router, Stack } from 'expo-router';
import { Alert, ScrollView, Text, View } from 'react-native';

import { useSession } from '@/auth/AuthProvider';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { OfflineBanner } from '@/components/OfflineBanner';
import { Skeleton } from '@/components/Skeleton';
import { useDeleteOverrideRule, useOverrideRules } from '@/features/admin/hooks';
import { ErrorMessage } from '@/components/ErrorMessage';
import { en } from '@/i18n/en';
import { hasPermission, Permission } from '@/lib/permissions';
import { useTheme } from '@/theme/useTheme';

export default function OverrideRulesScreen() {
  const { session } = useSession();
  if (session.status !== 'signedIn' || !hasPermission(session.user.permissions, Permission.ADMIN)) {
    return <EmptyState message={en.errors.forbidden} />;
  }
  return <Rules />;
}

function Rules() {
  const theme = useTheme();
  const query = useOverrideRules();
  const remove = useDeleteOverrideRule();
  if (query.isLoading) return <View style={{ padding: theme.space.md }}><Skeleton width={280} height={240} /></View>;
  if (query.error || !query.data) return <ErrorState error={query.error ?? new Error('Missing rules')} onRetry={() => void query.refetch()} />;
  return (
    <ScrollView contentContainerStyle={{ padding: theme.space.md, paddingBottom: theme.space.xl, gap: theme.space.md }}>
      <Stack.Screen options={{ title: en.serverAdmin.overrideRules }} />
      <OfflineBanner />
      <Button label={en.serverAdmin.addRule} onPress={() => router.push('/admin/override-rule')} />
      {query.data.length === 0 ? <EmptyState message={en.serverAdmin.rulesEmpty} /> : null}
      {query.data.map((rule) => (
        <View key={rule.id} style={{ backgroundColor: theme.colors.surface, padding: theme.space.md, borderRadius: theme.radius.md, gap: theme.space.sm }}>
          <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{en.serverAdmin.rule(rule.id)}</Text>
          <Text style={{ color: theme.colors.muted }}>{[rule.genre, rule.language, rule.keywords].filter(Boolean).join(' · ') || en.serverAdmin.ruleAll}</Text>
          <View style={{ flexDirection: 'row', gap: theme.space.sm }}>
            <Button label={en.actions.edit} variant="secondary" onPress={() => router.push({ pathname: '/admin/override-rule', params: { id: String(rule.id) } })} />
            <Button
              label={en.actions.remove}
              variant="danger"
              loading={remove.isPending}
              onPress={() =>
                Alert.alert(en.serverAdmin.deleteRuleTitle, en.serverAdmin.deleteRuleBody, [
                  { text: en.actions.cancel, style: 'cancel' },
                  { text: en.actions.remove, style: 'destructive', onPress: () => remove.mutate(rule.id) },
                ])
              }
            />
          </View>
        </View>
      ))}
      <ErrorMessage error={remove.error} />
    </ScrollView>
  );
}

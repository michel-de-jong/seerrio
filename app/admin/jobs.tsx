import { Stack } from 'expo-router';
import { Alert, ScrollView, Text, View } from 'react-native';

import { useSession } from '@/auth/AuthProvider';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { OfflineBanner } from '@/components/OfflineBanner';
import { Skeleton } from '@/components/Skeleton';
import { useChangeServerJob, useServerJobs } from '@/features/admin/hooks';
import { ErrorMessage } from '@/components/ErrorMessage';
import { en } from '@/i18n/en';
import { formatDate } from '@/lib/format';
import { canManageSettings } from '@/lib/permissions';
import { useTheme } from '@/theme/useTheme';

export default function JobsScreen() {
  const { session } = useSession();
  if (session.status !== 'signedIn' || !canManageSettings(session.user.permissions)) {
    return <EmptyState message={en.errors.forbidden} />;
  }
  return <Jobs />;
}

function Jobs() {
  const theme = useTheme();
  const query = useServerJobs();
  const mutation = useChangeServerJob();
  if (query.isLoading) return <View style={{ padding: theme.space.md }}><Skeleton width={280} height={240} /></View>;
  if (query.error || !query.data) return <ErrorState error={query.error ?? new Error('Missing jobs')} onRetry={() => void query.refetch()} />;
  return (
    <ScrollView contentContainerStyle={{ padding: theme.space.md, paddingBottom: theme.space.xl, gap: theme.space.md }}>
      <Stack.Screen options={{ title: en.serverAdmin.jobs }} />
      <OfflineBanner />
      {query.data.length === 0 ? <EmptyState message={en.serverAdmin.jobsEmpty} /> : null}
      {query.data.map((job) => (
        <View key={job.id} style={{ padding: theme.space.md, borderRadius: theme.radius.md, backgroundColor: theme.colors.surface, gap: theme.space.sm }}>
          <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{job.name}</Text>
          <Text style={{ color: theme.colors.muted }}>
            {job.running ? en.serverAdmin.running : en.serverAdmin.idle}
            {job.nextExecutionTime ? ` · ${en.serverAdmin.nextRun(formatDate(job.nextExecutionTime))}` : ''}
          </Text>
          <Button
            label={job.running ? en.serverAdmin.cancelJob : en.serverAdmin.runJob}
            variant={job.running ? 'danger' : 'secondary'}
            loading={mutation.isPending}
            onPress={() =>
              Alert.alert(
                job.running ? en.serverAdmin.cancelJobTitle : en.serverAdmin.runJobTitle,
                en.serverAdmin.jobBody(job.name),
                [
                  { text: en.actions.cancel, style: 'cancel' },
                  {
                    text: job.running ? en.serverAdmin.cancelJob : en.serverAdmin.runJob,
                    style: job.running ? 'destructive' : 'default',
                    onPress: () => mutation.mutate({ id: job.id, action: job.running ? 'cancel' : 'run' }),
                  },
                ],
              )
            }
          />
        </View>
      ))}
      <ErrorMessage error={mutation.error} />
    </ScrollView>
  );
}

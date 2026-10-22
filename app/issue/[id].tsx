import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, View } from 'react-native';

import type { IssueComment } from '@/api/types';
import { useSession } from '@/auth/AuthProvider';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { OfflineBanner } from '@/components/OfflineBanner';
import { Skeleton } from '@/components/Skeleton';
import {
  useAddIssueComment,
  useDeleteIssue,
  useDeleteIssueComment,
  useIssue,
  useSetIssueStatus,
  useUpdateIssueComment,
} from '@/features/issues/hooks';
import { useMediaDetails } from '@/features/media/hooks';
import { en } from '@/i18n/en';
import { formatDate, parseRouteId } from '@/lib/format';
import { issueStatusLabel, issueTypeLabel } from '@/lib/issues';
import { canManageIssues } from '@/lib/permissions';
import { presentError } from '@/lib/presentError';
import { useTheme } from '@/theme/useTheme';

export default function IssueDetailsScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = parseRouteId(params.id);
  if (id == null) return <EmptyState message={en.errors.generic} />;
  return <IssueDetails id={id} />;
}

function IssueDetails({ id }: { id: number }) {
  const theme = useTheme();
  const { session } = useSession();
  const query = useIssue(id);
  const issue = query.data;
  const details = useMediaDetails(issue?.media.mediaType ?? null, issue?.media.tmdbId ?? null);
  const addComment = useAddIssueComment();
  const setStatus = useSetIssueStatus();
  const removeIssue = useDeleteIssue();
  const updateComment = useUpdateIssueComment();
  const removeComment = useDeleteIssueComment();
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingMessage, setEditingMessage] = useState('');

  if (query.isLoading) return <View style={{ padding: theme.space.md }}><Skeleton width={280} height={180} /></View>;
  if (query.error || !issue) return <ErrorState error={query.error ?? new Error('Missing issue')} onRetry={() => void query.refetch()} />;

  const userId = session.status === 'signedIn' ? session.user.id : 0;
  const permissions = session.status === 'signedIn' ? session.user.permissions : 0;
  const manager = canManageIssues(permissions);
  const owner = issue.createdBy.id === userId;
  const canParticipate = manager || owner;
  const canDelete = manager || (owner && issue.comments.length <= 1);
  const title = details.data ? ('title' in details.data ? details.data.title : details.data.name) : en.media.untitled;
  const mutationError = addComment.error ?? setStatus.error ?? removeIssue.error ?? updateComment.error ?? removeComment.error;

  return (
    <ScrollView contentContainerStyle={{ padding: theme.space.md, paddingBottom: theme.space.xl, gap: theme.space.md }}>
      <Stack.Screen options={{ title: en.issues.detailTitle }} />
      <OfflineBanner />
      <Text accessibilityRole="header" style={{ color: theme.colors.text, fontSize: theme.font.title, fontWeight: '700' }}>{title}</Text>
      <Text style={{ color: theme.colors.muted }}>{issueTypeLabel(issue.issueType)} · {issueStatusLabel(issue.status)}</Text>
      {issue.problemSeason ? <Text style={{ color: theme.colors.muted }}>{en.issues.location(issue.problemSeason, issue.problemEpisode)}</Text> : null}
      <Text style={{ color: theme.colors.muted }}>{en.issues.reportedBy(issue.createdBy.displayName || issue.createdBy.email || String(issue.createdBy.id))}</Text>

      {issue.comments.map((comment) => (
        <Comment
          key={comment.id}
          comment={comment}
          canModify={manager || comment.user.id === userId}
          editing={editingId === comment.id}
          editingMessage={editingMessage}
          setEditingMessage={setEditingMessage}
          onEdit={() => {
            setEditingId(comment.id);
            setEditingMessage(comment.message);
          }}
          onCancel={() => setEditingId(null)}
          onSave={() =>
            void updateComment
              .mutateAsync({ commentId: comment.id, message: editingMessage.trim() })
              .then(() => setEditingId(null))
          }
          onDelete={() =>
            confirm(en.issues.deleteCommentTitle, en.issues.deleteCommentBody, en.actions.remove, () =>
              void removeComment.mutate(comment.id),
            )
          }
        />
      ))}

      {canParticipate ? (
        <View style={{ gap: theme.space.sm }}>
          <TextInput
            accessibilityLabel={en.issues.addComment}
            placeholder={en.issues.commentPlaceholder}
            placeholderTextColor={theme.colors.muted}
            multiline
            value={message}
            onChangeText={setMessage}
            style={{ minHeight: 88, color: theme.colors.text, backgroundColor: theme.colors.surface, padding: 12, borderRadius: theme.radius.sm, textAlignVertical: 'top' }}
          />
          <Button
            label={en.issues.addComment}
            loading={addComment.isPending}
            disabled={!message.trim()}
            onPress={() =>
              void addComment.mutateAsync({ issueId: issue.id, message: message.trim() }).then(() => setMessage(''))
            }
          />
        </View>
      ) : null}

      {canParticipate ? (
        <Button
          label={issue.status === 1 ? en.issues.resolve : en.issues.reopen}
          variant="secondary"
          loading={setStatus.isPending}
          onPress={() =>
            confirm(en.issues.statusTitle, en.issues.statusBody, issue.status === 1 ? en.issues.resolve : en.issues.reopen, () =>
              void setStatus.mutate({ issueId: issue.id, status: issue.status === 1 ? 'resolved' : 'open' }),
            )
          }
        />
      ) : null}
      {canDelete ? (
        <Button
          label={en.issues.deleteIssue}
          variant="danger"
          loading={removeIssue.isPending}
          onPress={() =>
            confirm(en.issues.deleteTitle, en.issues.deleteBody, en.issues.deleteIssue, () =>
              void removeIssue.mutate(issue.id, { onSuccess: () => router.back() }),
            )
          }
        />
      ) : null}
      {mutationError ? <Text accessibilityRole="alert" style={{ color: theme.colors.danger }}>{presentError(mutationError)}</Text> : null}
    </ScrollView>
  );
}

function Comment({
  comment,
  canModify,
  editing,
  editingMessage,
  setEditingMessage,
  onEdit,
  onCancel,
  onSave,
  onDelete,
}: {
  comment: IssueComment;
  canModify: boolean;
  editing: boolean;
  editingMessage: string;
  setEditingMessage: (value: string) => void;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={{ backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: theme.space.md, gap: theme.space.sm }}>
      <Text style={{ color: theme.colors.muted }}>
        {comment.user.displayName || comment.user.email || String(comment.user.id)} · {formatDate(comment.createdAt)}
      </Text>
      {editing ? (
        <>
          <TextInput
            accessibilityLabel={en.issues.editComment}
            multiline
            value={editingMessage}
            onChangeText={setEditingMessage}
            style={{ color: theme.colors.text, minHeight: 72, textAlignVertical: 'top' }}
          />
          <View style={{ flexDirection: 'row', gap: theme.space.sm }}>
            <Button label={en.actions.save} disabled={!editingMessage.trim()} onPress={onSave} />
            <Button label={en.actions.cancel} variant="secondary" onPress={onCancel} />
          </View>
        </>
      ) : (
        <>
          <Text style={{ color: theme.colors.text, lineHeight: 22 }}>{comment.message}</Text>
          {canModify ? (
            <View style={{ flexDirection: 'row', gap: theme.space.sm }}>
              <Button label={en.actions.edit} variant="secondary" onPress={onEdit} />
              <Button label={en.actions.remove} variant="danger" onPress={onDelete} />
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

function confirm(title: string, body: string, action: string, onPress: () => void): void {
  Alert.alert(title, body, [
    { text: en.actions.cancel, style: 'cancel' },
    { text: action, style: 'destructive', onPress },
  ]);
}

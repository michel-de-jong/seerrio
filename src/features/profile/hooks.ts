import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { NotificationSettings, UserMainSettings } from '../../api/types';
import { notSignedIn } from '../../api/errors';
import { useSeerrClient } from '../../auth/AuthProvider';
import { queryKeys } from '../../lib/queryKeys';

export function useUserMainSettings(userId: number) {
  const client = useSeerrClient();
  return useQuery({
    queryKey: queryKeys.userMainSettings(userId),
    enabled: client != null && userId > 0,
    queryFn: ({ signal }) => {
      if (!client) throw notSignedIn();
      return client.getUserMainSettings(userId, signal);
    },
  });
}

export function useUpdateUserMainSettings(userId: number) {
  const client = useSeerrClient();
  const queryClient = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: (settings: UserMainSettings) => {
      if (!client) throw notSignedIn();
      return client.updateUserMainSettings(userId, settings);
    },
    onSuccess: (settings, input) => {
      queryClient.setQueryData(queryKeys.userMainSettings(userId), { ...input, ...settings });
    },
  });
}

export function useNotificationSettings(userId: number) {
  const client = useSeerrClient();
  return useQuery({
    queryKey: queryKeys.userNotifications(userId),
    enabled: client != null && userId > 0,
    gcTime: 0,
    queryFn: ({ signal }) => {
      if (!client) throw notSignedIn();
      return client.getNotificationSettings(userId, signal);
    },
  });
}

export function useUpdateNotificationSettings(userId: number) {
  const client = useSeerrClient();
  const queryClient = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: (settings: NotificationSettings) => {
      if (!client) throw notSignedIn();
      return client.updateNotificationSettings(userId, settings);
    },
    onSuccess: (settings) => {
      queryClient.setQueryData(queryKeys.userNotifications(userId), settings);
    },
  });
}

export function usePasswordStatus(userId: number) {
  const client = useSeerrClient();
  return useQuery({
    queryKey: queryKeys.passwordStatus(userId),
    enabled: client != null && userId > 0,
    queryFn: ({ signal }) => {
      if (!client) throw notSignedIn();
      return client.getPasswordStatus(userId, signal);
    },
  });
}

export function useChangePassword(userId: number) {
  const client = useSeerrClient();
  const queryClient = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: (input: { currentPassword?: string; newPassword: string }) => {
      if (!client) throw notSignedIn();
      return client.changePassword(userId, input.currentPassword, input.newPassword);
    },
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.passwordStatus(userId), true);
    },
  });
}

import { useQuery } from '@tanstack/react-query';

import { notSignedIn } from '../../api/errors';
import { useSeerrClient, useSession } from '../../auth/AuthProvider';
import { queryKeys } from '../../lib/queryKeys';

export function usePublicSettings() {
  const client = useSeerrClient();
  const { session } = useSession();
  const serverUrl = session.status === 'needsSignIn' || session.status === 'signedIn' ? session.serverUrl : null;
  return useQuery({
    queryKey: queryKeys.publicSettings(serverUrl ?? 'none'),
    enabled: client != null && serverUrl != null,
    queryFn: ({ signal }) => {
      if (!client) throw notSignedIn();
      return client.getPublicSettings(signal);
    },
  });
}

export function useServerStatus() {
  const client = useSeerrClient();
  const { session } = useSession();
  const serverUrl = session.status === 'signedIn' ? session.serverUrl : null;
  return useQuery({
    queryKey: queryKeys.status(serverUrl ?? 'none'),
    enabled: client != null && serverUrl != null,
    queryFn: ({ signal }) => {
      if (!client) throw notSignedIn();
      return client.getStatus(signal);
    },
  });
}

import { useQuery } from '@tanstack/react-query';

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
      if (!client) throw new Error('Missing client');
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
      if (!client) throw new Error('Missing client');
      return client.getStatus(signal);
    },
  });
}

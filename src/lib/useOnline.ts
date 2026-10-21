import { onlineManager } from '@tanstack/react-query';
import { addNetworkStateListener, getNetworkStateAsync, useNetworkState } from 'expo-network';
import { useEffect } from 'react';

import { isDeviceOnline } from './network';

export function useOnline(): boolean {
  return isDeviceOnline(useNetworkState());
}

export function OnlineManager() {
  useEffect(() => {
    return onlineManager.setEventListener((setOnline) => {
      const apply = (state: { isConnected?: boolean; isInternetReachable?: boolean }) => {
        setOnline(isDeviceOnline(state));
      };
      const subscription = addNetworkStateListener(apply);
      getNetworkStateAsync()
        .then(apply)
        .catch(() => {
          setOnline(true);
        });
      return () => subscription.remove();
    });
  }, []);
  return null;
}

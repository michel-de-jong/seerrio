export function isDeviceOnline(state: { isConnected?: boolean; isInternetReachable?: boolean }): boolean {
  if (state.isConnected === false) return false;
  if (state.isInternetReachable === false) return false;
  return true;
}

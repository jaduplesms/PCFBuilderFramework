import type { HarnessStore } from '../store/harness-store';

export function createClientShim(getState: () => HarnessStore) {
  return {
    disableScroll: false,
    getFormFactor(): number {
      return getState().formFactor;
    },
    getClient(): string {
      // Honour the explicit host setting if the maker chose a non-Web host;
      // otherwise fall back to form-factor-based inference for backwards
      // compatibility with existing scenarios that only set the device.
      const { host, formFactor } = getState();
      if (host && host !== 'Web') return host;
      return formFactor === 3 ? 'Mobile' : 'Web';
    },
    isOffline(): boolean {
      return getState().networkMode === 'offline';
    },
    isNetworkAvailable(): boolean {
      return getState().networkMode !== 'offline';
    },
  };
}

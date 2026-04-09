import type { HarnessStore } from '../store/harness-store';

export function createClientShim(getState: () => HarnessStore) {
  return {
    disableScroll: false,
    getFormFactor(): number {
      return getState().formFactor;
    },
    getClient(): string {
      return getState().formFactor === 3 ? 'Mobile' : 'Web';
    },
    isOffline(): boolean {
      return getState().networkMode === 'offline';
    },
    isNetworkAvailable(): boolean {
      return getState().networkMode !== 'offline';
    },
  };
}

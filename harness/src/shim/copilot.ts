import type { HarnessStore } from '../store/harness-store';

/**
 * Minimal stub for context.copilot. The real surface is internal/proprietary,
 * so we expose no-op implementations of the publicly observed methods that
 * log invocations to the harness console. Returning empty arrays / null avoids
 * crashes in controls that probe these methods without wrapping them in
 * feature-detection checks.
 */
export function createCopilotShim(getState: () => HarnessStore) {
  const log = (method: string, args?: any) =>
    getState().addLogEntry({ category: 'copilot', method, args });

  return {
    getRecommendations(options?: any): Promise<any[]> {
      log('getRecommendations', options);
      return Promise.resolve([]);
    },
    sendTelemetry(event: string, payload?: any): void {
      log('sendTelemetry', { event, payload });
    },
    sendFeedback(payload?: any): void {
      log('sendFeedback', payload);
    },
  };
}

import type { HarnessStore } from '../store/harness-store';

export function createNavigationShim(getState: () => HarnessStore) {
  const log = (method: string, args?: any) =>
    getState().addLogEntry({ category: 'navigation', method, args });

  return {
    openAlertDialog(alertStrings: any, options?: any): Promise<void> {
      log('openAlertDialog', { alertStrings, options });
      window.alert(alertStrings.text || alertStrings.confirmButtonLabel || 'Alert');
      return Promise.resolve();
    },
    openConfirmDialog(confirmStrings: any, options?: any): Promise<{ confirmed: boolean }> {
      log('openConfirmDialog', { confirmStrings, options });
      const confirmed = window.confirm(confirmStrings.text || 'Confirm?');
      return Promise.resolve({ confirmed });
    },
    openErrorDialog(options: any): Promise<void> {
      log('openErrorDialog', options);
      window.alert(`Error: ${options.message || options.details || 'Unknown error'}`);
      return Promise.resolve();
    },
    openForm(options: any, parameters?: any): Promise<any> {
      log('openForm', { options, parameters });
      return Promise.resolve({ savedEntityReference: [] });
    },
    openUrl(url: string, options?: any): void {
      log('openUrl', { url, options });
    },
    openWebResource(name: string, options?: any, data?: string): void {
      log('openWebResource', { name, options, data });
    },
  };
}

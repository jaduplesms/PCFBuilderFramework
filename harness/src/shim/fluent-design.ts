import { webLightTheme, webDarkTheme } from '@fluentui/react-components';
import type { HarnessStore } from '../store/harness-store';

export function createFluentDesignShim(getState: () => HarnessStore) {
  return {
    get tokenTheme() {
      return getState().isDarkMode ? webDarkTheme : webLightTheme;
    },
    get isDarkTheme() {
      return getState().isDarkMode;
    },
  };
}
import type { HarnessStore } from '../store/harness-store';

const LIGHT_TOKENS = {
  colorNeutralBackground1: '#ffffff',
  colorNeutralBackground2: '#fafafa',
  colorNeutralBackground3: '#f5f5f5',
  colorNeutralForeground1: '#242424',
  colorNeutralForeground2: '#616161',
  colorNeutralForeground3: '#9e9e9e',
  colorNeutralStroke1: '#d1d1d1',
  colorNeutralStroke2: '#e0e0e0',
  colorBrandBackground: '#0078d4',
  colorBrandForeground1: '#0078d4',
  colorBrandStroke1: '#0078d4',
  colorPaletteRedBackground3: '#d13438',
  colorPaletteRedForeground1: '#d13438',
  colorPaletteGreenBackground3: '#107c10',
  colorPaletteGreenForeground1: '#107c10',
  colorPaletteYellowBackground3: '#ff8c00',
  colorPaletteYellowForeground1: '#ff8c00',
  colorSubtleBackground: 'transparent',
  colorSubtleBackgroundHover: '#f5f5f5',
  colorSubtleBackgroundPressed: '#e0e0e0',
  borderRadiusMedium: '4px',
  borderRadiusLarge: '8px',
  fontFamilyBase: "'Segoe UI', system-ui, sans-serif",
  fontSizeBase200: '12px',
  fontSizeBase300: '14px',
  fontSizeBase400: '16px',
  fontSizeBase500: '20px',
  fontSizeBase600: '24px',
  fontWeightRegular: 400,
  fontWeightSemibold: 600,
  fontWeightBold: 700,
  spacingHorizontalS: '8px',
  spacingHorizontalM: '12px',
  spacingHorizontalL: '16px',
  spacingVerticalS: '8px',
  spacingVerticalM: '12px',
  spacingVerticalL: '16px',
  shadow2: '0 1px 2px rgba(0,0,0,0.14), 0 0 2px rgba(0,0,0,0.12)',
  shadow4: '0 2px 4px rgba(0,0,0,0.14), 0 0 2px rgba(0,0,0,0.12)',
};

const DARK_TOKENS: Record<string, any> = {
  ...LIGHT_TOKENS,
  colorNeutralBackground1: '#1f1f1f',
  colorNeutralBackground2: '#2d2d2d',
  colorNeutralBackground3: '#3d3d3d',
  colorNeutralForeground1: '#e0e0e0',
  colorNeutralForeground2: '#b0b0b0',
  colorNeutralForeground3: '#808080',
  colorNeutralStroke1: '#4d4d4d',
  colorNeutralStroke2: '#3d3d3d',
  colorSubtleBackgroundHover: '#2d2d2d',
  colorSubtleBackgroundPressed: '#3d3d3d',
};

export function createFluentDesignShim(getState: () => HarnessStore) {
  return {
    get tokenTheme() {
      return getState().isDarkMode ? DARK_TOKENS : LIGHT_TOKENS;
    },
    get isDarkTheme() {
      return getState().isDarkMode;
    },
  };
}

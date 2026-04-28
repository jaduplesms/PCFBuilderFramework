/**
 * Minimal runtime shims for Fluent UI v9 named exports that PCF bundles
 * commonly import: makeStyles, shorthands, tokens, webLightTheme, webDarkTheme,
 * FluentProvider, useFluent, etc.
 *
 * These are NOT pixel-perfect re-implementations — they aim to keep PCFs
 * functional in the harness with reasonable visual fidelity, so authors can
 * iterate on layout / token usage without spinning up a full Fluent runtime.
 *
 * The real `tokens` object on @fluentui/react-components has hundreds of
 * design-token CSS variable references. We mirror its shape with concrete
 * light-theme values so token references resolve to real CSS at runtime.
 */

// ── Design tokens (Fluent v9 web light theme, common subset) ────────────────
//
// Values pulled from @fluentui/tokens / web-light-theme. Anything not listed
// here falls through to a sensible default via the Proxy below.

const lightTokens: Record<string, string> = {
  // Spacing
  spacingHorizontalXXS: '2px',
  spacingHorizontalXS: '4px',
  spacingHorizontalSNudge: '6px',
  spacingHorizontalS: '8px',
  spacingHorizontalMNudge: '10px',
  spacingHorizontalM: '12px',
  spacingHorizontalL: '16px',
  spacingHorizontalXL: '20px',
  spacingHorizontalXXL: '24px',
  spacingHorizontalXXXL: '32px',
  spacingVerticalXXS: '2px',
  spacingVerticalXS: '4px',
  spacingVerticalSNudge: '6px',
  spacingVerticalS: '8px',
  spacingVerticalMNudge: '10px',
  spacingVerticalM: '12px',
  spacingVerticalL: '16px',
  spacingVerticalXL: '20px',
  spacingVerticalXXL: '24px',
  spacingVerticalXXXL: '32px',

  // Border radius
  borderRadiusNone: '0',
  borderRadiusSmall: '2px',
  borderRadiusMedium: '4px',
  borderRadiusLarge: '6px',
  borderRadiusXLarge: '8px',
  borderRadiusCircular: '10000px',

  // Font
  fontFamilyBase: "'Segoe UI', -apple-system, BlinkMacSystemFont, 'Roboto', sans-serif",
  fontFamilyMonospace: "Consolas, 'Courier New', monospace",
  fontSizeBase100: '10px',
  fontSizeBase200: '12px',
  fontSizeBase300: '14px',
  fontSizeBase400: '16px',
  fontSizeBase500: '20px',
  fontSizeBase600: '24px',
  fontWeightRegular: '400',
  fontWeightMedium: '500',
  fontWeightSemibold: '600',
  fontWeightBold: '700',
  lineHeightBase100: '14px',
  lineHeightBase200: '16px',
  lineHeightBase300: '20px',
  lineHeightBase400: '22px',
  lineHeightBase500: '28px',
  lineHeightBase600: '32px',

  // Brand foreground
  colorBrandForeground1: '#0F6CBD',
  colorBrandForeground2: '#115EA3',
  colorBrandForegroundLink: '#0F6CBD',
  colorBrandForegroundLinkHover: '#115EA3',
  colorBrandForegroundLinkPressed: '#0F548C',
  colorBrandForegroundOnLight: '#0F6CBD',
  colorBrandForegroundOnLightHover: '#115EA3',
  colorBrandForegroundOnLightPressed: '#0F548C',

  // Brand background
  colorBrandBackground: '#0F6CBD',
  colorBrandBackgroundHover: '#115EA3',
  colorBrandBackgroundPressed: '#0F548C',
  colorBrandBackgroundSelected: '#0F548C',
  colorBrandBackgroundStatic: '#0F6CBD',
  colorBrandBackground2: '#EBF3FC',
  colorBrandBackground2Hover: '#CFE4FA',
  colorBrandBackground2Pressed: '#94C8F9',
  colorBrandBackgroundInverted: '#FFFFFF',
  colorBrandBackgroundInvertedHover: '#EBF3FC',
  colorBrandBackgroundInvertedPressed: '#B4D6FA',
  colorBrandBackgroundInvertedSelected: '#CFE4FA',

  // Brand strokes
  colorBrandStroke1: '#0F6CBD',
  colorBrandStroke2: '#B4D6FA',
  colorBrandStroke2Hover: '#77B7F7',
  colorBrandStroke2Pressed: '#0E4775',
  colorBrandStroke2Contrast: '#B4D6FA',

  // Neutral foregrounds
  colorNeutralForeground1: '#242424',
  colorNeutralForeground1Hover: '#242424',
  colorNeutralForeground1Pressed: '#242424',
  colorNeutralForeground1Selected: '#242424',
  colorNeutralForeground2: '#424242',
  colorNeutralForeground2Hover: '#242424',
  colorNeutralForeground2Pressed: '#242424',
  colorNeutralForeground2Selected: '#242424',
  colorNeutralForeground2BrandHover: '#0F6CBD',
  colorNeutralForeground2BrandPressed: '#0F548C',
  colorNeutralForeground2BrandSelected: '#0F6CBD',
  colorNeutralForeground3: '#616161',
  colorNeutralForeground3Hover: '#424242',
  colorNeutralForeground3Pressed: '#424242',
  colorNeutralForeground3Selected: '#424242',
  colorNeutralForeground3BrandHover: '#0F6CBD',
  colorNeutralForeground3BrandPressed: '#0F548C',
  colorNeutralForeground3BrandSelected: '#0F6CBD',
  colorNeutralForeground4: '#707070',
  colorNeutralForegroundDisabled: '#BDBDBD',
  colorNeutralForegroundOnBrand: '#FFFFFF',
  colorNeutralForegroundInverted: '#FFFFFF',
  colorNeutralForegroundInvertedHover: '#FFFFFF',
  colorNeutralForegroundInvertedPressed: '#FFFFFF',
  colorNeutralForegroundInvertedSelected: '#FFFFFF',
  colorNeutralForegroundStaticInverted: '#FFFFFF',
  colorNeutralForegroundInvertedLink: '#FFFFFF',

  // Neutral backgrounds
  colorNeutralBackground1: '#FFFFFF',
  colorNeutralBackground1Hover: '#F5F5F5',
  colorNeutralBackground1Pressed: '#E0E0E0',
  colorNeutralBackground1Selected: '#EBEBEB',
  colorNeutralBackground2: '#FAFAFA',
  colorNeutralBackground2Hover: '#F0F0F0',
  colorNeutralBackground2Pressed: '#DBDBDB',
  colorNeutralBackground2Selected: '#E6E6E6',
  colorNeutralBackground3: '#F5F5F5',
  colorNeutralBackground3Hover: '#EBEBEB',
  colorNeutralBackground3Pressed: '#D6D6D6',
  colorNeutralBackground3Selected: '#E0E0E0',
  colorNeutralBackground4: '#F0F0F0',
  colorNeutralBackground5: '#EBEBEB',
  colorNeutralBackground6: '#E6E6E6',
  colorNeutralBackgroundStatic: '#FFFFFF',
  colorNeutralBackgroundAlpha: 'rgba(255, 255, 255, 0.5)',
  colorNeutralBackgroundDisabled: '#F0F0F0',
  colorNeutralBackgroundInverted: '#292929',
  colorNeutralBackgroundInvertedDisabled: 'rgba(255, 255, 255, 0.1)',

  // Subtle / transparent
  colorSubtleBackground: 'transparent',
  colorSubtleBackgroundHover: '#F5F5F5',
  colorSubtleBackgroundPressed: '#E0E0E0',
  colorSubtleBackgroundSelected: '#EBEBEB',
  colorTransparentBackground: 'transparent',
  colorTransparentBackgroundHover: 'transparent',
  colorTransparentBackgroundPressed: 'transparent',
  colorTransparentBackgroundSelected: 'transparent',

  // Neutral strokes
  colorNeutralStroke1: '#D1D1D1',
  colorNeutralStroke1Hover: '#C7C7C7',
  colorNeutralStroke1Pressed: '#B3B3B3',
  colorNeutralStroke1Selected: '#BDBDBD',
  colorNeutralStroke2: '#E0E0E0',
  colorNeutralStroke3: '#F0F0F0',
  colorNeutralStrokeAccessible: '#616161',
  colorNeutralStrokeAccessibleHover: '#575757',
  colorNeutralStrokeAccessiblePressed: '#4D4D4D',
  colorNeutralStrokeAccessibleSelected: '#0F6CBD',
  colorNeutralStrokeOnBrand: '#FFFFFF',
  colorNeutralStrokeOnBrand2: '#FFFFFF',
  colorNeutralStrokeDisabled: '#E0E0E0',
  colorNeutralStrokeInvertedDisabled: 'rgba(255, 255, 255, 0.4)',
  colorTransparentStroke: 'transparent',
  colorTransparentStrokeInteractive: 'transparent',
  colorTransparentStrokeDisabled: 'transparent',

  // Stroke focus
  colorStrokeFocus1: '#FFFFFF',
  colorStrokeFocus2: '#000000',

  // Status — danger / error
  colorStatusDangerBackground1: '#FDF3F4',
  colorStatusDangerBackground2: '#F1BBBC',
  colorStatusDangerBackground3: '#C50F1F',
  colorStatusDangerForeground1: '#B10E1C',
  colorStatusDangerForeground2: '#BC2F32',
  colorStatusDangerForeground3: '#FFFFFF',
  colorStatusDangerBorder1: '#F1BBBC',
  colorStatusDangerBorder2: '#C50F1F',

  // Status — success
  colorStatusSuccessBackground1: '#F1FAF1',
  colorStatusSuccessBackground2: '#9FD89F',
  colorStatusSuccessBackground3: '#107C10',
  colorStatusSuccessForeground1: '#0E700E',
  colorStatusSuccessForeground2: '#0E700E',
  colorStatusSuccessForeground3: '#FFFFFF',
  colorStatusSuccessBorder1: '#9FD89F',
  colorStatusSuccessBorder2: '#107C10',

  // Status — warning
  colorStatusWarningBackground1: '#FFF9F5',
  colorStatusWarningBackground2: '#FDCFB4',
  colorStatusWarningBackground3: '#F7630C',
  colorStatusWarningForeground1: '#BC4B09',
  colorStatusWarningForeground2: '#BC4B09',
  colorStatusWarningForeground3: '#FFFFFF',
  colorStatusWarningBorder1: '#FDCFB4',
  colorStatusWarningBorder2: '#BC4B09',

  // Shadow
  shadow2: '0 0 2px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.14)',
  shadow4: '0 0 2px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.14)',
  shadow8: '0 0 2px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.14)',
  shadow16: '0 0 2px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.14)',
  shadow28: '0 0 8px rgba(0,0,0,0.12), 0 14px 28px rgba(0,0,0,0.24)',
  shadow64: '0 0 8px rgba(0,0,0,0.12), 0 32px 64px rgba(0,0,0,0.24)',

  // Stroke widths
  strokeWidthThin: '1px',
  strokeWidthThick: '2px',
  strokeWidthThicker: '3px',
  strokeWidthThickest: '4px',

  // Curves / durations
  curveAccelerateMax: 'cubic-bezier(0.9, 0.1, 1, 0.2)',
  curveAccelerateMid: 'cubic-bezier(1, 0, 1, 1)',
  curveAccelerateMin: 'cubic-bezier(0.8, 0, 0.78, 1)',
  curveDecelerateMax: 'cubic-bezier(0.1, 0.9, 0.2, 1)',
  curveDecelerateMid: 'cubic-bezier(0, 0, 0, 1)',
  curveDecelerateMin: 'cubic-bezier(0.33, 0, 0.1, 1)',
  curveEasyEaseMax: 'cubic-bezier(0.8, 0, 0.2, 1)',
  curveEasyEase: 'cubic-bezier(0.33, 0, 0.67, 1)',
  curveLinear: 'cubic-bezier(0, 0, 1, 1)',
  durationUltraFast: '50ms',
  durationFaster: '100ms',
  durationFast: '150ms',
  durationNormal: '200ms',
  durationSlow: '300ms',
  durationSlower: '400ms',
  durationUltraSlow: '500ms',
};

/** Proxy so unknown token names return a sensible string instead of undefined. */
export const tokens: Record<string, string> = new Proxy(lightTokens, {
  get(target, prop) {
    if (typeof prop === 'symbol') return undefined;
    const key = prop as string;
    if (key in target) return target[key];
    // Inferred fallbacks
    if (key.startsWith('color')) return '#000000';
    if (key.startsWith('spacing')) return '0';
    if (key.startsWith('borderRadius')) return '0';
    if (key.startsWith('fontSize')) return '14px';
    if (key.startsWith('fontWeight')) return '400';
    if (key.startsWith('lineHeight')) return 'normal';
    if (key.startsWith('shadow')) return 'none';
    if (key.startsWith('strokeWidth')) return '1px';
    return '';
  },
});

// ── Theme objects ───────────────────────────────────────────────────────────

export const webLightTheme = lightTokens;
// For dark theme just remap a few — full dark palette can be added later.
export const webDarkTheme: Record<string, string> = {
  ...lightTokens,
  colorNeutralBackground1: '#292929',
  colorNeutralBackground1Hover: '#3D3D3D',
  colorNeutralBackground2: '#1F1F1F',
  colorNeutralBackground3: '#141414',
  colorNeutralForeground1: '#FFFFFF',
  colorNeutralForeground2: '#D6D6D6',
  colorNeutralForeground3: '#ADADAD',
  colorNeutralStroke1: '#666666',
  colorNeutralStroke2: '#525252',
  colorNeutralStroke3: '#3D3D3D',
};
export const teamsLightTheme = webLightTheme;
export const teamsDarkTheme = webDarkTheme;
export const teamsHighContrastTheme = webDarkTheme;

// ── shorthands — convert shorthand props to flat longhand records ──────────

export const shorthands = {
  border(width?: string, style?: string, color?: string): Record<string, string> {
    const r: Record<string, string> = {};
    if (width !== undefined) {
      r.borderTopWidth = width; r.borderRightWidth = width;
      r.borderBottomWidth = width; r.borderLeftWidth = width;
    }
    if (style !== undefined) {
      r.borderTopStyle = style; r.borderRightStyle = style;
      r.borderBottomStyle = style; r.borderLeftStyle = style;
    }
    if (color !== undefined) {
      r.borderTopColor = color; r.borderRightColor = color;
      r.borderBottomColor = color; r.borderLeftColor = color;
    }
    return r;
  },
  borderColor(top: string, right?: string, bottom?: string, left?: string): Record<string, string> {
    return {
      borderTopColor: top,
      borderRightColor: right ?? top,
      borderBottomColor: bottom ?? top,
      borderLeftColor: left ?? right ?? top,
    };
  },
  borderStyle(top: string, right?: string, bottom?: string, left?: string): Record<string, string> {
    return {
      borderTopStyle: top,
      borderRightStyle: right ?? top,
      borderBottomStyle: bottom ?? top,
      borderLeftStyle: left ?? right ?? top,
    };
  },
  borderWidth(top: string, right?: string, bottom?: string, left?: string): Record<string, string> {
    return {
      borderTopWidth: top,
      borderRightWidth: right ?? top,
      borderBottomWidth: bottom ?? top,
      borderLeftWidth: left ?? right ?? top,
    };
  },
  borderRadius(tl: string, tr?: string, br?: string, bl?: string): Record<string, string> {
    return {
      borderTopLeftRadius: tl,
      borderTopRightRadius: tr ?? tl,
      borderBottomRightRadius: br ?? tl,
      borderBottomLeftRadius: bl ?? tr ?? tl,
    };
  },
  padding(top: string, right?: string, bottom?: string, left?: string): Record<string, string> {
    return {
      paddingTop: top,
      paddingRight: right ?? top,
      paddingBottom: bottom ?? top,
      paddingLeft: left ?? right ?? top,
    };
  },
  margin(top: string, right?: string, bottom?: string, left?: string): Record<string, string> {
    return {
      marginTop: top,
      marginRight: right ?? top,
      marginBottom: bottom ?? top,
      marginLeft: left ?? right ?? top,
    };
  },
  inset(top: string, right?: string, bottom?: string, left?: string): Record<string, string> {
    return {
      top,
      right: right ?? top,
      bottom: bottom ?? top,
      left: left ?? right ?? top,
    };
  },
  gap(row: string, column?: string): Record<string, string> {
    return { rowGap: row, columnGap: column ?? row };
  },
  overflow(x: string, y?: string): Record<string, string> {
    return { overflowX: x, overflowY: y ?? x };
  },
  outline(width?: string, style?: string, color?: string): Record<string, string> {
    const r: Record<string, string> = {};
    if (width !== undefined) r.outlineWidth = width;
    if (style !== undefined) r.outlineStyle = style;
    if (color !== undefined) r.outlineColor = color;
    return r;
  },
  textDecoration(line?: string, style?: string, color?: string, thickness?: string): Record<string, string> {
    const r: Record<string, string> = {};
    if (line !== undefined) r.textDecorationLine = line;
    if (style !== undefined) r.textDecorationStyle = style;
    if (color !== undefined) r.textDecorationColor = color;
    if (thickness !== undefined) r.textDecorationThickness = thickness;
    return r;
  },
  flex(grow?: string | number, shrink?: string | number, basis?: string): Record<string, string | number> {
    const r: Record<string, string | number> = {};
    if (grow !== undefined) r.flexGrow = grow;
    if (shrink !== undefined) r.flexShrink = shrink;
    if (basis !== undefined) r.flexBasis = basis;
    return r;
  },
  grid(_value?: string): Record<string, string> { return {}; },
  gridArea(area: string): Record<string, string> { return { gridArea: area }; },
  transition(...args: any[]): Record<string, string> {
    return { transition: args.flat().join(' ') };
  },
};

// ── makeStyles — minimal griffel-like CSS-in-JS ─────────────────────────────

let styleSheetEl: HTMLStyleElement | null = null;
let classCounter = 0;

function ensureSheet(): HTMLStyleElement {
  if (!styleSheetEl) {
    styleSheetEl = document.createElement('style');
    styleSheetEl.setAttribute('data-pcf-workbench-fluentv9-shim', 'true');
    document.head.appendChild(styleSheetEl);
  }
  return styleSheetEl;
}

function camelToKebab(s: string): string {
  return s.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
}

function emitDeclarations(decls: Record<string, any>): string {
  const out: string[] = [];
  for (const [k, v] of Object.entries(decls)) {
    if (v == null) continue;
    if (typeof v === 'object') continue; // nested handled by caller
    out.push(`${camelToKebab(k)}: ${typeof v === 'number' && !UNITLESS.has(k) ? v + 'px' : v};`);
  }
  return out.join(' ');
}

const UNITLESS = new Set([
  'opacity', 'zIndex', 'fontWeight', 'flex', 'flexGrow', 'flexShrink',
  'lineHeight', 'order', 'columnCount',
]);

function buildClassRules(className: string, styleObj: Record<string, any>): string[] {
  const flat: Record<string, any> = {};
  const nested: Array<[string, Record<string, any>]> = [];

  for (const [k, v] of Object.entries(styleObj)) {
    if (v != null && typeof v === 'object' && !Array.isArray(v)) {
      nested.push([k, v]);
    } else {
      flat[k] = v;
    }
  }

  const rules: string[] = [];
  if (Object.keys(flat).length > 0) {
    rules.push(`.${className} { ${emitDeclarations(flat)} }`);
  }
  for (const [selector, decls] of nested) {
    // selector may be ':hover', '::after', '@media (...)', '& .child', etc.
    if (selector.startsWith('@')) {
      // Media query — wrap inner rule
      rules.push(`${selector} { .${className} { ${emitDeclarations(decls)} } }`);
    } else if (selector.startsWith('&')) {
      const sel = selector.slice(1).trim();
      rules.push(`.${className}${sel.startsWith(':') || sel.startsWith('.') || sel.startsWith('[') ? sel : ' ' + sel} { ${emitDeclarations(decls)} }`);
    } else if (selector.startsWith(':') || selector.startsWith('::') || selector.startsWith('[')) {
      rules.push(`.${className}${selector} { ${emitDeclarations(decls)} }`);
    } else {
      // descendant
      rules.push(`.${className} ${selector} { ${emitDeclarations(decls)} }`);
    }
  }
  return rules;
}

/**
 * Minimal makeStyles. Returns a hook (callable function) that returns a
 * record of class names. CSS is injected into a single <style> tag the
 * first time the hook is invoked.
 */
export function makeStyles<T extends Record<string, any>>(stylesIn: T): () => Record<keyof T, string> {
  let cached: Record<keyof T, string> | null = null;
  return () => {
    if (cached) return cached;
    const sheet = ensureSheet();
    const result: Record<string, string> = {};
    const rules: string[] = [];
    for (const [name, def] of Object.entries(stylesIn)) {
      const cls = `pcfwb-${name}-${++classCounter}`;
      result[name] = cls;
      rules.push(...buildClassRules(cls, def as Record<string, any>));
    }
    sheet.appendChild(document.createTextNode('\n' + rules.join('\n')));
    cached = result as Record<keyof T, string>;
    return cached;
  };
}

/** Stub mergeClasses — concatenates truthy class names. */
export function mergeClasses(...classes: Array<string | undefined | false | null>): string {
  return classes.filter(Boolean).join(' ');
}

// ── FluentProvider — pass-through wrapper ──────────────────────────────────

export function makeFluentProvider(getReact: () => any) {
  return (props: any) => {
    const R = getReact();
    if (!R) return null;
    // Render children inside a div so `theme` prop doesn't leak to the DOM.
    return R.createElement(
      'div',
      { 'data-fluent': 'FluentProvider', style: { fontFamily: tokens.fontFamilyBase, color: tokens.colorNeutralForeground1 } },
      props.children,
    );
  };
}

// ── useFluent / useThemeClassName — no-op hooks ─────────────────────────────

export function useFluent(): any {
  return { targetDocument: typeof document !== 'undefined' ? document : undefined, dir: 'ltr' };
}
export function useThemeClassName(): string { return ''; }

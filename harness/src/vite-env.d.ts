/// <reference types="vite/client" />

declare module 'virtual:pcf-manifest' {
  import type { ManifestConfig } from './types/manifest';
  export const manifest: ManifestConfig | null;
  export const bundlePath: string;
  export const cssFiles: string[];
  export const hasDataJson: boolean;
  export const resxStrings: Record<string, string>;
  export const isGalleryMode: boolean;
  export const controlDir: string;
}

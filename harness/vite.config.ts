import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { pcfPlugin } from './src/vite-plugin/pcf-plugin';

export default defineConfig({
  plugins: [
    react(),
    pcfPlugin(),
  ],
  server: {
    port: 8181,
    open: true,
  },
});

import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
  base: process.env.PAGES_BASE_PATH ?? '/',
  build: {
    rollupOptions: { input: { farWake: 'index.html', hollowmere: 'hollowmere/index.html' } },
  },
  plugins: [
    VitePWA({
      registerType: 'prompt',
      manifest: false,
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2,webmanifest}'] },
    }),
  ],
  test: { include: ['tests/**/*.test.ts'] },
});

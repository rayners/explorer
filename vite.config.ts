import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
  base: process.env.PAGES_BASE_PATH ?? './',
  plugins: [
    VitePWA({
      registerType: 'prompt',
      manifest: {
        name: 'Far Wake — Frontier Survey',
        short_name: 'Far Wake',
        description: 'An idle exploration game on the corporate frontier.',
        theme_color: '#101b1e',
        background_color: '#101b1e',
        display: 'standalone',
        start_url: './',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'] },
    }),
  ],
  test: { include: ['tests/**/*.test.ts'] },
});

import { readFileSync } from 'node:fs';
import { farWakeManifest } from './src/picker/manifest';
import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';
const base = process.env.PAGES_BASE_PATH ?? '/';
const manifest = JSON.stringify(
  farWakeManifest(
    JSON.parse(readFileSync(new URL('./src/game/manifest.json', import.meta.url), 'utf8')),
    base,
  ),
);
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(
      JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version,
    ),
  },
  base,
  build: {
    rollupOptions: {
      input: {
        picker: 'index.html',
        farWake: 'far-wake/index.html',
        hollowmere: 'hollowmere/index.html',
      },
    },
  },
  plugins: [
    {
      name: 'far-wake-manifest',
      configureServer(server) {
        server.middlewares.use((request, response, next) => {
          if (request.url?.split('?')[0] !== `${base}manifest.webmanifest`) return next();
          response.setHeader('Content-Type', 'application/manifest+json');
          response.end(manifest);
        });
      },
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'manifest.webmanifest', source: manifest });
      },
    },
    VitePWA({
      registerType: 'prompt',
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,webmanifest}'],
        ignoreURLParametersMatching: [/.*/],
      },
    }),
  ],
  test: { include: ['tests/**/*.test.ts'] },
});

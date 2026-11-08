import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  platform: 'node',
  clean: true,
  dts: true,
  attw: {
    level: 'error',
    profile: 'esm-only',
  },
  publint: true,
  deps: {
    neverBundle: [
      '@vitejs/devtools',
      '@vitejs/devtools-kit',
      '@nuxt/kit',
      '@nuxt/schema',
      'devframe',
      'vite',
      'rolldown',
      '@rolldown/pluginutils',
      '@unplugin-pwa/core',
      '@unplugin-pwa/vite',
      '@vite-pwa/assets-generator',
      '@vite-pwa/workbox-build',
      '@vite-pwa/workbox-window',
      'sirv',
    ],
  },
})

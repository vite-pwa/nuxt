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
      '@nuxt/kit',
      '@rolldown/pluginutils',
      '@unplugin-pwa/core',
      '@unplugin-pwa/vite',
      '@vite-pwa/nuxt-core',
      '@vite-pwa/workbox-build',
      '@nuxt/schema',
      'verkit',
      'vite',
    ],
  },
})

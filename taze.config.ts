import { defineConfig } from 'taze'

export default defineConfig({
  recursive: true,
  write: true,
  includeLocked: true,
  maturityPeriod: 7,
  peer: false,
  mode: 'minor',
  exclude: [
    'taze',
    'node',
    'why-is-node-running',
    'nuxt@3',
    'vite@7',
    '@nuxt/devtools/nuxt@3',
    '@nuxt/kit/nuxt@3',
  ],
  githubActions: {
    style: 'sha',
  },
  depFields: {
    packageManager: false,
  },
})

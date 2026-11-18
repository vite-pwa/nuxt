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
    // unpin rolldown once Vite 8.4 released
    // we need both, Vite and Rolldown:
    // using Vite 8.3 with Rolldown 1.3 can cause Vite apps to generated wrong builds
    'rolldown',
  ],
  githubActions: {
    style: 'sha',
  },
  depFields: {
    packageManager: false,
  },
})

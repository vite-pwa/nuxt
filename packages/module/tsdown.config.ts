import { builder } from '@nuxt/module-builder/tsdown'
import { defineConfig } from 'tsdown/config'

export default defineConfig({
  plugins: [
    builder(),
  ],
  attw: {
    level: 'error',
    profile: 'esm-only',
  },
  publint: true,
})
